import { mountFormOutput } from './form-output-shell';

/**
 * Given any two of V (volts), I (amps), R (ohms) and P (watts), solve the
 * remaining two with V = IR and P = VI.
 */
function solve({ voltage, current, resistance, power }) {
    const known = { voltage, current, resistance, power };
    const filled = Object.values(known).filter((v) => v !== null && v !== '' && Number.isFinite(Number(v)));
    if (filled.length < 2) {
        return null;
    }
    let V = known.voltage !== '' ? Number(known.voltage) : null;
    let I = known.current !== '' ? Number(known.current) : null;
    let R = known.resistance !== '' ? Number(known.resistance) : null;
    let P = known.power !== '' ? Number(known.power) : null;
    for (let pass = 0; pass < 3; pass += 1) {
        if (V === null && I !== null && R !== null) V = I * R;
        if (I === null && V !== null && R !== null) I = V / R;
        if (R === null && V !== null && I !== null) R = V / I;
        if (P === null && V !== null && I !== null) P = V * I;
        if (V === null && P !== null && I !== null) V = P / I;
        if (I === null && P !== null && V !== null) I = P / V;
        if (P === null && I !== null && R !== null) P = I * I * R;
        if (P === null && V !== null && R !== null) P = (V * V) / R;
        if (R === null && P !== null && I !== null) R = P / (I * I);
        if (R === null && P !== null && V !== null) R = (V * V) / P;
    }
    return { V, I, R, P };
}

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Ohm\u2019s law calculator',
        description: 'Fill in any two known values (voltage, current, resistance or power) and the rest are solved.',
        fileName: 'ohms-law.txt',
        fields: [
            { key: 'voltage', label: 'Voltage (V)', type: 'number', placeholder: 'e.g. 12', step: 'any' },
            { key: 'current', label: 'Current (I, amps)', type: 'number', placeholder: 'e.g. 2', step: 'any' },
            { key: 'resistance', label: 'Resistance (R, ohms)', type: 'number', placeholder: 'e.g. 6', step: 'any' },
            { key: 'power', label: 'Power (P, watts)', type: 'number', placeholder: 'e.g. 24', step: 'any' },
        ],
        build: (values) => {
            const solved = solve(values);
            if (!solved) {
                return { text: '', message: 'Enter at least two values to solve the circuit.', tone: 'info' };
            }
            const fmt = (v, unit) => (v === null ? '-' : `${Number(v.toFixed(4))} ${unit}`);
            return {
                text: [
                    `Voltage (V): ${fmt(solved.V, 'volts')}`,
                    `Current (I): ${fmt(solved.I, 'amps')}`,
                    `Resistance (R): ${fmt(solved.R, 'ohms')}`,
                    `Power (P): ${fmt(solved.P, 'watts')}`,
                ].join('\n'),
                stats: [
                    { label: 'Voltage', value: solved.V === null ? '-' : `${Number(solved.V.toFixed(2))} V` },
                    { label: 'Current', value: solved.I === null ? '-' : `${Number(solved.I.toFixed(2))} A` },
                    { label: 'Resistance', value: solved.R === null ? '-' : `${Number(solved.R.toFixed(2))} \u03A9` },
                    { label: 'Power', value: solved.P === null ? '-' : `${Number(solved.P.toFixed(2))} W` },
                ],
                message: 'Leave the two unknown fields empty. Formulas: V = I\u00D7R, P = V\u00D7I.',
                tone: 'success',
            };
        },
    });
}
