import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';
import { generateHashtags } from './viral-hashtags.js';

export default function mount({ root, complete }) {
    const topic = textarea({
        label: 'What is your post about?',
        rows: 2,
        placeholder: 'For example: easy iced coffee recipes',
        hint: 'Be specific so suggestions stay relevant.',
    });
    const keywords = textarea({
        label: 'Related keywords (optional)',
        rows: 3,
        placeholder: 'Separate ideas with commas, e.g. cold brew, oat milk, summer drinks',
    });
    const counts = node('<p class="flex items-center gap-2 text-sm font-medium text-emerald-700" aria-live="polite"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Enter a topic to generate ideas</p>');
    const cards = node('<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"></div>');
    const actions = node('<div class="flex flex-wrap gap-2"></div>');
    const generate = button({ label: 'Generate hashtags', variant: 'primary' });
    const copy = button({ label: 'Copy all hashtags' });
    copy.disabled = true;
    actions.append(generate, copy);

    const statusMessage = status();
    const form = panel({
        title: 'Describe your post',
        description: 'Enter your post topic and optional keywords. Suggestions will be tailored to what you enter.',
        body: node('<div class="space-y-4"></div>'),
    });
    form.querySelector('[data-panel-body]').append(topic.el, keywords.el, actions, statusMessage.el);

    const result = panel({
        title: 'Hashtag ideas',
        description: 'Click a card to copy one hashtag, or copy the complete set. Suggestions are not live trend rankings.',
        body: node('<div class="space-y-4"></div>'),
    });
    result.querySelector('[data-panel-body]').append(counts, cards);
    root.append(form, result);

    let generatedHashtags = [];

    generate.addEventListener('click', () => {
        if (!topic.textarea.value.trim()) {
            statusMessage.set('Enter a post topic to generate relevant hashtag ideas.', 'warning');
            topic.textarea.focus();
            return;
        }

        const suggestions = generateHashtags(topic.textarea.value, keywords.textarea.value, 'instagram');
        generatedHashtags = suggestions.all;
        const indicator = node('<span class="h-2 w-2 rounded-full bg-emerald-500"></span>');
        counts.replaceChildren(indicator, document.createTextNode(`${suggestions.all.length} hashtag ideas generated`));
        copy.disabled = suggestions.all.length === 0;
        cards.replaceChildren(...suggestions.all.map((tag) => {
            const card = node('<article class="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md"></article>');
            const label = node('<p class="break-all font-semibold text-slate-800"></p>');
            label.textContent = tag;
            const copyTag = node('<button class="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500" type="button" aria-label=""></button>');
            copyTag.setAttribute('aria-label', `Copy ${tag}`);
            copyTag.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" class="h-4 w-4"><rect x="6.5" y="6.5" width="9" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v8A1.5 1.5 0 0 0 5 14.5h1.5" stroke="currentColor" stroke-width="1.5"/></svg>';
            copyTag.addEventListener('click', async () => {
                const copied = await copyToClipboard(tag);
                statusMessage.set(
                    copied ? `${tag} copied to your clipboard.` : 'Clipboard access is unavailable. Select the hashtag and copy it manually.',
                    copied ? 'success' : 'warning',
                );
            });
            card.append(label, copyTag);

            return card;
        }));

        if (suggestions.all.length === 0) {
            statusMessage.set('Could not make hashtags from that topic. Try words or keywords using letters or numbers.', 'warning');
            return;
        }

        statusMessage.set('Hashtag ideas generated locally. They are not live trend or popularity data.', 'success');
        complete();
    });

    copy.addEventListener('click', async () => {
        if (generatedHashtags.length === 0) return;

        const copied = await copyToClipboard(generatedHashtags.join(' '));
        statusMessage.set(
            copied ? 'Hashtags copied to your clipboard.' : 'Clipboard access is unavailable. Select the hashtags and copy them manually.',
            copied ? 'success' : 'warning',
        );
    });
}
