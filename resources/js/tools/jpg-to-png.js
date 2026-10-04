import { button } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { transformImage } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel } from '../lib/ui';

/**
 * JPG to PNG.
 *
 * PNG is lossless, so there is nothing to configure: the useful work is batch
 * handling, clear expectations about file size, and one ZIP instead of twelve
 * "Save as" dialogs.
 */

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({
        meta,
        describe: (file) => `${formatBytes(file.size)} - converts losslessly, so the PNG will be larger`,
    });

    const uploader = createUploader({
        meta,
        title: 'Drop JPG images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} image(s) added.`);
        },
    });

    const feedback = createBatchFeedback();
    const run = button({ label: 'Convert to PNG', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Images', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, node('<div class="mt-4"></div>'), queue.el, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;

    root.append(card);

    run.addEventListener('click', async () => {
        run.disabled = true;
        feedback.status.set('Converting. Large photos can take a moment each.');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const blob = await transformImage(file, { type: 'image/png', background: undefined });

                    return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.png` };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Converted ${results.length} image(s).`, 'success');
            announce(`Converted ${results.length} images to PNG.`);
            complete();

            const card = buildResultCard({
                title: 'Converted images',
                description: 'PNG keeps every pixel exactly, which is why the files are larger than the JPEGs you started with.',
                results,
                zipName: 'png-images.zip',
                showSavings: false,
            });

            root.append(card.el);
        } catch (error) {
            feedback.status.set('One of the images could not be converted. It may be damaged or in an unsupported format.', 'error');
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

    root.append(
        panel({
            title: 'When PNG is the right choice',
            body: node(`
                <ul class="prose-tools list-disc space-y-1.5 pl-5">
                    <li>Screenshots, UI mockups and charts, where flat colour and crisp text matter.</li>
                    <li>Anything you plan to edit repeatedly - PNG never degrades on re-save.</li>
                    <li>Logos and icons that need a transparent background.</li>
                    <li>Not photographs: a 4 MB JPEG can become a 25 MB PNG with no visible gain.</li>
                </ul>
            `),
        }),
    );
}
