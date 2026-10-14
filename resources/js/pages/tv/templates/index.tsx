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
    FileText 
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
    widgets_count: number;
    badge: string;
}

interface Props {
    templates: Template[];
}

export default function TvTemplatesPage({ templates }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [chosenTemplate, setChosenTemplate] = useState<Template | null>(null);

    // Form states for creating slide from template
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(15);
    const [contentType, setContentType] = useState('announcement');
    const [audience, setAudience] = useState('All Viewers');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['All', 'Announcements', 'Scheduling', 'Performance', 'Compliance', 'Custom'];

    const filteredTemplates = templates.filter(
        (t) => selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase()
    );

    const handleSelectTemplate = (template: Template) => {
        setChosenTemplate(template);
        setTitle(template.id === 'tpl_blank' ? 'Custom Presentation Slide' : template.title);
        setContentType(
            template.category === 'Announcements'
                ? 'announcement'
                : template.category === 'Scheduling'
                ? 'schedule'
                : template.category === 'Performance'
                ? 'leaderboard'
                : 'custom'
        );
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
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsCreateModalOpen(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Slide Templates - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                <LayoutTemplate className="w-4 h-4" />
                                <span>Predefined Layouts</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Slide Template Catalog
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Launch pre-composed 16:9 slides tailored for announcements, scheduling matrices, and faculty recognition.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const blank = templates.find((t) => t.id === 'tpl_blank') || templates[0];
                                handleSelectTemplate(blank);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create from Blank Canvas</span>
                        </button>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                                    selectedCategory === cat
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Templates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-md flex flex-col overflow-hidden group"
                            >
                                {/* 16:9 Aspect Ratio Preview Mock */}
                                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-transparent to-indigo-950/30" />
                                    
                                    {template.id === 'tpl_announcement' && (
                                        <div className="w-full h-full border border-blue-500/30 rounded-lg p-3 bg-slate-900/80 flex flex-col justify-between">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-2 rounded-full bg-blue-500" />
                                                <div className="w-4 h-4 rounded-full bg-slate-700" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="w-3/4 h-3 rounded bg-white/80" />
                                                <div className="w-1/2 h-2 rounded bg-white/40" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 h-8 rounded bg-blue-600/30 border border-blue-500/40" />
                                                <div className="w-8 h-8 rounded bg-white/20" />
                                            </div>
                                        </div>
                                    )}

                                    {template.id === 'tpl_schedule' && (
                                        <div className="w-full h-full border border-emerald-500/30 rounded-lg p-2.5 bg-slate-900/80 grid grid-cols-3 gap-1.5">
                                            <div className="rounded bg-emerald-500/20 border border-emerald-500/40 p-1 flex flex-col justify-between">
                                                <div className="w-8 h-1.5 rounded bg-emerald-400" />
                                                <div className="w-full h-2 rounded bg-white/50" />
                                            </div>
                                            <div className="rounded bg-slate-800/80 p-1 flex flex-col justify-between">
                                                <div className="w-6 h-1.5 rounded bg-slate-400" />
                                                <div className="w-full h-2 rounded bg-white/50" />
                                            </div>
                                            <div className="rounded bg-blue-500/20 border border-blue-500/40 p-1 flex flex-col justify-between">
                                                <div className="w-7 h-1.5 rounded bg-blue-400" />
                                                <div className="w-full h-2 rounded bg-white/50" />
                                            </div>
                                        </div>
                                    )}

                                    {template.id === 'tpl_faculty_honor' && (
                                        <div className="w-full h-full border border-amber-500/30 rounded-lg p-3 bg-slate-900/80 flex items-end justify-center gap-2">
                                            <div className="w-1/4 h-12 rounded-t bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold">2</div>
                                            <div className="w-1/4 h-18 rounded-t bg-amber-500/80 flex items-center justify-center text-[10px] text-slate-950 font-black">1</div>
                                            <div className="w-1/4 h-8 rounded-t bg-amber-800 flex items-center justify-center text-[10px] text-amber-200 font-bold">3</div>
                                        </div>
                                    )}

                                    {template.id === 'tpl_compliance' && (
                                        <div className="w-full h-full border border-purple-500/30 rounded-lg p-3 bg-slate-900/80 flex flex-col justify-around">
                                            <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold">
                                                <span>Syllabus Compliance</span>
                                                <span>92%</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                                <div className="w-11/12 h-full bg-purple-500" />
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] text-blue-300 font-bold">
                                                <span>Grades Submission</span>
                                                <span>84%</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                                <div className="w-4/5 h-full bg-blue-500" />
                                            </div>
                                        </div>
                                    )}

                                    {(template.id === 'tpl_welcome' || template.id === 'tpl_blank') && (
                                        <div className="w-full h-full border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-xs font-semibold gap-1.5">
                                            <Tv className="w-4 h-4" />
                                            <span>16:9 Canvas Preset</span>
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                                            {template.badge}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                            <span>{template.category}</span>
                                            <span>{template.aspect_ratio}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                            {template.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {template.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {template.recommended_duration}
                                            </span>
                                            <span>{template.audience}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectTemplate(template)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors cursor-pointer"
                                        >
                                            <span>Use Template</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Slide Dialog */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Tv className="w-5 h-5 text-blue-600" />
                                <span>Create Slide from Template</span>
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateSlide} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Slide Title
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Midterm Examination Announcement"
                                    required
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Content Type
                                    </label>
                                    <select
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value)}
                                        className="w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                                    >
                                        <option value="announcement">Announcement</option>
                                        <option value="schedule">Schedule & Utilization</option>
                                        <option value="leaderboard">Faculty Leaderboard</option>
                                        <option value="compliance">Compliance Gauge</option>
                                        <option value="custom">Custom Design</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Duration (Seconds)
                                    </label>
                                    <Input
                                        type="number"
                                        min={5}
                                        max={120}
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value, 10) || 15)}
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Intended Audience
                                </label>
                                <select
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    className="w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                                >
                                    <option value="All Viewers">All Viewers (Students & Faculty)</option>
                                    <option value="Faculty">Faculty & Instructors Only</option>
                                    <option value="Students">Undergraduate / Graduate Students</option>
                                    <option value="Visitors">Public Visitors & Guests</option>
                                </select>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span>
                                    After creation, you will automatically be directed to the <strong>Visual Slide Builder</strong> with maximum canvas space to customize widgets.
                                </span>
                            </div>

                            <DialogFooter className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating Slide...' : 'Create & Open Builder'}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </TvStudioLayout>
        </AppLayout>
    );
}
