<?php

declare(strict_types=1);

namespace App\Support\Seo;

final class ToolSeoContent
{
    /**
     * @param array{name: string, description: string, category: string} $tool
     * @return array{
     *     how_to: array<int, array{step: int, title: string, text: string}>,
     *     features: array<int, array{title: string, text: string}>,
     *     faqs: array<int, array{q: string, a: string}>
     * }
     */
    public function forTool(string $slug, array $tool): array
    {
        $name = $tool['name'];
        $desc = $tool['description'];
        $category = (string) ($tool['category'] ?? '');

        $custom = $this->customContent($slug, $name);

        $howTo = $custom['how_to'] ?? [
            [
                'step' => 1,
                'title' => 'Input your data or file',
                'text' => "Select, drag-and-drop, or enter your input into the {$name} interface above.",
            ],
            [
                'step' => 2,
                'title' => 'Adjust your preferences',
                'text' => 'Choose any desired formatting options, quality settings, or calculation inputs.',
            ],
            [
                'step' => 3,
                'title' => 'Review the instant output',
                'text' => 'The output is processed locally in real-time right inside your browser.',
            ],
            [
                'step' => 4,
                'title' => 'Copy or download results',
                'text' => 'One-click copy the result to your clipboard or download the generated file to your device.',
            ],
        ];

        $features = $custom['features'] ?? [
            [
                'title' => '100% Client-Side Privacy',
                'text' => 'Processing runs strictly inside your web browser. Your sensitive files and private inputs are never sent or stored on any remote server.',
            ],
            [
                'title' => 'Instant Real-Time Results',
                'text' => 'Experience lightning-fast speed with zero server queue wait times, powered by modern web technologies.',
            ],
            [
                'title' => 'Free & No Sign-up Required',
                'text' => 'Access the tool immediately without paywalls, subscriptions, or creating an account.',
            ],
            [
                'title' => 'Mobile & Desktop Friendly',
                'text' => 'Designed with a fully responsive layout that works smoothly on smartphones, tablets, laptops, and desktop computers.',
            ],
        ];

        $faqs = $custom['faqs'] ?? [
            [
                'q' => "Is {$name} completely free to use?",
                'a' => "Yes, {$name} is 100% free with no hidden charges, subscription tiers, or usage caps.",
            ],
            [
                'q' => 'Is my data and privacy secure?',
                'a' => 'Yes. All calculations, conversions, and transformations are executed entirely on your client device using browser APIs. None of your data is sent to our servers.',
            ],
            [
                'q' => 'Do I need to install software or browser extensions?',
                'a' => 'No installation is needed. You can use this utility directly in any modern browser including Chrome, Firefox, Safari, Edge, and mobile browsers.',
            ],
            [
                'q' => "How does {$name} work?",
                'a' => "{$name} {$desc} Simply configure your options and get your instant result.",
            ],
        ];

        return [
            'how_to' => $howTo,
            'features' => $features,
            'faqs' => $faqs,
        ];
    }

