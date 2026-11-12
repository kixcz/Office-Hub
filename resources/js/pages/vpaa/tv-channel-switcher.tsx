import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Monitor,
    Projector,
    Radio,
    Tv,
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
}

interface Props {
    channels: Channel[];
    initial_channel: Channel;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Channel Switcher', href: '/vpaa/tv-channel-switcher' },
];

export default function VpaaTvChannelSwitcher({ channels, initial_channel }: Props) {
    const [selectedChannel, setSelectedChannel] = useState<Channel>(initial_channel || channels[0]);
    const [previewMode, setPreviewMode] = useState<'follow' | 'browse'>('follow');

    // Group channels by scope: Institution, Main Campus, Satellite Campus
    const institutionChannels = channels.filter((c) => c.scope_group === 'INSTITUTION');
    const mainCampusChannels = channels.filter((c) => c.scope_group === 'MAIN CAMPUS');
    const satelliteChannels = channels.filter((c) => c.scope_group === 'SATELLITE CAMPUS');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Channel Switcher" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Projector className="h-3.5 w-3.5 text-amber-300" />
                                <span>Fast Viewing Tool · Independent Personal Preview</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                TV Channel Switcher
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Move between TV channels instantaneously without changing what is currently playing on physical college screens.
                            </p>
                        </div>

                        {/* In-Header Quick Switch Dropdown Pill */}
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1.5">
                            <span className="text-xs font-bold text-white/80 px-2">Active Preview:</span>
                            <select
                                value={selectedChannel?.id}
                                onChange={(e) => {
                                    const chan = channels.find((c) => c.id === Number(e.target.value));
                                    if (chan) setSelectedChannel(chan);
                                }}
                                className="bg-[#0B3A67] text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-white/20 outline-none cursor-pointer"
                            >
                                {channels.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.college_code === 'INSTITUTION' ? 'DSSC Academic TV' : `${c.college_code} TV`} (CH {c.channel_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Player Display Area */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                            </span>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                    Now Viewing (Personal Context)
                                </span>
                                <h2 className="text-xl font-black text-foreground">
                                    {selectedChannel?.name}
                                </h2>
                            </div>
                        </div>

                        {/* Mode Toggle: Follow Live Channel vs Browse Playlist */}
                        <div className="inline-flex items-center gap-1 rounded-2xl bg-muted p-1 text-xs font-semibold self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('follow')}
                                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                    previewMode === 'follow'
                                        ? 'bg-card text-foreground font-bold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                ● Follow Live Channel
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('browse')}
                                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                    previewMode === 'browse'
                                        ? 'bg-card text-foreground font-bold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                ○ Browse Playlist
                            </button>
                        </div>
                    </div>

                    {/* Simulated Screen Player */}
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] border border-slate-800 flex flex-col justify-between p-6 md:p-8 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-xl bg-black/40 px-3.5 py-1.5 text-xs backdrop-blur-md border border-white/10">
                                <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                                <span className="font-extrabold">
                                    {selectedChannel?.college_code} · CHANNEL {selectedChannel?.channel_number}
                                </span>
                            </div>
                            <span className="text-xs text-white/70">
                                Last Synced: {selectedChannel?.last_heartbeat}
                            </span>
                        </div>

                        <div className="my-auto space-y-3 max-w-2xl">
                            <div className="inline-block rounded-md bg-[#8B1E3F]/90 px-3 py-1 text-xs font-black uppercase tracking-wider">
                                Live Broadcast Slide
                            </div>
                            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
                                {selectedChannel?.current_slide}
                            </h3>
                            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                Active Playlist: <span className="font-semibold text-white">{selectedChannel?.playlist_name}</span>
                            </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
                            <span>VPAA Preview Isolated: Physical screen unaffected</span>
                            <a
                                href={`/tv-display/${selectedChannel?.device_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-sky-400 hover:underline flex items-center gap-1"
                            >
                                Open Live Stream in New Tab &gt;
                            </a>
                        </div>
                    </div>
                </div>

                {/* Channel Selector Wall (Grouped by Scope) */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-foreground mb-1">Available TV Channels</h3>
                        <p className="text-xs text-muted-foreground">Select a channel to switch your preview stream.</p>
                    </div>

                    {/* Group 1: Institution */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Institution Wide
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {institutionChannels.map((c) => {
                                const isSelected = selectedChannel?.id === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedChannel(c)}
                                        className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                : 'border-border/70 bg-card hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                                                DSSC
                                            </div>
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                                Live
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{c.name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{c.current_slide}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Group 2: Main Campus */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Main Campus Colleges
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mainCampusChannels.map((c) => {
                                const isSelected = selectedChannel?.id === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedChannel(c)}
                                        className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                : 'border-border/70 bg-card hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                                                {c.college_code}
                                            </div>
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                                CH {c.channel_number}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{c.name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.current_slide}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Group 3: Satellite Campuses */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Satellite Campuses & External Entities
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {satelliteChannels.map((c) => {
                                const isSelected = selectedChannel?.id === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedChannel(c)}
                                        className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                : 'border-border/70 bg-card hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                                                SULOP
                                            </div>
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                                CH {c.channel_number}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{c.name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.current_slide}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

