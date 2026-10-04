import { debounce } from '../lib/dom';
import { button, checkbox, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download, readText } from '../lib/files';
import { createUploader } from '../lib/uploader';
import { node, panel, select } from '../lib/ui';

/**
 * Text formatter.
 *
 * A cleaning workbench: strip markup, normalise whitespace, de-duplicate and
 * sort lines. Operations are applied in a fixed, documented order so the result
 * is predictable - "sort then trim" and "trim then sort" give different answers,
 * and guessing wrong makes the tool feel broken.
 */

const SAMPLE = `  <p>First   line with   extra   spaces</p>
Second line
Second line

third line&nbsp;with entity
<b>Fourth</b> line
`;

/**
 * @param {string} input
 * @param {Record<string, boolean|string>} options
 * @returns {string}
 */
export function formatText(input, options) {
    let output = input.replace(/\r\n?/g, '\n');

    if (options.decodeEntities) {
        output = output
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'");
    }

    if (options.stripTags) {
        // Turn block-level markup into line breaks first, otherwise paragraphs
        // collapse into one endless line.
        output = output
            .replace(/<\s*br\s*\/?\s*>/gi, '\n')
            .replace(/<\s*\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n')
            .replace(/<[^>]+>/g, '');
    }

    if (options.stripEmoji) {
        output = output.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '');
    }

    if (options.asciiOnly) {
        output = output.replace(/[^\x20-\x7E\n]/g, '');
    }

    if (options.smartQuotes) {
        output = output.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2014/g, '--');
    }

    let lines = output.split('\n');

    if (options.trimLines) {
        lines = lines.map((line) => line.trim());
    }

    if (options.collapseSpaces) {
        lines = lines.map((line) => line.replace(/[ \t]{2,}/g, ' '));
    }

    if (options.removeBlankLines) {
        lines = lines.filter((line) => line.trim() !== '');
    }

    if (options.removeDuplicates) {
        // Keep first occurrence and original order, which is what people expect
        // when de-duplicating an export or a keyword list.
        const seen = new Set();

        lines = lines.filter((line) => {
            const key = options.caseSensitiveDuplicates ? line : line.toLowerCase();

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
    }

    const sortOrder = String(options.sort ?? 'none');

    if (sortOrder !== 'none') {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

        lines.sort((a, b) => (sortOrder === 'desc' ? collator.compare(b, a) : collator.compare(a, b)));
    }

    if (options.reverseLines) {
        lines.reverse();
    }

    return lines.join('\n').trim();
}

/**
 * @param {{root: HTMLElement, meta: {maxBytes: number, accepts: string[], multiple: boolean, maxFiles: number}, announce: (message: string) => void}} context
 */
export default function mount({ root, meta, announce, complete }) {
    const source = textarea({ label: 'Input', rows: 10, value: SAMPLE, mono: true });
    const output = textarea({ label: 'Cleaned output', rows: 10, mono: true });

    output.textarea.readOnly = true;

    const toggles = [
        ['trimLines', 'Trim each line', true],
        ['collapseSpaces', 'Collapse repeated spaces', true],
        ['removeBlankLines', 'Remove blank lines', true],
        ['removeDuplicates', 'Remove duplicate lines', false],
        ['stripTags', 'Strip HTML tags', true],
        ['decodeEntities', 'Decode HTML entities', true],
        ['smartQuotes', 'Convert smart quotes and dashes', false],
        ['stripEmoji', 'Remove emoji', false],
        ['asciiOnly', 'Strip non-ASCII characters', false],
        ['reverseLines', 'Reverse the line order', false],
        ['caseSensitiveDuplicates', 'Treat line case as significant', true],
    ];

    /** @type {Record<string, ReturnType<typeof checkbox>>} */
    const controls = {};

    const optionsGrid = node('<div class="mt-4 grid gap-3 sm:grid-cols-2"></div>');

    toggles.forEach(([key, label, checked]) => {
        controls[key] = checkbox({ label, checked });
        optionsGrid.append(controls[key].el);
    });

    const sortOrder = select({
        label: 'Sort lines',
        value: 'none',
        options: [
            { value: 'none', label: 'Keep the original order' },
            { value: 'asc', label: 'A to Z (numbers first)' },
            { value: 'desc', label: 'Z to A' },
        ],
    });

    optionsGrid.append(sortOrder.el);

    const actions = node('<div class="flex flex-wrap gap-2"></div>');
    const feedback = status();

    const copy = button({ label: 'Copy output' });
    const save = button({ label: 'Download .txt' });
    const clear = button({ label: 'Clear input' });
    const loadSample = button({ label: 'Load sample' });

    actions.append(copy, save, clear, loadSample);

    const uploader = createUploader({
        meta: { ...meta, multiple: false, maxBytes: Math.min(meta.maxBytes, 10 * 1024 * 1024) },
        title: 'Drop a .txt, .csv, .json or .html file',
        onFiles: async ([file]) => {
            source.textarea.value = await readText(file);
            apply();
        },
    });

    const stats = node('<p class="mt-3 text-xs text-slate-500 dark:text-slate-400"></p>');

    const card = panel({ title: 'Text', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(source.el, uploader.el, optionsGrid, actions, stats, feedback.el);

    root.append(
        card,
        panel({
            title: 'Output',
            body: node('<div></div>'),
        }),
    );

    const outputCard = /** @type {HTMLElement} */ (root.lastElementChild);
    const outputBody = /** @type {HTMLElement} */ (outputCard.querySelector('[data-panel-body]'));

    outputBody.append(output.el);

    function apply() {
        const options = { sort: sortOrder.select.value };

        toggles.forEach(([key]) => {
            options[key] = controls[key].input.checked;
        });

        const before = source.textarea.value;
        const after = formatText(before, options);

        output.textarea.value = after;

        const beforeLines = before.split('\n').filter((line) => line.trim() !== '').length;
        const afterLines = after.split('\n').filter((line) => line.trim() !== '').length;

        stats.textContent = `${before.length} characters / ${beforeLines} lines in, ${after.length} characters / ${afterLines} lines out`;
    }

    const debounced = debounce(apply, 150);

    source.textarea.addEventListener('input', debounced);

    toggles.forEach(([key]) => controls[key].input.addEventListener('change', apply));
    sortOrder.select.addEventListener('change', apply);

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.textarea.value);

        feedback.set(ok ? 'Cleaned text copied to your clipboard.' : 'Copying is blocked - select the output and press Ctrl+C.', ok ? 'success' : 'warning');
        announce(ok ? 'Output copied.' : 'Copy blocked by the browser.');
        if (ok) {
            complete();
        }

        window.setTimeout(() => feedback.set(''), 2200);
    });

    save.addEventListener('click', () => {
        download(new Blob([output.textarea.value], { type: 'text/plain;charset=utf-8' }), 'cleaned-text.txt');
        complete();
    });

    clear.addEventListener('click', () => {
        source.textarea.value = '';
        apply();
        source.textarea.focus();
    });

    loadSample.addEventListener('click', () => {
        source.textarea.value = SAMPLE;
        apply();
    });

    feedback.el.classList.add('sr-only');
    apply();
}
