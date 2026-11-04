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
        // 1. Enhance colleges table to support Entities (Main/Satellite/Extension Campuses) & full hierarchy
        Schema::table('colleges', function (Blueprint $table) {
            if (! Schema::hasColumn('colleges', 'entity_type')) {
                $table->string('entity_type')->nullable()->after('type'); // Main Campus, Satellite Campus, Extension Campus, Custom
            }
            if (! Schema::hasColumn('colleges', 'address')) {
                $table->string('address')->nullable()->after('contact_email');
            }
            if (! Schema::hasColumn('colleges', 'contact_phone')) {
                $table->string('contact_phone')->nullable()->after('address');
            }
            if (! Schema::hasColumn('colleges', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('status');
            }
            if (! Schema::hasColumn('colleges', 'effective_until')) {
                $table->date('effective_until')->nullable()->after('effective_from');
            }
            if (! Schema::hasColumn('colleges', 'entity_tv_enabled')) {
                $table->boolean('entity_tv_enabled')->default(true)->after('enabled_modules');
            }
            if (! Schema::hasColumn('colleges', 'allow_local_overrides')) {
                $table->boolean('allow_local_overrides')->default(true)->after('entity_tv_enabled');
            }
            if (! Schema::hasColumn('colleges', 'inheritance_settings')) {
                $table->json('inheritance_settings')->nullable()->after('allow_local_overrides');
            }
            if (! Schema::hasColumn('colleges', 'report_defaults')) {
                $table->json('report_defaults')->nullable()->after('inheritance_settings');
            }
        });

        // 2. Link Programs to Colleges so Institution -> Entity -> College -> Program tree is complete
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'college_id')) {
                $table->unsignedBigInteger('college_id')->nullable()->after('id')->index();
            }
        });

        // 3. Enhance Users table for Canonical Identity & Security Lifecycle Management
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'institutional_id')) {
                $table->string('institutional_id')->nullable()->after('id')->index();
            }
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'account_status')) {
                $table->string('account_status')->default('Active')->after('password'); // Active, Invited, Suspended, Locked, Archived
            }
            if (! Schema::hasColumn('users', 'mfa_required')) {
                $table->boolean('mfa_required')->default(false)->after('account_status');
            }
            if (! Schema::hasColumn('users', 'force_password_reset')) {
                $table->boolean('force_password_reset')->default(false)->after('mfa_required');
            }
            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('force_password_reset');
            }
            if (! Schema::hasColumn('users', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('last_login_at');
            }
            if (! Schema::hasColumn('users', 'effective_until')) {
                $table->date('effective_until')->nullable()->after('effective_from');
            }
        });

        // 4. Enhance Roles & Permissions tables for Granular Permission Matrix & Role Risk Classification
        Schema::table('roles', function (Blueprint $table) {
            if (! Schema::hasColumn('roles', 'tier')) {
                $table->string('tier')->default('College')->after('name'); // Institution, Entity, College, Program, Operational, Academic
            }
            if (! Schema::hasColumn('roles', 'risk_level')) {
                $table->string('risk_level')->default('Standard')->after('tier'); // Critical, High, Elevated, Standard, Restricted
            }
            if (! Schema::hasColumn('roles', 'is_system_role')) {
                $table->boolean('is_system_role')->default(true)->after('risk_level');
            }
        });

        Schema::table('permissions', function (Blueprint $table) {
            if (! Schema::hasColumn('permissions', 'module')) {
                $table->string('module')->default('general')->after('name')->index();
            }
            if (! Schema::hasColumn('permissions', 'capability')) {
                $table->string('capability')->default('View')->after('module'); // View, Create, Edit, Delete, Review, Approve, Verify, Publish, Export, Configure, Assign, Reopen, Archive, Audit
            }
        });

        // 5. Enhance ScopedRoleAssignments for Entity Scope, Designation Type (Primary, Secondary, Acting), & Replacement Tracking
        Schema::table('scoped_role_assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('scoped_role_assignments', 'scope_level')) {
                $table->string('scope_level')->default('College')->after('institution'); // Institution, Entity, College, Program, Facility
            }
            if (! Schema::hasColumn('scoped_role_assignments', 'entity_id')) {
                $table->unsignedBigInteger('entity_id')->nullable()->after('scope_level')->index();
            }
            if (! Schema::hasColumn('scoped_role_assignments', 'designation_type')) {
                $table->string('designation_type')->default('Primary')->after('facility_id'); // Primary, Secondary, Acting, Replacement, Scheduled
            }
            if (! Schema::hasColumn('scoped_role_assignments', 'replacing_user_id')) {
                $table->unsignedBigInteger('replacing_user_id')->nullable()->after('designation_type');
            }
            if (! Schema::hasColumn('scoped_role_assignments', 'assigned_by_user_id')) {
                $table->unsignedBigInteger('assigned_by_user_id')->nullable()->after('notes');
            }
        });

        // 6. Access Requests & Delegation Table
        if (! Schema::hasTable('institution_access_requests')) {
            Schema::create('institution_access_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('requester_user_id')->index();
                $table->unsignedBigInteger('target_user_id')->index();
                $table->unsignedBigInteger('requested_role_id')->index();
                $table->string('scope_level')->default('College'); // Institution, Entity, College, Program, Facility
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->unsignedBigInteger('college_id')->nullable();
                $table->unsignedBigInteger('program_id')->nullable();
                $table->string('designation_type')->default('Acting'); // Primary, Secondary, Acting, Emergency Elevation
                $table->date('effective_from')->nullable();
                $table->date('effective_until')->nullable();
                $table->text('justification');
                $table->string('status')->default('Pending'); // Pending, Approved, Denied, Expired, Revoked
                $table->unsignedBigInteger('reviewed_by_user_id')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('decision_remarks')->nullable();
                $table->timestamps();
            });
        }

        // 7. Policy & Standards Templates Table
        if (! Schema::hasTable('institution_policy_templates')) {
            Schema::create('institution_policy_templates', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('title');
                $table->string('category'); // Workload, Attendance, Official Business, Make-Up Classes, Facility Monitoring, Inventory, Research & Extension, Compliance, Retention, Approval Thresholds, Scheduling
                $table->string('version')->default('v1.0');
                $table->string('status')->default('Active'); // Draft, Active, Deprecated, Archived
                $table->date('effective_from')->nullable();
                $table->date('effective_until')->nullable();
                $table->string('inheritance_mode')->default('Allow College Override'); // Mandatory Locked, Allow Entity Override, Allow College Override
                $table->boolean('allow_entity_override')->default(true);
                $table->boolean('allow_college_override')->default(true);
                $table->json('parameters')->nullable();
                $table->text('description')->nullable();
                $table->unsignedBigInteger('updated_by_user_id')->nullable();
                $table->timestamps();
            });
        }

        // 8. Reusable Workflow Definitions Table
        if (! Schema::hasTable('institution_workflow_definitions')) {
            Schema::create('institution_workflow_definitions', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('module'); // Semester Scheduling, Lab Monitoring, Compliance, Inventory Adjustment, Research Activity, College Spotlight, Make-Up Classes
                $table->string('scope_level')->default('Institution'); // Institution, Entity, College
                $table->string('version')->default('v1.0');
                $table->string('status')->default('Active'); // Draft, Active, Archived
                $table->json('steps'); // Array of step objects (order, step_name, role_name, scope, action, required, return_behavior, escalation_hours, delegation_allowed)
                $table->string('return_behavior')->default('Return to Previous Step'); // Return to Previous Step, Return to Submitter
                $table->boolean('allow_delegation')->default(true);
                $table->boolean('separation_of_duties_enforced')->default(true);
                $table->string('final_state')->default('Published / Verified');
                $table->text('description')->nullable();
                $table->unsignedBigInteger('updated_by_user_id')->nullable();
                $table->timestamps();
            });
        }

        // 9. Immutable Governance & Change History Audit Logs Table
        if (! Schema::hasTable('institution_audit_logs')) {
            Schema::create('institution_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('actor_user_id')->nullable()->index();
                $table->string('actor_name');
                $table->string('actor_role')->nullable();
                $table->string('module')->index(); // Organization, Users & Identity, Roles & Permissions, Scoped Assignments, Access Requests, Modules, Terminology, Policies, Workflows, Integrations, Security, Reports, TV Studio
                $table->string('action'); // Created, Updated, Deleted, Archived, Approved, Denied, Overridden, Synced, Security Policy Changed
                $table->string('target_type')->nullable();
                $table->string('target_name');
                $table->string('entity_scope')->nullable()->index();
                $table->string('college_scope')->nullable()->index();
                $table->string('severity')->default('info')->index(); // info, success, warning, critical
                $table->json('previous_value')->nullable();
                $table->json('new_value')->nullable();
                $table->text('reason')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institution_audit_logs');
        Schema::dropIfExists('institution_workflow_definitions');
        Schema::dropIfExists('institution_policy_templates');
        Schema::dropIfExists('institution_access_requests');
    }
};
