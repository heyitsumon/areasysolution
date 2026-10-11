import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { node, panel } from '../lib/ui';
import JSZip from 'jszip';

const SIZES = [
    { size: 16, name: 'favicon-16x16.png', label: 'Standard tab icon' },
    { size: 32, name: 'favicon-32x32.png', label: 'Retina tab icon' },
    { size: 48, name: 'favicon-48x48.png', label: 'Desktop shortcut' },
    { size: 180, name: 'apple-touch-icon.png', label: 'Apple iOS touch icon' },
];

export default function mount({ root, announce, complete }) {
    const fileInput = node('<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="field-input text-sm">');
    const previewGrid = node('<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"></div>');
    const feedback = status();

    const generateBtn = button({ label: 'Download All Favicons (.ZIP)', variant: 'primary' });
    generateBtn.disabled = true;

    const copyHtmlBtn = button({ label: 'Copy HTML <head> Tags' });

    const htmlOutput = document.createElement('textarea');
    htmlOutput.rows = 4;
    htmlOutput.readOnly = true;
    htmlOutput.className = 'field-input font-mono text-xs mt-3';
    htmlOutput.value = `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`;

    let generatedBlobs = [];

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(generateBtn, copyHtmlBtn);

    const body = node('<div class="space-y-4"></div>');
    body.append(
        node('<label class="block text-sm font-medium text-slate-700">Upload Square Logo or Image</label>'),
        fileInput,
        previewGrid,
        actions,
        feedback.el,
        node('<h3 class="text-sm font-bold text-slate-900 mt-6">HTML Code for your &lt;head&gt;</h3>'),
        htmlOutput
    );

    root.append(panel({ title: 'Favicon Generator', body }));

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        feedback.set('Rendering favicons at multiple resolutions...');
        previewGrid.replaceChildren();
        generatedBlobs = [];

        try {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            for (const item of SIZES) {
                const canvas = document.createElement('canvas');
                canvas.width = item.size;
                canvas.height = item.size;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, item.size, item.size);

                const card = node(`
                    <div class="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
                        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 border border-slate-100"></div>
                        <p class="mt-2 text-xs font-bold text-slate-900">${item.size} × ${item.size}</p>
                        <p class="text-[10px] text-slate-500">${item.label}</p>
                    </div>
                `);

                const previewImg = new Image();
                previewImg.src = canvas.toDataURL('image/png');
                previewImg.style.width = `${Math.min(item.size, 48)}px`;
                previewImg.style.height = `${Math.min(item.size, 48)}px`;
                previewImg.className = 'rounded object-contain';
                card.querySelector('div').append(previewImg);
                previewGrid.append(card);

                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                if (blob) {
                    generatedBlobs.push({ name: item.name, blob });
                }
            }

            URL.revokeObjectURL(objectUrl);
            generateBtn.disabled = false;
            feedback.set('Favicons generated! Download your ZIP package or copy the HTML code.', 'success');
            announce('Favicons generated.');
            void complete();
        } catch (err) {
            feedback.set('Failed to generate favicons: ' + err.message, 'error');
        }
    });

    generateBtn.addEventListener('click', async () => {
        if (generatedBlobs.length === 0) return;
        const zip = new JSZip();
        generatedBlobs.forEach(({ name, blob }) => {
            zip.file(name, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        download(zipBlob, 'favicon-package.zip');
        announce('Favicon zip downloaded.');
    });

    copyHtmlBtn.addEventListener('click', () => {
        copyToClipboard(htmlOutput.value);
        feedback.set('HTML code copied to clipboard!', 'success');
        announce('HTML code copied.');
        void complete();
    });
}

