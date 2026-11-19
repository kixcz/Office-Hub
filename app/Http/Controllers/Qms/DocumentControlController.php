<?php

namespace App\Http\Controllers\Qms;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\QmsApprovalWorkflow;
use App\Models\QmsCodeRule;
use App\Models\QmsDocument;
use App\Models\QmsDocumentAuditLog;
use App\Models\QmsDocumentType;
use App\Services\Qms\DocumentControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentControlController extends Controller
{
    public function __construct(
        protected DocumentControlService $qmsService
    ) {}

    /**
     * Display the Master Document Register & QMS Document Control Dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $collegeId = $request->input('college_id', $user?->college_id);

        $metrics = $this->qmsService->getDashboardMetrics($collegeId ? (int) $collegeId : null);

        // Fetch documents for the register
        $docsQuery = QmsDocument::with(['documentType', 'college', 'currentRevision', 'creator'])
            ->orderBy('document_code');

        if ($collegeId) {
            $docsQuery->where(function ($q) use ($collegeId) {
                $q->where('owner_college_id', $collegeId)
                    ->orWhere('owner_unit_type', 'Institution');
            });
        }

        $documents = $docsQuery->paginate(20)->withQueryString();

        // Pending registration requests (status = draft, submitted, endorsed, or under_review)
        $pendingQuery = QmsDocument::with(['documentType', 'college', 'creator', 'currentRevision'])
            ->whereIn('status', ['Draft', 'For Endorsement', 'For Code Validation', 'For Approval'])
            ->latest();

        if ($collegeId) {
            $pendingQuery->where(function ($q) use ($collegeId) {
                $q->where('owner_college_id', $collegeId)
                    ->orWhere('owner_unit_type', 'Institution');
            });
        }

        $pendingRequests = $pendingQuery->limit(15)->get();

        // Document types & rules for coding modal/tabs
        $documentTypes = QmsDocumentType::where('is_active', true)->orderBy('code')->get();
        $codeRules = QmsCodeRule::where('is_active', true)->get();
        $colleges = College::where('is_active', true)->orderBy('name')->get();
        $workflows = QmsApprovalWorkflow::with('steps')->where('is_active', true)->get();

        // Recent audit logs
        $auditLogs = QmsDocumentAuditLog::with(['user', 'document'])
            ->latest()
            ->limit(15)
            ->get();

        return Inertia::render('qms/index', [
            'metrics' => $metrics,
            'documents' => $documents,
            'pendingRequests' => $pendingRequests,
            'documentTypes' => $documentTypes,
            'codeRules' => $codeRules,
            'colleges' => $colleges,
            'workflows' => $workflows,
            'auditLogs' => $auditLogs,
            'filters' => [
                'college_id' => $collegeId,
            ],
        ]);
    }

    /**
     * Originator / Faculty requests registration of a document or code.
     */
    public function requestCode(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'document_type_id' => 'required|exists:qms_document_types,id',
            'college_id' => 'nullable|exists:colleges,id',
            'scope' => 'required|in:institution,entity,college,program,operational',
            'description' => 'nullable|string',
            'confidentiality' => 'nullable|in:public,internal,confidential,restricted',
            'review_cycle_months' => 'nullable|integer|min:1',
            'change_summary' => 'nullable|string',
            'workflow_id' => 'nullable|exists:qms_approval_workflows,id',
        ]);

        $collegeId = $validated['college_id'] ?? $request->user()?->college_id;

        $document = $this->qmsService->requestRegistration($validated, $request->user(), $collegeId);

        return redirect()->back()->with('success', "Registration request submitted. Allocated Document Code: {$document->document_code}");
    }

    /**
     * Transition a document through the workflow approval chain.
     */
    public function transition(Request $request, QmsDocument $document): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:endorse,validate_code,approve,publish,return,reject,obsolete',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $this->qmsService->transitionDocument($document, $validated['action'], $request->user(), $validated['remarks'] ?? null);

        return redirect()->back()->with('success', "Document {$document->document_code} transitioned via action '{$validated['action']}'.");
    }

    /**
     * Return JSON of approved active templates for modal selection.
     */
    public function templatesJson(Request $request): JsonResponse
    {
        $collegeId = $request->input('college_id', $request->user()?->college_id);
        $templates = $this->qmsService->getApprovedTemplates($collegeId ? (int) $collegeId : null);

        return response()->json([
            'templates' => $templates,
        ]);
    }

    /**
     * Record a new document instance (e.g. faculty filling a controlled form).
     */
    public function recordInstance(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:qms_documents,id',
            'title' => 'required|string|max:255',
            'academic_period_id' => 'nullable|exists:academic_periods,id',
            'file_path' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $instance = $this->qmsService->recordInstance(
            $validated['document_id'],
            $request->user(),
            $validated['title'],
            $validated['academic_period_id'] ?? null,
            $validated['file_path'] ?? null,
            $validated['metadata'] ?? []
        );

        return redirect()->back()->with('success', "Record created with reference: {$instance->record_reference}");
    }
}
