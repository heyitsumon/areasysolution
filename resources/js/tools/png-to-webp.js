import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { transformImage } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, number, panel } from '../lib/ui';

export default function mount({ root, meta, announce, complete }) {
    const qualityInput = number({
        label: 'WebP Quality (1–100%)',
        value: 85,
        min: 1,
        max: 100,
        suffix: '%',
    });

    const queue = createQueue({
        meta,
        describe: (file) => `${formatBytes(file.size)} - converts to next-gen WebP with high compression`,
    });

    const uploader = createUploader({
        meta,
        title: 'Drop PNG images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} PNG image(s) added.`);
        },
    });

    const feedback = createBatchFeedback();
    const run = button({ label: 'Convert to WebP', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Select PNG images', body: node('<div></div>') });
    const cardBody = card.querySelector('[data-panel-body]');

    cardBody.append(qualityInput.el, node('<div class="mt-4"></div>'), uploader.el, node('<div class="mt-4"></div>'), queue.el, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;
    root.append(card);

    run.addEventListener('click', async () => {
        run.disabled = true;
        const quality = Math.max(0.01, Math.min(1, Number(qualityInput.input.value) / 100));
        feedback.status.set('Converting PNG images to WebP...');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const blob = await transformImage(file, { type: 'image/webp', quality });
                    return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.webp` };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Converted ${results.length} PNG image(s) to WebP.`, 'success');
            announce(`Converted ${results.length} images to WebP.`);
            void complete();

            const resultCard = buildResultCard({
                title: 'Converted WebP files',
                description: 'WebP offers significant size reduction with sharp visual fidelity.',
                results,
                zipName: 'converted-webp-images.zip',
                showSavings: true,
            });

            root.append(resultCard.el);
        } catch (error) {
            feedback.status.set('One or more images could not be converted to WebP.', 'error');
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

