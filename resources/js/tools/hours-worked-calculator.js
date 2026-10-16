import { mountFormOutput } from './form-output-shell';

/**
 * Parse "9:30", "17:45", "9:30 AM", "5:45 PM" into minutes since midnight.
 */
function parseTime(value) {
    const raw = String(value).trim().toUpperCase();
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/);
    if (!match) {
        return null;
    }
    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3];
    if (hours > 23 || minutes > 59) {
        return null;
    }
    if (meridiem === 'PM' && hours < 12) {
        hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
    }
    return hours * 60 + minutes;
}

function minutesToText(total) {
    const hours = Math.floor(total / 60);
    const minutes = Math.round(total % 60);
    return `${hours} h ${minutes} min`;
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Hours worked calculator',
        description: 'Enter clock-in and clock-out times plus any unpaid break to get total hours worked.',
        fileName: 'hours-worked.txt',
        fields: [
            { key: 'start', label: 'Start time', type: 'text', value: '9:00 AM', placeholder: '9:00 AM or 09:00' },
            { key: 'end', label: 'End time', type: 'text', value: '5:30 PM', placeholder: '5:30 PM or 17:30', hint: 'Overnight shifts work too - end earlier than start adds 24 h.' },
            { key: 'break', label: 'Unpaid break', type: 'number', value: 30, min: 0, step: 5, suffix: 'minutes' },
            { key: 'rate', label: 'Hourly pay rate', type: 'number', value: 0, min: 0, step: 0.01, hint: 'Optional, to calculate earnings.' },
        ],
        build: (values) => {
            const start = parseTime(values.start);
            let end = parseTime(values.end);
            if (start === null || end === null) {
                return { text: '', message: 'Enter times like 9:00 AM, 09:00 or 17:30.', tone: 'warning' };
            }
            if (end <= start) {
                end += 24 * 60; // overnight shift
            }
            const breakMinutes = Math.max(0, Number(values.break) || 0);
            const worked = end - start - breakMinutes;
            if (worked <= 0) {
                return { text: '', message: 'The break removes all working time - check your inputs.', tone: 'warning' };
            }
            const decimal = worked / 60;
            const rate = Number(values.rate) || 0;
            const earnings = decimal * rate;
            return {
                text: [
                    `Total time at work: ${minutesToText(end - start)}`,
                    `Minus break: ${breakMinutes} min`,
                    `Hours worked: ${decimal.toFixed(2)} decimal hours (${minutesToText(worked)})`,
                    rate > 0 ? `Earnings at $${rate}/h: $${earnings.toFixed(2)}` : '',
                ].filter(Boolean).join('\n'),
                stats: [
                    { label: 'Hours worked', value: decimal.toFixed(2) },
                    { label: 'Time', value: minutesToText(worked) },
                    { label: 'Break', value: `${breakMinutes} min` },
                    rate > 0 ? { label: 'Earnings', value: `$${earnings.toFixed(2)}` } : { label: 'Pay rate', value: 'Not set' },
                ],
                message: 'Use decimal hours (7.5) when filling timesheets that ask for numbers.',
                tone: 'success',
            };
        },
    });
}
