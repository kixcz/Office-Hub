import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { 
    LayoutTemplate, 
    Sparkles, 
    Plus, 
    ArrowRight, 
    Check, 
    Eye, 
    Clock, 
    Tv, 
    Megaphone, 
    Calendar, 
    Trophy, 
    ShieldCheck, 
    Maximize2, 
    FileText,
    Users,
    Layers,
    Sliders,
    Award,
    CheckCircle2,
    CalendarRange,
    Grid,
    Paintbrush
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Templates', href: '/tv-config/templates' },
];

interface Template {
    id: string;
    title: string;
    category: string;
    description: string;
    aspect_ratio: string;
    recommended_duration: string;
    audience: string;
    compatible_slide_type?: string;
    layout_name?: string;
    slots_count?: number;
    badge: string;
    default_slots?: Record<string, string>;
}

interface Props {
    templates: Template[];
}

export default function TvTemplatesPage({ templates }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [chosenTemplate, setChosenTemplate] = useState<Template | null>(null);
    const [previewModalTemplate, setPreviewModalTemplate] = useState<Template | null>(null);

    // Form states for creating slide from template
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(15);
    const [contentType, setContentType] = useState('announcement');
    const [audience, setAudience] = useState('All Viewers');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        'All',
        'Schedule & Meetings',
        'Compliance Monitoring',
        'Performance',
        'Spotlight'
    ];

    const filteredTemplates = templates.filter(
        (t) => selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase()
    );

    const handleSelectTemplate = (template: Template) => {
        setChosenTemplate(template);
        setTitle(template.title);
        setContentType(template.compatible_slide_type || template.category);
        setDuration(parseInt(template.recommended_duration, 10) || 15);
        setAudience(template.audience === 'Custom' ? 'All Viewers' : template.audience);
        setIsCreateModalOpen(true);
    };

    const handleCreateSlide = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/tv-config/slides', {
            title,
            type: contentType,
            duration_seconds: duration,
            target_audience: audience,
            template_id: chosenTemplate?.id || 'blank',
            config: {
                layout: chosenTemplate?.layout_name || 'Balanced 2×2',
                slots: chosenTemplate?.default_slots || {},
                applied_template_id: chosenTemplate?.id,
            }
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsCreateModalOpen(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Templates Catalog - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <LayoutTemplate className="w-4 h-4" />
                                <span>Institution-Approved Visual Layouts</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Reusable Slide Templates
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                                Standardized 16:9 slot-based layout structures approved by CIDS administration. Switch visual arrangements effortlessly without altering underlying data streams.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/slides/builder"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <Paintbrush className="w-4 h-4" />
                                <span>Open Slide Composer</span>
                            </Link>
                        </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border',
                                    selectedCategory === cat
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Notice Banner */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                        <Layers className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-extrabold block text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                                Layout Slots & Preset Widgets Architecture
                            </span>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                Selecting an approved template arranges compatible layout slots (<span className="font-semibold text-amber-700 dark:text-amber-400">Hero + Sidebar</span>, <span className="font-semibold text-amber-700 dark:text-amber-400">Balanced 2×2</span>, <span className="font-semibold text-amber-700 dark:text-amber-400">Three Column</span>, <span className="font-semibold text-amber-700 dark:text-amber-400">Media Focus</span>) while preserving current database filters, ranking metrics, and academic terms.
                            </p>
                        </div>
                    </div>

                    {/* Templates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-2xs hover:shadow-md flex flex-col overflow-hidden group"
                            >
                                {/* 16:9 Aspect Ratio Interactive Preview Mock */}
                                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center p-3.5 border-b border-slate-100 dark:border-slate-800">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-amber-950/20" />
                                    
                                    {/* Daily Focus: Hero + Sidebar */}
                                    {template.id === 'tpl_daily_focus' && (
                                        <div className="w-full h-full border border-sky-500/30 rounded-lg p-2.5 bg-slate-900/90 grid grid-cols-12 gap-2 z-10">
                                            <div className="col-span-8 rounded bg-sky-500/15 border border-sky-500/30 p-2 flex flex-col justify-between">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black uppercase text-sky-400">Today's Active Schedule</span>
                                                    <span className="text-[7px] px-1 rounded bg-sky-500/30 text-sky-300">Slot 1 (Hero)</span>
                                                </div>
                                                <div className="space-y-1 my-auto">
                                                    <div className="w-4/5 h-2 rounded bg-white/70" />
                                                    <div className="w-3/5 h-1.5 rounded bg-white/40" />
                                                    <div className="w-2/3 h-1.5 rounded bg-white/40" />
                                                </div>
                                                <div className="text-[7px] text-slate-400">09:00 AM - 05:00 PM Timeline</div>
                                            </div>
                                            <div className="col-span-4 flex flex-col gap-1.5">
                                                <div className="flex-1 rounded bg-slate-800/80 border border-white/10 p-1.5 flex flex-col justify-between">
                                                    <span className="text-[7px] font-bold text-amber-400">Sync Meetings</span>
                                                    <div className="w-full h-1.5 rounded bg-white/30" />
                                                </div>
                                                <div className="h-8 rounded bg-slate-800/80 border border-white/10 p-1 flex items-center justify-center">
                                                    <span className="text-[8px] font-mono text-slate-300">11:32 AM</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Weekly Planner: Three Column */}
                                    {template.id === 'tpl_weekly_planner' && (
                                        <div className="w-full h-full border border-blue-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-3 gap-1.5 z-10">
                                            <div className="rounded bg-blue-500/15 border border-blue-500/30 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-black text-blue-400 uppercase">Mon - Tue</span>
                                                <div className="space-y-1">
                                                    <div className="w-full h-1.5 rounded bg-white/50" />
                                                    <div className="w-4/5 h-1.5 rounded bg-white/30" />
                                                </div>
                                                <span className="text-[6px] text-slate-400">Lectures</span>
                                            </div>
                                            <div className="rounded bg-slate-800/90 border border-white/10 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-black text-amber-400 uppercase">Wed - Thu</span>
                                                <div className="space-y-1">
                                                    <div className="w-full h-1.5 rounded bg-white/50" />
                                                    <div className="w-4/5 h-1.5 rounded bg-white/30" />
                                                </div>
                                                <span className="text-[6px] text-slate-400">Meetings</span>
                                            </div>
                                            <div className="rounded bg-indigo-500/15 border border-indigo-500/30 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-black text-indigo-400 uppercase">Friday</span>
                                                <div className="space-y-1">
                                                    <div className="w-full h-1.5 rounded bg-white/50" />
                                                    <div className="w-4/5 h-1.5 rounded bg-white/30" />
                                                </div>
                                                <span className="text-[6px] text-slate-400">Consultation</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Meeting Focus: Balanced 2x2 */}
                                    {template.id === 'tpl_meeting_focus' && (
                                        <div className="w-full h-full border border-purple-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-2 gap-1.5 z-10">
                                            <div className="rounded bg-purple-500/20 border border-purple-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-purple-300 uppercase">Council Meetings</span>
                                                <div className="w-full h-2 rounded bg-white/50" />
                                            </div>
                                            <div className="rounded bg-slate-800/80 border border-white/10 p-1.5 flex flex-col items-center justify-center">
                                                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[7px]">QR</div>
                                                <span className="text-[6px] text-slate-400 mt-0.5">Scan Agenda</span>
                                            </div>
                                            <div className="rounded bg-slate-800/80 border border-white/10 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-slate-300">Venue Sync</span>
                                                <div className="w-4/5 h-1.5 rounded bg-white/40" />
                                            </div>
                                            <div className="rounded bg-amber-500/10 border border-amber-500/20 p-1.5 flex items-center justify-center">
                                                <Award className="w-4 h-4 text-amber-400" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Balanced Dashboard (Compliance): 2x2 */}
                                    {template.id === 'tpl_balanced_dashboard' && (
                                        <div className="w-full h-full border border-emerald-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-2 gap-1.5 z-10">
                                            <div className="rounded bg-emerald-500/20 border border-emerald-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-emerald-300 uppercase">Compliance 82%</span>
                                                <div className="w-full h-1.5 bg-emerald-500 rounded-full" />
                                            </div>
                                            <div className="rounded bg-amber-500/20 border border-amber-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-amber-300 uppercase">Pending 8</span>
                                                <div className="w-3/4 h-1.5 bg-amber-500 rounded-full" />
                                            </div>
                                            <div className="rounded bg-rose-500/20 border border-rose-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-rose-300 uppercase">Overdue 3</span>
                                                <div className="w-1/2 h-1.5 bg-rose-500 rounded-full" />
                                            </div>
                                            <div className="rounded bg-blue-500/20 border border-blue-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-blue-300 uppercase">Review Queue 5</span>
                                                <div className="w-2/3 h-1.5 bg-blue-500 rounded-full" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending Output Focus: Hero + Sidebar */}
                                    {template.id === 'tpl_pending_output_focus' && (
                                        <div className="w-full h-full border border-amber-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-12 gap-1.5 z-10">
                                            <div className="col-span-8 rounded bg-amber-500/15 border border-amber-500/30 p-2 flex flex-col justify-between">
                                                <span className="text-[8px] font-black uppercase text-amber-400">Deliverables Due Queue</span>
                                                <div className="space-y-1">
                                                    <div className="w-full h-1.5 rounded bg-white/60" />
                                                    <div className="w-5/6 h-1.5 rounded bg-white/40" />
                                                    <div className="w-4/6 h-1.5 rounded bg-white/40" />
                                                </div>
                                                <span className="text-[6px] text-slate-400">Ordered by Urgency</span>
                                            </div>
                                            <div className="col-span-4 flex flex-col gap-1.5">
                                                <div className="flex-1 rounded bg-slate-800 p-1.5 flex flex-col items-center justify-center">
                                                    <span className="text-[7px] font-bold text-emerald-400">Gauge</span>
                                                </div>
                                                <div className="h-9 rounded bg-white/10 p-1 flex items-center justify-center text-[7px] text-slate-300">
                                                    QR Code
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deadline Focus: Dashboard + Footer */}
                                    {template.id === 'tpl_deadline_focus' && (
                                        <div className="w-full h-full border border-rose-500/30 rounded-lg p-2 bg-slate-900/90 flex flex-col gap-1.5 z-10">
                                            <div className="grid grid-cols-2 gap-1.5 flex-1">
                                                <div className="rounded bg-rose-500/20 border border-rose-500/40 p-1.5 flex flex-col justify-between">
                                                    <span className="text-[7px] font-bold text-rose-300">Urgent Submissions</span>
                                                    <div className="w-full h-1.5 bg-rose-500 rounded" />
                                                </div>
                                                <div className="rounded bg-amber-500/20 border border-amber-500/40 p-1.5 flex flex-col justify-between">
                                                    <span className="text-[7px] font-bold text-amber-300">Upcoming TOS/TQ</span>
                                                    <div className="w-3/4 h-1.5 bg-amber-500 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-5 rounded bg-slate-800 border border-white/10 px-2 flex items-center justify-between text-[7px] text-slate-400">
                                                <span>College Overview Ticker</span>
                                                <span className="text-emerald-400 font-bold">92.4% Overall</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Leaderboard Podium (Performance) */}
                                    {template.id === 'tpl_leaderboard' && (
                                        <div className="w-full h-full border border-amber-500/30 rounded-lg p-2.5 bg-slate-900/90 flex items-end justify-center gap-2 z-10">
                                            <div className="w-1/4 h-12 rounded-t bg-slate-700/80 border-t border-slate-500 flex flex-col items-center justify-center text-[9px] text-slate-300 font-bold">
                                                <span>2</span>
                                                <span className="text-[6px] text-slate-400 font-normal">Prof. Reyes</span>
                                            </div>
                                            <div className="w-1/4 h-16 rounded-t bg-amber-500 border-t border-amber-300 flex flex-col items-center justify-center text-[10px] text-slate-950 font-black shadow-lg">
                                                <span>1</span>
                                                <span className="text-[7px] font-extrabold">Dr. Thorne</span>
                                            </div>
                                            <div className="w-1/4 h-9 rounded-t bg-amber-800/80 border-t border-amber-600 flex flex-col items-center justify-center text-[8px] text-amber-200 font-bold">
                                                <span>3</span>
                                                <span className="text-[6px] text-amber-300/80 font-normal">Prof. Ramos</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recognition Dashboard: 2x2 */}
                                    {template.id === 'tpl_recognition_dashboard' && (
                                        <div className="w-full h-full border border-amber-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-2 gap-1.5 z-10">
                                            <div className="rounded bg-amber-500/20 border border-amber-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-amber-300 uppercase">Top Faculty</span>
                                                <div className="w-full h-1.5 rounded bg-white/40" />
                                            </div>
                                            <div className="rounded bg-emerald-500/20 border border-emerald-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-emerald-300 uppercase">BSIT Leading</span>
                                                <div className="w-4/5 h-1.5 rounded bg-white/40" />
                                            </div>
                                            <div className="rounded bg-purple-500/20 border border-purple-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-purple-300 uppercase">Research Honors</span>
                                                <div className="w-3/4 h-1.5 rounded bg-white/40" />
                                            </div>
                                            <div className="rounded bg-sky-500/20 border border-sky-500/40 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-sky-300 uppercase">Extensions</span>
                                                <div className="w-2/3 h-1.5 rounded bg-white/40" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Metrics Focus: Three Column */}
                                    {template.id === 'tpl_metrics_focus' && (
                                        <div className="w-full h-full border border-sky-500/30 rounded-lg p-2 bg-slate-900/90 grid grid-cols-3 gap-1.5 z-10">
                                            <div className="rounded bg-sky-500/20 border border-sky-500/30 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-sky-300">BSIT (96%)</span>
                                                <div className="w-full h-8 flex items-end gap-1">
                                                    <div className="w-1/2 h-full bg-sky-400 rounded-t" />
                                                    <div className="w-1/2 h-4/5 bg-sky-600 rounded-t" />
                                                </div>
                                            </div>
                                            <div className="rounded bg-indigo-500/20 border border-indigo-500/30 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-indigo-300">BSCS (91%)</span>
                                                <div className="w-full h-8 flex items-end gap-1">
                                                    <div className="w-1/2 h-5/6 bg-indigo-400 rounded-t" />
                                                    <div className="w-1/2 h-3/4 bg-indigo-600 rounded-t" />
                                                </div>
                                            </div>
                                            <div className="rounded bg-amber-500/20 border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                                <span className="text-[7px] font-bold text-amber-300">BSIS (88%)</span>
                                                <div className="w-full h-8 flex items-end gap-1">
                                                    <div className="w-1/2 h-4/5 bg-amber-400 rounded-t" />
                                                    <div className="w-1/2 h-2/3 bg-amber-600 rounded-t" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spotlight: Portrait Left */}
                                    {template.id === 'tpl_portrait_left' && (
                                        <div className="w-full h-full border border-amber-500/40 rounded-lg p-2 bg-slate-900/90 grid grid-cols-12 gap-2 z-10 items-center">
                                            <div className="col-span-5 h-full rounded-md bg-gradient-to-tr from-amber-500/30 to-amber-700/20 border border-amber-500/50 flex items-center justify-center">
                                                <div className="w-9 h-9 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-[8px] font-bold text-amber-300">Photo</div>
                                            </div>
                                            <div className="col-span-7 space-y-1">
                                                <span className="text-[7px] font-black tracking-widest text-amber-400 uppercase">CONGRATULATIONS</span>
                                                <div className="w-full h-2 rounded bg-white/80" />
                                                <div className="w-3/4 h-1.5 rounded bg-white/40" />
                                                <div className="text-[6px] text-slate-400 pt-1">CIDS Faculty Recognition</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spotlight: Portrait Right */}
                                    {template.id === 'tpl_portrait_right' && (
                                        <div className="w-full h-full border border-purple-500/40 rounded-lg p-2 bg-slate-900/90 grid grid-cols-12 gap-2 z-10 items-center">
                                            <div className="col-span-7 space-y-1">
                                                <span className="text-[7px] font-black tracking-widest text-purple-400 uppercase">RECOGNITION</span>
                                                <div className="w-full h-2 rounded bg-white/80" />
                                                <div className="w-3/4 h-1.5 rounded bg-white/40" />
                                                <div className="text-[6px] text-slate-400 pt-1">Best Research Award</div>
                                            </div>
                                            <div className="col-span-5 h-full rounded-md bg-gradient-to-tr from-purple-500/30 to-indigo-700/20 border border-purple-500/50 flex items-center justify-center">
                                                <div className="w-9 h-9 rounded-full bg-purple-400/20 border-2 border-purple-400 flex items-center justify-center text-[8px] font-bold text-purple-300">Photo</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spotlight: Centered Celebration */}
                                    {template.id === 'tpl_centered_celebration' && (
                                        <div className="w-full h-full border border-amber-500/40 rounded-lg p-2 bg-slate-900/90 flex flex-col items-center justify-center text-center gap-1 z-10">
                                            <span className="text-[7px] font-black tracking-wider text-amber-400 uppercase">★ HAPPY BIRTHDAY ★</span>
                                            <div className="w-8 h-8 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-[7px] font-bold text-amber-300 my-0.5">Portrait</div>
                                            <div className="w-24 h-1.5 rounded bg-white/80" />
                                            <span className="text-[6px] text-slate-400">Honoring Dr. Eleanor Vance</span>
                                        </div>
                                    )}

                                    {/* Spotlight: Image + Achievement */}
                                    {template.id === 'tpl_image_achievement' && (
                                        <div className="w-full h-full border border-emerald-500/40 rounded-lg p-2 bg-slate-900/90 grid grid-cols-2 gap-2 z-10 items-center">
                                            <div className="h-full rounded bg-emerald-500/10 border border-emerald-500/30 p-1 flex items-center justify-center text-[7px] text-emerald-300 font-semibold">
                                                Certificate / Plaque
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[7px] font-black text-emerald-400 uppercase">Publication</span>
                                                <div className="w-full h-1.5 rounded bg-white/70" />
                                                <div className="w-3/4 h-1 rounded bg-white/40" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Right Badge */}
                                    <div className="absolute top-2 right-2 z-20">
                                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30">
                                            {template.badge}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                                {template.category}
                                            </span>
                                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                                {template.layout_name}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                            {template.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>

                                    {/* Layout Slots Summary */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <Grid className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="font-semibold">{template.slots_count || 4} Layout Slots</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{template.recommended_duration}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewModalTemplate(template)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Slots Preview</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectTemplate(template)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                                        >
                                            <span>Apply Template</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Slots Preview Modal */}
                {previewModalTemplate && (
                    <Dialog open={!!previewModalTemplate} onOpenChange={() => setPreviewModalTemplate(null)}>
                        <DialogContent className="sm:max-w-3xl bg-slate-950 text-white border-slate-800 p-6">
                            <DialogHeader>
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                                    <LayoutTemplate className="w-4 h-4" />
                                    <span>Institution-Approved Slot Structure</span>
                                </div>
                                <DialogTitle className="text-xl font-black text-white">
                                    {previewModalTemplate.title} ({previewModalTemplate.layout_name})
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 my-2">
                                <p className="text-xs text-slate-300">
                                    {previewModalTemplate.description}
                                </p>

                                {/* 16:9 Canvas Mockup */}
                                <div className="aspect-video w-full rounded-2xl bg-slate-900 border-2 border-amber-500/40 p-4 relative flex flex-col justify-between shadow-2xl">
                                    {/* Mock Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-[8px]">CIDS</div>
                                            <span className="font-bold text-slate-200">College of Information and Digital Sciences</span>
                                        </div>
                                        <span>AY 2026–2027, 1st Semester</span>
                                    </div>

                                    {/* Slots Diagram */}
                                    <div className="flex-1 my-2 grid grid-cols-12 gap-3 items-stretch">
                                        {previewModalTemplate.layout_name === 'Hero + Sidebar' && (
                                            <>
                                                <div className="col-span-8 rounded-xl border-2 border-dashed border-sky-400/60 bg-sky-500/10 p-3 flex flex-col justify-between">
                                                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">SLOT 1: HERO DISPLAY (70% WIDTH)</span>
                                                    <p className="text-[9px] text-slate-300">Occupied by: {previewModalTemplate.default_slots?.['hero'] || 'Primary Timetable / Outputs'}</p>
                                                    <span className="text-[8px] text-sky-300 font-mono">Compatible: Schedule, Deliverables, Podium</span>
                                                </div>
                                                <div className="col-span-4 flex flex-col gap-2">
                                                    <div className="flex-1 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 p-2 flex flex-col justify-between">
                                                        <span className="text-[9px] font-bold text-amber-400">SLOT 2: SIDEBAR TOP</span>
                                                        <p className="text-[8px] text-slate-300">Widgets: Upcoming Meetings / KPI</p>
                                                    </div>
                                                    <div className="h-16 rounded-xl border-2 border-dashed border-purple-400/60 bg-purple-500/10 p-2 flex flex-col justify-between">
                                                        <span className="text-[9px] font-bold text-purple-400">SLOT 3: SIDEBAR BOTTOM</span>
                                                        <p className="text-[8px] text-slate-300">Widgets: QR Code / Clock</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {previewModalTemplate.layout_name === 'Three Column' && (
                                            <>
                                                <div className="col-span-4 rounded-xl border-2 border-dashed border-blue-400/60 bg-blue-500/10 p-3 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase">COLUMN 1 (LEFT)</span>
                                                    <p className="text-[8px] text-slate-300">Widgets: Department Overview / BSIT</p>
                                                </div>
                                                <div className="col-span-4 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 p-3 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-amber-400 uppercase">COLUMN 2 (CENTER)</span>
                                                    <p className="text-[8px] text-slate-300">Widgets: BSCS & BSIS Timetable</p>
                                                </div>
                                                <div className="col-span-4 rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 p-3 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase">COLUMN 3 (RIGHT)</span>
                                                    <p className="text-[8px] text-slate-300">Widgets: Calendar Highlights</p>
                                                </div>
                                            </>
                                        )}

                                        {previewModalTemplate.layout_name === 'Balanced 2×2' && (
                                            <>
                                                <div className="col-span-6 rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 p-2.5 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase">QUADRANT 1 (TOP-LEFT)</span>
                                                    <p className="text-[8px] text-slate-300">Compliance Health Gauge / Podium</p>
                                                </div>
                                                <div className="col-span-6 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 p-2.5 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-amber-400 uppercase">QUADRANT 2 (TOP-RIGHT)</span>
                                                    <p className="text-[8px] text-slate-300">Pending Outputs / Recognition</p>
                                                </div>
                                                <div className="col-span-6 rounded-xl border-2 border-dashed border-rose-400/60 bg-rose-500/10 p-2.5 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-rose-400 uppercase">QUADRANT 3 (BOTTOM-LEFT)</span>
                                                    <p className="text-[8px] text-slate-300">Overdue Alerts / Schedule</p>
                                                </div>
                                                <div className="col-span-6 rounded-xl border-2 border-dashed border-blue-400/60 bg-blue-500/10 p-2.5 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase">QUADRANT 4 (BOTTOM-RIGHT)</span>
                                                    <p className="text-[8px] text-slate-300">Review Queue / QR Code</p>
                                                </div>
                                            </>
                                        )}

                                        {previewModalTemplate.layout_name === 'Media Focus' && (
                                            <>
                                                <div className="col-span-5 rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-500/15 p-3 flex flex-col items-center justify-center text-center">
                                                    <Award className="w-8 h-8 text-amber-400 mb-1" />
                                                    <span className="text-[10px] font-black text-amber-400 uppercase">HONOREE MEDIA SLOT</span>
                                                    <span className="text-[8px] text-slate-300 mt-1">High-Res Portrait / Award Plaque</span>
                                                </div>
                                                <div className="col-span-7 rounded-xl border-2 border-dashed border-white/40 bg-white/5 p-3 flex flex-col justify-center space-y-2">
                                                    <span className="text-[9px] font-black text-amber-400 uppercase">CELEBRATORY CONTENT SLOT</span>
                                                    <div className="w-full h-3 rounded bg-white/80" />
                                                    <div className="w-4/5 h-2 rounded bg-white/50" />
                                                    <div className="w-2/3 h-2 rounded bg-white/30" />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Mock Footer */}
                                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[9px] text-slate-400">
                                        <span>Display Safe Margins: Enforced</span>
                                        <span>Template ID: {previewModalTemplate.id}</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setPreviewModalTemplate(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                                >
                                    Close Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const t = previewModalTemplate;
                                        setPreviewModalTemplate(null);
                                        handleSelectTemplate(t);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Apply this Template
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Apply Template Dialog */}
                {chosenTemplate && (
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <DialogHeader>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    <LayoutTemplate className="w-4 h-4" />
                                    <span>Apply Slide Template</span>
                                </div>
                                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                                    Create Slide: {chosenTemplate.title}
                                </DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleCreateSlide} className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Slide Display Title
                                    </label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Schedule & Meeting Focus"
                                        required
                                        className="text-xs font-semibold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Rotation Duration (sec)
                                        </label>
                                        <Input
                                            type="number"
                                            min={5}
                                            max={120}
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            required
                                            className="text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Target Audience
                                        </label>
                                        <select
                                            value={audience}
                                            onChange={(e) => setAudience(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                        >
                                            <option>All Viewers</option>
                                            <option>Faculty & Students</option>
                                            <option>Faculty & Staff</option>
                                            <option>Faculty Only</option>
                                            <option>Public Display</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                                        <span>Selected Layout:</span>
                                        <span className="text-amber-600 dark:text-amber-400">{chosenTemplate.layout_name}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                        <span>Slide Category:</span>
                                        <span>{chosenTemplate.category}</span>
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create in Slide Composer'}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </TvStudioLayout>
        </AppLayout>
    );
}
