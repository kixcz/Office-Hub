import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    FileCheck,
    Search,
    GraduationCap,
    Clock,
    AlertCircle,
    Calendar,
    Users,
    ChevronDown,
    FileText,
    TrendingUp,
    CheckCircle2,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Building2,
    Layers,
    ListFilter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance', href: '/compliance/tracker' },
    { title: 'Requirements', href: '/compliance/requirements' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Submission {
    id: number;
    status: string;
    submitted_at: string | null;
}

interface Requirement {
    id: number;
    title: string;
    document_type: string;
    academic_year: string;
    semester: string;
    due_date: string;
    program_id: number | null;
    program?: Program | null;
    submissions?: Submission[];
}

interface KPIs {
    total_requirements: number;
    active_programs: number;
    open_deadlines: number;
    total_submissions: number;
}

interface Props {
    requirements: Requirement[];
    programs: Program[];
    kpis?: KPIs;
}

const formatDatetimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function RequirementsIndex({
    requirements = [],
    programs = [],
    kpis,
}: Props) {
    // Dialogs state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
    const [viewingRequirement, setViewingRequirement] = useState<Requirement | null>(null);

    // Filters and sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [periodFilter, setPeriodFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<string>('newest');

    // Pagination (6 per page matching mockup: "Showing 6 of 9 requirements")
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Create form using Inertia useForm
    const createForm = useForm({
        title: '',
        document_type: '',
        academic_year: '2026-2027',
        semester: '1st Semester',
        due_date: '',
        program_id: '',
    });

    // Edit form using Inertia useForm
    const editForm = useForm({
        title: '',
        document_type: '',
        academic_year: '',
        semester: '',
        due_date: '',
        program_id: '',
    });

    const openCreateDialog = () => {
        createForm.reset();
        createForm.clearErrors();
        createForm.setData({
            title: '',
            document_type: '',
            academic_year: '2026-2027',
            semester: '1st Semester',
            due_date: '',
            program_id: '',
        });
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/compliance/requirements', {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const openEditDialog = (req: Requirement) => {
        setEditingRequirement(req);
        editForm.clearErrors();
        editForm.setData({
            title: req.title,
            document_type: req.document_type,
            academic_year: req.academic_year || '2026-2027',
            semester: req.semester || '1st Semester',
            due_date: formatDatetimeLocal(req.due_date),
            program_id: req.program_id ? String(req.program_id) : '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequirement) return;

        editForm.put(`/compliance/requirements/${editingRequirement.id}`, {
            onSuccess: () => {
                setEditingRequirement(null);
            },
        });
    };

    const handleDelete = (req: Requirement) => {
        if (confirm(`Are you sure you want to delete the requirement "${req.title}"? This will also remove its associated submissions.`)) {
            router.delete(`/compliance/requirements/${req.id}`);
        }
    };

    // Calculate deadline status & pills
    const getDeadlineMeta = (dueDateStr?: string) => {
        if (!dueDateStr) {
            return {
                formattedDate: 'No Deadline',
                badgeText: 'No Date',
                isOverdue: false,
                isDueSoon: false,
                colorClass: 'text-muted-foreground bg-muted',
                status: 'Upcoming',
            };
        }

        const due = new Date(dueDateStr);
        const formattedDate = due.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const now = new Date();
        // Zero out time components for day difference
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const diffMs = target.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                formattedDate,
                badgeText: `Overdue (${Math.abs(diffDays)}d)`,
                isOverdue: true,
                isDueSoon: false,
                badgeStyle: 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400',
                status: 'Overdue',
            };
        } else if (diffDays === 0) {
            return {
                formattedDate,
                badgeText: 'Due Today',
                isOverdue: false,
                isDueSoon: true,
                badgeStyle: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
                status: 'Due Soon',
            };
        } else if (diffDays <= 3) {
            return {
                formattedDate,
                badgeText: `Due in ${diffDays}d`,
                isOverdue: false,
                isDueSoon: true,
                badgeStyle: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
                status: 'Due Soon',
            };
        } else if (diffDays <= 20) {
            return {
                formattedDate,
                badgeText: `Due in ${diffDays}d`,
                isOverdue: false,
                isDueSoon: false,
                badgeStyle: 'text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400',
                status: 'In Progress',
            };
        } else {
            return {
                formattedDate,
                badgeText: `Due in ${diffDays}d`,
                isOverdue: false,
                isDueSoon: false,
                badgeStyle: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
                status: 'Upcoming',
            };
        }
    };

    // Filter & Sort
    const filteredRequirements = useMemo(() => {
        return requirements
            .filter((req) => {
                const searchLower = searchQuery.toLowerCase();
                const matchesSearch =
                    !searchQuery ||
                    req.title.toLowerCase().includes(searchLower) ||
                    req.document_type.toLowerCase().includes(searchLower) ||
                    (req.program?.code || '').toLowerCase().includes(searchLower);

                const matchesProgram =
                    programFilter === 'all' ||
                    (programFilter === 'unassigned' && !req.program_id) ||
                    (req.program?.code || '').toLowerCase() === programFilter.toLowerCase() ||
                    String(req.program_id) === programFilter;

                const matchesPeriod =
                    periodFilter === 'all' ||
                    (req.academic_year && req.academic_year.includes(periodFilter)) ||
                    (req.semester && req.semester.includes(periodFilter));

                const deadlineMeta = getDeadlineMeta(req.due_date);
                const totalSubs = req.submissions ? req.submissions.length : 0;
                const completedSubs = req.submissions
                    ? req.submissions.filter((s) => s.submitted_at !== null).length
                    : 0;

                let derivedStatus = deadlineMeta.status;
                if (completedSubs > 0 && completedSubs < totalSubs) {
                    derivedStatus = 'In Progress';
                }

                const matchesStatus =
                    statusFilter === 'all' ||
                    derivedStatus.toLowerCase() === statusFilter.toLowerCase();

                return matchesSearch && matchesProgram && matchesPeriod && matchesStatus;
            })
            .sort((a, b) => {
                if (sortOrder === 'oldest') {
                    return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
                }
                if (sortOrder === 'title') {
                    return a.title.localeCompare(b.title);
                }
                // Default: newest first
                return new Date(b.created_at || b.due_date || '').getTime() - new Date(a.created_at || a.due_date || '').getTime();
            });
    }, [requirements, searchQuery, programFilter, periodFilter, statusFilter, sortOrder]);

    // Paginated list
    const totalPages = Math.ceil(filteredRequirements.length / pageSize) || 1;
    const paginatedRequirements = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRequirements.slice(start, start + pageSize);
    }, [filteredRequirements, currentPage, pageSize]);

    // Unique academic periods for filter
    const academicPeriods = useMemo(() => {
        const periods = new Set<string>();
        requirements.forEach((r) => {
            if (r.academic_year) periods.add(r.academic_year);
            if (r.semester) periods.add(r.semester);
        });
        return Array.from(periods);
    }, [requirements]);

    // KPI values
    const totalReqs = kpis?.total_requirements ?? requirements.length;
    const activeProgs = kpis?.active_programs ?? programs.length;
    const openDeadlinesCount = kpis?.open_deadlines ?? requirements.filter((r) => {
        const meta = getDeadlineMeta(r.due_date);
        return !meta.isOverdue;
    }).length;
    const totalSubmissionsCount = kpis?.total_submissions ?? requirements.reduce(
        (acc, r) => acc + (r.submissions ? r.submissions.length : 0),
        0
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Requirements Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Requirements Management
                            </h1>
                            <p className="text-xs text-muted-foreground font-medium">
                                Create, distribute, and manage compliance requirements across academic programs.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add Requirement</span>
                    </Button>
                </div>

                {/* 2. FOUR KPI STAT CARDS (Exact match to mockup) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: TOTAL REQUIREMENTS */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    TOTAL REQUIREMENTS
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {totalReqs}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    assigned tasks
                                </span>
                            </div>
                        </div>
                        <div className="text-amber-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Card 2: ACTIVE PROGRAMS */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    ACTIVE PROGRAMS
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {activeProgs}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    with requirements
                                </span>
                            </div>
                        </div>
                        <div className="text-sky-500">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Card 3: OPEN DEADLINES */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    OPEN DEADLINES
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {openDeadlinesCount}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    upcoming or overdue
                                </span>
                            </div>
                        </div>
                        <div className="text-rose-500">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Card 4: TOTAL SUBMISSIONS */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    TOTAL SUBMISSIONS
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {totalSubmissionsCount}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    distributed outputs
                                </span>
                            </div>
                        </div>
                        <div className="text-emerald-500">
                            <FileCheck className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. FILTER & SEARCH CONTROLS BAR (Matches Mockup) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search requirements by title, document type, or keywords..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 pl-9.5 pr-4 text-xs rounded-xl border border-border bg-card text-foreground shadow-2xs"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* All Programs */}
                        <div className="relative min-w-[140px]">
                            <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select
                                value={programFilter}
                                onChange={(e) => {
                                    setProgramFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 pl-8 pr-7 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Programs</option>
                                <option value="unassigned">All Unassigned</option>
                                {programs.map((prog) => (
                                    <option key={prog.id} value={prog.code}>
                                        {prog.code}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* All Academic Periods */}
                        <div className="relative min-w-[160px]">
                            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select
                                value={periodFilter}
                                onChange={(e) => {
                                    setPeriodFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 pl-8 pr-7 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Academic Periods</option>
                                <option value="2026-2027">2026-2027</option>
                                <option value="1st Semester">1st Semester</option>
                                <option value="2nd Semester">2nd Semester</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* All Statuses */}
                        <div className="relative min-w-[130px]">
                            <ListFilter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 pl-8 pr-7 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Due Soon">Due Soon</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Upcoming">Upcoming</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Sort Order */}
                        <div className="relative min-w-[130px]">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="h-10 px-3 pr-7 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="newest">⇅ Newest First</option>
                                <option value="oldest">⇅ Oldest Deadline</option>
                                <option value="title">⇅ By Title (A-Z)</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* 4. MAIN REQUIREMENTS TABLE CARD (Matches Mockup) */}
                <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-3.5 px-6 font-bold">REQUIREMENT</th>
                                    <th className="py-3.5 px-4 font-bold">ASSIGNED PROGRAM</th>
                                    <th className="py-3.5 px-4 font-bold">ACADEMIC PERIOD</th>
                                    <th className="py-3.5 px-4 font-bold">DEADLINE</th>
                                    <th className="py-3.5 px-4 font-bold min-w-[160px]">SUBMISSION PROGRESS</th>
                                    <th className="py-3.5 px-4 font-bold text-center">STATUS</th>
                                    <th className="py-3.5 px-4 font-bold text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-medium">
                                {paginatedRequirements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                            No compliance requirements found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRequirements.map((req, idx) => {
                                        const deadlineMeta = getDeadlineMeta(req.due_date);
                                        const totalSubs = req.submissions ? req.submissions.length : 0;
                                        const completedSubs = req.submissions
                                            ? req.submissions.filter((s) => s.submitted_at !== null).length
                                            : 0;
                                        const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

                                        // Left requirement icon color variety matching mockup
                                        const iconColorVariants = [
                                            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                                            'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                                        ];
                                        const iconStyle = iconColorVariants[idx % iconColorVariants.length];

                                        // Determine Status Pill
                                        let statusLabel = deadlineMeta.status;
                                        let statusPillClass = 'bg-slate-500/10 text-slate-600 border-slate-500/20';
                                        let StatusIcon = Clock;

                                        if (progressPercent > 0 && progressPercent < 100) {
                                            statusLabel = 'In Progress';
                                            statusPillClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                                            StatusIcon = RotateCw;
                                        } else if (progressPercent === 100) {
                                            statusLabel = 'Completed';
                                            statusPillClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                                            StatusIcon = CheckCircle2;
                                        } else if (deadlineMeta.isOverdue) {
                                            statusLabel = 'Overdue';
                                            statusPillClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                                            StatusIcon = AlertCircle;
                                        } else if (deadlineMeta.isDueSoon) {
                                            statusLabel = 'Due Soon';
                                            statusPillClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                            StatusIcon = Clock;
                                        } else {
                                            statusLabel = 'Upcoming';
                                            statusPillClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                                            StatusIcon = Clock;
                                        }

                                        return (
                                            <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                                                {/* 1. REQUIREMENT TITLE & TYPE */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", iconStyle)}>
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => setViewingRequirement(req)}>
                                                                {req.title}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                                                                {req.document_type || 'DOCUMENT'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. ASSIGNED PROGRAM */}
                                                <td className="py-4 px-4">
                                                    {req.program ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                            <GraduationCap className="w-3.5 h-3.5" />
                                                            <span>{req.program.code}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                                            <Users className="w-3.5 h-3.5" />
                                                            <span>All Programs</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 3. ACADEMIC PERIOD */}
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-foreground">
                                                            {req.academic_year || '2026-2027'}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground mt-0.5">
                                                            {req.semester || '1st Semester'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 4. DEADLINE */}
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>{deadlineMeta.formattedDate}</span>
                                                        </div>
                                                        {deadlineMeta.badgeText && (
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                                deadlineMeta.badgeStyle
                                                            )}>
                                                                {deadlineMeta.badgeText}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 5. SUBMISSION PROGRESS */}
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-semibold text-foreground">
                                                                {completedSubs} / {totalSubs} submitted
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {progressPercent}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-300",
                                                                    progressPercent === 100
                                                                        ? "bg-emerald-500"
                                                                        : progressPercent > 0
                                                                        ? "bg-emerald-500"
                                                                        : "bg-muted-foreground/30"
                                                                )}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 6. STATUS */}
                                                <td className="py-4 px-4 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                                                        statusPillClass
                                                    )}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        <span>{statusLabel}</span>
                                                    </span>
                                                </td>

                                                {/* 7. ACTIONS */}
                                                <td className="py-4 px-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => setViewingRequirement(req)} className="cursor-pointer">
                                                                <Eye className="w-3.5 h-3.5 mr-2" />
                                                                <span>View Details</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(req)} className="cursor-pointer">
                                                                <Edit className="w-3.5 h-3.5 mr-2" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(req)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
                                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                                <span>Delete</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer (Matches Mockup: Showing 6 of 9 requirements) */}
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground font-medium">
                            Showing {paginatedRequirements.length} of {filteredRequirements.length} requirements
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer",
                                        currentPage === pageNumber
                                            ? "bg-amber-500 text-slate-950 shadow-xs"
                                            : "border border-border bg-card hover:bg-muted text-foreground"
                                    )}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* CREATE REQUIREMENT MODAL */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-amber-500" />
                                Create New Requirement
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Add an academic output requirement. A submission record will automatically be generated for assigned faculty members.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData('title', e.target.value)}
                                    placeholder="e.g. Submission of TOS and TQ"
                                    required
                                />
                                {createForm.errors.title && (
                                    <p className="text-xs text-red-500">{createForm.errors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Document Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.document_type}
                                        onChange={(e) => createForm.setData('document_type', e.target.value)}
                                        placeholder="e.g. Teaching Load Documents"
                                        required
                                    />
                                    {createForm.errors.document_type && (
                                        <p className="text-xs text-red-500">{createForm.errors.document_type}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Assigned Program
                                    </Label>
                                    <select
                                        value={createForm.data.program_id}
                                        onChange={(e) => createForm.setData('program_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">All Programs</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.program_id && (
                                        <p className="text-xs text-red-500">{createForm.errors.program_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Academic Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.academic_year}
                                        onChange={(e) => createForm.setData('academic_year', e.target.value)}
                                        placeholder="e.g. 2026-2027"
                                        required
                                    />
                                    {createForm.errors.academic_year && (
                                        <p className="text-xs text-red-500">{createForm.errors.academic_year}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Semester <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.semester}
                                        onChange={(e) => createForm.setData('semester', e.target.value)}
                                        placeholder="e.g. 1st Semester"
                                        required
                                    />
                                    {createForm.errors.semester && (
                                        <p className="text-xs text-red-500">{createForm.errors.semester}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Deadline <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={createForm.data.due_date}
                                    onChange={(e) => createForm.setData('due_date', e.target.value)}
                                    required
                                />
                                {createForm.errors.due_date && (
                                    <p className="text-xs text-red-500">{createForm.errors.due_date}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                >
                                    {createForm.processing ? 'Saving...' : 'Create Requirement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* EDIT REQUIREMENT MODAL */}
                <Dialog open={!!editingRequirement} onOpenChange={(open) => !open && setEditingRequirement(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-amber-500" />
                                Edit Requirement
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    required
                                />
                                {editForm.errors.title && (
                                    <p className="text-xs text-red-500">{editForm.errors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Document Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.document_type}
                                        onChange={(e) => editForm.setData('document_type', e.target.value)}
                                        required
                                    />
                                    {editForm.errors.document_type && (
                                        <p className="text-xs text-red-500">{editForm.errors.document_type}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Assigned Program
                                    </Label>
                                    <select
                                        value={editForm.data.program_id}
                                        onChange={(e) => editForm.setData('program_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">All Programs</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {editForm.errors.program_id && (
                                        <p className="text-xs text-red-500">{editForm.errors.program_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Academic Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.academic_year}
                                        onChange={(e) => editForm.setData('academic_year', e.target.value)}
                                        required
                                    />
                                    {editForm.errors.academic_year && (
                                        <p className="text-xs text-red-500">{editForm.errors.academic_year}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Semester <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.semester}
                                        onChange={(e) => editForm.setData('semester', e.target.value)}
                                        required
                                    />
                                    {editForm.errors.semester && (
                                        <p className="text-xs text-red-500">{editForm.errors.semester}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Deadline <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={editForm.data.due_date}
                                    onChange={(e) => editForm.setData('due_date', e.target.value)}
                                    required
                                />
                                {editForm.errors.due_date && (
                                    <p className="text-xs text-red-500">{editForm.errors.due_date}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingRequirement(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                >
                                    {editForm.processing ? 'Saving...' : 'Update Requirement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* VIEW DETAILS MODAL */}
                <Dialog open={!!viewingRequirement} onOpenChange={(open) => !open && setViewingRequirement(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-amber-500" />
                                Requirement Details
                            </DialogTitle>
                        </DialogHeader>

                        {viewingRequirement && (
                            <div className="flex flex-col gap-4 mt-2">
                                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Title
                                        </span>
                                        <h3 className="text-base font-bold text-foreground">
                                            {viewingRequirement.title}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground text-[11px]">Document Type:</span>
                                            <div className="font-bold text-foreground uppercase">
                                                {viewingRequirement.document_type}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[11px]">Assigned Program:</span>
                                            <div className="font-bold text-foreground">
                                                {viewingRequirement.program?.code || 'All Programs'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[11px]">Academic Year:</span>
                                            <div className="font-bold text-foreground">
                                                {viewingRequirement.academic_year || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[11px]">Semester:</span>
                                            <div className="font-bold text-foreground">
                                                {viewingRequirement.semester || '—'}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground text-[11px]">Deadline:</span>
                                            <div className="font-bold text-foreground">
                                                {viewingRequirement.due_date
                                                    ? new Date(viewingRequirement.due_date).toLocaleString()
                                                    : 'No deadline'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Submission Statistics
                                    </span>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Total Assigned Faculty:</span>
                                        <span className="font-bold text-foreground">
                                            {viewingRequirement.submissions?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Completed Submissions:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {viewingRequirement.submissions?.filter((s) => s.submitted_at !== null).length || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Pending Submissions:</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                            {viewingRequirement.submissions?.filter((s) => s.submitted_at === null).length || 0}
                                        </span>
                                    </div>
                                </div>

                                <DialogFooter className="mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setViewingRequirement(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const req = viewingRequirement;
                                            setViewingRequirement(null);
                                            openEditDialog(req);
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit Requirement
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
