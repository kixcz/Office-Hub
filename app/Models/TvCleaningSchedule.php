<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TvCleaningSchedule extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'scope_badge',
        'motto_title',
        'motto_description',
        'week_label',
        'week_start_date',
        'days_data',
        'highlights',
        'is_active',
        'duration_seconds',
        'order',
    ];

    protected $casts = [
        'days_data' => 'array',
        'highlights' => 'array',
        'is_active' => 'boolean',
        'week_start_date' => 'date',
        'duration_seconds' => 'integer',
        'order' => 'integer',
    ];

    /**
     * Get default initial days structure matching reference image.
     */
    public static function defaultDaysData(): array
    {
        return [
            [
                'day' => 'Monday',
                'date_label' => 'OCT 19, 2026',
                'day_number' => 1, // 1 = Monday
                'slogan' => 'Clean Monday!',
                'cleaners' => [
                    ['name' => 'Ace Fuentes', 'initials' => 'AF', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Jerry Oriente', 'initials' => 'JO', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Kaye Panaligan', 'initials' => 'KP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Mark Noval', 'initials' => 'MN', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Rhea Mae Perito', 'initials' => 'RP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Ivan Millan', 'initials' => 'IM', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                ],
            ],
            [
                'day' => 'Tuesday',
                'date_label' => 'OCT 20, 2026',
                'day_number' => 2,
                'slogan' => 'Tidy Tuesday!',
                'cleaners' => [
                    ['name' => 'Renzel Villegas', 'initials' => 'RV', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Mardalyn Caniban', 'initials' => 'MC', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Carlito Rehang', 'initials' => 'CR', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Carl Montoya', 'initials' => 'CM', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Dhominic Arendain', 'initials' => 'DA', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Hannah Faye Panaligan', 'initials' => 'HP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                ],
            ],
            [
                'day' => 'Wednesday',
                'date_label' => 'OCT 21, 2026',
                'day_number' => 3,
                'slogan' => 'We keep it clean!',
                'cleaners' => [
                    ['name' => 'Ace Fuentes', 'initials' => 'AF', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Carl Montoya', 'initials' => 'CM', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Kaye Panaligan', 'initials' => 'KP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Renzel Villegas', 'initials' => 'RV', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Rhea Mae Perito', 'initials' => 'RP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Mark Noval', 'initials' => 'MN', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                ],
            ],
            [
                'day' => 'Thursday',
                'date_label' => 'OCT 22, 2026',
                'day_number' => 4,
                'slogan' => 'Almost there!',
                'cleaners' => [
                    ['name' => 'Mardalyn Caniban', 'initials' => 'MC', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Ivan Millan', 'initials' => 'IM', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Carlito Rehang', 'initials' => 'CR', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Jerry Oriente', 'initials' => 'JO', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Dhominic Arendain', 'initials' => 'DA', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Hannah Faye Panaligan', 'initials' => 'HP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                ],
            ],
            [
                'day' => 'Friday',
                'date_label' => 'OCT 23, 2026',
                'day_number' => 5,
                'slogan' => 'Clean Friday! Great Job, CIDS!',
                'cleaners' => [
                    ['name' => 'Renzel Villegas', 'initials' => 'RV', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Kaye Panaligan', 'initials' => 'KP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Carl Montoya', 'initials' => 'CM', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Mark Noval', 'initials' => 'MN', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Rhea Mae Perito', 'initials' => 'RP', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                    ['name' => 'Ace Fuentes', 'initials' => 'AF', 'role' => 'Faculty Cleaner', 'faculty_id' => null],
                ],
            ],
        ];
    }
}
