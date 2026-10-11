import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { download } from '../lib/files';
import { node, panel, select } from '../lib/ui';

export default function mount({ root, announce, complete }) {
    const scaleSelect = select({
        label: 'Resolution scale',
        value: '2',
        options: [
            { value: '1', label: '1x (Original dimensions)' },
            { value: '2', label: '2x (High resolution / Retina - Recommended)' },
            { value: '4', label: '4x (Ultra HD)' },
        ],
    });

    const bgSelect = select({
        label: 'Background',
        value: 'transparent',
        options: [
            { value: 'transparent', label: 'Transparent (Alpha)' },
            { value: '#ffffff', label: 'Solid White' },
            { value: '#000000', label: 'Solid Black' },
        ],
    });

    const fileInput = node('<input type="file" accept=".svg,image/svg+xml" class="field-input text-sm">');
    const svgText = document.createElement('textarea');
    svgText.rows = 6;
    svgText.className = 'field-input font-mono text-xs';
    svgText.placeholder = 'Or paste SVG XML code here (<svg ...>...</svg>)';

    const renderBtn = button({ label: 'Render PNG', variant: 'primary' });
    const downloadBtn = button({ label: 'Download PNG' });
    downloadBtn.disabled = true;

    const feedback = status();
    const previewContainer = node('<div class="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 bg-slate-50 min-h-48"></div>');
    const canvas = document.createElement('canvas');
    canvas.className = 'max-w-full h-auto rounded border border-slate-200 shadow-sm';
    canvas.hidden = true;
    previewContainer.append(canvas);

    let currentBlob = null;
    let fileName = 'rendered-vector.png';

    const controls = node('<div class="grid gap-4 sm:grid-cols-2"></div>');
    controls.append(scaleSelect.el, bgSelect.el);

    const actionRow = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actionRow.append(renderBtn, downloadBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-sm font-medium text-slate-700">Upload SVG file</label>'),
        fileInput,
        node('<label class="block text-sm font-medium text-slate-700">Or paste SVG markup</label>'),
        svgText,
        controls,
        actionRow,
        feedback.el,
        previewContainer
    );

    root.append(panel({ title: 'Convert SVG to PNG', body }));

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
            fileName = file.name.replace(/\.svg$/i, '') + '.png';
            const reader = new FileReader();
            reader.onload = () => {
                svgText.value = String(reader.result ?? '');
            };
            reader.readAsText(file);
        }
    });

    renderBtn.addEventListener('click', () => {
        const rawSvg = svgText.value.trim();
        if (!rawSvg) {
            feedback.set('Please select an SVG file or paste SVG markup.', 'warning');
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');

            if (!svgEl || doc.querySelector('parsererror')) {
                feedback.set('Invalid SVG markup. Ensure your input contains a valid <svg> element.', 'error');
                return;
            }

            let width = parseFloat(svgEl.getAttribute('width') || '');
            let height = parseFloat(svgEl.getAttribute('height') || '');

            if (!width || !height) {
                const viewBox = svgEl.getAttribute('viewBox');
                if (viewBox) {
                    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
                    if (parts.length === 4) {
                        width = parts[2];
                        height = parts[3];
                    }
                }
            }

            width = width || 300;
            height = height || 300;

            const scale = Number(scaleSelect.select.value) || 1;
            const targetWidth = Math.round(width * scale);
            const targetHeight = Math.round(height * scale);

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            const bg = bgSelect.select.value;
            if (bg !== 'transparent') {
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, targetWidth, targetHeight);
            } else {
                ctx.clearRect(0, 0, targetWidth, targetHeight);
            }

            const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                URL.revokeObjectURL(url);
                canvas.hidden = false;

                canvas.toBlob((pngBlob) => {
                    if (pngBlob) {
                        currentBlob = pngBlob;
                        downloadBtn.disabled = false;
                        feedback.set(`Rendered successfully (${targetWidth} × ${targetHeight} px).`, 'success');
                        announce(`SVG converted to ${targetWidth} by ${targetHeight} PNG.`);
                        void complete();
                    }
                }, 'image/png');
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                feedback.set('Could not render SVG image. Check your vector markup.', 'error');
            };

            img.src = url;
        } catch (err) {
            feedback.set('Render error: ' + err.message, 'error');
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (currentBlob) {
            download(currentBlob, fileName);
            announce('PNG file downloaded.');
        }
    });
}

