<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_homepage_introduces_the_tool_library_and_links_featured_tools(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Everyday tasks.')
            ->assertSee('Privacy comes first')
            ->assertSee('No account roadblock')
            ->assertSee(route('tools.show', ['tool' => 'image-compressor']), false)
            ->assertSee(route('tools.show', ['tool' => 'qr-code-generator']), false)
            ->assertSee('Browse all '.count(config('tools.tools')).' tools');
    }
}
