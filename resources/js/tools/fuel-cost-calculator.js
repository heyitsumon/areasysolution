import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Fuel cost calculator',
        description: 'Enter distance, fuel efficiency and gas price to get the fuel cost of your trip.',
        fileName: 'fuel-cost.txt',
        fields: [
            { key: 'distance', label: 'Trip distance', type: 'number', value: 100, min: 0, step: 1, suffix: 'km or mi' },
            { key: 'efficiency', label: 'Fuel efficiency', type: 'number', value: 8, min: 0.1, step: 0.1, hint: 'Distance per unit of fuel, e.g. 8 km/L or 30 mpg.' },
            { key: 'price', label: 'Fuel price per liter/gallon', type: 'number', value: 1.5, min: 0, step: 0.01 },
            { key: 'people', label: 'People sharing the cost', type: 'number', value: 1, min: 1, step: 1 },
            { key: 'roundTrip', label: 'Round trip (double the distance)', type: 'checkbox' },
        ],
        build: (values) => {
            const distance = Number(values.distance);
            const efficiency = Number(values.efficiency);
            const price = Number(values.price);
            const people = Math.max(1, Math.round(Number(values.people) || 1));
            if (!Number.isFinite(distance) || !Number.isFinite(efficiency) || !Number.isFinite(price) || distance <= 0 || efficiency <= 0) {
                return { text: '', message: 'Enter a distance, efficiency and price greater than zero.', tone: 'warning' };
            }
            const totalDistance = distance * (values.roundTrip ? 2 : 1);
            const fuel = totalDistance / efficiency;
            const cost = fuel * price;
            const perPerson = cost / people;
            return {
                text: [
                    `Distance: ${totalDistance} km/mi${values.roundTrip ? ' (round trip)' : ''}`,
                    `Fuel needed: ${fuel.toFixed(2)} L/gal`,
                    `Total fuel cost: $${cost.toFixed(2)}`,
                    people > 1 ? `Cost per person (${people} people): $${perPerson.toFixed(2)}` : '',
                ].filter(Boolean).join('\n'),
                stats: [
                    { label: 'Fuel needed', value: `${fuel.toFixed(1)}` },
                    { label: 'Total cost', value: `$${cost.toFixed(2)}` },
                    { label: 'Cost / person', value: `$${perPerson.toFixed(2)}` },
                    { label: 'Distance', value: `${totalDistance}` },
                ],
                message: 'Tip: driving 90-100 km/h instead of 120 km/h can cut fuel use by up to 20%.',
                tone: 'success',
            };
        },
    });
}
