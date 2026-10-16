import { checkbox } from '../lib/controls';
import { node, text as textInput } from '../lib/ui';
import { mountTransform } from './text-tool-shell';
import { findReplace, splitLines } from './text-tools-core';

export default function mount(context) {
    mountTransform(context, {
        title: 'Find and Replace Text',
        description: 'Search for text and replace every occurrence, with optional regular expressions.',
        inputLabel: 'Text to search',
        outputLabel: 'Result',
        fileName: 'replaced.txt',
        buildOptions: () => {
            const find = textInput({ label: 'Find', placeholder: 'Text to search for', mono: true });
            const replace = textInput({ label: 'Replace with', placeholder: 'Leave empty to delete', mono: true });

            const matchCase = checkbox({ label: 'Match case' });
            const wholeWord = checkbox({ label: 'Whole words only' });
            const useRegex = checkbox({ label: 'Regular expression' });

            const row = node('<div class="mt-4 grid gap-3 sm:grid-cols-2"></div>');
            row.append(find.el, replace.el);

            const checks = node('<div class="mt-3 flex flex-wrap gap-4"></div>');
            checks.append(matchCase.el, wholeWord.el, useRegex.el);

            const el = node('<div></div>');
            el.append(row, checks);

            return {
                el,
                read: () => ({
                    find: find.input.value,
                    replace: replace.input.value,
                    matchCase: matchCase.input.checked,
                    wholeWord: wholeWord.input.checked,
                    useRegex: useRegex.input.checked,
                }),
            };
        },
        transform: (source, options) => {
            if (options.find === '') {
                return {
                    output: source,
                    stats: [
                        { label: 'Matches', value: '0' },
                        { label: 'Lines', value: splitLines(source).length.toLocaleString() },
                        { label: 'Characters', value: source.length.toLocaleString() },
                        { label: 'Replacements', value: '0' },
                    ],
                    message: 'Enter something in the Find field to start matching.',
                    tone: 'info',
                };
            }

            const outcome = findReplace(source, options);

            return {
                output: outcome.output,
                stats: [
                    { label: 'Matches', value: outcome.matches.toLocaleString() },
                    { label: 'Lines', value: splitLines(outcome.output).length.toLocaleString() },
                    { label: 'Characters', value: outcome.output.length.toLocaleString() },
                    { label: 'Replaced', value: outcome.matches.toLocaleString() },
                ],
                message: outcome.matches === 0 ? 'No matches found.' : `Replaced ${outcome.matches} occurrence${outcome.matches === 1 ? '' : 's'}.`,
                tone: outcome.matches === 0 ? 'warning' : 'success',
            };
        },
    });
}
