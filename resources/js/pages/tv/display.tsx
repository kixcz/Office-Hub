import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    FileText,
    Megaphone,
    Trophy,
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
} as const;

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TvDisplay({ slides, data, current_term }: any) {
    const activeSlides = useMemo(() => slides.filter((s: any) => s.is_active), [slides]);
    const count = activeSlides.length;

    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

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
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [step]);

    if (count === 0) {
        return (
            <TvLayout currentTerm={current_term}>
                <Head title="TV Display" />
                <div className="flex flex-1 items-center justify-center bg-slate-100 p-8">
                    <p className="text-3xl text-slate-500">No active slides configured.</p>
                </div>
            </TvLayout>
        );
    }

    return (
        <TvLayout currentTerm={current_term} title={currentSlide?.title || currentSlide?.type} lastUpdated={data?.slide5?.last_updated || data?.last_updated}>
            <Head title="TV Display" />
            <style>{'@keyframes tv-fill{from{width:0}to{width:100%}}'}</style>

            <div
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto bg-transparent px-8 pb-8 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {currentSlide.type === SLIDE_TYPES.one && <SlideOne data={data.slide1} slideConfig={currentSlide} />}
                {currentSlide.type === SLIDE_TYPES.two && <SlideTwo data={data.slide2} slideConfig={currentSlide} />}
                {currentSlide.type === SLIDE_TYPES.three && <SlideThree data={data.slide3} slideConfig={currentSlide} />}
                {currentSlide.type === SLIDE_TYPES.four && <SlideFour data={data.slide4} slideConfig={currentSlide} />}
                {currentSlide.type === SLIDE_TYPES.five && <SlideFive data={data.slide5} slideConfig={currentSlide} />}
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

            <footer className="z-40 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-8 py-4 text-lg text-slate-500 shadow-[0_-2px_8px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                    <span>Live display · Authorized internal view</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2" aria-hidden>
                        {activeSlides.map((_: any, i: number) => (
                            <div key={i} className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                                {i < safeIndex && <div className="h-full w-full bg-blue-900/40" />}
                                {i === safeIndex && (
                                    <div
                                        key={`${safeIndex}-${duration}`}
                                        className="h-full bg-blue-900"
                                        style={{ animation: `tv-fill ${duration}ms linear forwards` }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">
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

const TONES = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
} as const;
type Tone = keyof typeof TONES;

const CARD = 'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70';



function StatCard({
    icon: Icon,
    tone,
    label,
    value,
}: {
    icon: LucideIcon;
    tone: Tone;
    label: string;
    value: ReactNode;
}) {
    return (
        <div className={`flex items-center gap-5 p-5 ${CARD}`}>
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
                <Icon size={32} />
            </div>
            <div className="min-w-0">
                <p className="text-4xl leading-none font-bold text-slate-900 tabular-nums">{value}</p>
                <p className="mt-2 text-lg text-slate-500">{label}</p>
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
}: {
    title: string;
    icon?: LucideIcon;
    aside?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={`flex min-h-0 flex-col ${CARD} ${className}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5 sticky top-0 bg-white/95 backdrop-blur z-10 shrink-0">
                <h2 className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                    {Icon && <Icon size={28} className="text-blue-900" />}
                    {title}
                </h2>
                {aside}
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">{children}</div>
        </section>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return <p className="flex flex-1 items-center justify-center text-center text-xl text-slate-400">{children}</p>;
}

function More({ count, noun = 'more' }: { count: number; noun?: string }) {
    if (count <= 0) return null;
    return <p className="pt-1 text-center text-lg font-medium text-slate-400">+{count} {noun}</p>;
}

const slideRoot = 'flex flex-1 flex-col gap-6';

const rateColor = (rate: number) => (rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500');

/* -------------------------------------------------------------------------- */
/*  Slide 1 – Daily overview                                                   */
/* -------------------------------------------------------------------------- */

function SlideOne({ data, slideConfig }: any) {
    const announcements = data.announcements.slice(0, 3);
    const schedule = data.todays_schedule.slice(0, 5);
    const upcoming = data.upcoming_meetings.slice(0, 3);

    return (
        <div className={slideRoot}>

            <div className="grid grid-cols-4 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="Compliance rate" value={`${data.kpis.compliance_rate}%`} />
                <StatCard icon={Clock} tone="amber" label="Pending review" value={data.kpis.pending_review} />
                <StatCard icon={AlertTriangle} tone="rose" label="Overdue outputs" value={data.kpis.overdue_outputs} />
                <StatCard icon={CalendarIcon} tone="sky" label="Meetings this week" value={data.kpis.meetings_this_week} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="Announcements" icon={Megaphone} className="col-span-5">
                    {announcements.length > 0 ? (
                        <>
                            {announcements.map((a: any) => (
                                <article key={a.id} className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-100">
                                    <h3 className="text-2xl leading-snug font-semibold text-slate-900">{a.title}</h3>
                                    <p className="mt-1 text-base text-slate-500">By {a.author ? a.author.name : 'System'}</p>
                                    <p className="mt-2 line-clamp-3 text-xl leading-relaxed text-slate-700">{a.message}</p>
                                </article>
                            ))}
                            <More count={data.announcements.length - announcements.length} noun="more announcements" />
                        </>
                    ) : (
                        <Empty>No active announcements today.</Empty>
                    )}
                </Panel>

                <div className="col-span-7 flex min-h-0 flex-col gap-6">
                    <Panel title="Today's schedule" icon={CalendarIcon} className="flex-1 min-h-0">
                        {schedule.length > 0 ? (
                            <>
                                {schedule.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                        <div className="w-44 shrink-0 rounded-lg bg-blue-50 py-2 text-center text-xl font-semibold text-blue-900 tabular-nums">
                                            {item.time}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-2xl font-semibold text-slate-900">{item.title}</p>
                                            <p className="truncate text-lg text-slate-500">{item.venue}</p>
                                        </div>
                                        {item.type && (
                                            <span className="shrink-0 rounded-full bg-white px-4 py-1 text-base font-medium text-slate-600 ring-1 ring-slate-200">
                                                {item.type}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <More count={data.todays_schedule.length - schedule.length} />
                            </>
                        ) : (
                            <Empty>No meetings or activities scheduled for today.</Empty>
                        )}
                    </Panel>

                    <Panel title="Next 3 meetings" icon={Clock} className="shrink-0">
                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {upcoming.map((m: any) => (
                                    <div key={m.id} className="min-w-0 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                        <p className="text-lg font-semibold text-blue-800">{m.date}</p>
                                        <p className="mt-1 truncate text-xl font-semibold text-slate-900">{m.title}</p>
                                        <p className="truncate text-lg text-slate-500">{m.time}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty>No upcoming meetings scheduled.</Empty>
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

function SlideTwo({ data, slideConfig }: any) {
    const meetings = data.upcoming_meetings.slice(0, 4);
    const deadlines = data.upcoming_deadlines.slice(0, 4);

    return (
        <div className={slideRoot}>

            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CalendarIcon} tone="sky" label="Meetings this week" value={data.kpis.meetings_this_week} />
                <StatCard icon={Activity} tone="violet" label="Activities this week" value={data.kpis.activities_this_week} />
                <StatCard icon={AlertTriangle} tone="rose" label="Deadlines this week" value={data.kpis.deadlines_this_week} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="This week" icon={CalendarIcon} className="col-span-8">
                    <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
                        {data.weekly_schedule.map((day: any, i: number) => {
                            const [weekday, date] = String(day.date).split(',');
                            const items = day.items.slice(0, 4);
                            return (
                                <div
                                    key={i}
                                    className={`flex min-h-0 flex-col overflow-hidden rounded-xl ring-1 ${day.is_today ? 'shadow-md ring-2 ring-blue-900' : 'ring-slate-200'
                                        }`}
                                >
                                    <div
                                        className={`px-3 py-3 text-center ${day.is_today ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        <p className="text-xl font-semibold">{weekday}</p>
                                        <p className={`text-base ${day.is_today ? 'text-blue-100' : 'text-slate-500'}`}>{date}</p>
                                    </div>
                                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-white p-2">
                                        {items.length === 0 && (
                                            <p className="pt-4 text-center text-base text-slate-400">No events</p>
                                        )}
                                        {items.map((item: any, j: number) => (
                                            <div key={j} className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
                                                <p className="text-base font-semibold text-blue-800 tabular-nums">{item.time}</p>
                                                <p className="line-clamp-2 text-lg leading-snug text-slate-800">{item.title}</p>
                                            </div>
                                        ))}
                                        <More count={day.items.length - items.length} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Panel>

                <div className="col-span-4 flex min-h-0 flex-col gap-6">
                    <Panel title="Upcoming meetings" icon={Clock} className="flex-1 min-h-0">
                        {meetings.length > 0 ? (
                            meetings.map((m: any) => (
                                <div key={m.id} className="border-l-4 border-blue-900 py-0.5 pl-4">
                                    <p className="text-lg font-semibold text-blue-800">
                                        {m.date} · {m.time}
                                    </p>
                                    <p className="truncate text-xl font-semibold text-slate-900">{m.title}</p>
                                    <p className="truncate text-base text-slate-500">{m.venue}</p>
                                </div>
                            ))
                        ) : (
                            <Empty>No upcoming meetings.</Empty>
                        )}
                    </Panel>

                    <Panel title="Calendar highlights" icon={AlertTriangle} className="flex-1 min-h-0">
                        {deadlines.length > 0 ? (
                            deadlines.map((d: any) => (
                                <div
                                    key={d.id}
                                    className="flex items-center justify-between gap-4 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-100"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-xl font-semibold text-rose-950">{d.title}</p>
                                        <p className="text-base text-rose-700">Submission deadline</p>
                                    </div>
                                    <p className="shrink-0 text-xl font-semibold text-rose-700 tabular-nums">{d.due_date}</p>
                                </div>
                            ))
                        ) : (
                            <Empty>No upcoming deadlines.</Empty>
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
    Overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
    'Due Soon': 'bg-amber-50 text-amber-700 ring-amber-200',
};

function SlideThree({ data, slideConfig }: any) {
    const summary = data.compliance_summary.slice(0, 6);
    const pending = data.pending_outputs.slice(0, 6);

    return (
        <div className={slideRoot}>

            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="Overall compliance rate" value={`${data.kpis.compliance_rate}%`} />
                <StatCard icon={Clock} tone="amber" label="Pending outputs" value={data.kpis.pending_outputs} />
                <StatCard icon={AlertTriangle} tone="rose" label="Overdue outputs" value={data.kpis.overdue_outputs} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <Panel title="Compliance summary" icon={FileText} className="col-span-5">
                    <div className="flex flex-1 flex-col justify-start gap-6">
                        {summary.map((req: any) => (
                            <div key={req.id}>
                                <div className="mb-2 flex items-baseline justify-between gap-4">
                                    <span className="truncate text-xl font-semibold text-slate-800">{req.title}</span>
                                    <span className="shrink-0 text-lg text-slate-500 tabular-nums">
                                        <span className="font-semibold text-slate-900">{req.rate}%</span> · {req.complied}/{req.total}
                                    </span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className={`h-full rounded-full ${rateColor(req.rate)}`} style={{ width: `${req.rate}%` }} />
                                </div>
                            </div>
                        ))}
                        {summary.length === 0 && <Empty>No requirements to report.</Empty>}
                    </div>
                </Panel>

                <Panel title="Top 6 pending faculty outputs" icon={Clock} className="col-span-7">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-lg text-slate-500">
                                <th className="pb-3 font-medium">Faculty</th>
                                <th className="pb-3 font-medium">Program</th>
                                <th className="pb-3 font-medium">Output</th>
                                <th className="pb-3 font-medium">Deadline</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pending.length > 0 ? (
                                pending.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="py-4 pr-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.faculty)}&background=random`} alt={p.faculty} className="h-full w-full object-cover" />
                                                </div>
                                                <span className="text-xl font-semibold text-slate-900">{p.faculty}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-3 text-lg text-slate-600">{p.program}</td>
                                        <td className="py-4 pr-3 text-lg text-slate-700">{p.requirement}</td>
                                        <td className="py-4 pr-3 text-lg text-slate-600 tabular-nums">{p.due_date}</td>
                                        <td className="py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-base font-semibold ring-1 ${OUTPUT_STATUS[p.status] ?? 'bg-sky-50 text-sky-700 ring-sky-200'
                                                    }`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-xl text-slate-400">
                                        All currently due requirements are complete.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Panel>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 4 – Performance & recognition                                        */
/* -------------------------------------------------------------------------- */

function SlideFour({ data, slideConfig }: any) {
    const programs = data.top_programs.slice(0, 5);
    const faculty = data.top_faculty.slice(0, 5);
    const leader = data.top_programs[0];

    return (
        <div className={slideRoot}>

            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={CheckCircle} tone="emerald" label="College on-time rate" value={`${data.kpis.college_on_time_rate}%`} />
                <StatCard icon={Trophy} tone="amber" label="Faculty with zero overdue" value={data.kpis.zero_overdue_faculty} />
                <div className={`flex items-center p-5 ${CARD}`}>
                    <p className="text-xl leading-snug text-slate-600">
                        {leader ? (
                            <>
                                <span className="font-semibold text-slate-900">{leader.name}</span> leads with a{' '}
                                <span className="font-semibold text-slate-900">{leader.on_time_rate}%</span> on-time submission rate.
                            </>
                        ) : (
                            'No program rankings available yet.'
                        )}
                    </p>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
                <section className="col-span-5 flex min-h-0 flex-col rounded-2xl bg-blue-950 p-7 text-white shadow-lg">
                    <h2 className="mb-5 flex items-center gap-3 text-2xl font-semibold">
                        <Trophy size={28} className="text-amber-300" /> Top programs
                    </h2>
                    <div className="flex min-h-0 flex-1 flex-col justify-start gap-4 overflow-hidden mt-2">
                        {programs.map((p: any, i: number) => (
                            <div
                                key={p.id}
                                className={`flex items-center gap-5 rounded-xl px-5 py-4 ${i === 0 ? 'bg-white/10 ring-1 ring-white/20' : ''
                                    }`}
                            >
                                <span className={`w-12 text-4xl font-bold tabular-nums ${i === 0 ? 'text-amber-300' : 'text-blue-300'}`}>
                                    {i + 1}
                                </span>
                                <p className="min-w-0 flex-1 truncate text-3xl font-semibold">{p.name}</p>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-emerald-300 tabular-nums">{p.on_time_rate}%</p>
                                    <p className="text-base text-blue-200">On time</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Panel title="Top performing faculty" icon={Trophy} className="col-span-7">
                    {faculty.length > 0 ? (
                        faculty.map((f: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                <div className="flex min-w-0 items-center gap-5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-900">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-2xl font-semibold text-slate-900">{f.name}</p>
                                        <p className="truncate text-lg text-slate-500">{f.program}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-lg bg-emerald-50 px-4 py-2 text-xl font-semibold text-emerald-700 ring-1 ring-emerald-200 tabular-nums">
                                    {f.on_time_rate}% on time
                                </span>
                            </div>
                        ))
                    ) : (
                        <Empty>No faculty rankings available yet.</Empty>
                    )}
                </Panel>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Slide 5 – Classroom monitoring                                             */
/* -------------------------------------------------------------------------- */

const ROOM_STATUS: Record<string, { pill: string; dot: string }> = {
    Available: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    'In Use': { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
    Reserved: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    Maintenance: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
    Unavailable: { pill: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
};

function SlideFive({ data, slideConfig }: any) {
    const rooms = data.facilities.slice(0, 12);

    return (
        <div className={slideRoot}>
            <div className="grid grid-cols-3 gap-5">
                <StatCard icon={Activity} tone="sky" label="In use" value={data.kpis.in_use} />
                <StatCard icon={CheckCircle} tone="emerald" label="Available" value={data.kpis.available} />
                <StatCard icon={AlertTriangle} tone="rose" label="Under maintenance" value={data.kpis.maintenance} />
            </div>

            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-4 gap-5 overflow-hidden">
                {rooms.map((room: any) => {
                    const s = ROOM_STATUS[room.status] ?? ROOM_STATUS.Unavailable;
                    return (
                        <div key={room.id} className={`flex min-h-0 flex-col gap-3 overflow-hidden p-5 ${CARD}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="truncate text-2xl font-bold text-slate-900">{room.room_name}</h2>
                                    <p className="truncate text-base text-slate-500">{room.room_type}</p>
                                </div>
                                <span
                                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-base font-semibold ring-1 ${s.pill}`}
                                >
                                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                                    {room.status}
                                </span>
                            </div>

                            {room.current_class ? (
                                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                                    <p className="line-clamp-1 text-xl font-semibold text-slate-900">{room.current_class}</p>
                                    <p className="line-clamp-1 text-base text-slate-600">
                                        {room.instructor}
                                        {room.program ? ` · ${room.program}` : ''}
                                    </p>
                                    <p className="mt-1 text-base font-semibold text-blue-800 tabular-nums">
                                        {room.start_time?.substring(0, 5)} – {room.end_time?.substring(0, 5)}
                                    </p>
                                </div>
                            ) : room.remarks ? (
                                <p className="line-clamp-2 text-lg text-slate-600">{room.remarks}</p>
                            ) : null}

                            {room.next_schedule && (
                                <p className="mt-auto line-clamp-1 border-t border-slate-100 pt-3 text-base text-slate-600">
                                    <span className="font-semibold text-slate-800">Up next:</span> {room.next_schedule}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <More count={data.facilities.length - rooms.length} noun="more rooms" />
        </div>
    );
}