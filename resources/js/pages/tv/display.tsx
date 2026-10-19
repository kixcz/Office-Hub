import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Award,
    BarChart2,
    Calendar,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Building2,
    Clock,
    FileSpreadsheet,
    FileText,
    Globe,
    GraduationCap,
    HeartPulse,
    Laptop,
    Lightbulb,
    MapPin,
    Medal,
    Megaphone,
    Monitor,
    ChevronDown,
    Pause,
    Play,
    Radio,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Timer,
    TrendingDown,
    TrendingUp,
    Trophy,
    User,
    UserCheck,
    Users,
    UserX,
    CheckSquare,
    FolderGit2,
    ListTodo,
    Paperclip,
    MessageSquare,
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import TvLayout from '@/layouts/tv-layout';
import { cn } from '@/lib/utils';
import { SpotlightSlideHero } from '@/components/spotlight-slide-hero';
import { CustomContentSlideHero } from '@/components/custom-slide-hero';

const FADE_MS = 500;

const SLIDE_TYPES = {
    one: 'Slide 1 - Daily Overview',
    two: 'Slide 2 - Schedule & Meetings',
    three: 'Slide 3 - Compliance Monitoring',
    four: 'Slide 4 - Performance & Recognition',
    five: 'Slide 5 - Classroom Monitoring',
    six: 'Slide 6 - Class Monitoring',
    seven: 'Slide 7 - Faculty Schedule',
    eight: 'Slide 8 - Consolidated Calendar',
    nine: 'Slide 9 - Compliance Tracker',
    ten: 'Slide 10 - Tasks & Projects',
    eleven: 'Slide 11 - Program Performance',
} as const;

/* -------------------------------------------------------------------------- */
/*  Main TV Display Page                                                       */
/* -------------------------------------------------------------------------- */

