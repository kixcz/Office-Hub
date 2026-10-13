<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year',
        'semester',
        'code',
        'start_date',
        'end_date',
        'class_start_date',
        'class_end_date',
        'midterm_start_date',
        'midterm_end_date',
        'final_start_date',
        'final_end_date',
        'status',
        'is_current',
        'notes',
        'planning_rules_version',
        'planning_parameters',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'class_start_date' => 'date',
            'class_end_date' => 'date',
            'midterm_start_date' => 'date',
            'midterm_end_date' => 'date',
            'final_start_date' => 'date',
            'final_end_date' => 'date',
            'is_current' => 'boolean',
            'planning_parameters' => 'array',
        ];
    }

    /**
     * Scope to find the single currently active academic period.
     */
    public static function current(): ?self
    {
        return self::where('is_current', true)->first()
            ?? self::where('status', 'Active')->first()
            ?? self::latest('start_date')->first();
    }

    /**
     * Activate this period, setting it to Active & current,
     * while transitioning any previously active/current periods to Closed.
     */
    public function activate(): void
    {
        self::where('id', '!=', $this->id)
            ->where(function ($q) {
                $q->where('is_current', true)
                    ->orWhere('status', 'Active');
            })
            ->update([
                'is_current' => false,
                'status' => 'Closed',
            ]);

        $this->update([
            'status' => 'Active',
            'is_current' => true,
        ]);
    }

    /**
     * Close this academic period (read-only for ordinary operations).
     */
    public function close(): void
    {
        $this->update([
            'status' => 'Closed',
            'is_current' => false,
        ]);
    }

    /**
     * Archive this period (historical preservation).
     */
    public function archive(): void
    {
        $this->update([
            'status' => 'Archived',
            'is_current' => false,
        ]);
    }
}
