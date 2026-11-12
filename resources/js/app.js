import './bootstrap';

import { bootDirectoryFilter } from './directory';
import { bootHomeToolFinder } from './home';
import { bootToolWorkspace } from './tools/runner';
import './ui';
import { registerServiceWorker } from './service-worker';

function bootThemeToggle() {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    let theme = systemTheme;

    try {
        const savedTheme = localStorage.getItem('site-theme');
        theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme;
    } catch {
        theme = systemTheme;
    }

    document.documentElement.dataset.theme = theme;

    const updateLabels = () => {
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        });
    };

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = theme;

            try {
                localStorage.setItem('site-theme', theme);
            } catch {
                // The selected theme remains active until the page is reloaded.
            }

            updateLabels();
        });
    });

    updateLabels();
}

/*
 * Entry point.
 *
 * Intentionally thin: it wires up whichever island exists on the current page
 * and nothing else. Tool engines (pdf-lib, pdf.js, the canvas pipeline) sit
 * behind dynamic imports, so they are only fetched when a visitor actually
 * opens that tool.
 */
function boot() {
    bootThemeToggle();
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
