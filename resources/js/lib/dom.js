/**
 * Minimal DOM helpers.
 *
 * Deliberately dependency free: a framework would add tens of kilobytes to
 * every tool page to solve a problem these forty lines already solve, and this
 * bundle is on the critical path for a page that is meant to feel instant.
 */

/**
 * Query a single element, scoped to a container by default.
 *
 * @param {ParentNode} scope
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function qs(scope, selector) {
    const found = scope.querySelector(selector);

    if (!found) {
        throw new Error(`Expected to find "${selector}" inside the tool workspace.`);
    }

    return /** @type {HTMLElement} */ (found);
}

/**
 * @param {ParentNode} scope
 * @param {string} selector
 * @returns {HTMLElement[]}
 */
export function qsa(scope, selector) {
    return Array.from(scope.querySelectorAll(selector));
}

/**
 * Turn a template string into a DOM fragment.
 *
 * @param {string} markup
 * @returns {DocumentFragment}
 */
export function frag(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup.trim();

    return template.content;
}

/**
 * Replace everything inside `container` with `markup` or nodes.
 *
 * @param {HTMLElement} container
 * @param {string|Node|Array<string|Node>} content
 * @returns {HTMLElement}
 */
export function render(container, content) {
    container.replaceChildren();

    const items = Array.isArray(content) ? content : [content];

    items.forEach((item) => {
        container.append(typeof item === 'string' ? frag(item) : item);
    });

    return container;
}

/**
 * Append without wiping existing content.
 *
 * @param {HTMLElement} container
 * @param {string|Node} content
 */
export function append(container, content) {
    container.append(typeof content === 'string' ? frag(content) : content);
}

/**
 * @param {EventTarget} target
 * @param {string} type
 * @param {(event: Event) => void} handler
 * @param {AddEventListenerOptions} [options]
 */
export function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
}

/**
 * Escape text for safe interpolation into an HTML template string.
 *
 * Used wherever a filename or user-typed value is rendered back into the page
 * - a filename is untrusted input, and forgetting this is how an XSS starts.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Run a callback once, on the next frame, collapsing bursts of calls.
 *
 * Typing in a text field fires an input event per keystroke; recounting a
 * megabyte of text on every one of them is how a tool gets a reputation for
 * being slow. This keeps work to at most one pass per frame.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} callback
 * @returns {(...args: Parameters<F>) => void}
 */
export function rafThrottle(callback) {
    let handle = 0;
    let lastArgs;

    return (...args) => {
        lastArgs = args;

        if (handle) {
            return;
        }

        handle = window.requestAnimationFrame(() => {
            handle = 0;
            callback(...lastArgs);
        });
    };
}

/**
 * Debounce for expensive work triggered by typing (parsing, hashing, network).
 *
 * @template {(...args: any[]) => any} F
 * @param {F} callback
 * @param {number} [wait]
 * @returns {(...args: Parameters<F>) => void}
 */
export function debounce(callback, wait = 250) {
    let timer = 0;

    return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => callback(...args), wait);
    };
}

/**
 * Yield control back to the browser so a long task cannot freeze the tab.
 *
 * @returns {Promise<void>}
 */
export function nextPaint() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => window.setTimeout(resolve, 0));
    });
}
