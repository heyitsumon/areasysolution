import { rafThrottle } from '../lib/dom';
import { button, checkbox, textarea } from '../lib/controls';
import { resultCard, status } from '../lib/feedback';
import { copyToClipboard, download } from '../lib/files';
import { grid, node, number, panel, select, statTile, text } from '../lib/ui';

/**
 * Generic "fill in a form, get an artefact" shell.
 *
 * Generators, checkers and previewers across the SEO, social and business
 * categories all have the same shape: a handful of inputs, something to read,
 * and something to copy. Describing a tool as data (fields + a build function)
 * keeps those tools small and guarantees they behave identically.
 */

/**
 * @param {object} context
 * @param {{title: string, description?: string, fields: Array<object>, build: (values: object) => {text?: string, preview?: HTMLElement, stats?: Array<{label: string, value: string}>, message?: string, tone?: 'info'|'success'|'error'|'warning'}, fileName?: string, ready?: (values: object) => boolean, actions?: Array<{label: string, variant?: string, run: (values: object, text: string) => void}>}} config
 */
export function mountFormOutput(context, { title, description, fields, build, fileName = 'output.txt', ready, actions = [] }) {
    const { root, announce, complete } = context;

    const controls = fields.map((field) => {
        if (field.type === 'select') {
            return { field, control: select({ label: field.label, options: field.options, value: field.value, hint: field.hint }) };
        }

        if (field.type === 'checkbox') {
            return { field, control: checkbox({ label: field.label, checked: Boolean(field.value), hint: field.hint }) };
        }

        if (field.type === 'textarea') {
            return { field, control: textarea({ label: field.label, rows: field.rows ?? 4, value: field.value ?? '', placeholder: field.placeholder ?? '', mono: Boolean(field.mono), hint: field.hint }) };
        }

        if (field.type === 'number') {
            return { field, control: number({ label: field.label, value: field.value ?? 0, min: field.min, max: field.max, step: field.step, hint: field.hint, suffix: field.suffix }) };
        }

        return { field, control: text({ label: field.label, value: field.value ?? '', type: field.type ?? 'text', placeholder: field.placeholder ?? '', mono: Boolean(field.mono), hint: field.hint }) };
    });

    const banner = status();
    const output = textarea({ label: 'Generated output', rows: 12, mono: true });

    output.textarea.readOnly = true;

    const previewHost = node('<div class="hidden"></div>');
    const statsHost = node('<div class="mt-4"></div>');

    const result = resultCard({ title: 'Result' });
    result.body.append(previewHost, output.el, statsHost);

    const read = () => {
        /** @type {Record<string, any>} */
        const values = {};

        controls.forEach(({ field, control }) => {
            if (field.type === 'checkbox') {
                values[field.key] = control.input.checked;
            } else if (field.type === 'select') {
                values[field.key] = control.select.value;
            } else {
                values[field.key] = (control.input ?? control.textarea).value;
            }
        });

        return values;
    };

    let lastValues = {};
    let lastText = '';
    let interacted = false;

    const run = () => {
        try {
            const values = read();
            const outcome = build(values) ?? {};
            const textValue = outcome.text ?? '';

            lastValues = values;
            lastText = textValue;

            output.textarea.value = textValue;
            output.el.classList.toggle('hidden', textValue === '');

            previewHost.replaceChildren();
            previewHost.classList.toggle('hidden', ! outcome.preview);
            if (outcome.preview) {
                previewHost.append(outcome.preview);
            }

            statsHost.replaceChildren();
            if (outcome.stats?.length) {
                const statsGrid = grid(4);
                outcome.stats.forEach((stat) => statsGrid.append(statTile(stat.label, stat.value)));
                statsHost.append(statsGrid);
            }

            result.show();
            banner.set(outcome.message ?? '', outcome.tone ?? 'info');
            announce(outcome.message ?? 'Output updated.');

            /*
             * Completion is only recorded once the visitor has actually touched
             * the form - otherwise loading the page would count as a "use" of
             * the tool and the analytics would drift away from reality.
             */
            if (interacted && (! ready || ready(values))) {
                void complete();
            }
        } catch (error) {
            result.hide();
            banner.set(error?.message ?? 'That combination could not be processed.', 'error');
            announce(error?.message ?? 'That combination could not be processed.');
        }
    };

    const rerun = rafThrottle(run);

    const form = node('<div class="mt-4 grid gap-3 sm:grid-cols-2"></div>');

    controls.forEach(({ field, control }) => {
        if (field.type === 'textarea' || field.span === 'full') {
            control.el.classList.add('sm:col-span-2');
        }

        form.append(control.el);
    });

    const copyButton = button({ label: 'Copy output' });
    const downloadButton = button({ label: 'Download' });

    copyButton.addEventListener('click', async () => {
        const ok = await copyToClipboard(lastText);

        banner.set(
            ok ? 'Copied to your clipboard.' : 'Copying is blocked in this browser - select the output and press Ctrl+C.',
            ok ? 'success' : 'warning',
        );
    });

    downloadButton.addEventListener('click', () => {
        download(new Blob([lastText], { type: 'text/plain;charset=utf-8' }), fileName);
    });

    result.actions.append(copyButton, downloadButton);

    actions.forEach((action) => {
        const el = button({ label: action.label, variant: action.variant ?? 'secondary' });

        el.addEventListener('click', () => action.run(lastValues, lastText));

        result.actions.append(el);
    });

    form.addEventListener('input', () => {
        interacted = true;
        rerun();
    });
    form.addEventListener('change', () => {
        interacted = true;
        rerun();
    });

    const body = node('<div></div>');

    body.append(form, banner.el, result.el);

    root.append(panel({ title, description, body }));

    run();

    return {
        addAction: (el) => result.actions.append(el),
        refresh: run,
    };
}
