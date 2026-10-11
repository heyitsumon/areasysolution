const money = (value) => Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const view = {
    title: 'Percentage Calculator',
    fields: [
        {
            type: 'select',
            label: 'Calculation',
            value: 'of',
            options: [
                { value: 'of', label: 'What is X% of Y?' },
                { value: 'is', label: 'X is what percent of Y?' },
                { value: 'change', label: 'Percentage change from X to Y' },
            ],
        },
        { label: 'X / percentage', value: 15, step: 0.01 },
        { label: 'Y / comparison value', value: 200, step: 0.01 },
    ],
    format({ mode, first, second, value }) {
        return mode === 'of' ? `${money(first)}% of ${money(second)} = ${money(value)}`
            : mode === 'is' ? `${money(first)} is ${money(value)}% of ${money(second)}`
                : `${value >= 0 ? 'Increase' : 'Decrease'}: ${money(Math.abs(value))}%`;
    },
};
