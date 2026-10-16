import { node } from '../lib/ui';

/**
 * Read-only preview renderers.
 *
 * These draw what the visitor's page will actually look like in Google, on
 * Facebook and on X. Content is assigned through `textContent` rather than
 * interpolated into markup, because everything here comes from user input and
 * a preview box is a very ordinary place to forget that.
 */

/**
 * @param {{title?: string, displayUrl?: string, description?: string}} input
 * @returns {HTMLElement}
 */
export function serpPreviewNode({ title = '', displayUrl = '', description = '' }) {
    const wrap = node(`
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div class="flex items-center gap-2">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">A</span>
                <p class="min-w-0 truncate text-sm text-slate-800" data-serp-url></p>
            </div>
            <p class="mt-1.5 line-clamp-2 text-lg leading-6 text-[#1a0dab]" data-serp-title></p>
            <p class="mt-1 line-clamp-2 text-sm leading-5 text-slate-600" data-serp-desc></p>
        </div>
    `);

    wrap.querySelector('[data-serp-url]').textContent = displayUrl || 'example.com › page';
    wrap.querySelector('[data-serp-title]').textContent = title || 'Your page title appears here';
    wrap.querySelector('[data-serp-desc]').textContent = description || 'Your meta description appears here, giving searchers a reason to click.';

    return wrap;
}

/**
 * @param {{title?: string, description?: string, url?: string, image?: string, siteName?: string, cardType?: string}} input
 * @returns {HTMLElement}
 */
export function socialCardNode({ title = '', description = '', url = '', image = '', siteName = '', cardType = 'summary_large_image' }) {
    const tall = cardType === 'summary_large_image';

    const wrap = node(`
        <div class="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ${tall ? 'h-56' : 'h-32'} text-xs font-medium text-slate-400" data-og-media>
                <span data-og-placeholder>1200 × 630 preview image</span>
            </div>
            <div class="border-t border-slate-200 p-4">
                <p class="text-xs uppercase tracking-wide text-slate-400" data-og-site></p>
                <p class="mt-1 line-clamp-2 font-semibold text-slate-900" data-og-title></p>
                <p class="mt-1 line-clamp-2 text-sm text-slate-600" data-og-desc></p>
                <p class="mt-2 truncate text-xs text-slate-400" data-og-url></p>
            </div>
        </div>
    `);

    wrap.querySelector('[data-og-site]').textContent = siteName || 'YOUR DOMAIN';
    wrap.querySelector('[data-og-title]').textContent = title || 'Your social title appears here';
    wrap.querySelector('[data-og-desc]').textContent = description || 'Your social description appears here.';
    wrap.querySelector('[data-og-url]').textContent = url || 'https://example.com/';

    /*
     * The Content-Security-Policy only allows same-origin, data: and blob:
     * images, so an external preview URL would silently fail to load. Rather
     * than show a broken image, fall back to the labelled placeholder.
     */
    const canLoad = image !== '' && /^(https?:\/\/[^/]+\/|\/|data:|blob:)/i.test(image)
        && (image.startsWith('data:') || image.startsWith('blob:') || image.startsWith('/') || image.startsWith(window.location.origin));

    if (canLoad) {
        const media = wrap.querySelector('[data-og-media]');
        const img = document.createElement('img');

        img.src = image;
        img.alt = '';
        img.className = 'h-full w-full object-cover';
        img.addEventListener('error', () => {
            media.replaceChildren();
            media.append(node('<span class="text-xs font-medium text-slate-400">1200 × 630 preview image</span>'));
        });

        media.replaceChildren(img);
    }

    return wrap;
}
