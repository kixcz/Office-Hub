<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Models\Meeting;
use Inertia\Inertia;
use Carbon\Carbon;

class TvDisplayController extends Controller
{
    public function index()
    {
        $announcements = Announcement::where('status', 'active')
            ->latest()
            ->get();

        $meetings = Meeting::where('is_public', true)
            ->where('start_time', '>=', Carbon::today())
            ->orderBy('start_time', 'asc')
            ->take(10)
            ->get();

        return Inertia::render('tv/index', [
            'announcements' => $announcements,
            'meetings' => $meetings,
        ]);
    }
}
