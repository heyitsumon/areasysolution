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
            ->assertSee('A simpler, more thoughtful toolkit.')
            ->assertSee('Privacy is part of the experience')
            ->assertSee('Start without signing up')
            ->assertSee(route('tools.show', ['tool' => 'image-compressor']), false)
            ->assertSee(route('tools.show', ['tool' => 'qr-code-generator']), false)
            ->assertSee(route('tools.index'), false);
    }
}
