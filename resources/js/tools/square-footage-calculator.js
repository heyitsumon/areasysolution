import { mountFormOutput } from './form-output-shell';

const FOOT_PER_METER = 3.28084;
const UNIT_TO_FEET = { meters: 1 / FOOT_PER_METER, feet: 1, inches: 1 / 12, yards: 3 };

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Square footage calculator',
        description: 'Enter room dimensions to get square footage, square meters and estimated flooring cost.',
        fileName: 'square-footage.txt',
        fields: [
            { key: 'length', label: 'Length', type: 'number', value: 12, min: 0, step: 0.1, suffix: 'units' },
            {
                key: 'lengthUnit',
                label: 'Length unit',
                type: 'select',
                value: 'feet',
                options: [{ value: 'feet', label: 'Feet' }, { value: 'meters', label: 'Meters' }, { value: 'inches', label: 'Inches' }, { value: 'yards', label: 'Yards' }],
            },
            { key: 'width', label: 'Width', type: 'number', value: 10, min: 0, step: 0.1, suffix: 'units' },
            {
                key: 'widthUnit',
                label: 'Width unit',
                type: 'select',
                value: 'feet',
                options: [{ value: 'feet', label: 'Feet' }, { value: 'meters', label: 'Meters' }, { value: 'inches', label: 'Inches' }, { value: 'yards', label: 'Yards' }],
            },
            { key: 'costPerUnit', label: 'Material cost per sq ft', type: 'number', value: 0, min: 0, step: 0.01, hint: 'Optional: flooring, paint or tile cost per square foot.' },
            { key: 'quantity', label: 'Number of identical rooms', type: 'number', value: 1, min: 1, step: 1 },
        ],
        build: (values) => {
            const length = Number(values.length);
            const width = Number(values.width);
            const rooms = Math.max(1, Math.round(Number(values.quantity) || 1));
            if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
                return { text: '', message: 'Enter a length and width greater than zero.', tone: 'warning' };
            }
            const lengthFt = length * UNIT_TO_FEET[values.lengthUnit];
            const widthFt = width * UNIT_TO_FEET[values.widthUnit];
            const sqft = lengthFt * widthFt * rooms;
            const sqm = sqft * 0.092903;
            const cost = Number(values.costPerUnit) || 0;
            const totalCost = sqft * cost;
            const lines = [
                `Room: ${length} ${values.lengthUnit} x ${width} ${values.widthUnit} (${rooms} room${rooms > 1 ? 's' : ''})`,
                `Area: ${sqft.toFixed(2)} sq ft  |  ${sqm.toFixed(2)} sq m`,
                cost > 0 ? `Estimated material cost: $${totalCost.toFixed(2)} (at $${cost}/sq ft)` : 'Add a cost per sq ft above for an estimate.',
            ];
            return {
                text: lines.join('\n'),
                stats: [
                    { label: 'Square feet', value: sqft.toFixed(1) },
                    { label: 'Square meters', value: sqm.toFixed(1) },
                    { label: 'Rooms', value: String(rooms) },
                    cost > 0 ? { label: 'Est. cost', value: `$${totalCost.toFixed(0)}` } : { label: 'Cost input', value: 'Not set' },
                ],
                message: 'Tip: add 10% extra material to cover cuts and waste.',
                tone: 'success',
            };
        },
    });
}
