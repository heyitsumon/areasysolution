<?php

use App\Http\Middleware\CachePublicResponse;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TrackRouteHit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * In production the app sits behind a load balancer and a CDN. Without
         * trusting their forwarding headers, every visitor would appear to come
         * from the proxy IP - which would make rate limiting useless and
         * generated URLs point at the wrong scheme. Set TRUSTED_PROXIES to a
         * comma separated list of addresses, or "*" inside a private network.
         */
        $proxies = trim((string) env('TRUSTED_PROXIES', ''));

        if ($proxies !== '') {
            $middleware->trustProxies(
                at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)),
                headers: Request::HEADER_X_FORWARDED_FOR
                    | Request::HEADER_X_FORWARDED_HOST
                    | Request::HEADER_X_FORWARDED_PORT
                    | Request::HEADER_X_FORWARDED_PROTO,
            );
        }

        // Applied to every response, including JSON API replies.
        $middleware->append(SecurityHeaders::class);
        $middleware->append(TrackRouteHit::class);
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        /*
         * CachePublicResponse runs last in the web group so it sees the final
         * HTML and can store it, serve 304s and set CDN-friendly headers.
         */
        $middleware->web(append: [
            CachePublicResponse::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        /*
         * API consumers always get JSON. Without this, a CSRF or validation
         * failure during an XHR could return an HTML page that breaks the
         * front-end polling loop.
         */
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
