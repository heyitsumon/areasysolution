<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_visitors', function (Blueprint $table) {
            $table->string('visitor_hash', 64)->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('last_seen_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_visitors');
    }
};
