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
        Schema::create('custom_content_slides', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('badge')->nullable(); // e.g. "Operational Notice", "Cleaning Roster", "Room 402 Notice"

            // Predefined layout architecture
            // blank, title_table, bulletin, two_column, image_text, qr_instructions, full_image
            $table->string('layout')->default('title_table');
            $table->string('theme')->default('slate-clean'); // slate-clean, navy-professional, emerald-accent, amber-warm, ruby-urgent, dark-modern
            $table->string('header_alignment')->default('left'); // left, center

            // Structured content slots and blocks stored as JSON
            // E.g. slots: { "main": [ {...block...} ], "sidebar": [ {...block...} ] } or blocks: [ {...} ]
            $table->json('content_blocks')->nullable();

            // Media support (for image/full image/supporting assets)
            $table->string('primary_image_path')->nullable();
            $table->string('primary_image_fit')->default('cover'); // cover, contain, fill
            $table->string('qr_url')->nullable();
            $table->string('qr_label')->nullable();

            // Display & TV configuration
            $table->integer('duration_seconds')->default(20);
            $table->string('playlist')->default('Main Entrance Displays'); // target playlist
            $table->string('target_display_id')->nullable(); // specific TV device or 'all'
            $table->integer('priority')->default(1); // 1 = normal, 2 = high, 3 = critical takeover
            $table->boolean('fullscreen_takeover')->default(false);

            // Schedule & Auto-Expiration
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->boolean('auto_expire')->default(true); // automatically disappear when end_at passed

            // Status: draft, scheduled, published, expired, archived
            $table->string('status')->default('published');

            // Authorship & History
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_content_slides');
    }
};
