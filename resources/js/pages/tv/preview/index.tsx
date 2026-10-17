import React, { useState, useEffect } from 'react';
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
    Clock,
    Lock,
    Unlock,
    WifiOff,
    Check,
    Layers,
    Sliders,
    Award,
    QrCode
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
    is_spotlight?: boolean;
}

interface Device {
    id: number;
    name: string;
    device_code: string;
    audience_mode: string;
    screen_resolution: string;
}

interface Props {
    slides: Slide[];
    total_slides: number;
    default_resolution: string;
    devices?: Device[];
    settings?: Record<string, string>;
}

export default function TvPreviewTestingPage({ slides, total_slides, default_resolution, devices = [], settings = {} }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [aspectMode, setAspectMode] = useState<'16:9' | '4:3'>('16:9');
    const [resolution, setResolution] = useState('1920 × 1080 (Full HD 16:9)');
    const [mode, setMode] = useState<'internal' | 'public'>('internal');
    const [simulateEmpty, setSimulateEmpty] = useState(false);
    const [simulateOffline, setSimulateOffline] = useState(false);
    const [countdown, setCountdown] = useState(15);

    const activeSlide = slides[currentIndex] || slides[0];
    const duration = activeSlide?.duration_seconds || 15;

    // Countdown and automatic rotation simulation
    useEffect(() => {
        if (!isPlaying || slides.length === 0) return;

        setCountdown(duration);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCurrentIndex((curr) => (curr + 1) % slides.length);
                    return duration;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, currentIndex, duration, slides.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setCountdown(slides[(currentIndex + 1) % slides.length]?.duration_seconds || 15);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setCountdown(slides[(currentIndex - 1 + slides.length) % slides.length]?.duration_seconds || 15);
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
                                <span>High-Fidelity QA & Simulation</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Live TV Display Preview & Testing
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                                Test playlist rotation, slide durations, resolution scaling, and privacy mode sanitation before publishing changes to physical display devices.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer",
                                    isPlaying
                                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                )}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                <span>{isPlaying ? 'Pause Playlist' : 'Preview Entire Playlist'}</span>
                            </button>

                            <Link
                                href="/tv-display"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Launch Actual Screen</span>
                            </Link>
                        </div>
                    </div>

                    {/* Simulation Controls Toolbar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                        {/* Playback & Step Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    title="Previous Slide"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                                    <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    title="Next Slide"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Duration Countdown Pill */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>{countdown}s remaining</span>
                            </div>

                            <span className="text-xs text-slate-400 font-medium">
                                Slide {currentIndex + 1} of {slides.length}
                            </span>
                        </div>

                        {/* Testing Mode Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Privacy Mode: Internal vs Public */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setMode('internal')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                                        mode === 'internal'
                                            ? "bg-amber-500 text-slate-950 shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <Lock className="w-3 h-3" />
                                    <span>Internal Staff</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('public')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                                        mode === 'public'
                                            ? "bg-sky-500 text-white shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <Unlock className="w-3 h-3" />
                                    <span>Public Mode</span>
                                </button>
                            </div>

                            {/* Resolution Selector */}
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-800 dark:text-slate-200"
                            >
                                <option>1920 × 1080 (Full HD 16:9)</option>
                                <option>3840 × 2160 (4K UHD TV)</option>
                                <option>1366 × 768 (Commercial Wall)</option>
                            </select>

                            {/* Simulation Toggles */}
                            <button
                                type="button"
                                onClick={() => setSimulateEmpty(!simulateEmpty)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                                    simulateEmpty
                                        ? "bg-rose-500 text-white border-rose-600"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                )}
                            >
                                {simulateEmpty ? 'Empty Data: ON' : 'Empty Data: OFF'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSimulateOffline(!simulateOffline)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                                    simulateOffline
                                        ? "bg-amber-500 text-slate-950 border-amber-600"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                )}
                            >
                                {simulateOffline ? 'Offline: SIMULATED' : 'Online State'}
                            </button>
                        </div>
                    </div>

                    {/* 16:9 Television Canvas Container */}
                    <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between p-6 text-white select-none">
                        
                        {/* Safe Margins Guide Overlay */}
                        <div className="absolute inset-8 border border-dashed border-amber-400/20 pointer-events-none rounded-xl" />

                        {/* Offline Simulator Warning */}
                        {simulateOffline && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xl animate-pulse">
                                <WifiOff className="w-3.5 h-3.5" />
                                <span>Network Disconnected · Running Local Cached Slides</span>
                            </div>
                        )}

                        {/* Television Header Chrome */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <img src="/CIDS_Logo.jpg" alt="CIDS" className="w-8 h-8 object-contain rounded" />
                                <div>
                                    <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                                        <span>CIDS</span>
                                        <span className="text-amber-400">OfficeHub</span>
                                        <span>TV</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-black tracking-widest ml-1">
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-medium tracking-wide">
                                        COLLEGE OF INFORMATION AND DIGITAL SCIENCES
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-200">
                                    AY 2026-2027, 1st Semester ❯
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                    Tuesday, October 17, 2026 11:32 AM
                                </div>
                            </div>
                        </div>

                        {/* Interactive Main Canvas Area */}
                        <div className="flex-1 my-3 flex flex-col justify-center items-center z-10">
                            {simulateEmpty ? (
                                <div className="text-center space-y-2 p-8 max-w-md">
                                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
                                    <h3 className="text-lg font-bold text-slate-300">No Current Records Found</h3>
                                    <p className="text-xs text-slate-500">
                                        The TV display gracefully handles empty queries with an institutional fallback announcement or QR scan target.
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col justify-between">
                                    {/* Active Slide Rendering Placeholder */}
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1 flex flex-col justify-between">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                                {activeSlide?.title || 'Slide Title'}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                                                {mode === 'public' ? 'Sanitized Public Mode (No Faculty Personal Names)' : 'Internal Staff Detailed Mode'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 my-auto">
                                            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Primary Data Stream</span>
                                                <h4 className="text-sm font-bold text-white">{activeSlide?.type}</h4>
                                                <p className="text-[11px] text-slate-400">
                                                    {mode === 'public'
                                                        ? 'Faculty names aggregated to program-level metrics only.'
                                                        : 'Displaying complete faculty names, individual submissions & room allocations.'}
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Compliance Status</span>
                                                <div className="text-2xl font-black text-emerald-400">82.5%</div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-4/5 h-full bg-emerald-500" />
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Scan for Details</span>
                                                    <p className="text-[10px] text-slate-300 mt-1">Scan from your seat</p>
                                                </div>
                                                <div className="w-12 h-12 rounded bg-white/15 p-1 flex items-center justify-center text-xs font-bold text-amber-400 border border-white/20">
                                                    <QrCode className="w-8 h-8" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/10">
                                            <span>Slide Duration: {duration}s</span>
                                            <span>Resolution Scale: {resolution.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Television Footer Chrome */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10 z-10 text-xs text-slate-400 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>Live TV rotation · <strong>CIDS OfficeHub</strong></span>
                                <span className="text-slate-600">|</span>
                                <span className="text-slate-300 font-semibold">{activeSlide?.title}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {slides.map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all",
                                                i === currentIndex ? "w-8 bg-amber-400" : "w-2 bg-white/20"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
