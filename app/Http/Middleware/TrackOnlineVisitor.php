<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class TrackOnlineVisitor
{
    public const VISITOR_COOKIE = 'areasysolution_visitor';

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->hasSession()) {
            $visitorId = (string) $request->cookie(self::VISITOR_COOKIE, '');
            $needsVisitorCookie = ! Str::isUuid($visitorId);

            if ($needsVisitorCookie) {
                $visitorId = (string) Str::uuid();
            }

            $visitorHash = hash_hmac('sha256', strtolower($visitorId), (string) config('app.key'));
            $now = now();

            DB::table('unique_site_visitors')->insertOrIgnore([
                'visitor_hash' => $visitorHash,
                'first_seen_at' => $now,
                'last_seen_at' => $now,
            ]);
            DB::table('unique_site_visitors')
                ->where('visitor_hash', $visitorHash)
                ->update(['last_seen_at' => $now]);

            $visitorHash = hash_hmac(
                'sha256',
                $request->session()->getId(),
                (string) config('app.key')
            );

            DB::table('online_visitors')->updateOrInsert(
                ['visitor_hash' => $visitorHash],
                [
                    'user_id' => $request->user()?->getAuthIdentifier(),
                    'last_seen_at' => now(),
                ]
            );

            if (Cache::add('online-visitors:prune-lock', true, now()->addHour())) {
                DB::table('online_visitors')
                    ->where('last_seen_at', '<', now()->subDay())
                    ->delete();
            }

            if ($needsVisitorCookie) {
                $response->headers->remove('X-MyTools-Offline-Cache');
                $response->headers->set('Cache-Control', 'private, no-store');
                $response->headers->setCookie(Cookie::make(
                    self::VISITOR_COOKIE,
                    $visitorId,
                    525600,
                    '/',
                    null,
                    $request->isSecure(),
                    true,
                    false,
                    'lax',
                ));
            }
        }

        return $response;
    }
}
