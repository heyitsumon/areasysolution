<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

final class ToolController extends Controller
{
    public function index(): View
    {
        $categories = config('tools.categories');
        $tools = collect(config('tools.tools'))
            ->map(fn (array $tool, string $slug): array => [...$tool, 'slug' => $slug])
            ->values();

        return view('tools.index', [
            'categories' => $categories,
            'tools' => $tools,
        ]);
    }

    public function show(string $tool): View
    {
        $catalogEntry = config("tools.tools.{$tool}");
        abort_unless(is_array($catalogEntry), 404);

        return view('tools.show', [
            'tool' => [...$catalogEntry, 'slug' => $tool],
            'limits' => config('tools.limits'),
        ]);
    }
}
