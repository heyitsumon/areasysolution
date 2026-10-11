export function calculatePercentage([mode, firstValue, secondValue]) {
    const first = Number(firstValue);
    const second = Number(secondValue);

    if (!Number.isFinite(first) || !Number.isFinite(second)) {
        throw new Error('Enter valid numbers in both fields.');
    }

    if (mode === 'of') return { mode, first, second, value: first * second / 100 };
    if (mode === 'is') {
        if (second === 0) throw new Error('The second number must not be zero.');
        return { mode, first, second, value: first / second * 100 };
    }
    if (mode === 'change') {
        if (first === 0) throw new Error('The starting value must not be zero.');
        return { mode, first, second, value: (second - first) / Math.abs(first) * 100 };
    }

    throw new Error('Choose a valid percentage calculation.');
}
