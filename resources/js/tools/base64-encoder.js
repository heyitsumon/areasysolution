import { button, checkbox, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download, readDataUrl } from '../lib/files';
import { createUploader } from '../lib/uploader';
import { node, panel, statTile } from '../lib/ui';

/**
 * Base64 encoder and decoder.
 *
 * btoa/atob only handle Latin-1, which is why so many online Base64 tools mangle
 * accented text and emoji. Everything here round-trips through TextEncoder and
 * TextDecoder, so the bytes survive intact.
 */

/**
 * @param {string} text
 * @param {boolean} urlSafe
 * @returns {string}
 */
export function encodeBase64(text, urlSafe) {
    const bytes = new TextEncoder().encode(text);

    let binary = '';

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    const encoded = btoa(binary);

    return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : encoded;
}

/**
 * Accepts the standard and URL-safe alphabets, restoring missing padding so
 * JWT-style unpadded values decode correctly.
 *
 * @param {string} value
 * @returns {string}
 */
export function decodeBase64(value) {
    let normalised = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');

    while (normalised.length % 4 !== 0) {
        normalised += '=';
    }

    const binary = atob(normalised);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
}

/**
 * Read the header and payload of a JWT without verifying its signature.
 *
 * @param {string} token
 * @returns {{header: unknown, payload: unknown}}
 */
export function decodeJwt(token) {
    const parts = token.trim().split('.');

    if (parts.length < 2) {
        throw new Error('That does not look like a JSON Web Token - it needs at least two dot-separated parts.');
    }

    return {
        header: JSON.parse(decodeBase64(parts[0]) || '{}'),
        payload: JSON.parse(decodeBase64(parts[1]) || '{}'),
    };
}

export default function mount({ root, meta, announce, complete }) {
    const input = textarea({
        label: 'Input',
        rows: 8,
        mono: true,
        spellcheck: false,
        placeholder: 'Text to encode, or a Base64 string to decode.',
    });

    const output = textarea({ label: 'Output', rows: 8, mono: true, spellcheck: false });

    output.textarea.readOnly = true;

    const urlSafe = checkbox({ label: 'Use the URL-safe alphabet', checked: false });

    const stats = node('<div class="mt-4"></div>');
    const feedback = status();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    const encode = button({ label: 'Encode to Base64', variant: 'primary' });
    const decode = button({ label: 'Decode from Base64' });
    const jwt = button({ label: 'Decode JWT' });
    const copy = button({ label: 'Copy' });
    const save = button({ label: 'Download .txt' });

    actions.append(encode, decode, jwt, copy, save);

    const uploader = createUploader({
        meta: { ...meta, multiple: false, maxBytes: Math.min(meta.maxBytes, 10 * 1024 * 1024) },
        title: 'Drop a file to build a Data URI',
        hint: 'Handy for embedding a small image directly in CSS or HTML.',
        onFiles: async ([file]) => {
            const dataUrl = await readDataUrl(file);

            output.textarea.value = dataUrl;

            feedback.set(`Data URI generated for ${file.name}. Base64 adds roughly 33% overhead.`, 'success');
            announce('Data URI generated.');
            complete();
        },
    });

    const card = panel({ title: 'Input', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(input.el, urlSafe.el, actions, uploader.el, stats, feedback.el);

    const outputCard = panel({ title: 'Output', body: node('<div></div>') });
    const outputBody = /** @type {HTMLElement} */ (outputCard.querySelector('[data-panel-body]'));

    outputBody.append(output.el);

    root.append(card, outputCard);

    function summarise(value) {
        stats.replaceChildren();

        const tiles = node('<div class="grid grid-cols-2 gap-3 sm:grid-cols-3"></div>');

        tiles.append(
            statTile('Output', `${value.length} chars`),
            statTile('Bytes', String(new TextEncoder().encode(value).length)),
            statTile('Alphabet', urlSafe.input.checked ? 'URL-safe' : 'Standard'),
        );

        stats.append(tiles);
    }

    encode.addEventListener('click', () => {
        const text = input.textarea.value;

        if (text === '') {
            feedback.set('Type or paste something to encode first.', 'warning');

            return;
        }

        const result = encodeBase64(text, urlSafe.input.checked);

        output.textarea.value = result;
        summarise(result);
        feedback.set('Encoded. Base64 is an encoding, not encryption - anyone can reverse it.', 'info');
        announce('Encoded to Base64.');
        complete();
    });

    decode.addEventListener('click', () => {
        const value = input.textarea.value.trim();

        if (value === '') {
            feedback.set('Paste a Base64 string to decode first.', 'warning');

            return;
        }

        try {
            const result = decodeBase64(value);

            output.textarea.value = result;
            summarise(result);
            feedback.set('Decoded successfully.', 'success');
            announce('Decoded from Base64.');
            complete();
        } catch {
            feedback.set('That is not valid Base64. Check for a missing character or a stray line break.', 'error');
        }
    });

    jwt.addEventListener('click', () => {
        try {
            const { header, payload } = decodeJwt(input.textarea.value);

            output.textarea.value = JSON.stringify({ header, payload }, null, 2);
            stats.replaceChildren();
            feedback.set('JWT decoded. The signature is not verified here - this only reads the claims.', 'warning');
            announce('JWT payload decoded.');
            complete();
        } catch (error) {
            feedback.set(error instanceof Error ? error.message : 'That token could not be decoded.', 'error');
        }
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.textarea.value);

        feedback.set(ok ? 'Output copied to your clipboard.' : 'Copying is blocked - select the output and press Ctrl+C.', ok ? 'success' : 'warning');
    });

    save.addEventListener('click', () => {
        download(new Blob([output.textarea.value], { type: 'text/plain;charset=utf-8' }), 'base64-output.txt');
    });

    input.textarea.focus();
}
