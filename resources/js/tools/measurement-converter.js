import { mountFormOutput } from './form-output-shell';

/**
 * Multi-domain unit converter. Values are defined per base unit; temperature
 * is special-cased because it is affine, not proportional.
 */
const LENGTH = { meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 };
const WEIGHT = { kilogram: 1, gram: 0.001, milligram: 0.000001, tonne: 1000, pound: 0.45359237, ounce: 0.028349523125, stone: 6.35029318 };
const VOLUME = { liter: 1, milliliter: 0.001, 'cubic meter': 1000, gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473, cup: 0.2365882365, 'fluid ounce': 0.0295735295625 };
const AREA = { 'square meter': 1, 'square kilometer': 1000000, 'square centimeter': 0.0001, hectare: 10000, 'square mile': 2589988.110336, acre: 4046.8564224, 'square foot': 0.09290304, 'square inch': 0.00064516 };
const SPEED = { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, knot: 1.852 };
const TEMPERATURES = ['celsius', 'fahrenheit', 'kelvin'];

const FAMILIES = {
    length: { name: 'Length', units: LENGTH },
    weight: { name: 'Weight', units: WEIGHT },
    volume: { name: 'Volume', units: VOLUME },
    area: { name: 'Area', units: AREA },
    speed: { name: 'Speed', units: SPEED },
    temperature: { name: 'Temperature', units: null },
};

function toCelsius(value, from) {
    if (from === 'fahrenheit') return (value - 32) / 1.8;
    if (from === 'kelvin') return value - 273.15;
    return value;
}

function fromCelsius(value, to) {
    if (to === 'fahrenheit') return value * 1.8 + 32;
    if (to === 'kelvin') return value + 273.15;
    return value;
}

function optionsFor(family) {
    if (family === 'temperature') {
        return TEMPERATURES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));
    }
    return Object.keys(FAMILIES[family].units).map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }));
}

function convert(value, family, from, to) {
    if (family === 'temperature') {
        return fromCelsius(toCelsius(value, from), to);
    }
    const units = FAMILIES[family].units;
    return value * units[from] / units[to];
}

export default function mount(context) {
    const FIELDS = () => [
        { key: 'value', label: 'Value to convert', type: 'number', value: 1, step: 'any' },
        {
            key: 'family',
            label: 'Measurement type',
            type: 'select',
            value: 'length',
            options: Object.entries(FAMILIES).map(([value, f]) => ({ value, label: f.name })),
        },
        { key: 'from', label: 'From unit', type: 'select', value: 'meter', options: optionsFor('length') },
        { key: 'to', label: 'To unit', type: 'select', value: 'foot', options: optionsFor('length') },
    ];

    mountFormOutput(context, {
        title: 'Measurement converter',
        description: 'Convert length, weight, volume, area, speed and temperature between metric and imperial units instantly.',
        fileName: 'conversion.txt',
        fields: FIELDS(),
        build: (values) => {
            const value = Number(values.value);
            if (!Number.isFinite(value)) {
                return { text: '', message: 'Enter a numeric value to convert.', tone: 'warning' };
            }
            const family = values.family;
            let from = values.from;
            let to = values.to;
            if (family !== 'temperature') {
                const units = FAMILIES[family].units;
                if (!(from in units)) from = Object.keys(units)[0];
                if (!(to in units)) to = Object.keys(units)[1] ?? Object.keys(units)[0];
            } else {
                if (!TEMPERATURES.includes(from)) from = 'celsius';
                if (!TEMPERATURES.includes(to)) to = 'fahrenheit';
            }
            const result = convert(value, family, from, to);
            const nice = (n) => Number(n.toPrecision(8)).toLocaleString(undefined, { maximumFractionDigits: 6 });
            return {
                text: [
                    `${nice(value)} ${from} = ${nice(result)} ${to}`,
                    `1 ${from} = ${nice(convert(1, family, from, to))} ${to}`,
                    `1 ${to} = ${nice(convert(1, family, to, from))} ${from}`,
                ].join('\n'),
                stats: [
                    { label: 'Result', value: nice(result) },
                    { label: 'From', value: `${nice(value)} ${from}` },
                    { label: 'To', value: `${nice(result)} ${to}` },
                    { label: 'Type', value: FAMILIES[family].name },
                ],
                message: 'Exact factors are used (1 inch = 2.54 cm by definition), so results are precise.',
                tone: 'success',
            };
        },
    });
}
