<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\TravelOrder;
use App\Services\EhrisIntegrationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TravelOrderController extends Controller
{
    public function __construct(
        protected EhrisIntegrationService $ehrisService
    ) {}

    /**
     * Display the Travel Orders monitoring hub.
     */
    public function index(Request $request): Response
    {
        $this->ehrisService->syncTravelOrders();

        $query = TravelOrder::with(['faculty.program'])
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

        $faculties = Faculty::with('program')
            ->orderBy('last_name')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->first_name.' '.$f->last_name,
                'faculty_id' => $f->faculty_id,
                'program' => $f->program?->code ?? 'CIDS',
                'photo_url' => $f->photo_url,
            ]);

        $allOrders = TravelOrder::all();
        $metrics = [
            'total' => $allOrders->count(),
            'in_progress' => $allOrders->where('status', 'In Progress')->count(),
            'approved' => $allOrders->where('status', 'Approved')->count(),
            'completed' => $allOrders->where('status', 'Completed')->count(),
        ];

        return Inertia::render('operations/travel-orders/index', [
            'travelOrders' => $travelOrders,
            'faculties' => $faculties,
            'metrics' => $metrics,
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

        return redirect()->back()->with('success', 'Travel Orders synced with e-HRIS API successfully.');
    }
}
