<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsDocumentInstance extends Model
{
    protected $fillable = [
        'document_id',
        'document_revision_id',
        'record_reference',
        'title',
        'source_module',
        'source_record_id',
        'academic_year',
        'semester',
        'generated_by_user_id',
        'college_id',
        'program_id',
        'submitted_at',
        'status',
        'remarks',
        'metadata',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(QmsDocument::class, 'document_id');
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentRevision::class, 'document_revision_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by_user_id');
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
