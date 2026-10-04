import { rafThrottle } from '../lib/dom';
import { button, textarea } from '../lib/controls';
import { status } from '../lib/feedback';
import { copyToClipboard, download, readText } from '../lib/files';
import { grid, node, panel, statTile } from '../lib/ui';
import { createUploader } from '../lib/uploader';

/**
 * Word counter.
 *
 * Counts, reading time and keyword density are computed from text already in the
 * DOM, throttled to one pass per animation frame. No request, no debounce lag,
 * and nothing typed here ever leaves the page.
 */

const SAMPLE = `Privacy is not a feature you add at the end of a project. It is a property of the design, and it shows up in small decisions: where a file is read, what gets written to a log, and what is kept after the visitor has gone.

A browser can do an enormous amount of work on a file without sending it anywhere. That changes the economics of running a tool site: no upload bandwidth to pay for, no storage to secure, and no queue for the next visitor to wait behind.`;

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those', 'as',
    'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her', 'i', 'not', 'no', 'so',
]);

/**
 * @param {string} text
 */
function segment(text) {
    const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []);
    const sentences = (text.match(/[^.!?…]+[.!?…]+(\s|$)/gu) ?? []).length || (text.trim() === '' ? 0 : 1);
    const paragraphs = text.split(/\n\s*\n/).filter((block) => block.trim() !== '').length;

    return {
        words,
        sentences,
        paragraphs,
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/gu, '').length,
    };
}

/**
 * Top recurring words with filler removed, so the list is useful rather than
 * dominated by "the".
 *
 * @param {string[]} words
 * @param {number} [limit]
 */
function density(words, limit = 12) {
    /** @type {Map<string, number>} */
    const counts = new Map();

    words.forEach((raw) => {
        const word = raw.toLowerCase();

        if (word.length < 3 || STOP_WORDS.has(word)) {
            return;
        }

        counts.set(word, (counts.get(word) ?? 0) + 1);
    });

    const total = words.length || 1;

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([word, count]) => ({ word, count, share: (count / total) * 100 }));
}

/**
 * @param {number} minutes
 */
function duration(minutes) {
    return minutes < 1 ? `${Math.max(1, Math.round(minutes * 60))} sec` : `${Math.round(minutes)} min`;
}

