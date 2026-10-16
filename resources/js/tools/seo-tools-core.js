/**
 * Pure helpers behind the SEO tool family.
 *
 * Every function here answers a question a site owner actually asks - "is my
 * title the right length?", "what does my snippet look like?", "what should
 * this robots.txt contain?" - without touching the network.
 */

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those', 'as',
    'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her', 'i', 'not', 'no', 'so',
    'from', 'into', 'than', 'then', 'them', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'can',
]);

const NARROW = new Set([...Array.from('iljtfrI'), '.', ',', ';', ':', "'", '!', '|', '(', ')', '[', ']', '{', '}', '`', '/']);
const WIDE = new Set([...Array.from('WMmw@'), '—', '…']);

/**
 * Approximate rendered width in pixels.
 *
 * Google truncates titles at roughly 600px and descriptions at roughly 960px,
 * which is why counting characters alone misleads: "WWWW" and "iiii" are both
 * four characters but nowhere near the same width.
 *
 * @param {string} text
 * @param {number} [fontSize]
 * @returns {number}
 */
export function approxPixelWidth(text, fontSize = 20) {
    let units = 0;

    for (const char of text) {
        if (NARROW.has(char)) {
            units += 0.28;
        } else if (WIDE.has(char)) {
            units += 0.78;
        } else if (char === char.toUpperCase() && char !== char.toLowerCase()) {
            units += 0.58;
        } else {
            units += 0.5;
        }
    }

    return Math.round(units * fontSize);
}

/**
 * @param {string} title
 * @returns {{chars: number, words: number, pixels: number, status: 'short'|'good'|'long', tone: 'warning'|'success'|'error', message: string}}
 */
export function checkMetaTitle(title) {
    const trimmed = title.trim();
    const chars = trimmed.length;
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    const pixels = approxPixelWidth(trimmed, 20);

    if (chars === 0) {
        return { chars, words, pixels, status: 'short', tone: 'warning', message: 'Enter a page title to check it.' };
    }

    if (pixels > 600 || chars > 65) {
        return { chars, words, pixels, status: 'long', tone: 'error', message: `Around ${pixels}px - search engines will cut this off near 600px. Shorten it.` };
    }

    if (chars < 30 || words < 3) {
        return { chars, words, pixels, status: 'short', tone: 'warning', message: 'A little short - aim for 30 to 60 characters so the title reads as a full phrase.' };
    }

    return { chars, words, pixels, status: 'good', tone: 'success', message: 'Length looks good for search results.' };
}

/**
 * @param {string} description
 * @returns {{chars: number, words: number, pixels: number, status: 'short'|'good'|'long', tone: 'warning'|'success'|'error', message: string}}
 */
export function checkMetaDescription(description) {
    const trimmed = description.trim();
    const chars = trimmed.length;
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    const pixels = approxPixelWidth(trimmed, 14);

    if (chars === 0) {
        return { chars, words, pixels, status: 'short', tone: 'warning', message: 'Enter a meta description to check it.' };
    }

    if (chars > 160) {
        return { chars, words, pixels, status: 'long', tone: 'error', message: 'Over 160 characters - the tail will be trimmed in search results.' };
    }

    if (chars < 70) {
        return { chars, words, pixels, status: 'short', tone: 'warning', message: 'Under 70 characters. Aim for the 120 to 158 character sweet spot.' };
    }

    if (chars > 158) {
        return { chars, words, pixels, status: 'good', tone: 'warning', message: 'Right on the limit - trim a few characters to be safe.' };
    }

    return { chars, words, pixels, status: 'good', tone: 'success', message: 'Length looks good for a search snippet.' };
}

/**
 * @param {string} text
 * @param {string} [keyword]
 * @param {number} [limit]
 * @returns {{totalWords: number, uniqueWords: number, top: Array<{word: string, count: number, density: number}>, focus: {keyword: string, count: number, density: number, suggestion: string}|null}}
 */
