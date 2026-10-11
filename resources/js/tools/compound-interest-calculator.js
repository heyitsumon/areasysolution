import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

export function calculateCompoundInterest(principal, annualRate, years, frequency = 12) {
    if (principal < 0 || annualRate < 0 || years <= 0 || frequency <= 0) {
        throw new Error('Please enter positive numbers for principal, rate, and years.');
    }
    const r = annualRate / 100;
    const n = frequency;
    const t = years;

    const futureValue = principal * Math.pow(1 + r / n, n * t);
    const totalInterest = futureValue - principal;

    const schedule = [];
    for (let yr = 1; yr <= t; yr++) {
        const balance = principal * Math.pow(1 + r / n, n * yr);
        const interestEarned = balance - principal;
        schedule.push({ year: yr, balance, interest: interestEarned });
    }

    return {
        principal,
        futureValue,
        totalInterest,
        schedule,
    };
}

export default function mount({ root, announce, complete }) {
    const principalInput = number({ label: 'Initial deposit / Principal ($)', value: 5000, min: 1, step: '100' });
    const rateInput = number({ label: 'Annual interest rate (%)', value: 7, min: 0.1, max: 100, step: '0.1', suffix: '%' });
    const yearsInput = number({ label: 'Investment period (Years)', value: 10, min: 1, max: 50 });
    const frequencySelect = select({
        label: 'Compounding frequency',
        value: '12',
        options: [
            { value: '1', label: 'Annually (Once a year)' },
            { value: '4', label: 'Quarterly (4 times a year)' },
            { value: '12', label: 'Monthly (12 times a year - Standard)' },
            { value: '365', label: 'Daily (365 times a year)' },
        ],
    });

    const calcBtn = button({ label: 'Calculate Compound Growth', variant: 'primary' });
    const feedback = status();

    const resultsCards = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');
    const scheduleTable = node('<div class="rounded-xl border border-slate-200 bg-white overflow-hidden max-h-72 overflow-y-auto mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(principalInput.el, rateInput.el, yearsInput.el, frequencySelect.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        inputsGrid,
        calcBtn,
        feedback.el,
        resultsCards,
        node('<h3 class="text-sm font-bold text-slate-900 mt-6">Year-by-Year Growth Schedule</h3>'),
        scheduleTable
    );

    root.append(panel({ title: 'Compound Interest Calculator', body }));

    function run() {
        const p = Number(principalInput.input.value);
        const r = Number(rateInput.input.value);
        const y = Number(yearsInput.input.value);
        const freq = Number(frequencySelect.select.value);

        try {
            const res = calculateCompoundInterest(p, r, y, freq);

            resultsCards.innerHTML = `
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Future Total Value</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">$${res.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p class="text-[11px] text-indigo-600 mt-0.5">After ${y} years</p>
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Total Interest Earned</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">$${res.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p class="text-[11px] text-emerald-700 mt-0.5">Free compound growth</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Starting Principal</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">$${res.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">Your contribution</p>
                </div>
            `;

            let tableHtml = `
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <tr>
                            <th class="p-2.5">Year</th>
                            <th class="p-2.5">Total Interest</th>
                            <th class="p-2.5">Total Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
            `;

            res.schedule.forEach((row) => {
                tableHtml += `
                    <tr class="hover:bg-slate-50">
                        <td class="p-2.5 font-bold text-slate-900">Year ${row.year}</td>
                        <td class="p-2.5 font-mono text-emerald-700">+$${row.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="p-2.5 font-mono font-semibold text-slate-900">$${row.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
            });

            tableHtml += '</tbody></table>';
            scheduleTable.innerHTML = tableHtml;

            feedback.set('');
            announce(`Future value is $${res.futureValue.toFixed(2)}.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [principalInput.input, rateInput.input, yearsInput.input, frequencySelect.select].forEach((el) => {
        el.addEventListener('input', run);
    });
    calcBtn.addEventListener('click', run);

    run();
}

