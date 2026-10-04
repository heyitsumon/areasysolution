import { button, range, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { download } from '../lib/files';
import { node, panel, text } from '../lib/ui';

export default function mount({ root, complete }) {
    const content = textarea({
        label: 'Text or URL',
        rows: 4,
        placeholder: 'https://example.com',
        hint: 'Anything you can type can be encoded, including Wi-Fi details or contact information.',
    });
    const size = range({ label: 'Image size', min: 128, max: 1024, step: 64, value: 320, format: (value) => `${value} px` });
    const foreground = text({ label: 'Code color', type: 'color', value: '#111827' });
    const background = text({ label: 'Background color', type: 'color', value: '#ffffff' });
    foreground.input.className = 'h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1';
    background.input.className = foreground.input.className;

    const settings = node('<div class="grid gap-4 sm:grid-cols-3"></div>');
    settings.append(size.el, foreground.el, background.el);

    const generate = button({ label: 'Generate QR code', variant: 'primary' });
    const statusView = status();
    const canvas = document.createElement('canvas');
    canvas.className = 'mx-auto max-w-full rounded-lg border border-slate-200';
    canvas.setAttribute('aria-label', 'Generated QR code');
    canvas.hidden = true;

    const save = button({ label: 'Download PNG' });
    save.disabled = true;

    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    actions.append(generate, save);

    root.append(
        panel({ title: 'QR code content', body: content.el }),
        panel({ title: 'Appearance', body: node('<div></div>') }),
    );
    const appearance = root.lastElementChild.querySelector('[data-panel-body]');
    appearance.append(settings, actions, statusView.el);
    root.append(panel({ title: 'Preview', body: canvas }));

    generate.addEventListener('click', async () => {
        const value = content.textarea.value.trim();

        if (value === '') {
            statusView.set('Enter text or a URL to generate a QR code.', 'warning');
            return;
        }

        generate.disabled = true;
        statusView.set('Generating your QR code…');

        try {
            const { default: QRCode } = await import('qrcode');
            await QRCode.toCanvas(canvas, value, {
                width: Number(size.input.value),
                margin: 2,
                errorCorrectionLevel: 'M',
                color: {
                    dark: foreground.input.value,
                    light: background.input.value,
                },
            });

            canvas.hidden = false;
            save.disabled = false;
            statusView.set('QR code generated. Scan it before sharing to confirm it contains the right content.', 'success');
            complete();
        } catch (error) {
            statusView.set('The QR code could not be generated. Try shorter text or a different color.', 'error');
            reportError(error);
        } finally {
            generate.disabled = false;
        }
    });

    save.addEventListener('click', () => {
        if (! canvas.width) return;

        canvas.toBlob((blob) => {
            if (! blob) {
                statusView.set('The QR code image could not be prepared for download.', 'error');
                return;
            }

            download(blob, 'qr-code.png');
        }, 'image/png');
    });
}
