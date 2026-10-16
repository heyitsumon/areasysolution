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
        title: 'Remittance fee calculator',
        description: 'See how much money arrives home after bank and exchange fees, and compare the effective rate you are getting.',
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
            { key: 'rate', label: 'Exchange rate offered (local currency per unit)', type: 'number', value: 0, min: 0, step: 0.01, hint: 'Leave 0 to use the indicative market rate below.' },
            { key: 'govtIncentive', label: 'Government incentive bonus (2.5%)', type: 'checkbox', value: false, hint: 'Only for countries that offer one — otherwise leave off.' },
        ],
        build: (values) => {
            const amount = Number(values.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return { text: '', message: 'Enter the amount you want to send.', tone: 'warning' };
            }
            const currency = RATES[values.currency] ? values.currency : 'usd';
            const perUsd = RATES[currency].perUsd;
            const marketRate = RATES.bdt.perUsd / perUsd; // indicative local currency per sending unit
            const feePercent = Number(values.feePercent) || 0;
            const flatFee = Number(values.flatFee) || 0;
            const fees = amount * (feePercent / 100) + flatFee;
            const netSent = amount - fees;
            if (netSent <= 0) {
                return { text: '', message: 'The fees exceed the amount being sent.', tone: 'error' };
            }
            const offeredRate = Number(values.rate) > 0 ? Number(values.rate) : marketRate;
            const received = netSent * offeredRate;
            const incentive = values.govtIncentive ? received * 0.025 : 0;
            const finalAmount = received + incentive;
            const effectiveRate = finalAmount / amount;
            return {
                text: [
                    `Amount sent: ${amount.toLocaleString()} ${currency.toUpperCase()}`,
                    `Fees (${flatFee} flat + ${feePercent}%): ${fees.toFixed(2)} ${currency.toUpperCase()}`,
                    `Amount after fees: ${netSent.toFixed(2)} ${currency.toUpperCase()}`,
                    `Exchange rate: ${offeredRate.toFixed(2)} local per ${currency.toUpperCase()}`,
                    `Received: ${received.toFixed(2)} in local currency`,
                    values.govtIncentive ? `Govt 2.5% incentive: ${incentive.toFixed(2)}` : 'No government incentive applied',
                    `FINAL amount in hand: ${finalAmount.toFixed(2)}`,
                    `Effective rate: ${effectiveRate.toFixed(2)} local per ${currency.toUpperCase()} sent`,
                ].join('\n'),
                stats: [
                    { label: 'In hand', value: finalAmount.toFixed(0) },
                    { label: 'Fees', value: `${fees.toFixed(2)} ${currency.toUpperCase()}` },
                    { label: 'Effective rate', value: effectiveRate.toFixed(2) },
                    { label: 'Incentive', value: incentive > 0 ? incentive.toFixed(0) : 'None' },
                ],
                message: 'Compare this effective rate against the mid-market rate — that gap is the true cost of the transfer.',
                tone: 'success',
            };
        },
    });
}
