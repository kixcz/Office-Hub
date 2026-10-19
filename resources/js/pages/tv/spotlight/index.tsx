import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Sparkles,
    Plus,
    Search,
    AlertTriangle,
    Trophy,
    Award,
    Cake,
    CheckCircle2,
    Clock,
    Building2,
    Eye,
    Edit,
    Trash2,
    Sliders,
    Tv,
    LayoutTemplate,
    ExternalLink,
    Play,
    Pause,
    MoreVertical,
    Check,
    PartyPopper,
    BookOpen,
    GraduationCap,
    HeartHandshake,
    AlertCircle,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { SpotlightSlideHero, SpotlightSlideData } from '@/components/spotlight-slide-hero';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Recognition & Celebrations (Spotlight)', href: '/tv-config/spotlight' },
];

interface SuggestedBirthday {
    faculty_id: number;
    faculty_name: string;
    title_name: string;
    program: string;
    photo_url?: string | null;
    birthday_formatted: string;
    days_away: number;
    is_today: boolean;
    has_active_slide: boolean;
    existing_slide_id?: number;
    suggested_start: string;
    suggested_end: string;
}

interface Props {
    spotlights: {
        data: SpotlightSlideData[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        published: number;
        active_now: number;
        drafts: number;
        birthday_count: number;
    };
    suggested_birthdays: SuggestedBirthday[];
    filters: {
        type?: string;
        status?: string;
        search?: string;
    };
}

const SPOTLIGHT_TYPES = [
    { id: 'all', label: 'All Spotlights' },
    { id: 'award', label: 'Awards & Honors' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'birthday', label: 'Birthdays' },
    { id: 'publication', label: 'Research Publications' },
    { id: 'certification', label: 'Certifications' },
    { id: 'promotion', label: 'Promotions' },
    { id: 'research', label: 'Research Recognitions' },
    { id: 'extension', label: 'Extension Recognitions' },
    { id: 'welcome', label: 'Welcomes' },
    { id: 'farewell', label: 'Farewells' },
    { id: 'custom', label: 'Custom Celebrations' },
];

export default function SpotlightIndex({ spotlights, stats, suggested_birthdays = [], filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedType, setSelectedType] = useState(filters?.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all');
    const [previewSlide, setPreviewSlide] = useState<SpotlightSlideData | null>(null);
    const [deleteSlide, setDeleteSlide] = useState<SpotlightSlideData | null>(null);

    const handleFilterChange = (type: string, status: string, searchTerm: string) => {
        router.get(
            '/tv-config/spotlight',
            {
                type: type !== 'all' ? type : undefined,
                status: status !== 'all' ? status : undefined,
                search: searchTerm ? searchTerm : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleTogglePublish = (slide: SpotlightSlideData) => {
        router.post(`/tv-config/spotlight/${slide.id}/toggle-publish`, {}, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteSlide) return;
        router.delete(`/tv-config/spotlight/${deleteSlide.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteSlide(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Spotlight Slides - Recognition & Celebrations" />

            <TvStudioLayout>
                <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-xs">
                                    <Sparkles className="w-5 h-5" />
                                </span>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        Recognition & Celebrations <span className="text-amber-600 dark:text-amber-400">(Spotlight Slides)</span>
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Create high-impact celebratory slides that highlight achievements, birthdays, publications, and milestone moments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Link
                                href="/tv-display"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                                <Tv className="w-4 h-4 text-amber-500" />
                                <span>Live TV</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </Link>

                            <Link
                                href="/tv-config/spotlight/create"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Spotlight Slide</span>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Spotlights</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Archived & Active</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Rotation
                            </div>
                            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mt-1">{stats.active_now}</div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Currently Visible on TV</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Published</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.published}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Scheduled or active</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Birthdays</div>
                            <div className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-1">{stats.birthday_count}</div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Celebrations active</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Drafts</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.drafts}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Pending review & approval</div>
                        </div>
                    </div>

                    {/* Approaching Birthday Suggestions (Auto-drafts from Faculty Directory) */}
                    {suggested_birthdays.length > 0 && (
                        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-r from-rose-50/80 via-pink-50/50 to-amber-50/60 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-amber-950/20 p-5 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                                        <Cake className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>Approaching Faculty Birthdays</span>
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                Next 14 Days
                                            </span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Auto-detected from faculty profiles. Reviews and approvals required before appearing on the TV display.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {suggested_birthdays.map((bday) => (
                                    <div
                                        key={bday.faculty_id}
                                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-xs flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                                                {bday.photo_url ? (
                                                    <img src={bday.photo_url} alt={bday.faculty_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Cake className="w-5 h-5 text-rose-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {bday.faculty_name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                    {bday.program}
                                                </div>
                                                <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
                                                    <PartyPopper className="w-3 h-3" />
                                                    <span>{bday.birthday_formatted}</span>
                                                    <span className="opacity-75">
                                                        ({bday.is_today ? 'TODAY!' : bday.days_away === 1 ? 'Tomorrow' : `in ${bday.days_away} days`})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                                            {bday.has_active_slide ? (
                                                <Link
                                                    href={`/tv-config/spotlight/${bday.existing_slide_id}/edit`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    Slide Ready
                                                </Link>
                                            ) : bday.photo_url ? (
                                                <Link
                                                    href={`/tv-config/spotlight/create?type=birthday&faculty_id=${bday.faculty_id}&headline=HAPPY%20BIRTHDAY%2C%20${encodeURIComponent(bday.title_name || bday.faculty_name)}!&message=${encodeURIComponent('Wishing you a joyful and fulfilling birthday! CIDS celebrates your dedication, wisdom, and excellence.')}&template=birthday&background_style=celebration-spark&start_at=${encodeURIComponent(bday.suggested_start)}&end_at=${encodeURIComponent(bday.suggested_end)}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Review & Create
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/tv-config/spotlight/create?type=birthday&faculty_id=${bday.faculty_id}&headline=HAPPY%20BIRTHDAY%2C%20${encodeURIComponent(bday.title_name || bday.faculty_name)}!&message=${encodeURIComponent('Wishing you a joyful and fulfilling birthday! CIDS celebrates your dedication, wisdom, and excellence.')}&template=birthday&background_style=celebration-spark&start_at=${encodeURIComponent(bday.suggested_start)}&end_at=${encodeURIComponent(bday.suggested_end)}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                                >
                                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                    Photo Needed
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilterChange(selectedType, selectedStatus, e.target.value);
                                }}
                                placeholder="Search honoree, headline, award..."
                                className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    handleFilterChange(e.target.value, selectedStatus, search);
                                }}
                                className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                {SPOTLIGHT_TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    handleFilterChange(selectedType, e.target.value, search);
                                }}
                                className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                <option value="all">All Statuses</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Spotlight Slide Grid Cards */}
                    {spotlights.data.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                            <Sparkles className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Spotlight Slides Found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Create your first celebratory spotlight slide for faculty achievements, awards, research publications, or birthdays.
                            </p>
                            <Link
                                href="/tv-config/spotlight/create"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors mt-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Spotlight
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {spotlights.data.map((slide) => {
                                const isPublished = slide.status === 'published';
                                const honoree = slide.effective_honoree_name || slide.honoree_name || 'Honoree';
                                const photo = slide.effective_photo_url || slide.photo_path || null;

                                return (
                                    <div
                                        key={slide.id}
                                        className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                                    >
                                        {/* 16:9 Thumbnail Mini-Hero Preview */}
                                        <div
                                            className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center p-3"
                                            onClick={() => setPreviewSlide(slide)}
                                        >
                                            <SpotlightSlideHero slide={slide} isPreview={true} />

                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                                                <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md">
                                                    <Eye className="w-3.5 h-3.5" /> Full 16:9 Preview
                                                </span>
                                            </div>

                                            {/* Priority Badge */}
                                            {slide.priority && slide.priority > 1 && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                                                    High Priority
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta & Info Body */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{slide.type}</span>
                                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                                                            {slide.subject_type === 'group_photo'
                                                                ? 'Group Photo'
                                                                : slide.subject_type === 'multiple'
                                                                    ? `${slide.honorees?.length || 2} Honorees`
                                                                    : slide.subject_type === 'team'
                                                                        ? 'Team Recognition'
                                                                        : slide.subject_type === 'program'
                                                                            ? 'Program Recognition'
                                                                            : 'Individual'}
                                                        </span>
                                                    </div>
                                                    <span>{slide.display_duration || 20}s duration</span>
                                                </div>

                                                <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                                                    {slide.headline}
                                                </h3>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                                    {slide.message}
                                                </p>
                                            </div>

                                            {/* Bottom Details Row */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                        {honoree}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePublish(slide)}
                                                        title={isPublished ? 'Unpublish (draft)' : 'Publish to TV Rotation'}
                                                        className={cn(
                                                            'px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer',
                                                            isPublished
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                                                        )}
                                                    >
                                                        {isPublished ? 'Live' : 'Draft'}
                                                    </button>

                                                    <Link
                                                        href={`/tv-config/spotlight/${slide.id}/edit`}
                                                        title="Edit Slide"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteSlide(slide)}
                                                        title="Delete Slide"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </TvStudioLayout>

            {/* Live 16:9 Fullscreen Modal Preview */}
            <Dialog open={!!previewSlide} onOpenChange={(open) => !open && setPreviewSlide(null)}>
                <DialogContent className="max-w-6xl p-0 overflow-hidden bg-slate-950 border-slate-800">
                    <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                        <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Tv className="w-4 h-4 text-amber-400" />
                            <span>16:9 TV High-Impact Preview — {previewSlide?.headline}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-4 md:p-8 flex items-center justify-center">
                        <div className="w-full aspect-video max-h-[75vh]">
                            {previewSlide && <SpotlightSlideHero slide={previewSlide} isPreview={false} />}
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Slide Duration: <strong className="text-white">{previewSlide?.display_duration || 20}s</strong> • Transition: <strong className="text-white">{previewSlide?.transition || 'zoom-fade'}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                            {previewSlide && (
                                <Link
                                    href={`/tv-config/spotlight/${previewSlide.id}/edit`}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                                >
                                    Edit This Slide
                                </Link>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setPreviewSlide(null)} className="text-xs">
                                Close Preview
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteSlide} onOpenChange={(open) => !open && setDeleteSlide(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                            Delete Spotlight Slide?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Are you sure you want to delete <strong className="text-rose-600">{deleteSlide?.headline}</strong>? This will permanently remove it from the TV playlist rotation.
                    </p>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setDeleteSlide(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            Delete Spotlight
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
