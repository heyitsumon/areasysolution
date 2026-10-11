import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 9;
    input.className = 'field-input font-mono text-xs';
    input.placeholder = 'Paste your list here (one item per line)...';
    input.value = "Apple\nBanana\nOrange\napple\nBanana\nGrape\nOrange\nMango";

    const output = document.createElement('textarea');
    output.rows = 9;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    const caseSensitive = checkbox({
        label: 'Case sensitive matching',
        checked: false,
    });

    const trimWhitespace = checkbox({
        label: 'Trim leading/trailing whitespace',
        checked: true,
    });

    const sortAlphabetical = checkbox({
        label: 'Sort results alphabetically (A–Z)',
        checked: true,
    });

    const removeEmpty = checkbox({
        label: 'Remove empty blank lines',
        checked: true,
    });

    const processBtn = button({ label: 'Remove Duplicates', variant: 'primary' });
    const copyBtn = button({ label: 'Copy Cleaned List' });
    const downloadBtn = button({ label: 'Download .txt' });
    const feedback = status();

    const stats = node('<div class="flex flex-wrap gap-3 text-xs font-semibold"></div>');

    const optionsGrid = node('<div class="grid gap-2 sm:grid-cols-2 mt-3"></div>');
    optionsGrid.append(caseSensitive.el, trimWhitespace.el, sortAlphabetical.el, removeEmpty.el);

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(processBtn, copyBtn, downloadBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Original List</label>'),
        input,
        optionsGrid,
        actions,
        feedback.el,
        stats,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Unique Output</label>'),
        output
    );

    root.append(panel({ title: 'Remove Duplicate Lines', body }));

    function run() {
        const raw = input.value;
        let lines = raw.split('\n');
        const originalCount = lines.length;

        if (trimWhitespace.input.checked) {
            lines = lines.map((l) => l.trim());
        }

        if (removeEmpty.input.checked) {
            lines = lines.filter((l) => l.length > 0);
        }

        const isCaseSensitive = caseSensitive.input.checked;
        const seen = new Set();
        const unique = [];

        for (const line of lines) {
            const key = isCaseSensitive ? line : line.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(line);
            }
        }

        if (sortAlphabetical.input.checked) {
            unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        }

        output.value = unique.join('\n');
        const duplicatesRemoved = originalCount - unique.length;

        stats.innerHTML = `
            <span class="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-slate-700">Total lines: ${originalCount}</span>
            <span class="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800">Unique lines: ${unique.length}</span>
            <span class="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-rose-800">Duplicates removed: ${duplicatesRemoved}</span>
        `;

        feedback.set(`Removed ${duplicatesRemoved} duplicate line(s).`, 'success');
        announce(`Removed ${duplicatesRemoved} duplicates. ${unique.length} unique lines remain.`);
        void complete();
    }

    input.addEventListener('input', run);
    processBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', () => {
        if (!output.value) run();
        copyToClipboard(output.value);
        feedback.set('Copied unique list to clipboard!', 'success');
        announce('Copied list.');
    });

    downloadBtn.addEventListener('click', () => {
        if (!output.value) run();
        const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
        download(blob, 'unique-lines.txt');
        announce('Downloaded cleaned list.');
    });

    run();
}

