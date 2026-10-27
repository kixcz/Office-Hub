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
        // 1. Expand faculty_attendances
        Schema::table('faculty_attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('faculty_attendances', 'verified_schedule_id')) {
                $table->foreignId('verified_schedule_id')->nullable()->after('room_schedule_id')->constrained('verified_schedules')->nullOnDelete();
            }
            if (! Schema::hasColumn('faculty_attendances', 'attendance_status')) {
                $table->string('attendance_status', 80)->default('present')->after('primary_status');
            }
            if (! Schema::hasColumn('faculty_attendances', 'exception_type')) {
                $table->string('exception_type', 80)->nullable()->after('attendance_status');
            }
            if (! Schema::hasColumn('faculty_attendances', 'exception_reference')) {
                $table->string('exception_reference', 100)->nullable()->after('exception_type');
            }
            if (! Schema::hasColumn('faculty_attendances', 'exception_overlap_minutes')) {
                $table->unsignedInteger('exception_overlap_minutes')->default(0)->after('exception_reference');
            }
            if (! Schema::hasColumn('faculty_attendances', 'observed_outcome')) {
                $table->string('observed_outcome', 100)->nullable()->after('exception_overlap_minutes');
            }
            if (! Schema::hasColumn('faculty_attendances', 'observed_modality')) {
                $table->string('observed_modality', 50)->default('Face-to-Face')->after('observed_outcome');
            }
            if (! Schema::hasColumn('faculty_attendances', 'makeup_required_minutes')) {
                $table->unsignedInteger('makeup_required_minutes')->default(0)->after('make_up_required');
            }
            if (! Schema::hasColumn('faculty_attendances', 'makeup_completed_minutes')) {
                $table->unsignedInteger('makeup_completed_minutes')->default(0)->after('makeup_required_minutes');
            }
            if (! Schema::hasColumn('faculty_attendances', 'verification_status')) {
                $table->string('verification_status', 50)->default('Finalized')->after('makeup_completed_minutes');
            }
            if (! Schema::hasColumn('faculty_attendances', 'verification_source')) {
                $table->string('verification_source', 100)->default('Verified Master Timetable')->after('verification_status');
            }
        });

        // 2. Expand faculty_attendance_summaries
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            if (! Schema::hasColumn('faculty_attendance_summaries', 'travel_order_minutes')) {
                $table->unsignedInteger('travel_order_minutes')->default(0)->after('approved_leave_minutes');
            }
            if (! Schema::hasColumn('faculty_attendance_summaries', 'locator_slip_minutes')) {
                $table->unsignedInteger('locator_slip_minutes')->default(0)->after('travel_order_minutes');
            }
            if (! Schema::hasColumn('faculty_attendance_summaries', 'other_ob_minutes')) {
                $table->unsignedInteger('other_ob_minutes')->default(0)->after('locator_slip_minutes');
            }
            if (! Schema::hasColumn('faculty_attendance_summaries', 'suspension_minutes')) {
                $table->unsignedInteger('suspension_minutes')->default(0)->after('other_ob_minutes');
            }
            if (! Schema::hasColumn('faculty_attendance_summaries', 'holiday_minutes')) {
                $table->unsignedInteger('holiday_minutes')->default(0)->after('suspension_minutes');
            }
            if (! Schema::hasColumn('faculty_attendance_summaries', 'delivered_original_minutes')) {
                $table->unsignedInteger('delivered_original_minutes')->default(0)->after('attended_minutes');
            }
        });

        // 3. Expand lab_monitoring_sessions
        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_monitoring_sessions', 'observed_outcome')) {
                $table->string('observed_outcome', 100)->nullable()->after('session_outcome');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'observed_modality')) {
                $table->string('observed_modality', 50)->default('Face-to-Face')->after('observed_outcome');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'observed_room_id')) {
                $table->foreignId('observed_room_id')->nullable()->after('observed_modality')->constrained('rooms')->nullOnDelete();
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'delivered_minutes')) {
                $table->unsignedInteger('delivered_minutes')->default(0)->after('observed_minutes');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'exception_type')) {
                $table->string('exception_type', 80)->nullable()->after('delivered_minutes');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'exception_reference')) {
                $table->string('exception_reference', 100)->nullable()->after('exception_type');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'exception_overlap_minutes')) {
                $table->unsignedInteger('exception_overlap_minutes')->default(0)->after('exception_reference');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'makeup_required_minutes')) {
                $table->unsignedInteger('makeup_required_minutes')->default(0)->after('exception_overlap_minutes');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'verification_status')) {
                $table->string('verification_status', 50)->default('Observed')->after('makeup_required_minutes'); // Observed, Submitted, Head Verified, Finalized
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'contradiction_flags')) {
                $table->json('contradiction_flags')->nullable()->after('verification_status');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'verified_by_user_id')) {
                $table->foreignId('verified_by_user_id')->nullable()->after('contradiction_flags')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'verified_at')) {
                $table->dateTime('verified_at')->nullable()->after('verified_by_user_id');
            }
        });

        // 4. Expand make_up_class_requests
        Schema::table('make_up_class_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('make_up_class_requests', 'verified_schedule_id')) {
                $table->foreignId('verified_schedule_id')->nullable()->after('room_schedule_id')->constrained('verified_schedules')->nullOnDelete();
            }
            if (! Schema::hasColumn('make_up_class_requests', 'source_reason')) {
                $table->string('source_reason', 100)->nullable()->after('absence_reason'); // Travel Order, Locator Slip, Approved Leave, Unexcused Absence, Room Unavailable
            }
            if (! Schema::hasColumn('make_up_class_requests', 'required_recovery_minutes')) {
                $table->unsignedInteger('required_recovery_minutes')->default(90)->after('required_contact_hours');
            }
            if (! Schema::hasColumn('make_up_class_requests', 'completed_recovery_minutes')) {
                $table->unsignedInteger('completed_recovery_minutes')->default(0)->after('required_recovery_minutes');
            }
            if (! Schema::hasColumn('make_up_class_requests', 'lab_monitoring_session_id')) {
                $table->foreignId('lab_monitoring_session_id')->nullable()->after('completed_recovery_minutes')->constrained('lab_monitoring_sessions')->nullOnDelete();
            }
            if (! Schema::hasColumn('make_up_class_requests', 'lab_in_charge_verified_at')) {
                $table->dateTime('lab_in_charge_verified_at')->nullable()->after('dean_approved_at');
            }
            if (! Schema::hasColumn('make_up_class_requests', 'lab_in_charge_verified_by_id')) {
                $table->foreignId('lab_in_charge_verified_by_id')->nullable()->after('lab_in_charge_verified_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('make_up_class_requests', function (Blueprint $table) {
            $table->dropForeign(['verified_schedule_id']);
            $table->dropForeign(['lab_monitoring_session_id']);
            $table->dropForeign(['lab_in_charge_verified_by_id']);
            $table->dropColumn([
                'verified_schedule_id',
                'source_reason',
                'required_recovery_minutes',
                'completed_recovery_minutes',
                'lab_monitoring_session_id',
                'lab_in_charge_verified_at',
                'lab_in_charge_verified_by_id',
            ]);
        });

        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            $table->dropForeign(['observed_room_id']);
            $table->dropForeign(['verified_by_user_id']);
            $table->dropColumn([
                'observed_outcome',
                'observed_modality',
                'observed_room_id',
                'delivered_minutes',
                'exception_type',
                'exception_reference',
                'exception_overlap_minutes',
                'makeup_required_minutes',
                'verification_status',
                'contradiction_flags',
                'verified_by_user_id',
                'verified_at',
            ]);
        });

        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->dropColumn([
                'travel_order_minutes',
                'locator_slip_minutes',
                'other_ob_minutes',
                'suspension_minutes',
                'holiday_minutes',
                'delivered_original_minutes',
            ]);
        });

        Schema::table('faculty_attendances', function (Blueprint $table) {
            $table->dropForeign(['verified_schedule_id']);
            $table->dropColumn([
                'verified_schedule_id',
                'attendance_status',
                'exception_type',
                'exception_reference',
                'exception_overlap_minutes',
                'observed_outcome',
                'observed_modality',
                'makeup_required_minutes',
                'makeup_completed_minutes',
                'verification_status',
                'verification_source',
            ]);
        });
    }
};
