import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { canvasToBlob, formatBytes } from '../lib/files';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { panel, select } from '../lib/ui';

/**
 * Compress PDF.
 *
 * Two genuinely different techniques, and the honest answer is that they are not
 * interchangeable:
 *
 *   * Light restructures the file with pdf-lib (object streams, deduplicated
 *     resources). Text stays selectable. Savings are modest.
 *   * Balanced and Maximum rasterise each page to a JPEG at 150 or 96 DPI. Text
 *     stops being selectable, and scans can shrink by 80-95%.
 *
 * Which one a visitor needs depends on whether the PDF is text or pictures, so
 * the trade-off is stated in the UI rather than hidden behind one "compression
 * level" slider.
 */

const PRESETS = {
    light: { label: 'Light - keeps text selectable', dpi: 0, quality: 1 },
    balanced: { label: 'Balanced - 150 DPI, good for screen and print', dpi: 150, quality: 0.72 },
    maximum: { label: 'Maximum - 96 DPI, smallest file', dpi: 96, quality: 0.55 },
};

/**
 * @param {any} pdfjs
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {Promise<any>}
 */
async function openWithPdfJs(pdfjs, data) {
    return pdfjs.getDocument({ data }).promise;
}

/**
 * Structural pass: no rendering, no quality loss, text stays selectable.
 *
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
async function restructure(data) {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.load(data, { ignoreEncryption: true });

    return document.save({ useObjectStreams: true, addDefaultPage: false });
}

/**
 * Rasterising pass: render every page to a JPEG at the target DPI and rebuild a
 * PDF around the images.
 *
 * @param {any} pdfjs
 * @param {number} dpi
 * @param {number} quality
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
async function rasterise(pdfjs, dpi, quality, data) {
    const { PDFDocument } = await import('pdf-lib');

    const source = await openWithPdfJs(pdfjs, data);
    const output = await PDFDocument.create();

    // PDF user units are 72 per inch, so this converts a DPI target into a
    // render scale.
    const scale = dpi / 72;

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
        const page = await source.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = window.document.createElement('canvas');

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        const context = canvas.getContext('2d', { alpha: false });

        if (! context) {
            throw new Error('This browser refused to provide a 2D canvas context.');
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport }).promise;

        const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);
        const embedded = await output.embedJpg(await jpeg.arrayBuffer());
        const sheet = output.addPage([embedded.width, embedded.height]);

        sheet.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });

        page.cleanup();
    }

    return output.save({ useObjectStreams: true });
}

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({
        meta,
        describe: (file) => formatBytes(file.size),
    });

    const preset = select({
        label: 'Compression level',
        value: 'balanced',
        options: Object.entries(PRESETS).map(([value, item]) => ({ value, label: item.label })),
    });

    const tradeoff = node('<p class="mt-3 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"></p>');

    const uploader = createUploader({
        meta,
        title: 'Drop PDFs here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} file(s) queued.`);
        },
    });

    const feedback = createBatchFeedback();
    const run = button({ label: 'Compress', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'PDFs', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, node('<div class="mt-4"></div>'), queue.el, node('<div class="mt-4"></div>'), preset.el, tradeoff, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;

    const describeTradeoff = () => {
        const chosen = PRESETS[preset.select.value] ?? PRESETS.balanced;

        tradeoff.textContent = chosen.dpi === 0
            ? 'Light keeps every character as real text: selectable, searchable and unchanged. Expect a modest reduction unless the file has redundant objects.'
            : `Pages are re-rendered as images at ${chosen.dpi} DPI. Expect a large reduction on scans and image-heavy documents, but the text will no longer be selectable.`;
    };

    preset.select.addEventListener('change', describeTradeoff);

    describeTradeoff();

    root.append(card);

    run.addEventListener('click', async () => {
        const chosen = PRESETS[preset.select.value] ?? PRESETS.balanced;

        run.disabled = true;
        feedback.status.set('Compressing. Each file is processed on your device.');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const data = new Uint8Array(await file.arrayBuffer());

                    const bytes = chosen.dpi === 0
                        ? await restructure(data)
                        : await rasterise(await loadPdfJs(), chosen.dpi, chosen.quality, data);

                    const stem = file.name.replace(/\.[^.]+$/, '');

                    return {
                        blob: new Blob([bytes], { type: 'application/pdf' }),
                        name: `${stem}-compressed.pdf`,
                    };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Compressed ${results.length} file(s).`, 'success');
            announce(`Compressed ${results.length} files.`);
            complete();

            const result = buildResultCard({
                title: 'Compressed PDFs',
                results,
                zipName: 'compressed-pdfs.zip',
            });

            root.append(result.el);
        } catch (error) {
            feedback.status.set('Compression failed. If the PDF is password protected, open it once with the password and save an unprotected copy first.', 'error');
            reportError(error);
        } finally {
            run.disabled = queue.isEmpty();
            feedback.progress.set(100);
        }
    });

    clear.addEventListener('click', () => {
        queue.clear();
        feedback.progress.set(100);
        feedback.status.set('');
    });
}
