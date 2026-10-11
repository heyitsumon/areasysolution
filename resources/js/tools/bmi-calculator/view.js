export const view = {
    title: 'BMI Calculator',
    fields: [
        { label: 'Weight', value: 70, min: 0, step: 0.1, suffix: 'kg' },
        { label: 'Height', value: 175, min: 0, step: 0.1, suffix: 'cm' },
    ],
    format(result) {
        return `BMI: ${result.value.toFixed(1)} — ${result.category}. BMI is a general screening measure, not a medical diagnosis.`;
    },
};
