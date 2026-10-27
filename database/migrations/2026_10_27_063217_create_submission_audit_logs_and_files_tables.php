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
        // Audit logs table for submission lifecycle, reviews, status changes, returns, and extensions
        if (! Schema::hasTable('submission_audit_logs')) {
            Schema::create('submission_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
                $table->foreignId('requirement_id')->nullable()->constrained('requirements')->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_name');
                $table->string('actor_role'); // Faculty, Reviewer, College Admin
                $table->string('action'); // submitted, returned_for_revision, resubmitted, verified, remark_added, deadline_extended, reminder_sent, excused
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('metadata')->nullable(); // version, files, previous_state, new_state, revised_deadline, etc.
                $table->timestamps();
            });
        }

        // Add reviewer_id, delivery_mode, revised_due_date to submissions if not present
        Schema::table('submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('submissions', 'reviewer_id')) {
                $table->foreignId('reviewer_id')->nullable()->after('reviewer_comments')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('submissions', 'delivery_mode')) {
                $table->string('delivery_mode')->default('Digital Upload')->after('reviewer_id');
            }
            if (! Schema::hasColumn('submissions', 'revised_due_date')) {
                $table->timestamp('revised_due_date')->nullable()->after('delivery_mode');
            }
            if (! Schema::hasColumn('submissions', 'faculty_remarks')) {
                $table->text('faculty_remarks')->nullable()->after('remarks');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submission_audit_logs');

        Schema::table('submissions', function (Blueprint $table) {
            if (Schema::hasColumn('submissions', 'reviewer_id')) {
                $table->dropForeign(['reviewer_id']);
                $table->dropColumn('reviewer_id');
            }
            if (Schema::hasColumn('submissions', 'delivery_mode')) {
                $table->dropColumn('delivery_mode');
            }
            if (Schema::hasColumn('submissions', 'revised_due_date')) {
                $table->dropColumn('revised_due_date');
            }
            if (Schema::hasColumn('submissions', 'faculty_remarks')) {
                $table->dropColumn('faculty_remarks');
            }
        });
    }
};