export default function mount({ root, meta, complete }) {
    const editor = textarea({
        label: 'Your text',
        rows: 12,
        hint: 'Nothing is sent anywhere - all of the counting happens in this tab.',
        placeholder: 'Start typing or paste your text here.',
    });

    const statsHost = node('<div></div>');
    const densityHost = node('<div></div>');
    const toolbar = node('<div class="flex flex-wrap gap-2"></div>');
    const banner = status();

    const loadSample = button({ label: 'Load sample' });
    const clear = button({ label: 'Clear' });
    const copyReport = button({ label: 'Copy statistics' });
    const saveReport = button({ label: 'Download report' });

    toolbar.append(loadSample, clear, copyReport, saveReport);

    const uploader = createUploader({
        meta: { ...meta, multiple: false, maxBytes: Math.min(meta.maxBytes, 5 * 1024 * 1024) },
        title: 'Drop a .txt, .md, .csv or .json file',
        onFiles: async ([file]) => {
            editor.textarea.value = await readText(file);
            update();
        },
    });

    const card = panel({ title: 'Text', body: node('<div class="space-y-4"></div>') });
    const cardBody = /** @type {HTMLElement} */ (card.querySelector('[data-panel-body]'));

    cardBody.append(editor.el, toolbar, uploader.el);

    root.append(node('<div class="grid gap-5 lg:grid-cols-2"></div>'));

    const columns = /** @type {HTMLElement} */ (root.firstElementChild);
    const left = node('<div class="space-y-5"></div>');
    const right = node('<div class="space-y-5"></div>');

    columns.append(left, right);
    left.append(card);
    right.append(
        panel({ title: 'Statistics', body: statsHost }),
        panel({ title: 'Keyword density', body: densityHost }),
    );

    let latest = segment('');

    const report = () => [
        `Words: ${latest.words.length}`,
        `Characters: ${latest.characters}`,
        `Characters without spaces: ${latest.charactersNoSpaces}`,
        `Sentences: ${latest.sentences}`,
        `Paragraphs: ${latest.paragraphs}`,
        `Reading time: ${duration(latest.words.length / 200)}`,
        `Speaking time: ${duration(latest.words.length / 130)}`,
    ].join('\n');

    function update() {
        latest = segment(editor.textarea.value);

        const { words, sentences, paragraphs, characters, charactersNoSpaces } = latest;

        const tiles = grid(3, 'gap-3');

        tiles.append(
            statTile('Words', words.length.toLocaleString()),
            statTile('Characters', characters.toLocaleString()),
            statTile('No spaces', charactersNoSpaces.toLocaleString()),
            statTile('Sentences', sentences.toLocaleString()),
            statTile('Paragraphs', paragraphs.toLocaleString()),
            statTile('Reading time', duration(words.length / 200), 'at 200 wpm'),
        );

        statsHost.replaceChildren(tiles);

        const unique = new Set(words.map((word) => word.toLowerCase())).size;
        const longest = words.reduce((best, word) => (word.length > best.length ? word : best), '');
        const extras = node('<dl class="mt-4 space-y-1.5 text-sm"></dl>');

        /** @type {Array<[string, string]>} */
        const rows = [
            ['Unique words', unique.toLocaleString()],
            ['Speaking time', `${duration(words.length / 130)} (at 130 wpm)`],
            ['Average word length', words.length ? `${(words.join('').length / words.length).toFixed(1)} characters` : '—'],
            ['Longest word', longest || '—'],
        ];

        rows.forEach(([label, value]) => {
            const row = node('<div class="flex justify-between gap-4"></div>');

            row.append(
                node(`<dt class="text-slate-600 dark:text-slate-400">${label}</dt>`),
                node(`<dd class="font-medium tabular-nums">${value}</dd>`),
            );

            extras.append(row);
        });

        statsHost.append(extras);

        densityHost.replaceChildren();

        if (words.length === 0) {
            densityHost.append(node('<p class="text-sm text-slate-500 dark:text-slate-400">Paste some text to see keyword frequency.</p>'));

            return;
        }

        const top = density(words);
        const list = node('<ul class="space-y-2.5"></ul>');

        top.forEach(({ word, count, share }) => {
            const item = node('<li></li>');

            item.append(node(`
                <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="truncate font-medium">${word}</span>
                    <span class="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">${count} &middot; ${share.toFixed(1)}%</span>
                </div>
            `));

            const bar = node('<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"></div>');
            const fill = node('<div class="h-full rounded-full bg-indigo-500"></div>');

            fill.style.width = `${Math.max(4, (count / top[0].count) * 100)}%`;
            bar.append(fill);
            item.append(bar);
            list.append(item);
        });

        densityHost.append(list);
    }

    editor.textarea.addEventListener('input', rafThrottle(() => {
        update();

        if (editor.textarea.value.trim() !== '') {
            complete();
        }
    }));

    loadSample.addEventListener('click', () => {
        editor.textarea.value = SAMPLE;
        update();
        complete();
    });

    clear.addEventListener('click', () => {
        editor.textarea.value = '';
        update();
        editor.textarea.focus();
    });

    copyReport.addEventListener('click', async () => {
        const ok = await copyToClipboard(report());

        banner.set(
            ok
                ? 'Statistics copied to your clipboard.'
                : 'Copying is blocked in this browser - select the numbers and press Ctrl+C.',
            ok ? 'success' : 'warning',
        );

        window.setTimeout(() => banner.set(''), 2500);
    });

    saveReport.addEventListener('click', () => {
        download(
            new Blob([`${report()}\n\n---\n\n${editor.textarea.value}`], { type: 'text/plain;charset=utf-8' }),
            'text-statistics.txt',
        );
    });


    banner.el.classList.add('sr-only');
    root.append(banner.el);

    update();
    editor.textarea.focus();
}
