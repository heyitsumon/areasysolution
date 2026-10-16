import { mountFormOutput } from './form-output-shell';

/**
 * Mifflin-St Jeor basal metabolic rate, plus common activity multipliers
 * (TDEE). Supported by the American Dietetic Association as the most accurate
 * general-purpose predictive equation.
 */
const ACTIVITY_FACTORS = {
    sedentary: { label: 'Sedentary', factor: 1.2 },
    light: { label: 'Light (1-3 days/week)', factor: 1.375 },
    moderate: { label: 'Moderate (3-5 days/week)', factor: 1.55 },
    active: { label: 'Active (6-7 days/week)', factor: 1.725 },
    athlete: { label: 'Athlete (2x per day)', factor: 1.9 },
};

export default function mount(context) {
    mountFormOutput(context, {
        title: 'BMR & calorie needs calculator',
        description: 'Enter your age, sex, height and weight to get your basal metabolic rate and daily calorie targets.',
        fileName: 'bmr-calories.txt',
        fields: [
            { key: 'age', label: 'Age', type: 'number', value: 30, min: 2, max: 120, step: 1, suffix: 'years' },
            { key: 'sex', label: 'Sex', type: 'select', value: 'male', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
            { key: 'height', label: 'Height', type: 'number', value: 175, min: 60, step: 1, suffix: 'cm (or in)' },
            { key: 'weight', label: 'Weight', type: 'number', value: 70, min: 10, step: 0.5, suffix: 'kg (or lb)' },
            {
                key: 'unit',
                label: 'Unit system',
                type: 'select',
                value: 'metric',
                options: [{ value: 'metric', label: 'Metric (cm, kg)' }, { value: 'imperial', label: 'Imperial (in, lb)' }],
            },
            {
                key: 'activity',
                label: 'Activity level',
                type: 'select',
                value: 'moderate',
                options: Object.entries(ACTIVITY_FACTORS).map(([value, a]) => ({ value, label: a.label })),
            },
        ],
        build: (values) => {
            const age = Number(values.age);
            let height = Number(values.height);
            let weight = Number(values.weight);
            if (!Number.isFinite(age) || !Number.isFinite(height) || !Number.isFinite(weight) || age <= 0 || height <= 0 || weight <= 0) {
                return { text: '', message: 'Enter a positive age, height and weight.', tone: 'warning' };
            }
            if (values.unit === 'imperial') {
                height *= 2.54;
                weight *= 0.453592;
            }
            const bmr = Math.round(
                10 * weight + 6.25 * height - 5 * age + (values.sex === 'male' ? 5 : -161),
            );
            const factor = (ACTIVITY_FACTORS[values.activity] ?? ACTIVITY_FACTORS.moderate).factor;
            const tdee = Math.round(bmr * factor);
            const loss = tdee - 500;
            const gain = tdee + 500;
            return {
                text: [
                    `BMR (Mifflin-St Jeor): ${bmr.toLocaleString()} kcal/day`,
                    `Daily calories at ${ACTIVITY_FACTORS[values.activity].label.toLowerCase()} activity: ${tdee.toLocaleString()} kcal/day`,
                    `Weight loss (\u22480.5 kg/week): ${loss.toLocaleString()} kcal/day`,
                    `Maintain: ${tdee.toLocaleString()} kcal/day`,
                    `Weight gain (\u22480.5 kg/week): ${gain.toLocaleString()} kcal/day`,
                ].join('\n'),
                stats: [
                    { label: 'BMR', value: `${bmr.toLocaleString()} kcal` },
                    { label: 'Maintenance', value: `${tdee.toLocaleString()} kcal` },
                    { label: 'Weight loss', value: `${loss.toLocaleString()} kcal` },
                    { label: 'Weight gain', value: `${gain.toLocaleString()} kcal` },
                ],
                message: 'Do not eat below your BMR for long periods - use gradual changes and adjust by results every 2-3 weeks.',
                tone: 'success',
            };
        },
    });
}
