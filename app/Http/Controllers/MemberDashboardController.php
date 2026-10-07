<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

final class MemberDashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $userId = $request->user()->getAuthIdentifier();
        $today = CarbonImmutable::today();

        $toolDays = DB::table('tool_user_days')
            ->where('user_id', $userId);

        $recentTools = (clone $toolDays)
            ->select('tool_slug', DB::raw('MAX(metric_date) as last_used_at'), DB::raw('COUNT(*) as active_days'))
            ->groupBy('tool_slug')
            ->orderByDesc('last_used_at')
            ->limit(6)
            ->get()
            ->map(static function (object $tool): ?array {
                $definition = config('tools.tools.'.$tool->tool_slug);

                if (! is_array($definition)) {
                    return null;
                }

                return [
                    'slug' => $tool->tool_slug,
                    'name' => $definition['name'],
                    'lastUsedAt' => CarbonImmutable::parse($tool->last_used_at),
                    'activeDays' => (int) $tool->active_days,
                ];
            })
            ->filter()
            ->values();

        $activeDates = DB::table('active_user_days')
            ->where('user_id', $userId)
            ->whereBetween('metric_date', [$today->subDays(13)->toDateString(), $today->toDateString()])
            ->pluck('metric_date')
            ->map(static fn (string $date): string => CarbonImmutable::parse($date)->toDateString())
            ->all();
        $activeDateSet = array_fill_keys($activeDates, true);

        $activityDays = collect(range(13, 0))
            ->map(static function (int $daysAgo) use ($today, $activeDateSet): array {
                $date = $today->subDays($daysAgo);

                return [
                    'label' => $date->format('M j'),
                    'active' => isset($activeDateSet[$date->toDateString()]),
                ];
            });

        return view('dashboard', [
            'user' => $request->user(),
            'toolsUsed' => (clone $toolDays)->distinct()->count('tool_slug'),
            'toolDays' => (clone $toolDays)->count(),
            'activeDays' => DB::table('active_user_days')->where('user_id', $userId)->count(),
            'activeDaysThisFortnight' => count($activeDates),
            'activityDays' => $activityDays,
            'recentTools' => $recentTools,
        ]);
    }
}
