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
                : (request()->route()?->getName() ?? request()->getPathInfo()));
        $fallbackRobots = request()->routeIs('home', 'tools.index', 'tools.show')
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
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
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
        .topbar{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #e6eaf1}
        .nav{max-width:1100px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .brand{font-size:20px;font-weight:800;letter-spacing:-.05em;color:#3446d3}
        .links{display:flex;align-items:center;gap:14px;color:#5b6578;font-size:13px}
        .links>a{white-space:nowrap}
        .nav-search,.theme-toggle{display:inline-grid;width:40px;height:40px;place-items:center;border:1px solid #e6eaf1;border-radius:11px;background:#fff;color:#5b6578;cursor:pointer}
        .nav-search svg,.theme-toggle svg{width:18px;height:18px}
        .theme-toggle .theme-icon-sun{display:none}
        .nav-theme-mobile{display:none}
        .nav-action-link{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border-radius:10px;color:#536078;font-weight:650}
        .nav-action-link:hover{background:#f5f6fb;color:#3446d3}
        .nav-action-link--active{background:#eef0ff;color:#3446d3}
        .ad-shell{width:min(1100px,calc(100% - 24px));margin:18px auto 0}
        .ad-shell--top{padding-top:6px}
        .ad-slot{position:relative;display:flex;align-items:center;justify-content:center;min-height:90px;padding:12px 16px;border:1px solid #dde5f5;border-radius:18px;background:linear-gradient(180deg,#f7f9ff 0%,#eef3ff 100%);box-shadow:0 10px 22px rgba(27,42,95,.04);overflow:hidden}
        .ad-slot::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.15),rgba(255,255,255,.45),rgba(255,255,255,.15));transform:translateX(-100%);animation:adShimmer 3.8s linear infinite}
        @keyframes adShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .ad-slot--fluid{min-height:120px}
        .ad-slot--sidebar{min-height:280px}
        .ad-slot__inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;color:#586680}
        .ad-slot__label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#7b88a5}
        .ad-slot__content{font-size:13px;font-weight:700;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,.8);border:1px solid rgba(127,146,217,.25);color:#404d84}
        .ad-slot__content small{font-size:12px;font-weight:600;color:#66728d}
        @media (max-width: 768px){
            .ad-shell{width:min(100% - 20px, 1100px)}
            .ad-slot{min-height:82px;border-radius:14px}
            .ad-slot--fluid{min-height:110px}
        }
        /* --- Responsive nav --- */
        .nav-toggle{display:none;place-items:center;width:44px;height:44px;border:1px solid #e4e8f0;border-radius:10px;background:#fff;color:#37415a;cursor:pointer}
        .nav-toggle-icon{width:22px;height:22px;grid-area:1/1}
        .nav-toggle-icon--close{display:none}
        body.nav-open .nav-toggle-icon--open{display:none}
        body.nav-open .nav-toggle-icon--close{display:block}
        .nav-toggle:focus-visible{outline:3px solid #9fa8ff;outline-offset:2px}
        .nav-mobile{border-top:1px solid #eef1f6;background:#fff;box-shadow:0 18px 30px #1b2c4b14}
        .nav-mobile[hidden]{display:none}
        .nav-mobile-inner{display:grid;gap:2px;max-width:1100px;margin:0 auto;padding:10px 24px 18px}
        .nav-mobile-link{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:0 14px;border-radius:10px;color:#37415a;font-size:15px;font-weight:550}
        .nav-mobile-link>span{color:#a6afc2}
        .nav-mobile-link:hover{background:#f3f5fb;color:#3446d3}
        .nav-mobile-link--active{background:#eef0ff;color:#4f46e5;font-weight:750}
        .nav-mobile-link--ghost{color:#71809a}
        .nav-mobile-cta{display:flex;align-items:center;justify-content:center;min-height:46px;margin-top:8px;border-radius:10px;background:#eef0ff;color:#394bc9;font-size:15px;font-weight:700}
        .nav-mobile-cta:hover{background:#e3e6ff}
        @media(max-width:1080px){
            .nav-links-desktop{display:none}
            .nav-toggle{display:grid}
            .nav-theme-mobile{display:grid}
            .nav{padding:12px 24px;gap:12px}
            .brand{font-size:18px}
            .nav-mobile-inner{padding:10px 24px 16px}
        }
        .nav-mobile-primary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
        .nav-mobile-categories{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;padding-top:14px;border-top:1px solid #eef1f6}
        .nav-mobile-category{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 12px;border:1px solid #e7eaf1;border-radius:999px;color:#4b5870;font-size:13px;font-weight:600}
        @media(max-width:400px){
            .nav{padding:10px 16px}
            .brand{font-size:17px}
            .nav-mobile-inner{padding:8px 16px 14px}
        }
        .container{width:100%;max-width:1100px;margin:0 auto;padding:42px 24px 72px}.hero{padding:38px 0 44px;max-width:760px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5364df}
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
        .footer-inner{width:min(1100px,100%);margin:0 auto;padding:54px 24px 22px}
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
        .brand-mark{display:grid;width:36px;height:36px;place-items:center;border:1px solid #aeb8ff35;border-radius:12px;background:linear-gradient(145deg,#7180ff,#4658df);box-shadow:0 5px 14px #5364df30;color:#fff}
        .brand-mark svg{width:22px;height:22px}
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
        @media print {
            header.topbar, footer.site-footer, nav, .eyebrow, #how-to-heading, section[aria-labelledby="how-to-heading"], section[aria-labelledby="features-heading"], section[aria-labelledby="faq-heading"], section[aria-labelledby="related-heading"], .no-print, .asset-warning {
                display: none !important;
            }
            body, main, .container {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
            }
            .invoice-preview-sheet {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                width: 100% !important;
            }
        }
    </style>

    @if ($siteSettings['ads_enabled'])
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7283499382397295"
         crossorigin="anonymous"></script>
    @endif

     <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-CG5XVSPJ9L"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-CG5XVSPJ9L');
    </script>

</head>
<body>
    <header class="topbar">
        <nav class="nav" aria-label="Main navigation">
            <a class="brand" href="{{ route('home') }}" style="display:inline-flex;align-items:center;gap:10px;">
                <span class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 18 10.2 6.8a2 2 0 0 1 3.6 0L19 18M7.5 13h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17.5 7.5h3m-1.5-1.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                </span>
                <span>{{ $siteName }}</span>
            </a>

            @php
                $categoryLinks = [
                    'pdf-tools' => ['label' => 'PDFs', 'icon' => 'pdf-tools'],
                    'image-tools' => ['label' => 'Images', 'icon' => 'image-tools'],
                    'calculators' => ['label' => 'Calculators', 'icon' => 'calculators'],
                    'text-tools' => ['label' => 'Text', 'icon' => 'text-tools'],
                ];
                $categoryUrl = static fn (string $slug): string => request()->routeIs('home')
                    ? '#home-category-'.$slug
                    : route('tools.index').'#category-'.$slug;
                $navLinks = [
                    'home' => ['label' => 'Home', 'url' => route('home'), 'active' => request()->routeIs('home')],
                    'tools' => ['label' => 'All tools', 'url' => route('tools.index'), 'active' => request()->routeIs('tools.*')],
                    'pdf-tools' => ['label' => 'PDFs', 'url' => $categoryUrl('pdf-tools'), 'active' => false],
                    'image-tools' => ['label' => 'Images', 'url' => $categoryUrl('image-tools'), 'active' => false],
                    'calculators' => ['label' => 'Calculators', 'url' => $categoryUrl('calculators'), 'active' => false],
                    'text-tools' => ['label' => 'Text', 'url' => $categoryUrl('text-tools'), 'active' => false],
                    'dashboard' => ['label' => 'Dashboard', 'url' => route('dashboard'), 'active' => request()->routeIs('dashboard'), 'auth' => true],
                    'profile' => ['label' => 'Profile', 'url' => route('profile.edit'), 'active' => request()->routeIs('profile.*'), 'auth' => true],
                    'admin' => ['label' => 'Admin', 'url' => route('admin.dashboard'), 'active' => request()->routeIs('admin.*'), 'auth' => true, 'admin' => true],
                ];
            @endphp

            {{-- Desktop links --}}
            <div class="links nav-links-desktop">
                @foreach ($navLinks as $key => $link)
                @if (in_array($key, ['dashboard', 'profile'], true)) @continue @endif
                @if (($link['auth'] ?? false) && !auth()->check()) @continue @endif
                    @if (($link['admin'] ?? false) && !(auth()->check() && auth()->user()->is_admin)) @continue @endif
                    <a class="{{ $link['active'] ? 'nav-action-link nav-action-link--active' : 'nav-action-link' }}" href="{{ $link['url'] }}">{{ $link['label'] }}</a>
                @endforeach
                <a class="nav-search" href="{{ route('tools.index') }}#tool-search" aria-label="Search all tools" title="Search all tools">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/></svg>
                </a>
                <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch theme">
                    <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>
                    <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
                </button>
                @auth
                    <form method="POST" action="{{ route('auth.logout') }}">
                        @csrf
                        <button class="btn ghost" type="submit">Sign out</button>
                    </form>
                @else
                    <a href="{{ route('login') }}">Sign in</a>
                    <a class="btn secondary" href="{{ route('auth.register') }}">Create account</a>
                @endauth
            </div>

            {{-- Mobile hamburger --}}
            <button type="button" class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="nav-mobile-menu" aria-label="Toggle menu">
                <svg class="nav-toggle-icon nav-toggle-icon--open" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg class="nav-toggle-icon nav-toggle-icon--close" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <button class="theme-toggle nav-theme-mobile" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch theme">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
            </button>
        </nav>

        {{-- Mobile slide-down menu --}}
        <div class="nav-mobile" id="nav-mobile-menu" data-nav-mobile hidden>
            <div class="nav-mobile-inner">
                <div class="nav-mobile-primary">
                    @foreach (['home', 'tools', 'dashboard', 'profile', 'admin'] as $key)
                        @php($link = $navLinks[$key])
                        @if (($link['auth'] ?? false) && !auth()->check()) @continue @endif
                        @if (($link['admin'] ?? false) && !(auth()->check() && auth()->user()->is_admin)) @continue @endif
                        <a href="{{ $link['url'] }}" data-nav-mobile-link class="nav-mobile-link {{ $link['active'] ? 'nav-mobile-link--active' : '' }}">
                            {{ $link['label'] }}
                            <span aria-hidden="true">›</span>
                        </a>
                    @endforeach
                    <a href="{{ route('tools.index') }}#tool-search" data-nav-mobile-link class="nav-mobile-link">Search tools <span aria-hidden="true">⌕</span></a>
                </div>
                <div class="nav-mobile-categories" aria-label="Tool categories">
                    @foreach ($categoryLinks as $slug => $category)
                        <a href="{{ $categoryUrl($slug) }}" data-nav-mobile-link class="nav-mobile-category">
                            <x-category-icon :category="$category['icon']" size="sm" />
                            {{ $category['label'] }}
                        </a>
                    @endforeach
                </div>
                @auth
                    <form method="POST" action="{{ route('auth.logout') }}" class="nav-mobile-form">
                        @csrf
                        <button type="submit" class="nav-mobile-link nav-mobile-link--ghost" style="width:100%;text-align:left;background:none;border:0;cursor:pointer;font:inherit;">Sign out</button>
                    </form>
                @else
                    <a href="{{ route('login') }}" data-nav-mobile-link class="nav-mobile-link">Sign in <span aria-hidden="true">›</span></a>
                    <a href="{{ route('auth.register') }}" data-nav-mobile-link class="nav-mobile-cta">Create account</a>
                @endauth
            </div>
        </div>
    </header>

    <script>
        (function () {
            var toggle = document.querySelector('[data-nav-toggle]');
            var menu = document.querySelector('[data-nav-mobile]');
            if (!toggle || !menu) return;

            function setMenu(open) {
                menu.hidden = !open;
                toggle.setAttribute('aria-expanded', String(open));
                document.body.classList.toggle('nav-open', open);
            }

            toggle.addEventListener('click', function () {
                setMenu(menu.hidden);
            });

            // Close when a menu link is tapped
            menu.addEventListener('click', function (event) {
                if (event.target.closest('[data-nav-mobile-link]')) setMenu(false);
            });

            // Close on Escape and when tapping outside
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
            });
            document.addEventListener('click', function (event) {
                if (!menu.hidden && !event.target.closest('.topbar')) setMenu(false);
            });

            var mq = window.matchMedia('(min-width: 1081px)');
            mq.addEventListener('change', function (e) { if (e.matches) setMenu(false); });
        })();

    </script>
    @if (request()->routeIs('home') && $siteSettings['ads_enabled'])
        <div class="ad-shell ad-shell--top" aria-label="Advertisement placeholder">
            <div class="ad-slot ad-slot--fluid">
                <div class="ad-slot__inner">
                    <span class="ad-slot__label">Advertisement</span>
                    <div class="ad-slot__content">Responsive AdSense Banner<br><small>728 × 90 / 970 × 90</small></div>
                </div>
            </div>
        </div>
    @endif

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
