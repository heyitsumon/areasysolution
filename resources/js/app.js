import './bootstrap';

import { bootDirectoryFilter } from './directory';
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
    registerServiceWorker();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}

