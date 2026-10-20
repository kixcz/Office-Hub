<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleStagingRecord extends Model
{
    protected $fillable = [
        'sync_batch_id',
        'source_row_number',
        'sheet_tab',
        'raw_subject',
        'raw_faculty',
        'raw_section',
        'raw_room',
        'raw_day',
        'raw_time',
        'norm_subject',
        'norm_faculty',
        'norm_section',
        'norm_room',
        'norm_day',
        'norm_start_time',
        'norm_end_time',
        'scheduled_minutes',
        'mapped_course_id',
        'mapped_faculty_id',
        'mapped_section_id',
        'mapped_room_id',
        'course_confidence',
        'faculty_confidence',
        'section_confidence',
        'room_confidence',
        'overall_confidence',
        'mapping_evidence',
        'has_date_conflict',
        'conflict_reason',
        'change_classification',
        'review_decision',
        'admin_notes',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'course_confidence' => 'decimal:2',
            'faculty_confidence' => 'decimal:2',
            'section_confidence' => 'decimal:2',
            'room_confidence' => 'decimal:2',
            'overall_confidence' => 'decimal:2',
            'mapping_evidence' => 'array',
            'has_date_conflict' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function syncBatch(): BelongsTo
    {
        return $this->belongsTo(ScheduleSyncBatch::class, 'sync_batch_id');
    }

    public function mappedCourse(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'mapped_course_id');
    }

    public function mappedFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'mapped_faculty_id');
    }

    public function mappedSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'mapped_section_id');
    }

    public function mappedRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'mapped_room_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
