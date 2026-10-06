<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Seo\SiteSeo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

final class SiteSettingsController extends Controller
{
    public function edit(SiteSeo $seo): View
    {
        return view('admin.site-settings', [
            'settings' => $seo->site(),
            'pages' => $seo->editablePages(),
        ]);
    }

    public function update(Request $request, SiteSeo $seo): RedirectResponse
    {
        $rules = [
            'site_name' => ['required', 'string', 'max:100'],
            'tagline' => ['required', 'string', 'max:180'],
            'site_url' => ['required', 'url:http,https', 'max:255'],
            'default_title' => ['required', 'string', 'max:120'],
            'default_description' => ['required', 'string', 'max:320'],
            'og_image' => ['nullable', 'url:http,https', 'max:2048'],
            'twitter_handle' => ['nullable', 'regex:/\A@?[A-Za-z0-9_]{1,15}\z/'],
            'google_site_verification' => ['nullable', 'string', 'max:255'],
            'bing_site_verification' => ['nullable', 'string', 'max:255'],
            'pages' => ['required', 'array'],
        ];

        $knownPages = [];

        foreach ($seo->editablePages() as $page) {
            $key = $page['key'];
            $knownPages[] = $key;
            $rules["pages.{$key}.title"] = ['required', 'string', 'max:120'];
            $rules["pages.{$key}.description"] = ['required', 'string', 'max:320'];
            $rules["pages.{$key}.robots"] = ['required', Rule::in(['index,follow', 'noindex,follow'])];
            $rules["pages.{$key}.og_image"] = ['nullable', 'url:http,https', 'max:2048'];
        }

        $validated = $request->validate($rules);
        $submittedPages = array_keys((array) $request->input('pages', []));
        $unknownPages = array_diff($submittedPages, $knownPages);

        if ($unknownPages !== []) {
            return back()
                ->withErrors(['pages' => 'One or more SEO page entries are not valid.'])
                ->withInput();
        }

        $site = collect($validated)
            ->except('pages')
            ->map(static fn (mixed $value): string => trim((string) ($value ?? '')))
            ->all();
        $site['site_url'] = rtrim($site['site_url'], '/');
        $site['twitter_handle'] = ltrim($site['twitter_handle'], '@');

        $pages = collect($validated['pages'])
            ->map(static fn (array $page): array => [
                'title' => trim($page['title']),
                'description' => trim($page['description']),
                'robots' => $page['robots'],
                'og_image' => trim((string) ($page['og_image'] ?? '')),
            ])
            ->all();

        $seo->save($site, $pages);

        return redirect()
            ->route('admin.site-settings.edit')
            ->with('status', 'Site and SEO settings updated.');
    }
}
