import { button, textarea } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { createQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel } from '../lib/ui';

function parsePageRanges(source, totalPages) {
    if (source.trim() === '') {
        return Array.from({ length: totalPages }, (_, index) => [index]);
    }

    return source.split(/\r?\n/).map((line, groupIndex) => {
        const range = line.trim();

        if (range === '') {
            throw new Error(`Page range group ${groupIndex + 1} is empty.`);
        }

        const pages = new Set();

        for (const part of range.split(',')) {
            const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());

            if (! match) {
                throw new Error(`"${part.trim()}" is not a valid page number or range.`);
            }

            const start = Number(match[1]);
            const end = match[2] ? Number(match[2]) : start;

            if (start < 1 || end < start || end > totalPages) {
                throw new Error(`Page range "${part.trim()}" must be between 1 and ${totalPages}.`);
            }

            for (let page = start; page <= end; page += 1) pages.add(page - 1);
        }

        return [...pages].sort((left, right) => left - right);
    });
}

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({ meta, describe: (file) => formatBytes(file.size) });
    const ranges = textarea({
        label: 'Page ranges (one output PDF per line)',
        rows: 3,
        placeholder: '1-3\n4-6, 8',
        hint: 'Leave blank to create one PDF for each page. Commas combine pages in a PDF; each new line creates another output.',
    });
    const uploader = createUploader({
        meta,
        title: 'Drop a PDF here',
        onFiles: (files) => {
            queue.add(files);
            announce('PDF added to the split queue.');
        },
    });

    const run = button({ label: 'Split PDF', variant: 'primary', disabled: true });
    const clear = button({ label: 'Clear file' });
    const feedback = createBatchFeedback();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(run, clear);

    const card = panel({ title: 'PDF file', body: node('<div></div>') });
    card.querySelector('[data-panel-body]').append(uploader.el, ranges.el, queue.el, actions, feedback.wrapper);
    root.append(card);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.addEventListener('click', async () => {
        const file = queue.items()[0]?.file;
        if (! file) return;

        run.disabled = true;
        feedback.status.set('Reading PDF pages…');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const source = await PDFDocument.load(await file.arrayBuffer());
            const groups = parsePageRanges(ranges.textarea.value, source.getPageCount());
            const results = [];

            for (let index = 0; index < groups.length; index += 1) {
                feedback.progress.set((index / groups.length) * 100, `Preparing part ${index + 1} of ${groups.length}`);

                const output = await PDFDocument.create();
                const pages = await output.copyPages(source, groups[index]);
                pages.forEach((page) => output.addPage(page));

                results.push({
                    name: `${file.name.replace(/\.[^.]+$/, '')}-part-${String(index + 1).padStart(3, '0')}.pdf`,
                    blob: new Blob([await output.save({ useObjectStreams: true })], { type: 'application/pdf' }),
                    source: file,
                });
            }

            feedback.status.set(`Created ${results.length} PDF part(s) from ${source.getPageCount()} page(s).`, 'success');
            feedback.progress.set(100);
            announce(`Split PDF into ${results.length} file(s).`);
            complete();
            root.append(buildResultCard({
                title: 'Split PDFs',
                description: 'Download each part, or download all parts as one ZIP file.',
                results,
                zipName: 'split-pdfs.zip',
                showSavings: false,
            }).el);
        } catch (error) {
            feedback.status.set(error instanceof Error ? error.message : 'The PDF could not be split. Check that it is a valid, unencrypted PDF.', 'error');
            reportError(error);
        } finally {
            run.disabled = queue.isEmpty();
        }
    });

    clear.addEventListener('click', () => {
        queue.clear();
        feedback.progress.set(100);
        feedback.status.set('');
    });
}
