<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->index('created_at', 'users_created_at_idx');
        });

        Schema::table('route_daily_metrics', function (Blueprint $table): void {
            $table->dropIndex('route_daily_metrics_metric_date_index');
            $table->index(['metric_date', 'route_key'], 'route_metrics_date_route_idx');
        });

        Schema::table('tool_daily_metrics', function (Blueprint $table): void {
            $table->dropIndex('tool_daily_metrics_metric_date_index');
            $table->index(['metric_date', 'tool_slug'], 'tool_metrics_date_slug_idx');
        });

        Schema::table('active_user_days', function (Blueprint $table): void {
            $table->dropIndex('active_user_days_metric_date_index');
            $table->index(['metric_date', 'user_id'], 'active_days_date_user_idx');
        });

        Schema::table('tool_user_days', function (Blueprint $table): void {
            $table->dropIndex('tool_user_days_metric_date_index');
            $table->index(['user_id', 'tool_slug', 'metric_date'], 'tool_days_user_tool_date_idx');
            $table->index(['metric_date', 'user_id'], 'tool_days_date_user_idx');
        });

        Schema::table('online_visitors', function (Blueprint $table): void {
            $table->dropIndex('online_visitors_last_seen_at_index');
            $table->index(['last_seen_at', 'user_id'], 'online_visitors_seen_user_idx');
        });

        Schema::table('unique_site_visitors', function (Blueprint $table): void {
            $table->dropIndex('unique_site_visitors_first_seen_at_index');
            $table->dropIndex('unique_site_visitors_last_seen_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('unique_site_visitors', function (Blueprint $table): void {
            $table->index('first_seen_at');
            $table->index('last_seen_at');
        });

        Schema::table('online_visitors', function (Blueprint $table): void {
            $table->dropIndex('online_visitors_seen_user_idx');
            $table->index('last_seen_at');
        });

        Schema::table('tool_user_days', function (Blueprint $table): void {
            $table->dropIndex('tool_days_user_tool_date_idx');
            $table->dropIndex('tool_days_date_user_idx');
            $table->index('metric_date');
        });

        Schema::table('active_user_days', function (Blueprint $table): void {
            $table->dropIndex('active_days_date_user_idx');
            $table->index('metric_date');
        });

        Schema::table('tool_daily_metrics', function (Blueprint $table): void {
            $table->dropIndex('tool_metrics_date_slug_idx');
            $table->index('metric_date');
        });

        Schema::table('route_daily_metrics', function (Blueprint $table): void {
            $table->dropIndex('route_metrics_date_route_idx');
            $table->index('metric_date');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_created_at_idx');
        });
    }
};
