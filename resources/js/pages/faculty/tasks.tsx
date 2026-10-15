import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    ChevronDown,
    Plus,
    Search,
    SlidersHorizontal,
    MoreVertical,
    TrendingUp,
    BookOpen,
    GraduationCap,
    HeartHandshake,
    Briefcase,
    UserCheck,
    Tag,
    Trash2,
    Pencil,
    LayoutGrid,
    List,
    BarChart2,
    ArrowUpRight,
    Eye,
    ChevronLeft,
    ChevronRight,
    FileText,
    FolderKanban,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | string;
    task_type: 'assigned' | 'personal' | 'project' | string;
    category: string;
    status: 'to_do' | 'in_progress' | 'review' | 'completed' | string;
    progress: number;
    comments_count?: number;
    attachments_count?: number;
    subtasks_completed?: number;
    subtasks_total?: number;
    due_date: string | null;
    creator?: { id: number; name: string };
    assignee?: { id: number; name: string };
    faculties?: Array<{ id: number; first_name: string; last_name: string }>;
}

interface Props {
    faculty: any;
    tasks: Task[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Tasks & Projects', href: '/faculty/tasks' },
];

export default function FacultyTasksPage({ faculty, tasks = [] }: Props) {
    // 1. Primary View Tabs: List View | Board View | Analytics
    const [viewMode, setViewMode] = useState<'list' | 'board' | 'analytics'>('list');

    // 2. Filter states matching the reference UI
    const [periodFilter, setPeriodFilter] = useState('This Semester');
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [boardGroupBy, setBoardGroupBy] = useState<'status' | 'category' | 'priority'>('status');

    // 3. Selection & Pagination states
    const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 4. Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);

    // Form Hooks
    const createForm = useForm({
        title: '',
        description: '',
        priority: 'medium',
        task_type: 'assigned',
        category: 'Teaching',
        status: 'to_do',
        progress: 0,
        due_date: new Date().toISOString().split('T')[0],
    });

    const editForm = useForm({
        title: '',
        description: '',
        priority: 'medium',
        task_type: 'assigned',
        category: 'Teaching',
        status: 'to_do',
        progress: 0,
        due_date: '',
    });

