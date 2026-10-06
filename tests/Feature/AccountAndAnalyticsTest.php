<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Middleware\TrackOnlineVisitor;
use App\Jobs\RecordRouteHit;
use App\Jobs\RecordToolCompletion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

final class AccountAndAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_manage_a_profile(): void
    {
        $this->get(route('auth.register'))->assertOk()->assertSee('Create your account');
        $this->get(route('login'))->assertOk()->assertSee('Sign in');

        $response = $this->post(route('auth.register.store'), [
            'name' => 'Avery User',
            'email' => 'Avery@Example.com',
            'password' => 'safe-password-123',
            'password_confirmation' => 'safe-password-123',
        ]);

        $user = User::query()->where('email', 'avery@example.com')->firstOrFail();

        $response->assertRedirect(route('profile.edit'));
        $this->assertAuthenticatedAs($user);
        $this->assertNotSame('safe-password-123', $user->password);
        $this->get(route('profile.edit'))->assertOk()->assertSee('Your profile');

        $this->put(route('profile.update'), [
            'name' => 'Avery Updated',
            'email' => 'avery@example.com',
            'current_password' => '',
            'password' => '',
            'password_confirmation' => '',
        ])->assertSessionHas('status', 'Profile updated.');

        $this->assertSame('Avery Updated', $user->fresh()->name);

        $this->put(route('profile.update'), [
            'name' => 'Avery Updated',
            'email' => 'avery@example.com',
            'current_password' => 'safe-password-123',
            'password' => 'a-different-safe-password',
            'password_confirmation' => 'a-different-safe-password',
        ])->assertSessionHas('status', 'Profile updated.');

        $this->assertTrue(Hash::check(
            'a-different-safe-password',
            $user->fresh()->password
        ));
    }

    public function test_login_and_logout_rotate_the_authenticated_session(): void
    {
        $user = User::factory()->create(['email' => 'login@example.com']);

        $this->post(route('auth.login.store'), [
            'email' => 'login@example.com',
            'password' => 'password',
        ])->assertRedirect(route('profile.edit'));

        $this->assertAuthenticatedAs($user);

        $this->post(route('auth.logout'))->assertRedirect(route('home'));
        $this->assertGuest();
    }

    public function test_admin_dashboard_is_restricted_and_reports_aggregated_activity(): void
    {
        Queue::fake();
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
        $this->get(route('admin.analytics.data'))->assertRedirect(route('login'));

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin)
            ->get(route('admin.dashboard', ['period' => 'today']))
            ->assertOk()
            ->assertSee('Analytics overview')
            ->assertSee('All registered accounts')
            ->assertSee('data-chart="activity"', false)
            ->assertSee(route('admin.analytics.data', ['period' => 'today']), false)
            ->assertSee('Refresh now');

        $this->actingAs(User::factory()->create())
            ->get(route('admin.dashboard'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.analytics.data'))
            ->assertForbidden();
    }

    public function test_page_views_and_tool_completions_are_queued(): void
    {
        Queue::fake();

        $this->get(route('home'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeaderMissing('X-MyTools-Offline-Cache');
        Queue::assertPushed(RecordRouteHit::class, fn (RecordRouteHit $job): bool => $job->routeKey === 'home');

        $user = User::factory()->create();
        $this->actingAs($user)
            ->postJson(route('analytics.tool-completions.store'), ['tool' => 'image-compressor'])
            ->assertAccepted()
            ->assertJson(['recorded' => true]);

        Queue::assertPushed(RecordToolCompletion::class, fn (RecordToolCompletion $job): bool => (
            $job->toolSlug === 'image-compressor' && $job->userId === $user->id
        ));
    }

    public function test_web_requests_record_online_visitors_with_hashed_session_ids(): void
    {
        Queue::fake();

        $this->get(route('home'))->assertOk();

        $this->assertDatabaseCount('online_visitors', 1);
        $this->assertDatabaseCount('unique_site_visitors', 1);
        $visitor = DB::table('online_visitors')->first();

        $this->assertNotNull($visitor);
        $this->assertMatchesRegularExpression('/\A[a-f0-9]{64}\z/', $visitor->visitor_hash);
        $this->assertNull($visitor->user_id);
        $this->assertGreaterThanOrEqual(now()->subMinute()->timestamp, strtotime($visitor->last_seen_at));
        $this->assertStringContainsString(TrackOnlineVisitor::VISITOR_COOKIE.'=', $this->get(route('tools.index'))->headers->get('Set-Cookie'));
    }

    public function test_unique_visitors_are_counted_once_per_persistent_browser_cookie(): void
    {
        Queue::fake();
        $visitorId = (string) Str::uuid();

        $this->withCookie(TrackOnlineVisitor::VISITOR_COOKIE, $visitorId)
            ->get(route('home'))
            ->assertOk();
        $firstSeenAt = DB::table('unique_site_visitors')->value('first_seen_at');

        $this->withCookie(TrackOnlineVisitor::VISITOR_COOKIE, $visitorId)
            ->get(route('tools.index'))
            ->assertOk();

        $this->assertDatabaseCount('unique_site_visitors', 1);
        $this->assertSame(
            hash_hmac('sha256', strtolower($visitorId), (string) config('app.key')),
            DB::table('unique_site_visitors')->value('visitor_hash')
        );
        $this->assertSame($firstSeenAt, DB::table('unique_site_visitors')->value('first_seen_at'));
    }

    public function test_the_tool_catalog_opens_real_tools_and_rejects_unknown_slugs(): void
    {
        Queue::fake();

        $this->get(route('tools.index'))
            ->assertOk()
            ->assertSee('26 free browser tools')
            ->assertSee('Image Compressor');

        $this->get(route('tools.show', ['tool' => 'qr-code-generator']))
            ->assertOk()
            ->assertSee('QR Code Generator');

        $this->get(route('tools.show', ['tool' => 'split-pdf']))
            ->assertOk()
            ->assertSee('Split PDF');

        $this->get(route('tools.show', ['tool' => 'images-to-pdf']))
            ->assertOk()
            ->assertSee('Images to PDF');

        $this->get(route('tools.show', ['tool' => 'password-generator']))
            ->assertOk()
            ->assertSee('Password Generator');

        $this->get(route('tools.show', ['tool' => 'csv-json-converter']))
            ->assertOk()
            ->assertSee('CSV to JSON Converter');

        $this->withCookie(TrackOnlineVisitor::VISITOR_COOKIE, (string) Str::uuid())
            ->get(route('tools.show', ['tool' => 'json-formatter']))
            ->assertOk()
            ->assertSee('data-tool="json-formatter"', false)
            ->assertSee('name="csrf-token"', false)
            ->assertHeader('X-MyTools-Offline-Cache', 'public');

        $user = User::factory()->create();
        $this->actingAs($user)
            ->get(route('tools.show', ['tool' => 'json-formatter']))
            ->assertOk()
            ->assertHeaderMissing('X-MyTools-Offline-Cache');

        $this->actingAs($user)
            ->get(route('admin.dashboard'))
            ->assertForbidden();

        $this->get('/tools/not-a-real-tool')->assertNotFound();
    }

    public function test_analytics_jobs_aggregate_runs_and_deduplicate_member_days(): void
    {
        $user = User::factory()->create();
        $today = now()->toDateString();

        (new RecordRouteHit('home', $today, $user->id))->handle();
        (new RecordRouteHit('home', $today, $user->id))->handle();
        (new RecordToolCompletion('image-compressor', $today, $user->id))->handle();
        (new RecordToolCompletion('image-compressor', $today, $user->id))->handle();

        $this->assertDatabaseHas('route_daily_metrics', [
            'route_key' => 'home',
            'metric_date' => $today,
            'hits' => 2,
        ]);
        $this->assertDatabaseHas('tool_daily_metrics', [
            'tool_slug' => 'image-compressor',
            'metric_date' => $today,
            'completed_runs' => 2,
        ]);
        $this->assertDatabaseCount('active_user_days', 1);
        $this->assertDatabaseCount('tool_user_days', 1);

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin)
            ->get(route('admin.dashboard', ['period' => 'today']))
            ->assertViewHas('pageViews', fn (array $pageViews): bool => (
                $pageViews['today'] === 2
                && $pageViews['week'] === 2
                && $pageViews['month'] === 2
            ))
            ->assertViewHas('completedRuns', 2)
            ->assertViewHas('activeUsers', 1)
            ->assertViewHas('completedUsers', 1);

        $this->actingAs($admin)
            ->getJson(route('admin.analytics.data', ['period' => 'today']))
            ->assertOk()
            ->assertJsonPath('pageViews.today', 2)
            ->assertJsonPath('onlineStats.visitors', 1)
            ->assertJsonPath('onlineStats.members', 1)
            ->assertJsonPath('totalUniqueVisitors', 1)
            ->assertJsonPath('completedRuns', 2)
            ->assertJsonPath('dailyVisits.13.value', 2)
            ->assertJsonPath('dailyRuns.13.value', 2)
            ->assertJsonPath('topRoutes.0.label', 'home')
            ->assertJsonPath('topTools.0.label', 'image-compressor');
    }

    public function test_tool_completion_slug_is_validated(): void
    {
        Queue::fake();

        $this->postJson(route('analytics.tool-completions.store'), ['tool' => '../secret'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tool');

        Queue::assertNotPushed(RecordToolCompletion::class);

        $this->postJson(route('analytics.tool-completions.store'), ['tool' => 'not-a-configured-tool'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tool');

        Queue::assertNotPushed(RecordToolCompletion::class);
    }
}
