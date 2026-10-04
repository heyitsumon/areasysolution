import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel, text } from '../lib/ui';

/**
 * Merge PDF.
 *
 * pdf-lib copies pages between documents without re-encoding them, so merging
 * never degrades quality and never re-uploads anything. The useful extras are
 * reordering and per-file page ranges - the two things people actually need
 * after "combine these".
 */

/**
 * Parse "1-3, 7, 12-" into zero-based indexes, clamped to the document.
 *
 * @param {string} range
 * @param {number} totalPages
 * @returns {number[]}
 */
export function parsePageRange(range, totalPages) {
    const trimmed = range.trim();

    if (trimmed === '') {
        return Array.from({ length: totalPages }, (_, index) => index);
    }

    /** @type {Set<number>} */
    const pages = new Set();

    trimmed.split(',').forEach((chunk) => {
        const part = chunk.trim();

        if (part === '') {
            return;
        }

        const match = /^(\d+)?\s*(?:-\s*(\d+)?)?$/.exec(part);

        if (! match) {
            return;
        }

        const start = match[1] ? Number(match[1]) : 1;
        const end = match[2] ? Number(match[2]) : (match[1] ? start : totalPages);

        for (let page = Math.max(1, start); page <= Math.min(totalPages, end); page += 1) {
            pages.add(page - 1);
        }
    });

    return Array.from(pages).sort((a, b) => a - b);
}

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({
        meta,
        describe: (file) => formatBytes(file.size),
    });

    const range = text({
        label: 'Pages from each file (optional)',
        value: '',
        placeholder: 'e.g. 1-3, 7, 12-   (leave empty for every page)',
        hint: 'Applies to the file you add next. Blank means all pages.',
    });

    const uploader = createUploader({
        meta,
        title: 'Drop PDFs here',
        hint: 'Add files, then use the arrows to set the running order.',
        onFiles: (files) => {
            files.forEach((file) => queue.add([file], { range: range.input.value }));
            announce(`${files.length} file(s) queued.`);
        },
    });

    const feedback = createBatchFeedback();
    const run = button({ label: 'Merge into one PDF', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Files', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, range.el, node('<div class="mt-4"></div>'), queue.el, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.items().length < 2;
    });

    run.disabled = true;

    root.append(card);

    run.addEventListener('click', async () => {
        const entries = queue.items();

        run.disabled = true;
        feedback.status.set('Merging. Pages are copied, never re-encoded, so quality is untouched.');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const merged = await PDFDocument.create();
            let copied = 0;
            let skipped = 0;

            for (let index = 0; index < entries.length; index += 1) {
                const entry = entries[index];

                feedback.progress.set((index / entries.length) * 100, `${entry.file.name} (${index + 1} of ${entries.length})`);

                const source = await PDFDocument.load(await entry.file.arrayBuffer(), { ignoreEncryption: true });
                const total = source.getPageCount();
                const wanted = parsePageRange(String(entry.meta.range ?? ''), total);

                if (wanted.length === 0) {
                    skipped += 1;

                    continue;
                }

                const pages = await merged.copyPages(source, wanted);

                pages.forEach((page) => merged.addPage(page));

                copied += pages.length;
            }

            if (copied === 0) {
                feedback.status.set('No pages were selected, so there is nothing to merge. Check the page ranges.', 'warning');

                return;
            }

            const bytes = await merged.save({ useObjectStreams: true });
            const blob = new Blob([bytes], { type: 'application/pdf' });

            feedback.status.set(
                `Merged ${entries.length - skipped} file(s) into ${copied} pages (${formatBytes(blob.size)}).${skipped > 0 ? ` ${skipped} file(s) contributed no pages.` : ''}`,
                'success',
            );

            announce(`Merged into a ${copied} page PDF.`);
            complete();

            const card = buildResultCard({
                title: 'Merged PDF',
                results: [{ name: 'merged.pdf', blob }],
                zipName: 'merged.zip',
            });

            root.append(card.el);
        } catch (error) {
            feedback.status.set('Merging failed. One of the files may be encrypted - open it once with its password and re-save it without protection.', 'error');
            reportError(error);
        } finally {
            run.disabled = queue.items().length < 2;
            feedback.progress.set(100);
        }
    });

    clear.addEventListener('click', () => {
        queue.clear();
        feedback.progress.set(100);
        feedback.status.set('');
    });
}
