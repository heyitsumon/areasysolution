import { escapeHtml, on } from './dom';
import { formatBytes, prettyType, validateFiles } from './files';
import { status } from './feedback';

let uploaderSequence = 0;

/**
 * Drag-and-drop upload control shared by every file-based tool.
 *
 * Behaviour that matters and is easy to get wrong:
 *
 * * The drop surface is a real button, so click, Enter, and Space open the picker.
 * * Drag events have to be counted (dragenter/dragleave fire for child nodes),
 *   otherwise the highlight flickers as the pointer crosses inner elements.
 * * Validation runs before anything is read, so an unsuitable file is refused
 *   instantly rather than after the browser has tried to decode it.
 * * Files dropped anywhere else on the page are ignored rather than navigating
 *   the tab away from the tool - the single most annoying bug in browser tools.
 *
 * @param {{
 *   meta: {accepts?: string[], maxBytes?: number, maxTotalBytes?: number, multiple?: boolean, maxFiles?: number},
 *   title?: string,
 *   hint?: string,
 *   onFiles: (files: File[]) => void|Promise<void>,
 * }} options
 * @returns {{el: HTMLElement, input: HTMLInputElement, clear: () => void}}
 */
export function createUploader({ meta, title, hint, onFiles }) {
    const multiple = meta.multiple === true;
    const accept = (meta.accepts ?? []).join(',');
    const inputId = `file-picker-${++uploaderSequence}`;
    const descriptionId = `${inputId}-description`;
    const limits = [];

    if (meta.maxBytes) {
        limits.push(`Up to ${formatBytes(meta.maxBytes)} per file`);
    }

    if (multiple && meta.maxTotalBytes) {
        limits.push(`${formatBytes(meta.maxTotalBytes)} total`);
    }

    if (multiple && meta.maxFiles) {
        limits.push(`${meta.maxFiles} files max`);
    }

    const fileTypes = (meta.accepts ?? []).map(prettyType).filter(Boolean);
    const uniqueFileTypes = [...new Set(fileTypes)];
    const selectionVerb = multiple ? 'files' : 'file';

    const element = document.createElement('div');
    element.innerHTML = `
        <section class="file-picker" data-file-picker>
            <button class="file-picker__target" data-dropzone type="button" aria-describedby="${descriptionId}">
                <span class="file-picker__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/>
                        <path d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4"/>
                    </svg>
                </span>
                <span class="file-picker__title">${escapeHtml(title ?? `Drop ${selectionVerb} here`)}</span>
                <span class="file-picker__description" id="${descriptionId}">
                    Drag and drop ${selectionVerb} here, or <span class="file-picker__browse">browse your device</span>
                </span>
                ${uniqueFileTypes.length > 0 ? `<span class="file-picker__types">${escapeHtml(uniqueFileTypes.join(' · '))}</span>` : ''}
                ${hint ? `<span class="file-picker__hint">${escapeHtml(hint)}</span>` : ''}
                ${limits.length > 0 ? `<span class="file-picker__limits">${limits.map((limit) => `<span class="file-picker__limit">${escapeHtml(limit)}</span>`).join('')}</span>` : ''}
            </button>
        </section>
        <input id="${inputId}" type="file" class="file-picker__input" data-input ${multiple ? 'multiple' : ''} ${accept ? `accept="${escapeHtml(accept)}"` : ''}>
        <div class="mt-3 hidden" data-feedback></div>
    `;

    const picker = /** @type {HTMLElement} */ (element.querySelector('[data-file-picker]'));
    const zone = /** @type {HTMLElement} */ (element.querySelector('[data-dropzone]'));
    const input = /** @type {HTMLInputElement} */ (element.querySelector('[data-input]'));
    const feedback = status();
    const feedbackHost = /** @type {HTMLElement} */ (element.querySelector('[data-feedback]'));

    feedbackHost.replaceWith(feedback.el);
    feedback.el.classList.remove('hidden');

    /** Tracks nested dragenter/dragleave so the highlight does not flicker. */
    let dragDepth = 0;

    const handle = async (files) => {
        const { accepted, rejected } = validateFiles(files, meta);

        if (rejected.length > 0) {
            feedback.set(
                rejected.map((item) => `${item.name}: ${item.reason}`).join(' '),
                'warning'
            );
        } else if (accepted.length > 0) {
            feedback.set('');
        }

        if (accepted.length > 0) {
            await onFiles(accepted);
        }
    };

    on(zone, 'click', () => input.click());
    on(picker, 'dragenter', (event) => {
        event.preventDefault();
        dragDepth += 1;
        picker.dataset.dragging = 'true';
    });

    on(input, 'change', () => {
        if (input.files && input.files.length > 0) {
            handle(input.files);
        }

        // Reset so selecting the same file twice still fires a change event.
        input.value = '';
    });

    on(picker, 'dragover', (event) => event.preventDefault());

    on(picker, 'dragleave', () => {
        dragDepth = Math.max(0, dragDepth - 1);

        if (dragDepth === 0) {
            delete picker.dataset.dragging;
        }
    });

    on(picker, 'drop', (event) => {
        event.preventDefault();
        dragDepth = 0;
        delete picker.dataset.dragging;

        const files = /** @type {DragEvent} */ (event).dataTransfer?.files;

        if (files && files.length > 0) {
            handle(files);
        }
    });

    /*
     * A file dropped outside the zone would otherwise make the browser navigate
     * to that file, silently destroying the visitor's place in the tool.
     */
    on(window, 'dragover', (event) => event.preventDefault());
    on(window, 'drop', (event) => event.preventDefault());

    /*
     * Paste support: pasting a screenshot straight into the image tools is a
     * small feature that turns a three-step workflow into one keystroke.
     */
    on(document, 'paste', (event) => {
        const items = /** @type {ClipboardEvent} */ (event).clipboardData?.files;

        if (items && items.length > 0 && document.body.contains(element)) {
            handle(items);
        }
    });

    return {
        el: element,
        input,
        clear: () => {
            if (input) {
                input.value = '';
            }

            feedback.set('');
        },
    };
}
