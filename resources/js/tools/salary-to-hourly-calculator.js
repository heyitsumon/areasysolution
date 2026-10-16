import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Salary to hourly calculator',
        description: 'Enter an annual salary to see what it equals per hour, day, week and month.',
        fileName: 'salary-hourly.txt',
        fields: [
            { key: 'salary', label: 'Annual salary', type: 'number', value: 52000, min: 0, step: 1000 },
            { key: 'hours', label: 'Hours per week', type: 'number', value: 40, min: 1, max: 80, step: 1 },
            { key: 'weeks', label: 'Paid weeks per year', type: 'number', value: 52, min: 1, max: 52, step: 1, hint: 'Use 52 for salaried work, or e.g. 48 if unpaid leave is not paid.' },
        ],
        build: (values) => {
            const salary = Number(values.salary);
            const hours = Number(values.hours);
            const weeks = Number(values.weeks);
            if (!Number.isFinite(salary) || !Number.isFinite(hours) || !Number.isFinite(weeks) || salary < 0 || hours <= 0 || weeks <= 0) {
                return { text: '', message: 'Enter a salary and positive weekly hours.', tone: 'warning' };
            }
            const hourly = salary / (hours * weeks);
            const daily = hourly * hours;
            const weekly = salary / weeks;
            const monthly = salary / 12;
            return {
                text: [
                    `Hourly: $${hourly.toFixed(2)}`,
                    `Daily (8 h): $${(hourly * 8).toFixed(2)}`,
                    `Weekly: $${weekly.toFixed(2)}`,
                    `Monthly: $${monthly.toFixed(2)}`,
                    `Yearly: $${salary.toFixed(2)}`,
                ].join('\n'),
                stats: [
                    { label: 'Hourly', value: `$${hourly.toFixed(2)}` },
                    { label: 'Weekly', value: `$${weekly.toFixed(0)}` },
                    { label: 'Monthly', value: `$${monthly.toFixed(0)}` },
                    { label: 'Yearly', value: `$${salary.toFixed(0)}` },
                ],
                message: `Based on ${hours} h/week for ${weeks} weeks a year (${(hours * weeks).toLocaleString()} hours).`,
                tone: 'success',
            };
        },
    });
}
