@php
    $seoContent = app(\App\Support\Seo\ToolSeoContent::class)->forTool($tool['slug'], $tool);
    $categoryName = config('tools.categories.'.$tool['category'].'.name', 'Tools');
    $relatedTools = collect(config('tools.tools', []))
        ->filter(fn ($t, $s) => ($t['category'] ?? '') === $tool['category'] && $s !== $tool['slug'])
        ->map(fn ($t, $s) => [...$t, 'slug' => $s])
        ->take(4);
@endphp

@extends('layouts.app', [
    'title' => $tool['name'],
    'description' => $tool['description'],
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
                'isAccessibleForFree' => true,
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
            [
                '@type' => 'FAQPage',
                'mainEntity' => array_map(static fn (array $faq): array => [
                    '@type' => 'Question',
                    'name' => $faq['q'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => $faq['a'],
                    ],
                ], $seoContent['faqs']),
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
        <div class="eyebrow">{{ $categoryName }}</div>
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

    <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5">
            <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            100% Client-side. Your data never touches our servers.
        </span>
        <span>Free online utility</span>
    </div>

    {{-- SEO: How To Guide --}}
    <section class="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="how-to-heading">
        <h2 id="how-to-heading" class="text-2xl font-bold tracking-tight text-slate-900">How to use {{ $tool['name'] }}</h2>
        <p class="mt-2 text-sm text-slate-600">Follow these simple steps to use this free tool quickly and easily:</p>
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @foreach ($seoContent['how_to'] as $step)
                <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                        {{ $step['step'] }}
                    </div>
                    <h3 class="mt-3 text-base font-semibold text-slate-900">{{ $step['title'] }}</h3>
                    <p class="mt-1.5 text-xs leading-5 text-slate-600">{{ $step['text'] }}</p>
                </div>
            @endforeach
        </div>
    </section>

    {{-- SEO: Key Features & Benefits --}}
    <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="features-heading">
        <h2 id="features-heading" class="text-2xl font-bold tracking-tight text-slate-900">Why use our {{ $tool['name'] }}?</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            @foreach ($seoContent['features'] as $feature)
                <div class="flex gap-3 rounded-xl border border-slate-100 p-4">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900">{{ $feature['title'] }}</h3>
                        <p class="mt-1 text-xs leading-5 text-slate-600">{{ $feature['text'] }}</p>
                    </div>
                </div>
            @endforeach
        </div>
    </section>

    {{-- SEO: Frequently Asked Questions --}}
    <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="faq-heading">
        <h2 id="faq-heading" class="text-2xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
        <div class="mt-6 space-y-3">
            @foreach ($seoContent['faqs'] as $faq)
                <details class="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition open:bg-white open:shadow-xs">
                    <summary class="flex cursor-pointer items-center justify-between font-semibold text-slate-900 select-none">
                        <span>{{ $faq['q'] }}</span>
                        <span class="ml-2 text-indigo-600 transition group-open:rotate-180">↓</span>
                    </summary>
                    <p class="mt-3 text-sm leading-6 text-slate-600">{{ $faq['a'] }}</p>
                </details>
            @endforeach
        </div>
    </section>

    {{-- Related Tools --}}
    @if ($relatedTools->isNotEmpty())
        <section class="mt-8" aria-labelledby="related-heading">
            <h2 id="related-heading" class="text-xl font-bold tracking-tight text-slate-900">More {{ $categoryName }}</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                @foreach ($relatedTools as $related)
                    <a href="{{ route('tools.show', $related['slug']) }}" class="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                        <h3 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600">{{ $related['name'] }}</h3>
                        <p class="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">{{ $related['description'] }}</p>
                        <span class="mt-3 inline-block text-xs font-semibold text-indigo-600">Open tool →</span>
                    </a>
                @endforeach
            </div>
        </section>
    @endif
@endsection
