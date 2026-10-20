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
        Schema::create('daily_monitoring_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('shift_name')->default('Full Day Shift');
            $table->json('covered_room_ids')->nullable(); // Array of room IDs
            $table->string('academic_period_name')->nullable();
            $table->string('schedule_version')->default('v1.0 (Live Verified)');

            // Completeness Metrics
            $table->integer('expected_sessions_count')->default(0);
            $table->integer('monitored_sessions_count')->default(0);
            $table->decimal('completeness_rate', 5, 2)->default(0.00); // 0 - 100%
            $table->integer('discrepancies_count')->default(0);
            $table->integer('unmonitored_count')->default(0);

            // Reconciled Matrices (Full frozen snapshot upon submission/finalization)
            $table->json('summary_matrix')->nullable();      // Per-lab aggregation
            $table->json('sessions_matrix')->nullable();     // Faculty/Class detailed rows
            $table->json('utilization_matrix')->nullable();  // Room utilization with formatted 7h 30m durations
            $table->json('exceptions_matrix')->nullable();   // Problematic cases & action taken
            $table->json('reconciliation_checklist')->nullable(); // Checklist status

            // Closing & Approval Workflow
            // Draft -> Ready to Submit -> Submitted -> Reviewed -> Finalized (or Returned)
            $table->string('status')->default('Draft');
            $table->boolean('has_exceptions')->default(false);
            $table->text('submission_notes')->nullable();
            $table->text('review_remarks')->nullable();

            // Signatories & Lifecycle Audit
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->json('correction_history')->nullable(); // Array of [{reopened_by, reopened_at, reason, previous_status}]

            $table->timestamps();

            $table->unique(['report_date', 'user_id', 'shift_name'], 'dmr_date_user_shift_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_monitoring_reports');
    }
};
