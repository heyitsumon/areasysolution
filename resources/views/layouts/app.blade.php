<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @php
        $siteName = config('tools.site.name', 'MyTools');
        $siteUrl = rtrim(config('seo.site_url'), '/');
        $canonicalUrl = $siteUrl.($canonicalPath ?? request()->getPathInfo());
        $pageTitle = ($title ?? $siteName).' · '.$siteName;
        $indexable = request()->routeIs('home', 'tools.index', 'tools.show');
    @endphp
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $pageTitle }}</title>
    <meta name="description" content="{{ $description ?? 'Free online PDF, image, text and developer tools. Fast, privacy-minded utilities that work in your browser.' }}">
    <meta name="robots" content="{{ $indexable ? 'index,follow' : 'noindex,follow' }}">
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $siteName }}">
    <meta property="og:title" content="{{ $pageTitle }}">
    <meta property="og:description" content="{{ $description ?? 'Free online PDF, image, text and developer tools. Fast, privacy-minded utilities that work in your browser.' }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $pageTitle }}">
    <meta name="twitter:description" content="{{ $description ?? 'Free online PDF, image, text and developer tools. Fast, privacy-minded utilities that work in your browser.' }}">
    @isset($structuredData)
        <script type="application/ld+json">@json($structuredData, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)</script>
    @endisset
    @if (request()->routeIs('tools.show'))
        <meta name="csrf-token" content="{{ csrf_token() }}">
    @endif
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
    <style>
        :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#162033;background:#f6f8fc;font-synthesis:none}
        *{box-sizing:border-box}body{margin:0;min-height:100vh}a{color:inherit;text-decoration:none}
        .topbar{background:#fff;border-bottom:1px solid #e6eaf1}.nav{max-width:1120px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .brand{font-size:20px;font-weight:800;letter-spacing:-.05em;color:#3446d3}.links{display:flex;align-items:center;gap:18px;color:#5b6578;font-size:14px}
        .container{max-width:1120px;margin:0 auto;padding:42px 24px 72px}.hero{padding:38px 0 44px;max-width:760px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5364df}
        h1{font-size:clamp(34px,6vw,58px);line-height:1.06;letter-spacing:-.055em;margin:12px 0 18px}h2{font-size:23px;letter-spacing:-.03em;margin:0 0 10px}
        p{color:#657086;line-height:1.7}.muted{color:#738096;font-size:14px}.card{background:#fff;border:1px solid #e6eaf1;border-radius:16px;padding:24px;box-shadow:0 10px 30px #263c6608}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.btn{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:9px;padding:11px 16px;background:#4658df;color:white;font-weight:700;font-size:14px;cursor:pointer}
        .btn.secondary{background:#eef0ff;color:#394bc9}.btn.ghost{background:transparent;color:#4b5870;padding:8px}.btn:hover{filter:brightness(.96)}
        .form-card{max-width:520px;margin:20px auto}.field{margin:16px 0}.field label{display:block;font-weight:650;font-size:14px;margin-bottom:7px}.field input{width:100%;border:1px solid #dce2ec;border-radius:8px;padding:12px;font:inherit}
        .field input:focus{outline:3px solid #4658df22;border-color:#6574e8}.error{color:#bb334a;font-size:13px;margin-top:6px}.notice{padding:12px 14px;border-radius:9px;background:#eaf8ef;color:#207341;margin:12px 0}
        .actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th,td{padding:12px 10px;border-bottom:1px solid #edf0f5}th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6d7789}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:14px;margin:22px 0}.stat strong{display:block;font-size:30px;letter-spacing:-.04em;margin-top:8px}.stat span{font-size:13px;color:#6d7789}
        .bar-row{display:grid;grid-template-columns:70px 1fr 48px;align-items:center;gap:10px;font-size:12px;color:#68748a;margin:9px 0}.bar{height:9px;background:#eef0ff;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:#5364df;border-radius:99px}
        .periods{display:flex;gap:8px;flex-wrap:wrap}.periods a{padding:8px 12px;border-radius:8px;background:#fff;border:1px solid #e1e6ef;color:#667187;font-size:13px}.periods a.active{background:#4658df;color:white;border-color:#4658df}
        .footer{border-top:1px solid #e6eaf1;color:#8992a2;font-size:12px;padding:22px 24px;text-align:center}
        .asset-warning{padding:14px 16px;border:1px solid #f1c879;border-radius:10px;background:#fff8df;color:#72520c;font-size:14px;line-height:1.6}
        @media(max-width:650px){.nav{align-items:flex-start}.links{gap:10px;flex-wrap:wrap;justify-content:flex-end}.container{padding-top:28px}.card{padding:18px}}
    </style>
</head>
<body>
    <header class="topbar">
        <nav class="nav" aria-label="Main navigation">
            <a class="brand" href="{{ route('home') }}">ArEasySolution</a>
            <div class="links">
                <a href="{{ route('tools.index') }}">Tools</a>
                @auth
                    <a href="{{ route('profile.edit') }}">Profile</a>
                    @if (auth()->user()->is_admin)
                        <a href="{{ route('admin.dashboard') }}">Admin</a>
                    @endif
                    <form method="POST" action="{{ route('auth.logout') }}">
                        @csrf
                        <button class="btn ghost" type="submit">Sign out</button>
                    </form>
                @else
                    <a href="{{ route('login') }}">Sign in</a>
                    <a class="btn secondary" href="{{ route('auth.register') }}">Create account</a>
                @endauth
            </div>
        </nav>
    </header>
    <main class="container">
        @if (session('status'))
            <div class="notice" role="status">{{ session('status') }}</div>
        @endif
        @yield('content')
    </main>
    <footer class="footer">MyTools · Simple tools, thoughtfully built.</footer>
</body>
</html>
