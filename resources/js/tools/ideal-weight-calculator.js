import { mountFormOutput } from './form-output-shell';

const INCHES_PER_CM = 0.393701;
const KG_PER_LB = 0.453592;

/**
 * Four classic ideal-weight formulas. All take height in inches and return
 * pounds; Devine is the most widely cited in clinical practice.
 */
const FORMULAS = {
    Devine: (h) => (h >= 60 ? 50 + 2.3 * (h - 60) : 50 * (h / 60)),
    Robinson: (h) => (h >= 60 ? 52 + 1.9 * (h - 60) : 52 * (h / 60)),
    Miller: (h) => (h >= 60 ? 56.2 + 1.41 * (h - 60) : 56.2 * (h / 60)),
    Hamwi: (h) => (h >= 60 ? 48 + 2.7 * (h - 60) : 48 * (h / 60)),
};

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Ideal weight calculator',
        description: 'Enter your height and sex to see your ideal body weight range from four clinical formulas.',
        fileName: 'ideal-weight.txt',
        fields: [
            { key: 'height', label: 'Height', type: 'number', value: 175, min: 60, step: 1 },
            {
                key: 'unit',
                label: 'Height unit',
                type: 'select',
                value: 'cm',
                options: [{ value: 'cm', label: 'Centimeters' }, { value: 'in', label: 'Inches' }],
            },
            {
                key: 'sex',
                label: 'Sex (formula baseline)',
                type: 'select',
                value: 'male',
                options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
            },
        ],
        build: (values) => {
            const height = Number(values.height);
            if (!Number.isFinite(height) || height <= 0) {
                return { text: '', message: 'Enter your height.', tone: 'warning' };
            }
            const inches = values.unit === 'cm' ? height / 2.54 : height;
            const lines = [];
            const stats = [];
            const sexAdjust = values.sex === 'female' ? 0.9 : 1;
            for (const [name, formula] of Object.entries(FORMULAS)) {
                const kg = formula(inches) * sexAdjust * KG_PER_LB / KG_PER_LB; // formula returns lb for male baseline
                const pounds = formula(inches) * sexAdjust;
                const kgValue = pounds * KG_PER_LB;
                lines.push(`${name}: ${kgValue.toFixed(1)} kg (${pounds.toFixed(0)} lb)`);
                stats.push({ label: name, value: `${kgValue.toFixed(0)} kg` });
            }
            const devineKg = FORMULAS.Devine(inches) * sexAdjust * KG_PER_LB;
            const lowKg = devineKg * 0.9;
            const highKg = devineKg * 1.1;
            lines.push(`Healthy range (\u00B110% of Devine): ${lowKg.toFixed(1)} - ${highKg.toFixed(1)} kg`);
            stats[3] = { label: 'Healthy range', value: `${lowKg.toFixed(0)}-${highKg.toFixed(0)} kg` };
            const cm = (values.unit === 'cm' ? height : height / INCHES_PER_CM).toFixed(0);
            lines.unshift(`Height: ${cm} cm (${(cm / 2.54).toFixed(1)} in / ${Math.floor(inches / 12)} ft ${Math.round(inches % 12)} in)`);
            return {
                text: lines.join('\n'),
                stats: stats.slice(0, 4),
                message: 'Ideal-weight formulas ignore muscle mass and body composition - BMI and body fat % give more context.',
                tone: 'info',
            };
        },
    });
}
