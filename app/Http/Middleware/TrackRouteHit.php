<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Jobs\RecordRouteHit;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TrackRouteHit
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $route = $request->route();

        if (
            ! $request->isMethod('GET')
            || ! $route
            || $response->getStatusCode() < 200
            || $response->getStatusCode() >= 300
            || ! str_contains((string) $response->headers->get('Content-Type', ''), 'text/html')
            || $request->is('api/*')
        ) {
            return $response;
        }

        $routeName = $route->getName();

        if ($routeName !== null && (
            str_starts_with($routeName, 'admin.')
            || str_starts_with($routeName, 'auth.')
        )) {
            return $response;
        }

        $routeKey = mb_substr($routeName ?? $route->uri(), 0, 180);

        dispatch(new RecordRouteHit(
            $routeKey,
            now()->toDateString(),
            $request->user()?->id,
        ))->onQueue('analytics');

        return $response;
    }
}
