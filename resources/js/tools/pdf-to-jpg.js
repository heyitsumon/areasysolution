import { button, range } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { canvasToBlob } from '../lib/files';
import { createUploader } from '../lib/uploader';
import { node, panel } from '../lib/ui';

/**
 * PDF to JPG.
 *
 * pdf.js renders each page to a canvas; the two choices that matter are how big
 * that canvas is (scale) and how hard the JPEG encoder squeezes it (quality).
 * Both are exposed, because "why is my export blurry" and "why is the file
 * 30 MB" are the same setting pulled in opposite directions.
 */

/**
 * The worker is bundled and loaded from our own origin, so no cross-origin
 * script is needed and the Content-Security-Policy can stay strict.
 *
 * @returns {Promise<any>}
 */
async function loadPdfJs() {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');

    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    return pdfjs;
}

export default function mount({ root, meta, announce, complete }) {
    const feedback = createBatchFeedback();

    const scale = range({
        label: 'Render scale',
        min: 1,
        max: 4,
        step: 0.5,
        value: 2,
        format: (value) => `${value}x`,
        hint: '2x is roughly 144 DPI for an A4 page: sharp on screen, readable in print.',
    });

    const quality = range({
        label: 'JPEG quality',
        min: 50,
        max: 100,
        step: 1,
        value: 88,
        format: (value) => `${value}%`,
    });

    const settings = node('<div class="mt-4 grid gap-5 sm:grid-cols-2"></div>');

    settings.append(scale.el, quality.el);

    const summary = node('<p class="mt-3 text-sm text-slate-600 dark:text-slate-400"></p>');

    const run = button({ label: 'Convert all pages', variant: 'primary' });
    const reset = button({ label: 'Choose another PDF' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, reset);

    // Named pdfDocument rather than `document` deliberately: shadowing the DOM
    // global would make document.createElement fail inside this closure.
    /** @type {any} */
    let pdfDocument = null;

    run.disabled = true;

    const uploader = createUploader({
        meta: { ...meta, multiple: false },
        title: 'Drop a PDF here',
        onFiles: async ([file]) => {
            run.disabled = true;
            summary.textContent = '';
            feedback.status.set('Opening the PDF and reading its page tree.');

            try {
                const pdfjs = await loadPdfJs();
                const data = new Uint8Array(await file.arrayBuffer());

                pdfDocument = await pdfjs.getDocument({ data }).promise;

                const pages = pdfDocument.numPages;

                summary.textContent = `${file.name} - ${pages} page${pages === 1 ? '' : 's'}. Rendering happens on your device; nothing is uploaded.`;

                run.disabled = false;
                feedback.status.set('PDF loaded. Choose your settings and convert.', 'success');
                announce(`PDF loaded with ${pages} pages.`);
            } catch (error) {
                feedback.status.set('That file could not be opened. It may be encrypted, damaged, or not a PDF at all.', 'error');
                reportError(error);
            }
        },
    });

    const card = panel({ title: 'PDF', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, summary, settings, actions, feedback.wrapper);

    root.append(card);

    run.addEventListener('click', async () => {
        if (! pdfDocument) {
            feedback.status.set('Choose a PDF first.', 'warning');

            return;
        }

        const scaleFactor = Number(scale.input.value);
        const jpegQuality = Number(quality.input.value) / 100;

        run.disabled = true;
        feedback.status.set('Rendering pages to images.');

        /** @type {Array<{name: string, blob: Blob}>} */
        const results = [];

        try {
            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
                feedback.progress.set(((pageNumber - 1) / pdfDocument.numPages) * 100, `Page ${pageNumber} of ${pdfDocument.numPages}`);

                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale: scaleFactor });
                const canvas = window.document.createElement('canvas');

                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);

                const context = canvas.getContext('2d', { alpha: false });

                if (! context) {
                    throw new Error('This browser refused to provide a 2D canvas context.');
                }

                // Paint white first: the canvas starts transparent, and a
                // transparent pixel becomes black once encoded as JPEG.
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);

                await page.render({ canvasContext: context, viewport }).promise;

                const blob = await canvasToBlob(canvas, 'image/jpeg', jpegQuality);

                results.push({ name: `page-${String(pageNumber).padStart(3, '0')}.jpg`, blob });

                // Release the decoded page before starting the next one,
                // otherwise a long document holds every page in memory.
                page.cleanup();

                // Yield so the progress bar repaints between pages.
                await new Promise((resolve) => window.requestAnimationFrame(resolve));
            }

            feedback.status.set(`Rendered ${results.length} page(s) at ${scaleFactor}x.`, 'success');
            announce(`${results.length} pages converted to JPG.`);
            complete();

            const result = buildResultCard({
                title: 'Page images',
                description: 'Download one page, or grab every page as a ZIP archive.',
                results,
                zipName: 'pdf-pages.zip',
                showSavings: false,
            });

            root.append(result.el);
        } catch (error) {
            feedback.status.set('Rendering failed part way through. Very large pages at 4x can exhaust memory - try a lower scale.', 'error');
            reportError(error);
        } finally {
            run.disabled = false;
            feedback.progress.set(100);
        }
    });

    reset.addEventListener('click', () => {
        pdfDocument = null;
        run.disabled = true;
        summary.textContent = '';
        feedback.status.set('');
        feedback.progress.set(100);
        uploader.clear();
    });
}
