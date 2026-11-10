import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Maximize2, Minimize2, Moon, Pause, Play, RefreshCw, Sun, Tv, ChevronDown } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export interface TvChannelItem {
    id: number;
    device_code: string;
    name: string;
    location?: string;
    college_name?: string;
    college_code?: string;
    channel_number?: number;
}

interface TvLayoutProps {
    children: React.ReactNode;
    currentTerm: string;
    title?: string;
    collegeTitle?: string;
    lastUpdated?: string;
    isDark?: boolean;
    onToggleDark?: () => void;
    isPaused?: boolean;
    onTogglePause?: () => void;
    showHeader?: boolean;
    showClock?: boolean;
    channels?: TvChannelItem[];
    currentChannel?: TvChannelItem | null;
    canSwitchChannels?: boolean;
}

export default function TvLayout({
    children,
    currentTerm,
    title,
    collegeTitle,
    lastUpdated,
    isDark = false,
    onToggleDark,
    isPaused = false,
    onTogglePause,
    showHeader = true,
    showClock = true,
    channels = [],
    currentChannel = null,
    canSwitchChannels = true,
}: TvLayoutProps) {
    const page = usePage<SharedData>();
    const { portal_context, active_branding } = page.props || {};

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);

    // Scope branding resolution
    const activeAssignment = portal_context?.active_assignment;
    const isCollegeScope = activeAssignment?.scope_type === 'College' ||
        activeAssignment?.portal_type === 'college_admin' ||
        activeAssignment?.portal_type === 'faculty' ||
        activeAssignment?.portal_type === 'dean' ||
        activeAssignment?.portal_type === 'program_head' ||
        activeAssignment?.portal_type === 'lab_in_charge' ||
        Boolean(currentChannel?.college_code || currentChannel?.college_name || collegeTitle);

    const brandLogo = active_branding?.logo_url || '/CIDS_Logo.png';

    // Rotating logos state
    // Outside college: Ascend and DSSC
    // College-wide: College logo, Ascend, DSSC
    const [logoIndex, setLogoIndex] = useState(0);

    const logoList = useMemo(() => {
        if (!isCollegeScope) {
            return ['/Ascend.png', '/DSSC.jpg'];
        }
        const list = [];
        if (brandLogo && brandLogo !== '/Ascend.png' && brandLogo !== '/DSSC.jpg') {
            list.push(brandLogo);
        }
        list.push('/Ascend.png');
        list.push('/DSSC.jpg');
        return list;
    }, [isCollegeScope, brandLogo]);

    useEffect(() => {
        if (logoList.length <= 1) return;
        const interval = setInterval(() => {
            setLogoIndex((prev) => (prev + 1) % logoList.length);
        }, 3800);
        return () => clearInterval(interval);
    }, [logoList]);

    const activeHeaderLogo = logoList[logoIndex] || brandLogo;

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
            isDark ? 'dark bg-[#060b14] text-slate-100' : 'bg-[#eef3f9] text-slate-900'
        }`}>
            {/* Header - Premium Institutional Deep Navy & Maroon Ribbon */}
            {showHeader && (
                <header className="relative px-6 sm:px-8 py-3 flex justify-between items-center z-40 shrink-0 sticky top-0 bg-gradient-to-r from-[#072445] via-[#0B3A67] via-50% to-[#581024] text-white shadow-lg border-b border-white/10 overflow-hidden">
                    {/* Subtle wavy overlay ribbon */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
                        <svg viewBox="0 0 1440 120" className="w-full h-full" fill="none" preserveAspectRatio="none">
                            <path d="M0,40 C320,80 640,0 960,40 C1280,80 1440,20 1440,20 L1440,120 L0,120 Z" fill="url(#tv-header-wave)" />
                            <defs>
                                <linearGradient id="tv-header-wave" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#175C94" stopOpacity="0.4" />
                                    <stop offset="60%" stopColor="#8B1E3F" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="#68152E" stopOpacity="0.9" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Brand & Subtitle: Dynamic Scope-aware rotating Logo + Deep Blue & Maroon Identity */}
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-white p-1 shadow-md border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                                <img
                                    key={activeHeaderLogo}
                                    src={activeHeaderLogo}
                                    alt="Portal Logo"
                                    className="h-full w-full object-contain animate-in fade-in zoom-in-95 duration-500"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-sky-200">
                                    DAVAO DEL SUR STATE COLLEGE · ASCEND
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-200 uppercase tracking-wider backdrop-blur-xs">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                                    LIVE
                                </span>

                                {/* Current Channel Badge */}
                                {currentChannel && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[10px] font-black text-sky-200 uppercase tracking-wider backdrop-blur-xs">
                                        <Tv size={11} className="text-sky-300" />
                                        CH {currentChannel.channel_number ? String(currentChannel.channel_number).padStart(2, '0') : '01'} · {currentChannel.college_code || 'CIDS'}
                                    </span>
                                )}

                                {isPaused && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B1E3F]/40 border border-rose-400/40 px-2.5 py-0.5 text-[10px] font-black text-rose-200 uppercase tracking-wider animate-pulse shadow-xs backdrop-blur-xs">
                                        <Pause size={10} className="fill-current" />
                                        PAUSED
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <h1 className="text-sm font-black tracking-tight text-white drop-shadow-xs">
                                    {collegeTitle || currentChannel?.college_name || 'COLLEGE OF INFORMATION AND DIGITAL SCIENCES'}
                                </h1>
                                {title && (
                                    <>
                                        <span className="text-white/40">|</span>
                                        <span className="text-xs font-bold text-sky-200 truncate drop-shadow-xs">
                                            {title}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date & Time Center/Right & Channel Remote Controls */}
                    <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                        {/* Channel Remote Switcher (For Institution Super Admin, VPAF, and College Admins) */}
                        {channels.length > 0 && canSwitchChannels && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsChannelMenuOpen((prev) => !prev)}
                                    title="Switch TV Channel (Institution Super Admin & VPAF remote)"
                                    className="h-9 px-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/15 text-white text-xs font-bold backdrop-blur-sm"
                                >
                                    <Tv size={14} className="text-sky-300" />
                                    <span>
                                        CH {currentChannel?.channel_number ?? 1}: {currentChannel?.college_code || currentChannel?.name || 'CIDS TV'}
                                    </span>
                                    <ChevronDown size={13} className={`transition-transform ${isChannelMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isChannelMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsChannelMenuOpen(false)}
                                        />
                                        <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-2 z-50 shadow-2xl border ${
                                            isDark ? 'bg-[#0f172a] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                                        }`}>
                                            <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 mb-1">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-[#175C94] dark:text-sky-400 flex items-center justify-between">
                                                    <span>Switch TV Channel</span>
                                                    <span>INSTITUTION / VPAF</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Select a college display to view live
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                                                {channels.map((chan) => {
                                                    const isSelected = currentChannel?.id === chan.id || (!currentChannel && chan.device_code === 'CIDS-MAIN');
                                                    return (
                                                        <button
                                                            key={chan.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsChannelMenuOpen(false);
                                                                router.visit(`/tv-display/${chan.device_code || chan.id}`, {
                                                                    preserveScroll: true,
                                                                });
                                                            }}
                                                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white font-bold shadow-xs'
                                                                    : isDark
                                                                    ? 'hover:bg-white/5 text-slate-200'
                                                                    : 'hover:bg-slate-100 text-slate-800'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold leading-tight">
                                                                    CH {chan.channel_number ? String(chan.channel_number).padStart(2, '0') : '01'} • {chan.name}
                                                                </span>
                                                                <span className={`text-[10px] ${isSelected ? 'text-white/80 font-semibold' : 'text-slate-400'}`}>
                                                                    {chan.college_name || chan.location || 'College Display'}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black/30 rounded-md text-white">
                                                                    NOW
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {showClock && (
                            <div className="text-right hidden md:block">
                                <div className="text-[11px] font-medium text-white/70">
                                    {formatDate(currentTime)}
                                </div>
                                <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight tabular-nums text-white leading-none mt-0.5 drop-shadow-xs">
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                        )}

                    {/* Pause / Resume Auto-Advance Button */}
                    {onTogglePause && (
                        <button
                            type="button"
                            onClick={onTogglePause}
                            title={isPaused ? 'Resume auto-advance (Key: Space or P)' : 'Pause auto-advance (Key: Space or P)'}
                            className={`h-9 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border text-xs font-black ${
                                isPaused
                                    ? 'bg-[#8B1E3F] text-white border-rose-400/50 ring-2 ring-rose-400/30 animate-pulse'
                                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                            }`}
                        >
                            {isPaused ? (
                                <>
                                    <Play size={14} className="fill-current text-white" />
                                    <span className="hidden sm:inline">RESUME</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={14} className="fill-current text-white" />
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
                            className="h-9 w-9 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 border border-white/20 bg-white/10 hover:bg-white/20 text-white"
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    )}

                    {/* Fullscreen Mode Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen (Key: F)' : 'Enter Fullscreen (Key: F)'}
                        className="h-9 w-9 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 border border-white/20 bg-white/10 hover:bg-white/20 text-white"
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    {/* Internal View Badge */}
                    <div className="px-3 py-1.5 rounded-xl shadow-sm border border-white/20 bg-white/10 backdrop-blur-md flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                            <Clock size={14} />
                        </div>
                        <div className="text-left flex flex-col justify-center">
                            <div className="text-[9.5px] font-black text-rose-300 uppercase tracking-widest leading-none">Internal View</div>
                            <div className="text-xs font-bold text-white mt-0.5 leading-none">
                                {currentTerm}
                            </div>
                            {lastUpdated && (
                                <div className="text-[9.5px] font-medium flex items-center gap-1 text-white/70 mt-0.5 leading-none">
                                    <RefreshCw size={8} className="text-sky-300" /> {lastUpdated}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 relative min-h-0 overflow-hidden bg-transparent flex flex-col">
                {children}
            </main>
        </div>
    );
}

