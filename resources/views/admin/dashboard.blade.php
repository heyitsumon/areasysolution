@extends('layouts.app', ['title' => 'Admin analytics'])

@section('content')
    <div class="actions" style="justify-content:space-between">
        <div>
            <div class="eyebrow">Admin panel</div>
            <h1 style="font-size:42px">Analytics overview</h1>
        </div>
        <nav class="periods" aria-label="Analytics date range">
            @foreach (['today' => 'Day', 'week' => 'Week', 'month' => 'Month'] as $value => $label)
                <a class="{{ $period === $value ? 'active' : '' }}" href="{{ route('admin.dashboard', ['period' => $value]) }}">{{ $label }}</a>
            @endforeach
        </nav>
    </div>
    <p class="muted">Metrics are aggregated asynchronously; recent activity may take a short time to appear.</p>
    <section class="stats" aria-label="Summary metrics">
        <article class="card stat"><span>Page hits · selected range</span><strong>{{ number_format($routeHits) }}</strong></article>
        <article class="card stat"><span>New accounts · selected range</span><strong>{{ number_format($newUsers) }}</strong></article>
        <article class="card stat"><span>Active members · selected range</span><strong>{{ number_format($activeUsers) }}</strong></article>
        <article class="card stat"><span>Successful tool sessions · selected range</span><strong>{{ number_format($completedRuns) }}</strong></article>
        <article class="card stat"><span>Members completing a tool · selected range</span><strong>{{ number_format($completedUsers) }}</strong></article>
        <article class="card stat"><span>All registered accounts</span><strong>{{ number_format($totalUsers) }}</strong></article>
    </section>

    <section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));margin:20px 0">
        <article class="card">
            <h2>Page hits · last 14 days</h2>
            @php($maxHits = max(1, (int) $dailyVisits->max('hits')))
            @foreach ($dailyVisits as $day)
                <div class="bar-row">
                    <span>{{ $day['date'] }}</span>
                    <div class="bar"><i style="width:{{ (int) round(($day['hits'] / $maxHits) * 100) }}%"></i></div>
                    <strong>{{ number_format($day['hits']) }}</strong>
                </div>
            @endforeach
        </article>
        <article class="card">
            <h2>Most visited routes</h2>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Route</th><th>Hits</th></tr></thead>
                    <tbody>
                        @forelse ($topRoutes as $route)
                            <tr><td>{{ $route->route_key }}</td><td>{{ number_format($route->hits) }}</td></tr>
                        @empty
                            <tr><td colspan="2" class="muted">No page-view data for this period yet.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </article>
        <article class="card">
            <h2>Successful tool sessions</h2>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Tool</th><th>Sessions</th></tr></thead>
                    <tbody>
                        @forelse ($topTools as $tool)
                            <tr><td>{{ $tool->tool_slug }}</td><td>{{ number_format($tool->completed_runs) }}</td></tr>
                        @empty
                            <tr><td colspan="2" class="muted">No tool completion events yet. Connect the completion tracker after a successful tool run.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </article>
        <article class="card">
            <h2>Recent registrations</h2>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                    <tbody>
                        @forelse ($recentUsers as $user)
                            <tr><td>{{ $user->name }}</td><td>{{ $user->email }}</td><td>{{ $user->created_at->format('M j, Y') }}</td></tr>
                        @empty
                            <tr><td colspan="3" class="muted">No registered users yet.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </article>
    </section>
@endsection
