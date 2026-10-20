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
        Schema::table('verified_schedules', function (Blueprint $table) {
            if (! Schema::hasColumn('verified_schedules', 'effective_start_date')) {
                $table->date('effective_start_date')->nullable()->after('scheduled_minutes');
            }
            if (! Schema::hasColumn('verified_schedules', 'effective_end_date')) {
                $table->date('effective_end_date')->nullable()->after('effective_start_date');
            }
            if (! Schema::hasColumn('verified_schedules', 'assignment_source')) {
                $table->string('assignment_source')->nullable()->after('effective_end_date');
            }
        });

        Schema::table('schedule_staging_records', function (Blueprint $table) {
            if (! Schema::hasColumn('schedule_staging_records', 'has_date_conflict')) {
                $table->boolean('has_date_conflict')->default(false)->after('mapping_evidence');
            }
            if (! Schema::hasColumn('schedule_staging_records', 'conflict_reason')) {
                $table->string('conflict_reason')->nullable()->after('has_date_conflict');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verified_schedules', function (Blueprint $table) {
            $table->dropColumn(['effective_start_date', 'effective_end_date', 'assignment_source']);
        });

        Schema::table('schedule_staging_records', function (Blueprint $table) {
            $table->dropColumn(['has_date_conflict', 'conflict_reason']);
        });
    }
};
