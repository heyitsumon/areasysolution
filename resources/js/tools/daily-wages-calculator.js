import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Daily wages calculator',
        description: 'Convert monthly salary or hourly rate into daily wages, including overtime and holiday rates.',
        fileName: 'daily-wages.txt',
        fields: [
            {
                key: 'mode',
                label: 'Input mode',
                type: 'select',
                value: 'monthly',
                options: [
                    { value: 'monthly', label: 'From monthly salary' },
                    { value: 'hourly', label: 'From hourly rate' },
                ],
            },
            { key: 'amount', label: 'Monthly salary (BDT) or hourly rate', type: 'number', value: 15000, min: 0, step: 100 },
            { key: 'days', label: 'Working days per week', type: 'number', value: 6, min: 1, max: 7, step: 1 },
            { key: 'hours', label: 'Hours per day', type: 'number', value: 8, min: 1, max: 16, step: 1 },
            { key: 'overtimeHours', label: 'Overtime hours (per day)', type: 'number', value: 0, min: 0, max: 12, step: 1 },
            { key: 'overtimeMultiplier', label: 'Overtime rate multiplier', type: 'number', value: 2, min: 1, max: 4, step: 0.5, suffix: 'x' },
        ],
        build: (values) => {
            const amount = Number(values.amount);
            const daysPerWeek = Number(values.days);
            const hours = Number(values.hours);
            const otHours = Number(values.overtimeHours) || 0;
            const otMultiplier = Number(values.overtimeMultiplier) || 2;
            if (!Number.isFinite(amount) || amount <= 0 || daysPerWeek <= 0 || hours <= 0) {
                return { text: '', message: 'Enter a positive amount, working days and daily hours.', tone: 'warning' };
            }
            const workingDaysPerMonth = (daysPerWeek * 52) / 12;
            const hourlyRate = values.mode === 'monthly' ? amount / (workingDaysPerMonth * hours) : amount;
            const dailyBase = hourlyRate * hours;
            const dailyOt = otHours * hourlyRate * otMultiplier;
            const dailyTotal = dailyBase + dailyOt;
            return {
                text: [
                    `Hourly rate: \u09F3${hourlyRate.toFixed(2)}`,
                    `Daily wage (base ${hours} h): \u09F3${dailyBase.toFixed(2)}`,
                    otHours > 0 ? `Overtime (${otHours} h @ ${otMultiplier}x): \u09F3${dailyOt.toFixed(2)}` : '',
                    `Total per day: \u09F3${dailyTotal.toFixed(2)}`,
                    `Per month (\u2248${workingDaysPerMonth.toFixed(1)} working days): \u09F3${(dailyTotal * workingDaysPerMonth).toFixed(0)}`,
                ].filter(Boolean).join('\n'),
                stats: [
                    { label: 'Daily wage', value: `\u09F3${dailyTotal.toFixed(0)}` },
                    { label: 'Hourly rate', value: `\u09F3${hourlyRate.toFixed(1)}` },
                    { label: 'Monthly est.', value: `\u09F3${(dailyTotal * workingDaysPerMonth).toFixed(0)}` },
                    { label: 'Working days/mo', value: workingDaysPerMonth.toFixed(1) },
                ],
                message: 'Based on 52 working weeks per year. Bangladesh Labour Rules require 2x pay for overtime.',
                tone: 'success',
            };
        },
    });
}
