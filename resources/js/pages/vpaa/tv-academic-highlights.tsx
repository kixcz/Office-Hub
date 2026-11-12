import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    FolderKanban,
    GraduationCap,
    Plus,
    Send,
    Sparkles,
    Star,
    Trophy,
} from 'lucide-react';
import React, { useState } from 'react';

interface HighlightItem {
    id: string;
    college_code: string;
    category: string;
    title: string;
    message: string;
    metric: string;
    period: string;
    proposed_audience: string[];
    eligibility: string;
}

interface Props {
    recommended_highlights: HighlightItem[];
    active_highlights: any[];
    channels: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Academic Highlights', href: '/vpaa/tv-academic-highlights' },
];

export default function VpaaTvAcademicHighlights({ recommended_highlights, active_highlights, channels, active_tab }: Props) {
    const [subtab, setSubtab] = useState(active_tab || 'recommended');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [highlightForm, setHighlightForm] = useState({
        title: '',
        message: '',
        presentation_type: 'College Spotlight',
        target_audiences: ['INSTITUTION'],
    });

    const handleOpenCreate = (item?: HighlightItem) => {
        if (item) {
            setHighlightForm({
                title: item.title,
                message: item.message,
                presentation_type: item.category,
                target_audiences: item.proposed_audience,
            });
        } else {
            setHighlightForm({
                title: '',
                message: '',
                presentation_type: 'College Spotlight',
                target_audiences: ['INSTITUTION'],
            });
        }
        setIsCreateModalOpen(true);
    };

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/vpaa/tv-communications/promote-slide', highlightForm, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
            },
        });
    };

    const toggleAudience = (audience: string) => {
        setHighlightForm((prev) => {
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
            <Head title="VPAA Academic Highlights & Spotlights" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>Curated Recognition & Promotion Workspace · Positive Academic Outcomes</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                Academic Highlights & Spotlights
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Curate defensible commendations from verified institutional metrics. Publish spotlit achievements to Central TV or targeted college channels.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleOpenCreate()}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0B3A67] shadow-md hover:bg-neutral-100 transition-all cursor-pointer"
                            >
                                <Plus className="h-4 w-4 text-[#8B1E3F]" />
                                New Academic Highlight
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subtabs: Recommended Highlights, Drafts, Scheduled, Active Highlights, Archive */}
                <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
                    {[
                        { id: 'recommended', label: 'Recommended Highlights', icon: Sparkles, count: recommended_highlights.length },
                        { id: 'active', label: 'Active Broadcasts', icon: Star, count: active_highlights.length },
                        { id: 'drafts', label: 'Drafts', icon: FileCheck, count: 0 },
                        { id: 'scheduled', label: 'Scheduled', icon: Clock, count: 0 },
                        { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
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
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span
                                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                            isActive
                                                ? 'bg-white text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Recommended Highlights Grid */}
                {subtab === 'recommended' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-foreground">
                                Verified Candidates for Public Recognition ({recommended_highlights.length})
                            </h3>
                            <span className="text-xs text-muted-foreground">Defensible metric-backed achievements</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {recommended_highlights.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-6 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-card hover:shadow-xs transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                                                    {item.college_code}
                                                </span>
                                                <span className="text-xs font-bold text-foreground">{item.category}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                                                {item.metric}
                                            </span>
                                        </div>

                                        <h4 className="text-base font-bold text-foreground mb-1.5">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                            {item.message}
                                        </p>

                                        <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs space-y-1 mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Period:</span>
                                                <span className="font-semibold text-foreground">{item.period}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Eligibility:</span>
                                                <span className="font-semibold text-foreground">{item.eligibility}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Proposed Display:</span>
                                                <span className="font-semibold text-primary">
                                                    {item.proposed_audience.join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border/70 flex items-center justify-between">
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenCreate(item)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Curate & Publish Highlight &gt;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Broadcasts Grid */}
                {subtab === 'active' && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs space-y-4">
                        <h3 className="text-base font-bold text-foreground">Active Public Slides Across Displays</h3>
                        {active_highlights.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {active_highlights.map((slide) => (
                                    <div key={slide.id} className="p-4 rounded-2xl border border-border bg-background/50 space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                            {slide.badge || 'Academic Highlight'}
                                        </span>
                                        <div className="text-sm font-bold text-foreground">{slide.title}</div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{slide.subtitle}</p>
                                        <div className="pt-2 text-[10px] text-muted-foreground border-t border-border/50">
                                            Audience: {slide.college_code ? `${slide.college_code} TV` : 'All Institutional Displays'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                No custom highlight slides currently published.
                            </div>
                        )}
                    </div>
                )}

                {/* Subtabs: Drafts, Scheduled, Archive */}
                {['drafts', 'scheduled', 'archive'].includes(subtab) && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-12 text-center shadow-xs">
                        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                        <h3 className="text-base font-bold text-foreground capitalize mb-1">{subtab}</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            No highlights stored in {subtab}. Start by curating a recommendation or creating a new highlight.
                        </p>
                    </div>
                )}

                {/* Curate & Publish Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Curate Academic Highlight
                            </h3>
                            <p className="text-xs text-muted-foreground mb-5">
                                Polish wording, select recognition category, and choose destination channel displays.
                            </p>

                            <form onSubmit={handlePublish} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Highlight Headline</label>
                                    <input
                                        type="text"
                                        value={highlightForm.title}
                                        onChange={(e) => setHighlightForm({ ...highlightForm, title: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Recognition Category</label>
                                    <select
                                        value={highlightForm.presentation_type}
                                        onChange={(e) => setHighlightForm({ ...highlightForm, presentation_type: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="College Spotlight">College Spotlight</option>
                                        <option value="Highest Compliance Rate">Highest Compliance Rate</option>
                                        <option value="Strong Instructional Completion">Strong Instructional Completion</option>
                                        <option value="Most Improved College">Most Improved College</option>
                                        <option value="Research Highlight">Research Highlight</option>
                                        <option value="Extension Highlight">Extension Highlight</option>
                                        <option value="Faculty Recognition">Faculty Recognition</option>
                                        <option value="Academic Milestones">Academic Milestones</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">Commendation Message</label>
                                    <textarea
                                        rows={3}
                                        value={highlightForm.message}
                                        onChange={(e) => setHighlightForm({ ...highlightForm, message: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-2">Display Audience</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['INSTITUTION', 'CIDS', 'CED', 'CBA', 'COE', 'CAS', 'ALL'].map((aud) => {
                                            const isSelected = highlightForm.target_audiences.includes(aud);
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
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md cursor-pointer"
                                    >
                                        Publish Highlight
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

