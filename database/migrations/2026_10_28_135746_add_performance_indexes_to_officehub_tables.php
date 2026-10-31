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
        $this->addIndexIfMissing('faculties', ['program_id', 'status', 'last_name'], 'idx_faculties_program_status_lastname');
        $this->addIndexIfMissing('faculties', ['user_id'], 'idx_faculties_user_id');

        $this->addIndexIfMissing('submissions', ['faculty_id', 'requirement_id'], 'idx_submissions_faculty_requirement');
        $this->addIndexIfMissing('submissions', ['requirement_id', 'status', 'submitted_at'], 'idx_submissions_req_status_submitted');
        $this->addIndexIfMissing('submissions', ['faculty_id', 'status', 'submitted_at'], 'idx_submissions_fac_status_submitted');

        $this->addIndexIfMissing('requirements', ['deadline', 'category'], 'idx_requirements_deadline_category');

        $this->addIndexIfMissing('faculty_attendances', ['faculty_id', 'session_date', 'status'], 'idx_fac_att_faculty_date_status');
        $this->addIndexIfMissing('faculty_attendances', ['week_label', 'session_date'], 'idx_fac_att_week_date');

        $this->addIndexIfMissing('faculty_attendance_summaries', ['period_type', 'period_label', 'faculty_id'], 'idx_fac_sum_period_faculty');

        $this->addIndexIfMissing('room_schedules', ['faculty_id', 'day_of_week', 'start_time'], 'idx_room_sched_faculty_day_start');
        $this->addIndexIfMissing('room_schedules', ['day_of_week', 'start_time'], 'idx_room_sched_day_start');

        $this->addIndexIfMissing('locator_slips', ['date', 'status'], 'idx_locator_slips_date_status');
        $this->addIndexIfMissing('locator_slips', ['faculty_id', 'date', 'status'], 'idx_locator_slips_faculty_date_status');

        $this->addIndexIfMissing('travel_orders', ['start_date', 'end_date', 'status'], 'idx_travel_orders_dates_status');
        $this->addIndexIfMissing('travel_orders', ['faculty_id', 'start_date', 'end_date', 'status'], 'idx_travel_orders_faculty_dates_status');

        $this->addIndexIfMissing('meetings', ['date', 'program_id'], 'idx_meetings_date_program');
        $this->addIndexIfMissing('activities', ['date', 'program_id'], 'idx_activities_date_program');
        $this->addIndexIfMissing('tasks', ['status', 'due_date'], 'idx_tasks_status_duedate');
        $this->addIndexIfMissing('accomplishments', ['faculty_id', 'status', 'date_achieved'], 'idx_accomplishments_fac_status_date');

        $this->addIndexIfMissing('verified_schedules', ['room_id', 'day_of_week', 'status'], 'idx_verified_sched_room_day_status');
        $this->addIndexIfMissing('verified_schedules', ['faculty_id', 'day_of_week', 'status'], 'idx_verified_sched_fac_day_status');
        $this->addIndexIfMissing('lab_monitoring_sessions', ['monitoring_date', 'room_id'], 'idx_lab_mon_date_room');
        $this->addIndexIfMissing('lab_monitoring_sessions', ['verified_schedule_id', 'monitoring_date'], 'idx_lab_mon_sched_date');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIndexIfExists('faculties', 'idx_faculties_program_status_lastname');
        $this->dropIndexIfExists('faculties', 'idx_faculties_user_id');
        $this->dropIndexIfExists('submissions', 'idx_submissions_faculty_requirement');
        $this->dropIndexIfExists('submissions', 'idx_submissions_req_status_submitted');
        $this->dropIndexIfExists('submissions', 'idx_submissions_fac_status_submitted');
        $this->dropIndexIfExists('requirements', 'idx_requirements_deadline_category');
        $this->dropIndexIfExists('faculty_attendances', 'idx_fac_att_faculty_date_status');
        $this->dropIndexIfExists('faculty_attendances', 'idx_fac_att_week_date');
        $this->dropIndexIfExists('faculty_attendance_summaries', 'idx_fac_sum_period_faculty');
        $this->dropIndexIfExists('room_schedules', 'idx_room_sched_faculty_day_start');
        $this->dropIndexIfExists('room_schedules', 'idx_room_sched_day_start');
        $this->dropIndexIfExists('locator_slips', 'idx_locator_slips_date_status');
        $this->dropIndexIfExists('locator_slips', 'idx_locator_slips_faculty_date_status');
        $this->dropIndexIfExists('travel_orders', 'idx_travel_orders_dates_status');
        $this->dropIndexIfExists('travel_orders', 'idx_travel_orders_faculty_dates_status');
        $this->dropIndexIfExists('meetings', 'idx_meetings_date_program');
        $this->dropIndexIfExists('activities', 'idx_activities_date_program');
        $this->dropIndexIfExists('tasks', 'idx_tasks_status_duedate');
        $this->dropIndexIfExists('accomplishments', 'idx_accomplishments_fac_status_date');
        $this->dropIndexIfExists('verified_schedules', 'idx_verified_sched_room_day_status');
        $this->dropIndexIfExists('verified_schedules', 'idx_verified_sched_fac_day_status');
        $this->dropIndexIfExists('lab_monitoring_sessions', 'idx_lab_mon_date_room');
        $this->dropIndexIfExists('lab_monitoring_sessions', 'idx_lab_mon_sched_date');
    }

    /**
     * Add a database index only if the table and all columns exist and the index does not yet exist.
     *
     * @param  array<int, string>  $columns
     */
    private function addIndexIfMissing(string $table, array $columns, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return;
            }
        }

        $existingIndexes = collect(Schema::getIndexes($table))->pluck('name')->map(fn ($n) => strtolower($n))->all();
        if (in_array(strtolower($indexName), $existingIndexes, true)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName) {
            $blueprint->index($columns, $indexName);
        });
    }

    /**
     * Drop a database index if the table and index exist.
     */
    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $existingIndexes = collect(Schema::getIndexes($table))->pluck('name')->map(fn ($n) => strtolower($n))->all();
        if (! in_array(strtolower($indexName), $existingIndexes, true)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
            $blueprint->dropIndex($indexName);
        });
    }
};
