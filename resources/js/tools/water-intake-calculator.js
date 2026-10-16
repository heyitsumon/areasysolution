import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Water intake calculator',
        description: 'Enter your weight, activity time and climate to get how much water to drink per day.',
        fileName: 'water-intake.txt',
        fields: [
            { key: 'weight', label: 'Body weight', type: 'number', value: 70, min: 1, step: 0.1 },
            {
                key: 'unit',
                label: 'Weight unit',
                type: 'select',
                value: 'kg',
                options: [{ value: 'kg', label: 'Kilograms (kg)' }, { value: 'lb', label: 'Pounds (lb)' }],
            },
            { key: 'exercise', label: 'Daily exercise', type: 'number', value: 30, min: 0, step: 5, suffix: 'minutes' },
            {
                key: 'climate',
                label: 'Climate',
                type: 'select',
                value: 'temperate',
                options: [
                    { value: 'cold', label: 'Cold' },
                    { value: 'temperate', label: 'Temperate' },
                    { value: 'hot', label: 'Hot / humid' },
                ],
            },
        ],
        build: (values) => {
            const weight = Number(values.weight);
            const exercise = Math.max(0, Number(values.exercise) || 0);
            if (!Number.isFinite(weight) || weight <= 0) {
                return { text: '', message: 'Enter a body weight greater than zero.', tone: 'warning' };
            }
            const kg = values.unit === 'lb' ? weight * 0.453592 : weight;
            const base = kg * 0.033; // 33 ml per kg is the common baseline
            const exerciseBonus = (exercise / 30) * 0.35; // ~350 ml per half hour
            const climateBonus = values.climate === 'hot' ? 0.5 : values.climate === 'cold' ? -0.1 : 0;
            const liters = Math.max(1, base + exerciseBonus + climateBonus);
            const cups = Math.round((liters * 1000) / 250);
            const glasses8oz = Math.round(liters / 0.2366);
            return {
                text: [
                    `Recommended daily water: ${liters.toFixed(1)} liters`,
                    `= ${cups} cups (250 ml)  |  ${glasses8oz} glasses (8 oz)`,
                    `Base (${kg.toFixed(1)} kg): ${base.toFixed(1)} L + exercise ${exerciseBonus.toFixed(1)} L + climate ${climateBonus >= 0 ? '+' : ''}${climateBonus.toFixed(1)} L`,
                ].join('\n'),
                stats: [
                    { label: 'Daily target', value: `${liters.toFixed(1)} L` },
                    { label: 'Cups (250ml)', value: String(cups) },
                    { label: '8 oz glasses', value: String(glasses8oz) },
                    { label: 'Exercise bonus', value: `${exerciseBonus.toFixed(1)} L` },
                ],
                message: 'Thirst, pale-yellow urine and steady energy are better guides than any fixed number.',
                tone: 'success',
            };
        },
    });
}
