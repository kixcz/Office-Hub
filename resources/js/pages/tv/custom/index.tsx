import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    AlertTriangle,
    X,
    Maximize2
} from 'lucide-react';
import { CustomContentSlideHero, CustomContentSlideData } from '@/components/custom-slide-hero';

const breadcrumbs = [
    { title: 'TV Workspace', href: '/tv-config/dashboard' },
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
    filters: {
        layout?: string;
        status?: string;
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
    { id: 'full_image', label: 'Full Image' },
    { id: 'blank', label: 'Blank / Freeform' },
];

const STATUS_OPTIONS = [
    { id: 'all', label: 'All Statuses' },
    { id: 'published', label: 'Published' },
    { id: 'active', label: 'Active Now' },
    { id: 'draft', label: 'Draft' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'expired', label: 'Expired' },
];

export default function CustomSlideIndex({ slides, stats, filters }: Props) {
    const [previewSlide, setPreviewSlide] = useState<CustomContentSlideData | null>(null);
    const [deleteSlide, setDeleteSlide] = useState<CustomContentSlideData | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const handleFilterChange = (key: string, val: string) => {
        router.get(
            '/tv-config/custom',
            { ...filters, [key]: val },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
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

    const getLayoutBadge = (layout: string) => {
        switch (layout) {
            case 'title_table':
                return { label: 'Title + Table', icon: Table, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
            case 'bulletin':
                return { label: 'Bulletin Notice', icon: FileText, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
            case 'two_column':
                return { label: 'Two-Column Split', icon: Columns, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
            case 'qr_instructions':
                return { label: 'QR + Steps', icon: QrCode, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
            case 'image_text':
                return { label: 'Image + Text', icon: ImageIcon, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
            case 'full_image':
                return { label: 'Full Poster', icon: Maximize2, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
            default:
                return { label: 'Manual Block', icon: Layers, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
        }
    };

    const getStatusBadge = (slide: CustomContentSlideData) => {
        const eff = slide.effective_status || slide.status;
        if (eff === 'draft') {
            return { label: 'Draft', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
        }
        if (eff === 'expired') {
            return { label: 'Expired', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
        }
        if (eff === 'scheduled') {
            return { label: 'Scheduled', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
        }
        if (slide.is_currently_active) {
            return { label: 'Live on TV', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
        }
        return { label: 'Published', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    };

    return (
        <TvStudioLayout breadcrumbs={breadcrumbs}>
            <Head title="Custom Manual Slides - TV Display Studio" />

            <div className="space-y-6 pb-12">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Manual Content Escape Hatch</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Custom Content Slides <span className="text-indigo-400">(Manual Slides)</span>
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Create flexible, ad hoc TV content for daily rosters, room-use notices, temporary seating, QR guidelines, and office bulletins without waiting for a database model.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/tv-config/custom/create"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Custom Slide</span>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-slate-800/80">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Slides</div>
                            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Live on TV</div>
                            <div className="text-2xl font-black text-emerald-300 mt-1">{stats.active_now}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Published</div>
                            <div className="text-2xl font-black text-blue-300 mt-1">{stats.published}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Scheduled</div>
                            <div className="text-2xl font-black text-amber-300 mt-1">{stats.scheduled}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Expired</div>
                            <div className="text-2xl font-black text-rose-300 mt-1">{stats.expired}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Drafts</div>
                            <div className="text-2xl font-black text-slate-300 mt-1">{stats.drafts}</div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Tabs */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                            {STATUS_OPTIONS.map((st) => {
                                const isActive = (filters.status || 'all') === st.id;
                                return (
                                    <button
                                        key={st.id}
                                        onClick={() => handleFilterChange('status', st.id)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {st.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Layout Selector */}
                        <select
                            value={filters.layout || 'all'}
                            onChange={(e) => handleFilterChange('layout', e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            {LAYOUT_OPTIONS.map((lo) => (
                                <option key={lo.id} value={lo.id}>{lo.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 min-w-[280px]">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search manual notices, rosters, titles..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Slides Grid */}
                {slides.data.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white">No Custom Content Slides Found</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                            Create your first manual slide for weekly cleaning assignments, room schedules, visitor advisories, or event guidelines.
                        </p>
                        <Link
                            href="/tv-config/custom/create"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Custom Slide</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {slides.data.map((slide) => {
                            const lBadge = getLayoutBadge(slide.layout);
                            const LIcon = lBadge.icon;
                            const sBadge = getStatusBadge(slide);
                            const blocksCount = slide.content_blocks?.length || 0;

                            return (
                                <div
                                    key={slide.id}
                                    className="group rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden hover:border-slate-700 hover:shadow-xl transition-all duration-300 flex flex-col"
                                >
                                    {/* 16:9 Thumbnail Header */}
                                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                                        <div className="w-full h-full scale-[1.0] origin-top-left pointer-events-none select-none">
                                            <CustomContentSlideHero slide={slide} isPreview={true} />
                                        </div>

                                        {/* Badges Overlay */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${lBadge.color}`}>
                                                <LIcon className="w-3 h-3" />
                                                <span>{lBadge.label}</span>
                                            </span>
                                            {slide.fullscreen_takeover && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 backdrop-blur-md">
                                                    Takeover
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3 z-20">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${sBadge.class}`}>
                                                {sBadge.label}
                                            </span>
                                        </div>

                                        {/* Quick preview hover button */}
                                        <button
                                            onClick={() => setPreviewSlide(slide)}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-xs z-10"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Preview Live 16:9 Frame</span>
                                        </button>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-indigo-300 transition-colors">
                                                    {slide.title}
                                                </h3>
                                            </div>
                                            {slide.subtitle && (
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                                    {slide.subtitle}
                                                </p>
                                            )}

                                            {/* Metadata chips */}
                                            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    <span>{slide.duration_seconds || 20}s duration</span>
                                                </span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    <Layers className="w-3 h-3 text-slate-500" />
                                                    <span>{blocksCount} content block{blocksCount === 1 ? '' : 's'}</span>
                                                </span>
                                                {slide.end_at && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="flex items-center gap-1 text-amber-400">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Expires: {new Date(slide.end_at).toLocaleDateString()}</span>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleTogglePublish(slide)}
                                                    title={slide.status === 'published' ? 'Switch to Draft' : 'Publish to Rotation'}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    {slide.status === 'published' ? (
                                                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                                                    ) : (
                                                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(slide)}
                                                    title="Duplicate Slide"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteSlide(slide)}
                                                    title="Delete Slide"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <Link
                                                href={`/tv-config/custom/${slide.id}/edit`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-bold text-xs border border-indigo-500/20 transition-colors"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Edit Content</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Fullscreen 16:9 QA Preview */}
            {previewSlide && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
                    <div className="relative w-full max-w-6xl flex flex-col gap-4">
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{previewSlide.title}</h3>
                                    <p className="text-xs text-slate-400">16:9 Live TV Presentation Preview</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewSlide(null)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
                                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
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
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-400">
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Delete Custom Slide?</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Are you sure you want to delete <strong className="text-white">"{deleteSlide.title}"</strong>? This manual slide will be permanently removed from rotation.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => setDeleteSlide(null)}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30"
                            >
                                Delete Slide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TvStudioLayout>
    );
}
