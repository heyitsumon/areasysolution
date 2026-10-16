import { node } from '../lib/ui';
import { mountFormOutput } from './form-output-shell';
import { keywordDensity } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Keyword Density Checker',
        description: 'Measure how often a keyword appears and see your most frequent meaningful terms.',
        fileName: 'keyword-density.txt',
        ready: ({ text, keyword }) => String(text).trim() !== '' || String(keyword).trim() !== '',
        fields: [
            { key: 'text', label: 'Page text', type: 'textarea', rows: 8, span: 'full', placeholder: 'Paste the body copy of your page here.' },
            {
                key: 'keyword',
                label: 'Focus keyword (optional)',
                type: 'text',
                span: 'full',
                placeholder: 'e.g. pdf compressor',
                hint: 'Leave empty to just see the most frequent terms.',
            },
        ],
        build: ({ text, keyword }) => {
            const result = keywordDensity(String(text));

            const rows = document.createElement('tbody');

            result.top.forEach((entry) => {
                const row = node('<tr class="border-t border-slate-100"></tr>');
                const word = node('<td class="py-2 pr-4 font-medium text-slate-900"></td>');
                const count = node('<td class="py-2 pr-4 text-right tabular-nums text-slate-600"></td>');
                const share = node('<td class="py-2 text-right tabular-nums text-slate-600"></td>');

                word.textContent = entry.word;
                count.textContent = String(entry.count);
                share.textContent = `${entry.density.toFixed(2)}%`;

                row.append(word, count, share);
                rows.append(row);
            });

            const preview = node(`
                <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-4 py-2.5 font-semibold">Term</th>
                                <th class="px-4 py-2.5 text-right font-semibold">Count</th>
                                <th class="px-4 py-2.5 text-right font-semibold">Density</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            `);

            preview.querySelector('table').append(rows);

            if (result.top.length === 0) {
                const row = node('<tr class="border-t border-slate-100"></tr>');
                const cell = node('<td colspan="3" class="px-4 py-4 text-sm text-slate-500"></td>');

                cell.textContent = 'Paste some text to see its most frequent terms.';

                row.append(cell);
                rows.replaceChildren(row);
            }

            const lines = [
                `Total words: ${result.totalWords}`,
                `Unique words: ${result.uniqueWords}`,
                '',
                'Top terms:',
                ...result.top.map((entry) => `  ${entry.word}: ${entry.count} (${entry.density.toFixed(2)}%)`),
            ];

            if (result.focus) {
                lines.push(
                    '',
                    `Focus keyword: "${result.focus.keyword}"`,
                    `Occurrences: ${result.focus.count}`,
                    `Density: ${result.focus.density.toFixed(2)}%`,
                    result.focus.suggestion,
                );
            }

            const message = result.focus
                ? result.focus.suggestion
                : (result.totalWords === 0 ? 'Paste some text to begin.' : `Analysed ${result.totalWords} words.`);

            return {
                preview,
                text: lines.join('\n'),
                stats: [
                    { label: 'Words', value: String(result.totalWords) },
                    { label: 'Unique', value: String(result.uniqueWords) },
                    { label: 'Focus density', value: result.focus ? `${result.focus.density.toFixed(2)}%` : '—' },
                    { label: 'Focus count', value: result.focus ? String(result.focus.count) : '—' },
                ],
                message,
                tone: result.focus && result.focus.density > 3 ? 'warning' : 'success',
            };
        },
    });
}
