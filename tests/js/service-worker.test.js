import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function createWorker(fetchResponse) {
    const source = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');
    const handlers = new Map();
    const writes = [];
    const cache = {
        async match() { return undefined; },
        async put(request) { writes.push(typeof request === 'string' ? request : request.url); },
    };
    const self = {
        location: { origin: 'https://tools.test' },
        clients: { async claim() {} },
        skipWaiting() {},
        addEventListener(name, callback) { handlers.set(name, callback); },
    };
    const caches = {
        async open() { return cache; },
        async keys() { return []; },
        async delete() { return true; },
    };

    vm.runInNewContext(source, {
        self,
        caches,
        URL,
        Response,
        Headers,
        fetch: fetchResponse,
        Promise,
    });

    return {
        writes,
        async request(path) {
            let responsePromise;
            const handler = handlers.get('fetch');
            handler({
                request: { method: 'GET', mode: 'navigate', url: `https://tools.test${path}` },
                respondWith(promise) { responsePromise = promise; },
            });

            return responsePromise ? responsePromise : null;
        },
    };
}

test('service worker does not intercept private pages or query-string URLs', async () => {
    const worker = await createWorker(async () => new Response('sensitive page'));

    assert.equal(await worker.request('/admin'), null);
    assert.equal(await worker.request('/profile'), null);
    assert.equal(await worker.request('/tools/qr-code-generator?token=secret'), null);
    assert.deepEqual(worker.writes, []);
});

test('service worker caches only server-marked public pages', async () => {
    const worker = await createWorker(async () => new Response('page', {
        status: 200,
        headers: {
            'Cache-Control': 'public, max-age=60',
            'X-MyTools-Offline-Cache': 'public',
        },
    }));

    const response = await worker.request('/tools/qr-code-generator');

    assert.equal(await response.text(), 'page');
    assert.deepEqual(worker.writes, ['https://tools.test/tools/qr-code-generator']);
});

test('service worker never caches unmarked, private, or no-store pages', async () => {
    const worker = await createWorker(async (request) => new Response(request.url, {
        status: 200,
        headers: request.url.endsWith('/unmarked')
            ? { 'Cache-Control': 'public' }
            : {
                'Cache-Control': request.url.endsWith('/private') ? 'private' : 'no-store',
                'X-MyTools-Offline-Cache': 'public',
            },
    }));

    await worker.request('/tools/unmarked');
    await worker.request('/tools/private');
    await worker.request('/tools/no-store');

    assert.deepEqual(worker.writes, []);
});
