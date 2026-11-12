import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Layers,
    Monitor,
    Radio,
    Search,
    SlidersHorizontal,
    Tv,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface Channel {
    id: number;
    device_code: string;
    name: string;
    college_code: string;
    college_name: string;
    channel_number: number;
    status: string;
    scope_group: string;
    last_heartbeat: string;
    current_slide: string;
    playlist_name: string;
    content_manager: string;
    open_issues: string;
}

interface Props {
    channels: Channel[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'College TV Channels', href: '/vpaa/tv-college-channels' },
];

export default function VpaaTvCollegeChannels({ channels }: Props) {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChannels = channels.filter((c) => {
        if (filterStatus === 'live' && c.status !== 'Live') return false;
        if (filterStatus === 'issues' && c.open_issues.startsWith('None')) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                c.name.toLowerCase().includes(q) ||
                c.college_code.toLowerCase().includes(q) ||
                c.content_manager.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA College TV Channels Directory" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Monitor className="h-3.5 w-3.5 text-amber-300" />
                                <span>Management & Oversight Directory · All Displays & Devices</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                College TV Channels Oversight
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Inspect physical display status, active playlists, content managers, and open sync issues across all colleges and entity screens.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/vpaa/tv-channel-switcher"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0B3A67] shadow-md hover:bg-neutral-100 transition-all cursor-pointer"
                            >
                                <Radio className="h-4 w-4 text-[#8B1E3F]" />
                                Live Channel Switcher &gt;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by college, channel name, or manager..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filterStatus === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            All ({channels.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('live')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filterStatus === 'live'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            Live Displays
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('issues')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filterStatus === 'issues'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            With Open Issues
                        </button>
                    </div>
                </div>

                {/* Directory Table */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="pb-3 pr-4">Channel & Scope</th>
                                    <th className="pb-3 px-3">Active Playlist</th>
                                    <th className="pb-3 px-3">Live Slide</th>
                                    <th className="pb-3 px-3">Content Manager</th>
                                    <th className="pb-3 px-3">Display Status</th>
                                    <th className="pb-3 px-3">Open Issues</th>
                                    <th className="pb-3 pl-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredChannels.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                                    {c.college_code === 'INSTITUTION' ? 'DSSC' : c.college_code}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-foreground text-sm truncate">{c.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        CH {c.channel_number} · {c.scope_group}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 text-xs text-foreground font-medium">
                                            {c.playlist_name}
                                        </td>
                                        <td className="py-4 px-3 text-xs text-muted-foreground line-clamp-1 max-w-[220px]">
                                            {c.current_slide}
                                        </td>
                                        <td className="py-4 px-3 text-xs text-foreground font-semibold">
                                            {c.content_manager}
                                        </td>
                                        <td className="py-4 px-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                                Live · {c.last_heartbeat}
                                            </span>
                                        </td>
                                        <td className="py-4 px-3 text-xs">
                                            {c.open_issues.startsWith('None') ? (
                                                <span className="text-muted-foreground">{c.open_issues}</span>
                                            ) : (
                                                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                    {c.open_issues}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 pl-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/vpaa/tv-channel-switcher?channel=${c.college_code}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
                                                >
                                                    Preview
                                                </Link>
                                                <a
                                                    href={`/tv-display/${c.device_code}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                                                >
                                                    Stream
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

