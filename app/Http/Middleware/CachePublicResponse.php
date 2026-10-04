<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes every public page cacheable at the browser, at the CDN edge, and in the
 * application cache.
 *
 * Three layers, cheapest first:
 *
 *   1. Full-page cache  - the rendered HTML is stored in the cache store, so a
 *      hit costs one cache read and no View compilation, no registry hydration
 *      and no database work. This is what lets a single origin ride out a
 *      traffic spike from a social front page.
 *   2. Conditional GET  - an ETag plus 304 responses, so repeat visitors
 *      download headers instead of the whole document.
 *   3. Cache-Control    - `s-maxage` + `stale-while-revalidate`, so a CDN keeps
 *      answering from the edge while it refreshes in the background.
 */
final class CachePublicResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->shouldConsider($request)) {
            return $next($request);
        }

        $key = $this->cacheKey($request);
        $cached = Cache::get($key);

        if (is_array($cached) && isset($cached['content'])) {
            $response = new Response(
                (string) $cached['content'],
                (int) $cached['status'],
                $this->sanitizeHeaders((array) $cached['headers'])
            );
        } else {
            $response = $next($request);
        }

        if (! $this->isCacheableResponse($response)) {
            return $this->markForOfflineCache($response, $request);
        }

        if (! is_array($cached)) {
            Cache::put($key, [
                'content' => $response->getContent(),
                'status' => $response->getStatusCode(),
                'headers' => $this->sanitizeHeaders($response->headers->all()),
            ], now()->addSeconds(max(1, (int) config('tools.cache.edge_max_age', 86400))));
        }

        $this->applyCacheHeaders($response, $request);
        $response->headers->set('X-MyTools-Offline-Cache', 'public');

        return $response;
    }

    private function markForOfflineCache(Response $response, Request $request): Response
    {
        if (
            $response->getStatusCode() !== Response::HTTP_OK
            || ! str_contains((string) $response->headers->get('Content-Type', ''), 'text/html')
            || $response->headers->hasCacheControlDirective('no-store')
            || preg_match('/(?:^|,)\s*(?:cookie|authorization)\s*(?:,|$)/i', (string) $response->headers->get('Vary', ''))
            || ! $this->isAnonymousPublicPage($request)
        ) {
            return $response;
        }

        $response->headers->set('Cache-Control', 'public, max-age=0, must-revalidate');
        $response->headers->set('X-MyTools-Offline-Cache', 'public');

        return $response;
    }

    /**
     * Per-visitor headers must never be shared between users. Laravel's session
     * middleware attaches a Set-Cookie to every response, so it is stripped
     * before an entry becomes visible to anybody else.
     *
     * @param  array<string, mixed>  $headers
     * @return array<string, mixed>
     */
    protected function sanitizeHeaders(array $headers): array
    {
        foreach (array_keys($headers) as $name) {
            if (in_array(strtolower((string) $name), ['set-cookie', 'cookie', 'authorization'], true)) {
                unset($headers[$name]);
            }
        }

        return $headers;
    }

    /**
     * Only anonymous GET/HEAD requests to HTML routes are worth caching.
     */
    protected function shouldConsider(Request $request): bool
    {
        if (! config('tools.cache.enabled', true)) {
            return false;
        }

        if (! $request->isMethodCacheable()) {
            return false;
        }

        return $this->isAnonymousPublicPage($request);
    }

    protected function isAnonymousPublicPage(Request $request): bool
    {
        if ($request->user() !== null || $request->query() !== []) {
            return false;
        }

        return in_array($request->route()?->getName(), ['home', 'tools.index', 'tools.show'], true);
    }

    protected function cacheKey(Request $request): string
    {
        return sprintf(
            'page:%s:%s:%s',
            hash('xxh128', app()->version().'|'.(string) config('app.key')),
            $request->getHost(),
            $request->getRequestUri()
        );
    }

    protected function isCacheableResponse(Response $response): bool
    {
        if ($response->getStatusCode() !== Response::HTTP_OK) {
            return false;
        }

        $contentType = (string) $response->headers->get('Content-Type', '');

        if ($contentType !== '' && ! str_contains($contentType, 'text/html')) {
            return false;
        }

        return ! $response->headers->hasCacheControlDirective('no-store')
            && ! $response->headers->hasCacheControlDirective('private');
    }

    protected function applyCacheHeaders(Response $response, Request $request): void
    {
        $browserTtl = max(0, (int) config('tools.cache.browser_max_age', 300));
        $edgeTtl = max(0, (int) config('tools.cache.edge_max_age', 86400));
        $staleWhileRevalidate = max(0, (int) config('tools.cache.stale_while_revalidate', 604800));

        $response->setPublic();
        $response->setMaxAge($browserTtl);
        $response->setSharedMaxAge($edgeTtl);
        $response->headers->addCacheControlDirective('stale-while-revalidate', (string) $staleWhileRevalidate);
        $response->headers->addCacheControlDirective('stale-if-error', '86400');

        $response->headers->set('Vary', 'Accept-Encoding', false);

        if (! $response->headers->has('ETag')) {
            $content = (string) $response->getContent();
            $response->setEtag(hash('xxh128', $content));
        }

        if ($response->isNotModified($request)) {
            $response->setNotModified();
        }
    }
}
