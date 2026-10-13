<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $data = self::getCalendarData();

        return Inertia::render('schedule/calendar/index', $data);
    }

    public function eventsJson(Request $request)
    {
        return response()->json(self::getCalendarData());
    }

    /**
     * @return array{events: Collection, programs: \Illuminate\Database\Eloquent\Collection, venues: array, defaultDate: string}
     */
    public static function getCalendarData(): array
    {
        self::ensureBaselineEvents();

        $meetings = Meeting::with('program')->get()->map(function ($m) {
            return [
                'id' => 'm_'.$m->id,
                'raw_id' => $m->id,
                'type' => 'meeting',
                'title' => $m->title,
                'date' => Carbon::parse($m->date)->format('Y-m-d'),
                'start_time' => Carbon::parse($m->start_time)->format('h:i A'),
                'end_time' => Carbon::parse($m->end_time)->format('h:i A'),
                'venue' => $m->venue ?: 'N/A',
                'status' => $m->status ?: 'Scheduled',
                'program' => $m->program ? $m->program->code : 'All',
                'program_id' => $m->program_id,
                'description' => $m->agenda ?: $m->notes,
            ];
        });

        $activities = Activity::with('program')->get()->map(function ($a) {
            $cat = strtolower($a->category ?: '');
            $type = 'activity';
            if (str_contains($cat, 'exam') || str_contains(strtolower($a->title), 'exam')) {
                $type = 'examination';
            } elseif ($cat === 'others') {
                $type = 'others';
            }

            return [
                'id' => 'a_'.$a->id,
                'raw_id' => $a->id,
                'type' => $type,
                'title' => $a->title,
                'date' => Carbon::parse($a->date)->format('Y-m-d'),
                'start_time' => Carbon::parse($a->start_time)->format('h:i A'),
                'end_time' => Carbon::parse($a->end_time)->format('h:i A'),
                'venue' => $a->venue ?: 'N/A',
                'status' => $a->status ?: 'Scheduled',
                'program' => $a->program ? $a->program->code : 'All',
                'program_id' => $a->program_id,
                'description' => $a->description,
            ];
        });

        $requirements = Requirement::with('program')->get()->map(function ($r) {
            $due = Carbon::parse($r->due_date);

            return [
                'id' => 'r_'.$r->id,
                'raw_id' => $r->id,
                'type' => 'deadline',
                'title' => $r->title,
                'date' => $due->format('Y-m-d'),
                'start_time' => '03:00 PM',
                'end_time' => '05:00 PM',
                'venue' => 'N/A',
                'status' => 'Scheduled',
                'program' => $r->program ? $r->program->code : 'All',
                'program_id' => $r->program_id,
                'description' => 'Documentary compliance deadline: '.$r->document_type,
            ];
        });

        $events = collect()
            ->merge($meetings)
            ->merge($activities)
            ->merge($requirements)
            ->sortBy(function ($item) {
                return $item['date'].' '.$item['start_time'];
            })
            ->values();

        $programs = Program::select('id', 'code', 'name')->orderBy('code')->get();

        $venues = $events->pluck('venue')
            ->filter(fn ($v) => $v && $v !== 'N/A')
            ->unique()
            ->values()
            ->all();

        foreach (['Conference Room A', "Dean's Office", 'University Campus', 'AVR', 'University Gym'] as $v) {
            if (! in_array($v, $venues)) {
                $venues[] = $v;
            }
        }

        return [
            'events' => $events,
            'programs' => $programs,
            'venues' => array_values($venues),
            'defaultDate' => '2026-10-13',
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|in:meeting,activity,deadline,examination,others',
            'date' => 'required|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
            'program_id' => 'nullable|exists:programs,id',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $startTime = $validated['start_time'] ? Carbon::parse($validated['start_time'])->format('H:i:s') : '08:00:00';
        $endTime = $validated['end_time'] ? Carbon::parse($validated['end_time'])->format('H:i:s') : '10:00:00';

        if ($validated['type'] === 'meeting') {
            Meeting::create([
                'title' => $validated['title'],
                'date' => $validated['date'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'venue' => $validated['venue'] ?: 'Conference Room A',
                'agenda' => $validated['description'],
                'status' => $validated['status'] ?: 'Scheduled',
                'program_id' => $validated['program_id'],
                'organizer_id' => auth()->id(),
            ]);
        } elseif ($validated['type'] === 'deadline') {
            Requirement::create([
                'title' => $validated['title'],
                'document_type' => 'Academic Submission',
                'due_date' => Carbon::parse($validated['date'])->setTime(17, 0, 0),
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'program_id' => $validated['program_id'],
            ]);
        } else {
            Activity::create([
                'title' => $validated['title'],
                'category' => $validated['type'],
                'date' => $validated['date'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'venue' => $validated['venue'] ?: 'University Campus',
                'description' => $validated['description'],
                'status' => $validated['status'] ?: 'Scheduled',
                'program_id' => $validated['program_id'],
                'visibility' => 'Public',
            ]);
        }

        return redirect()->back()->with('success', 'Event successfully scheduled in Consolidated Calendar.');
    }

    public function destroy(string $id): RedirectResponse
    {
        if (str_starts_with($id, 'm_')) {
            Meeting::destroy((int) substr($id, 2));
        } elseif (str_starts_with($id, 'a_')) {
            Activity::destroy((int) substr($id, 2));
        } elseif (str_starts_with($id, 'r_')) {
            Requirement::destroy((int) substr($id, 2));
        }

        return redirect()->back()->with('success', 'Event deleted from calendar.');
    }

    /**
     * Seeds initial calendar events matching the UI mockup if not already created.
     */
    public static function ensureBaselineEvents(): void
    {
        $bsit = Program::where('code', 'BSIT')->first();
        $organizerId = auth()->id() ?: (User::first()?->id ?: 1);

        // October 13, 2026 events from Dashboard and Modal mockups
        Meeting::firstOrCreate(
            ['title' => 'Department Heads Sync', 'date' => '2026-10-13'],
            [
                'start_time' => '09:00:00',
                'end_time' => '10:30:00',
                'venue' => "Dean's Office",
                'agenda' => 'Harmonizing operational targets and review of academic deliverables.',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Curriculum Review', 'date' => '2026-10-13'],
            [
                'start_time' => '13:00:00',
                'end_time' => '15:00:00',
                'venue' => 'Conference Room A',
                'agenda' => 'Periodic syllabus enhancement and CHED CMO compliance check.',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Faculty Council Meeting', 'date' => '2026-10-13'],
            [
                'start_time' => '15:00:00',
                'end_time' => '17:00:00',
                'venue' => 'AVR',
                'agenda' => 'Deliberation on student affairs and departmental teaching workload.',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Student Organization Orientation', 'date' => '2026-10-13'],
            [
                'category' => 'activity',
                'start_time' => '19:00:00',
                'end_time' => '21:00:00',
                'venue' => 'University Gym',
                'description' => 'Annual general assembly of recognized collegiate student bodies.',
                'status' => 'Scheduled',
                'visibility' => 'Public',
            ]
        );

        // 1. October 12, 2026 events from screenshot
        Activity::firstOrCreate(
            ['title' => 'Foundation Week Celebration', 'date' => '2026-10-12'],
            [
                'category' => 'activity',
                'start_time' => '08:00:00',
                'end_time' => '12:00:00',
                'venue' => 'University Campus',
                'description' => 'Annual CIDS collegiate foundation ceremonies and university showcase.',
                'status' => 'Scheduled',
                'visibility' => 'Public',
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Curriculum Review', 'date' => '2026-10-12', 'start_time' => '13:00:00'],
            [
                'end_time' => '15:00:00',
                'venue' => 'Conference Room A',
                'agenda' => 'Harmonizing IT & Computer Science specializations for AY 2027.',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Requirement::firstOrCreate(
            ['title' => 'Submission of TOS and TQ', 'academic_year' => '2026-2027', 'semester' => '1st Semester'],
            [
                'document_type' => 'Examination Materials',
                'due_date' => Carbon::parse('2026-10-12 17:00:00'),
                'program_id' => $bsit?->id,
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Department Heads Sync', 'date' => '2026-10-12', 'start_time' => '16:00:00'],
            [
                'end_time' => '17:00:00',
                'venue' => "Dean's Office",
                'agenda' => 'Executive academic workload alignment and resource balancing.',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        // 2. Dots on other dates across October 2026
        Requirement::firstOrCreate(
            ['title' => 'Submission of Preliminary Course Syllabi', 'academic_year' => '2026-2027', 'semester' => '1st Semester'],
            [
                'document_type' => 'Course Syllabi',
                'due_date' => Carbon::parse('2026-10-01 17:00:00'),
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Midterm Departmental Exam Prep', 'date' => '2026-10-02'],
            [
                'category' => 'examination',
                'start_time' => '09:00:00',
                'end_time' => '12:00:00',
                'venue' => 'Computer Lab 1',
                'status' => 'Scheduled',
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'College Assembly & Student Orientation', 'date' => '2026-10-03'],
            [
                'category' => 'others',
                'start_time' => '14:00:00',
                'end_time' => '17:00:00',
                'venue' => 'CIDS Multi-Purpose Hall',
                'status' => 'Scheduled',
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Faculty Consultation Hours', 'date' => '2026-10-05'],
            [
                'category' => 'others',
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
                'venue' => 'Faculty Room 302',
                'status' => 'Scheduled',
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Academic Committee Meeting', 'date' => '2026-10-07'],
            [
                'start_time' => '10:00:00',
                'end_time' => '11:30:00',
                'venue' => 'Conference Room A',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Research Colloquium & AI Workshop', 'date' => '2026-10-09'],
            [
                'category' => 'activity',
                'start_time' => '13:00:00',
                'end_time' => '17:00:00',
                'venue' => 'University Campus',
                'status' => 'Scheduled',
            ]
        );

        Requirement::firstOrCreate(
            ['title' => 'Deadline: Midterm Assessment Rubrics', 'academic_year' => '2026-2027', 'semester' => '1st Semester'],
            [
                'document_type' => 'Rubrics Submission',
                'due_date' => Carbon::parse('2026-10-10 17:00:00'),
            ]
        );

        Requirement::firstOrCreate(
            ['title' => 'Deadline: Faculty Workload Verification', 'academic_year' => '2026-2027', 'semester' => '1st Semester'],
            [
                'document_type' => 'Faculty Load Sheet',
                'due_date' => Carbon::parse('2026-10-14 17:00:00'),
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Midterm Examinations Day 1', 'date' => '2026-10-16'],
            [
                'category' => 'examination',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'venue' => 'University Campus',
                'status' => 'Scheduled',
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Hackathon & Coding Bootcamp', 'date' => '2026-10-21'],
            [
                'category' => 'activity',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'venue' => 'Mac Lab, 4th Floor',
                'status' => 'Scheduled',
            ]
        );

        Meeting::firstOrCreate(
            ['title' => 'Monthly Faculty General Assembly', 'date' => '2026-10-23'],
            [
                'start_time' => '15:00:00',
                'end_time' => '17:00:00',
                'venue' => 'CIDS Multi-Purpose Hall',
                'status' => 'Scheduled',
                'organizer_id' => $organizerId,
            ]
        );

        Activity::firstOrCreate(
            ['title' => 'Campus Cleanliness & Green Drive', 'date' => '2026-10-28'],
            [
                'category' => 'others',
                'start_time' => '07:30:00',
                'end_time' => '11:00:00',
                'venue' => 'University Campus',
                'status' => 'Scheduled',
            ]
        );

        Requirement::firstOrCreate(
            ['title' => 'Deadline: Final Encoding of Midterm Grades', 'academic_year' => '2026-2027', 'semester' => '1st Semester'],
            [
                'document_type' => 'Grading Sheets',
                'due_date' => Carbon::parse('2026-10-30 23:59:00'),
            ]
        );
    }
}
