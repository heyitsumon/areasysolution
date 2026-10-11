import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { transformImage } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel } from '../lib/ui';

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({
        meta,
        describe: (file) => `${formatBytes(file.size)} - converts to lossless PNG with alpha transparency`,
    });

    const uploader = createUploader({
        meta,
        title: 'Drop WebP images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} WebP image(s) added.`);
        },
    });

    const feedback = createBatchFeedback();
    const run = button({ label: 'Convert to PNG', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Select WebP images', body: node('<div></div>') });
    const cardBody = card.querySelector('[data-panel-body]');

    cardBody.append(uploader.el, node('<div class="mt-4"></div>'), queue.el, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;
    root.append(card);

    run.addEventListener('click', async () => {
        run.disabled = true;
        feedback.status.set('Converting WebP images to PNG...');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const blob = await transformImage(file, { type: 'image/png' });
                    return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.png` };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Successfully converted ${results.length} WebP image(s).`, 'success');
            announce(`Converted ${results.length} images to PNG.`);
            void complete();

            const resultCard = buildResultCard({
                title: 'Converted PNG files',
                description: 'Lossless PNG format with full transparency preserved.',
                results,
                zipName: 'converted-png-images.zip',
                showSavings: false,
            });

            root.append(resultCard.el);
        } catch (error) {
            feedback.status.set('Conversion failed. One or more files could not be processed.', 'error');
            console.error(error);
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

