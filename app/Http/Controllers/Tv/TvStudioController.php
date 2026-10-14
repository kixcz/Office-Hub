<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Inertia\Inertia;

class TvStudioController extends Controller
{
    /**
     * TV Studio Dashboard (Overview)
     */
    public function dashboard()
    {
        $slides = TvSlide::orderBy('order')->get();
        $totalSlides = $slides->count();
        $activeSlides = $slides->where('is_active', true)->count();
        $totalSeconds = $slides->where('is_active', true)->sum('duration_seconds');
        $minutes = floor($totalSeconds / 60);
        $seconds = $totalSeconds % 60;
        $rotationTime = "{$minutes}m {$seconds}s";

        $settings = TvSetting::first();

        return Inertia::render('tv/dashboard/index', [
            'stats' => [
                'total_slides' => $totalSlides,
                'active_slides' => $activeSlides,
                'total_rotation_time' => $rotationTime,
                'display_status' => 'Online',
                'active_playlist' => 'Official TV Rotation',
                'resolution' => '3840 x 2160 (4K 16:9)',
                'refresh_interval' => $settings ? $settings->refresh_interval : '60s',
                'connected_screens' => 1,
            ],
            'recent_slides' => $slides->take(5),
            'quick_actions' => [
                ['title' => 'Add New Slide', 'url' => '/tv-config/slides?action=new', 'icon' => 'Plus'],
                ['title' => 'Open Visual Builder', 'url' => '/tv-config/slides/builder', 'icon' => 'Paintbrush'],
                ['title' => 'Browse Templates', 'url' => '/tv-config/templates', 'icon' => 'LayoutTemplate'],
                ['title' => 'Launch TV Screen', 'url' => '/tv-display', 'icon' => 'Tv', 'external' => true],
            ],
        ]);
    }

