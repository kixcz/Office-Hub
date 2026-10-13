import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    SlidersHorizontal,
    CheckCircle2,
    Clock,
    Calendar,
    Paperclip,
    MessageSquare,
    CheckSquare,
    MoreHorizontal,
    LayoutGrid,
    List,
    TrendingUp,
    Check,
    ChevronDown,
    X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'to_do' | 'in_progress' | 'review' | 'completed' | string;
    progress: number;
    comments_count: number;
    subtasks_completed: number;
    subtasks_total: number;
    attachments_count: number;
    due_date: string | null;
    assignee_initials: string | null;
    extra_assignees_count: number;
    creator?: User;
    assignee?: User | null;
}

interface KPIs {
    total_tasks: number;
    in_progress: number;
    due_today: number;
    completed_week: number;
}

interface Props {
    tasks: Task[];
    users: User[];
    kpis: KPIs;
    filters: {
        search: string;
        priority: string;
        assignee: string;
        due_date: string;
    };
}

export default function TasksIndex({ tasks = [], users = [], kpis, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tasks & Projects', href: '/tasks' },
    ];

    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedPriority, setSelectedPriority] = useState(filters?.priority || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(filters?.assignee || 'all');
    const [selectedDueDate, setSelectedDueDate] = useState(filters?.due_date || 'all');

    const [isCreating, setIsCreating] = useState(false);
    const [columnToCreate, setColumnToCreate] = useState<'to_do' | 'in_progress' | 'review' | 'completed'>('to_do');

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        due_date: '',
        assigned_to: '',
        assignee_initials: '',
        progress: 0,
    });

    const openCreateModal = (defaultStatus: 'to_do' | 'in_progress' | 'review' | 'completed' = 'to_do') => {
        setColumnToCreate(defaultStatus);
        setData('status', defaultStatus);
        setIsCreating(true);
    };

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tasks', {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            },
        });
    };

    const updateStatus = (taskId: number, newStatus: string) => {
        router.patch(`/tasks/${taskId}`, { status: newStatus }, { preserveScroll: true });
    };

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = !searchTerm ||
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesPriority = selectedPriority === 'all' ||
                t.priority.toLowerCase() === selectedPriority.toLowerCase();

            const matchesAssignee = selectedAssignee === 'all' ||
                (t.assignee_initials && t.assignee_initials.toLowerCase().includes(selectedAssignee.toLowerCase()));

            return matchesSearch && matchesPriority && matchesAssignee;
        });
    }, [tasks, searchTerm, selectedPriority, selectedAssignee]);

    const todoTasks = useMemo(() => filteredTasks.filter(t => t.status === 'to_do'), [filteredTasks]);
    const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'in_progress'), [filteredTasks]);
    const reviewTasks = useMemo(() => filteredTasks.filter(t => t.status === 'review'), [filteredTasks]);
    const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'completed'), [filteredTasks]);

    // Priority badge helper
    const renderPriorityBadge = (priority: string) => {
        const p = priority.toLowerCase();
        if (p === 'high') {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    HIGH
                </span>
            );
        }
        if (p === 'medium') {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    MEDIUM
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                LOW
            </span>
        );
    };

    // Format date e.g. Oct 20, 2026
    const formatDueDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Render individual task card in board
    const renderTaskCard = (task: Task) => {
        const isCompleted = task.status === 'completed';

        return (
            <div
                key={task.id}
                className="bg-card text-card-foreground border border-border/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-3 group"
            >
                {/* Title & Priority */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                        {isCompleted && (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                        )}
                        <h4 className={cn(
                            "font-bold text-sm leading-snug text-foreground",
                            isCompleted && "line-through text-muted-foreground font-semibold"
                        )}>
                            {task.title}
                        </h4>
                    </div>
                    <div className="shrink-0">
                        {renderPriorityBadge(task.priority)}
                    </div>
                </div>

                {/* Description */}
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Progress Bar (if in_progress or review) */}
                {task.progress > 0 && !isCompleted && (
                    <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mr-2">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        task.status === 'review' ? "bg-amber-500" : "bg-sky-500"
                                    )}
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-foreground tabular-nums shrink-0">
                                {task.progress}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Due Date & Assignee Avatar Row */}
                <div className="flex items-center justify-between text-xs pt-1">
                    {task.due_date ? (
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold",
                            task.status === 'to_do' ? "text-rose-500" :
                            task.status === 'in_progress' ? "text-sky-600 dark:text-sky-400" :
                            task.status === 'review' ? "text-amber-600 dark:text-amber-400" :
                            "text-muted-foreground"
                        )}>
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatDueDate(task.due_date)}</span>
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Assignee Avatar */}
                    <div className="flex items-center -space-x-1">
                        {task.assignee_initials && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center border border-border">
                                {task.assignee_initials}
                            </div>
                        )}
                        {task.extra_assignees_count > 0 && (
                            <div className="text-[10px] font-bold text-muted-foreground pl-1.5">
                                +{task.extra_assignees_count}
                            </div>
                        )}
                    </div>
                </div>

                {/* Subtasks, Comments, Attachments Meta Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-3">
                        {task.comments_count > 0 && (
                            <div className="flex items-center gap-1 hover:text-foreground">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.comments_count}</span>
                            </div>
                        )}

                        {task.subtasks_total > 0 && (
                            <div className={cn(
                                "flex items-center gap-1 font-medium",
                                task.subtasks_completed === task.subtasks_total && "text-emerald-600 dark:text-emerald-400 font-bold"
                            )}>
                                <CheckSquare className="w-3 h-3" />
                                <span>{task.subtasks_completed}/{task.subtasks_total}</span>
                            </div>
                        )}

                        {task.attachments_count > 0 && (
                            <div className="flex items-center gap-1 hover:text-foreground">
                                <Paperclip className="w-3 h-3" />
                                <span>{task.attachments_count}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Move dropdown */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                            value={task.status}
                            onChange={(e) => updateStatus(task.id, e.target.value)}
                            className="text-[10px] font-bold py-0.5 px-1.5 rounded border border-border bg-card text-foreground cursor-pointer focus:outline-none"
                        >
                            <option value="to_do">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks & Projects - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground">
                            Tasks & Projects
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            Manage ongoing tasks, assign responsibilities, and track progress across your team.
                        </p>
                    </div>

                    <Button
                        onClick={() => openCreateModal('to_do')}
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold text-xs rounded-xl px-4 py-2.5 shadow-xs cursor-pointer flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Task</span>
                    </Button>
                </div>

                {/* 2. FOUR KPI METRIC CARDS (Exact match to screenshot) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Tasks */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Tasks
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.total_tasks || 12}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-3 h-3" />
                                +3
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                vs. last week
                            </span>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    In Progress
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.in_progress || 4}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-foreground">
                                33%
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                of total tasks
                            </span>
                        </div>
                    </div>

                    {/* Due Today */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Due Today
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.due_today || 2}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <TrendingUp className="w-3 h-3" />
                                +1
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                tasks due today
                            </span>
                        </div>
                    </div>

                    {/* Completed This Week */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Completed This Week
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.completed_week || 6}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-3 h-3" />
                                +2
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                vs. last week
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. FILTER TOOLBAR & VIEW TOGGLE (Board / List) */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search tasks, projects, or keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[120px]"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <select
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[125px]"
                        >
                            <option value="all">All Assignees</option>
                            <option value="JD">JD</option>
                            <option value="CD">CD</option>
                            <option value="RG">RG</option>
                            <option value="KG">KG</option>
                            <option value="SA">SA</option>
                        </select>

                        <select
                            value={selectedDueDate}
                            onChange={(e) => setSelectedDueDate(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[110px]"
                        >
                            <option value="all">Due Date</option>
                            <option value="today">Due Today</option>
                            <option value="week">Due This Week</option>
                            <option value="month">Due This Month</option>
                        </select>

                        {/* Board / List Toggle */}
                        <div className="flex items-center p-0.5 rounded-xl border border-border bg-muted/40 ml-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('board')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    viewMode === 'board'
                                        ? "bg-amber-300 text-slate-900 shadow-2xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>Board</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    viewMode === 'list'
                                        ? "bg-amber-300 text-slate-900 shadow-2xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <List className="w-3.5 h-3.5" />
                                <span>List</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. BOARD COLUMNS VIEW (To Do, In Progress, Review, Completed) */}
                {viewMode === 'board' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        {/* COLUMN 1: TO DO */}
                        <div className="rounded-2xl p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/30 space-y-3">
                            <div className="flex items-center justify-between px-1.5 pt-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <h3 className="font-extrabold text-sm text-foreground">To Do</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center justify-center">
                                        {todoTasks.length}
                                    </span>
                                    <button className="text-muted-foreground hover:text-foreground p-1">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[160px]">
                                {todoTasks.map(renderTaskCard)}
                            </div>

                            <button
                                type="button"
                                onClick={() => openCreateModal('to_do')}
                                className="w-full py-2.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add a task</span>
                            </button>
                        </div>

                        {/* COLUMN 2: IN PROGRESS */}
                        <div className="rounded-2xl p-3 bg-sky-50/50 dark:bg-sky-950/15 border border-sky-200/50 dark:border-sky-900/30 space-y-3">
                            <div className="flex items-center justify-between px-1.5 pt-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-sky-500" />
                                    <h3 className="font-extrabold text-sm text-foreground">In Progress</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-sky-200/70 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200 text-xs font-black flex items-center justify-center">
                                        {inProgressTasks.length}
                                    </span>
                                    <button className="text-muted-foreground hover:text-foreground p-1">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[160px]">
                                {inProgressTasks.map(renderTaskCard)}
                            </div>

                            <button
                                type="button"
                                onClick={() => openCreateModal('in_progress')}
                                className="w-full py-2.5 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 text-xs font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add a task</span>
                            </button>
                        </div>

                        {/* COLUMN 3: REVIEW */}
                        <div className="rounded-2xl p-3 bg-orange-50/50 dark:bg-orange-950/15 border border-orange-200/50 dark:border-orange-900/30 space-y-3">
                            <div className="flex items-center justify-between px-1.5 pt-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <h3 className="font-extrabold text-sm text-foreground">Review</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-orange-200/70 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200 text-xs font-black flex items-center justify-center">
                                        {reviewTasks.length}
                                    </span>
                                    <button className="text-muted-foreground hover:text-foreground p-1">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[160px]">
                                {reviewTasks.map(renderTaskCard)}
                            </div>

                            <button
                                type="button"
                                onClick={() => openCreateModal('review')}
                                className="w-full py-2.5 rounded-xl border border-dashed border-orange-300 dark:border-orange-800 text-xs font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add a task</span>
                            </button>
                        </div>

                        {/* COLUMN 4: COMPLETED */}
                        <div className="rounded-2xl p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
                            <div className="flex items-center justify-between px-1.5 pt-1">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <h3 className="font-extrabold text-sm text-foreground">Completed</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-black flex items-center justify-center">
                                        {completedTasks.length}
                                    </span>
                                    <button className="text-muted-foreground hover:text-foreground p-1">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[160px]">
                                {completedTasks.map(renderTaskCard)}
                            </div>

                            <button
                                type="button"
                                onClick={() => openCreateModal('completed')}
                                className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add a task</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">Task Name</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Progress</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Assignee</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-foreground">{task.title}</div>
                                            {task.description && <div className="text-[11px] text-muted-foreground truncate max-w-xs">{task.description}</div>}
                                        </td>
                                        <td className="px-4 py-3 uppercase font-extrabold text-[10px]">
                                            {task.status.replace('_', ' ')}
                                        </td>
                                        <td className="px-4 py-3">{renderPriorityBadge(task.priority)}</td>
                                        <td className="px-4 py-3 font-semibold tabular-nums">{task.progress}%</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDueDate(task.due_date) || '—'}</td>
                                        <td className="px-4 py-3 font-bold">{task.assignee_initials || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateStatus(task.id, e.target.value)}
                                                className="text-xs font-bold rounded border border-border bg-card px-2 py-1"
                                            >
                                                <option value="to_do">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE TASK MODAL */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                            Add a new task or project responsibility for your team.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitTask} className="space-y-4 py-2 text-xs">
                        <div>
                            <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                Task Title
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="e.g. ISO Audit Preparation"
                                className="w-full h-9 rounded-xl border border-input bg-card px-3 font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                                required
                            />
                            {errors.title && <p className="text-rose-500 text-[10px] mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Details about this task..."
                                className="w-full h-20 rounded-xl border border-input bg-card p-3 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Priority
                                </label>
                                <select
                                    value={data.priority}
                                    onChange={e => setData('priority', e.target.value)}
                                    className="w-full h-9 rounded-xl border border-input bg-card px-3 font-semibold shadow-xs"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Column / Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full h-9 rounded-xl border border-input bg-card px-3 font-semibold shadow-xs"
                                >
                                    <option value="to_do">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={e => setData('due_date', e.target.value)}
                                    className="w-full h-9 rounded-xl border border-input bg-card px-3 font-semibold shadow-xs"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Assignee Initials
                                </label>
                                <input
                                    type="text"
                                    value={data.assignee_initials}
                                    onChange={e => setData('assignee_initials', e.target.value.toUpperCase())}
                                    placeholder="e.g. JD"
                                    maxLength={4}
                                    className="w-full h-9 rounded-xl border border-input bg-card px-3 font-semibold shadow-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-amber-400 text-slate-900 hover:bg-amber-500 font-bold">
                                {processing ? 'Creating...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
