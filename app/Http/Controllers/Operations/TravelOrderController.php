<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\TravelOrder;
use App\Services\EhrisIntegrationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TravelOrderController extends Controller
{
    public function __construct(
        protected EhrisIntegrationService $ehrisService
    ) {}

    /**
     * Display the Travel Orders monitoring hub.
     * Serves local synchronized snapshot data immediately and triggers non-blocking background sync if stale.
     */
    public function index(Request $request): Response
    {
        if (! app()->runningUnitTests()) {
            $this->ehrisService->queueSyncIfStale('travel_orders');
        }

        $query = TravelOrder::with([
            'faculty:id,first_name,last_name,faculty_id,program_id,profile_picture',
            'faculty.program:id,code',
        ])
            ->orderBy('start_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('faculty_id') && $request->input('faculty_id') !== 'all') {
            $query->where('faculty_id', $request->input('faculty_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('destination', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('faculty', function ($fq) use ($search) {
                        $fq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('faculty_id', 'like', "%{$search}%");
                    });
            });
        }

        $travelOrders = $query->get()->map(function ($to) {
            $start = Carbon::parse($to->start_date);
            $end = Carbon::parse($to->end_date);
            $durationDays = $start->diffInDays($end) + 1;

            return [
                'id' => $to->id,
                'tracking_number' => $to->tracking_number,
                'faculty_id' => $to->faculty_id,
                'faculty_name' => $to->faculty ? ($to->faculty->first_name.' '.$to->faculty->last_name) : $to->faculty_name,
                'faculty_code' => $to->faculty?->faculty_id ?? '—',
                'program_code' => $to->faculty?->program?->code ?? 'CIDS',
                'photo_url' => $to->faculty?->photo_url,
                'destination' => $to->destination,
                'purpose' => $to->purpose,
                'start_date' => $start->format('M d, Y'),
                'end_date' => $end->format('M d, Y'),
                'duration_days' => $durationDays,
                'raw_start_date' => $to->start_date->toDateString(),
                'raw_end_date' => $to->end_date->toDateString(),
                'travel_type' => $to->travel_type,
                'status' => $to->status,
                'with_per_diem' => (bool) $to->with_per_diem,
                'estimated_budget' => number_format((float) $to->estimated_budget, 2),
                'approver_name' => $to->approver_name,
                'approver_role' => $to->approver_role,
                'remarks' => $to->remarks,
            ];
        });

        $faculties = Cache::remember('officehub_faculty_dropdown_options_v2', 300, function () {
            return Faculty::with('program:id,code')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'faculty_id', 'program_id', 'profile_picture'])
                ->map(fn ($f) => [
                    'id' => $f->id,
                    'name' => $f->first_name.' '.$f->last_name,
                    'faculty_id' => $f->faculty_id,
                    'program' => $f->program?->code ?? 'CIDS',
                    'photo_url' => $f->photo_url,
                ]);
        });

        $agg = TravelOrder::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count
        ")->first();

        $metrics = [
            'total' => (int) ($agg->total ?? 0),
            'in_progress' => (int) ($agg->in_progress_count ?? 0),
            'approved' => (int) ($agg->approved_count ?? 0),
            'completed' => (int) ($agg->completed_count ?? 0),
        ];

        return Inertia::render('operations/travel-orders/index', [
            'travelOrders' => $travelOrders,
            'faculties' => $faculties,
            'metrics' => $metrics,
            'sync_status' => $this->ehrisService->getSyncStatus('travel_orders'),
            'filters' => $request->only(['status', 'faculty_id', 'search']),
        ]);
    }

    /**
     * Store a newly created Travel Order for a directory faculty.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'required|exists:faculties,id',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'travel_type' => 'required|string',
            'with_per_diem' => 'boolean',
            'estimated_budget' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $faculty = Faculty::findOrFail($validated['faculty_id']);

        $count = TravelOrder::whereYear('created_at', date('Y'))->count() + 1;
        $trackingNumber = 'TO-'.date('Y').'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);

        TravelOrder::create([
            'tracking_number' => $trackingNumber,
            'faculty_id' => $faculty->id,
            'faculty_name' => $faculty->first_name.' '.$faculty->last_name,
            'destination' => $validated['destination'],
            'purpose' => $validated['purpose'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'travel_type' => $validated['travel_type'],
            'with_per_diem' => $validated['with_per_diem'] ?? false,
            'estimated_budget' => $validated['estimated_budget'] ?? 0,
            'status' => 'Approved',
            'approver_name' => $request->user()?->name ?? 'Dr. Eleanor Vance (College Dean)',
            'approver_role' => 'College Dean',
            'approved_at' => now(),
            'remarks' => $validated['remarks'] ?? 'Filed via OfficeHub Faculty Operations',
        ]);

        return redirect()->back()->with('success', "Travel Order {$trackingNumber} created successfully for {$faculty->first_name} {$faculty->last_name}.");
    }

    /**
     * Update Travel Order status.
     */
    public function updateStatus(Request $request, TravelOrder $travelOrder): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,In Progress,Completed,Cancelled',
            'remarks' => 'nullable|string',
        ]);

        $travelOrder->update($validated);

        return redirect()->back()->with('success', "Travel Order {$travelOrder->tracking_number} updated to {$validated['status']}.");
    }

    /**
     * Manual Trigger to re-sync with e-HRIS API.
     */
    public function sync(): RedirectResponse
    {
        $this->ehrisService->syncTravelOrders();
        $stats = $this->ehrisService->lastSyncStats;

        if ($stats['error']) {
            return redirect()->back()->with('error', 'e-HRIS sync failed: '.$stats['error']);
        }

        return redirect()->back()->with('success', "e-HRIS sync done: {$stats['fetched']} fetched, {$stats['matched']} matched to OfficeHub faculty.");
    }
}
