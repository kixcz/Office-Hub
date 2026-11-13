<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Loading Versions (Snapshots, status, version number)
        if (! Schema::hasTable('loading_versions')) {
            Schema::create('loading_versions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
                $table->foreignId('college_id')->nullable()->constrained('colleges')->nullOnDelete();
                $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
                $table->string('version_code')->default('v1');
                $table->string('title')->nullable();
                $table->string('status')->default('Draft Loading'); // Draft Loading, For Program Head Review, For Dean Review, Approved and Published, Finalized and Locked
                $table->json('metrics')->nullable(); // total_faculty, total_offerings, conflicts, load_balance
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('locked_at')->nullable();
                $table->timestamps();
            });
        }

        // 2. Special Course Assignment Rules (Exclusive, Fixed, All-sections, Preferred)
        if (! Schema::hasTable('course_assignment_rules')) {
            Schema::create('course_assignment_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
                $table->foreignId('college_id')->nullable()->constrained('colleges')->nullOnDelete();
                $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
                $table->string('course_code');
                $table->string('course_title')->nullable();
                $table->string('section')->nullable(); // null means all sections
                $table->foreignId('designated_faculty_id')->nullable()->constrained('faculties')->cascadeOnDelete();
                $table->string('rule_type')->default('fixed'); // fixed, exclusive, all_sections, preferred
                $table->boolean('is_locked')->default(true);
                $table->text('justification')->nullable();
                $table->string('status')->default('Active'); // Draft, Active, Archived
                $table->foreignId('proposed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 3. Faculty Load Assignments (Specific offering, source, lock status)
        if (! Schema::hasTable('faculty_load_assignments')) {
            Schema::create('faculty_load_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('loading_version_id')->nullable()->constrained('loading_versions')->cascadeOnDelete();
                $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
                $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
                $table->foreignId('room_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();
                $table->string('course_code');
                $table->string('course_title');
                $table->string('section');
                $table->decimal('units', 5, 2)->default(3.0);
                $table->decimal('contact_hours', 5, 2)->default(3.0);
                $table->boolean('is_lab')->default(false);
                $table->string('assignment_source')->default('Manual'); // Manual, CP-SAT, Exclusive, Fixed
                $table->boolean('is_locked')->default(false);
                $table->text('justification')->nullable();
                $table->integer('match_score')->default(95);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_load_assignments');
        Schema::dropIfExists('course_assignment_rules');
        Schema::dropIfExists('loading_versions');
    }
};
