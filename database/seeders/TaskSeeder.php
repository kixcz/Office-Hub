<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $faculties = Faculty::all();

        if ($faculties->isEmpty()) {
            return;
        }

        $now = Carbon::now();

        $sampleTasks = [
            [
                'title' => 'Submit Midterm Grade Sheets',
                'description' => 'Compile and verify raw scores and encode them into the college grading portal.',
                'priority' => 'High',
                'task_type' => 'grading',
                'category' => 'compliance',
                'status' => 'completed',
                'progress' => 100,
                'subtasks_completed' => 4,
                'subtasks_total' => 4,
                'due_date' => $now->copy()->subDays(5)->format('Y-m-d'),
            ],
            [
                'title' => 'Curriculum Matrix Review & Alignment',
                'description' => 'Review the alignment of Course Learning Outcomes with the new CMO requirements.',
                'priority' => 'Medium',
                'task_type' => 'academic',
                'category' => 'curriculum',
                'status' => 'in_progress',
                'progress' => 60,
                'subtasks_completed' => 3,
                'subtasks_total' => 5,
                'due_date' => $now->copy()->addDays(12)->format('Y-m-d'),
            ],
            [
                'title' => 'Faculty Workload Signature Verification',
                'description' => 'Collect physical and electronic endorsements for semester loading.',
                'priority' => 'High',
                'task_type' => 'administrative',
                'category' => 'loading',
                'status' => 'completed',
                'progress' => 100,
                'subtasks_completed' => 2,
                'subtasks_total' => 2,
                'due_date' => $now->copy()->subDays(10)->format('Y-m-d'),
            ],
            [
                'title' => 'Lab Utilization Audit & PC Health Check',
                'description' => 'Inspect software licensing and workstation conditions in Com Lab 1 and 2.',
                'priority' => 'Normal',
                'task_type' => 'facilities',
                'category' => 'laboratory',
                'status' => 'in_progress',
                'progress' => 40,
                'subtasks_completed' => 2,
                'subtasks_total' => 5,
                'due_date' => $now->copy()->addDays(7)->format('Y-m-d'),
            ],
            [
                'title' => 'Capstone & Thesis Rubric Standardization',
                'description' => 'Standardize grading rubrics for proposal defense and final defense.',
                'priority' => 'Low',
                'task_type' => 'academic',
                'category' => 'research',
                'status' => 'to_do',
                'progress' => 0,
                'subtasks_completed' => 0,
                'subtasks_total' => 3,
                'due_date' => $now->copy()->addDays(20)->format('Y-m-d'),
            ],
            [
                'title' => 'Table of Specifications (TOS) Review',
                'description' => 'Audit exam items against Blooms Taxonomy levels for departmental exams.',
                'priority' => 'High',
                'task_type' => 'compliance',
                'category' => 'compliance',
                'status' => 'completed',
                'progress' => 100,
                'subtasks_completed' => 3,
                'subtasks_total' => 3,
                'due_date' => $now->copy()->subDays(2)->format('Y-m-d'),
            ],
            [
                'title' => 'Community Tech Extension Planning',
                'description' => 'Draft the project proposal for the Barangay IT Literacy Extension Outreach.',
                'priority' => 'Medium',
                'task_type' => 'extension',
                'category' => 'extension',
                'status' => 'pending',
                'progress' => 20,
                'subtasks_completed' => 1,
                'subtasks_total' => 5,
                'due_date' => $now->copy()->addDays(15)->format('Y-m-d'),
            ],
            [
                'title' => 'Class Attendance Roll Call Consolidation',
                'description' => 'Consolidate 1st quarter student attendance reports for retention tracking.',
                'priority' => 'Normal',
                'task_type' => 'monitoring',
                'category' => 'attendance',
                'status' => 'completed',
                'progress' => 100,
                'subtasks_completed' => 2,
                'subtasks_total' => 2,
                'due_date' => $now->copy()->subDays(1)->format('Y-m-d'),
            ],
        ];

        foreach ($sampleTasks as $idx => $taskData) {
            $assignedFaculty = $faculties[$idx % $faculties->count()];
            $user = $assignedFaculty->user ?? $admin;

            $task = Task::updateOrCreate(
                ['title' => $taskData['title']],
                array_merge($taskData, [
                    'creator_id' => $admin?->id ?? 1,
                    'assigned_to' => $user?->id ?? 1,
                    'assignee_initials' => strtoupper(substr($assignedFaculty->first_name, 0, 1).substr($assignedFaculty->last_name, 0, 1)),
                    'comments_count' => rand(0, 4),
                    'attachments_count' => rand(0, 2),
                ])
            );

            // Associate with faculty
            $task->faculties()->syncWithoutDetaching([$assignedFaculty->id]);
        }
    }
}