    /**
     * @return array<string, array{
     *     how_to?: array<int, array{step: int, title: string, text: string}>,
     *     features?: array<int, array{title: string, text: string}>,
     *     faqs?: array<int, array{q: string, a: string}>
     * }>
     */
    private function customContent(string $slug, string $name): array
    {
        $registry = [
            'webp-to-png' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Upload WebP images', 'text' => 'Drop your .webp files or browse from your device. Batch uploads are supported.'],
                    ['step' => 2, 'title' => 'Process conversion', 'text' => 'Click "Convert to PNG" to transform images losslessly while preserving full alpha transparency.'],
                    ['step' => 3, 'title' => 'Download PNG files', 'text' => 'Download individual converted PNG photos or grab all converted images in a single ZIP archive.'],
                ],
                'faqs' => [
                    ['q' => 'Will converting WebP to PNG lose image quality?', 'a' => 'No. PNG is a lossless format, so every pixel and transparency level is preserved exactly as rendered in the WebP source.'],
                    ['q' => 'Can I convert multiple WebP files at once?', 'a' => 'Yes, our batch converter allows you to process multiple WebP files concurrently with a single click.'],
                    ['q' => 'Does this tool preserve transparent backgrounds?', 'a' => 'Yes, transparent pixels and alpha channels are 100% retained.'],
                ],
            ],
            'png-to-webp' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Choose your PNG images', 'text' => 'Drag and drop PNG images into the drop zone.'],
                    ['step' => 2, 'title' => 'Set WebP quality', 'text' => 'Adjust the compression quality slider from 1% to 100% (80-85% is ideal for web performance).'],
                    ['step' => 3, 'title' => 'Convert & save', 'text' => 'Click "Convert to WebP" to produce modern, lightweight images ready for high-speed websites.'],
                ],
                'faqs' => [
                    ['q' => 'Why should I convert PNG to WebP?', 'a' => 'WebP provides superior lossless and lossy compression, reducing file size by 30% to 80% compared to PNG, which significantly improves website page speed and SEO rankings.'],
                    ['q' => 'Are WebP images supported by modern browsers?', 'a' => 'Yes, WebP is supported by all modern browsers including Chrome, Safari, Edge, and Firefox.'],
                ],
            ],
            'color-picker' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Pick or inspect a color', 'text' => 'Click the color swatch, use the EyeDropper tool to sample any screen pixel, or paste a color code.'],
                    ['step' => 2, 'title' => 'Explore formats & shades', 'text' => 'View instant conversions in HEX, RGB, HSL, HSV, and CMYK formats along with harmonious tints and shades.'],
                    ['step' => 3, 'title' => 'Check accessibility contrast', 'text' => 'Verify WCAG AA and AAA readability contrast ratios against black and white backgrounds.'],
                    ['step' => 4, 'title' => 'Copy with one click', 'text' => 'Click any format badge to copy the code directly to your clipboard for CSS, design, or UI code.'],
                ],
                'faqs' => [
                    ['q' => 'What color formats does this tool support?', 'a' => 'It supports HEX (with alpha), RGB/RGBA, HSL/HSLA, HSV, and CMYK with bi-directional real-time conversion.'],
                    ['q' => 'Does it test WCAG accessibility contrast?', 'a' => 'Yes, it automatically calculates the contrast ratio against dark and light text, showing WCAG AA and AAA pass/fail ratings.'],
                ],
            ],
            'favicon-generator' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Select an image or graphic', 'text' => 'Upload a high-resolution logo, PNG, JPG, or SVG image (square format recommended).'],
                    ['step' => 2, 'title' => 'Generate multi-size favicons', 'text' => 'The generator creates standard 16x16, 32x32, 48x48, 96x96, and 180x180 Apple Touch Icon sizes.'],
                    ['step' => 3, 'title' => 'Download favicon assets & HTML', 'text' => 'Download the generated favicons and copy the ready-to-use HTML link tags for your website <head>.'],
                ],
                'faqs' => [
                    ['q' => 'What favicon sizes are included?', 'a' => 'We generate 16x16 (classic browser tab), 32x32 (retina display), 48x48 (desktop shortcut), and 180x180 (Apple iOS touch icon).'],
                    ['q' => 'How do I add the generated favicon to my website?', 'a' => 'Download the icons to your website public directory and paste the generated <link rel="icon"> tags into your HTML <head> section.'],
                ],
            ],
            'diff-checker' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Paste original and modified text', 'text' => 'Input your original content on the left and the changed version on the right.'],
                    ['step' => 2, 'title' => 'Compare differences', 'text' => 'Review the color-coded comparison showing additions (green), removals (red), and identical lines.'],
                    ['step' => 3, 'title' => 'Inspect diff metrics', 'text' => 'Check exact counts of added, removed, and modified lines and characters.'],
                ],
                'faqs' => [
                    ['q' => 'Can this tool compare code as well as text?', 'a' => 'Yes, it works smoothly with HTML, CSS, JavaScript, JSON, SQL, Python, or ordinary prose and articles.'],
                    ['q' => 'Is my text sent to a server?', 'a' => 'No. All difference algorithms run 100% locally in your browser session for maximum confidentiality.'],
                ],
            ],
            'hash-generator' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Enter text or string', 'text' => 'Type or paste the input string you want to hash.'],
                    ['step' => 2, 'title' => 'View cryptographic hashes', 'text' => 'Instantly generates SHA-256, SHA-512, SHA-384, SHA-1, and MD5 checksum hashes.'],
                    ['step' => 3, 'title' => 'Copy hash checksum', 'text' => 'Click "Copy" next to any hash algorithm in either lowercase or uppercase hexadecimal format.'],
                ],
                'faqs' => [
                    ['q' => 'Is Web Crypto API secure?', 'a' => 'Yes. Hash generation uses your browser’s native crypto.subtle implementation, ensuring cryptographic speed and accuracy without server transmission.'],
                    ['q' => 'Can hashes be reversed back into plain text?', 'a' => 'Cryptographic hash functions are one-way mathematical algorithms designed to be irreversible.'],
                ],
            ],
            'jwt-decoder' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Paste a JWT token', 'text' => 'Paste any JSON Web Token (e.g. eyJhbGciOi...).'],
                    ['step' => 2, 'title' => 'Inspect Header & Claims', 'text' => 'View color-coded JSON formatting of the Header, Payload, expiration date, issued-at time, and audience claims.'],
                    ['step' => 3, 'title' => 'Check token expiration', 'text' => 'Instantly see whether the token is currently active or expired with human-readable timestamps.'],
                ],
                'faqs' => [
                    ['q' => 'Is it safe to paste confidential production JWT tokens?', 'a' => 'Yes! Unlike external decoder services that log requests, this tool decodes JWTs exclusively in your browser memory. Nothing leaves your computer.'],
                    ['q' => 'Does this tool verify token signatures?', 'a' => 'This utility decodes and parses token headers and payload claims client-side. Signature verification requires the private secret key on your server.'],
                ],
            ],
            'compound-interest-calculator' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Enter initial principal', 'text' => 'Type your starting investment or deposit amount.'],
                    ['step' => 2, 'title' => 'Set interest rate & duration', 'text' => 'Provide your expected annual interest rate (%) and investment timeline in years.'],
                    ['step' => 3, 'title' => 'Select compounding frequency', 'text' => 'Choose annually, semi-annually, quarterly, monthly, or daily compounding.'],
                    ['step' => 4, 'title' => 'Analyze growth breakdown', 'text' => 'See your final future balance, total interest earned, and year-by-year accumulation summary.'],
                ],
                'faqs' => [
                    ['q' => 'What is the compound interest formula used?', 'a' => 'The calculator uses A = P(1 + r/n)^(nt), where P is principal, r is annual rate, n is compounding frequency, and t is time in years.'],
                    ['q' => 'Why does compounding frequency matter?', 'a' => 'More frequent compounding (such as monthly or daily) causes interest to earn interest sooner, resulting in higher long-term yields.'],
                ],
            ],
            'meta-tag-generator' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Fill in website details', 'text' => 'Enter your page title, meta description, site URL, and social preview image URL.'],
                    ['step' => 2, 'title' => 'Preview search & social cards', 'text' => 'Check live visual previews of your Google Search snippet, Facebook Open Graph card, and X (Twitter) summary card.'],
                    ['step' => 3, 'title' => 'Copy generated HTML tags', 'text' => 'One-click copy the comprehensive <meta> tag bundle and paste it directly into your website’s <head> section.'],
                ],
                'faqs' => [
                    ['q' => 'What meta tags are generated?', 'a' => 'It produces standard HTML meta tags (title, description, canonical, robots), Open Graph tags (og:title, og:image, og:url, og:type), and Twitter Cards (twitter:card, twitter:title, twitter:image).'],
                    ['q' => 'What is the ideal meta description length for SEO?', 'a' => 'Between 140 and 160 characters. This prevents search engines from truncating your description in search result snippets.'],
                ],
            ],
            'square-footage-calculator' => [
                'faqs' => [
                    ['q' => 'How do I calculate square footage of a room?', 'a' => 'Multiply the length of the room by its width. For example, a room 12 feet long and 10 feet wide is 120 square feet. This calculator converts meters, inches and yards to feet automatically.'],
                    ['q' => 'How many square feet are in a square meter?', 'a' => 'One square meter equals 10.764 square feet. The calculator shows both units side by side for every measurement.'],
                    ['q' => 'How much extra flooring should I buy?', 'a' => 'Buy 10% more material than the measured area to cover cutting waste, pattern matching and future repairs.'],
                ],
            ],
            'bmr-calculator' => [
                'faqs' => [
                    ['q' => 'What is BMR?', 'a' => 'Basal Metabolic Rate (BMR) is the number of calories your body burns at complete rest just to keep your heart, brain and organs working. It accounts for 60-70% of daily energy use.'],
                    ['q' => 'Which formula does this BMR calculator use?', 'a' => 'The Mifflin-St Jeor equation, which the American Dietetic Association considers the most accurate predictive formula for resting energy expenditure in healthy adults.'],
                    ['q' => 'Should I eat below my BMR to lose weight?', 'a' => 'Generally no. A moderate deficit of about 500 calories below your total daily energy expenditure (TDEE) is more sustainable and protects muscle mass.'],
                ],
            ],
            'pregnancy-due-date-calculator' => [
                'faqs' => [
                    ['q' => 'How accurate is this due date calculator?', 'a' => 'The calculator uses Naegele\'s rule (280 days from the first day of your last period), which is the standard clinical estimate. Only about 4% of babies arrive exactly on the due date, so treat it as a guide, and your ultrasound dating may shift it by a few days.'],
                    ['q' => 'What if my cycle is not 28 days?', 'a' => 'Ovulation typically happens 14 days before your next period, so longer cycles push the due date later. Select your average cycle length and the calculator adjusts automatically.'],
                ],
            ],
            'water-intake-calculator' => [
                'faqs' => [
                    ['q' => 'How much water should I drink a day?', 'a' => 'A common evidence-based baseline is about 33 ml per kilogram of body weight, plus extra for exercise (roughly 350 ml per 30 minutes of sweating) and hot weather.'],
                    ['q' => 'Can I drink too much water?', 'a' => 'Yes, extreme intake can dilute blood sodium (hyponatremia). Spread drinking through the day and let thirst guide you rather than forcing large volumes at once.'],
                ],
            ],
            'protein-calculator' => [
                'faqs' => [
                    ['q' => 'How much protein do I need per day?', 'a' => 'Sedentary adults need about 0.8 g per kg of body weight. Regular strength training raises the optimum to 1.6-2.2 g per kg for muscle repair and growth.'],
                    ['q' => 'Is too much protein harmful?', 'a' => 'For healthy people, intakes up to 2.2 g/kg are well studied and safe. People with kidney disease should follow their doctor\'s advice instead.'],
                ],
            ],
            'morse-code-translator' => [
                'faqs' => [
                    ['q' => 'What is Morse code?', 'a' => 'Morse code encodes letters and numbers as sequences of short signals (dots) and long signals (dashes), originally used for telegraphy and still used in amateur radio and aviation beacons.'],
                    ['q' => 'How is SOS written in Morse code?', 'a' => 'SOS is three dots, three dashes, three dots: ... --- ... - usually transmitted as one continuous signal without letter gaps.'],
                ],
            ],
            'caesar-cipher' => [
                'faqs' => [
                    ['q' => 'What is the Caesar cipher?', 'a' => 'One of the oldest encryption methods: each letter is replaced by a letter a fixed number of positions further in the alphabet. Julius Caesar reportedly used a shift of three.'],
                    ['q' => 'What is ROT13?', 'a' => 'ROT13 is the Caesar cipher with a shift of 13. It is its own inverse, so applying it twice restores the original text - commonly used to hide spoilers online.'],
                ],
            ],
            'invoice-generator' => [
                'how_to' => [
                    ['step' => 1, 'title' => 'Enter business & client details', 'text' => 'Fill in your company name, contact info, and recipient details.'],
                    ['step' => 2, 'title' => 'Add items & quantities', 'text' => 'Add itemized products or services with rates, hours, and quantities.'],
                    ['step' => 3, 'title' => 'Apply taxes & discounts', 'text' => 'Set custom sales tax rates, discounts, currency symbols, and invoice due dates.'],
                    ['step' => 4, 'title' => 'Print or save as PDF', 'text' => 'Click "Print / Download PDF" to instantly save your invoice without uploading any files to a server.'],
                ],
                'faqs' => [
                    ['q' => 'Is this Invoice Generator free to use?', 'a' => 'Yes, our online invoice generator is 100% free with no monthly subscription, watermark, or hidden fees.'],
                    ['q' => 'Are my invoices or financial data uploaded to any server?', 'a' => 'No. Everything is generated 100% in your browser. None of your clients, invoice numbers, prices, or company data are ever sent or stored on our servers.'],
                    ['q' => 'Can I download the invoice as a PDF?', 'a' => 'Yes! Click "Print / Download PDF" to save a clean, professional PDF invoice directly using your browser print engine.'],
                    ['q' => 'Can I customize the currency symbol?', 'a' => 'Yes, you can select standard currencies including USD ($), EUR (€), GBP (£), JPY (¥), INR (₹), CAD, AUD, and more.'],
                ],
            ],
        ];

        return $registry[$slug] ?? [];
    }
}

