import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';
/**
 * Case converter.
 *
 * Pure string transforms behind a row of buttons. The interesting parts are the
 * ones tools usually get wrong: Unicode-aware casing, title case that leaves
 * small words alone, and identifier conversion that treats acronyms and digits
 * sensibly.
 */

const SMALL_WORDS = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'if', 'in', 'nor', 'of', 'on', 'or',
    'per', 'the', 'to', 'v', 'via', 'vs', 'with', 'from',
]);

const SAMPLE = 'the quick brown fox jumps over the lazy dog';

const BUTTONS = [
    ['upper', 'UPPERCASE'],
    ['lower', 'lowercase'],
    ['sentence', 'Sentence case'],
    ['title', 'Title Case'],
    ['capitalized', 'Capitalized'],
    ['camel', 'camelCase'],
    ['pascal', 'PascalCase'],
    ['snake', 'snake_case'],
    ['kebab', 'kebab-case'],
    ['constant', 'CONSTANT_CASE'],
    ['dot', 'dot.case'],
    ['alternating', 'aLtErNaTiNg'],
];

/**
 * Split text into words, keeping acronyms together and separating digits from
 * letters - which is what makes camelCase output look deliberate rather than
 * accidental.
 *
 * @param {string} value
 * @returns {string[]}
 */
function words(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2')
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word !== '');
}

/**
 * @param {string} value
 * @returns {string}
 */
function upperFirst(value) {
    return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

/**
 * @param {string} value
 * @param {boolean} keepSmallWordsLowercase
 * @returns {string}
 */
function titleCase(value, keepSmallWordsLowercase) {
    const parts = words(value);

    return parts
        .map((word, index) => {
            const lower = word.toLocaleLowerCase();
            const isEdge = index === 0 || index === parts.length - 1;

            if (keepSmallWordsLowercase && ! isEdge && SMALL_WORDS.has(lower)) {
                return lower;
            }

            // Keep genuine acronyms such as API or HTTP intact.
            if (word.length > 1 && word === word.toLocaleUpperCase() && /[A-Z]/.test(word)) {
                return word;
            }

            return upperFirst(lower);
        })
        .join(' ');
}

/**
 * Fix text typed with Caps Lock stuck on: a sentence that is entirely uppercase
 * is lowercased and re-sentenced, while intentional capitals are left alone.
 *
 * @param {string} value
 * @returns {string}
 */
function sentenceCase(value) {
    return value
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => {
            const trimmed = sentence.trim();

            if (trimmed === '') {
                return '';
            }

            const shouted = trimmed === trimmed.toLocaleUpperCase() && /[A-Z]{4,}/.test(trimmed);

            return upperFirst(shouted ? trimmed.toLocaleLowerCase() : trimmed);
        })
        .filter(Boolean)
        .join(' ');
}

/**
 * @type {Record<string, (value: string, options: {smallWords: boolean}) => string>}
 */
const TRANSFORMS = {
    upper: (value) => value.toLocaleUpperCase(),
    lower: (value) => value.toLocaleLowerCase(),
    sentence: (value) => sentenceCase(value),
    title: (value, options) => titleCase(value, options.smallWords),
    capitalized: (value) => words(value).map(upperFirst).join(' '),
    camel: (value) => words(value)
        .map((word, index) => (index === 0 ? word.toLocaleLowerCase() : upperFirst(word.toLocaleLowerCase())))
        .join(''),
    pascal: (value) => words(value).map((word) => upperFirst(word.toLocaleLowerCase())).join(''),
    snake: (value) => words(value).map((word) => word.toLocaleLowerCase()).join('_'),
    kebab: (value) => words(value).map((word) => word.toLocaleLowerCase()).join('-'),
    constant: (value) => words(value).map((word) => word.toLocaleUpperCase()).join('_'),
    dot: (value) => words(value).map((word) => word.toLocaleLowerCase()).join('.'),
    alternating: (value) => Array.from(value)
        .map((character, index) => (index % 2 === 0 ? character.toLocaleLowerCase() : character.toLocaleUpperCase()))
        .join(''),
};

const GUIDE = `
    <dl class="space-y-3 text-sm">
        <div>
            <dt class="font-semibold">Title Case for headlines</dt>
            <dd class="prose-tools">Most style guides capitalise the first and last word plus every significant word, leaving articles and short prepositions lowercase.</dd>
        </div>
        <div>
            <dt class="font-semibold">camelCase and snake_case for code</dt>
            <dd class="prose-tools">Convention beats correctness: JavaScript and Java favour camelCase for variables, Python and SQL favour snake_case, and constants are UPPER_SNAKE_CASE almost everywhere.</dd>
        </div>
        <div>
            <dt class="font-semibold">Sentence case for interface copy</dt>
            <dd class="prose-tools">Sentence case is easier to read at speed, which is why most modern design systems use it for headings and labels.</dd>
        </div>
    </dl>
`;

/**
 * @param {{root: HTMLElement, announce: (message: string) => void}} context
 */
export default function mount({ root, announce, complete }) {
    const editor = /** @type {HTMLTextAreaElement} */ (document.createElement('textarea'));

    editor.rows = 12;
    editor.className = 'field-input font-mono text-[13px] leading-relaxed';
    editor.value = SAMPLE;
    editor.spellcheck = false;
    editor.setAttribute('aria-label', 'Text to convert');

    const smallWords = checkbox({
        label: 'Keep small words lowercase in Title Case',
        hint: 'Words such as and, the, of and in stay lowercase unless they open or close the title.',
        checked: true,
    });

    const grid = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const feedback = status();

    BUTTONS.forEach(([key, label]) => {
        const control = button({ label });

        control.addEventListener('click', () => {
            editor.value = TRANSFORMS[key](editor.value, { smallWords: smallWords.input.checked });
            feedback.set('');
            announce(`Converted to ${label}.`);
            complete();
        });

        grid.append(control);
    });

    const copy = button({ label: 'Copy result' });
    const reset = button({ label: 'Reset to sample' });
    const clear = button({ label: 'Clear' });

    actions.append(copy, reset, clear);

    copy.addEventListener('click', async () => {
        const ok = await copyToClipboard(editor.value);

        feedback.set(
            ok
                ? 'Result copied to your clipboard.'
                : 'Copying is blocked in this browser - select the text and press Ctrl+C.',
            ok ? 'success' : 'warning',
        );
    });

    reset.addEventListener('click', () => {
        editor.value = SAMPLE;
        feedback.set('');
    });

    clear.addEventListener('click', () => {
        editor.value = '';
        feedback.set('');
        editor.focus();
    });

    const card = panel({ title: 'Convert case', body: node('<div></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(editor, grid, smallWords.el, actions, feedback.el);

    root.append(card, panel({ title: 'Which style should you use?', body: node(GUIDE) }));
}
