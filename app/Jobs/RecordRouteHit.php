<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

final class RecordRouteHit implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $routeKey,
        public readonly string $metricDate,
        public readonly ?int $userId,
    ) {}

    public function handle(): void
    {
        DB::transaction(function (): void {
            DB::table('route_daily_metrics')->insertOrIgnore([
                'route_key' => $this->routeKey,
                'metric_date' => $this->metricDate,
                'hits' => 0,
            ]);

            DB::table('route_daily_metrics')
                ->where('route_key', $this->routeKey)
                ->where('metric_date', $this->metricDate)
                ->increment('hits');

            if ($this->userId !== null && DB::table('users')->where('id', $this->userId)->exists()) {
                DB::table('active_user_days')->insertOrIgnore([
                    'user_id' => $this->userId,
                    'metric_date' => $this->metricDate,
                ]);
            }
        });
    }
}
