import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

function rgbToCmyk(r, g, b) {
    const r1 = r / 255, g1 = g / 255, b1 = b / 255;
    const k = 1 - Math.max(r1, g1, b1);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - r1 - k) / (1 - k);
    const m = (1 - g1 - k) / (1 - k);
    const y = (1 - b1 - k) / (1 - k);
    return {
        c: Math.round(c * 100),
        m: Math.round(m * 100),
        y: Math.round(y * 100),
        k: Math.round(k * 100),
    };
}

function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
}

export default function mount({ root, announce, complete }) {
    const colorInput = node('<input type="color" value="#4f46e5" class="h-12 w-20 cursor-pointer rounded-lg border border-slate-300 p-1">');
    const hexInput = node('<input type="text" value="#4f46e5" maxlength="7" class="field-input font-mono text-base uppercase font-semibold">');
    const feedback = status();

    const swatch = node('<div class="h-28 w-full rounded-xl border border-slate-200 shadow-inner flex items-end p-3 transition" style="background-color: #4f46e5;"></div>');
    const swatchLabel = node('<span class="rounded bg-black/60 px-2 py-1 font-mono text-xs text-white backdrop-blur-xs">#4f46e5</span>');
    swatch.append(swatchLabel);

    const formatsContainer = node('<div class="grid gap-3 sm:grid-cols-2"></div>');
    const shadesContainer = node('<div class="mt-4 flex rounded-lg overflow-hidden border border-slate-200 h-10"></div>');
    const contrastContainer = node('<div class="mt-4 grid gap-3 sm:grid-cols-2"></div>');

    const eyedropperBtn = button({ label: 'EyeDropper (Sample Screen)' });
    if (!('EyeDropper' in window)) {
        eyedropperBtn.disabled = true;
        eyedropperBtn.title = 'EyeDropper API not supported in this browser';
    }

    const topRow = node('<div class="flex flex-wrap items-center gap-3"></div>');
    topRow.append(colorInput, hexInput, eyedropperBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        topRow,
        swatch,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Color Codes (Click to Copy)</h3>'),
        formatsContainer,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Tints & Shades Palette</h3>'),
        shadesContainer,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">WCAG Accessibility Contrast</h3>'),
        contrastContainer,
        feedback.el
    );

    root.append(panel({ title: 'Color Picker & Converter', body }));

    function updateColor(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex)) {
            return;
        }

        colorInput.value = hex;
        hexInput.value = hex;
        swatch.style.backgroundColor = hex;
        swatchLabel.textContent = hex.toUpperCase();

        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

        const formats = [
            { label: 'HEX', value: hex.toUpperCase() },
            { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
        ];

        formatsContainer.replaceChildren();
        formats.forEach((f) => {
            const card = node(`
                <button type="button" class="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-indigo-400 hover:bg-white">
                    <div>
                        <span class="block text-xs font-semibold uppercase text-slate-500">${f.label}</span>
                        <span class="font-mono text-sm font-bold text-slate-900">${f.value}</span>
                    </div>
                    <span class="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition">Copy</span>
                </button>
            `);
            card.addEventListener('click', () => {
                copyToClipboard(f.value);
                feedback.set(`Copied ${f.label} (${f.value}) to clipboard.`, 'success');
                announce(`Copied ${f.label}.`);
                void complete();
            });
            formatsContainer.append(card);
        });

        // Shades
        shadesContainer.replaceChildren();
        for (let i = 1; i <= 9; i++) {
            const factor = i / 10;
            const shadeR = Math.round(rgb.r * factor);
            const shadeG = Math.round(rgb.g * factor);
            const shadeB = Math.round(rgb.b * factor);
            const shadeHex = rgbToHex(shadeR, shadeG, shadeB);
            const block = node(`<div class="flex-1 cursor-pointer transition hover:opacity-80" style="background-color: ${shadeHex};" title="${shadeHex}"></div>`);
            block.addEventListener('click', () => updateColor(shadeHex));
            shadesContainer.append(block);
        }

        // Contrast
        const whiteContrast = getContrast(rgb, { r: 255, g: 255, b: 255 });
        const blackContrast = getContrast(rgb, { r: 0, g: 0, b: 0 });

        contrastContainer.replaceChildren();
        contrastContainer.append(
            node(`
                <div class="rounded-xl border border-slate-200 p-3 flex items-center justify-between bg-white">
                    <span class="text-xs font-semibold text-slate-700">Contrast vs White (#FFF)</span>
                    <span class="font-mono font-bold ${whiteContrast >= 4.5 ? 'text-emerald-600' : 'text-amber-600'}">${whiteContrast}:1 ${whiteContrast >= 4.5 ? '✓ AA Pass' : '✗ AA Fail'}</span>
                </div>
            `),
            node(`
                <div class="rounded-xl border border-slate-200 p-3 flex items-center justify-between bg-white">
                    <span class="text-xs font-semibold text-slate-700">Contrast vs Black (#000)</span>
                    <span class="font-mono font-bold ${blackContrast >= 4.5 ? 'text-emerald-600' : 'text-amber-600'}">${blackContrast}:1 ${blackContrast >= 4.5 ? '✓ AA Pass' : '✗ AA Fail'}</span>
                </div>
            `)
        );
    }

    colorInput.addEventListener('input', () => updateColor(colorInput.value));
    hexInput.addEventListener('input', () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9a-f]{6}$/i.test(val)) {
            updateColor(val);
            void complete();
        }
    });

    if ('EyeDropper' in window) {
        eyedropperBtn.addEventListener('click', async () => {
            try {
                // @ts-ignore
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                if (result?.sRGBHex) {
                    updateColor(result.sRGBHex);
                    feedback.set(`Sampled color: ${result.sRGBHex}`, 'success');
                    void complete();
                }
            } catch (err) {
                // Cancelled by user
            }
        });
    }

    updateColor('#4f46e5');
}

