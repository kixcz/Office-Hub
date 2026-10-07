<?php

namespace App\Http\Controllers;

use App\Models\Accomplishment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AccomplishmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // If user is admin/dean, maybe they can see all. For MVP, we'll just show the user's accomplishments or all if admin.
        // Let's assume anyone can see all for now to act like a directory, but faculty mostly see theirs.
        // Actually, let's just show everyone's to keep it simple, or maybe group by user.
        $accomplishments = Accomplishment::with('user')
            ->orderBy('date_achieved', 'desc')
            ->get();

        return Inertia::render('accomplishments/index', [
            'accomplishments' => $accomplishments,
            'is_admin' => $user->hasRole('admin') // hypothetical check
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|in:certification,research,seminar,award,other',
            'date_achieved' => 'required|date',
            'description' => 'nullable|string',
            'proof_file' => 'nullable|file|max:10240', // max 10MB
        ]);

        if ($request->hasFile('proof_file')) {
            $path = $request->file('proof_file')->store('accomplishments', 'public');
            $validated['proof_file_path'] = $path;
        }

        $validated['user_id'] = $request->user()->id;

        Accomplishment::create($validated);

        return back()->with('success', 'Accomplishment added successfully.');
    }
}
