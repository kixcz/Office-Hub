<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsDocumentApproval extends Model
{
    protected $fillable = [
        'document_id',
        'revision_id',
        'step_order',
        'step_name',
        'approver_user_id',
        'role_used',
        'action',
        'remarks',
        'signature_hash',
        'action_at',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'action_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(QmsDocument::class, 'document_id');
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentRevision::class, 'revision_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }
}
