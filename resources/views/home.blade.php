@extends('layouts.app', [
    'title' => 'Free Online Tools for PDF, Images and Text',
    'description' => 'Get more done with free online PDF, image, text, calculator and developer tools. No account needed, with many tools processing files in your browser.',
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
            [
                '@type' => 'CollectionPage',
                'name' => 'Free Online Tools for PDF, Images and Text',
                'description' => 'Browse practical free online tools for PDFs, images, text, calculations and development.',
                'url' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().route('home', absolute: false),
                'isPartOf' => [
                    '@id' => app(\App\Support\Seo\SiteSeo::class)->siteUrl().'#website',
                ],
            ],
        ],
    ],
])

@section('content')
    @php
        $allTools = config('tools.tools', []);
        $categories = config('tools.categories', []);
        $toolCount = count($allTools);
        $categoryCount = count($categories);
        $featuredSlugs = ['image-compressor', 'merge-pdf', 'word-counter', 'qr-code-generator'];
    @endphp

    <style>
        .home-page{--home-ink:#17223b;--home-muted:#64718a;--home-line:#e8ebf2;--home-violet:#5965e8;color:var(--home-ink)}
        .home-page *{box-sizing:border-box}
        .home-wrap{width:min(1160px,100% - 48px);margin-inline:auto}
        .home-hero{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 83% 14%,#5966d955,transparent 31%),linear-gradient(125deg,#111a35 0%,#202c57 57%,#303e90 100%);color:#fff}
        .home-hero:before,.home-hero:after{position:absolute;z-index:-1;border:1px solid #ffffff12;border-radius:50%;content:"";pointer-events:none}
        .home-hero:before{width:620px;height:620px;right:-160px;top:-420px}
        .home-hero:after{width:450px;height:450px;right:-75px;top:-330px}
        .home-hero-inner{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(270px,.75fr);align-items:center;gap:72px;padding-block:84px 80px}
        .home-kicker{display:inline-flex;align-items:center;gap:9px;border:1px solid #ffffff25;border-radius:999px;background:#ffffff0d;padding:8px 12px;color:#dfe3ff;font-size:12px;font-weight:700;letter-spacing:.04em}
        .home-kicker:before{width:7px;height:7px;border-radius:50%;background:#84edbb;box-shadow:0 0 0 4px #84edbb20;content:""}
        .home-title{max-width:700px;margin:22px 0 17px;font-size:clamp(42px,6.3vw,72px);font-weight:820;line-height:1.01;letter-spacing:-.065em}
        .home-title span{color:#abb5ff}
        .home-lead{max-width:590px;margin:0;color:#d3daee;font-size:17px;line-height:1.75}
        .home-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:28px}
        .home-cta{display:inline-flex;min-height:49px;align-items:center;justify-content:center;gap:10px;border:1px solid transparent;border-radius:11px;background:#fff;padding:0 19px;color:#202b59;font-size:14px;font-weight:750;transition:transform .18s,box-shadow .18s}
        .home-cta:hover{transform:translateY(-2px);box-shadow:0 10px 26px #060c2340}
        .home-cta:focus-visible,.home-filter:focus-visible,.home-search:focus-visible,.home-tool-card:focus-visible{outline:3px solid #9fa8ff;outline-offset:3px}
        .home-cta--quiet{border-color:#ffffff35;background:#ffffff0b;color:#fff}
        .home-cta-arrow{font-size:18px;line-height:1}
        .home-proof{display:flex;flex-wrap:wrap;gap:12px 23px;margin-top:25px;color:#d7def3;font-size:13px}
        .home-proof span:before{margin-right:7px;color:#8cf0c0;content:"✓";font-weight:800}
        .home-showcase{border:1px solid #ffffff25;border-radius:22px;background:linear-gradient(145deg,#ffffff16,#ffffff09);padding:21px;box-shadow:0 24px 70px #080e2b45;backdrop-filter:blur(12px)}
        .home-showcase-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:1px 1px 17px}
        .home-showcase-title{font-size:14px;font-weight:750}
        .home-showcase-count{border-radius:999px;background:#ffffff18;padding:6px 9px;color:#dce2ff;font-size:11px;white-space:nowrap}
        .home-mini-tool{display:flex;align-items:center;gap:13px;margin-top:10px;border:1px solid #ffffff16;border-radius:13px;background:#ffffff0b;padding:13px;color:#fff;transition:background .18s,transform .18s}
        .home-mini-tool:hover{transform:translateX(3px);background:#ffffff16}
        .home-mini-badge{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border-radius:12px;background:#ffffff17;color:#cdd4ff;font-size:12px;font-weight:800}
        .home-mini-copy{min-width:0;flex:1}
        .home-mini-copy strong{display:block;font-size:13px}
        .home-mini-copy small{display:block;margin-top:3px;overflow:hidden;color:#c2cbe2;font-size:11px;text-overflow:ellipsis;white-space:nowrap}
        .home-mini-arrow{color:#c2caff;font-size:19px}
        .home-section{padding-top:67px}
        .home-section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:22px}
        .home-section-title{margin:8px 0 0;font-size:clamp(26px,3vw,36px);font-weight:800;letter-spacing:-.045em}
        .home-section-copy{max-width:540px;margin:9px 0 0;color:var(--home-muted);font-size:14px;line-height:1.65}
        .home-eyebrow{color:#5661d8;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
        .home-text-link{display:inline-flex;align-items:center;gap:8px;color:#414fd2;font-size:14px;font-weight:750;white-space:nowrap}
        .home-text-link:hover{text-decoration:underline;text-underline-offset:4px}
        .home-finder{margin-top:-1px;border:1px solid var(--home-line);border-radius:19px;background:#fff;padding:20px;box-shadow:0 8px 28px #1b2c4b08}
        .home-finder-controls{display:flex;align-items:center;gap:16px}
        .home-search-wrap{position:relative;flex:1}
        .home-search-icon{position:absolute;top:50%;left:15px;width:18px;height:18px;transform:translateY(-50%);color:#78839a;pointer-events:none}
        .home-search{width:100%;min-height:48px;border:1px solid #dfe4ef;border-radius:11px;background:#fbfcff;padding:0 15px 0 44px;color:var(--home-ink);font:inherit;font-size:14px}
        .home-search::placeholder{color:#8a95a9}
        .home-result-count{flex:0 0 auto;color:#778297;font-size:12px}
        .home-filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
        .home-filter{min-height:36px;border:1px solid #e4e7f0;border-radius:999px;background:#fff;padding:0 13px;color:#5d6880;font:inherit;font-size:12px;font-weight:650;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
        .home-filter:hover{border-color:#c9cefa;color:#3945c2}
        .home-filter[aria-pressed="true"]{border-color:#505de0;background:#505de0;color:#fff}
        .home-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}
        .home-tool-card{display:flex;min-width:0;min-height:205px;flex-direction:column;border:1px solid var(--home-line);border-radius:16px;background:#fff;padding:18px;box-shadow:0 5px 18px #1b2c4b08;transition:transform .18s,border-color .18s,box-shadow .18s}
        .home-tool-card:hover{transform:translateY(-4px);border-color:#c7cbff;box-shadow:0 16px 30px #1b2c4b12}
        .home-tool-card[hidden]{display:none}
        .home-tool-card-top{display:flex;align-items:center;justify-content:space-between}
        .home-tool-badge{display:grid;width:38px;height:38px;place-items:center;border-radius:11px;background:#eef0ff;color:#4855d3;font-size:11px;font-weight:850;letter-spacing:.02em}
        .home-tool-card[data-category="image-tools"] .home-tool-badge{background:#e9f7f4;color:#13846e}
        .home-tool-card[data-category="text-tools"] .home-tool-badge{background:#fff4e8;color:#b86b1d}
        .home-tool-card[data-category="calculators"] .home-tool-badge{background:#f2edff;color:#7554c9}
        .home-tool-card[data-category="social-media-tools"] .home-tool-badge{background:#fff0f3;color:#c34c72}
        .home-tool-open{color:#9099ad;font-size:18px}
        .home-tool-category{margin-top:16px;color:#78839a;font-size:10px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
        .home-tool-card h3{margin:5px 0 6px;font-size:15px;font-weight:800;letter-spacing:-.025em}
        .home-tool-card p{margin:0;color:var(--home-muted);font-size:12px;line-height:1.55}
        .home-no-results{margin:16px 0 0;border:1px dashed #dfe3ed;border-radius:13px;padding:25px;text-align:center;color:var(--home-muted);font-size:14px}
        .home-no-results[hidden]{display:none}
        .home-benefits{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .home-benefit{border:1px solid var(--home-line);border-radius:16px;background:#fff;padding:22px}
        .home-benefit-icon{display:grid;width:40px;height:40px;place-items:center;border-radius:12px;background:#eff0ff;color:#4855d3;font-size:14px;font-weight:800}
        .home-benefit h3{margin:16px 0 7px;font-size:16px;font-weight:800}
        .home-benefit p{margin:0;color:var(--home-muted);font-size:13px;line-height:1.65}
        .home-bottom-cta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:65px;border:1px solid #dfe3ff;border-radius:20px;background:linear-gradient(110deg,#f1f2ff,#fafaff);padding:30px}
        .home-bottom-cta h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.04em}
        .home-bottom-cta p{margin:7px 0 0;color:var(--home-muted);font-size:14px}
        .home-bottom-cta .btn{gap:8px}
        @media(max-width:900px){.home-hero-inner{grid-template-columns:minmax(0,1fr) minmax(250px,.78fr);gap:32px;padding-block:64px}.home-tool-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:700px){.home-hero-inner{grid-template-columns:1fr;gap:30px;padding-block:54px}.home-title{font-size:clamp(43px,11vw,60px)}.home-lead{font-size:15px}.home-showcase{max-width:520px}.home-section{padding-top:49px}.home-section-head{align-items:flex-start;flex-direction:column;gap:12px}.home-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-benefits{grid-template-columns:1fr}.home-bottom-cta{align-items:flex-start;flex-direction:column;margin-top:49px;padding:23px}}
        @media(max-width:480px){.home-wrap{width:min(100% - 32px,520px)}.home-finder{padding:14px}.home-finder-controls{align-items:flex-start;flex-direction:column;gap:10px}.home-result-count{align-self:flex-end}.home-tool-grid{grid-template-columns:1fr}.home-tool-card{min-height:170px}.home-actions{align-items:stretch;flex-direction:column}.home-cta{width:100%}}
        @media(prefers-reduced-motion:reduce){.home-page *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    </style>

    <div class="home-page">
        <section class="home-hero">
            <div class="home-wrap home-hero-inner">
                <div>
                    <div class="home-kicker">Small tasks, made simple</div>
                    <h1 class="home-title">Get more done.<br><span>Without the busywork.</span></h1>
                    <p class="home-lead">A thoughtful collection of free online tools for PDFs, images, text, calculations and everyday development. Find what you need and get straight to it.</p>
                    <div class="home-actions">
                        <a class="home-cta" href="#tool-finder">Find your tool <span class="home-cta-arrow" aria-hidden="true">→</span></a>
                        <a class="home-cta home-cta--quiet" href="{{ route('tools.index') }}">Browse the full library</a>
                    </div>
                    <div class="home-proof" aria-label="Site benefits">
                        <span>Free to use</span>
                        <span>No account needed</span>
                        <span>Privacy-minded tools</span>
                    </div>
                </div>
                <aside class="home-showcase" aria-label="Popular online tools">
                    <div class="home-showcase-head">
                        <span class="home-showcase-title">Popular starting points</span>
                        <span class="home-showcase-count">{{ $toolCount }} tools</span>
                    </div>
                    @foreach ($featuredSlugs as $slug)
                        @if (isset($allTools[$slug]))
                            @php
                                $tool = $allTools[$slug];
                                $categoryName = $categories[$tool['category']]['name'] ?? 'Online tool';
                            @endphp
                            <a class="home-mini-tool" href="{{ route('tools.show', ['tool' => $slug]) }}">
                                <span class="home-mini-badge" aria-hidden="true">{{ strtoupper(substr($categoryName, 0, 2)) }}</span>
                                <span class="home-mini-copy">
                                    <strong>{{ $tool['name'] }}</strong>
                                    <small>{{ $categoryName }}</small>
                                </span>
                                <span class="home-mini-arrow" aria-hidden="true">›</span>
                            </a>
                        @endif
                    @endforeach
                </aside>
            </div>
        </section>

        <div class="home-wrap">
            <section class="home-section" id="tool-finder" aria-labelledby="tool-finder-title">
                <div class="home-section-head">
                    <div>
                        <div class="home-eyebrow">The tool library</div>
                        <h2 class="home-section-title" id="tool-finder-title">Find the right tool for the job.</h2>
                        <p class="home-section-copy">Search by name or task, or narrow things down by category. Every tool is one click away.</p>
                    </div>
                    <a class="home-text-link" href="{{ route('tools.index') }}">Explore all tools <span aria-hidden="true">→</span></a>
                </div>

                <div class="home-finder">
                    <div class="home-finder-controls">
                        <label class="home-search-wrap">
                            <svg class="home-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" stroke-width="1.8"/>
                                <path d="m16 16 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                            <input class="home-search" type="search" data-tool-search-input placeholder="Try “compress an image” or “word counter”" autocomplete="off" aria-label="Search online tools">
                        </label>
                        <span class="home-result-count" data-tool-result-count aria-live="polite">{{ $toolCount }} tools</span>
                    </div>
                    <div class="home-filters" role="group" aria-label="Filter tools by category">
                        <button class="home-filter" type="button" data-tool-filter="all" aria-pressed="true">All tools</button>
                        @foreach ($categories as $slug => $category)
                            <button class="home-filter" type="button" data-tool-filter="{{ $slug }}" aria-pressed="false">{{ $category['name'] }}</button>
                        @endforeach
                    </div>
                </div>

                <div class="home-tool-grid" data-tool-grid>
                    @foreach ($allTools as $slug => $tool)
                        @php
                            $categorySlug = $tool['category'];
                            $categoryName = $categories[$categorySlug]['name'] ?? 'Online tool';
                            $badge = strtoupper(substr($categoryName, 0, 2));
                        @endphp
                        <a class="home-tool-card" href="{{ route('tools.show', ['tool' => $slug]) }}" data-category="{{ $categorySlug }}" data-search="{{ strtolower($tool['name'].' '.$tool['description'].' '.$categoryName) }}">
                            <span class="home-tool-card-top">
                                <span class="home-tool-badge" aria-hidden="true">{{ $badge }}</span>
                                <span class="home-tool-open" aria-hidden="true">↗</span>
                            </span>
                            <span class="home-tool-category">{{ $categoryName }}</span>
                            <h3>{{ $tool['name'] }}</h3>
                            <p>{{ $tool['description'] }}</p>
                        </a>
                    @endforeach
                </div>
                <p class="home-no-results" data-tool-empty hidden>No matching tools yet. Try another search or choose a different category.</p>
            </section>

            <section class="home-section" aria-labelledby="home-benefits-title">
                <div class="home-section-head">
                    <div>
                        <div class="home-eyebrow">Useful by design</div>
                        <h2 class="home-section-title" id="home-benefits-title">A simpler, more thoughtful toolkit.</h2>
                    </div>
                </div>
                <div class="home-benefits">
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">01</span>
                        <h3>Privacy is part of the experience</h3>
                        <p>Many file tools process your files directly in your browser, so they stay on your device.</p>
                    </article>
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">02</span>
                        <h3>Start without signing up</h3>
                        <p>Open a tool and get going. An account isn't required for everyday utilities.</p>
                    </article>
                    <article class="home-benefit">
                        <span class="home-benefit-icon" aria-hidden="true">03</span>
                        <h3>Everything in one place</h3>
                        <p>Browse {{ $categoryCount }} categories of practical PDF, image, text, calculator and developer tools.</p>
                    </article>
                </div>
            </section>

            <section class="home-bottom-cta" aria-label="Explore the online tool library">
                <div>
                    <h2>Make your next task a little easier.</h2>
                    <p>Find something useful and get started in seconds.</p>
                </div>
                <a class="btn" href="{{ route('tools.index') }}">Explore all tools <span aria-hidden="true">→</span></a>
            </section>
        </div>
    </div>

@endsection
