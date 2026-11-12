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
        // 1. Program Loading Review Sessions
        Schema::create('program_loading_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignId('program_head_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('Pending'); // Pending, In Review, Revision Required, Completed
            $table->text('endorsement_notes')->nullable();
            $table->dateTime('endorsed_at')->nullable();
            $table->timestamps();

            $table->unique(['academic_period_id', 'program_id'], 'prog_load_rev_unique');
        });

        // 2. Loading Review Flags & Comments
        Schema::create('loading_review_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->foreignId('room_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reviewer_role')->default('program_head'); // program_head, dean, college_admin
            $table->string('flag_type'); // Specialization Mismatch, Overload, Underload, Excessive Preparations, Preference Conflict, Historical Mismatch, Manual Reassignment
            $table->string('severity')->default('Needs Attention'); // Advisory, Needs Attention, Blocking
            $table->text('comment');
            $table->text('suggested_action')->nullable();
            $table->string('status')->default('Open'); // Open, Under Review, Resolved, Verified
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();
        });

        // 3. College Dean Loading Reviews
        Schema::create('college_loading_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->foreignId('dean_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('Pending'); // Pending, In Review, Revision Requested, Endorsed, Approved
            $table->text('decision_notes')->nullable();
            $table->dateTime('decided_at')->nullable();
            $table->timestamps();

            $table->unique(['academic_period_id', 'college_id'], 'col_load_rev_unique');
        });

        // 4. Loading Audit History
        Schema::create('loading_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // Endorsed, Revision Requested, Flag Created, Flag Resolved, Reassigned, Status Transition, Approved
            $table->string('target_type')->nullable(); // Program, Faculty, Course, Flag
            $table->unsignedBigInteger('target_id')->nullable();
            $table->text('details')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loading_audit_logs');
        Schema::dropIfExists('college_loading_reviews');
        Schema::dropIfExists('loading_review_flags');
        Schema::dropIfExists('program_loading_reviews');
    }
};
