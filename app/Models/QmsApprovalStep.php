<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsApprovalStep extends Model
{
    protected $fillable = [
        'workflow_id',
        'step_order',
        'step_name',
        'required_role',
        'can_skip_if_same_user',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'can_skip_if_same_user' => 'boolean',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(QmsApprovalWorkflow::class, 'workflow_id');
    }
}
