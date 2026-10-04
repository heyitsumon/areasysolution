import { button, checkbox, range } from '../lib/controls';
import { buildResultCard, createBatchFeedback } from '../lib/batch';
import { formatBytes } from '../lib/files';
import { transformImage } from '../lib/image';
import { createQueue, processQueue } from '../lib/queue';
import { createUploader } from '../lib/uploader';
import { node, number, panel, select, text } from '../lib/ui';

/**
 * Image resizer.
 *
 * Presets are the difference between a tool people use once and one they
 * bookmark: nobody remembers that link previews want 1200x630, but everybody
 * recognises the platform names.
 */

const PRESETS = [
    { value: 'custom', label: 'Custom size', width: 0, height: 0 },
    { value: 'instagram-square', label: 'Instagram post - 1080 x 1080', width: 1080, height: 1080 },
    { value: 'instagram-story', label: 'Instagram story - 1080 x 1920', width: 1080, height: 1920 },
    { value: 'twitter', label: 'X / Twitter post - 1600 x 900', width: 1600, height: 900 },
    { value: 'open-graph', label: 'Link preview (Open Graph) - 1200 x 630', width: 1200, height: 630 },
    { value: 'youtube', label: 'YouTube thumbnail - 1280 x 720', width: 1280, height: 720 },
    { value: 'facebook-cover', label: 'Facebook cover - 820 x 312', width: 820, height: 312 },
    { value: 'favicon', label: 'App / favicon icon - 512 x 512', width: 512, height: 512 },
    { value: 'email-header', label: 'Email header - 600 x 200', width: 600, height: 200 },
];

const FORMATS = {
    jpeg: { type: 'image/jpeg', extension: 'jpg' },
    png: { type: 'image/png', extension: 'png' },
    webp: { type: 'image/webp', extension: 'webp' },
};

export default function mount({ root, meta, announce, complete }) {
    const queue = createQueue({ meta, describe: (file) => formatBytes(file.size) });

    const uploader = createUploader({
        meta,
        title: 'Drop images here',
        onFiles: (files) => {
            queue.add(files);
            announce(`${files.length} image(s) added.`);
        },
    });

    const preset = select({ label: 'Preset', value: 'custom', options: PRESETS });
    const width = number({ label: 'Width', value: 1200, min: 1, max: 10000, suffix: 'px' });
    const height = number({ label: 'Height', value: 630, min: 1, max: 10000, suffix: 'px' });
    const lockRatio = checkbox({ label: 'Lock aspect ratio', checked: true });

    const fit = select({
        label: 'How to fit the image',
        value: 'cover',
        options: [
            { value: 'cover', label: 'Crop to fill (no distortion)' },
            { value: 'contain', label: 'Fit inside, keep everything' },
            { value: 'stretch', label: 'Stretch to exact dimensions' },
        ],
    });

    const background = text({ label: 'Background for letterbox areas', value: '#ffffff', type: 'color' });

    background.input.className = 'h-11 w-20 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950';

    const format = select({
        label: 'Output format',
        value: 'jpeg',
        options: [
            { value: 'jpeg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
            { value: 'webp', label: 'WebP' },
        ],
    });

    const quality = range({ label: 'Quality', min: 40, max: 100, step: 1, value: 88, format: (value) => `${value}%` });

    const settings = node('<div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"></div>');

    settings.append(preset.el, width.el, height.el, lockRatio.el, fit.el, background.el, format.el, quality.el);

    const feedback = createBatchFeedback();
    const run = button({ label: 'Resize images', variant: 'primary' });
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

    preset.select.addEventListener('change', () => {
        const chosen = PRESETS.find((item) => item.value === preset.select.value);

        if (chosen && chosen.width > 0) {
            width.input.value = String(chosen.width);
            height.input.value = String(chosen.height);
            ratio = chosen.width / chosen.height;
        }
    });

    let ratio = 1200 / 630;

    width.input.addEventListener('input', () => {
        const value = Number(width.input.value);

        if (lockRatio.input.checked && value > 0) {
            height.input.value = String(Math.max(1, Math.round(value / ratio)));
        }
    });

    height.input.addEventListener('input', () => {
        const value = Number(height.input.value);

        if (lockRatio.input.checked && value > 0) {
            width.input.value = String(Math.max(1, Math.round(value * ratio)));
        }
    });

    lockRatio.input.addEventListener('change', () => {
        const horizontal = Number(width.input.value);
        const vertical = Number(height.input.value);

        if (horizontal > 0 && vertical > 0) {
            ratio = horizontal / vertical;
        }
    });

    root.append(card);

    run.addEventListener('click', async () => {
        const chosen = FORMATS[format.select.value] ?? FORMATS.jpeg;
        const targetWidth = Number(width.input.value) || 1;
        const targetHeight = Number(height.input.value) || 1;
        const targetQuality = Number(quality.input.value) / 100;

        run.disabled = true;
        feedback.status.set('Resizing.');

        try {
            const results = await processQueue(
                queue.items(),
                async (file) => {
                    const blob = await transformImage(file, {
                        width: targetWidth,
                        height: targetHeight,
                        fit: /** @type {'cover'|'contain'|'stretch'} */ (fit.select.value),
                        type: chosen.type,
                        quality: targetQuality,
                        background: chosen.type === 'image/jpeg' ? background.input.value : undefined,
                    });

                    const stem = file.name.replace(/\.[^.]+$/, '');

                    return { blob, name: `${stem}-${targetWidth}x${targetHeight}.${chosen.extension}` };
                },
                { onProgress: (percent, label) => feedback.progress.set(percent, label) },
            );

            feedback.status.set(`Resized ${results.length} image(s) to ${targetWidth} x ${targetHeight}.`, 'success');
            announce(`Resized ${results.length} images.`);
            complete();

            const result = buildResultCard({
                title: 'Resized images',
                results,
                zipName: 'resized-images.zip',
            });

            root.append(result.el);
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
