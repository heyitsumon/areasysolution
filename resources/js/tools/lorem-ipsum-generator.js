import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, number, panel, select } from '../lib/ui';

const WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
    'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
    'curabitur', 'pretium', 'tincidunt', 'lacus', 'nulla', 'gravida', 'orci', 'a', 'odio', 'nullam', 'varius',
    'turpis', 'et', 'commodo', 'pharetra', 'est', 'eros', 'bibendum', 'elit', 'nec', 'luctus', 'magna', 'felis',
    'sollicitudin', 'ante', 'integer', 'rutrum', 'ante', 'eu', 'lacus', 'vestibulum', 'libero', 'nisl', 'porta',
];

function generateSentence(minWords = 8, maxWords = 16) {
    const count = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const words = [];
    for (let i = 0; i < count; i++) {
        words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }
    const sentence = words.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function generateParagraph(minSentences = 4, maxSentences = 7) {
    const count = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const sentences = [];
    for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
    }
    return sentences.join(' ');
}

export default function mount({ root, announce, complete }) {
    const typeSelect = select({
        label: 'Generate by',
        value: 'paragraphs',
        options: [
            { value: 'paragraphs', label: 'Paragraphs' },
            { value: 'sentences', label: 'Sentences' },
            { value: 'words', label: 'Words' },
        ],
    });

    const countInput = number({
        label: 'Count',
        value: 3,
        min: 1,
        max: 50,
    });

    const startWithLorem = checkbox({
        label: 'Start with "Lorem ipsum dolor sit amet…"',
        checked: true,
    });

    const includeHtml = checkbox({
        label: 'Wrap in HTML <p> tags',
        checked: false,
    });

    const generateBtn = button({ label: 'Generate Text', variant: 'primary' });
    const copyBtn = button({ label: 'Copy to Clipboard' });
    const downloadBtn = button({ label: 'Download .txt' });
    const feedback = status();

    const output = document.createElement('textarea');
    output.rows = 8;
    output.readOnly = true;
    output.className = 'field-input font-sans text-sm leading-relaxed';
    output.setAttribute('aria-label', 'Generated lorem ipsum');

    const controls = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    controls.append(typeSelect.el, countInput.el);

    const checks = node('<div class="grid gap-2 sm:grid-cols-2 mt-3"></div>');
    checks.append(startWithLorem.el, includeHtml.el);

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(generateBtn, copyBtn, downloadBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(controls, checks, actions, feedback.el, output);

    root.append(panel({ title: 'Lorem Ipsum Generator', body }));

    function run() {
        const type = typeSelect.select.value;
        const count = Math.max(1, Math.min(100, Number(countInput.input.value) || 1));
        const withHtml = includeHtml.input.checked;
        const withLorem = startWithLorem.input.checked;

        let result = '';

        if (type === 'paragraphs') {
            const paras = [];
            for (let i = 0; i < count; i++) {
                paras.push(generateParagraph());
            }
            if (withLorem && paras.length > 0) {
                paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' + paras[0];
            }
            if (withHtml) {
                result = paras.map((p) => `<p>${p}</p>`).join('\n\n');
            } else {
                result = paras.join('\n\n');
            }
        } else if (type === 'sentences') {
            const sentences = [];
            for (let i = 0; i < count; i++) {
                sentences.push(generateSentence());
            }
            if (withLorem && sentences.length > 0) {
                sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            }
            result = sentences.join(' ');
        } else {
            const words = [];
            for (let i = 0; i < count; i++) {
                words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
            }
            if (withLorem && words.length >= 5) {
                words[0] = 'lorem'; words[1] = 'ipsum'; words[2] = 'dolor'; words[3] = 'sit'; words[4] = 'amet';
            }
            result = words.join(' ');
        }

        output.value = result;
        feedback.set(`Generated ${count} ${type}.`, 'success');
        announce(`Generated ${count} ${type}.`);
        void complete();
    }

    generateBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Copied placeholder text to clipboard!', 'success');
        announce('Copied to clipboard.');
    });

    downloadBtn.addEventListener('click', () => {
        if (!output.value) run();
        const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
        download(blob, 'lorem-ipsum.txt');
        announce('Downloaded lorem ipsum file.');
    });

    run();
}

