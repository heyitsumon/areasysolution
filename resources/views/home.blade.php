@extends('layouts.app', [
    'title' => 'Free Online Tools for PDF, Images and Text',
    'description' => 'Use free online PDF, image, text and developer tools. Process files in your browser without uploading them.',
    'canonicalPath' => route('home', absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'WebSite',
                '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().'#website',
                'name' => app(\App\Support\Seo\SiteSeo::class)->site()['site_name'],
                'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('home', absolute: false),
                'publisher' => [
                    '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().'#organization',
                ],
            ],
            [
                '@type' => 'Organization',
                '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().'#organization',
                'name' => app(\App\Support\Seo\SiteSeo::class)->site()['site_name'],
                'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl(),
            ],
        ],
    ],
])

@section('content')
    @php
        $allTools = config('tools.tools', []);
        $categories = config('tools.categories', []);
        $featuredTools = collect($allTools)->only([
            'image-compressor',
            'merge-pdf',
            'word-counter',
            'qr-code-generator',
            'viral-hashtag-generator',
        ]);
        $toolBadges = [
            'image-compressor' => 'IMG',
            'merge-pdf' => 'PDF',
            'word-counter' => 'Aa',
            'qr-code-generator' => 'QR',
            'viral-hashtag-generator' => '#',
        ];
    @endphp

    <style>
        .home-page{--home-ink:#15213b;--home-muted:#66728a;--home-accent:#515de5;--home-line:#e8ebf3;color:var(--home-ink)}
        .home-wrap{width:min(1160px,100% - 48px);margin-inline:auto}
        .home-hero{position:relative;overflow:hidden;background:linear-gradient(125deg,#111a35 0%,#202c57 56%,#3445a3 100%);color:#fff}
        .home-hero:before,.home-hero:after{position:absolute;content:"";pointer-events:none;border:1px solid #ffffff12;border-radius:50%}
        .home-hero:before{width:560px;height:560px;right:-95px;top:-330px}
        .home-hero:after{width:420px;height:420px;right:28px;top:-258px}
        .home-hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);align-items:center;gap:64px;padding-block:82px 76px}
        .home-kicker{display:inline-flex;align-items:center;gap:9px;border:1px solid #ffffff25;border-radius:999px;background:#ffffff0d;padding:8px 12px;color:#d8ddff;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
        .home-kicker:before{width:7px;height:7px;border-radius:50%;background:#a5f3d0;content:""}
        .home-title{max-width:690px;margin:22px 0 16px;font-size:clamp(42px,6.4vw,72px);font-weight:800;line-height:.99;letter-spacing:-.065em}
        .home-title span{color:#aeb8ff}
        .home-lead{max-width:570px;margin:0;color:#d3daee;font-size:17px;line-height:1.75}
        .home-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:28px}
        .home-cta{display:inline-flex;min-height:48px;align-items:center;justify-content:center;gap:10px;border:1px solid transparent;border-radius:11px;background:#fff;padding:0 19px;color:#202b59;font-size:14px;font-weight:750;transition:transform .18s,box-shadow .18s}
        .home-cta:hover{transform:translateY(-2px);box-shadow:0 10px 26px #060c2340}
        .home-cta--quiet{border-color:#ffffff35;background:#ffffff0b;color:#fff}
        .home-cta-arrow{font-size:18px;line-height:1}
        .home-proof{display:flex;flex-wrap:wrap;gap:16px 24px;margin-top:25px;color:#d7def3;font-size:13px}
        .home-proof span:before{margin-right:7px;color:#8cf0c0;content:"✓";font-weight:800}
        .home-showcase{border:1px solid #ffffff25;border-radius:22px;background:linear-gradient(145deg,#ffffff16,#ffffff09);padding:20px;box-shadow:0 24px 70px #080e2b45;backdrop-filter:blur(12px)}
        .home-showcase-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 2px 16px}
        .home-showcase-title{font-size:14px;font-weight:750}
        .home-showcase-count{border-radius:999px;background:#ffffff18;padding:6px 9px;color:#dce2ff;font-size:11px}
        .home-mini-tool{display:flex;align-items:center;gap:13px;margin-top:10px;border:1px solid #ffffff16;border-radius:13px;background:#ffffff0b;padding:13px;color:#fff;transition:background .18s,transform .18s}
        .home-mini-tool:hover{transform:translateX(3px);background:#ffffff16}
        .home-tool-badge{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border-radius:12px;background:#ffffff17;color:#cdd4ff;font-size:12px;font-weight:800}
        .home-mini-copy{min-width:0;flex:1}
        .home-mini-copy strong{display:block;font-size:13px}
        .home-mini-copy small{display:block;margin-top:3px;overflow:hidden;color:#c2cbe2;font-size:11px;text-overflow:ellipsis;white-space:nowrap}
        .home-mini-arrow{color:#c2caff;font-size:19px}
        .home-section{padding-top:66px}
        .home-section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:22px}
        .home-section-title{margin:8px 0 0;font-size:clamp(26px,3vw,36px);font-weight:800;letter-spacing:-.045em}
        .home-section-copy{max-width:500px;margin:9px 0 0;color:var(--home-muted);font-size:14px;line-height:1.65}
        .home-text-link{display:inline-flex;align-items:center;gap:8px;color:#414fd2;font-size:14px;font-weight:750;white-space:nowrap}
        .home-text-link:hover{text-decoration:underline;text-underline-offset:4px}
        .home-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}
        .home-tool-card{display:flex;min-height:205px;flex-direction:column;border:1px solid var(--home-line);border-radius:17px;background:#fff;padding:19px;box-shadow:0 5px 18px #1b2c4b08;transition:transform .18s,border-color .18s,box-shadow .18s}
        .home-tool-card:hover{transform:translateY(-4px);border-color:#c7cbff;box-shadow:0 16px 30px #1b2c4b12}
        .home-tool-card-top{display:flex;align-items:center;justify-content:space-between}
        .home-tool-card .home-tool-badge{background:#eef0ff;color:#4855d3}
        .home-tool-open{color:#9099ad;font-size:19px}
        .home-tool-card h3{margin:17px 0 6px;font-size:16px;font-weight:800;letter-spacing:-.025em}
        .home-tool-card p{margin:0;color:var(--home-muted);font-size:13px;line-height:1.55}
        .home-card-action{margin-top:auto;padding-top:15px;color:#4654d7;font-size:12px;font-weight:750}
        .home-benefits{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .home-benefit{border:1px solid var(--home-line);border-radius:16px;background:#fff;padding:22px}
        .home-benefit-icon{display:grid;width:40px;height:40px;place-items:center;border-radius:12px;background:#eff0ff;color:#4855d3;font-size:16px;font-weight:800}
        .home-benefit h3{margin:16px 0 7px;font-size:16px;font-weight:800}
        .home-benefit p{margin:0;color:var(--home-muted);font-size:13px;line-height:1.65}
        .home-bottom-cta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:66px;border:1px solid #dfe3ff;border-radius:20px;background:linear-gradient(110deg,#f1f2ff,#fafaff);padding:30px}
        .home-bottom-cta h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.04em}
        .home-bottom-cta p{margin:7px 0 0;color:var(--home-muted);font-size:14px}
        @media(max-width:900px){.home-hero-inner{grid-template-columns:minmax(0,1fr) minmax(250px,.75fr);gap:28px;padding-block:65px}.home-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:650px){.home-wrap{width:min(100% - 32px,520px)}.home-hero-inner{grid-template-columns:1fr;gap:30px;padding-block:52px}.home-title{font-size:clamp(43px,12vw,60px)}.home-lead{font-size:15px}.home-showcase{max-width:480px}.home-section{padding-top:48px}.home-section-head{align-items:flex-start;flex-direction:column;gap:12px}.home-tool-grid,.home-benefits{grid-template-columns:1fr}.home-tool-card{min-height:175px}.home-bottom-cta{align-items:flex-start;flex-direction:column;margin-top:48px;padding:22px}}
        @media(prefers-reduced-motion:reduce){.home-page *{scroll-behavior:auto!important;transition:none!important}}
    </style>

    <div class="home-page">
        <section class="home-hero">
            <div class="home-wrap home-hero-inner">
                <div>
                    <div class="home-kicker">A simpler way to get things done</div>
                    <h1 class="home-title">Everyday tasks.<br><span>Done in a few clicks.</span></h1>
                    <p class="home-lead">Practical tools for PDFs, images, text and more. Get straight to what you need—with many tasks handled right in your browser.</p>
                    <div class="home-actions">
                        <a class="home-cta" href="{{ route('tools.index') }}">Explore all tools <span class="home-cta-arrow" aria-hidden="true">→</span></a>
                        <a class="home-cta home-cta--quiet" href="#popular-tools">See what you can do</a>
                    </div>
                    <div class="home-proof" aria-label="Key benefits">
                        <span>Free to use</span>
                        <span>No account needed for tools</span>
                    </div>
                </div>
                <aside class="home-showcase" aria-label="Popular tools">
                    <div class="home-showcase-head">
                        <span class="home-showcase-title">A few favorites</span>
                        <span class="home-showcase-count">{{ count($allTools) }} tools to explore</span>
                    </div>
                    @foreach ($featuredTools as $slug => $tool)
                        <a class="home-mini-tool" href="{{ route('tools.show', ['tool' => $slug]) }}">
                            <span class="home-tool-badge" aria-hidden="true">{{ $toolBadges[$slug] }}</span>
                            <span class="home-mini-copy">
                                <strong>{{ $tool['name'] }}</strong>
                                <small>{{ $tool['description'] }}</small>
                            </span>
                            <span class="home-mini-arrow" aria-hidden="true">›</span>
                        </a>
                    @endforeach
                </aside>
            </div>
        </section>

        <div class="home-wrap">
            <section class="home-section" id="popular-tools" aria-labelledby="popular-tools-title">
                <div class="home-section-head">
                    <div>
                        <div class="eyebrow">Get started</div>
                        <h2 class="home-section-title" id="popular-tools-title">The right tool, right when you need it.</h2>
                        <p class="home-section-copy">Skip the complicated setup. Pick a tool and get on with your day.</p>
                    </div>
                    <a class="home-text-link" href="{{ route('tools.index') }}">Browse all {{ count($allTools) }} tools <span aria-hidden="true">→</span></a>
                </div>
                <div class="home-tool-grid">
                    @foreach ($featuredTools as $slug => $tool)
                        <a class="home-tool-card" href="{{ route('tools.show', ['tool' => $slug]) }}">
                            <span class="home-tool-card-top">
                                <span class="home-tool-badge" aria-hidden="true">{{ $toolBadges[$slug] }}</span>
                                <span class="home-tool-open" aria-hidden="true">↗</span>
                            </span>
                            <h3>{{ $tool['name'] }}</h3>
                            <p>{{ $tool['description'] }}</p>
                            <span class="home-card-action">Open tool <span aria-hidden="true">→</span></span>
                        </a>
                    @endforeach
                </div>
            </section>

            <section class="home-section" aria-labelledby="benefits-title">
                <div class="home-section-head">
                    <div>
                        <div class="eyebrow">Made for real life</div>
                        <h2 class="home-section-title" id="benefits-title">Useful by design.</h2>
                    </div>
                </div>
                <div class="home-benefits">
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">01</span>
                        <h3>Privacy comes first</h3>
                        <p>Browser-based tools process your files on your device, so those files aren't uploaded to our servers.</p>
                    </article>
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">02</span>
                        <h3>No account roadblock</h3>
                        <p>Open a tool and start. You don't need to register just to use the everyday utilities.</p>
                    </article>
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">03</span>
                        <h3>One place, many answers</h3>
                        <p>{{ count($categories) }} practical categories bring PDF, image, text, calculator and developer tools together.</p>
                    </article>
                </div>
            </section>

            <section class="home-bottom-cta" aria-label="Explore the tool library">
                <div>
                    <h2>Ready to make your next task easier?</h2>
                    <p>Find a useful tool and get started in seconds.</p>
                </div>
                <a class="btn" href="{{ route('tools.index') }}">Find your tool <span aria-hidden="true">→</span></a>
            </section>
        </div>
    </div>
@endsection
