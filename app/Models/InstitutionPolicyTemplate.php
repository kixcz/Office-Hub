<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionPolicyTemplate extends Model
{
    protected $fillable = [
        'code',
        'title',
        'category',
        'version',
        'status',
        'effective_from',
        'effective_until',
        'inheritance_mode',
        'allow_entity_override',
        'allow_college_override',
        'parameters',
        'description',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_until' => 'date',
            'allow_entity_override' => 'boolean',
            'allow_college_override' => 'boolean',
            'parameters' => 'array',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
