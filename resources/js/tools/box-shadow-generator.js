import { mountFormOutput } from './form-output-shell';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'CSS box shadow generator',
        description: 'Tune offset, blur, spread and color to build a CSS box-shadow and copy the exact code.',
        fileName: 'box-shadow.css',
        fields: [
            { key: 'offsetX', label: 'Offset X', type: 'number', value: 0, min: -50, max: 50, step: 1, suffix: 'px' },
            { key: 'offsetY', label: 'Offset Y', type: 'number', value: 10, min: -50, max: 50, step: 1, suffix: 'px' },
            { key: 'blur', label: 'Blur radius', type: 'number', value: 25, min: 0, max: 100, step: 1, suffix: 'px' },
            { key: 'spread', label: 'Spread radius', type: 'number', value: 0, min: -50, max: 50, step: 1, suffix: 'px' },
            { key: 'color', label: 'Shadow color', type: 'color', value: '#0f172a' },
            { key: 'opacity', label: 'Opacity', type: 'number', value: 20, min: 0, max: 100, step: 1, suffix: '%' },
            { key: 'inset', label: 'Inner (inset) shadow', type: 'checkbox' },
        ],
        build: (values) => {
            const { r, g, b } = {
                r: parseInt(values.color.slice(1, 3), 16),
                g: parseInt(values.color.slice(3, 5), 16),
                b: parseInt(values.color.slice(5, 7), 16),
            };
            const alpha = (Number(values.opacity) || 0) / 100;
            const inset = values.inset ? 'inset ' : '';
            const shadow = `${inset}${values.offsetX}px ${values.offsetY}px ${values.blur}px ${values.spread}px rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
            const css = `box-shadow: ${shadow};`;
            const preview = document.createElement('div');
            preview.style.cssText = `height: 8rem; margin: 2rem; border-radius: 0.75rem; background: #fff; ${css}`;
            const stage = document.createElement('div');
            stage.className = 'rounded-xl bg-slate-100 p-2';
            stage.append(preview);
            return {
                text: css,
                preview: stage,
                stats: [
                    { label: 'Offset', value: `${values.offsetX}, ${values.offsetY}` },
                    { label: 'Blur', value: `${values.blur}px` },
                    { label: 'Spread', value: `${values.spread}px` },
                    { label: 'Alpha', value: alpha.toFixed(2) },
                ],
                message: 'Layer multiple shadows by comma-separating them in the same box-shadow rule.',
                tone: 'success',
            };
        },
    });
}
