import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'ROI calculator',
        description: 'Enter the amount invested and the amount returned to get ROI, net gain and annualized return.',
        fileName: 'roi.txt',
        fields: [
            { key: 'invested', label: 'Amount invested', type: 'number', value: 10000, min: 0.01, step: 100 },
            { key: 'returned', label: 'Amount returned (final value)', type: 'number', value: 12500, min: 0, step: 100 },
            { key: 'years', label: 'Holding period', type: 'number', value: 2, min: 0.1, step: 0.1, suffix: 'years' },
        ],
        build: (values) => {
            const invested = Number(values.invested);
            const returned = Number(values.returned);
            const years = Number(values.years);
            if (!Number.isFinite(invested) || !Number.isFinite(returned) || invested <= 0) {
                return { text: '', message: 'Enter an invested amount above zero and the final value.', tone: 'warning' };
            }
            const gain = returned - invested;
            const roi = (gain / invested) * 100;
            const annualized = years > 0 && returned > 0 ? (Math.pow(returned / invested, 1 / years) - 1) * 100 : null;
            return {
                text: [
                    `Net gain/loss: $${gain.toFixed(2)}`,
                    `ROI: ${roi.toFixed(2)}%`,
                    annualized !== null ? `Annualized return (CAGR): ${annualized.toFixed(2)}% per year over ${years} year(s)` : 'Add a holding period for the annualized return.',
                ].join('\n'),
                stats: [
                    { label: 'ROI', value: `${roi.toFixed(1)}%` },
                    { label: 'Net gain', value: `$${gain.toFixed(0)}` },
                    { label: 'CAGR', value: annualized === null ? '-' : `${annualized.toFixed(1)}%` },
                    { label: 'Multiple', value: `${(returned / invested).toFixed(2)}x` },
                ],
                message: roi >= 0 ? 'Compare against a risk-free benchmark - if a savings account pays 4%, an ROI of 5% may not be worth the risk.' : 'This investment lost money.',
                tone: roi >= 0 ? 'success' : 'warning',
            };
        },
    });
}
