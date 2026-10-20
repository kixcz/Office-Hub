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
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->unsignedInteger('scheduled_minutes')->default(0)->after('scheduled_sessions');
            $table->unsignedInteger('excluded_minutes')->default(0)->after('scheduled_minutes');
            $table->unsignedInteger('eligible_minutes')->default(0)->after('excluded_minutes');
            $table->unsignedInteger('attended_minutes')->default(0)->after('eligible_minutes');
            $table->unsignedInteger('approved_leave_minutes')->default(0)->after('attended_minutes');
            $table->unsignedInteger('unexcused_absent_minutes')->default(0)->after('approved_leave_minutes');
            $table->unsignedInteger('late_sessions_count')->default(0)->after('unexcused_absent_minutes');
            $table->unsignedInteger('make_up_required_minutes')->default(0)->after('late_sessions_count');
            $table->unsignedInteger('make_up_completed_minutes')->default(0)->after('make_up_required_minutes');
            $table->decimal('make_up_completion_rate', 5, 2)->nullable()->after('instructional_completion_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->dropColumn([
                'scheduled_minutes',
                'excluded_minutes',
                'eligible_minutes',
                'attended_minutes',
                'approved_leave_minutes',
                'unexcused_absent_minutes',
                'late_sessions_count',
                'make_up_required_minutes',
                'make_up_completed_minutes',
                'make_up_completion_rate',
            ]);
        });
    }
};
