<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyWorkload extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_period_id',
        'faculty_id',
        'teaching_units',
        'teaching_hours',
        'designation_credits',
        'research_credits',
        'extension_credits',
        'administrative_credits',
        'total_workload',
        'workload_status',
        'is_locked',
        'locked_at',
        'locked_by_user_id',
        'document_version',
        'signatories_snapshot',
        'workload_snapshot_data',
        'admin_remarks',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'teaching_units' => 'decimal:2',
            'teaching_hours' => 'decimal:2',
            'designation_credits' => 'decimal:2',
            'research_credits' => 'decimal:2',
            'extension_credits' => 'decimal:2',
            'administrative_credits' => 'decimal:2',
            'total_workload' => 'decimal:2',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
            'signatories_snapshot' => 'array',
            'workload_snapshot_data' => 'array',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function lockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_user_id');
    }
}
