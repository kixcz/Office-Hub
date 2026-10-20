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
        // 1. Sync Batches (History of each spreadsheet pull)
        Schema::create('schedule_sync_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->string('batch_number')->unique(); // e.g. 'SYNC-20261019-001'
            $table->string('source_name')->default('Official Master Timetable Google Sheet');
            $table->string('sheet_url')->nullable();
            $table->string('sheet_tab')->nullable();
            $table->integer('raw_rows_count')->default(0);
            $table->integer('auto_matched_count')->default(0);
            $table->integer('needs_review_count')->default(0);
            $table->integer('verified_count')->default(0);
            $table->string('status')->default('Staged'); // Staged, In Review, Verified, Archived
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Reusable Source Aliases / Mapping Rules Table
        Schema::create('schedule_source_aliases', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type'); // 'faculty', 'course', 'section', 'room'
            $table->string('raw_alias_text')->index(); // e.g. 'DATA ANALYTICS PROG', '3 BSIS', 'CLR3', 'KAYE P.'
            $table->string('normalized_alias_text')->index(); // Normalized trimmed lowercase
            $table->unsignedBigInteger('canonical_id'); // faculty_id, course_id, section_id, room_id
            $table->string('canonical_label'); // Readable display label inside OfficeHub
            $table->decimal('confidence_boost', 4, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['entity_type', 'normalized_alias_text'], 'uniq_entity_alias');
        });

        // 3. Staging Records Table (Exact raw spreadsheet rows + normalization + suggested mappings)
        Schema::create('schedule_staging_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sync_batch_id')->constrained('schedule_sync_batches')->cascadeOnDelete();
            $table->integer('source_row_number');
            $table->string('sheet_tab')->nullable();

            // Original raw spreadsheet values (never altered)
            $table->string('raw_subject');
            $table->string('raw_faculty')->nullable();
            $table->string('raw_section')->nullable();
            $table->string('raw_room')->nullable();
            $table->string('raw_day')->nullable();
            $table->string('raw_time')->nullable();

            // Normalized cleaned fields
            $table->string('norm_subject')->nullable();
            $table->string('norm_faculty')->nullable();
            $table->string('norm_section')->nullable();
            $table->string('norm_room')->nullable();
            $table->string('norm_day')->nullable();
            $table->time('norm_start_time')->nullable();
            $table->time('norm_end_time')->nullable();
            $table->integer('scheduled_minutes')->default(90);

            // Suggested / Mapped canonical entities
            $table->foreignId('mapped_course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->foreignId('mapped_faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->foreignId('mapped_section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->foreignId('mapped_room_id')->nullable()->constrained('rooms')->nullOnDelete();

            // Granular confidence scores (0.00 to 100.00%)
            $table->decimal('course_confidence', 5, 2)->default(0.00);
            $table->decimal('faculty_confidence', 5, 2)->default(0.00);
            $table->decimal('section_confidence', 5, 2)->default(0.00);
            $table->decimal('room_confidence', 5, 2)->default(0.00);
            $table->decimal('overall_confidence', 5, 2)->default(0.00);
            $table->json('mapping_evidence')->nullable();

            // Synchronization comparison state (relative to prior batch)
            $table->string('change_classification')->default('New'); // Unchanged, New, Modified, Removed, Mapping Conflict
            $table->string('review_decision')->default('Pending'); // Pending, Approved, Changed, New Canonical, Add Alias, Duplicate, Ignored
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // 4. Verified Schedule Records (The authoritative production layer)
        Schema::create('verified_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_period_id')->constrained('academic_periods')->cascadeOnDelete();
            $table->foreignId('staging_record_id')->nullable()->constrained('schedule_staging_records')->nullOnDelete();
            $table->foreignId('sync_batch_id')->nullable()->constrained('schedule_sync_batches')->nullOnDelete();

            // Authoritative canonical relations
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();

            $table->string('session_type')->default('Laboratory'); // Lecture, Laboratory, Hybrid
            $table->string('day_of_week'); // Monday, Tuesday, ...
            $table->time('scheduled_start_time');
            $table->time('scheduled_end_time');
            $table->integer('scheduled_minutes')->default(90);

            // Audit Provenance
            $table->json('original_raw_values')->nullable();
            $table->decimal('mapping_confidence', 5, 2)->default(100.00);
            $table->string('status')->default('Active'); // Active, Suspended, Revised
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        // 5. Lab In-Charge Assignments Table
        Schema::create('lab_in_charge_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('shift_name')->default('Day Shift'); // Morning, Afternoon, Evening, Full Day
            $table->time('shift_start_time')->default('07:30:00');
            $table->time('shift_end_time')->default('17:30:00');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'room_id'], 'uniq_user_lab');
        });

        // 6. Lab Monitoring Sessions (Real-time operational actual observations)
        Schema::create('lab_monitoring_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verified_schedule_id')->constrained('verified_schedules')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('monitored_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->date('monitoring_date');
            $table->time('scheduled_start_time');
            $table->time('scheduled_end_time');
            $table->integer('scheduled_minutes')->default(90);

            // Actual Observations
            $table->time('actual_start_time')->nullable();
            $table->time('actual_end_time')->nullable();
            $table->integer('late_minutes')->default(0);
            $table->integer('observed_minutes')->default(0);
            $table->integer('variance_minutes')->default(0);
            $table->integer('student_headcount')->nullable();

            $table->string('observation_status')->default('Not Yet Started');
            // Not Yet Started, Started On Time, Late Start, In Progress, Completed, Faculty Absent, Room Empty, Different Activity, Cancelled, Suspended

            // Observed changes if different from verified schedule
            $table->foreignId('observed_faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('observed_course_code')->nullable();
            $table->string('observed_section_name')->nullable();

            $table->text('remarks')->nullable();
            $table->boolean('has_discrepancy')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        // 7. Lab Monitoring Discrepancies & Incidents
        Schema::create('lab_monitoring_discrepancies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitoring_session_id')->constrained('lab_monitoring_sessions')->cascadeOnDelete();
            $table->foreignId('verified_schedule_id')->nullable()->constrained('verified_schedules')->nullOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('reported_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('discrepancy_type');
            // 'Expected Faculty != Observed Faculty', 'Expected Course != Observed Course', 'Room Used Without Scheduled Session', 'Scheduled Session but Room Empty', 'Facility/Equipment Failure', 'Operational Incident'

            $table->string('severity')->default('Needs Attention'); // Advisory, Needs Attention, Blocking
            $table->text('expected_state');
            $table->text('observed_state');
            $table->text('remarks')->nullable();
            $table->string('resolution_status')->default('Open'); // Open, Acknowledged, Resolution Proposed, Resolved
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_monitoring_discrepancies');
        Schema::dropIfExists('lab_monitoring_sessions');
        Schema::dropIfExists('lab_in_charge_assignments');
        Schema::dropIfExists('verified_schedules');
        Schema::dropIfExists('schedule_staging_records');
        Schema::dropIfExists('schedule_source_aliases');
        Schema::dropIfExists('schedule_sync_batches');
    }
};
