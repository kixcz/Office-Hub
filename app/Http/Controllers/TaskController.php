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
        $tasks = Task::with(['creator', 'assignee'])
            ->orderBy('due_date', 'asc')
            ->get();

        $users = User::all(['id', 'name']);

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $validated['creator_id'] = $request->user()->id;
        $validated['status'] = 'to_do';

        Task::create($validated);

        return back()->with('success', 'Task created successfully.');
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|in:to_do,in_progress,completed',
        ]);

        $task->update($validated);

        return back()->with('success', 'Task status updated.');
    }
}
