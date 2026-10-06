@extends('layouts.app', [
    'title' => $tool['name'],
    'description' => 'Use '.$tool['name'].' online for free. '.$tool['description'].' Processing runs in your browser.',
    'canonicalPath' => route('tools.show', ['tool' => $tool['slug']], absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'WebApplication',
                'name' => app(\App\Support\Seo\SiteSeo::class)->pageTitle('tool:'.$tool['slug'], $tool['name']),
                'description' => app(\App\Support\Seo\SiteSeo::class)->pageDescription('tool:'.$tool['slug'], 'Use '.$tool['name'].' online for free. '.$tool['description'].' Processing runs in your browser.'),
                'applicationCategory' => 'UtilitiesApplication',
                'operatingSystem' => 'Any',
                'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.show', ['tool' => $tool['slug']], absolute: false),
            ],
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Home',
                        'item' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('home', absolute: false),
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => 'Tools',
                        'item' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.index', absolute: false),
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 3,
                        'name' => $tool['name'],
                        'item' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.show', ['tool' => $tool['slug']], absolute: false),
                    ],
                ],
            ],
        ],
    ],
])

@section('content')
    <nav class="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <a class="hover:text-indigo-700" href="{{ route('tools.index') }}">Tools</a>
        <span aria-hidden="true"> / </span>
        <span class="text-slate-800">{{ $tool['name'] }}</span>
    </nav>
    <section class="mb-6">
        <div class="eyebrow">{{ config('tools.categories.'.$tool['category'].'.name') }}</div>
        <h1 class="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">{{ $tool['name'] }}</h1>
        <p class="mt-3 max-w-2xl text-slate-600">{{ $tool['description'] }}</p>
    </section>
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div id="tool-app"
             data-tool="{{ $tool['slug'] }}"
             data-tool-name="{{ $tool['name'] }}"
             data-accepts="{{ implode(',', $tool['accepts']) }}"
             data-multiple="{{ $tool['multiple'] ? '1' : '0' }}"
             data-max-bytes="{{ $limits['max_total_megabytes'] * 1024 * 1024 }}"
             data-max-total-bytes="{{ $limits['max_total_megabytes'] * 1024 * 1024 }}"
             data-max-files="{{ $limits['max_files_per_run'] }}"
             data-engine="client"
             class="min-h-36">
            @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
                <div class="animate-pulse rounded-xl bg-slate-100 p-6 text-sm text-slate-500">Loading tool…</div>
            @else
                <div class="asset-warning" role="alert">
                    The tool interface is unavailable because its production assets are missing. Run <code>npm run build</code>
                    and upload the complete <code>public/build</code> directory to your server.
                </div>
            @endif
        </div>
        <p id="tool-status" class="sr-only" aria-live="polite"></p>
    </section>
    <p class="mt-4 text-xs text-slate-500">This tool runs in your browser. Files are not sent to our servers.</p>
@endsection
