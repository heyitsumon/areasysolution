const money = (value) => Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const view = {
    title: 'Loan Payment Calculator',
    fields: [
        { label: 'Loan amount', value: 20000, min: 0, step: 0.01 },
        { label: 'Annual interest rate', value: 6, min: 0, step: 0.01, suffix: '%' },
        { label: 'Loan term', value: 5, min: 0, step: 1, suffix: 'years' },
    ],
    format(result) {
        return `Estimated monthly payment: ${money(result.monthlyPayment)} · Total paid: ${money(result.totalPaid)} · Total interest: ${money(result.totalInterest)}. Estimate excludes fees, taxes and variable-rate changes.`;
    },
};
