import { node } from '../lib/ui';
import { mountFormOutput } from './form-output-shell';
import { findMatches, replaceMatches } from './regex-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Regex Tester',
        description: 'Test a regular expression against sample text and see every match and capture group.',
        fileName: 'regex-result.txt',
        ready: ({ pattern }) => String(pattern).trim() !== '',
        fields: [
            {
                key: 'pattern',
                label: 'Regular expression',
                type: 'text',
                span: 'full',
                mono: true,
                placeholder: '\\b([A-Z][a-z]+)\\b',
                hint: 'Enter the pattern only - delimiters are not needed.',
            },
            {
                key: 'flags',
                label: 'Flags',
                type: 'text',
                mono: true,
                value: 'g',
                placeholder: 'gi',
                hint: 'g = global, i = ignore case, m = multiline, s = dot matches newline, u = unicode, y = sticky.',
            },
            {
                key: 'input',
                label: 'Test string',
                type: 'textarea',
                rows: 7,
                span: 'full',
                mono: true,
                placeholder: 'Paste text here to try your pattern against.',
            },
            {
                key: 'replacement',
                label: 'Replacement (optional)',
                type: 'text',
                span: 'full',
                mono: true,
                placeholder: '[$1]',
                hint: 'Use $1, $2 for capture groups. Without the g flag only the first match is replaced.',
            },
        ],
        build: ({ pattern, flags, input, replacement }) => {
            const found = findMatches(String(pattern), String(flags), String(input));

            if (! found.ok) {
                throw new Error(found.error);
            }

            const replaced = replaceMatches(String(pattern), String(flags), String(input), String(replacement));

            const preview = node(`
                <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-4 py-2.5 font-semibold">#</th>
                                <th class="px-4 py-2.5 font-semibold">Match</th>
                                <th class="px-4 py-2.5 font-semibold">Index</th>
                                <th class="px-4 py-2.5 font-semibold">Groups</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            `);

            const body = preview.querySelector('tbody');

            if (found.matches.length === 0) {
                const row = node('<tr class="border-t border-slate-100"></tr>');
                const cell = node('<td colspan="4" class="px-4 py-4 text-sm text-slate-500"></td>');

                cell.textContent = 'No matches yet.';
                row.append(cell);
                body.append(row);
            } else {
                found.matches.slice(0, 200).forEach((entry, position) => {
                    const row = node('<tr class="border-t border-slate-100"></tr>');

                    [String(position + 1), entry.match, String(entry.index), entry.groups.length ? entry.groups.join(' | ') : '—']
                        .forEach((value) => {
                            const cell = node('<td class="max-w-40 truncate px-4 py-2 font-mono text-xs"></td>');

                            cell.textContent = value;
                            row.append(cell);
                        });

                    body.append(row);
                });
            }

            const lines = [
                `Pattern: /${pattern}/${flags}`,
                `Matches: ${found.matches.length}${found.truncated ? ` (capped at ${found.matches.length})` : ''}`,
                '',
                ...found.matches.slice(0, 50).map((entry, position) => `${position + 1}. [${entry.index}] ${entry.match}${entry.groups.length ? `  groups: ${entry.groups.join(', ')}` : ''}`),
            ];

            if (String(replacement) !== '') {
                lines.push('', 'Replaced output:', '', replaced.output);
            }

            return {
                preview,
                text: lines.join('\n'),
                stats: [
                    { label: 'Matches', value: String(found.matches.length) },
                    { label: 'Flags', value: String(flags) || 'none' },
                    { label: 'Input length', value: String(String(input).length) },
                    { label: 'Replaced', value: String(replaced.count) },
                ],
                message: found.matches.length === 0
                    ? 'The pattern is valid but matched nothing in the test string.'
                    : `${found.matches.length} match${found.matches.length === 1 ? '' : 'es'} found.`,
                tone: found.matches.length === 0 ? 'warning' : 'success',
            };
        },
    });
}
