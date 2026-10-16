import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Gross-to-net salary converter: annual gross pay → take-home after tax,
 * social deductions and pension contributions. Generic international model:
 * progressive tax bands plus a flat percentage for social contributions.
 */

export function calculateNetSalary({ grossAnnual, taxBands, socialRate, pensionRate, allowances }) {
    if (grossAnnual < 0) throw new Error('Gross salary cannot be negative.');
    if (socialRate < 0 || socialRate > 100) throw new Error('Social contribution rate must be between 0 and 100.');
    if (pensionRate < 0 || pensionRate > 100) throw new Error('Pension rate must be between 0 and 100.');

    const taxable = Math.max(0, grossAnnual - allowances);
    let tax = 0;
    let remaining = taxable;
    let previousCap = 0;
    const breakdown = [];

    for (const band of taxBands) {
        if (remaining <= 0) break;
        const ceiling = band.upTo === null ? Infinity : band.upTo;
        const span = Math.min(remaining, ceiling - previousCap);
        const bandTax = span * (band.rate / 100);
        tax += bandTax;
        breakdown.push({ from: previousCap, to: ceiling, rate: band.rate, tax: bandTax });
        remaining -= span;
        previousCap = ceiling;
    }

    const social = taxable * (socialRate / 100);
    const pension = taxable * (pensionRate / 100);
    const netAnnual = Math.max(0, grossAnnual - tax - social - pension);

    return {
        netAnnual, tax, social, pension,
        netMonthly: netAnnual / 12,
        netWeekly: netAnnual / 52,
        effectiveTaxRate: grossAnnual > 0 ? ((tax + social + pension) / grossAnnual) * 100 : 0,
        breakdown,
    };
}

const PRESETS = {
    simple: {
        label: 'Simple flat tax',
        bands: [{ upTo: null, rate: 20 }],
        socialRate: 7, pensionRate: 5,
    },
    progressive: {
        label: 'Progressive (3 bands)',
        bands: [{ upTo: 15000, rate: 0 }, { upTo: 50000, rate: 15 }, { upTo: null, rate: 30 }],
        socialRate: 8, pensionRate: 6,
    },
    zeroSocial: {
        label: 'Low deductions',
        bands: [{ upTo: 20000, rate: 10 }, { upTo: null, rate: 25 }],
        socialRate: 2, pensionRate: 0,
    },
};

export default function mount({ root, announce, complete }) {
    const gross = number({ label: 'Annual gross salary ($)', value: 60000, min: 0, step: 100 });
    const allowances = number({ label: 'Personal allowances / standard deduction ($)', value: 12500, min: 0, step: 100, hint: 'Income below this amount is not taxed.' });
    const presetSelect = select({
        label: 'Tax model',
        options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
        value: 'progressive',
        hint: 'Prebuilt band models — or edit the rates below for any country.',
    });
    const socialRate = number({ label: 'Social contributions (%)', value: 8, min: 0, max: 100, step: 0.1, suffix: '%' });
    const pensionRate = number({ label: 'Pension / retirement (%)', value: 6, min: 0, max: 100, step: 0.1, suffix: '%' });

    const calcBtn = button({ label: 'Calculate Net Salary', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4"></div>');
    const breakdownBox = node('<div class="mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(gross.el, allowances.el, presetSelect.el, socialRate.el, pensionRate.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid, breakdownBox);
    root.append(panel({ title: 'Salary Take-Home Calculator', description: 'See your real take-home pay after progressive income tax, social contributions and pension.', body }));

    presetSelect.select.addEventListener('change', () => {
        const preset = PRESETS[presetSelect.select.value];
        socialRate.input.value = preset.socialRate;
        pensionRate.input.value = preset.pensionRate;
        run();
    });

    function fmt(value) {
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function run() {
        try {
            const res = calculateNetSalary({
                grossAnnual: Number(gross.input.value) || 0,
                taxBands: PRESETS[presetSelect.select.value].bands,
                socialRate: Number(socialRate.input.value) || 0,
                pensionRate: Number(pensionRate.input.value) || 0,
                allowances: Number(allowances.input.value) || 0,
            });

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Monthly Take-Home</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">$${fmt(res.netMonthly)}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Yearly Take-Home</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">$${fmt(res.netAnnual)}</p>
                </div>
                <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-amber-700 uppercase">Total Deductions</p>
                    <p class="text-2xl font-extrabold text-amber-950 mt-1">$${fmt(res.tax + res.social + res.pension)}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Effective Rate</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">${res.effectiveTaxRate.toFixed(1)}%</p>
                </div>
            `;

            breakdownBox.innerHTML = `
                <h3 class="text-sm font-bold text-slate-700 mb-2">How the tax was applied</h3>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-xs text-slate-500 uppercase"><th class="py-1">Band</th><th class="py-1">Rate</th><th class="py-1 text-right">Tax</th></tr></thead>
                    <tbody>
                        ${res.breakdown.map((b) => `
                            <tr class="border-t border-slate-100">
                                <td class="py-1.5">$${b.from === Infinity ? fmt(b.to) : fmt(b.from)} – ${b.to === Infinity ? 'and up' : `$${fmt(b.to)}`}</td>
                                <td class="py-1.5">${b.rate}%</td>
                                <td class="py-1.5 text-right">$${fmt(b.tax)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            feedback.set('');
            announce(`Monthly take-home pay: $${fmt(res.netMonthly)}.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [gross.input, allowances.input, socialRate.input, pensionRate.input].forEach((el) => el.addEventListener('input', run));
    calcBtn.addEventListener('click', run);
    run();
}
