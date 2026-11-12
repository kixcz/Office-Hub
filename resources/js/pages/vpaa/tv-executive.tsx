import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Award,
    BarChart3,
    CheckCircle2,
    Clock,
    Eye,
    FileCheck,
    Layers,
    Monitor,
    Play,
    Plus,
    Radio,
    Save,
    Send,
    Shield,
    Sparkles,
    Tv,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface ExecutiveSlide {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    category: string;
    status: string;
    summary: string;
    highlights: string[];
    metric_data: any;
    created_at: string;
    can_promote: boolean;
}

interface Props {
    executive_deck: ExecutiveSlide[];
    college_metrics: any[];
    active_subtab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Executive TV', href: '/vpaa/tv-executive' },
];

export default function VpaaTvExecutive({ executive_deck, college_metrics, active_subtab }: Props) {
    const [subtab, setSubtab] = useState(active_subtab || 'live-deck');
    const [selectedSlide, setSelectedSlide] = useState<ExecutiveSlide>(executive_deck[0] || null);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteForm, setPromoteForm] = useState({
        title: '',
        message: '',
        presentation_type: 'Executive Highlight',
        target_audiences: ['INSTITUTION'],
    });

    const handleOpenPromote = (slide: ExecutiveSlide) => {
        setPromoteForm({
            title: slide.title,
            message: slide.summary,
            presentation_type: 'Executive Highlight',
            target_audiences: ['INSTITUTION'],
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
            <Head title="VPAA Executive TV (Private Decision Support)" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner: Clarifies Private Decision Support Layer */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Shield className="h-3.5 w-3.5 text-amber-300" />
                                <span>Private Data-Driven Presentation Workspace · Visible Only to VPAA</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                VPAA Executive TV
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Automatically generated private slides based on verified institution-wide data: attendance coverage, instructional completion, compliance, scheduling readiness, and faculty loading.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/vpaa/tv-academic-highlights"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0B3A67] shadow-md hover:bg-neutral-100 transition-all cursor-pointer"
                            >
                                <Sparkles className="h-4 w-4 text-[#8B1E3F]" />
                                Academic Highlights Curations &gt;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sub-Tabs: Live Executive Deck, Suggested Slides, Saved Slides, Scheduled, Broadcast History */}
                <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
                    {[
                        { id: 'live-deck', label: 'Live Executive Deck', icon: Tv },
                        { id: 'suggested-slides', label: 'Suggested Slides', icon: Sparkles },
                        { id: 'saved-slides', label: 'Saved Executive Slides', icon: Save },
                        { id: 'scheduled', label: 'Scheduled', icon: Clock },
                        { id: 'history', label: 'Broadcast History', icon: FileCheck },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = subtab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSubtab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Presentation Stage & Slide Selector */}
                {subtab === 'live-deck' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Slide Display Area (Left 2 Cols) */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B3A67] via-[#0F1E36] to-[#4A1024] border border-slate-700/60 p-6 md:p-8 text-white shadow-2xl flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1 text-xs backdrop-blur-md border border-white/10 font-bold">
                                        <Shield className="h-3.5 w-3.5 text-amber-400" />
                                        <span>CONFIDENTIAL EXECUTIVE SLIDE · VPAA DECK</span>
                                    </div>
                                    <span className="text-xs text-white/60">{selectedSlide?.created_at}</span>
                                </div>

                                <div className="my-auto space-y-4 max-w-xl">
                                    <span className="inline-block rounded-md bg-[#8B1E3F]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">
                                        {selectedSlide?.type}
                                    </span>
                                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
                                        {selectedSlide?.title}
                                    </h2>
                                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                        {selectedSlide?.summary}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                        {selectedSlide?.highlights.map((h, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-white/90 bg-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-xs border border-white/10">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                <span className="truncate">{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                                    <span className="text-white/60">Visible only to VPAA decision support</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPromote(selectedSlide)}
                                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Promote as Highlight
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Slide Actions Palette */}
                            <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                                <div className="text-xs font-semibold text-muted-foreground">
                                    Current Action for Selected Slide:
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        Keep Private
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        Save to Executive Playlist
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenPromote(selectedSlide)}
                                        className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
                                    >
                                        Promote to Public Channel &gt;
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Slide Selector Deck (Right 1 Col) */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-bold text-foreground">Live Executive Slides ({executive_deck.length})</h3>
                                <span className="text-[11px] text-muted-foreground">Auto-generated</span>
                            </div>

                            <div className="space-y-3">
                                {executive_deck.map((slide) => {
                                    const isSelected = selectedSlide?.id === slide.id;
                                    return (
                                        <div
                                            key={slide.id}
                                            onClick={() => setSelectedSlide(slide)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/40'
                                                    : 'border-border/70 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                <span>{slide.category}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400">{slide.status}</span>
                                            </div>
                                            <div className="text-xs font-bold text-foreground mb-1">{slide.title}</div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                                                {slide.summary}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                                                <span>{slide.created_at}</span>
                                                {slide.can_promote && (
                                                    <span className="text-primary font-bold">Promote Eligible</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Subtab: Suggested Slides / AI Recommendations */}
                {subtab === 'suggested-slides' && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs space-y-4">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Synthesized Candidate Slides
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Candidate slides detected by Ascend algorithms based on recent milestones or emergent operational anomalies.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                                    Suggested Recognition
                                </span>
                                <div className="font-bold text-foreground">CIDS recorded 98.4% instructional completion</div>
                                <p className="text-muted-foreground">Highest verified session delivery rate among all academic colleges for October 2026.</p>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPromoteForm({
                                                title: 'CIDS Instructional Delivery Benchmark',
                                                message: 'CIDS reached 98.4% verified instructional completion this reporting period.',
                                                presentation_type: 'Recognition / Commendation',
                                                target_audiences: ['INSTITUTION', 'CIDS'],
                                            });
                                            setIsPromoteModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                                    >
                                        Review & Promote
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-400">
                                    Suggested Attention Slide
                                </span>
                                <div className="font-bold text-foreground">COE Timetable Blocking Lab Collisions</div>
                                <p className="text-muted-foreground">5 lab scheduling conflicts require dean intervention before enrollment opens.</p>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 dark:text-rose-400 font-bold hover:bg-rose-100/50 cursor-pointer"
                                    >
                                        Keep in Private Deck
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subtab: Saved Slides, Scheduled, History */}
                {['saved-slides', 'scheduled', 'history'].includes(subtab) && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-12 text-center shadow-xs">
                        <Tv className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                        <h3 className="text-base font-bold text-foreground capitalize mb-1">{subtab.replace('-', ' ')}</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            No archived entries found under this filter. All current executive analyses are active in the Live Executive Deck.
                        </p>
                    </div>
                )}

                {/* Promote Slide Modal */}
                {isPromoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Promote Executive Slide to TV Channels
                            </h3>
                            <p className="text-xs text-muted-foreground mb-5">
                                Transform confidential executive insight into a presentation-ready public highlight.
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
                                        <option value="Executive Highlight">Executive Highlight</option>
                                        <option value="Recognition / Commendation">Recognition / Commendation</option>
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