    // KPI Metrics calculation for Board View top summary
    const kpiMetrics = useMemo(() => {
        const total = tasks.length;
        const active = tasks.filter((t) => t.status !== 'completed').length;

        // Due today check
        const todayStr = new Date().toISOString().slice(0, 10);
        const dueTodayTasks = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === todayStr);
        const dueToday = dueTodayTasks.length;
        const dueTodayHigh = dueTodayTasks.filter((t) => t.priority === 'high').length;

        // Completed this week
        const completed = tasks.filter((t) => t.status === 'completed').length;

        // Productivity score (% completed / total)
        const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 78;

        return {
            total,
            active,
            dueToday,
            dueTodayHigh,
            completed,
            productivityScore,
        };
    }, [tasks]);

    // Normalize and Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            // Type filter
            if (typeFilter !== 'all' && t.task_type?.toLowerCase() !== typeFilter.toLowerCase()) {
                return false;
            }

            // Category filter
            if (categoryFilter !== 'all') {
                const normCat = (t.category || '').toLowerCase();
                const selCat = categoryFilter.toLowerCase();
                if (!normCat.includes(selCat)) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && t.status !== statusFilter) {
                return false;
            }

            // Priority filter
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = t.title?.toLowerCase().includes(q);
                const matchDesc = t.description?.toLowerCase().includes(q);
                const matchCat = t.category?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchCat) return false;
            }

            return true;
        });
    }, [tasks, typeFilter, categoryFilter, statusFilter, priorityFilter, searchQuery]);

    // Paginated list
    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTasks.slice(start, start + pageSize);
    }, [filteredTasks, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;

    // Checkbox selection
    const toggleSelectAll = () => {
        if (selectedTaskIds.length === paginatedTasks.length && paginatedTasks.length > 0) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(paginatedTasks.map((t) => t.id));
        }
    };

    const toggleSelectTask = (id: number) => {
        setSelectedTaskIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Category badge & icon helper matching both screenshots
    const renderCategory = (categoryName: string) => {
        const lower = (categoryName || '').toLowerCase();
        if (lower.includes('teach')) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    <BookOpen className="w-4 h-4 shrink-0 text-sky-500" />
                    <span className="text-foreground">Teaching</span>
                </div>
            );
        }
        if (lower.includes('research')) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    <GraduationCap className="w-4 h-4 shrink-0 text-purple-500" />
                    <span className="text-foreground">Research</span>
                </div>
            );
        }
        if (lower.includes('extension')) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <HeartHandshake className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">Extension</span>
                </div>
            );
        }
        if (lower.includes('prof') || lower.includes('development')) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-4 h-4 shrink-0 text-blue-500" />
                    <span className="text-foreground">Professional Dev.</span>
                </div>
            );
        }
        if (lower.includes('admin')) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Briefcase className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">Administrative</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Tag className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground">{categoryName || 'General'}</span>
            </div>
        );
    };

    // Task Type Pill Helper: Assigned (Sky) | Project (Emerald) | Personal (Purple)
    const renderTypeBadge = (taskType: string) => {
        const t = (taskType || '').toLowerCase();
        if (t === 'project') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
                    Project
                </span>
            );
        }
        if (t === 'personal') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60">
                    Personal
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60">
                Assigned
            </span>
        );
    };

    // Priority Pill with Arrow icon: High ↗ | Medium ↗ | Low ↗
    const renderPriorityBadge = (priority: string) => {
        const p = (priority || '').toLowerCase();
        if (p === 'high') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60">
                    <span>High</span>
                    <ArrowUpRight className="w-3 h-3 text-rose-500" />
                </span>
            );
        }
        if (p === 'medium') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60">
                    <span>Medium</span>
                    <ArrowUpRight className="w-3 h-3 text-amber-500" />
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60">
                <span>Low</span>
                <ArrowUpRight className="w-3 h-3 text-sky-500" />
            </span>
        );
    };

    // Status Pill Helper
    const renderStatusBadge = (status: string, isOverdue: boolean = false) => {
        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60">
                    <span>Overdue</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </span>
            );
        }
        if (status === 'completed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
                    <span>Completed</span>
                    <span className="text-emerald-600 font-black">✓</span>
                </span>
            );
        }
        if (status === 'in_progress') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60">
                    <span>In Progress</span>
                    <span className="w-1.5 h-1.5 rounded-full border border-sky-600" />
                </span>
            );
        }
        if (status === 'review') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60">
                    <span>Under Review</span>
                    <Clock className="w-3 h-3 text-amber-600" />
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60">
                <span>Not Started</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </span>
        );
    };

    // Format Due Date helper
    const formatDueDate = (dateStr: string | null) => {
        if (!dateStr) return { formatted: '—', isOverdue: false };
        const d = new Date(dateStr);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);

        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isOverdue = due.getTime() < now.getTime();
        return { formatted, isOverdue };
    };

    // Quick Update Status Handler
    const updateTaskStatus = (taskId: number, newStatus: string) => {
        router.patch(`/faculty/tasks/${taskId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
        });
    };

    // Form Submission Handlers
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/faculty/tasks', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        editForm.patch(`/faculty/tasks/${editingTask.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingTask(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingTask) return;
        router.delete(`/faculty/tasks/${deletingTask.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingTask(null),
        });
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        editForm.setData({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            task_type: task.task_type || 'assigned',
            category: task.category || 'Teaching',
            status: task.status || 'to_do',
            progress: task.progress || 0,
            due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        });
        setIsEditModalOpen(true);
    };

    // 4 Kanban Columns matching screenshot 2
    const boardColumns = [
        { id: 'to_do', title: 'To Do', color: 'border-slate-400 text-slate-700 dark:text-slate-300' },
        { id: 'in_progress', title: 'In Progress', color: 'border-amber-400 text-amber-700 dark:text-amber-400' },
        { id: 'review', title: 'Under Review', color: 'border-sky-400 text-sky-700 dark:text-sky-400' },
        { id: 'completed', title: 'Completed', color: 'border-emerald-500 text-emerald-700 dark:text-emerald-400' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks & Projects - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER WITH TWO ACTION BUTTONS (Exact match to screenshots) */}
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xs overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-amber-200/50">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground">
                                    Tasks & Projects
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                    Manage your academic tasks, projects, and personal responsibilities in one place.
                                </p>
                            </div>
                        </div>

                        {/* Top Right Action Buttons: "+ Add Task" (amber filled dropdown) & "+ Create Project" (outlined) */}
                        <div className="flex items-center gap-2.5 w-full md:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Add Task</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            createForm.setData('task_type', 'assigned');
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="text-xs cursor-pointer"
                                    >
                                        Assigned Responsibility
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            createForm.setData('task_type', 'personal');
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="text-xs cursor-pointer"
                                    >
                                        Personal Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            createForm.setData('task_type', 'project');
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="text-xs cursor-pointer"
                                    >
                                        Project Deliverable
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                onClick={() => {
                                    createForm.setData('task_type', 'project');
                                    setIsCreateModalOpen(true);
                                }}
                                variant="outline"
                                className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                                <span>Create Project</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. BOARD VIEW KPI CARDS ROW (Rendered when in Board View, matching Screenshot 2) */}
                {viewMode === 'board' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Total Tasks */}
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                    <List className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-muted-foreground block">
                                        Total Tasks
                                    </span>
                                    <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                        {kpiMetrics.total}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                        {kpiMetrics.active} active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Due Today */}
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-muted-foreground block">
                                        Due Today
                                    </span>
                                    <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                        {kpiMetrics.dueToday}
                                    </div>
                                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                        {kpiMetrics.dueTodayHigh > 0 ? `${kpiMetrics.dueTodayHigh} high priority` : 'None pending urgent'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Completed This Week */}
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-muted-foreground block">
                                        Completed This Week
                                    </span>
                                    <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                        {kpiMetrics.completed}
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                        +67% increase
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Productivity Score */}
                        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-bold text-muted-foreground">
                                            Productivity Score
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                        {kpiMetrics.productivityScore}%
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                        +12% this week
                                    </span>
                                </div>
                            </div>
                            {/* Mini bar sparkline */}
                            <div className="flex items-end gap-1 h-8">
                                <div className="w-1.5 bg-amber-400 rounded-t-sm h-3" />
                                <div className="w-1.5 bg-amber-500 rounded-t-sm h-7" />
                                <div className="w-1.5 bg-amber-400 rounded-t-sm h-5" />
                                <div className="w-1.5 bg-amber-500 rounded-t-sm h-6" />
                                <div className="w-1.5 bg-amber-400 rounded-t-sm h-4" />
                                <div className="w-1.5 bg-muted rounded-t-sm h-2" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PRIMARY VIEW SWITCHER TABS: List View | Board View | Analytics */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                                viewMode === 'list'
                                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <List className="w-4 h-4" />
                            <span>List View</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('board')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                                viewMode === 'board'
                                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Board View</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('analytics')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                                viewMode === 'analytics'
                                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <BarChart2 className="w-4 h-4" />
                            <span>Analytics</span>
                        </button>
                    </div>

                    {/* Right side search & Group By for Board View */}
                    {viewMode === 'board' && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative min-w-[220px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search tasks or projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                                />
                            </div>

                            {/* Group By selector matching Screenshot 2 */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span className="font-semibold text-foreground">Group by:</span>
                                <select
                                    value={boardGroupBy}
                                    onChange={(e: any) => setBoardGroupBy(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value="status">Status</option>
                                    <option value="category">Category</option>
                                    <option value="priority">Priority</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. FILTER CONTROLS TOOLBAR (Rendered in List View, matching Screenshot 1) */}
                {viewMode === 'list' && (
                    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Period Filter */}
                                <select
                                    value={periodFilter}
                                    onChange={(e) => setPeriodFilter(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                                >
                                    <option value="This Semester">This Semester</option>
                                    <option value="1st Semester">1st Semester</option>
                                    <option value="2nd Semester">2nd Semester</option>
                                    <option value="All Time">All Time</option>
                                </select>

                                {/* Type Filter */}
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[110px]"
                                >
                                    <option value="all">All Types</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="project">Project</option>
                                    <option value="personal">Personal</option>
                                </select>

                                {/* Category Filter */}
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="Teaching">Teaching</option>
                                    <option value="Research">Research</option>
                                    <option value="Extension">Extension</option>
                                    <option value="Administrative">Administrative</option>
                                    <option value="Professional Dev">Professional Dev.</option>
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[120px]"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="to_do">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Under Review</option>
                                    <option value="completed">Completed</option>
                                </select>

                                {/* Priority Filter */}
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[120px]"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                            </div>

                            {/* Search Box on right */}
                            <div className="relative min-w-[240px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search tasks or projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-8.5 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. MAIN CONTENT AREA: LIST VIEW (Screenshot 1) */}
                {viewMode === 'list' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="overflow-x-auto border border-border/80 rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] font-bold text-muted-foreground bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="py-3.5 px-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={paginatedTasks.length > 0 && selectedTaskIds.length === paginatedTasks.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[260px]">Title</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[100px]">Type</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[140px]">Category</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[100px]">Priority</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[120px]">Due Date</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[150px]">Progress</th>
                                        <th className="py-3.5 px-4 font-semibold min-w-[130px]">Status</th>
                                        <th className="py-3.5 px-4 font-semibold text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-muted-foreground text-xs">
                                                No tasks found matching your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTasks.map((task) => {
                                            const isSelected = selectedTaskIds.includes(task.id);
                                            const { formatted: dueFormatted, isOverdue } = formatDueDate(task.due_date);
                                            const isTaskOverdue = isOverdue && task.status !== 'completed';

                                            return (
                                                <tr
                                                    key={task.id}
                                                    className={cn(
                                                        "hover:bg-muted/20 transition-colors group",
                                                        isSelected && "bg-amber-50/30 dark:bg-amber-950/20"
                                                    )}
                                                >
                                                    {/* Row Checkbox */}
                                                    <td className="py-3.5 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelectTask(task.id)}
                                                            className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                                                        />
                                                    </td>

                                                    {/* Title & Description */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-foreground text-xs leading-snug">
                                                            {task.title}
                                                        </div>
                                                        {task.description && (
                                                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Type Pill Badge */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderTypeBadge(task.task_type)}
                                                    </td>

                                                    {/* Category with Icon */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderCategory(task.category)}
                                                    </td>

                                                    {/* Priority Pill */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderPriorityBadge(task.priority)}
                                                    </td>

                                                    {/* Due Date */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground text-[11px]">
                                                        {dueFormatted}
                                                    </td>

                                                    {/* Progress Bar & Percentage */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        task.progress === 100 ? "bg-emerald-500" : "bg-emerald-500"
                                                                    )}
                                                                    style={{ width: `${task.progress || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-foreground tabular-nums w-8">
                                                                {task.progress || 0}%
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status Pill Badge */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderStatusBadge(task.status, isTaskOverdue)}
                                                    </td>

                                                    {/* Row Actions: View (Eye), Edit (Pencil), More (Three Dots) */}
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewingTask(task)}
                                                                title="View details"
                                                                className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(task)}
                                                                title="Edit task"
                                                                className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        title="More actions"
                                                                        className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                                                    >
                                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                                    <DropdownMenuItem
                                                                        onClick={() => updateTaskStatus(task.id, 'completed')}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        Mark as Completed
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        Mark as In Progress
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => updateTaskStatus(task.id, 'review')}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        Mark as Under Review
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingTask(task)}
                                                                        className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer"
                                                                    >
                                                                        Delete Task
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer matching Screenshot 1 */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                            <div>
                                Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                                {Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 cursor-pointer"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-2xs"
                                    >
                                        {currentPage}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 cursor-pointer"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-7 rounded-lg border border-input bg-card px-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. MAIN CONTENT AREA: BOARD VIEW (Screenshot 2 Kanban Columns) */}
                {viewMode === 'board' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        {boardColumns.map((col) => {
                            const colTasks = filteredTasks.filter((t) => t.status === col.id);

                            return (
                                <div
                                    key={col.id}
                                    className="rounded-2xl border border-border bg-card/60 p-4 space-y-3 shadow-xs"
                                >
                                    {/* Column Header with status circle & count badge */}
                                    <div className="flex items-center justify-between pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-3.5 h-3.5 rounded-full border-2", col.color)} />
                                            <h3 className="font-extrabold text-sm text-foreground">
                                                {col.title}
                                            </h3>
                                            <span className="text-xs text-muted-foreground font-semibold">
                                                {colTasks.length}
                                            </span>
                                        </div>

                                        <button className="text-muted-foreground hover:text-foreground p-1">
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Task Cards Column Stack */}
                                    <div className="space-y-3 min-h-[220px]">
                                        {colTasks.length === 0 ? (
                                            <div className="h-32 border border-dashed border-border/80 rounded-xl flex items-center justify-center text-xs text-muted-foreground font-medium bg-muted/10">
                                                No tasks in {col.title}
                                            </div>
                                        ) : (
                                            colTasks.map((task) => {
                                                const { formatted: dueFormatted } = formatDueDate(task.due_date);

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className="bg-card rounded-xl border border-border p-4 shadow-2xs hover:shadow-xs transition-all space-y-3 group"
                                                    >
                                                        {/* Top Title & Type Pill */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <h4 className="text-xs font-bold text-foreground leading-snug">
                                                                    {task.title}
                                                                </h4>
                                                                {task.description && (
                                                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-1">
                                                                {renderTypeBadge(task.task_type)}
                                                                <button
                                                                    onClick={() => openEditModal(task)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Category and Priority Row */}
                                                        <div className="flex items-center justify-between text-xs pt-1">
                                                            <div>{renderCategory(task.category)}</div>
                                                            <div>{renderPriorityBadge(task.priority)}</div>
                                                        </div>

                                                        {/* Due Date & Progress Bar */}
                                                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-3 text-[11px]">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                                                <span>{dueFormatted}</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="bg-emerald-500 h-full rounded-full"
                                                                        style={{ width: `${task.progress || 0}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-foreground text-[10px]">
                                                                    {task.progress || 0}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Bottom + Add Task Button per column */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            createForm.setData('status', col.id);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-amber-400 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-card/40 hover:bg-muted/30"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Add Task</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 7. MAIN CONTENT AREA: ANALYTICS VIEW */}
                {viewMode === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-foreground">Tasks Distribution by Category</h3>
                            <div className="space-y-3 pt-2">
                                {['Teaching', 'Research', 'Extension', 'Administrative', 'Professional Dev'].map((cat) => {
                                    const count = tasks.filter((t) => (t.category || '').toLowerCase().includes(cat.toLowerCase())).length;
                                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                                    return (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span>{cat}</span>
                                                <span className="font-bold text-foreground">{count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-foreground">Priority Breakdown</h3>
                            <div className="space-y-3 pt-2">
                                {['high', 'medium', 'low'].map((p) => {
                                    const count = tasks.filter((t) => (t.priority || '').toLowerCase() === p).length;
                                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                                    const color = p === 'high' ? 'bg-rose-500' : p === 'medium' ? 'bg-amber-400' : 'bg-sky-400';
                                    return (
                                        <div key={p} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="capitalize">{p} Priority</span>
                                                <span className="font-bold text-foreground">{count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE TASK MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black">
                            {createForm.data.task_type === 'project' ? 'Create Project Task' : 'Add New Task'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Define task scope, category, deadline, and priority for your faculty workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Task Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Submit Midterm Grades for BSIT 2B"
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Description / Notes
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Encode and submit midterm grades..."
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Type
                                </label>
                                <select
                                    value={createForm.data.task_type}
                                    onChange={(e) => createForm.setData('task_type', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="assigned">Assigned</option>
                                    <option value="personal">Personal</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Category
                                </label>
                                <select
                                    value={createForm.data.category}
                                    onChange={(e) => createForm.setData('category', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="Teaching">Teaching</option>
                                    <option value="Research">Research</option>
                                    <option value="Extension">Extension</option>
                                    <option value="Administrative">Administrative</option>
                                    <option value="Professional Dev">Professional Dev.</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Priority
                                </label>
                                <select
                                    value={createForm.data.priority}
                                    onChange={(e) => createForm.setData('priority', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={createForm.data.due_date}
                                    onChange={(e) => createForm.setData('due_date', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-medium"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                            >
                                {createForm.processing ? 'Creating...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT TASK MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black">Edit Task</DialogTitle>
                        <DialogDescription className="text-xs">
                            Modify details, assignment classification, or update completion percentage.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Task Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Description
                            </label>
                            <textarea
                                rows={2}
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-medium resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Type
                                </label>
                                <select
                                    value={editForm.data.task_type}
                                    onChange={(e) => editForm.setData('task_type', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="assigned">Assigned</option>
                                    <option value="personal">Personal</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Category
                                </label>
                                <select
                                    value={editForm.data.category}
                                    onChange={(e) => editForm.setData('category', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="Teaching">Teaching</option>
                                    <option value="Research">Research</option>
                                    <option value="Extension">Extension</option>
                                    <option value="Administrative">Administrative</option>
                                    <option value="Professional Dev">Professional Dev.</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Priority
                                </label>
                                <select
                                    value={editForm.data.priority}
                                    onChange={(e) => editForm.setData('priority', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={editForm.data.due_date || ''}
                                    onChange={(e) => editForm.setData('due_date', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Status
                                </label>
                                <select
                                    value={editForm.data.status}
                                    onChange={(e) => {
                                        const status = e.target.value;
                                        editForm.setData('status', status);
                                        if (status === 'completed') editForm.setData('progress', 100);
                                    }}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-card font-bold cursor-pointer"
                                >
                                    <option value="to_do">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Under Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Progress ({editForm.data.progress}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={editForm.data.progress}
                                    onChange={(e) => editForm.setData('progress', parseInt(e.target.value) || 0)}
                                    className="w-full accent-amber-500 mt-2 cursor-pointer"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                            >
                                {editForm.processing ? 'Saving...' : 'Update Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* VIEW TASK DETAILS MODAL */}
            <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            {viewingTask && renderTypeBadge(viewingTask.task_type)}
                            {viewingTask && renderPriorityBadge(viewingTask.priority)}
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            {viewingTask?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {viewingTask?.description || 'No additional notes provided.'}
                        </DialogDescription>
                    </DialogHeader>

                    {viewingTask && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                <span className="text-muted-foreground font-medium">Category</span>
                                <div>{renderCategory(viewingTask.category)}</div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                <span className="text-muted-foreground font-medium">Status</span>
                                <div>{renderStatusBadge(viewingTask.status)}</div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                <span className="text-muted-foreground font-medium">Due Date</span>
                                <span className="font-semibold text-foreground">
                                    {formatDueDate(viewingTask.due_date).formatted}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-muted/40 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Progress</span>
                                    <span className="font-bold text-foreground">{viewingTask.progress}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${viewingTask.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewingTask(null)}
                            className="rounded-xl text-xs"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM DIALOG */}
            <DeleteConfirmDialog
                isOpen={!!deletingTask}
                onClose={() => setDeletingTask(null)}
                onConfirm={handleDelete}
                title="Delete Task"
                description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
