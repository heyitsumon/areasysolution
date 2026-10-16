import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Freelance rate calculator',
        description: 'Enter your target yearly income, billable hours and costs to get the hourly rate you should charge.',
        fileName: 'freelance-rate.txt',
        fields: [
            { key: 'targetIncome', label: 'Target yearly income', type: 'number', value: 60000, min: 0, step: 1000 },
            { key: 'businessCosts', label: 'Yearly business costs', type: 'number', value: 6000, min: 0, step: 100, hint: 'Software, hardware, insurance, accountant...' },
            { key: 'weeks', label: 'Working weeks per year', type: 'number', value: 46, min: 1, max: 52, step: 1, hint: '52 minus holidays and sick days.' },
            { key: 'hoursPerWeek', label: 'Billable hours per week', type: 'number', value: 25, min: 1, max: 60, step: 1, hint: 'Billable is not the same as worked - admin is unpaid.' },
            { key: 'taxRate', label: 'Tax + overhead reserve', type: 'number', value: 30, min: 0, max: 75, step: 1, suffix: '%' },
        ],
        build: (values) => {
            const income = Number(values.targetIncome);
            const costs = Number(values.businessCosts) || 0;
            const weeks = Number(values.weeks);
            const hours = Number(values.hoursPerWeek);
            const tax = Number(values.taxRate) || 0;
            if (!Number.isFinite(income) || !Number.isFinite(weeks) || !Number.isFinite(hours) || weeks <= 0 || hours <= 0 || income < 0) {
                return { text: '', message: 'Enter a positive income, weeks and billable hours.', tone: 'warning' };
            }
            const billableHours = weeks * hours;
            const needed = (income + costs) / (1 - tax / 100);
            const hourly = needed / billableHours;
            const dayRate = hourly * 8;
            return {
                text: [
                    `Revenue needed per year: $${needed.toFixed(0)}`,
                    `Billable hours per year: ${billableHours.toFixed(0)}`,
                    `Hourly rate: $${hourly.toFixed(0)}  (round to $${(Math.ceil(hourly / 5) * 5).toFixed(0)})`,
                    `Day rate (8 h): $${(Math.ceil(dayRate / 25) * 25).toFixed(0)}`,
                ].join('\n'),
                stats: [
                    { label: 'Hourly rate', value: `$${hourly.toFixed(0)}` },
                    { label: 'Day rate', value: `$${dayRate.toFixed(0)}` },
                    { label: 'Revenue needed', value: `$${needed.toFixed(0)}` },
                    { label: 'Billable h/yr', value: billableHours.toFixed(0) },
                ],
                message: 'Charge by the project when you can - it rewards efficiency and avoids haggling over hours.',
                tone: 'success',
            };
        },
    });
}
