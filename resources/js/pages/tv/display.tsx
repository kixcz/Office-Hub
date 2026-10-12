import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Calendar as CalendarIcon,
    CheckCircle,
    CheckCircle2,
    Clock,
    FileText,
    Globe,
    GraduationCap,
    HeartPulse,
    Megaphone,
    Monitor,
    Sparkles,
    Timer,
    Trophy,
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
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TvDisplay({ slides, data, current_term }: any) {
    const activeSlides = useMemo(() => slides.filter((s: any) => s.is_active), [slides]);
    const count = activeSlides.length;

    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    // Dark mode state persisted in localStorage
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('officehub_tv_theme');
            return saved === 'dark';
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

    // Scale the UI with screen width so 1080p and 4K TVs get the same layout.
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
            // Refresh data once per full cycle, right as the loop restarts.
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
                <div className={`flex flex-1 items-center justify-center p-8 ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    <p className="text-3xl">No active slides configured.</p>
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

            <div
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto bg-transparent px-8 pb-6 transition-opacity duration-500 ${
                    fade ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {currentSlide.type === SLIDE_TYPES.one && <SlideOne data={data.slide1} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.two && <SlideTwo data={data.slide2} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.three && <SlideThree data={data.slide3} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.four && <SlideFour data={data.slide4} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.five && <SlideFive data={data.slide5} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.six && <SlideSix data={data.slide6} slideConfig={currentSlide} isDark={isDark} />}
                {currentSlide.type === SLIDE_TYPES.seven && <SlideSeven data={data.slide7} slideConfig={currentSlide} isDark={isDark} />}
            </div>

            {/* Hidden manual navigation (mouse / remote) */}
            <button
                aria-label="Previous slide"
                onClick={() => step(-1)}
                className="fixed inset-y-0 left-0 z-50 w-24 cursor-pointer opacity-0"
            />
            <button
                aria-label="Next slide"
                onClick={() => step(1)}
                className="fixed inset-y-0 right-0 z-50 w-24 cursor-pointer opacity-0"
            />

            {/* Footer with yellow and white accents */}
            <footer
                className={`z-40 flex shrink-0 items-center justify-between border-t px-8 py-3 text-lg transition-colors duration-300 shadow-[0_-2px_8px_rgba(0,0,0,0.03)] ${
                    isDark
                        ? 'border-slate-800 bg-slate-900/95 text-slate-400 backdrop-blur'
                        : 'border-slate-200 bg-white text-slate-500'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                    </span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Live display · <span className="font-semibold text-amber-500">CIDS OfficeHub</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2" aria-hidden>
                        {activeSlides.map((_: any, i: number) => (
                            <div
                                key={i}
                                className={`h-2 w-16 overflow-hidden rounded-full ${
                                    isDark ? 'bg-slate-800' : 'bg-slate-200'
                                }`}
                            >
                                {i < safeIndex && <div className="h-full w-full bg-amber-500/50" />}
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
                    <span className={`font-semibold tabular-nums ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
                        {safeIndex + 1} / {count}
                    </span>
                </div>
            </footer>
        </TvLayout>
    );
}

/* -------------------------------------------------------------------------- */
/*  Shared building blocks                                                     */
/* -------------------------------------------------------------------------- */

const TONES_LIGHT = {
    yellow: 'bg-amber-100/80 text-amber-600 ring-1 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
    rose: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
    sky: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
    violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200',
} as const;

const TONES_DARK = {
    yellow: 'bg-amber-950/60 text-amber-400 ring-1 ring-amber-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-400 ring-1 ring-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-400 ring-1 ring-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-400 ring-1 ring-rose-500/30',
    sky: 'bg-sky-950/60 text-sky-400 ring-1 ring-sky-500/30',
    violet: 'bg-violet-950/60 text-violet-400 ring-1 ring-violet-500/30',
} as const;

type Tone = keyof typeof TONES_LIGHT;

function getCardClass(isDark: boolean) {
    return isDark
        ? 'rounded-2xl bg-slate-900/90 text-slate-100 shadow-md ring-1 ring-slate-800'
        : 'rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80';
}

function StatCard({
    icon: Icon,
    tone,
    label,
    value,
    sub,
    isDark = false,
}: {
    icon: LucideIcon;
    tone: Tone;
    label: string;
    value: ReactNode;
    sub?: string;
    isDark?: boolean;
}) {
    const toneClass = isDark ? TONES_DARK[tone] : TONES_LIGHT[tone];
    return (
        <div className={`flex items-center gap-5 p-5 ${getCardClass(isDark)}`}>
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
                <Icon size={32} />
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-4xl leading-none font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {value}
                </p>
                <p className={`mt-2 text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                {sub && <p className="mt-0.5 text-xs font-semibold text-amber-500">{sub}</p>}
            </div>
        </div>
    );
}

function Panel({
    title,
    icon: Icon,
    aside,
    className = '',
    children,
    isDark = false,
}: {
    title: string;
    icon?: LucideIcon;
    aside?: ReactNode;
    className?: string;
    children: ReactNode;
    isDark?: boolean;
}) {
    return (
        <section className={`flex min-h-0 flex-col ${getCardClass(isDark)} ${className}`}>
            <div
                className={`flex items-center justify-between border-b px-7 py-4 sticky top-0 z-10 shrink-0 backdrop-blur ${
                    isDark
                        ? 'border-slate-800 bg-slate-900/95'
                        : 'border-slate-100 bg-white/95'
                }`}
            >
                <h2 className={`flex items-center gap-3 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {Icon && <Icon size={28} className="text-amber-500" />}
                    {title}
                </h2>
                {aside}
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">{children}</div>
        </section>
    );
}

function Empty({ children, isDark = false }: { children: ReactNode; isDark?: boolean }) {
    return (
        <p className={`flex flex-1 items-center justify-center text-center text-xl ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {children}
        </p>
    );
}

function More({ count, noun = 'more', isDark = false }: { count: number; noun?: string; isDark?: boolean }) {
    if (count <= 0) return null;
    return <p className={`pt-1 text-center text-lg font-medium ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>+{count} {noun}</p>;
}

const slideRoot = 'flex flex-1 flex-col gap-6';

/* -------------------------------------------------------------------------- */
/*  Slide 1 – Daily overview                                                   */
/* -------------------------------------------------------------------------- */

function SlideOne({ data, slideConfig, isDark = false }: any) {
    const announcements = data.announcements.slice(0, 3);
    const schedule = data.todays_schedule.slice(0, 5);
    const upcoming = data.upcoming_meetings.slice(0, 3);

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-4 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="Compliance rate" value={`${data.kpis.compliance_rate}%`} isDark={isDark} />
                <StatCard icon={Clock} tone="amber" label="Pending review" value={data.kpis.pending_review} isDark={isDark} />
                <StatCard icon={AlertTriangle} tone="rose" label="Overdue outputs" value={data.kpis.overdue_outputs} isDark={isDark} />
                <StatCard icon={CalendarIcon} tone="yellow" label="Meetings this week" value={data.kpis.meetings_this_week} isDark={isDark} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="Announcements" icon={Megaphone} className="col-span-5" isDark={isDark}>
                    {announcements.length > 0 ? (
                        <>
                            {announcements.map((a: any) => (
                                <article
                                    key={a.id}
                                    className={`rounded-xl p-5 ring-1 ${
                                        isDark
                                            ? 'bg-slate-950/60 ring-slate-800'
                                            : 'bg-slate-50 ring-slate-100'
                                    }`}
                                >
                                    <h3 className={`text-2xl leading-snug font-bold ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
                                        {a.title}
                                    </h3>
                                    <p className={`mt-1 text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        By {a.author ? a.author.name : 'System'}
                                    </p>
                                    <p className={`mt-2 line-clamp-3 text-xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {a.message}
                                    </p>
                                </article>
                            ))}
                            <More count={data.announcements.length - announcements.length} noun="more announcements" isDark={isDark} />
                        </>
                    ) : (
                        <Empty isDark={isDark}>No active announcements today.</Empty>
                    )}
                </Panel>

                <div className="col-span-7 flex min-h-0 flex-col gap-6">
                    <Panel title="Today's schedule" icon={CalendarIcon} className="flex-1 min-h-0" isDark={isDark}>
                        {schedule.length > 0 ? (
                            <>
                                {schedule.map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-5 rounded-xl p-4 ring-1 ${
                                            isDark
                                                ? 'bg-slate-950/60 ring-slate-800'
                                                : 'bg-slate-50 ring-slate-100'
                                        }`}
                                    >
                                        <div className={`w-44 shrink-0 rounded-lg py-2 text-center text-xl font-bold tabular-nums ring-1 ${
                                            isDark
                                                ? 'bg-amber-950/40 text-amber-300 ring-amber-500/30'
                                                : 'bg-amber-50 text-amber-700 ring-amber-200'
                                        }`}>
                                            {item.time}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {item.title}
                                            </p>
                                            <p className={`truncate text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {item.venue}
                                            </p>
                                        </div>
                                        {item.type && (
                                            <span className={`shrink-0 rounded-full px-4 py-1 text-base font-semibold ring-1 ${
                                                isDark
                                                    ? 'bg-slate-900 text-amber-400 ring-amber-400/30'
                                                    : 'bg-white text-slate-700 ring-slate-200'
                                            }`}>
                                                {item.type}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <More count={data.todays_schedule.length - schedule.length} isDark={isDark} />
                            </>
                        ) : (
                            <Empty isDark={isDark}>No meetings or activities scheduled for today.</Empty>
                        )}
                    </Panel>

                    <Panel title="Next 3 meetings" icon={Clock} className="shrink-0" isDark={isDark}>
                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {upcoming.map((m: any) => (
                                    <div
                                        key={m.id}
                                        className={`min-w-0 rounded-xl p-4 ring-1 ${
                                            isDark
                                                ? 'bg-slate-950/60 ring-slate-800'
                                                : 'bg-slate-50 ring-slate-100'
                                        }`}
                                    >
                                        <p className="text-lg font-bold text-amber-500">{m.date}</p>
                                        <p className={`mt-1 truncate text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {m.title}
                                        </p>
                                        <p className={`truncate text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.time}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty isDark={isDark}>No upcoming meetings scheduled.</Empty>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 2 – Schedule & meetings                                              */
/* -------------------------------------------------------------------------- */

function SlideTwo({ data, slideConfig, isDark = false }: any) {
    const meetings = data.upcoming_meetings.slice(0, 4);
    const deadlines = data.upcoming_deadlines.slice(0, 4);

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CalendarIcon} tone="yellow" label="Meetings this week" value={data.kpis.meetings_this_week} isDark={isDark} />
                <StatCard icon={Activity} tone="sky" label="Activities this week" value={data.kpis.activities_this_week} isDark={isDark} />
                <StatCard icon={AlertTriangle} tone="rose" label="Deadlines this week" value={data.kpis.deadlines_this_week} isDark={isDark} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="This week" icon={CalendarIcon} className="col-span-8" isDark={isDark}>
                    <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
                        {data.weekly_schedule.map((day: any, i: number) => {
                            const [weekday, date] = String(day.date).split(',');
                            const items = day.items.slice(0, 4);
                            return (
                                <div
                                    key={i}
                                    className={`flex min-h-0 flex-col overflow-hidden rounded-xl ring-1 ${
                                        day.is_today
                                            ? 'shadow-md ring-2 ring-amber-400'
                                            : isDark ? 'ring-slate-800' : 'ring-slate-200'
                                    }`}
                                >
                                    <div
                                        className={`px-3 py-3 text-center ${
                                            day.is_today
                                                ? 'bg-amber-500 text-slate-950 font-black'
                                                : isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <p className="text-xl font-bold">{weekday}</p>
                                        <p className={`text-base ${day.is_today ? 'text-slate-900' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {date}
                                        </p>
                                    </div>
                                    <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 ${
                                        isDark ? 'bg-slate-900/60' : 'bg-white'
                                    }`}>
                                        {items.length === 0 && (
                                            <p className={`pt-4 text-center text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                No events
                                            </p>
                                        )}
                                        {items.map((item: any, j: number) => (
                                            <div
                                                key={j}
                                                className={`rounded-lg p-2.5 ring-1 ${
                                                    isDark
                                                        ? 'bg-slate-950/60 ring-slate-800'
                                                        : 'bg-slate-50 ring-slate-100'
                                                }`}
                                            >
                                                <p className="text-base font-bold text-amber-500 tabular-nums">{item.time}</p>
                                                <p className={`line-clamp-2 text-lg leading-snug font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    {item.title}
                                                </p>
                                            </div>
                                        ))}
                                        <More count={day.items.length - items.length} isDark={isDark} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Panel>

                <div className="col-span-4 flex min-h-0 flex-col gap-6">
                    <Panel title="Upcoming meetings" icon={Clock} className="flex-1 min-h-0" isDark={isDark}>
                        {meetings.length > 0 ? (
                            meetings.map((m: any) => (
                                <div key={m.id} className="border-l-4 border-amber-400 py-0.5 pl-4">
                                    <p className="text-lg font-bold text-amber-500">
                                        {m.date} · {m.time}
                                    </p>
                                    <p className={`truncate text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.title}</p>
                                    <p className={`truncate text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.venue}</p>
                                </div>
                            ))
                        ) : (
                            <Empty isDark={isDark}>No upcoming meetings.</Empty>
                        )}
                    </Panel>

                    <Panel title="Calendar highlights" icon={AlertTriangle} className="flex-1 min-h-0" isDark={isDark}>
                        {deadlines.length > 0 ? (
                            deadlines.map((d: any) => (
                                <div
                                    key={d.id}
                                    className={`flex items-center justify-between gap-4 rounded-xl p-4 ring-1 ${
                                        isDark
                                            ? 'bg-rose-950/30 ring-rose-500/20 text-rose-200'
                                            : 'bg-rose-50 ring-rose-100 text-rose-950'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-xl font-bold">{d.title}</p>
                                        <p className="text-base text-rose-400">Submission deadline</p>
                                    </div>
                                    <p className="shrink-0 text-xl font-bold text-rose-400 tabular-nums">{d.due_date}</p>
                                </div>
                            ))
                        ) : (
                            <Empty isDark={isDark}>No upcoming deadlines.</Empty>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 3 – Compliance monitoring                                            */
/* -------------------------------------------------------------------------- */

const OUTPUT_STATUS: Record<string, string> = {
    Overdue: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800',
    'Due Soon': 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
};

function SlideThree({ data, slideConfig, isDark = false }: any) {
    const summary = data.compliance_summary.slice(0, 6);
    const pending = data.pending_outputs.slice(0, 6);

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="Overall compliance rate" value={`${data.kpis.compliance_rate}%`} isDark={isDark} />
                <StatCard icon={Clock} tone="amber" label="Pending outputs" value={data.kpis.pending_outputs} isDark={isDark} />
                <StatCard icon={AlertTriangle} tone="rose" label="Overdue outputs" value={data.kpis.overdue_outputs} isDark={isDark} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="Compliance summary" icon={FileText} className="col-span-5" isDark={isDark}>
                    <div className="flex flex-1 flex-col justify-start gap-6">
                        {summary.map((req: any) => (
                            <div key={req.id}>
                                <div className="mb-2 flex items-baseline justify-between gap-4">
                                    <span className={`truncate text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {req.title}
                                    </span>
                                    <span className={`shrink-0 text-lg tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{req.rate}%</span> · {req.complied}/{req.total}
                                    </span>
                                </div>
                                <div className={`h-3.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
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
                </Panel>

                <Panel title="Pending & overdue submissions" icon={AlertCircle} className="col-span-7" isDark={isDark}>
                    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                        {pending.length > 0 ? (
                            pending.map((p: any) => (
                                <div
                                    key={p.id}
                                    className={`flex items-center justify-between gap-4 rounded-xl p-4 ring-1 ${
                                        isDark ? 'bg-slate-950/60 ring-slate-800' : 'bg-slate-50 ring-slate-100'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className={`truncate text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.faculty}</p>
                                        <p className={`truncate text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {p.requirement} · {p.program}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`rounded-full px-3 py-1 text-base font-semibold ring-1 ${OUTPUT_STATUS[p.status] || ''}`}>
                                            {p.status}
                                        </span>
                                        <p className={`mt-1 text-base tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Due {p.due_date}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty isDark={isDark}>All submissions are compliant.</Empty>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 4 – Performance & recognition                                        */
/* -------------------------------------------------------------------------- */

function SlideFour({ data, slideConfig, isDark = false }: any) {
    const programs = data.top_programs.slice(0, 3);
    const faculty = data.top_faculty.slice(0, 5);
    const leader = data.top_programs[0];

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="College on-time rate" value={`${data.kpis.college_on_time_rate}%`} isDark={isDark} />
                <StatCard icon={Trophy} tone="yellow" label="Faculty with zero overdue" value={data.kpis.zero_overdue_faculty} isDark={isDark} />
                <div className={`flex items-center p-5 ${getCardClass(isDark)} border-l-4 border-amber-400`}>
                    <p className={`text-xl leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {leader ? (
                            <>
                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{leader.name}</span> leads with a{' '}
                                <span className="font-extrabold text-amber-500">{leader.on_time_rate}%</span> on-time submission rate.
                            </>
                        ) : (
                            'No program rankings available yet.'
                        )}
                    </p>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <section className="col-span-5 flex min-h-0 flex-col rounded-2xl bg-amber-500 p-7 text-slate-950 shadow-lg">
                    <h2 className="mb-5 flex items-center gap-3 text-2xl font-black">
                        <Trophy size={28} className="text-white" /> Top programs
                    </h2>
                    <div className="flex min-h-0 flex-1 flex-col justify-start gap-4 overflow-hidden mt-2">
                        {programs.map((p: any, i: number) => (
                            <div
                                key={p.id}
                                className={`flex items-center gap-5 rounded-xl px-5 py-4 ${
                                    i === 0 ? 'bg-white/25 ring-2 ring-white/50' : 'bg-black/10'
                                }`}
                            >
                                <span className="w-12 text-4xl font-black tabular-nums text-white">
                                    {i + 1}
                                </span>
                                <p className="min-w-0 flex-1 truncate text-3xl font-bold">{p.name}</p>
                                <div className="text-right">
                                    <p className="text-3xl font-black tabular-nums text-white">{p.on_time_rate}%</p>
                                    <p className="text-base text-slate-900 font-semibold">On time</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Panel title="Top performing faculty" icon={Trophy} className="col-span-7" isDark={isDark}>
                    {faculty.length > 0 ? (
                        faculty.map((f: any, i: number) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-4 rounded-xl p-4 ring-1 ${
                                    isDark ? 'bg-slate-950/60 ring-slate-800' : 'bg-slate-50 ring-slate-100'
                                }`}
                            >
                                <div className="flex min-w-0 items-center gap-5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400 text-2xl font-black text-slate-950 shadow-sm">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`truncate text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.name}</p>
                                        <p className={`truncate text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.program}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-lg bg-emerald-500/15 px-4 py-2 text-xl font-bold text-emerald-500 ring-1 ring-emerald-500/30 tabular-nums">
                                    {f.on_time_rate}% on time
                                </span>
                            </div>
                        ))
                    ) : (
                        <Empty isDark={isDark}>No faculty rankings available yet.</Empty>
                    )}
                </Panel>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 5 – Classroom & Lab Monitoring (Who is currently in the lab)          */
/* -------------------------------------------------------------------------- */

const ROOM_STATUS_LIGHT: Record<string, { pill: string; dot: string }> = {
    Available: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    'In Use': { pill: 'bg-amber-50 text-amber-700 ring-amber-300 font-bold', dot: 'bg-amber-500 animate-pulse' },
    Reserved: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
    Maintenance: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
    Unavailable: { pill: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
};

const ROOM_STATUS_DARK: Record<string, { pill: string; dot: string }> = {
    Available: { pill: 'bg-emerald-950/60 text-emerald-300 ring-emerald-800', dot: 'bg-emerald-400' },
    'In Use': { pill: 'bg-amber-950/70 text-amber-300 ring-amber-500/50 font-bold', dot: 'bg-amber-400 animate-pulse' },
    Reserved: { pill: 'bg-sky-950/60 text-sky-300 ring-sky-800', dot: 'bg-sky-400' },
    Maintenance: { pill: 'bg-rose-950/60 text-rose-300 ring-rose-800', dot: 'bg-rose-400' },
    Unavailable: { pill: 'bg-slate-800 text-slate-300 ring-slate-700', dot: 'bg-slate-500' },
};

function SlideFive({ data, slideConfig, isDark = false }: any) {
    const rooms = data?.facilities?.slice(0, 12) || [];
    const statusMap = isDark ? ROOM_STATUS_DARK : ROOM_STATUS_LIGHT;

    // Identify who is currently in the lab
    const activeLabs = rooms.filter((r: any) => r.status === 'In Use' && r.instructor);

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-4 gap-5">
                <StatCard icon={Monitor} tone="yellow" label="Labs / Rooms in use" value={data?.kpis?.in_use ?? 0} isDark={isDark} />
                <StatCard icon={CheckCircle2} tone="emerald" label="Available rooms" value={data?.kpis?.available ?? 0} isDark={isDark} />
                <StatCard icon={AlertTriangle} tone="rose" label="Under maintenance" value={data?.kpis?.maintenance ?? 0} isDark={isDark} />
                <div className={`flex items-center gap-4 p-5 ${getCardClass(isDark)} border-l-4 border-amber-400`}>
                    <Users size={32} className="text-amber-500 shrink-0" />
                    <div className="min-w-0">
                        <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tabular-nums`}>
                            {activeLabs.length} Faculty
                        </p>
                        <p className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Currently in labs</p>
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-4 gap-5 overflow-hidden">
                {rooms.map((room: any) => {
                    const s = statusMap[room.status] ?? statusMap.Unavailable;
                    const isOccupied = room.status === 'In Use';

                    return (
                        <div
                            key={room.id}
                            className={`flex min-h-0 flex-col gap-3 overflow-hidden p-5 ${getCardClass(isDark)} ${
                                isOccupied ? 'ring-2 ring-amber-400/80 shadow-md' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className={`truncate text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {room.room_name}
                                        </h2>
                                        {isOccupied && (
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                                        )}
                                    </div>
                                    <p className={`truncate text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {room.room_type}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-base font-semibold ring-1 ${s.pill}`}
                                >
                                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                                    {room.status}
                                </span>
                            </div>

                            {room.current_class ? (
                                <div className={`rounded-xl p-3.5 ring-1 ${
                                    isDark ? 'bg-slate-950/80 ring-slate-800' : 'bg-amber-50/50 ring-amber-200/60'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={18} className="text-amber-500 shrink-0" />
                                        <p className={`line-clamp-1 text-xl font-bold ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
                                            {room.instructor || 'Instructor'}
                                        </p>
                                    </div>
                                    <p className={`mt-1 line-clamp-1 text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {room.current_class}
                                    </p>
                                    <p className={`line-clamp-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {room.program || 'Section'}
                                    </p>
                                    <p className="mt-2 text-sm font-bold text-amber-500 tabular-nums">
                                        {room.start_time?.substring(0, 5)} – {room.end_time?.substring(0, 5)}
                                    </p>
                                </div>
                            ) : room.remarks ? (
                                <p className={`line-clamp-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {room.remarks}
                                </p>
                            ) : (
                                <div className={`flex flex-1 items-center justify-center rounded-xl p-3 text-center ${
                                    isDark ? 'bg-slate-950/40 text-slate-500' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    <p className="text-base font-medium">Ready for next session</p>
                                </div>
                            )}

                            {room.next_schedule && (
                                <p className={`mt-auto line-clamp-1 border-t pt-3 text-sm ${
                                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                                }`}>
                                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Up next:</span>{' '}
                                    {room.next_schedule}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <More count={(data?.facilities?.length ?? 0) - rooms.length} noun="more rooms" isDark={isDark} />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 6 – Class & Lab Attendance Monitoring (Google Sheets Summary)        */
/* -------------------------------------------------------------------------- */

function SlideSix({ data, slideConfig, isDark = false }: any) {
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

    // Sort records: show those with highest activity or late/absences first, or alphabetical
    const displayRecords = useMemo(() => {
        return [...records].sort((a: any, b: any) => b.present - a.present);
    }, [records]);

    return (
        <div className={slideRoot}>
            {/* Top KPI row with yellow/white theme styling */}
            <div className="grid grid-cols-5 gap-5">
                <StatCard
                    icon={UserCheck}
                    tone="emerald"
                    label="Present classes"
                    value={kpis.present}
                    sub={highlights['Most Present'] ? `Top: ${highlights['Most Present']}` : undefined}
                    isDark={isDark}
                />
                <StatCard
                    icon={UserX}
                    tone="rose"
                    label="Absent classes"
                    value={kpis.absent}
                    sub={highlights['Most Absent'] ? `Most: ${highlights['Most Absent']}` : undefined}
                    isDark={isDark}
                />
                <StatCard
                    icon={Timer}
                    tone="amber"
                    label="Late entries"
                    value={kpis.late}
                    sub={highlights['Most Total Lates'] ? `Lates: ${highlights['Most Total Lates']}` : `${kpis.total_late_mins} mins total`}
                    isDark={isDark}
                />
                <StatCard
                    icon={Globe}
                    tone="yellow"
                    label="Online classes"
                    value={kpis.online}
                    sub={highlights['Most Online'] ? `Top: ${highlights['Most Online']}` : undefined}
                    isDark={isDark}
                />
                <StatCard
                    icon={HeartPulse}
                    tone="violet"
                    label="On-Leave classes"
                    value={kpis.on_leave}
                    sub={highlights['Most On-Leave'] ? `Top: ${highlights['Most On-Leave']}` : undefined}
                    isDark={isDark}
                />
            </div>

            {/* Split layout: Detailed Attendance Table + Highlights summary panel */}
            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6 overflow-hidden">
                {/* Faculty Attendance Table */}
                <section className={`col-span-8 flex min-h-0 flex-col overflow-hidden ${getCardClass(isDark)}`}>
                    <div
                        className={`flex items-center justify-between border-b px-7 py-4 shrink-0 backdrop-blur ${
                            isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-100 bg-white/95'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <FileText size={26} className="text-amber-500" />
                            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Faculty Attendance Breakdown
                            </h2>
                            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-bold text-amber-500 ring-1 ring-amber-400/30">
                                {records.length} Instructors
                            </span>
                        </div>
                        <span className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Live Google Sheets Summary
                        </span>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <table className="w-full border-collapse text-left">
                            <thead
                                className={`sticky top-0 z-10 text-sm font-black uppercase tracking-wider backdrop-blur ${
                                    isDark ? 'bg-slate-950/90 text-amber-400 border-b border-slate-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'
                                }`}
                            >
                                <tr>
                                    <th className="py-3 px-5">Instructor</th>
                                    <th className="py-3 px-4 text-center">Present</th>
                                    <th className="py-3 px-4 text-center">Absent</th>
                                    <th className="py-3 px-4 text-center">Late</th>
                                    <th className="py-3 px-4 text-center">Online</th>
                                    <th className="py-3 px-4 text-center">On-Leave</th>
                                    <th className="py-3 px-4 text-center">Sub/Insert</th>
                                    <th className="py-3 px-4 text-right pr-6">Late Mins</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y text-lg ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                                {displayRecords.map((r: any, idx: number) => {
                                    const isHighlighted = idx < 3;
                                    return (
                                        <tr
                                            key={r.instructor}
                                            className={`transition-colors ${
                                                isDark
                                                    ? 'hover:bg-slate-800/40 odd:bg-slate-900/30 even:bg-slate-900/60'
                                                    : 'hover:bg-amber-50/40 odd:bg-white even:bg-slate-50/50'
                                            }`}
                                        >
                                            <td className="py-2.5 px-5 font-bold">
                                                <div className="flex items-center gap-2">
                                                    {isHighlighted && (
                                                        <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                                                    )}
                                                    <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>
                                                        {r.instructor}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`inline-block min-w-8 rounded-md px-2 py-0.5 font-bold tabular-nums ${
                                                    r.present > 0
                                                        ? isDark ? 'bg-emerald-950/70 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                                                        : isDark ? 'text-slate-600' : 'text-slate-400'
                                                }`}>
                                                    {r.present}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`inline-block min-w-8 rounded-md px-2 py-0.5 font-bold tabular-nums ${
                                                    r.absent > 0
                                                        ? isDark ? 'bg-rose-950/70 text-rose-300' : 'bg-rose-50 text-rose-700'
                                                        : isDark ? 'text-slate-600' : 'text-slate-400'
                                                }`}>
                                                    {r.absent}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`inline-block min-w-8 rounded-md px-2 py-0.5 font-bold tabular-nums ${
                                                    r.late > 0
                                                        ? isDark ? 'bg-amber-950/70 text-amber-300' : 'bg-amber-100 text-amber-800'
                                                        : isDark ? 'text-slate-600' : 'text-slate-400'
                                                }`}>
                                                    {r.late}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center tabular-nums">
                                                <span className={r.online > 0 ? (isDark ? 'text-sky-300 font-bold' : 'text-sky-700 font-bold') : (isDark ? 'text-slate-600' : 'text-slate-400')}>
                                                    {r.online}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center tabular-nums">
                                                <span className={r.on_leave > 0 ? (isDark ? 'text-violet-300 font-bold' : 'text-violet-700 font-bold') : (isDark ? 'text-slate-600' : 'text-slate-400')}>
                                                    {r.on_leave}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center tabular-nums">
                                                <span className={r.sub_insert > 0 ? (isDark ? 'text-amber-300 font-bold' : 'text-amber-700 font-bold') : (isDark ? 'text-slate-600' : 'text-slate-400')}>
                                                    {r.sub_insert}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right pr-6 tabular-nums font-semibold">
                                                <span className={r.total_late_mins > 0 ? 'text-amber-500 font-bold' : isDark ? 'text-slate-600' : 'text-slate-400'}>
                                                    {r.total_late_mins > 0 ? `${r.total_late_mins} m` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Right Side: Key Highlights & Spreadsheet Summary Cards */}
                <div className="col-span-4 flex min-h-0 flex-col gap-5 overflow-hidden">
                    {/* Top Highlights Panel */}
                    <div className="rounded-2xl bg-amber-500 p-6 text-slate-950 shadow-md">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={24} className="text-white" />
                            <h3 className="text-xl font-black uppercase tracking-wider text-slate-950">
                                Monitoring Highlights
                            </h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {Object.entries(highlights).map(([label, value]: any) => (
                                <div key={label} className="rounded-xl bg-white/30 p-3 backdrop-blur-sm">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900/80">{label}</p>
                                    <p className="text-xl font-black text-slate-950 truncate mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Quick Stats Card */}
                    <Panel title="Attendance Summary" icon={Activity} className="flex-1 min-h-0" isDark={isDark}>
                        <div className="flex flex-col gap-4 justify-between h-full">
                            <div className={`rounded-xl p-4 ring-1 ${
                                isDark ? 'bg-slate-950/70 ring-slate-800' : 'bg-slate-50 ring-slate-100'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Faculty Tracked
                                    </span>
                                    <span className="text-2xl font-black text-amber-500 tabular-nums">{kpis.faculty_count}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t pt-2 border-slate-200 dark:border-slate-800">
                                    <span className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Total Classes Logged
                                    </span>
                                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tabular-nums`}>
                                        {kpis.present + kpis.absent + kpis.online + kpis.on_leave}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className={`rounded-xl p-3 text-center ring-1 ${
                                    isDark ? 'bg-emerald-950/50 ring-emerald-800/60' : 'bg-emerald-50 ring-emerald-200'
                                }`}>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Present Rate</p>
                                    <p className="text-3xl font-black text-emerald-500 tabular-nums mt-1">
                                        {kpis.present + kpis.absent > 0
                                            ? Math.round((kpis.present / (kpis.present + kpis.absent)) * 100)
                                            : 0}
                                        %
                                    </p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ring-1 ${
                                    isDark ? 'bg-rose-950/50 ring-rose-800/60' : 'bg-rose-50 ring-rose-200'
                                }`}>
                                    <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Absent Rate</p>
                                    <p className="text-3xl font-black text-rose-500 tabular-nums mt-1">
                                        {kpis.present + kpis.absent > 0
                                            ? Math.round((kpis.absent / (kpis.present + kpis.absent)) * 100)
                                            : 0}
                                        %
                                    </p>
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                                isDark ? 'bg-slate-950/50 text-slate-400' : 'bg-slate-100 text-slate-500'
                            }`}>
                                <span className="font-bold text-amber-500">Note:</span> Real-time attendance data synchronized from the Dean's Office / College monitoring spreadsheet.
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 7 - Faculty Schedule (Class & Lab Timetable)                         */
/* -------------------------------------------------------------------------- */

function SlideSeven({ data, slideConfig, isDark }: { data: any; slideConfig: any; isDark: boolean }) {
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

    // Filter states: 'all' | 'ongoing' | 'upcoming' | 'completed'
    const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Distinct rooms for quick pills
    const rooms = useMemo(() => {
        const unique = Array.from(new Set(schedules.map((s: any) => s.room_name))).filter(Boolean);
        return ['all', ...unique];
    }, [schedules]);

    // Filtered schedules
    const filteredSchedules = useMemo(() => {
        return schedules.filter((s: any) => {
            if (statusFilter !== 'all' && s.status?.toLowerCase() !== statusFilter) return false;
            if (roomFilter !== 'all' && s.room_name !== roomFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchInstructor = s.instructor?.toLowerCase().includes(q);
                const matchCourse = s.course_code?.toLowerCase().includes(q) || s.course_title?.toLowerCase().includes(q);
                const matchSection = s.section?.toLowerCase().includes(q);
                const matchRoom = s.room_name?.toLowerCase().includes(q);
                if (!matchInstructor && !matchCourse && !matchSection && !matchRoom) return false;
            }
            return true;
        });
    }, [schedules, statusFilter, roomFilter, searchQuery]);

    // Active ongoing classes right now
    const ongoingClasses = useMemo(() => {
        return schedules.filter((s: any) => s.status === 'Ongoing');
    }, [schedules]);

    return (
        <div className="flex flex-1 flex-col gap-6 overflow-hidden">
            {/* Top Stat Ribbon with Yellow / White accents */}
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label={`Total Classes (${day})`}
                    value={kpis.total_classes}
                    icon={CalendarIcon}
                    subtext={`${kpis.active_instructors} active faculty teaching`}
                    accent="amber"
                    isDark={isDark}
                />
                <MetricCard
                    label="In Session Right Now"
                    value={kpis.ongoing_classes}
                    icon={Clock}
                    subtext={currentTime ? `Active at ${currentTime}` : 'Currently ongoing in labs'}
                    accent="amber"
                    isDark={isDark}
                />
                <MetricCard
                    label="Upcoming Later Today"
                    value={kpis.upcoming_classes}
                    icon={Timer}
                    subtext="Remaining scheduled sessions"
                    accent="default"
                    isDark={isDark}
                />
                <MetricCard
                    label="Completed Sessions"
                    value={kpis.completed_classes}
                    icon={CheckCircle2}
                    subtext="Concluded for the day"
                    accent="default"
                    isDark={isDark}
                />
            </div>

            {/* Main Content Area: 2 Columns */}
            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6 overflow-hidden">
                {/* Left Column (5 cols): Currently Teaching Spotlight & Faculty Directory */}
                <div className="col-span-5 flex min-h-0 flex-col gap-5 overflow-hidden">
                    {/* Active Faculty In Lab Right Now */}
                    <div className="rounded-2xl border-2 border-amber-400 bg-amber-400/10 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3.5 w-3.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
                                </span>
                                <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    Faculty Currently in Session
                                </h3>
                            </div>
                            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950 uppercase">
                                {ongoingClasses.length} In Class
                            </span>
                        </div>

                        {ongoingClasses.length === 0 ? (
                            <div className={`rounded-xl p-4 text-center text-sm ${isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-white/80 text-slate-500'}`}>
                                No faculty currently in session at {currentTime || 'this hour'}. Next classes will appear here automatically.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                                {ongoingClasses.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between rounded-xl p-3 border transition-all ${
                                            isDark
                                                ? 'bg-slate-900/90 border-amber-400/40 text-white'
                                                : 'bg-white border-amber-300 text-slate-900 shadow-sm'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1 pr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-base truncate">{item.instructor}</span>
                                                <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950">
                                                    {item.room_name}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                <span className="font-bold text-amber-500">{item.course_code}</span> - {item.course_title || 'Class'}
                                            </p>
                                            {item.section && (
                                                <p className="text-[11px] text-slate-400 font-semibold">{item.section}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-black text-emerald-500">
                                                {item.start_time} - {item.end_time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Faculty Teaching Roster */}
                    <Panel title={`Faculty Teaching Today (${day})`} icon={Users} className="flex-1 min-h-0" isDark={isDark}>
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                                {facultyGroups.map((group: any, idx: number) => (
                                    <div
                                        key={group.instructor || idx}
                                        className={`flex items-center justify-between rounded-xl p-3 ring-1 transition-all ${
                                            group.has_ongoing
                                                ? isDark
                                                    ? 'bg-amber-950/40 ring-amber-400/50'
                                                    : 'bg-amber-50/80 ring-amber-300'
                                                : isDark
                                                ? 'bg-slate-950/60 ring-slate-800'
                                                : 'bg-slate-50 ring-slate-200'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {group.instructor}
                                                </span>
                                                {group.has_ongoing && (
                                                    <span className="rounded bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-white animate-pulse">
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                {group.rooms.map((r: string) => (
                                                    <span key={r} className="rounded bg-amber-400/20 text-amber-500 text-[10px] font-bold px-1.5 py-0.5">
                                                        {r}
                                                    </span>
                                                ))}
                                                {group.current_class && (
                                                    <span className="text-[11px] text-slate-400 truncate">
                                                        Now: {group.current_class.course_code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-base font-black text-amber-500 tabular-nums">
                                                {group.total_classes}
                                            </span>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Classes</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Right Column (7 cols): Full Day Timetable / Class Schedule */}
                <div className="col-span-7 flex min-h-0 flex-col overflow-hidden">
                    <Panel title={`Class & Laboratory Timetable - ${day}`} icon={Clock} className="flex-1 min-h-0" isDark={isDark}>
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Room and Status Filter Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                                {/* Room Pills */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold uppercase text-slate-400 mr-1">Room:</span>
                                    {rooms.map((rm) => (
                                        <button
                                            key={rm}
                                            onClick={() => setRoomFilter(rm)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                                roomFilter === rm
                                                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                                                    : isDark
                                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {rm === 'all' ? 'All Rooms' : rm}
                                        </button>
                                    ))}
                                </div>

                                {/* Status Pills */}
                                <div className="flex items-center gap-1">
                                    {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`rounded-lg px-2 py-1 text-xs font-bold capitalize transition-all ${
                                                statusFilter === st
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : isDark
                                                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                                                    : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule Table */}
                            <div className="flex-1 overflow-y-auto mt-3 pr-1">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className={`sticky top-0 z-10 border-b ${
                                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                                    }`}>
                                        <tr>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-amber-500">Time</th>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider">Room</th>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider">Faculty Instructor</th>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider">Course / Subject</th>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider">Section</th>
                                            <th className="py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {filteredSchedules.map((item: any) => {
                                            const isLive = item.status === 'Ongoing';
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`transition-colors ${
                                                        isLive
                                                            ? isDark
                                                                ? 'bg-amber-950/30 text-white font-medium'
                                                                : 'bg-amber-50/70 text-slate-950 font-medium'
                                                            : isDark
                                                            ? 'hover:bg-slate-800/40 text-slate-200'
                                                            : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-xs font-bold text-amber-500">
                                                        {item.start_time} - {item.end_time}
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950">
                                                            {item.room_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                                        {item.instructor}
                                                    </td>
                                                    <td className="py-2.5 px-3 max-w-[200px] truncate">
                                                        <span className="font-bold text-amber-500">{item.course_code}</span>
                                                        {item.course_title && ` - ${item.course_title}`}
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-400 font-semibold">
                                                        {item.section || '—'}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black uppercase ${
                                                                isLive
                                                                    ? 'bg-emerald-500 text-white animate-pulse'
                                                                    : item.status === 'Upcoming'
                                                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                                                    : isDark
                                                                    ? 'bg-slate-800 text-slate-400'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {isLive && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white"></span>}
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredSchedules.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    No schedule entries found for the selected criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}