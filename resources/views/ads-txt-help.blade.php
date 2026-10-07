@extends('layouts.app', [
    'title' => 'AdSense ads.txt status help',
    'description' => 'Understand AdSense ads.txt statuses and follow practical steps to check your file and authorize your publisher account.',
    'canonicalPath' => route('ads-txt.help', absolute: false),
    'structuredData' => [
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => 'Understand AdSense ads.txt statuses',
        'description' => 'A practical guide to the Not found, Authorized, Unauthorized and Not applicable ads.txt statuses in AdSense.',
        'mainEntityOfPage' => route('ads-txt.help'),
    ],
])

@section('content')
    <article class="ads-help">
        <header class="hero">
            <div class="eyebrow">Publisher guide</div>
            <h1>Understand your AdSense ads.txt status</h1>
            <p>Ads.txt is a public text file that lists the sellers authorized to sell a website’s advertising inventory. AdSense checks it to help verify that your publisher account is authorized.</p>
        </header>

        <section class="ads-help-statuses" aria-label="AdSense ads.txt statuses">
            <article class="card ads-help-status">
                <span class="ads-help-label ads-help-label-neutral">Not found</span>
                <h2>No ads.txt file was found</h2>
                <p>Google did not find an ads.txt file at your site’s root when it last crawled the site. Create or upload one only if your AdSense account asks you to.</p>
            </article>
            <article class="card ads-help-status">
                <span class="ads-help-label ads-help-label-good">Authorized</span>
                <h2>Your publisher ID was found</h2>
                <p>The crawled ads.txt file contains an entry that matches your AdSense publisher ID. This is the expected status when ads.txt authorization is required and correctly configured.</p>
            </article>
            <article class="card ads-help-status">
                <span class="ads-help-label ads-help-label-warning">Unauthorized</span>
                <h2>Your publisher ID was not found</h2>
                <p>The file was checked, but Google did not find your publisher ID. AdSense may limit or not show ads until the correct authorized entry is published and recrawled.</p>
            </article>
            <article class="card ads-help-status">
                <span class="ads-help-label ads-help-label-neutral">Not applicable</span>
                <h2>An ads.txt entry is not required</h2>
                <p>Your publisher ID does not need to be listed for this site or setup. You do not need to add an entry just to change this status.</p>
            </article>
        </section>

        <section class="card ads-help-steps" aria-labelledby="ads-help-steps-title">
            <h2 id="ads-help-steps-title">How to check or fix your ads.txt file</h2>
            <ol>
                <li>In AdSense, open the sites or ads.txt notice and copy the publisher ID and instructions shown for your account.</li>
                <li>Check the root URL for your site, such as <code>https://example.com/ads.txt</code>. The file must be publicly accessible without a sign-in or redirect to an unrelated page.</li>
                <li>If AdSense supplies an authorization line, publish that exact line in a plain-text <code>ads.txt</code> file at the site root. Do not copy another publisher’s ID or guess the seller type.</li>
                <li>Open the file URL in a private browser window and confirm it returns the text file successfully. Check spelling, spaces, commas, and that the ID matches the AdSense account you use for this site.</li>
                <li>Return to AdSense and allow time for Google to crawl the change. The status may not update immediately; use the account’s recheck option if available.</li>
            </ol>
            <p class="ads-help-note"><strong>Important:</strong> Only list advertising systems and publisher IDs that are authorized to sell your inventory. Follow the exact instructions in your AdSense account; adding an incorrect line can misrepresent your seller relationships.</p>
            <a class="btn secondary" href="https://support.google.com/adsense/answer/7532444?hl=en" target="_blank" rel="noopener noreferrer">Read Google’s ads.txt guide <span aria-hidden="true">↗</span></a>
        </section>
    </article>

    <style>
        .ads-help{max-width:940px;margin-inline:auto}
        .ads-help .hero{max-width:800px}
        .ads-help-statuses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .ads-help-status{min-width:0}
        .ads-help-status h2{margin:16px 0 8px;font-size:20px}
        .ads-help-status p{margin:0}
        .ads-help-label{display:inline-flex;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:750}
        .ads-help-label-neutral{background:#eef1f7;color:#596579}
        .ads-help-label-good{background:#e6f8ee;color:#187342}
        .ads-help-label-warning{background:#fff1e5;color:#a34c12}
        .ads-help-steps{margin-top:20px}
        .ads-help-steps ol{display:grid;gap:12px;padding-left:22px;color:#536078;line-height:1.7}
        .ads-help-steps li{padding-left:4px}
        .ads-help-steps code{border-radius:5px;background:#f1f3f8;padding:2px 5px;color:#3446a1;font-size:.9em;overflow-wrap:anywhere}
        .ads-help-note{margin:20px 0;padding:14px 16px;border-left:3px solid #5364df;border-radius:0 9px 9px 0;background:#f3f4ff}
        @media(max-width:600px){.ads-help-statuses{grid-template-columns:minmax(0,1fr)}.ads-help-steps ol{padding-left:19px}}
    </style>
@endsection
