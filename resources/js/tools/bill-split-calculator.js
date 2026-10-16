import { button, checkbox } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Bill split calculator: total bill + tip + people → per-person amount, with
 * optional per-person item split and round-up so everyone pays the same.
 */

export function splitBill({ bill, tipPercent, people, roundUp }) {
    if (people < 1 || !Number.isInteger(people)) throw new Error('Split between at least one whole person.');
    if (bill < 0 || tipPercent < 0) throw new Error('Bill and tip cannot be negative.');
    const tipAmount = bill * (tipPercent / 100);
    const total = bill + tipAmount;
    let perPerson = total / people;
    if (roundUp) perPerson = Math.ceil(perPerson);
    return { tipAmount, total, perPerson, collected: perPerson * people, overpay: perPerson * people - total };
}

const TIP_PRESETS = [0, 10, 15, 18, 20, 25];

export default function mount({ root, announce, complete }) {
    const bill = number({ label: 'Bill amount ($)', value: 120, min: 0, step: 0.01 });
    const tip = number({ label: 'Tip (%)', value: 15, min: 0, max: 100, step: 1, suffix: '%' });
    const people = number({ label: 'How many people', value: 4, min: 1, max: 100, step: 1 });
    const roundUp = checkbox({ label: 'Round each share up to a whole dollar', checked: true });

    const tipChips = node(`<div class="flex flex-wrap gap-2">${TIP_PRESETS.map((p) => `<button type="button" class="home-quick-chip" data-tip="${p}" style="min-height:30px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;padding:0 12px;font-size:12px;font-weight:650;cursor:pointer">${p}%</button>`).join('')}</div>`);

    const calcBtn = button({ label: 'Split the Bill', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4"></div>');
    const overpayBox = node('<div class="mt-3"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(bill.el, tip.el, people.el, roundUp.el, tipChips);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid, overpayBox);
    root.append(panel({ title: 'Bill Split Calculator', description: 'Split any restaurant bill between friends with tip, even shares and optional rounding.', body }));

    tipChips.querySelectorAll('[data-tip]').forEach((chipBtn) => {
        chipBtn.addEventListener('click', () => {
            tip.input.value = chipBtn.dataset.tip;
            run();
        });
    });

    function run() {
        try {
            const res = splitBill({
                bill: Number(bill.input.value),
                tipPercent: Number(tip.input.value),
                people: Math.round(Number(people.input.value)),
                roundUp: roundUp.input.checked,
            });

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Each Person Pays</p>
                    <p class="text-3xl font-extrabold text-emerald-950 mt-1">$${res.perPerson.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Total with Tip</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">$${res.total.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Tip Amount</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">$${res.tipAmount.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-amber-700 uppercase">Collected</p>
                    <p class="text-2xl font-extrabold text-amber-950 mt-1">$${res.collected.toFixed(2)}</p>
                </div>
            `;

            overpayBox.innerHTML = res.overpay > 0.009
                ? `<div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Rounding up collects $${res.overpay.toFixed(2)} extra — enough to bump the tip, or adjust and split exactly.</div>`
                : '';

            feedback.set('');
            announce(`Each person pays $${res.perPerson.toFixed(2)}.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [bill.input, tip.input, people.input].forEach((el) => el.addEventListener('input', run));
    roundUp.input.addEventListener('change', run);
    calcBtn.addEventListener('click', run);
    run();
}
