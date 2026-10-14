import { mountCalculator } from './calculator-ui';
import { mixedNumberOperation } from './calculators-core';

export default function mount(context) {
    mountCalculator(context, {
        title: 'Mixed Numbers Calculator',
        fields: [
            {
                type: 'select',
                label: 'Operation',
                value: 'add',
                options: [
                    { value: 'add', label: '+' },
                    { value: 'subtract', label: '-' },
                    { value: 'multiply', label: '×' },
                    { value: 'divide', label: '÷' },
                ],
            },
            { label: 'First value', value: '1 3/4' },
            { label: 'Second value', value: '-2 3/8' },
        ],
        calculate: ([operation, first, second]) => {
            const result = mixedNumberOperation(first, second, operation);
            return `${first} ${operation === 'add' ? '+' : operation === 'subtract' ? '-' : operation === 'multiply' ? '×' : '÷'} ${second} = ${result}`;
        },
    });
}
