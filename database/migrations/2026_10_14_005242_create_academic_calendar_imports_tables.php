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
        // 1. Batches / Source Uploads table
        Schema::create('academic_calendar_import_batches', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year'); // e.g. '2026 – 2027' or 'AY 2026–2027'
            $table->string('semester_scope')->default('Whole Academic Year'); // Whole Academic Year, 1st Semester, 2nd Semester, Summer
            $table->string('institution')->default('CIDS - College of Information and Computing Sciences');
            $table->string('original_filename');
            $table->string('file_path');
            $table->string('file_type'); // pdf, docx, xlsx, csv, image
            $table->bigInteger('file_size_bytes')->default(0);
            $table->longText('extracted_text')->nullable();
            $table->string('status')->default('pending_review'); // pending_review, partially_approved, completed, rejected, rolled_back

            // Statistics counters for instant analytics & history
            $table->integer('detected_count')->default(0);
            $table->integer('approved_count')->default(0);
            $table->integer('rejected_count')->default(0);
            $table->integer('manual_corrected_count')->default(0);
            $table->integer('needs_attention_count')->default(0);

            $table->json('gemini_raw_response')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Extracted Candidate Events Queue
        Schema::create('academic_calendar_import_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('academic_calendar_import_batches')->cascadeOnDelete();

            // Event Details
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category'); // enrollment, start_end_classes, examination, holiday, break, faculty_deadline, grade_submission, university_activity, college_activity, academic_milestone
            $table->string('semester')->nullable(); // 1st Semester, 2nd Semester, Whole Year, Summer

            // Date bounds
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            // AI Provenance & Understanding
            $table->text('source_text')->nullable(); // original extracted snippet
            $table->decimal('confidence_score', 5, 2)->default(95.00); // 0.00 to 100.00
            $table->text('ai_reasoning')->nullable();

            // Validation & Governance
            $table->string('validation_status')->default('valid'); // valid, needs_attention, duplicate, conflict, out_of_period
            $table->text('validation_notes')->nullable();

            // Proposed Scheduling Effect (e.g. BLOCK_ALL_CLASSES, CALENDAR_TV_RESTRICTION, CALENDAR_REMINDER, INFORMATIONAL)
            $table->string('proposed_scheduling_effect')->default('INFORMATIONAL');
            $table->string('confirmed_scheduling_effect')->nullable();

            // Status & Approval Trail
            $table->string('status')->default('pending'); // pending, approved, rejected, edited
            $table->boolean('is_manually_corrected')->default(false);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Link to destination entity once approved
            $table->string('destination_type')->nullable(); // Activity, Requirement, Meeting, Holiday
            $table->unsignedBigInteger('destination_id')->nullable();

            $table->timestamps();

            $table->index(['batch_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });

        // 3. Reusable Configurable Import Rules
        Schema::create('academic_calendar_import_rules', function (Blueprint $table) {
            $table->id();
            $table->string('event_category'); // holiday, examination, faculty_deadline, etc.
            $table->string('default_scheduling_effect'); // BLOCK_ALL_CLASSES, CALENDAR_TV_RESTRICTION, etc.
            $table->string('suggested_destination_module')->default('Calendar'); // Calendar, Calendar+TV, Schedule Generator, Compliance
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_calendar_import_rules');
        Schema::dropIfExists('academic_calendar_import_events');
        Schema::dropIfExists('academic_calendar_import_batches');
    }
};
