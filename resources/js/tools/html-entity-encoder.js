import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';

export function encodeHtmlEntities(str) {
    return str.replace(/[\u00A0-\u9999<>&"'`]/gim, (i) => `&#${i.charCodeAt(0)};`);
}

export function decodeHtmlEntities(str) {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent || '';
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 7;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Type or paste text to encode or decode...';
    input.value = `<div class="container" id="main">\n  <p>Hello & Welcome "User" 'Antigravity' © 2026</p>\n</div>`;

    const output = document.createElement('textarea');
    output.rows = 7;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const encodeBtn = button({ label: 'Encode to Entities', variant: 'primary' });
    const decodeBtn = button({ label: 'Decode Entities' });
    const copyBtn = button({ label: 'Copy Output' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(encodeBtn, decodeBtn, copyBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Input Text</label>'),
        input,
        actions,
        feedback.el,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Output Result</label>'),
        output
    );

    root.append(panel({ title: 'HTML Entity Encoder & Decoder', body }));

    encodeBtn.addEventListener('click', () => {
        const text = input.value;
        output.value = encodeHtmlEntities(text);
        feedback.set('Encoded characters to HTML numeric entities.', 'success');
        announce('Encoded to HTML entities.');
        void complete();
    });

    decodeBtn.addEventListener('click', () => {
        const text = input.value;
        output.value = decodeHtmlEntities(text);
        feedback.set('Decoded HTML entities into characters.', 'success');
        announce('Decoded HTML entities.');
        void complete();
    });

    copyBtn.addEventListener('click', () => {
        if (!output.value) return;
        copyToClipboard(output.value);
        feedback.set('Copied output to clipboard!', 'success');
        announce('Copied to clipboard.');
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        output.value = '';
        feedback.set('');
    });

    // Run encode initially
    output.value = encodeHtmlEntities(input.value);
}

