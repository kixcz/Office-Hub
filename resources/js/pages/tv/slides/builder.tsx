import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Tv, 
    Undo, 
    Redo, 
    Maximize2, 
    Grid, 
    Save, 
    Eye, 
    Send, 
    Search, 
    Type, 
    Image as ImageIcon, 
    Video, 
    QrCode, 
    Minus, 
    Megaphone, 
    Star, 
    ClipboardList, 
    ShieldCheck, 
    AlertTriangle, 
    Trophy, 
    Calendar, 
    Users, 
    Building2, 
    BarChart3, 
    Clock, 
    ChevronDown, 
    MoreVertical, 
    Trash2, 
    Check, 
    Sliders, 
    Paintbrush, 
    Sparkles, 
    Layers, 
    Layout, 
    FileText, 
    Activity, 
    Award, 
    GraduationCap,
    TrendingUp,
    ListFilter,
    Table,
    PieChart,
    ChevronRight,
    Play,
    Settings
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TV Display', href: '/tv-display' },
    { title: 'Slide Configuration', href: '/tv-config/slides' },
    { title: 'Visual Slide Builder', href: '/tv-config/slides/builder' },
];

interface Slide {
    id: number;
    title: string;
    type: string;
    order: number;
    is_active: boolean;
    duration_seconds: number;
    config?: any;
    updated_at?: string;
}

interface Props {
    slide?: Slide;
    slides?: Slide[];
}

// Custom Switch component
function ToggleSwitch({ 
    checked, 
    onChange, 
    id 
}: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    id?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            id={id}
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                "w-11 h-6 flex items-center rounded-full p-0.75 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer",
                checked ? "bg-blue-600 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
            )}
        >
            <span
                className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out"
                )}
            />
        </button>
    );
}

