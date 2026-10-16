import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Break-even calculator',
        description: 'Enter fixed costs, price per unit and variable cost per unit to find your break-even point.',
        fileName: 'break-even.txt',
        fields: [
            { key: 'fixedCosts', label: 'Fixed costs (per month)', type: 'number', value: 5000, min: 0, step: 100 },
            { key: 'price', label: 'Price per unit', type: 'number', value: 50, min: 0.01, step: 0.01 },
            { key: 'variableCost', label: 'Variable cost per unit', type: 'number', value: 20, min: 0, step: 0.01 },
            { key: 'currentSales', label: 'Current units sold (per month)', type: 'number', value: 120, min: 0, step: 1 },
        ],
        build: (values) => {
            const fixed = Number(values.fixedCosts);
            const price = Number(values.price);
            const variable = Number(values.variableCost);
            const current = Math.max(0, Math.round(Number(values.currentSales) || 0));
            if (!Number.isFinite(fixed) || !Number.isFinite(price) || !Number.isFinite(variable) || fixed < 0 || price <= 0 || variable < 0) {
                return { text: '', message: 'Enter valid costs and a selling price above zero.', tone: 'warning' };
            }
            const contribution = price - variable;
            if (contribution <= 0) {
                return { text: '', message: 'Variable cost must be lower than the selling price, or you can never break even.', tone: 'error' };
            }
            const units = fixed / contribution;
            const revenue = units * price;
            const currentProfit = current * contribution - fixed;
            return {
                text: [
                    `Break-even units: ${Math.ceil(units)} units per month`,
                    `Break-even revenue: $${revenue.toFixed(0)} per month`,
                    `Contribution margin per unit: $${contribution.toFixed(2)} (${((contribution / price) * 100).toFixed(0)}%)`,
                    current > 0
                        ? `At ${current} units/month you are ${currentProfit >= 0 ? `$${currentProfit.toFixed(0)} in profit` : `$${Math.abs(currentProfit).toFixed(0)} below break-even`}.`
                        : '',
                ].filter(Boolean).join('\n'),
                stats: [
                    { label: 'Break-even units', value: Math.ceil(units).toString() },
                    { label: 'Break-even revenue', value: `$${revenue.toFixed(0)}` },
                    { label: 'Margin / unit', value: `$${contribution.toFixed(2)}` },
                    { label: 'Profit now', value: current > 0 ? `$${currentProfit.toFixed(0)}` : '-' },
                ],
                message: 'Every unit sold above break-even adds the full contribution margin to profit.',
                tone: 'success',
            };
        },
    });
}
