import { mountCalculator } from './calculator-ui';
import { loan, money } from './calculators-core';

export default function mount(context) {
    mountCalculator(context, {
        title: 'Loan Payment Calculator',
        fields: [
            { label: 'Loan amount', value: 20000, min: 0, step: 0.01 },
            { label: 'Annual interest rate', value: 6, min: 0, step: 0.01, suffix: '%' },
            { label: 'Loan term', value: 5, min: 0, step: 1, suffix: 'years' },
        ],
        calculate: ([principal, rate, years]) => {
            const result = loan(Number(principal), Number(rate), Number(years));
            return `Estimated monthly payment: ${money(result.monthlyPayment)} · Total paid: ${money(result.totalPaid)} · Total interest: ${money(result.totalInterest)}. Estimate excludes fees, taxes and variable-rate changes.`;
        },
    });
}
