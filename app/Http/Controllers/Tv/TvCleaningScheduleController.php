<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\TvCleaningSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class TvCleaningScheduleController extends Controller
{
    /**
     * Display the cleaning schedule editor or management view.
     */
    public function index()
    {
        $schedule = TvCleaningSchedule::first();

        if (! $schedule) {
            $schedule = TvCleaningSchedule::create([
                'title' => 'OFFICE CLEANING SCHEDULE',
                'subtitle' => 'FACULTY CLEANERS',
                'scope_badge' => 'CIDS OFFICE AREAS ONLY',
                'motto_title' => 'A Clean Office, A Brighter CIDS.',
                'motto_description' => 'LET\'S KEEP OUR WORKPLACE CLEAN, ORGANIZED, AND WELCOMING FOR EVERYONE.',
                'week_label' => 'OCT 19 - OCT 23, 2026',
                'week_start_date' => '2026-10-19',
                'days_data' => TvCleaningSchedule::defaultDaysData(),
                'highlights' => [
                    ['title' => 'CLEAN WORKSPACE', 'icon' => 'sparkles'],
                    ['title' => 'BETTER COLLABORATION', 'icon' => 'users'],
                    ['title' => 'HEALTHIER COMMUNITY', 'icon' => 'heart'],
                    ['title' => 'A STRONGER CIDS', 'icon' => 'shield'],
                ],
                'is_active' => true,
                'duration_seconds' => 25,
                'order' => 12,
            ]);
        }

        $faculties = Faculty::orderBy('last_name')
            ->get()
            ->map(function ($f) {
                $initials = strtoupper(substr($f->first_name ?? '', 0, 1).substr($f->last_name ?? '', 0, 1));
                if (empty($initials)) {
                    $initials = 'FC';
                }

                return [
                    'id' => $f->id,
                    'name' => $f->full_name,
                    'initials' => $initials,
                    'academic_rank' => $f->academic_rank ?? 'Faculty Cleaner',
                    'program_name' => $f->program ? $f->program->name : '',
                    'program_code' => $f->program ? $f->program->code : '',
                    'photo_url' => $f->photo_url,
                ];
            });

        return Inertia::render('tv/cleaners/index', [
            'schedule' => $schedule,
            'faculties' => $faculties,
        ]);
    }

    /**
     * Update the cleaning schedule slide configuration and roster.
     */
    public function update(Request $request, TvCleaningSchedule $schedule)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'subtitle' => 'required|string|max:120',
            'scope_badge' => 'nullable|string|max:100',
            'motto_title' => 'nullable|string|max:200',
            'motto_description' => 'nullable|string|max:500',
            'week_label' => 'nullable|string|max:100',
            'week_start_date' => 'nullable|date',
            'days_data' => 'required|array',
            'highlights' => 'nullable|array',
            'is_active' => 'required|boolean',
            'duration_seconds' => 'required|integer|min:5|max:120',
        ]);

        $schedule->update($validated);

        // Clear TV cache to immediately reflect updates on TV display
        Cache::forget('tv_display_payload_v1_null');

        return redirect()->back()->with('success', 'Cleaning Schedule updated successfully.');
    }

    /**
     * Reset to default roster matching the official banner design.
     */
    public function reset(TvCleaningSchedule $schedule)
    {
        $schedule->update([
            'title' => 'OFFICE CLEANING SCHEDULE',
            'subtitle' => 'FACULTY CLEANERS',
            'scope_badge' => 'CIDS OFFICE AREAS ONLY',
            'motto_title' => 'A Clean Office, A Brighter CIDS.',
            'motto_description' => 'LET\'S KEEP OUR WORKPLACE CLEAN, ORGANIZED, AND WELCOMING FOR EVERYONE.',
            'week_label' => 'OCT 19 - OCT 23, 2026',
            'week_start_date' => '2026-10-19',
            'days_data' => TvCleaningSchedule::defaultDaysData(),
            'highlights' => [
                ['title' => 'CLEAN WORKSPACE', 'icon' => 'sparkles'],
                ['title' => 'BETTER COLLABORATION', 'icon' => 'users'],
                ['title' => 'HEALTHIER COMMUNITY', 'icon' => 'heart'],
                ['title' => 'A STRONGER CIDS', 'icon' => 'shield'],
            ],
            'is_active' => true,
            'duration_seconds' => 25,
        ]);

        Cache::forget('tv_display_payload_v1_null');

        return redirect()->back()->with('success', 'Cleaning Schedule reset to default design.');
    }
}
