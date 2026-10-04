import { button, range } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes, decodeImage, imageSize, canvasToBlob } from '../lib/files';
import { drawToCanvas } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, number, panel, select } from '../lib/ui';

/**
 * Image compressor.
 *
 * Two levers, and both are shown rather than hidden: quality (how densely the
 * pixels are stored) and maximum width (how many pixels there are at all).
 * Dropping the width is usually far more effective than dropping quality, and
 * visitors who do not know that end up with blurry images instead of small ones.
 */

const FORMATS = {
    jpeg: { type: 'image/jpeg', extension: 'jpg', label: 'JPEG - smallest, no transparency' },
    webp: { type: 'image/webp', extension: 'webp', label: 'WebP - smaller than JPEG, widely supported' },
    png: { type: 'image/png', extension: 'png', label: 'PNG - lossless, ignores quality' },
};

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({ meta, describe: (file) => formatBytes(file.size) });

    const uploader = createUploader({
        meta,
        title: 'Drop JPEG, PNG or WebP images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} image(s) added.`);
        },
    });

    const quality = range({
        label: 'Quality',
        min: 40,
        max: 100,
        step: 1,
        value: 78,
        format: (value) => `${value}%`,
        hint: '75-85% is the sweet spot for photographs. Below 60% you will start to see blocking.',
    });

    const maxWidth = number({
        label: 'Maximum width',
        value: 0,
        min: 0,
        max: 10000,
        step: 1,
        suffix: 'px (0 keeps the original)',
        hint: 'Resizing down is the single most effective way to shrink a photo.',
    });

    const format = select({
        label: 'Output format',
        value: 'jpeg',
        options: Object.entries(FORMATS).map(([value, item]) => ({ value, label: item.label })),
    });

    const settings = node('<div class="mt-4 grid gap-5 sm:grid-cols-3"></div>');

    settings.append(quality.el, maxWidth.el, format.el);

    const feedback = createBatchFeedback();
    const run = button({ label: 'Compress images', variant: 'primary' });
    const clear = button({ label: 'Clear queue' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    actions.append(run, clear);

    const card = panel({ title: 'Images', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(uploader.el, node('<div class="mt-4"></div>'), queue.el, settings, actions, feedback.wrapper);

    queue.onChange(() => {
        run.disabled = queue.isEmpty();
    });

    run.disabled = true;

    root.append(card);

    run.addEventListener('click', async () => {
        const chosen = FORMATS[format.select.value] ?? FORMATS.jpeg;
        const targetWidth = Number(maxWidth.input.value) || 0;
        const targetQuality = Number(quality.input.value) / 100;

        run.disabled = true;
        feedback.status.set('Compressing. Large photos take a moment each.');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const source = await decodeImage(file);

                    let dimensions = {};

                    try {
                        const size = imageSize(source);

                        if (targetWidth > 0 && size.width > targetWidth) {
                            dimensions = { width: targetWidth, height: Math.round((size.height / size.width) * targetWidth) };
                        }

                        const canvas = drawToCanvas(source, {
                            ...dimensions,
                            fit: 'stretch',
                            type: chosen.type,
                            quality: targetQuality,
                            // WebP and JPEG support alpha only in WebP, so JPEG
                            // gets a white matte and WebP keeps transparency.
                            background: chosen.type === 'image/jpeg' ? '#ffffff' : undefined,
                        });

                        const blob = await canvasToBlob(canvas, chosen.type, targetQuality);

                        return { blob, name: `${file.name.replace(/\.[^.]+$/, '')}.${chosen.extension}` };
                    } finally {
                        if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
                            source.close();
                        }
                    }
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Compressed ${results.length} image(s).`, 'success');
            announce(`Compressed ${results.length} images.`);
            complete();

            const card = buildResultCard({
                title: 'Compressed images',
                results,
                zipName: 'compressed-images.zip',
            });

            root.append(card.el);
        } catch (error) {
            feedback.status.set('One of the images could not be processed. It may be damaged or in a format this browser cannot decode.', 'error');
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
