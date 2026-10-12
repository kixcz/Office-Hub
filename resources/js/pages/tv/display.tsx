import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Award,
    BarChart2,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    Globe,
    GraduationCap,
    HeartPulse,
    Laptop,
    Megaphone,
    Monitor,
    Radio,
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
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import TvLayout from '@/layouts/tv-layout';

const FADE_MS = 500;

const SLIDE_TYPES = {
    one: 'Slide 1 - Daily Overview',
    two: 'Slide 2 - Schedule & Meetings',
    three: 'Slide 3 - Compliance Monitoring',
    four: 'Slide 4 - Performance & Recognition',
    five: 'Slide 5 - Classroom Monitoring',
    six: 'Slide 6 - Class Monitoring',
    seven: 'Slide 7 - Faculty Schedule',
} as const;

/* -------------------------------------------------------------------------- */
/*  Main TV Display Page                                                       */
/* -------------------------------------------------------------------------- */

export default function TvDisplay({ slides, data, current_term }: any) {
    const activeSlides = useMemo(() => slides.filter((s: any) => s.is_active), [slides]);
    const count = activeSlides.length;
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

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
        if (count === 0) return;
        const timer = window.setTimeout(() => step(1), duration);
        return () => window.clearTimeout(timer);
    }, [safeIndex, count, duration, step]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 't' || e.key === 'T') toggleDark();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [step]);

    if (count === 0) {
        return (
            <TvLayout currentTerm={current_term} isDark={isDark} onToggleDark={toggleDark}>
                <Head title="TV Display" />
                <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
                    <p className="text-2xl font-medium">No active slides. Activate a slide in settings to start the display.</p>
                </div>
            </TvLayout>
        );
    }

    return (
        <TvLayout
            currentTerm={current_term}
            title={currentSlide?.title || currentSlide?.type}
            lastUpdated={data?.slide6?.last_updated || data?.slide5?.last_updated || data?.last_updated}
            isDark={isDark}
            onToggleDark={toggleDark}
        >
            <Head title="TV Display" />
            <style>{'@keyframes tv-fill{from{width:0}to{width:100%}}'}</style>

            {/* Slide Container */}
            <div
                className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent px-8 pb-3 transition-opacity duration-500 ${
                    fade ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {currentSlide.type === SLIDE_TYPES.one && <SlideOne data={data.slide1} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.two && <SlideTwo data={data.slide2} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.three && <SlideThree data={data.slide3} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.four && <SlideFour data={data.slide4} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.five && <SlideFive data={data.slide5} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.six && <SlideSix data={data.slide6} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.seven && <SlideSeven data={data.slide7} isDark={isDark} />}
            </div>

            {/* Footer - Styled precisely as in reference images */}
            <footer className="z-30 flex shrink-0 items-center justify-between px-8 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                    <span>
                        Live display <strong className="font-semibold text-slate-800 dark:text-slate-200">CIDS OfficeHub</strong>
                    </span>
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
                                        style={{ animation: `tv-fill ${duration}ms linear forwards` }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {safeIndex + 1} / {count}
                    </span>

                    {/* Circular slide arrow buttons matching screenshot */}
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
                            aria-label="Next slide"
                            onClick={() => step(1)}
                            className="h-7 w-7 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center hover:bg-blue-700 shadow-2xs cursor-pointer transition-transform active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </footer>
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
            className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${
                accent
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
            className={`flex min-h-0 min-w-0 flex-col rounded-2xl p-5 overflow-hidden ${
                isDark
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
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                TONE_BOX[tone][isDark ? 'dark' : 'light']
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
                                        className={`rounded-xl p-4 border transition-all ${
                                            idx === 0
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
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                idx === 0
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
                                    className={`flex h-full min-h-0 flex-col rounded-xl border ${
                                        day.is_today
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
/* -------------------------------------------------------------------------- */

function SlideThree({ data, isDark = false }: any) {
    const summary = data.compliance_summary || [];
    const pending = data.pending_outputs || [];

    return (
        <div className="grid h-full min-h-0 flex-1 grid-cols-12 gap-4">
            <div className="col-span-3 flex h-full min-h-0 flex-col gap-4">
                <Kpi icon={ShieldCheck} tone="amber" accent label="Compliance rate" value={`${data.kpis.compliance_rate}%`} isDark={isDark} />
                <Kpi icon={Clock} tone="blue" label="Pending outputs" value={data.kpis.pending_outputs} isDark={isDark} />
                <Kpi icon={AlertTriangle} tone="rose" label="Overdue outputs" value={data.kpis.overdue_outputs} isDark={isDark} />
            </div>

            <BentoTile title="Compliance summary" icon={FileText} iconTone="blue" className="col-span-4 h-full min-h-0" isDark={isDark}>
                <div className="space-y-4">
                    {summary.map((req: any) => (
                        <div key={req.id} className="rounded-xl p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{req.title}</span>
                                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                    <strong className="font-extrabold text-slate-800 dark:text-slate-200">{req.rate}%</strong> · {req.complied}/{req.total}
                                </span>
                            </div>
                            <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        req.rate >= 80 ? 'bg-emerald-500' : req.rate >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${req.rate}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </BentoTile>

            <BentoTile title="Pending & overdue" icon={AlertCircle} iconTone="rose" className="col-span-5 h-full min-h-0" isDark={isDark}>
                <div className="space-y-3">
                    {pending.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.faculty}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {p.requirement} · {p.program}
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                                <Pill tone={p.status === 'Overdue' ? 'rose' : 'amber'} isDark={isDark}>
                                    {p.status}
                                </Pill>
                                <p className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">Due {p.due_date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </BentoTile>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 4 – Performance & Recognition (Reference Image 1)                    */
/* -------------------------------------------------------------------------- */

function SlideFour({ data, isDark = false }: any) {
    const programs = data?.top_programs || [];
    const faculty = data?.top_faculty || [];
    const topProgram = programs[0] || { name: 'BSIT', on_time_rate: 77.8 };

    const fallbackFaculty = [
        { name: 'Domingo Origines', program: 'BSIT', on_time_rate: 100 },
        { name: 'Jean Nikolai Roxas', program: 'BSIT', on_time_rate: 66.7 },
        { name: 'Jerry Oriente', program: 'BSIT', on_time_rate: 66.7 },
        { name: 'Rhea Mae Perito', program: 'BSIS', on_time_rate: 66.7 },
        { name: 'Ivan Millan', program: 'BSIS', on_time_rate: 66.7 },
    ];
    const displayFaculty = faculty.length > 0 ? faculty.slice(0, 5) : fallbackFaculty;

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
            {/* Top Row: Top Program Hero + 2 KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                {/* 1. Top Program Hero Card */}
                <div className="rounded-2xl bg-[#0F172A] border border-slate-800 text-white p-5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                                <Trophy size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Top Program</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full text-slate-200">
                                This Semester
                            </span>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                        <div className="min-w-0 pr-4">
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white truncate">
                                {topProgram.name}
                            </h2>
                        </div>
                        <div className="h-10 w-px bg-white/15 shrink-0" />
                        <div className="pl-4 shrink-0 text-left">
                            <p className="text-3xl font-extrabold text-amber-400 tabular-nums leading-none">
                                {topProgram.on_time_rate}%
                            </p>
                            <p className="text-xs font-medium text-slate-300 mt-1">On-time rate</p>
                        </div>
                    </div>
                </div>

                {/* 2. College On-Time Rate KPI */}
                <div
                    className={`rounded-2xl p-5 flex items-center justify-between gap-3 border ${
                        isDark
                            ? 'bg-[#131b2e] border-white/10 text-white'
                            : 'bg-emerald-50/60 border-emerald-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    }`}
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">College on-time rate</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                                {data?.kpis?.college_on_time_rate ?? 63.9}%
                            </p>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                <ArrowUpRight size={13} /> 12% vs. last semester
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <MiniWave positive />
                    </div>
                </div>

                {/* 3. Zero Overdue Faculty KPI */}
                <div
                    className={`rounded-2xl p-5 flex items-center justify-between gap-3 border ${
                        isDark
                            ? 'bg-[#131b2e] border-white/10 text-white'
                            : 'bg-amber-50/60 border-amber-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    }`}
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <FileText size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Zero overdue faculty</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                                {data?.kpis?.zero_overdue_faculty ?? 1}
                            </p>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                <ArrowUpRight size={13} /> 2 vs. last semester
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 opacity-80">
                        <MiniBars tone="amber" />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Faculty (Left) & Recent Outputs / Highlights (Right) */}
            <div className="grid h-full min-h-0 flex-1 grid-cols-12 gap-4">
                {/* Left Column: Top Performing Faculty */}
                <div
                    className={`col-span-7 h-full min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${
                        isDark
                            ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                            : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    }`}
                >
                    <div className="flex shrink-0 items-center justify-between pb-3">
                        <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-amber-500 shrink-0" />
                            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Top Performing Faculty</h2>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                            This Semester
                        </span>
                    </div>

                    <div className="mt-2 flex flex-col gap-2.5">
                        {displayFaculty.map((f: any, i: number) => {
                            const rankColors = [
                                'bg-amber-400 text-slate-950 font-black',
                                'bg-slate-300 text-slate-800 font-bold',
                                'bg-[#c2652b] text-white font-bold',
                                'bg-slate-200 text-slate-700 font-bold',
                                'bg-slate-200 text-slate-700 font-bold',
                            ];
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${rankColors[i] || 'bg-slate-100 text-slate-600'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="h-8 w-8 rounded-full bg-slate-200/70 dark:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-300 shrink-0">
                                            <User size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white leading-tight">{f.name}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{f.program}</p>
                                            <div className="w-28 sm:w-32 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 mt-1.5 overflow-hidden">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${f.on_time_rate}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">{f.on_time_rate}%</p>
                                        <p className="text-[10px] text-slate-400 font-medium">on time</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Recent Outputs & Highlights */}
                <div className="col-span-5 flex h-full min-h-0 flex-col gap-4">
                    {/* Recent Outputs Status */}
                    <div
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${
                            isDark
                                ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                                : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}
                    >
                        <div className="flex shrink-0 items-center gap-2 pb-3">
                            <FileText size={20} className="text-amber-500 shrink-0" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Outputs Status</h2>
                        </div>
                        <div className="mt-1 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">TOS/TQ Submission</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Deadline: Oct 10, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 shrink-0">
                                    3 pending
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <Users size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Faculty Workload</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Deadline: Oct 12, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                                    2 pending
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Compliance Review</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Deadline: Oct 15, 2026</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0">
                                    In progress
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* This Week's Highlights */}
                    <div
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${
                            isDark
                                ? 'bg-[#131b2e] border-white/10 text-white shadow-none'
                                : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                        }`}
                    >
                        <div className="flex shrink-0 items-center gap-2 pb-3">
                            <Star size={20} className="text-amber-500 shrink-0" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">This Week's Highlights</h2>
                        </div>
                        <div className="mt-1 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">BSIT</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Highest improvement rate</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                    ↑ 12%
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <Users size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">4 faculty members</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">with zero overdue items</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md">
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
            <div className="h-full min-h-0 flex-1 overflow-y-auto tv-scrollbar overscroll-contain pr-1">
                <div className="grid grid-cols-4 gap-3.5 pb-2">
                    {rooms.map((room: any) => {
                        const tone = ROOM_TONE[room.status] ?? 'blue';
                        const isOccupied = room.status === 'In Use';
                        return (
                            <div
                                key={room.id}
                                className={`flex min-h-[175px] flex-col justify-between rounded-2xl p-4 border transition-all ${
                                    isDark ? 'bg-[#131b2e] border-white/10' : 'bg-white border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                                } ${isOccupied ? 'ring-2 ring-amber-400/80' : ''}`}
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
                <div className={`col-span-8 h-full min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${
                    isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
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
                            <thead className={`sticky top-0 z-20 backdrop-blur-md border-b text-xs font-bold uppercase tracking-wider ${
                                isDark ? 'bg-[#131b2e]/95 border-white/10 text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-500'
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
                                    const rankBadge =
                                        idx === 0 ? 'bg-amber-400 text-slate-950 font-black' :
                                        idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' :
                                        idx === 2 ? 'bg-amber-700/80 text-white font-bold' :
                                        'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400';
                                    return (
                                        <tr key={r.instructor} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2.5 pr-2 pl-1">
                                                <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs ${rankBadge}`}>
                                                    {idx + 1}
                                                </span>
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
                    <div className={`h-[42%] min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${
                        isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
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
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.instructor}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <strong className="font-bold text-amber-600 dark:text-amber-400">{item.course_code}</strong>
                                                {item.course_title ? ` · ${item.course_title}` : ''}
                                                {item.section ? ` · ${item.section}` : ''}
                                            </p>
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
                    <div className={`flex-1 min-h-0 flex flex-col rounded-2xl p-4 border overflow-hidden ${
                        isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
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
                                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 tabular-nums">
                                        {group.total_classes} classes
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Timetable Full Schedule (Scrollable with sticky header) */}
                <div className={`col-span-7 h-full min-h-0 flex flex-col rounded-2xl p-5 border overflow-hidden ${
                    isDark ? 'bg-[#131b2e] border-white/10 text-white' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
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
                            <thead className={`sticky top-0 z-20 backdrop-blur-md border-b text-xs font-bold uppercase tracking-wider ${
                                isDark ? 'bg-[#131b2e]/95 border-white/10 text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-500'
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
                                            className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                                                isDone ? 'opacity-50 text-slate-400' : ''
                                            }`}
                                        >
                                            <td className={`py-2.5 pr-3 pl-1 font-bold whitespace-nowrap tabular-nums text-xs ${
                                                isLive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
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
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        isLive
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