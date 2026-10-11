import { button } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { escapeHtml } from '../lib/dom';
import { node, panel, text } from '../lib/ui';

export default function mount({ root, announce, complete }) {
    const titleInput = text({
        label: 'Page Title (SEO Title)',
        value: 'ArEasySolution - Free Online PDF, Image & Developer Tools',
        placeholder: 'Recommended 50–60 characters',
    });

    const descInput = document.createElement('textarea');
    descInput.rows = 3;
    descInput.className = 'field-input text-xs';
    descInput.placeholder = 'Recommended 140–160 characters';
    descInput.value = 'Free online tools for PDFs, image compression, text formatting, calculators, and developers. Fast, private, browser-based utilities with no sign-up required.';

    const urlInput = text({
        label: 'Canonical Website URL',
        value: 'https://areasysolution.com',
        placeholder: 'https://example.com/page',
    });

    const imageInput = text({
        label: 'Social Preview Image URL (og:image)',
        value: 'https://areasysolution.com/social-preview.png',
        placeholder: 'https://example.com/images/card.png',
    });

    const twitterHandleInput = text({
        label: 'Twitter / X Handle (optional)',
        value: '@ArEasySolution',
        placeholder: '@username',
    });

    const copyBtn = button({ label: 'Copy Meta Tags HTML', variant: 'primary' });
    const feedback = status();

    const output = document.createElement('textarea');
    output.rows = 8;
    output.readOnly = true;
    output.className = 'field-input font-mono text-xs';

    // Live Google SERP Preview Card
    const serpPreview = node(`
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span class="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">G</span>
                <span data-serp-url class="truncate text-slate-600">https://areasysolution.com</span>
            </div>
            <h4 data-serp-title class="text-base font-semibold text-indigo-700 hover:underline cursor-pointer truncate">ArEasySolution - Free Online PDF, Image & Developer Tools</h4>
            <p data-serp-desc class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">Free online tools for PDFs, image compression, text formatting, calculators, and developers. Fast, private, browser-based utilities with no sign-up required.</p>
        </div>
    `);

    const inputsGrid = node('<div class="space-y-3"></div>');
    inputsGrid.append(
        titleInput.el,
        node('<label class="block text-xs font-bold uppercase text-slate-500">Meta Description</label>'),
        descInput,
        urlInput.el,
        imageInput.el,
        twitterHandleInput.el
    );

    const body = node('<div class="space-y-4"></div>');
    body.append(
        inputsGrid,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Google Search (SERP) Live Preview</h3>'),
        serpPreview,
        copyBtn,
        feedback.el,
        node('<h3 class="text-sm font-bold text-slate-900 mt-4">Generated HTML &lt;meta&gt; Tags</h3>'),
        output
    );

    root.append(panel({ title: 'SEO & Social Meta Tag Generator', body }));

    function update() {
        const title = titleInput.input.value.trim() || 'Website Title';
        const desc = descInput.value.trim() || 'Website Description';
        const url = urlInput.input.value.trim() || 'https://example.com';
        const img = imageInput.input.value.trim();
        const twitter = twitterHandleInput.input.value.trim();

        // Update SERP preview
        serpPreview.querySelector('[data-serp-title]').textContent = title;
        serpPreview.querySelector('[data-serp-desc]').textContent = desc;
        serpPreview.querySelector('[data-serp-url]').textContent = url;

        // Generate Meta tags
        let tags = `<!-- Primary Meta Tags -->\n`;
        tags += `<title>${escapeHtml(title)}</title>\n`;
        tags += `<meta name="title" content="${escapeHtml(title)}">\n`;
        tags += `<meta name="description" content="${escapeHtml(desc)}">\n`;
        tags += `<meta name="robots" content="index, follow">\n`;
        tags += `<link rel="canonical" href="${escapeHtml(url)}">\n\n`;

        tags += `<!-- Open Graph / Facebook -->\n`;
        tags += `<meta property="og:type" content="website">\n`;
        tags += `<meta property="og:url" content="${escapeHtml(url)}">\n`;
        tags += `<meta property="og:title" content="${escapeHtml(title)}">\n`;
        tags += `<meta property="og:description" content="${escapeHtml(desc)}">\n`;
        if (img) {
            tags += `<meta property="og:image" content="${escapeHtml(img)}">\n`;
        }

        tags += `\n<!-- Twitter Card -->\n`;
        tags += `<meta name="twitter:card" content="summary_large_image">\n`;
        tags += `<meta name="twitter:url" content="${escapeHtml(url)}">\n`;
        tags += `<meta name="twitter:title" content="${escapeHtml(title)}">\n`;
        tags += `<meta name="twitter:description" content="${escapeHtml(desc)}">\n`;
        if (img) {
            tags += `<meta name="twitter:image" content="${escapeHtml(img)}">\n`;
        }
        if (twitter) {
            tags += `<meta name="twitter:site" content="${escapeHtml(twitter)}">\n`;
        }

        output.value = tags;
        void complete();
    }

    [titleInput.input, descInput, urlInput.input, imageInput.input, twitterHandleInput.input].forEach((el) => {
        el.addEventListener('input', update);
    });

    copyBtn.addEventListener('click', () => {
        copyToClipboard(output.value);
        feedback.set('Copied meta tags to clipboard! Paste inside your <head> section.', 'success');
        announce('Copied meta tags.');
        void complete();
    });

    update();
}

