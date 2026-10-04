import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, number, panel, select, text } from '../lib/ui';

/**
 * Slug generator.
 *
 * Two things separate a usable slug tool from a bad one: transliteration (so
 * accented text keeps its letters) and length trimming that cuts on a word
 * boundary rather than mid-word.
 */

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'is',
    'are', 'was', 'were', 'be', 'from', 'as', 'it', 'this', 'that',
]);

const SAMPLE = 'How to Compress a PDF Without Uploading It to a Server (2026 Guide)';

/**
 * @param {string} value
 * @param {{separator: string, maxLength: number, stripStopWords: boolean, transliterate: boolean}} options
 * @returns {string}
 */
export function slugify(value, options) {
    const { separator, maxLength, stripStopWords, transliterate } = options;

    let working = value.normalize('NFKD');

    if (transliterate) {
        // Drop combining marks so e-acute becomes a plain e.
        working = working.replace(/[\u0300-\u036f]/g, '');
    }

    working = working
        .toLocaleLowerCase()
        .replace(/['\u2019"]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

    let words = working.split(/\s+/).filter(Boolean);

    if (stripStopWords && words.length > 2) {
        words = words.filter((word) => ! STOP_WORDS.has(word));
    }

    let slug = words.join(separator);

    if (slug.length > maxLength) {
        const candidate = slug.slice(0, maxLength + 1);
        const boundary = candidate.lastIndexOf(separator);

        slug = boundary > 0 ? candidate.slice(0, boundary) : candidate.slice(0, maxLength);
    }

    return slug.split(separator).filter(Boolean).join(separator);
}

/**
 * @param {{root: HTMLElement, announce: (message: string) => void}} context
 */
export default function mount({ root, announce, complete }) {
    const source = text({
        label: 'Title or heading',
        value: SAMPLE,
        placeholder: 'Paste the headline you want to turn into a slug',
    });

    const separator = select({
        label: 'Word separator',
        value: '-',
        options: [
            { value: '-', label: 'Hyphen - hello-world (recommended)' },
            { value: '_', label: 'Underscore - hello_world' },
            { value: '.', label: 'Dot - hello.world' },
        ],
    });

    const maxLength = number({ label: 'Maximum length', value: 60, min: 10, max: 120, suffix: 'characters' });

    const stripStopWords = checkbox({ label: 'Remove stop words', checked: true });
    const transliterate = checkbox({ label: 'Transliterate accents', checked: true });

    const output = /** @type {HTMLInputElement} */ (document.createElement('input'));

    output.type = 'text';
    output.readOnly = true;
    output.className = 'field-input font-mono text-sm';

    const meta = node('<p class="mt-2 text-xs text-slate-500 dark:text-slate-400"></p>');
    const warnings = node('<p class="mt-3 hidden rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20"></p>');
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const feedback = status();

    const copy = button({ label: 'Copy slug', variant: 'primary' });
    const save = button({ label: 'Download .txt' });

    actions.append(copy, save);

    const optionsGrid = node('<div class="mt-4 grid gap-4 sm:grid-cols-2"></div>');

    optionsGrid.append(separator.el, maxLength.el, stripStopWords.el, transliterate.el);

    const card = panel({ title: 'Build a slug', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(source.el, optionsGrid);

    const resultBody = node('<div></div>');

    resultBody.append(node('<span class="field-label">Generated slug</span>'), output, meta, warnings, actions);

    root.append(card, panel({ title: 'Result', body: resultBody }));

    function update() {
        const slug = slugify(source.input.value, {
            separator: separator.select.value,
            maxLength: Number(maxLength.input.value) || 60,
            stripStopWords: stripStopWords.input.checked,
            transliterate: transliterate.input.checked,
        });

        output.value = slug;

        const wordCount = slug.split(separator.select.value).filter(Boolean).length;

        meta.textContent = `${slug.length} characters${slug === '' ? '' : ` / ${wordCount} words`}`;

        const messages = [];

        if (slug === '') {
            messages.push('Not enough usable characters to build a slug.');
        }

        if (slug.length > 75) {
            messages.push('Longer than 75 characters, which search results may truncate.');
        }

        warnings.textContent = messages.join(' ');
        warnings.classList.toggle('hidden', messages.length === 0);
    }

    [source.input, maxLength.input].forEach((input) => input.addEventListener('input', update));
    [separator.select, stripStopWords.input, transliterate.input].forEach((input) => input.addEventListener('change', update));

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.value);

        feedback.set(
            ok ? 'Slug copied to your clipboard.' : 'Copying is blocked - select the slug and press Ctrl+C.',
            ok ? 'success' : 'warning',
        );

        announce(`Slug: ${output.value}`);
        if (ok) {
            complete();
        }

        window.setTimeout(() => feedback.set(''), 2000);
    });

    save.addEventListener('click', () => {
        download(new Blob([output.value], { type: 'text/plain;charset=utf-8' }), 'slug.txt');
        complete();
    });

    feedback.el.classList.add('sr-only');
    root.append(feedback.el);

    update();
}
