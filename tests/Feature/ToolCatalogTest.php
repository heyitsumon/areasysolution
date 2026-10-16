<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The catalog in config/tools.php is the single source of truth for the site:
 * it drives the directory, the tool pages, the sitemap and the JS loader.
 * These assertions keep the three halves of that contract - config, module and
 * category - from drifting apart as the catalog grows.
 */
final class ToolCatalogTest extends TestCase
{
    public function test_every_catalogued_tool_has_a_javascript_module(): void
    {
        foreach (config('tools.tools') as $slug => $tool) {
            $module = file_exists(resource_path("js/tools/{$slug}.js"))
                || file_exists(resource_path("js/tools/{$slug}/controller.js"));

            $this->assertTrue(
                $module,
                "Tool [{$slug}] is listed in config/tools.php but has no module at resources/js/tools/{$slug}.js",
            );
        }
    }

    public function test_every_tool_belongs_to_a_declared_category(): void
    {
        $categories = config('tools.categories');

        foreach (config('tools.tools') as $slug => $tool) {
            $this->assertArrayHasKey(
                $tool['category'],
                $categories,
                "Tool [{$slug}] references an undeclared category [{$tool['category']}].",
            );
        }
    }

    public function test_every_category_contains_at_least_one_tool(): void
    {
        $used = array_unique(array_column(config('tools.tools'), 'category'));

        foreach (config('tools.categories') as $slug => $category) {
            $this->assertContains($slug, $used, "Category [{$slug}] has no tools assigned to it.");
        }
    }

    public function test_tool_slugs_match_the_route_constraint(): void
    {
        foreach (array_keys(config('tools.tools')) as $slug) {
            $this->assertMatchesRegularExpression('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug);
        }
    }

    public function test_every_tool_has_search_ready_copy_and_file_metadata(): void
    {
        foreach (config('tools.tools') as $slug => $tool) {
            $this->assertNotEmpty($tool['name'], "Tool [{$slug}] is missing a name.");
            $this->assertNotEmpty($tool['description'], "Tool [{$slug}] is missing a description.");
            $this->assertLessThanOrEqual(165, strlen($tool['description']), "Tool [{$slug}] description is too long for a meta description.");
            $this->assertIsArray($tool['accepts']);
            $this->assertIsBool($tool['multiple']);
        }
    }
}
