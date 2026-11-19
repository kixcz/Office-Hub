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
        // 1. QMS Document Types (Forms, Policies, SOPs, Manuals, Instructions, Reports)
        Schema::create('qms_document_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // FRM, POL, SOP, MAN, WI, REP
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('default_review_cycle_months')->default(12);
            $table->string('icon', 50)->default('FileText');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. QMS Code Rules & Prefixes
        Schema::create('qms_code_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('scope_level', 50)->default('College'); // Institution, Entity, College, Program
            $table->string('prefix_format')->default('{INST}-{COL}-{TYPE}-{SEQ}');
            $table->unsignedTinyInteger('sequence_digits')->default(3);
            $table->unsignedInteger('current_sequence')->default(0);
            $table->string('sample_code')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 3. QMS Controlled Documents (Permanent Identity)
        Schema::create('qms_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_code', 100)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('document_type_id')->constrained('qms_document_types')->cascadeOnDelete();
            $table->string('owner_unit_type', 50)->default('College'); // Institution, Entity, College, Program
            $table->foreignId('owner_college_id')->nullable()->constrained('colleges')->nullOnDelete();
            $table->foreignId('owner_program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('status', 50)->default('Draft'); // Draft, For Endorsement, For Code Validation, For Approval, Effective, Returned for Revision, Rejected, Withdrawn, Superseded, Obsolete, Archived
            $table->unsignedBigInteger('current_revision_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['owner_college_id', 'status']);
            $table->index(['document_type_id', 'status']);
        });

        // 4. QMS Document Revisions (Version Files, Revisions, Effective Dates)
        Schema::create('qms_document_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('qms_documents')->cascadeOnDelete();
            $table->string('revision_number', 20)->default('01'); // 01, 02, 03...
            $table->date('effective_date')->nullable();
            $table->date('review_due_date')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->text('change_summary')->nullable();
            $table->foreignId('prepared_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('published_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->string('status', 50)->default('Draft'); // Draft, Pending Approval, Effective, Superseded, Obsolete
            $table->timestamps();

            $table->unique(['document_id', 'revision_number']);
        });

        // Update foreign key for current_revision_id on qms_documents
        Schema::table('qms_documents', function (Blueprint $table) {
            $table->foreign('current_revision_id')->references('id')->on('qms_document_revisions')->nullOnDelete();
        });

        // 5. QMS Document Instances (Filled Out Forms / Generated Records referencing controlled template)
        Schema::create('qms_document_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('qms_documents')->cascadeOnDelete();
            $table->foreignId('document_revision_id')->nullable()->constrained('qms_document_revisions')->nullOnDelete();
            $table->string('record_reference', 100)->unique(); // e.g. LOAD-2026-000145
            $table->string('title')->nullable();
            $table->string('source_module', 100)->nullable(); // faculty_workload, accomplishments, compliance, scheduling, etc.
            $table->unsignedBigInteger('source_record_id')->nullable();
            $table->string('academic_year', 50)->nullable();
            $table->string('semester', 50)->nullable();
            $table->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('college_id')->nullable()->constrained('colleges')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->string('status', 50)->default('Submitted'); // Draft, Submitted, Verified, Rejected
            $table->text('remarks')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['source_module', 'source_record_id']);
            $table->index(['college_id', 'status']);
        });

        // 6. QMS Approval Workflows
        Schema::create('qms_approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('document_type_id')->nullable()->constrained('qms_document_types')->nullOnDelete();
            $table->string('scope_level', 50)->default('College'); // Institution, Entity, College, Program
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. QMS Approval Steps
        Schema::create('qms_approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('qms_approval_workflows')->cascadeOnDelete();
            $table->unsignedTinyInteger('step_order')->default(1);
            $table->string('step_name'); // Endorsement, Code Validation, College Approval, Final Control, Publication
            $table->string('required_role'); // Program Head, QA Coordinator, Dean, QMS Admin, Document Controller
            $table->boolean('can_skip_if_same_user')->default(false);
            $table->timestamps();
        });

        // 8. QMS Document Approvals
        Schema::create('qms_document_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('qms_documents')->cascadeOnDelete();
            $table->foreignId('revision_id')->nullable()->constrained('qms_document_revisions')->nullOnDelete();
            $table->unsignedTinyInteger('step_order')->default(1);
            $table->string('step_name');
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role_used')->nullable();
            $table->string('action', 50); // Endorsed, Validated, Approved, Returned, Rejected, Published
            $table->text('remarks')->nullable();
            $table->string('signature_hash')->nullable();
            $table->timestamp('action_at')->useCurrent();
            $table->timestamps();
        });

        // 9. QMS Document Permissions
        Schema::create('qms_document_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('qms_documents')->cascadeOnDelete();
            $table->string('scope_level', 50)->default('College');
            $table->foreignId('college_id')->nullable()->constrained('colleges')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->boolean('can_view')->default(true);
            $table->boolean('can_use_template')->default(true);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->timestamps();
        });

        // 10. QMS Document Audit Logs
        Schema::create('qms_document_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('qms_documents')->cascadeOnDelete();
            $table->foreignId('revision_id')->nullable()->constrained('qms_document_revisions')->nullOnDelete();
            $table->string('action'); // Registered, Endorsed, Code Assigned, Approved, Returned, Published, Superseded, Downloaded
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
        });

        // 11. QMS Document Controller Assignments
        Schema::create('qms_document_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role_name', 100); // Institution QMS Administrator, College Document Controller
            $table->string('scope_level', 50)->default('College'); // Institution, Entity, College
            $table->foreignId('college_id')->nullable()->constrained('colleges')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qms_document_assignments');
        Schema::dropIfExists('qms_document_audit_logs');
        Schema::dropIfExists('qms_document_permissions');
        Schema::dropIfExists('qms_document_approvals');
        Schema::dropIfExists('qms_approval_steps');
        Schema::dropIfExists('qms_approval_workflows');
        Schema::dropIfExists('qms_document_instances');

        Schema::table('qms_documents', function (Blueprint $table) {
            $table->dropForeign(['current_revision_id']);
        });

        Schema::dropIfExists('qms_document_revisions');
        Schema::dropIfExists('qms_documents');
        Schema::dropIfExists('qms_code_rules');
        Schema::dropIfExists('qms_document_types');
    }
};
