<?php

namespace Database\Seeders;

use App\Models\College;
use App\Models\Program;
use App\Models\QmsApprovalStep;
use App\Models\QmsApprovalWorkflow;
use App\Models\QmsCodeRule;
use App\Models\QmsDocument;
use App\Models\QmsDocumentAssignment;
use App\Models\QmsDocumentAuditLog;
use App\Models\QmsDocumentInstance;
use App\Models\QmsDocumentRevision;
use App\Models\QmsDocumentType;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class QmsDocumentControlSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();
        $admin = User::first();
        $cids = College::where('code', 'CIDS')->first();
        $bsit = Program::where('code', 'BSIT')->first();

        // 1. Roles
        $qmsAdminRole = Role::firstOrCreate(
            ['name' => 'University QMS Administrator'],
            [
                'tier' => 'Institution',
                'risk_level' => 'High',
                'description' => 'Institution-wide coding policies, master register, governance and delegated approvals.',
            ]
        );

        $collegeDocCtrlRole = Role::firstOrCreate(
            ['name' => 'College Document Controller'],
            [
                'tier' => 'College',
                'risk_level' => 'Elevated',
                'description' => 'Registers and manages documents within an authorized college scope.',
            ]
        );

        // Assign College Document Controller to Quames / QA Coordinator if user exists
        $qaUser = User::where('email', 'like', '%qa%')->orWhere('email', 'like', '%quames%')->first()
            ?? User::where('email', 'admin@cids.edu')->first()
            ?? $admin;

        if ($qaUser && $cids) {
            QmsDocumentAssignment::updateOrCreate(
                [
                    'user_id' => $qaUser->id,
                    'role_name' => 'College Document Controller',
                    'college_id' => $cids->id,
                ],
                [
                    'scope_level' => 'College',
                    'is_active' => true,
                    'assigned_by_user_id' => $admin?->id,
                ]
            );
        }

        // 2. Document Types
        $types = [
            ['code' => 'FRM', 'name' => 'Forms & Controlled Templates', 'description' => 'Official templates, submission forms, and student/faculty blanks.', 'default_review_cycle_months' => 12, 'icon' => 'FileSpreadsheet'],
            ['code' => 'POL', 'name' => 'Policies & Regulations', 'description' => 'Governance rules, academic policies, and institutional directives.', 'default_review_cycle_months' => 24, 'icon' => 'ShieldCheck'],
            ['code' => 'SOP', 'name' => 'Standard Operating Procedures', 'description' => 'Documented multi-step procedures and workflows.', 'default_review_cycle_months' => 12, 'icon' => 'CheckCircle2'],
            ['code' => 'MAN', 'name' => 'Manuals & Charters', 'description' => 'Faculty manuals, lab manuals, and operational guidebooks.', 'default_review_cycle_months' => 24, 'icon' => 'BookOpen'],
            ['code' => 'WI', 'name' => 'Work Instructions', 'description' => 'Specific step-by-step equipment or task execution guides.', 'default_review_cycle_months' => 12, 'icon' => 'ListOrdered'],
            ['code' => 'REP', 'name' => 'Controlled Reports & Matrices', 'description' => 'Official audit, compliance, and accreditation reports.', 'default_review_cycle_months' => 12, 'icon' => 'FileText'],
        ];

        $docTypeMap = [];
        foreach ($types as $t) {
            $created = QmsDocumentType::updateOrCreate(['code' => $t['code']], $t);
            $docTypeMap[$t['code']] = $created->id;
        }

        // 3. Code Rules
        QmsCodeRule::updateOrCreate(
            ['name' => 'Collegiate Standard Document Rule'],
            [
                'scope_level' => 'College',
                'prefix_format' => '{INST}-{COL}-{TYPE}-{SEQ}',
                'sequence_digits' => 3,
                'current_sequence' => 12,
                'sample_code' => 'DSSC-CIDS-FRM-001',
                'description' => 'Standard ISO coding format for College forms, SOPs, and manuals.',
                'is_active' => true,
                'created_by' => $admin?->id,
            ]
        );

        QmsCodeRule::updateOrCreate(
            ['name' => 'University-Wide Standard Document Rule'],
            [
                'scope_level' => 'Institution',
                'prefix_format' => '{INST}-ALL-{TYPE}-{SEQ}',
                'sequence_digits' => 3,
                'current_sequence' => 5,
                'sample_code' => 'DSSC-ALL-POL-001',
                'description' => 'University-wide master coding for cross-college policies and institutional manuals.',
                'is_active' => true,
                'created_by' => $admin?->id,
            ]
        );

        // 4. Standard Approval Workflow
        $workflow = QmsApprovalWorkflow::updateOrCreate(
            ['name' => 'Standard 5-Step Academic Document Approval Workflow'],
            [
                'document_type_id' => $docTypeMap['FRM'] ?? null,
                'scope_level' => 'College',
                'description' => 'Configurable lifecycle: Draft -> Endorsement -> Code Validation -> College Approval -> Publication.',
                'is_active' => true,
            ]
        );

        $steps = [
            ['step_order' => 1, 'step_name' => 'Program Endorsement', 'required_role' => 'Program Head', 'can_skip_if_same_user' => false],
            ['step_order' => 2, 'step_name' => 'QMS Code Validation', 'required_role' => 'QA Coordinator', 'can_skip_if_same_user' => false],
            ['step_order' => 3, 'step_name' => 'Dean Approval', 'required_role' => 'Dean', 'can_skip_if_same_user' => false],
            ['step_order' => 4, 'step_name' => 'Institutional QMS Review', 'required_role' => 'University QMS Administrator', 'can_skip_if_same_user' => true],
            ['step_order' => 5, 'step_name' => 'Final Document Publication', 'required_role' => 'College Document Controller', 'can_skip_if_same_user' => false],
        ];

        foreach ($steps as $st) {
            QmsApprovalStep::updateOrCreate(
                ['workflow_id' => $workflow->id, 'step_order' => $st['step_order']],
                $st
            );
        }

        // 5. Approved Controlled Document Templates (from User Specification)
        $documents = [
            [
                'code' => 'DSSC-CIDS-FRM-001',
                'title' => 'Faculty Workload Form',
                'type' => 'FRM',
                'rev' => '02',
                'date' => '2026-11-19',
                'summary' => 'Updated laboratory prep credit formulas and contact hour balancing.',
                'status' => 'Effective',
            ],
            [
                'code' => 'DSSC-CIDS-FRM-008',
                'title' => 'Accomplishment Report',
                'type' => 'FRM',
                'rev' => '03',
                'date' => '2026-10-15',
                'summary' => 'Aligned point rubric with CHED NBC 461 and ISO 9001:2026 verification evidence.',
                'status' => 'Effective',
            ],
            [
                'code' => 'DSSC-CIDS-FRM-012',
                'title' => 'Course Syllabus Template',
                'type' => 'FRM',
                'rev' => '01',
                'date' => '2026-08-01',
                'summary' => 'Initial OBE course syllabus framework with ILO-SO mapping tables.',
                'status' => 'Effective',
            ],
            [
                'code' => 'DSSC-CIDS-SOP-004',
                'title' => 'Laboratory Safety Procedure',
                'type' => 'SOP',
                'rev' => '01',
                'date' => '2026-09-01',
                'summary' => 'Standard safety guidelines, incident escalation, and hardware checkout log.',
                'status' => 'For Review',
            ],
            [
                'code' => 'DSSC-ALL-FRM-005',
                'title' => 'Procurement Request Form',
                'type' => 'FRM',
                'rev' => '02',
                'date' => '2026-07-10',
                'summary' => 'Updated BAC requisition categories and threshold authorizations.',
                'status' => 'Effective',
            ],
        ];

        foreach ($documents as $docData) {
            $doc = QmsDocument::updateOrCreate(
                ['document_code' => $docData['code']],
                [
                    'title' => $docData['title'],
                    'description' => "Official controlled {$docData['title']} under ISO 9001:2026 Quality Management System.",
                    'document_type_id' => $docTypeMap[$docData['type']],
                    'owner_unit_type' => str_contains($docData['code'], 'ALL') ? 'Institution' : 'College',
                    'owner_college_id' => str_contains($docData['code'], 'ALL') ? null : ($cids?->id),
                    'owner_program_id' => null,
                    'status' => $docData['status'],
                    'created_by' => $admin?->id,
                ]
            );

            $rev = QmsDocumentRevision::updateOrCreate(
                [
                    'document_id' => $doc->id,
                    'revision_number' => $docData['rev'],
                ],
                [
                    'effective_date' => $docData['date'],
                    'review_due_date' => Carbon::parse($docData['date'])->addYear(),
                    'change_summary' => $docData['summary'],
                    'prepared_by_user_id' => $admin?->id,
                    'approved_by_user_id' => $admin?->id,
                    'published_by_user_id' => $admin?->id,
                    'published_at' => Carbon::parse($docData['date']),
                    'status' => $docData['status'] === 'Effective' ? 'Effective' : 'Pending Approval',
                ]
            );

            $doc->update(['current_revision_id' => $rev->id]);

            // Add initial audit log
            QmsDocumentAuditLog::create([
                'document_id' => $doc->id,
                'revision_id' => $rev->id,
                'action' => 'Published Revision',
                'actor_user_id' => $admin?->id,
                'actor_name' => $admin?->name ?? 'System Administrator',
                'actor_role' => 'Document Control Authority',
                'ip_address' => '127.0.0.1',
                'details' => ['revision' => $docData['rev'], 'status' => $docData['status']],
            ]);
        }

        // 6. Seed Instances matching the faculty demonstration metrics:
        // "12 Submissions | 2 In Review | 10 Completed"
        $facultyUser = User::where('email', 'msantos@cids.edu')->first()
            ?? User::where('email', 'like', '%faculty%')->first()
            ?? $admin;

        $workloadDoc = QmsDocument::where('document_code', 'DSSC-CIDS-FRM-001')->first();
        $accomplishmentDoc = QmsDocument::where('document_code', 'DSSC-CIDS-FRM-008')->first();
        $syllabusDoc = QmsDocument::where('document_code', 'DSSC-CIDS-FRM-012')->first();

        if ($facultyUser && $workloadDoc && $accomplishmentDoc && $syllabusDoc) {
            // 2 In Review
            QmsDocumentInstance::updateOrCreate(
                ['record_reference' => 'LOAD-2026-000145'],
                [
                    'document_id' => $workloadDoc->id,
                    'document_revision_id' => $workloadDoc->current_revision_id,
                    'title' => 'Faculty Loading Report - AY 2026-2027 1st Sem',
                    'source_module' => 'faculty_workload',
                    'academic_year' => '2026-2027',
                    'semester' => '1st Semester',
                    'generated_by_user_id' => $facultyUser->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'submitted_at' => Carbon::now()->subDays(2),
                    'status' => 'Submitted',
                    'remarks' => 'Submitted for Department Head and Dean sign-off.',
                ]
            );

            QmsDocumentInstance::updateOrCreate(
                ['record_reference' => 'SYLL-2026-000088'],
                [
                    'document_id' => $syllabusDoc->id,
                    'document_revision_id' => $syllabusDoc->current_revision_id,
                    'title' => 'Course Syllabus - Advanced Web Systems (IT 312)',
                    'source_module' => 'compliance',
                    'academic_year' => '2026-2027',
                    'semester' => '1st Semester',
                    'generated_by_user_id' => $facultyUser->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'submitted_at' => Carbon::now()->subDays(1),
                    'status' => 'Submitted',
                    'remarks' => 'Syllabus submission pending QA verification.',
                ]
            );

            // 10 Completed records
            for ($i = 1; $i <= 10; $i++) {
                $ref = sprintf('ACC-2026-%06d', $i);
                QmsDocumentInstance::updateOrCreate(
                    ['record_reference' => $ref],
                    [
                        'document_id' => $accomplishmentDoc->id,
                        'document_revision_id' => $accomplishmentDoc->current_revision_id,
                        'title' => "Verified Faculty Deliverable #{$i} - Q{$i}",
                        'source_module' => 'accomplishments',
                        'academic_year' => '2026-2027',
                        'semester' => '1st Semester',
                        'generated_by_user_id' => $facultyUser->id,
                        'college_id' => $cids?->id,
                        'program_id' => $bsit?->id,
                        'submitted_at' => Carbon::now()->subWeeks(12 - $i),
                        'status' => 'Verified',
                        'remarks' => 'Official compliance deliverable approved and archived.',
                    ]
                );
            }
        }
    }
}
