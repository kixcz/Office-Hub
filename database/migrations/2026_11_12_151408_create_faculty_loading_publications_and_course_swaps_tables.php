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
        // 1. Published Faculty Loading Versions
        Schema::create('faculty_loading_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->string('version')->default('v1'); // v1, v2, v3
            $table->string('title'); // e.g., 'Faculty Loading — AY 2026–2027, 1st Semester · Version 1'
            $table->string('status')->default('Published for Faculty Review');
            // Draft, Approved, Published for Faculty Review, Adjustment Window, Final Validation, Locked for Scheduling, Superseded
            $table->dateTime('review_window_opens_at')->nullable();
            $table->dateTime('review_window_closes_at')->nullable();
            $table->foreignId('published_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('published_at')->nullable();
            $table->foreignId('locked_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('locked_at')->nullable();
            $table->text('lock_notes')->nullable();
            $table->timestamps();
        });

        // 2. Faculty Course Change / Swap / Transfer Requests
        Schema::create('faculty_course_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained('faculty_loading_publications')->cascadeOnDelete();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->string('request_type'); // Course Swap, Course Transfer, Request Removal, Request Additional Course
            $table->foreignId('requester_faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('target_faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->foreignId('requester_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();
            $table->foreignId('target_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();
            $table->text('reason');
            $table->string('counterpart_status')->default('Pending'); // Pending, Accepted, Declined
            $table->dateTime('counterpart_responded_at')->nullable();
            $table->boolean('validation_passed')->default(true);
            $table->text('validation_notes')->nullable();
            $table->string('status')->default('Pending Counterpart');
            // Pending Counterpart, Under Program Head Review, Under Dean Review, Approved, Rejected, Cancelled
            $table->foreignId('program_head_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('program_head_decided_at')->nullable();
            $table->text('program_head_notes')->nullable();
            $table->foreignId('dean_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('dean_decided_at')->nullable();
            $table->text('dean_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculty_course_change_requests');
        Schema::dropIfExists('faculty_loading_publications');
    }
};
