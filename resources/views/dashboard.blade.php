@extends('layouts.app', ['title' => 'Your dashboard'])

@section('content')
    <div class="member-dashboard">
        <aside class="dashboard-sidebar">
            <p class="dashboard-sidebar-label">Workspace</p>
            <nav aria-label="Dashboard navigation">
                <a class="dashboard-sidebar-link dashboard-sidebar-link--active" href="{{ route('dashboard') }}">Overview</a>
                <a class="dashboard-sidebar-link" href="{{ route('tools.index') }}">All tools</a>
                <a class="dashboard-sidebar-link" href="{{ route('home') }}#tool-finder">Popular tools</a>
                <a class="dashboard-sidebar-link" href="#recent-tools">Recently used</a>
                <a class="dashboard-sidebar-link" href="#account-settings">Settings</a>
            </nav>
            <p class="dashboard-sidebar-label">Categories</p>
            <nav aria-label="Tool categories">
                @foreach (config('tools.categories', []) as $slug => $category)
                    <a class="dashboard-sidebar-link" href="{{ route('tools.index') }}#category-{{ $slug }}">{{ $category['name'] }}</a>
                @endforeach
            </nav>
            <div class="dashboard-sidebar-note">
                <strong>Your private space</strong>
                <span>Only your signed-in tool activity is shown here.</span>
            </div>
        </aside>

        <div class="member-dashboard-main">
            <section class="dashboard-welcome">
                <div>
                    <div class="eyebrow">Your workspace</div>
                    <h1>Welcome back, {{ $user->name }}.</h1>
                    <p>Your tools and account activity, together in one private place.</p>
                </div>
                <div class="actions">
                    <a class="btn" href="{{ route('tools.index') }}">Explore tools <span aria-hidden="true">→</span></a>
                    <a class="btn secondary" href="{{ route('profile.edit') }}">Account settings</a>
                </div>
            </section>

            <section class="stats member-stats" aria-label="Your activity">
                <article class="card stat"><span>Tools you’ve used</span><strong>{{ number_format($toolsUsed) }}</strong></article>
                <article class="card stat"><span>Active days · all time</span><strong>{{ number_format($activeDays) }}</strong></article>
                <article class="card stat"><span>Active days · last 14 days</span><strong>{{ number_format($activeDaysThisFortnight) }}</strong></article>
                <article class="card stat"><span>Tool activity days · all time</span><strong>{{ number_format($toolDays) }}</strong></article>
            </section>

            <section class="grid member-content-grid">
                <article class="card" id="recent-tools">
                    <div class="actions member-card-heading">
                        <div>
                            <h2>Recently used</h2>
                            <p class="muted">Your latest tools, shown only to you.</p>
                        </div>
                        <a class="muted" href="{{ route('tools.index') }}">Browse all →</a>
                    </div>
                    @forelse ($recentTools as $tool)
                        <a class="member-recent-tool" href="{{ route('tools.show', ['tool' => $tool['slug']]) }}">
                            <span>
                                <strong>{{ $tool['name'] }}</strong>
                                <span class="muted">Last used {{ $tool['lastUsedAt']->format('M j, Y') }}</span>
                            </span>
                            <span class="muted">{{ number_format($tool['activeDays']) }} {{ \Illuminate\Support\Str::plural('day', $tool['activeDays']) }} →</span>
                        </a>
                    @empty
                        <div class="member-empty-state">
                            <p>Your tools will appear here after you use them while signed in.</p>
                            <a class="btn secondary" href="{{ route('tools.index') }}">Find a tool</a>
                        </div>
                    @endforelse
                </article>

                <article class="card" aria-labelledby="activity-days-title">
                    <h2 id="activity-days-title">Your activity</h2>
                    <p class="muted">Days you used the site while signed in · last 14 days.</p>
                    <div class="activity-days-grid">
                        @foreach ($activityDays as $day)
                            <div class="activity-day" title="{{ $day['label'] }}{{ $day['active'] ? ' · Active' : '' }}">
                                <span aria-label="{{ $day['label'] }}{{ $day['active'] ? ', active' : ', no activity recorded' }}" class="{{ $day['active'] ? 'activity-day-indicator is-active' : 'activity-day-indicator' }}"></span>
                                <span>{{ $day['label'] }}</span>
                            </div>
                        @endforeach
                    </div>
                    <div class="activity-legend"><span></span>Activity recorded</div>
                </article>
            </section>

            <section class="card member-account-card" id="account-settings">
                <div>
                    <h2>Account</h2>
                    <p class="muted">Signed in as {{ $user->email }}</p>
                </div>
                <div class="member-account-meta">
                    <span>Member since {{ $user->created_at->format('M Y') }}</span>
                    <a href="{{ route('profile.edit') }}">Manage account →</a>
                </div>
            </section>
        </div>
    </div>
@endsection
