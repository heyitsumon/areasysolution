import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Profit margin calculator',
        description: 'Enter cost and selling price to get profit, gross margin and markup.',
        fileName: 'profit-margin.txt',
        fields: [
            { key: 'cost', label: 'Cost price', type: 'number', value: 60, min: 0, step: 0.01 },
            { key: 'price', label: 'Selling price', type: 'number', value: 100, min: 0, step: 0.01 },
            { key: 'units', label: 'Units sold', type: 'number', value: 100, min: 1, step: 1, hint: 'Optional, for total profit.' },
        ],
        build: (values) => {
            const cost = Number(values.cost);
            const price = Number(values.price);
            if (!Number.isFinite(cost) || !Number.isFinite(price) || cost < 0 || price < 0) {
                return { text: '', message: 'Enter non-negative cost and selling prices.', tone: 'warning' };
            }
            const profit = price - cost;
            const margin = price > 0 ? (profit / price) * 100 : 0;
            const markup = cost > 0 ? (profit / cost) * 100 : 0;
            const units = Math.max(1, Math.round(Number(values.units) || 1));
            const totalProfit = profit * units;
            return {
                text: [
                    `Profit per unit: $${profit.toFixed(2)}`,
                    `Gross margin: ${margin.toFixed(1)}%`,
                    `Markup: ${markup.toFixed(1)}%`,
                    `Total profit on ${units} units: $${totalProfit.toFixed(2)}`,
                ].join('\n'),
                stats: [
                    { label: 'Margin', value: `${margin.toFixed(1)}%` },
                    { label: 'Markup', value: `${markup.toFixed(1)}%` },
                    { label: 'Profit / unit', value: `$${profit.toFixed(2)}` },
                    { label: `Profit (${units} units)`, value: `$${totalProfit.toFixed(0)}` },
                ],
                message: profit < 0 ? 'You are selling below cost.' : 'Margin is profit \u00F7 price; markup is profit \u00F7 cost. They are not the same.',
                tone: profit < 0 ? 'warning' : 'success',
            };
        },
    });
}
