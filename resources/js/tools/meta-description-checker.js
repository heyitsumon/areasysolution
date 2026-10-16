import { mountFormOutput } from './form-output-shell';
import { checkMetaDescription } from './seo-tools-core';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'Meta Description Checker',
        description: 'Check the length of your meta description and see how much of it search engines will show.',
        fileName: 'description-analysis.txt',
        ready: ({ description }) => String(description).trim() !== '',
        fields: [
            {
                key: 'description',
                label: 'Meta description',
                type: 'textarea',
                rows: 5,
                placeholder: 'Describe the page in one or two sentences that make people want to click.',
                hint: 'The sweet spot is 120 to 158 characters.',
            },
        ],
        build: ({ description }) => {
            const result = checkMetaDescription(description);

            return {
                text: [
                    description,
                    '',
                    `Characters: ${result.chars}`,
                    `Words: ${result.words}`,
                    `Recommended range: 120 to 158 characters`,
                    `Verdict: ${result.message}`,
                ].join('\n'),
                stats: [
                    { label: 'Characters', value: String(result.chars) },
                    { label: 'Words', value: String(result.words) },
                    { label: 'Target', value: '120–158' },
                    { label: 'Status', value: result.status },
                ],
                message: result.message,
                tone: result.tone,
            };
        },
    });
}
