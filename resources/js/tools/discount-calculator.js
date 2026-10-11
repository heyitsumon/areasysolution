import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel } from '../lib/ui';

export function calculateDiscount(price, discountPercent, extraDiscountPercent = 0, taxPercent = 0) {
    if (price < 0 || discountPercent < 0 || extraDiscountPercent < 0 || taxPercent < 0) {
        throw new Error('Values cannot be negative.');
    }
    const firstDiscountAmount = price * (discountPercent / 100);
    const priceAfterFirst = price - firstDiscountAmount;
    const secondDiscountAmount = priceAfterFirst * (extraDiscountPercent / 100);
    const discountedPrice = priceAfterFirst - secondDiscountAmount;
    const totalSavings = firstDiscountAmount + secondDiscountAmount;
    const effectiveDiscountPercent = price > 0 ? (totalSavings / price) * 100 : 0;
    const taxAmount = discountedPrice * (taxPercent / 100);
    const finalPriceWithTax = discountedPrice + taxAmount;

    return {
        originalPrice: price,
        discountedPrice,
        totalSavings,
        effectiveDiscountPercent,
        taxAmount,
        finalPriceWithTax,
    };
}

export default function mount({ root, announce, complete }) {
    const originalPrice = number({ label: 'Original price ($)', value: 100, min: 0, step: '0.01' });
    const discountInput = number({ label: 'Discount percentage (%)', value: 20, min: 0, max: 100, step: '0.1', suffix: '%' });
    const extraDiscountInput = number({ label: 'Additional discount (optional %)', value: 0, min: 0, max: 100, step: '0.1', suffix: '%' });
    const taxInput = number({ label: 'Sales tax (optional %)', value: 0, min: 0, max: 50, step: '0.1', suffix: '%' });

    const calcBtn = button({ label: 'Calculate Savings', variant: 'primary' });
    const feedback = status();

    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(originalPrice.el, discountInput.el, extraDiscountInput.el, taxInput.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid);

    root.append(panel({ title: 'Discount & Sale Price Calculator', body }));

    function run() {
        const p = Number(originalPrice.input.value);
        const d = Number(discountInput.input.value);
        const ed = Number(extraDiscountInput.input.value) || 0;
        const tax = Number(taxInput.input.value) || 0;

        try {
            const res = calculateDiscount(p, d, ed, tax);

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Final Price</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">$${res.finalPriceWithTax.toFixed(2)}</p>
                    ${tax > 0 ? `<p class="text-[11px] text-indigo-600 mt-0.5">Includes $${res.taxAmount.toFixed(2)} tax</p>` : ''}
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">You Save</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">$${res.totalSavings.toFixed(2)}</p>
                    <p class="text-[11px] text-emerald-700 mt-0.5">${res.effectiveDiscountPercent.toFixed(1)}% total savings</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Original Price</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">$${res.originalPrice.toFixed(2)}</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">Before discount</p>
                </div>
            `;

            feedback.set('');
            announce(`Final price: $${res.finalPriceWithTax.toFixed(2)}. You save $${res.totalSavings.toFixed(2)}.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [originalPrice.input, discountInput.input, extraDiscountInput.input, taxInput.input].forEach((inp) => {
        inp.addEventListener('input', run);
    });
    calcBtn.addEventListener('click', run);

    run();
}

