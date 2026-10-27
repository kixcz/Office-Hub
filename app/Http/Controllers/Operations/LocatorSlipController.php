<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\LocatorSlip;
use App\Services\EhrisIntegrationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LocatorSlipController extends Controller
{
    public function __construct(
        protected EhrisIntegrationService $ehrisService
    ) {}

    /**
     * Display the Locator Slips monitoring hub.
     */
    public function index(Request $request): Response
    {
        // Sync or ensure records
        $this->ehrisService->syncLocatorSlips();

        $query = LocatorSlip::with(['faculty.program'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('faculty_id') && $request->input('faculty_id') !== 'all') {
            $query->where('faculty_id', $request->input('faculty_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->input('date'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('slip_number', 'like', "%{$search}%")
                    ->orWhere('destination', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('faculty', function ($fq) use ($search) {
                        $fq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('faculty_id', 'like', "%{$search}%");
                    });
            });
        }

        $slips = $query->get()->map(function ($slip) {
            return [
                'id' => $slip->id,
                'slip_number' => $slip->slip_number,
                'faculty_id' => $slip->faculty_id,
                'faculty_name' => $slip->faculty ? ($slip->faculty->first_name.' '.$slip->faculty->last_name) : $slip->faculty_name,
                'faculty_code' => $slip->faculty?->faculty_id ?? '—',
                'program_code' => $slip->faculty?->program?->code ?? 'CIDS',
                'photo_url' => $slip->faculty?->photo_url,
                'destination' => $slip->destination,
                'purpose' => $slip->purpose,
                'date' => Carbon::parse($slip->date)->format('M d, Y'),
                'raw_date' => $slip->date->toDateString(),
                'time_out' => $slip->time_out ? Carbon::parse($slip->time_out)->format('h:i A') : '—',
                'time_in' => $slip->time_in ? Carbon::parse($slip->time_in)->format('h:i A') : '—',
                'actual_time_out' => $slip->actual_time_out ? Carbon::parse($slip->actual_time_out)->format('h:i A') : '—',
                'actual_time_in' => $slip->actual_time_in ? Carbon::parse($slip->actual_time_in)->format('h:i A') : '—',
                'slip_type' => $slip->slip_type,
                'status' => $slip->status,
                'approver_name' => $slip->approver_name,
                'guard_on_duty' => $slip->guard_on_duty,
                'guard_remarks' => $slip->guard_remarks,
                'remarks' => $slip->remarks,
            ];
        });

        // Faculty directory list for filter and modal dropdowns
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

        // Key metrics
        $allSlips = LocatorSlip::all();
        $metrics = [
            'total' => $allSlips->count(),
            'active_out' => $allSlips->where('status', 'Departed')->count(),
            'returned' => $allSlips->where('status', 'Returned')->count(),
            'approved' => $allSlips->where('status', 'Approved')->count(),
            'today_count' => $allSlips->where('date', Carbon::today()->toDateString())->count(),
        ];

        return Inertia::render('operations/locator-slips/index', [
            'slips' => $slips,
            'faculties' => $faculties,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'faculty_id', 'date', 'search']),
        ]);
    }

    /**
     * Store a newly created Locator Slip for a faculty member from the directory.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'required|exists:faculties,id',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'date' => 'required|date',
            'time_out' => 'required|string',
            'time_in' => 'required|string',
            'slip_type' => 'required|in:Official,Personal',
            'remarks' => 'nullable|string',
        ]);

        $faculty = Faculty::findOrFail($validated['faculty_id']);

        $count = LocatorSlip::whereYear('created_at', date('Y'))->count() + 1;
        $slipNumber = 'LS-'.date('Y').'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);

        LocatorSlip::create([
            'slip_number' => $slipNumber,
            'faculty_id' => $faculty->id,
            'faculty_name' => $faculty->first_name.' '.$faculty->last_name,
            'destination' => $validated['destination'],
            'purpose' => $validated['purpose'],
            'date' => $validated['date'],
            'time_out' => $validated['time_out'],
            'time_in' => $validated['time_in'],
            'slip_type' => $validated['slip_type'],
            'status' => 'Approved',
            'approver_name' => $request->user()?->name ?? 'College Dean / Department Head',
            'remarks' => $validated['remarks'] ?? 'Filed via OfficeHub Faculty Operations',
        ]);

        return redirect()->back()->with('success', "Locator Slip {$slipNumber} created successfully for {$faculty->first_name} {$faculty->last_name}.");
    }

    /**
     * Update status (e.g. Guard Departure / Return logging).
     */
    public function updateStatus(Request $request, LocatorSlip $locatorSlip): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,Departed,Returned,Cancelled',
            'guard_remarks' => 'nullable|string',
        ]);

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'Departed' && ! $locatorSlip->actual_time_out) {
            $updateData['actual_time_out'] = Carbon::now()->toTimeString();
        } elseif ($validated['status'] === 'Returned' && ! $locatorSlip->actual_time_in) {
            $updateData['actual_time_in'] = Carbon::now()->toTimeString();
        }

        if ($request->filled('guard_remarks')) {
            $updateData['guard_remarks'] = $validated['guard_remarks'];
        }

        $locatorSlip->update($updateData);

        return redirect()->back()->with('success', "Locator Slip {$locatorSlip->slip_number} updated to {$validated['status']}.");
    }

    /**
     * Manual Trigger to re-sync with e-HRIS API.
     */
    public function sync(): RedirectResponse
    {
        $this->ehrisService->syncLocatorSlips();

        return redirect()->back()->with('success', 'Locator Slips synced with e-HRIS API successfully.');
    }
}
