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
        // 1. Expand lab_in_charge_assignments to include role, days of week, and effective dates
        Schema::table('lab_in_charge_assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_in_charge_assignments', 'role_type')) {
                $table->string('role_type')->default('Primary')->after('shift_name'); // Primary, Backup
            }
            if (! Schema::hasColumn('lab_in_charge_assignments', 'assigned_days')) {
                $table->string('assigned_days')->default('Monday–Saturday')->after('role_type');
            }
            if (! Schema::hasColumn('lab_in_charge_assignments', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('assigned_days');
            }
            if (! Schema::hasColumn('lab_in_charge_assignments', 'effective_until')) {
                $table->date('effective_until')->nullable()->after('effective_from');
            }
        });

        // 2. Expand lab_monitoring_sessions for room condition, session outcome, alternative room, and historical flags
        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_monitoring_sessions', 'room_condition')) {
                $table->string('room_condition')->default('In Use as Scheduled')->after('observation_status');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'session_outcome')) {
                $table->string('session_outcome')->default('Conducted as Scheduled')->after('room_condition');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'alternative_room_id')) {
                $table->foreignId('alternative_room_id')->nullable()->after('session_outcome')->constrained('rooms')->nullOnDelete();
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'is_historical_reconciliation')) {
                $table->boolean('is_historical_reconciliation')->default(false)->after('alternative_room_id');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'correction_requested')) {
                $table->boolean('correction_requested')->default(false)->after('is_historical_reconciliation');
            }
            if (! Schema::hasColumn('lab_monitoring_sessions', 'correction_notes')) {
                $table->text('correction_notes')->nullable()->after('correction_requested');
            }
        });

        // 3. Expand lab_monitoring_discrepancies for lifecycle status
        Schema::table('lab_monitoring_discrepancies', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_monitoring_discrepancies', 'evidence_details')) {
                $table->text('evidence_details')->nullable()->after('remarks');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_monitoring_discrepancies', function (Blueprint $table) {
            $table->dropColumn(['evidence_details']);
        });

        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            $table->dropForeign(['alternative_room_id']);
            $table->dropColumn([
                'room_condition',
                'session_outcome',
                'alternative_room_id',
                'is_historical_reconciliation',
                'correction_requested',
                'correction_notes',
            ]);
        });

        Schema::table('lab_in_charge_assignments', function (Blueprint $table) {
            $table->dropColumn([
                'role_type',
                'assigned_days',
                'effective_from',
                'effective_until',
            ]);
        });
    }
};
