<?php

namespace App\Http\Controllers;

use App\Models\Accomplishment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccomplishmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('System Administrator') ?? false;
        $isDean = $user?->hasRole('Dean') ?? false;
        $isProgramHead = $user?->hasRole('Program Head') || ($user?->hasRole('Program Chair') ?? false);
        $userProgramId = $user?->faculty?->program_id;

        $query = Accomplishment::with(['user.faculty.program'])
            ->orderBy('date_achieved', 'desc');

        // Scoping for Program Head
        if ($isProgramHead && ! $isSuperAdmin && ! $isDean && $userProgramId) {
            $query->whereHas('user.faculty', function ($q) use ($userProgramId) {
                $q->where('program_id', $userProgramId);
            });
        }

        $accomplishments = $query->get();

        return Inertia::render('accomplishments/index', [
            'accomplishments' => $accomplishments,
            'is_admin' => $isSuperAdmin || $isDean,
            'user_permissions' => [
                'is_super_admin' => $isSuperAdmin,
                'is_dean' => $isDean,
                'is_program_head' => $isProgramHead,
                'can_verify' => $isSuperAdmin || $isDean || $isProgramHead,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
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

    /**
     * Institutional Verification Action for Program Head, Dean, or Super Admin
     */
    public function verify(Request $request, Accomplishment $accomplishment)
    {
        $user = $request->user();
        $roleName = $user->hasRole('Dean') ? 'College Dean' : ($user->hasRole('Program Head') ? 'Program Head' : 'Academic Affairs Office');

        $accomplishment->update([
            'status' => 'verified',
            'verified_by' => "{$user->name} ({$roleName})",
            'verified_at' => now(),
            'return_reason' => null,
        ]);

        return back()->with('success', "Accomplishment '{$accomplishment->title}' verified for official institutional evidence.");
    }

    /**
     * Return accomplishment with audit explanation (e.g. incorrect scope, wrong category, insufficient evidence)
     */
    public function returnAccomplishment(Request $request, Accomplishment $accomplishment)
    {
        $validated = $request->validate([
            'return_reason' => 'required|string|max:1000',
        ]);

        $accomplishment->update([
            'status' => 'returned',
            'return_reason' => $validated['return_reason'],
            'verified_by' => null,
            'verified_at' => null,
        ]);

        return back()->with('success', "Accomplishment '{$accomplishment->title}' returned with reviewer feedback.");
    }
}
