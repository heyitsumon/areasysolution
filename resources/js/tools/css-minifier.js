import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';

export function minifyCss(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // strip comments
        .replace(/\s+/g, ' ')             // collapse whitespace
        .replace(/\s*([\{\}:;,>+~])\s*/g, '$1') // remove spaces around syntax delimiters
        .replace(/;}/g, '}')              // remove trailing semicolon
        .trim();
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 8;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste your CSS code here...';
    input.value = `/* Header Styles */
.header-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
}

/* Button styles */
.btn-primary {
    background-color: #4f46e5;
    color: #ffffff;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 600;
}`;

    const output = document.createElement('textarea');
    output.rows = 6;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const minifyBtn = button({ label: 'Minify CSS', variant: 'primary' });
    const copyBtn = button({ label: 'Copy Minified CSS' });
    const downloadBtn = button({ label: 'Download .min.css' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();
    const statsBar = node('<div class="flex flex-wrap gap-3 text-xs font-semibold"></div>');

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(minifyBtn, copyBtn, downloadBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Unminified CSS</label>'),
        input,
        actions,
        feedback.el,
        statsBar,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Minified CSS Output</label>'),
        output
    );

    root.append(panel({ title: 'CSS Minifier & Compressor', body }));

    function run() {
        const raw = input.value;
        const minified = minifyCss(raw);
        output.value = minified;

        const origBytes = new Blob([raw]).size;
        const minBytes = new Blob([minified]).size;
        const savedBytes = origBytes - minBytes;
        const savedPct = origBytes > 0 ? ((savedBytes / origBytes) * 100).toFixed(1) : '0';

        statsBar.innerHTML = `
            <span class="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-slate-700">Original: ${origBytes} bytes</span>
            <span class="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800">Minified: ${minBytes} bytes</span>
            <span class="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-indigo-800">Saved: ${savedBytes} bytes (${savedPct}%)</span>
        `;

        feedback.set(`CSS minified successfully (${savedPct}% reduction).`, 'success');
        announce(`Minified CSS. Saved ${savedPct}%.`);
        void complete();
    }

    input.addEventListener('input', run);
    minifyBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Copied minified CSS to clipboard!', 'success');
        announce('Copied CSS.');
    });

    downloadBtn.addEventListener('click', () => {
        if (!output.value) run();
        const blob = new Blob([output.value], { type: 'text/css;charset=utf-8' });
        download(blob, 'styles.min.css');
        announce('Downloaded minified CSS.');
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        output.value = '';
        statsBar.replaceChildren();
        feedback.set('');
    });

    run();
}

