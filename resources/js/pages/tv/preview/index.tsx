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
                    <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between text-white select-none">
                        
                        {/* Safe Margins Guide Overlay */}
                        <div className="absolute inset-8 border border-dashed border-amber-400/20 pointer-events-none rounded-xl z-20" />

                        {/* Offline Simulator Warning */}
                        {simulateOffline && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xl animate-pulse">
                                <WifiOff className="w-3.5 h-3.5" />
                                <span>Network Disconnected · Running Local Cached Slides</span>
                            </div>
                        )}

                        {/* Real TV Display Embedded Iframe for 100% Fidelity Consistency */}
                        <iframe
                            key={`${simulateEmpty}-${simulateOffline}-${resolution}`}
                            src={`/tv-display?preview=1${mode === 'public' ? '&mode=public' : ''}`}
                            title="TV Display Live Output Preview"
                            className="w-full h-full border-0 absolute inset-0 z-10"
                            allow="fullscreen"
                        />
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
