<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsDocumentRevision extends Model
{
    protected $fillable = [
        'document_id',
        'revision_number',
        'effective_date',
        'review_due_date',
        'file_path',
        'file_name',
        'file_size_bytes',
        'change_summary',
        'prepared_by_user_id',
        'reviewed_by_user_id',
        'approved_by_user_id',
        'published_by_user_id',
        'published_at',
        'status',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'review_due_date' => 'date',
        'published_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(QmsDocument::class, 'document_id');
    }

    public function preparedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_user_id');
    }
}
