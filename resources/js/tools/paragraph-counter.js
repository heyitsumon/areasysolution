import { mountCounter } from './text-tool-shell';
import { countWords, splitLines, splitSentences } from './text-tools-core';

/**
 * Paragraph counter.
 *
 * Useful for checking that a draft has the block structure the writer intended
 * - and for spotting a single runaway paragraph that has swallowed the page.
 */

export default function mount(context) {
    const analyse = (text) => {
        const blocks = text.trim() === '' ? [] : text.split(/\n\s*\n/).filter((block) => block.trim() !== '');
        const wordCounts = blocks.map((block) => countWords(block));

        const totalWords = wordCounts.reduce((sum, value) => sum + value, 0);
        const sentenceCount = blocks.reduce((sum, block) => sum + splitSentences(block).length, 0);
        const longest = wordCounts.length ? Math.max(...wordCounts) : 0;

        return {
            paragraphs: blocks.length.toLocaleString(),
            words: totalWords.toLocaleString(),
            average: blocks.length ? (totalWords / blocks.length).toFixed(1) : '0.0',
            averageSentences: blocks.length ? (sentenceCount / blocks.length).toFixed(1) : '0.0',
            longest: longest.toLocaleString(),
            shortest: wordCounts.length ? Math.min(...wordCounts).toLocaleString() : '0',
            lines: splitLines(text).length.toLocaleString(),
            characters: text.length.toLocaleString(),
        };
    };

    mountCounter(context, {
        title: 'Paragraph Counter',
        description: 'Count paragraphs and see how your text is distributed across blocks.',
        inputLabel: 'Text to analyse',
        analyse,
        stats: [
            { key: 'paragraphs', label: 'Paragraphs', hint: 'separated by blank lines' },
            { key: 'words', label: 'Words', hint: 'total' },
            { key: 'average', label: 'Avg length', hint: 'words per paragraph' },
            { key: 'averageSentences', label: 'Avg sentences', hint: 'per paragraph' },
            { key: 'longest', label: 'Longest', hint: 'words' },
            { key: 'shortest', label: 'Shortest', hint: 'words' },
            { key: 'lines', label: 'Lines' },
            { key: 'characters', label: 'Characters', hint: 'including spaces' },
        ],
    });
}
