<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hardens every response. Cheap header writes, no I/O, no allocations of note -
 * safe to run on every request even at very high request rates.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! config('tools.security.headers_enabled', true)) {
            return $response;
        }

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set(
            'Permissions-Policy',
            'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
        );

        /*
         * HSTS is only sent when explicitly enabled: turning it on before the
         * domain is fully HTTPS-only can lock visitors out of the site.
         */
        if (config('tools.security.hsts', false) && $request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        /*
         * The CSP is skipped locally because Vite's dev server injects inline
         * module bootstraps and opens a websocket for HMR.
         */
        $csp = trim((string) config('tools.security.csp', ''));

        if ($csp !== '' && ! app()->environment('local')) {
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
