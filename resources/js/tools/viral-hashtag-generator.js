import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel, select } from '../lib/ui';
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
    const platform = select({
        label: 'Platform',
        value: 'instagram',
        options: [
            { value: 'instagram', label: 'Instagram · up to 30 suggestions' },
            { value: 'tiktok', label: 'TikTok · up to 10 suggestions' },
            { value: 'youtube', label: 'YouTube · up to 15 suggestions' },
            { value: 'x', label: 'X · up to 5 suggestions' },
            { value: 'linkedin', label: 'LinkedIn · up to 5 suggestions' },
        ],
        hint: 'Platform limits are a practical cap, not a recommendation to use every tag.',
    });
    const output = textarea({ label: 'Hashtag set', rows: 4, mono: true });
    output.textarea.readOnly = true;
    output.textarea.placeholder = 'Your hashtag ideas will appear here.';

    const counts = node('<p class="text-xs text-slate-500" aria-live="polite"></p>');
    const groups = node('<div class="space-y-3"></div>');
    const actions = node('<div class="flex flex-wrap gap-2"></div>');
    const generate = button({ label: 'Generate hashtags', variant: 'primary' });
    const copy = button({ label: 'Copy hashtags' });
    copy.disabled = true;
    actions.append(generate, copy);

    const statusMessage = status();
    const form = panel({
        title: 'Describe your post',
        description: 'Add a topic and optional keywords to get a balanced set of relevant hashtag ideas.',
        body: node('<div class="space-y-4"></div>'),
    });
    form.querySelector('[data-panel-body]').append(topic.el, keywords.el, platform.el, actions, statusMessage.el);

    const result = panel({
        title: 'Your hashtag ideas',
        description: 'Mix specific tags with a few broader ones. More tags do not guarantee more reach.',
        body: node('<div class="space-y-4"></div>'),
    });
    result.querySelector('[data-panel-body]').append(counts, output.el, groups);
    root.append(form, result);

    generate.addEventListener('click', () => {
        if (!topic.textarea.value.trim()) {
            statusMessage.set('Enter a post topic to generate relevant hashtag ideas.', 'warning');
            topic.textarea.focus();
            return;
        }

        const suggestions = generateHashtags(topic.textarea.value, keywords.textarea.value, platform.select.value);
        output.textarea.value = suggestions.all.join(' ');
        counts.textContent = `${suggestions.all.length} unique suggestions · ${platform.select.options[platform.select.selectedIndex].text}`;
        copy.disabled = suggestions.all.length === 0;
        groups.replaceChildren();

        for (const [title, tags] of [
            ['Topic-specific', suggestions.topic],
            ['Related niche ideas', suggestions.niche],
            ['Broader discovery ideas', suggestions.discovery],
        ]) {
            if (tags.length === 0) continue;

            const section = node('<section class="rounded-xl border border-slate-200 p-3"></section>');
            const heading = node('<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500"></h3>');
            heading.textContent = title;
            const list = node('<p class="mt-2 break-words font-mono text-sm leading-7 text-indigo-700"></p>');
            list.textContent = tags.join(' ');
            section.append(heading, list);
            groups.append(section);
        }

        if (suggestions.all.length === 0) {
            statusMessage.set('Could not make hashtags from that topic. Try words or keywords using letters or numbers.', 'warning');
            return;
        }

        statusMessage.set('Hashtag ideas generated locally. They are not live trend or popularity data.', 'success');
        complete();
    });

    copy.addEventListener('click', async () => {
        if (!output.textarea.value) return;

        const copied = await copyToClipboard(output.textarea.value);
        statusMessage.set(
            copied ? 'Hashtags copied to your clipboard.' : 'Clipboard access is unavailable. Select the hashtags and copy them manually.',
            copied ? 'success' : 'warning',
        );
    });
}
