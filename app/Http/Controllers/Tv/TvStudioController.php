<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvDevice;
use App\Models\TvPublicationLog;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Illuminate\Http\Request;
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
        $devices = TvDevice::all();

        return Inertia::render('tv/dashboard/index', [
            'stats' => [
                'total_slides' => $totalSlides,
                'active_slides' => $activeSlides,
                'total_rotation_time' => $rotationTime,
                'display_status' => 'Online',
                'active_playlist' => 'Official TV Rotation',
                'resolution' => '3840 x 2160 (4K 16:9)',
                'refresh_interval' => $settings ? $settings->refresh_interval : '60s',
                'connected_screens' => $devices->count() ?: 1,
            ],
            'recent_slides' => $slides->take(5),
            'quick_actions' => [
                ['title' => 'Add New Slide', 'url' => '/tv-config/slides?action=new', 'icon' => 'Plus'],
                ['title' => 'Open Slide Composer', 'url' => '/tv-config/slides/builder', 'icon' => 'Paintbrush'],
                ['title' => 'Browse Templates', 'url' => '/tv-config/templates', 'icon' => 'LayoutTemplate'],
                ['title' => 'Launch TV Screen', 'url' => '/tv-display', 'icon' => 'Tv', 'external' => true],
            ],
        ]);
    }

    /**
     * Predefined Institution-Approved Slide Templates module
     */
    public function templates()
    {
        $templates = [
            // Schedule & Meetings
            [
                'id' => 'tpl_daily_focus',
                'title' => 'Daily Focus',
                'category' => 'Schedule & Meetings',
                'description' => 'Prominent today-schedule timeline with meeting cards, room assignments, and digital clock.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'Faculty & Students',
                'compatible_slide_type' => 'Schedule & Meetings',
                'layout_name' => 'Hero + Sidebar',
                'slots_count' => 3,
                'badge' => 'Operational',
                'default_slots' => [
                    'hero' => 'sched_today',
                    'sidebar_top' => 'sched_meetings',
                    'sidebar_bottom' => 'general_clock',
                ],
            ],
            [
                'id' => 'tpl_weekly_planner',
                'title' => 'Weekly Planner',
                'category' => 'Schedule & Meetings',
                'description' => 'Multi-column 5-day academic timetable summarizing key lecture periods, consultations, and committee venues.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'Faculty & Students',
                'compatible_slide_type' => 'Schedule & Meetings',
                'layout_name' => 'Three Column',
                'slots_count' => 3,
                'badge' => 'Comprehensive',
                'default_slots' => [
                    'col_1' => 'sched_weekly',
                    'col_2' => 'sched_meetings',
                    'col_3' => 'sched_calendar',
                ],
            ],
            [
                'id' => 'tpl_meeting_focus',
                'title' => 'Meeting Focus',
                'category' => 'Schedule & Meetings',
                'description' => 'Spotlights upcoming college council, departmental syncs, and thesis defense schedules with venue badges.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Faculty & Staff',
                'compatible_slide_type' => 'Schedule & Meetings',
                'layout_name' => 'Balanced 2×2',
                'slots_count' => 4,
                'badge' => 'Meetings',
                'default_slots' => [
                    'slot_1' => 'sched_meetings',
                    'slot_2' => 'general_qr',
                    'slot_3' => 'sched_today',
                    'slot_4' => 'general_logo',
                ],
            ],

            // Compliance Monitoring
            [
                'id' => 'tpl_balanced_dashboard',
                'title' => 'Balanced Dashboard',
                'category' => 'Compliance Monitoring',
                'description' => 'Equal quadrants highlighting college submission rates, pending outputs, overdue warnings, and review queue.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '18s',
                'audience' => 'Faculty',
                'compatible_slide_type' => 'Compliance Monitoring',
                'layout_name' => 'Balanced 2×2',
                'slots_count' => 4,
                'badge' => 'Core Metric',
                'default_slots' => [
                    'slot_1' => 'comp_overview',
                    'slot_2' => 'comp_pending',
                    'slot_3' => 'comp_overdue',
                    'slot_4' => 'comp_review_queue',
                ],
            ],
            [
                'id' => 'tpl_pending_output_focus',
                'title' => 'Pending Output Focus',
                'category' => 'Compliance Monitoring',
                'description' => 'Detailed faculty deliverables list on the left with compliance health gauges and QR link to submission portal.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Faculty',
                'compatible_slide_type' => 'Compliance Monitoring',
                'layout_name' => 'Hero + Sidebar',
                'slots_count' => 3,
                'badge' => 'Actionable',
                'default_slots' => [
                    'hero' => 'comp_pending',
                    'sidebar_top' => 'comp_overview',
                    'sidebar_bottom' => 'general_qr',
                ],
            ],
            [
                'id' => 'tpl_deadline_focus',
                'title' => 'Deadline Focus',
                'category' => 'Compliance Monitoring',
                'description' => 'High-visibility countdown tickers for syllabus compliance, midterm grade submission deadlines, and TOS/TQ dates.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Faculty',
                'compatible_slide_type' => 'Compliance Monitoring',
                'layout_name' => 'Dashboard + Footer',
                'slots_count' => 3,
                'badge' => 'Urgent',
                'default_slots' => [
                    'main_left' => 'comp_overdue',
                    'main_right' => 'comp_pending',
                    'footer' => 'comp_overview',
                ],
            ],

            // Performance & Recognition
            [
                'id' => 'tpl_leaderboard',
                'title' => 'Leaderboard Podium',
                'category' => 'Performance',
                'description' => 'Top performing faculty rankings podium with evaluation ratings, on-time percentage bars, and program tags.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Performance',
                'layout_name' => 'Hero + Sidebar',
                'slots_count' => 3,
                'badge' => 'Podium',
                'default_slots' => [
                    'hero' => 'faculty_top',
                    'sidebar_top' => 'perf_top_program',
                    'sidebar_bottom' => 'perf_recognition',
                ],
            ],
            [
                'id' => 'tpl_recognition_dashboard',
                'title' => 'Recognition Dashboard',
                'category' => 'Performance',
                'description' => 'Balanced layout celebrating high achievers across teaching excellence, research papers, and extension programs.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '18s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Performance',
                'layout_name' => 'Balanced 2×2',
                'slots_count' => 4,
                'badge' => 'Celebratory',
                'default_slots' => [
                    'slot_1' => 'faculty_top',
                    'slot_2' => 'perf_recognition',
                    'slot_3' => 'perf_semester_highlights',
                    'slot_4' => 'perf_top_program',
                ],
            ],
            [
                'id' => 'tpl_metrics_focus',
                'title' => 'Metrics Focus',
                'category' => 'Performance',
                'description' => 'Deep comparative charts between BSIT, BSCS, BSIS, and BLIS departments with semester target achievements.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '15s',
                'audience' => 'Faculty & Staff',
                'compatible_slide_type' => 'Performance',
                'layout_name' => 'Three Column',
                'slots_count' => 3,
                'badge' => 'Analytics',
                'default_slots' => [
                    'col_1' => 'perf_top_program',
                    'col_2' => 'perf_recognition',
                    'col_3' => 'perf_semester_highlights',
                ],
            ],

            // Spotlight Slides
            [
                'id' => 'tpl_portrait_left',
                'title' => 'Portrait Left',
                'category' => 'Spotlight',
                'description' => 'Full-screen hero layout with large portrait on the left and bold celebratory headlines and details on the right.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Spotlight',
                'layout_name' => 'Media Focus',
                'slots_count' => 2,
                'badge' => 'Hero Left',
                'default_slots' => [
                    'media_slot' => 'general_image',
                    'content_slot' => 'general_text',
                ],
            ],
            [
                'id' => 'tpl_portrait_right',
                'title' => 'Portrait Right',
                'category' => 'Spotlight',
                'description' => 'Dramatic layout placing the honoree portrait on the right side with congratulations banner on the left.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Spotlight',
                'layout_name' => 'Media Focus',
                'slots_count' => 2,
                'badge' => 'Hero Right',
                'default_slots' => [
                    'media_slot' => 'general_image',
                    'content_slot' => 'general_text',
                ],
            ],
            [
                'id' => 'tpl_centered_celebration',
                'title' => 'Centered Celebration',
                'category' => 'Spotlight',
                'description' => 'Festive birthday or major milestone layout with centered medallion portrait, confetti accents, and greeting text.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '25s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Spotlight',
                'layout_name' => 'Hero + Sidebar',
                'slots_count' => 3,
                'badge' => 'Birthday/Milestone',
                'default_slots' => [
                    'hero' => 'general_text',
                    'sidebar_top' => 'general_image',
                    'sidebar_bottom' => 'general_logo',
                ],
            ],
            [
                'id' => 'tpl_image_achievement',
                'title' => 'Image + Achievement',
                'category' => 'Spotlight',
                'description' => 'Showcases publication cover, certification plaque, or research presentation photo alongside citation credentials.',
                'aspect_ratio' => '16:9',
                'recommended_duration' => '20s',
                'audience' => 'All Viewers',
                'compatible_slide_type' => 'Spotlight',
                'layout_name' => 'Balanced 2×2',
                'slots_count' => 4,
                'badge' => 'Research/Award',
                'default_slots' => [
                    'slot_1' => 'general_image',
                    'slot_2' => 'general_text',
                    'slot_3' => 'perf_recognition',
                    'slot_4' => 'general_qr',
                ],
            ],
        ];

        return Inertia::render('tv/templates/index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Reusable Data-driven Widget Library Catalog
     */
    public function widgets()
    {
        $categories = [
            [
                'name' => 'General Content',
                'domain' => 'general',
                'description' => 'Fundamental building blocks for headers, visual emblems, media containers, and interactive scan targets.',
                'widgets' => [
                    [
                        'id' => 'general_text',
                        'name' => 'Text / Heading',
                        'desc' => 'Custom text, subheadings, and rich body paragraphs with font hierarchy controls.',
                        'type' => 'Presentation',
                        'icon' => 'Type',
                        'supported_slots' => ['all'],
                        'config_schema' => ['headline', 'subtext', 'alignment', 'font_size', 'color_accent'],
                    ],
                    [
                        'id' => 'general_image',
                        'name' => 'Image / Portrait Container',
                        'desc' => 'High-resolution image container with aspect fill, border radius presets, and optional caption.',
                        'type' => 'Media',
                        'icon' => 'Image',
                        'supported_slots' => ['hero', 'media_slot', 'slot_1', 'slot_2', 'sidebar_top'],
                        'config_schema' => ['image_url', 'aspect_ratio', 'corner_radius', 'caption'],
                    ],
                    [
                        'id' => 'general_qr',
                        'name' => 'QR Code Action Target',
                        'desc' => 'Generates high-contrast, scannable QR code linking to OfficeHub resources or custom URLs.',
                        'type' => 'Interactive',
                        'icon' => 'QrCode',
                        'supported_slots' => ['sidebar_top', 'sidebar_bottom', 'slot_4', 'footer', 'col_3'],
                        'config_schema' => ['destination_type', 'target_url', 'label', 'qr_size', 'visual_contrast', 'expires_at'],
                    ],
                    [
                        'id' => 'general_logo',
                        'name' => 'College Crest / Logo',
                        'desc' => 'Official CIDS University emblem with transparent SVG rendering and program watermark support.',
                        'type' => 'Branding',
                        'icon' => 'Award',
                        'supported_slots' => ['sidebar_bottom', 'footer', 'slot_4'],
                        'config_schema' => ['show_program_text', 'size', 'alignment'],
                    ],
                    [
                        'id' => 'general_divider',
                        'name' => 'Visual Divider',
                        'desc' => 'Horizontal or vertical separator line with accent color gradients and spacing padding.',
                        'type' => 'Layout',
                        'icon' => 'Minus',
                        'supported_slots' => ['all'],
                        'config_schema' => ['thickness', 'orientation', 'color_style'],
                    ],
                    [
                        'id' => 'general_clock',
                        'name' => 'Synchronized Clock & Weather',
                        'desc' => 'Live accurate system clock with day, date, and academic period context.',
                        'type' => 'Time',
                        'icon' => 'Clock',
                        'supported_slots' => ['sidebar_bottom', 'footer', 'slot_4'],
                        'config_schema' => ['time_format', 'show_seconds', 'show_date'],
                    ],
                ],
            ],
            [
                'name' => 'Campus Announcements',
                'domain' => 'announcements',
                'description' => 'Direct sync with CIDS OfficeHub newsfeed and administrative circulars.',
                'widgets' => [
                    [
                        'id' => 'ann_latest',
                        'name' => 'Latest Announcements',
                        'desc' => 'Card list of recent broadcast announcements filtered by academic period and target audience.',
                        'type' => 'Data Source',
                        'icon' => 'Megaphone',
                        'supported_slots' => ['hero', 'col_1', 'slot_1', 'full_width_main'],
                        'config_schema' => ['max_items', 'target_audience', 'priority_filter', 'show_author'],
                    ],
                    [
                        'id' => 'ann_featured',
                        'name' => 'Featured Highlight Card',
                        'desc' => 'Spotlights a single critical announcement with banner image, priority badge, and date.',
                        'type' => 'Data Source',
                        'icon' => 'Star',
                        'supported_slots' => ['hero', 'slot_1', 'col_2'],
                        'config_schema' => ['announcement_id', 'show_badge', 'show_qr_code'],
                    ],
                ],
            ],
            [
                'name' => 'Compliance Monitoring',
                'domain' => 'compliance',
                'description' => 'Academic deliverables, syllabi compliance, grade submissions, and review queues.',
                'widgets' => [
                    [
                        'id' => 'comp_overview',
                        'name' => 'Compliance Overview',
                        'desc' => 'Circular gauge showing college-wide on-time deliverable rate with on-time/pending/overdue KPIs.',
                        'type' => 'Data Source',
                        'icon' => 'ShieldCheck',
                        'supported_slots' => ['hero', 'sidebar_top', 'slot_1', 'col_1', 'footer'],
                        'config_schema' => ['academic_period', 'program', 'show_kpi_cards'],
                    ],
                    [
                        'id' => 'comp_pending',
                        'name' => 'Pending Outputs Queue',
                        'desc' => 'Chronological list of deliverables due within the next 7 to 14 days sorted by deadline urgency.',
                        'type' => 'Data Source',
                        'icon' => 'ListFilter',
                        'supported_slots' => ['hero', 'col_1', 'col_2', 'slot_2', 'main_right'],
                        'config_schema' => ['max_entries', 'program_filter', 'urgency_threshold_days'],
                    ],
                    [
                        'id' => 'comp_overdue',
                        'name' => 'Overdue Outputs Alert',
                        'desc' => 'High-visibility alert table of overdue submissions with faculty program tags and days delinquent.',
                        'type' => 'Data Source',
                        'icon' => 'AlertTriangle',
                        'supported_slots' => ['col_2', 'slot_3', 'sidebar_bottom', 'main_left'],
                        'config_schema' => ['max_entries', 'program_filter', 'highlight_severity'],
                    ],
                    [
                        'id' => 'comp_review_queue',
                        'name' => 'Dean / Chair Review Queue',
                        'desc' => 'Summary of submitted deliverables awaiting Dean endorsement or Department Chair validation.',
                        'type' => 'Data Source',
                        'icon' => 'ClipboardList',
                        'supported_slots' => ['col_3', 'slot_4', 'sidebar_bottom'],
                        'config_schema' => ['requirement_type', 'max_entries'],
                    ],
                ],
            ],
            [
                'name' => 'Schedule & Timetables',
                'domain' => 'scheduling',
                'description' => 'Real-time sync with Semester Schedule Generator, meetings, and calendar events.',
                'widgets' => [
                    [
                        'id' => 'sched_today',
                        'name' => "Today's Schedule",
                        'desc' => 'Timeline of currently active and upcoming classes with room codes and instructor names.',
                        'type' => 'Data Source',
                        'icon' => 'Calendar',
                        'supported_slots' => ['hero', 'col_1', 'slot_1', 'slot_3'],
                        'config_schema' => ['time_window_hours', 'max_entries', 'room_filter'],
                    ],
                    [
                        'id' => 'sched_weekly',
                        'name' => 'Weekly Overview',
                        'desc' => 'Summary matrix of academic events, college deadlines, and lecture periods for the active week.',
                        'type' => 'Data Source',
                        'icon' => 'CalendarRange',
                        'supported_slots' => ['hero', 'col_1', 'full_width_main'],
                        'config_schema' => ['academic_period', 'show_weekend'],
                    ],
                    [
                        'id' => 'sched_meetings',
                        'name' => 'Upcoming Meetings',
                        'desc' => 'Syncs with scheduled faculty conferences, department meetings, and administrative hearings.',
                        'type' => 'Data Source',
                        'icon' => 'Users',
                        'supported_slots' => ['sidebar_top', 'col_2', 'slot_2'],
                        'config_schema' => ['max_entries', 'include_venues'],
                    ],
                    [
                        'id' => 'sched_calendar',
                        'name' => 'Calendar Highlights',
                        'desc' => 'Highlights from official institutional academic calendar (prelims, midterms, finals, holidays).',
                        'type' => 'Data Source',
                        'icon' => 'Clock',
                        'supported_slots' => ['sidebar_bottom', 'col_3', 'slot_3'],
                        'config_schema' => ['days_ahead', 'max_entries'],
                    ],
                ],
            ],
            [
                'name' => 'Faculty & Performance',
                'domain' => 'faculty',
                'description' => 'Leaderboard metrics, attendance monitoring, and top achiever rankings.',
                'widgets' => [
                    [
                        'id' => 'faculty_top',
                        'name' => 'Top Performing Faculty',
                        'desc' => 'Ranked podium or list of faculty based on on-time submission rate, research points, or attendance.',
                        'type' => 'Data Source',
                        'icon' => 'Trophy',
                        'supported_slots' => ['hero', 'col_1', 'slot_1'],
                        'config_schema' => ['max_entries', 'academic_period', 'program', 'ranking_metric', 'show_percentage', 'show_program'],
                    ],
                    [
                        'id' => 'faculty_sched',
                        'name' => 'Faculty Schedule Matrix',
                        'desc' => 'Displays active consultation hours, teaching load distribution, and presence status.',
                        'type' => 'Data Source',
                        'icon' => 'UserCheck',
                        'supported_slots' => ['hero', 'col_2', 'slot_2'],
                        'config_schema' => ['program_filter', 'max_entries'],
                    ],
                    [
                        'id' => 'faculty_attendance',
                        'name' => 'Faculty Attendance Summary',
                        'desc' => 'Live biometric and classroom attendance check summary (Present, Late, Online, On Leave).',
                        'type' => 'Data Source',
                        'icon' => 'Activity',
                        'supported_slots' => ['col_2', 'slot_3', 'sidebar_top'],
                        'config_schema' => ['show_percentages', 'show_late_count'],
                    ],
                    [
                        'id' => 'faculty_submission_status',
                        'name' => 'Submission Status Leaderboard',
                        'desc' => 'Ranked table of faculty deliverables compliance rate across all active requirements.',
                        'type' => 'Data Source',
                        'icon' => 'ShieldAlert',
                        'supported_slots' => ['col_3', 'slot_4', 'sidebar_bottom'],
                        'config_schema' => ['max_entries', 'show_avatars'],
                    ],
                ],
            ],
            [
                'name' => 'Program Performance',
                'domain' => 'performance',
                'description' => 'Comparative analytics between BSIT, BSCS, BSIS, and BLIS departments.',
                'widgets' => [
                    [
                        'id' => 'perf_top_program',
                        'name' => 'Top Program Podium',
                        'desc' => 'Highlights leading department with highest TOS/TQ compliance and syllabus completion.',
                        'type' => 'Data Source',
                        'icon' => 'Building2',
                        'supported_slots' => ['hero', 'slot_1', 'sidebar_top'],
                        'config_schema' => ['ranking_metric', 'show_trend_badge'],
                    ],
                    [
                        'id' => 'perf_recognition',
                        'name' => 'Recognition Metrics Matrix',
                        'desc' => 'Comparison bars illustrating faculty awards, paper publications, and community extensions.',
                        'type' => 'Data Source',
                        'icon' => 'BarChart3',
                        'supported_slots' => ['col_2', 'slot_2', 'main_right'],
                        'config_schema' => ['metric_categories', 'show_bar_graphs'],
                    ],
                    [
                        'id' => 'perf_semester_highlights',
                        'name' => 'Semester Highlights & Milestones',
                        'desc' => 'Key achievements reached across all college initiatives in the current academic year.',
                        'type' => 'Data Source',
                        'icon' => 'Sparkles',
                        'supported_slots' => ['col_3', 'slot_3', 'footer'],
                        'config_schema' => ['max_entries'],
                    ],
                ],
            ],
            [
                'name' => 'Facility & Room Monitoring',
                'domain' => 'facility',
                'description' => 'Real-time room availability, computer lab utilization, and idle spaces.',
                'widgets' => [
                    [
                        'id' => 'fac_classroom_status',
                        'name' => 'Classroom Status Overview',
                        'desc' => 'Real-time room occupancy grid (In Use, Available, Maintenance) with ongoing class titles.',
                        'type' => 'Data Source',
                        'icon' => 'Building',
                        'supported_slots' => ['hero', 'col_1', 'slot_1'],
                        'config_schema' => ['building_filter', 'show_available_only'],
                    ],
                    [
                        'id' => 'fac_lab_monitoring',
                        'name' => 'Computer Lab Utilization',
                        'desc' => 'Live workstation and lab utilization rates across Mac Lab, Multimedia Lab, and Cisco Lab.',
                        'type' => 'Data Source',
                        'icon' => 'Laptop',
                        'supported_slots' => ['col_2', 'slot_2'],
                        'config_schema' => ['show_idle_count'],
                    ],
                    [
                        'id' => 'fac_idle_rooms',
                        'name' => 'Idle Rooms & Vacancies',
                        'desc' => 'Lists rooms currently vacant and available for ad-hoc makeup classes or study sessions.',
                        'type' => 'Data Source',
                        'icon' => 'DoorOpen',
                        'supported_slots' => ['sidebar_bottom', 'col_3', 'slot_3'],
                        'config_schema' => ['min_available_minutes'],
                    ],
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

        $devices = TvDevice::all();
        $settings = TvSetting::pluck('value', 'key')->toArray();

        return Inertia::render('tv/preview/index', [
            'slides' => $slides,
            'total_slides' => $slides->count(),
            'default_resolution' => $settings['screen_resolution'] ?? '1920x1080 (Full HD 16:9)',
            'devices' => $devices,
            'settings' => $settings,
        ]);
    }

    /**
     * Publication History & Rollbacks (Audit Log)
     */
    public function history()
    {
        $logs = TvPublicationLog::with('user')->latest()->take(50)->get();

        $formattedLogs = $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'version' => $log->version ?? 'v2.5',
                'action' => $log->action,
                'target_type' => $log->target_type,
                'target_name' => $log->target_name,
                'published_at' => $log->created_at->format('M d, Y h:i A'),
                'published_by' => $log->publisher_name ?? ($log->user ? $log->user->name : 'System Admin'),
                'changes' => $log->summary,
                'snapshot_before' => $log->snapshot_before,
                'snapshot_after' => $log->snapshot_after,
                'status' => $log->action === 'Published' ? 'Live' : 'Logged',
            ];
        });

        return Inertia::render('tv/history/index', [
            'history' => $formattedLogs,
        ]);
    }

    /**
     * Restore previous publication snapshot
     */
    public function rollback(Request $request, $id)
    {
        $log = TvPublicationLog::findOrFail($id);

        if ($log->snapshot_after && is_array($log->snapshot_after)) {
            // Apply snapshot values if display settings
            if ($log->target_type === 'Display Settings') {
                foreach ($log->snapshot_after as $key => $value) {
                    TvSetting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
                }
            }
        }

        TvPublicationLog::create([
            'version' => 'v2.'.now()->format('m.d'),
            'action' => 'Restored',
            'target_type' => $log->target_type,
            'target_name' => $log->target_name,
            'user_id' => auth()->id(),
            'publisher_name' => auth()->user()?->name ?? 'System Administrator',
            'summary' => "Restored configuration snapshot from {$log->created_at->format('M d, Y h:i A')} ({$log->version}).",
            'snapshot_before' => $log->snapshot_before,
            'snapshot_after' => $log->snapshot_after,
        ]);

        return redirect()->back()->with('success', 'Successfully rolled back to previous configuration snapshot.');
    }
}
