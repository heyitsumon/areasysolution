import { mountFormOutput } from './form-output-shell';
import { buildRobotsTxt } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Robots.txt Generator',
        description: 'Generate a valid robots.txt that tells search engines what they may and may not crawl.',
        fileName: 'robots.txt',
        ready: ({ sitemap, disallow, allow }) => [sitemap, disallow, allow].some((value) => String(value).trim() !== ''),
        fields: [
            { key: 'userAgent', label: 'User agent', type: 'text', value: '*', hint: 'Use * to address every crawler, or a specific token such as Googlebot.' },
            { key: 'sitemap', label: 'Sitemap URL', type: 'text', placeholder: 'https://example.com/sitemap.xml' },
            { key: 'allow', label: 'Allow paths (one per line)', type: 'textarea', rows: 3, span: 'full', placeholder: '/\n/public/', hint: 'Paths this crawler may visit. Listed before Disallow.' },
            { key: 'disallow', label: 'Disallow paths (one per line)', type: 'textarea', rows: 3, span: 'full', placeholder: '/admin/\n/search?', hint: 'Paths this crawler must not visit.' },
            { key: 'crawlDelay', label: 'Crawl delay (seconds)', type: 'number', value: 0, min: 0, max: 60, hint: 'Optional. Ignored by Google, but respected by others.' },
        ],
        build: (values) => {
            const text = buildRobotsTxt({ ...values, crawlDelay: String(values.crawlDelay || '').trim() });
            const allowCount = String(values.allow).split(/\r?\n/).filter((line) => line.trim() !== '').length;
            const disallowCount = String(values.disallow).split(/\r?\n/).filter((line) => line.trim() !== '').length;

            return {
                text,
                stats: [
                    { label: 'User agent', value: String(values.userAgent || '*') },
                    { label: 'Allow rules', value: String(allowCount) },
                    { label: 'Disallow rules', value: String(disallowCount) },
                    { label: 'Sitemap', value: String(values.sitemap).trim() ? 'Linked' : 'None' },
                ],
                message: disallowCount === 0
                    ? 'No disallow rules - every part of the site will be crawled.'
                    : `${disallowCount} path${disallowCount === 1 ? '' : 's'} blocked from crawling.`,
                tone: 'success',
            };
        },
    });
}
