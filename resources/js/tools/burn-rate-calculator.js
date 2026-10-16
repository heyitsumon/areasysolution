import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Burn rate & runway calculator',
        description: 'Enter your cash balance and monthly costs to see your burn rate and how many months of runway you have.',
        fileName: 'burn-rate.txt',
        fields: [
            { key: 'cash', label: 'Cash on hand', type: 'number', value: 50000, min: 0, step: 100, hint: 'Total money available in bank and liquid accounts.' },
            { key: 'revenue', label: 'Monthly revenue', type: 'number', value: 3000, min: 0, step: 100 },
            { key: 'expenses', label: 'Monthly expenses', type: 'number', value: 8000, min: 0, step: 100 },
        ],
        build: (values) => {
            const cash = Number(values.cash);
            const revenue = Number(values.revenue) || 0;
            const expenses = Number(values.expenses) || 0;
            if (!Number.isFinite(cash) || cash < 0 || expenses < 0 || revenue < 0) {
                return { text: '', message: 'Enter non-negative amounts.', tone: 'warning' };
            }
            const netBurn = expenses - revenue;
            const grossBurn = expenses;
            const runway = netBurn > 0 ? cash / netBurn : null;
            const runwayText = runway === null ? 'Profitable - no runway limit' : `${runway.toFixed(1)} months`;
            return {
                text: [
                    `Gross burn: $${grossBurn.toFixed(0)} / month`,
                    `Net burn: $${netBurn.toFixed(0)} / month`,
                    `Cash: $${cash.toFixed(0)}`,
                    `Runway: ${runwayText}`,
                    runway !== null && runway < 6 ? 'WARNING: less than 6 months of runway. Cut costs or raise revenue now.' : '',
                ].filter(Boolean).join('\n'),
                stats: [
                    { label: 'Net burn', value: `$${netBurn.toFixed(0)}` },
                    { label: 'Runway', value: runwayText },
                    { label: 'Gross burn', value: `$${grossBurn.toFixed(0)}` },
                    { label: 'Monthly profit', value: `$${(-netBurn).toFixed(0)}` },
                ],
                message: runway === null ? 'You are cash-flow positive. Consider reinvesting the surplus.' : 'Most investors want 12+ months of runway before raising.',
                tone: runway !== null && runway < 3 ? 'warning' : 'success',
            };
        },
    });
}
