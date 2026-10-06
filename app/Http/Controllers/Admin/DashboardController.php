<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        return view('admin.dashboard', $this->dashboardData($request));
    }

    public function data(Request $request): JsonResponse
    {
        $data = $this->dashboardData($request);

        return response()->json([
            'period' => $data['period'],
            'pageViews' => $data['pageViews'],
            'onlineStats' => $data['onlineStats'],
            'completedRuns' => $data['completedRuns'],
            'activeUsers' => $data['activeUsers'],
            'completedUsers' => $data['completedUsers'],
            'newUsers' => $data['newUsers'],
            'totalUsers' => $data['totalUsers'],
            'topRoutes' => $data['topRoutes']->map(fn (object $route): array => [
                'label' => (string) $route->route_key,
                'value' => (int) $route->hits,
            ])->all(),
            'topTools' => $data['topTools']->map(fn (object $tool): array => [
                'label' => (string) $tool->tool_slug,
                'value' => (int) $tool->completed_runs,
            ])->all(),
            'dailyVisits' => $data['dailyVisits'],
            'dailyRuns' => $data['dailyRuns'],
            'recentUsers' => $data['recentUsers']->map(fn (User $user): array => [
                'name' => $user->name,
                'email' => $user->email,
                'createdAt' => $user->created_at?->toIso8601String(),
            ])->all(),
            'updatedAt' => now()->toIso8601String(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboardData(Request $request): array
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
        $today = $now->toDateString();
        $weekStart = $now->startOfWeek()->toDateString();
        $monthStart = $now->startOfMonth()->toDateString();

        $routeMetrics = DB::table('route_daily_metrics')
            ->whereBetween('metric_date', [$from, $through]);
        $toolMetrics = DB::table('tool_daily_metrics')
            ->whereBetween('metric_date', [$from, $through]);

        $pageViews = [
            'today' => DB::table('route_daily_metrics')->where('metric_date', $today)->sum('hits'),
            'week' => DB::table('route_daily_metrics')->whereBetween('metric_date', [$weekStart, $today])->sum('hits'),
            'month' => DB::table('route_daily_metrics')->whereBetween('metric_date', [$monthStart, $today])->sum('hits'),
        ];
        $onlineCutoff = now()->subMinutes(5);
        $onlineVisitors = DB::table('online_visitors')
            ->where('last_seen_at', '>=', $onlineCutoff);
        $onlineStats = [
            'visitors' => (clone $onlineVisitors)->count(),
            'members' => (clone $onlineVisitors)->whereNotNull('user_id')->distinct()->count('user_id'),
        ];
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

        $dailyRunCounts = DB::table('tool_daily_metrics')
            ->whereBetween('metric_date', [$now->subDays(13)->toDateString(), $lastDay])
            ->select('metric_date', DB::raw('SUM(completed_runs) as completed_runs'))
            ->groupBy('metric_date')
            ->pluck('completed_runs', 'metric_date');

        $dailyBuckets = collect(range(13, 0))->map(function (int $daysAgo) use ($now, $dailyHitCounts, $dailyRunCounts): array {
            $date = $now->subDays($daysAgo);

            return [
                'date' => $date->toDateString(),
                'label' => $date->format('M j'),
                'hits' => (int) $dailyHitCounts->get($date->toDateString(), 0),
                'completedRuns' => (int) $dailyRunCounts->get($date->toDateString(), 0),
            ];
        });

        return [
            'period' => $period,
            'pageViews' => $pageViews,
            'onlineStats' => $onlineStats,
            'completedRuns' => $completedRuns,
            'activeUsers' => $activeUsers,
            'completedUsers' => $completedUsers,
            'newUsers' => User::query()->whereBetween('created_at', [$start, $now])->count(),
            'totalUsers' => User::query()->count(),
            'topRoutes' => $topRoutes,
            'topTools' => $topTools,
            'dailyVisits' => $dailyBuckets->map(fn (array $day): array => [
                'label' => $day['label'],
                'value' => $day['hits'],
            ])->all(),
            'dailyRuns' => $dailyBuckets->map(fn (array $day): array => [
                'label' => $day['label'],
                'value' => $day['completedRuns'],
            ])->all(),
            'recentUsers' => User::query()->latest()->limit(10)->get(['name', 'email', 'created_at']),
        ];
    }

    private function distinctUsers(string $table, string $from, string $through): int
    {
        return (int) DB::table($table)
            ->whereBetween('metric_date', [$from, $through])
            ->distinct()
            ->count('user_id');
    }
}
