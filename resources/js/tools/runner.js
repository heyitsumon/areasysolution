import { status } from '../lib/feedback';
import { recordToolCompletion } from '../tool-analytics';

/**
 * Tool workspace dispatcher.
 *
 * The Blade page renders one container (`#tool-app`) carrying the tool slug and
 * its limits. This module turns that into a working tool:
 *
 *   1. resolve the lazily imported module for the slug
 *   2. download it, and only it
 *   3. mount it with a small context object
 *
 * The payoff is real and measurable: a visitor using the word counter downloads
 * a few kilobytes, while pdf.js and pdf-lib - hundreds of kilobytes - are only
 * fetched by the people who open a PDF tool. That is the whole reason the site
 * stays fast as the catalog grows.
 *
 * `import.meta.glob` is Vite's build-time API: it enumerates the modules now and
 * emits a separate chunk per file, which is what makes per-tool code splitting
 * possible without a hand-maintained registry.
 */

const modules = import.meta.glob(['./*.js', '!./runner.js']);

/**
 * @param {string} slug
 * @returns {(() => Promise<{default: (context: ToolContext) => void}>) | null}
 */
function loaderFor(slug) {
    const key = `./${slug}.js`;

    return modules[key] ?? null;
}

/**
 * @typedef {object} ToolContext
 * @property {HTMLElement} root            The workspace container, already emptied.
 * @property {{slug: string, name: string, accepts: string[], multiple: boolean, maxBytes: number, maxTotalBytes: number, maxFiles: number, engine: string}} meta
 * @property {(message: string) => void} announce  Writes to the page live region.
 * @property {() => Promise<void>} complete  Records the first successful completion on this page.
 * @property {() => void} [fail]           Show the standard error panel.
 */

/**
 * Boot whichever tool is present on this page.
 */
export function bootToolWorkspace() {
    const root = document.getElementById('tool-app');

    if (! root) {
        return;
    }

    const slug = root.dataset.tool ?? '';

    let completionRequest;

    const complete = () => {
        if (! completionRequest) {
            completionRequest = recordToolCompletion(slug)
                .then(() => undefined)
                .catch((error) => {
                    completionRequest = undefined;
                    console.error('Tool completion analytics failed.', error);
                });
        }

        return completionRequest;
    };

    /** @type {ToolContext} */
    const context = {
        root,
        meta: {
            slug,
            name: root.dataset.toolName ?? slug,
            accepts: (root.dataset.accepts ?? '').split(',').filter(Boolean),
            multiple: root.dataset.multiple === '1',
            maxBytes: Number(root.dataset.maxBytes ?? 0) || 0,
            maxTotalBytes: Number(root.dataset.maxTotalBytes ?? 0) || 0,
            maxFiles: Number(root.dataset.maxFiles ?? 50) || 50,
            engine: root.dataset.engine ?? 'client',
        },
        announce: (message) => {
            const region = document.getElementById('tool-status');

            if (region) {
                region.textContent = message;
            }
        },
        complete,
    };

    const loader = loaderFor(slug);

    if (! loader) {
        renderUnavailable(
            root,
            context,
            'This website is using outdated tool assets. Deploy the latest public/build directory, then refresh this page.'
        );

        return;
    }

    loader()
        .then((module) => {
            root.replaceChildren();
            module.default(context);
        })
        .catch((error) => {
            /*
             * The most common real-world failure here is a dropped connection
             * mid-download, so the message says what to do rather than exposing
             * a stack trace to a visitor who cannot act on it.
             */
            renderUnavailable(
                root,
                context,
                navigator.onLine
                    ? 'The tool files could not load. Refresh the page; if this continues, deploy the latest public/build directory.'
                    : 'You appear to be offline. Reconnect and reload to use this tool.'
            );

            reportError(error);
        });
}

/**
 * Fallback panel: never leave the visitor staring at a skeleton.
 *
 * @param {HTMLElement} root
 * @param {ToolContext} context
 * @param {string} message
 */
function renderUnavailable(root, context, message) {
    const banner = status(message);

    const wrapper = document.createElement('div');
    wrapper.className = 'tool-panel';

    const title = document.createElement('h2');
    title.className = 'text-base font-semibold';
    title.textContent = context.meta.name;

    const body = document.createElement('p');
    body.className = 'mt-1.5 text-sm text-slate-600 dark:text-slate-400';
    body.textContent = message;

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn-primary mt-4';
    retry.textContent = 'Reload the page';
    retry.addEventListener('click', () => window.location.reload());

    wrapper.append(title, body, retry);

    root.replaceChildren(banner.el, wrapper);

    context.announce(message);
}
