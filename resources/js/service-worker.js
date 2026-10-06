/**
 * Service worker registration.
 *
 * Only public, explicitly marked pages are eligible for offline caching. If the browser does not support service workers,
 * or the page is not on a secure origin, nothing is registered and the site
 * behaves exactly as it would otherwise.
 *
 * Registered after load so it never competes with the first paint for bandwidth
 * on a slow connection.
 */
export function registerServiceWorker() {
    if (! ('serviceWorker' in navigator)) {
        return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        return;
    }

    window.addEventListener(
        'load',
        () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
                // A failed registration must never surface to the visitor.
            });
        },
        { once: true }
    );
}
