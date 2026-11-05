import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Cast,
    CheckCircle2,
    Clock,
    Eye,
    HelpCircle,
    Info,
    Layers,
    Monitor,
    Play,
    Radio,
    RefreshCw,
    Search,
    ShieldAlert,
    Tv,
    Video,
    Volume2,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Channel {
    id: string;
    name: string;
    entity: string;
    status: 'Live' | 'Standby';
    current_slide: string;
    next_slide: string;
    active_playlist: string;
    last_update: string;
    viewers: number;
}

interface Highlight {
    id: number;
    title: string;
    submitted_by: string;
    submitted_at: string;
    category: string;
    status: string;
    summary: string;
}

interface Props {
    initialTab?: 'executive-tv' | 'switcher' | 'college-channels' | 'highlights';
    collegeMetrics: Record<string, any>;
    channels?: Channel[];
    highlights?: Highlight[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'TV & Communications', href: '/vpaf/tv-communications' },
];

export default function VpafTvCommunications({
    initialTab = 'switcher',
    channels = [],
    highlights = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'executive-tv' | 'switcher' | 'college-channels' | 'highlights'>(
        initialTab
    );
    const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'ch-inst');
    const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: 'URGENT: Executive Institutional Advisory',
        message: 'All afternoon laboratory classes suspended effective 3:00 PM today due to regional weather disturbance warning issued by PAGASA. Compensatory make-up sessions will be coordinated by respective college deans.',
        duration_minutes: 60,
    });

    const handleTabChange = (tab: 'executive-tv' | 'switcher' | 'college-channels' | 'highlights') => {
        setActiveTab(tab);
        router.get('/vpaf/tv-communications', { tab }, { preserveState: true, replace: true });
    };

    const activeChannel = useMemo(
        () => channels.find((c) => c.id === selectedChannelId) || channels[0],
        [channels, selectedChannelId]
    );

    const handleTakeoverSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/vpaf/tv-communications/takeover', {
            onSuccess: () => {
                setShowEmergencyModal(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV & Communications — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#5B21B6] border border-violet-200">
                                <Tv className="w-3.5 h-3.5 text-[#7C3AED]" />
                                Campus Digital Signage & TV Broadcast Network
                            </span>
                            <span className="text-xs text-slate-500 font-medium">6 Screen Network Active</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            TV & Communications • Executive Broadcasting
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Institutional digital signage control center: monitor lobby TV channels, preview content across campuses, switch live broadcast streams, and broadcast high-priority executive alerts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowEmergencyModal(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-medium"
                        >
                            <Radio className="w-4 h-4 mr-2 animate-pulse" />
                            Emergency Broadcast Takeover
                        </Button>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'switcher', label: 'Channel Switcher & Remote', icon: Cast },
                        { id: 'executive-tv', label: 'Executive TV Overview', icon: Tv },
                        { id: 'college-channels', label: 'College TV Channels', icon: Monitor },
                        { id: 'highlights', label: 'Institution Highlights', icon: Activity },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? 'bg-[#5B21B6] text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:text-[#5B21B6] hover:bg-violet-50 border border-indigo-50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7C3AED]'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB: CHANNEL SWITCHER */}
                {activeTab === 'switcher' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Channel selector list */}
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-[#17152E]">Select Channel</h2>
                                <span className="text-xs text-slate-400">{channels.length} Network Feeds</span>
                            </div>

                            <div className="space-y-2">
                                {channels.map((ch) => {
                                    const isSelected = ch.id === selectedChannelId;
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => setSelectedChannelId(ch.id)}
                                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'border-[#5B21B6] bg-violet-50 shadow-sm'
                                                    : 'border-slate-100 bg-[#F7F7FB] hover:border-violet-200'
                                            }`}
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${ch.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                    <span className="font-bold text-sm text-[#17152E]">{ch.name}</span>
                                                </div>
                                                <div className="text-xs text-slate-500">{ch.entity}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                ch.status === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                {ch.status}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Live Feed Simulator Preview */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#17152E] text-white p-6 rounded-2xl shadow-xl border border-indigo-950 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                                            LIVE PREVIEW • {activeChannel?.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-white/60 font-mono">1920 × 1080 60Hz</span>
                                </div>

                                <div className="my-auto py-8 text-center space-y-3">
                                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold backdrop-blur-sm">
                                        Now Displaying on Campus Screen
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight text-white max-w-lg mx-auto">
                                        {activeChannel?.current_slide}
                                    </h3>
                                    <p className="text-sm text-white/70 max-w-md mx-auto">
                                        Active Playlist: <span className="text-[#A78BFA]">{activeChannel?.active_playlist}</span>
                                    </p>
                                </div>

                                <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-2">
                                    <span>Up Next: <strong className="text-white">{activeChannel?.next_slide}</strong></span>
                                    <span>Sync Status: <strong className="text-emerald-400">Connected ({activeChannel?.viewers} screens online)</strong></span>
                                </div>
                            </div>

                            {/* Feed Controls */}
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="border-indigo-200 text-[#5B21B6] text-xs">
                                        <Play className="w-3.5 h-3.5 mr-1.5" /> Skip Slide
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 text-xs">
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Force Display Refresh
                                    </Button>
                                </div>

                                <span className="text-xs text-slate-500">
                                    Last telemetry ping: <strong>{activeChannel?.last_update}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: EXECUTIVE TV OVERVIEW */}
                {activeTab === 'executive-tv' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Executive Campus TV Network Topology</h2>
                            <p className="text-xs text-slate-500 mb-6">Real-time status of physical smart screens deployed across DSSC lobbies and student centers.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs text-slate-500 font-semibold mb-1">Total Deployed Screens</div>
                                    <div className="text-2xl font-bold text-[#5B21B6]">6 Screens</div>
                                    <div className="text-xs text-emerald-600 mt-1 font-medium">100% online telemetry</div>
                                </div>
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs text-slate-500 font-semibold mb-1">Daily Audience Footprint</div>
                                    <div className="text-2xl font-bold text-slate-800">~4,200 Students & Faculty</div>
                                    <div className="text-xs text-slate-400 mt-1">Main & Satellite Campuses</div>
                                </div>
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs text-slate-500 font-semibold mb-1">Active Announcements Loop</div>
                                    <div className="text-2xl font-bold text-indigo-700">14 Active Slides</div>
                                    <div className="text-xs text-slate-400 mt-1">Average loop cycle: 3m 45s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: COLLEGE TV CHANNELS */}
                {activeTab === 'college-channels' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Decentralized College Digital Channels</h2>
                            <p className="text-xs text-slate-500 mb-6">Each college maintains dedicated digital signage to celebrate achievements and share operational schedules.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {channels.map((ch) => (
                                    <div key={ch.id} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-[#17152E]">{ch.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                    ch.status === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {ch.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{ch.entity}</p>
                                            <div className="pt-2">
                                                <span className="text-xs text-slate-400 block">Current Slide:</span>
                                                <span className="text-xs font-semibold text-slate-800">{ch.current_slide}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between">
                                            <span>Playlist: {ch.active_playlist}</span>
                                            <span>{ch.last_update}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: HIGHLIGHTS */}
                {activeTab === 'highlights' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Approved Institutional Spotlight Highlights</h2>
                            <p className="text-xs text-slate-500 mb-6">Exemplary achievements nominated by colleges and approved by VPAF for campus-wide digital broadcast.</p>

                            <div className="space-y-4">
                                {highlights.map((h) => (
                                    <div key={h.id} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-100 text-[#5B21B6]">
                                                    {h.category}
                                                </span>
                                                <span className="text-xs text-slate-400">{h.submitted_at}</span>
                                            </div>
                                            <h3 className="font-bold text-base text-[#17152E]">{h.title}</h3>
                                            <p className="text-xs text-slate-600">{h.summary}</p>
                                            <div className="text-xs text-slate-400 pt-1">
                                                Submitted by: <strong>{h.submitted_by}</strong>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                                                {h.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* EMERGENCY BROADCAST TAKEOVER MODAL */}
                {showEmergencyModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                                <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                                    <ShieldAlert className="w-5 h-5" />
                                    Emergency Broadcast Takeover
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowEmergencyModal(false)}
                                    className="text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <p className="text-xs text-slate-600">
                                This executive action immediately overrides <strong>all 6 physical TV displays</strong> across Main, Sulop, and Kapatagan campuses with high-priority audio-visual warning cards.
                            </p>

                            <form onSubmit={handleTakeoverSubmit} className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Advisory Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#5B21B6]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Advisory Message</label>
                                    <textarea
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        rows={4}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#5B21B6]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={180}
                                        value={data.duration_minutes}
                                        onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 60)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#5B21B6]"
                                        required
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEmergencyModal(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                                    >
                                        {processing ? 'Broadcasting...' : 'Confirm Full Campus Takeover'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

