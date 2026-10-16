import { mountFormOutput } from './form-output-shell';
import { buildSchema } from './seo-tools-core';

const TYPES = ['Article', 'WebSite', 'Organization', 'Product', 'LocalBusiness', 'Recipe', 'Event', 'SoftwareApplication', 'FAQPage'];

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Schema Markup Generator',
        description: 'Generate structured data in JSON-LD that search engines can read and enhance with.',
        fileName: 'schema.jsonld',
        ready: ({ name, type }) => String(name).trim() !== '' || String(type).trim() !== '',
        fields: [
            {
                key: 'type',
                label: 'Schema type',
                type: 'select',
                value: 'Article',
                options: TYPES.map((type) => ({ value: type, label: type })),
            },
            { key: 'name', label: 'Name / headline', type: 'text', placeholder: 'The page or item name' },
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com/article' },
            { key: 'image', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
            { key: 'author', label: 'Author name', type: 'text', placeholder: 'Used by Article and Recipe' },
            { key: 'price', label: 'Price', type: 'text', placeholder: 'Used by Product and Software' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3, span: 'full' },
            {
                key: 'faq',
                label: 'FAQ pairs (FAQPage only)',
                type: 'textarea',
                rows: 3,
                span: 'full',
                placeholder: 'Is this free? ||| Yes, completely free.\nDo I need an account? ||| No sign-up required.',
                hint: 'Format: Question ||| Answer - one pair per line.',
            },
            {
                key: 'extra',
                label: 'Extra properties (JSON)',
                type: 'textarea',
                rows: 3,
                span: 'full',
                mono: true,
                placeholder: '{"datePublished":"2026-01-01"}',
                hint: 'Optional object merged into the result, so type-specific fields are always possible.',
            },
        ],
        build: (values) => {
            const text = buildSchema(values.type, values);
            const parsed = JSON.parse(text);

            return {
                text,
                stats: [
                    { label: '@type', value: String(parsed['@type']) },
                    { label: 'Properties', value: String(Object.keys(parsed).length - 2) },
                    { label: 'Format', value: 'JSON-LD' },
                    { label: 'Valid JSON', value: 'Yes' },
                ],
                message: 'Paste this into a <script type="application/ld+json"> tag in your page head.',
                tone: 'success',
            };
        },
    });
}
