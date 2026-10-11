import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';

function parseMarkdown(md) {
    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 mt-5 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-slate-950 mt-6 mb-3">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');

    // Blockquote
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 italic my-2 text-slate-600">$1</blockquote>');

    // Code blocks & inline code
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

    // Links & Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="rounded max-w-full my-3" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-indigo-600 underline hover:text-indigo-800" target="_blank" rel="noopener">$1</a>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');

    // Paragraphs
    html = html.replace(/\n\s*\n/gim, '</p><p class="mt-2 text-sm leading-relaxed text-slate-700">');

    return `<p class="mt-2 text-sm leading-relaxed text-slate-700">${html}</p>`;
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 10;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Type or paste Markdown here...';
    input.value = `# Welcome to Markdown to HTML

This is a **free**, *fast* and client-side **Markdown converter**.

## Features:
* Clean HTML output
* Instant live preview
* No server upload needed

Visit [Our Tools](/tools) to explore more utilities!`;

    const htmlOutput = document.createElement('textarea');
    htmlOutput.rows = 8;
    htmlOutput.readOnly = true;
    htmlOutput.className = 'field-input font-mono text-xs';

    const preview = node('<div class="rounded-xl border border-slate-200 bg-white p-4 min-h-48 prose max-w-none text-slate-800"></div>');

    const copyBtn = button({ label: 'Copy HTML Code', variant: 'primary' });
    const downloadBtn = button({ label: 'Download .html' });
    const feedback = status();

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(copyBtn, downloadBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Markdown Input</label>'),
        input,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Live Rendered Preview</label>'),
        preview,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Generated HTML Code</label>'),
        htmlOutput,
        actions,
        feedback.el
    );

    root.append(panel({ title: 'Markdown to HTML Converter', body }));

    function update() {
        const raw = input.value;
        const html = parseMarkdown(raw);
        preview.innerHTML = html;
        htmlOutput.value = html;
        void complete();
    }

    input.addEventListener('input', update);

    copyBtn.addEventListener('click', () => {
        copyToClipboard(htmlOutput.value);
        feedback.set('HTML code copied to clipboard!', 'success');
        announce('Copied HTML code.');
    });

    downloadBtn.addEventListener('click', () => {
        const fullDoc = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Converted Markdown</title>\n</head>\n<body>\n${htmlOutput.value}\n</body>\n</html>`;
        const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
        download(blob, 'document.html');
        announce('HTML file downloaded.');
    });

    update();
}

