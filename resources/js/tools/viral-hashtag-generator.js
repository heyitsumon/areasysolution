import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel, text } from '../lib/ui';
import { generateHashtags } from './viral-hashtags.js';

const GENERATION_COOLDOWN_MS = 2000;

export default function mount({ root, complete }) {
    const topic = text({
        label: 'Keyword or topic',
        placeholder: 'e.g. remote jobs, coffee recipes, travel',
        hint: 'Enter one topic to get relevant hashtag ideas.',
    });
    topic.input.maxLength = 120;

    const output = textarea({
        label: 'Generated hashtags',
        rows: 5,
        mono: true,
        placeholder: 'Your hashtags will appear here.',
        spellcheck: false,
    });
    output.textarea.readOnly = true;

    const generate = button({ label: 'Generate hashtags', variant: 'primary' });
    const copy = button({ label: 'Copy hashtags' });
    copy.disabled = true;
    const actions = node('<div class="flex flex-wrap gap-2"></div>');
    actions.append(generate, copy);
    const statusMessage = status();

    const workspace = panel({
        title: 'Viral Hashtag Generator',
        description: 'Enter a topic to create tailored hashtag suggestions. Suggestions are generated locally and are not live trend rankings.',
        body: node('<div class="space-y-4"></div>'),
    });
    workspace.querySelector('[data-panel-body]').append(topic.el, actions, output.el, statusMessage.el);
    root.append(workspace);

    let generatedHashtags = [];
    let cooldownTimer;

    const startCooldown = () => {
        const availableAt = Date.now() + GENERATION_COOLDOWN_MS;
        generate.disabled = true;

        const updateCooldown = () => {
            const secondsRemaining = Math.ceil((availableAt - Date.now()) / 1000);

            if (secondsRemaining <= 0) {
                window.clearInterval(cooldownTimer);
                generate.disabled = false;
                generate.textContent = 'Generate hashtags';
                return;
            }

            generate.textContent = `Generate again in ${secondsRemaining}s`;
        };

        updateCooldown();
        cooldownTimer = window.setInterval(updateCooldown, 200);
    };

    generate.addEventListener('click', () => {
        const value = topic.input.value.trim();
        if (!value) {
            statusMessage.set('Enter a keyword or topic to generate hashtags.', 'warning');
            topic.input.focus();
            return;
        }

        const suggestions = generateHashtags(value, '', 'instagram');
        generatedHashtags = suggestions.all;
        output.textarea.value = generatedHashtags.join(' ');
        copy.disabled = generatedHashtags.length === 0;

        if (generatedHashtags.length === 0) {
            statusMessage.set('Could not generate hashtags. Try a topic with letters or numbers.', 'warning');
            return;
        }

        statusMessage.set(`${generatedHashtags.length} relevant hashtag ideas generated.`, 'success');
        complete();
        startCooldown();
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
