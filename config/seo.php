<?php

declare(strict_types=1);

return [
    'site_url' => rtrim((string) env('SEO_SITE_URL', env('APP_URL', 'http://localhost')), '/'),
    'google_analytics_id' => (string) env('GOOGLE_ANALYTICS_ID', 'G-CG5XVSPJ9L'),
];
