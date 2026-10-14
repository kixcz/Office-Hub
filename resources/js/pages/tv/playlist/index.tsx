import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import { 
    PlaySquare, 
    CheckCircle2, 
    Clock, 
    Calendar as CalendarIcon, 
    Eye, 
    ArrowUpDown, 
    Plus, 
    GripVertical, 
    FileText, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Settings, 
    Tv, 
    Sliders, 
    Repeat, 
    Lightbulb, 
    CalendarCheck, 
    ShieldCheck, 
    Trophy, 
    Building2, 
    Users, 
    GraduationCap, 
    ChevronDown, 
    Save,
    Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Playlist', href: '/tv-config/playlist' },
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
    active_percentage: number;
    total_rotation_time: string;
    last_updated: string;
    last_updated_time: string;
}

interface PlaylistSettingsState {
    autoplay: boolean;
    transition_speed: string;
    default_slide_duration: string;
    display_mode: string;
    repeat_playlist: boolean;
}

interface Props {
    slides: Slide[];
    stats?: Stats;
    playlist_settings?: PlaylistSettingsState;
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
                "w-11 h-6 flex items-center rounded-full p-0.75 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer",
                checked ? "bg-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
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

// Side setting toggle switch (blue)
function BlueToggleSwitch({ 
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

export default function PlaylistIndex({ 
    slides: initialSlides,
    stats = {
        total_slides: 7,
        active_slides: 7,
        active_percentage: 100,
        total_rotation_time: '2m 5s',
        last_updated: 'Oct 13, 2026',
        last_updated_time: '11:35 AM by System Admin',
    },
    playlist_settings = {
        autoplay: true,
        transition_speed: 'Fade (1s)',
        default_slide_duration: '15 seconds',
        display_mode: 'Full Screen',
        repeat_playlist: true,
    }
}: Props) {
    const [slidesList, setSlidesList] = useState<Slide[]>(initialSlides);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isOrderChanged, setIsOrderChanged] = useState(false);
    const [isOrderSaved, setIsOrderSaved] = useState(false);

    // Sidebar settings state
    const [autoplay, setAutoplay] = useState(playlist_settings.autoplay);
    const [transitionSpeed, setTransitionSpeed] = useState(playlist_settings.transition_speed);
    const [defaultSlideDuration, setDefaultSlideDuration] = useState(playlist_settings.default_slide_duration);
    const [displayMode, setDisplayMode] = useState(playlist_settings.display_mode);
    const [repeatPlaylist, setRepeatPlaylist] = useState(playlist_settings.repeat_playlist);

    // Dialog state
    const [isCreating, setIsCreating] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

    // Create form
    const { data: createData, setData: setCreateData, post: postCreate, processing: creating, reset: resetCreate } = useForm({
        title: '',
        type: 'Slide 1 - Daily Overview',
        duration_seconds: 15,
    });

    // Edit form
    const { data: editData, setData: setEditData, put: putEdit, processing: editing } = useForm({
        title: '',
        type: 'Slide 1 - Daily Overview',
        duration_seconds: 15,
        is_active: true,
    });

    const handleOpenEdit = (slide: Slide) => {
        setEditingSlide(slide);
        setEditData({
            title: slide.title,
            type: slide.type,
            duration_seconds: slide.duration_seconds,
            is_active: slide.is_active,
        });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/tv-config/playlist', {
            onSuccess: () => {
                resetCreate();
                setIsCreating(false);
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlide) return;
        putEdit(`/tv-config/playlist/${editingSlide.id}`, {
            onSuccess: () => {
                setEditingSlide(null);
            }
        });
    };

    const [deletingSlide, setDeletingSlide] = useState<Slide | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (slide: Slide) => {
        setDeletingSlide(slide);
    };

    const confirmDeleteSlide = () => {
        if (!deletingSlide) return;
        setIsDeleting(true);
        router.delete(`/tv-config/playlist/${deletingSlide.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingSlide(null);
            },
        });
    };

    const toggleSlideStatus = (slide: Slide) => {
        const updated = !slide.is_active;
        setSlidesList(prev => prev.map(s => s.id === slide.id ? { ...s, is_active: updated } : s));
        router.put(`/tv-config/playlist/${slide.id}`, { is_active: updated }, { preserveScroll: true });
    };

    // Drag and drop reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newSlides = [...slidesList];
        const draggedItem = newSlides[draggedIndex];
        newSlides.splice(draggedIndex, 1);
        newSlides.splice(index, 0, draggedItem);

        // Update orders
        const reordered = newSlides.map((item, idx) => ({ ...item, order: idx + 1 }));
        setDraggedIndex(index);
        setSlidesList(reordered);
        setIsOrderChanged(true);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSaveOrder = () => {
        const orderPayload = slidesList.map(s => s.id);
        router.post('/tv-config/playlist/reorder', { order: orderPayload }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsOrderChanged(false);
                setIsOrderSaved(true);
                setTimeout(() => setIsOrderSaved(false), 3000);
            }
        });
    };

    // Helper to get visual thumbnail preview badge matching mockup
    const getSlideThumbnail = (order: number, type: string) => {
        switch (order) {
            case 1:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-r from-blue-900 to-slate-900 border border-slate-700/60 flex items-center justify-center p-1 shrink-0 shadow-2xs overflow-hidden">
                        <img 
                            src="/cids-logo.png" 
                            alt="CIDS" 
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                            }} 
                        />
                        <div className="text-[9px] font-black text-amber-400 ml-1">CIDS</div>
                    </div>
                );
            case 2:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/20 border border-blue-300/40 dark:border-blue-700/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <CalendarCheck className="w-5 h-5 text-blue-500" />
                    </div>
                );
            case 3:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                );
            case 4:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                );
            case 5:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                );
            case 6:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                );
            case 7:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                );
            case 8:
                return (
                    <div className="w-13 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                        <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-13 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <PlaySquare className="w-4 h-4 text-slate-500" />
                    </div>
                );
        }
    };

    // Subtitle descriptions for each slide matching mockup
    const getSlideSubtitle = (order: number) => {
        switch (order) {
            case 1: return 'Key updates and announcements';
            case 2: return 'Upcoming events and schedules';
            case 3: return 'Policies and compliance updates';
            case 4: return 'Highlights and recognitions';
            case 5: return 'Classroom activity and utilization';
            case 6: return 'Attendance and class progress';
            case 7: return 'Faculty schedules and availability';
            case 8: return 'College events, deadlines & examinations';
            default: return 'Custom playlist slide content';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV Playlist" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                
                {/* 1. Page Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        TV Playlist
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Manage slide order, visibility, and playback settings for the display.
                    </p>
                </div>

                {/* 2. Bento Stat Cards (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Slides */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <PlaySquare className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Slides</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.total_slides}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Total slides in playlist
                            </p>
                        </div>
                    </div>

                    {/* Active Slides */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Slides</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.active_slides}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                {stats.active_percentage}% active
                            </p>
                        </div>
                    </div>

                    {/* Total Rotation Time */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Rotation Time</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.total_rotation_time}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Total time for one complete cycle
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
                                {stats.last_updated_time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Main Content Area: Left Playlist Table (2/3) + Right Settings Panel (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* LEFT PANEL: Playlist Order & Status (2/3 width) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 flex flex-col gap-5">
                        
                        {/* Table Header Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                    <PlaySquare className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                        Playlist Order & Status
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Drag and drop to reorder slides. Configure duration and visibility for each slide.
                                    </p>
                                </div>
                            </div>

                            {/* Actions on Top Right */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <a
                                    href="/tv-display"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl transition-all shadow-2xs"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview Playlist</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={handleSaveOrder}
                                    disabled={!isOrderChanged}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-2xs",
                                        isOrderChanged
                                            ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 cursor-pointer animate-pulse"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                    <span>{isOrderSaved ? 'Order Saved!' : 'Save Order'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Add New Slide</span>
                                </button>
                            </div>
                        </div>

                        {/* Slide Rows List */}
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
                            {slidesList.map((slide, index) => {
                                const orderNumber = index + 1;
                                return (
                                    <div
                                        key={slide.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-grab active:cursor-grabbing",
                                            !slide.is_active && "opacity-60 bg-slate-50/50 dark:bg-slate-900/50",
                                            draggedIndex === index && "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300"
                                        )}
                                    >
                                        {/* Left Side: Drag handle, Order Number, Thumbnail, Title & Subtitle */}
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                            {/* Drag Gripper */}
                                            <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0">
                                                <GripVertical className="w-4 h-4" />
                                            </div>

                                            {/* Order Number Badge */}
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                                                {orderNumber}
                                            </div>

                                            {/* Thumbnail Illustration */}
                                            {getSlideThumbnail(orderNumber, slide.type)}

                                            {/* Title and Subtitle */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {slide.title}
                                                </h3>
                                                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                    {getSlideSubtitle(orderNumber)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Middle Details: Slide Type with Icon & Duration */}
                                        <div className="hidden sm:flex items-center gap-6 shrink-0">
                                            {/* Slide Document Type Label */}
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 w-36">
                                                <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <div className="truncate">
                                                    <span className="block font-bold text-slate-800 dark:text-slate-200 truncate">Slide {orderNumber}</span>
                                                    <span className="text-[10px] text-slate-400 truncate block">
                                                        {slide.type.replace(/^Slide \d+ - /, '')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 w-20">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{slide.duration_seconds}s</span>
                                                    <span className="text-[10px] text-slate-400 block -mt-0.5">Duration</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Controls: Active Switch & Menu */}
                                        <div className="flex items-center gap-3 shrink-0 pl-2">
                                            <div className="flex items-center gap-2">
                                                <ToggleSwitch
                                                    checked={slide.is_active}
                                                    onChange={() => toggleSlideStatus(slide)}
                                                />
                                                <span className={cn(
                                                    "text-xs font-bold hidden md:inline-block",
                                                    slide.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                                                )}>
                                                    {slide.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(slide)}>
                                                        <Edit className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(slide)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2 text-red-600" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Playlist Settings & Tips (1/3 width) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* Playlist Settings Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col gap-5">
                            {/* Card Header */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                    <Settings className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                        Playlist Settings
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Configure default behavior for the TV display.
                                    </p>
                                </div>
                            </div>

                            {/* Setting 1: Autoplay */}
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <PlaySquare className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Autoplay
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Automatically play slides in sequence
                                        </p>
                                    </div>
                                </div>
                                <BlueToggleSwitch
                                    checked={autoplay}
                                    onChange={setAutoplay}
                                />
                            </div>

                            {/* Setting 2: Transition Speed */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Sliders className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Transition Speed
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Time between slides
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                            <span>{transitionSpeed}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setTransitionSpeed('Instant')}>Instant</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTransitionSpeed('Fade (0.5s)')}>Fade (0.5s)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTransitionSpeed('Fade (1s)')}>Fade (1s)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTransitionSpeed('Slide (1s)')}>Slide (1s)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Setting 3: Default Slide Duration */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Default Slide Duration
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Default time for new slides
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                            <span>{defaultSlideDuration}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setDefaultSlideDuration('10 seconds')}>10 seconds</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDefaultSlideDuration('15 seconds')}>15 seconds</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDefaultSlideDuration('20 seconds')}>20 seconds</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDefaultSlideDuration('30 seconds')}>30 seconds</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Setting 4: Display Mode */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Tv className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Display Mode
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            How the content is displayed
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                                            <span>{displayMode}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setDisplayMode('Full Screen')}>Full Screen</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDisplayMode('Windowed')}>Windowed</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDisplayMode('Fit')}>Fit</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Setting 5: Repeat Playlist */}
                            <div className="flex items-center justify-between gap-4 pt-1">
                                <div className="flex items-start gap-3">
                                    <Repeat className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Repeat Playlist
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[150px]">
                                            Restart from the first slide after the last one
                                        </p>
                                    </div>
                                </div>
                                <BlueToggleSwitch
                                    checked={repeatPlaylist}
                                    onChange={setRepeatPlaylist}
                                />
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="bg-blue-50/60 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300">Tips</h3>
                                <p className="text-[11px] font-medium text-blue-700/80 dark:text-blue-400 mt-1 leading-relaxed">
                                    Drag and drop slides to reorder them. Changes are applied instantly to the TV display when you save.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Add New Slide */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Add New Slide to Playlist</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="flex flex-col gap-4 mt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Slide Title
                            </label>
                            <input
                                value={createData.title}
                                onChange={(e) => setCreateData('title', e.target.value)}
                                placeholder="e.g. Slide 8 - Department Accomplishments"
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Slide Type
                            </label>
                            <select
                                value={createData.type}
                                onChange={(e) => setCreateData('type', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="Slide 1 - Daily Overview">Daily Overview</option>
                                <option value="Slide 2 - Schedule & Meetings">Schedule & Meetings</option>
                                <option value="Slide 3 - Compliance Monitoring">Compliance Monitoring</option>
                                <option value="Slide 4 - Performance & Recognition">Performance & Recognition</option>
                                <option value="Slide 5 - Classroom Monitoring">Classroom & Lab Monitoring (Rooms)</option>
                                <option value="Slide 6 - Class Monitoring">Class & Lab Attendance Summary (Spreadsheet)</option>
                                <option value="Slide 7 - Faculty Schedule">Faculty Schedule (Class & Lab Timetable)</option>
                                <option value="Slide 8 - Consolidated Calendar">Consolidated Calendar (Meetings, Activities & Exams)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Duration (seconds)
                            </label>
                            <input
                                type="number"
                                min="5"
                                value={createData.duration_seconds}
                                onChange={(e) => setCreateData('duration_seconds', Number(e.target.value))}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                required
                            />
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Add to Playlist
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Slide */}
            <Dialog open={!!editingSlide} onOpenChange={(open) => !open && setEditingSlide(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Edit Slide Configuration</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4 mt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Slide Title
                            </label>
                            <input
                                value={editData.title}
                                onChange={(e) => setEditData('title', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Slide Type
                            </label>
                            <select
                                value={editData.type}
                                onChange={(e) => setEditData('type', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="Slide 1 - Daily Overview">Daily Overview</option>
                                <option value="Slide 2 - Schedule & Meetings">Schedule & Meetings</option>
                                <option value="Slide 3 - Compliance Monitoring">Compliance Monitoring</option>
                                <option value="Slide 4 - Performance & Recognition">Performance & Recognition</option>
                                <option value="Slide 5 - Classroom Monitoring">Classroom & Lab Monitoring (Rooms)</option>
                                <option value="Slide 6 - Class Monitoring">Class & Lab Attendance Summary (Spreadsheet)</option>
                                <option value="Slide 7 - Faculty Schedule">Faculty Schedule (Class & Lab Timetable)</option>
                                <option value="Slide 8 - Consolidated Calendar">Consolidated Calendar (Meetings, Activities & Exams)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Duration (seconds)
                            </label>
                            <input
                                type="number"
                                min="5"
                                value={editData.duration_seconds}
                                onChange={(e) => setEditData('duration_seconds', Number(e.target.value))}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2">
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Active in Playlist</p>
                                <p className="text-[11px] text-slate-400">Include this slide during playlist rotation</p>
                            </div>
                            <ToggleSwitch
                                checked={editData.is_active}
                                onChange={(val) => setEditData('is_active', val)}
                            />
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingSlide(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editing}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Save Changes
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Slide Confirmation Modal */}
            <DeleteConfirmDialog
                open={!!deletingSlide}
                onOpenChange={(open) => !open && setDeletingSlide(null)}
                title="Delete TV Slide"
                description="Are you sure you want to permanently delete this TV slide? It will be immediately removed from the active digital display rotation."
                itemName={deletingSlide ? deletingSlide.title : undefined}
                confirmLabel="Delete Slide"
                isDeleting={isDeleting}
                onConfirm={confirmDeleteSlide}
            />
        </AppLayout>
    );
}
