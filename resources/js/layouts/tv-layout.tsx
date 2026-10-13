import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Maximize2, Minimize2, Moon, Pause, Play, RefreshCw, Sun } from 'lucide-react';

interface TvLayoutProps {
    children: React.ReactNode;
    currentTerm: string;
    title?: string;
    lastUpdated?: string;
    isDark?: boolean;
    onToggleDark?: () => void;
    isPaused?: boolean;
    onTogglePause?: () => void;
}

export default function TvLayout({
    children,
    currentTerm,
    title,
    lastUpdated,
    isDark = false,
    onToggleDark,
    isPaused = false,
    onTogglePause,
}: TvLayoutProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch((err) => {
                    console.error(`Error attempting to exit fullscreen: ${err.message}`);
                });
            }
        }
    }, []);

    // Global keyboard shortcut 'F' for Fullscreen
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggleFullscreen]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${
            isDark ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-[#f4f7fb] text-slate-900'
        }`}>
            {/* Header - Styled precisely after reference images */}
            <header className="px-8 py-3.5 flex justify-between items-center z-40 shrink-0 sticky top-0 transition-colors border-b border-black/[0.04] dark:border-white/[0.05]">
                {/* Brand & Subtitle */}
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <img
                            src="/CIDS_Logo.jpg"
                            alt="CIDS Logo"
                            className="h-10 w-auto rounded-lg object-contain shadow-xs"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-extrabold tracking-tight">
                                <span className={isDark ? 'text-white' : 'text-slate-900'}>CIDS</span>{' '}
                                <span className="text-amber-500 dark:text-amber-400">OfficeHub</span>{' '}
                                <span className={isDark ? 'text-white' : 'text-slate-900'}>TV</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                LIVE
                            </span>
                            {isPaused && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider animate-pulse shadow-xs">
                                    <Pause size={11} className="fill-current" />
                                    PAUSED
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                COLLEGE OF INFORMATION AND DIGITAL SCIENCES
                            </span>
                            {title && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                    <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
                                        {title}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date & Time Center/Right */}
                <div className="flex items-center gap-5">
                    <div className="text-right hidden md:block">
                        <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(currentTime)}
                        </div>
                        <div className={`text-2xl font-extrabold font-mono tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatTime(currentTime)}
                        </div>
                    </div>

                    {/* Pause / Resume Auto-Advance Button */}
                    {onTogglePause && (
                        <button
                            type="button"
                            onClick={onTogglePause}
                            title={isPaused ? 'Resume auto-advance (Key: Space or P)' : 'Pause auto-advance (Key: Space or P)'}
                            className={`h-10 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border text-xs font-extrabold ${
                                isPaused
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_14px_rgba(245,158,11,0.35)] animate-pulse'
                                    : isDark
                                    ? 'bg-[#131b2e] text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
                                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {isPaused ? (
                                <>
                                    <Play size={16} className="fill-current text-slate-950" />
                                    <span className="hidden sm:inline">RESUME</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={16} className="fill-current" />
                                    <span className="hidden sm:inline">PAUSE</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Dark / Light Mode Toggle */}
                    {onToggleDark && (
                        <button
                            type="button"
                            onClick={onToggleDark}
                            title={isDark ? 'Switch to Light Mode (Key: T)' : 'Switch to Dark Mode (Key: T)'}
                            className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 border ${
                                isDark
                                    ? 'bg-[#131b2e] text-amber-400 border-white/10 hover:bg-slate-800'
                                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-amber-600'
                            }`}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}

                    {/* Fullscreen Mode Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen (Key: F)' : 'Enter Fullscreen (Key: F)'}
                        className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 border ${
                            isDark
                                ? 'bg-[#131b2e] text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
                                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {/* Internal View Badge */}
                    <div className={`px-3.5 py-1.5 rounded-xl shadow-xs border flex items-center gap-2.5 ${
                        isDark ? 'bg-[#131b2e] border-white/10' : 'bg-white border-slate-200/80'
                    }`}>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock size={16} />
                        </div>
                        <div className="text-left flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none">Internal View</div>
                            <div className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {currentTerm}
                            </div>
                            {lastUpdated && (
                                <div className={`text-[10px] font-medium flex items-center gap-1 ${
                                    isDark ? 'text-slate-400' : 'text-slate-400'
                                }`}>
                                    <RefreshCw size={9} className="text-amber-500" /> {lastUpdated}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative min-h-0 overflow-hidden bg-transparent flex flex-col">
                {children}
            </main>
        </div>
    );
}

