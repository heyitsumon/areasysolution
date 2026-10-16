import { checkbox } from '../lib/controls';
import { node, select } from '../lib/ui';
import { mountTransform } from './text-tool-shell';
import { sortLines, splitLines } from './text-tools-core';

export default function mount(context) {
    mountTransform(context, {
        title: 'Text Sorter',
        description: 'Sort lines alphabetically, optionally ignoring case and dropping duplicates.',
        inputLabel: 'Lines to sort',
        outputLabel: 'Sorted lines',
        fileName: 'sorted.txt',
        buildOptions: () => {
            const order = select({
                label: 'Sort order',
                options: [
                    { value: 'asc', label: 'A → Z (ascending)' },
                    { value: 'desc', label: 'Z → A (descending)' },
                ],
                value: 'asc',
            });

            const ignoreCase = checkbox({ label: 'Ignore capitalisation', checked: true });
            const unique = checkbox({ label: 'Remove duplicate lines', checked: false });

            const checks = node('<div class="mt-3 flex flex-wrap gap-4"></div>');
            checks.append(ignoreCase.el, unique.el);

            const el = node('<div class="mt-4"></div>');
            el.append(order.el, checks);

            return {
                el,
                read: () => ({
                    order: order.select.value,
                    ignoreCase: ignoreCase.input.checked,
                    unique: unique.input.checked,
                }),
            };
        },
        transform: (source, options) => {
            const output = sortLines(source, options);
            const before = splitLines(source);
            const after = splitLines(output);
            const removed = before.length - after.length;

            return {
                output,
                stats: [
                    { label: 'Lines in', value: before.length.toLocaleString() },
                    { label: 'Lines out', value: after.length.toLocaleString() },
                    { label: 'Duplicates removed', value: Math.max(0, removed).toLocaleString() },
                    { label: 'Longest line', value: Math.max(0, ...after.map((line) => line.length)).toLocaleString() },
                ],
                message: `Sorted ${after.length} line${after.length === 1 ? '' : 's'}.`,
                tone: 'success',
            };
        },
    });
}
