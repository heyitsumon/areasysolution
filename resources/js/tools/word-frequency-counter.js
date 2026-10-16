import { mountFormOutput } from './form-output-shell';

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to',
    'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we',
    'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which',
    'who', 'will', 'would', 'can', 'could', 'should', 'do', 'does', 'did', 'have', 'has', 'had', 'not',
    'no', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'from', 'up', 'down', 'out', 'over', 'under',
]);

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Word frequency counter',
        description: 'Paste text to see which words appear most often, with optional stop-word filtering and a table output.',
        fileName: 'word-frequency.txt',
        fields: [
            { key: 'text', label: 'Text to analyze', type: 'textarea', rows: 10, span: 'full', placeholder: 'Paste your article, essay or report here\u2026' },
            { key: 'top', label: 'Show top N words', type: 'number', value: 25, min: 1, max: 200, step: 1 },
            { key: 'excludeStopWords', label: 'Exclude common stop words (the, and, of\u2026)', type: 'checkbox', value: true },
            { key: 'minLength', label: 'Minimum word length', type: 'number', value: 1, min: 1, max: 20, step: 1 },
        ],
        build: (values) => {
            const text = String(values.text);
            if (text.trim() === '') {
                return { text: '', message: 'Paste some text to analyze.', tone: 'info' };
            }
            const words = text.toLowerCase().match(/[a-z\u00C0-\u024F']+/g) ?? [];
            if (words.length === 0) {
                return { text: 'No words found.', message: 'The text contains no alphabetic words.', tone: 'warning' };
            }
            const minLength = Math.max(1, Math.round(Number(values.minLength) || 1));
            const topN = Math.max(1, Math.min(200, Math.round(Number(values.top) || 25)));
            const counts = new Map();
            let filtered = 0;
            for (const word of words) {
                if (word.length < minLength) continue;
                if (values.excludeStopWords && STOP_WORDS.has(word)) {
                    filtered += 1;
                    continue;
                }
                counts.set(word, (counts.get(word) ?? 0) + 1);
            }
            const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
            const shown = sorted.slice(0, topN);
            const maxCount = shown[0]?.[1] ?? 1;
            const uniqueWords = counts.size;
            const table = shown
                .map(([word, count]) => {
                    const bar = '\u2588'.repeat(Math.max(1, Math.round((count / maxCount) * 30)));
                    return `${String(count).padStart(5)}  ${bar}  ${word}`;
                });
            const lines = [
                `Total words: ${words.length.toLocaleString()}  |  Unique: ${uniqueWords.toLocaleString()}`,
                values.excludeStopWords ? `Stop words excluded: ${filtered.toLocaleString()}` : 'Stop words included',
                '',
                `Top ${shown.length} words:`,
                ...table,
            ];
            const density = ((sorted[0]?.[1] ?? 0) / words.length) * 100;
            return {
                text: lines.join('\n'),
                stats: [
                    { label: 'Total words', value: words.length.toLocaleString() },
                    { label: 'Unique', value: uniqueWords.toLocaleString() },
                    { label: 'Top word', value: sorted[0] ? `${sorted[0][0]} (${sorted[0][1]})` : '-' },
                    { label: 'Top-word density', value: `${density.toFixed(1)}%` },
                ],
                message: density > 5 ? 'The top word exceeds 5% density - vary your vocabulary if this is SEO content.' : 'Word distribution looks natural.',
                tone: 'success',
            };
        },
    });
}
