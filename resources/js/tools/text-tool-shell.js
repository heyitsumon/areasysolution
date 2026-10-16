import { rafThrottle } from '../lib/dom';
import { button, checkbox, textarea } from '../lib/controls';
import { resultCard, status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { grid, node, panel, select, statTile } from '../lib/ui';

/**
 * Shared shells for the text tool family.
 *
 * Seven tools differ only in what they compute, not in how they are operated:
 * a place to type, a place to read the answer, and a way to take the answer
 * away. Building that once means a keyboard user, a screen-reader user and a
 * phone user get the same experience on every one of them.
 */

const SAMPLE = `Draft copy   sometimes arrives full of   double spaces, repeated lines, repeated lines, and trailing spaces   

Sorting it, cleaning it or counting it should never mean retyping it. Paste anything here and the result updates as you edit.`;

/**
 * Live counter shell: statistics refresh on every animation frame while typing.
 *
 * @param {{root: HTMLElement, announce: (message: string) => void, complete: () => Promise<void>}} context
 * @param {{title: string, description?: string, sample?: string, inputLabel?: string, analyse: (text: string) => Record<string, string|number>, stats: Array<{key: string, label: string, hint?: string}>}} config
 */
export function mountCounter(context, { title, description, sample = SAMPLE, inputLabel = 'Your text', analyse, stats }) {
    const { root, announce, complete } = context;

    const editor = textarea({
        label: inputLabel,
        rows: 12,
        hint: 'Everything is counted in this tab - your text is never sent anywhere.',
        placeholder: 'Start typing or paste your text here.',
    });

    const tiles = stats.map((stat) => statTile(stat.label, '0', stat.hint));
    const gridEl = grid(4);

    tiles.forEach((tile) => gridEl.append(tile));

    const banner = status();
    banner.el.classList.add('sr-only');

    const loadSample = button({ label: 'Load sample' });
    const clear = button({ label: 'Clear' });
    const toolbar = node('<div class="mt-3 flex flex-wrap gap-2"></div>');

    toolbar.append(loadSample, clear);

    const update = () => {
        const text = editor.textarea.value;
        const values = analyse(text);

        stats.forEach((stat, index) => {
            const valueEl = tiles[index].querySelector('p:nth-child(2)');

            if (valueEl) {
                valueEl.textContent = String(values[stat.key] ?? '—');
            }
        });

        announce(text.trim() === '' ? 'Waiting for text.' : 'Counts updated.');
    };

    editor.textarea.addEventListener('input', rafThrottle(() => {
        update();

        if (editor.textarea.value.trim() !== '') {
            void complete();
        }
    }));

    loadSample.addEventListener('click', () => {
        editor.textarea.value = sample;
        update();
        void complete();
        editor.textarea.focus();
    });

    clear.addEventListener('click', () => {
        editor.textarea.value = '';
        update();
        editor.textarea.focus();
    });

    const body = node('<div></div>');

    body.append(editor.el, toolbar, node('<div class="mt-4"></div>'));

    body.lastElementChild.append(gridEl);

    root.append(banner.el, panel({ title, description, body }));

    update();
    editor.textarea.focus();
}

/**
 * Transform shell: input at the top, result below, options in between.
 *
 * @param {{root: HTMLElement, announce: (message: string) => void, complete: () => Promise<void>}} context
 * @param {{title: string, description?: string, sample?: string, inputLabel?: string, outputLabel?: string, fileName?: string, buildOptions?: () => {el: HTMLElement, read: () => object}, transform: (text: string, options: object) => {output: string, message?: string, tone?: 'info'|'success'|'error'|'warning', stats?: Array<{label: string, value: string}>}}} config
 */
export function mountTransform(context, { title, description, sample = SAMPLE, inputLabel = 'Input text', outputLabel = 'Result', fileName = 'result.txt', buildOptions, transform }) {
    const { root, announce, complete } = context;

    const editor = textarea({
        label: inputLabel,
        rows: 10,
        hint: 'Nothing is uploaded - the result is produced in this tab.',
        placeholder: 'Paste or type your text here.',
    });

    const output = textarea({ label: outputLabel, rows: 10, mono: true });

    output.textarea.readOnly = true;

    const banner = status();
    const statsHost = node('<div class="mt-4"></div>');

    const result = resultCard({ title: outputLabel });
    result.body.append(output.el, statsHost);

    const optionPanel = buildOptions ? buildOptions() : null;

    const applyButton = button({ label: 'Update result', variant: 'primary' });
    const loadSample = button({ label: 'Load sample' });
    const clear = button({ label: 'Clear' });
    const copyButton = button({ label: 'Copy result' });
    const downloadButton = button({ label: 'Download' });

    result.actions.append(copyButton, downloadButton);

    const toolbar = node('<div class="mt-3 flex flex-wrap gap-2"></div>');

    toolbar.append(applyButton, loadSample, clear);

    const run = (force = false) => {
        const text = editor.textarea.value;

        if (text === '' && ! force) {
            output.textarea.value = '';
            statsHost.replaceChildren();
            result.hide();
            banner.set('');

            return;
        }

        try {
            const outcome = transform(text, optionPanel ? optionPanel.read() : {});

            output.textarea.value = outcome.output ?? '';
            statsHost.replaceChildren();

            if (outcome.stats?.length) {
                const statsGrid = grid(4);

                outcome.stats.forEach((stat) => statsGrid.append(statTile(stat.label, stat.value)));

                statsHost.append(statsGrid);
            }

            result.show();
            banner.set(outcome.message ?? '', outcome.tone ?? 'info');

            if (text !== '') {
                announce(outcome.message ?? `${outputLabel} updated.`);
                void complete();
            }
        } catch (error) {
            result.hide();
            banner.set(error?.message ?? 'That input could not be processed.', 'error');
            announce(error?.message ?? 'That input could not be processed.');
        }
    };

    const rerun = rafThrottle(() => run());

    editor.textarea.addEventListener('input', rerun);
    applyButton.addEventListener('click', () => run(true));

    if (optionPanel) {
        optionPanel.el.addEventListener('input', rerun);
        optionPanel.el.addEventListener('change', rerun);
    }

    loadSample.addEventListener('click', () => {
        editor.textarea.value = sample;
        run();
        editor.textarea.focus();
    });

    clear.addEventListener('click', () => {
        editor.textarea.value = '';
        run();
        editor.textarea.focus();
    });

    copyButton.addEventListener('click', async () => {
        const ok = await copyToClipboard(output.textarea.value);

        banner.set(
            ok ? 'Result copied to your clipboard.' : 'Copying is blocked in this browser - select the result and press Ctrl+C.',
            ok ? 'success' : 'warning',
        );
    });

    downloadButton.addEventListener('click', () => {
        download(new Blob([output.textarea.value], { type: 'text/plain;charset=utf-8' }), fileName);
    });

    const body = node('<div></div>');

    body.append(editor.el);

    if (optionPanel) {
        body.append(optionPanel.el);
    }

    body.append(toolbar, banner.el, result.el);

    root.append(panel({ title, description, body }));

    run();
    editor.textarea.focus();
}

export { checkbox, select };