export default function VisualSlideBuilder({ slide, slides = [] }: Props) {
    // Slide Top Bar metadata state
    const [slideTitle, setSlideTitle] = useState(slide?.title || 'Slide 1 - Daily Overview');
    const [slideType, setSlideType] = useState(slide?.type || 'Custom Slide');
    const [durationSeconds, setDurationSeconds] = useState(slide?.duration_seconds || 15);
    const [statusDraft, setStatusDraft] = useState(true);

    // Left Library category active tab
    const [libraryTab, setLibraryTab] = useState<'widgets' | 'layouts' | 'templates'>('widgets');
    const [widgetSearch, setWidgetSearch] = useState('');

    // Center Canvas Toolbar controls
    const [zoomLevel, setZoomLevel] = useState('72%');
    const [aspectRatio, setAspectRatio] = useState('16:9 (1920 × 1080)');
    const [showGrid, setShowGrid] = useState(true);
    const [showSafeArea, setShowSafeArea] = useState(false);

    // Selected Widget on Canvas
    const [selectedWidgetId, setSelectedWidgetId] = useState<string>('top_faculty');

    // Right Properties Tabs
    const [propertiesTab, setPropertiesTab] = useState<'content' | 'appearance' | 'advanced'>('content');

    // Bottom Canvas Settings Tabs
    const [bottomTab, setBottomTab] = useState<'display' | 'appearance' | 'advanced'>('display');

    // Right Panel: Top Performing Faculty properties state
    const [widgetTitle, setWidgetTitle] = useState('Top Performing Faculty');
    const [dataSource, setDataSource] = useState('Faculty Performance');
    const [academicPeriod, setAcademicPeriod] = useState('Current Semester (AY 2026-2027, 1st Sem)');
    const [programFilter, setProgramFilter] = useState('All Programs');
    const [rankingMetric, setRankingMetric] = useState('On-Time Submission Rate');
    const [maxEntries, setMaxEntries] = useState(5);
    const [displayStyle, setDisplayStyle] = useState<'list' | 'bars' | 'compact'>('list');
    const [showRankNumber, setShowRankNumber] = useState(true);
    const [showProgram, setShowProgram] = useState(true);
    const [showPercentage, setShowPercentage] = useState(true);

    // Bottom Canvas Configuration Form state
    const [transitionEffect, setTransitionEffect] = useState('Fade');
    const [backgroundBehavior, setBackgroundBehavior] = useState('Fit to Screen');
    const [showHeader, setShowHeader] = useState(true);
    const [showDateTime, setShowDateTime] = useState(true);
    const [showFooterTicker, setShowFooterTicker] = useState(false);
    const [contentDensity, setContentDensity] = useState('Comfortable');
    const [maxRecordsBottom, setMaxRecordsBottom] = useState(5);
    const [overflowBehavior, setOverflowBehavior] = useState('Paginate');

    // Save notification
    const [isSavedNotice, setIsSavedNotice] = useState(false);

    const handleSaveDraft = () => {
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 3000);
    };

    const handlePublish = () => {
        if (slide) {
            router.put(`/tv-config/slides/${slide.id}`, {
                title: slideTitle,
                type: slideType,
                duration_seconds: durationSeconds,
                is_active: true,
                config: {
                    widgetTitle,
                    dataSource,
                    academicPeriod,
                    programFilter,
                    rankingMetric,
                    maxEntries,
                    displayStyle,
                    showRankNumber,
                    showProgram,
                    showPercentage,
                    transitionEffect,
                    backgroundBehavior,
                    showHeader,
                    showDateTime,
                    showFooterTicker,
                    contentDensity,
                    maxRecordsBottom,
                    overflowBehavior,
                }
            }, {
                onSuccess: () => {
                    alert('Slide successfully published to TV Playlist!');
                }
            });
        } else {
            alert('Slide configuration published successfully!');
        }
    };

    // Widgets definitions in library matching mockup
    const widgetCategories = [
        {
            title: 'General Content',
            items: [
                { id: 'heading', name: 'Text / Heading', icon: Type, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
                { id: 'image', name: 'Image', icon: ImageIcon, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' },
                { id: 'video', name: 'Video', icon: Video, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
                { id: 'logo', name: 'College Logo', icon: Award, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
                { id: 'qr', name: 'QR Code', icon: QrCode, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' },
                { id: 'divider', name: 'Divider', icon: Minus, bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
            ]
        },
        {
            title: 'Announcements',
            items: [
                { id: 'latest_ann', name: 'Latest Announcements', icon: Megaphone, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
                { id: 'featured_ann', name: 'Featured Announcement', icon: Star, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
                { id: 'notice_board', name: 'Notice Board', icon: ClipboardList, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' },
            ]
        },
        {
            title: 'Compliance',
            items: [
                { id: 'comp_overview', name: 'Compliance Overview', icon: ShieldCheck, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' },
                { id: 'pending_outputs', name: 'Pending Outputs', icon: ListFilter, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
                { id: 'overdue_outputs', name: 'Overdue Outputs', icon: AlertTriangle, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
            ]
        },
        {
            title: 'Faculty',
            items: [
                { id: 'top_faculty', name: 'Top Performing Faculty', icon: Trophy, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
                { id: 'faculty_schedule', name: 'Faculty Schedule', icon: Calendar, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
                { id: 'submission_status', name: 'Faculty Submission Status', icon: Users, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' },
            ]
        },
        {
            title: 'Programs',
            items: [
                { id: 'top_program', name: 'Top Program', icon: Building2, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' },
                { id: 'prog_compare', name: 'Program Comparison', icon: BarChart3, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
                { id: 'prog_stats', name: 'Program Statistics', icon: PieChart, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
            ]
        }
    ];

    // Sample data for Top Faculty Leaderboard on Canvas
    const sampleFacultyLeaderboard = [
        { rank: 1, name: 'Arnel Reyes', program: 'BSIS', percentage: '96.2%', color: 'bg-amber-500' },
        { rank: 2, name: 'Peter Parker', program: 'BSIT', percentage: '89.1%', color: 'bg-slate-400' },
        { rank: 3, name: 'Cristina Lopez', program: 'BLIS', percentage: '76.3%', color: 'bg-amber-700' },
        { rank: 4, name: 'Tony Stark', program: 'BSCS', percentage: '71.8%', color: 'bg-slate-300' },
        { rank: 5, name: 'Clark Kent', program: 'BSCS', percentage: '68.4%', color: 'bg-slate-300' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Visual TV Slide Builder - CIDS OfficeHub" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-7 max-w-full mx-auto w-full transition-colors">
                
                {/* 1. Header Toolbar Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Create / Edit Slide
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Design and configure your slide for the TV display using a drag-and-drop interface.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5 text-slate-500" />
                            <span>Save as Draft</span>
                        </button>

                        <a
                            href="/tv-display"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview</span>
                        </a>

                        <button
                            type="button"
                            onClick={handlePublish}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publish to Playlist</span>
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.visit('/tv-config/slides')}>
                                    Return to Slides List
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.visit('/tv-config/playlist')}>
                                    View Playlist
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* 2. Slide Meta Inputs Row */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        {/* Slide Title */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Slide Title
                            </label>
                            <input
                                type="text"
                                value={slideTitle}
                                onChange={(e) => setSlideTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        {/* Slide Type */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Slide Type
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                                        <span>{slideType}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuItem onClick={() => setSlideType('Custom Slide')}>Custom Slide</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 1 - Daily Overview')}>Daily Overview</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 2 - Schedule & Meetings')}>Schedule & Meetings</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 3 - Compliance Monitoring')}>Compliance Monitoring</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 4 - Performance & Recognition')}>Performance & Recognition</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 5 - Classroom Monitoring')}>Classroom Monitoring</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 6 - Class Monitoring')}>Class Monitoring</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 7 - Faculty Schedule')}>Faculty Schedule</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSlideType('Slide 8 - Consolidated Calendar')}>Consolidated Calendar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Duration */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Duration (seconds)
                            </label>
                            <input
                                type="number"
                                min="5"
                                value={durationSeconds}
                                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Status Badge & Last Edited Info */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Draft
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                            Last edited: Oct 13, 2026 11:32 AM
                        </span>
                    </div>
                </div>

                {/* 3. Three-Panel Visual Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT PANEL: Widget Library (3 columns on lg) */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex flex-col gap-4">
                        {/* Library Tabs */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setLibraryTab('widgets')}
                                className={cn(
                                    "py-1.5 text-xs font-bold rounded-lg transition-all",
                                    libraryTab === 'widgets' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Widgets
                            </button>
                            <button
                                type="button"
                                onClick={() => setLibraryTab('layouts')}
                                className={cn(
                                    "py-1.5 text-xs font-bold rounded-lg transition-all",
                                    libraryTab === 'layouts' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Layouts
                            </button>
                            <button
                                type="button"
                                onClick={() => setLibraryTab('templates')}
                                className={cn(
                                    "py-1.5 text-xs font-bold rounded-lg transition-all",
                                    libraryTab === 'templates' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Templates
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search widgets..."
                                value={widgetSearch}
                                onChange={(e) => setWidgetSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        {/* Categories List */}
                        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                            {widgetCategories.map((category) => (
                                <div key={category.title} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span>{category.title}</span>
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {category.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <div
                                                    key={item.id}
                                                    draggable
                                                    onClick={() => setSelectedWidgetId(item.id)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-center transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-2xs",
                                                        selectedWidgetId === item.id ? "ring-2 ring-blue-500/20 border-blue-400 bg-blue-50/20" : "bg-slate-50/50 dark:bg-slate-800/40"
                                                    )}
                                                >
                                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-1.5", item.bg)}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight line-clamp-2">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER PANEL: Interactive Slide Canvas (6 columns on lg) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                        
                        {/* Canvas Top Toolbar Controls */}
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
                            {/* Undo / Redo / Zoom */}
                            <div className="flex items-center gap-1.5">
                                <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100">
                                    <Undo className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100">
                                    <Redo className="w-3.5 h-3.5" />
                                </button>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                                            <span>{zoomLevel}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => setZoomLevel('50%')}>50%</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setZoomLevel('72%')}>72%</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setZoomLevel('100%')}>100%</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Aspect Ratio, Grid & Safe Area */}
                            <div className="flex items-center gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                                            <Tv className="w-3 h-3 text-blue-500 mr-1" />
                                            <span>{aspectRatio}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setAspectRatio('16:9 (1920 × 1080)')}>16:9 (1920 × 1080)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setAspectRatio('16:9 (1366 × 768)')}>16:9 (1366 × 768)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-500">Grid</span>
                                    <ToggleSwitch checked={showGrid} onChange={setShowGrid} />
                                </div>

                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={showSafeArea} 
                                        onChange={(e) => setShowSafeArea(e.target.checked)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                                    />
                                    <span>Show Safe Area</span>
                                </label>
                            </div>
                        </div>

                        {/* Interactive 16:9 Widescreen Canvas */}
                        <div className="relative aspect-video w-full rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-xl overflow-hidden p-4 flex flex-col justify-between text-white select-none">
                            
                            {/* Slide Canvas Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <img src="/CIDS_Logo.jpg" alt="CIDS" className="w-6 h-6 object-contain rounded" />
                                    <div>
                                        <div className="text-[11px] font-black tracking-wider text-amber-400 leading-tight">CIDS</div>
                                        <div className="text-[8px] text-slate-300 font-medium">COLLEGE OF INFORMATION AND DIGITAL SCIENCES</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-200">AY 2026-2027, 1st Semester ❯</div>
                                    <div className="text-[8px] text-slate-400 font-medium">Tuesday, October 13, 2026 11:32 AM</div>
                                </div>
                            </div>

                            {/* Bento Grid Layout Canvas Area */}
                            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 py-2">
                                
                                {/* Widget 1: Welcome Banner (5 cols) */}
                                <div 
                                    onClick={() => setSelectedWidgetId('welcome')}
                                    className={cn(
                                        "col-span-5 rounded-xl bg-cover bg-center border relative overflow-hidden flex flex-col justify-end p-3 cursor-pointer transition-all",
                                        selectedWidgetId === 'welcome' ? "ring-2 ring-blue-400 border-blue-400" : "border-white/10"
                                    )}
                                    style={{ backgroundImage: 'linear-gradient(rgba(15,23,42,0.6), rgba(15,23,42,0.9)), url(/CIDS_Logo.jpg)' }}
                                >
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Welcome to</span>
                                    <h3 className="text-sm font-black text-white leading-tight">CIDS OfficeHub</h3>
                                    <p className="text-[9px] text-slate-300 mt-1">Empowering Education Through Digital Innovation</p>
                                </div>

                                {/* Widget 2: College-Wide Compliance (7 cols) */}
                                <div 
                                    onClick={() => setSelectedWidgetId('comp_overview')}
                                    className={cn(
                                        "col-span-7 rounded-xl bg-white/5 border p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all",
                                        selectedWidgetId === 'comp_overview' ? "ring-2 ring-blue-400 border-blue-400" : "border-white/10"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>College-Wide Compliance</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-slate-700 flex items-center justify-center">
                                                <span className="text-[10px] font-black text-white">82.5%</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 flex-1 text-[9px]">
                                                <div className="bg-white/5 p-1 rounded">
                                                    <span className="text-slate-400 block">On-Time</span>
                                                    <span className="font-bold text-emerald-400">33</span>
                                                </div>
                                                <div className="bg-white/5 p-1 rounded">
                                                    <span className="text-slate-400 block">Pending</span>
                                                    <span className="font-bold text-amber-400">8</span>
                                                </div>
                                                <div className="bg-white/5 p-1 rounded">
                                                    <span className="text-slate-400 block">Overdue</span>
                                                    <span className="font-bold text-rose-400">3</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Widget 3: Today's Schedule (6 cols) */}
                                <div 
                                    onClick={() => setSelectedWidgetId('schedule')}
                                    className={cn(
                                        "col-span-6 rounded-xl bg-white/5 border p-2.5 flex flex-col justify-between cursor-pointer transition-all",
                                        selectedWidgetId === 'schedule' ? "ring-2 ring-blue-400 border-blue-400" : "border-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-1.5 border-b border-white/10">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>Today's Schedule</span>
                                        </div>
                                        <span className="text-[8px] text-blue-400 font-semibold">View All ➔</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-1 text-[9px]">
                                        <div className="flex items-center justify-between bg-white/5 p-1 rounded">
                                            <div>
                                                <span className="font-bold text-white block">09:00 AM - Department Heads Sync</span>
                                                <span className="text-slate-400 text-[8px]">Dean's Office</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[8px]">Meeting</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white/5 p-1 rounded">
                                            <div>
                                                <span className="font-bold text-white block">01:00 PM - Curriculum Review</span>
                                                <span className="text-slate-400 text-[8px]">Conference Room A</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[8px]">Meeting</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Widget 4: Top Performing Faculty (6 cols) - Active Selected */}
                                <div 
                                    onClick={() => setSelectedWidgetId('top_faculty')}
                                    className={cn(
                                        "col-span-6 rounded-xl bg-white/5 border p-2.5 flex flex-col justify-between cursor-pointer transition-all relative",
                                        selectedWidgetId === 'top_faculty' ? "ring-2 ring-blue-400 border-blue-400 shadow-lg" : "border-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-1.5 border-b border-white/10">
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-amber-400" />
                                            <span>Top Performing Faculty</span>
                                        </div>
                                        <span className="text-[8px] text-slate-400">This Semester ⌄</span>
                                    </div>

                                    {/* Faculty Leaderboard Rows */}
                                    <div className="flex flex-col gap-1 mt-1 text-[9px]">
                                        {sampleFacultyLeaderboard.map((faculty) => (
                                            <div key={faculty.rank} className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white", faculty.color)}>
                                                        {faculty.rank}
                                                    </span>
                                                    <span className="font-bold text-white">{faculty.name}</span>
                                                    <span className="text-[8px] text-slate-400">· {faculty.program}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: faculty.percentage }} />
                                                    </div>
                                                    <span className="font-bold text-emerald-400 text-[8px]">{faculty.percentage}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Bottom Slide Behavior & Display Settings Bar */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex flex-col gap-4">
                            {/* Tabs */}
                            <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setBottomTab('display')}
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs font-bold transition-colors pb-1",
                                        bottomTab === 'display' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
                                    )}
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Display Settings</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBottomTab('appearance')}
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs font-bold transition-colors pb-1",
                                        bottomTab === 'appearance' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
                                    )}
                                >
                                    <Paintbrush className="w-3.5 h-3.5" />
                                    <span>Appearance</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBottomTab('advanced')}
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs font-bold transition-colors pb-1",
                                        bottomTab === 'advanced' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
                                    )}
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Advanced Settings</span>
                                </button>
                            </div>

                            {/* Display Settings Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                {/* Column 1: Slide Behavior */}
                                <div className="space-y-3">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Slide Behavior</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-400">Duration (seconds)</label>
                                            <input 
                                                type="number" 
                                                value={durationSeconds} 
                                                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                                                className="w-full px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Transition</label>
                                            <select 
                                                value={transitionEffect} 
                                                onChange={(e) => setTransitionEffect(e.target.value)}
                                                className="w-full px-1 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                                            >
                                                <option>Fade</option>
                                                <option>Slide</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Background</label>
                                            <select 
                                                value={backgroundBehavior} 
                                                onChange={(e) => setBackgroundBehavior(e.target.value)}
                                                className="w-full px-1 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                                            >
                                                <option>Fit to Screen</option>
                                                <option>Fill Screen</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Display Elements */}
                                <div className="space-y-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Display Elements</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500">Show Header (Logo & Title)</span>
                                        <ToggleSwitch checked={showHeader} onChange={setShowHeader} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500">Show Date & Time</span>
                                        <ToggleSwitch checked={showDateTime} onChange={setShowDateTime} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500">Show Footer Ticker</span>
                                        <ToggleSwitch checked={showFooterTicker} onChange={setShowFooterTicker} />
                                    </div>
                                </div>

                                {/* Column 3: Content Options */}
                                <div className="space-y-3">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Content Options</span>
                                    <div>
                                        <label className="text-[10px] text-slate-400">Content Density</label>
                                        <select 
                                            value={contentDensity} 
                                            onChange={(e) => setContentDensity(e.target.value)}
                                            className="w-full px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                                        >
                                            <option>Comfortable</option>
                                            <option>Compact</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-400">Max Records</label>
                                            <input 
                                                type="number" 
                                                value={maxRecordsBottom} 
                                                onChange={(e) => setMaxRecordsBottom(Number(e.target.value))}
                                                className="w-full px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Overflow</label>
                                            <select 
                                                value={overflowBehavior} 
                                                onChange={(e) => setOverflowBehavior(e.target.value)}
                                                className="w-full px-1 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                                            >
                                                <option>Paginate</option>
                                                <option>Scroll</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Widget Properties & Configuration Panel (3 columns on lg) */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex flex-col gap-4">
                        
                        {/* Properties Tabs */}
                        <div className="grid grid-cols-3 gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <button
                                type="button"
                                onClick={() => setPropertiesTab('content')}
                                className={cn(
                                    "pb-1 text-xs font-bold transition-all text-center",
                                    propertiesTab === 'content' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                Content
                            </button>
                            <button
                                type="button"
                                onClick={() => setPropertiesTab('appearance')}
                                className={cn(
                                    "pb-1 text-xs font-bold transition-all text-center",
                                    propertiesTab === 'appearance' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                Appearance
                            </button>
                            <button
                                type="button"
                                onClick={() => setPropertiesTab('advanced')}
                                className={cn(
                                    "pb-1 text-xs font-bold transition-all text-center",
                                    propertiesTab === 'advanced' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                Advanced
                            </button>
                        </div>

                        {/* Selected Widget Header */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Selected Widget
                            </span>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mt-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            {widgetTitle}
                                        </h4>
                                        <p className="text-[10px] text-slate-400">Faculty Leaderboard</p>
                                    </div>
                                </div>
                                <button type="button" className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Widget Content Form */}
                        <div className="flex flex-col gap-3.5 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                Widget Content
                            </span>

                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Title</label>
                                <input
                                    type="text"
                                    value={widgetTitle}
                                    onChange={(e) => setWidgetTitle(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            {/* Data Source */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Data Source</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                                            <span>{dataSource}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => setDataSource('Faculty Performance')}>Faculty Performance</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDataSource('Compliance Tracker')}>Compliance Tracker</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDataSource('Schedule & Monitoring')}>Schedule & Monitoring</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Academic Period */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Academic Period</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 truncate">
                                            <span className="truncate">{academicPeriod}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64">
                                        <DropdownMenuItem onClick={() => setAcademicPeriod('Current Semester (AY 2026-2027, 1st Sem)')}>Current Semester (AY 2026-2027, 1st Sem)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setAcademicPeriod('Previous Semester (AY 2025-2026, 2nd Sem)')}>Previous Semester (AY 2025-2026, 2nd Sem)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Program */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Program</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                                            <span>{programFilter}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem onClick={() => setProgramFilter('All Programs')}>All Programs</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setProgramFilter('BSIT')}>BSIT</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setProgramFilter('BSCS')}>BSCS</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setProgramFilter('BSIS')}>BSIS</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setProgramFilter('BLIS')}>BLIS</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Ranking Metric */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Ranking Metric</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                                            <span>{rankingMetric}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => setRankingMetric('On-Time Submission Rate')}>On-Time Submission Rate</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRankingMetric('Verified Compliance Percentage')}>Verified Compliance Percentage</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRankingMetric('Total Completed Outputs')}>Total Completed Outputs</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Maximum Entries */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-slate-500">Maximum Entries</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="15"
                                    value={maxEntries}
                                    onChange={(e) => setMaxEntries(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            {/* Display Style Selector */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] font-semibold text-slate-500">Display Style</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setDisplayStyle('list')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all",
                                            displayStyle === 'list' ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                                        )}
                                    >
                                        <ListFilter className="w-3.5 h-3.5 mb-1" />
                                        <span className="text-[10px]">List</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDisplayStyle('bars')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all",
                                            displayStyle === 'bars' ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                                        )}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5 mb-1" />
                                        <span className="text-[10px]">Bars</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDisplayStyle('compact')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all",
                                            displayStyle === 'compact' ? "bg-blue-50 border-blue-500 text-blue-600 font-bold" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                                        )}
                                    >
                                        <Layout className="w-3.5 h-3.5 mb-1" />
                                        <span className="text-[10px]">Compact</span>
                                    </button>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Show Rank Number</span>
                                    <ToggleSwitch checked={showRankNumber} onChange={setShowRankNumber} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Show Program</span>
                                    <ToggleSwitch checked={showProgram} onChange={setShowProgram} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Show Percentage</span>
                                    <ToggleSwitch checked={showPercentage} onChange={setShowPercentage} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
