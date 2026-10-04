<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Response;

final class SeoController extends Controller
{
    public function sitemap(): Response
    {
        $siteUrl = (string) config('seo.site_url');
        $paths = [
            route('home', absolute: false),
            route('tools.index', absolute: false),
            ...collect(config('tools.tools'))
                ->keys()
                ->map(fn (string $slug): string => route('tools.show', ['tool' => $slug], absolute: false))
                ->all(),
        ];

        return response()
            ->view('seo.sitemap', [
                'urls' => array_map(fn (string $path): string => $siteUrl.$path, $paths),
            ])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(): Response
    {
        return response(
            implode("\n", [
                'User-agent: *',
                'Allow: /',
                'Disallow: /admin',
                'Disallow: /profile',
                'Sitemap: '.rtrim((string) config('seo.site_url'), '/').route('sitemap', absolute: false),
                '',
            ]),
            200,
            ['Content-Type' => 'text/plain; charset=UTF-8']
        );
    }
}
