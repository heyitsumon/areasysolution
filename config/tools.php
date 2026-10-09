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
            'description' => 'Format and transform everyday text.',
        ],
        'calculators' => [
            'name' => 'Calculators',
            'description' => 'Useful everyday calculators for percentages, health, age, tips and loans.',
        ],
        'developer-tools' => [
            'name' => 'Developer Tools',
            'description' => 'Fast utilities for common developer tasks.',
        ],
    ],

    'tools' => [
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
        'word-counter' => [
            'name' => 'Word Counter',
            'description' => 'Count words, characters and reading time as you type.',
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
        'percentage-calculator' => [
            'name' => 'Percentage Calculator',
            'description' => 'Calculate percentages, find what percent one number is of another, and compare percentage change.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'bmi-calculator' => [
            'name' => 'BMI Calculator',
            'description' => 'Calculate body mass index from your weight and height using metric units.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'age-calculator' => [
            'name' => 'Age Calculator',
            'description' => 'Calculate your exact age in years, months and days on any date.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'tip-calculator' => [
            'name' => 'Tip Calculator',
            'description' => 'Calculate a tip, the total bill and an even per-person split.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'loan-calculator' => [
            'name' => 'Loan Payment Calculator',
            'description' => 'Estimate monthly payments, total repayment and interest for a fixed-rate loan.',
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
        'gpa-calculator' => [
            'name' => 'GPA Calculator',
            'description' => 'Calculate a semester or cumulative GPA from course credits and grades.',
            'category' => 'calculators',
            'accepts' => [],
            'multiple' => false,
        ],
        'case-converter' => [
            'name' => 'Case Converter',
            'description' => 'Convert text between common letter-case styles.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'slug-generator' => [
            'name' => 'Slug Generator',
            'description' => 'Create clean, readable URL slugs from text.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'text-formatter' => [
            'name' => 'Text Formatter',
            'description' => 'Clean and reshape text with common formatting actions.',
            'category' => 'text-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'json-formatter' => [
            'name' => 'JSON Formatter',
            'description' => 'Validate, format or minify JSON in your browser.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'base64-encoder' => [
            'name' => 'Base64 Encoder & Decoder',
            'description' => 'Encode or decode Base64 text and data URIs.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'url-encoder' => [
            'name' => 'URL Encoder & Decoder',
            'description' => 'Encode and decode URL components.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'uuid-generator' => [
            'name' => 'UUID Generator',
            'description' => 'Generate cryptographically secure UUID v4 identifiers.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
        'qr-code-generator' => [
            'name' => 'QR Code Generator',
            'description' => 'Create downloadable QR codes for links, text, Wi-Fi and contact details.',
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
            'description' => 'Convert CSV tables to JSON and JSON records back to CSV.',
            'category' => 'developer-tools',
            'accepts' => [],
            'multiple' => false,
        ],
    ],
];
