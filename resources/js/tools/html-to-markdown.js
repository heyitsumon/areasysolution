import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';

function convertHtmlToMarkdown(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function processNode(el) {
        if (el.nodeType === Node.TEXT_NODE) {
            return el.textContent || '';
        }

        if (el.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = el.tagName.toLowerCase();
        let children = Array.from(el.childNodes).map(processNode).join('');

        switch (tag) {
            case 'h1': return `\n# ${children.trim()}\n\n`;
            case 'h2': return `\n## ${children.trim()}\n\n`;
            case 'h3': return `\n### ${children.trim()}\n\n`;
            case 'h4': return `\n#### ${children.trim()}\n\n`;
            case 'p': return `\n${children.trim()}\n\n`;
            case 'strong':
            case 'b': return `**${children}**`;
            case 'em':
            case 'i': return `*${children}*`;
            case 'code': return `\`${children}\``;
            case 'pre': return `\n\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
            case 'blockquote': return `\n> ${children.trim()}\n\n`;
            case 'a': {
                const href = el.getAttribute('href') || '';
                return `[${children}](${href})`;
            }
            case 'img': {
                const src = el.getAttribute('src') || '';
                const alt = el.getAttribute('alt') || '';
                return `![${alt}](${src})`;
            }
            case 'ul': return `\n${children}\n`;
            case 'ol': return `\n${children}\n`;
            case 'li': {
                const parent = el.parentElement?.tagName.toLowerCase();
                const prefix = parent === 'ol' ? '1. ' : '* ';
                return `${prefix}${children.trim()}\n`;
            }
            case 'hr': return `\n---\n\n`;
            case 'br': return `\n`;
            default: return children;
        }
    }

    return processNode(doc.body).replace(/\n{3,}/g, '\n\n').trim();
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 9;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste HTML markup here (<p>Hello <b>world</b></p>)...';
    input.value = `<h1>Article Title</h1>
<p>This is a paragraph with <strong>bold text</strong> and <em>italic style</em>.</p>
<ul>
  <li>First benefit</li>
  <li>Second benefit</li>
</ul>
<p>Check out <a href="https://example.com">our website</a> for more details.</p>`;

    const output = document.createElement('textarea');
    output.rows = 9;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const convertBtn = button({ label: 'Convert to Markdown', variant: 'primary' });
    const copyBtn = button({ label: 'Copy Markdown' });
    const downloadBtn = button({ label: 'Download .md' });
    const feedback = status();

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(convertBtn, copyBtn, downloadBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">HTML Input</label>'),
        input,
        actions,
        feedback.el,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Markdown Output</label>'),
        output
    );

    root.append(panel({ title: 'HTML to Markdown Converter', body }));

    function run() {
        const raw = input.value.trim();
        if (!raw) {
            output.value = '';
            return;
        }
        output.value = convertHtmlToMarkdown(raw);
        feedback.set('Successfully converted HTML to Markdown.', 'success');
        announce('HTML converted to Markdown.');
        void complete();
    }

    input.addEventListener('input', run);
    convertBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Markdown copied to clipboard!', 'success');
        announce('Copied Markdown.');
    });

    downloadBtn.addEventListener('click', () => {
        if (!output.value) run();
        const blob = new Blob([output.value], { type: 'text/markdown;charset=utf-8' });
        download(blob, 'document.md');
        announce('Markdown file downloaded.');
    });

    run();
}

