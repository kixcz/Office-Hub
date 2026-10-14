<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicCalendarImportRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_category',
        'default_scheduling_effect',
        'suggested_destination_module',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Seed baseline import rules if not present.
     */
    public static function ensureBaselineRules(): void
    {
        $rules = [
            [
                'event_category' => 'holiday',
                'default_scheduling_effect' => 'BLOCK_ALL_CLASSES',
                'suggested_destination_module' => 'Schedule Generator + Calendar',
                'description' => 'University or statutory holiday; blocks classes in Semester Schedule Generator.',
            ],
            [
                'event_category' => 'examination',
                'default_scheduling_effect' => 'CALENDAR_TV_RESTRICTION',
                'suggested_destination_module' => 'Calendar + TV Display + Schedule Restrictions',
                'description' => 'Midterm and final examination periods; highlights on TV Display and constrains normal lectures.',
            ],
            [
                'event_category' => 'faculty_deadline',
                'default_scheduling_effect' => 'CALENDAR_REMINDER',
                'suggested_destination_module' => 'Calendar + Compliance Tracker',
                'description' => 'Faculty deliverables, syllabi, TOS/TQ, or grade encoding deadlines; feeds notifications and compliance tracking.',
            ],
            [
                'event_category' => 'grade_submission',
                'default_scheduling_effect' => 'CALENDAR_REMINDER',
                'suggested_destination_module' => 'Compliance Tracker + Calendar',
                'description' => 'Final grade encoding cutoff; marks high-priority institutional deadline.',
            ],
            [
                'event_category' => 'enrollment',
                'default_scheduling_effect' => 'INFORMATIONAL',
                'suggested_destination_module' => 'Calendar + TV Display',
                'description' => 'Student enrollment and registration window; informational without blocking classroom schedules.',
            ],
            [
                'event_category' => 'start_end_classes',
                'default_scheduling_effect' => 'INFORMATIONAL',
                'suggested_destination_module' => 'Academic Period Alignment',
                'description' => 'Formal opening and closing of instructional terms.',
            ],
            [
                'event_category' => 'university_activity',
                'default_scheduling_effect' => 'CALENDAR_TV_DISPLAY',
                'suggested_destination_module' => 'Calendar + TV Display',
                'description' => 'University-wide foundation, convocation, or sports festivities.',
            ],
            [
                'event_category' => 'college_activity',
                'default_scheduling_effect' => 'CALENDAR_TV_DISPLAY',
                'suggested_destination_module' => 'Calendar + TV Display',
                'description' => 'CIDS college assemblies, hackathons, and research colloquia.',
            ],
            [
                'event_category' => 'break',
                'default_scheduling_effect' => 'BLOCK_ALL_CLASSES',
                'suggested_destination_module' => 'Schedule Generator',
                'description' => 'Semestral break or holiday recess; classroom schedules paused.',
            ],
            [
                'event_category' => 'academic_milestone',
                'default_scheduling_effect' => 'INFORMATIONAL',
                'suggested_destination_module' => 'Calendar',
                'description' => 'Graduation, honors convocation, or accreditation review visits.',
            ],
        ];

        foreach ($rules as $r) {
            self::firstOrCreate(
                ['event_category' => $r['event_category']],
                $r
            );
        }
    }
}
