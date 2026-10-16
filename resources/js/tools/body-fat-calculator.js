import { mountFormOutput } from './form-output-shell';

const CM_PER_IN = 2.54;

/**
 * US Navy body-fat method. Male: neck + waist at navel. Female: neck + waist
 * + hip. All measurements in centimeters, height in cm.
 */
function navyBodyFat({ male, heightCm, neck, waist, hip }) {
    const log10 = Math.log10;
    if (male) {
        return 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(heightCm)) - 450;
    }
    return 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.221 * log10(heightCm)) - 450;
}

const MALE_CATEGORIES = [[6, 'Essential fat'], [14, 'Athletic'], [18, 'Fitness'], [25, 'Average'], [Infinity, 'Above average']];
const FEMALE_CATEGORIES = [[14, 'Essential fat'], [21, 'Athletic'], [25, 'Fitness'], [32, 'Average'], [Infinity, 'Above average']];

function categorize(bf, male) {
    const table = male ? MALE_CATEGORIES : FEMALE_CATEGORIES;
    for (const [limit, label] of table) {
        if (bf < limit) {
            return label;
        }
    }
    return 'Above average';
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Body fat calculator (US Navy method)',
        description: 'Enter height, neck and waist (and hip for women) tape measurements to estimate body fat percentage.',
        fileName: 'body-fat.txt',
        fields: [
            { key: 'height', label: 'Height', type: 'number', value: 175, min: 50, step: 0.5, suffix: 'cm (or in)' },
            {
                key: 'unit',
                label: 'Measurement unit',
                type: 'select',
                value: 'cm',
                options: [{ value: 'cm', label: 'Centimeters' }, { value: 'in', label: 'Inches' }],
            },
            {
                key: 'sex',
                label: 'Sex',
                type: 'select',
                value: 'male',
                options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
            },
            { key: 'neck', label: 'Neck circumference', type: 'number', value: 38, min: 1, step: 0.1, hint: 'Measured just below the larynx.' },
            { key: 'waist', label: 'Waist circumference', type: 'number', value: 85, min: 1, step: 0.1, hint: 'At the navel, relaxed, after exhaling.' },
            { key: 'hip', label: 'Hip circumference (women only)', type: 'number', value: 0, min: 0, step: 0.1, hint: 'Widest point of the hips. Required for women.' },
            { key: 'weight', label: 'Body weight (kg, optional)', type: 'number', value: 70, min: 0, step: 0.5, hint: 'Optional: enables lean mass calculation.' },
        ],
        build: (values) => {
            const factor = values.unit === 'in' ? CM_PER_IN : 1;
            const heightCm = Number(values.height) * factor;
            const neck = Number(values.neck) * factor;
            const waist = Number(values.waist) * factor;
            const hip = Number(values.hip) * factor;
            const weight = Number(values.weight) || 0;
            const male = values.sex === 'male';
            if (!Number.isFinite(heightCm) || !Number.isFinite(neck) || !Number.isFinite(waist) || heightCm <= 0 || neck <= 0 || waist <= 0) {
                return { text: '', message: 'Enter your height, neck and waist measurements.', tone: 'warning' };
            }
            if (!male && (hip <= 0)) {
                return { text: '', message: 'The female formula also needs the hip measurement.', tone: 'warning' };
            }
            if (!male && waist + hip - neck <= 0) {
                return { text: '', message: 'Check the tape measurements - they do not compute.', tone: 'warning' };
            }
            if (male && waist - neck <= 0) {
                return { text: '', message: 'Waist must be larger than neck for the male formula.', tone: 'warning' };
            }
            const bf = navyBodyFat({ male, heightCm, neck, waist, hip });
            if (!Number.isFinite(bf) || bf <= 0 || bf > 70) {
                return { text: '', message: 'Those measurements produce an unrealistic result - double-check them.', tone: 'warning' };
            }
            const category = categorize(bf, male);
            const leanMass = weight > 0 ? weight * (1 - bf / 100) : null;
            const fatMass = weight > 0 ? weight * (bf / 100) : null;
            const lines = [
                `Body fat: ${bf.toFixed(1)}%`,
                `Category: ${category}`,
                leanMass !== null ? `Lean mass: ${leanMass.toFixed(1)} kg  |  Fat mass: ${fatMass.toFixed(1)} kg` : 'Add body weight to see lean and fat mass.',
            ];
            const stats = [
                { label: 'Body fat', value: `${bf.toFixed(1)}%` },
                { label: 'Category', value: category },
                { label: 'Lean mass', value: leanMass === null ? '-' : `${leanMass.toFixed(0)} kg` },
                { label: 'Fat mass', value: fatMass === null ? '-' : `${fatMass.toFixed(0)} kg` },
            ];
            return {
                text: lines.join('\n'),
                stats,
                message: 'The Navy tape method has a margin of error of roughly \u00B13%. Calipers or DEXA scans are more precise.',
                tone: 'info',
            };
        },
    });
}
