<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('route_daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('route_key', 180);
            $table->date('metric_date');
            $table->unsignedBigInteger('hits')->default(0);
            $table->unique(['route_key', 'metric_date']);
            $table->index('metric_date');
        });

        Schema::create('active_user_days', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('metric_date');
            $table->primary(['user_id', 'metric_date']);
            $table->index('metric_date');
        });

        Schema::create('tool_daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('tool_slug', 80);
            $table->date('metric_date');
            $table->unsignedBigInteger('completed_runs')->default(0);
            $table->unique(['tool_slug', 'metric_date']);
            $table->index('metric_date');
        });

        Schema::create('tool_user_days', function (Blueprint $table) {
            $table->string('tool_slug', 80);
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('metric_date');
            $table->unique(['tool_slug', 'user_id', 'metric_date']);
            $table->index('metric_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tool_user_days');
        Schema::dropIfExists('tool_daily_metrics');
        Schema::dropIfExists('active_user_days');
        Schema::dropIfExists('route_daily_metrics');
    }
};
