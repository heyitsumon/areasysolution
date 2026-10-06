@extends('layouts.app', [
    'title' => 'Free Online Tools',
    'description' => 'Browse free browser-based tools for PDFs, images, text and development. Find converters, generators and file utilities in one place.',
    'canonicalPath' => route('tools.index', absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@type' => 'CollectionPage',
        'name' => app(\App\Support\Seo\SiteSeo::class)->pageTitle('tools-index', 'Free Online Tools'),
        'description' => app(\App\Support\Seo\SiteSeo::class)->pageDescription('tools-index', 'Browser-based PDF, image, text and developer utilities.'),
        'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('tools.index', absolute: false),
    ],
])

@section('content')
    <section class="hero">
        <div class="eyebrow">{{ $tools->count() }} free browser tools</div>
        <h1>Find the right tool for the job.</h1>
        <p>Choose a utility below. Client-side tools process files on your device instead of uploading them to the server.</p>
    </section>
    <section data-directory>
        <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <label class="sr-only" for="tool-search">Search tools</label>
            <input id="tool-search" data-directory-input class="field-input flex-1" type="search" placeholder="Search tools…" autocomplete="off">
            <button type="button" data-directory-reset class="btn-secondary">Reset filters</button>
        </div>
        <div class="mt-5 flex flex-wrap gap-2" aria-label="Filter by category">
            @foreach ($categories as $slug => $category)
                <button type="button" data-directory-category="{{ $slug }}" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">{{ $category['name'] }}</button>
            @endforeach
        </div>
        <p class="mt-4 text-sm text-slate-500" data-directory-count>{{ $tools->count() }} tools</p>
        @foreach ($categories as $categorySlug => $category)
            <section class="mt-8" data-directory-group="{{ $categorySlug }}">
                <div class="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold tracking-tight text-slate-900">{{ $category['name'] }}</h2>
                        <p class="mt-1 text-sm text-slate-500">{{ $category['description'] }}</p>
                    </div>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($tools->where('category', $categorySlug) as $tool)
                        <a href="{{ route('tools.show', $tool['slug']) }}"
                           data-tool-item
                           data-search="{{ strtolower($tool['name'].' '.$tool['description'].' '.$category['name']) }}"
                           class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                            <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600">{{ $category['name'] }}</span>
                            <h3 class="mt-2 text-lg font-bold text-slate-900 group-hover:text-indigo-700">{{ $tool['name'] }}</h3>
                            <p class="mt-2 text-sm leading-6 text-slate-600">{{ $tool['description'] }}</p>
                            <span class="mt-4 inline-block text-sm font-semibold text-indigo-700">Open tool →</span>
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
