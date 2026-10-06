<?php

declare(strict_types=1);

namespace App\Support\Seo;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class SiteSeo
{
    private const SITE_CACHE_KEY = 'site-seo:settings';

    private const PAGES_CACHE_KEY = 'site-seo:pages';

    /**
     * @return array<string, mixed>
     */
    public function site(): array
    {
        return Cache::remember(self::SITE_CACHE_KEY, now()->addMinutes(10), function (): array {
            $stored = DB::table('site_settings')->where('id', 1)->first();

            return array_replace($this->defaultSiteSettings(), $stored === null ? [] : (array) $stored);
        });
    }

    /**
     * @return array<string, string>
     */
    public function siteDefaults(): array
    {
        return $this->defaultSiteSettings();
    }

    public function siteUrl(): string
    {
        return rtrim((string) $this->site()['site_url'], '/');
    }

    public function pageTitle(string $pageKey, string $fallback): string
    {
        $title = trim((string) ($this->pageOverrides()[$pageKey]['title'] ?? ''));

        return $title !== '' ? $title : $fallback;
    }

    public function pageDescription(string $pageKey, string $fallback): string
    {
        $description = trim((string) ($this->pageOverrides()[$pageKey]['description'] ?? ''));

        return $description !== '' ? $description : $fallback;
    }

    /**
     * @return array<string, array<string, string|null>>
     */
    public function pageOverrides(): array
    {
        return Cache::remember(self::PAGES_CACHE_KEY, now()->addMinutes(10), function (): array {
            return DB::table('page_seo_settings')
                ->get()
                ->keyBy('page_key')
                ->map(static fn (object $page): array => [
                    'title' => $page->title,
                    'description' => $page->description,
                    'robots' => $page->robots,
                    'og_image' => $page->og_image,
                ])
                ->all();
        });
    }

    /**
     * @return array<string, string>
     */
    public function resolvePage(
        string $pageKey,
        ?string $fallbackTitle,
        ?string $fallbackDescription,
        ?string $canonicalPath,
        string $fallbackRobots = 'noindex,follow',
    ): array {
        $site = $this->site();
        $page = $this->pageOverrides()[$pageKey] ?? [];
        $title = trim((string) ($page['title'] ?? ''));
        $description = trim((string) ($page['description'] ?? ''));
        $ogImage = trim((string) ($page['og_image'] ?? ''));
        $path = $canonicalPath ?? request()->getPathInfo();

        return [
            'title' => $title !== '' ? $title : (trim((string) $fallbackTitle) ?: $site['default_title']),
            'description' => $description !== '' ? $description : (trim((string) $fallbackDescription) ?: $site['default_description']),
            'robots' => $page['robots'] ?? $fallbackRobots,
            'canonical' => $this->siteUrl().'/'.ltrim($path, '/'),
            'og_image' => $ogImage !== '' ? $ogImage : (string) ($site['og_image'] ?? ''),
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, path: string, title: string, description: string, robots: string, og_image: string}>
     */
    public function editablePages(): array
    {
        $pages = [
            [
                'key' => 'home',
                'label' => 'Homepage',
                'path' => route('home', absolute: false),
                'title' => 'Free Online Tools for PDF, Images and Text',
                'description' => 'Use free online PDF, image, text and developer tools. Process files in your browser without uploading them.',
            ],
            [
                'key' => 'tools-index',
                'label' => 'Tools directory',
                'path' => route('tools.index', absolute: false),
                'title' => 'Free Online Tools',
                'description' => 'Browse free browser-based tools for PDFs, images, text and development. Find converters, generators and file utilities in one place.',
            ],
        ];

        foreach ((array) config('tools.tools', []) as $slug => $tool) {
            $pages[] = [
                'key' => 'tool:'.$slug,
                'label' => (string) $tool['name'],
                'path' => route('tools.show', ['tool' => $slug], absolute: false),
                'title' => (string) $tool['name'],
                'description' => 'Use '.$tool['name'].' online for free. '.$tool['description'].' Processing runs in your browser.',
            ];
        }

        $overrides = $this->pageOverrides();

        return array_map(static function (array $page) use ($overrides): array {
            $saved = $overrides[$page['key']] ?? [];

            return [
                ...$page,
                'title' => $saved['title'] ?? $page['title'],
                'description' => $saved['description'] ?? $page['description'],
                'robots' => $saved['robots'] ?? 'index,follow',
                'og_image' => $saved['og_image'] ?? '',
            ];
        }, $pages);
    }

    /**
     * @param  array<string, mixed>  $site
     * @param  array<string, array<string, string>>  $pages
     */
    public function save(array $site, array $pages): void
    {
        $now = now();

        DB::transaction(function () use ($site, $pages, $now): void {
            $existing = DB::table('site_settings')->where('id', 1)->first();

            DB::table('site_settings')->updateOrInsert(
                ['id' => 1],
                [
                    ...$site,
                    'created_at' => $existing?->created_at ?? $now,
                    'updated_at' => $now,
                ],
            );

            $rows = [];

            foreach ($pages as $key => $page) {
                $rows[] = [
                    'page_key' => $key,
                    ...$page,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('page_seo_settings')->upsert(
                $rows,
                ['page_key'],
                ['title', 'description', 'robots', 'og_image', 'updated_at'],
            );
        });

        Cache::forget(self::SITE_CACHE_KEY);
        Cache::forget(self::PAGES_CACHE_KEY);
        Cache::put(
            'site-seo:page-cache-version',
            (int) Cache::get('site-seo:page-cache-version', 0) + 1,
            now()->addYears(10),
        );
    }

    /**
     * @return array<string, string>
     */
    private function defaultSiteSettings(): array
    {
        return [
            'site_name' => (string) config('tools.site.name', 'MyTools'),
            'tagline' => (string) config('tools.site.tagline', 'Free online tools that respect your privacy'),
            'site_url' => (string) config('seo.site_url'),
            'default_title' => (string) config('seo.default_title', 'Free Online Tools'),
            'default_description' => (string) config('seo.default_description', 'Free online tools for PDFs, images, text and developers.'),
            'og_image' => '',
            'twitter_handle' => '',
            'google_site_verification' => '',
            'bing_site_verification' => '',
        ];
    }
}
