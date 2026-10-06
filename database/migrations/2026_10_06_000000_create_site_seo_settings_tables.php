<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('site_name', 100);
            $table->string('tagline', 180);
            $table->string('site_url');
            $table->string('default_title', 120);
            $table->string('default_description', 320);
            $table->string('og_image', 2048)->nullable();
            $table->string('twitter_handle', 15)->nullable();
            $table->string('google_site_verification')->nullable();
            $table->string('bing_site_verification')->nullable();
            $table->timestamps();
        });

        Schema::create('page_seo_settings', function (Blueprint $table) {
            $table->string('page_key', 120)->primary();
            $table->string('title', 120);
            $table->string('description', 320);
            $table->string('robots', 32);
            $table->string('og_image', 2048)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_seo_settings');
        Schema::dropIfExists('site_settings');
    }
};
