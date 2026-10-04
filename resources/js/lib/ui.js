import { escapeHtml, frag } from './dom';

/**
 * Shared UI factory for tool workspaces.
 *
 * Twenty tools sharing one set of controls is the difference between a
 * coherent product and twenty-one unrelated pages: every control here uses the
 * same Tailwind classes as the Blade views, so a workspace looks identical to
 * the shell around it.
 *
 * Controls are built as real <label>/<input> pairs rather than click handlers on
 * divs, so keyboard navigation, screen readers and 200% zoom work for free.
 *
 * Composite widgets (sliders, result cards, progress bars) live in controls.js.
 */

let controlCounter = 0;

/**
 * @returns {string}
 */
export function nextId() {
    controlCounter += 1;

    return `tool-control-${controlCounter}`;
}

/**
 * Parse a template string that contains exactly one root element.
 *
 * @param {string} markup
 * @returns {HTMLElement}
 */
export function node(markup) {
    return /** @type {HTMLElement} */ (frag(markup).firstElementChild);
}

/**
 * @param {string} markup
 * @returns {HTMLElement}
 */
export function html(markup) {
    return node(markup);
}

/**
 * Standard panel, matching the `.tool-panel` surface used by the Blade views.
 *
 * @param {{title?: string, description?: string, body?: string|Node}} [options]
 * @returns {HTMLElement}
 */
export function panel({ title, description, body } = {}) {
    const element = node(`
        <section class="tool-panel">
            ${title ? `<h2 class="text-base font-semibold">${escapeHtml(title)}</h2>` : ''}
            ${description ? `<p class="mt-1.5 text-sm text-slate-600 dark:text-slate-400">${escapeHtml(description)}</p>` : ''}
            <div class="mt-4" data-panel-body></div>
        </section>
    `);

    const host = /** @type {HTMLElement} */ (element.querySelector('[data-panel-body]'));

    if (body) {
        host.append(typeof body === 'string' ? frag(body) : body);
    }

    return element;
}

/**
 * @param {string} label
 * @param {string} value
 * @param {string} [hint]
 * @returns {HTMLElement}
 */
export function statTile(label, value, hint) {
    return node(`
        <div class="stat-tile">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">${escapeHtml(label)}</p>
            <p class="mt-1 text-lg font-bold tabular-nums">${escapeHtml(value)}</p>
            ${hint ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">${escapeHtml(hint)}</p>` : ''}
        </div>
    `);
}

/**
 * Responsive grid wrapper for tiles and buttons.
 *
 * @param {2|3|4} [columns]
 * @param {string} [extraClasses]
 * @returns {HTMLElement}
 */
export function grid(columns = 3, extraClasses = 'gap-3') {
    const map = {
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-2 lg:grid-cols-3',
        4: 'sm:grid-cols-2 lg:grid-cols-4',
    };

    return node(`<div class="grid grid-cols-2 ${map[columns] ?? map[3]} ${extraClasses}"></div>`);
}

/**
 * Wrapper that precedes a control, with a real <label for> so the label is
 * clickable and announced correctly by assistive technology.
 *
 * @param {string} label
 * @param {string} id
 * @param {string} [hint]
 * @param {string} [hintClass]
 * @returns {HTMLElement}
 */
export function labelled(label, id, hint, hintClass = 'mb-1.5 text-xs text-slate-500 dark:text-slate-400') {
    return node(`
        <div>
            <label class="field-label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
            ${hint ? `<p class="${hintClass}">${escapeHtml(hint)}</p>` : ''}
        </div>
    `);
}

/**
 * Apply the shared input styling plus any extra utility classes.
 *
 * @template {HTMLElement} T
 * @param {T} element
 * @param {string} [extra]
 * @returns {T}
 */
export function styleControl(element, extra = '') {
    element.className = `field-input ${extra}`.trim();

    return element;
}

/**
 * Single-line input.
 *
 * @param {{label: string, value?: string|number, type?: string, placeholder?: string, min?: number, max?: number, step?: number, hint?: string, mono?: boolean, name?: string, autofocus?: boolean, inputclass?: string}} options
 * @returns {{el: HTMLElement, input: HTMLInputElement}}
 */
export function text({
    label,
    value = '',
    type = 'text',
    placeholder = '',
    min,
    max,
    step,
    hint,
    mono = false,
    name = '',
    autofocus = false,
    inputclass = '',
}) {
    const input = /** @type {HTMLInputElement} */ (document.createElement('input'));

    input.id = nextId();
    input.type = type;
    input.value = String(value);
    input.placeholder = placeholder;
    input.name = name;
    input.autofocus = autofocus;

    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    if (step !== undefined) input.step = String(step);

    styleControl(input, `${mono ? 'font-mono' : ''} ${inputclass}`.trim());

    const wrapper = labelled(label, input.id, hint);

    wrapper.append(input);

    return { el: wrapper, input };
}

/**
 * Numeric input.
 *
 * `type="number"` is used rather than `inputmode` on a text field because it
 * gives mobile visitors a numeric keypad and browser-native validation. A blur
 * handler clamps the value so an accidental "1e999" cannot propagate.
 *
 * @param {{label: string, value?: number, min?: number, max?: number, step?: number, hint?: string, suffix?: string}} options
 * @returns {{el: HTMLElement, input: HTMLInputElement}}
 */
export function number({ label, value = 0, min, max, step = 1, hint, suffix }) {
    const result = text({ label, value, type: 'number', min, max, step, hint });

    if (suffix) {
        const suffixId = `${result.input.id}-suffix`;

        result.input.setAttribute('aria-describedby', suffixId);

        const badge = node(
            `<span id="${escapeHtml(suffixId)}" class="text-sm text-slate-500 dark:text-slate-400">${escapeHtml(suffix)}</span>`
        );

        const row = node('<div class="flex items-center gap-2"></div>');
        const input = result.input;

        input.remove();

        row.append(input, badge);
        result.el.append(row);
    }

    result.input.addEventListener('blur', () => {
        if (result.input.value === '') {
            return;
        }

        let parsed = Number(result.input.value);

        if (! Number.isFinite(parsed)) {
            result.input.value = String(value);

            return;
        }

        if (min !== undefined && parsed < min) parsed = min;
        if (max !== undefined && parsed > max) parsed = max;

        result.input.value = String(parsed);
    });

    return result;
}

/**
 * @param {{label: string, options: Array<{value: string, label: string}>, value?: string, hint?: string}} options
 * @returns {{el: HTMLElement, select: HTMLSelectElement}}
 */
export function select({ label, options, value, hint }) {
    const element = /** @type {HTMLSelectElement} */ (document.createElement('select'));

    element.id = nextId();
    styleControl(element, 'cursor-pointer');

    options.forEach((option) => {
        const item = document.createElement('option');

        item.value = option.value;
        item.textContent = option.label;
        item.selected = option.value === value;

        element.append(item);
    });

    const wrapper = labelled(label, element.id, hint);

    wrapper.append(element);

    return { el: wrapper, select: element };
}