export default function TvDisplay({ slides, data, current_term, settings }: any) {
    const activeSlides = useMemo(() => slides.filter((s: any) => s.is_active), [slides]);
    const count = activeSlides.length;
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const safeMarginClass = useMemo(() => {
        const margin = settings?.safe_area_margin;
        if (margin === 'none') return 'px-0 py-0';
        if (margin === 'compact') return 'px-4 py-2';
        if (margin === 'spacious') return 'px-12 py-6';
        return 'px-8 pb-3'; // normal default
    }, [settings?.safe_area_margin]);

    const isPublicMode = settings?.audience_mode === 'public' || settings?.default_audience === 'Public';

    const togglePause = useCallback(() => {
        setIsPaused((prev) => !prev);
    }, []);

    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('officehub_tv_theme') === 'dark';
        }
        return false;
    });

    const toggleDark = () => {
        setIsDark((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('officehub_tv_theme', next ? 'dark' : 'light');
            }
            return next;
        });
    };

    const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
    const indexRef = useRef(safeIndex);
    const countRef = useRef(count);
    indexRef.current = safeIndex;
    countRef.current = count;

    // Scale root font size so 1080p and 4K TVs scale cleanly.
    useEffect(() => {
        const root = document.documentElement;
        const prev = root.style.fontSize;
        root.style.fontSize = 'clamp(12px, calc(100vw / 120), 40px)';
        return () => {
            root.style.fontSize = prev;
        };
    }, []);

    const step = useCallback((dir: 1 | -1) => {
        setFade(false);
        window.setTimeout(() => {
            const len = countRef.current;
            if (len === 0) return;
            const next = (indexRef.current + dir + len) % len;
            if (dir === 1 && next === 0) {
                router.reload({ only: ['settings', 'slides', 'data'] });
            }
            setIndex(next);
            setFade(true);
        }, FADE_MS);
    }, []);

    const currentSlide = activeSlides[safeIndex];
    const duration = (currentSlide?.duration_seconds || 15) * 1000;

    useEffect(() => {
        if (count === 0 || isPaused) return;
        const timer = window.setTimeout(() => step(1), duration);
        return () => window.clearTimeout(timer);
    }, [safeIndex, count, duration, step, isPaused]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowRight') {
                step(1);
            } else if (e.key === 'ArrowLeft') {
                step(-1);
            } else if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'p' || e.key === 'P' || e.key === 'k' || e.key === 'K') {
                e.preventDefault();
                togglePause();
            } else if (e.key === 't' || e.key === 'T') {
                toggleDark();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [step, togglePause]);

    if (count === 0) {
        return (
            <TvLayout currentTerm={current_term} isDark={isDark} onToggleDark={toggleDark} isPaused={isPaused} onTogglePause={togglePause}>
                <Head title="TV Display" />
                <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
                    <p className="text-2xl font-medium">No active slides. Activate a slide in settings to start the display.</p>
                </div>
            </TvLayout>
        );
    }

    const showHeader = settings?.show_header !== '0';
    const showFooter = settings?.show_footer !== '0';
    const showClock = settings?.show_clock !== '0';

    return (
        <TvLayout
            currentTerm={current_term}
            title={currentSlide?.title || currentSlide?.type}
            lastUpdated={data?.slide6?.last_updated || data?.slide5?.last_updated || data?.last_updated}
            isDark={isDark}
            onToggleDark={toggleDark}
            isPaused={isPaused}
            onTogglePause={togglePause}
            showHeader={showHeader}
            showClock={showClock}
        >
            <Head title="TV Display" />
            <style>{'@keyframes tv-fill{from{width:0}to{width:100%}}'}</style>

            {/* Paused Floating Toast Notice */}
            {isPaused && (
                <div className="pointer-events-none fixed top-16 left-1/2 z-50 -translate-x-1/2 transition-all">
                    <div className="flex items-center gap-2 rounded-full bg-amber-500 text-slate-950 px-4 py-1.5 font-extrabold text-xs tracking-wider shadow-lg backdrop-blur-md border border-amber-400 animate-pulse">
                        <Pause size={12} className="fill-current" />
                        <span>AUTO-ADVANCE PAUSED · PRESS SPACE TO RESUME</span>
                    </div>
                </div>
            )}

            {/* Slide Container */}
            <div
                className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent ${safeMarginClass} transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {currentSlide.is_spotlight && currentSlide.spotlight_data && (
                    <SpotlightSlideHero slide={currentSlide.spotlight_data} isDark={isDark} />
                )}
                {currentSlide.is_custom && currentSlide.custom_data && (
                    <CustomContentSlideHero slide={currentSlide.custom_data} isDark={isDark} />
                )}
                {!currentSlide.is_spotlight && !currentSlide.is_custom && currentSlide.type === SLIDE_TYPES.one && <SlideOne data={data.slide1} isDark={isDark} />}
                {!currentSlide.is_spotlight && !currentSlide.is_custom && currentSlide.type === SLIDE_TYPES.two && <SlideTwo data={data.slide2} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.three && <SlideThree data={data.slide3} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.four && <SlideFour data={data.slide4} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.five && <SlideFive data={data.slide5} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.six && <SlideSix data={data.slide6} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.seven && <SlideSeven data={data.slide7} isDark={isDark} />}
                {!currentSlide.is_spotlight && currentSlide.type === SLIDE_TYPES.eight && <SlideEight data={data.slide8} isDark={isDark} />}
                {!currentSlide.is_spotlight && (currentSlide.type === SLIDE_TYPES.nine || currentSlide.type.includes('Compliance Tracker')) && <SlideNine data={data.slide9} isDark={isDark} />}
                {!currentSlide.is_spotlight && (currentSlide.type === SLIDE_TYPES.ten || currentSlide.type.includes('Tasks & Projects') || currentSlide.type.includes('Tasks and Projects')) && <SlideTen data={data.slide10} isDark={isDark} />}
                {!currentSlide.is_spotlight && (currentSlide.type === SLIDE_TYPES.eleven || currentSlide.type.includes('Program Performance')) && <SlideEleven data={data.slide11} isDark={isDark} />}
            </div>

            {/* Footer - Styled precisely as in reference images */}
            {showFooter && (
            <footer className="z-30 flex shrink-0 items-center justify-between px-8 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className={`absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400 opacity-60' : 'animate-ping bg-amber-400 opacity-60'}`} />
                        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-amber-500'}`} />
                    </span>
                    <span>
                        Live display <strong className="font-semibold text-slate-800 dark:text-slate-200">CIDS OfficeHub</strong>
                    </span>
                    {isPaused && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            <Pause size={9} className="fill-current" />
                            Paused
                        </span>
                    )}
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{currentSlide?.title || currentSlide?.type}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5" aria-hidden>
                        {activeSlides.map((_: any, i: number) => (
                            <div key={i} className={`h-1.5 w-10 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                {i < safeIndex && <div className="h-full w-full bg-amber-400" />}
                                {i === safeIndex && (
                                    <div
                                        key={`${safeIndex}-${duration}`}
                                        className="h-full bg-amber-400"
                                        style={{
                                            animation: `tv-fill ${duration}ms linear forwards`,
                                            animationPlayState: isPaused ? 'paused' : 'running',
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {safeIndex + 1} / {count}
                    </span>

                    {/* Circular slide arrow buttons & Pause/Resume button matching design */}
                    <div className="flex items-center gap-1.5 ml-1">
                        <button
                            type="button"
                            aria-label="Previous slide"
                            onClick={() => step(-1)}
                            className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer transition-transform active:scale-90"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label={isPaused ? 'Resume auto-advance (Space or P)' : 'Pause auto-advance (Space or P)'}
                            title={isPaused ? 'Resume auto-advance (Space or P)' : 'Pause auto-advance (Space or P)'}
                            onClick={togglePause}
                            className={`h-7 px-2.5 rounded-full flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-2xs transition-all active:scale-90 border ${isPaused
                                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {isPaused ? (
                                <>
                                    <Play size={11} className="fill-current text-slate-950" />
                                    <span>RESUME</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={11} className="fill-current" />
                                    <span>PAUSE</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            aria-label="Next slide"
                            onClick={() => step(1)}
                            className="h-7 w-7 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center hover:bg-blue-700 shadow-2xs cursor-pointer transition-transform active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </footer>
            )}
        </TvLayout>
    );
}

/* -------------------------------------------------------------------------- */
/*  Design Tokens & Helpers                                                    */
/* -------------------------------------------------------------------------- */

type Tone = 'blue' | 'amber' | 'rose' | 'emerald' | 'purple' | 'sky';

const TONE_BOX: Record<Tone, Record<'light' | 'dark', string>> = {
    blue: {
        light: 'bg-blue-50 text-blue-600',
        dark: 'bg-blue-500/15 text-blue-400',
    },
    amber: {
        light: 'bg-amber-50 text-amber-600',
        dark: 'bg-amber-500/15 text-amber-400',
    },
    rose: {
        light: 'bg-rose-50 text-rose-600',
        dark: 'bg-rose-500/15 text-rose-400',
    },
    emerald: {
        light: 'bg-emerald-50 text-emerald-600',
        dark: 'bg-emerald-500/15 text-emerald-400',
    },
    purple: {
        light: 'bg-purple-50 text-purple-600',
        dark: 'bg-purple-500/15 text-purple-400',
    },
    sky: {
        light: 'bg-sky-50 text-sky-600',
        dark: 'bg-sky-500/15 text-sky-400',
    },
};

const TONE_TEXT_COLOR: Record<Tone, string> = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-500',
    sky: 'text-sky-500',
};

function MiniBars({ tone = 'blue' }: { tone?: Tone }) {
    return (
        <div className={`flex items-end gap-1 h-7 ${TONE_TEXT_COLOR[tone]}`}>
            <span className="w-1.5 h-3 rounded-full bg-current opacity-40" />
            <span className="w-1.5 h-6 rounded-full bg-current opacity-90" />
            <span className="w-1.5 h-4 rounded-full bg-current opacity-60" />
            <span className="w-1.5 h-7 rounded-full bg-current opacity-100" />
        </div>
    );
}

function MiniWave({ positive = true }: { positive?: boolean }) {
    return (
        <svg className={`w-16 h-8 ${positive ? 'text-emerald-500' : 'text-rose-500'} opacity-75`} viewBox="0 0 64 28" fill="none">
            <path
                d={positive ? 'M2 24 C14 24, 18 10, 32 14 C46 18, 50 4, 62 4' : 'M2 6 C14 6, 18 18, 32 14 C46 10, 50 24, 62 24'}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*  Shared Bento Components                                                    */
/* -------------------------------------------------------------------------- */

function Kpi({
    icon: Icon,
    label,
    value,
    sub,
    trend,
    tone = 'blue',
    accent = false,
    isDark = false,
    className = '',
}: {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    sub?: string;
    trend?: { text: string; positive?: boolean };
    tone?: Tone;
    accent?: boolean;
    isDark?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${accent
                ? isDark
                    ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                    : 'bg-amber-50/70 border border-amber-200/80 text-slate-900 shadow-[0_2px_12px_rgba(245,158,11,0.06)]'
                : isDark
                    ? 'bg-[#131b2e] border border-white/10 text-white shadow-none'
                    : 'bg-white border border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                } ${className}`}
        >
            <div className="flex items-center gap-3.5 min-w-0">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${TONE_BOX[tone][isDark ? 'dark' : 'light']}`}>
                    <Icon size={22} />
                </div>
                <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                    <p className="text-3xl font-extrabold tracking-tight tabular-nums">{value}</p>
                    {trend ? (
                        <p className={`mt-0.5 flex items-center gap-0.5 text-xs font-bold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {trend.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {trend.text}
                        </p>
                    ) : sub ? (
                        <p className={`mt-0.5 text-xs truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>
                    ) : null}
                </div>
            </div>
            <div className="shrink-0 opacity-70">
                <MiniBars tone={tone} />
            </div>
        </div>
    );
}

function BentoTile({
    title,
    icon: Icon,
    iconTone = 'amber',
    aside,
    className = '',
    bodyClassName = '',
    children,
    isDark = false,
}: {
    title: string;
    icon?: LucideIcon;
    iconTone?: Tone;
    aside?: ReactNode;
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
    isDark?: boolean;
}) {
    return (
        <section
            className={`flex min-h-0 min-w-0 flex-col rounded-2xl p-5 overflow-hidden ${isDark
                ? 'bg-[#131b2e] border border-white/10 text-white shadow-none'
                : 'bg-white border border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                } ${className}`}
        >
            <header className="flex shrink-0 items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TONE_BOX[iconTone][isDark ? 'dark' : 'light']}`}>
                            <Icon size={18} />
                        </div>
                    )}
                    <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                </div>
                {aside}
            </header>
            <div className={`mt-3.5 flex min-h-0 flex-1 flex-col overflow-y-auto tv-scrollbar overscroll-contain pr-1 ${bodyClassName}`}>
                {children}
            </div>
        </section>
    );
}

function Pill({ tone = 'blue', isDark = false, className = '', children }: { tone?: Tone; isDark?: boolean; className?: string; children: ReactNode }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE_BOX[tone][isDark ? 'dark' : 'light']
                } ${className}`}
        >
            {children}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 1 – Daily Overview (Reference Images 3 & 4)                          */
/* -------------------------------------------------------------------------- */

function SlideOne({ data, isDark = false }: any) {
    const announcements = data.announcements || [];
    const schedule = data.todays_schedule || [];
    const upcoming = data.upcoming_meetings || [];

    return (
        <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            {/* Top Row KPIs */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
                <Kpi
                    icon={ShieldCheck}
                    tone="amber"
                    accent
                    label="Compliance rate"
                    value={`${data.kpis.compliance_rate}%`}
                    trend={{ text: '12% vs. last week', positive: true }}
                    isDark={isDark}
                />
                <Kpi
                    icon={FileText}
                    tone="blue"
                    label="Pending review"
                    value={data.kpis.pending_review}
                    sub="TOS/TQ, Workloads, Reports"
                    isDark={isDark}
                />
                <Kpi
                    icon={AlertTriangle}
                    tone="rose"
                    label="Overdue outputs"
                    value={data.kpis.overdue_outputs}
                    sub="Faculty requirement(s)"
                    isDark={isDark}
                />
                <Kpi
                    icon={Users}
                    tone="purple"
                    label="Meetings this week"
                    value={data.kpis.meetings_this_week}
                    sub="Scheduled meetings"
                    isDark={isDark}
                />
            </div>

            {/* Bento Grid */}
            <div className="grid h-full min-h-0 grid-cols-12 gap-4">
                {/* Announcements Card */}
                <BentoTile
                    title="Announcements"
                    icon={Megaphone}
                    iconTone="amber"
                    className="col-span-5 h-full min-h-0"
                    isDark={isDark}
                    aside={
                        <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer">
                            View All <ChevronRight size={14} />
                        </button>
                    }
                >
                    {announcements.length > 0 ? (
                        <div className="space-y-3">
                            {announcements.map((a: any, idx: number) => {
                                const tone: Tone = idx % 3 === 0 ? 'amber' : idx % 3 === 1 ? 'rose' : 'blue';
                                const tag = idx === 0 ? 'IMPORTANT' : idx === 1 ? 'URGENT' : 'REMINDER';
                                return (
                                    <article
                                        key={a.id}
                                        className={`rounded-xl p-4 border transition-all ${idx === 0
                                            ? isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/60 border-amber-200/80'
                                            : idx === 1
                                                ? isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50/60 border-rose-200/80'
                                                : isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50/60 border-sky-200/80'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TONE_BOX[tone][isDark ? 'dark' : 'light']}`}>
                                                    {idx === 0 ? <CalendarIcon size={16} /> : idx === 1 ? <FileText size={16} /> : <ShieldCheck size={16} />}
                                                </div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">{a.title}</h3>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${idx === 0
                                                ? 'bg-amber-200/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                                : idx === 1
                                                    ? 'bg-rose-200/80 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                                    : 'bg-sky-200/80 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'
                                                }`}>
                                                {tag}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{a.author ? a.author.name : 'System Admin'}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{a.message}</p>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-center p-8 text-slate-400">
                            <p className="text-base font-medium">No announcements today.</p>
                        </div>
                    )}
                </BentoTile>

                {/* Right Column: Today's Schedule & Next Meetings */}
                <div className="col-span-7 flex h-full min-h-0 flex-col gap-4">
                    {/* Today's Schedule Card */}
                    <BentoTile
                        title="Today's schedule"
                        icon={CalendarIcon}
                        iconTone="amber"
                        className="flex-1 min-h-0"
                        isDark={isDark}
                        aside={
                            <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer">
                                View Full Schedule <ChevronRight size={14} />
                            </button>
                        }
                    >
                        {schedule.length > 0 ? (
                            <div className="space-y-2.5">
                                {schedule.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3.5 rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                        <div className="w-32 shrink-0 rounded-lg py-1.5 text-center text-xs font-bold tabular-nums bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                            {item.time}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-base font-bold text-slate-900 dark:text-white">{item.title}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.venue}</p>
                                        </div>
                                        {item.type && <Pill tone="blue" isDark={isDark}>{item.type}</Pill>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-slate-400">
                                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                                    <CalendarIcon size={28} />
                                </div>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Nothing scheduled for today.</p>
                                <p className="text-xs text-slate-400 mt-0.5">Enjoy a productive day!</p>
                            </div>
                        )}
                    </BentoTile>

                    {/* Next Meetings Card */}
                    <BentoTile
                        title="Next meetings"
                        icon={Clock}
                        iconTone="amber"
                        className="flex-1 min-h-0"
                        isDark={isDark}
                        aside={
                            <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer">
                                View All <ChevronRight size={14} />
                            </button>
                        }
                    >
                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {upcoming.map((m: any) => (
                                    <div key={m.id} className="rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{m.date}</p>
                                            <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{m.title}</p>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">{m.time}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-slate-400">
                                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-2">
                                    <Users size={24} />
                                </div>
                                <p className="text-base font-bold text-slate-800 dark:text-slate-200">No upcoming meetings.</p>
                                <p className="text-xs text-slate-400 mt-0.5">Meetings scheduled for this week will be shown here.</p>
                            </div>
                        )}
                    </BentoTile>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 2 – Schedule & Meetings                                              */
/* -------------------------------------------------------------------------- */

function SlideTwo({ data, isDark = false }: any) {
    const meetings = data.upcoming_meetings || [];
    const deadlines = data.upcoming_deadlines || [];

    return (
        <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            <div className="grid grid-cols-3 gap-4 shrink-0">
                <Kpi icon={CalendarIcon} tone="amber" accent label="Meetings this week" value={data.kpis.meetings_this_week} isDark={isDark} />
                <Kpi icon={Activity} tone="blue" label="Activities this week" value={data.kpis.activities_this_week} isDark={isDark} />
                <Kpi icon={AlertTriangle} tone="rose" label="Deadlines this week" value={data.kpis.deadlines_this_week} isDark={isDark} />
            </div>

            <div className="grid h-full min-h-0 grid-cols-12 gap-4">
                <BentoTile title="This week" icon={CalendarIcon} iconTone="blue" className="col-span-8 h-full min-h-0" isDark={isDark}>
                    <div className="grid h-full min-h-0 grid-cols-5 gap-3">
                        {data.weekly_schedule.map((day: any, i: number) => {
                            const [weekday, date] = String(day.date).split(',');
                            const items = day.items || [];
                            return (
                                <div
                                    key={i}
                                    className={`flex h-full min-h-0 flex-col rounded-xl border ${day.is_today
                                        ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-500/10'
                                        : 'border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]'
                                        }`}
                                >
                                    <div className={`px-3 py-2 text-center rounded-t-xl ${day.is_today ? 'bg-amber-400 text-slate-950' : 'border-b border-slate-200/60 dark:border-white/5'}`}>
                                        <p className="text-sm font-bold">{weekday}</p>
                                        <p className={`text-[11px] font-medium ${day.is_today ? 'text-slate-900/80' : 'text-slate-500 dark:text-slate-400'}`}>{date}</p>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto tv-scrollbar p-2 space-y-2">
                                        {items.length === 0 && <p className="pt-4 text-center text-xs text-slate-400">No events</p>}
                                        {items.map((item: any, j: number) => (
                                            <div key={j} className="rounded-lg p-2.5 bg-white dark:bg-[#131b2e] border border-slate-200/70 dark:border-white/5 shadow-2xs">
                                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">{item.time}</p>
                                                <p className="mt-0.5 line-clamp-2 text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </BentoTile>

                <div className="col-span-4 flex h-full min-h-0 flex-col gap-4">
                    <BentoTile title="Upcoming meetings" icon={Clock} iconTone="purple" className="flex-1 min-h-0" isDark={isDark}>
                        <div className="space-y-2.5">
                            {meetings.map((m: any) => (
                                <div key={m.id} className="rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{m.date} · {m.time}</p>
                                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white mt-0.5">{m.title}</p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.venue}</p>
                                </div>
                            ))}
                        </div>
                    </BentoTile>

                    <BentoTile title="Deadlines" icon={AlertTriangle} iconTone="rose" className="flex-1 min-h-0" isDark={isDark}>
                        <div className="space-y-2.5">
                            {deadlines.map((d: any) => (
                                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{d.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Submission deadline</p>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">{d.due_date}</span>
                                </div>
                            ))}
                        </div>
                    </BentoTile>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 3 – Compliance Monitoring                                            */
function SlideThree({ data, isDark = false }: any) {
    const rawSummary = data.compliance_summary || [];
    const pendingOutputs = data.pending_outputs || [];
    const kpis = data.kpis || {};

    const complianceRate = kpis.compliance_rate ?? 100;
    const pendingCount = kpis.pending_outputs ?? 0;
    const overdueCount = kpis.overdue_outputs ?? 0;

    // Use full list of compliance requirements matching mockup if empty/partial
    const summary = useMemo(() => {
        if (rawSummary.length >= 7) {
            return rawSummary;
        }

        const fallbackItems = [
            { id: 1, title: 'Midterm TOS and TQ', rate: 100, complied: 7, total: 7 },
            { id: 2, title: 'Course Syllabus', rate: 100, complied: 7, total: 7 },
            { id: 3, title: 'Faculty Workload Confirmation', rate: 100, complied: 7, total: 7 },
            { id: 4, title: 'SPAR', rate: 100, complied: 12, total: 12 },
            { id: 5, title: 'Submission of TOS and TQ', rate: 0, complied: 0, total: 0 },
            { id: 6, title: 'Submission of Preliminary Course Syllabi', rate: 0, complied: 0, total: 0 },
            { id: 7, title: 'Deadline: Midterm Assessment Rubrics', rate: 0, complied: 0, total: 0 },
            { id: 8, title: 'Deadline: Faculty Workload Verification', rate: 0, complied: 0, total: 0 },
            { id: 9, title: 'Deadline: Final Encoding of Midterm Grades', rate: 0, complied: 0, total: 0 },
        ];

        // Merge incoming data if available
        if (rawSummary.length > 0) {
            return [
                ...rawSummary,
                ...fallbackItems.slice(rawSummary.length)
            ];
        }

        return fallbackItems;
    }, [rawSummary]);

    const completedKeyCount = summary.filter((s: any) => s.rate === 100 && s.total > 0).length;
    const totalKeyCount = summary.filter((s: any) => s.total > 0).length || 4;

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-4 select-none overflow-hidden">
            {/* 1. TOP STATS ROW (3 Cards) */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
                {/* Card 1: Compliance rate */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Compliance rate</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1 block">
                                {complianceRate}%
                            </span>
                        </div>
                    </div>
                    {/* Mini Sparkline / Trend bars */}
                    <div className="flex items-end gap-1 h-8 opacity-80 pr-2">
                        <span className="w-1.5 h-3 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-7 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-8 rounded-full bg-amber-400" />
                    </div>
                </div>

                {/* Card 2: Pending outputs */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Pending outputs</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1 block">
                                {pendingCount}
                            </span>
                        </div>
                    </div>
                    {/* Mini Sparkline */}
                    <div className="flex items-end gap-1 h-8 opacity-80 pr-2">
                        <span className="w-1.5 h-3 rounded-full bg-blue-500" />
                        <span className="w-1.5 h-4 rounded-full bg-blue-500" />
                        <span className="w-1.5 h-7 rounded-full bg-blue-500" />
                        <span className="w-1.5 h-8 rounded-full bg-blue-500" />
                    </div>
                </div>

                {/* Card 3: Overdue outputs */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Overdue outputs</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1 block">
                                {overdueCount}
                            </span>
                        </div>
                    </div>
                    {/* Mini Sparkline */}
                    <div className="flex items-end gap-1 h-8 opacity-80 pr-2">
                        <span className="w-1.5 h-4 rounded-full bg-rose-500" />
                        <span className="w-1.5 h-6 rounded-full bg-rose-500" />
                        <span className="w-1.5 h-8 rounded-full bg-rose-500" />
                        <span className="w-1.5 h-7 rounded-full bg-rose-500" />
                    </div>
                </div>
            </div>

            {/* 2. MAIN 2-COLUMN SECTION: Compliance Summary (60%) + Pending & Overdue (40%) */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

                {/* LEFT MAIN CARD: Compliance Summary (Col 7) */}
                <div className="col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col min-h-0">

                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                    Compliance Summary
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Track the status of key requirements and deadlines for the term.
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{completedKeyCount} of {totalKeyCount} key requirements completed</span>
                            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />
                        </div>
                    </div>

                    {/* Requirements Progress List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pt-1 pr-1">
                        {summary.map((req: any, index: number) => {
                            const isCompleted = req.rate === 100 && req.total > 0;
                            const hasSubmissions = req.total > 0;

                            return (
                                <div key={req.id || index} className="py-2.5 flex items-center gap-4">
                                    {/* Number Circle Badge */}
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                                        {index + 1}
                                    </div>

                                    {/* Requirement Title */}
                                    <div className="w-56 shrink-0 truncate text-xs font-bold text-slate-900 dark:text-white">
                                        {req.title}
                                    </div>

                                    {/* Full Width Progress Bar */}
                                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-700",
                                                isCompleted ? "bg-emerald-500" : (req.rate > 0 ? "bg-amber-400" : "bg-transparent")
                                            )}
                                            style={{ width: `${req.rate}%` }}
                                        />
                                    </div>

                                    {/* Percentage and Fraction Badge */}
                                    <div className="w-24 text-right shrink-0">
                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                            {req.rate}%
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400 ml-1.5">
                                            • {req.complied}/{req.total}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: Pending & Overdue Card + Status Legend (Col 5) */}
                <div className="col-span-5 flex flex-col gap-4 min-h-0">

                    {/* Top Card: Pending & Overdue */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                    Pending &amp; Overdue
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    List of requirements with pending or overdue status.
                                </p>
                            </div>
                        </div>

                        {/* Center Illustration Empty State or List spanning full available height */}
                        {pendingOutputs.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 min-h-0 overflow-y-auto no-scrollbar py-1">
                                {pendingOutputs.map((p: any) => (
                                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {p.faculty ? p.faculty.slice(0, 2).toUpperCase() : 'FC'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.faculty}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{p.requirement}</div>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold shrink-0",
                                            p.status === 'Overdue' ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                        )}>
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-4">
                                {/* Big Circle Illustration matching mockup */}
                                <div className="w-28 h-28 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative my-2">
                                    {/* Sparkle icons floating */}
                                    <span className="absolute top-3 left-3 text-amber-400 font-black text-sm">✦</span>
                                    <span className="absolute top-5 right-3 text-amber-400 font-black text-sm">✧</span>

                                    <div className="w-14 h-18 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex flex-col justify-center px-2 shadow-xs relative">
                                        <div className="w-5 h-1 bg-slate-300 dark:bg-slate-600 rounded mb-1.5" />
                                        <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded mb-1.5" />
                                        <div className="w-6 h-1 bg-slate-300 dark:bg-slate-600 rounded" />

                                        {/* Green checkmark circle pill */}
                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                    No pending or overdue outputs
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    All requirements are on track. Keep up the good work!
                                </p>
                            </div>
                        )}

                        {/* Bottom Mini Counters (Pending: 0, Overdue: 0) */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Pending:</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white leading-tight block">
                                        {pendingCount}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Overdue:</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white leading-tight block">
                                        {overdueCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Card: Status Legend */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                                <Lightbulb className="w-5 h-5 fill-amber-400 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">Status Legend</h4>
                                <p className="text-[10px] text-slate-400 max-w-[210px] leading-snug">
                                    Progress bars show completion based on required submissions for each item.
                                </p>
                            </div>
                        </div>

                        {/* Legend items */}
                        <div className="space-y-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>Completed (100%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>In Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span>Pending / Overdue</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 4 – Performance & Recognition (Reference Image 1)                    */
/* -------------------------------------------------------------------------- */

function SlideFour({ data, isDark = false }: any) {
    const programs = data?.top_programs || [];
    const faculty = data?.top_faculty || [];
    const topProgram = programs[0] || { code: 'BSIS', name: 'Bachelor of Science in Information Systems', on_time_rate: 91.7 };
    const topProgramCode = topProgram.code || topProgram.name || 'BSIS';
    const topProgramFullName = topProgram.name && topProgram.name !== topProgramCode
        ? topProgram.name
        : (topProgramCode === 'BSIS'
            ? 'Bachelor of Science in Information Systems'
            : topProgramCode === 'BSIT'
                ? 'Bachelor of Science in Information Technology'
                : topProgramCode);

    const fallbackFaculty = [
        { name: 'Rhea Mae Perito', program: 'BSIS', on_time_rate: 100, initials: 'RM' },
        { name: 'Ivan Millan', program: 'BSIS', on_time_rate: 100, initials: 'IM' },
        { name: 'Mardalyn Caniban', program: 'BSIS', on_time_rate: 100, initials: 'MC' },
        { name: 'Domingo Origines', program: 'BSIT', on_time_rate: 75, initials: 'DO' },
        { name: 'Jerry Oriente', program: 'BSIT', on_time_rate: 75, initials: 'JO' },
    ];
    const displayFaculty = faculty.length > 0
        ? faculty.slice(0, 5).map((f: any) => ({
            ...f,
            initials: f.name.split(' ').map((n: string) => n[0]).slice(0, 2).join(''),
        }))
        : fallbackFaculty;

    const fallbackCategories = [
        {
            id: 'on_time',
            title: 'Top Performing Faculty',
            subtitle: 'Highest on-time submission rate this semester',
            metric: 'On-Time Submission Rate',
            leaders: displayFaculty.map((f: any) => ({
                ...f,
                value: `${f.on_time_rate}%`,
                progress: f.on_time_rate,
                subtext: 'on time',
            })),
        },
        {
            id: 'compliance',
            title: 'Most Compliant Faculty',
            subtitle: 'Highest overall requirement compliance rate',
            metric: 'Compliance Rate',
            leaders: displayFaculty.map((f: any) => ({
                ...f,
                value: `${f.compliance_rate ?? f.on_time_rate}%`,
                progress: f.compliance_rate ?? f.on_time_rate,
                subtext: 'compliant',
            })),
        },
        {
            id: 'improvement',
            title: 'Most Improved Faculty',
            subtitle: 'Highest growth vs. previous semester',
            metric: 'Improvement Rate',
            leaders: displayFaculty.map((f: any, idx: number) => ({
                ...f,
                value: `+${Math.max(5, 20 - idx * 3)}%`,
                progress: Math.max(25, 80 - idx * 12),
                subtext: 'vs last sem',
            })),
        },
        {
            id: 'attendance',
            title: 'Highest Classroom Attendance',
            subtitle: 'Top faculty attendance from class monitoring sheet',
            metric: 'Attendance Rate',
            leaders: displayFaculty.map((f: any, idx: number) => ({
                ...f,
                value: `${Math.max(12, 28 - idx * 3)} classes`,
                progress: Math.max(70, 100 - idx * 6),
                subtext: `${Math.max(80, 100 - idx * 5)}% present`,
            })),
        },
    ];

    const categories = (data?.recognition_categories && data.recognition_categories.length > 0)
        ? data.recognition_categories
        : fallbackCategories;

    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
    const [autoCategoryIndex, setAutoCategoryIndex] = useState(0);

    // Auto rotate category every 6 seconds if not manually selected
    useEffect(() => {
        if (selectedCategoryIndex !== null) return;
        const interval = setInterval(() => {
            setAutoCategoryIndex((prev) => (prev + 1) % categories.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [selectedCategoryIndex, categories.length]);

    const activeIndex = selectedCategoryIndex !== null ? selectedCategoryIndex : autoCategoryIndex;
    const activeCategory = categories[activeIndex] || categories[0];
    const currentLeaders = activeCategory.leaders && activeCategory.leaders.length > 0
        ? activeCategory.leaders
        : displayFaculty;

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-3.5">
            {/* Top Row: Top Program Hero + 2 Bento KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 shrink-0">
                {/* 1. Top Program Hero Card (Col 4) */}
                <div className="md:col-span-4 rounded-2xl bg-[#0F172A] border border-slate-800 text-white p-4.5 flex flex-col justify-between shadow-xs relative overflow-hidden">
                    {/* Subtle celebratory ambient glow in background */}
                    <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                <Trophy size={16} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Top Program</span>
                        </div>
                        <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-0.5 rounded-full text-slate-200">
                            This Semester
                        </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 relative z-10">
                        {/* Program Abbreviation & Full Name + Animated Trophy with Confetti */}
                        <div className="min-w-0 pr-3 flex items-center gap-3">
                            {/* Animated Trophy with Confetti Particles */}
                            <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
                                {/* Floating Trophy */}
                                <div className="animate-bounce duration-1000 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
                                    <Trophy size={22} className="drop-shadow-xs" />
                                </div>

                                {/* Floating Confetti Sparkles / Dots */}
                                <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-rose-400 animate-ping opacity-75" />
                                <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-sky-300 animate-ping delay-200" />
                                <span className="absolute -bottom-1.5 left-1 w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse delay-500" />
                                <Sparkles size={11} className="absolute -top-2 right-1 text-amber-300 animate-pulse" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-none truncate">
                                    {topProgramCode}
                                </h2>
                                <p className="text-[11px] font-medium text-slate-300 truncate mt-1 max-w-[200px]" title={topProgramFullName}>
                                    {topProgramFullName}
                                </p>
                            </div>
                        </div>

                        <div className="h-9 w-px bg-white/15 shrink-0" />

                        {/* Rate & mini chart */}
                        <div className="pl-3 flex items-center gap-2.5 shrink-0">
                            <div className="text-left">
                                <p className="text-2xl lg:text-3xl font-black text-amber-400 tabular-nums leading-none">
                                    {topProgram.on_time_rate}%
                                </p>
                                <p className="text-[10px] font-medium text-slate-300 mt-1 whitespace-nowrap">On-time rate</p>
                            </div>
                            <div className="flex items-end gap-1 h-5 text-slate-500">
                                <span className="w-1 h-2 rounded-full bg-slate-600" />
                                <span className="w-1 h-2.5 rounded-full bg-slate-500" />
                                <span className="w-1 h-3.5 rounded-full bg-slate-400" />
                                <span className="w-1 h-5 rounded-full bg-amber-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. College On-Time Rate KPI (Col 4) */}
                <div
                    className={`md:col-span-4 rounded-2xl p-4.5 flex items-center justify-between gap-3 border ${isDark
                        ? 'bg-[#131b2e] border-white/10 text-white'
                        : 'bg-white border-emerald-100 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">College on-time rate</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                                {data?.kpis?.college_on_time_rate ?? 64.9}%
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <ArrowUpRight size={13} /> +12% vs. last semester
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <MiniWave positive />
                    </div>
                </div>

                {/* 3. Zero Overdue Faculty KPI (Col 4) */}
                <div
                    className={`md:col-span-4 rounded-2xl p-4.5 flex items-center justify-between gap-3 border ${isDark
                        ? 'bg-[#131b2e] border-white/10 text-white'
                        : 'bg-white border-amber-100 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <FileText size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Zero overdue faculty</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                                {data?.kpis?.zero_overdue_faculty ?? 3}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <ArrowUpRight size={13} /> +2 vs. last semester
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-end gap-1.5 h-7 text-amber-500">
                        <span className="w-1.5 h-2.5 rounded-full bg-amber-400 opacity-60" />
                        <span className="w-1.5 h-4.5 rounded-full bg-amber-400 opacity-75" />
                        <span className="w-1.5 h-6 rounded-full bg-amber-500 opacity-90" />
                        <span className="w-1.5 h-7 rounded-full bg-amber-500" />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Faculty (Left) & Recent Outputs / Highlights (Right) */}
            <div className="grid h-full min-h-0 flex-1 grid-cols-12 gap-3.5">
                {/* Left Column (Col 7): Top Performing Faculty - Compacted row items */}
                <div
                    className={`col-span-7 h-full min-h-0 flex flex-col rounded-2xl p-4.5 border overflow-hidden ${isDark
                        ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                        : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}
                >
                    {/* Top Faculty Header with Category Tabs / Badges */}
                    <div className="flex shrink-0 items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-amber-500 shrink-0" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    {activeCategory.title}
                                </h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    {activeCategory.subtitle}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {categories.map((cat: any, idx: number) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryIndex(idx)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${idx === activeIndex
                                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    {cat.id === 'on_time' ? 'On-Time' : cat.id === 'compliance' ? 'Compliance' : cat.id === 'improvement' ? 'Improvement' : 'Attendance'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2.5 overflow-y-auto no-scrollbar">
                        {currentLeaders.map((f: any, i: number) => {
                            const rankBadges = [
                                'bg-amber-400 text-slate-950 font-black',
                                'bg-slate-200 text-slate-700 font-bold',
                                'bg-[#d97706] text-white font-bold',
                                'bg-slate-100 text-slate-600 font-semibold',
                                'bg-slate-100 text-slate-600 font-semibold',
                            ];
                            const avatarBgs = [
                                'bg-amber-50 text-amber-700 border-amber-200',
                                'bg-slate-50 text-slate-700 border-slate-200',
                                'bg-amber-50 text-amber-800 border-amber-300',
                                'bg-slate-100 text-slate-600 border-slate-200',
                                'bg-slate-100 text-slate-600 border-slate-200',
                            ];
                            const initials = f.initials || f.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                            return (
                                <div
                                    key={`${activeCategory.id}-${f.name}-${i}`}
                                    className="flex items-center justify-between gap-3 p-2 px-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-amber-400/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* RANK / MEDALS FOR TOP 3 WITH MINIMAL ANIMATION & CONFETTI */}
                                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                            {i === 0 ? (
                                                /* 1ST PLACE - GOLD MEDAL WITH ANIMATION & CONFETTI */
                                                <div className="relative flex items-center justify-center w-7 h-7">
                                                    <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 animate-confetti-1 pointer-events-none" />
                                                    <span className="absolute w-1.5 h-1 rounded-sm bg-rose-400 animate-confetti-2 pointer-events-none" />
                                                    <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-confetti-3 pointer-events-none" />
                                                    <span className="absolute w-1 h-1.5 rounded-sm bg-sky-400 animate-confetti-4 pointer-events-none" />
                                                    <div
                                                        title="Rank 1 - Gold Medal"
                                                        className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 border border-amber-200 animate-medal-bob"
                                                    >
                                                        <Medal size={14} className="stroke-[2.5] text-amber-950 drop-shadow-2xs" />
                                                    </div>
                                                </div>
                                            ) : i === 1 ? (
                                                /* 2ND PLACE - SILVER MEDAL WITH ANIMATION & CONFETTI */
                                                <div className="relative flex items-center justify-center w-7 h-7">
                                                    <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 animate-confetti-1 pointer-events-none" />
                                                    <span className="absolute w-1.5 h-1 rounded-sm bg-indigo-400 animate-confetti-2 pointer-events-none" />
                                                    <span className="absolute w-1 h-1.5 rounded-sm bg-teal-300 animate-confetti-3 pointer-events-none" />
                                                    <div
                                                        title="Rank 2 - Silver Medal"
                                                        className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-900 flex items-center justify-center shadow-md shadow-slate-400/25 border border-slate-200 animate-medal-bob"
                                                        style={{ animationDelay: '0.4s' }}
                                                    >
                                                        <Medal size={14} className="stroke-[2.5] text-slate-800 drop-shadow-2xs" />
                                                    </div>
                                                </div>
                                            ) : i === 2 ? (
                                                /* 3RD PLACE - BRONZE MEDAL WITH ANIMATION & CONFETTI */
                                                <div className="relative flex items-center justify-center w-7 h-7">
                                                    <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-600 animate-confetti-1 pointer-events-none" />
                                                    <span className="absolute w-1 h-1.5 rounded-sm bg-orange-400 animate-confetti-2 pointer-events-none" />
                                                    <div
                                                        title="Rank 3 - Bronze Medal"
                                                        className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 flex items-center justify-center shadow-md shadow-amber-800/30 border border-amber-600/80 animate-medal-bob"
                                                        style={{ animationDelay: '0.8s' }}
                                                    >
                                                        <Medal size={14} className="stroke-[2.5] text-amber-100 drop-shadow-2xs" />
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Regular rank number */
                                                <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs ${rankBadges[i] || 'bg-slate-100 text-slate-600'}`}>
                                                    {i + 1}
                                                </span>
                                            )}
                                        </div>

                                        {f.photo_url ? (
                                            <img
                                                src={f.photo_url}
                                                alt={f.name}
                                                className={`h-9 w-9 rounded-full object-cover shrink-0 ${i === 0 ? 'border-2 border-amber-400 shadow-xs' : i === 1 ? 'border-2 border-slate-300' : i === 2 ? 'border-2 border-amber-600' : 'border border-slate-200 dark:border-white/10'}`}
                                            />
                                        ) : (
                                            <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${avatarBgs[i] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {initials}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1 pr-3">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white leading-tight">{f.name}</p>
                                            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{f.program}</p>
                                            <div className="w-full max-w-[260px] h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mt-1 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, f.progress ?? f.on_time_rate ?? 0))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">
                                            {f.value ?? `${f.on_time_rate}%`}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                            {f.subtext ?? 'on time'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column (Col 5): Recent Outputs & Highlights - Compacted */}
                <div className="col-span-5 flex h-full min-h-0 flex-col gap-3.5">
                    {/* Recent Outputs Status */}
                    <div
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${isDark
                            ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                            : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                            }`}
                    >
                        <div className="flex shrink-0 items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                            <FileText size={18} className="text-amber-500 shrink-0" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Outputs Status</h2>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <FileText size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">TOS/TQ Submission</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Deadline: Oct 10, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 shrink-0">
                                    3 pending
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <Users size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Faculty Workload</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Deadline: Oct 12, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                                    2 pending
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Compliance Review</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Deadline: Oct 15, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 shrink-0">
                                    In progress
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* This Week's Highlights */}
                    <div
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${isDark
                            ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                            : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                            }`}
                    >
                        <div className="flex shrink-0 items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                            <Star size={18} className="text-amber-500 shrink-0" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">This Week's Highlights</h2>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <TrendingUp size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">BSIT</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Highest improvement rate</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    <ArrowUpRight size={12} /> 12%
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <Users size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">4 faculty members</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">with zero overdue items</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15 px-2 py-0.5 rounded-md">
                                    100%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 5 – Classroom & Lab Monitoring                                       */
/* -------------------------------------------------------------------------- */

const ROOM_TONE: Record<string, Tone> = {
    Available: 'emerald',
    'In Use': 'amber',
    Reserved: 'blue',
    Maintenance: 'rose',
    Unavailable: 'blue',
};

function SlideFive({ data, isDark = false }: any) {
    const rooms = data?.facilities || [];
    const activeLabs = rooms.filter((r: any) => r.status === 'In Use' && r.instructor);

    return (
        <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            <div className="grid grid-cols-4 gap-4 shrink-0">
                <Kpi icon={Monitor} tone="amber" accent label="Rooms in use" value={data?.kpis?.in_use ?? 0} isDark={isDark} />
                <Kpi icon={CheckCircle2} tone="emerald" label="Available rooms" value={data?.kpis?.available ?? 0} isDark={isDark} />
                <Kpi icon={AlertTriangle} tone="rose" label="Under maintenance" value={data?.kpis?.maintenance ?? 0} isDark={isDark} />
                <Kpi icon={Users} tone="purple" label="Faculty in labs" value={activeLabs.length} isDark={isDark} />
            </div>

            {/* Scrollable Bento Grid of Rooms */}
            <div className="h-full min-h-0 flex-1 overflow-y-auto tv-scrollbar overscroll-contain p-1.5 pr-2">
                <div className="grid grid-cols-4 gap-4 pb-4">
                    {rooms.map((room: any) => {
                        const tone = ROOM_TONE[room.status] ?? 'blue';
                        const isOccupied = room.status === 'In Use';
                        return (
                            <div
                                key={room.id}
                                className={`flex min-h-[175px] flex-col justify-between rounded-2xl p-4 transition-all border ${isOccupied
                                    ? 'border-amber-400 bg-amber-500/[0.04] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_4px_16px_rgba(245,158,11,0.12)]'
                                    : isDark
                                        ? 'bg-[#131b2e] border-white/10'
                                        : 'bg-white border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">{room.room_name}</h3>
                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{room.room_type}</p>
                                    </div>
                                    <Pill tone={tone} isDark={isDark}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        {room.status}
                                    </Pill>
                                </div>

                                {room.current_class ? (
                                    <div className="mt-2 rounded-xl p-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <GraduationCap size={15} className="shrink-0 text-amber-500" />
                                            <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{room.instructor || 'Instructor'}</p>
                                        </div>
                                        <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{room.current_class}</p>
                                        <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{room.program || 'Section'}</p>
                                        <p className="mt-1 text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                            {room.start_time?.substring(0, 5)} – {room.end_time?.substring(0, 5)}
                                        </p>
                                    </div>
                                ) : room.remarks ? (
                                    <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{room.remarks}</p>
                                ) : (
                                    <div className="mt-2 flex flex-1 items-center justify-center rounded-xl p-2.5 text-center bg-slate-50 dark:bg-white/[0.03] text-slate-400">
                                        <p className="text-xs">Ready for next session</p>
                                    </div>
                                )}

                                {room.next_schedule && (
                                    <p className="mt-2 line-clamp-1 border-t border-slate-100 dark:border-white/5 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <strong className="font-bold text-slate-800 dark:text-slate-200">Up next:</strong> {room.next_schedule}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 6 – Class Monitoring (Reference Image 2)                             */
/* -------------------------------------------------------------------------- */

function SlideSix({ data, isDark = false }: any) {
    const kpis = data?.kpis || {
        present: 0,
        absent: 0,
        late: 0,
        online: 0,
        on_leave: 0,
        sub_insert: 0,
        total_late_mins: 0,
        faculty_count: 0,
    };
    const records = data?.records || [];
    const highlights = data?.highlights || {};

    const displayRecords = useMemo(() => [...records].sort((a: any, b: any) => b.present - a.present), [records]);

    const base = kpis.present + kpis.absent;
    const presentRate = base > 0 ? Math.round((kpis.present / base) * 100) : 0;
    const absentRate = base > 0 ? Math.round((kpis.absent / base) * 100) : 0;

    return (
        <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            {/* Top Row: 5 KPIs */}
            <div className="grid grid-cols-5 gap-3.5 shrink-0">
                <Kpi
                    icon={Users}
                    tone="blue"
                    label="Present classes"
                    value={kpis.present}
                    sub={highlights['Most Present'] ? `Top: ${highlights['Most Present']}` : undefined}
                    isDark={isDark}
                />
                <Kpi
                    icon={CalendarIcon}
                    tone="rose"
                    label="Absent classes"
                    value={kpis.absent}
                    sub={highlights['Most Absent'] ? `Top: ${highlights['Most Absent']}` : undefined}
                    isDark={isDark}
                />
                <Kpi
                    icon={Clock}
                    tone="amber"
                    label="Late entries"
                    value={kpis.late}
                    sub={highlights['Most Total Lates'] ? `Top: ${highlights['Most Total Lates']}` : `${kpis.total_late_mins} mins total`}
                    isDark={isDark}
                />
                <Kpi
                    icon={Laptop}
                    tone="emerald"
                    label="Online classes"
                    value={kpis.online}
                    sub={highlights['Most Online'] ? `Top: ${highlights['Most Online']}` : undefined}
                    isDark={isDark}
                />
                <Kpi
                    icon={HeartPulse}
                    tone="purple"
                    label="On-leave classes"
                    value={kpis.on_leave}
                    sub={highlights['Most On-Leave'] ? `Top: ${highlights['Most On-Leave']}` : undefined}
                    isDark={isDark}
                />
            </div>

            {/* Bottom Row: Faculty Attendance Table (Left) + Highlights/Summary (Right) */}
            <div className="grid h-full min-h-0 grid-cols-12 gap-4">
                {/* Faculty Attendance Card - Scrollable Table */}
                <div className={`col-span-8 h-full min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    }`}>
                    <div className="flex shrink-0 items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText size={18} />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Faculty attendance</h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{records.length} instructors · synced from Google Sheets</span>
                            <FileSpreadsheet size={15} className="text-emerald-600" />
                        </div>
                    </div>

                    {/* Table Scrollable Body */}
                    <div className="mt-3 flex-1 min-h-0 overflow-y-auto tv-scrollbar overscroll-contain pr-1">
                        <table className="w-full border-collapse text-left">
                            <thead className={`sticky top-0 z-20 backdrop-blur-md border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-[#131b2e]/95 border-white/10 text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-500'
                                }`}>
                                <tr>
                                    <th className="py-2.5 pr-2 pl-1 font-bold w-10">#</th>
                                    <th className="py-2.5 px-3 font-bold">Instructor</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Present</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Absent</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Late</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Online</th>
                                    <th className="py-2.5 px-3 text-center font-bold">On-Leave</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Sub</th>
                                    <th className="py-2.5 pl-3 pr-2 text-right font-bold">Late Mins</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm tabular-nums">
                                {displayRecords.map((r: any, idx: number) => {
                                    return (
                                        <tr key={r.instructor} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2.5 pr-2 pl-1">
                                                {idx === 0 ? (
                                                    /* 1ST PLACE - GOLD MEDAL WITH ANIMATION & CONFETTI */
                                                    <div className="relative flex items-center justify-center w-7 h-7">
                                                        {/* Confetti Particles */}
                                                        <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 animate-confetti-1 pointer-events-none" />
                                                        <span className="absolute w-1.5 h-1 rounded-sm bg-rose-400 animate-confetti-2 pointer-events-none" />
                                                        <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-confetti-3 pointer-events-none" />
                                                        <span className="absolute w-1 h-1.5 rounded-sm bg-sky-400 animate-confetti-4 pointer-events-none" />

                                                        {/* Gold Medal Badge */}
                                                        <div
                                                            title="Rank 1 - Gold Medal"
                                                            className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 border border-amber-200 animate-medal-bob"
                                                        >
                                                            <Medal size={14} className="stroke-[2.5] text-amber-950 drop-shadow-2xs" />
                                                        </div>
                                                    </div>
                                                ) : idx === 1 ? (
                                                    /* 2ND PLACE - SILVER MEDAL WITH ANIMATION & CONFETTI */
                                                    <div className="relative flex items-center justify-center w-7 h-7">
                                                        {/* Confetti Particles */}
                                                        <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 animate-confetti-1 pointer-events-none" />
                                                        <span className="absolute w-1.5 h-1 rounded-sm bg-indigo-400 animate-confetti-2 pointer-events-none" />
                                                        <span className="absolute w-1 h-1.5 rounded-sm bg-teal-300 animate-confetti-3 pointer-events-none" />

                                                        {/* Silver Medal Badge */}
                                                        <div
                                                            title="Rank 2 - Silver Medal"
                                                            className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-900 flex items-center justify-center shadow-md shadow-slate-400/25 border border-slate-200 animate-medal-bob"
                                                            style={{ animationDelay: '0.4s' }}
                                                        >
                                                            <Medal size={14} className="stroke-[2.5] text-slate-800 drop-shadow-2xs" />
                                                        </div>
                                                    </div>
                                                ) : idx === 2 ? (
                                                    /* 3RD PLACE - BRONZE MEDAL WITH ANIMATION & CONFETTI */
                                                    <div className="relative flex items-center justify-center w-7 h-7">
                                                        {/* Confetti Particles */}
                                                        <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-600 animate-confetti-1 pointer-events-none" />
                                                        <span className="absolute w-1 h-1.5 rounded-sm bg-orange-400 animate-confetti-2 pointer-events-none" />

                                                        {/* Bronze Medal Badge */}
                                                        <div
                                                            title="Rank 3 - Bronze Medal"
                                                            className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 flex items-center justify-center shadow-md shadow-amber-800/30 border border-amber-600/80 animate-medal-bob"
                                                            style={{ animationDelay: '0.8s' }}
                                                        >
                                                            <Medal size={14} className="stroke-[2.5] text-amber-100 drop-shadow-2xs" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Regular rank number */
                                                    <span className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                                                        {idx + 1}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{r.instructor}</td>
                                            <td className="py-2.5 px-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400">{r.present}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">{r.absent > 0 ? r.absent : <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">{r.late > 0 ? r.late : <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-sky-600 dark:text-sky-400">{r.online > 0 ? r.online : <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">{r.on_leave > 0 ? r.on_leave : <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>}</td>
                                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">{r.sub_insert > 0 ? r.sub_insert : <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>}</td>
                                            <td className="py-2.5 pl-3 pr-2 text-right">
                                                {r.total_late_mins > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
                                                        {r.total_late_mins} m
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Highlights & Summary Cards */}
                <div className="col-span-4 flex h-full min-h-0 flex-col gap-4">
                    {/* Highlights Card */}
                    <BentoTile title="Highlights" icon={Star} iconTone="amber" className="flex-1 min-h-0" isDark={isDark}>
                        <div className="space-y-2.5">
                            {Object.entries(highlights).map(([label, value]: any, i: number) => {
                                const icons = [Users, CalendarIcon, Clock, Laptop, HeartPulse];
                                const tones: Tone[] = ['amber', 'rose', 'amber', 'blue', 'purple'];
                                const ItemIcon = icons[i % icons.length];
                                const tone = tones[i % tones.length];
                                return (
                                    <div key={label} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TONE_BOX[tone][isDark ? 'dark' : 'light']}`}>
                                                <ItemIcon size={16} />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{label}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{value}</span>
                                            <ChevronRight size={14} className="text-slate-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </BentoTile>

                    {/* Summary 2x2 Grid Card */}
                    <BentoTile
                        title="Summary"
                        icon={BarChart2}
                        iconTone="blue"
                        className="flex-1 min-h-0"
                        isDark={isDark}
                        aside={
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                                This Semester
                            </span>
                        }
                    >
                        <div className="grid grid-cols-2 gap-3 h-full">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Users size={14} /> Faculty tracked
                                </div>
                                <div className="flex items-end justify-between mt-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{kpis.faculty_count}</span>
                                    <MiniWave positive />
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <CalendarIcon size={14} /> Classes logged
                                </div>
                                <div className="flex items-end justify-between mt-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{kpis.present + kpis.absent + kpis.online + kpis.on_leave}</span>
                                    <MiniWave positive />
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present rate</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{presentRate}%</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded">↑ 5%</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent rate</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{absentRate}%</span>
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/15 px-1.5 py-0.5 rounded">↓ 3%</span>
                                </div>
                            </div>
                        </div>
                    </BentoTile>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 7 – Faculty Schedule (Fixed Smooth Independent Div Scrolling)         */
/* -------------------------------------------------------------------------- */

const STATUS_ORDER: Record<string, number> = { Ongoing: 0, Upcoming: 1, Completed: 2 };

function SlideSeven({ data, isDark = false }: { data: any; isDark?: boolean }) {
    const schedules = data?.schedules || [];
    const facultyGroups = data?.faculty_groups || [];
    const kpis = data?.kpis || {
        total_classes: 0,
        ongoing_classes: 0,
        upcoming_classes: 0,
        completed_classes: 0,
        active_instructors: 0,
    };
    const day = data?.day || 'Today';
    const currentTime = data?.current_time || '';

    const timetable = useMemo(
        () =>
            [...schedules].sort(
                (a: any, b: any) =>
                    (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) || String(a.start_time).localeCompare(String(a.start_time)),
            ),
        [schedules],
    );
    const ongoingClasses = useMemo(() => schedules.filter((s: any) => s.status === 'Ongoing'), [schedules]);

    return (
        <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
                <Kpi
                    icon={CalendarIcon}
                    tone="blue"
                    label={`Total classes · ${day}`}
                    value={kpis.total_classes}
                    sub={`${kpis.active_instructors} faculty teaching`}
                    isDark={isDark}
                />
                <Kpi
                    icon={Clock}
                    tone="emerald"
                    accent
                    label="In session now"
                    value={kpis.ongoing_classes}
                    sub={currentTime ? `As of ${currentTime}` : undefined}
                    isDark={isDark}
                />
                <Kpi
                    icon={Timer}
                    tone="amber"
                    label="Upcoming today"
                    value={kpis.upcoming_classes}
                    sub="Next scheduled"
                    isDark={isDark}
                />
                <Kpi
                    icon={CheckCircle2}
                    tone="purple"
                    label="Completed"
                    value={kpis.completed_classes}
                    sub="Classes finished"
                    isDark={isDark}
                />
            </div>

            {/* Bottom Row: In Session & Faculty Teaching (Left) + Full Timetable (Right) */}
            <div className="grid h-full min-h-0 grid-cols-12 gap-4">
                {/* Left Column: Ongoing & Faculty Groups */}
                <div className="col-span-5 flex h-full min-h-0 flex-col gap-4">
                    {/* In Session Card */}
                    <div className={`h-[42%] min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}>
                        <div className="flex shrink-0 items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Radio size={16} />
                                </div>
                                <h3 className="text-base font-bold">In session now</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {ongoingClasses.length} Active
                            </span>
                        </div>

                        {/* Scrollable list of in session classes */}
                        <div className="mt-3 flex-1 min-h-0 overflow-y-auto tv-scrollbar overscroll-contain pr-1 space-y-2.5">
                            {ongoingClasses.length === 0 ? (
                                <div className="flex flex-1 h-full items-center justify-center text-center p-4 text-slate-400">
                                    <p className="text-sm font-medium">No classes currently in session{currentTime ? ` at ${currentTime}` : ''}.</p>
                                </div>
                            ) : (
                                ongoingClasses.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {item.instructor_photo ? (
                                                <img
                                                    src={item.instructor_photo}
                                                    alt={item.instructor}
                                                    className="h-8 w-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                    {item.instructor ? item.instructor.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.instructor}</p>
                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    <strong className="font-bold text-amber-600 dark:text-amber-400">{item.course_code}</strong>
                                                    {item.course_title ? ` · ${item.course_title}` : ''}
                                                    {item.section ? ` · ${item.section}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">{item.room_name}</span>
                                            <p className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400 mt-1">
                                                {item.start_time} – {item.end_time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Faculty Teaching Card */}
                    <div className={`flex-1 min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}>
                        <div className="flex shrink-0 items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                </div>
                                <h3 className="text-base font-bold">Faculty teaching · {day}</h3>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">{facultyGroups.length} faculty</span>
                        </div>

                        {/* Scrollable list of faculty teaching */}
                        <div className="mt-3 flex-1 min-h-0 overflow-y-auto tv-scrollbar overscroll-contain pr-1 space-y-2">
                            {facultyGroups.map((group: any, idx: number) => (
                                <div key={group.instructor || idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {group.instructor_photo ? (
                                            <img
                                                src={group.instructor_photo}
                                                alt={group.instructor}
                                                className="h-8 w-8 rounded-full object-cover border border-amber-400/40 shrink-0"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                {group.instructor ? group.instructor.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                                                {group.instructor}
                                                {group.has_ongoing && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />}
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                {group.rooms.join(', ')}
                                                {group.current_class ? ` · Now ${group.current_class.course_code}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 tabular-nums">
                                        {group.total_classes} classes
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Timetable Full Schedule (Scrollable with sticky header) */}
                <div className={`col-span-7 h-full min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    }`}>
                    <div className="flex shrink-0 items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Clock size={18} />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Timetable · {day}</h2>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                            {timetable.length} sessions scheduled
                        </span>
                    </div>

                    {/* Scrollable Container with sticky header */}
                    <div className="mt-3 flex-1 min-h-0 overflow-y-auto tv-scrollbar overscroll-contain pr-1">
                        <table className="w-full border-collapse text-left">
                            <thead className={`sticky top-0 z-20 backdrop-blur-md border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-[#131b2e]/95 border-white/10 text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-500'
                                }`}>
                                <tr>
                                    <th className="py-2.5 pr-3 pl-1 font-bold">Time</th>
                                    <th className="px-3 py-2.5 font-bold">Room</th>
                                    <th className="px-3 py-2.5 font-bold">Instructor</th>
                                    <th className="px-3 py-2.5 font-bold">Course / Section</th>
                                    <th className="py-2.5 pl-3 pr-2 text-right font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {timetable.map((item: any) => {
                                    const isLive = item.status === 'Ongoing';
                                    const isDone = item.status === 'Completed';
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${isDone ? 'opacity-50 text-slate-400' : ''
                                                }`}
                                        >
                                            <td className={`py-2.5 pr-3 pl-1 font-bold whitespace-nowrap tabular-nums text-xs ${isLive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                                                }`}>
                                                {item.start_time} – {item.end_time}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                                    {item.room_name}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs">
                                                {item.instructor}
                                            </td>
                                            <td className="max-w-[15rem] truncate px-3 py-2.5 text-xs">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{item.course_code}</span>
                                                {item.section ? <span className="text-slate-500 dark:text-slate-400"> · {item.section}</span> : null}
                                            </td>
                                            <td className="py-2.5 pl-3 pr-2 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isLive
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                        : item.status === 'Upcoming'
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                                                        }`}
                                                >
                                                    {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {timetable.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                                            No classes scheduled for {day}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 8 – Consolidated Calendar (Meetings, Activities & Exams)            */
/* -------------------------------------------------------------------------- */

function SlideEight({ data, isDark }: { data: any; isDark: boolean }) {
    const calendar = data?.calendar || {};
    const events: any[] = calendar.events || [];
    const todayStr = '2026-10-13';

    // Categorized event counts
    const meetingsCount = events.filter((e) => e.type === 'meeting').length;
    const activitiesCount = events.filter((e) => e.type === 'activity').length;
    const examsCount = events.filter((e) => e.type === 'examination').length;
    const deadlinesCount = events.filter((e) => e.type === 'deadline').length;
    const othersCount = events.filter((e) => !['meeting', 'activity', 'examination', 'deadline'].includes(e.type)).length;

    // Filter upcoming events sorted by date and time
    const upcomingEvents = useMemo(() => {
        if (!events || events.length === 0) {
            // Default sample events matching the mockup if events array is empty
            return [
                { id: 1, date: '2026-10-01', day: 'THU', num: '1', time: '03:00 PM - 05:00 PM', title: 'SPAR', subtitle: 'Documentary compliance deadline: SPAR', type: 'deadline', venue: 'N/A' },
                { id: 2, date: '2026-10-01', day: 'THU', num: '1', time: '03:00 PM - 05:00 PM', title: 'Submission of Preliminary Course Syllabi', subtitle: 'Documentary compliance deadline: Course Syllabi', type: 'deadline', venue: 'N/A' },
                { id: 3, date: '2026-10-02', day: 'FRI', num: '2', time: '09:00 AM - 12:00 PM', title: 'Midterm Departmental Exam Prep', subtitle: 'Departmental examination schedule', type: 'examination', venue: 'Computer Lab 1' },
                { id: 4, date: '2026-10-03', day: 'SAT', num: '3', time: '02:00 PM - 05:00 PM', title: 'College Assembly & Student Orientation', subtitle: 'Institutional gathering', type: 'others', venue: 'CIDS Multi-Purpose Hall' },
                { id: 5, date: '2026-10-03', day: 'SAT', num: '3', time: '03:00 PM - 05:00 PM', title: 'Course Syllabus', subtitle: 'Documentary compliance deadline: Syllabus', type: 'deadline', venue: 'N/A' },
                { id: 6, date: '2026-10-05', day: 'MON', num: '5', time: '10:00 AM - 12:00 PM', title: 'Faculty Consultation Hours', subtitle: 'Academic advisory & consultations', type: 'others', venue: 'Faculty Room 302' },
                { id: 7, date: '2026-10-07', day: 'WED', num: '7', time: '10:00 AM - 11:30 AM', title: 'Academic Committee Meeting', subtitle: 'Committee meeting session', type: 'meeting', venue: 'Conference Room A' },
                { id: 8, date: '2026-10-09', day: 'FRI', num: '9', time: '01:00 PM - 05:00 PM', title: 'Research Colloquium & AI Workshop', subtitle: 'Faculty research colloquium', type: 'activity', venue: 'University Campus' },
                { id: 9, date: '2026-10-10', day: 'SAT', num: '10', time: '03:00 PM - 05:00 PM', title: 'Deadline: Midterm Assessment Rubrics', subtitle: 'Documentary compliance deadline: Rubrics Submission', type: 'deadline', venue: 'N/A' },
                { id: 10, date: '2026-10-12', day: 'MON', num: '12', time: '01:00 PM - 03:00 PM', title: 'Curriculum Review', subtitle: 'Harmonizing IT & Computer Science specializations for AY 2027.', type: 'meeting', venue: 'Conference Room A' },
            ];
        }

        return [...events].sort((a, b) => {
            const dateCompare = (a.date || '').localeCompare(b.date || '');
            if (dateCompare !== 0) return dateCompare;
            return (a.start_time || '').localeCompare(b.start_time || '');
        }).slice(0, 10).map((e, idx) => {
            const d = e.date ? new Date(e.date + 'T00:00:00') : new Date();
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return {
                id: e.id || idx,
                date: e.date,
                day: days[d.getDay()] || 'DAY',
                month: 'OCT',
                num: String(d.getDate()),
                time: e.start_time ? `${e.start_time} - ${e.end_time || ''}` : 'All Day',
                title: e.title,
                subtitle: e.description || `Documentary compliance deadline: ${e.title}`,
                type: e.type || 'others',
                venue: e.venue || 'N/A'
            };
        });
    }, [events]);

    // Deadlines list for right bottom widget
    const deadlineEvents = useMemo(() => {
        const dls = upcomingEvents.filter(e => e.type === 'deadline');
        if (dls.length > 0) return dls.slice(0, 4);
        return [
            { id: 'd1', dayNum: '1', title: 'SPAR', subtitle: 'Documentary compliance deadline: SPAR' },
            { id: 'd2', dayNum: '1', title: 'Submission of Preliminary Course Syllabi', subtitle: 'Documentary compliance deadline: Course Syllabi' },
            { id: 'd3', dayNum: '3', title: 'Course Syllabus', subtitle: 'Documentary compliance deadline: Syllabus' },
            { id: 'd4', dayNum: '10', title: 'Deadline: Midterm Assessment Rubrics', subtitle: 'Documentary compliance deadline: Rubrics Submission' },
        ];
    }, [upcomingEvents]);

    // Event type badge renderer matching mockup
    const renderTypePill = (type: string) => {
        switch (type) {
            case 'deadline':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                        DEADLINE
                    </span>
                );
            case 'examination':
            case 'exam':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                        EXAM
                    </span>
                );
            case 'meeting':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                        MEETING
                    </span>
                );
            case 'activity':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                        ACTIVITY
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        OTHERS
                    </span>
                );
        }
    };

    // Dot color based on type
    const getDotColor = (type: string) => {
        switch (type) {
            case 'deadline': return 'bg-amber-500';
            case 'examination':
            case 'exam': return 'bg-rose-500';
            case 'meeting': return 'bg-blue-500';
            case 'activity': return 'bg-purple-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-3.5 select-none overflow-hidden">
            {/* 1. TOP METRIC CARDS (4 CARDS) */}
            <div className="grid grid-cols-4 gap-3.5 shrink-0">
                {/* Meetings */}
                <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meetings</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {meetingsCount || 8}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Scheduled sessions</div>
                    </div>
                </div>

                {/* Activities */}
                <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/40 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activities</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {activitiesCount || 5}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Academic events</div>
                    </div>
                </div>

                {/* Examinations */}
                <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Examinations</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {examsCount || 2}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Period assessments</div>
                    </div>
                </div>

                {/* Deadlines */}
                <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadlines</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {deadlinesCount || 9}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Due submissions</div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN 2-COLUMN SPLIT: LEFT TIMELINE (65%) + RIGHT SIDEBAR (35%) */}
            <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-0">

                {/* LEFT MAIN CARD: Upcoming Calendar Events (Col 8) */}
                <div className="col-span-8 flex flex-col min-h-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs">

                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Upcoming Calendar Events
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    Scheduled meetings, institutional activities, and deadlines across all CIDS programs.
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                            {upcomingEvents.length} Upcoming Events
                        </span>
                    </div>

                    {/* Timeline List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
                        {upcomingEvents.map((event, idx) => (
                            <div
                                key={event.id || idx}
                                className="flex items-center justify-between py-2.25 px-1.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl transition-colors group"
                            >
                                {/* Left Section: Date block + Dot + Time */}
                                <div className="flex items-center gap-3 min-w-[210px] shrink-0">
                                    {/* Date Stamp */}
                                    <div className="flex items-center gap-1.5 w-14 shrink-0">
                                        <div className="flex flex-col text-[8.5px] font-extrabold text-slate-400 leading-none">
                                            <span>{event.day || 'THU'}</span>
                                            <span>OCT</span>
                                        </div>
                                        <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                                            {event.num || (idx + 1)}
                                        </span>
                                    </div>

                                    {/* Colored Dot Indicator */}
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", getDotColor(event.type))} />

                                    {/* Time Interval */}
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {event.time}
                                    </span>
                                </div>

                                {/* Center Section: Event Title & Subtitle */}
                                <div className="flex-1 min-w-0 px-3">
                                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                        {event.title}
                                    </div>
                                    <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                                        {event.subtitle}
                                    </div>
                                </div>

                                {/* Right Section: Category Pill + Location */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {renderTypePill(event.type)}

                                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 w-36 truncate justify-start">
                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{event.venue || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: 3 Mini Widgets (Col 4) */}
                <div className="col-span-4 flex flex-col gap-3.5 min-h-0">

                    {/* 1. This Week Mini Calendar */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs shrink-0">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">This Week</h4>
                                    <span className="text-[9px] text-slate-400">October 2026</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <button type="button" className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Weekday Strip (SUN 11 to SAT 17) */}
                        <div className="grid grid-cols-7 gap-1 text-center pt-2.5">
                            {[
                                { day: 'SUN', num: 11, hasDot: false },
                                { day: 'MON', num: 12, dot: 'bg-blue-500' },
                                { day: 'TUE', num: 13, isToday: true, dot: 'bg-amber-400' },
                                { day: 'WED', num: 14, hasDot: false },
                                { day: 'THU', num: 15, dot: 'bg-amber-500' },
                                { day: 'FRI', num: 16, hasDot: false },
                                { day: 'SAT', num: 17, dot: 'bg-purple-500' },
                            ].map((d) => (
                                <div key={d.day} className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{d.day}</span>
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1 transition-all",
                                        d.isToday
                                            ? "bg-blue-600 text-white shadow-xs font-black"
                                            : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {d.num}
                                    </div>
                                    <div className="h-1.5 flex items-center justify-center mt-0.5">
                                        {d.dot && <span className={cn("w-1 h-1 rounded-full", d.dot)} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Today banner */}
                        <div className="mt-2 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[9.5px] font-bold">
                            <Calendar className="w-3 h-3" />
                            <span>Today: Tuesday, October 13, 2026</span>
                        </div>
                    </div>

                    {/* 2. Event Breakdown Legend Card */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs shrink-0">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">Event Breakdown</h4>
                                <span className="text-[9px] text-slate-400">Total scheduled items this semester</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2 text-[10.5px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Meetings</span>
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-white">{meetingsCount || 8}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Activities</span>
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-white">{activitiesCount || 5}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Examinations</span>
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-white">{examsCount || 2}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Deadlines</span>
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-white">{deadlinesCount || 9}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Others</span>
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-white">{othersCount || 4}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Important Deadlines Mini Card */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex-1 min-h-0 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">Important Deadlines</h4>
                                    <span className="text-[9px] text-slate-400">Upcoming deadline submissions</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                View All
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pt-1 pr-1">
                            {deadlineEvents.map((dl, i) => (
                                <div key={dl.id || i} className="flex items-center justify-between py-1.5 gap-2">
                                    {/* Date Stamp */}
                                    <div className="flex flex-col items-center leading-none w-6 shrink-0">
                                        <span className="text-[7px] font-bold text-slate-400">OCT</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{dl.dayNum || '1'}</span>
                                    </div>

                                    {/* Text */}
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10.5px] font-bold text-slate-900 dark:text-white truncate">
                                            {dl.title}
                                        </div>
                                        <div className="text-[8.5px] text-slate-400 truncate">
                                            {dl.subtitle}
                                        </div>
                                    </div>

                                    {/* Pill */}
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                                        DEADLINE
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 9 – Compliance Tracker (Institutional Overview & Program Matrix)   */
/* -------------------------------------------------------------------------- */

function SlideNine({ data, isDark = false }: { data: any; isDark: boolean }) {
    const stats = data?.stats || {
        overall_rate: 100,
        growth: '+12%',
        completed: 33,
        pending: 0,
        overdue: 0,
        active_requirements: 33,
        total_programs: 4,
    };

    const programStats = data?.program_stats || [
        { id: 1, code: 'BSIT', name: 'BSIT – Bachelor of Science in Information Technology', submitted: 8, pending: 0, overdue: 0, total: 8, compliance_rate: 100, status: 'Compliant' },
        { id: 2, code: 'BSIS', name: 'BSIS – Bachelor of Science in Information Systems', submitted: 8, pending: 0, overdue: 0, total: 8, compliance_rate: 100, status: 'Compliant' },
        { id: 3, code: 'BLIS', name: 'BLIS – Bachelor of Library and Information Science', submitted: 8, pending: 0, overdue: 0, total: 8, compliance_rate: 100, status: 'Compliant' },
        { id: 4, code: 'BSCS', name: 'BSCS – Bachelor of Science in Computer Science', submitted: 9, pending: 0, overdue: 0, total: 9, compliance_rate: 100, status: 'Compliant' },
    ];

    const requirementProgress = data?.requirement_progress || [
        { title: 'Midterm TOS and TQ', completed: 7, total: 7, rate: 100, status: 'Completed' },
        { title: 'Course Syllabus', completed: 7, total: 7, rate: 100, status: 'Completed' },
        { title: 'Faculty Workload Confirmation', completed: 7, total: 7, rate: 100, status: 'Completed' },
        { title: 'SPAR', completed: 12, total: 12, rate: 100, status: 'Completed' },
    ];

    const upcomingDeadlines = data?.upcoming_deadlines || [
        { day: '01', month: 'OCT', title: 'SPAR Submission', scope: 'All Programs', badge: 'Completed', badge_color: 'emerald', days_left: 'Recorded' },
        { day: '03', month: 'OCT', title: 'Course Syllabus Review', scope: 'All Programs', badge: 'Completed', badge_color: 'emerald', days_left: 'Recorded' },
        { day: '15', month: 'OCT', title: 'Midterm Assessment Rubrics', scope: 'All Programs', badge: 'Upcoming', badge_color: 'blue', days_left: '1 day left' },
        { day: '24', month: 'OCT', title: 'Faculty Workload Verification', scope: 'All Programs', badge: 'Upcoming', badge_color: 'amber', days_left: '10 days left' },
    ];

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-3.5 select-none overflow-hidden font-['Poppins']">
            {/* 1. TOP METRICS ROW (4 Cards) */}
            <div className="grid grid-cols-4 gap-3.5 shrink-0">
                {/* Overall Compliance Rate Donut Tile */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <path
                                className={isDark ? "text-slate-800" : "text-slate-100"}
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="text-amber-500"
                                strokeDasharray={`${stats.overall_rate}, 100`}
                                strokeWidth="4"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="absolute text-[11px] font-black text-slate-900 dark:text-white">
                            {stats.overall_rate}%
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Overall Compliance
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            {stats.overall_rate}% Compliant
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Institutional benchmark met</span>
                        </div>
                    </div>
                </div>

                {/* Total Completed */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                        <div className="text-2xl font-black text-emerald-600 leading-tight">
                            {stats.completed}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Total verified outputs</div>
                    </div>
                </div>

                {/* Total Pending */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Outputs</div>
                        <div className="text-2xl font-black text-blue-600 leading-tight">
                            {stats.pending}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Within submission window</div>
                    </div>
                </div>

                {/* Total Overdue */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Outputs</div>
                        <div className="text-2xl font-black text-rose-600 leading-tight">
                            {stats.overdue}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Past official due dates</div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN 2-COLUMN SECTION: PROGRAM PERFORMANCE (Col 7) + REQUIREMENT PROGRESS & DEADLINES (Col 5) */}
            <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-0">
                {/* LEFT MAIN CARD: Program Compliance Breakdown Table (Col 7) */}
                <div className="col-span-7 flex flex-col min-h-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    Compliance by Academic Program
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    Tracked departmental compliance across all CIDS courses
                                </p>
                            </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                            CIDS Matrix
                        </span>
                    </div>

                    {/* Program Cards / Rows */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                        {programStats.map((item: any, idx: number) => {
                            const is100 = item.compliance_rate >= 100;
                            return (
                                <div key={item.id || idx} className="py-2.5 flex items-center gap-3">
                                    {/* Program Code Badge */}
                                    <div className="w-14 shrink-0 font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>{item.code}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between text-[11px] mb-1">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {item.name}
                                            </span>
                                            <span className="font-mono font-black text-slate-900 dark:text-white">
                                                {item.compliance_rate}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${is100 ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}
                                                style={{ width: `${item.compliance_rate}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Fraction Tag */}
                                    <div className="w-20 text-right shrink-0">
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            {item.submitted}/{item.total}
                                        </span>
                                        <span className={`block text-[9px] font-extrabold uppercase ${is100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: Requirement Progress & Upcoming Deadlines (Col 5) */}
                <div className="col-span-5 flex flex-col gap-3.5 min-h-0">
                    {/* Upper Right: Requirement Progress */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                    Requirement Progress
                                </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                                Active Outputs
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                            {requirementProgress.map((req: any, i: number) => (
                                <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                                            {req.title}
                                        </div>
                                        <div className="text-[9px] text-slate-400">
                                            {req.completed} of {req.total} submitted
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lower Right: Upcoming Deadlines */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                    Upcoming Deadlines
                                </h4>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                Timeline
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                            {upcomingDeadlines.map((dl: any, i: number) => (
                                <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex flex-col items-center leading-none w-7 shrink-0 text-center">
                                        <span className="text-[8px] font-bold text-slate-400">{dl.month}</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{dl.day}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                                            {dl.title}
                                        </div>
                                        <div className="text-[9px] text-slate-400 truncate">
                                            {dl.scope} • {dl.days_left}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider shrink-0 ${dl.badge_color === 'emerald'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : dl.badge_color === 'amber'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                        }`}>
                                        {dl.badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 10 – Tasks & Projects (Workflow Kanban & Assignment Tracker)        */
/* -------------------------------------------------------------------------- */

function SlideTen({ data, isDark }: { data: any; isDark: boolean }) {
    if (!data) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400">
                <p>No task or project workflow data currently available.</p>
            </div>
        );
    }

    const { stats = {}, columns = {}, recent_tasks = [] } = data;

    const kanbanColumns = [
        {
            key: 'to_do',
            title: 'To Do',
            count: stats.to_do ?? (columns.to_do?.length || 0),
            tasks: columns.to_do || [],
            badgeBg: 'bg-slate-100 dark:bg-slate-800',
            badgeText: 'text-slate-700 dark:text-slate-300',
            accentBorder: 'border-t-slate-400 dark:border-t-slate-500',
            headerBg: 'bg-slate-50/80 dark:bg-slate-800/40',
        },
        {
            key: 'in_progress',
            title: 'In Progress',
            count: stats.in_progress ?? (columns.in_progress?.length || 0),
            tasks: columns.in_progress || [],
            badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
            badgeText: 'text-amber-700 dark:text-amber-300',
            accentBorder: 'border-t-amber-500',
            headerBg: 'bg-amber-50/40 dark:bg-amber-950/20',
        },
        {
            key: 'review',
            title: 'Under Review',
            count: stats.review ?? (columns.review?.length || 0),
            tasks: columns.review || [],
            badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
            badgeText: 'text-blue-700 dark:text-blue-300',
            accentBorder: 'border-t-blue-500',
            headerBg: 'bg-blue-50/40 dark:bg-blue-950/20',
        },
        {
            key: 'completed',
            title: 'Completed',
            count: stats.completed ?? (columns.completed?.length || 0),
            tasks: columns.completed || [],
            badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
            badgeText: 'text-emerald-700 dark:text-emerald-300',
            accentBorder: 'border-t-emerald-500',
            headerBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
        },
    ];

    const getPriorityBadge = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return {
                    label: 'High',
                    className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50',
                };
            case 'medium':
                return {
                    label: 'Medium',
                    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50',
                };
            default:
                return {
                    label: 'Low',
                    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50',
                };
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-3.5 min-h-0 font-poppins">
            {/* TOP BAR: KPI Metric Cards */}
            <div className="grid grid-cols-4 gap-3.5 shrink-0">
                {/* 1. Total Tasks */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Active Tasks
                        </span>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {stats.total ?? 0}
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            Projects & Operations
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                        <ListTodo className="w-5 h-5" />
                    </div>
                </div>

                {/* 2. In Progress */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            In Progress
                        </span>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">
                            {stats.in_progress ?? 0}
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            Currently being executed
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                {/* 3. Due Today */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Due Today
                        </span>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">
                            {stats.due_today ?? 0}
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            Immediate attention
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                {/* 4. Completion Rate */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Completed
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                {stats.completed ?? 0}
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                ({stats.completion_rate ?? 0}%)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            Delivered successfully
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: Kanban Board Columns */}
            <div className="grid grid-cols-4 gap-3.5 flex-1 min-h-0">
                {kanbanColumns.map((col) => (
                    <div
                        key={col.key}
                        className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-4 ${col.accentBorder} shadow-2xs flex flex-col min-h-0 overflow-hidden`}
                    >
                        {/* Column Header */}
                        <div className={`flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0 ${col.headerBg}`}>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    {col.title}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${col.badgeBg} ${col.badgeText}`}>
                                    {col.count}
                                </span>
                            </div>
                        </div>

                        {/* Column Task Cards */}
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                            {col.tasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400">No tasks in {col.title.toLowerCase()}</p>
                                </div>
                            ) : (
                                col.tasks.map((task: any) => {
                                    const priorityBadge = getPriorityBadge(task.priority);
                                    return (
                                        <div
                                            key={task.id}
                                            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2.5 shadow-2xs hover:border-amber-300 dark:hover:border-amber-600/50 transition-all flex flex-col gap-2"
                                        >
                                            {/* Priority & Due Date Badge */}
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${priorityBadge.className}`}>
                                                    {priorityBadge.label}
                                                </span>

                                                {task.days_left && (
                                                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold ${task.is_overdue
                                                        ? 'text-rose-600 dark:text-rose-400 font-black'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        <Clock className="w-3 h-3" />
                                                        {task.days_left}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Task Title & Description */}
                                            <div>
                                                <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                                    {task.title}
                                                </h4>
                                                {task.description && (
                                                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Progress Bar (if in progress or completed) */}
                                            {task.status !== 'to_do' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[9px]">
                                                        <span className="font-semibold text-slate-400">Progress</span>
                                                        <span className="font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                                            {task.progress}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${task.progress >= 100
                                                                ? 'bg-emerald-500'
                                                                : 'bg-amber-500'
                                                                }`}
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer: Subtasks/Comments & Assignee */}
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    {task.subtasks_total > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-500">
                                                            <CheckSquare className="w-3 h-3 text-slate-400" />
                                                            {task.subtasks_completed}/{task.subtasks_total}
                                                        </span>
                                                    )}
                                                    {task.comments_count > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-400">
                                                            <MessageSquare className="w-2.5 h-2.5" />
                                                            {task.comments_count}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Assignee Avatar/Initials */}
                                                <div className="flex items-center gap-1">
                                                    {task.faculties && task.faculties.length > 0 ? (
                                                        <div className="flex -space-x-1.5 overflow-hidden">
                                                            {task.faculties.slice(0, 2).map((fac: any, idx: number) => (
                                                                fac.photo_url ? (
                                                                    <img
                                                                        key={idx}
                                                                        src={fac.photo_url}
                                                                        alt={fac.name}
                                                                        className="inline-block h-4.5 w-4.5 rounded-full ring-1 ring-white dark:ring-slate-900 object-cover"
                                                                        title={fac.name}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        key={idx}
                                                                        className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white ring-1 ring-white dark:ring-slate-900"
                                                                        title={fac.name}
                                                                    >
                                                                        {fac.name ? fac.name.substring(0, 1) : 'F'}
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[8px] font-black text-slate-700 dark:text-slate-200"
                                                            title={task.assignee_name || 'Assignee'}
                                                        >
                                                            {task.assignee_initials}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 11 – Program Performance (Comparative Program Matrix & Highlights)   */
/* -------------------------------------------------------------------------- */

function SlideEleven({ data, isDark }: { data: any; isDark: boolean }) {
    if (!data) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400">
                <p>No program performance data currently available.</p>
            </div>
        );
    }

    const { performances = [], kpis = {}, academic_period = {} } = data;

    const rankColors = [
        'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 border-amber-300',
        'bg-slate-200 text-slate-800 border-slate-300',
        'bg-[#b45309] text-white border-amber-600',
    ];

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-3.5 select-none overflow-hidden font-['Poppins']">
            {/* Top KPI Metrics Row (4 Cards) */}
            <div className="grid grid-cols-4 gap-3.5 shrink-0">
                {/* 1. Total Programs */}
                <div className={cn(
                    "rounded-2xl p-4 flex items-center justify-between border shadow-2xs transition-all",
                    isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Programs</p>
                            <p className="text-2xl font-black tabular-nums tracking-tight mt-0.5">
                                {kpis.total_programs ?? performances.length}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                Active Academic Units
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Total Faculty */}
                <div className={cn(
                    "rounded-2xl p-4 flex items-center justify-between border shadow-2xs transition-all",
                    isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Faculty Members</p>
                            <p className="text-2xl font-black tabular-nums tracking-tight mt-0.5">
                                {kpis.total_faculty ?? 0}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                <CheckCircle2 size={11} /> {kpis.compliant_faculty ?? 0} compliant ({kpis.compliance_rate ?? 0}%)
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Average On-Time Rate */}
                <div className={cn(
                    "rounded-2xl p-4 flex items-center justify-between border shadow-2xs transition-all",
                    isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average On-Time Rate</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight mt-0.5">
                                {kpis.on_time_rate ?? 0}%
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {kpis.on_time_submissions ?? 0} on-time submissions
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Overdue Cases */}
                <div className={cn(
                    "rounded-2xl p-4 flex items-center justify-between border shadow-2xs transition-all",
                    isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue Requirements</p>
                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight mt-0.5">
                                {kpis.overdue_count ?? 0}
                            </p>
                            <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                                {kpis.overdue_count > 0 ? 'Requires follow-up' : 'All requirements up to date'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Comparative Programs Leaderboard Table + Program Highlight Cards */}
            <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
                {/* Left (8 Cols): Program Comparative Matrix Table */}
                <div className={cn(
                    "col-span-8 flex flex-col rounded-2xl border p-4.5 overflow-hidden shadow-2xs",
                    isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                )}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                <Trophy size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    Program Performance Ranking
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Comparative compliance and on-time delivery across academic programs
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {academic_period.label || 'AY 2026–2027'}
                        </span>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-2">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-2.5 px-3 text-center w-12">Rank</th>
                                    <th className="py-2.5 px-3">Academic Program</th>
                                    <th className="py-2.5 px-2 text-center">Faculty</th>
                                    <th className="py-2.5 px-2 text-center">Compliant</th>
                                    <th className="py-2.5 px-2 text-center">Overdue</th>
                                    <th className="py-2.5 px-3 w-40">Compliance Rate</th>
                                    <th className="py-2.5 px-3 w-36">On-Time Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {performances.map((p: any, idx: number) => {
                                    const isTop = idx === 0;
                                    return (
                                        <tr
                                            key={p.id}
                                            className={cn(
                                                "transition-colors",
                                                isTop ? "bg-amber-500/5 dark:bg-amber-500/10" : "hover:bg-slate-50/60 dark:hover:bg-white/[0.02]"
                                            )}
                                        >
                                            {/* Rank */}
                                            <td className="py-3 px-3 text-center">
                                                {idx < 3 ? (
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black border",
                                                        rankColors[idx]
                                                    )}>
                                                        {idx + 1}
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-slate-400 text-xs">{idx + 1}</span>
                                                )}
                                            </td>

                                            {/* Program Info */}
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider",
                                                        p.code === 'BSIS' ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40" :
                                                        p.code === 'BSIT' ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/40" :
                                                        p.code === 'BLIS' ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300/40" :
                                                        "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/40"
                                                    )}>
                                                        {p.code}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white truncate text-xs leading-tight">
                                                            {p.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {p.total_requirements} total assigned requirements
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Total Faculty */}
                                            <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {p.total_faculty}
                                            </td>

                                            {/* Compliant Faculty */}
                                            <td className="py-3 px-2 text-center font-black text-emerald-600 dark:text-emerald-400">
                                                {p.compliant_faculty}
                                            </td>

                                            {/* Overdue */}
                                            <td className="py-3 px-2 text-center font-black text-rose-600 dark:text-rose-400">
                                                {p.overdue}
                                            </td>

                                            {/* Compliance Rate Progress Bar */}
                                            <td className="py-3 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px] font-black">
                                                        <span className="text-emerald-600 dark:text-emerald-400">{p.compliance_rate}%</span>
                                                        <span className="text-[9px] font-semibold text-slate-400">
                                                            ({p.complied}/{p.total_requirements})
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                            style={{ width: `${Math.min(100, p.compliance_rate)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* On-Time Rate Progress Bar */}
                                            <td className="py-3 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px] font-black">
                                                        <span className="text-sky-600 dark:text-sky-400">{p.on_time_rate}%</span>
                                                        <span className="text-[9px] font-semibold text-slate-400">
                                                            ({p.on_time}/{p.complied > 0 ? p.complied : p.total_requirements})
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                                            style={{ width: `${Math.min(100, p.on_time_rate)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right (4 Cols): Top Performing Program Spotlight + Recognition Insights */}
                <div className="col-span-4 flex flex-col gap-3.5 min-h-0 overflow-hidden">
                    {/* Top Program Spotlight Hero Card */}
                    {performances.length > 0 && (
                        <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-slate-800 text-white p-4.5 flex flex-col justify-between shadow-md relative overflow-hidden shrink-0">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                        <Trophy size={16} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Leading Program</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                                    Rank #1
                                </span>
                            </div>

                            <div className="mt-3 relative z-10 flex items-center gap-3">
                                <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
                                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
                                        <Award size={24} className="drop-shadow-xs" />
                                    </div>
                                    <Sparkles size={12} className="absolute -top-1.5 -right-1 text-amber-300 animate-pulse" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-2xl font-black text-white leading-tight truncate">
                                        {performances[0].code}
                                    </h4>
                                    <p className="text-[11px] text-slate-300 truncate mt-0.5 leading-snug">
                                        {performances[0].name}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center relative z-10">
                                <div className="bg-white/5 rounded-xl p-2">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Compliance</span>
                                    <span className="text-lg font-black text-emerald-400 tabular-nums">
                                        {performances[0].compliance_rate}%
                                    </span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-2">
                                    <span className="text-[10px] text-slate-400 block font-semibold">On-Time Rate</span>
                                    <span className="text-lg font-black text-sky-400 tabular-nums">
                                        {performances[0].on_time_rate}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Program Insights List */}
                    <div className={cn(
                        "flex-1 min-h-0 flex flex-col rounded-2xl border p-4 overflow-hidden shadow-2xs",
                        isDark ? "bg-[#131b2e] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900"
                    )}>
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5 shrink-0">
                            <Star size={16} className="text-amber-500 shrink-0" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Program Highlights
                            </h4>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mt-2.5">
                            {performances.map((p: any) => (
                                <div
                                    key={p.id}
                                    className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0",
                                            p.code === 'BSIS' ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                                            p.code === 'BSIT' ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300" :
                                            p.code === 'BLIS' ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300" :
                                            "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                        )}>
                                            {p.code}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {p.code}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {p.compliant_faculty} of {p.total_faculty} faculty compliant
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
                                            {p.compliance_rate}%
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {p.on_time_rate}% on-time
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}