<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\SpotlightSlide;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SpotlightSlideSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faculties = Faculty::all();
        if ($faculties->isEmpty()) {
            return;
        }

        // Set birthdays on a few faculties for testing approaching birthday detection
        $today = Carbon::today();
        if ($f1 = $faculties->first()) {
            $f1->update(['birth_date' => $today->copy()->addDays(3)->subYears(35)]);
        }
        if ($f2 = $faculties->skip(1)->first()) {
            $f2->update(['birth_date' => $today->copy()->addDays(7)->subYears(42)]);
        }

        // Sample 1: Faculty Achievement / Award Spotlight
        $awardFaculty = $faculties->first();
        SpotlightSlide::updateOrCreate(
            ['headline' => 'CONGRATULATIONS, PROF. REYES!'],
            [
                'type' => 'award',
                'faculty_id' => $awardFaculty?->id,
                'honoree_name' => $awardFaculty ? $awardFaculty->full_name : 'Prof. Maria Reyes',
                'honoree_title' => $awardFaculty?->academic_rank ?? 'Associate Professor II',
                'program_or_department' => $awardFaculty?->program?->name ?? 'Department of Computer Science',
                'photo_path' => $awardFaculty?->profile_picture,
                'headline' => 'CONGRATULATIONS, PROF. REYES!',
                'message' => 'Recipient of the Best Paper Award at the 2026 Regional ICT Research Conference for groundbreaking research in Federated Machine Learning.',
                'event_title' => '2026 Regional ICT Research Conference',
                'awarding_organization' => 'CHED & Philippine Society of IT Educators',
                'event_date' => $today->copy()->subDays(5)->format('Y-m-d'),
                'template' => 'award',
                'background_style' => 'royal-gold',
                'accent_style' => 'gold',
                'headline_alignment' => 'left',
                'text_size' => 'normal',
                'display_duration' => 22,
                'transition' => 'zoom-fade',
                'layout_mode' => 'hero-split',
                'fullscreen_takeover' => false,
                'playlist' => 'Main TV Rotation',
                'priority' => 2,
                'start_at' => $today->copy()->subDays(2),
                'end_at' => $today->copy()->addDays(14),
                'status' => 'published',
            ]
        );

        // Sample 2: Birthday Celebration Spotlight
        $bdayFaculty = $faculties->skip(1)->first();
        if ($bdayFaculty) {
            SpotlightSlide::updateOrCreate(
                ['headline' => 'HAPPY BIRTHDAY, '.$bdayFaculty->title_name.'!'],
                [
                    'type' => 'birthday',
                    'faculty_id' => $bdayFaculty->id,
                    'honoree_name' => $bdayFaculty->full_name,
                    'honoree_title' => $bdayFaculty->academic_rank ?? 'Assistant Professor I',
                    'program_or_department' => $bdayFaculty->program?->name ?? 'Information Technology Program',
                    'photo_path' => $bdayFaculty->profile_picture,
                    'headline' => 'HAPPY BIRTHDAY, '.$bdayFaculty->title_name.'!',
                    'message' => 'Wishing you a joyful and inspiring birthday! CIDS celebrates your dedication, brilliance, and mentorship to our students.',
                    'event_title' => 'Faculty Birthday Celebration',
                    'awarding_organization' => 'CIDS Dean & Faculty Affairs',
                    'event_date' => $today->copy()->addDays(7)->format('Y-m-d'),
                    'template' => 'birthday',
                    'background_style' => 'celebration-spark',
                    'accent_style' => 'amber',
                    'headline_alignment' => 'left',
                    'text_size' => 'normal',
                    'display_duration' => 20,
                    'transition' => 'zoom-fade',
                    'layout_mode' => 'hero-split',
                    'fullscreen_takeover' => false,
                    'playlist' => 'Main TV Rotation',
                    'priority' => 2,
                    'start_at' => $today->copy()->subDays(1),
                    'end_at' => $today->copy()->addDays(10),
                    'status' => 'published',
                ]
            );
        }
    }
}
