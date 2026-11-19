<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QmsApprovalWorkflow extends Model
{
    protected $fillable = [
        'name',
        'document_type_id',
        'scope_level',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentType::class, 'document_type_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(QmsApprovalStep::class, 'workflow_id')->orderBy('step_order');
    }
}
