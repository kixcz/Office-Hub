<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramLoadingReview extends Model
{
    protected $fillable = [
        'academic_period_id',
        'college_id',
        'program_id',
        'program_head_id',
        'status',
        'endorsement_notes',
        'endorsed_at',
    ];

    protected function casts(): array
    {
        return [
            'endorsed_at' => 'datetime',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function programHead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'program_head_id');
    }

    public function flags(): HasMany
    {
        return $this->hasMany(LoadingReviewFlag::class, 'program_id', 'program_id');
    }
}
