import { checkbox } from '../lib/controls';
import { escapeHtml } from '../lib/dom';
import { node, panel } from '../lib/ui';

export default function mount({ root, announce, complete }) {
    const input = document.createElement('textarea');
    input.rows = 7;
    input.className = 'field-input font-mono text-sm';
    input.placeholder = 'Type or paste text to analyze character frequency...';
    input.value = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";

    const caseSensitive = checkbox({
        label: 'Case sensitive analysis',
        checked: false,
    });

    const ignoreWhitespace = checkbox({
        label: 'Ignore spaces and line breaks',
        checked: true,
    });

    const statsOverview = node('<div class="grid grid-cols-2 gap-3 sm:grid-cols-4"></div>');
    const tableContainer = node('<div class="rounded-xl border border-slate-200 bg-white overflow-hidden max-h-96 overflow-y-auto"></div>');

    const optionsGrid = node('<div class="grid gap-2 sm:grid-cols-2 mt-2"></div>');
    optionsGrid.append(caseSensitive.el, ignoreWhitespace.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-xs font-bold uppercase text-slate-500">Input Text</label>'),
        input,
        optionsGrid,
        statsOverview,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Character Frequency Table</h3>'),
        tableContainer
    );

    root.append(panel({ title: 'Character Frequency Counter', body }));

    function analyze() {
        let text = input.value;
        const totalRaw = text.length;

        if (!caseSensitive.input.checked) {
            text = text.toLowerCase();
        }

        if (ignoreWhitespace.input.checked) {
            text = text.replace(/\s+/g, '');
        }

        const counts = new Map();
        for (const char of text) {
            counts.set(char, (counts.get(char) || 0) + 1);
        }

        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        const analyzedLength = text.length;

        statsOverview.innerHTML = `
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                <p class="text-xs font-semibold text-slate-500 uppercase">Total Chars</p>
                <p class="text-xl font-bold text-slate-900 mt-1">${totalRaw}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                <p class="text-xs font-semibold text-slate-500 uppercase">Analyzed Chars</p>
                <p class="text-xl font-bold text-slate-900 mt-1">${analyzedLength}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                <p class="text-xs font-semibold text-slate-500 uppercase">Unique Chars</p>
                <p class="text-xl font-bold text-indigo-700 mt-1">${sorted.length}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                <p class="text-xs font-semibold text-slate-500 uppercase">Top Character</p>
                <p class="text-xl font-bold text-emerald-700 mt-1">${sorted[0] ? `'${escapeHtml(sorted[0][0])}'` : '-'}</p>
            </div>
        `;

        let tableHtml = `
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                        <th class="p-2.5">Character</th>
                        <th class="p-2.5">Count</th>
                        <th class="p-2.5">Frequency</th>
                        <th class="p-2.5 w-1/3">Visual Bar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
        `;

        sorted.forEach(([char, count]) => {
            const pct = analyzedLength > 0 ? ((count / analyzedLength) * 100).toFixed(1) : '0';
            const displayChar = char === ' ' ? '<span class="text-slate-400">[space]</span>' : (char === '\t' ? '<span class="text-slate-400">[tab]</span>' : escapeHtml(char));

            tableHtml += `
                <tr class="hover:bg-slate-50/80">
                    <td class="p-2.5 font-mono font-bold text-slate-900">${displayChar}</td>
                    <td class="p-2.5 font-mono text-slate-700">${count}</td>
                    <td class="p-2.5 font-mono text-slate-500">${pct}%</td>
                    <td class="p-2.5">
                        <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div class="h-full bg-indigo-600 rounded-full" style="width: ${pct}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        tableContainer.innerHTML = tableHtml;

        if (totalRaw > 0) {
            void complete();
        }
    }

    input.addEventListener('input', analyze);
    caseSensitive.input.addEventListener('change', analyze);
    ignoreWhitespace.input.addEventListener('change', analyze);

    analyze();
}

