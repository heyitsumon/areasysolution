import { mountFormOutput } from './form-output-shell';

/**
 * Bangladesh (DESCO/BPDB-style) residential slab tariff for units consumed
 * per month. Lifeline rate applies to the first slab for small consumers.
 * Rates are indicative and editable in the form.
 */
const SLABS = [
    { upTo: 75, rate: 5.26, label: '0-75 units (lifeline)' },
    { upTo: 200, rate: 7.15, label: '76-200 units' },
    { upTo: 300, rate: 8.80, label: '201-300 units' },
    { upTo: 400, rate: 9.95, label: '301-400 units' },
    { upTo: Infinity, rate: 11.20, label: '400+ units' },
];

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Electricity bill calculator (Bangladesh)',
        description: 'Estimate your monthly electricity bill from units consumed using residential slab rates, plus demand and service charges.',
        fileName: 'electricity-bill.txt',
        fields: [
            { key: 'units', label: 'Units consumed (kWh)', type: 'number', value: 180, min: 0, step: 1 },
            { key: 'customRates', label: 'Custom slab rates (comma separated, BDT/kWh)', type: 'text', placeholder: 'e.g. 5.26, 7.15, 8.80, 9.95, 11.20', hint: 'Leave empty to use indicative residential slabs.' },
            { key: 'demandCharge', label: 'Monthly demand/service charge', type: 'number', value: 120, min: 0, step: 10 },
            { key: 'vat', label: 'VAT / surcharge', type: 'number', value: 5, min: 0, max: 30, step: 0.5, suffix: '%' },
            { key: 'meter', label: 'Meter rent', type: 'number', value: 40, min: 0, step: 5 },
        ],
        build: (values) => {
            const units = Number(values.units);
            if (!Number.isFinite(units) || units < 0) {
                return { text: '', message: 'Enter the number of units (kWh) consumed.', tone: 'warning' };
            }
            let rates = SLABS.map((s) => s.rate);
            const customRaw = String(values.customRates).trim();
            if (customRaw !== '') {
                const parsed = customRaw.split(',').map((r) => Number(r.trim())).filter((r) => Number.isFinite(r) && r >= 0);
                if (parsed.length > 0) {
                    rates = [...parsed, parsed[parsed.length - 1]].slice(0, 5);
                }
            }
            const lines = [];
            let remaining = units;
            let energyCost = 0;
            let previousCap = 0;
            SLABS.forEach((slab, index) => {
                const cap = slab.upTo === Infinity ? Infinity : slab.upTo - previousCap;
                const used = Math.min(remaining, cap);
                if (used > 0) {
                    const cost = used * rates[index];
                    energyCost += cost;
                    lines.push(`${slab.label}: ${used.toFixed(0)} units \u00D7 \u09F3${rates[index].toFixed(2)} = \u09F3${cost.toFixed(2)}`);
                    remaining -= used;
                }
                if (slab.upTo !== Infinity) previousCap = slab.upTo;
            });
            const demand = Number(values.demandCharge) || 0;
            const meterRent = Number(values.meter) || 0;
            const vatRate = Number(values.vat) || 0;
            const subtotal = energyCost + demand + meterRent;
            const vat = subtotal * (vatRate / 100);
            const total = subtotal + vat;
            lines.push(`Demand/service charge: \u09F3${demand.toFixed(2)}`, `Meter rent: \u09F3${meterRent.toFixed(2)}`);
            if (vatRate > 0) lines.push(`VAT (${vatRate}%): \u09F3${vat.toFixed(2)}`);
            lines.push(`TOTAL ESTIMATED BILL: \u09F3${total.toFixed(2)}`);
            return {
                text: lines.join('\n'),
                stats: [
                    { label: 'Total bill', value: `\u09F3${total.toFixed(0)}` },
                    { label: 'Energy cost', value: `\u09F3${energyCost.toFixed(0)}` },
                    { label: 'Units', value: String(units) },
                    { label: 'Avg per unit', value: units > 0 ? `\u09F3${(total / units).toFixed(2)}` : '-' },
                ],
                message: 'Slab rates are indicative - check your utility (BPDB/DESCO/REB) for current tariffs and enter them above.',
                tone: 'info',
            };
        },
    });
}
