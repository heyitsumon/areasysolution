import { checkbox } from '../lib/controls';
import { node } from '../lib/ui';
import { mountTransform } from './text-tool-shell';
import { removeExtraSpaces, splitLines } from './text-tools-core';

export default function mount(context) {
    mountTransform(context, {
        title: 'Remove Extra Spaces',
        description: 'Clean up repeated spaces, trailing whitespace and excess blank lines.',
        inputLabel: 'Text to clean',
        outputLabel: 'Cleaned text',
        fileName: 'cleaned.txt',
        buildOptions: () => {
            const collapseSpaces = checkbox({ label: 'Collapse repeated spaces into one', checked: true });
            const trimTrailing = checkbox({ label: 'Remove trailing whitespace', checked: true });
            const collapseBlankLines = checkbox({ label: 'Reduce3+ blank lines to one', checked: true });
            const trimEnds = checkbox({ label: 'Trim blank lines at the ends', checked: true });

            const el = node('<div class="mt-4 grid gap-3 sm:grid-cols-2"></div>');

            el.append(collapseSpaces.el, trimTrailing.el, collapseBlankLines.el, trimEnds.el);

            return {
                el,
                read: () => ({
                    collapseSpaces: collapseSpaces.input.checked,
                    trimTrailing: trimTrailing.input.checked,
                    collapseBlankLines: collapseBlankLines.input.checked,
                    trimEnds: trimEnds.input.checked,
                }),
            };
        },
        transform: (source, options) => {
            const output = removeExtraSpaces(source, options);
            const saved = source.length - output.length;

            return {
                output,
                stats: [
                    { label: 'Before', value: source.length.toLocaleString() },
                    { label: 'After', value: output.length.toLocaleString() },
                    { label: 'Saved', value: Math.max(0, saved).toLocaleString() },
                    { label: 'Lines', value: splitLines(output).length.toLocaleString() },
                ],
                message: saved > 0 ? `Removed ${saved} character${saved === 1 ? '' : 's'}.` : 'Already tidy - nothing to remove.',
                tone: saved > 0 ? 'success' : 'info',
            };
        },
    });
}
