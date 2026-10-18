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
        Schema::table('spotlight_slides', function (Blueprint $table) {
            // Collage style: 2_split, 3_grid, 4_grid, 1_plus_thumbnails, hero_supporting
            $table->string('collage_style')->nullable()->after('layout_mode');
            // Array of uploaded collage photos: [{ url, path, caption, fit, is_primary, order }]
            $table->json('collage_photos')->nullable()->after('group_photo_overlay');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spotlight_slides', function (Blueprint $table) {
            $table->dropColumn(['collage_style', 'collage_photos']);
        });
    }
};
