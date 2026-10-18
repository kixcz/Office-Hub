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
        // 1. Faculty Workload Records & Official Validation Snapshots
        Schema::create('faculty_workloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->decimal('teaching_units', 5, 2)->default(0);
            $table->decimal('teaching_hours', 5, 2)->default(0);
            $table->decimal('designation_credits', 5, 2)->default(0);
            $table->decimal('research_credits', 5, 2)->default(0);
            $table->decimal('extension_credits', 5, 2)->default(0);
            $table->decimal('administrative_credits', 5, 2)->default(0);
            $table->decimal('total_workload', 5, 2)->default(0);
            $table->string('workload_status')->default('Balanced'); // Underload, Balanced, Overload
            $table->boolean('is_locked')->default(false); // Locked by Super Admin
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_version')->default('v1.0');
            $table->json('signatories_snapshot')->nullable();
            $table->json('workload_snapshot_data')->nullable(); // frozen teaching assignments & details
            $table->text('admin_remarks')->nullable();
            $table->timestamps();
        });

        // 2. Make-Up Class Requests & Operations Lifecycle
        Schema::create('make_up_class_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique()->index();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('room_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();

            // Original Missed Session Details
            $table->date('missed_date')->index();
            $table->string('course_code')->index();
            $table->string('course_title');
            $table->string('section')->index();
            $table->string('original_day_of_week');
            $table->time('original_start_time');
            $table->time('original_end_time');
            $table->string('original_room_name');
            $table->decimal('required_contact_hours', 4, 2)->default(1.5);
            $table->string('absence_reason')->nullable(); // Medical, Official Travel, University Event, Personal Emergency, Other
            $table->text('absence_remarks')->nullable();

            // Proposed Replacement Details
            $table->date('proposed_date')->index();
            $table->time('proposed_start_time');
            $table->time('proposed_end_time');
            $table->string('proposed_room_name');
            $table->string('modality')->default('Face-to-Face'); // Face-to-Face, Laboratory Hands-on, Online Synchronous
            $table->text('proposed_remarks')->nullable();

            // Workflow Lifecycle: Draft, Submitted, Program Head Review, Dean Approval, Approved, Conducted, Completed, Returned, Rejected
            $table->string('status')->default('Submitted')->index();

            // Multi-Level Approvals
            $table->timestamp('program_head_reviewed_at')->nullable();
            $table->foreignId('program_head_reviewed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('program_head_remarks')->nullable();

            $table->timestamp('dean_approved_at')->nullable();
            $table->foreignId('dean_approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('dean_remarks')->nullable();

            // Post-Make-Up Execution & Verification
            $table->timestamp('conducted_at')->nullable();
            $table->time('actual_start_time')->nullable();
            $table->time('actual_end_time')->nullable();
            $table->integer('actual_attendance_count')->nullable();
            $table->text('completion_remarks')->nullable();
            $table->string('evidence_path')->nullable(); // attendance sheet, classroom photo

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('make_up_class_requests');
        Schema::dropIfExists('faculty_workloads');
    }
};
