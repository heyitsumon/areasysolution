<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

final class SeoTest extends TestCase
{
    public function test_public_pages_have_unique_metadata_canonicals_and_structured_data(): void
    {
        Queue::fake();

        $this->get(route('home').'?utm_source=test')
            ->assertOk()
            ->assertSee('<meta name="robots" content="index,follow">', false)
            ->assertSee('<link rel="canonical" href="'.config('seo.site_url').'/">', false)
            ->assertSee('"@type":"WebSite"', false)
            ->assertSee('property="og:title"', false);

        $this->get(route('tools.index'))
            ->assertOk()
            ->assertSee('<meta name="description"', false)
            ->assertSee('"@type":"CollectionPage"', false);

        $this->get(route('tools.show', ['tool' => 'qr-code-generator']))
            ->assertOk()
            ->assertSee('<title>QR Code Generator · MyTools</title>', false)
            ->assertSee('"@type":"WebApplication"', false)
            ->assertSee('"@type":"BreadcrumbList"', false);
    }

    public function test_sitemap_lists_only_the_public_home_directory_and_tool_pages(): void
    {
        Queue::fake();

        $response = $this->get(route('sitemap'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee(config('seo.site_url').'/')
            ->assertSee(config('seo.site_url').'/tools')
            ->assertSee(config('seo.site_url').'/tools/qr-code-generator')
            ->assertDontSee('/admin')
            ->assertDontSee('/profile');

        $this->assertSame(count(config('tools.tools')) + 2, substr_count($response->getContent(), '<url>'));
    }

    public function test_robots_exposes_sitemap_and_excludes_private_areas(): void
    {
        $this->get(route('robots'))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('User-agent: *')
            ->assertSee('Disallow: /admin')
            ->assertSee('Disallow: /profile')
            ->assertSee('Sitemap: '.config('seo.site_url').'/sitemap.xml');
    }

    public function test_account_and_admin_pages_are_marked_noindex(): void
    {
        Queue::fake();

        $this->get(route('login'))
            ->assertOk()
            ->assertSee('<meta name="robots" content="noindex,follow">', false);
    }
}
