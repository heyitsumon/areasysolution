import { mountCounter } from './text-tool-shell';
import { analyseText } from './text-tools-core';

/**
 * Character counter.
 *
 * One analysis pass feeds every tile, so typing stays smooth even on a
 * multi-megabyte paste.
 */

export default function mount(context) {
    const analyse = (text) => {
        const a = analyseText(text);
        const minutes = a.words / 200;

        return {
            characters: a.characters.toLocaleString(),
            noSpaces: a.charactersNoSpaces.toLocaleString(),
            words: a.words.toLocaleString(),
            lines: a.lines.toLocaleString(),
            sentences: a.sentences.toLocaleString(),
            paragraphs: a.paragraphs.toLocaleString(),
            average: a.words ? (a.charactersNoSpaces / a.words).toFixed(1) : '0.0',
            reading: minutes < 1 ? `${Math.max(0, Math.round(minutes * 60))} sec` : `${Math.ceil(minutes)} min`,
        };
    };

    mountCounter(context, {
        title: 'Character Counter',
        description: 'Count characters, words, sentences and paragraphs as you type.',
        inputLabel: 'Text to count',
        analyse,
        stats: [
            { key: 'characters', label: 'Characters', hint: 'including spaces' },
            { key: 'noSpaces', label: 'No spaces', hint: 'excluding whitespace' },
            { key: 'words', label: 'Words' },
            { key: 'lines', label: 'Lines' },
            { key: 'sentences', label: 'Sentences' },
            { key: 'paragraphs', label: 'Paragraphs' },
            { key: 'average', label: 'Avg word', hint: 'characters' },
            { key: 'reading', label: 'Reading time', hint: 'at 200 wpm' },
        ],
    });
}
