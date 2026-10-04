<?php

declare(strict_types=1);

use App\Models\Conversion;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function (): void {
    $this->comment('Ship the tool, not the ticket.');
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled work
|--------------------------------------------------------------------------
|
| Both tasks are small and idempotent, which is what makes them safe to run on
| several servers at once (they use an atomic cache lock so only one instance
| performs the work).
|
| Why prune in the application instead of relying on an S3 lifecycle rule:
| a lifecycle rule deletes objects but leaves the database rows behind, and
| stale rows are how "expired" downloads keep looking available in the UI.
|
*/

// Removes expired conversion rows plus their stored files.
Schedule::command('model:prune', ['--model' => [Conversion::class]])
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();

// Fails jobs whose worker died mid-run, so polling clients stop waiting and
// the visitor gets an actionable message instead of an eternal spinner.
Schedule::call(function (): void {
    Conversion::query()
        ->stale((int) config('conversions.timeout', 300) / 60 + 5)
        ->update([
            'status' => Conversion::STATUS_FAILED,
            'error' => 'The conversion timed out. Please try again with a smaller file.',
            'finished_at' => now(),
        ]);
})
    ->name('conversions:reap-stale')
    ->everyFiveMinutes()
    ->withoutOverlapping();

