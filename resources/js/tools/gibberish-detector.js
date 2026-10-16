import { mountFormOutput } from './form-output-shell';

const VOWELS = /[aeiouy]+/gi;
const DOUBLE_LETTERS = /(.)\1/;
const COMMON_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'is', 'was',
]);

/**
 * Very lightweight readability/gibberish scoring:
 *  - word-likeness: share of words with a vowel and no absurd consonant runs
 *  - dictionary-likeness: share of common English words
 *  - repeated-letter penalty
 */
function wordLooksReal(word) {
    if (word.length <= 2) return true;
    if (!VOWELS.test(word)) return false;
    VOWELS.lastIndex = 0;
    if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(word)) return false;
    if (DOUBLE_LETTERS.test(word) && word.length < 5) return false;
    return true;
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Gibberish detector',
        description: 'Paste any text to score how human-readable it is and flag lines that look like random noise.',
        fileName: 'gibberish-report.txt',
        fields: [
            {
                key: 'text',
                label: 'Text to analyze',
                type: 'textarea',
                rows: 10,
                span: 'full',
                placeholder: 'Paste text here\u2026 e.g. "The quick brown fox" vs "xkqjzz vvbb qwrt lpmmn"',
            },
        ],
        build: (values) => {
            const text = String(values.text);
            if (text.trim() === '') {
                return { text: '', message: 'Paste some text to analyze.', tone: 'info' };
            }
            const lines = text.split(/\r?\n/);
            const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
            if (words.length === 0) {
                return { text: 'No alphabetic words found.', message: 'Nothing to analyze - the text has no words.', tone: 'warning' };
            }
            const realWords = words.filter(wordLooksReal);
            const commonWords = words.filter((w) => COMMON_WORDS.has(w));
            const score = Math.round((realWords.length / words.length) * 100);
            const commonScore = Math.round((commonWords.length / words.length) * 100);
            const suspicious = lines
                .map((line, i) => {
                    const lineWords = line.toLowerCase().match(/[a-z']+/g) ?? [];
                    const real = lineWords.filter(wordLooksReal).length;
                    const ratio = lineWords.length > 0 ? real / lineWords.length : 1;
                    return { line: i + 1, ratio, text: line.trim().slice(0, 80) };
                })
                .filter((l) => l.ratio < 0.5 && l.text !== '');
            const verdict = score >= 80 ? 'Looks like real language' : score >= 50 ? 'Mixed - partly readable' : 'Mostly gibberish';
            const report = [
                `Verdict: ${verdict}`,
                `Readable words: ${realWords.length}/${words.length} (${score}%)`,
                `Common English words: ${commonScore}%`,
                suspicious.length > 0
                    ? `Suspicious lines (${suspicious.length}):\n${suspicious.map((l) => `  line ${l.line}: ${l.text}`).join('\n')}`
                    : 'No suspicious lines detected.',
            ];
            return {
                text: report.join('\n'),
                stats: [
                    { label: 'Verdict', value: verdict },
                    { label: 'Readable', value: `${score}%` },
                    { label: 'Words', value: String(words.length) },
                    { label: 'Flagged lines', value: String(suspicious.length) },
                ],
                message: 'Scores are heuristic - useful for filtering junk input, spam comments or corrupted exports.',
                tone: score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error',
            };
        },
    });
}
