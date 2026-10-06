@extends('layouts.app', ['title' => 'Site and SEO settings'])

@section('content')
    <div class="actions" style="justify-content:space-between">
        <div>
            <div class="eyebrow">Admin panel</div>
            <h1 style="font-size:42px">Site &amp; SEO settings</h1>
        </div>
        <a class="btn secondary" href="{{ route('admin.dashboard') }}">Back to analytics</a>
    </div>
    <p class="muted">Changes update the shared site branding, search and social metadata, structured data URLs, sitemap, and page cache.</p>

    @if ($errors->any())
        <div class="asset-warning" role="alert">
            <strong>Please correct the following:</strong>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('admin.site-settings.update') }}">
        @csrf
        @method('PUT')

        <section class="card" aria-labelledby="site-settings-heading">
            <h2 id="site-settings-heading">Site-wide settings</h2>
            <p class="muted">These values are used by default anywhere a page does not have its own SEO value.</p>
            <div class="grid">
                <div class="field">
                    <label for="site_name">Site name</label>
                    <input id="site_name" name="site_name" value="{{ old('site_name', $settings['site_name']) }}" maxlength="100" required>
                    @error('site_name')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="tagline">Site tagline</label>
                    <input id="tagline" name="tagline" value="{{ old('tagline', $settings['tagline']) }}" maxlength="180" required>
                    @error('tagline')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="site_url">Canonical site URL</label>
                    <input id="site_url" name="site_url" type="url" value="{{ old('site_url', $settings['site_url']) }}" maxlength="255" placeholder="https://example.com" required>
                    @error('site_url')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="default_title">Default SEO title</label>
                    <input id="default_title" name="default_title" value="{{ old('default_title', $settings['default_title']) }}" maxlength="120" required>
                    @error('default_title')<div class="error">{{ $message }}</div>@enderror
                </div>
            </div>
            <div class="field">
                <label for="default_description">Default meta description</label>
                <textarea id="default_description" name="default_description" maxlength="320" required>{{ old('default_description', $settings['default_description']) }}</textarea>
                @error('default_description')<div class="error">{{ $message }}</div>@enderror
            </div>
        </section>

        <section class="card" style="margin-top:18px" aria-labelledby="social-settings-heading">
            <h2 id="social-settings-heading">Search and social sharing</h2>
            <p class="muted">Optional values used in search-engine verification and social link previews.</p>
            <div class="grid">
                <div class="field">
                    <label for="og_image">Default Open Graph image URL</label>
                    <input id="og_image" name="og_image" type="url" value="{{ old('og_image', $settings['og_image']) }}" maxlength="2048" placeholder="https://example.com/social-card.png">
                    @error('og_image')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="twitter_handle">X / Twitter handle</label>
                    <input id="twitter_handle" name="twitter_handle" value="{{ old('twitter_handle', $settings['twitter_handle']) }}" maxlength="16" placeholder="@yourhandle">
                    @error('twitter_handle')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="google_site_verification">Google Search Console verification</label>
                    <input id="google_site_verification" name="google_site_verification" value="{{ old('google_site_verification', $settings['google_site_verification']) }}" maxlength="255">
                    @error('google_site_verification')<div class="error">{{ $message }}</div>@enderror
                </div>
                <div class="field">
                    <label for="bing_site_verification">Bing Webmaster verification</label>
                    <input id="bing_site_verification" name="bing_site_verification" value="{{ old('bing_site_verification', $settings['bing_site_verification']) }}" maxlength="255">
                    @error('bing_site_verification')<div class="error">{{ $message }}</div>@enderror
                </div>
            </div>
        </section>

        <section style="margin-top:28px" aria-labelledby="page-seo-heading">
            <h2 id="page-seo-heading">Page-by-page SEO</h2>
            <p class="muted">Customize search titles, descriptions, index visibility, and social images for the homepage, directory, and each tool page.</p>
            @foreach ($pages as $page)
                <details class="card" style="margin-top:12px">
                    <summary style="cursor:pointer;font-weight:700">
                        {{ $page['label'] }}
                        <span class="muted" style="font-weight:400"> · {{ $page['path'] }}</span>
                    </summary>
                    <div class="grid" style="margin-top:16px">
                        <div class="field">
                            <label for="page-title-{{ $loop->index }}">SEO title</label>
                            <input id="page-title-{{ $loop->index }}" name="pages[{{ $page['key'] }}][title]" value="{{ old('pages.'.$page['key'].'.title', $page['title']) }}" maxlength="120" required>
                            @error('pages.'.$page['key'].'.title')<div class="error">{{ $message }}</div>@enderror
                        </div>
                        <div class="field">
                            <label for="page-robots-{{ $loop->index }}">Search engine visibility</label>
                            <select id="page-robots-{{ $loop->index }}" name="pages[{{ $page['key'] }}][robots]">
                                <option value="index,follow" @selected(old('pages.'.$page['key'].'.robots', $page['robots']) === 'index,follow')>Index this page</option>
                                <option value="noindex,follow" @selected(old('pages.'.$page['key'].'.robots', $page['robots']) === 'noindex,follow')>Do not index this page</option>
                            </select>
                            @error('pages.'.$page['key'].'.robots')<div class="error">{{ $message }}</div>@enderror
                        </div>
                    </div>
                    <div class="field">
                        <label for="page-description-{{ $loop->index }}">Meta description</label>
                        <textarea id="page-description-{{ $loop->index }}" name="pages[{{ $page['key'] }}][description]" maxlength="320" required>{{ old('pages.'.$page['key'].'.description', $page['description']) }}</textarea>
                        @error('pages.'.$page['key'].'.description')<div class="error">{{ $message }}</div>@enderror
                    </div>
                    <div class="field">
                        <label for="page-image-{{ $loop->index }}">Page-specific social image URL <span class="muted">(optional; uses the default if blank)</span></label>
                        <input id="page-image-{{ $loop->index }}" name="pages[{{ $page['key'] }}][og_image]" type="url" value="{{ old('pages.'.$page['key'].'.og_image', $page['og_image']) }}" maxlength="2048" placeholder="https://example.com/social-card.png">
                        @error('pages.'.$page['key'].'.og_image')<div class="error">{{ $message }}</div>@enderror
                    </div>
                </details>
            @endforeach
        </section>

        <div class="actions" style="margin-top:22px">
            <button class="btn" type="submit">Save site and SEO settings</button>
        </div>
    </form>
@endsection
