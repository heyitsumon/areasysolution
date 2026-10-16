import { mountFormOutput } from './form-output-shell';

const RATES = {
    usd: { label: 'US Dollar (USD)', perUsd: 110 },
    eur: { label: 'Euro (EUR)', perUsd: 0.92 },
    gbp: { label: 'British Pound (GBP)', perUsd: 0.79 },
    sar: { label: 'Saudi Riyal (SAR)', perUsd: 3.75 },
    aed: { label: 'UAE Dirham (AED)', perUsd: 3.67 },
    myr: { label: 'Malaysian Ringgit (MYR)', perUsd: 4.7 },
    sgd: { label: 'Singapore Dollar (SGD)', perUsd: 1.34 },
    qar: { label: 'Qatari Riyal (QAR)', perUsd: 3.64 },
    bdt: { label: 'Bangladeshi Taka (BDT)', perUsd: 110 },
};

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Remittance calculator',
        description: 'See how much BDT reaches home after bank/exchange charges when remitting from abroad.',
        fileName: 'remittance.txt',
        fields: [
            { key: 'amount', label: 'Amount to send', type: 'number', value: 1000, min: 1, step: 10 },
            {
                key: 'currency',
                label: 'Sending currency',
                type: 'select',
                value: 'usd',
                options: Object.entries(RATES).map(([value, r]) => ({ value, label: r.label })),
            },
            { key: 'flatFee', label: 'Flat transfer fee (in sending currency)', type: 'number', value: 5, min: 0, step: 1 },
            { key: 'feePercent', label: 'Percentage fee', type: 'number', value: 1, min: 0, max: 15, step: 0.1, suffix: '%' },
            { key: 'rate', label: 'Exchange rate offered (BDT per unit)', type: 'number', value: 0, min: 0, step: 0.01, hint: 'Leave 0 to use the indicative market rate below.' },
            { key: 'govtIncentive', label: 'Government 2.5% remittance incentive', type: 'checkbox', value: true, hint: 'Applies to legal channel remittances in Bangladesh.' },
        ],
        build: (values) => {
            const amount = Number(values.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return { text: '', message: 'Enter the amount you want to send.', tone: 'warning' };
            }
            const currency = RATES[values.currency] ? values.currency : 'usd';
            const perUsd = RATES[currency].perUsd;
            const marketRate = RATES.bdt.perUsd / perUsd; // BDT per unit of sending currency
            const feePercent = Number(values.feePercent) || 0;
            const flatFee = Number(values.flatFee) || 0;
            const fees = amount * (feePercent / 100) + flatFee;
            const netSent = amount - fees;
            if (netSent <= 0) {
                return { text: '', message: 'The fees exceed the amount being sent.', tone: 'error' };
            }
            const offeredRate = Number(values.rate) > 0 ? Number(values.rate) : marketRate;
            const bdtReceived = netSent * offeredRate;
            const incentive = values.govtIncentive ? bdtReceived * 0.025 : 0;
            const finalBdt = bdtReceived + incentive;
            const effectiveRate = finalBdt / amount;
            return {
                text: [
                    `Amount sent: ${amount.toLocaleString()} ${currency.toUpperCase()}`,
                    `Fees (${flatFee} flat + ${feePercent}%): ${fees.toFixed(2)} ${currency.toUpperCase()}`,
                    `Amount after fees: ${netSent.toFixed(2)} ${currency.toUpperCase()}`,
                    `Exchange rate: ${offeredRate.toFixed(2)} BDT per ${currency.toUpperCase()}`,
                    `BDT received: \u09F3${bdtReceived.toFixed(2)}`,
                    values.govtIncentive ? `Govt 2.5% incentive: \u09F3${incentive.toFixed(2)}` : 'No govt incentive applied',
                    `FINAL amount in hand: \u09F3${finalBdt.toFixed(2)}`,
                    `Effective rate: ${effectiveRate.toFixed(2)} BDT per ${currency.toUpperCase()} sent`,
                ].join('\n'),
                stats: [
                    { label: 'In hand', value: `\u09F3${finalBdt.toFixed(0)}` },
                    { label: 'Fees', value: `${fees.toFixed(2)} ${currency.toUpperCase()}` },
                    { label: 'Effective rate', value: effectiveRate.toFixed(2) },
                    { label: 'Incentive', value: incentive > 0 ? `\u09F3${incentive.toFixed(0)}` : 'None' },
                ],
                message: 'Sending through official banking channels qualifies for the 2.5% government cash incentive in Bangladesh.',
                tone: 'success',
            };
        },
    });
}
