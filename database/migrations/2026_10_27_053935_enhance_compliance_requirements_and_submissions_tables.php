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
        // 1. Enhance requirements table to be full-featured compliance container folders
        Schema::table('requirements', function (Blueprint $table) {
            if (! Schema::hasColumn('requirements', 'category')) {
                $table->string('category')->default('Teaching and Learning')->after('document_type');
            }
            if (! Schema::hasColumn('requirements', 'open_date')) {
                $table->timestamp('open_date')->nullable()->after('due_date');
            }
            if (! Schema::hasColumn('requirements', 'grace_period_days')) {
                $table->integer('grace_period_days')->default(0)->after('due_date');
            }
            if (! Schema::hasColumn('requirements', 'required_file_types')) {
                $table->string('required_file_types')->default('pdf,docx,xlsx')->after('accepted_format');
            }
            if (! Schema::hasColumn('requirements', 'allow_multiple_files')) {
                $table->boolean('allow_multiple_files')->default(false)->after('required_file_types');
            }
            if (! Schema::hasColumn('requirements', 'naming_convention')) {
                $table->string('naming_convention')->nullable()->after('allow_multiple_files');
            }
            if (! Schema::hasColumn('requirements', 'late_policy')) {
                $table->string('late_policy')->default('allowed_with_flag')->after('naming_convention'); // allowed_with_flag, reject, requires_approval
            }
            if (! Schema::hasColumn('requirements', 'status')) {
                $table->string('status')->default('Open')->after('late_policy'); // Draft, Open, Closed, Archived
            }
            if (! Schema::hasColumn('requirements', 'health_indicator')) {
                $table->string('health_indicator')->default('On Track')->after('status'); // On Track, Needs Attention, Critical
            }
            if (! Schema::hasColumn('requirements', 'applicable_programs')) {
                $table->json('applicable_programs')->nullable()->after('program_id');
            }
        });

        // 2. Enhance submissions table to support explicit late/overdue computation, excused reasons, reviewer status
        Schema::table('submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('submissions', 'submission_state')) {
                $table->string('submission_state')->default('pending')->after('status');
                // pending, submitted_on_time, submitted_late, overdue, returned_for_revision, verified, excused
            }
            if (! Schema::hasColumn('submissions', 'days_late')) {
                $table->integer('days_late')->default(0)->after('submission_state');
            }
            if (! Schema::hasColumn('submissions', 'days_overdue')) {
                $table->integer('days_overdue')->default(0)->after('days_late');
            }
            if (! Schema::hasColumn('submissions', 'days_early')) {
                $table->integer('days_early')->default(0)->after('days_overdue');
            }
            if (! Schema::hasColumn('submissions', 'reviewer_status')) {
                $table->string('reviewer_status')->nullable()->after('reviewer_comments'); // Verified, For Review, Revision Requested
            }
            if (! Schema::hasColumn('submissions', 'remarks')) {
                $table->string('remarks')->nullable()->after('reviewer_status');
            }
            if (! Schema::hasColumn('submissions', 'files_count')) {
                $table->integer('files_count')->default(0)->after('file_path');
            }
            if (! Schema::hasColumn('submissions', 'excuse_reason')) {
                $table->text('excuse_reason')->nullable()->after('remarks');
            }
        });

        // 3. Create requirement_submission_files table for multi-file/version retention
        if (! Schema::hasTable('requirement_submission_files')) {
            Schema::create('requirement_submission_files', function (Blueprint $table) {
                $table->id();
                $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
                $table->string('file_name');
                $table->string('file_path');
                $table->string('file_type')->nullable();
                $table->bigInteger('file_size_bytes')->nullable();
                $table->integer('version')->default(1);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requirement_submission_files');

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn([
                'submission_state',
                'days_late',
                'days_overdue',
                'days_early',
                'reviewer_status',
                'remarks',
                'files_count',
                'excuse_reason',
            ]);
        });

        Schema::table('requirements', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'open_date',
                'grace_period_days',
                'required_file_types',
                'allow_multiple_files',
                'naming_convention',
                'late_policy',
                'status',
                'health_indicator',
                'applicable_programs',
            ]);
        });
    }
};
