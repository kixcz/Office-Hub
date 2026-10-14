import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { 
    Eye, 
    Tv, 
    Monitor, 
    Maximize2, 
    Play, 
    Pause, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink, 
    Sparkles, 
    ShieldCheck, 
    CalendarCheck, 
    Trophy, 
    Building2, 
    Megaphone, 
    Users, 
    Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Preview & Testing', href: '/tv-config/preview' },
];

interface Slide {
    id: number;
    title: string;
    type: string;
    order: number;
    duration_seconds: number;
    config?: any;
}

interface Props {
    slides: Slide[];
    total_slides: number;
    default_resolution: string;
}

export default function TvPreviewTestingPage({ slides, total_slides, default_resolution }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [aspectMode, setAspectMode] = useState<'16:9' | '4:3'>('16:9');

    const activeSlide = slides[currentIndex] || slides[0];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preview & Testing - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <Eye className="w-4 h-4" />
                                <span>Quality Assurance</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                High-Fidelity 16:9 TV Preview & Testing
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Verify visual layout proportions, data source connectivity, and readability at authentic 4K/1080p TV resolution.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-display"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xs border border-amber-500/30 transition-colors cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Launch Actual Screen</span>
                            </Link>
                        </div>
                    </div>

                    {/* Simulation Controls Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border",
                                    isPlaying ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-amber-400 hover:bg-amber-500 border-amber-500/40 text-slate-950 shadow-2xs"
                                )}
                            >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                <span>{isPlaying ? 'Pause Rotation' : 'Auto Play'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                                Slide {currentIndex + 1} of {slides.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                            <span className="hidden sm:inline">Simulated TV: <strong>Samsung QLED 75&quot; 4K UHD</strong></span>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setAspectMode('16:9')}
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[11px] font-bold transition-colors",
                                        aspectMode === '16:9' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
                                    )}
                                >
                                    16:9 Widescreen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAspectMode('4:3')}
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[11px] font-bold transition-colors",
                                        aspectMode === '4:3' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
                                    )}
                                >
                                    4:3 Standard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TV Monitor Bezel Container */}
                    <div className="bg-slate-950 p-4 sm:p-8 rounded-3xl border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
                        {/* Monitor brand badge */}
                        <div className="w-full flex items-center justify-between pb-3 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                            <span>CIDS Smart TV Engine · Live Buffer</span>
                            <span>HDMI-1 · 3840x2160 @ 60Hz</span>
                        </div>

                        {/* 16:9 Virtual Display Screen */}
                        <div
                            className={cn(
                                "w-full max-w-5xl rounded-xl overflow-hidden bg-slate-900 text-white relative shadow-inner border border-slate-700/60 transition-all flex flex-col justify-between",
                                aspectMode === '16:9' ? "aspect-video" : "aspect-4/3 max-w-3xl"
                            )}
                        >
                            {/* Slide Content Header Bar */}
                            <div className="p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                                        CIDS
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-xl font-black text-white tracking-tight drop-shadow">
                                            {activeSlide?.title || 'Slide Title'}
                                        </h3>
                                        <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                                            Official Hallway Bulletin · {activeSlide?.type || 'General'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg sm:text-2xl font-black tabular-nums tracking-tight">
                                        10:45 AM
                                    </div>
                                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                                        Wednesday, Oct 14
                                    </div>
                                </div>
                            </div>

                            {/* Middle Body Rendering based on slide type */}
                            <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center items-center text-center space-y-4">
                                {activeSlide?.type?.includes('schedule') ? (
                                    <div className="w-full max-w-2xl bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 text-left">
                                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
                                            <span>Current Active Classes</span>
                                            <span>Room 304 & 305</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between">
                                                <span className="font-bold text-white text-sm">BSIT 3-A · Advanced Database Systems</span>
                                                <span className="text-blue-400 text-xs font-semibold">10:00 AM - 12:00 PM</span>
                                            </div>
                                            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between">
                                                <span className="font-bold text-white text-sm">BSCS 2-B · Data Structures & Algorithms</span>
                                                <span className="text-blue-400 text-xs font-semibold">10:30 AM - 01:30 PM</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeSlide?.type?.includes('leaderboard') || activeSlide?.type?.includes('faculty') ? (
                                    <div className="w-full max-w-2xl bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4">
                                        <div className="text-amber-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                                            <Trophy className="w-4 h-4" />
                                            <span>Outstanding Faculty Teaching Evaluations</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 pt-2">
                                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                                <span className="text-xl font-black text-amber-400">96.2%</span>
                                                <p className="text-xs font-bold text-white mt-1">Prof. Arnel Reyes</p>
                                                <span className="text-[10px] text-slate-400">BSIS Dept</span>
                                            </div>
                                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                                <span className="text-xl font-black text-slate-300">89.1%</span>
                                                <p className="text-xs font-bold text-white mt-1">Prof. Peter Parker</p>
                                                <span className="text-[10px] text-slate-400">BSIT Dept</span>
                                            </div>
                                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                                <span className="text-xl font-black text-amber-600">76.3%</span>
                                                <p className="text-xs font-bold text-white mt-1">Prof. Cristina Lopez</p>
                                                <span className="text-[10px] text-slate-400">BLIS Dept</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl space-y-3">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                                            <span>Campus Bulletin Announcement</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                                            {activeSlide?.title}
                                        </h2>
                                        <p className="text-sm text-slate-300 leading-relaxed font-normal">
                                            College of Information and Digital Sciences announcement details broadcasted across lobby displays.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Ticker / Progress Bar */}
                            <div className="p-4 bg-black/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span>Slide {currentIndex + 1} of {slides.length}</span>
                                <div className="w-1/2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                                    />
                                </div>
                                <span className="font-semibold text-slate-300">{activeSlide?.duration_seconds || 15}s Duration</span>
                            </div>
                        </div>

                        {/* Stand Base */}
                        <div className="w-32 h-3 bg-slate-700 rounded-b-xl mt-3" />
                    </div>

                    {/* Pre-flight Validation Checklist */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Pre-flight Display Validation
                            </h3>
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> All Checks Passed
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">16:9 Aspect Ratio</span>
                                    <span className="text-slate-500 dark:text-slate-400">No distortion or content clipping detected</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">Data Source Connectivity</span>
                                    <span className="text-slate-500 dark:text-slate-400">Schedule DB and Faculty API synced</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">Readability Distance</span>
                                    <span className="text-slate-500 dark:text-slate-400">Font sizes meet 10-foot viewing threshold</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
