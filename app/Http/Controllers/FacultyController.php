<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    public function index(): Response
    {
        $faculties = Faculty::with('program')->latest()->get();
        $programs = Program::all();

        return Inertia::render('faculties/index', [
            'faculties' => $faculties,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'program_id' => 'required|exists:programs,id',
            'profile_picture' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('faculty-photos', 'public');
            $validated['profile_picture'] = $path;
        }

        Faculty::create($validated);

        return redirect()->back()->with('success', 'Faculty profile created successfully.');
    }

    public function update(Request $request, Faculty $faculty): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'program_id' => 'required|exists:programs,id',
            'profile_picture' => 'nullable|image|max:5120',
            'remove_photo' => 'nullable|boolean',
        ]);

        if ($request->boolean('remove_photo')) {
            if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
                Storage::disk('public')->delete($faculty->profile_picture);
            }
            $validated['profile_picture'] = null;
        } elseif ($request->hasFile('profile_picture')) {
            if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
                Storage::disk('public')->delete($faculty->profile_picture);
            }
            $path = $request->file('profile_picture')->store('faculty-photos', 'public');
            $validated['profile_picture'] = $path;
        }

        $faculty->update($validated);

        return redirect()->back()->with('success', 'Faculty profile updated successfully.');
    }

    public function destroy(Faculty $faculty): RedirectResponse
    {
        if ($faculty->profile_picture && Storage::disk('public')->exists($faculty->profile_picture)) {
            Storage::disk('public')->delete($faculty->profile_picture);
        }

        $faculty->delete();

        return redirect()->back()->with('success', 'Faculty profile deleted successfully.');
    }
}
