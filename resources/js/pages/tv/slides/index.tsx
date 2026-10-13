import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    Tv, 
    Layers, 
    Play, 
    Clock, 
    Calendar as CalendarIcon, 
    Plus, 
    GripVertical, 
    Eye, 
    Settings, 
    MoreVertical, 
    FileText, 
    LayoutList, 
    Paintbrush, 
    Sliders, 
    Home, 
    BarChart3, 
    Megaphone, 
    CalendarCheck, 
    ArrowUpDown, 
    Edit, 
    Check, 
    RotateCcw, 
    Save, 
    ShieldCheck, 
    Trophy, 
    Building2, 
    Users, 
    GraduationCap,
    PhoneCall,
    Info,
    ChevronDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Display', href: '/tv-display' },
    { title: 'Slide Configuration', href: '/tv-config/slides' },
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

interface Stats {
    total_slides: number;
    active_slides: number;
    average_duration: string;
    last_updated: string;
    last_updated_by: string;
}

interface Props {
    slides: Slide[];
    stats?: Stats;
}

// Custom animated toggle switch component matching the pill design
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

// Mock section items for configurable slides
interface SectionItem {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    icon: React.ElementType;
    iconColor: string;
}

export default function SlideConfigIndex({ 
    slides: initialSlides,
    stats = {
        total_slides: 7,
        active_slides: 6,
        average_duration: '17s',
        last_updated: 'Oct 13, 2026',
        last_updated_by: 'System Admin',
    }
}: Props) {
    const [slidesList, setSlidesList] = useState<Slide[]>(initialSlides);
    const [selectedSlideId, setSelectedSlideId] = useState<number>(initialSlides[0]?.id || 1);
    const [activeTab, setActiveTab] = useState<'content' | 'display' | 'appearance' | 'advanced'>('content');

    // Currently selected slide
    const selectedSlide = slidesList.find(s => s.id === selectedSlideId) || slidesList[0];

    // Config form state for the selected slide
    const [sections, setSections] = useState<SectionItem[]>([
        { id: 'welcome', title: 'Welcome Message', description: 'Display welcome message and college information.', enabled: true, icon: Home, iconColor: 'text-blue-500' },
        { id: 'stats', title: 'Key Statistics', description: 'Show important metrics and counters.', enabled: true, icon: BarChart3, iconColor: 'text-blue-500' },
        { id: 'announcements', title: 'Announcements', description: 'Show latest announcements.', enabled: true, icon: Megaphone, iconColor: 'text-blue-500' },
        { id: 'events', title: 'Upcoming Events', description: 'Display upcoming events and activities.', enabled: true, icon: CalendarCheck, iconColor: 'text-blue-500' },
    ]);

    const [maxRecords, setMaxRecords] = useState<number>(selectedSlide?.config?.max_records || 5);
    const [sortOrder, setSortOrder] = useState<string>(selectedSlide?.config?.sort_order || 'Latest First');
    const [emptyBehavior, setEmptyBehavior] = useState<string>(selectedSlide?.config?.empty_behavior || 'Hide Section');
    const [targetAudience, setTargetAudience] = useState<string>(selectedSlide?.config?.target_audience || 'All Viewers');
    const [durationSeconds, setDurationSeconds] = useState<number>(selectedSlide?.duration_seconds || 15);
    const [showSlideTitle, setShowSlideTitle] = useState<boolean>(selectedSlide?.config?.show_title !== false);
    const [showMetricsCounters, setShowMetricsCounters] = useState<boolean>(selectedSlide?.config?.show_metrics !== false);
    const [autoHideEmpty, setAutoHideEmpty] = useState<boolean>(selectedSlide?.config?.auto_hide !== false);

    const [isSaving, setIsSaving] = useState(false);
    const [isSavedNotice, setIsSavedNotice] = useState(false);

    // Sync form when slide selection changes
    useEffect(() => {
        if (!selectedSlide) return;
        setDurationSeconds(selectedSlide.duration_seconds || 15);
        setMaxRecords(selectedSlide.config?.max_records || 5);
        setSortOrder(selectedSlide.config?.sort_order || 'Latest First');
        setEmptyBehavior(selectedSlide.config?.empty_behavior || 'Hide Section');
        setTargetAudience(selectedSlide.config?.target_audience || 'All Viewers');
        setShowSlideTitle(selectedSlide.config?.show_title !== false);
        setShowMetricsCounters(selectedSlide.config?.show_metrics !== false);
        setAutoHideEmpty(selectedSlide.config?.auto_hide !== false);
    }, [selectedSlideId]);

    const handleSaveConfiguration = () => {
        if (!selectedSlide) return;
        setIsSaving(true);

        const configPayload = {
            max_records: maxRecords,
            sort_order: sortOrder,
            empty_behavior: emptyBehavior,
            target_audience: targetAudience,
            show_title: showSlideTitle,
            show_metrics: showMetricsCounters,
            auto_hide: autoHideEmpty,
            sections: sections.map(s => ({ id: s.id, enabled: s.enabled })),
        };

        router.put(`/tv-config/slides/${selectedSlide.id}`, {
            duration_seconds: durationSeconds,
            config: configPayload,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                setIsSavedNotice(true);
                setTimeout(() => setIsSavedNotice(false), 3000);
            },
            onError: () => setIsSaving(false)
        });
    };

    const handleReset = () => {
        setMaxRecords(5);
        setSortOrder('Latest First');
        setEmptyBehavior('Hide Section');
        setTargetAudience('All Viewers');
        setDurationSeconds(15);
        setShowSlideTitle(true);
        setShowMetricsCounters(true);
        setAutoHideEmpty(true);
        setSections(prev => prev.map(s => ({ ...s, enabled: true })));
    };

    const toggleSection = (id: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    };

    // Helper for visual thumbnails matching the left slide list in mockup
    const getSlideThumbnail = (order: number, type: string) => {
        switch (order) {
            case 1:
                return (
                    <div className="w-13 h-9 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs overflow-hidden relative" style={{ backgroundImage: 'url(/CIDS_Logo.jpg)' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                            <span className="text-[8px] font-bold text-white tracking-tight">CIDS OfficeHub</span>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="w-13 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <CalendarCheck className="w-5 h-5 text-blue-400" />
                    </div>
                );
            case 3:
                return (
                    <div className="w-13 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                    </div>
                );
            case 4:
                return (
                    <div className="w-13 h-9 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                );
            case 5:
                return (
                    <div className="w-13 h-9 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                );
            case 6:
                return (
                    <div className="w-13 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <Megaphone className="w-5 h-5 text-blue-400" />
                    </div>
                );
            case 7:
                return (
                    <div className="w-13 h-9 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <GraduationCap className="w-5 h-5 text-purple-400" />
                    </div>
                );
            case 8:
                return (
                    <div className="w-13 h-9 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <CalendarIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                );
            default:
                return (
                    <div className="w-13 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Tv className="w-4 h-4 text-slate-500" />
                    </div>
                );
        }
    };

    // Subtitle descriptions for each slide
    const getSlideSubtitle = (order: number) => {
        switch (order) {
            case 1: return 'Daily overview, key statistics a...';
            case 2: return 'Upcoming meetings and schedule';
            case 3: return 'Submission status and compliance updates';
            case 4: return 'Achievements and recognition';
            case 5: return 'Upcoming events and activities';
            case 6: return 'Important announcements';
            case 7: return 'Faculty schedules and availability';
            case 8: return 'Consolidated academic calendar';
            default: return 'Custom slide configuration';
        }
    };

    // Clean slide display titles matching mockup
    const getSlideCleanTitle = (title: string, order: number) => {
        if (title.startsWith('Slide ')) {
            return title.replace(/^Slide \d+ - /, '');
        }
        return title;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Slide Configuration" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                
                {/* 1. Page Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <Tv className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Slide Configuration
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage and customize content, display settings, and record limits for each TV slide.
                        </p>
                    </div>
                </div>

                {/* 2. Bento Stat Cards (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Slides */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Slides</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.total_slides}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Configured for TV Display
                            </p>
                        </div>
                    </div>

                    {/* Active Slides */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <Play className="w-6 h-6 fill-emerald-600/20" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Slides</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.active_slides}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Currently showing
                            </p>
                        </div>
                    </div>

                    {/* Average Duration */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Duration</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.average_duration}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Per slide
                            </p>
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Updated</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.last_updated}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                By {stats.last_updated_by}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Main 2-Column Area: Left Slides List + Right Slide Configuration Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: TV Slides List (5 cols on lg) */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 flex flex-col gap-4">
                        
                        {/* Header & Add Slide button */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                    TV Slides
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Drag to reorder slides. Click on a slide to configure its content and settings.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.visit('/tv-config/slides/builder')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Slide</span>
                            </button>
                        </div>

                        {/* Slide Rows List */}
                        <div className="flex flex-col gap-2.5">
                            {slidesList.map((slide, index) => {
                                const orderNumber = index + 1;
                                const isSelected = slide.id === selectedSlideId;
                                const cleanTitle = getSlideCleanTitle(slide.title, orderNumber);
                                const subtitle = getSlideSubtitle(orderNumber);

                                return (
                                    <div
                                        key={slide.id}
                                        onClick={() => setSelectedSlideId(slide.id)}
                                        className={cn(
                                            "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                            isSelected
                                                ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/10 shadow-2xs"
                                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                        )}
                                    >
                                        {/* Drag Gripper, Order Number, Thumbnail, Title & Subtitle */}
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors shrink-0">
                                                <GripVertical className="w-3.5 h-3.5" />
                                            </div>

                                            <span className="font-bold text-xs text-slate-400 w-4 text-center shrink-0">
                                                {orderNumber}
                                            </span>

                                            {getSlideThumbnail(orderNumber, slide.type)}

                                            <div className="min-w-0 flex-1 pl-1">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {cleanTitle}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                    {subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Duration Badge */}
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span>{slide.duration_seconds}s</span>
                                            </span>

                                            {/* Active / Inactive Badge */}
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                slide.is_active
                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                                                    : "text-red-700 bg-red-50 border-red-200/60 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60"
                                            )}>
                                                <span className={cn("w-1 h-1 rounded-full", slide.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                                <span>{slide.is_active ? 'Active' : 'Inactive'}</span>
                                            </span>

                                            {/* Preview Button */}
                                            <a
                                                href="/tv-display"
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                <Eye className="w-3 h-3 text-slate-500" />
                                                <span>Preview</span>
                                            </a>

                                            {/* Visual Builder / Configure Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(`/tv-config/slides/${slide.id}/edit`);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                                                title="Open in Visual TV Slide Builder"
                                            >
                                                <Settings className="w-3 h-3" />
                                                <span>Builder</span>
                                            </button>

                                            {/* More options menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.visit(`/tv-config/slides/${slide.id}/edit`)}>
                                                        <Settings className="w-3.5 h-3.5 mr-2" />
                                                        Open Visual Builder
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSelectedSlideId(slide.id)}>
                                                        <Edit className="w-3.5 h-3.5 mr-2" />
                                                        Quick Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.visit('/tv-config/playlist')}>
                                                        <Layers className="w-3.5 h-3.5 mr-2" />
                                                        Edit in Playlist
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Slide Detail & Configuration Editor (7 cols on lg) */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 flex flex-col gap-6">
                        
                        {/* Slide Banner Header with Live Campus Image Preview */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                            {/* Campus Preview Image Banner */}
                            <div className="w-full sm:w-44 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 relative shadow-2xs">
                                <img
                                    src="/CIDS_Logo.jpg"
                                    alt="Campus Header"
                                    className="w-full h-full object-cover opacity-85"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-2.5">
                                    <span className="text-[10px] font-bold text-amber-400">Welcome to</span>
                                    <span className="text-xs font-black text-white leading-tight">CIDS OfficeHub</span>
                                    <span className="text-[8px] text-slate-300">College of Information and Digital Sciences</span>
                                </div>
                            </div>

                            {/* Details beside Image */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                                        {selectedSlide?.title || 'Slide 1 - Daily Overview'}
                                    </h3>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0",
                                        selectedSlide?.is_active
                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300"
                                            : "text-red-700 bg-red-50 border-red-200/60 dark:bg-red-950/60 dark:text-red-300"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", selectedSlide?.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                        <span>{selectedSlide?.is_active ? 'Active' : 'Inactive'}</span>
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Type: {getSlideCleanTitle(selectedSlide?.type || '', 1)} | Duration: {durationSeconds} seconds
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                    Display the daily overview, key statistics, announcements and upcoming events for the college.
                                </p>
                            </div>
                        </div>

                        {/* Configuration Tabs Header */}
                        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 -mt-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('content')}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-xs font-bold transition-colors border-b-2",
                                    activeTab === 'content'
                                        ? "text-blue-600 border-blue-600"
                                        : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Content</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('display')}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-xs font-bold transition-colors border-b-2",
                                    activeTab === 'display'
                                        ? "text-blue-600 border-blue-600"
                                        : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                <Tv className="w-3.5 h-3.5" />
                                <span>Display Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('appearance')}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-xs font-bold transition-colors border-b-2",
                                    activeTab === 'appearance'
                                        ? "text-blue-600 border-blue-600"
                                        : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                <Paintbrush className="w-3.5 h-3.5" />
                                <span>Appearance</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('advanced')}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-xs font-bold transition-colors border-b-2",
                                    activeTab === 'advanced'
                                        ? "text-blue-600 border-blue-600"
                                        : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Advanced</span>
                            </button>
                        </div>

                        {/* Tab Content: Slide Content & Section Checklist */}
                        <div className="flex flex-col gap-5">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Slide Content
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Configure which sections to display and their content for this slide.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
                                >
                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    <span>Reorder Sections</span>
                                </button>
                            </div>

                            {/* Configurable Section List */}
                            <div className="flex flex-col gap-2.5">
                                {sections.map((section) => {
                                    const IconComponent = section.icon;
                                    return (
                                        <div
                                            key={section.id}
                                            className="flex items-center justify-between gap-3 p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-grab" />
                                                
                                                <input
                                                    type="checkbox"
                                                    checked={section.enabled}
                                                    onChange={() => toggleSection(section.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                                />

                                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                                                    <IconComponent className={cn("w-4 h-4", section.iconColor)} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {section.title}
                                                    </h5>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        {section.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => alert(`Edit ${section.title} parameters`)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                                                >
                                                    <Edit className="w-3 h-3 text-slate-400" />
                                                    <span>Edit</span>
                                                </button>
                                                <button type="button" className="p-1 text-slate-400 hover:text-slate-600">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Content Settings Parameters */}
                            <div className="pt-2 flex flex-col gap-4">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Content Settings
                                </h4>

                                {/* Row 1: Max records, Sort order, Empty behavior */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Maximum Records per Section
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={maxRecords}
                                            onChange={(e) => setMaxRecords(Number(e.target.value))}
                                            className="w-full px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Sort Order
                                        </label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                                    <span>{sortOrder}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                <DropdownMenuItem onClick={() => setSortOrder('Latest First')}>Latest First</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortOrder('Oldest First')}>Oldest First</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortOrder('Alphabetical')}>Alphabetical</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Empty Section Behavior
                                        </label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                                    <span>{emptyBehavior}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => setEmptyBehavior('Hide Section')}>Hide Section</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEmptyBehavior('Show Empty Message')}>Show Empty Message</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEmptyBehavior('Show Placeholder')}>Show Placeholder</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Row 2: Target Audience & Slide Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Target Audience
                                        </label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                                    <span>{targetAudience}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                <DropdownMenuItem onClick={() => setTargetAudience('All Viewers')}>All Viewers</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setTargetAudience('Internal Staff')}>Internal Staff</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setTargetAudience('Students Only')}>Students Only</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setTargetAudience('Faculty Only')}>Faculty Only</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Slide Duration (seconds)
                                        </label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                                    <span>{durationSeconds}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => setDurationSeconds(10)}>10</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDurationSeconds(15)}>15</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDurationSeconds(20)}>20</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDurationSeconds(25)}>25</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDurationSeconds(30)}>30</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Row 3: 3 Feature Toggles */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div className="flex items-center gap-3">
                                        <ToggleSwitch
                                            checked={showSlideTitle}
                                            onChange={setShowSlideTitle}
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Slide Title</p>
                                            <p className="text-[10px] text-slate-400">Display the slide title on TV display</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <ToggleSwitch
                                            checked={showMetricsCounters}
                                            onChange={setShowMetricsCounters}
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Metrics/Counters</p>
                                            <p className="text-[10px] text-slate-400">Display statistics and counters</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <ToggleSwitch
                                            checked={autoHideEmpty}
                                            onChange={setAutoHideEmpty}
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-hide Empty Sections</p>
                                            <p className="text-[10px] text-slate-400">Automatically hide sections with no content</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <a
                                href="/tv-display"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
                            >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Preview Slide</span>
                            </a>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveConfiguration}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                                </button>

                                {isSavedNotice && (
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                                        <Check className="w-3.5 h-3.5" />
                                        Saved!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
