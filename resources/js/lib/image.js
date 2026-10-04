import { canvasToBlob, decodeImage, imageSize } from './files';

/**
 * Shared raster pipeline for the four image tools.
 *
 * Doing this once rather than four times is not just tidiness: it is where the
 * subtle quality decisions live. The two that matter most are
 *
 *   1. step-down resampling - a single giant drawImage from 6000px to 800px
 *      produces visible aliasing, so large reductions are done in halving steps;
 *   2. matte painting before JPEG encoding - JPEG has no alpha channel, so
 *      transparent pixels must be composited onto a real colour first, or they
 *      come out black.
 */

/**
 * @typedef {object} TransformOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {'contain'|'cover'|'stretch'|'none'} [fit]
 * @property {string} [background] any CSS colour; '#ffffff' by default
 * @property {'image/jpeg'|'image/png'|'image/webp'} [type]
 * @property {number} [quality] 0-1, ignored by PNG
 * @property {boolean} [smoothing]
 */

/**
 * @param {number} value
 * @returns {number}
 */
const clampDimension = (value) => Math.max(1, Math.min(20000, Math.round(value)));

/**
 * Draw the source into a canvas of the requested size.
 *
 * @param {ImageBitmap|HTMLImageElement} source
 * @param {TransformOptions} options
 * @returns {HTMLCanvasElement}
 */
export function drawToCanvas(source, options = {}) {
    const { width: sourceWidth, height: sourceHeight } = imageSize(source);
    const fit = options.fit ?? 'contain';
    const targetWidth = options.width ? clampDimension(options.width) : sourceWidth;
    const targetHeight = options.height ? clampDimension(options.height) : sourceHeight;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

    context.imageSmoothingEnabled = options.smoothing !== false;
    context.imageSmoothingQuality = 'high';

    // Paint the canvas first so transparent PNG regions become the chosen
    // colour rather than black once encoded as JPEG.
    if (options.background) {
        context.fillStyle = options.background;
        context.fillRect(0, 0, targetWidth, targetHeight);
    }

    if (fit === 'stretch') {
        stagedDraw(context, source, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        return canvas;
    }

    if (fit === 'none') {
        stagedDraw(context, source, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

        return canvas;
    }

    const scale = fit === 'cover'
        ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
        : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;

    stagedDraw(
        context,
        source,
        sourceWidth,
        sourceHeight,
        (targetWidth - drawWidth) / 2,
        (targetHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
    );

    return canvas;
}

/**
 * Downscale in halving steps when the reduction is large.
 *
 * A single 6000px to 600px drawImage samples far too sparsely and produces the
 * stair-stepped edges that make browser-resized images look amateurish. Halving
 * repeatedly, then finishing with the exact size, keeps the detail.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {ImageBitmap|HTMLImageElement} source
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function stagedDraw(context, source, sourceWidth, sourceHeight, x, y, width, height) {
    const needsStaging = sourceWidth / Math.max(1, width) > 2;

    if (! needsStaging) {
        context.drawImage(source, x, y, width, height);

        return;
    }

    let current = /** @type {HTMLCanvasElement|ImageBitmap} */ (source);
    let currentWidth = sourceWidth;
    let currentHeight = sourceHeight;

    while (currentWidth / 2 > width) {
        const half = document.createElement('canvas');

        half.width = Math.max(1, Math.round(currentWidth / 2));
        half.height = Math.max(1, Math.round(currentHeight / 2));

        const halfContext = /** @type {CanvasRenderingContext2D} */ (half.getContext('2d'));

        halfContext.imageSmoothingEnabled = true;
        halfContext.imageSmoothingQuality = 'high';
        halfContext.drawImage(current, 0, 0, half.width, half.height);

        current = half;
        currentWidth = half.width;
        currentHeight = half.height;
    }

    context.drawImage(current, x, y, width, height);
}

/**
 * Decode, transform and re-encode a file.
 *
 * @param {File} file
 * @param {TransformOptions} options
 * @returns {Promise<Blob>}
 */
export async function transformImage(file, options = {}) {
    const source = await decodeImage(file);

    try {
        const canvas = drawToCanvas(source, options);

        return await canvasToBlob(canvas, options.type ?? 'image/jpeg', options.quality ?? 0.85);
    } finally {
        // ImageBitmap holds decoded pixels until closed; on a batch of large
        // photos that is exactly how a tab runs out of memory.
        if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
            source.close();
        }
    }
}

/**
 * Guess a reasonable output type for a tool when the visitor has not chosen one.
 *
 * @param {File} file
 * @param {'image/png'|'image/jpeg'|'image/webp'} fallback
 * @returns {'image/png'|'image/jpeg'|'image/webp'}
 */
export function outputType(file, fallback) {
    return file.type === 'image/webp' ? 'image/webp' : fallback;
}
