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
        Schema::create('zetware_resolutions', function (Blueprint $table) {
            $table->id();
            $table->string('value', 64)->unique(); // e.g. '_1920x1038' or '1920x1038'
            $table->string('raw_suffix', 64)->nullable(); // '_1920x1038'
            $table->string('badge', 32)->nullable(); // '1080p', '720p', '4K', etc.
            $table->string('label', 64)->nullable(); // '1080p (FHD)'
            $table->unsignedInteger('width')->nullable(); // 1920
            $table->unsignedInteger('height')->nullable(); // 1038
            $table->string('aspect_ratio', 32)->nullable(); // '2.39:1', '16:9', etc.
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zetware_resolutions');
    }
};
