import JSZip from 'jszip';

/**
 * File plumbing shared by every tool.
 *
 * All of it is local: files are read with the File API, processed in memory and
 * saved with an object URL. Nothing here ever opens a network connection, which
 * is what makes "your files never leave your device" true rather than a
 * marketing line.
 */

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;
const GIGABYTE = MEGABYTE * 1024;

/**
 * Human readable byte size.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
    if (! Number.isFinite(bytes) || bytes <= 0) {
        return '0 B';
    }

    if (bytes < KILOBYTE) {
        return `${bytes} B`;
    }

    if (bytes < MEGABYTE) {
        return `${(bytes / KILOBYTE).toFixed(1)} KB`;
    }

    if (bytes < GIGABYTE) {
        return `${(bytes / MEGABYTE).toFixed(bytes < 10 * MEGABYTE ? 2 : 1)} MB`;
    }

    return `${(bytes / GIGABYTE).toFixed(2)} GB`;
}

/**
 * Percentage saved, used by the compression tools' before/after summary.
 *
 * @param {number} before
 * @param {number} after
 * @returns {string}
 */
export function savingsLabel(before, after) {
    if (! before || after >= before) {
        return 'No saving';
    }

    return `${Math.round(((before - after) / before) * 100)}% smaller`;
}

/**
 * @param {string} filename
 * @returns {string}
 */
export function baseName(filename) {
    return filename.replace(/\.[^./\\]+$/, '') || 'file';
}

/**
 * @param {string} filename
 * @returns {string}
 */
export function extensionOf(filename) {
    const match = /\.([^./\\]+)$/.exec(filename);

    return match ? match[1].toLowerCase() : '';
}

/**
 * @param {File|Blob} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readArrayBuffer(file) {
    return file.arrayBuffer();
}

/**
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function readText(file) {
    return file.text();
}

/**
 * @param {File|Blob} file
 * @returns {Promise<string>} data URL, usable as an <img> or canvas source
 */
export function readDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('The file could not be read.'));
        reader.readAsDataURL(file);
    });
}

/**
 * Decode an image into something drawable.
 *
 * createImageBitmap is preferred because it decodes off the main thread; the
 * <img> fallback covers older Safari, which is still common on mobile.
 *
 * @param {Blob} blob
 * @returns {Promise<ImageBitmap|HTMLImageElement>}
 */
export async function decodeImage(blob) {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(blob);
        } catch {
            // Fall through to the element-based decoder.
        }
    }

    const url = URL.createObjectURL(blob);

    try {
        const image = new Image();
        image.src = url;
        await image.decode();

        return image;
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * @param {ImageBitmap|HTMLImageElement} source
 * @returns {{width: number, height: number}}
 */
export function imageSize(source) {
    return {
        width: source.width ?? source.naturalWidth ?? 0,
        height: source.height ?? source.naturalHeight ?? 0,
    };
}

/**
 * Save a blob to the visitor's downloads folder.
 *
 * The object URL is revoked on a delay rather than immediately: revoking it
 * before the browser has started reading cancels the download in some browsers.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
export function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';

    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Save several files as a single ZIP.
 *
 * A visitor who processes eight images does not want eight "Save as" dialogs,
 * so every batch tool offers one archive.
 *
 * @param {Array<{name: string, blob: Blob}>} entries
 * @param {string} zipName
 * @param {(percent: number) => void} [onProgress]
 */
export async function downloadZip(entries, zipName, onProgress) {
    const zip = new JSZip();

    entries.forEach((entry) => zip.file(entry.name, entry.blob));

    const archive = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => onProgress?.(metadata.percent)
    );

    download(archive, zipName);
}

/**
 * Validate a selection against the limits declared in the catalog.
 *
 * Runs before a single byte is read, so a 900 MB video dragged onto the image
 * compressor is refused in milliseconds instead of after the browser has tried
 * to decode it.
 *
 * @param {FileList|File[]} files
 * @param {{accepts?: string[], maxBytes?: number, maxTotalBytes?: number, multiple?: boolean, maxFiles?: number}} meta
 * @returns {{accepted: File[], rejected: Array<{name: string, reason: string}>}}
 */
export function validateFiles(files, meta = {}) {
    const list = Array.from(files);
    const accepted = [];
    const rejected = [];
    const maxFiles = meta.multiple ? (meta.maxFiles ?? 50) : 1;
    let acceptedBytes = 0;

    for (const file of list) {
        if (accepted.length >= maxFiles) {
            rejected.push({
                name: file.name,
                reason: meta.multiple
                    ? `Only ${maxFiles} files can be handled in one go.`
                    : 'This tool accepts one file at a time.',
            });
            continue;
        }

        if (meta.maxBytes && file.size > meta.maxBytes) {
            rejected.push({
                name: file.name,
                reason: `That file is ${formatBytes(file.size)}, above the recommended ${formatBytes(meta.maxBytes)} limit.`,
            });
            continue;
        }

        if (Array.isArray(meta.accepts) && meta.accepts.length > 0 && ! matchesAnyType(file.type, meta.accepts)) {
            rejected.push({
                name: file.name,
                reason: `Expected ${meta.accepts.map(prettyType).join(' or ')}, got ${prettyType(file.type) || 'an unrecognised type'}.`,
            });
            continue;
        }

        if (meta.maxTotalBytes && acceptedBytes + file.size > meta.maxTotalBytes) {
            rejected.push({
                name: file.name,
                reason: `Adding that file would exceed the total ${formatBytes(meta.maxTotalBytes)} selection limit.`,
            });
            continue;
        }

        accepted.push(file);
        acceptedBytes += file.size;
    }

    return { accepted, rejected };
}

/**
 * A file with no MIME type (common for .txt on some systems) is allowed through
 * rather than rejected on a technicality.
 *
 * @param {string} type
 * @param {string[]} accepts
 * @returns {boolean}
 */
function matchesAnyType(type, accepts) {
    if (! type) {
        return true;
    }

    return accepts.some((accept) => (accept.endsWith('/*') ? type.startsWith(accept.slice(0, -1)) : type === accept));
}

/**
 * @param {string} type
 * @returns {string}
 */
export function prettyType(type) {
    const map = {
        'application/pdf': 'PDF',
        'application/json': 'JSON',
        'application/zip': 'ZIP',
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/webp': 'WebP',
        'image/gif': 'GIF',
        'text/plain': 'TXT',
        'text/csv': 'CSV',
        'text/html': 'HTML',
    };

    return map[type] ?? (type || '');
}

/**
 * Encode a canvas as a blob.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {string} type
 * @param {number} quality 0-1
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
    if (typeof canvas.convertToBlob === 'function') {
        return canvas.convertToBlob({ type, quality });
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
            type,
            quality
        );
    });
}

/**
 * Copy text to the clipboard, with a fallback for contexts where the async
 * clipboard API is unavailable.
 *
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);

            return true;
        }
    } catch {
        // Fall through to the legacy path below.
    }

    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';

        document.body.append(area);
        area.select();

        const ok = document.execCommand('copy');
        area.remove();

        return ok;
    } catch {
        return false;
    }
}
