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
        Schema::table('faculty_attendances', function (Blueprint $table) {
            $table->foreignId('room_schedule_id')->nullable()->after('faculty_id')->constrained('room_schedules')->nullOnDelete();
            $table->string('scheduled_start_time', 20)->nullable()->after('time_slot');
            $table->string('scheduled_end_time', 20)->nullable()->after('scheduled_start_time');
            $table->unsignedInteger('scheduled_duration_minutes')->default(90)->after('scheduled_end_time');
            $table->string('actual_arrival_time', 20)->nullable()->after('scheduled_duration_minutes');
            $table->unsignedInteger('delivered_minutes')->default(0)->after('actual_arrival_time');
            $table->string('primary_status', 50)->default('present')->after('delivered_minutes');
            $table->boolean('make_up_required')->default(false)->after('primary_status');
            $table->foreignId('make_up_request_id')->nullable()->after('make_up_required')->constrained('make_up_class_requests')->nullOnDelete();
        });

        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->decimal('total_scheduled_hours', 6, 2)->default(0)->after('scheduled_sessions');
            $table->decimal('eligible_scheduled_hours', 6, 2)->default(0)->after('total_scheduled_hours');
            $table->decimal('attended_hours', 6, 2)->default(0)->after('eligible_scheduled_hours');
            $table->decimal('approved_leave_hours', 6, 2)->default(0)->after('attended_hours');
            $table->decimal('unexcused_absent_hours', 6, 2)->default(0)->after('approved_leave_hours');
            $table->decimal('make_up_required_hours', 6, 2)->default(0)->after('unexcused_absent_hours');
            $table->decimal('make_up_completed_hours', 6, 2)->default(0)->after('make_up_required_hours');
            $table->decimal('attendance_coverage_rate', 5, 2)->default(100)->after('attendance_rate');
            $table->decimal('on_time_rate', 5, 2)->default(100)->after('attendance_coverage_rate');
            $table->decimal('instructional_completion_rate', 5, 2)->default(100)->after('on_time_rate');
            $table->boolean('is_rank_eligible')->default(true)->after('instructional_completion_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->dropColumn([
                'total_scheduled_hours',
                'eligible_scheduled_hours',
                'attended_hours',
                'approved_leave_hours',
                'unexcused_absent_hours',
                'make_up_required_hours',
                'make_up_completed_hours',
                'attendance_coverage_rate',
                'on_time_rate',
                'instructional_completion_rate',
                'is_rank_eligible',
            ]);
        });

        Schema::table('faculty_attendances', function (Blueprint $table) {
            $table->dropForeign(['room_schedule_id']);
            $table->dropForeign(['make_up_request_id']);
            $table->dropColumn([
                'room_schedule_id',
                'scheduled_start_time',
                'scheduled_end_time',
                'scheduled_duration_minutes',
                'actual_arrival_time',
                'delivered_minutes',
                'primary_status',
                'make_up_required',
                'make_up_request_id',
            ]);
        });
    }
};
