import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Tv, 
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
    Award, 
    GraduationCap,
    Grid,
    CheckSquare,
    ListTodo,
    ArrowRightLeft,
    CheckCircle2,
    CalendarRange,
    Activity,
    ShieldAlert,
    Laptop,
    DoorOpen,
    ListFilter,
    UserCheck,
    Maximize2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TvStudioLayout } from '@/components/tv-studio-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Slide Composer', href: '/tv-config/slides/builder' },
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

export type LayoutPresetKey = 
    | 'balanced_2x2' 
    | 'hero_sidebar' 
    | 'three_column' 
    | 'full_width_list' 
    | 'dashboard_footer' 
    | 'media_focus';

interface SlotDefinition {
    id: string;
    label: string;
    occupantWidgetId: string;
}

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
                "w-11 h-6 flex items-center rounded-full p-0.75 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer",
                checked ? "bg-amber-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
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

export default function SlideComposer({ slide: initialSlide, slides = [] }: Props) {
    // Current active editing slide
    const [activeSlideId, setActiveSlideId] = useState<number>(() => {
        return initialSlide?.id || (slides.length > 0 ? slides[0].id : 1);
    });

    const activeSlide = slides.find(s => s.id === activeSlideId) || initialSlide || (slides.length > 0 ? slides[0] : null);

    // Slide Metadata
    const [slideTitle, setSlideTitle] = useState(activeSlide?.title || 'Slide 1 - Daily Overview');
    const [slideType, setSlideType] = useState(activeSlide?.type || 'Daily Overview');
    const [durationSeconds, setDurationSeconds] = useState(activeSlide?.duration_seconds || 15);
    const [selectedLayout, setSelectedLayout] = useState<LayoutPresetKey>(
        (activeSlide?.config?.layout as LayoutPresetKey) || 'balanced_2x2'
    );

    // Left Library tabs
    const [libraryTab, setLibraryTab] = useState<'widgets' | 'layouts'>('widgets');
    const [widgetSearch, setWidgetSearch] = useState('');

    // Slot assignments state: slotId -> widgetId
    const [slotOccupants, setSlotOccupants] = useState<Record<string, string>>(() => {
        return activeSlide?.config?.slots || {
            slot_1: 'comp_overview',
            slot_2: 'comp_pending',
            slot_3: 'comp_overdue',
            slot_4: 'general_qr',
            hero: 'faculty_top',
            sidebar_top: 'sched_meetings',
            sidebar_bottom: 'general_qr',
            col_1: 'sched_today',
            col_2: 'faculty_top',
            col_3: 'comp_overview',
            full_main: 'comp_pending',
            main_left: 'comp_overdue',
            main_right: 'comp_pending',
            footer: 'comp_overview',
            media_slot: 'general_image',
            content_slot: 'general_text',
        };
    });

    // Handle switching slide
    const handleSwitchSlide = (targetId: number) => {
        const target = slides.find(s => s.id === targetId);
        if (!target) return;
        setActiveSlideId(targetId);
        setSlideTitle(target.title || '');
        setSlideType(target.type || '');
        setDurationSeconds(target.duration_seconds || 15);
        if (target.config?.layout) {
            setSelectedLayout(target.config.layout as LayoutPresetKey);
        }
        if (target.config?.slots) {
            setSlotOccupants(target.config.slots);
        }
    };

    // Currently Selected Slot on Canvas
    const [selectedSlotId, setSelectedSlotId] = useState<string>('slot_1');

    // Right Properties Tabs
    const [propertiesTab, setPropertiesTab] = useState<'data' | 'presentation'>('data');

    // Widget specific controlled query configuration
    const [academicPeriod, setAcademicPeriod] = useState('Current Semester (AY 2026-2027, 1st Sem)');
    const [programFilter, setProgramFilter] = useState('All Programs');
    const [rankingMetric, setRankingMetric] = useState('On-Time Submission Rate');
    const [maxEntries, setMaxEntries] = useState(5);
    const [showPercentage, setShowPercentage] = useState(true);
    const [showProgram, setShowProgram] = useState(true);

    // QR Code Widget Configuration
    const [qrDestination, setQrDestination] = useState('Faculty Schedule');
    const [customQrUrl, setCustomQrUrl] = useState('https://cids.university.edu.ph/schedule');
    const [qrLabel, setQrLabel] = useState('Scan for Full Faculty Schedule');
    const [qrSize, setQrSize] = useState('Large (180px - High Visibility)');
    const [qrContrast, setQrContrast] = useState('High Contrast White on Dark');

    // Bottom Canvas Configuration
    const [transitionEffect, setTransitionEffect] = useState('Fade');
    const [backgroundBehavior, setBackgroundBehavior] = useState('Fit to Screen');
    const [showHeader, setShowHeader] = useState(true);
    const [showDateTime, setShowDateTime] = useState(true);
    const [showFooterTicker, setShowFooterTicker] = useState(true);

    const [isSavedNotice, setIsSavedNotice] = useState(false);
    const [savedMessage, setSavedMessage] = useState('Configuration saved!');

    // Layout Presets Definition
    const layoutOptions: { id: LayoutPresetKey; name: string; description: string; slots: string[] }[] = [
        { id: 'balanced_2x2', name: 'Balanced 2×2', description: 'Equal four-quadrant layout for metrics and overviews', slots: ['slot_1', 'slot_2', 'slot_3', 'slot_4'] },
        { id: 'hero_sidebar', name: 'Hero + Sidebar', description: 'Wide primary focus zone with complementary right widgets', slots: ['hero', 'sidebar_top', 'sidebar_bottom'] },
        { id: 'three_column', name: 'Three Column', description: 'Triple vertical lanes for department or weekly comparisons', slots: ['col_1', 'col_2', 'col_3'] },
        { id: 'full_width_list', name: 'Full Width List', description: 'Expansive horizontal rows for timetable queues and boards', slots: ['full_main'] },
        { id: 'dashboard_footer', name: 'Dashboard + Footer', description: 'Split upper dashboards with full-span lower ticker strip', slots: ['main_left', 'main_right', 'footer'] },
        { id: 'media_focus', name: 'Media Focus', description: 'Generous portrait or achievement photo container + text', slots: ['media_slot', 'content_slot'] },
    ];

    // Widget Library Catalogue
    const widgetCatalog = [
        {
            category: 'General & Interactive',
            items: [
                { id: 'general_qr', name: 'QR Code Action Target', icon: QrCode, badge: 'Digital Access' },
                { id: 'general_text', name: 'Text / Heading Card', icon: Type, badge: 'Presentation' },
                { id: 'general_image', name: 'Image / Portrait Frame', icon: ImageIcon, badge: 'Media' },
                { id: 'general_logo', name: 'CIDS College Crest', icon: Award, badge: 'Branding' },
                { id: 'general_divider', name: 'Visual Divider', icon: Minus, badge: 'Layout' },
                { id: 'general_clock', name: 'Clock & Academic Term', icon: Clock, badge: 'Time' },
            ]
        },
        {
            category: 'Announcements',
            items: [
                { id: 'ann_latest', name: 'Latest Announcements', icon: Megaphone, badge: 'Feed' },
                { id: 'ann_featured', name: 'Featured Highlight', icon: Star, badge: 'Spotlight' },
            ]
        },
        {
            category: 'Compliance Monitoring',
            items: [
                { id: 'comp_overview', name: 'Compliance Overview', icon: ShieldCheck, badge: 'Gauge' },
                { id: 'comp_pending', name: 'Pending Outputs Queue', icon: ListFilter, badge: 'Queue' },
                { id: 'comp_overdue', name: 'Overdue Outputs Alert', icon: AlertTriangle, badge: 'Alert' },
                { id: 'comp_review_queue', name: 'Dean Review Queue', icon: ClipboardList, badge: 'Workflow' },
            ]
        },
        {
            category: 'Schedule & Timetables',
            items: [
                { id: 'sched_today', name: "Today's Schedule", icon: Calendar, badge: 'Live' },
                { id: 'sched_weekly', name: 'Weekly Overview', icon: CalendarRange, badge: 'Timetable' },
                { id: 'sched_meetings', name: 'Upcoming Meetings', icon: Users, badge: 'Calendar' },
            ]
        },
        {
            category: 'Faculty & Performance',
            items: [
                { id: 'faculty_top', name: 'Top Performing Faculty', icon: Trophy, badge: 'Podium' },
                { id: 'faculty_sched', name: 'Faculty Schedule', icon: UserCheck, badge: 'Hours' },
                { id: 'faculty_attendance', name: 'Attendance Summary', icon: Activity, badge: 'Biometric' },
            ]
        },
        {
            category: 'Program Performance',
            items: [
                { id: 'perf_top_program', name: 'Top Program Leaderboard', icon: Building2, badge: 'Ranking' },
                { id: 'perf_recognition', name: 'Recognition Metrics', icon: BarChart3, badge: 'Honors' },
            ]
        },
        {
            category: 'Facility & Monitoring',
            items: [
                { id: 'fac_classroom_status', name: 'Classroom Status Grid', icon: Building2, badge: 'Rooms' },
                { id: 'fac_lab_monitoring', name: 'Computer Lab Utilization', icon: Laptop, badge: 'Labs' },
            ]
        }
    ];

    const currentOccupantWidgetId = slotOccupants[selectedSlotId] || 'faculty_top';

    // Assign widget to current slot
    const handleAssignWidgetToSlot = (widgetId: string) => {
        setSlotOccupants(prev => ({
            ...prev,
            [selectedSlotId]: widgetId,
        }));
    };

    const handleSaveDraft = () => {
        setSavedMessage('Draft configuration saved locally in builder.');
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 3000);
    };

    const handlePublish = () => {
        const targetSlide = activeSlide;
        if (targetSlide) {
            router.put(`/tv-config/slides/${targetSlide.id}`, {
                title: slideTitle,
                type: slideType,
                duration_seconds: durationSeconds,
                is_active: true,
                config: {
                    layout: selectedLayout,
                    slots: slotOccupants,
                    academicPeriod,
                    programFilter,
                    rankingMetric,
                    maxEntries,
                    showPercentage,
                    showProgram,
                    qrDestination,
                    customQrUrl,
                    qrLabel,
                    qrSize,
                    qrContrast,
                    transitionEffect,
                    backgroundBehavior,
                    showHeader,
                    showDateTime,
                    showFooterTicker,
                }
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setSavedMessage(`"${slideTitle}" published successfully to TV display!`);
                    setIsSavedNotice(true);
                    setTimeout(() => setIsSavedNotice(false), 4000);
                }
            });
        } else {
            setSavedMessage('Slide configuration updated!');
            setIsSavedNotice(true);
            setTimeout(() => setIsSavedNotice(false), 3000);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Slide Composer (Slot-Based Visual Builder) - TV Studio" />

            <TvStudioLayout>
                <div className="flex flex-col gap-5 p-4 sm:p-5 lg:p-6 max-w-full mx-auto w-full transition-colors">
                    
                    {/* Header Controls Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                                <Paintbrush className="w-4 h-4" />
                                <span>Advanced Slot-Based Composer</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Slide Composer
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                Structured dashboard composer: choose an approved layout, assign data widgets to slots, and configure properties without arbitrary canvas distortion.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5 text-slate-500" />
                                <span>Save Draft</span>
                            </button>

                            <Link
                                href="/tv-config/preview"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Preview 16:9</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handlePublish}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Publish to Playlist</span>
                            </button>
                        </div>
                    </div>

                    {isSavedNotice && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{savedMessage}</span>
                        </div>
                    )}

                    {/* Slide Top Metadata Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        {slides.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Slide to Compose</label>
                                <select
                                    value={activeSlideId}
                                    onChange={(e) => handleSwitchSlide(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 font-bold"
                                >
                                    {slides.map((s) => (
                                        <option key={s.id} value={s.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                                            #{s.order} - {s.title} ({s.is_active ? 'Active' : 'Hidden'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Slide Title</label>
                            <input
                                type="text"
                                value={slideTitle}
                                onChange={(e) => setSlideTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Active Layout</label>
                            <select
                                value={selectedLayout}
                                onChange={(e) => setSelectedLayout(e.target.value as LayoutPresetKey)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            >
                                {layoutOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Slide Type</label>
                            <input
                                type="text"
                                value={slideType}
                                onChange={(e) => setSlideType(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Duration (sec)</label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                value={durationSeconds}
                                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Three-Panel Composer Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        
                        {/* LEFT PANEL: Layout Presets & Widget Catalog (3 cols) */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setLibraryTab('widgets')}
                                    className={cn(
                                        "py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                        libraryTab === 'widgets' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    Widget Library
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLibraryTab('layouts')}
                                    className={cn(
                                        "py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                        libraryTab === 'layouts' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    Layout Presets
                                </button>
                            </div>

                            {libraryTab === 'layouts' ? (
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Choose Screen Grid
                                    </span>
                                    {layoutOptions.map((layout) => (
                                        <div
                                            key={layout.id}
                                            onClick={() => setSelectedLayout(layout.id)}
                                            className={cn(
                                                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                                selectedLayout === layout.id
                                                    ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20"
                                                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white">{layout.name}</h4>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">{layout.slots.length} slots</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{layout.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                                        Active Slot: <strong className="text-amber-700 dark:text-amber-400 uppercase font-black">{selectedSlotId}</strong>. Click any widget below to occupy this slot.
                                    </div>

                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search widgets..."
                                            value={widgetSearch}
                                            onChange={(e) => setWidgetSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                                        />
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                        {widgetCatalog.map((category) => (
                                            <div key={category.category} className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    {category.category}
                                                </span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {category.items
                                                        .filter(item => item.name.toLowerCase().includes(widgetSearch.toLowerCase()))
                                                        .map((item) => {
                                                            const Icon = item.icon;
                                                            const isAssigned = slotOccupants[selectedSlotId] === item.id;

                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => handleAssignWidgetToSlot(item.id)}
                                                                    className={cn(
                                                                        "p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer h-20",
                                                                        isAssigned
                                                                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                                                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-amber-400"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <Icon className={cn("w-4 h-4", isAssigned ? "text-slate-950" : "text-amber-500")} />
                                                                        <span className={cn(
                                                                            "text-[8px] px-1 rounded uppercase font-bold",
                                                                            isAssigned ? "bg-slate-950/20 text-slate-950" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                                                        )}>
                                                                            {item.badge}
                                                                        </span>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold leading-tight line-clamp-2",
                                                                        isAssigned ? "text-slate-950 font-black" : "text-slate-800 dark:text-slate-200"
                                                                    )}>
                                                                        {item.name}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CENTER PANEL: Slot-Based 16:9 Live Canvas (6 cols) */}
                        <div className="lg:col-span-6 flex flex-col gap-4">
                            
                            {/* Canvas Status & Safe Margins */}
                            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">16:9 TV Slot Canvas (1920 × 1080)</span>
                                </div>
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                    Click any slot to reassign widget
                                </span>
                            </div>

                            {/* Live 16:9 Interactive Screen */}
                            <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border-4 border-slate-800 shadow-2xl p-4 flex flex-col justify-between text-white overflow-hidden select-none">
                                
                                {/* Screen Header */}
                                {showHeader && (
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0 text-xs">
                                        <div className="flex items-center gap-2">
                                            <img src="/CIDS_Logo.jpg" alt="CIDS" className="w-6 h-6 object-contain rounded" />
                                            <div>
                                                <div className="text-[11px] font-black text-amber-400 leading-tight">CIDS OfficeHub TV</div>
                                                <div className="text-[8px] text-slate-400">College of Information and Digital Sciences</div>
                                            </div>
                                        </div>
                                        {showDateTime && (
                                            <div className="text-right text-[9px] text-slate-400 font-mono">
                                                AY 2026-2027 · 11:32 AM
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Slot Grid based on selected layout */}
                                <div className="flex-1 my-2 grid grid-cols-12 gap-3 items-stretch">
                                    
                                    {/* 1. Balanced 2x2 Layout */}
                                    {selectedLayout === 'balanced_2x2' && (
                                        <>
                                            {['slot_1', 'slot_2', 'slot_3', 'slot_4'].map((slotId, index) => {
                                                const widgetKey = slotOccupants[slotId] || 'comp_overview';
                                                const isSelected = selectedSlotId === slotId;

                                                return (
                                                    <div
                                                        key={slotId}
                                                        onClick={() => setSelectedSlotId(slotId)}
                                                        className={cn(
                                                            "col-span-6 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between relative",
                                                            isSelected
                                                                ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30"
                                                                : "bg-white/5 border-white/15 hover:border-white/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black uppercase text-amber-400">
                                                                Slot {index + 1}: {slotId.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                                                                {widgetKey}
                                                            </span>
                                                        </div>

                                                        {/* Preview of Widget content */}
                                                        {widgetKey === 'general_qr' ? (
                                                            <div className="flex items-center justify-between gap-2 my-auto">
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[11px] font-bold text-white">{qrLabel}</div>
                                                                    <div className="text-[8px] text-slate-400">{qrDestination}</div>
                                                                </div>
                                                                <div className="w-10 h-10 rounded bg-white p-1 text-slate-950 flex items-center justify-center shrink-0">
                                                                    <QrCode className="w-8 h-8" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5 my-auto">
                                                                <div className="text-[11px] font-bold text-white capitalize">{widgetKey.replace('_', ' ')}</div>
                                                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                                    <div className="w-3/4 h-full bg-emerald-400" />
                                                                </div>
                                                                <div className="text-[8px] text-slate-400">82.5% On-Time Completion Rate</div>
                                                            </div>
                                                        )}

                                                        <span className="text-[7px] text-slate-500">Click to reconfigure</span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* 2. Hero + Sidebar Layout */}
                                    {selectedLayout === 'hero_sidebar' && (
                                        <>
                                            <div
                                                onClick={() => setSelectedSlotId('hero')}
                                                className={cn(
                                                    "col-span-8 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                    selectedSlotId === 'hero' ? "bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/30" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-sky-400">Hero Display Slot (70%)</span>
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10">{slotOccupants['hero']}</span>
                                                </div>
                                                <div className="space-y-1.5 my-auto">
                                                    <div className="text-sm font-bold text-white">Top Performing Faculty Leaderboard</div>
                                                    <div className="w-4/5 h-2 bg-emerald-400/60 rounded" />
                                                    <div className="w-3/5 h-2 bg-emerald-400/40 rounded" />
                                                </div>
                                                <span className="text-[8px] text-slate-400">Primary Timetable / Leaderboard Podium</span>
                                            </div>

                                            <div className="col-span-4 flex flex-col gap-2">
                                                <div
                                                    onClick={() => setSelectedSlotId('sidebar_top')}
                                                    className={cn(
                                                        "flex-1 rounded-xl p-2.5 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                        selectedSlotId === 'sidebar_top' ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                                    )}
                                                >
                                                    <span className="text-[9px] font-black uppercase text-amber-400">Sidebar Top</span>
                                                    <div className="text-[10px] font-bold text-white">Upcoming Meetings</div>
                                                    <span className="text-[7px] text-slate-400">{slotOccupants['sidebar_top']}</span>
                                                </div>

                                                <div
                                                    onClick={() => setSelectedSlotId('sidebar_bottom')}
                                                    className={cn(
                                                        "h-20 rounded-xl p-2.5 border-2 transition-all cursor-pointer flex items-center justify-between gap-2",
                                                        selectedSlotId === 'sidebar_bottom' ? "bg-purple-500/15 border-purple-400" : "bg-white/5 border-white/15"
                                                    )}
                                                >
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-purple-400 block">Sidebar Bottom</span>
                                                        <span className="text-[9px] text-slate-300">Scan for Agenda</span>
                                                    </div>
                                                    <div className="w-9 h-9 rounded bg-white p-0.5 text-slate-950 flex items-center justify-center shrink-0">
                                                        <QrCode className="w-7 h-7" />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* 3. Three Column Layout */}
                                    {selectedLayout === 'three_column' && (
                                        <>
                                            {['col_1', 'col_2', 'col_3'].map((colId, i) => (
                                                <div
                                                    key={colId}
                                                    onClick={() => setSelectedSlotId(colId)}
                                                    className={cn(
                                                        "col-span-4 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                        selectedSlotId === colId ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                                    )}
                                                >
                                                    <span className="text-[9px] font-black uppercase text-amber-400">Column {i + 1} Slot</span>
                                                    <div className="my-auto space-y-1">
                                                        <div className="text-xs font-bold text-white capitalize">{slotOccupants[colId] || 'Schedule'}</div>
                                                        <div className="w-full h-1.5 bg-white/20 rounded" />
                                                    </div>
                                                    <span className="text-[8px] text-slate-400">Lane {i + 1}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* 4. Full Width List */}
                                    {selectedLayout === 'full_width_list' && (
                                        <div
                                            onClick={() => setSelectedSlotId('full_main')}
                                            className={cn(
                                                "col-span-12 rounded-xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                selectedSlotId === 'full_main' ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                            )}
                                        >
                                            <span className="text-[10px] font-black uppercase text-amber-400">Full Width Timetable / Queue Slot</span>
                                            <div className="space-y-2 my-auto">
                                                <div className="h-6 rounded bg-white/10 flex items-center px-3 text-[10px] font-bold text-white">09:00 AM - CIDS Executive Council Sync (Dean Office)</div>
                                                <div className="h-6 rounded bg-white/10 flex items-center px-3 text-[10px] font-bold text-white">10:30 AM - BSIT Curriculum TOS/TQ Review (Lab 1)</div>
                                                <div className="h-6 rounded bg-white/10 flex items-center px-3 text-[10px] font-bold text-white">01:00 PM - Research Paper Colloquium 2026</div>
                                            </div>
                                            <span className="text-[8px] text-slate-400">Single expansive view</span>
                                        </div>
                                    )}

                                    {/* 5. Dashboard + Footer */}
                                    {selectedLayout === 'dashboard_footer' && (
                                        <>
                                            <div
                                                onClick={() => setSelectedSlotId('main_left')}
                                                className={cn(
                                                    "col-span-6 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                    selectedSlotId === 'main_left' ? "bg-rose-500/15 border-rose-400" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <span className="text-[9px] font-black uppercase text-rose-400">Left Main Slot</span>
                                                <div className="text-xs font-bold text-white">Overdue Outputs Warning</div>
                                                <span className="text-[7px] text-slate-400">{slotOccupants['main_left']}</span>
                                            </div>
                                            <div
                                                onClick={() => setSelectedSlotId('main_right')}
                                                className={cn(
                                                    "col-span-6 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between",
                                                    selectedSlotId === 'main_right' ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <span className="text-[9px] font-black uppercase text-amber-400">Right Main Slot</span>
                                                <div className="text-xs font-bold text-white">Pending Submissions</div>
                                                <span className="text-[7px] text-slate-400">{slotOccupants['main_right']}</span>
                                            </div>
                                            <div
                                                onClick={() => setSelectedSlotId('footer')}
                                                className={cn(
                                                    "col-span-12 h-12 rounded-xl p-2 border-2 transition-all cursor-pointer flex items-center justify-between",
                                                    selectedSlotId === 'footer' ? "bg-emerald-500/15 border-emerald-400" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <span className="text-[9px] font-black uppercase text-emerald-400">Full Width Footer Strip</span>
                                                <span className="text-[10px] font-mono text-white">Overall Compliance: 82.5% Complied</span>
                                            </div>
                                        </>
                                    )}

                                    {/* 6. Media Focus */}
                                    {selectedLayout === 'media_focus' && (
                                        <>
                                            <div
                                                onClick={() => setSelectedSlotId('media_slot')}
                                                className={cn(
                                                    "col-span-5 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
                                                    selectedSlotId === 'media_slot' ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <ImageIcon className="w-8 h-8 text-amber-400 mb-1" />
                                                <span className="text-[10px] font-black uppercase text-amber-400">Media Focus Container</span>
                                                <span className="text-[8px] text-slate-400">Portrait Photo / Award Document</span>
                                            </div>
                                            <div
                                                onClick={() => setSelectedSlotId('content_slot')}
                                                className={cn(
                                                    "col-span-7 rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-center space-y-1.5",
                                                    selectedSlotId === 'content_slot' ? "bg-amber-500/15 border-amber-400" : "bg-white/5 border-white/15"
                                                )}
                                            >
                                                <span className="text-[9px] font-black uppercase text-amber-400">Content & Citations Slot</span>
                                                <div className="text-sm font-black text-white">CONGRATULATIONS DR. THORNE!</div>
                                                <div className="text-[9px] text-slate-300">Best Paper Award at 2026 ICT Research Conference</div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Screen Footer */}
                                {showFooterTicker && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-slate-400 shrink-0">
                                        <span>Display Safe Area: Enforced (16:9 1080p)</span>
                                        <span className="font-mono text-amber-400">Slot-Based Slide Composer Engine</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANEL: Widget Configuration & QR Code Settings (3 cols) */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 flex flex-col gap-4">
                            
                            <div className="grid grid-cols-2 gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setPropertiesTab('data')}
                                    className={cn(
                                        "pb-1 text-xs font-bold transition-all text-center cursor-pointer",
                                        propertiesTab === 'data' ? "text-amber-500 border-b-2 border-amber-500" : "text-slate-400"
                                    )}
                                >
                                    Controlled Data
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPropertiesTab('presentation')}
                                    className={cn(
                                        "pb-1 text-xs font-bold transition-all text-center cursor-pointer",
                                        propertiesTab === 'presentation' ? "text-amber-500 border-b-2 border-amber-500" : "text-slate-400"
                                    )}
                                >
                                    Presentation
                                </button>
                            </div>

                            {/* Active Slot Summary */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500">Configuring Slot:</span>
                                    <span className="font-black text-amber-600 dark:text-amber-400 uppercase">{selectedSlotId}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500">Occupant Widget:</span>
                                    <span className="font-bold text-slate-900 dark:text-white capitalize">{currentOccupantWidgetId.replace('_', ' ')}</span>
                                </div>
                            </div>

                            {/* Specific Settings for QR Code Widget */}
                            {currentOccupantWidgetId === 'general_qr' ? (
                                <div className="space-y-3.5 text-xs">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                        <QrCode className="w-4 h-4" />
                                        <span>QR Digital Access Controls</span>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            System Target Action
                                        </label>
                                        <select
                                            value={qrDestination}
                                            onChange={(e) => setQrDestination(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        >
                                            <option>Faculty Schedule Portal</option>
                                            <option>Program Curriculum Schedule</option>
                                            <option>Event Registration Form</option>
                                            <option>Full Announcement Details</option>
                                            <option>Survey / Evaluation Form</option>
                                            <option>Compliance Submission Portal</option>
                                            <option>Downloadable Document / Syllabi</option>
                                            <option>Custom Web Destination</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            Stable Target URL
                                        </label>
                                        <input
                                            type="text"
                                            value={customQrUrl}
                                            onChange={(e) => setCustomQrUrl(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                                        />
                                        <p className="text-[10px] text-slate-400">Routes through stable OfficeHub shortlinks.</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            On-Screen Callout Label
                                        </label>
                                        <input
                                            type="text"
                                            value={qrLabel}
                                            onChange={(e) => setQrLabel(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-500">QR Size</label>
                                            <select
                                                value={qrSize}
                                                onChange={(e) => setQrSize(e.target.value)}
                                                className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                            >
                                                <option>Medium (140px)</option>
                                                <option>Large (180px - High Visibility)</option>
                                                <option>Extra Large (240px)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-500">Visual Contrast</label>
                                            <select
                                                value={qrContrast}
                                                onChange={(e) => setQrContrast(e.target.value)}
                                                className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                            >
                                                <option>High Contrast White on Dark</option>
                                                <option>Black on White Frame</option>
                                                <option>Amber Accent Glow</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Generic / Database Widget Schema Controls */
                                <div className="space-y-3.5 text-xs">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            Academic Period
                                        </label>
                                        <select
                                            value={academicPeriod}
                                            onChange={(e) => setAcademicPeriod(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        >
                                            <option>Current Semester (AY 2026-2027, 1st Sem)</option>
                                            <option>Previous Semester (AY 2025-2026, 2nd Sem)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            Program Filter
                                        </label>
                                        <select
                                            value={programFilter}
                                            onChange={(e) => setProgramFilter(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        >
                                            <option>All Programs (College-Wide)</option>
                                            <option>BSIT (Information Technology)</option>
                                            <option>BSCS (Computer Science)</option>
                                            <option>BSIS (Information Systems)</option>
                                            <option>BLIS (Library & Info Science)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            Ranking Metric
                                        </label>
                                        <select
                                            value={rankingMetric}
                                            onChange={(e) => setRankingMetric(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        >
                                            <option>On-Time Submission Rate</option>
                                            <option>Overall Compliance Rate</option>
                                            <option>Teaching Performance Rating</option>
                                            <option>Research Publication Points</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            Maximum Entries
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={maxEntries}
                                            onChange={(e) => setMaxEntries(Number(e.target.value))}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-slate-600 dark:text-slate-300">Show Percentage Gauge</span>
                                            <ToggleSwitch checked={showPercentage} onChange={setShowPercentage} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-slate-600 dark:text-slate-300">Show Program Tags</span>
                                            <ToggleSwitch checked={showProgram} onChange={setShowProgram} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Slot Navigation Buttons */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Swap current slot occupant with next slot
                                        alert(`Slot ${selectedSlotId} is active. Choose another widget from the left catalog to replace it.`);
                                    }}
                                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Swap / Replace Widget</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
