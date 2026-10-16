import { mountFormOutput } from './form-output-shell';
import { openGraphTags, truncateChars } from './seo-tools-core';
import { socialCardNode } from './preview-views';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Open Graph Preview Tool',
        description: 'Compose Open Graph and Twitter Card tags and preview the shared link before posting.',
        fileName: 'open-graph-tags.html',
        ready: ({ title, url, image }) => [title, url, image].some((value) => String(value).trim() !== ''),
        fields: [
            { key: 'title', label: 'Title', type: 'text', span: 'full', placeholder: 'e.g. 10 Free Tools That Save You an Hour a Day' },
            { key: 'url', label: 'Page URL', type: 'text', span: 'full', placeholder: 'https://example.com/blog/tips' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
            { key: 'image', label: 'Image URL', type: 'text', placeholder: 'https://example.com/og.jpg' },
            { key: 'siteName', label: 'Site name', type: 'text', placeholder: 'Example' },
            {
                key: 'type',
                label: 'og:type',
                type: 'select',
                value: 'website',
                options: ['website', 'article', 'product', 'video.other', 'music.song'].map((value) => ({ value, label: value })),
            },
            {
                key: 'twitterCard',
                label: 'Twitter card',
                type: 'select',
                value: 'summary_large_image',
                options: [
                    { value: 'summary_large_image', label: 'summary_large_image (big image)' },
                    { value: 'summary', label: 'summary (small image)' },
                ],
            },
            { key: 'twitterSite', label: 'X/Twitter handle', type: 'text', placeholder: '@example' },
        ],
        build: (values) => {
            const text = openGraphTags(values);
            const card = socialCardNode(values);
            const titleCheck = truncateChars(String(values.title ?? ''), 70);

            return {
                preview: card,
                text,
                stats: [
                    { label: 'Tags', value: String(text.split('\n').filter(Boolean).length) },
                    { label: 'Title length', value: `${String(values.title ?? '').length}` },
                    { label: 'Card size', value: values.twitterCard === 'summary_large_image' ? '1200×630' : '240×240' },
                    { label: 'Image set', value: String(values.image).trim() ? 'Yes' : 'No' },
                ],
                message: titleCheck.truncated
                    ? 'Your title is long - most platforms will trim it around 70 characters.'
                    : 'Preview on the left. Add the tags to your page head.',
                tone: titleCheck.truncated ? 'warning' : 'success',
            };
        },
    });
}
