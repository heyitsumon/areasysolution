import { mountFormOutput } from './form-output-shell';

/**
 * Daily protein targets. Ranges follow widely published sports-nutrition
 * guidance: sedentary adults need roughly 0.8 g/kg, strength athletes up to
 * 2.2 g/kg. We return a range so the visitor gets honest bounds, not a fake
 * one-decimal answer.
 */
const ACTIVITY_RANGES = {
    sedentary: [0.8, 1.0],
    light: [1.0, 1.4],
    moderate: [1.2, 1.8],
    strength: [1.6, 2.2],
    extreme: [1.8, 2.4],
};

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Protein calculator',
        description: 'Enter your weight, unit and activity level to get your recommended daily protein range in grams.',
        fileName: 'protein-target.txt',
        fields: [
            { key: 'weight', label: 'Body weight', type: 'number', value: 70, min: 1, step: 0.1 },
            {
                key: 'unit',
                label: 'Weight unit',
                type: 'select',
                value: 'kg',
                options: [{ value: 'kg', label: 'Kilograms (kg)' }, { value: 'lb', label: 'Pounds (lb)' }],
            },
            {
                key: 'activity',
                label: 'Activity level',
                type: 'select',
                value: 'moderate',
                options: [
                    { value: 'sedentary', label: 'Sedentary (little exercise)' },
                    { value: 'light', label: 'Light (1-3 workouts/week)' },
                    { value: 'moderate', label: 'Moderate (3-5 workouts/week)' },
                    { value: 'strength', label: 'Strength training (4-6/week)' },
                    { value: 'extreme', label: 'Athlete / heavy daily training' },
                ],
            },
        ],
        build: (values) => {
            const weight = Number(values.weight);
            if (!Number.isFinite(weight) || weight <= 0) {
                return { text: '', message: 'Enter a body weight greater than zero.', tone: 'warning' };
            }
            const kg = values.unit === 'lb' ? weight * 0.453592 : weight;
            const [low, high] = ACTIVITY_RANGES[values.activity] ?? ACTIVITY_RANGES.moderate;
            const lowG = kg * low;
            const highG = kg * high;
            return {
                text: [
                    `Body weight: ${kg.toFixed(1)} kg`,
                    `Recommended protein: ${lowG.toFixed(0)} - ${highG.toFixed(0)} grams per day`,
                    `That is about ${low.toFixed(1)} - ${high.toFixed(1)} g per kg of body weight.`,
                ].join('\n'),
                stats: [
                    { label: 'Daily target', value: `${lowG.toFixed(0)}-${highG.toFixed(0)} g` },
                    { label: 'Per kg', value: `${low.toFixed(1)}-${high.toFixed(1)} g` },
                    { label: 'Per meal (4/day)', value: `${(lowG / 4).toFixed(0)}-${(highG / 4).toFixed(0)} g` },
                    { label: 'Weight', value: `${kg.toFixed(1)} kg` },
                ],
                message: 'Spread protein across meals for better absorption. Very high protein is not helpful beyond your range.',
                tone: 'success',
            };
        },
    });
}
