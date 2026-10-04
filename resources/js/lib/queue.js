import { escapeHtml, nextPaint } from './dom';
import { formatBytes } from './files';

/**
 * File queue shared by every batch tool (merge, compress, convert, resize):
 * add, reorder and remove behave identically everywhere, so only the transform
 * differs between tools.
 */

let sequence = 0;

/**
 * @typedef {object} QueueEntry
 * @property {number} id
 * @property {File} file
 * @property {Record<string, unknown>} meta
 */

/**
 * @param {{meta: {multiple?: boolean, maxFiles?: number, maxTotalBytes?: number}, describe?: (file: File, meta: Record<string, unknown>) => string}} options
 */
export function createQueue({ meta, describe }) {
    const element = document.createElement('div');
    element.className = 'space-y-2';

    /** @type {QueueEntry[]} */
    let entries = [];

    /** @type {Array<(entries: QueueEntry[]) => void>} */
    const listeners = [];
    let limitMessage = '';

    const iconButton = (label, disabled, path, onClick) => {
        const item = document.createElement('button');

        item.type = 'button';
        item.className = 'btn-ghost h-8 w-8 p-0';
        item.title = label;
        item.setAttribute('aria-label', label);
        item.disabled = disabled;
        item.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
        item.addEventListener('click', onClick);

        return item;
    };

    const move = (id, delta) => {
        const index = entries.findIndex((entry) => entry.id === id);
        const target = index + delta;

        if (index === -1 || target < 0 || target >= entries.length) {
            return;
        }

        const [moved] = entries.splice(index, 1);

        entries.splice(target, 0, moved);
        emit();
    };

    const remove = (id) => {
        entries = entries.filter((entry) => entry.id !== id);
        emit();
    };

    function emit() {
        render();
        listeners.forEach((listener) => listener(entries));
    }

    function render() {
        element.replaceChildren();

        entries.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900';

            const badge = document.createElement('span');
            badge.className = 'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300';
            badge.textContent = String(index + 1);

            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';

            const name = document.createElement('p');
            name.className = 'truncate text-sm font-medium';
            name.textContent = entry.file.name;

            const detail = document.createElement('p');
            detail.className = 'truncate text-xs text-slate-500 dark:text-slate-400';
            detail.textContent = describe?.(entry.file, entry.meta) ?? formatBytes(entry.file.size);

            info.append(name, detail);

            const controls = document.createElement('div');
            controls.className = 'flex shrink-0 items-center gap-1';

            if (entries.length > 1) {
                controls.append(
                    iconButton('Move up', index === 0, 'M12 19V5m0 0-5 5m5-5 5 5', () => move(entry.id, -1)),
                    iconButton('Move down', index === entries.length - 1, 'M12 5v14m0 0 5-5m-5 5-5-5', () => move(entry.id, 1))
                );
            }

            controls.append(iconButton('Remove', false, 'M6 6l12 12M18 6 6 18', () => remove(entry.id)));

            row.append(badge, info, controls);
            element.append(row);
        });

        if (limitMessage !== '') {
            const notice = document.createElement('p');
            notice.className = 'text-sm text-amber-700';
            notice.setAttribute('role', 'status');
            notice.textContent = limitMessage;
            element.append(notice);
        }
    }

    render();

    return {
        el: element,
        add: (files, extra = {}) => {
            const limit = meta.multiple ? (meta.maxFiles ?? 50) : 1;
            let skippedForCount = 0;
            let skippedForSize = 0;

            files.forEach((file) => {
                if (entries.length >= limit) {
                    skippedForCount += 1;
                    return;
                }

                const currentBytes = entries.reduce((total, entry) => total + entry.file.size, 0);

                if (meta.maxTotalBytes && currentBytes + file.size > meta.maxTotalBytes) {
                    skippedForSize += 1;
                    return;
                }

                sequence += 1;
                entries.push({ id: sequence, file, meta: extra });
            });

            const messages = [];

            if (skippedForCount > 0) {
                messages.push(`The queue limit is ${limit} file(s).`);
            }

            if (skippedForSize > 0) {
                messages.push(`The total selection limit is ${formatBytes(meta.maxTotalBytes)}.`);
            }

            limitMessage = messages.join(' ');
            emit();
        },
        items: () => entries,
        clear: () => {
            entries = [];
            limitMessage = '';
            emit();
        },
        isEmpty: () => entries.length === 0,
        onChange: (listener) => listeners.push(listener),
    };
}

/**
 * Run a worker over every queued item, yielding between items.
 *
 * Sequential on purpose: canvas decoding, PDF parsing and image encoding are all
 * memory-hungry, and running four at once on a phone is how a tab gets killed
 * "randomly". One at a time is slightly slower and far more likely to finish.
 *
 * @param {QueueEntry[]} entries
 * @param {(file: File, index: number, meta: Record<string, unknown>) => Promise<{blob: Blob, name: string}|null>} worker
 * @param {{onProgress?: (percent: number, label: string) => void}} [options]
 * @returns {Promise<Array<{name: string, blob: Blob, source: File}>>}
 */
export async function processQueue(entries, worker, { onProgress } = {}) {
    /** @type {Array<{name: string, blob: Blob, source: File}>} */
    const results = [];

    for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];

        onProgress?.((index / entries.length) * 100, `${entry.file.name} (${index + 1} of ${entries.length})`);

        // Hand control back so the progress bar paints before the main thread is
        // tied up inside a decode or an encode.
        await nextPaint();

        const output = await worker(entry.file, index, entry.meta);

        if (output) {
            results.push({ ...output, source: entry.file });
        }
    }

    onProgress?.(100, 'Finished');

    return results;
}
