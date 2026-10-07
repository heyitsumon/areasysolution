import './bootstrap';

import { bootDirectoryFilter } from './directory';
import { bootHomeToolFinder } from './home';
import { bootToolWorkspace } from './tools/runner';
import { registerServiceWorker } from './service-worker';

/*
 * Entry point.
 *
 * Intentionally thin: it wires up whichever island exists on the current page
 * and nothing else. Tool engines (pdf-lib, pdf.js, the canvas pipeline) sit
 * behind dynamic imports, so they are only fetched when a visitor actually
 * opens that tool.
 */
function boot() {
    bootToolWorkspace();
    bootDirectoryFilter();
    bootHomeToolFinder();
    registerServiceWorker();

    if (document.querySelector('[data-admin-analytics]')) {
        import('./admin-analytics')
            .then(({ bootAdminAnalytics }) => bootAdminAnalytics())
            .catch((error) => console.error('Admin analytics could not be initialized.', error));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
