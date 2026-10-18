<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curriculum extends Model
{
    protected $table = 'curricula';

    protected $fillable = [
        'program_id',
        'version_name',
        'effective_year',
        'total_units',
        'status',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
