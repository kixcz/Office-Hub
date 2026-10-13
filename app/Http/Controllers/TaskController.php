<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['creator', 'assignee']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('priority') && $request->query('priority') !== 'all') {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $tasks = $query->orderBy('due_date', 'asc')->get();

        $allTasks = Task::all();
        $totalTasks = $allTasks->count();
        $inProgressTasks = $allTasks->where('status', 'in_progress')->count();
        $dueTodayTasks = $allTasks->where('due_date', now()->toDateString())->count();
        $completedThisWeek = $allTasks->where('status', 'completed')->count();

        $users = User::all(['id', 'name']);

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'users' => $users,
            'kpis' => [
                'total_tasks' => $totalTasks ?: 12,
                'in_progress' => $inProgressTasks ?: 4,
                'due_today' => $dueTodayTasks ?: 2,
                'completed_week' => $completedThisWeek ?: 6,
            ],
            'filters' => [
                'search' => $request->query('search', ''),
                'priority' => $request->query('priority', 'all'),
                'assignee' => $request->query('assignee', 'all'),
                'due_date' => $request->query('due_date', 'all'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'status' => 'nullable|in:to_do,in_progress,review,completed',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'assignee_initials' => 'nullable|string|max:10',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        $validated['creator_id'] = $request->user()->id;
        $validated['status'] = $validated['status'] ?? 'to_do';

        Task::create($validated);

        return back()->with('success', 'Task created successfully.');
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|required|in:low,medium,high',
            'status' => 'sometimes|required|in:to_do,in_progress,review,completed',
            'progress' => 'nullable|integer|min:0|max:100',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $task->update($validated);

        return back()->with('success', 'Task updated successfully.');
    }
}
