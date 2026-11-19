<?php

namespace App\Services\Qms;

use App\Models\College;
use App\Models\Program;
use App\Models\QmsCodeRule;
use App\Models\QmsDocument;
use App\Models\QmsDocumentApproval;
use App\Models\QmsDocumentAuditLog;
use App\Models\QmsDocumentInstance;
use App\Models\QmsDocumentRevision;
use App\Models\QmsDocumentType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DocumentControlService
{
    /**
     * Atomically generate next unique document code based on scope rules.
     */
    public function generateDocumentCode(string $typeCode, ?College $college = null, ?Program $program = null): string
    {
        return DB::transaction(function () use ($typeCode, $college) {
            $scopeLevel = $college ? 'College' : 'Institution';
            $rule = QmsCodeRule::where('scope_level', $scopeLevel)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            $institutionAcronym = 'DSSC';
            $collegeAcronym = $college ? strtoupper($college->code) : 'ALL';
            $typeAcronym = strtoupper($typeCode);

            $ruleSeq = ($rule?->current_sequence ?? 0) + 1;
            if ($rule) {
                $rule->update(['current_sequence' => $ruleSeq]);
            }

            $digits = $rule?->sequence_digits ?? 3;
            $seqFormatted = str_pad((string) $ruleSeq, $digits, '0', STR_PAD_LEFT);

            // e.g. DSSC-CIDS-FRM-013 or DSSC-ALL-POL-006
            $candidateCode = "{$institutionAcronym}-{$collegeAcronym}-{$typeAcronym}-{$seqFormatted}";

            // Safety loop if code already exists in db
            while (QmsDocument::where('document_code', $candidateCode)->exists()) {
                $ruleSeq++;
                if ($rule) {
                    $rule->update(['current_sequence' => $ruleSeq]);
                }
                $seqFormatted = str_pad((string) $ruleSeq, $digits, '0', STR_PAD_LEFT);
                $candidateCode = "{$institutionAcronym}-{$collegeAcronym}-{$typeAcronym}-{$seqFormatted}";
            }

            return $candidateCode;
        });
    }

    /**
     * Register a new controlled document draft or registration request.
     */
    public function requestRegistration(array $data, User $originator): QmsDocument
    {
        return DB::transaction(function () use ($data, $originator) {
            $college = ! empty($data['college_id']) ? College::find($data['college_id']) : $originator->resolveActiveCollege();
            $program = ! empty($data['program_id']) ? Program::find($data['program_id']) : null;
            $type = QmsDocumentType::findOrFail($data['document_type_id']);

            // Auto-generate official code or reserve provisional code
            $documentCode = ! empty($data['custom_code'])
                ? trim($data['custom_code'])
                : $this->generateDocumentCode($type->code, $college, $program);

            $status = $data['initial_status'] ?? 'For Endorsement';

            $document = QmsDocument::create([
                'document_code' => $documentCode,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'document_type_id' => $type->id,
                'owner_unit_type' => $college ? 'College' : 'Institution',
                'owner_college_id' => $college?->id,
                'owner_program_id' => $program?->id,
                'status' => $status,
                'created_by' => $originator->id,
            ]);

            $revision = QmsDocumentRevision::create([
                'document_id' => $document->id,
                'revision_number' => $data['revision_number'] ?? '01',
                'effective_date' => $data['effective_date'] ?? Carbon::today(),
                'review_due_date' => Carbon::parse($data['effective_date'] ?? Carbon::today())->addMonths($type->default_review_cycle_months),
                'change_summary' => $data['change_summary'] ?? 'Initial creation and registration request.',
                'prepared_by_user_id' => $originator->id,
                'status' => 'Pending Approval',
            ]);

            $document->update(['current_revision_id' => $revision->id]);

            // Immutable Audit Log
            QmsDocumentAuditLog::create([
                'document_id' => $document->id,
                'revision_id' => $revision->id,
                'action' => 'Requested Registration',
                'actor_user_id' => $originator->id,
                'actor_name' => $originator->name,
                'actor_role' => 'Document Originator',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'details' => [
                    'document_code' => $documentCode,
                    'title' => $document->title,
                    'status' => $status,
                ],
            ]);

            return $document;
        });
    }

    /**
     * Fetch approved controlled templates accessible to a given college or university-wide.
     */
    public function getApprovedTemplates(?int $collegeId = null)
    {
        $query = QmsDocument::with(['documentType', 'college', 'currentRevision'])
            ->where('status', 'Effective');

        if ($collegeId) {
            $query->where(function ($q) use ($collegeId) {
                $q->where('owner_college_id', $collegeId)
                    ->orWhereNull('owner_college_id')
                    ->orWhere('owner_unit_type', 'Institution');
            });
        }

        return $query->orderBy('document_code')->get();
    }

    /**
     * Create a record instance that inherits an approved controlled template code.
     */
    public function recordInstance(
        QmsDocument $document,
        string $sourceModule,
        ?int $sourceRecordId,
        string $title,
        User $user,
        ?string $academicYear = '2026-2027',
        ?string $semester = '1st Semester',
        array $metadata = []
    ): QmsDocumentInstance {
        $prefix = match ($sourceModule) {
            'faculty_workload' => 'LOAD',
            'accomplishments' => 'ACC',
            'compliance' => 'COMP',
            'scheduling' => 'SCHED',
            'facilities' => 'FAC',
            default => 'REC',
        };

        $year = Carbon::now()->year;
        $uniqueNum = QmsDocumentInstance::where('source_module', $sourceModule)->count() + 1;
        $recordRef = sprintf('%s-%d-%06d', $prefix, $year, $uniqueNum);

        while (QmsDocumentInstance::where('record_reference', $recordRef)->exists()) {
            $uniqueNum++;
            $recordRef = sprintf('%s-%d-%06d', $prefix, $year, $uniqueNum);
        }

        $college = $document->owner_college_id ? $document->college : $user->resolveActiveCollege();

        return QmsDocumentInstance::create([
            'document_id' => $document->id,
            'document_revision_id' => $document->current_revision_id,
            'record_reference' => $recordRef,
            'title' => $title,
            'source_module' => $sourceModule,
            'source_record_id' => $sourceRecordId,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'generated_by_user_id' => $user->id,
            'college_id' => $college?->id,
            'program_id' => $document->owner_program_id,
            'submitted_at' => Carbon::now(),
            'status' => 'Submitted',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Progress approval workflow action (Endorse, Validate, Approve, Publish, Return, Reject).
     */
    public function transitionDocument(QmsDocument $document, User $actor, string $action, ?string $remarks = null): QmsDocument
    {
        return DB::transaction(function () use ($document, $actor, $action, $remarks) {
            $nextStatus = match ($action) {
                'endorse' => 'For Code Validation',
                'validate_code' => 'For Approval',
                'approve' => 'For Publication',
                'publish' => 'Effective',
                'return' => 'Returned for Revision',
                'reject' => 'Rejected',
                'obsolete' => 'Obsolete',
                default => $document->status,
            };

            $document->update(['status' => $nextStatus]);

            if ($action === 'publish' && $document->currentRevision) {
                $document->currentRevision->update([
                    'status' => 'Effective',
                    'published_by_user_id' => $actor->id,
                    'published_at' => Carbon::now(),
                ]);
            }

            QmsDocumentApproval::create([
                'document_id' => $document->id,
                'revision_id' => $document->current_revision_id,
                'step_name' => ucfirst(str_replace('_', ' ', $action)),
                'approver_user_id' => $actor->id,
                'role_used' => $actor->roles->first()?->name ?? 'Approver',
                'action' => ucfirst($action),
                'remarks' => $remarks,
                'signature_hash' => hash('sha256', $document->document_code.$actor->id.now()->toIso8601String()),
                'action_at' => Carbon::now(),
            ]);

            QmsDocumentAuditLog::create([
                'document_id' => $document->id,
                'revision_id' => $document->current_revision_id,
                'action' => ucfirst(str_replace('_', ' ', $action)),
                'actor_user_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->roles->first()?->name ?? 'Staff',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'details' => ['new_status' => $nextStatus, 'remarks' => $remarks],
            ]);

            return $document->fresh(['currentRevision', 'documentType', 'college']);
        });
    }

    /**
     * Get compiled dashboard statistics for QMS Administration & College Controllers.
     */
    public function getDashboardMetrics(?int $collegeId = null): array
    {
        $docQuery = QmsDocument::query();
        if ($collegeId) {
            $docQuery->where(function ($q) use ($collegeId) {
                $q->where('owner_college_id', $collegeId)->orWhereNull('owner_college_id');
            });
        }

        $totalControlled = (clone $docQuery)->where('status', 'Effective')->count();
        $pendingRegistrations = (clone $docQuery)->whereIn('status', ['For Endorsement', 'For Code Validation', 'For Approval'])->count();
        $revisionRequests = QmsDocumentRevision::where('status', 'Pending Approval')->count();
        $obsoleteCount = (clone $docQuery)->whereIn('status', ['Superseded', 'Obsolete'])->count();

        return [
            'total_controlled_documents' => $totalControlled,
            'controlled_documents' => $totalControlled,
            'pending_registrations' => $pendingRegistrations,
            'revision_requests' => $revisionRequests,
            'obsolete_documents' => $obsoleteCount,
        ];
    }
}
