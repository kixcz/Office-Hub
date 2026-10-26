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
        Schema::create('tv_cleaning_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('OFFICE CLEANING SCHEDULE');
            $table->string('subtitle')->default('FACULTY CLEANERS');
            $table->string('scope_badge')->default('CIDS OFFICE AREAS ONLY');
            $table->string('motto_title')->default('A Clean Office, A Brighter CIDS.');
            $table->text('motto_description')->nullable();
            $table->string('week_label')->nullable(); // e.g. "Week of Oct 19 - Oct 23, 2026"
            $table->date('week_start_date')->nullable(); // e.g. 2026-10-19
            $table->json('days_data')->nullable(); // JSON structure holding Monday to Friday rosters
            $table->json('highlights')->nullable(); // 4 pillars: Clean Workspace, Better Collaboration, Healthier Community, A Stronger CIDS
            $table->boolean('is_active')->default(true);
            $table->integer('duration_seconds')->default(25);
            $table->integer('order')->default(12);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tv_cleaning_schedules');
    }
};
