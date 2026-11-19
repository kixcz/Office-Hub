<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QmsDocument extends Model
{
    protected $fillable = [
        'document_code',
        'title',
        'description',
        'document_type_id',
        'owner_unit_type',
        'owner_college_id',
        'owner_program_id',
        'status',
        'current_revision_id',
        'created_by',
    ];

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentType::class, 'document_type_id');
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class, 'owner_college_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'owner_program_id');
    }

    public function currentRevision(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentRevision::class, 'current_revision_id');
    }

    public function activeRevision(): BelongsTo
    {
        return $this->belongsTo(QmsDocumentRevision::class, 'current_revision_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(QmsDocumentRevision::class, 'document_id')->orderByDesc('revision_number');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(QmsDocumentInstance::class, 'document_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(QmsDocumentApproval::class, 'document_id')->orderBy('step_order');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(QmsDocumentAuditLog::class, 'document_id')->latest();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
