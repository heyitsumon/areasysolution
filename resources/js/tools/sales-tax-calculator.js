import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

export function calculateSalesTax(amount, taxRate, mode = 'add') {
    if (amount < 0 || taxRate < 0) {
        throw new Error('Amount and tax rate cannot be negative.');
    }
    const rate = taxRate / 100;
    let netAmount = 0;
    let taxAmount = 0;
    let grossAmount = 0;

    if (mode === 'add') {
        netAmount = amount;
        taxAmount = amount * rate;
        grossAmount = netAmount + taxAmount;
    } else {
        // Reverse tax / extraction from inclusive total
        grossAmount = amount;
        netAmount = grossAmount / (1 + rate);
        taxAmount = grossAmount - netAmount;
    }

    return { netAmount, taxAmount, grossAmount, taxRate, mode };
}

export default function mount({ root, announce, complete }) {
    const amountInput = number({ label: 'Amount ($)', value: 100, min: 0, step: '0.01' });
    const taxRateInput = number({ label: 'Tax rate (%)', value: 8.25, min: 0, max: 100, step: '0.01', suffix: '%' });
    const modeSelect = select({
        label: 'Calculation mode',
        value: 'add',
        options: [
            { value: 'add', label: 'Add tax to net price (Exclusive)' },
            { value: 'reverse', label: 'Extract tax from total price (Inclusive)' },
        ],
    });

    const calcBtn = button({ label: 'Calculate Tax', variant: 'primary' });
    const feedback = status();

    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(amountInput.el, taxRateInput.el, modeSelect.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid);

    root.append(panel({ title: 'Sales Tax Calculator', body }));

    function run() {
        const amt = Number(amountInput.input.value);
        const rate = Number(taxRateInput.input.value);
        const mode = modeSelect.select.value;

        try {
            const res = calculateSalesTax(amt, rate, mode);

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Net Price (Before Tax)</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">$${res.netAmount.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Tax Amount (${res.taxRate}%)</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">$${res.taxAmount.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Gross Total (After Tax)</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">$${res.grossAmount.toFixed(2)}</p>
                </div>
            `;

            feedback.set('');
            announce(`Gross total: $${res.grossAmount.toFixed(2)} with $${res.taxAmount.toFixed(2)} tax.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [amountInput.input, taxRateInput.input, modeSelect.select].forEach((el) => el.addEventListener('input', run));
    calcBtn.addEventListener('click', run);

    run();
}

