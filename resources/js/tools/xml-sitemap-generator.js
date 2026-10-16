import { mountFormOutput } from './form-output-shell';
import { buildSitemapXml } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'XML Sitemap Generator',
        description: 'Build a sitemap.xml from a list of URLs, ready to upload and submit to search engines.',
        fileName: 'sitemap.xml',
        ready: ({ urls }) => String(urls).trim() !== '',
        fields: [
            {
                key: 'urls',
                label: 'URLs (one per line)',
                type: 'textarea',
                rows: 8,
                span: 'full',
                placeholder: 'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact',
                hint: 'Up to 50,000 URLs per file. Use absolute URLs.',
            },
            {
                key: 'lastmod',
                label: 'Last modified',
                type: 'date',
                hint: 'Optional. Applied to every URL in this file.',
            },
            {
                key: 'changefreq',
                label: 'Change frequency',
                type: 'select',
                value: '',
                options: [
                    { value: '', label: 'Not specified' },
                    { value: 'always', label: 'Always' },
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'never', label: 'Never' },
                ],
            },
            {
                key: 'priority',
                label: 'Priority',
                type: 'select',
                value: '',
                options: [
                    { value: '', label: 'Not specified' },
                    { value: '1.0', label: '1.0 (highest)' },
                    { value: '0.8', label: '0.8' },
                    { value: '0.6', label: '0.6' },
                    { value: '0.5', label: '0.5 (default)' },
                    { value: '0.3', label: '0.3' },
                    { value: '0.1', label: '0.1 (lowest)' },
                ],
            },
        ],
        build: ({ urls, lastmod, changefreq, priority }) => {
            const list = String(urls).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            const invalid = list.filter((url) => ! /^https?:\/\//i.test(url));

            if (invalid.length > 0) {
                throw new Error(`${invalid.length} line${invalid.length === 1 ? ' does' : 's do'} not start with http:// or https:// - ${invalid[0]}`);
            }

            const text = buildSitemapXml(list, { lastmod: String(lastmod ?? ''), changefreq, priority });

            return {
                text,
                stats: [
                    { label: 'URLs', value: String(list.length) },
                    { label: 'Last modified', value: String(lastmod || 'Not set') },
                    { label: 'Change freq', value: String(changefreq || 'Not set') },
                    { label: 'File size', value: `${(new Blob([text]).size / 1024).toFixed(1)} KB` },
                ],
                message: `${list.length} URL${list.length === 1 ? '' : 's'} written to sitemap.xml.`,
                tone: 'success',
            };
        },
    });
}
