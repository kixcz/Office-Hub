<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Meeting;
use App\Models\Requirement;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index()
    {
        $meetings = Meeting::with('program')->get()->map(function ($m) {
            return [
                'id' => 'm_'.$m->id,
                'type' => 'meeting',
                'title' => $m->title,
                'date' => $m->date,
                'start_time' => $m->start_time,
                'end_time' => $m->end_time,
                'venue' => $m->venue,
                'status' => $m->status,
                'program' => $m->program ? $m->program->code : 'All',
            ];
        });

        $activities = Activity::with('program')->get()->map(function ($a) {
            return [
                'id' => 'a_'.$a->id,
                'type' => 'activity',
                'title' => $a->title,
                'date' => $a->date,
                'start_time' => $a->start_time,
                'end_time' => $a->end_time,
                'venue' => $a->venue,
                'status' => $a->status,
                'program' => $a->program ? $a->program->code : 'All',
            ];
        });

        $requirements = Requirement::with('program')->get()->map(function ($r) {
            return [
                'id' => 'r_'.$r->id,
                'type' => 'deadline',
                'title' => 'Deadline: '.$r->title,
                'date' => $r->due_date->format('Y-m-d'),
                'start_time' => $r->due_date->format('H:i'),
                'end_time' => $r->due_date->copy()->addHour()->format('H:i'),
                'venue' => 'N/A',
                'status' => 'Scheduled',
                'program' => $r->program ? $r->program->code : 'All',
            ];
        });

        $events = collect()->merge($meetings)->merge($activities)->merge($requirements)->sortBy('date')->values();

        return Inertia::render('schedule/calendar/index', [
            'events' => $events,
        ]);
    }
}
