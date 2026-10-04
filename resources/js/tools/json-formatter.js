import { button, checkbox, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download, formatBytes, readText } from '../lib/files';
import { createUploader } from '../lib/uploader';
import { node, panel, select, statTile } from '../lib/ui';

/**
 * JSON formatter, validator and minifier.
 *
 * Three details make this useful rather than decorative:
 *
 *   * errors are reported with a line and a column, because "Unexpected token }
 *     in JSON at position 812" is not actionable for a human;
 *   * key sorting is opt-in, since reordering keys changes nothing semantically
 *     but destroys useful diffs;
 *   * minifying is a separate action rather than a toggle, so nobody ships a
 *     pretty-printed payload by accident.
 */

/**
 * Turn a character offset into a line, a column and the offending line, so the
 * message points at something a person can actually find.
 *
 * @param {string} source
 * @param {string} message
 * @returns {{line: number, column: number, snippet: string, message: string}}
 */
export function describeError(source, message) {
    const match = /position (\d+)/.exec(message);
    const offset = match ? Number(match[1]) : 0;

    const before = source.slice(0, offset);
    const line = before.split('\n').length;
    const column = offset - (before.lastIndexOf('\n') + 1) + 1;
    const snippet = (source.split('\n')[line - 1] ?? '').slice(0, 160);

    return {
        line,
        column,
        snippet,
        message: message.replace(/^JSON\.parse: /, ''),
    };
}

/**
 * Recursively reorder object keys. Arrays keep their order, because array order
 * is data and object key order is not.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function sortDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortDeep);
    }

    if (value !== null && typeof value === 'object') {
        /** @type {Record<string, unknown>} */
        const source = /** @type {Record<string, unknown>} */ (value);

        /** @type {Record<string, unknown>} */
        const ordered = {};

        Object.keys(source)
            .sort((a, b) => a.localeCompare(b))
            .forEach((key) => {
                ordered[key] = sortDeep(source[key]);
            });

        return ordered;
    }

    return value;
}

/**
 * Byte size of the current payload, which is the number people actually care
 * about when they are deciding whether to minify.
 *
 * @param {string} value
 * @returns {number}
 */
function byteSize(value) {
    return new TextEncoder().encode(value).length;
}

/**
 * @param {{root: HTMLElement, meta: {maxBytes: number, accepts: string[], multiple: boolean, maxFiles: number}, announce: (message: string) => void}} context
 */
export default function mount({ root, meta, announce, complete }) {
    const input = textarea({
        label: 'JSON input',
        rows: 14,
        mono: true,
        spellcheck: false,
        placeholder: '{\n  "paste": "your JSON here"\n}',
    });

    const output = textarea({ label: 'Result', rows: 14, mono: true, spellcheck: false });

    output.textarea.readOnly = true;

    const indent = select({
        label: 'Indentation',
        value: '2',
        options: [
            { value: '2', label: '2 spaces' },
            { value: '4', label: '4 spaces' },
            { value: '8', label: '8 spaces' },
            { value: '\t', label: 'Tab' },
        ],
    });

    const sortKeys = checkbox({ label: 'Sort keys alphabetically', checked: false });

    const settings = node('<div class="mt-4 grid gap-4 sm:grid-cols-2"></div>');

    settings.append(indent.el, sortKeys.el);

    const stats = node('<div class="mt-4"></div>');
    const feedback = status();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');

    const format = button({ label: 'Format', variant: 'primary' });
    const minify = button({ label: 'Minify' });
    const validate = button({ label: 'Validate' });
    const copy = button({ label: 'Copy result' });
    const save = button({ label: 'Download .json' });

    actions.append(format, minify, validate, copy, save);

    const uploader = createUploader({
        meta: { ...meta, multiple: false, maxBytes: Math.min(meta.maxBytes, 20 * 1024 * 1024) },
        title: 'Drop a .json file',
        onFiles: async ([file]) => {
            input.textarea.value = await readText(file);
            run('format');
        },
    });

    const card = panel({ title: 'Input', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(input.el, uploader.el, settings, actions, stats, feedback.el);

    const outputCard = panel({ title: 'Output', body: node('<div></div>') });
    const outputBody = /** @type {HTMLElement} */ (outputCard.querySelector('[data-panel-body]'));

    outputBody.append(output.el);

    root.append(card, outputCard);

    /**
     * @param {'format'|'minify'|'validate'} mode
     */
    function run(mode) {
        const source = input.textarea.value.trim();

        stats.replaceChildren();

        if (source === '') {
            feedback.set('Paste some JSON first.', 'warning');
            output.textarea.value = '';

            return;
        }

        try {
            const parsed = JSON.parse(source);
            const spacer = mode === 'minify' ? undefined : (indent.select.value === '\t' ? '\t' : Number(indent.select.value));
            const prepared = sortKeys.input.checked ? sortDeep(parsed) : parsed;
            const result = JSON.stringify(prepared, null, spacer) ?? '';

            output.textarea.value = result;

            const tiles = node('<div class="grid grid-cols-2 gap-3 sm:grid-cols-4"></div>');
            const before = byteSize(source);
            const after = byteSize(result);

            /** @type {Array<[string, string, string?]>} */
            const figures = [
                ['Input', formatBytes(before)],
                ['Output', formatBytes(after)],
                ['Difference', `${after <= before ? '-' : '+'}${formatBytes(Math.abs(after - before))}`],
                ['Nodes', String(countNodes(parsed))],
            ];

            figures.forEach(([label, value, hint]) => {
                tiles.append(statTile(label, value, hint));
            });

            stats.append(tiles);

            feedback.set(
                mode === 'validate'
                    ? 'Valid JSON. Nothing was changed.'
                    : `Valid JSON. ${mode === 'minify' ? 'Minified' : 'Formatted'} successfully.`,
                'success',
            );

            announce(`JSON ${mode === 'minify' ? 'minified' : 'formatted'}, ${formatBytes(after)}.`);
            complete();
        } catch (error) {
            const details = describeError(source, error instanceof Error ? error.message : String(error));

            output.textarea.value = '';

            feedback.set(`Invalid JSON on line ${details.line}, column ${details.column}: ${details.message}${details.snippet ? ` - near: ${details.snippet.trim()}` : ''}`, 'error');
            announce('That JSON is not valid.');
        }
    }

    format.addEventListener('click', () => run('format'));
    minify.addEventListener('click', () => run('minify'));
    validate.addEventListener('click', () => run('validate'));

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.textarea.value);

        feedback.set(ok ? 'Result copied to your clipboard.' : 'Copying is blocked - select the output and press Ctrl+C.', ok ? 'success' : 'warning');
    });

    save.addEventListener('click', () => {
        download(new Blob([output.textarea.value], { type: 'application/json' }), 'formatted.json');
    });

    input.textarea.addEventListener('input', () => {
        feedback.set('');
    });

    input.textarea.focus();
}

/**
 * Count values, for the summary tiles. A quick sanity signal that the payload is
 * as big as the visitor expects.
 *
 * @param {unknown} value
 * @returns {number}
 */
function countNodes(value) {
    if (Array.isArray(value)) {
        return 1 + value.reduce((total, item) => total + countNodes(item), 0);
    }

    if (value !== null && typeof value === 'object') {
        const source = /** @type {Record<string, unknown>} */ (value);

        return 1 + Object.keys(source).reduce((total, key) => total + countNodes(source[key]), 0);
    }

    return 1;
}

