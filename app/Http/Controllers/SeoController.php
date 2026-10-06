<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Seo\SiteSeo;
use Illuminate\Http\Response;

final class SeoController extends Controller
{
    public function sitemap(SiteSeo $seo): Response
    {
        $urls = collect($seo->editablePages())
            ->filter(static fn (array $page): bool => $page['robots'] === 'index,follow')
            ->map(fn (array $page): string => $seo->resolvePage(
                $page['key'],
                $page['title'],
                $page['description'],
                $page['path'],
                'index,follow',
            )['canonical'])
            ->values()
            ->all();

        return response()
            ->view('seo.sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(SiteSeo $seo): Response
    {
        return response(
            implode("\n", [
                'User-agent: *',
                'Allow: /',
                'Disallow: /admin',
                'Disallow: /profile',
                'Sitemap: '.$seo->siteUrl().route('sitemap', absolute: false),
                '',
            ]),
            200,
            ['Content-Type' => 'text/plain; charset=UTF-8']
        );
    }
}