export function keywordDensity(text, keyword = '', limit = 15) {
    const words = (text.toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) ?? []);
    const total = words.length;

    /** @type {Map<string, number>} */
    const counts = new Map();

    words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));

    const top = Array.from(counts.entries())
        .filter(([word]) => word.length > 2 && ! STOP_WORDS.has(word))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([word, count]) => ({ word, count, density: total ? (count / total) * 100 : 0 }));

    const trimmedKeyword = keyword.trim().toLowerCase();
    let focus = null;

    if (trimmedKeyword) {
        const count = words.filter((word) => word === trimmedKeyword).length;
        const density = total ? (count / total) * 100 : 0;
        let suggestion = 'Healthy density - phrases pushed above roughly 3% tend to read badly and rank worse.';

        if (count === 0) {
            suggestion = 'That keyword does not appear in the text yet.';
        } else if (density > 3) {
            suggestion = 'Above 3% - this can read as keyword stuffing. Use the phrase more naturally.';
        } else if (density < 0.5) {
            suggestion = 'Below 0.5% - consider using the phrase once or twice more where it genuinely fits.';
        }

        focus = { keyword: trimmedKeyword, count, density, suggestion };
    }

    return { totalWords: total, uniqueWords: counts.size, top, focus };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtmlText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {{userAgent?: string, allow?: string, disallow?: string, sitemap?: string, crawlDelay?: string}} settings
 * @returns {string}
 */
export function buildRobotsTxt({ userAgent = '*', allow = '', disallow = '', sitemap = '', crawlDelay = '' } = {}) {
    const lines = [`User-agent: ${userAgent.trim() || '*'}`];

    String(allow).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        .forEach((path) => lines.push(`Allow: ${path}`));

    String(disallow).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        .forEach((path) => lines.push(`Disallow: ${path}`));

    if (String(crawlDelay).trim() !== '') {
        lines.push(`Crawl-delay: ${String(crawlDelay).trim()}`);
    }

    if (sitemap.trim() !== '') {
        lines.push('', `Sitemap: ${sitemap.trim()}`);
    }

    return `${lines.join('\n')}\n`;
}

/**
 * @param {string[]} urls One absolute URL per entry.
 * @param {{lastmod?: string, changefreq?: string, priority?: string}} [defaults]
 * @returns {string}
 */
export function buildSitemapXml(urls, { lastmod = '', changefreq = '', priority = '' } = {}) {
    const entries = urls
        .map((url) => String(url).trim())
        .filter(Boolean)
        .map((loc) => {
            const parts = [`    <loc>${escapeXml(loc)}</loc>`];

            if (lastmod.trim() !== '') {
                parts.push(`    <lastmod>${escapeXml(lastmod.trim())}</lastmod>`);
            }

            if (changefreq !== '') {
                parts.push(`    <changefreq>${changefreq}</changefreq>`);
            }

            if (priority !== '') {
                parts.push(`    <priority>${escapeXml(priority)}</priority>`);
            }

            return `  <url>\n${parts.join('\n')}\n  </url>`;
        });

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

/**
 * @param {{urlPattern?: string, languages?: string, defaultLanguage?: string, xDefault?: boolean}} settings
 * @returns {string}
 */
export function buildHreflangTags({ urlPattern = '', languages = '', defaultLanguage = '', xDefault = true } = {}) {
    const codes = String(languages).split(',').map((code) => code.trim()).filter(Boolean);

    if (codes.length === 0 || String(urlPattern).trim() === '') {
        return '';
    }

    const href = (code) => String(urlPattern).replaceAll('{lang}', code);
    const tags = codes.map((code) => `<link rel="alternate" hreflang="${escapeHtmlText(code)}" href="${escapeHtmlText(href(code))}" />`);

    if (xDefault) {
        const fallback = defaultLanguage.trim() || codes[0];

        tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtmlText(href(fallback))}" />`);
    }

    return tags.join('\n');
}

/**
 * @param {string} text
 * @param {number} max
 * @returns {{text: string, truncated: boolean}}
 */
export function truncateChars(text, max) {
    const value = String(text ?? '');

    if (value.length <= max) {
        return { text: value, truncated: false };
    }

    return { text: `${value.slice(0, max - 1).trimEnd()}…`, truncated: true };
}

/**
 * @param {string} url
 * @returns {string}
 */