    /**
     * Predefined Slide Templates module
     */
    public function templates()
    {
        $templates = [
            [
                'id' => 'tpl_announcement',
                'title' => 'Official Campus Announcement',
                'category' => 'Announcements',
                'description' => 'Hero headline with rich image banner, priority chip, and QR code to details page.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'All Viewers',
                'widgets_count' => 4,
                'badge' => 'Popular',
            ],
            [
                'id' => 'tpl_schedule',
                'title' => 'Live Daily Schedule & Room Utilization',
                'category' => 'Scheduling',
                'description' => 'Split-screen schedule grid displaying active class periods and room reservations.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'Faculty & Students',
                'widgets_count' => 5,
                'badge' => 'Dynamic',
            ],
            [
                'id' => 'tpl_faculty_honor',
                'title' => 'Faculty Performance & Top Ranking',
                'category' => 'Performance',
                'description' => 'Leaderboard podium showcasing top faculty teaching evaluations, awards, and Dean list.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Public & Faculty',
                'widgets_count' => 4,
                'badge' => 'Leaderboard',
            ],
            [
                'id' => 'tpl_compliance',
                'title' => 'Academic Deliverables & Deadlines',
                'category' => 'Compliance',
                'description' => 'Countdown ticker with pending syllabi, exam questions, and grade submission trackers.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Faculty',
                'widgets_count' => 3,
                'badge' => 'Operational',
            ],
            [
                'id' => 'tpl_welcome',
                'title' => 'VIP Guest & Event Welcome Display',
                'category' => 'Welcome',
                'description' => 'High-impact greeting canvas with college crest, event title, date, and animated logo.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '12s',
                'audience' => 'All Viewers',
                'widgets_count' => 3,
                'badge' => 'Event',
            ],
            [
                'id' => 'tpl_blank',
                'title' => 'Blank 16:9 Canvas',
                'category' => 'Custom',
                'description' => 'Empty workspace to design a completely bespoke slide using the Widget Library.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Custom',
                'widgets_count' => 0,
                'badge' => 'Blank',
            ],
        ];

        return Inertia::render('tv/templates/index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Reusable Data-driven Widget Library
     */
    public function widgets()
    {
        $categories = [
            [
                'name' => 'General & Branding',
                'widgets' => [
                    ['id' => 'w_heading', 'name' => 'Typography & Heading', 'desc' => 'Custom text, subheadings, and rich body paragraphs with font controls', 'type' => 'Text', 'icon' => 'Type'],
                    ['id' => 'w_image', 'name' => 'Image / Poster Banner', 'desc' => 'High-resolution image container with aspect fill and rounded corner presets', 'type' => 'Media', 'icon' => 'Image'],
                    ['id' => 'w_video', 'name' => 'Video Loop Player', 'desc' => 'Autoplay muted MP4 or HLS stream with subtle frame fade transitions', 'type' => 'Media', 'icon' => 'Video'],
                    ['id' => 'w_logo', 'name' => 'Institutional Crest / Logo', 'desc' => 'Official CIDS University emblem with transparent SVG rendering', 'type' => 'Branding', 'icon' => 'Award'],
                    ['id' => 'w_qrcode', 'name' => 'Interactive QR Code', 'desc' => 'Generates scannable QR code dynamically linked to target documents or forms', 'type' => 'Interactive', 'icon' => 'QrCode'],
                ],
            ],
            [
                'name' => 'Campus Announcements',
                'widgets' => [
                    ['id' => 'w_ann_latest', 'name' => 'Latest Broadcast Announcements', 'desc' => 'Direct sync with CIDS OfficeHub newsfeed, sorted by broadcast priority', 'type' => 'Data Source', 'icon' => 'Megaphone'],
                    ['id' => 'w_ann_featured', 'name' => 'Featured Highlight Card', 'desc' => 'Spotlight single announcement with badge, author avatar, and event date', 'type' => 'Data Source', 'icon' => 'Star'],
                    ['id' => 'w_notice_board', 'name' => 'Digital Notice Board', 'desc' => 'Multi-column sticky memo board for college memos and administrative circulars', 'type' => 'Data Source', 'icon' => 'ClipboardList'],
                ],
            ],
            [
                'name' => 'Schedule & Timetables',
                'widgets' => [
                    ['id' => 'w_room_sched', 'name' => 'Room Utilization Matrix', 'desc' => 'Real-time sync with Semester Schedule Generator room allocations', 'type' => 'Data Source', 'icon' => 'Building2'],
                    ['id' => 'w_faculty_sched', 'name' => 'Today Faculty Timetable', 'desc' => 'Displays active faculty office hours, class sections, and consultations', 'type' => 'Data Source', 'icon' => 'Calendar'],
                    ['id' => 'w_clock', 'name' => 'Synchronized Digital Clock & Weather', 'desc' => 'Live accurate system clock with day, date, and academic period context', 'type' => 'Time', 'icon' => 'Clock'],
                ],
            ],
            [
                'name' => 'Faculty & Performance',
                'widgets' => [
                    ['id' => 'w_top_faculty', 'name' => 'Top Performing Faculty Podia', 'desc' => 'Dynamic ranking linked to Faculty Performance recognition rules', 'type' => 'Data Source', 'icon' => 'Trophy'],
                    ['id' => 'w_prog_compare', 'name' => 'Program Comparative Metrics', 'desc' => 'Bar chart comparing BSIT, BSCS, and BSIS syllabus completion rates', 'type' => 'Data Source', 'icon' => 'BarChart3'],
                    ['id' => 'w_compliance_gauge', 'name' => 'Compliance Health Gauge', 'desc' => 'Circular completion rate metric for syllabus and exam grade submissions', 'type' => 'Data Source', 'icon' => 'ShieldCheck'],
                ],
            ],
        ];

        return Inertia::render('tv/widgets/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Preview & Testing at 16:9 TV resolution
     */
    public function preview()
    {
        $slides = TvSlide::where('is_active', true)->orderBy('order')->get();
        if ($slides->isEmpty()) {
            $slides = TvSlide::orderBy('order')->get();
        }

        return Inertia::render('tv/preview/index', [
            'slides' => $slides,
            'total_slides' => $slides->count(),
            'default_resolution' => '1920x1080 (Full HD 16:9)',
        ]);
    }

    /**
     * Publication History & Rollbacks
     */
    public function history()
    {
        $history = [
            [
                'version' => 'v2.4.1',
                'published_at' => 'Oct 14, 2026 09:30 AM',
                'published_by' => 'Dr. Eleanor Vance (Super Admin)',
                'changes' => 'Updated faculty leaderboard rankings and adjusted slide 3 duration to 20s.',
                'slides_count' => 7,
                'status' => 'Current Live',
            ],
            [
                'version' => 'v2.4.0',
                'published_at' => 'Oct 12, 2026 02:15 PM',
                'published_by' => 'Dean Office Admin',
                'changes' => 'Added midterm examination notice slide and enabled dynamic room timetable.',
                'slides_count' => 7,
                'status' => 'Archived',
            ],
            [
                'version' => 'v2.3.8',
                'published_at' => 'Oct 05, 2026 11:00 AM',
                'published_by' => 'System Automation',
                'changes' => 'Scheduled academic period transition from Prelim to Midterm.',
                'slides_count' => 6,
                'status' => 'Archived',
            ],
            [
                'version' => 'v2.3.0',
                'published_at' => 'Sep 28, 2026 08:00 AM',
                'published_by' => 'Dr. Eleanor Vance',
                'changes' => 'Initial AY 2026–2027 semester kickoff playlist deployment.',
                'slides_count' => 6,
                'status' => 'Archived',
            ],
        ];

        return Inertia::render('tv/history/index', [
            'history' => $history,
        ]);
    }
}
