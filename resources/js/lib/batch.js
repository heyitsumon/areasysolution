import { button } from './controls';
import { escapeHtml } from './dom';
import { baseName, download, downloadZip, extensionOf, formatBytes, savingsLabel } from './files';
import { grid, statTile } from './ui';
import { progressBar, resultCard, status } from './feedback';

/**
 * Result reporting and progress feedback shared by every batch tool.
 *
 * Visitors judge a file tool almost entirely on two things: whether they can
 * tell it is working, and whether they can get the output without a puzzle.
 * Both live here so all tools behave the same way.
 */

/**
 * @typedef {{name: string, blob: Blob, source?: File}} BatchResult
 */

/**
 * Build the standard result card: totals, per-file downloads and a single
 * "download everything as a ZIP" action.
 *
 * @param {{title: string, description?: string, results: BatchResult[], zipName: string, emptyMessage?: string, showSavings?: boolean}} options
 * @returns {ReturnType<typeof resultCard>}
 */
export function buildResultCard({ title, description, results, zipName, emptyMessage, showSavings = true }) {
    const card = resultCard({ title, description });

    if (results.length === 0) {
        const message = document.createElement('p');

        message.className = 'text-sm text-slate-600 dark:text-slate-400';
        message.textContent = emptyMessage ?? 'Nothing was produced. Check the file and try again.';

        card.body.append(message);
        card.show();

        return card;
    }

    const outputBytes = results.reduce((sum, result) => sum + result.blob.size, 0);
    const inputBytes = results.reduce((sum, result) => sum + (result.source?.size ?? 0), 0);

    const tiles = grid(3, 'gap-3');

    tiles.append(
        statTile('Files', String(results.length)),
        statTile('Output size', formatBytes(outputBytes)),
        showSavings && inputBytes > outputBytes
            ? statTile('Saved', formatBytes(inputBytes - outputBytes), savingsLabel(inputBytes, outputBytes))
            : statTile('Status', 'Ready')
    );

    card.body.append(tiles);

    const list = document.createElement('ul');

    list.className = 'mt-4 space-y-2';

    results.forEach((result) => {
        const item = document.createElement('li');

        item.className = 'flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800';

        const label = document.createElement('span');

        label.className = 'min-w-0 flex-1 truncate';

        const savings = showSavings && result.source ? ` &middot; ${escapeHtml(savingsLabel(result.source.size, result.blob.size))}` : '';

        label.innerHTML = `${escapeHtml(result.name)} <span class="text-slate-500 dark:text-slate-400">(${escapeHtml(formatBytes(result.blob.size))}${savings})</span>`;

        const save = button({ label: 'Download' });

        save.addEventListener('click', () => download(result.blob, result.name));

        item.append(label, save);
        list.append(item);
    });

    card.body.append(list);

    if (results.length > 1) {
        const zip = button({ label: `Download all as ZIP (${results.length})`, variant: 'primary' });

        zip.addEventListener('click', async () => {
            zip.disabled = true;
            zip.textContent = 'Zipping...';

            try {
                await downloadZip(
                    results.map((result) => ({ name: result.name, blob: result.blob })),
                    zipName
                );
            } catch (error) {
                reportError(error);
            } finally {
                zip.disabled = false;
                zip.textContent = `Download all as ZIP (${results.length})`;
            }
        });

        card.actions.append(zip);
    } else {
        const single = button({ label: 'Download result', variant: 'primary' });

        single.addEventListener('click', () => download(results[0].blob, results[0].name));

        card.actions.append(single);
    }

    card.show();

    return card;
}

/**
 * Progress bar plus a status banner, wired together.
 *
 * @returns {{wrapper: HTMLElement, progress: ReturnType<typeof progressBar>, status: ReturnType<typeof status>}}
 */
export function createBatchFeedback() {
    const progress = progressBar();
    const statusRegion = status();

    const wrapper = document.createElement('div');

    wrapper.className = 'mt-4 space-y-3';
    wrapper.append(statusRegion.el, progress.el);

    return { wrapper, progress, status: statusRegion };
}

/**
 * Suggest an output filename that keeps the original stem.
 *
 * @param {File} file
 * @param {string} extension
 * @param {string} [suffix]
 * @returns {string}
 */
export function outputName(file, extension, suffix = '') {
    return `${baseName(file.name)}${suffix}.${extension}`;
}

/**
 * @param {File} file
 * @param {string} extension
 * @returns {boolean}
 */
export function hasExtension(file, extension) {
    return extensionOf(file.name) === extension.toLowerCase();
}
