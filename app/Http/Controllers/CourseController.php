<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Faculty;
use App\Services\CourseAndSectionSyncService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::with([
            'curriculumCourses.curriculum.program',
            'courseOfferings.academicPeriod',
            'courseOfferings.section',
            'courseOfferings.faculty',
        ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('specialization_tag', 'like', "%{$search}%")
                    ->orWhere('required_facility_type', 'like', "%{$search}%")
                    ->orWhere('source', 'like', "%{$search}%");
            });
        }

        if ($request->filled('facility_type') && $request->input('facility_type') !== 'all') {
            $query->where('required_facility_type', $request->input('facility_type'));
        }

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 5 || $perPage > 100) {
            $perPage = 15;
        }

        $courses = $query->orderBy('code', 'asc')->paginate($perPage)->withQueryString();

        // Get qualified faculty members based on specialization tags
        $facultyMembers = Faculty::where('status', 'Active')
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();

        $totalCourses = Course::count();
        $lectureLabSplit = Course::where('lab_hours', '>', 0)->count();
        $pureLecture = Course::where('lab_hours', '<=', 0)->count();
        $activeCourses = Course::where('status', 'Active')->count();

        // Facility types, categories, and sources in catalog
        $facilityTypes = Course::distinct()->pluck('required_facility_type')->filter()->values();
        $categories = Course::distinct()->pluck('category')->filter()->values();
        $sources = Course::distinct()->pluck('source')->filter()->values();

        return Inertia::render('courses/index', [
            'courses' => $courses,
            'facultyMembers' => $facultyMembers,
            'stats' => [
                'total_courses' => $totalCourses,
                'active_courses' => $activeCourses,
                'with_laboratory' => $lectureLabSplit,
                'pure_lecture' => $pureLecture,
            ],
            'facilityTypes' => $facilityTypes,
            'categories' => $categories,
            'sources' => $sources,
            'filters' => [
                'search' => $request->input('search', ''),
                'facility_type' => $request->input('facility_type', 'all'),
                'category' => $request->input('category', 'all'),
                'status' => $request->input('status', 'all'),
                'source' => $request->input('source', 'all'),
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:courses,code',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|numeric|min:0|max:12',
            'lecture_hours' => 'required|numeric|min:0|max:20',
            'lab_hours' => 'required|numeric|min:0|max:20',
            'required_facility_type' => 'required|string|max:100',
            'required_equipment' => 'nullable|string|max:255',
            'can_split_lab_hours' => 'boolean',
            'preferred_block_length' => 'nullable|numeric|min:1|max:6',
            'category' => 'required|string|max:100',
            'specialization_tag' => 'nullable|string|max:100',
            'prerequisites' => 'nullable|string|max:255',
            'corequisites' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'source' => 'nullable|string|max:100',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['room_type_required'] = $validated['required_facility_type'];
        $validated['can_split_lab_hours'] = $request->boolean('can_split_lab_hours', false);
        $validated['source'] = $validated['source'] ?? 'Manual Entry';

        Course::create($validated);

        return redirect()->back()->with('success', 'Canonical Course added to the academic catalog.');
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:courses,code,'.$course->id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|numeric|min:0|max:12',
            'lecture_hours' => 'required|numeric|min:0|max:20',
            'lab_hours' => 'required|numeric|min:0|max:20',
            'required_facility_type' => 'required|string|max:100',
            'required_equipment' => 'nullable|string|max:255',
            'can_split_lab_hours' => 'boolean',
            'preferred_block_length' => 'nullable|numeric|min:1|max:6',
            'category' => 'required|string|max:100',
            'specialization_tag' => 'nullable|string|max:100',
            'prerequisites' => 'nullable|string|max:255',
            'corequisites' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'source' => 'nullable|string|max:100',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['room_type_required'] = $validated['required_facility_type'];
        $validated['can_split_lab_hours'] = $request->boolean('can_split_lab_hours', false);

        $course->update($validated);

        return redirect()->back()->with('success', 'Course catalog record updated successfully.');
    }

    public function destroy(Course $course)
    {
        // Check if used in active offerings
        if ($course->courseOfferings()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete course: it is actively referenced in semester Course Offerings.');
        }

        $course->curriculumCourses()->delete();
        $course->delete();

        return redirect()->back()->with('success', 'Course removed from academic catalog.');
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

        $msg = "Sync complete: {$result['courses_created']} courses added, {$result['courses_updated']} updated, {$result['sections_created']} sections added.";

        return redirect()->back()->with('success', $msg);
    }

    public function importCatalog(Request $request, CourseAndSectionSyncService $syncService)
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());
            $result = $syncService->importCustomCsv($content, 'CSV File Import', 'BSIT');

            return redirect()->back()->with('success', "Import complete: {$result['courses_created']} courses added, {$result['courses_updated']} updated.");
        }

        $validated = $request->validate([
            'courses' => 'required|array',
            'courses.*.code' => 'required|string|max:50',
            'courses.*.title' => 'required|string|max:255',
            'courses.*.units' => 'required|numeric',
            'courses.*.lecture_hours' => 'required|numeric',
            'courses.*.lab_hours' => 'required|numeric',
            'courses.*.required_facility_type' => 'nullable|string',
            'courses.*.category' => 'nullable|string',
            'source' => 'nullable|string',
        ]);

        $source = $request->input('source', 'Manual Import');
        $imported = 0;
        foreach ($validated['courses'] as $item) {
            $code = strtoupper(trim($item['code']));
            Course::updateOrCreate(
                ['code' => $code],
                [
                    'title' => $item['title'],
                    'units' => $item['units'],
                    'lecture_hours' => $item['lecture_hours'],
                    'lab_hours' => $item['lab_hours'],
                    'required_facility_type' => $item['required_facility_type'] ?? 'Lecture Room',
                    'room_type_required' => $item['required_facility_type'] ?? 'Lecture Room',
                    'category' => $item['category'] ?? 'Major',
                    'status' => 'Active',
                    'source' => $source,
                ]
            );
            $imported++;
        }

        return redirect()->back()->with('success', "Successfully imported {$imported} courses into catalog.");
    }
}
