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
        return Inertia::render('tv/slides/index', [
            'slides' => $slides
        ]);
    }

    public function update(Request $request, TvSlide $slide)
    {
        $validated = $request->validate([
            'config' => 'required|array'
        ]);

        $slide->update([
            'config' => $validated['config']
        ]);

        return redirect()->back();
    }
}
