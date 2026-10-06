<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unique_site_visitors', function (Blueprint $table) {
            $table->string('visitor_hash', 64)->primary();
            $table->timestamp('first_seen_at')->index();
            $table->timestamp('last_seen_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unique_site_visitors');
    }
};
