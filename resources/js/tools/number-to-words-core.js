const SMALL = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];
const MAX_INTEGER = 1_000_000_000_000_000n;

function underThousand(value) {
    const words = [];
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;

    if (hundreds) {
        words.push(`${SMALL[hundreds]} hundred`);
    }

    if (remainder < 20 && remainder > 0) {
        words.push(SMALL[remainder]);
    } else if (remainder >= 20) {
        words.push(`${TENS[Math.floor(remainder / 10)]}${remainder % 10 ? `-${SMALL[remainder % 10]}` : ''}`);
    }

    return words.join(' ');
}

function integerToWords(value) {
    if (value === 0n) {
        return SMALL[0];
    }

    const groups = [];

    for (let scale = 0; value > 0n; scale += 1) {
        const group = Number(value % 1000n);

        if (group) {
            groups.unshift(`${underThousand(group)}${SCALES[scale] ? ` ${SCALES[scale]}` : ''}`);
        }

        value /= 1000n;
    }

    return groups.join(' ');
}

export function numberToWords(input) {
    const trimmed = input.trim();

    if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(trimmed)) {
        throw new Error('Enter a number, optionally using commas for thousands and a decimal point.');
    }

    const negative = trimmed.startsWith('-');
    const unsigned = (negative ? trimmed.slice(1) : trimmed).replaceAll(',', '');
    const [integer, fraction] = unsigned.split('.');

    if (fraction?.length > 30) {
        throw new Error('Decimals can contain up to 30 digits.');
    }

    const whole = BigInt(integer);

    if (whole >= MAX_INTEGER) {
        throw new Error('The largest supported number is 999,999,999,999,999.');
    }

    let result = integerToWords(whole);

    if (fraction) {
        result += ` point ${Array.from(fraction, (digit) => SMALL[Number(digit)]).join(' ')}`;
    }

    if (negative && (whole !== 0n || /[1-9]/.test(fraction ?? ''))) {
        result = `negative ${result}`;
    }

    return result.charAt(0).toLocaleUpperCase() + result.slice(1);
}
