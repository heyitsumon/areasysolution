@extends('layouts.app', [
    'title' => 'Free Online Tools',
    'description' => 'Browse free browser-based tools for PDFs, images, text and development. Find converters, generators and file utilities in one place.',
    'canonicalPath' => route('tools.index', absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@type' => 'CollectionPage',
        '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.index', absolute: false).'#collection',
        'name' => app(\App\Support\Seo\SiteSeo::class)->pageTitle('tools-index', 'Free Online Tools'),
        'description' => app(\App\Support\Seo\SiteSeo::class)->pageDescription('tools-index', 'Browser-based PDF, image, text and developer utilities.'),
        'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.index', absolute: false),
        'isPartOf' => [
            '@type' => 'WebSite',
            '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().'#website',
        ],
        'breadcrumb' => [
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
            ],
        ],
        'mainEntity' => [
            '@type' => 'ItemList',
            'numberOfItems' => count(config('tools.tools', [])),
            'itemListElement' => collect(config('tools.tools', []))
                ->map(fn (array $tool, string $slug): array => ['slug' => $slug, ...$tool])
                ->values()
                ->map(fn (array $tool, int $index): array => [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'name' => $tool['name'],
                    'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.show', ['tool' => $tool['slug']], absolute: false),
                ])
                ->all(),
        ],
    ],
])

@section('content')
    <section class="hero">
        <div class="eyebrow">{{ $tools->count() }} free browser tools</div>
        <h1>Find a tool. Get it done.</h1>
        <p>Search by name, task, or category. Many file tools process data directly in your browser, without uploading it to our servers.</p>
    </section>
    <section data-directory>
        <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <label class="sr-only" for="tool-search">Search tools</label>
            <input id="tool-search" data-directory-input class="field-input flex-1" type="search" placeholder="Search tools by name, task, or keyword…" autocomplete="off">
            <button type="button" data-directory-reset class="btn-secondary">Reset filters</button>
        </div>
        <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            @foreach ($categories as $slug => $category)
                <button type="button" data-directory-category="{{ $slug }}" aria-pressed="false" class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"><x-category-icon :category="$slug" size="sm" />{{ $category['name'] }}</button>
            @endforeach
        </div>
        <p class="mt-4 text-sm text-slate-500" data-directory-count role="status" aria-live="polite">{{ $tools->count() }} tools</p>
        @foreach ($categories as $categorySlug => $category)
            <section class="mt-8 scroll-mt-24" id="category-{{ $categorySlug }}" data-directory-group="{{ $categorySlug }}">
                <div class="mb-4 flex items-center gap-3">
                    <x-category-icon :category="$categorySlug" size="lg" />
                    <div>
                        <h2 class="text-xl font-bold tracking-tight text-slate-900">{{ $category['name'] }}</h2>
                        <p class="mt-1 text-sm text-slate-500">{{ $category['description'] }} <span class="text-slate-400">· {{ $tools->where('category', $categorySlug)->count() }} tools</span></p>
                    </div>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($tools->where('category', $categorySlug) as $tool)
                        <a href="{{ route('tools.show', $tool['slug']) }}"
                           data-tool-item
                           data-search="{{ strtolower($tool['name'].' '.$tool['description'].' '.$category['name']) }}"
                           class="group flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
                            <span class="flex items-center justify-between">
                                <x-category-icon :category="$categorySlug" size="md" />
                                <span class="text-xl text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" aria-hidden="true">↗</span>
                            </span>
                            <span class="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ $category['name'] }}</span>
                            <h3 class="mt-1 text-lg font-bold text-slate-900 group-hover:text-indigo-700">{{ $tool['name'] }}</h3>
                            <p class="mt-2 flex-1 text-sm leading-6 text-slate-600">{{ $tool['description'] }}</p>
                        </a>
                    @endforeach
                </div>
            </section>
        @endforeach
        <div class="mt-10 hidden rounded-xl border border-slate-200 bg-white p-8 text-center" data-directory-empty>
            <h2 class="text-lg font-bold text-slate-900">No matching tools</h2>
            <p class="mt-2 text-sm text-slate-500">Try a different search or reset the filters.</p>
        </div>
    </section>
@endsection
