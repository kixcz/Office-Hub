<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SlideController extends Controller
{
    public function index()
    {
        $slides = TvSlide::orderBy('order')->get();

        $totalSlides = $slides->count();
        $activeSlides = $slides->where('is_active', true)->count();
        $averageDuration = $totalSlides > 0 ? round($slides->avg('duration_seconds')) : 17;

        $lastSlide = TvSlide::latest('updated_at')->first();
        $lastUpdatedFormatted = $lastSlide && $lastSlide->updated_at
            ? $lastSlide->updated_at->format('M j, Y')
            : 'Oct 13, 2026';

        return Inertia::render('tv/slides/index', [
            'slides' => $slides,
            'stats' => [
                'total_slides' => $totalSlides,
                'active_slides' => $activeSlides,
                'average_duration' => $averageDuration.'s',
                'last_updated' => $lastUpdatedFormatted,
                'last_updated_by' => 'System Admin',
            ],
        ]);
    }

    public function builder(Request $request)
    {
        $slide = TvSlide::first();

        return Inertia::render('tv/slides/builder', [
            'slide' => $slide,
            'slides' => TvSlide::orderBy('order')->get(),
        ]);
    }

    public function edit(TvSlide $slide)
    {
        return Inertia::render('tv/slides/builder', [
            'slide' => $slide,
            'slides' => TvSlide::orderBy('order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'duration_seconds' => 'required|integer|min:5|max:120',
            'target_audience' => 'nullable|string',
            'template_id' => 'nullable|string',
        ]);

        $maxOrder = TvSlide::max('order') ?? 0;

        $slide = TvSlide::create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'duration_seconds' => $validated['duration_seconds'],
            'order' => $maxOrder + 1,
            'is_active' => true,
            'config' => [
                'target_audience' => $validated['target_audience'] ?? 'All Viewers',
                'template_id' => $validated['template_id'] ?? 'blank',
                'created_via' => 'tv_studio_wizard',
            ],
        ]);

        return redirect()->route('tv-config.slides.edit', $slide->id)->with('success', 'New slide created. You can now build it in the Visual Slide Builder.');
    }

    public function update(Request $request, TvSlide $slide)
    {
        $validated = $request->validate([
            'config' => 'sometimes|array',
            'duration_seconds' => 'sometimes|integer|min:5',
            'is_active' => 'sometimes|boolean',
            'title' => 'sometimes|string',
            'type' => 'sometimes|string',
        ]);

        $slide->update($validated);

        return redirect()->back()->with('success', 'Slide configuration saved successfully.');
    }
}
