/*
 * Service worker: makes tools work offline after the first visit.
 *
 * Strategy per request type, chosen so that correctness always beats speed:
 *
 *   public navigations  network first; only explicitly marked anonymous pages
 *                       are cached, so private pages never bypass auth offline.
 *   /build/*     cache first, forever. Vite content-hashes these filenames, so
 *                a cached copy can never be stale.
 *   everything   passthrough, never cached. That covers /api/, downloads and
 *   else         anything visitor-specific.
 */

const VERSION = 'mytools-v3';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

const OFFLINE_FALLBACKS = ['/', '/tools'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(PAGES).then(async (cache) => {
            await Promise.all(OFFLINE_FALLBACKS.map(async (path) => {
                const response = await fetch(path);

                if (isPublicCacheResponse(response)) {
                    await cache.put(path, await cacheablePublicResponse(response));
                }
            }));
        })
            .catch(() => undefined)
    );

    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => ! key.startsWith(VERSION)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        if (! isPublicPage(url)) {
            return;
        }

        event.respondWith(networkFirstPage(request));

        return;
    }

    if (url.pathname.startsWith('/build/')) {
        event.respondWith(cacheFirstAsset(request));
    }
});

/**
 * Only the public site shell and known public tool pages can use offline HTML.
 *
 * @param {URL} url
 * @returns {boolean}
 */
function isPublicPage(url) {
    return url.search === ''
        && (url.pathname === '/' || url.pathname === '/tools' || /^\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname));
}

/**
 * The server marks only successful, anonymous, canonical public HTML responses.
 *
 * @param {Response} response
 * @returns {boolean}
 */
function isPublicCacheResponse(response) {
    const cacheControl = response.headers.get('Cache-Control') ?? '';

    return response.ok
        && response.headers.get('X-MyTools-Offline-Cache') === 'public'
        && ! /(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl);
}

/**
 * Never retain session or CSRF cookies in the offline response cache.
 *
 * @param {Response} response
 * @returns {Promise<Response>}
 */
async function cacheablePublicResponse(response) {
    const headers = new Headers(response.headers);
    headers.delete('Set-Cookie');
    headers.delete('Set-Cookie2');

    return new Response(await response.clone().arrayBuffer(), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirstPage(request) {
    const cache = await caches.open(PAGES);

    try {
        const response = await fetch(request);

        if (isPublicCacheResponse(response)) {
            await cache.put(request, await cacheablePublicResponse(response));
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        const fallback = await cache.match('/tools');

        if (fallback) {
            return fallback;
        }

        throw error;
    }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirstAsset(request) {
    const cache = await caches.open(ASSETS);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    if (response.ok) {
        cache.put(request, response.clone());
    }

    return response;
}
