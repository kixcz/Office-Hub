import { Head, router } from '@inertiajs/react';
import { Calendar, Clock as ClockIcon, MapPin, Megaphone, WifiOff, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Announcement {
    id: number;
    title: string;
    message: string;
    priority: string;
    created_at: string;
}

interface Meeting {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
}

interface Props {
    announcements: Announcement[];
    meetings: Meeting[];
}

const PER_PAGE = 2; // announcements per page
const ROTATE_MS = 15_000; // page rotation
const REFRESH_MS = 60_000; // data refresh
const STALE_MS = 3 * 60_000; // show offline notice after this long without a sync

const PRIORITY = {
    high: { rank: 0, label: 'Urgent', bar: 'from-rose-500 to-red-600', chip: 'bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
    medium: { rank: 1, label: 'Important', bar: 'from-amber-400 to-orange-500', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
    low: { rank: 2, label: 'General', bar: 'from-sky-400 to-blue-600', chip: 'bg-sky-500/20 text-sky-300 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]' },
} as const;

const getPriority = (p: string) => PRIORITY[p as keyof typeof PRIORITY] ?? PRIORITY.low;

const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function useNow(intervalMs: number) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}

function Clock() {
    const now = useNow(1000);
    return (
        <div className="text-right flex flex-col items-end">
            <div className="text-6xl font-extrabold tabular-nums tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                {fmtTime(now)}
            </div>
            <div className="mt-1 text-xl font-medium text-slate-400 uppercase tracking-widest">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
        </div>
    );
}

function SyncStatus({ lastSync }: { lastSync: number }) {
    const now = useNow(15_000);
    if (now.getTime() - lastSync < STALE_MS) return null;
    return (
        <div className="flex items-center gap-3 rounded-full bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-lg font-medium text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <span>Offline • Last sync {fmtTime(new Date(lastSync))}</span>
        </div>
    );
}

function Announcements({ items }: { items: Announcement[] }) {
    const sorted = useMemo(
        () =>
            [...items].sort(
                (a, b) =>
                    getPriority(a.priority).rank - getPriority(b.priority).rank ||
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            ),
        [items],
    );

    const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
    const [page, setPage] = useState(0);

    useEffect(() => {
        if (pages < 2) {
            setPage(0);
            return;
        }
        const t = setInterval(() => setPage((p) => (p + 1) % pages), ROTATE_MS);
        return () => clearInterval(t);
    }, [pages]);

    const current = Math.min(page, pages - 1);
    const visible = sorted.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

    return (
        <section className="col-span-8 flex min-h-0 flex-col gap-6">
            <style>{'@keyframes tv-fill{from{width:0}to{width:100%}} @keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>

            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/30">
                        <Megaphone className="h-8 w-8" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">Notice Board</h2>
                </div>
                {pages > 1 && (
                    <div className="flex gap-3" aria-hidden>
                        {Array.from({ length: pages }).map((_, i) => (
                            <div key={i} className="h-2 w-16 overflow-hidden rounded-full bg-slate-800 border border-slate-700/50 shadow-inner">
                                {i === current && (
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                                        style={{ animation: `tv-fill ${ROTATE_MS}ms linear forwards` }}
                                    />
                                )}
                                {i < current && <div className="h-full w-full bg-indigo-500/40" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {visible.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-md text-slate-500 shadow-2xl">
                    <Sparkles className="mb-6 h-24 w-24 opacity-20" />
                    <p className="text-4xl font-light tracking-wide">All caught up</p>
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-6">
                    {visible.map((a, i) => {
                        const p = getPriority(a.priority);
                        return (
                            <article
                                key={a.id + '-' + page}
                                className={`relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl shadow-2xl transition-all duration-700 ${visible.length > 1 ? 'flex-1' : 'max-h-full flex-none'
                                    }`}
                                style={{ animation: `fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s both` }}
                            >
                                <span className={`absolute inset-y-0 left-0 w-2 bg-gradient-to-b ${p.bar}`} />
                                <div className="flex min-h-0 flex-1 flex-col gap-5 py-8 pr-10 pl-12">
                                    <div className="flex items-start justify-between gap-6">
                                        <h3 className="text-4xl leading-tight font-extrabold text-white tracking-tight drop-shadow-sm">{a.title}</h3>
                                        <span
                                            className={`shrink-0 rounded-full px-5 py-2 text-lg font-bold border uppercase tracking-wider ${p.chip}`}
                                        >
                                            {p.label}
                                        </span>
                                    </div>
                                    <p className="line-clamp-6 text-2xl leading-relaxed whitespace-pre-wrap text-slate-300 font-medium">
                                        {a.message}
                                    </p>
                                    <p className="mt-auto text-lg text-slate-500 font-medium uppercase tracking-widest flex items-center gap-2">
                                        <ClockIcon className="w-5 h-5 opacity-50" />
                                        Posted{' '}
                                        {new Date(a.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function Schedule({ meetings }: { meetings: Meeting[] }) {
    const now = useNow(30_000);

    const items = useMemo(
        () =>
            meetings
                .map((m) => ({ ...m, s: new Date(m.start_time), e: new Date(m.end_time) }))
                .sort((a, b) => a.s.getTime() - b.s.getTime()),
        [meetings],
    );

    const statusOf = (m: { s: Date; e: Date }) => (now >= m.e ? 'done' : now >= m.s ? 'live' : 'upcoming');
    const focusId = items.find((m) => statusOf(m) !== 'done')?.id;

    const listRef = useRef<HTMLDivElement>(null);
    const focusRef = useRef<HTMLDivElement>(null);

    // Keep the current or next event at the top of the list; finished events scroll away.
    useEffect(() => {
        if (listRef.current && focusRef.current) {
            listRef.current.scrollTo({ top: focusRef.current.offsetTop - 20, behavior: 'smooth' });
        }
    }, [focusId]);

    return (
        <section className="col-span-4 flex min-h-0 flex-col gap-6 rounded-[2.5rem] border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 pb-2 relative z-10">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/30">
                    <Calendar className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">Today's Schedule</h2>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500 relative z-10">
                    <Calendar className="mb-4 h-20 w-20 opacity-20" />
                    <p className="text-3xl font-light tracking-wide">No events today</p>
                </div>
            ) : (
                <div ref={listRef} className="relative flex-1 space-y-5 overflow-hidden -mx-4 px-4 pb-4 mask-image-bottom z-10" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
                    {items.map((m) => {
                        const status = statusOf(m);
                        const live = status === 'live';
                        const isFocus = m.id === focusId;
                        const tag = live ? 'Happening Now' : isFocus ? 'Up Next' : null;

                        const surface = live
                            ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-white'
                            : isFocus
                                ? 'border-indigo-500/30 bg-slate-800/60 text-slate-200'
                                : status === 'done'
                                    ? 'bg-slate-900/40 border-slate-800/50 opacity-40 text-slate-400'
                                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300';
                                    
                        const muted = live ? 'text-emerald-200/80' : 'text-slate-500';

                        return (
                            <div
                                key={m.id}
                                ref={isFocus ? focusRef : undefined}
                                className={`rounded-3xl border p-7 transition-all duration-500 relative overflow-hidden ${surface}`}
                            >
                                {live && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                )}
                                
                                {tag && (
                                    <div className="flex items-center gap-2 mb-3">
                                        {live && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                                        <p className={`text-sm font-bold uppercase tracking-widest ${live ? 'text-emerald-400' : 'text-indigo-400'}`}>{tag}</p>
                                    </div>
                                )}
                                <div className={`flex items-center gap-3 text-3xl font-bold tabular-nums tracking-tight ${live ? 'text-white' : ''}`}>
                                    <ClockIcon className={`h-6 w-6 shrink-0 ${live ? 'text-emerald-400' : 'opacity-50'}`} />
                                    {fmtTime(m.s)} <span className="opacity-50 font-medium">–</span> {fmtTime(m.e)}
                                </div>
                                <h3 className={`mt-4 text-2xl leading-snug font-bold ${live ? 'text-emerald-50' : ''}`}>{m.title}</h3>
                                {m.location && (
                                    <div className={`mt-4 flex items-center gap-2.5 text-xl font-medium ${muted}`}>
                                        <MapPin className="h-6 w-6 shrink-0" />
                                        <span>{m.location}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default function TvDisplay({ announcements, meetings }: Props) {
    const [lastSync, setLastSync] = useState(() => Date.now());

    // Scale the whole UI with screen width so 1080p and 4K TVs render the same layout.
    useEffect(() => {
        const root = document.documentElement;
        const prev = root.style.fontSize;
        root.style.fontSize = 'clamp(12px, calc(100vw / 120), 40px)';
        return () => {
            root.style.fontSize = prev;
        };
    }, []);

    // Partial reload instead of a full page reload: no white flash, state survives.
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({
                only: ['announcements', 'meetings'],
                onSuccess: () => setLastSync(Date.now()),
            });
        }, REFRESH_MS);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="flex h-screen cursor-none flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 relative z-0">
            <Head title="CIDS TV Display" />
            
            {/* Ambient animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen" />
            </div>

            <header className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl relative z-10">
                <div className="flex items-center gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-white/10">
                        <span className="text-2xl font-black text-white tracking-wider">CIDS</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">College of Informatics and Computing Sciences</h1>
                        <p className="text-xl font-medium text-indigo-300/80 mt-1 uppercase tracking-widest">Office Information Display</p>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <SyncStatus lastSync={lastSync} />
                    <Clock />
                </div>
            </header>

            <main className="grid min-h-0 flex-1 grid-cols-12 gap-10 p-10 relative z-10">
                <Announcements items={announcements} />
                <Schedule meetings={meetings} />
            </main>
        </div>
    );
}