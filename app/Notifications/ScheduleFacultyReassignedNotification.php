<?php

namespace App\Notifications;

use App\Models\ScheduleFacultyReassignment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ScheduleFacultyReassignedNotification extends Notification
{
    use Queueable;

    public function __construct(public ScheduleFacultyReassignment $reassignment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $sched = $this->reassignment->verifiedSchedule;
        $prevFaculty = $this->reassignment->previousFaculty;
        $newFaculty = $this->reassignment->newFaculty;
        $changer = $this->reassignment->changedBy;

        $courseCode = $sched?->course?->code ?? 'Course';
        $sectionName = $sched?->section?->code ?? $sched?->section?->name ?? 'Section';
        $roomName = $sched?->room?->room_name ?? 'Room';
        $prevName = $prevFaculty ? "{$prevFaculty->first_name} {$prevFaculty->last_name}" : 'Previous Faculty';
        $newName = $newFaculty ? "{$newFaculty->first_name} {$newFaculty->last_name}" : 'New Faculty';
        $changerName = $changer?->name ?? 'Administrator';
        $changerRole = $this->reassignment->changed_by_role;

        return [
            'type' => 'schedule_faculty_reassignment',
            'title' => "Schedule Faculty Remapped: {$courseCode} ({$sectionName})",
            'message' => "{$changerName} ({$changerRole}) remapped the faculty for {$courseCode} ({$sectionName}, {$roomName}) from {$prevName} to {$newName}.",
            'verified_schedule_id' => $sched?->id,
            'reassignment_id' => $this->reassignment->id,
            'course_code' => $courseCode,
            'course_title' => $sched?->course?->title ?? '',
            'section' => $sectionName,
            'room' => $roomName,
            'previous_faculty' => $prevName,
            'new_faculty' => $newName,
            'changed_by' => $changerName,
            'changed_by_role' => $changerRole,
            'reassignment_type' => $this->reassignment->reassignment_type,
            'reason' => $this->reassignment->reason,
            'effective_date' => $this->reassignment->effective_date?->toDateString(),
            'action_url' => '/monitoring/lab-in-charge?tab=today',
        ];
    }
}