export function formatDisplayUrl(url) {
    const cleaned = String(url ?? '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('#')[0]
        .split('?')[0]
        .replace(/\/+$/, '');

    const [host, ...rest] = cleaned.split('/').filter(Boolean);

    if (! host) {
        return '';
    }

    return [host, ...rest].join(' › ');
}

/**
 * @param {{title?: string, url?: string, description?: string}} input
 * @returns {{title: string, titleTruncated: boolean, displayUrl: string, description: string, descriptionTruncated: boolean}}
 */
export function serpSnippet({ title = '', url = '', description = '' }) {
    const truncatedTitle = truncateChars(title.trim(), 60);
    const truncatedDescription = truncateChars(description.trim(), 158);

    return {
        title: truncatedTitle.text,
        titleTruncated: truncatedTitle.truncated,
        displayUrl: formatDisplayUrl(url),
        description: truncatedDescription.text,
        descriptionTruncated: truncatedDescription.truncated,
    };
}

/**
 * Build JSON-LD for the most common schema.org types from a small shared set
 * of fields. Anything type-specific can be layered on through `extra`, which
 * is parsed as a JSON object and merged last so it always wins.
 *
 * @param {string} type
 * @param {{name?: string, description?: string, url?: string, image?: string, author?: string, price?: string, faq?: string, extra?: string}} values
 * @returns {string}
 */
export function buildSchema(type, { name = '', description = '', url = '', image = '', author = '', price = '', faq = '', extra = '' } = {}) {
    let extras = {};
    const rawExtra = String(extra).trim();

    if (rawExtra !== '') {
        try {
            extras = JSON.parse(rawExtra);
        } catch {
            throw new Error('The "extra properties" field must be valid JSON, for example {"priceCurrency":"USD"}.');
        }

        if (extras === null || typeof extras !== 'object' || Array.isArray(extras)) {
            throw new Error('The "extra properties" field must be a JSON object.');
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const has = (value) => String(value).trim() !== '';

    /** @type {Record<string, unknown>} */
    let mapped = {};

    switch (type) {
        case 'Article':
            mapped = { headline: name, description, url, image: has(image) ? image : undefined, datePublished: today, dateModified: today };
            if (has(author)) mapped.author = { '@type': 'Person', name: author };
            break;
        case 'WebSite':
            mapped = { name, url, description };
            break;
        case 'Organization':
            mapped = { name, url, description, logo: has(image) ? image : undefined };
            break;
        case 'Product':
            mapped = { name, description, image: has(image) ? image : undefined, url };
            if (has(price)) {
                mapped.offers = { '@type': 'Offer', price: String(price).trim(), priceCurrency: 'USD', availability: 'https://schema.org/InStock' };
            }
            break;
        case 'LocalBusiness':
            mapped = { name, description, url, image: has(image) ? image : undefined };
            break;
        case 'Recipe':
            mapped = { name, description, image: has(image) ? image : undefined };
            if (has(author)) mapped.author = { '@type': 'Person', name: author };
            break;
        case 'Event':
            mapped = { name, description, url };
            break;
        case 'SoftwareApplication':
            mapped = { name, description, url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any' };
            if (has(price)) {
                mapped.offers = { '@type': 'Offer', price: String(price).trim(), priceCurrency: 'USD' };
            }
            break;
        case 'FAQPage':
            mapped = { mainEntity: buildFaqEntities(String(faq)) };
            break;
        default:
            mapped = { name, description, url };
    }

    const cleaned = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined && value !== ''));

    return JSON.stringify({ '@context': 'https://schema.org', '@type': type, ...cleaned, ...extras }, null, 2);
}

/**
 * "Question ||| Answer", one pair per line.
 *
 * @param {string} raw
 * @returns {Array<Record<string, unknown>>}
 */
function buildFaqEntities(raw) {
    return raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [question, ...rest] = line.split('|||');

            return {
                '@type': 'Question',
                name: (question ?? '').trim(),
                acceptedAnswer: { '@type': 'Answer', text: rest.join('|||').trim() },
            };
        });
}

/**
 * @param {{title?: string, description?: string, url?: string, image?: string, siteName?: string, type?: string, twitterCard?: string, twitterSite?: string}} values
 * @returns {string}
 */
export function openGraphTags({ title = '', description = '', url = '', image = '', siteName = '', type = 'website', twitterCard = 'summary_large_image', twitterSite = '' }) {
    const tags = [
        ['og:type', type],
        ['og:title', title],
        ['og:description', description],
        ['og:url', url],
        ['og:site_name', siteName],
        ['og:image', image],
        ['twitter:card', twitterCard],
        ['twitter:title', title],
        ['twitter:description', description],
        ['twitter:image', image],
        ['twitter:site', twitterSite],
    ];

    return tags
        .filter(([, value]) => String(value ?? '').trim() !== '')
        .map(([key, value]) => {
            const attribute = key.startsWith('og:') ? 'property' : 'name';

            return `<meta ${attribute}="${key}" content="${escapeHtmlText(value)}">`;
        })
        .join('\n');
}
