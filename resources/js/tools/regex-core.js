/**
 * Regular-expression engine wrapper used by the Regex Tester.
 *
 * Kept free of DOM imports so the matching behaviour can be unit tested, and
 * so a bad pattern can never take the page down - every failure surfaces as a
 * message rather than an uncaught exception.
 */

const MAX_MATCHES = 10000;

const AVAILABLE_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'];

/**
 * @param {string} flags
 * @returns {string}
 */
export function normaliseFlags(flags) {
    const unique = Array.from(new Set(String(flags ?? '').split(''))).filter((flag) => AVAILABLE_FLAGS.includes(flag));

    return unique.join('');
}

/**
 * @param {string} pattern
 * @param {string} flags
 * @returns {{ok: true, regex: RegExp} | {ok: false, error: string}}
 */
export function compileRegex(pattern, flags = '') {
    if (pattern === '') {
        return { ok: false, error: 'Enter a regular expression to test.' };
    }

    try {
        return { ok: true, regex: new RegExp(pattern, normaliseFlags(flags)) };
    } catch (error) {
        return { ok: false, error: `Invalid pattern: ${error?.message ?? 'unknown error'}` };
    }
}

/**
 * Collect every match.
 *
 * A scanning clone with the `g` flag is always used so the visitor sees all
 * occurrences even when they left `g` off - otherwise a non-global pattern
 * would report "1 match" forever, which is technically right and practically
 * useless. Zero-length matches (from `a*`, for instance) advance `lastIndex`
 * by hand, since the engine will not.
 *
 * @param {string} pattern
 * @param {string} flags
 * @param {string} input
 * @returns {{ok: boolean, error?: string, matches: Array<{index: number, match: string, groups: string[]}>, truncated?: boolean}}
 */
export function findMatches(pattern, flags, input) {
    const compiled = compileRegex(pattern, flags);

    if (! compiled.ok) {
        return { ok: false, error: compiled.error, matches: [] };
    }

    const scanner = new RegExp(compiled.regex.source, normaliseFlags(flags).includes('g') ? normaliseFlags(flags) : `${normaliseFlags(flags)}g`);
    const matches = [];
    let truncated = false;

    let match = scanner.exec(input);

    while (match !== null) {
        if (matches.length >= MAX_MATCHES) {
            truncated = true;
            break;
        }

        matches.push({
            index: match.index,
            match: match[0],
            groups: match.slice(1).map((group) => group ?? ''),
        });

        if (match[0] === '') {
            scanner.lastIndex += 1;
        }

        match = scanner.exec(input);
    }

    return { ok: true, matches, truncated };
}

/**
 * @param {string} pattern
 * @param {string} flags
 * @param {string} input
 * @param {string} replacement
 * @returns {{ok: boolean, error?: string, output: string, count: number}}
 */
export function replaceMatches(pattern, flags, input, replacement) {
    const compiled = compileRegex(pattern, flags);

    if (! compiled.ok) {
        return { ok: false, error: compiled.error, output: input, count: 0 };
    }

    const found = findMatches(pattern, flags, input);

    if (! found.ok) {
        return { ok: false, error: found.error, output: input, count: 0 };
    }

    return {
        ok: true,
        output: input.replace(compiled.regex, replacement),
        count: normaliseFlags(flags).includes('g') ? found.matches.length : Math.min(1, found.matches.length),
    };
}
