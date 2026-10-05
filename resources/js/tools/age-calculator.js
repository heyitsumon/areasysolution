import { mountCalculator } from './calculator-ui';
import { ageOn } from './calculators-core';

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export default function mount(context) {
    mountCalculator(context, {
        title: 'Age Calculator',
        fields: [
            { type: 'date', label: 'Date of birth', value: '2000-01-01' },
            { type: 'date', label: 'Calculate age on', value: localToday },
        ],
        calculate: ([birth, asOf]) => {
            const result = ageOn(birth, asOf);
            return `Age: ${result.years} years, ${result.months} months and ${result.days} days.`;
        },
    });
}
