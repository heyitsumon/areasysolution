<?php

namespace App\Providers;

use App\Support\Tools\ToolRegistry;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        /*
         * The catalog is hydrated once per request (once per process under
         * Octane) straight from the cached config, so rendering thousands of
         * pages per second never touches the database or the filesystem.
         */
        $this->app->singleton(ToolRegistry::class, static fn (): ToolRegistry => new ToolRegistry([
            'categories' => (array) config('tools.categories', []),
            'tools' => (array) config('tools.tools', []),
        ]));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureUrlGeneration();
        $this->configureStrictModels();
        $this->configureRateLimiting();
    }

    /**
     * Behind a load balancer the request scheme is not trustworthy, so absolute
     * URLs (canonicals, sitemap, signed download links) are forced to HTTPS in
     * production. Without this the sitemap would advertise http:// links.
     */
    protected function configureUrlGeneration(): void
    {
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }
    }

    /**
     * Lazy loading is a silent N+1 query factory, and N+1 queries are the usual
     * way a high-traffic site falls over. Fail loudly in development instead of
     * discovering it during a traffic spike.
     */
    protected function configureStrictModels(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
    }

    /**
     * Named limiters used by the routes:
     *
     *   ->middleware('throttle:api')
     *   ->middleware('throttle:conversions')
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', static function (Request $request): Limit {
            $perMinute = max(1, (int) config('tools.rate_limits.api', 120));

            return Limit::perMinute($perMinute)
                ->by(self::limiterKey($request))
                ->response(static fn (): JsonResponse => response()->json([
                    'message' => 'Too many requests. Please slow down and try again shortly.',
                ], 429));
        });

        RateLimiter::for('conversions', static function (Request $request): array {
            $window = max(1, (int) config('tools.rate_limits.conversions_window', 60));
            $max = max(1, (int) config('tools.rate_limits.conversions', 20));
            $key = self::limiterKey($request);

            return [
                Limit::perMinutes($window, $max)->by($key),
                Limit::perDay($max * 50)->by($key),
            ];
        });
    }

    /**
     * Limit by authenticated user when available, otherwise by IP.
     */
    protected static function limiterKey(Request $request): string
    {
        $userId = $request->user()?->getAuthIdentifier();

        return $userId !== null
            ? 'user:'.(string) $userId
            : 'ip:'.Str::limit((string) $request->ip(), 45, '');
    }
}
