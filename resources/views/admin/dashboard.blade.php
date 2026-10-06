@extends('layouts.app', ['title' => 'Admin analytics'])

@section('content')
    <div data-admin-analytics
         data-endpoint="{{ route('admin.analytics.data', ['period' => $period]) }}"
         data-period="{{ $period }}">
    <div class="actions" style="justify-content:space-between">
        <div>
            <div class="eyebrow">Admin panel</div>
            <h1 style="font-size:42px">Analytics overview</h1>
        </div>
        <div class="actions">
            <a class="btn secondary" href="{{ route('admin.site-settings.edit') }}">Site &amp; SEO settings</a>
            <nav class="periods" aria-label="Analytics date range">
                @foreach (['today' => 'Day', 'week' => 'Week', 'month' => 'Month'] as $value => $label)
                    <a class="{{ $period === $value ? 'active' : '' }}" href="{{ route('admin.dashboard', ['period' => $value]) }}">{{ $label }}</a>
                @endforeach
            </nav>
        </div>
    </div>
    <div class="analytics-livebar">
        <span class="analytics-live-indicator" aria-hidden="true"></span>
        <span>Live dashboard</span>
        <span class="analytics-refresh-status" data-refresh-status role="status" aria-live="polite">Connecting to analytics…</span>
        <button class="analytics-refresh-button" type="button" data-refresh-now>Refresh now</button>
    </div>
    <p class="muted">Data refreshes every 30 seconds. New events appear after the analytics queue worker processes them.</p>
    <section class="stats" aria-label="Summary metrics">
        <article class="card stat online-stat">
            <span>Visitors online · last 5 minutes</span>
            <strong data-metric="onlineStats.visitors">{{ number_format($onlineStats['visitors']) }}</strong>
            <small>Includes guests and signed-in visitors</small>
        </article>
        <article class="card stat online-stat">
            <span>Members online · last 5 minutes</span>
            <strong data-metric="onlineStats.members">{{ number_format($onlineStats['members']) }}</strong>
            <small>Unique signed-in accounts</small>
        </article>
        <article class="card stat"><span>Website page views · today</span><strong data-metric="pageViews.today">{{ number_format($pageViews['today']) }}</strong></article>
        <article class="card stat"><span>Website page views · this week</span><strong data-metric="pageViews.week">{{ number_format($pageViews['week']) }}</strong></article>
        <article class="card stat"><span>Website page views · this month</span><strong data-metric="pageViews.month">{{ number_format($pageViews['month']) }}</strong></article>
        <article class="card stat"><span>New accounts · selected range</span><strong data-metric="newUsers">{{ number_format($newUsers) }}</strong></article>
        <article class="card stat"><span>Active members · selected range</span><strong data-metric="activeUsers">{{ number_format($activeUsers) }}</strong></article>
        <article class="card stat"><span>Successful tool sessions · selected range</span><strong data-metric="completedRuns">{{ number_format($completedRuns) }}</strong></article>
        <article class="card stat"><span>Members completing a tool · selected range</span><strong data-metric="completedUsers">{{ number_format($completedUsers) }}</strong></article>
        <article class="card stat"><span>All registered accounts</span><strong data-metric="totalUsers">{{ number_format($totalUsers) }}</strong></article>
    </section>

    <section class="analytics-grid" aria-label="Analytics charts">
        <article class="card analytics-card analytics-trend-card">
            <div class="analytics-card-heading">
                <div><h2>Traffic &amp; tool activity</h2><p class="muted">Daily trends over the last 14 days</p></div>
                <span class="analytics-range-badge">14 days</span>
            </div>
            <div class="analytics-chart analytics-chart-tall">
                <canvas data-chart="activity" role="img" aria-label="Line chart showing daily page views and completed tool sessions over the last 14 days"></canvas>
            </div>
        </article>
        <article class="card analytics-card">
            <div class="analytics-card-heading">
                <div><h2>Most visited pages</h2><p class="muted">Top routes · selected period</p></div>
            </div>
            <div class="analytics-chart">
                <canvas data-chart="routes" role="img" aria-label="Bar chart ranking the most visited website pages"></canvas>
            </div>
            <p class="analytics-empty" data-empty="routes" hidden>No page-view data for this period yet.</p>
        </article>
        <article class="card analytics-card">
            <div class="analytics-card-heading">
                <div><h2>Top tools</h2><p class="muted">Successful sessions · selected period</p></div>
            </div>
            <div class="analytics-chart">
                <canvas data-chart="tools" role="img" aria-label="Bar chart ranking tools by successful sessions"></canvas>
            </div>
            <p class="analytics-empty" data-empty="tools" hidden>No tool completion events for this period yet.</p>
        </article>
    </section>

    <section class="grid" style="margin:20px 0">
        <article class="card">
            <h2>Recent registrations</h2>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                    <tbody data-recent-users>
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
    </div>
@endsection
