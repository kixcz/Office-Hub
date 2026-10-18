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
        Schema::create('exam_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('room_schedule_id')->nullable()->constrained('room_schedules')->nullOnDelete();

            // Course & Section Context (Inherited or Custom)
            $table->string('course_code')->index();
            $table->string('course_title');
            $table->string('section')->index();
            $table->string('year_level')->nullable();

            // Examination Specs
            $table->string('exam_type'); // Preliminary, Midterm, Final, Practical/Laboratory Exam, Quiz/Departmental Exam, Custom
            $table->string('custom_exam_title')->nullable();
            $table->date('exam_date')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room_name')->index();
            $table->string('modality')->default('Face-to-Face'); // Face-to-Face, Online, Hybrid, Laboratory Hands-on
            $table->string('proctor_name')->nullable();
            $table->boolean('is_confirmed')->default(true); // Tentative vs Confirmed
            $table->text('notes')->nullable();

            // Operational Status Lifecycle
            // Draft, Scheduled, Awaiting Confirmation, Conducted, Rescheduled, Cancelled, Not Conducted
            $table->string('status')->default('Scheduled')->index();

            // Post-Exam Confirmation & Monitoring Execution
            $table->timestamp('conducted_at')->nullable();
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->time('actual_start_time')->nullable();
            $table->time('actual_end_time')->nullable();
            $table->integer('attendance_count')->nullable();
            $table->text('remarks')->nullable();
            $table->text('irregularities_reported')->nullable();
            $table->string('evidence_attachment_path')->nullable(); // room photo, attendance sheet, signed monitoring sheet

            // Non-conducted / Rescheduling metadata
            $table->string('non_conducted_reason')->nullable(); // Faculty Unavailable, Student Activity Conflict, Room Issue, Suspension of Classes, Technical Problem, Other
            $table->text('non_conducted_remarks')->nullable();
            $table->date('rescheduled_target_date')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_schedules');
    }
};
