import { node, styleControl, nextId, labelled } from './ui';

/**
 * Form widgets used by tool workspaces: sliders, checkboxes, text areas and
 * buttons.
 *
 * Kept in its own module so ui.js stays small enough to read in one screen; both
 * files together form the dependency-free UI layer the tools are built on.
 * Feedback widgets (status banners, result cards, progress) live in feedback.js.
 */

/**
 * Slider with a live value readout.
 *
 * Used for quality and scale controls, where the exact number matters less than
 * the feel of dragging it - and where the readout removes the guessing.
 *
 * @param {{label: string, min: number, max: number, step?: number, value: number, format?: (value: number) => string, hint?: string}} options
 * @returns {{el: HTMLElement, input: HTMLInputElement, output: HTMLElement}}
 */
export function range({ label, min, max, step = 1, value, format, hint }) {
    const formatter = format ?? ((raw) => String(raw));

    const input = /** @type {HTMLInputElement} */ (document.createElement('input'));

    input.id = nextId();
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.className = 'mt-2 w-full accent-indigo-600';

    const output = node(
        `<output class="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums dark:bg-slate-800">${formatter(value)}</output>`
    );

    input.addEventListener('input', () => {
        output.textContent = formatter(Number(input.value));
    });

    const header = node(`<div class="flex items-center justify-between gap-3"><span class="field-label mb-0">${label}</span></div>`);

    header.append(output);

    const wrapper = node('<div></div>');

    wrapper.append(header, input);

    if (hint) {
        wrapper.append(node(`<p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">${hint}</p>`));
    }

    return { el: wrapper, input, output };
}

/**
 * @param {{label: string, checked?: boolean, hint?: string}} options
 * @returns {{el: HTMLElement, input: HTMLInputElement}}
 */
export function checkbox({ label, checked = false, hint }) {
    const input = /** @type {HTMLInputElement} */ (document.createElement('input'));

    input.id = nextId();
    input.type = 'checkbox';
    input.checked = checked;
    input.className = 'mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600';

    const wrapper = node(`
        <label class="flex cursor-pointer items-start gap-2.5" for="${input.id}">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                ${label}
                ${hint ? `<span class="block text-xs font-normal text-slate-500 dark:text-slate-400">${hint}</span>` : ''}
            </span>
        </label>
    `);

    wrapper.prepend(input);

    return { el: wrapper, input };
}

/**
 * @param {{label: string, rows?: number, value?: string, placeholder?: string, mono?: boolean, hint?: string, spellcheck?: boolean}} options
 * @returns {{el: HTMLElement, textarea: HTMLTextAreaElement}}
 */
export function textarea({ label, rows = 8, value = '', placeholder = '', mono = false, hint, spellcheck = true }) {
    const element = /** @type {HTMLTextAreaElement} */ (document.createElement('textarea'));

    element.id = nextId();
    element.rows = rows;
    element.placeholder = placeholder;
    element.spellcheck = spellcheck;
    element.value = value;

    styleControl(element, mono ? 'font-mono text-[13px] leading-relaxed' : 'leading-relaxed');

    const wrapper = labelled(label, element.id, hint);

    wrapper.append(element);

    return { el: wrapper, textarea: element };
}

/**
 * @param {{label: string, variant?: 'primary'|'secondary'|'ghost', type?: string, disabled?: boolean}} options
 * @returns {HTMLButtonElement}
 */
export function button({ label, variant = 'secondary', type = 'button', disabled = false }) {
    const classes = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
    };

    const element = /** @type {HTMLButtonElement} */ (document.createElement('button'));

    element.type = type;
    element.className = classes[variant] ?? classes.secondary;
    element.textContent = label;
    element.disabled = disabled;

    return element;
}

