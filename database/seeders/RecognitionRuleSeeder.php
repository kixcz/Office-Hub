<?php

namespace Database\Seeders;

use App\Models\RecognitionRule;
use Illuminate\Database\Seeder;

class RecognitionRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (RecognitionRule::count() === 0) {
            RecognitionRule::create([
                'title' => 'Top Performing Faculty',
                'description' => 'Recognize faculty with highest compliance rate',
                'type' => 'faculty',
                'metric' => 'Compliance Rate',
                'criteria_detail' => 'Based on verified submissions',
                'target' => 'Top 5',
                'display_format' => 'Leaderboard',
                'min_requirements' => 1,
                'min_on_time_rate' => 80.00,
                'min_compliance_rate' => 85.00,
                'allow_overdue' => false,
                'is_active' => true,
                'updated_by' => 'System Admin',
            ]);

            RecognitionRule::create([
                'title' => 'Most On-Time Submissions',
                'description' => 'Recognize faculty with highest on-time rate',
                'type' => 'faculty',
                'metric' => 'On-Time Submission Rate',
                'criteria_detail' => 'Across all requirements',
                'target' => 'Top 3',
                'display_format' => 'Ranked List',
                'min_requirements' => 1,
                'min_on_time_rate' => 90.00,
                'min_compliance_rate' => 80.00,
                'allow_overdue' => false,
                'is_active' => true,
                'updated_by' => 'System Admin',
            ]);

            RecognitionRule::create([
                'title' => 'Zero Overdue Faculty',
                'description' => 'Recognize faculty with no overdue items',
                'type' => 'faculty',
                'metric' => 'Overdue Count',
                'criteria_detail' => 'Must be 0',
                'target' => 'All Qualified',
                'display_format' => 'Highlight Card',
                'min_requirements' => 1,
                'min_on_time_rate' => 75.00,
                'min_compliance_rate' => 75.00,
                'allow_overdue' => false,
                'is_active' => true,
                'updated_by' => 'System Admin',
            ]);

            RecognitionRule::create([
                'title' => 'Most Improved Faculty',
                'description' => 'Recognize faculty with highest improvement',
                'type' => 'faculty',
                'metric' => 'Improvement Rate',
                'criteria_detail' => 'vs. previous semester',
                'target' => 'Top 3',
                'display_format' => 'Progress Card',
                'min_requirements' => 1,
                'min_on_time_rate' => 70.00,
                'min_compliance_rate' => 70.00,
                'allow_overdue' => true,
                'is_active' => true,
                'updated_by' => 'System Admin',
            ]);

            RecognitionRule::create([
                'title' => 'Top Performing Program',
                'description' => 'Recognize program with highest compliance',
                'type' => 'program',
                'metric' => 'Program Compliance Rate',
                'criteria_detail' => 'Based on faculty average',
                'target' => 'Top 3',
                'display_format' => 'Leaderboard',
                'min_requirements' => 1,
                'min_on_time_rate' => 80.00,
                'min_compliance_rate' => 85.00,
                'allow_overdue' => false,
                'is_active' => true,
                'updated_by' => 'System Admin',
            ]);

            RecognitionRule::create([
                'title' => 'Most Active Program',
                'description' => 'Recognize program with most submissions',
                'type' => 'program',
                'metric' => 'Total Submissions',
                'criteria_detail' => 'All faculty submissions',
                'target' => 'Top 3',
                'display_format' => 'Ranked List',
                'min_requirements' => 1,
                'min_on_time_rate' => 0.00,
                'min_compliance_rate' => 0.00,
                'allow_overdue' => true,
                'is_active' => false,
                'updated_by' => 'System Admin',
            ]);
        }
    }
}
