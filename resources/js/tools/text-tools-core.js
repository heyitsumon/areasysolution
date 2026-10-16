/**
 * Pure string helpers shared by the text tools.
 *
 * Nothing here touches the DOM, which is what makes the whole family testable
 * in Node without a browser and safe to run on every keystroke.
 */

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

/**
 * Split any mix of CR, LF and CRLF into lines without inventing empty ones.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitLines(text) {
    if (text === '') {
        return [];
    }

    return text.split(/\r\n|\r|\n/);
}

/**
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
    return (text.match(WORD_PATTERN) ?? []).length;
}

/**
 * Sentences are counted on trimmed text so a trailing newline does not become
 * a phantom sentence, and an untidy block without terminal punctuation still
 * counts once rather than disappearing.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
    const trimmed = text.trim();

    if (trimmed === '') {
        return [];
    }

    const matches = trimmed.match(/[^.!?…]+[.!?…]+(?=\s|$)|[^.!?…]+$/gu) ?? [];

    return matches.map((part) => part.trim()).filter((part) => part !== '');
}

/**
 * @param {string} text
 * @returns {number}
 */
export function countSentences(text) {
    return splitSentences(text).length;
}

/**
 * @param {string} text
 * @returns {number}
 */
export function countParagraphs(text) {
    if (text.trim() === '') {
        return 0;
    }

    return text.split(/\n\s*\n/).filter((block) => block.trim() !== '').length;
}

/**
 * @param {string} text
 * @returns {{characters: number, charactersNoSpaces: number, words: number, sentences: number, paragraphs: number, lines: number}}
 */
export function analyseText(text) {
    return {
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/gu, '').length,
        words: countWords(text),
        sentences: countSentences(text),
        paragraphs: countParagraphs(text),
        lines: splitLines(text).length,
    };
}

/**
 * Collapse repeated spaces inside a line while leaving indentation intact,
 * drop trailing whitespace, and reduce runs of blank lines to a single one.
 *
 * Each step can be switched off, so the tool can be as gentle or as aggressive
 * as the text requires.
 *
 * @param {string} text
 * @param {{collapseSpaces?: boolean, trimTrailing?: boolean, collapseBlankLines?: boolean, trimEnds?: boolean}} [options]
 * @returns {string}
 */
export function removeExtraSpaces(text, { collapseSpaces = true, trimTrailing = true, collapseBlankLines = true, trimEnds = true } = {}) {
    const cleaned = splitLines(text)
        .map((line) => {
            const indent = (line.match(/^[ \t]*/) ?? [''])[0];
            let rest = line.slice(indent.length);

            if (collapseSpaces) {
                rest = rest.replace(/[ \t]+/g, ' ');
            }

            if (trimTrailing) {
                rest = rest.replace(/[ \t]+$/, '');
            }

            return indent + rest;
        })
        .join('\n');

    const withoutBlankRuns = collapseBlankLines ? cleaned.replace(/\n{3,}/g, '\n\n') : cleaned;

    return trimEnds ? withoutBlankRuns.replace(/^\n+|\n+$/g, '') : withoutBlankRuns;
}

/**
 * @param {string} text
 * @param {{order?: 'asc'|'desc', ignoreCase?: boolean, unique?: boolean}} [options]
 * @returns {string}
 */
export function sortLines(text, { order = 'asc', ignoreCase = true, unique = false } = {}) {
    let lines = splitLines(text);

    if (unique) {
        const seen = new Set();

        lines = lines.filter((line) => {
            const key = ignoreCase ? line.toLowerCase() : line;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
    }

    /*
     * `numeric: true` puts "item2" before "item10", which is what anybody
     * sorting a list of versions or numbered steps actually expects.
     */
    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: ignoreCase ? 'base' : 'variant',
    });

    lines.sort((a, b) => collator.compare(a, b));

    if (order === 'desc') {
        lines.reverse();
    }

    return lines.join('\n');
}

/**
 * @param {string} text
 * @param {{find?: string, replace?: string, matchCase?: boolean, wholeWord?: boolean, useRegex?: boolean}} [options]
 * @returns {{output: string, matches: number}}
 */
export function findReplace(text, { find = '', replace = '', matchCase = false, wholeWord = false, useRegex = false } = {}) {
    if (find === '') {
        return { output: text, matches: 0 };
    }

    const flags = matchCase ? 'g' : 'gi';
    let source;

    if (useRegex) {
        source = find;
    } else {
        source = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (wholeWord) {
            source = `\\b(?:${source})\\b`;
        }
    }

    /* Invalid regular expressions are reported by the caller as a friendly message. */
    const pattern = new RegExp(source, flags);
    const matches = text.match(pattern)?.length ?? 0;

    return { output: text.replace(pattern, replace), matches };
}

/**
 * Reverse text in one of four ways. Array spreading is used rather than
 * `.split('')` so astral characters (emoji, some CJK) stay intact.
 *
 * @param {string} text
 * @param {'characters'|'letters'|'wordOrder'|'lines'} [mode]
 * @returns {string}
 */
export function reverseText(text, mode = 'characters') {
    if (mode === 'lines') {
        return splitLines(text).reverse().join('\n');
    }

    if (mode === 'wordOrder') {
        return text.split(/(\s+)/).reverse().join('');
    }

    if (mode === 'letters') {
        return text
            .split(/(\s+)/)
            .map((token) => (/^\s+$/.test(token) ? token : [...token].reverse().join('')))
            .join('');
    }

    return [...text].reverse().join('');
}
