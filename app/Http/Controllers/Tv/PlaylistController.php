<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\SpotlightSlide;
use App\Models\TvSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlaylistController extends Controller
{
    public function index()
    {
        $slides = TvSlide::orderBy('order')->get();
        $spotlights = SpotlightSlide::with('faculty')->activeAt()->orderByDesc('priority')->get();

        $totalSlides = $slides->count();
        $activeSlides = $slides->where('is_active', true)->count();
        $activePercentage = $totalSlides > 0 ? round(($activeSlides / $totalSlides) * 100) : 100;

        $totalSeconds = $slides->where('is_active', true)->sum('duration_seconds') + $spotlights->sum('display_duration');
        $minutes = floor($totalSeconds / 60);
        $seconds = $totalSeconds % 60;
        $rotationTime = "{$minutes}m {$seconds}s";

        $lastSlide = TvSlide::latest('updated_at')->first();
        $lastUpdatedFormatted = $lastSlide && $lastSlide->updated_at
            ? $lastSlide->updated_at->format('M j, Y')
            : 'Oct 13, 2026';
        $lastUpdatedTimeFormatted = $lastSlide && $lastSlide->updated_at
            ? $lastSlide->updated_at->format('g:i A').' by System Admin'
            : '11:35 AM by System Admin';

        return Inertia::render('tv/playlist/index', [
            'slides' => $slides,
            'spotlights' => $spotlights,
            'stats' => [
                'total_slides' => $totalSlides,
                'active_slides' => $activeSlides,
                'active_spotlights' => $spotlights->count(),
                'active_percentage' => $activePercentage,
                'total_rotation_time' => $rotationTime,
                'last_updated' => $lastUpdatedFormatted,
                'last_updated_time' => $lastUpdatedTimeFormatted,
            ],
            'playlist_settings' => [
                'autoplay' => true,
                'transition_speed' => 'Fade (1s)',
                'default_slide_duration' => '15 seconds',
                'display_mode' => 'Full Screen',
                'repeat_playlist' => true,
            ],
        ]);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:tv_slides,id',
        ]);

        foreach ($validated['order'] as $index => $id) {
            TvSlide::where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->back()->with('success', 'Slide order updated successfully.');
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
            'is_active' => true,
            'config' => [], // default empty config
        ]);

        return redirect()->back()->with('success', 'Slide added to playlist.');
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

        return redirect()->back()->with('success', 'Slide updated successfully.');
    }

    public function destroy(TvSlide $playlist)
    {
        $playlist->delete();

        return redirect()->back()->with('success', 'Slide removed from playlist.');
    }
}
