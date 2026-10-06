<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class TrackOnlineVisitor
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->hasSession()) {
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
        }

        return $response;
    }
}
