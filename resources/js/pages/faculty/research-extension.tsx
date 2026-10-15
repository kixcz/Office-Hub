import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    FlaskConical,
    Plus,
    Search,
    Download,
    Eye,
    ChevronDown,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Award,
    BookOpen,
    Users,
    Calendar,
    Sprout,
    Building2,
    HeartHandshake,
    Sparkles,
    Trash2,
    MoreVertical,
    Info,
    ArrowRight,
    TrendingUp,
    BookmarkCheck,
    Briefcase,
    ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';

interface ResearchProject {
    id: number;
    title: string;
    program: string;
    role: string;
    duration?: string | null;
    status: 'Active' | 'Completed' | 'Proposed' | string;
    description?: string | null;
    progress: number;
    current_milestone?: string | null;
    milestone_progress: number;
    milestone_due_date?: string | null;
    collaborators_count: number;
    publications_summary?: string | null;
    next_action?: string | null;
    academic_period: string;
}

interface ExtensionEngagement {
    id: number;
    title: string;
    program: string;
    role: string;
    duration?: string | null;
    status: 'Active' | 'Completed' | 'Planned' | string;
    description?: string | null;
    progress: number;
    beneficiaries_count: number;
    activities_count: number;
    next_activity?: string | null;
    academic_period: string;
}

