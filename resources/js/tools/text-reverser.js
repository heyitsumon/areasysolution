import { select } from '../lib/ui';
import { node } from '../lib/ui';
import { mountTransform } from './text-tool-shell';
import { reverseText, splitLines } from './text-tools-core';

const MODES = [
    { value: 'characters', label: 'Reverse characters (abcdef → fedcba)' },
    { value: 'letters', label: 'Reverse letters in each word (expert → tcrepe)' },
    { value: 'wordOrder', label: 'Reverse the order of words' },
    { value: 'lines', label: 'Reverse the order of lines' },
];

export default function mount(context) {
    mountTransform(context, {
        title: 'Text Reverser',
        description: 'Reverse characters, words or lines while keeping emoji and other special characters intact.',
        inputLabel: 'Text to reverse',
        outputLabel: 'Reversed text',
        fileName: 'reversed.txt',
        buildOptions: () => {
            const mode = select({ label: 'Reverse mode', options: MODES, value: 'characters' });
            const el = node('<div class="mt-4"></div>');

            el.append(mode.el);

            return { el, read: () => ({ mode: mode.select.value }) };
        },
        transform: (source, options) => {
            const output = reverseText(source, options.mode);
            const words = source.trim() === '' ? 0 : source.trim().split(/\s+/).length;

            return {
                output,
                stats: [
                    { label: 'Characters in', value: source.length.toLocaleString() },
                    { label: 'Characters out', value: output.length.toLocaleString() },
                    { label: 'Words', value: words.toLocaleString() },
                    { label: 'Lines', value: splitLines(output).length.toLocaleString() },
                ],
                message: 'Text reversed.',
                tone: 'success',
            };
        },
    });
}
