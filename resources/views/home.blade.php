@extends('layouts.app', [
    'title' => 'Free Online Tools for PDF, Images and Text',
    'description' => 'Use free online PDF, image, text and developer tools. Process files in your browser without uploading them.',
    'canonicalPath' => route('home', absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@type' => 'WebSite',
        'name' => config('tools.site.name'),
        'url' => rtrim(config('seo.site_url'), '/').route('home', absolute: false),
    ],
])

@section('content')
    <section class="hero">
        <div class="eyebrow">Your everyday tools workspace</div>
        <h1>Useful tools, with a better experience.</h1>
        <p>Use privacy-minded browser tools for PDFs, images, text and developer tasks. Create an account to manage your profile; administrators can review usage trends.</p>
        <div class="actions">
            @auth
                <a class="btn" href="{{ route('profile.edit') }}">View your profile</a>
            @else
                <a class="btn" href="{{ route('auth.register') }}">Create your free account</a>
                <a class="btn secondary" href="{{ route('login') }}">Sign in</a>
            @endauth
            <a class="btn ghost" href="{{ route('tools.index') }}">Explore tools</a>
        </div>
    </section>
    <section class="grid" aria-label="Platform features">
        <article class="card">
            <div class="eyebrow">01 · Account</div>
            <h2>Your own profile</h2>
            <p>Register securely, update your details, and change your password from one place.</p>
        </article>
        <article class="card">
            <div class="eyebrow">02 · Insights</div>
            <h2>Useful activity metrics</h2>
            <p>Admins can compare page hits, active accounts, and completed tool runs by day, week, or month.</p>
        </article>
        <article class="card">
            <div class="eyebrow">03 · Privacy</div>
            <h2>Aggregated analytics</h2>
            <p>Page metrics use route names rather than raw URLs, so query strings and their possible private values are not stored.</p>
        </article>
    </section>
@endsection
