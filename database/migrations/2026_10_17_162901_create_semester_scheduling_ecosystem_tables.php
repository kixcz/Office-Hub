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
        // 1. Curricula Table
        Schema::create('curricula', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('version_name'); // e.g. '2024-Revised CMO 25', '2022 Curriculum'
            $table->string('effective_year')->nullable(); // e.g. '2024'
            $table->integer('total_units')->default(140);
            $table->string('status')->default('Active'); // Active, Draft, Archived
            $table->timestamps();
        });

        // 2. Courses Table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curriculum_id')->nullable()->constrained('curricula')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('code')->index(); // e.g. 'CS 611', 'IT 421'
            $table->string('title'); // e.g. 'Computer Programming I'
            $table->decimal('units', 4, 1)->default(3.0);
            $table->decimal('lecture_hours', 4, 1)->default(2.0);
            $table->decimal('lab_hours', 4, 1)->default(3.0);
            $table->string('room_type_required')->default('Lecture'); // Lecture, Computer Laboratory, Networking Laboratory, Multimedia
            $table->boolean('consecutive_lab_required')->default(true);
            $table->integer('year_level')->default(1);
            $table->string('semester_placement')->default('1st Semester');
            $table->string('category')->default('Major'); // Major, General Education, Elective, Professional
            $table->string('specialization_tag')->nullable(); // Programming, AI, Networking, Database
            $table->timestamps();
        });

        // 3. Sections Table
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('curriculum_id')->nullable()->constrained('curricula')->nullOnDelete();
            $table->string('code')->index(); // e.g. 'BSIT-1A', 'BSIT-2B'
            $table->integer('year_level')->default(1);
            $table->integer('population')->default(35); // Critical for room capacity constraint
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        // 4. Course Offerings Table
        Schema::create('course_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('offering_code')->nullable()->index(); // e.g. 'OFFER-CS611-BSIT1A'
            $table->string('course_code');
            $table->string('course_title');
            $table->string('section_name');
            $table->decimal('units', 4, 1)->default(3.0);
            $table->decimal('lecture_hours', 4, 1)->default(2.0);
            $table->decimal('lab_hours', 4, 1)->default(3.0);
            $table->string('room_type_required')->default('Lecture');
            $table->string('status')->default('Unassigned'); // Unassigned, Loaded, Ready, Scheduled, Published
            $table->boolean('is_locked')->default(false); // Lock during re-optimization
            $table->timestamps();
        });

        // 5. Faculty Specializations & Eligibility
        Schema::create('faculty_specializations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('expertise_area'); // Programming, Artificial Intelligence, Networking, etc.
            $table->string('qualification_level')->default('Approved'); // Primary Expertise, Secondary Expertise, Approved
            $table->string('course_category_match')->nullable();
            $table->boolean('is_verified')->default(true);
            $table->timestamps();
        });

        // 6. Faculty Preferences
        Schema::create('faculty_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->json('preferred_course_ids')->nullable();
            $table->json('preferred_days')->nullable(); // ['Monday', 'Wednesday', 'Friday']
            $table->json('preferred_time_windows')->nullable(); // Morning, Afternoon, Evening
            $table->integer('max_days_per_week')->default(5);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 7. Faculty Credits (Non-Teaching Workload)
        Schema::create('faculty_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->string('category'); // Program Head Designation, Research Participation, Extension, Coordinator
            $table->decimal('credited_units', 4, 1)->default(3.0);
            $table->string('reference_memo')->nullable();
            $table->string('status')->default('Approved'); // Pending, Approved, Void
            $table->timestamps();
        });

        // 8. Schedule Candidates (OR-Tools Outputs)
        Schema::create('schedule_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->string('candidate_code'); // Candidate A, Candidate B, Candidate C
            $table->integer('hard_conflicts_count')->default(0);
            $table->decimal('objective_score', 8, 2)->default(0.0);
            $table->decimal('faculty_preference_satisfaction', 5, 2)->default(0.0); // 0 to 100%
            $table->decimal('avg_faculty_gap_hours', 4, 2)->default(0.0);
            $table->decimal('avg_section_gap_hours', 4, 2)->default(0.0);
            $table->integer('late_classes_count')->default(0);
            $table->decimal('room_utilization_percent', 5, 2)->default(0.0);
            $table->json('solver_metadata')->nullable();
            $table->json('schedule_payload')->nullable(); // Complete timetable matrix snapshot
            $table->string('status')->default('Generated'); // Generated, Under Consultation, Selected, Archived
            $table->timestamps();
        });

        // 9. Schedule Versions (Audit Lifecycle)
        Schema::create('schedule_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('candidate_id')->nullable()->constrained('schedule_candidates')->nullOnDelete();
            $table->string('version_tag'); // 'Draft v1', 'Draft v2', 'Published v1.0', 'Published v2.0'
            $table->string('stage')->default('Draft'); // Draft, Program Review, Dean Review, Final Approval, Published, Superseded
            $table->boolean('is_official_master')->default(false);
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->text('change_summary')->nullable();
            $table->json('metrics_snapshot')->nullable();
            $table->timestamps();
        });

        // 10. Schedule Review Flags & Comments
        Schema::create('schedule_review_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_version_id')->constrained('schedule_versions')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('reviewer_role')->default('program_head'); // program_head, dean, super_admin
            $table->string('target_entity_type')->nullable(); // course_offering, room, faculty, section
            $table->unsignedBigInteger('target_entity_id')->nullable();
            $table->string('category'); // Laboratory Requirement, Consecutive Hours, Gap Reduction, Room Type
            $table->string('severity')->default('Needs Attention'); // Advisory, Needs Attention, Blocking
            $table->text('comment');
            $table->text('suggested_correction')->nullable();
            $table->string('status')->default('Open'); // Open, Acknowledged, Resolution Proposed, Resolved, Verified
            $table->json('llm_structured_constraint')->nullable(); // Gemini proposed rule translation
            $table->boolean('is_confirmed_by_admin')->default(false);
            $table->timestamps();
        });

        // 11. Schedule Adjustment Windows (Post-Publication)
        Schema::create('schedule_adjustment_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('base_published_version_id')->nullable()->constrained('schedule_versions')->nullOnDelete();
            $table->string('title'); // e.g. 'Fall 2026 Faculty Post-Publication Adjustment Window'
            $table->dateTime('opens_at')->nullable();
            $table->dateTime('closes_at')->nullable();
            $table->boolean('allow_subject_swaps')->default(true);
            $table->boolean('allow_section_swaps')->default(true);
            $table->boolean('allow_time_swaps')->default(true);
            $table->string('status')->default('Open'); // Upcoming, Open, Closed, Re-Optimized, Published
            $table->timestamps();
        });

        // 12. Faculty Schedule Swap Requests
        Schema::create('schedule_swap_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adjustment_window_id')->constrained('schedule_adjustment_windows')->cascadeOnDelete();
            $table->foreignId('requester_faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('counterpart_faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->foreignId('requester_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
            $table->foreignId('counterpart_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
            $table->string('swap_type'); // subject_swap, section_swap, time_slot_swap, unilateral_adjustment
            $table->string('proposed_day')->nullable();
            $table->time('proposed_start_time')->nullable();
            $table->time('proposed_end_time')->nullable();
            $table->string('proposed_room')->nullable();
            $table->text('reason');
            $table->string('counterpart_consent')->default('Pending'); // Pending, Accepted, Rejected
            $table->timestamp('counterpart_responded_at')->nullable();
            $table->boolean('pre_validation_passed')->default(false);
            $table->text('pre_validation_notes')->nullable();
            $table->boolean('deep_validation_passed')->default(false);
            $table->text('deep_validation_notes')->nullable();
            $table->string('status')->default('Pending Consent'); // Pending Consent, Consolidating, Included in Batch, Approved, Rejected
            $table->timestamps();
        });

        // 13. Schedule Adjustment Batches
        Schema::create('schedule_adjustment_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adjustment_window_id')->constrained('schedule_adjustment_windows')->cascadeOnDelete();
            $table->string('batch_number')->unique(); // e.g. 'ADJ-BATCH-2026-001'
            $table->integer('total_requests_count')->default(0);
            $table->integer('accepted_requests_count')->default(0);
            $table->json('affected_faculty_ids')->nullable();
            $table->json('affected_sections')->nullable();
            $table->json('affected_rooms')->nullable();
            $table->text('gemini_consolidation_summary')->nullable();
            $table->json('gemini_competition_warnings')->nullable();
            $table->string('solver_status')->default('Pending'); // Pending, Solved Feasible, Infeasible, Applied
            $table->string('status')->default('Assembling'); // Assembling, Program Review, Dean Review, Ready to Publish, Published
            $table->timestamps();
        });

        // Add schedule_version_id and course_offering_id foreign keys to room_schedules
        Schema::table('room_schedules', function (Blueprint $table) {
            $table->foreignId('academic_period_id')->nullable()->after('id')->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('schedule_version_id')->nullable()->after('academic_period_id')->constrained('schedule_versions')->nullOnDelete();
            $table->foreignId('course_offering_id')->nullable()->after('schedule_version_id')->constrained('course_offerings')->nullOnDelete();
            $table->boolean('is_locked')->default(false)->after('raw_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_schedules', function (Blueprint $table) {
            $table->dropForeign(['course_offering_id']);
            $table->dropForeign(['schedule_version_id']);
            $table->dropForeign(['academic_period_id']);
            $table->dropColumn(['course_offering_id', 'schedule_version_id', 'academic_period_id', 'is_locked']);
        });

        Schema::dropIfExists('schedule_adjustment_batches');
        Schema::dropIfExists('schedule_swap_requests');
        Schema::dropIfExists('schedule_adjustment_windows');
        Schema::dropIfExists('schedule_review_flags');
        Schema::dropIfExists('schedule_versions');
        Schema::dropIfExists('schedule_candidates');
        Schema::dropIfExists('faculty_credits');
        Schema::dropIfExists('faculty_preferences');
        Schema::dropIfExists('faculty_specializations');
        Schema::dropIfExists('course_offerings');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('curricula');
    }
};
