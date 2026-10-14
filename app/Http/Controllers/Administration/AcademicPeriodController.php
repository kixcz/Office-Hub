<?php

namespace App\Http\Controllers\Administration;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicPeriodController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicPeriod::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('academic_year', 'like', "%{$search}%")
                    ->orWhere('semester', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('academic_year') && $request->input('academic_year') !== 'all') {
            $query->where('academic_year', $request->input('academic_year'));
        }

        $periods = $query->orderBy('start_date', 'desc')->get();

        $currentPeriod = AcademicPeriod::current();

        $totalPeriods = AcademicPeriod::count();
        $nextSemesterPrepared = AcademicPeriod::where('status', 'Draft')->exists();

        // Extract distinct academic years
        $academicYears = AcademicPeriod::distinct()->pluck('academic_year')->values()->all();

        return Inertia::render('administration/academic-periods/index', [
            'periods' => $periods,
            'currentPeriod' => $currentPeriod,
            'stats' => [
                'total_periods' => $totalPeriods,
                'dependent_modules_synced' => 9,
                'current_status' => $currentPeriod?->status ?? 'None',
                'current_period_name' => $currentPeriod ? "AY {$currentPeriod->academic_year} | {$currentPeriod->semester}" : 'None',
                'next_semester_prepared' => $nextSemesterPrepared ? 'Yes' : 'No',
                'next_semester_label' => 'AY 2026 – 2027 | 2nd Semester',
            ],
            'academicYears' => $academicYears,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'academic_year' => $request->input('academic_year', 'all'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string|max:50',
            'semester' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'class_start_date' => 'required|date',
            'class_end_date' => 'required|date|after_or_equal:class_start_date',
            'midterm_start_date' => 'nullable|date',
            'midterm_end_date' => 'nullable|date|after_or_equal:midterm_start_date',
            'final_start_date' => 'nullable|date',
            'final_end_date' => 'nullable|date|after_or_equal:final_start_date',
            'status' => 'required|string|in:Draft,Active,Closed,Archived',
            'is_current' => 'boolean',
            'notes' => 'nullable|string',
            'planning_rules_version' => 'nullable|string',
            'planning_parameters' => 'nullable|array',
        ]);

        if (empty($validated['planning_rules_version'])) {
            $validated['planning_rules_version'] = 'Default Rules v2';
        }

        $period = AcademicPeriod::create($validated);

        if ($request->boolean('is_current') || $validated['status'] === 'Active') {
            $period->activate();
        }

        return redirect()->back()->with('success', 'Academic Period created successfully.');
    }

    public function update(Request $request, AcademicPeriod $academicPeriod)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string|max:50',
            'semester' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'class_start_date' => 'required|date',
            'class_end_date' => 'required|date|after_or_equal:class_start_date',
            'midterm_start_date' => 'nullable|date',
            'midterm_end_date' => 'nullable|date|after_or_equal:midterm_start_date',
            'final_start_date' => 'nullable|date',
            'final_end_date' => 'nullable|date|after_or_equal:final_start_date',
            'status' => 'required|string|in:Draft,Active,Closed,Archived',
            'is_current' => 'boolean',
            'notes' => 'nullable|string',
            'planning_rules_version' => 'nullable|string',
            'planning_parameters' => 'nullable|array',
        ]);

        $academicPeriod->update($validated);

        if ($request->boolean('is_current') || $validated['status'] === 'Active') {
            $academicPeriod->activate();
        }

        return redirect()->back()->with('success', 'Academic Period updated successfully.');
    }

    public function activate(Request $request, AcademicPeriod $academicPeriod)
    {
        $closePrevious = $request->boolean('close_previous', false);
        $academicPeriod->activate($closePrevious);

        return redirect()->back()->with('success', "{$academicPeriod->academic_year} {$academicPeriod->semester} is now the active academic period.");
    }

    public function close(AcademicPeriod $academicPeriod)
    {
        $academicPeriod->close();

        return redirect()->back()->with('success', "{$academicPeriod->academic_year} {$academicPeriod->semester} has been closed.");
    }

    public function archive(AcademicPeriod $academicPeriod)
    {
        $academicPeriod->archive();

        return redirect()->back()->with('success', "{$academicPeriod->academic_year} {$academicPeriod->semester} has been archived.");
    }

    public function duplicateSetup(Request $request, AcademicPeriod $academicPeriod)
    {
        $targetYear = $request->input('target_academic_year', '2026 – 2027');
        $targetSemester = $request->input('target_semester', '2nd Semester');

        $clone = $academicPeriod->replicate([
            'is_current',
            'status',
            'code',
        ]);

        $clone->academic_year = $targetYear;
        $clone->semester = $targetSemester;
        $clone->status = 'Draft';
        $clone->is_current = false;
        $clone->notes = "Setup duplicated from {$academicPeriod->academic_year} {$academicPeriod->semester}.";
        $clone->save();

        return redirect()->back()->with('success', "Replicated configuration from {$academicPeriod->academic_year} {$academicPeriod->semester} into a new Draft period.");
    }

    public function destroy(AcademicPeriod $academicPeriod)
    {
        if ($academicPeriod->is_current) {
            return redirect()->back()->with('error', 'Cannot delete the currently active academic period. Please activate another period first.');
        }

        $academicPeriod->delete();

        return redirect()->back()->with('success', 'Academic period deleted successfully.');
    }
}
