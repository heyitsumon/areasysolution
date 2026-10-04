import { button, checkbox, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel, select } from '../lib/ui';

/**
 * URL encoder and decoder.
 *
 * The distinction that matters is component versus whole-URL encoding:
 * encodeURIComponent escapes & and ? so a value cannot break out of its
 * parameter, while encodeURI leaves them readable so the URL structure survives.
 * Tools offering only one of the two are wrong half the time.
 */

/**
 * @param {string} value
 * @param {'component'|'full'} mode
 * @returns {string}
 */
export function encodeUrl(value, mode) {
    return mode === 'full' ? encodeURI(value) : encodeURIComponent(value);
}

/**
 * Decode without throwing on malformed input: browsers raise a URIError on a
 * stray "%", which would otherwise blank the output pane mid-typing.
 *
 * @param {string} value
 * @returns {{value: string, ok: boolean}}
 */
export function decodeUrl(value) {
    try {
        return { value: decodeURIComponent(value), ok: true };
    } catch {
        return { value, ok: false };
    }
}

/**
 * Break a query string into rows so a long tracking URL becomes readable.
 *
 * @param {string} raw
 * @returns {Array<{key: string, value: string}>}
 */
export function parseQuery(raw) {
    const withQuery = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
    const trimmed = withQuery.split('#')[0];

    if (trimmed.trim() === '') {
        return [];
    }

    return trimmed.split('&').filter(Boolean).map((pair) => {
        const [key, ...rest] = pair.split('=');

        return {
            key: decodeUrl(key.replace(/\+/g, ' ')).value,
            value: decodeUrl(rest.join('=').replace(/\+/g, ' ')).value,
        };
    });
}

export default function mount({ root, complete }) {
    const input = textarea({
        label: 'Input',
        rows: 6,
        mono: true,
        spellcheck: false,
        placeholder: 'https://example.com/search?q=hello world&lang=en',
    });

    const output = textarea({ label: 'Output', rows: 6, mono: true, spellcheck: false });

    output.textarea.readOnly = true;

    const mode = select({
        label: 'Encoding mode',
        value: 'component',
        options: [
            { value: 'component', label: 'Single component (escapes & ? = /)' },
            { value: 'full', label: 'Whole URL (keeps the structure readable)' },
        ],
    });

    const keepPlus = checkbox({ label: 'Treat + as a space when decoding', checked: true });

    const feedback = status();
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const tableHost = node('<div class="mt-4"></div>');

    const encode = button({ label: 'Encode', variant: 'primary' });
    const decode = button({ label: 'Decode' });
    const copy = button({ label: 'Copy output' });

    actions.append(encode, decode, copy);

    const settings = node('<div class="mt-4 grid gap-4 sm:grid-cols-2"></div>');

    settings.append(mode.el, keepPlus.el);

    const card = panel({ title: 'Input', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(input.el, settings, actions, feedback.el);

    const outputCard = panel({ title: 'Output', body: node('<div></div>') });
    const outputBody = /** @type {HTMLElement} */ (outputCard.querySelector('[data-panel-body]'));

    outputBody.append(output.el);

    root.append(card, outputCard, panel({ title: 'Query string parameters', body: tableHost }));

    function renderTable(source) {
        tableHost.replaceChildren();

        const rows = parseQuery(source);

        if (rows.length === 0) {
            tableHost.append(node('<p class="text-sm text-slate-500 dark:text-slate-400">Paste a URL with a query string to see its parameters broken out.</p>'));

            return;
        }

        const list = node('<ul class="space-y-2"></ul>');

        rows.forEach(({ key, value }) => {
            const item = node(`
                <li class="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-800">
                    <span class="font-mono font-semibold text-indigo-600 dark:text-indigo-400"></span>
                    <span class="min-w-0 flex-1 break-all font-mono text-xs text-slate-600 dark:text-slate-300"></span>
                </li>
            `);

            /** @type {HTMLElement} */ (item.children[0]).textContent = key;
            /** @type {HTMLElement} */ (item.children[1]).textContent = value || '(empty)';

            list.append(item);
        });

        tableHost.append(list);
    }

    encode.addEventListener('click', () => {
        const value = input.textarea.value;

        if (value === '') {
            feedback.set('Paste a URL or a value to encode first.', 'warning');

            return;
        }

        output.textarea.value = encodeUrl(value, mode.select.value === 'full' ? 'full' : 'component');

        feedback.set('Encoded. A space becomes %20, which is safe in a path and in a query string.', 'success');
        renderTable(value);
        complete();
    });

    decode.addEventListener('click', () => {
        const value = input.textarea.value;

        if (value === '') {
            feedback.set('Paste a percent-encoded value to decode first.', 'warning');

            return;
        }

        // Form encoding uses + for a space, which decodeURIComponent does not
        // understand, so the convention is applied or ignored explicitly here.
        const prepared = keepPlus.input.checked ? value.replace(/\+/g, ' ') : value;
        const result = decodeUrl(prepared);

        output.textarea.value = result.value;

        feedback.set(
            result.ok
                ? 'Decoded successfully.'
                : 'Decoded as far as possible - the input contains a malformed percent sequence such as a lone %.',
            result.ok ? 'success' : 'warning',
        );

        renderTable(value);

        if (result.ok) {
            complete();
        }
    });

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.textarea.value);

        feedback.set(ok ? 'Output copied to your clipboard.' : 'Copying is blocked - select the output and press Ctrl+C.', ok ? 'success' : 'warning');
    });

    input.textarea.addEventListener('input', () => renderTable(input.textarea.value));

    renderTable('');
    input.textarea.focus();
}
