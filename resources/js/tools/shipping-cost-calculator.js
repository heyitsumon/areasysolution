import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Shipping / parcel cost estimator: chargeable weight (volumetric vs actual),
 * zone multipliers and express vs economy — the math couriers actually use.
 */

export function chargeableWeight(weightKg, lengthCm, widthCm, heightCm, divisor = 5000) {
    if (weightKg <= 0) throw new Error('Actual weight must be greater than zero.');
    if (divisor <= 0) throw new Error('Volumetric divisor must be greater than zero.');
    const volumetric = (lengthCm * widthCm * heightCm) / divisor;
    return { actual: weightKg, volumetric, chargeable: Math.max(weightKg, volumetric), isVolumetric: volumetric > weightKg };
}

export function shippingCost({ chargeableKg, baseRate, zoneMultiplier, serviceMultiplier, insurance = 0 }) {
    const billableKg = Math.ceil(chargeableKg * 2) / 2; // couriers round up to 0.5 kg
    const base = billableKg * baseRate * zoneMultiplier * serviceMultiplier;
    return { billableKg, freight: base, total: base + insurance };
}

const ZONES = {
    domestic: { label: 'Domestic', multiplier: 1, rate: 3.2 },
    regional: { label: 'Regional / neighbouring country', multiplier: 1.45, rate: 4.8 },
    international: { label: 'International', multiplier: 2.1, rate: 6.9 },
};

const SERVICES = {
    economy: { label: 'Economy (5–8 days)', multiplier: 1 },
    standard: { label: 'Standard (3–5 days)', multiplier: 1.35 },
    express: { label: 'Express (1–2 days)', multiplier: 1.9 },
};

export default function mount({ root, announce, complete }) {
    const weight = number({ label: 'Actual weight (kg)', value: 2, min: 0.01, step: 0.01 });
    const length = number({ label: 'Length (cm)', value: 30, min: 1, step: 1 });
    const width = number({ label: 'Width (cm)', value: 20, min: 1, step: 1 });
    const height = number({ label: 'Height (cm)', value: 10, min: 1, step: 1 });
    const zone = select({ label: 'Destination', options: Object.entries(ZONES).map(([v, z]) => ({ value: v, label: z.label })), value: 'domestic' });
    const service = select({ label: 'Speed', options: Object.entries(SERVICES).map(([v, s]) => ({ value: v, label: s.label })), value: 'standard' });
    const insurance = number({ label: 'Declared value insurance ($)', value: 0, min: 0, step: 1, hint: 'Optional — add cover for the parcel value.' });

    const calcBtn = button({ label: 'Estimate Shipping Cost', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');
    const noteBox = node('<div class="mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(weight.el, length.el, width.el, height.el, zone.el, service.el, insurance.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid, noteBox);
    root.append(panel({ title: 'Shipping Cost Calculator', description: 'Estimate courier costs with volumetric (dimensional) weight, zones and service speeds — before you get a surprise at the counter.', body }));

    function run() {
        try {
            const w = chargeableWeight(
                Number(weight.input.value),
                Number(length.input.value),
                Number(width.input.value),
                Number(height.input.value),
            );
            const z = ZONES[zone.select.value];
            const s = SERVICES[service.select.value];
            const res = shippingCost({
                chargeableKg: w.chargeable,
                baseRate: z.rate,
                zoneMultiplier: z.multiplier,
                serviceMultiplier: s.multiplier,
                insurance: Number(insurance.input.value) || 0,
            });

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">Estimated Total</p>
                    <p class="text-3xl font-extrabold text-emerald-950 mt-1">$${res.total.toFixed(2)}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Billable Weight</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">${res.billableKg} kg</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Freight Only</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">$${res.freight.toFixed(2)}</p>
                </div>
            `;

            noteBox.innerHTML = w.isVolumetric
                ? `<div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Charged by size, not weight.</strong> Your parcel's volumetric weight (${w.volumetric.toFixed(1)} kg) exceeds its actual weight (${w.actual} kg). Repack into a smaller box to save money.</div>`
                : `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Charged by actual weight — the parcel fits within its volumetric allowance (${w.volumetric.toFixed(1)} kg).</div>`;

            feedback.set('');
            announce(`Estimated shipping cost $${res.total.toFixed(2)} at ${res.billableKg} kilograms billable weight.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [weight.input, length.input, width.input, height.input, insurance.input].forEach((el) => el.addEventListener('input', run));
    [zone.select, service.select].forEach((el) => el.addEventListener('change', run));
    calcBtn.addEventListener('click', run);
    run();
}
