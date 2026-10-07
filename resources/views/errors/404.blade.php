@extends('layouts.app', [
    'title' => 'Page not found',
    'description' => 'The page you are looking for could not be found. Browse the available tools or return to the homepage.',
])

@section('content')
    <section class="not-found" aria-labelledby="not-found-title">
        <div class="not-found-art" aria-hidden="true">
            <span class="not-found-orbit not-found-orbit-one"></span>
            <span class="not-found-orbit not-found-orbit-two"></span>
            <span class="not-found-star not-found-star-one">✦</span>
            <span class="not-found-star not-found-star-two">✧</span>
            <span class="not-found-code">404</span>
        </div>
        <div class="not-found-copy">
            <p class="eyebrow">Well, this is unexpected</p>
            <h1 id="not-found-title">This page took a wrong turn.</h1>
            <p>We can’t find the page you’re looking for. It may have moved, or the address may be incorrect.</p>
            <div class="not-found-actions">
                <a class="btn" href="{{ route('home') }}">Back to home</a>
                <a class="btn secondary" href="{{ route('tools.index') }}">Explore all tools</a>
            </div>
        </div>
    </section>

    <style>
        .not-found{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:32px;max-width:900px;min-height:480px;margin:0 auto}
        .not-found-art{position:relative;display:grid;min-height:320px;place-items:center;overflow:hidden;border:1px solid #e5e9f5;border-radius:28px;background:radial-gradient(ellipse at center,#eef0ff 0%,#f9faff 62%,#fff 100%)}
        .not-found-code{position:relative;z-index:1;color:#4658df;font-size:clamp(92px,18vw,156px);font-weight:900;letter-spacing:-.1em;line-height:1;text-shadow:0 16px 42px #4658df24;animation:not-found-float 4s ease-in-out infinite}
        .not-found-orbit{position:absolute;width:230px;height:230px;border:1px solid #7280ee35;border-radius:50%;animation:not-found-spin 18s linear infinite}
        .not-found-orbit:after{position:absolute;top:34px;right:25px;width:12px;height:12px;border-radius:50%;background:#7681ef;box-shadow:0 0 0 7px #7681ef18;content:""}
        .not-found-orbit-two{width:300px;height:300px;border-color:#7280ee20;animation-direction:reverse;animation-duration:26s}
        .not-found-orbit-two:after{top:auto;right:auto;bottom:32px;left:40px;width:8px;height:8px;background:#a5e6ce;box-shadow:0 0 0 6px #a5e6ce25}
        .not-found-star{position:absolute;color:#7180ee;font-size:22px;animation:not-found-twinkle 2.4s ease-in-out infinite}
        .not-found-star-one{top:22%;left:20%}
        .not-found-star-two{right:18%;bottom:20%;animation-delay:.8s}
        .not-found-copy h1{margin-top:10px;font-size:clamp(34px,5vw,52px)}
        .not-found-copy>p:not(.eyebrow){max-width:430px;font-size:16px}
        .not-found-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
        .not-found-actions .btn{min-height:46px}
        @keyframes not-found-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes not-found-spin{to{transform:rotate(360deg)}}
        @keyframes not-found-twinkle{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
        @media(max-width:700px){.not-found{grid-template-columns:minmax(0,1fr);gap:22px;min-height:0;padding:12px 0 28px}.not-found-art{min-height:250px}.not-found-orbit{width:190px;height:190px}.not-found-orbit-two{width:250px;height:250px}.not-found-copy{text-align:center}.not-found-copy>p:not(.eyebrow){margin-right:auto;margin-left:auto}.not-found-actions{justify-content:center}}
        @media(max-width:400px){.not-found-art{min-height:215px}.not-found-actions{flex-direction:column}.not-found-actions .btn{width:100%}}
        @media(prefers-reduced-motion:reduce){.not-found-code,.not-found-orbit,.not-found-star{animation:none}}
    </style>
@endsection
