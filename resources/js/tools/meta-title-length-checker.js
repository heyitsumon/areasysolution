import { mountFormOutput } from './form-output-shell';
import { checkMetaTitle } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Meta Title Length Checker',
        description: 'Check whether your page title fits inside a search result before you publish it.',
        fileName: 'title-analysis.txt',
        ready: ({ title }) => String(title).trim() !== '',
        fields: [
            {
                key: 'title',
                label: 'Page title',
                type: 'text',
                span: 'full',
                placeholder: 'e.g. Free Online PDF Tools - No Sign-up Required',
                hint: 'Aim for 30 to 60 characters so search engines show it in full.',
            },
        ],
        build: ({ title }) => {
            const result = checkMetaTitle(title);

            return {
                text: [
                    `Title: ${title}`,
                    '',
                    `Characters: ${result.chars}`,
                    `Words: ${result.words}`,
                    `Approximate width: ${result.pixels}px (Google cuts off near 600px)`,
                    `Verdict: ${result.message}`,
                ].join('\n'),
                stats: [
                    { label: 'Characters', value: String(result.chars) },
                    { label: 'Words', value: String(result.words) },
                    { label: 'Width', value: `${result.pixels}px` },
                    { label: 'Status', value: result.status },
                ],
                message: result.message,
                tone: result.tone,
            };
        },
    });
}
