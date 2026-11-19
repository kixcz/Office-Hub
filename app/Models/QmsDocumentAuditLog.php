<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsDocumentAuditLog extends Model
{
    protected $fillable = [
        'document_id',
        'revision_id',
        'action',
        'actor_user_id',
        'actor_name',
        'actor_role',
        'ip_address',
        'user_agent',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(QmsDocument::class, 'document_id');
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentRevision::class, 'revision_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
