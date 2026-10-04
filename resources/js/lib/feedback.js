import { escapeHtml } from './dom';
import { node } from './ui';

/**
 * Feedback widgets: status banners, result cards and progress bars.
 *
 * Every tool needs to tell the visitor three things - what is happening, what
 * came out, and whether it worked. Centralising that keeps the message and the
 * appearance identical across the tool catalog.
 */

/**
 * Inline status region with a tone.
 *
 * The returned setter also writes to the page-level live region defined in the
 * Blade layout, because file tools are notoriously silent: silence is exactly
 * what makes somebody press "convert" three times and then assume it is broken.
 *
 * @param {string} [initial]
 * @returns {{el: HTMLElement, set: (message: string, tone?: 'info'|'success'|'error'|'warning') => void}}
 */
export function status(initial = '') {
    const tones = {
        info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20',
        error: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20',
        warning: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20',
    };

    const element = node('<div class="hidden rounded-xl px-4 py-3 text-sm" role="status"></div>');
    const globalRegion = document.getElementById('tool-status');

    const set = (message, tone = 'info') => {
        element.className = `rounded-xl px-4 py-3 text-sm ${tones[tone] ?? tones.info}`;
        element.textContent = message;
        element.classList.toggle('hidden', message === '');

        if (globalRegion) {
            globalRegion.textContent = message;
        }
    };

    if (initial) {
        set(initial);
    }

    return { el: element, set };
}

/**
 * Result card, hidden until a tool has something to offer.
 *
 * @param {{title: string, description?: string}} options
 * @returns {{el: HTMLElement, body: HTMLElement, actions: HTMLElement, show: () => void, hide: () => void}}
 */
export function resultCard({ title, description }) {
    const element = node(`
        <section class="hidden tool-panel border-indigo-200 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/5">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 class="text-base font-semibold">${escapeHtml(title)}</h2>
                    ${description ? `<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">${escapeHtml(description)}</p>` : ''}
                </div>
                <div data-result-actions class="flex flex-wrap gap-2"></div>
            </div>
            <div data-result-body class="mt-4"></div>
        </section>
    `);

    return {
        el: element,
        body: /** @type {HTMLElement} */ (element.querySelector('[data-result-body]')),
        actions: /** @type {HTMLElement} */ (element.querySelector('[data-result-actions]')),
        show: () => element.classList.remove('hidden'),
        hide: () => element.classList.add('hidden'),
    };
}

/**
 * Linear progress bar for anything that iterates over files or pages.
 *
 * @returns {{el: HTMLElement, set: (percent: number, label?: string) => void}}
 */
export function progressBar() {
    const element = node(`
        <div class="hidden" data-progress>
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span data-progress-label>Working...</span>
                <span data-progress-value class="tabular-nums">0%</span>
            </div>
            <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div data-progress-fill class="h-full w-0 rounded-full bg-indigo-600 transition-[width] duration-200"></div>
            </div>
        </div>
    `);

    const label = /** @type {HTMLElement} */ (element.querySelector('[data-progress-label]'));
    const value = /** @type {HTMLElement} */ (element.querySelector('[data-progress-value]'));
    const fill = /** @type {HTMLElement} */ (element.querySelector('[data-progress-fill]'));

    return {
        el: element,
        set: (percent, text) => {
            const clamped = Math.max(0, Math.min(100, Math.round(percent)));

            element.classList.toggle('hidden', clamped >= 100);
            fill.style.width = `${clamped}%`;
            value.textContent = `${clamped}%`;

            if (text) {
                label.textContent = text;
            }
        },
    };
}
