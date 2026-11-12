import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Eye,
    Globe,
    Monitor,
    Play,
    Plus,
    Radio,
    Send,
    Shield,
    Sparkles,
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
    last_heartbeat: string;
    current_slide: string;
}

interface ExecutiveSlide {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    status: string;
    summary: string;
    highlights: string[];
    can_promote: boolean;
}

interface SuggestedHighlight {
    id: string;
    college_code: string;
    metric: string;
    title: string;
    message: string;
    proposed_audience: string[];
    type: string;
}

interface Props {
    channels: Channel[];
    private_executive_deck: ExecutiveSlide[];
    suggested_highlights: SuggestedHighlight[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'TV & Communications', href: '/vpaa/tv-communications' },
];

export default function VpaaTvCommunications({ channels, private_executive_deck, suggested_highlights }: Props) {
    const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0] || null);
    const [previewMode, setPreviewMode] = useState<'browse' | 'follow'>('follow');
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteForm, setPromoteForm] = useState<{
        title: string;
        message: string;
        presentation_type: string;
        target_audiences: string[];
    }>({
        title: '',
        message: '',
        presentation_type: 'Recognition / Commendation',
        target_audiences: ['INSTITUTION'],
    });

    const handleSelectChannel = (channel: Channel) => {
        setSelectedChannel(channel);
    };

    const handleOpenPromote = (highlight: SuggestedHighlight) => {
        setPromoteForm({
            title: highlight.title,
            message: highlight.message,
            presentation_type: highlight.type,
            target_audiences: highlight.proposed_audience,
        });
        setIsPromoteModalOpen(true);
    };

    const handlePublishPromotion = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/vpaa/tv-communications/promote-slide', promoteForm, {
            onSuccess: () => {
                setIsPromoteModalOpen(false);
            },
        });
    };

    const toggleAudience = (audience: string) => {
        setPromoteForm((prev) => {
            const exists = prev.target_audiences.includes(audience);
            return {
                ...prev,
                target_audiences: exists
                    ? prev.target_audiences.filter((a) => a !== audience)
                    : [...prev.target_audiences, audience],
            };
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA TV & Communications" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Tv className="h-3.5 w-3.5 text-amber-300" />
                                <span>Personal Executive TV Deck & Cross-Campus Channel Switcher</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                VPAA TV & Communications Workspace
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Preview any college or campus TV channel without affecting live physical screens. Review auto-generated private executive slides and promote verified academic recognitions.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPromoteForm({
                                        title: 'Institution Academic Milestone',
                                        message: 'University-wide instructional completion recorded at 95.8% with zero critical syllabus delays.',
                                        presentation_type: 'Executive Highlight',
                                        target_audiences: ['INSTITUTION'],
                                    });
                                    setIsPromoteModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0B3A67] shadow-md hover:bg-neutral-100 transition-all cursor-pointer"
                            >
                                <Sparkles className="h-4 w-4 text-[#8B1E3F]" />
                                Promote Academic Highlight
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Channel Preview & Switcher Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Main Player / Preview Area */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </span>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Now Viewing (Personal Context)
                                        </div>
                                        <div className="text-lg font-black text-foreground">
                                            {selectedChannel?.name || 'Channel Preview'}
                                        </div>
                                    </div>
                                </div>

                                {/* Follow Mode vs Browse Playlist Toggle */}
                                <div className="flex items-center gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('follow')}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                            previewMode === 'follow'
                                                ? 'bg-card text-foreground shadow-2xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Follow Live Channel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('browse')}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                            previewMode === 'browse'
                                                ? 'bg-card text-foreground shadow-2xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Browse Playlist
                                    </button>
                                </div>
                            </div>

                            {/* Simulated Screen Preview */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] border border-slate-800 flex flex-col justify-between p-6 text-white shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1 text-xs backdrop-blur-md border border-white/10">
                                        <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                                        <span className="font-bold">
                                            {selectedChannel?.college_code} DISPLAY · CH {selectedChannel?.channel_number}
                                        </span>
                                    </div>
                                    <div className="text-xs text-white/60">
                                        Last Heartbeat: {selectedChannel?.last_heartbeat}
                                    </div>
                                </div>

                                <div className="my-auto space-y-3 max-w-xl">
                                    <div className="inline-block rounded-md bg-[#8B1E3F]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">
                                        Live Slide Broadcast
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
                                        {selectedChannel?.current_slide}
                                    </h3>
                                    <p className="text-xs md:text-sm text-slate-300">
                                        Displaying verified timetable offerings, academic recognition, and student announcements for {selectedChannel?.college_name}.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-white/60 border-t border-white/10 pt-3">
                                    <span>VPAA Preview Isolated: Physical screen unaffected</span>
                                    <a
                                        href={`/tv-display/${selectedChannel?.device_code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-sky-400 hover:underline flex items-center gap-1"
                                    >
                                        Open Fullscreen Stream &gt;
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Private Executive Slide Deck (Generated from verified data, private to VPAA) */}
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-indigo-500" />
                                        Private Executive Slide Deck
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Auto-generated from institutional data. Confidential and visible only to the VPAA by default.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    3 Auto-Generated Slides
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {private_executive_deck.map((slide) => (
                                    <div
                                        key={slide.id}
                                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-background/50 p-4 flex flex-col justify-between hover:border-primary/50 transition-all"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                <span>{slide.type}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{slide.status}</span>
                                            </div>
                                            <div className="text-xs font-bold text-foreground mb-1">{slide.title}</div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                                                {slide.summary}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground font-medium">Keep Private</span>
                                            {slide.can_promote && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPromoteForm({
                                                            title: slide.title,
                                                            message: slide.summary,
                                                            presentation_type: 'Executive Highlight',
                                                            target_audiences: ['INSTITUTION'],
                                                        });
                                                        setIsPromoteModalOpen(true);
                                                    }}
                                                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                                >
                                                    Promote as Highlight &gt;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Channel Switcher Wall & Recommendations */}
                    <div className="flex flex-col gap-6">
                        {/* Channel Selector Wall */}
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs">
                            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-primary" />
                                Campus Channel Switcher
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Click any college channel to switch your active preview screen.
                            </p>

                            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {channels.map((chan) => {
                                    const isSelected = selectedChannel?.id === chan.id;
                                    return (
                                        <button
                                            key={chan.id}
                                            type="button"
                                            onClick={() => handleSelectChannel(chan)}
                                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xs'
                                                    : 'border-border/70 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                                        isSelected
                                                            ? 'bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white shadow-2xs'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    CH {chan.channel_number}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-foreground truncate">
                                                        {chan.name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                        {chan.college_code} · {chan.status}
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Slide Recommendations & Spotlight Inbox */}
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs">
                            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Recommended Commendations
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Defensible recognition candidates calculated from verified monitoring rates.
                            </p>

                            <div className="space-y-3">
                                {suggested_highlights.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-left"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                                                {item.metric} · {item.college_code}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">Proposed Spotlight</span>
                                        </div>
                                        <div className="text-xs font-bold text-foreground mb-1">{item.title}</div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                                            {item.message}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPromote(item)}
                                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            <Send className="h-3 w-3" />
                                            Promote to Channels
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Promotion / Broadcast Modal */}
                {isPromoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Promote Slide to TV Channels
                            </h3>
                            <p className="text-xs text-muted-foreground mb-5">
                                Select presentation style and target audiences. Slide will be published as an institutional broadcast.
                            </p>

                            <form onSubmit={handlePublishPromotion} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Slide Title</label>
                                    <input
                                        type="text"
                                        value={promoteForm.title}
                                        onChange={(e) => setPromoteForm({ ...promoteForm, title: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Presentation Type</label>
                                    <select
                                        value={promoteForm.presentation_type}
                                        onChange={(e) => setPromoteForm({ ...promoteForm, presentation_type: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="Recognition / Commendation">Recognition / Commendation</option>
                                        <option value="Executive Highlight">Executive Highlight</option>
                                        <option value="Academic Policy Advisory">Academic Policy Advisory</option>
                                        <option value="Quality Benchmark">Quality Benchmark</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Message Body</label>
                                    <textarea
                                        rows={3}
                                        value={promoteForm.message}
                                        onChange={(e) => setPromoteForm({ ...promoteForm, message: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-2">Target Channel Audience</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['INSTITUTION', 'CIDS', 'CED', 'CBA', 'COE', 'CAS', 'ALL'].map((aud) => {
                                            const isSelected = promoteForm.target_audiences.includes(aud);
                                            return (
                                                <button
                                                    key={aud}
                                                    type="button"
                                                    onClick={() => toggleAudience(aud)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                                                            : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    {aud === 'INSTITUTION' ? 'DSSC Academic TV' : aud === 'ALL' ? 'All Displays' : `${aud} TV`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsPromoteModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                                    >
                                        Publish Slide
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

