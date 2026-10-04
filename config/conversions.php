<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Server-side conversion pipeline
|--------------------------------------------------------------------------
|
| Only used by tools marked `engine => 'server'` in config/tools.php. Every
| client-side tool (the entire catalog shipped today) bypasses this file
| completely, which is why the site stays fast and cheap under load.
|
| Design notes for scale:
|
| * Jobs run on their own queue so a 90-second document never delays a
|   user-facing web request or another user's 2-second job.
| * Files are written to object storage, and downloads are served through
|   short-lived signed URLs straight from the bucket, so file bytes never
|   pass through PHP.
| * Every object carries an expiry, and a scheduled sweep deletes the storage
|   object and the row together.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Storage
    |--------------------------------------------------------------------------
    | Use "local" for development, "s3" (or any S3-compatible service such as
    | Cloudflare R2 or DigitalOcean Spaces) in production. Serving from object
    | storage removes the app servers from the download path entirely.
    */

    'disk' => env('CONVERSIONS_DISK', 'local'),

    'path_prefix' => env('CONVERSIONS_PATH_PREFIX', 'conversions'),

    /*
    |--------------------------------------------------------------------------
    | Queue
    |--------------------------------------------------------------------------
    */

    'queue' => env('CONVERSIONS_QUEUE', 'conversions'),

    'tries' => (int) env('CONVERSIONS_TRIES', 1),

    'timeout' => (int) env('CONVERSIONS_TIMEOUT', 300),

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    | Shorter retention means less storage cost and a smaller privacy surface.
    | 30 minutes is plenty for a visitor to collect their download.
    */

    'ttl_minutes' => (int) env('CONVERSIONS_TTL', 30),

    'prune_after_hours' => (int) env('CONVERSIONS_PRUNE_AFTER', 24),

    /*
    |--------------------------------------------------------------------------
    | Input limits
    |--------------------------------------------------------------------------
    */

    'max_input_megabytes' => (int) env('CONVERSIONS_MAX_INPUT_MB', 100),

    /*
    |--------------------------------------------------------------------------
    | Signing key for download links
    |--------------------------------------------------------------------------
    | Download URLs are signed so a guessable path cannot be used to fetch
    | somebody else's document. The number of minutes is intentionally short.
    */

    'download_url_ttl_minutes' => (int) env('CONVERSIONS_URL_TTL', 15),

    /*
    |--------------------------------------------------------------------------
    | Binaries and drivers
    |--------------------------------------------------------------------------
    | Driver availability is probed with the executable finder, so a machine
    | without LibreOffice or ImageMagick installed degrades gracefully with a
    | clear 503 instead of a fatal error.
    */

    'binaries' => [
        'libreoffice' => env('CONVERSIONS_SOFFICE_BIN', 'soffice'),
        'imagemagick' => env('CONVERSIONS_IMAGEMAGICK_BIN', 'magick'),
        'ghostscript' => env('CONVERSIONS_GS_BIN', 'gs'),
    ],

    'drivers' => [
        'libreoffice' => App\Services\Conversions\Drivers\LibreOfficeDriver::class,
        'imagemagick' => App\Services\Conversions\Drivers\ImageMagickDriver::class,
        'ghostscript' => App\Services\Conversions\Drivers\GhostscriptDriver::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Tool to driver mapping
    |--------------------------------------------------------------------------
    | Add an entry here for any catalog tool with `engine => 'server'`.
    */

    'tools' => [
        'pdf-to-word' => [
            'driver' => env('CONVERSIONS_PDF_TO_WORD_DRIVER', 'libreoffice'),
            'output' => 'docx',
            'output_mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        'pdf-to-jpg' => [
            'driver' => env('CONVERSIONS_PDF_TO_JPG_DRIVER', 'ghostscript'),
            'output' => 'jpg',
            'output_mime' => 'image/jpeg',
        ],
        'compress-pdf' => [
            'driver' => env('CONVERSIONS_COMPRESS_PDF_DRIVER', 'ghostscript'),
            'output' => 'pdf',
            'output_mime' => 'application/pdf',
        ],
        'merge-pdf' => [
            'driver' => env('CONVERSIONS_MERGE_PDF_DRIVER', 'ghostscript'),
            'output' => 'pdf',
            'output_mime' => 'application/pdf',
        ],
    ],

];
