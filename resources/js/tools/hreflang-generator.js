import { mountFormOutput } from './form-output-shell';
import { buildHreflangTags } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Hreflang Tag Generator',
        description: 'Generate hreflang link tags so search engines serve the right language to the right visitor.',
        fileName: 'hreflang-tags.html',
        ready: ({ urlPattern, languages }) => String(urlPattern).trim() !== '' && String(languages).trim() !== '',
        fields: [
            {
                key: 'urlPattern',
                label: 'URL pattern',
                type: 'text',
                span: 'full',
                placeholder: 'https://example.com/{lang}/',
                hint: 'Use {lang} where the language code belongs in the address.',
            },
            {
                key: 'languages',
                label: 'Language codes',
                type: 'text',
                span: 'full',
                placeholder: 'en, bn, fr, de',
                hint: 'Comma separated. Use region variants like en-gb or bn-bd where needed.',
            },
            {
                key: 'defaultLanguage',
                label: 'Default language',
                type: 'text',
                placeholder: 'en',
                hint: 'Used for the x-default fallback tag.',
            },
            { key: 'xDefault', label: 'Include x-default fallback tag', type: 'checkbox', value: true },
        ],
        build: (values) => {
            const tags = buildHreflangTags(values);
            const codes = String(values.languages).split(',').map((code) => code.trim()).filter(Boolean);

            if (tags === '') {
                return {
                    text: '',
                    message: 'Enter a URL pattern and at least one language code.',
                    tone: 'info',
                };
            }

            return {
                text: tags,
                stats: [
                    { label: 'Languages', value: String(codes.length) },
                    { label: 'Tags generated', value: String(codes.length + (values.xDefault ? 1 : 0)) },
                    { label: 'x-default', value: values.xDefault ? 'Included' : 'Skipped' },
                    { label: 'Pattern', value: values.urlPattern.includes('{lang}') ? 'Placeholders OK' : 'No {lang}' },
                ],
                message: values.urlPattern.includes('{lang}')
                    ? 'Paste these tags into the <head> of every language version of the page.'
                    : 'Tip: add {lang} to your URL pattern so each tag points at a different address.',
                tone: values.urlPattern.includes('{lang}') ? 'success' : 'warning',
            };
        },
    });
}
