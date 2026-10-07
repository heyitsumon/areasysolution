<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @php
        $siteSeo = app(\App\Support\Seo\SiteSeo::class);
        $siteSettings = $siteSeo->site();
        $siteName = $siteSettings['site_name'];
        $pageKey = request()->routeIs('tools.show')
            ? 'tool:'.request()->route('tool')
            : (request()->routeIs('tools.index')
                ? 'tools-index'
                : (request()->routeIs('ads-txt.help')
                    ? 'ads-txt-help'
                    : (request()->route()?->getName() ?? request()->getPathInfo())));
        $fallbackRobots = request()->routeIs('home', 'tools.index', 'tools.show')
            || request()->routeIs('ads-txt.help')
            ? 'index,follow'
            : 'noindex,follow';
        $pageSeo = $siteSeo->resolvePage(
            $pageKey,
            $title ?? null,
            $description ?? null,
            $canonicalPath ?? null,
            $fallbackRobots
        );
        $canonicalUrl = $pageSeo['canonical'];
        $pageTitle = $pageSeo['title'].' · '.$siteName;
    @endphp
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $pageTitle }}</title>
    <meta name="description" content="{{ $pageSeo['description'] }}">
    <meta name="robots" content="{{ $pageSeo['robots'] }}">
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta name="theme-color" content="#111a30">
    <meta property="og:locale" content="{{ str_replace('-', '_', app()->getLocale()) }}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $siteName }}">
    <meta property="og:title" content="{{ $pageTitle }}">
    <meta property="og:description" content="{{ $pageSeo['description'] }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <meta name="twitter:card" content="{{ $pageSeo['og_image'] !== '' ? 'summary_large_image' : 'summary' }}">
    <meta name="twitter:title" content="{{ $pageTitle }}">
    <meta name="twitter:description" content="{{ $pageSeo['description'] }}">
    @if ($pageSeo['og_image'] !== '')
        <meta property="og:image" content="{{ $pageSeo['og_image'] }}">
        <meta property="og:image:alt" content="{{ $pageTitle }}">
        <meta name="twitter:image" content="{{ $pageSeo['og_image'] }}">
    @endif
    @if ($siteSettings['twitter_handle'] !== '')
        <meta name="twitter:site" content="{{ '@'.ltrim($siteSettings['twitter_handle'], '@') }}">
    @endif
    @if ($siteSettings['google_site_verification'] !== '')
        <meta name="google-site-verification" content="{{ $siteSettings['google_site_verification'] }}">
    @endif
    @if ($siteSettings['bing_site_verification'] !== '')
        <meta name="msvalidate.01" content="{{ $siteSettings['bing_site_verification'] }}">
    @endif
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
        *{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;flex-direction:column}a{color:inherit;text-decoration:none}
        .topbar{background:#fff;border-bottom:1px solid #e6eaf1}.nav{max-width:1120px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .brand{font-size:20px;font-weight:800;letter-spacing:-.05em;color:#3446d3}.links{display:flex;align-items:center;gap:18px;color:#5b6578;font-size:14px}
        .container{max-width:1120px;margin:0 auto;padding:42px 24px 72px}.hero{padding:38px 0 44px;max-width:760px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5364df}
        h1{font-size:clamp(34px,6vw,58px);line-height:1.06;letter-spacing:-.055em;margin:12px 0 18px}h2{font-size:23px;letter-spacing:-.03em;margin:0 0 10px}
        p{color:#657086;line-height:1.7}.muted{color:#738096;font-size:14px}.card{background:#fff;border:1px solid #e6eaf1;border-radius:16px;padding:24px;box-shadow:0 10px 30px #263c6608}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.btn{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:9px;padding:11px 16px;background:#4658df;color:white;font-weight:700;font-size:14px;cursor:pointer}
        .btn.secondary{background:#eef0ff;color:#394bc9}.btn.ghost{background:transparent;color:#4b5870;padding:8px}.btn:hover{filter:brightness(.96)}
        .form-card{max-width:520px;margin:20px auto}.field{margin:16px 0}.field label{display:block;font-weight:650;font-size:14px;margin-bottom:7px}.field input,.field select,.field textarea{width:100%;border:1px solid #dce2ec;border-radius:8px;padding:12px;font:inherit;background:#fff}.field textarea{min-height:96px;resize:vertical}
        .field input:focus,.field select:focus,.field textarea:focus{outline:3px solid #4658df22;border-color:#6574e8}.error{color:#bb334a;font-size:13px;margin-top:6px}.notice{padding:12px 14px;border-radius:9px;background:#eaf8ef;color:#207341;margin:12px 0}
        .actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th,td{padding:12px 10px;border-bottom:1px solid #edf0f5}th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6d7789}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:14px;margin:22px 0}.stat strong{display:block;font-size:30px;letter-spacing:-.04em;margin-top:8px}.stat span{font-size:13px;color:#6d7789}
        .bar-row{display:grid;grid-template-columns:70px 1fr 48px;align-items:center;gap:10px;font-size:12px;color:#68748a;margin:9px 0}.bar{height:9px;background:#eef0ff;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:#5364df;border-radius:99px}
        .periods{display:flex;gap:8px;flex-wrap:wrap}.periods a{padding:8px 12px;border-radius:8px;background:#fff;border:1px solid #e1e6ef;color:#667187;font-size:13px}.periods a.active{background:#4658df;color:white;border-color:#4658df}
        .analytics-livebar{display:flex;align-items:center;gap:9px;margin:18px 0 4px;color:#49566e;font-size:13px;font-weight:650}
        .analytics-live-indicator{width:8px;height:8px;border-radius:50%;background:#10a875;box-shadow:0 0 0 4px #10a8751c}
        .analytics-refresh-status{margin-left:4px;color:#768198;font-size:12px;font-weight:450}
        .analytics-refresh-status[data-state="loading"]{color:#4857c8}
        .analytics-refresh-status[data-state="error"]{color:#bb334a}
        .analytics-refresh-button{margin-left:auto;border:1px solid #e1e6ef;border-radius:8px;background:#fff;padding:8px 11px;color:#4c5870;font:inherit;font-size:12px;cursor:pointer}
        .analytics-refresh-button:hover{border-color:#b7c0d1;background:#f8f9fc}
        .analytics-refresh-button:disabled{opacity:.55;cursor:wait}
        .online-stat{position:relative;overflow:hidden}
        .online-stat:first-child{border-color:#bbefda;background:linear-gradient(145deg,#fff,#f1fcf7)}
        .online-stat:first-child:after{position:absolute;top:20px;right:20px;width:9px;height:9px;border-radius:50%;background:#10a875;box-shadow:0 0 0 5px #10a8751c;content:""}
        .online-stat small{display:block;margin-top:5px;color:#7a8799;font-size:11px}
        .analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}
        .analytics-card{min-width:0}
        .analytics-trend-card{grid-column:1/-1}
        .analytics-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
        .analytics-card-heading h2{margin-bottom:3px}
        .analytics-card-heading .muted{margin:0}
        .analytics-range-badge{border:1px solid #e6eaf1;border-radius:999px;background:#f8f9fc;padding:6px 9px;color:#68748a;font-size:11px;font-weight:650}
        .analytics-chart{position:relative;height:290px}
        .analytics-chart-tall{height:340px}
        .analytics-chart canvas[hidden]{display:none}
        .analytics-empty{display:grid;min-height:180px;place-items:center;margin:0;color:#788399;font-size:14px}
        main.container{width:100%;flex:1 0 auto}
        .site-footer{position:relative;overflow:hidden;border-top:1px solid #202b47;background:radial-gradient(ellipse at 18% 0%,#202d52 0,transparent 42%),#111a30;color:#c2cbe0}
        .footer-inner{width:min(1120px,100%);margin:0 auto;padding:54px 24px 22px}
        .footer-grid{display:grid;grid-template-columns:minmax(240px,1.6fr) repeat(2,minmax(130px,.7fr));gap:48px;padding-bottom:42px}
        .footer-brand{display:inline-flex;align-items:center;gap:11px;color:#fff;font-size:18px;font-weight:800;letter-spacing:-.045em}
        .footer-mark{display:grid;width:38px;height:38px;place-items:center;border:1px solid #aeb8ff35;border-radius:12px;background:linear-gradient(145deg,#7180ff,#4658df);box-shadow:0 8px 22px #5364df30;color:#fff}
        .footer-mark svg{width:20px;height:20px}
        .footer-description{max-width:330px;margin:15px 0 0;color:#a9b4cd;font-size:14px;line-height:1.75}
        .footer-note{display:inline-flex;align-items:center;gap:8px;margin-top:17px;border:1px solid #ffffff16;border-radius:999px;background:#ffffff08;padding:8px 11px;color:#d4dcf1;font-size:12px}
        .footer-note:before{width:7px;height:7px;border-radius:50%;background:#76e3b0;content:""}
        .footer-heading{margin:4px 0 15px;color:#fff;font-size:12px;font-weight:750;letter-spacing:.1em;text-transform:uppercase}
        .footer-links{display:grid;gap:12px}
        .footer-links a{width:fit-content;color:#a9b4cd;font-size:14px;transition:color .18s,transform .18s}
        .footer-links a:hover{transform:translateX(2px);color:#fff}
        .footer-links a:focus-visible,.footer-brand:focus-visible{border-radius:4px;outline:2px solid #aeb8ff;outline-offset:4px}
        .footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:1px solid #ffffff16;padding-top:18px;color:#8996b2;font-size:12px}
        .footer-bottom p{margin:0;color:inherit;font-size:inherit}
        .footer-bottom a{color:#c4ccea}
        .footer-bottom a:hover{color:#fff}
        .asset-warning{padding:14px 16px;border:1px solid #f1c879;border-radius:10px;background:#fff8df;color:#72520c;font-size:14px;line-height:1.6}
        .container.home-shell{max-width:none;padding:0 0 72px}
        @media(max-width:650px){.nav{align-items:flex-start}.links{gap:10px;flex-wrap:wrap;justify-content:flex-end}.container{padding-top:28px}.card{padding:18px}.analytics-grid{grid-template-columns:1fr}.analytics-trend-card{grid-column:auto}.analytics-chart{height:250px}.analytics-chart-tall{height:300px}.analytics-livebar{flex-wrap:wrap}.analytics-refresh-button{margin-left:auto}.footer-inner{padding:40px 24px 18px}.footer-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 22px;padding-bottom:30px}.footer-brand-block{grid-column:1/-1}.footer-bottom{align-items:flex-start;flex-direction:column;gap:8px}}
        img,svg,video,canvas{max-width:100%}
        @media(max-width:760px){
            .nav{flex-wrap:wrap;gap:12px;padding:14px 20px}
            .links{width:100%;justify-content:flex-start;gap:6px 12px}
            .links form{margin:0}
            .links>a,.links form button{min-height:44px}
            .container{padding-right:20px;padding-left:20px}
            .analytics-grid{grid-template-columns:minmax(0,1fr)}
            .analytics-trend-card{grid-column:auto}
            .analytics-card{min-width:0}
            .analytics-card-heading{flex-wrap:wrap}
            .table-wrap{max-width:100%;overscroll-behavior-x:contain}
            .table-wrap table{min-width:520px}
        }
        @media(max-width:650px){
            h1{font-size:clamp(30px,8vw,42px)!important;line-height:1.1}
            .container{padding:28px 16px 48px}
            .hero{padding:24px 0 32px}
            .nav{padding-right:16px;padding-left:16px}
            .links{gap:4px 8px}
            .links a,.links .btn,.links form button{min-height:44px;padding:9px 10px;font-size:13px}
            button,.field input,.field select{min-height:44px}
            .card{min-width:0;padding:16px}
            .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
            .stat strong{font-size:clamp(22px,7vw,30px);overflow-wrap:anywhere}
            .analytics-livebar{align-items:flex-start}
            .analytics-refresh-status{flex:1 1 150px;min-width:0;overflow-wrap:anywhere}
            .analytics-chart{height:230px}
            .analytics-chart-tall{height:270px}
            .analytics-card-heading h2{font-size:20px}
            .bar-row{grid-template-columns:54px minmax(0,1fr) 38px;gap:7px}
            .form-card{width:100%;margin:12px auto}
            .form-card form>.btn{width:100%;min-height:44px}
            .field input,.field select,.field textarea{min-width:0;font-size:16px}
            .actions{min-width:0}
            .actions>*{max-width:100%}
            .footer-inner{padding-right:16px;padding-left:16px}
            .footer-grid{gap:28px 16px}
            .footer-links a{min-height:44px;display:flex;align-items:center}
        }
        @media(max-width:380px){
            .stats{grid-template-columns:minmax(0,1fr)}
            .links{column-gap:4px}
            .links a,.links .btn,.links form button{padding-right:8px;padding-left:8px}
            .footer-grid{grid-template-columns:minmax(0,1fr)}
            .footer-brand-block{grid-column:auto}
            .analytics-card-heading{align-items:flex-start}
            .analytics-range-badge{white-space:nowrap}
        }
        @media(prefers-reduced-motion:reduce){
            *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
        }
    </style>

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7283499382397295"
     crossorigin="anonymous"></script>
     
</head>
<body>
    <header class="topbar">
        <nav class="nav" aria-label="Main navigation">
            <a class="brand" href="{{ route('home') }}">{{ $siteName }}</a>
            <div class="links">
                <a href="{{ route('tools.index') }}">Tools</a>
                @auth
                    <a href="{{ route('dashboard') }}">Dashboard</a>
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
    <main class="container{{ request()->routeIs('home') ? ' home-shell' : '' }}">
        @if (session('status'))
            <div class="notice" role="status">{{ session('status') }}</div>
        @endif
        @yield('content')
    </main>
    <footer class="site-footer">
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-brand-block">
                    <a class="footer-brand" href="{{ route('home') }}" aria-label="{{ $siteName }} home">
                        <span class="footer-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 17.5 10.1 6.7a2.1 2.1 0 0 1 3.8 0L19 17.5M7.3 13h9.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M17.2 7.2h2.1m-1.05-1.05v2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </span>
                        <span>{{ $siteName }}</span>
                    </a>
                    <p class="footer-description">{{ $siteSettings['tagline'] }}</p>
                    <span class="footer-note">Free to use · Built for your privacy</span>
                </div>
                <nav aria-label="Explore">
                    <h2 class="footer-heading">Explore</h2>
                    <div class="footer-links">
                        <a href="{{ route('home') }}">Home</a>
                        <a href="{{ route('tools.index') }}">All tools</a>
                        <a href="{{ route('ads-txt.help') }}">Ads.txt help</a>
                    </div>
                </nav>
                <nav aria-label="Your account">
                    <h2 class="footer-heading">Your account</h2>
                    <div class="footer-links">
                        @auth
                            <a href="{{ route('dashboard') }}">Dashboard</a>
                            <a href="{{ route('profile.edit') }}">Profile</a>
                            @if (auth()->user()->is_admin)
                                <a href="{{ route('admin.dashboard') }}">Admin dashboard</a>
                            @endif
                        @else
                            <a href="{{ route('login') }}">Sign in</a>
                            <a href="{{ route('auth.register') }}">Create account</a>
                        @endauth
                    </div>
                </nav>
            </div>
            <div class="footer-bottom">
                <p>&copy; {{ now()->year }} {{ $siteName }}. All rights reserved.</p>
                <a href="{{ route('tools.index') }}">Find the right tool for the job <span aria-hidden="true">→</span></a>
            </div>
        </div>
    </footer>
</body>
</html>
