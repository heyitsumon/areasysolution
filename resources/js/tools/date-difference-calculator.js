import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, panel } from '../lib/ui';

export function calculateDateDifference(date1Str, date2Str, includeEndDay = false) {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        throw new Error('Please select valid calendar dates.');
    }

    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;

    const msPerDay = 1000 * 60 * 60 * 24;
    let totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);
    if (includeEndDay) totalDays += 1;

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    // Business days count (Mon-Fri)
    let businessDays = 0;
    const cur = new Date(start);
    while (cur < end || (includeEndDay && cur.getTime() === end.getTime())) {
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDays++;
        }
        cur.setDate(cur.getDate() + 1);
    }

    // Exact years, months, days
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { totalDays, weeks, remainingDays, businessDays, years, months, days };
}

export default function mount({ root, announce, complete }) {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const startInput = node(`<input type="date" value="${today}" class="field-input text-sm">`);
    const endInput = node(`<input type="date" value="${nextMonth}" class="field-input text-sm">`);
    const includeEndCheckbox = node(`
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" class="rounded border-slate-300 text-indigo-600">
            <span>Include end date (add 1 day)</span>
        </label>
    `);

    const calcBtn = button({ label: 'Calculate Difference', variant: 'primary' });
    const feedback = status();
    const resultsContainer = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    const startCol = node('<div><label class="block text-xs font-bold uppercase text-slate-500 mb-1">Start Date</label></div>');
    startCol.append(startInput);
    const endCol = node('<div><label class="block text-xs font-bold uppercase text-slate-500 mb-1">End Date</label></div>');
    endCol.append(endInput);
    inputsGrid.append(startCol, endCol);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, includeEndCheckbox, calcBtn, feedback.el, resultsContainer);

    root.append(panel({ title: 'Date Difference Calculator', body }));

    function run() {
        const d1 = startInput.value;
        const d2 = endInput.value;
        const inc = includeEndCheckbox.querySelector('input').checked;

        try {
            const res = calculateDateDifference(d1, d2, inc);

            resultsContainer.innerHTML = `
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Total Days</p>
                    <p class="text-3xl font-extrabold text-indigo-950 mt-1">${res.totalDays.toLocaleString()} <span class="text-xs font-normal text-slate-500">days</span></p>
                    <p class="text-[11px] text-indigo-600 mt-1">${res.weeks} weeks and ${res.remainingDays} days</p>
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Working Business Days</p>
                    <p class="text-3xl font-extrabold text-emerald-950 mt-1">${res.businessDays.toLocaleString()} <span class="text-xs font-normal text-slate-500">days</span></p>
                    <p class="text-[11px] text-emerald-700 mt-1">Excludes Saturdays & Sundays</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Calendar Breakdown</p>
                    <p class="text-xl font-bold text-slate-900 mt-2">${res.years}y ${res.months}m ${res.days}d</p>
                    <p class="text-[11px] text-slate-500 mt-1">Exact calendar duration</p>
                </div>
            `;

            feedback.set('');
            announce(`Difference is ${res.totalDays} days (${res.businessDays} business days).`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    startInput.addEventListener('input', run);
    endInput.addEventListener('input', run);
    includeEndCheckbox.querySelector('input').addEventListener('change', run);
    calcBtn.addEventListener('click', run);

    run();
}

