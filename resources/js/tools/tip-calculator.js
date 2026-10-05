import { mountCalculator } from './calculator-ui';
import { money, tip } from './calculators-core';

export default function mount(context) {
    mountCalculator(context, {
        title: 'Tip Calculator',
        fields: [
            { label: 'Bill amount', value: 50, min: 0, step: 0.01 },
            { label: 'Tip percentage', value: 15, min: 0, step: 0.1, suffix: '%' },
            { label: 'Number of people', value: 1, min: 1, step: 1 },
        ],
        calculate: ([bill, rate, people]) => {
            const result = tip(Number(bill), Number(rate), Number(people));
            return `Tip: ${money(result.tipAmount)} · Total: ${money(result.total)} · Per person: ${money(result.perPerson)} (in the same currency as your bill)`;
        },
    });
}
