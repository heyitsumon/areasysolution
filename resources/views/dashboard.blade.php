@extends('layouts.app', ['title' => 'Your dashboard'])

@section('content')
    <section class="hero" style="max-width:none;padding-bottom:24px">
        <div class="eyebrow">Your space</div>
        <h1 style="font-size:clamp(36px,5vw,52px)">Welcome back, {{ $user->name }}.</h1>
        <p>Your tools and account activity, together in one private place.</p>
        <div class="actions" style="margin-top:20px">
            <a class="btn" href="{{ route('tools.index') }}">Explore tools <span aria-hidden="true">→</span></a>
            <a class="btn secondary" href="{{ route('profile.edit') }}">Account settings</a>
        </div>
    </section>

    <section class="stats" aria-label="Your activity">
        <article class="card stat">
            <span>Tools you’ve used</span>
            <strong>{{ number_format($toolsUsed) }}</strong>
        </article>
        <article class="card stat">
            <span>Active days · all time</span>
            <strong>{{ number_format($activeDays) }}</strong>
        </article>
        <article class="card stat">
            <span>Active days · last 14 days</span>
            <strong>{{ number_format($activeDaysThisFortnight) }}</strong>
        </article>
        <article class="card stat">
            <span>Tool activity days · all time</span>
            <strong>{{ number_format($toolDays) }}</strong>
        </article>
    </section>

    <section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));margin:20px 0">
        <article class="card">
            <div class="actions" style="justify-content:space-between;margin-bottom:18px">
                <div>
                    <h2>Recent tools</h2>
                    <p class="muted" style="margin:0">Your latest tools, shown only to you.</p>
                </div>
                <a class="muted" href="{{ route('tools.index') }}">Browse all →</a>
            </div>
            @forelse ($recentTools as $tool)
                <a href="{{ route('tools.show', ['tool' => $tool['slug']]) }}"
                   style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid #edf0f5">
                    <span>
                        <strong style="display:block;font-size:14px">{{ $tool['name'] }}</strong>
                        <span class="muted">Last used {{ $tool['lastUsedAt']->format('M j, Y') }}</span>
                    </span>
                    <span class="muted">{{ number_format($tool['activeDays']) }} {{ \Illuminate\Support\Str::plural('day', $tool['activeDays']) }} →</span>
                </a>
            @empty
                <div style="border:1px dashed #dce2ec;border-radius:12px;padding:24px;text-align:center">
                    <p style="margin:0 0 12px">Your tools will appear here after you use them while signed in.</p>
                    <a class="btn secondary" href="{{ route('tools.index') }}">Find a tool</a>
                </div>
            @endforelse
        </article>

        <article class="card">
            <h2>Last 14 days</h2>
            <p class="muted" style="margin:0 0 22px">Days you used the site while signed in.</p>
            <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px 8px">
                @foreach ($activityDays as $day)
                    <div style="text-align:center" title="{{ $day['label'] }}{{ $day['active'] ? ' · Active' : '' }}">
                        <span aria-label="{{ $day['label'] }}{{ $day['active'] ? ', active' : ', no activity recorded' }}"
                              style="display:block;width:24px;height:24px;margin:0 auto 6px;border-radius:8px;background:{{ $day['active'] ? '#5364df' : '#edf0f5' }};box-shadow:{{ $day['active'] ? '0 3px 9px #5364df35' : 'none' }}"></span>
                        <span class="muted" style="font-size:10px">{{ $day['label'] }}</span>
                    </div>
                @endforeach
            </div>
            <div style="display:flex;align-items:center;gap:7px;margin-top:22px">
                <span style="width:10px;height:10px;border-radius:3px;background:#5364df"></span>
                <span class="muted">Activity recorded</span>
            </div>
        </article>
    </section>

    <section class="card" style="margin:20px 0">
        <div class="actions" style="justify-content:space-between">
            <div>
                <h2>Account</h2>
                <p class="muted" style="margin:0">Signed in as {{ $user->email }}</p>
            </div>
            <span class="muted">Member since {{ $user->created_at->format('M Y') }}</span>
        </div>
    </section>
@endsection
