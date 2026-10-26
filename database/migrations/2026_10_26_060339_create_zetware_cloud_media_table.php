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
        Schema::create('zetware_cloud_media', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tmdb_id')->index();
            $table->string('title');
            $table->enum('type', ['movie', 'series'])->default('movie');
            $table->unsignedInteger('season')->nullable();
            $table->unsignedInteger('episode')->nullable();
            $table->string('folder_name')->nullable();
            $table->string('tag')->nullable();
            $table->string('badge')->nullable();
            $table->text('description')->nullable();
            $table->string('poster_path')->nullable();
            $table->string('backdrop_path')->nullable();
            $table->decimal('vote_average', 3, 1)->nullable();
            $table->string('release_date')->nullable();
            $table->json('streams_data')->nullable(); // Cache of verified resolutions & URLs
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tmdb_id', 'type', 'season', 'episode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zetware_cloud_media');
    }
};
