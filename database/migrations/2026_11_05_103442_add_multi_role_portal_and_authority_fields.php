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
        // 1. Users default portal reference
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('default_role_assignment_id')
                ->nullable()
                ->after('account_status')
                ->constrained('scoped_role_assignments')
                ->nullOnDelete();
        });

        // 2. Scoped Role Assignments appointment metadata
        Schema::table('scoped_role_assignments', function (Blueprint $table) {
            $table->string('appointment_reference')->nullable()->after('designation_type');
            $table->string('assignment_reason')->nullable()->after('appointment_reference');
        });

        // 3. Roles portal mapping and assignment authority
        Schema::table('roles', function (Blueprint $table) {
            $table->string('portal_type')->nullable()->after('tier');
            $table->json('assignable_by')->nullable()->after('allowed_scopes');
        });

        // 4. Audit logs scope specifics
        Schema::table('institution_audit_logs', function (Blueprint $table) {
            $table->string('scope_type')->nullable()->after('college_scope');
            $table->string('scope_name')->nullable()->after('scope_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('institution_audit_logs', function (Blueprint $table) {
            $table->dropColumn(['scope_type', 'scope_name']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['portal_type', 'assignable_by']);
        });

        Schema::table('scoped_role_assignments', function (Blueprint $table) {
            $table->dropColumn(['appointment_reference', 'assignment_reason']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_role_assignment_id']);
            $table->dropColumn('default_role_assignment_id');
        });
    }
};
