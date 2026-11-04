<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionWorkflowDefinition extends Model
{
    protected $fillable = [
        'code',
        'name',
        'module',
        'scope_level',
        'version',
        'status',
        'steps',
        'return_behavior',
        'allow_delegation',
        'separation_of_duties_enforced',
        'final_state',
        'description',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'steps' => 'array',
            'allow_delegation' => 'boolean',
            'separation_of_duties_enforced' => 'boolean',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
