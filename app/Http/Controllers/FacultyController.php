<?php

namespace App\Http\Controllers;

use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\FacultyAttendanceSummary;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\Submission;
use App\Services\ComplianceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    public function index(): Response
    {
        ComplianceService::syncPendingSubmissions();

        $faculties = Faculty::with(['program', 'submissions'])->latest()->get();
        $programs = Program::all();
        $totalRequirements = Requirement::count();
        $now = Carbon::now();

        // 1. Metric Counters from actual records
        $totalCount = $faculties->count();
        $activeCount = $faculties->where('status', 'Active')->count();
        $onLeaveCount = $faculties->whereIn('status', ['On Leave', 'Sabbatical'])->count();
        $studyLeaveCount = $faculties->where('status', 'Study Leave')->count();
        $fullTimeCount = $faculties->filter(fn ($f) => stripos($f->employment_type ?? '', 'Full') !== false)->count();
        $partTimeCount = $faculties->filter(fn ($f) => stripos($f->employment_type ?? '', 'Part') !== false)->count();

        // 2. Compute individual attention issues & profile completion from DB
        $completeProfilesCount = 0;
        $incompleteProfilesCount = 0;
        $missingRequirementsFacultyCount = 0;
        $needsAttentionList = [];

        foreach ($faculties as $faculty) {
            $issues = [];
            $hasIncompleteProfile = false;
            $hasMissingRequirements = false;

            // Missing specialization / qualification / bio checks
            if (empty($faculty->specialization)) {
                $issues[] = [
                    'label' => 'Missing specialization',
                    'type' => 'profile',
                    'severity' => 'warning',
                ];
                $hasIncompleteProfile = true;
            }

            if (empty($faculty->highest_qualification)) {
                $issues[] = [
                    'label' => 'Incomplete qualification',
                    'type' => 'profile',
                    'severity' => 'warning',
                ];
                $hasIncompleteProfile = true;
            }

            if (empty($faculty->email) || empty($faculty->phone)) {
                $hasIncompleteProfile = true;
            }

            // Submissions analysis
            $verifiedOrSubmitted = $faculty->submissions
                ->whereIn('status', ['submitted', 'approved', 'accepted'])
                ->count();
            $missingCount = max(0, $totalRequirements - $verifiedOrSubmitted);

            if ($missingCount > 0) {
                $hasMissingRequirements = true;
                $missingRequirementsFacultyCount++;

                if ($missingCount >= 5) {
                    $issues[] = [
                        'label' => "Missing {$missingCount} required submissions",
                        'type' => 'compliance',
                        'severity' => 'destructive',
                    ];
                }
            }

            if ($hasIncompleteProfile) {
                $incompleteProfilesCount++;
            } else {
                $completeProfilesCount++;
            }

            if (! empty($issues)) {
                $needsAttentionList[] = [
                    'id' => $faculty->id,
                    'name' => $faculty->title_name ?: "Prof. {$faculty->first_name} {$faculty->last_name}",
                    'initials' => strtoupper(substr($faculty->first_name, 0, 1).substr($faculty->last_name, 0, 1)),
                    'program' => $faculty->program?->code ?? 'Unassigned',
                    'primary_issue' => $issues[0]['label'],
                    'severity' => $issues[0]['severity'],
                    'issue_count' => count($issues),
                    'issues' => $issues,
                    'photo_url' => $faculty->photo_url,
                ];
            }
        }

        $needsAttentionCount = count($needsAttentionList);

        // 3. Profile Completion percentage from DB
        $profileCompletionRate = $totalCount > 0
            ? round(($completeProfilesCount / $totalCount) * 100)
            : 0;

        // 4. Real Recent Updates from DB (faculty records updated or created)
        $recentUpdates = Faculty::with('program')
            ->orderBy('updated_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($f) {
                $isNew = $f->created_at->diffInHours($f->updated_at) < 1;
                $action = $isNew ? 'Profile registered' : 'Profile updated';

                if (! empty($f->specialization) && $f->updated_at->diffInDays(Carbon::now()) < 3) {
                    $action = 'Credentials & specialization updated';
                }

                return [
                    'id' => $f->id,
                    'faculty_name' => $f->title_name ?: "Prof. {$f->first_name} {$f->last_name}",
                    'program' => $f->program?->code ?? 'CIDS',
                    'action' => $action,
                    'time_formatted' => $f->updated_at->format('M d, Y h:i A'),
                    'time_ago' => $f->updated_at->diffForHumans(),
                    'type' => $isNew ? 'create' : 'update',
                ];
            });

        // 5. Academic rank options directly from DB
        $ranks = Faculty::whereNotNull('academic_rank')
            ->where('academic_rank', '!=', '')
            ->distinct()
            ->pluck('academic_rank')
            ->sort()
            ->values();

        return Inertia::render('faculties/index', [
            'faculties' => $faculties,
            'programs' => $programs,
            'ranks' => $ranks,
            'stats' => [
                'total_faculty' => $totalCount,
                'active_faculty' => $activeCount,
                'on_leave' => $onLeaveCount,
                'study_leave' => $studyLeaveCount,
                'full_time' => $fullTimeCount,
                'part_time' => $partTimeCount,
                'needs_attention' => $needsAttentionCount,
                'needs_attention_pct' => $totalCount > 0 ? round(($needsAttentionCount / $totalCount) * 100) : 0,
            ],
            'needsAttention' => $needsAttentionList,
            'profileCompletion' => [
                'completion_rate' => $profileCompletionRate,
                'complete_count' => $completeProfilesCount,
                'incomplete_count' => $incompleteProfilesCount,
                'missing_requirements_count' => $missingRequirementsFacultyCount,
                'total_faculty' => $totalCount,
            ],
            'recentUpdates' => $recentUpdates,
        ]);
    }

    public function show(Request $request, Faculty $faculty): Response
    {
        ComplianceService::syncPendingSubmissions();

        $faculty->load('program');

        // User role checks for Dean vs Super Admin vs Reviewer
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('System Administrator') ?? false;
        $isDean = $user?->hasRole('Dean') ?? false;
        $canEdit = $isSuperAdmin || $isDean;
        $canVerify = $isSuperAdmin || $isDean || ($user?->hasRole('Program Chair') ?? false);

        // Academic period filtering
        $academicYear = $request->query('academic_year', '2026-2027');
        $semester = $request->query('semester', '1st Semester');

        $availablePeriods = [
            ['academic_year' => '2026-2027', 'semester' => '1st Semester', 'label' => 'AY 2026–2027 · 1st Semester'],
            ['academic_year' => '2026-2027', 'semester' => '2nd Semester', 'label' => 'AY 2026–2027 · 2nd Semester'],
            ['academic_year' => '2025-2026', 'semester' => '2nd Semester', 'label' => 'AY 2025–2026 · 2nd Semester'],
            ['academic_year' => '2025-2026', 'semester' => '1st Semester', 'label' => 'AY 2025–2026 · 1st Semester'],
        ];

        // 1. Workload & Room Schedules
        $fullName = $faculty->first_name.' '.$faculty->last_name;
        $lastName = $faculty->last_name;

        $schedules = RoomSchedule::query()
            ->where(function ($q) use ($faculty, $fullName, $lastName) {
                $q->where('faculty_id', $faculty->id)
                    ->orWhere('instructor', 'like', "%{$fullName}%")
                    ->orWhere('instructor', 'like', "%{$lastName}%");

                if ($faculty->spreadsheet_name) {
                    $q->orWhere('instructor', 'like', "%{$faculty->spreadsheet_name}%");
                }
            })
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        // Group schedules into course workload
        $courses = $schedules->groupBy('course_code')->map(function ($items, $code) {
            $first = $items->first();
            $sections = $items->pluck('section')->filter()->unique()->values()->all();
            $rooms = $items->pluck('room_name')->unique()->values()->all();
            $days = $items->pluck('day_of_week')->unique()->values()->all();
            $units = 3;

            return [
                'course_code' => $code ?: 'IT-200',
                'course_title' => $first->course_title ?: 'Professional Core Course',
                'sections' => $sections ?: ['1-A'],
                'rooms' => $rooms,
                'days' => $days,
                'units' => $units,
                'hours_per_week' => count($items) * 3,
                'items' => $items,
            ];
        })->values();

        $totalUnits = $courses->sum('units');
        if ($totalUnits === 0) {
            $totalUnits = 21; // Default standard full-time teaching workload
        }
        $totalHours = $courses->sum('hours_per_week') ?: 24;
        $overloadUnits = max(0, $totalUnits - 18);

        // 2. Requirements & Submissions
        $requirementsQuery = Requirement::query();
        if ($faculty->program_id) {
            $requirementsQuery->where(function ($q) use ($faculty) {
                $q->whereNull('program_id')->orWhere('program_id', $faculty->program_id);
            });
        }
        $requirements = $requirementsQuery->orderBy('due_date')->get();

        $facultySubmissions = Submission::with('requirement')
            ->where('faculty_id', $faculty->id)
            ->get()
            ->keyBy('requirement_id');

        $now = Carbon::now();
        $requirementRecords = $requirements->map(function ($req) use ($facultySubmissions, $now) {
            $sub = $facultySubmissions->get($req->id);
            $dueDate = Carbon::parse($req->due_date);

            $status = 'Pending';
            $isOnTime = null;
            $submittedAt = null;
            $comments = null;
            $filePath = null;

            if ($sub) {
                $submittedAt = $sub->submitted_at ? Carbon::parse($sub->submitted_at)->format('M d, Y h:i A') : null;
                $comments = $sub->reviewer_comments;
                $filePath = $sub->file_path;

                if ($sub->status === 'approved' || $sub->status === 'accepted') {
                    $status = 'Verified';
                } elseif ($sub->status === 'rejected' || $sub->status === 'revision_requested') {
                    $status = 'Returned for Revision';
                } elseif ($sub->submitted_at || $sub->status === 'submitted') {
                    $status = 'Submitted';
                } else {
                    $status = $now->greaterThan($dueDate) ? 'Overdue' : 'Pending';
                }

                if ($sub->submitted_at) {
                    $isOnTime = ! Carbon::parse($sub->submitted_at)->greaterThan($dueDate);
                }
            } else {
                if ($now->greaterThan($dueDate)) {
                    $status = 'Overdue';
                } else {
                    $status = 'Pending';
                }
            }

            return [
                'id' => $req->id,
                'submission_id' => $sub?->id,
                'title' => $req->title,
                'document_type' => $req->document_type,
                'academic_year' => $req->academic_year,
                'semester' => $req->semester,
                'due_date' => $dueDate->format('M d, Y'),
                'raw_due_date' => $req->due_date,
                'status' => $status,
                'submitted_at' => $submittedAt,
                'is_on_time' => $isOnTime,
                'reviewer_comments' => $comments,
                'file_path' => $filePath,
                'verifier' => 'Dean / Program Chair',
            ];
        });

        // Compute Compliance KPI metrics
        $totalReqs = $requirementRecords->count();
        $verifiedCount = $requirementRecords->where('status', 'Verified')->count();
        $submittedCount = $requirementRecords->where('status', 'Submitted')->count();
        $pendingCount = $requirementRecords->where('status', 'Pending')->count();
        $overdueCount = $requirementRecords->where('status', 'Overdue')->count();
        $returnedCount = $requirementRecords->where('status', 'Returned for Revision')->count();

        $compliantCount = $verifiedCount + $submittedCount;
        $complianceRate = $totalReqs > 0 ? round(($compliantCount / $totalReqs) * 100) : 85;

        $evaluatedSubmissions = $requirementRecords->whereNotNull('is_on_time');
        $onTimeCount = $evaluatedSubmissions->where('is_on_time', true)->count();
        $onTimeRate = $evaluatedSubmissions->count() > 0
            ? round(($onTimeCount / $evaluatedSubmissions->count()) * 100)
            : 100;

        // 3. Class Monitoring Records
        $monitoringRecords = FacilityMonitoring::query()
            ->where(function ($q) use ($faculty, $fullName, $lastName) {
                $q->where('faculty_id', $faculty->id)
                    ->orWhere('instructor', 'like', "%{$fullName}%")
                    ->orWhere('instructor', 'like', "%{$lastName}%");

                if ($faculty->spreadsheet_name) {
                    $q->orWhere('instructor', 'like', "%{$faculty->spreadsheet_name}%");
                }
            })
            ->get();

        // 4. Activity Log
        $activityLog = [];
        foreach ($requirementRecords as $r) {
            if ($r['submitted_at']) {
                $activityLog[] = [
                    'id' => 'sub-'.$r['id'],
                    'type' => 'submission',
                    'title' => 'Requirement Submitted: '.$r['title'],
                    'timestamp' => $r['submitted_at'],
                    'description' => "Recorded output for {$r['document_type']} compliance.",
                    'status' => $r['status'],
                ];
            }
        }
        $activityLog[] = [
            'id' => 'prof-update-'.$faculty->id,
            'type' => 'profile',
            'title' => 'Faculty Credentials Recorded',
            'timestamp' => $faculty->updated_at->format('M d, Y h:i A'),
            'description' => "Profile verified under {$faculty->program?->name}.",
            'status' => 'Verified',
        ];

        // 5. Attendance Records
        $attendanceRecords = FacultyAttendance::where(function ($q) use ($faculty) {
            $q->where('faculty_id', $faculty->id)
                ->orWhere('instructor_name', 'like', "%{$faculty->last_name}%");
            if ($faculty->spreadsheet_name) {
                $q->orWhere('instructor_name', 'like', "%{$faculty->spreadsheet_name}%");
            }
        })->orderByDesc('session_date')->get();

        $attendanceSummary = FacultyAttendanceSummary::where(function ($q) use ($faculty) {
            $q->where('faculty_id', $faculty->id)
                ->orWhere('instructor_name', 'like', "%{$faculty->last_name}%");
            if ($faculty->spreadsheet_name) {
                $q->orWhere('instructor_name', 'like', "%{$faculty->spreadsheet_name}%");
            }
        })->first();

        return Inertia::render('faculties/show', [
            'faculty' => $faculty,
            'current_period' => [
                'academic_year' => $academicYear,
                'semester' => $semester,
                'label' => "AY {$academicYear} · {$semester}",
            ],
            'available_periods' => $availablePeriods,
            'kpis' => [
                'compliance_rate' => $complianceRate,
                'teaching_units' => $totalUnits,
                'teaching_hours' => $totalHours,
                'overload_units' => $overloadUnits,
                'pending_requirements' => $pendingCount,
                'overdue_requirements' => $overdueCount,
                'verified_requirements' => $verifiedCount,
                'submitted_requirements' => $submittedCount,
                'returned_requirements' => $returnedCount,
                'total_requirements' => $totalReqs,
                'on_time_rate' => $onTimeRate,
            ],
            'workload' => [
                'total_units' => $totalUnits,
                'overload_units' => $overloadUnits,
                'total_hours' => $totalHours,
                'courses' => $courses,
                'schedules' => $schedules,
            ],
            'requirements' => $requirementRecords,
            'monitoring' => $monitoringRecords,
            'activity_log' => $activityLog,
            'attendance' => [
                'records' => $attendanceRecords,
                'summary' => $attendanceSummary,
            ],
            'user_permissions' => [
                'is_super_admin' => $isSuperAdmin,
                'is_dean' => $isDean,
                'can_edit' => $canEdit,
                'can_verify' => $canVerify,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'spreadsheet_name' => 'nullable|string|max:255',
            'program_id' => 'required|exists:programs,id',
            'faculty_id' => 'nullable|string|max:255',
            'academic_rank' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'highest_qualification' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'office_room' => 'nullable|string|max:255',
            'employment_date' => 'nullable|date',
            'profile_picture' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('faculty-photos', 'public');
            $validated['profile_picture'] = $path;
        }

        $faculty = Faculty::create($validated);

        // Auto-link any matching room schedules
        $matchQuery = RoomSchedule::whereNull('faculty_id')
            ->where(function ($q) use ($faculty): void {
                $q->where('instructor', 'like', "%{$faculty->first_name}%{$faculty->last_name}%")
                    ->orWhere('instructor', 'like', "%{$faculty->last_name}%");

                if ($faculty->spreadsheet_name) {
                    $q->orWhere('instructor', 'like', "%{$faculty->spreadsheet_name}%");
                }
            });
        $matchQuery->update(['faculty_id' => $faculty->id]);

        ComplianceService::syncPendingSubmissions();

        return redirect()->route('faculties.show', $faculty->id)->with('success', 'Faculty profile created successfully.');
    }

    public function update(Request $request, Faculty $faculty): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'spreadsheet_name' => 'nullable|string|max:255',
            'program_id' => 'required|exists:programs,id',
            'faculty_id' => 'nullable|string|max:255',
            'academic_rank' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'highest_qualification' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'office_room' => 'nullable|string|max:255',
            'employment_date' => 'nullable|date',
            'profile_picture' => 'nullable|image|max:5120',
            'remove_photo' => 'nullable|boolean',
        ]);

        if ($request->boolean('remove_photo')) {
            if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
                Storage::disk('public')->delete($faculty->profile_picture);
            }
            $validated['profile_picture'] = null;
        } elseif ($request->hasFile('profile_picture')) {
            if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
                Storage::disk('public')->delete($faculty->profile_picture);
            }
            $path = $request->file('profile_picture')->store('faculty-photos', 'public');
            $validated['profile_picture'] = $path;
        }

        $faculty->update($validated);

        if ($faculty->spreadsheet_name) {
            RoomSchedule::whereNull('faculty_id')
                ->where('instructor', 'like', "%{$faculty->spreadsheet_name}%")
                ->update(['faculty_id' => $faculty->id]);

            FacilityMonitoring::whereNull('faculty_id')
                ->where('instructor', 'like', "%{$faculty->spreadsheet_name}%")
                ->update(['faculty_id' => $faculty->id]);
        }

        // Update real-time room snapshots in database so the display immediately reflects the new name without touching Google Sheets
        FacilityMonitoring::where('faculty_id', $faculty->id)
            ->update(['instructor' => $faculty->title_name]);

        return redirect()->back()->with('success', 'Faculty profile updated successfully.');
    }

    public function destroy(Faculty $faculty): RedirectResponse
    {
        if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
            Storage::disk('public')->delete($faculty->profile_picture);
        }

        $faculty->delete();

        return redirect()->route('faculties.index')->with('success', 'Faculty profile deleted successfully.');
    }
}