interface Props {
    faculty: any;
    researchProjects: ResearchProject[];
    extensionEngagements: ExtensionEngagement[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Research & Extension', href: '/faculty/research-extension' },
];

export default function FacultyResearchExtensionPage({
    faculty,
    researchProjects = [],
    extensionEngagements = [],
}: Props) {
    // 1. Filter Controls
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [academicPeriod, setAcademicPeriod] = useState('AY 2026 - 2027');
    const [sortBy, setSortBy] = useState('latest');

    // Modals
    const [isCreateResearchOpen, setIsCreateResearchOpen] = useState(false);
    const [isCreateExtensionOpen, setIsCreateExtensionOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<{ type: 'research' | 'extension'; data: any } | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'research' | 'extension'; id: number; title: string } | null>(null);

    // Form Hooks
    const researchForm = useForm({
        title: '',
        program: 'CIDS College Research Program',
        role: 'Lead Researcher',
        duration: 'June 2026 – May 2027',
        status: 'Active',
        description: '',
        progress: 75,
        current_milestone: 'Milestone 2 - Data Pipeline & Model Prototyping',
        milestone_progress: 75,
        milestone_due_date: '2026-11-30',
        collaborators_count: 3,
        publications_summary: '1 Publication (Draft)',
        academic_period: 'AY 2026 - 2027',
    });

    const extensionForm = useForm({
        title: '',
        program: 'Institutional Extension Program',
        role: 'Program Coordinator',
        duration: 'August 2026 – December 2026',
        status: 'Active',
        description: '',
        progress: 60,
        beneficiaries_count: 85,
        activities_count: 5,
        next_activity: 'Community Training Session',
        academic_period: 'AY 2026 - 2027',
    });

    // KPI Metrics calculation
    const kpiMetrics = useMemo(() => {
        const activeResearch = researchProjects.filter((r) => r.status === 'Active').length;
        const totalPublications = researchProjects.reduce((acc, curr) => {
            return acc + (curr.publications_summary ? 1 : 0);
        }, 1); // minimum 1 or verified outputs count

        const activeExtension = extensionEngagements.filter((e) => e.status === 'Active').length;
        const verifiedRoles = new Set([
            ...researchProjects.map((r) => r.role),
            ...extensionEngagements.map((e) => e.role),
        ]).size;

        return {
            activeResearch: activeResearch || 2,
            totalPublications: totalPublications || 3,
            extensionPrograms: activeExtension || 1,
            verifiedRoles: verifiedRoles || 2,
            upcomingMilestones: 3,
        };
    }, [researchProjects, extensionEngagements]);

    // Filtered lists
    const filteredResearch = useMemo(() => {
        return researchProjects.filter((r) => {
            if (typeFilter === 'extension') return false;
            if (statusFilter !== 'all' && r.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = r.title.toLowerCase().includes(q);
                const matchProg = r.program.toLowerCase().includes(q);
                const matchRole = r.role.toLowerCase().includes(q);
                if (!matchTitle && !matchProg && !matchRole) return false;
            }
            return true;
        });
    }, [researchProjects, typeFilter, statusFilter, searchQuery]);

    const filteredExtension = useMemo(() => {
        return extensionEngagements.filter((e) => {
            if (typeFilter === 'research') return false;
            if (statusFilter !== 'all' && e.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = e.title.toLowerCase().includes(q);
                const matchProg = e.program.toLowerCase().includes(q);
                const matchRole = e.role.toLowerCase().includes(q);
                if (!matchTitle && !matchProg && !matchRole) return false;
            }
            return true;
        });
    }, [extensionEngagements, typeFilter, statusFilter, searchQuery]);

    // Form Submissions
    const handleResearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        researchForm.post('/faculty/research-extension/research', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateResearchOpen(false);
                researchForm.reset();
            },
        });
    };

    const handleExtensionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        extensionForm.post('/faculty/research-extension/extension', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateExtensionOpen(false);
                extensionForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingItem) return;
        const url =
            deletingItem.type === 'research'
                ? `/faculty/research-extension/research/${deletingItem.id}`
                : `/faculty/research-extension/extension/${deletingItem.id}`;

        router.delete(url, {
            preserveScroll: true,
            onSuccess: () => setDeletingItem(null),
        });
    };

    const handleExport = () => {
        const rows = [
            ['Type', 'Title', 'Program', 'Role', 'Status', 'Duration', 'Progress'],
            ...filteredResearch.map((r) => ['Research', `"${r.title}"`, `"${r.program}"`, `"${r.role}"`, r.status, `"${r.duration || ''}"`, `${r.progress}%`]),
            ...filteredExtension.map((e) => ['Extension', `"${e.title}"`, `"${e.program}"`, `"${e.role}"`, e.status, `"${e.duration || ''}"`, `${e.progress}%`]),
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Research_and_Extension_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Research & Extension - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto w-full">
                {/* 1. TOP MODULE HEADER (Exact Match to Screenshot) */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <FlaskConical className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">
                                Research & Extension Engagements
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Document your institutional research outputs, community extension programs, verified roles, and milestones.
                            </p>
                            <div className="mt-2">
                                <span className="inline-flex items-center text-[11px] font-black tracking-wide text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60 px-2.5 py-0.5 rounded-full">
                                    AY 2026 - 2027 · 1st Semester
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        <Button
                            onClick={() => setIsCreateResearchOpen(true)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Research Project</span>
                        </Button>

                        <Button
                            onClick={() => setIsCreateExtensionOpen(true)}
                            variant="outline"
                            className="font-bold text-xs rounded-xl px-4 py-2.5 shadow-2xs border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Extension Activity</span>
                        </Button>

                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="font-bold text-xs rounded-xl px-3.5 py-2.5 shadow-2xs border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                        </Button>
                    </div>
                </div>

                {/* 2. FIVE KPI STAT CARDS (Active Research, Publications, Extension Programs, Verified Roles, Upcoming Milestones) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Card 1: Active Research Projects */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight">
                                {kpiMetrics.activeResearch}
                            </div>
                            <span className="text-[11px] font-bold text-foreground block mt-0.5">
                                Active Research Projects
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                +1 from last AY
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Publications / Outputs */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight">
                                {kpiMetrics.totalPublications}
                            </div>
                            <span className="text-[11px] font-bold text-foreground block mt-0.5">
                                Publications / Outputs
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                                1 for this AY
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Extension Programs */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight">
                                {kpiMetrics.extensionPrograms}
                            </div>
                            <span className="text-[11px] font-bold text-foreground block mt-0.5">
                                Extension Programs
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                                Active this AY
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Verified Roles */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight">
                                {kpiMetrics.verifiedRoles}
                            </div>
                            <span className="text-[11px] font-bold text-foreground block mt-0.5">
                                Verified Roles
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                                As Researcher / Coordinator
                            </span>
                        </div>
                    </div>

                    {/* Card 5: Upcoming Milestones */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight">
                                {kpiMetrics.upcomingMilestones}
                            </div>
                            <span className="text-[11px] font-bold text-foreground block mt-0.5">
                                Upcoming Milestones
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                                Next 6 months
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. FILTER AND SEARCH TOOLBAR */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative min-w-[280px] flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search projects, extension activities, keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Select */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground font-semibold">Status</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[120px]"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="proposed">Proposed / Planned</option>
                            </select>
                        </div>

                        {/* Type Select */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground font-semibold">Type</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[110px]"
                            >
                                <option value="all">All Types</option>
                                <option value="research">Research</option>
                                <option value="extension">Extension</option>
                            </select>
                        </div>

                        {/* Academic Period Select */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground font-semibold">Academic Period</span>
                            <select
                                value={academicPeriod}
                                onChange={(e) => setAcademicPeriod(e.target.value)}
                                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                            >
                                <option value="AY 2026 - 2027">AY 2026 - 2027</option>
                                <option value="AY 2025 - 2026">AY 2025 - 2026</option>
                                <option value="All Periods">All Periods</option>
                            </select>
                        </div>

                        {/* Sort By Select */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground font-semibold">Sort By</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[125px]"
                            >
                                <option value="latest">Latest Update</option>
                                <option value="progress">Highest Progress</option>
                                <option value="title">Title (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN TWO-COLUMN CONTENT GRID (Left: Projects & Extensions | Right: Side Panels) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: ENGAGEMENT CARDS (8 Cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Section A: Research Projects & Publications */}
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4 text-rose-500" />
                                    <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                                        <span>Research Projects & Publications</span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {filteredResearch.length} {filteredResearch.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setTypeFilter(typeFilter === 'research' ? 'all' : 'research')}
                                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Research Cards */}
                            <div className="space-y-4">
                                {filteredResearch.map((project) => (
                                    <div
                                        key={project.id}
                                        className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 relative group"
                                    >
                                        {/* Status & Duration Top Bar */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                {project.status}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-semibold">
                                                    {project.duration || 'June 2026 – May 2027'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingItem({ type: 'research', id: project.id, title: project.title })}
                                                    className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer rounded"
                                                    title="Delete project"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title & Metadata */}
                                        <div>
                                            <h3 className="text-sm font-black text-foreground leading-snug">
                                                {project.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{project.program}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="font-semibold text-foreground">{project.role}</span>
                                                </div>
                                            </div>
                                            {project.description && (
                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Progress Bar & Current Milestone Box */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                            <div className="md:col-span-5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] font-bold">
                                                    <span className="text-muted-foreground">Overall Progress</span>
                                                    <span className="text-foreground">{project.progress}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${project.progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-7 bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl p-2.5 flex items-start gap-2.5">
                                                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                                                <div className="text-[11px]">
                                                    <span className="font-extrabold text-foreground block">Current Milestone</span>
                                                    <span className="text-muted-foreground">
                                                        {project.current_milestone || 'Milestone 2 - Data Pipeline & Model Prototyping'}
                                                    </span>
                                                    <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold mt-0.5">
                                                        {project.milestone_progress}% completed · Due {project.milestone_due_date ? new Date(project.milestone_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 30, 2026'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Meta Row: Collaborators, Publications, Tag */}
                                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-4 text-muted-foreground text-[11px] font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{project.collaborators_count} Collaborators</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{project.publications_summary || '1 Publication (Draft)'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 hidden sm:flex">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{project.next_action || 'Next: Model Evaluation Nov 30, 2026'}</span>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                                                Research
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section B: Community Extension Engagements */}
                        <div className="space-y-3.5 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sprout className="w-4 h-4 text-emerald-500" />
                                    <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                                        <span>Community Extension Engagements</span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {filteredExtension.length} {filteredExtension.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setTypeFilter(typeFilter === 'extension' ? 'all' : 'extension')}
                                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Extension Cards */}
                            <div className="space-y-4">
                                {filteredExtension.map((ext) => (
                                    <div
                                        key={ext.id}
                                        className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 relative group"
                                    >
                                        {/* Status & Duration Top Bar */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                {ext.status}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-semibold">
                                                    {ext.duration || 'August 2026 – December 2026'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingItem({ type: 'extension', id: ext.id, title: ext.title })}
                                                    className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer rounded"
                                                    title="Delete extension activity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title & Metadata */}
                                        <div>
                                            <h3 className="text-sm font-black text-foreground leading-snug">
                                                {ext.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{ext.program}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="font-semibold text-foreground">{ext.role}</span>
                                                </div>
                                            </div>
                                            {ext.description && (
                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                                    {ext.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Progress Bar Row */}
                                        <div className="space-y-1.5 max-w-md">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-muted-foreground">Implementation Progress</span>
                                                <span className="text-foreground">{ext.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-sky-500 rounded-full transition-all"
                                                    style={{ width: `${ext.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Footer Meta Row: Activities & Deliverables, Beneficiaries, Tag */}
                                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-4 text-muted-foreground text-[11px] font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>Activities & Deliverables</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{ext.beneficiaries_count} Beneficiaries</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{ext.activities_count} Activities</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 hidden sm:flex">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{ext.next_activity || 'Next: Community Training Session Oct 28, 2026'}</span>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                Extension
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDE PANELS (4 Cols) */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Panel 1: Upcoming Deadlines */}
                        <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-foreground" />
                                    <h3 className="font-extrabold text-xs text-foreground">Upcoming Deadlines</h3>
                                </div>
                                <button
                                    type="button"
                                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                {/* Item 1 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Model Evaluation Report
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                AI-driven Student Performance Analytics...
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Nov 30</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>

                                {/* Item 2 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Community Training Session
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                Community Tech Literacy Program
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Oct 28</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>

                                {/* Item 3 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Final Program Report
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                Community Tech Literacy Program
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Dec 15</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel 2: Recent Outputs & Publications */}
                        <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-foreground" />
                                    <h3 className="font-extrabold text-xs text-foreground">Recent Outputs & Publications</h3>
                                </div>
                                <button
                                    type="button"
                                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                {/* Item 1 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Draft Research Paper
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                AI-driven Student Performance Analytics...
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Oct 10</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>

                                {/* Item 2 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Program Module (v1.0)
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                Community Tech Literacy Program
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Sep 22</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>

                                {/* Item 3 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground leading-snug">
                                                Research Proposal (Approved)
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                CIDS College Research Program
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-foreground block">Jun 15</span>
                                        <span className="text-[9px] text-muted-foreground block">2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel 3: Quick Reminders Box (Yellow lightbulb style from screenshot) */}
                        <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 pb-1">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h3 className="font-extrabold text-xs text-foreground">Quick Reminders</h3>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                                        Update your milestone progress to keep your records current.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 flex items-start gap-2.5">
                                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-sky-900 dark:text-sky-200 leading-snug">
                                        Don't forget to submit your output files once published or completed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD RESEARCH PROJECT MODAL */}
            <Dialog open={isCreateResearchOpen} onOpenChange={setIsCreateResearchOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-rose-500" />
                            <span>Add Research Project</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Register an institutional or grant-funded research project in your faculty portfolio.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleResearchSubmit} className="space-y-4 pt-2 text-xs">
                        <div>
                            <label className="font-bold text-foreground block mb-1">
                                Project Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. AI-driven Student Performance Analytics"
                                value={researchForm.data.title}
                                onChange={(e) => researchForm.setData('title', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Program / Grant</label>
                                <input
                                    type="text"
                                    value={researchForm.data.program}
                                    onChange={(e) => researchForm.setData('program', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-foreground block mb-1">Your Role</label>
                                <select
                                    value={researchForm.data.role}
                                    onChange={(e) => researchForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold cursor-pointer"
                                >
                                    <option value="Lead Researcher">Lead Researcher</option>
                                    <option value="Co-Researcher">Co-Researcher</option>
                                    <option value="Research Consultant">Research Consultant</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Duration</label>
                                <input
                                    type="text"
                                    placeholder="June 2026 – May 2027"
                                    value={researchForm.data.duration}
                                    onChange={(e) => researchForm.setData('duration', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-foreground block mb-1">Status</label>
                                <select
                                    value={researchForm.data.status}
                                    onChange={(e) => researchForm.setData('status', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold cursor-pointer"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Proposed">Proposed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-foreground block mb-1">Description & Objectives</label>
                            <textarea
                                rows={2}
                                value={researchForm.data.description}
                                onChange={(e) => researchForm.setData('description', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-foreground block mb-1">
                                    Overall Progress ({researchForm.data.progress}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={researchForm.data.progress}
                                    onChange={(e) => researchForm.setData('progress', parseInt(e.target.value) || 0)}
                                    className="w-full accent-primary mt-2"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-foreground block mb-1">Collaborators Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={researchForm.data.collaborators_count}
                                    onChange={(e) => researchForm.setData('collaborators_count', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateResearchOpen(false)}
                                className="text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={researchForm.processing}
                                className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
                            >
                                Save Project
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ADD EXTENSION ACTIVITY MODAL */}
            <Dialog open={isCreateExtensionOpen} onOpenChange={setIsCreateExtensionOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-emerald-500" />
                            <span>Add Extension Engagement</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Record a community outreach, tech literacy, or skills development extension activity.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleExtensionSubmit} className="space-y-4 pt-2 text-xs">
                        <div>
                            <label className="font-bold text-foreground block mb-1">
                                Program / Activity Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Community Tech Literacy Program"
                                value={extensionForm.data.title}
                                onChange={(e) => extensionForm.setData('title', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Program Type</label>
                                <input
                                    type="text"
                                    value={extensionForm.data.program}
                                    onChange={(e) => extensionForm.setData('program', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-foreground block mb-1">Your Role</label>
                                <select
                                    value={extensionForm.data.role}
                                    onChange={(e) => extensionForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold cursor-pointer"
                                >
                                    <option value="Program Coordinator">Program Coordinator</option>
                                    <option value="Lead Trainer / Speaker">Lead Trainer / Speaker</option>
                                    <option value="Facilitator">Facilitator</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Beneficiaries Count</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={extensionForm.data.beneficiaries_count}
                                    onChange={(e) => extensionForm.setData('beneficiaries_count', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-foreground block mb-1">Activities Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={extensionForm.data.activities_count}
                                    onChange={(e) => extensionForm.setData('activities_count', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-foreground block mb-1">Description & Scope</label>
                            <textarea
                                rows={2}
                                value={extensionForm.data.description}
                                onChange={(e) => extensionForm.setData('description', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-foreground block mb-1">
                                Implementation Progress ({extensionForm.data.progress}%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={extensionForm.data.progress}
                                onChange={(e) => extensionForm.setData('progress', parseInt(e.target.value) || 0)}
                                className="w-full accent-primary mt-2"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateExtensionOpen(false)}
                                className="text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={extensionForm.processing}
                                className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
                            >
                                Save Engagement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <DeleteConfirmDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleDelete}
                title={`Delete ${deletingItem?.type === 'research' ? 'Research Project' : 'Extension Activity'}`}
                description={`Are you sure you want to remove "${deletingItem?.title}" from your faculty portfolio? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
