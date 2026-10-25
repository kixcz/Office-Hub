<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Curriculum;
use App\Models\CurriculumCourse;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Room;
use App\Models\Section;
use App\Services\CourseAndSectionSyncService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current()
            ?? AcademicPeriod::orderBy('id', 'desc')->first();

        $selectedPeriodId = $request->input('academic_period_id', $currentPeriod?->id);

        $query = Section::with([
            'program',
            'curriculum',
            'adviser',
            'academicPeriod',
            'courseOfferings' => function ($q) {
                $q->with(['course', 'faculty']);
            },
            'roomSchedules.faculty',
            'examSchedules',
        ]);

        if ($selectedPeriodId && $selectedPeriodId !== 'all') {
            $query->where('academic_period_id', $selectedPeriodId);
        }

        if ($request->filled('program_id') && $request->input('program_id') !== 'all') {
            $query->where('program_id', $request->input('program_id'));
        }

        if ($request->filled('year_level') && $request->input('year_level') !== 'all') {
            $query->where('year_level', $request->input('year_level'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhere('source', 'like', "%{$search}%")
                    ->orWhereHas('program', function ($pq) use ($search) {
                        $pq->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('adviser', function ($aq) use ($search) {
                        $aq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $sections = $query->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('code')
            ->get();

        // Calculate max room capacity across campus for validation
        $maxRoomCapacity = (int) Room::max('capacity') ?: 45;

        // Perform cohort validations & structured readiness checks for each section
        $sectionsWithValidation = $sections->map(function ($sec) use ($maxRoomCapacity) {
            $validationWarnings = [];

            // 1. Check if section has active curriculum
            $hasCurriculum = ! empty($sec->curriculum_id) && ! empty($sec->curriculum);
            if (! $hasCurriculum) {
                $validationWarnings[] = 'Section has no curriculum version assigned.';
            }

            // 2. Check if section enrollment exceeds all compatible room capacities
            $studentCount = $sec->actual_count ?: $sec->population;
            $roomCapacityValid = $studentCount <= $maxRoomCapacity;
            if (! $roomCapacityValid) {
                $validationWarnings[] = "Section enrollment ({$studentCount}) exceeds campus room capacity (max {$maxRoomCapacity} seats).";
            }

            // 3. Expected offerings check
            $expectedOfferingsCount = 0;
            if ($hasCurriculum) {
                $expectedOfferingsCount = CurriculumCourse::where('curriculum_id', $sec->curriculum_id)
                    ->where('year_level', $sec->year_level)
                    ->where('requirement_type', 'Required')
                    ->count();
            }

            $offeringsCount = $sec->courseOfferings->count();
            $facultyAssignedCount = $sec->courseOfferings->whereNotNull('faculty_id')->count();
            $scheduledCount = $sec->roomSchedules->count();
            $examsCount = $sec->examSchedules->count();

            // Missing required curriculum offerings check
            $offeringsComplete = true;
            if ($expectedOfferingsCount > 0) {
                $assignedRequired = $sec->courseOfferings->filter(function ($co) {
                    return $co->offering_type === 'Regular';
                })->count();

                if ($assignedRequired < $expectedOfferingsCount) {
                    $missingCount = $expectedOfferingsCount - $assignedRequired;
                    $validationWarnings[] = "Missing {$missingCount} required curriculum offering(s) for Year {$sec->year_level}.";
                    $offeringsComplete = false;
                }
            } elseif ($offeringsCount === 0) {
                $offeringsComplete = false;
            }

            // Offerings without faculty check
            $facultyComplete = ($offeringsCount > 0) && ($facultyAssignedCount >= $offeringsCount);
            $unassignedOfferings = $sec->courseOfferings->whereNull('faculty_id');
            if ($unassignedOfferings->count() > 0) {
                $validationWarnings[] = "{$unassignedOfferings->count()} course offering(s) lack an assigned faculty instructor.";
            }

            // Timetable scheduling check
            $scheduleComplete = ($offeringsCount > 0) && ($scheduledCount >= $offeringsCount);

            // Derive structured readiness status
            $readinessChecks = [
                'curriculum_assigned' => $hasCurriculum,
                'required_offerings_complete' => $offeringsComplete,
                'faculty_loading_complete' => $facultyComplete,
                'schedule_complete' => $scheduleComplete,
                'room_capacity_valid' => $roomCapacityValid,
                'exam_schedule_complete' => ($examsCount > 0),
            ];

            // Derive overall readiness status
            if (! $roomCapacityValid) {
                $readinessStatus = 'Conflict Detected';
            } elseif (! $hasCurriculum || ! $offeringsComplete || $offeringsCount === 0) {
                $readinessStatus = 'Needs Configuration';
            } elseif (! $facultyComplete) {
                $readinessStatus = 'Needs Faculty Loading';
            } elseif (! $scheduleComplete) {
                $readinessStatus = 'Needs Scheduling';
            } else {
                $readinessStatus = 'Ready';
            }

            // Generate synthetic audit history if needed
            $auditHistory = [
                [
                    'date' => $sec->created_at ? $sec->created_at->format('M d, Y') : 'Academic Setup',
                    'action' => 'Section created by College Admin',
                    'type' => 'creation',
                ],
            ];

            if ($offeringsCount > 0) {
                $auditHistory[] = [
                    'date' => $sec->created_at ? $sec->created_at->format('M d, Y') : 'Academic Setup',
                    'action' => "{$offeringsCount} course offering(s) generated from ".($sec->curriculum?->version_name ?? 'curriculum'),
                    'type' => 'offerings',
                ];
            }

            if ($sec->adviser) {
                $auditHistory[] = [
                    'date' => $sec->updated_at ? $sec->updated_at->format('M d, Y') : 'Recent',
                    'action' => "Academic Adviser set to {$sec->adviser->full_name}",
                    'type' => 'adviser',
                ];
            }

            $secArray = $sec->toArray();
            $secArray['validation_warnings'] = $validationWarnings;
            $secArray['readiness_checks'] = $readinessChecks;
            $secArray['readiness_status'] = $readinessStatus;
            $secArray['offerings_count'] = $offeringsCount;
            $secArray['expected_offerings_count'] = $expectedOfferingsCount ?: $offeringsCount;
            $secArray['faculty_assigned_count'] = $facultyAssignedCount;
            $secArray['scheduled_count'] = $scheduledCount;
            $secArray['exams_count'] = $examsCount;
            $secArray['room_capacity_valid'] = $roomCapacityValid;
            $secArray['audit_history'] = $auditHistory;

            return $secArray;
        });

        // Hierarchical Grouping: Program -> Year Level -> Sections
        $programs = Program::with('curricula')->orderBy('code')->get();
        $academicPeriods = AcademicPeriod::orderBy('id', 'desc')->get();
        $facultyMembers = Faculty::where('status', 'Active')
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();
        $courses = Course::where('status', 'Active')->orderBy('code')->get();

        // Operational KPI stats
        $totalSections = $sectionsWithValidation->count();
        $activeSections = $sectionsWithValidation->where('status', 'Active')->count();
        $totalStudents = $sectionsWithValidation->sum(fn ($s) => $s['actual_count'] ?? $s['population']);
        $readySections = $sectionsWithValidation->where('readiness_status', 'Ready')->count();
        $needAttentionSections = $sectionsWithValidation->where('readiness_status', '!=', 'Ready')->count();

        // Distinct sources for filtering
        $sources = Section::distinct()->pluck('source')->filter()->values();

        return Inertia::render('sections/index', [
            'sections' => $sectionsWithValidation,
            'programs' => $programs,
            'academicPeriods' => $academicPeriods,
            'currentPeriod' => $currentPeriod,
            'facultyMembers' => $facultyMembers,
            'courses' => $courses,
            'sources' => $sources,
            'stats' => [
                'total_sections' => $totalSections,
                'active_sections' => $activeSections,
                'total_students' => $totalStudents,
                'ready_sections' => $readySections,
                'need_attention_sections' => $needAttentionSections,
            ],
            'filters' => [
                'academic_period_id' => (string) $selectedPeriodId,
                'program_id' => $request->input('program_id', 'all'),
                'year_level' => $request->input('year_level', 'all'),
                'status' => $request->input('status', 'all'),
                'source' => $request->input('source', 'all'),
                'search' => $request->input('search', ''),
                'readiness' => $request->input('readiness', 'all'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_period_id' => 'required|exists:academic_periods,id',
            'program_id' => 'required|exists:programs,id',
            'curriculum_id' => 'nullable|exists:curricula,id',
            'adviser_id' => 'nullable|exists:faculties,id',
            'code' => 'required|string|max:50',
            'year_level' => 'required|integer|min:1|max:6',
            'population' => 'required|integer|min:1|max:120',
            'actual_count' => 'nullable|integer|min:0|max:120',
            'status' => 'required|string|in:Planned,Active,Inactive,Closed',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'remarks' => 'nullable|string',
            'auto_generate_offerings' => 'boolean',
        ]);

        $code = strtoupper(trim($validated['code']));

        // Check duplicate section code within the same academic period
        $existing = Section::where('academic_period_id', $validated['academic_period_id'])
            ->where('code', $code)
            ->first();

        if ($existing) {
            return redirect()->back()->with('error', "Section code {$code} already exists in this academic period.");
        }

        // Default curriculum to active curriculum of program if none specified
        if (empty($validated['curriculum_id'])) {
            $program = Program::find($validated['program_id']);
            $activeCurric = $program?->curricula()->where('status', 'Active')->first()
                ?? $program?->curricula()->first();
            $validated['curriculum_id'] = $activeCurric?->id;
        }

        $section = Section::create([
            'academic_period_id' => $validated['academic_period_id'],
            'program_id' => $validated['program_id'],
            'curriculum_id' => $validated['curriculum_id'],
            'adviser_id' => $validated['adviser_id'] ?? null,
            'code' => $code,
            'year_level' => $validated['year_level'],
            'population' => $validated['population'],
            'actual_count' => $validated['actual_count'] ?? $validated['population'],
            'status' => $validated['status'],
            'effective_from' => $validated['effective_from'] ?? null,
            'effective_until' => $validated['effective_until'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'source' => $request->input('source', 'Manual Entry'),
        ]);

        // If requested, auto-generate initial semester course offerings from curriculum
        if ($request->boolean('auto_generate_offerings') && $section->curriculum_id) {
            $this->instantiateSectionOfferings($section);
        }

        return redirect()->back()->with('success', "Student cohort {$section->code} created successfully.");
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'curriculum_id' => 'nullable|exists:curricula,id',
            'adviser_id' => 'nullable|exists:faculties,id',
            'year_level' => 'required|integer|min:1|max:6',
            'population' => 'required|integer|min:1|max:120',
            'actual_count' => 'nullable|integer|min:0|max:120',
            'status' => 'required|string|in:Planned,Active,Inactive,Closed',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'remarks' => 'nullable|string',
            'source' => 'nullable|string|max:100',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        $section->update($validated);

        return redirect()->back()->with('success', "Section {$section->code} updated successfully.");
    }

    public function syncSheets(Request $request, CourseAndSectionSyncService $syncService)
    {
        $spreadsheetUrl = $request->input('spreadsheet_url');
        $spreadsheetId = null;

        if ($spreadsheetUrl && preg_match('/\/d\/([a-zA-Z0-9-_]+)/', $spreadsheetUrl, $matches)) {
            $spreadsheetId = $matches[1];
        }

        $result = $syncService->syncFromGoogleSheets($spreadsheetId);

        if (! empty($result['errors'])) {
            return redirect()->back()->with('warning', 'Synced with warnings: '.implode('; ', $result['errors']));
        }

        $msg = "Sync complete: {$result['sections_created']} sections added, {$result['sections_updated']} updated, {$result['courses_created']} courses added.";

        return redirect()->back()->with('success', $msg);
    }

    public function importCsv(Request $request, CourseAndSectionSyncService $syncService)
    {
        $request->validate([
            'file' => 'required|file',
            'program_code' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $prog = $request->input('program_code', 'BSIT');

        $result = $syncService->importCustomCsv($content, 'CSV File Import', $prog);

        return redirect()->back()->with('success', "Import complete: {$result['sections_created']} sections added, {$result['sections_updated']} updated.");
    }

    public function destroy(Section $section)
    {
        // Delete or detach dependent offerings
        $section->courseOfferings()->delete();
        $section->delete();

        return redirect()->back()->with('success', "Section {$section->code} removed successfully.");
    }

    public function bulkCreate(Request $request)
    {
        $validated = $request->validate([
            'academic_period_id' => 'required|exists:academic_periods,id',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|min:1|max:6',
            'curriculum_id' => 'nullable|exists:curricula,id',
            'section_suffixes' => 'required|string', // e.g. "A, B, C" or "1, 2"
            'population' => 'required|integer|min:1|max:100',
            'status' => 'required|string|in:Planned,Active',
            'auto_generate_offerings' => 'boolean',
        ]);

        $program = Program::findOrFail($validated['program_id']);
        $suffixes = array_filter(array_map('trim', explode(',', $validated['section_suffixes'])));

        $curriculumId = $validated['curriculum_id'];
        if (! $curriculumId) {
            $curriculumId = $program->curricula()->where('status', 'Active')->value('id')
                ?? $program->curricula()->value('id');
        }

        $created = 0;
        foreach ($suffixes as $suffix) {
            $code = strtoupper("{$program->code}-{$validated['year_level']}{$suffix}");

            $exists = Section::where('academic_period_id', $validated['academic_period_id'])
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                $section = Section::create([
                    'academic_period_id' => $validated['academic_period_id'],
                    'program_id' => $program->id,
                    'curriculum_id' => $curriculumId,
                    'code' => $code,
                    'year_level' => $validated['year_level'],
                    'population' => $validated['population'],
                    'actual_count' => $validated['population'],
                    'status' => $validated['status'],
                ]);

                if ($request->boolean('auto_generate_offerings') && $curriculumId) {
                    $this->instantiateSectionOfferings($section);
                }

                $created++;
            }
        }

        return redirect()->back()->with('success', "Successfully created {$created} section cohort(s) for {$program->code}.");
    }

    public function copyPreviousSections(Request $request)
    {
        $validated = $request->validate([
            'source_period_id' => 'required|exists:academic_periods,id',
            'target_period_id' => 'required|exists:academic_periods,id',
            'advance_year_level' => 'boolean', // e.g. Year 1 becomes Year 2
        ]);

        $sourceSections = Section::where('academic_period_id', $validated['source_period_id'])->get();

        if ($sourceSections->isEmpty()) {
            return redirect()->back()->with('error', 'No sections found in the source academic period.');
        }

        $copied = 0;
        foreach ($sourceSections as $src) {
            $targetYear = $request->boolean('advance_year_level')
                ? min(4, $src->year_level + 1)
                : $src->year_level;

            // Compute new code if year advanced (e.g. BSIT-1A -> BSIT-2A)
            $code = $src->code;
            if ($request->boolean('advance_year_level') && preg_match('/^([A-Z]+)-(\d+)(.*)$/', $src->code, $matches)) {
                $code = "{$matches[1]}-{$targetYear}{$matches[3]}";
            }

            $exists = Section::where('academic_period_id', $validated['target_period_id'])
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                $newSec = Section::create([
                    'academic_period_id' => $validated['target_period_id'],
                    'program_id' => $src->program_id,
                    'curriculum_id' => $src->curriculum_id,
                    'adviser_id' => $src->adviser_id,
                    'code' => $code,
                    'year_level' => $targetYear,
                    'population' => $src->population,
                    'actual_count' => $src->actual_count,
                    'status' => 'Active',
                    'remarks' => "Copied from {$src->code} (Period #{$src->academic_period_id})",
                ]);

                $this->instantiateSectionOfferings($newSec);
                $copied++;
            }
        }

        return redirect()->back()->with('success', "Copied {$copied} section(s) to target academic period.");
    }

    public function generateOfferingsForSection(Section $section)
    {
        if (! $section->curriculum_id) {
            return redirect()->back()->with('error', 'Section has no assigned curriculum version.');
        }

        $count = $this->instantiateSectionOfferings($section);

        return redirect()->back()->with('success', "Generated {$count} course offering(s) from curriculum for {$section->code}.");
    }

    private function instantiateSectionOfferings(Section $section): int
    {
        $period = $section->academicPeriod ?? AcademicPeriod::find($section->academic_period_id);
        if (! $period || ! $section->curriculum_id) {
            return 0;
        }

        $semPlacement = '1st Semester';
        if (stripos($period->semester ?? '', '2') !== false || stripos($period->name ?? '', '2nd') !== false) {
            $semPlacement = '2nd Semester';
        }

        $curriculumCourses = CurriculumCourse::where('curriculum_id', $section->curriculum_id)
            ->where('year_level', $section->year_level)
            ->where('semester_placement', $semPlacement)
            ->with('course')
            ->get();

        $created = 0;
        foreach ($curriculumCourses as $cc) {
            $course = $cc->course;
            if (! $course) {
                continue;
            }

            $offeringCode = $course->code.'-'.$section->code.'-'.$period->id;

            $exists = CourseOffering::where('academic_period_id', $period->id)
                ->where('course_id', $course->id)
                ->where('section_id', $section->id)
                ->first();

            if (! $exists) {
                CourseOffering::create([
                    'academic_period_id' => $period->id,
                    'course_id' => $course->id,
                    'program_id' => $section->program_id,
                    'curriculum_id' => $section->curriculum_id,
                    'section_id' => $section->id,
                    'offering_code' => $offeringCode,
                    'course_code' => $course->code,
                    'course_title' => $course->title,
                    'section_name' => $section->code,
                    'year_level' => $section->year_level,
                    'expected_enrollment' => $section->actual_count ?: $section->population,
                    'offering_type' => $cc->requirement_type === 'Elective' ? 'Elective' : 'Regular',
                    'units' => $course->units,
                    'lecture_hours' => $course->lecture_hours,
                    'lab_hours' => $course->lab_hours,
                    'room_type_required' => $course->required_facility_type ?? 'Lecture Room',
                    'loading_status' => 'Unassigned',
                    'timetable_status' => 'Pending',
                    'publication_status' => 'Draft',
                ]);
                $created++;
            }
        }

        return $created;
    }
}
