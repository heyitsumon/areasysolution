import { text } from '../lib/ui';
import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'CSS gradient generator',
        description: 'Pick colors, angle and type to build a CSS gradient and copy the ready-to-paste code.',
        fileName: 'gradient.css',
        fields: [
            { key: 'type', label: 'Gradient type', type: 'select', value: 'linear', options: [{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }] },
            { key: 'color1', label: 'Start color', type: 'color', value: '#6366f1' },
            { key: 'color2', label: 'End color', type: 'color', value: '#ec4899' },
            { key: 'color3', label: 'Optional middle color', type: 'color', value: '#22d3ee' },
            { key: 'useThird', label: 'Use middle color', type: 'checkbox' },
            { key: 'angle', label: 'Angle (linear only)', type: 'number', value: 90, min: 0, max: 360, step: 1, suffix: 'deg' },
            { key: 'shape', label: 'Radial shape', type: 'select', value: 'circle', options: [{ value: 'circle', label: 'Circle' }, { value: 'ellipse', label: 'Ellipse' }] },
        ],
        build: (values) => {
            const stops = values.useThird
                ? `${values.color1}, ${values.color3} 50%, ${values.color2}`
                : `${values.color1}, ${values.color2}`;
            const css = values.type === 'radial'
                ? `background: radial-gradient(${values.shape}, ${stops});`
                : `background: linear-gradient(${values.angle}deg, ${stops});`;
            const preview = document.createElement('div');
            preview.style.cssText = `${css} height: 9rem; border-radius: 0.75rem; border: 1px solid #e2e8f0;`;
            return {
                text: css,
                preview,
                stats: [
                    { label: 'Type', value: values.type === 'radial' ? `Radial (${values.shape})` : `Linear ${values.angle}\u00B0` },
                    { label: 'Colors', value: values.useThird ? '3' : '2' },
                    { label: 'Output', value: 'CSS' },
                    { label: 'Prefix needed', value: 'None' },
                ],
                message: 'Works in every modern browser without prefixes. Paste into any CSS rule or inline style.',
                tone: 'success',
            };
        },
    });
}
