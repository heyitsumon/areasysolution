<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $period = in_array($request->query('period'), ['today', 'week', 'month'], true)
            ? $request->query('period')
            : 'month';

        $now = CarbonImmutable::now();
        $start = match ($period) {
            'today' => $now->startOfDay(),
            'week' => $now->startOfWeek(),
            default => $now->startOfMonth(),
        };
        $from = $start->toDateString();
        $through = $now->toDateString();

        $routeMetrics = DB::table('route_daily_metrics')
            ->whereBetween('metric_date', [$from, $through]);
        $toolMetrics = DB::table('tool_daily_metrics')
            ->whereBetween('metric_date', [$from, $through]);

        $routeHits = (clone $routeMetrics)->sum('hits');
        $completedRuns = (clone $toolMetrics)->sum('completed_runs');
        $activeUsers = $this->distinctUsers('active_user_days', $from, $through);
        $completedUsers = $this->distinctUsers('tool_user_days', $from, $through);

        $topRoutes = (clone $routeMetrics)
            ->select('route_key', DB::raw('SUM(hits) as hits'))
            ->groupBy('route_key')
            ->orderByDesc('hits')
            ->limit(10)
            ->get();

        $topTools = (clone $toolMetrics)
            ->select('tool_slug', DB::raw('SUM(completed_runs) as completed_runs'))
            ->groupBy('tool_slug')
            ->orderByDesc('completed_runs')
            ->limit(10)
            ->get();

        $lastDay = $now->toDateString();
        $dailyHitCounts = DB::table('route_daily_metrics')
            ->whereBetween('metric_date', [$now->subDays(13)->toDateString(), $lastDay])
            ->select('metric_date', DB::raw('SUM(hits) as hits'))
            ->groupBy('metric_date')
            ->pluck('hits', 'metric_date');

        $dailyVisits = collect(range(13, 0))->map(function (int $daysAgo) use ($now, $dailyHitCounts): array {
            $date = $now->subDays($daysAgo);

            return [
                'date' => $date->format('M j'),
                'hits' => (int) $dailyHitCounts->get($date->toDateString(), 0),
            ];
        });

        return view('admin.dashboard', [
            'period' => $period,
            'routeHits' => $routeHits,
            'completedRuns' => $completedRuns,
            'activeUsers' => $activeUsers,
            'completedUsers' => $completedUsers,
            'newUsers' => User::query()->whereBetween('created_at', [$start, $now])->count(),
            'totalUsers' => User::query()->count(),
            'topRoutes' => $topRoutes,
            'topTools' => $topTools,
            'dailyVisits' => $dailyVisits,
            'recentUsers' => User::query()->latest()->limit(10)->get(['name', 'email', 'created_at']),
        ]);
    }

    private function distinctUsers(string $table, string $from, string $through): int
    {
        return (int) DB::table($table)
            ->whereBetween('metric_date', [$from, $through])
            ->distinct()
            ->count('user_id');
    }
}
