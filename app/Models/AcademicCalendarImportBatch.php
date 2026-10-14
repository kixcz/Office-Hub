<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicCalendarImportBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year',
        'semester_scope',
        'institution',
        'original_filename',
        'file_path',
        'file_type',
        'file_size_bytes',
        'extracted_text',
        'status',
        'detected_count',
        'approved_count',
        'rejected_count',
        'manual_corrected_count',
        'needs_attention_count',
        'gemini_raw_response',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size_bytes' => 'integer',
            'detected_count' => 'integer',
            'approved_count' => 'integer',
            'rejected_count' => 'integer',
            'manual_corrected_count' => 'integer',
            'needs_attention_count' => 'integer',
            'gemini_raw_response' => 'array',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(AcademicCalendarImportEvent::class, 'batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function recalculateCounts(): void
    {
        $this->update([
            'detected_count' => $this->events()->count(),
            'approved_count' => $this->events()->where('status', 'approved')->count(),
            'rejected_count' => $this->events()->where('status', 'rejected')->count(),
            'manual_corrected_count' => $this->events()->where('is_manually_corrected', true)->count(),
            'needs_attention_count' => $this->events()->where('validation_status', 'needs_attention')->count(),
        ]);
    }
}
