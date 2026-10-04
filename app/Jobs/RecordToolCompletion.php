<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

final class RecordToolCompletion implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $toolSlug,
        public readonly string $metricDate,
        public readonly ?int $userId,
    ) {}

    public function handle(): void
    {
        DB::transaction(function (): void {
            DB::table('tool_daily_metrics')->insertOrIgnore([
                'tool_slug' => $this->toolSlug,
                'metric_date' => $this->metricDate,
                'completed_runs' => 0,
            ]);

            DB::table('tool_daily_metrics')
                ->where('tool_slug', $this->toolSlug)
                ->where('metric_date', $this->metricDate)
                ->increment('completed_runs');

            if ($this->userId !== null && DB::table('users')->where('id', $this->userId)->exists()) {
                DB::table('tool_user_days')->insertOrIgnore([
                    'tool_slug' => $this->toolSlug,
                    'user_id' => $this->userId,
                    'metric_date' => $this->metricDate,
                ]);

                DB::table('active_user_days')->insertOrIgnore([
                    'user_id' => $this->userId,
                    'metric_date' => $this->metricDate,
                ]);
            }
        });
    }
}
