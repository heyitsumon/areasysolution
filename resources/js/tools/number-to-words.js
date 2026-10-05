import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard } from '../lib/files';
import { node, panel } from '../lib/ui';
import { numberToWords } from './number-to-words-core';

export default function mount({ root, announce, complete }) {
    const input = textarea({
        label: 'Enter a number',
        rows: 2,
        placeholder: 'For example: 1,234.05',
        mono: true,
        spellcheck: false,
    });
    const output = textarea({
        label: 'Number in words',
        rows: 3,
        mono: true,
        spellcheck: false,
    });
    output.textarea.readOnly = true;
    output.textarea.setAttribute('aria-live', 'polite');

    const convert = button({ label: 'Convert to words', variant: 'primary' });
    const copy = button({ label: 'Copy result' });
    const clear = button({ label: 'Clear' });
    const actions = node('<div class="mt-4 flex flex-wrap gap-2"></div>');
    const feedback = status();

    actions.append(convert, copy, clear);

    convert.addEventListener('click', () => {
        try {
            output.textarea.value = numberToWords(input.textarea.value);
            feedback.set('');
            announce('Number converted to words.');
            void complete();
        } catch (error) {
            output.textarea.value = '';
            feedback.set(error.message, 'error');
            announce(error.message);
        }
    });

    copy.addEventListener('click', async () => {
        if (!output.textarea.value) {
            feedback.set('Convert a number before copying the result.', 'warning');
            return;
        }

        const copied = await copyToClipboard(output.textarea.value);
        feedback.set(
            copied ? 'Result copied to your clipboard.' : 'Copying is blocked. Select the result and press Ctrl+C.',
            copied ? 'success' : 'warning',
        );
    });

    clear.addEventListener('click', () => {
        input.textarea.value = '';
        output.textarea.value = '';
        feedback.set('');
        input.textarea.focus();
    });

    const workspace = node('<div class="space-y-4"></div>');

    workspace.append(input.el, output.el, actions, feedback.el);
    root.append(panel({ title: 'Convert a number', body: workspace }));
}
