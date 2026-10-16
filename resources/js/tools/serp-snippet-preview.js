import { mountFormOutput } from './form-output-shell';
import { serpSnippet } from './seo-tools-core';
import { serpPreviewNode } from './preview-views';

export default function mount(context) {
    mountFormOutput(context, {
        title: 'SERP Snippet Preview Tool',
        description: 'Preview exactly how your page will look in Google search results.',
        fileName: 'serp-snippet.txt',
        ready: ({ title, description, url }) => [title, description, url].some((value) => String(value).trim() !== ''),
        fields: [
            { key: 'title', label: 'Title tag', type: 'text', span: 'full', placeholder: 'e.g. Free Online Tools for PDF, Images and Text' },
            { key: 'url', label: 'URL', type: 'text', span: 'full', placeholder: 'https://example.com/tools/word-counter' },
            { key: 'description', label: 'Meta description', type: 'textarea', rows: 4, placeholder: 'A short, click-worthy summary of the page.' },
        ],
        build: ({ title, url, description }) => {
            const snippet = serpSnippet({ title, url, description });

            return {
                preview: serpPreviewNode(snippet),
                text: [
                    `Title:       ${snippet.title}`,
                    `Display URL: ${snippet.displayUrl}`,
                    `Description: ${snippet.description}`,
                    '',
                    snippet.titleTruncated || snippet.descriptionTruncated
                        ? 'Note: something above was trimmed to fit the search results.'
                        : 'Everything fits within the usual limits.',
                ].join('\n'),
                stats: [
                    { label: 'Title length', value: `${snippet.title.length}/60` },
                    { label: 'Description', value: `${snippet.description.length}/158` },
                    { label: 'Title trimmed', value: snippet.titleTruncated ? 'Yes' : 'No' },
                    { label: 'Description trimmed', value: snippet.descriptionTruncated ? 'Yes' : 'No' },
                ],
                message: snippet.titleTruncated || snippet.descriptionTruncated
                    ? 'One part is longer than Google will display - shorten it to control the wording yourself.'
                    : 'This is how your result should appear.',
                tone: snippet.titleTruncated || snippet.descriptionTruncated ? 'warning' : 'success',
            };
        },
    });
}
