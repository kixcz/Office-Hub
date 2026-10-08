<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlaylistController extends Controller
{
    public function index()
    {
        $slides = TvSlide::orderBy('order')->get();

        return Inertia::render('tv/playlist/index', [
            'slides' => $slides,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'type' => 'required|string',
            'duration_seconds' => 'required|integer|min:5',
        ]);

        $maxOrder = TvSlide::max('order') ?? 0;

        TvSlide::create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'duration_seconds' => $validated['duration_seconds'],
            'order' => $maxOrder + 1,
            'config' => [], // default empty config
        ]);

        return redirect()->back();
    }

    public function update(Request $request, TvSlide $playlist)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string',
            'type' => 'sometimes|string',
            'order' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
            'duration_seconds' => 'sometimes|integer|min:5',
        ]);

        $playlist->update($validated);

        return redirect()->back();
    }

    public function destroy(TvSlide $playlist)
    {
        $playlist->delete();

        return redirect()->back();
    }
}
