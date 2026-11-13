<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoadingVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_period_id',
        'college_id',
        'program_id',
        'version_code',
        'title',
        'status',
        'metrics',
        'created_by',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'metrics' => 'array',
            'locked_at' => 'datetime',
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(FacultyLoadAssignment::class);
    }
}
