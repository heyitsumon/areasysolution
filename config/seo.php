<?php

declare(strict_types=1);

return [
    'site_url' => rtrim((string) env('SEO_SITE_URL', env('APP_URL', 'http://localhost')), '/'),
];
