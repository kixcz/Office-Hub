<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use Illuminate\Database\Seeder;

class AcademicPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPlanningParams = [
            'active_weekdays' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'earliest_class_time' => '07:00',
            'latest_class_time' => '21:00',
            'allow_saturday' => false,
            'holidays' => ['2026-08-21', '2026-08-31', '2026-11-01', '2026-11-30', '2026-12-08'],
            'semester_start_reference' => 'class_start_date',
            'room_availability_ruleset' => 'Default Rules v2',
        ];

        $periods = [
            [
                'academic_year' => '2026 – 2027',
                'semester' => '1st Semester',
                'code' => 'AY2627-1S',
                'start_date' => '2026-08-17',
                'end_date' => '2026-12-18',
                'class_start_date' => '2026-08-17',
                'class_end_date' => '2026-12-18',
                'midterm_start_date' => '2026-10-12',
                'midterm_end_date' => '2026-10-16',
                'final_start_date' => '2026-12-14',
                'final_end_date' => '2026-12-18',
                'status' => 'Active',
                'is_current' => true,
                'planning_rules_version' => 'Default Rules v2',
                'notes' => 'Current operating semester for CIDS OfficeHub.',
                'planning_parameters' => $defaultPlanningParams,
            ],
            [
                'academic_year' => '2026 – 2027',
                'semester' => '2nd Semester',
                'code' => 'AY2627-2S',
                'start_date' => '2027-01-11',
                'end_date' => '2027-05-27',
                'class_start_date' => '2027-01-11',
                'class_end_date' => '2027-05-27',
                'midterm_start_date' => '2027-03-08',
                'midterm_end_date' => '2027-03-12',
                'final_start_date' => '2027-05-24',
                'final_end_date' => '2027-05-27',
                'status' => 'Draft',
                'is_current' => false,
                'planning_rules_version' => 'Default Rules v2',
                'notes' => 'Upcoming semester in preparation.',
                'planning_parameters' => $defaultPlanningParams,
            ],
            [
                'academic_year' => '2025 – 2026',
                'semester' => '2nd Semester',
                'code' => 'AY2526-2S',
                'start_date' => '2026-01-06',
                'end_date' => '2026-05-29',
                'class_start_date' => '2026-01-06',
                'class_end_date' => '2026-05-29',
                'midterm_start_date' => '2026-03-09',
                'midterm_end_date' => '2026-03-13',
                'final_start_date' => '2026-05-25',
                'final_end_date' => '2026-05-29',
                'status' => 'Closed',
                'is_current' => false,
                'planning_rules_version' => 'Default Rules v1',
                'notes' => 'Completed academic semester.',
                'planning_parameters' => $defaultPlanningParams,
            ],
            [
                'academic_year' => '2025 – 2026',
                'semester' => '1st Semester',
                'code' => 'AY2526-1S',
                'start_date' => '2025-08-05',
                'end_date' => '2025-12-19',
                'class_start_date' => '2025-08-05',
                'class_end_date' => '2025-12-19',
                'midterm_start_date' => '2025-10-13',
                'midterm_end_date' => '2025-10-17',
                'final_start_date' => '2025-12-15',
                'final_end_date' => '2025-12-19',
                'status' => 'Closed',
                'is_current' => false,
                'planning_rules_version' => 'Default Rules v1',
                'notes' => 'Completed academic semester.',
                'planning_parameters' => $defaultPlanningParams,
            ],
            [
                'academic_year' => '2024 – 2025',
                'semester' => '2nd Semester',
                'code' => 'AY2425-2S',
                'start_date' => '2025-01-07',
                'end_date' => '2025-05-30',
                'class_start_date' => '2025-01-07',
                'class_end_date' => '2025-05-30',
                'midterm_start_date' => '2025-03-10',
                'midterm_end_date' => '2025-03-14',
                'final_start_date' => '2025-05-26',
                'final_end_date' => '2025-05-30',
                'status' => 'Archived',
                'is_current' => false,
                'planning_rules_version' => 'Default Rules v1',
                'notes' => 'Archived historical records.',
                'planning_parameters' => $defaultPlanningParams,
            ],
            [
                'academic_year' => '2024 – 2025',
                'semester' => '1st Semester',
                'code' => 'AY2425-1S',
                'start_date' => '2024-08-06',
                'end_date' => '2024-12-20',
                'class_start_date' => '2024-08-06',
                'class_end_date' => '2024-12-20',
                'midterm_start_date' => '2024-10-14',
                'midterm_end_date' => '2024-10-18',
                'final_start_date' => '2024-12-16',
                'final_end_date' => '2024-12-20',
                'status' => 'Archived',
                'is_current' => false,
                'planning_rules_version' => 'Default Rules v1',
                'notes' => 'Archived historical records.',
                'planning_parameters' => $defaultPlanningParams,
            ],
        ];

        foreach ($periods as $period) {
            AcademicPeriod::updateOrCreate(
                [
                    'academic_year' => $period['academic_year'],
                    'semester' => $period['semester'],
                ],
                $period
            );
        }
    }
}
