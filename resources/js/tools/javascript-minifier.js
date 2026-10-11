import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';

export function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')     // remove multi-line comments
        .replace(/\/\/(?![^"']*["']).*$/gm, '') // remove single-line comments not inside quotes
        .replace(/^\s+/gm, '')                 // remove leading whitespace per line
        .replace(/\s+$/gm, '')                 // remove trailing whitespace per line
        .replace(/\s*([=+\-*/%&|^!<>?:;,{}()[\]])\s*/g, '$1') // remove spaces around operators and delimiters
        .replace(/;+/g, ';')                   // collapse duplicate semicolons
        .replace(/\n+/g, '\n')                 // collapse blank lines
        .trim();
}

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 8;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste your JavaScript code here...';
    input.value = `// Calculate factorial function
function factorial(n) {
    /* Base case check */
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Log result to console
console.log("Factorial of 5 is: ", factorial(5));`;

    const output = document.createElement('textarea');
    output.rows = 6;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const minifyBtn = button({ label: 'Minify JavaScript', variant: 'primary' });
    const copyBtn = button({ label: 'Copy Minified JS' });
    const downloadBtn = button({ label: 'Download .min.js' });
    const clearBtn = button({ label: 'Clear' });
    const feedback = status();
    const statsBar = node('<div class="flex flex-wrap gap-3 text-xs font-semibold"></div>');

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(minifyBtn, copyBtn, downloadBtn, clearBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Unminified JavaScript</label>'),
        input,
        actions,
        feedback.el,
        statsBar,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Minified JavaScript Output</label>'),
        output
    );

    root.append(panel({ title: 'JavaScript Minifier', body }));

    function run() {
        const raw = input.value;
        const minified = minifyJs(raw);
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

        feedback.set(`JavaScript minified successfully (${savedPct}% reduction).`, 'success');
        announce(`Minified JS. Saved ${savedPct}%.`);
        void complete();
    }

    input.addEventListener('input', run);
    minifyBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Copied minified JS to clipboard!', 'success');
        announce('Copied JavaScript.');
    });

    downloadBtn.addEventListener('click', () => {
        if (!output.value) run();
        const blob = new Blob([output.value], { type: 'application/javascript;charset=utf-8' });
        download(blob, 'script.min.js');
        announce('Downloaded minified JavaScript.');
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        output.value = '';
        statsBar.replaceChildren();
        feedback.set('');
    });

    run();
}

