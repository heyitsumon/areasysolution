<?php

declare(strict_types=1);

return [
    'site' => [
        'name' => env('TOOLS_SITE_NAME', 'ArEasySolution'),
        'tagline' => 'Free online tools that respect your privacy',
    ],

    'limits' => [
        'max_files_per_run' => (int) env('TOOLS_MAX_FILES', 50),
        'max_total_megabytes' => (int) env('TOOLS_MAX_TOTAL_MB', 500),
    ],

    'cache' => [
        'enabled' => (bool) env('TOOLS_CACHE_PUBLIC', true),
        'browser_max_age' => (int) env('TOOLS_CACHE_BROWSER_TTL', 300),
        'edge_max_age' => (int) env('TOOLS_CACHE_EDGE_TTL', 86400),
        'stale_while_revalidate' => (int) env('TOOLS_CACHE_SWR', 604800),
    ],

    'security' => [
        'headers_enabled' => (bool) env('TOOLS_SECURITY_HEADERS', true),
        'hsts' => (bool) env('TOOLS_HSTS', false),
        'csp' => env(
            'TOOLS_CSP',
            "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; "
            ."frame-ancestors 'none'; img-src 'self' data: blob:; media-src 'self' blob:; "
            ."font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; "
            ."connect-src 'self'; worker-src 'self' blob:"
        ),
    ],

    'categories' => [
        'pdf-tools' => [
            'name' => 'PDF Tools',
            'description' => 'Work with PDF files privately in your browser.',
        ],
        'image-tools' => [
            'name' => 'Image Tools',
            'description' => 'Convert, compress and resize images on your device.',
        ],
        'text-tools' => [
            'name' => 'Text Tools',
            'description' => 'Format, analyze and transform everyday text.',
        ],
        'calculators' => [
            'name' => 'Calculators',
            'description' => 'Fast, accurate everyday financial, math and health calculators.',
        ],
        'developer-tools' => [
            'name' => 'Developer Tools',
            'description' => 'Essential utilities for web developers and programmers.',
        ],
    ],

    'tools' => [
        // --- PDF Tools (5) ---
        'merge-pdf' => [
            'name' => 'Merge PDF',
            'description' => 'Combine PDF files and choose the pages to include.',
            'category' => 'pdf-tools',
            'accepts' => ['application/pdf'],
            'multiple' => true,
        ],
        'compress-pdf' => [
            'name' => 'Compress PDF',
            'description' => 'Reduce PDF size with browser-side compression options.',
            'category' => 'pdf-tools',
            'accepts' => ['application/pdf'],
            'multiple' => true,
        ],
        'pdf-to-jpg' => [
            'name' => 'PDF to JPG',
            'description' => 'Render PDF pages as downloadable JPG images.',
            'category' => 'pdf-tools',
            'accepts' => ['application/pdf'],
            'multiple' => false,
        ],
        'split-pdf' => [
            'name' => 'Split PDF',
            'description' => 'Separate a PDF into individual pages or custom page-range files.',
            'category' => 'pdf-tools',
            'accepts' => ['application/pdf'],
            'multiple' => false,
        ],
        'images-to-pdf' => [
            'name' => 'Images to PDF',
            'description' => 'Combine JPG and PNG images into a single PDF document.',
            'category' => 'pdf-tools',
            'accepts' => ['image/jpeg', 'image/png'],
            'multiple' => true,
        ],

        // --- Image Tools (9) ---
        'image-compressor' => [
            'name' => 'Image Compressor',
            'description' => 'Compress JPEG, PNG and WebP images in batches.',
            'category' => 'image-tools',
            'accepts' => ['image/jpeg', 'image/png', 'image/webp'],
            'multiple' => true,
        ],
        'image-resizer' => [
            'name' => 'Image Resizer',
            'description' => 'Resize images to exact dimensions or fit options.',
            'category' => 'image-tools',
            'accepts' => ['image/jpeg', 'image/png', 'image/webp'],
            'multiple' => true,
        ],
        'jpg-to-png' => [
            'name' => 'JPG to PNG',
            'description' => 'Convert JPG images to PNG format.',
            'category' => 'image-tools',
            'accepts' => ['image/jpeg'],
            'multiple' => true,
        ],
        'png-to-jpg' => [
            'name' => 'PNG to JPG',
            'description' => 'Convert PNG images to JPG with a chosen background color.',
            'category' => 'image-tools',
            'accepts' => ['image/png'],
            'multiple' => true,
        ],
        'webp-to-png' => [
            'name' => 'WebP to PNG',
            'description' => 'Convert WebP images to high-quality PNG format with alpha transparency.',
            'category' => 'image-tools',
            'accepts' => ['image/webp'],
            'multiple' => true,
        ],
        'png-to-webp' => [
            'name' => 'PNG to WebP',
            'description' => 'Convert PNG images to next-gen WebP format for high-speed websites.',
            'category' => 'image-tools',
            'accepts' => ['image/png'],
            'multiple' => true,
        ],
        'svg-to-png' => [
            'name' => 'SVG to PNG',
            'description' => 'Render and convert vector SVG graphics into crisp PNG images at any resolution.',
            'category' => 'image-tools',
            'accepts' => ['image/svg+xml'],
            'multiple' => false,
        ],
        'color-picker' => [
            'name' => 'Color Picker & Palette',
            'description' => 'Pick colors, sample screen pixels, convert HEX, RGB, HSL, CMYK and check contrast.',
            'category' => 'image-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'favicon-generator' => [
            'name' => 'Favicon Generator',
            'description' => 'Generate multi-resolution website favicons and Apple touch icons from images.',
            'category' => 'image-tools',
            'accepts' => ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
            'multiple' => false,
        ],

        // --- Text Tools (11) ---
        'word-counter' => [
            'name' => 'Word Counter',
            'description' => 'Count words, characters, sentences and reading time as you type.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'number-to-words' => [
            'name' => 'Number to Words Converter',
            'description' => 'Convert numbers into clear English words, including decimals and negative values.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'case-converter' => [
            'name' => 'Case Converter',
            'description' => 'Convert text between UPPERCASE, lowercase, Title Case, camelCase and more.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'slug-generator' => [
            'name' => 'Slug Generator',
            'description' => 'Create clean, SEO-friendly URL slugs from text headlines.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'text-formatter' => [
            'name' => 'Text Formatter',
            'description' => 'Clean, trim, and reshape text with common formatting actions.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'lorem-ipsum-generator' => [
            'name' => 'Lorem Ipsum Generator',
            'description' => 'Generate placeholder dummy text by paragraphs, sentences or words.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'diff-checker' => [
            'name' => 'Text Diff Checker',
            'description' => 'Compare two text documents side-by-side to highlight additions and changes.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'markdown-to-html' => [
            'name' => 'Markdown to HTML',
            'description' => 'Convert Markdown text into formatted HTML with live preview.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'html-to-markdown' => [
            'name' => 'HTML to Markdown',
            'description' => 'Convert HTML tags and articles into clean Markdown syntax.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'remove-duplicate-lines' => [
            'name' => 'Remove Duplicate Lines',
            'description' => 'Deduplicate, sort, trim and clean text lists and keywords.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'character-frequency-counter' => [
            'name' => 'Character Frequency Counter',
            'description' => 'Analyze character frequency distribution and letter percentages in any text.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],

        // --- Calculators (13) ---
        'percentage-calculator' => [
            'name' => 'Percentage Calculator',
            'description' => 'Calculate percentages, percentage increase, decrease, and differences.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'bmi-calculator' => [
            'name' => 'BMI Calculator',
            'description' => 'Calculate body mass index and health category using metric units.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'age-calculator' => [
            'name' => 'Age Calculator',
            'description' => 'Calculate exact age in years, months, days and upcoming birthday countdown.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'tip-calculator' => [
            'name' => 'Tip Calculator',
            'description' => 'Calculate tip amount, total bill and per-person split easily.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'loan-calculator' => [
            'name' => 'Loan Payment Calculator',
            'description' => 'Estimate monthly payments, total repayment and interest for fixed-rate loans.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'mixed-number-calculator' => [
            'name' => 'Mixed Numbers Calculator',
            'description' => 'Add, subtract, multiply and divide mixed numbers, fractions, integers and decimals.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'discount-calculator' => [
            'name' => 'Discount Calculator',
            'description' => 'Calculate final sale prices, discount savings and sales tax amounts.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'compound-interest-calculator' => [
            'name' => 'Compound Interest Calculator',
            'description' => 'Calculate investment growth and interest earnings across compounding periods.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'sales-tax-calculator' => [
            'name' => 'Sales Tax Calculator',
            'description' => 'Calculate net price, sales tax amount and gross total with forward/reverse modes.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'gpa-calculator' => [
            'name' => 'GPA Calculator',
            'description' => 'Calculate semester and cumulative Grade Point Average across custom courses.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'calorie-calculator' => [
            'name' => 'Calorie Calculator',
            'description' => 'Calculate daily calorie needs and BMR for weight maintenance, loss or gain.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'date-difference-calculator' => [
            'name' => 'Date Difference Calculator',
            'description' => 'Calculate exact days, weeks, months and weekdays between two calendar dates.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'invoice-generator' => [
            'name' => 'Invoice Generator',
            'description' => 'Create and download professional invoices with instant tax, discount and total calculation without uploading anything.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],

        // --- Developer Tools (14) ---
        'json-formatter' => [
            'name' => 'JSON Formatter',
            'description' => 'Validate, format, indent or minify JSON in your browser.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'base64-encoder' => [
            'name' => 'Base64 Encoder & Decoder',
            'description' => 'Encode or decode Base64 text and binary data URIs.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'url-encoder' => [
            'name' => 'URL Encoder & Decoder',
            'description' => 'Encode and decode URI components and query parameters.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'uuid-generator' => [
            'name' => 'UUID Generator',
            'description' => 'Generate cryptographically secure UUID v4 identifiers in bulk.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'qr-code-generator' => [
            'name' => 'QR Code Generator',
            'description' => 'Create downloadable QR codes for links, text, Wi-Fi and contact cards.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'password-generator' => [
            'name' => 'Password Generator',
            'description' => 'Generate strong random passwords with custom length and character sets.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'csv-json-converter' => [
            'name' => 'CSV to JSON Converter',
            'description' => 'Convert CSV tables to JSON and JSON records back to CSV format.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'hash-generator' => [
            'name' => 'Hash Generator',
            'description' => 'Generate cryptographic SHA-256, SHA-512, SHA-384, SHA-1 and MD5 hashes.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'jwt-decoder' => [
            'name' => 'JWT Decoder',
            'description' => 'Decode and inspect JSON Web Tokens header, payload claims and expiration.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'html-entity-encoder' => [
            'name' => 'HTML Entity Encoder & Decoder',
            'description' => 'Encode special characters into HTML entities or decode entities to characters.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'sql-formatter' => [
            'name' => 'SQL Formatter',
            'description' => 'Format, beautify and indent SQL queries with standard keyword formatting.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'css-minifier' => [
            'name' => 'CSS Minifier',
            'description' => 'Minify and compress CSS stylesheets to reduce file size and bandwidth.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'javascript-minifier' => [
            'name' => 'JavaScript Minifier',
            'description' => 'Minify JavaScript code by stripping comments and unneeded whitespace.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'meta-tag-generator' => [
            'name' => 'Meta Tag Generator',
            'description' => 'Generate SEO, Open Graph and Twitter Card meta tags with live SERP preview.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
    ],
];
