import { mountCalculator } from './calculator-ui';
import { bmi } from './calculators-core';

export default function mount(context) {
    mountCalculator(context, {
        title: 'BMI Calculator',
        fields: [
            { label: 'Weight', value: 70, min: 0, step: 0.1, suffix: 'kg' },
            { label: 'Height', value: 175, min: 0, step: 0.1, suffix: 'cm' },
        ],
        calculate: ([weight, height]) => {
            const result = bmi(Number(weight), Number(height));
            return `BMI: ${result.value.toFixed(1)} — ${result.category}. BMI is a general screening measure, not a medical diagnosis.`;
        },
    });
}
