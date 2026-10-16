import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { node, number, panel, select } from '../lib/ui';

/**
 * Aspect ratio calculator / resizer: keep the exact ratio while fitting one
 * known dimension, scale presets (50%, 200%), or convert between ratios like
 * 4:3 → 16:9 with letterbox compensation. Pure math, no canvas needed.
 */

export function solveAspectRatio(originalWidth, originalHeight, target, mode) {
    if (originalWidth <= 0 || originalHeight <= 0) {
        throw new Error('Original width and height must be greater than zero.');
    }
    if (target <= 0) {
        throw new Error('Target size must be greater than zero.');
    }

    const ratio = originalWidth / originalHeight;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(Math.round(originalWidth), Math.round(originalHeight)) || 1;

    if (mode === 'width') {
        return { width: target, height: Math.round(target / ratio), ratio };
    }
    if (mode === 'height') {
        return { width: Math.round(target * ratio), height: target, ratio };
    }
    if (mode === 'scale') {
        return { width: Math.round(originalWidth * (target / 100)), height: Math.round(originalHeight * (target / 100)), ratio };
    }
    // fit-within: largest size that fits inside the bounding box
    const scale = Math.min(target / originalWidth, target / originalHeight);
    return { width: Math.round(originalWidth * scale), height: Math.round(originalHeight * scale), ratio, scaled: scale < 1 };
}

export function ratioLabel(width, height) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(Math.round(width), Math.round(height)) || 1;
    return `${Math.round(width) / d}:${Math.round(height) / d}`;
}

export default function mount({ root, announce, complete }) {
    const originalWidth = number({ label: 'Original width (px)', value: 1920, min: 1, step: 1 });
    const originalHeight = number({ label: 'Original height (px)', value: 1080, min: 1, step: 1 });
    const mode = select({
        label: 'Resize mode',
        options: [
            { value: 'width', label: 'I know the new width → find height' },
            { value: 'height', label: 'I know the new height → find width' },
            { value: 'scale', label: 'Scale by percentage' },
            { value: 'fit', label: 'Fit inside a square / max size' },
        ],
        value: 'width',
    });
    const target = number({ label: 'Target size', value: 1280, min: 0, step: 1, hint: 'Pixels — or a percentage when “scale by percentage” is selected.' });

    const calcBtn = button({ label: 'Calculate Size', variant: 'primary' });
    const feedback = status();
    const resultsGrid = node('<div class="grid gap-3 sm:grid-cols-3 mt-4"></div>');

    const inputsGrid = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    inputsGrid.append(originalWidth.el, originalHeight.el, mode.el, target.el);

    const body = node('<div class="space-y-4"></div>');
    body.append(inputsGrid, calcBtn, feedback.el, resultsGrid);
    root.append(panel({ title: 'Aspect Ratio Calculator', description: 'Resize images and video without distortion — find the missing dimension, scale presets or fit inside a box.', body }));

    function run() {
        try {
            const res = solveAspectRatio(
                Number(originalWidth.input.value),
                Number(originalHeight.input.value),
                Number(target.input.value),
                mode.select.value,
            );

            resultsGrid.innerHTML = `
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase">New Size</p>
                    <p class="text-2xl font-extrabold text-emerald-950 mt-1">${res.width} × ${res.height}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Aspect Ratio</p>
                    <p class="text-2xl font-extrabold text-slate-900 mt-1">${ratioLabel(originalWidth.input.value, originalHeight.input.value)}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
                    <p class="text-xs font-semibold text-indigo-700 uppercase">Decimal Ratio</p>
                    <p class="text-2xl font-extrabold text-indigo-950 mt-1">${res.ratio.toFixed(4)}</p>
                </div>
            `;

            feedback.set('');
            announce(`New size is ${res.width} by ${res.height} pixels.`);
            void complete();
        } catch (err) {
            feedback.set(err.message, 'error');
        }
    }

    [originalWidth.input, originalHeight.input, target.input].forEach((el) => el.addEventListener('input', run));
    mode.select.addEventListener('change', run);
    calcBtn.addEventListener('click', run);
    run();
}
