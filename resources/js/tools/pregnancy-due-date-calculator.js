import { mountFormOutput } from './form-output-shell';

function formatDate(date) {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Pregnancy due date calculator',
        description: 'Enter the first day of your last menstrual period to estimate the due date and current week.',
        fileName: 'due-date.txt',
        fields: [
            { key: 'lmp', label: 'First day of last period', type: 'date', value: new Date().toISOString().slice(0, 10) },
            {
                key: 'cycle',
                label: 'Average cycle length',
                type: 'select',
                value: '28',
                options: [
                    { value: '22', label: '22 days' }, { value: '24', label: '24 days' }, { value: '26', label: '26 days' },
                    { value: '28', label: '28 days (average)' }, { value: '30', label: '30 days' }, { value: '32', label: '32 days' },
                ],
                hint: 'Longer cycles move the due date a few days later.',
            },
        ],
        build: (values) => {
            const lmp = new Date(`${values.lmp}T00:00:00`);
            if (Number.isNaN(lmp.getTime())) {
                return { text: '', message: 'Choose the first day of your last period.', tone: 'warning' };
            }
            const cycleAdjust = Number(values.cycle) - 28;
            const due = new Date(lmp.getTime());
            due.setDate(due.getDate() + 280 + cycleAdjust); // Naegele's rule: 40 weeks
            const today = new Date();
            const daysPregnant = Math.floor((today - lmp) / 86400000);
            const trimester = daysPregnant < 98 ? 'First (weeks 1-13)' : daysPregnant < 196 ? 'Second (weeks 14-27)' : 'Third (weeks 28-40)';
            const weeks = Math.max(0, Math.floor(daysPregnant / 7));
            const days = daysPregnant % 7;
            const trimesterDates = [1, 14, 28].map((week) => {
                const d = new Date(lmp.getTime());
                d.setDate(d.getDate() + week * 7);
                return `Week ${week} (${['First', 'Second', 'Third'][[1, 14, 28].indexOf(week)]} trimester): ${formatDate(d)}`;
            });
            return {
                text: [
                    `Estimated due date: ${formatDate(due)}`,
                    daysPregnant >= 0 ? `Today: week ${weeks}, day ${days} - ${trimester} trimester` : `Pregnancy starts around ${formatDate(lmp)}.`,
                    ...trimesterDates,
                ].join('\n'),
                stats: [
                    { label: 'Due date', value: formatDate(due) },
                    { label: 'Pregnancy week', value: daysPregnant >= 0 ? `W${weeks}` : '-' },
                    { label: 'Trimester', value: daysPregnant >= 0 ? trimester.split(' ')[0] : '-' },
                    { label: 'Days to go', value: daysPregnant >= 0 ? String(Math.max(0, Math.ceil((due - today) / 86400000))) : '-' },
                ],
                message: 'This is an estimate only - your doctor or midwife may adjust the date after an ultrasound.',
                tone: 'info',
            };
        },
    });
}
