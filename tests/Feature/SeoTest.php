<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Support\Seo\SiteSeo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

final class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_have_unique_metadata_canonicals_and_structured_data(): void
    {
        Queue::fake();

        $this->get(route('home').'?utm_source=test')
            ->assertOk()
            ->assertSee('<meta name="robots" content="index,follow">', false)
            ->assertSee('<link rel="canonical" href="'.config('seo.site_url').'/">', false)
            ->assertSee('"@type":"WebSite"', false)
            ->assertSee('"@type":"Organization"', false)
            ->assertSee('property="og:title"', false);

        $this->get(route('tools.index'))
            ->assertOk()
            ->assertSee('<meta name="description"', false)
            ->assertSee('"@type":"CollectionPage"', false)
            ->assertSee('"@type":"ItemList"', false)
            ->assertSee(route('tools.show', ['tool' => 'qr-code-generator']), false);

        $this->get(route('tools.show', ['tool' => 'qr-code-generator']))
            ->assertOk()
            ->assertSee('<title>QR Code Generator · ArEasySolution</title>', false)
            ->assertSee('"@type":"WebApplication"', false)
            ->assertSee('"isAccessibleForFree":true', false)
            ->assertSee('"@type":"BreadcrumbList"', false);

        $this->get(route('ads-txt.help'))
            ->assertOk()
            ->assertSee('<meta name="robots" content="index,follow">', false)
            ->assertSee('<title>AdSense ads.txt status help · ArEasySolution</title>', false)
            ->assertSee('"@type":"Article"', false)
            ->assertSee('Not applicable');
    }

    public function test_sitemap_lists_only_the_public_home_directory_and_tool_pages(): void
    {
        Queue::fake();

        $response = $this->get(route('sitemap'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee(config('seo.site_url').'/')
            ->assertSee(config('seo.site_url').'/tools')
            ->assertSee(config('seo.site_url').'/ads-txt-help')
            ->assertSee(config('seo.site_url').'/tools/qr-code-generator')
            ->assertDontSee('/admin')
            ->assertDontSee('/profile');

        $this->assertSame(count(config('tools.tools')) + 3, substr_count($response->getContent(), '<url>'));
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

    public function test_an_admin_can_manage_site_and_per_page_seo_settings(): void
    {
        Queue::fake();

        $this->get(route('home'))->assertOk();
        $this->get(route('admin.site-settings.edit'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())
            ->get(route('admin.site-settings.edit'))
            ->assertForbidden();

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)
            ->get(route('admin.site-settings.edit'))
            ->assertOk()
            ->assertSee('Site & SEO settings')
            ->assertSee('Page-by-page SEO')
            ->assertSee('pages[tool:qr-code-generator][title]', false);

        $settings = app(SiteSeo::class);
        $pages = collect($settings->editablePages())
            ->mapWithKeys(static fn (array $page): array => [
                $page['key'] => [
                    'title' => $page['title'],
                    'description' => $page['description'],
                    'robots' => $page['robots'],
                    'og_image' => '',
                ],
            ])
            ->all();
        $pages['home']['title'] = 'Custom Homepage Title';
        $pages['home']['description'] = 'A custom homepage search description.';
        $pages['home']['og_image'] = 'https://example.com/home-card.png';
        $pages['tool:qr-code-generator']['title'] = 'Custom QR SEO Title';
        $pages['tool:qr-code-generator']['robots'] = 'noindex,follow';

        $this->put(route('admin.site-settings.update'), [
            ...$settings->siteDefaults(),
            'site_name' => 'Example Tools',
            'site_url' => 'https://example.com/',
            'twitter_handle' => '@example',
            'google_site_verification' => 'google-token',
            'pages' => $pages,
        ])->assertRedirect(route('admin.site-settings.edit'))
            ->assertSessionHas('status', 'Site and SEO settings updated.');

        $this->get(route('home'))
            ->assertOk()
            ->assertSee('<title>Custom Homepage Title · Example Tools</title>', false)
            ->assertSee('<meta name="description" content="A custom homepage search description.">', false)
            ->assertSee('<meta property="og:image" content="https://example.com/home-card.png">', false)
            ->assertSee('<meta property="og:image:alt" content="Custom Homepage Title · Example Tools">', false)
            ->assertSee('<meta name="twitter:card" content="summary_large_image">', false)
            ->assertSee('<meta name="twitter:site" content="@example">', false)
            ->assertSee('<meta name="google-site-verification" content="google-token">', false)
            ->assertSee('Example Tools');

        $this->get(route('tools.show', ['tool' => 'qr-code-generator']))
            ->assertSee('<title>Custom QR SEO Title · Example Tools</title>', false)
            ->assertSee('<meta name="robots" content="noindex,follow">', false);

        $sitemap = $this->get(route('sitemap'))->assertOk();
        $sitemap->assertSee('https://example.com/')
            ->assertDontSee('https://example.com/tools/qr-code-generator');

        $this->get(route('robots'))
            ->assertOk()
            ->assertSee('Sitemap: https://example.com/sitemap.xml');
    }
}
