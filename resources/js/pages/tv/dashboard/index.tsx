import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import {
    Tv,
    Play,
    Layers,
    Clock,
    Calendar,
    Plus,
    Paintbrush,
    LayoutTemplate,
    Component,
    Settings,
    Eye,
    History,
    CheckCircle2,
    ArrowRight,
    ExternalLink,
    Wifi,
    Sparkles,
    ListVideo,
    MonitorCheck,
    Sliders,
    Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Studio Dashboard', href: '/tv-config/dashboard' },
];

interface Props {
    stats: {
        total_slides: number;
        active_slides: number;
        total_rotation_time: string;
        display_status: string;
        active_playlist: string;
        resolution: string;
        refresh_interval: string;
        connected_screens: number;
    };
    recent_slides: Array<{
        id: number;
        title: string;
        type: string;
        duration_seconds: number;
        is_active: boolean;
        order: number;
    }>;
    quick_actions: Array<{
        title: string;
        url: string;
        icon: string;
        external?: boolean;
    }>;
}

export default function TvStudioDashboardPage({ stats, recent_slides, quick_actions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV Studio Dashboard - CIDS OfficeHub" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Hero Header */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-amber-900/40 shadow-lg">
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/25 via-transparent to-transparent pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>TV Display Studio Workspace</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                                    Live TV Presentation Management
                                </h1>
                                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                                    Streamline college announcements, schedule grids, top faculty recognition, and real-time room utilization across CIDS hallway displays.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/tv-display"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0 border border-amber-500/30"
                                >
                                    <Tv className="w-4 h-4 text-slate-950" />
                                    <span>Launch Screen</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                                </Link>

                                <Link
                                    href="/tv-config/slides/builder"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 backdrop-blur-sm"
                                >
                                    <Paintbrush className="w-4 h-4 text-amber-400" />
                                    <span>Visual Builder</span>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Telemetry Bar */}
                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 block font-medium">Display Status</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {stats.display_status} (1 Client Active)
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-medium">Active Playlist</span>
                                <span className="text-white font-bold mt-0.5 block truncate">
                                    {stats.active_playlist}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-medium">Rotation Cycle</span>
                                <span className="text-amber-300 font-bold mt-0.5 block">
                                    {stats.total_rotation_time}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-medium">Resolution</span>
                                <span className="text-blue-300 font-bold mt-0.5 block">
                                    {stats.resolution}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                <span>Total Slides</span>
                                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {stats.total_slides}
                                </span>
                                <span className="text-xs text-slate-400">configured</span>
                            </div>
                            <Link href="/tv-config/slides" className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                <span>Manage slides</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                <span>Active in Playlist</span>
                                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {stats.active_slides}
                                </span>
                                <span className="text-xs text-emerald-600 font-semibold">Broadcasting</span>
                            </div>
                            <Link href="/tv-config/playlist" className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                <span>Reorder playlist</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                <span>Auto-Refresh Rate</span>
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {stats.refresh_interval}
                                </span>
                                <span className="text-xs text-slate-400">live poll</span>
                            </div>
                            <Link href="/tv-config/settings" className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                <span>Display settings</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                <span>Target Screens</span>
                                <MonitorCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {stats.connected_screens} Screen
                                </span>
                                <span className="text-xs text-purple-600 font-semibold">Main Lobby</span>
                            </div>
                            <Link href="/tv-config/preview" className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                <span>Preview 16:9</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Studio Modules Grid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                TV Studio Modules
                            </h2>
                            <span className="text-xs text-slate-400">Integrated presentation workflow</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/tv-config/playlist"
                                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-2xs"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <ListVideo className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-blue-600 transition-colors">
                                    Playlist Management
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Drag to reorder slide playback sequence, toggle individual slide visibility, and configure timings.
                                </p>
                            </Link>

                            <Link
                                href="/tv-config/slides/builder"
                                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-2xs"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Paintbrush className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-amber-600 transition-colors">
                                    Visual Slide Builder
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Drag-and-drop slide composition with spacious editing canvas, dynamic widgets, and visual properties inspector.
                                </p>
                            </Link>

                            <Link
                                href="/tv-config/templates"
                                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-2xs"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-purple-600 transition-colors">
                                    Predefined Slide Templates
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Pick ready-made templates for announcements, schedules, faculty honors, and exam countdowns.
                                </p>
                            </Link>
                        </div>
                    </div>

                    {/* Active Rotation Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Current Rotation Sequence
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Slides currently showing on connected TV displays in order of presentation
                                </p>
                            </div>
                            <Link
                                href="/tv-config/playlist"
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <span>Edit Playlist</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recent_slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                            #{index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {slide.title}
                                            </h4>
                                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                                {slide.type} · {slide.duration_seconds}s Duration
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                            slide.is_active
                                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        )}>
                                            {slide.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                        <Link
                                            href={`/tv-config/slides/${slide.id}/edit`}
                                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
