/**
 * Shared pdf.js loader.
 *
 * The library is large (well over a megabyte with its worker), so it is imported
 * dynamically and memoised: the first PDF tool a visitor opens pays for it once,
 * and every other PDF tool on the site reuses the same instance for the rest of
 * the session.
 *
 * The worker is bundled as a module from our own origin rather than a CDN, so no
 * cross-origin script is needed and the Content-Security-Policy can stay strict.
 */

/** @type {any} */
let instance = null;

/**
 * @returns {Promise<any>}
 */
export async function loadPdfJs() {
    if (instance) {
        return instance;
    }

    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');

    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    instance = pdfjs;

    return pdfjs;
}

/**
 * Open a PDF from raw bytes.
 *
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {Promise<any>}
 */
export async function openPdf(data) {
    const pdfjs = await loadPdfJs();

    return pdfjs.getDocument({ data }).promise;
}

/**
 * pdf-lib is smaller than pdf.js but still not worth shipping to pages that do
 * not need it, so it is loaded on demand and cached the same way.
 *
 * @returns {Promise<{PDFDocument: any}>}
 */
export async function loadPdfLib() {
    return import('pdf-lib');
}
