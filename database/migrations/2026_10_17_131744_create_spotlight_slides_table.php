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
        Schema::create('spotlight_slides', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // award, achievement, birthday, publication, certification, promotion, research, extension, welcome, farewell, custom
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('honoree_name')->nullable();
            $table->string('honoree_title')->nullable();
            $table->string('program_or_department')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('headline');
            $table->text('message');
            $table->string('event_title')->nullable();
            $table->string('awarding_organization')->nullable();
            $table->date('event_date')->nullable();
            $table->string('template')->default('award'); // award, achievement, birthday, publication, certification, promotion, research, extension, welcome, farewell, custom
            $table->string('background_style')->default('royal-gold'); // royal-gold, midnight-prestige, velvet-maroon, emerald-excellence, modern-cyber, celebration-spark, vibrant-gradient, clean-minimal
            $table->string('accent_style')->default('gold'); // gold, amber, blue, emerald, purple, ruby
            $table->string('headline_alignment')->default('left'); // left, center, right
            $table->string('text_size')->default('normal'); // compact, normal, large
            $table->integer('display_duration')->default(20); // 15 to 45 seconds
            $table->string('transition')->default('zoom-fade'); // zoom-fade, slide-up, elegant-fade, flip-glow
            $table->string('layout_mode')->default('hero-split'); // hero-split, centered-portrait, banner-card, full-bleed
            $table->boolean('fullscreen_takeover')->default(false); // takeover whole screen or appear in normal rotation
            $table->string('playlist')->default('Main TV Rotation');
            $table->integer('priority')->default(1); // 1 = normal, 2 = high (every 3rd slide), 3 = critical takeover
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->string('status')->default('draft'); // draft, published, archived
            $table->string('evidence_path')->nullable();
            $table->string('evidence_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spotlight_slides');
    }
};
