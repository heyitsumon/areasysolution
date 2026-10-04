import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { createQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel } from '../lib/ui';

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({ meta, describe: (file) => formatBytes(file.size) });
    const uploader = createUploader({
        meta,
        title: 'Drop JPG or PNG images here',
        hint: 'Each image becomes one PDF page. Use the arrows to change page order.',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} image(s) added.`);
        },
    });
    const run = button({ label: 'Create PDF', variant: 'primary', disabled: true });
    const clear = button({ label: 'Clear queue' });
    const feedback = createBatchFeedback();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(run, clear);
    const card = panel({ title: 'Images', body: node('<div></div>') });
    card.querySelector('[data-panel-body]').append(uploader.el, queue.el, actions, feedback.wrapper);
    root.append(card);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.addEventListener('click', async () => {
        const entries = queue.items();
        if (entries.length === 0) return;

        run.disabled = true;
        feedback.status.set('Adding images to the PDF…');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const pdf = await PDFDocument.create();

            for (let index = 0; index < entries.length; index += 1) {
                const { file } = entries[index];
                feedback.progress.set((index / entries.length) * 100, `${file.name} (${index + 1} of ${entries.length})`);

                const bytes = await file.arrayBuffer();
                const mime = file.type.toLowerCase();
                const extension = file.name.split('.').pop()?.toLowerCase();
                let image;

                if (mime === 'image/jpeg' || extension === 'jpg' || extension === 'jpeg') {
                    image = await pdf.embedJpg(bytes);
                } else if (mime === 'image/png' || extension === 'png') {
                    image = await pdf.embedPng(bytes);
                } else {
                    throw new Error(`${file.name} is not a supported JPG or PNG image.`);
                }

                const page = pdf.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }

            const blob = new Blob([await pdf.save({ useObjectStreams: true })], { type: 'application/pdf' });
            const result = { name: 'images.pdf', blob };
            feedback.progress.set(100);
            feedback.status.set(`Created a ${formatBytes(blob.size)} PDF with ${entries.length} page(s).`, 'success');
            announce(`Converted ${entries.length} images to PDF.`);
            complete();
            root.append(buildResultCard({
                title: 'Images PDF',
                results: [result],
                zipName: 'images-pdf.zip',
                showSavings: false,
            }).el);
        } catch (error) {
            feedback.status.set(error instanceof Error ? error.message : 'The images could not be added to a PDF.', 'error');
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
