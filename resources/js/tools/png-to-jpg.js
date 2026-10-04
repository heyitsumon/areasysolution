import { button, checkbox, range } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { transformImage } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, panel, text } from '../lib/ui';

/**
 * PNG to JPG.
 *
 * The one setting that matters is the matte colour: JPEG has no alpha channel,
 * so every transparent pixel has to be painted with something. Get this wrong
 * and a logo lands on a black square, which is the single most common complaint
 * about tools that do not expose the option.
 */

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({
        meta,
        describe: (file) => formatBytes(file.size),
    });

    const uploader = createUploader({
        meta,
        title: 'Drop PNG images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} image(s) added.`);
        },
    });

    const quality = range({
        label: 'JPEG quality',
        min: 50,
        max: 100,
        step: 1,
        value: 85,
        format: (value) => `${value}%`,
        hint: '85% is visually identical to the original for photographs and a fraction of the size.',
    });

    const matte = text({
        label: 'Colour behind transparent pixels',
        value: '#ffffff',
        type: 'color',
        hint: 'JPEG cannot store transparency. Transparent areas are filled with this colour.',
    });

    matte.input.className = 'h-11 w-20 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950';

    const keepMetadata = checkbox({
        label: 'Blur metadata warning',
        hint: 'Colour profiles and EXIF data (including GPS) are stripped by the canvas pipeline.',
        checked: true,
    });

    keepMetadata.input.disabled = true;

    const settings = node('<div class="mt-4 grid gap-4 sm:grid-cols-2"></div>');

    settings.append(quality.el, matte.el);

    const feedback = createBatchFeedback();
    const run = button({ label: 'Convert to JPG', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Images', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, node('<div class="mt-4"></div>'), queue.el, settings, keepMetadata.el, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;

    root.append(card);

    run.addEventListener('click', async () => {
        run.disabled = true;
        feedback.status.set('Converting to JPEG.');

        const background = matte.input.value || '#ffffff';
        const jpegQuality = Number(quality.input.value) / 100;

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const blob = await transformImage(file, {
                        type: 'image/jpeg',
                        quality: jpegQuality,
                        background,
                    });

                    return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.jpg` };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Converted ${results.length} image(s).`, 'success');
            announce(`Converted ${results.length} images to JPG.`);
            complete();

            const card = buildResultCard({
                title: 'Converted images',
                description: 'Transparent areas were filled with the colour you chose.',
                results,
                zipName: 'jpg-images.zip',
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
}
