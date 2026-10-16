import { mountCounter } from './text-tool-shell';
import { countWords, splitLines, splitSentences } from './text-tools-core';

/**
 * Sentence counter.
 *
 * Beyond the raw count, the interesting numbers for a writer are the shape of
 * the prose: average sentence length, and the outliers at both ends.
 */

export default function mount(context) {
    const analyse = (text) => {
        const sentences = splitSentences(text);
        const lengths = sentences.map((sentence) => countWords(sentence));
        const total = lengths.length;

        const longest = total ? Math.max(...lengths) : 0;
        const shortest = total ? Math.min(...lengths) : 0;
        const words = lengths.reduce((sum, value) => sum + value, 0);
        const speaking = words / 130;

        return {
            sentences: total.toLocaleString(),
            words: words.toLocaleString(),
            average: total ? (words / total).toFixed(1) : '0.0',
            longest: longest.toLocaleString(),
            shortest: shortest.toLocaleString(),
            paragraphs: text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter((block) => block.trim() !== '').length,
            lines: splitLines(text).length.toLocaleString(),
            speaking: total === 0 ? '0 sec' : (speaking < 1 ? `${Math.max(1, Math.round(speaking * 60))} sec` : `${Math.ceil(speaking)} min`),
        };
    };

    mountCounter(context, {
        title: 'Sentence Counter',
        description: 'Count sentences and see the rhythm of your writing at a glance.',
        inputLabel: 'Text to analyse',
        analyse,
        stats: [
            { key: 'sentences', label: 'Sentences' },
            { key: 'words', label: 'Words', hint: 'in sentences' },
            { key: 'average', label: 'Avg length', hint: 'words per sentence' },
            { key: 'longest', label: 'Longest', hint: 'words' },
            { key: 'shortest', label: 'Shortest', hint: 'words' },
            { key: 'paragraphs', label: 'Paragraphs' },
            { key: 'lines', label: 'Lines' },
            { key: 'speaking', label: 'Speaking time', hint: 'at 130 wpm' },
        ],
    });
}
