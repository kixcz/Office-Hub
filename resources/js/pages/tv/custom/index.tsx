import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Clock,
    Calendar,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Eye,
    Edit3,
    Copy,
    Trash2,
    ToggleLeft,
    ToggleRight,
    QrCode,
    Table,
    Columns,
    Image as ImageIcon,
    Sliders,
    Layers,
    List,
    LayoutGrid,
    AlertTriangle,
    X,
    Maximize2,
    Tv,
    MoreVertical,
    Check,
    Hourglass,
    Play,
    Pause,
    Radio,
    ArrowUpDown,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomContentSlideHero, CustomContentSlideData } from '@/components/custom-slide-hero';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Display Studio', href: '/tv-config/dashboard' },
    { title: 'Custom Manual Slides', href: '/tv-config/custom' },
];

interface Props {
    slides: {
        data: CustomContentSlideData[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    stats: {
        total: number;
        published: number;
        active_now: number;
        drafts: number;
        expired: number;
        scheduled: number;
    };
    playlists?: string[];
    filters: {
        layout?: string;
        status?: string;
        playlist?: string;
        start_date?: string;
        end_date?: string;
        sort?: string;
        search?: string;
    };
}

const LAYOUT_OPTIONS = [
    { id: 'all', label: 'All Layouts' },
    { id: 'title_table', label: 'Title + Table' },
    { id: 'bulletin', label: 'Bulletin Notice' },
    { id: 'two_column', label: 'Two-Column Split' },
    { id: 'qr_instructions', label: 'QR + Instructions' },
    { id: 'image_text', label: 'Image + Text' },
    { id: 'full_image', label: 'Full Poster' },
    { id: 'blank', label: 'Blank / Freeform' },
];

const STATUS_TABS = [
    { id: 'all', label: 'All Slides', key: 'total' },
    { id: 'published', label: 'Published', key: 'published' },
    { id: 'active', label: 'Active Now', key: 'active_now' },
    { id: 'scheduled', label: 'Scheduled', key: 'scheduled' },
    { id: 'expired', label: 'Expired', key: 'expired' },
    { id: 'draft', label: 'Drafts', key: 'drafts' },
];

export default function CustomSlideIndex({ slides, stats, playlists = [], filters }: Props) {
    const [previewSlide, setPreviewSlide] = useState<CustomContentSlideData | null>(null);
    const [deleteSlide, setDeleteSlide] = useState<CustomContentSlideData | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    
    // Filter Inputs
    const [search, setSearch] = useState(filters.search || '');
    const [selectedLayout, setSelectedLayout] = useState(filters.layout || 'all');
    const [selectedPlaylist, setSelectedPlaylist] = useState(filters.playlist || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sort, setSort] = useState(filters.sort || 'latest');

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleFilterChange = (updates: Record<string, string | undefined>) => {
        const merged = { ...filters, ...updates };
        // Clean out undefined or 'all' or empty strings
        Object.keys(merged).forEach((k) => {
            if (merged[k] === 'all' || merged[k] === '' || merged[k] === undefined) {
                delete merged[k];
            }
        });

        router.get('/tv-config/custom', merged, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange({ search });
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedLayout('all');
        setSelectedPlaylist('all');
        setSelectedStatus('all');
        setStartDate('');
        setEndDate('');
        setSort('latest');
        router.get('/tv-config/custom', {}, { preserveState: true, replace: true });
    };

    const handleTogglePublish = (slide: CustomContentSlideData) => {
        router.post(`/tv-config/custom/${slide.id}/toggle-publish`, {}, { preserveScroll: true });
    };

    const handleDuplicate = (slide: CustomContentSlideData) => {
        router.post(`/tv-config/custom/${slide.id}/duplicate`, {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteSlide) return;
        router.delete(`/tv-config/custom/${deleteSlide.id}`, {
            onSuccess: () => setDeleteSlide(null),
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(slides.data.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllSelected = slides.data.length > 0 && slides.data.every(s => selectedIds.includes(s.id));

    const getLayoutBadge = (layout: string) => {
        switch (layout) {
            case 'title_table':
                return { label: 'Title + Table', icon: Table, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
            case 'bulletin':
                return { label: 'Bulletin Notice', icon: FileText, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' };
            case 'two_column':
                return { label: 'Two-Column Split', icon: Columns, color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' };
            case 'qr_instructions':
                return { label: 'QR + Instructions', icon: QrCode, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' };
            case 'image_text':
                return { label: 'Image + Text', icon: ImageIcon, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' };
            case 'full_image':
                return { label: 'Hero Banner', icon: Maximize2, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' };
            default:
                return { label: 'Info Panel', icon: Layers, color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800' };
        }
    };

    const getStatusBadge = (slide: CustomContentSlideData) => {
        const eff = slide.effective_status || slide.status;
        if (eff === 'draft') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Draft
                </span>
            );
        }
        if (eff === 'expired') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Expired
                </span>
            );
        }
        if (eff === 'scheduled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Scheduled
                </span>
            );
        }
        if (slide.is_currently_active) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Now
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Published
            </span>
        );
    };

    const getPlaylistPill = (playlist?: string) => {
        const name = playlist || 'Main Playlist';
        const isEmergency = name.toLowerCase().includes('emergency');
        const isRoom = name.toLowerCase().includes('room');
        const isSpecial = name.toLowerCase().includes('special');
        
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className={`w-2 h-2 rounded-full ${
                    isEmergency ? 'bg-rose-500' :
                    isRoom ? 'bg-sky-500' :
                    isSpecial ? 'bg-teal-500' :
                    'bg-indigo-500'
                }`} />
                <span>{name}</span>
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Custom Manual Slides - TV Display Studio" />

            <TvStudioLayout>
                <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1650px] mx-auto w-full">
                    {/* 1. Header Banner matching reference image (with TV preview collage & Yellow Action) */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.04] to-card p-6 md:p-8 shadow-xs">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-300/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                                    <Tv className="w-6 h-6 stroke-[2.2]" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        Custom Manual Slides
                                    </h1>
                                    <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                                        Create flexible, ad hoc TV content for daily rosters, room-use notices, temporary seating, QR guidelines, and office bulletins without waiting for a database module.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* View Toggle: Table vs Cards */}
                                <div className="inline-flex items-center rounded-lg border border-border bg-card p-1 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('table')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                            viewMode === 'table'
                                                ? 'bg-amber-500 text-white shadow-xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        <span>Table</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('cards')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                            viewMode === 'cards'
                                                ? 'bg-amber-500 text-white shadow-xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        <span>Cards</span>
                                    </button>
                                </div>

                                <Link
                                    href="/tv-config/custom/create"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Create Custom Slide</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top Metrics Cards (Matches reference image architecture) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-border/80">
                            {/* Total Slides */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Total Slides
                                    </span>
                                    <div className="text-2xl font-black text-foreground">{stats.total}</div>
                                    <p className="text-[10px] text-muted-foreground">All custom slides</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                                    <FileText className="w-4 h-4 stroke-[1.8]" />
                                </div>
                            </div>

                            {/* Live on TV */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        Live on TV
                                    </span>
                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active_now}</div>
                                    <p className="text-[10px] text-emerald-600/80">Currently showing</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Play className="w-4 h-4 stroke-[2.2] fill-emerald-500/30" />
                                </div>
                            </div>

                            {/* Published */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                        Published
                                    </span>
                                    <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{stats.published}</div>
                                    <p className="text-[10px] text-sky-600/80">Active and scheduled</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>

                            {/* Scheduled */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Scheduled
                                    </span>
                                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.scheduled}</div>
                                    <p className="text-[10px] text-amber-600/80">Upcoming slides</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>

                            {/* Expired */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                        Expired
                                    </span>
                                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.expired}</div>
                                    <p className="text-[10px] text-rose-600/80">Past display date</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>

                            {/* Drafts */}
                            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Drafts
                                    </span>
                                    <div className="text-2xl font-black text-foreground">{stats.drafts}</div>
                                    <p className="text-[10px] text-muted-foreground">Not yet published</p>
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                                    <Edit3 className="w-4 h-4 stroke-[1.8]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Filter Navigation & Status Tabs (Matching Picture) */}
                    <div className="flex flex-col gap-3.5">
                        {/* Status Tabs with Pill Counts */}
                        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-border">
                            <div className="flex items-center gap-1.5 shrink-0">
                                {STATUS_TABS.map((tab) => {
                                    const count = (stats as any)[tab.key] ?? 0;
                                    const isActive = (filters.status || 'all') === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => handleFilterChange({ status: tab.id })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                                isActive
                                                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                                    isActive
                                                        ? 'bg-amber-600/70 text-white'
                                                        : tab.id === 'expired' && count > 0
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-auto">
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Sort by:</span>
                                <select
                                    value={sort}
                                    onChange={(e) => {
                                        setSort(e.target.value);
                                        handleFilterChange({ sort: e.target.value });
                                    }}
                                    className="h-8 text-xs font-semibold rounded-md border border-input bg-card px-2.5 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                >
                                    <option value="latest">Most Recent</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title">Title (A-Z)</option>
                                    <option value="duration_desc">Display Duration (Longest)</option>
                                    <option value="duration_asc">Display Duration (Shortest)</option>
                                </select>
                            </div>
                        </div>

                        {/* Secondary Filters Bar (Search, Layouts, Playlists, Statuses, Date Range, Reset) */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-card p-2 rounded-xl border border-border shadow-2xs">
                            {/* Search Input */}
                            <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search slides by title, description, or tag..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8.5 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                />
                            </form>

                            {/* Dropdowns & Date Range */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                {/* Layouts Dropdown */}
                                <select
                                    value={selectedLayout}
                                    onChange={(e) => {
                                        setSelectedLayout(e.target.value);
                                        handleFilterChange({ layout: e.target.value });
                                    }}
                                    className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                >
                                    {LAYOUT_OPTIONS.map((lo) => (
                                        <option key={lo.id} value={lo.id}>{lo.label}</option>
                                    ))}
                                </select>

                                {/* Playlists Dropdown */}
                                <select
                                    value={selectedPlaylist}
                                    onChange={(e) => {
                                        setSelectedPlaylist(e.target.value);
                                        handleFilterChange({ playlist: e.target.value });
                                    }}
                                    className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                >
                                    <option value="all">All Playlists</option>
                                    <option value="Main Playlist">Main Playlist</option>
                                    <option value="Announcements">Announcements</option>
                                    <option value="Room Monitoring">Room Monitoring</option>
                                    <option value="Special Events">Special Events</option>
                                    <option value="Emergency">Emergency</option>
                                    {playlists.map((pl) => (
                                        !['Main Playlist', 'Announcements', 'Room Monitoring', 'Special Events', 'Emergency'].includes(pl) && (
                                            <option key={pl} value={pl}>{pl}</option>
                                        )
                                    ))}
                                </select>

                                {/* Status Dropdown */}
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        handleFilterChange({ status: e.target.value });
                                    }}
                                    className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="published">Published</option>
                                    <option value="active">Active Now</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="expired">Expired</option>
                                    <option value="draft">Drafts</option>
                                </select>

                                {/* Date Range Pickers */}
                                <div className="flex items-center gap-1 bg-background border border-input rounded-lg px-2 h-8 text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            handleFilterChange({ start_date: e.target.value });
                                        }}
                                        className="bg-transparent border-0 text-[11px] focus:outline-none text-foreground p-0 w-24"
                                        title="Start Date"
                                    />
                                    <span className="text-muted-foreground">—</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            handleFilterChange({ end_date: e.target.value });
                                        }}
                                        className="bg-transparent border-0 text-[11px] focus:outline-none text-foreground p-0 w-24"
                                        title="End Date"
                                    />
                                </div>

                                {/* Reset Filter Button */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleResetFilters}
                                    className="h-8 text-xs px-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Main Content: Table View vs Cards View */}
                    {viewMode === 'table' ? (
                        /* Table View (Matching Attached Screenshot with 16:9 Thumbnail, Toggle, Actions) */
                        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3 px-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-input text-amber-500 focus:ring-amber-400"
                                                />
                                            </th>
                                            <th className="py-3 px-4 min-w-[130px]">Slide Preview</th>
                                            <th className="py-3 px-4 min-w-[240px]">Title & Description</th>
                                            <th className="py-3 px-4 min-w-[130px]">Layout</th>
                                            <th className="py-3 px-4 min-w-[140px]">Playlist</th>
                                            <th className="py-3 px-4 min-w-[160px]">Schedule</th>
                                            <th className="py-3 px-4 min-w-[110px]">Status</th>
                                            <th className="py-3 px-4 min-w-[100px]">Display Duration</th>
                                            <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {slides.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-14 text-center text-muted-foreground">
                                                    <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                                                    <p className="font-bold text-sm text-foreground">No custom manual slides found</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                                                        No custom slides match your current filter settings. Try adjusting search or reset filters.
                                                    </p>
                                                    <Link
                                                        href="/tv-config/custom/create"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Create Slide</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ) : (
                                            slides.data.map((slide) => {
                                                const isSelected = selectedIds.includes(slide.id);
                                                const lBadge = getLayoutBadge(slide.layout);
                                                const isPublished = slide.status === 'published';

                                                return (
                                                    <tr
                                                        key={slide.id}
                                                        className={`hover:bg-amber-500/[0.03] transition-colors ${
                                                            isSelected ? 'bg-amber-500/[0.06]' : ''
                                                        }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="py-3 px-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleToggleSelect(slide.id)}
                                                                className="rounded border-input text-amber-500 focus:ring-amber-400"
                                                            />
                                                        </td>

                                                        {/* 16:9 Thumbnail Frame */}
                                                        <td className="py-3 px-4">
                                                            <div
                                                                onClick={() => setPreviewSlide(slide)}
                                                                className="group/thumb relative aspect-video w-28 rounded-lg overflow-hidden border border-border bg-slate-950 shadow-2xs cursor-pointer hover:border-amber-400/80 transition-all"
                                                            >
                                                                <div className="w-full h-full scale-[1.0] pointer-events-none select-none">
                                                                    <CustomContentSlideHero slide={slide} isPreview={true} />
                                                                </div>
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                    <Eye className="w-4 h-4 drop-shadow" />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Title & Description & Tags */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-foreground text-xs leading-snug">
                                                                {slide.title}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                                {slide.subtitle || 'No subtitle provided'}
                                                            </div>
                                                            {/* Tags */}
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                {slide.badge && (
                                                                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                                                        • {slide.badge}
                                                                    </span>
                                                                )}
                                                                {slide.fullscreen_takeover && (
                                                                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                                        • Takeover
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    • {slide.content_blocks?.length || 0} blocks
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Layout Pill */}
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${lBadge.color}`}>
                                                                {lBadge.label}
                                                            </span>
                                                        </td>

                                                        {/* Playlist Pill */}
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {getPlaylistPill(slide.playlist)}
                                                        </td>

                                                        {/* Schedule Date Range */}
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-foreground">
                                                                {slide.start_at ? new Date(slide.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                                                                {' — '}
                                                                {slide.end_at ? new Date(slide.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry'}
                                                            </div>
                                                        </td>

                                                        {/* Status Badge */}
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {getStatusBadge(slide)}
                                                        </td>

                                                        {/* Display Duration & Amber Toggle Switch (Matches Reference) */}
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground font-medium">
                                                                    {slide.duration_seconds || 15}s
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTogglePublish(slide)}
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                        isPublished ? 'bg-amber-500' : 'bg-muted'
                                                                    }`}
                                                                    title={isPublished ? 'Published (Click to Draft)' : 'Draft (Click to Publish)'}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                            isPublished ? 'translate-x-4' : 'translate-x-0'
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Actions: View, Edit, Duplicate, More */}
                                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewSlide(slide)}
                                                                    className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                    title="Live 16:9 Preview"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>

                                                                <Link
                                                                    href={`/tv-config/custom/${slide.id}/edit`}
                                                                    className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                                    title="Edit Content"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDuplicate(slide)}
                                                                    className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                    title="Duplicate Slide"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                </button>

                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                        >
                                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="text-xs">
                                                                        <DropdownMenuItem onClick={() => setPreviewSlide(slide)} className="gap-2">
                                                                            <Eye className="w-3.5 h-3.5" /> Fullscreen 16:9 Preview
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={`/tv-config/custom/${slide.id}/edit`} className="gap-2">
                                                                                <Edit3 className="w-3.5 h-3.5" /> Edit Content & Layout
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDuplicate(slide)} className="gap-2">
                                                                            <Copy className="w-3.5 h-3.5" /> Duplicate Slide
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleTogglePublish(slide)} className="gap-2">
                                                                            {isPublished ? (
                                                                                <>
                                                                                    <Pause className="w-3.5 h-3.5 text-amber-500" /> Unpublish (Set Draft)
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Play className="w-3.5 h-3.5 text-emerald-500" /> Publish to TV
                                                                                </>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setDeleteSlide(slide)} className="gap-2 text-rose-600 focus:text-rose-600">
                                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Slide
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* 4. Card Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {slides.data.length === 0 ? (
                                <div className="col-span-full py-14 text-center text-muted-foreground border border-dashed rounded-xl bg-card">
                                    <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                                    <p className="font-bold text-sm text-foreground">No custom manual slides found</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Try resetting your active filters.</p>
                                </div>
                            ) : (
                                slides.data.map((slide) => {
                                    const lBadge = getLayoutBadge(slide.layout);
                                    const isPublished = slide.status === 'published';

                                    return (
                                        <div
                                            key={slide.id}
                                            className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-amber-400/80 hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            {/* Aspect Ratio 16:9 Thumbnail Header */}
                                            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-border">
                                                <div className="w-full h-full scale-[1.0] pointer-events-none select-none">
                                                    <CustomContentSlideHero slide={slide} isPreview={true} />
                                                </div>

                                                {/* Top Badge Overlay */}
                                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${lBadge.color}`}>
                                                        {lBadge.label}
                                                    </span>
                                                    {slide.fullscreen_takeover && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30 backdrop-blur-md">
                                                            Takeover
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="absolute top-2.5 right-2.5 z-20">
                                                    {getStatusBadge(slide)}
                                                </div>

                                                {/* Quick Preview Hover Overlay */}
                                                <button
                                                    onClick={() => setPreviewSlide(slide)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-xs z-10 cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Preview 16:9 Live</span>
                                                </button>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                <div>
                                                    <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                        {slide.title}
                                                    </h3>
                                                    {slide.subtitle && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                            {slide.subtitle}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-border text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                                            <span>{slide.duration_seconds || 15}s</span>
                                                        </span>
                                                        <span>•</span>
                                                        <span>{getPlaylistPill(slide.playlist)}</span>
                                                        <span>•</span>
                                                        <span>{slide.content_blocks?.length || 0} blocks</span>
                                                    </div>
                                                </div>

                                                {/* Card Footer Actions */}
                                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-muted-foreground font-medium">Rotation</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePublish(slide)}
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                                isPublished ? 'bg-amber-500' : 'bg-muted'
                                                            }`}
                                                            title={isPublished ? 'Live in rotation' : 'Paused / Draft'}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    isPublished ? 'translate-x-4' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDuplicate(slide)}
                                                            title="Duplicate"
                                                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteSlide(slide)}
                                                            title="Delete"
                                                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <Link
                                                            href={`/tv-config/custom/${slide.id}/edit`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-colors"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* 5. Pagination Bar */}
                    {slides.links && slides.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                            <div>
                                Showing <span className="font-bold text-foreground">{slides.data.length}</span> of{' '}
                                <span className="font-bold text-foreground">{slides.total}</span> manual slides
                            </div>
                            <div className="flex items-center gap-1">
                                {slides.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                            link.active
                                                ? 'bg-amber-500 text-white font-bold shadow-xs'
                                                : link.url
                                                ? 'border border-border bg-card hover:bg-muted text-foreground cursor-pointer'
                                                : 'text-muted-foreground opacity-50 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal: Fullscreen 16:9 QA Preview */}
                {previewSlide && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
                        <div className="relative w-full max-w-6xl flex flex-col gap-4">
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                                        <Tv className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{previewSlide.title}</h3>
                                        <p className="text-xs text-slate-400">16:9 Ultra HD Live Presentation Preview</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewSlide(null)}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 16:9 Canvas Frame */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                                <CustomContentSlideHero slide={previewSlide} isPreview={false} />
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                                <span>Press Esc or click close to exit preview.</span>
                                <Link
                                    href={`/tv-config/custom/${previewSlide.id}/edit`}
                                    className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Open Full Editor</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Confirm Delete */}
                {deleteSlide && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                            <div className="flex items-center gap-3 text-rose-500">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Delete Custom Slide?</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Are you sure you want to delete <strong className="text-foreground">"{deleteSlide.title}"</strong>? This manual slide will be permanently removed from the TV rotation playlist.
                            </p>
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                <button
                                    onClick={() => setDeleteSlide(null)}
                                    className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                                >
                                    Delete Slide
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </TvStudioLayout>
        </AppLayout>
    );
}
