import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    CalendarDays,
    Calendar as CalendarIcon,
    Plus,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    MoreVertical,
    Clock,
    Eye,
    Edit,
    Trash2,
    Copy,
    CheckCircle2,
    Star,
    Layers,
    Share2,
    SlidersHorizontal,
    ArrowUpDown,
    Check,
    X,
    FolderKanban,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    Monitor,
    Users,
    FileText,
    Trophy,
    RotateCcw,
    AlertCircle,
    Power,
    Archive,
    Play,
    Building2,
    Sparkles,
    ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/administration/academic-periods' },
    { title: 'Academic Periods', href: '/administration/academic-periods' },
];

export interface AcademicPeriodItem {
    id: number;
    academic_year: string;
    semester: string;
    code?: string | null;
    start_date: string;
    end_date: string;
    class_start_date: string;
    class_end_date: string;
    midterm_start_date?: string | null;
    midterm_end_date?: string | null;
    final_start_date?: string | null;
    final_end_date?: string | null;
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    is_current: boolean;
    notes?: string | null;
    planning_rules_version?: string;
    planning_parameters?: {
        active_weekdays?: string[];
        earliest_class_time?: string;
        latest_class_time?: string;
        allow_saturday?: boolean;
        holidays?: string[];
        semester_start_reference?: string;
        room_availability_ruleset?: string;
        instructional_weeks?: number;
        institutional_breaks?: string;
    } | null;
}

interface Props {
    periods: AcademicPeriodItem[];
    currentPeriod: AcademicPeriodItem | null;
    stats: {
        total_periods: number;
        dependent_modules_synced: number;
        current_status: string;
        current_period_name: string;
        next_semester_prepared: string;
        next_semester_label: string;
    };
    academicYears: string[];
    filters: {
        search?: string;
        status?: string;
        academic_year?: string;
    };
}

export default function AcademicPeriodsIndex({
    periods = [],
    currentPeriod,
    stats,
    academicYears = [],
    filters = {},
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [yearFilter, setYearFilter] = useState(filters.academic_year || 'all');
    const [activeTab, setActiveTab] = useState<'all' | 'Active' | 'Draft' | 'Closed' | 'Archived'>('all');
    const [sortDirection, setSortDirection] = useState<'newest' | 'oldest'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Slide-over Drawer / Panel State
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<AcademicPeriodItem | null>(null);

    // Collapsible sections state for the create/edit form
    const [openSections, setOpenSections] = useState({
        basic: true,
        milestones: true,
        planning: true,
        copySetup: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Modals
    const [viewingPeriod, setViewingPeriod] = useState<AcademicPeriodItem | null>(null);
    const [activatingPeriod, setActivatingPeriod] = useState<AcademicPeriodItem | null>(null);
    const [closePreviousOnActivate, setClosePreviousOnActivate] = useState(false);
    const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
    const [duplicateSource, setDuplicateSource] = useState<AcademicPeriodItem | null>(null);
    const [deletingPeriod, setDeletingPeriod] = useState<AcademicPeriodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form for Create / Edit
    const { data, setData, post, put, processing, reset, errors } = useForm({
        academic_year: '2026 - 2027',
        semester: '1st Semester',
        start_date: '2026-08-17',
        end_date: '2026-12-18',
        class_start_date: '2026-08-17',
        class_end_date: '2026-12-18',
        midterm_start_date: '2026-10-12',
        midterm_end_date: '2026-10-16',
        final_start_date: '2026-12-07',
        final_end_date: '2026-12-11',
        instructional_weeks: 18,
        status: 'Draft' as 'Draft' | 'Active' | 'Closed' | 'Archived',
        is_current: false,
        notes: '',
        planning_rules_version: 'Default Rules v2',
        planning_parameters: {
            active_weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            earliest_class_time: '07:00',
            latest_class_time: '21:00',
            allow_saturday: false,
            holidays: [] as string[],
            semester_start_reference: 'class_start_date',
            room_availability_ruleset: 'Standard College Matrix (Building A & C)',
            institutional_breaks: 'Mid-term Break (Undas: Nov 1-2), Christmas Break',
        },
        copy_setup: {
            enabled: false,
            source_period_id: currentPeriod ? currentPeriod.id : (periods[0]?.id || null),
            copy_workload_policies: true,
            copy_recognition_rules: true,
            copy_requirement_templates: true,
            copy_schedule_constraints: true,
            copy_room_availability: true,
        },
    });

    // Form for standalone Duplicate Modal
    const duplicateForm = useForm({
        source_id: currentPeriod ? currentPeriod.id : (periods[0]?.id || 1),
        target_academic_year: '2026 - 2027',
        target_semester: '2nd Semester',
        copy_requirement_types: true,
        copy_program_structures: true,
        copy_recognition_rules: true,
        copy_default_schedule_constraints: true,
        copy_room_availability: true,
    });

    const handleOpenCreate = () => {
        setEditingPeriod(null);
        reset();
        setData({
            academic_year: '2026 - 2027',
            semester: '1st Semester',
            start_date: '2026-08-17',
            end_date: '2026-12-18',
            class_start_date: '2026-08-17',
            class_end_date: '2026-12-18',
            midterm_start_date: '2026-10-12',
            midterm_end_date: '2026-10-16',
            final_start_date: '2026-12-07',
            final_end_date: '2026-12-11',
            instructional_weeks: 18,
            status: 'Draft',
            is_current: false,
            notes: '',
            planning_rules_version: 'Default Rules v2',
            planning_parameters: {
                active_weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                earliest_class_time: '07:00',
                latest_class_time: '21:00',
                allow_saturday: false,
                holidays: [],
                semester_start_reference: 'class_start_date',
                room_availability_ruleset: 'Standard College Matrix (Building A & C)',
                institutional_breaks: 'Mid-term Break (Undas: Nov 1-2), Christmas Break',
            },
            copy_setup: {
                enabled: false,
                source_period_id: currentPeriod ? currentPeriod.id : (periods[0]?.id || null),
                copy_workload_policies: true,
                copy_recognition_rules: true,
                copy_requirement_templates: true,
                copy_schedule_constraints: true,
                copy_room_availability: true,
            },
        });
        setIsCreateDrawerOpen(true);
    };

    const handleOpenEdit = (period: AcademicPeriodItem) => {
        setEditingPeriod(period);
        setData({
            academic_year: period.academic_year,
            semester: period.semester,
            start_date: period.start_date ? period.start_date.substring(0, 10) : '',
            end_date: period.end_date ? period.end_date.substring(0, 10) : '',
            class_start_date: period.class_start_date ? period.class_start_date.substring(0, 10) : '',
            class_end_date: period.class_end_date ? period.class_end_date.substring(0, 10) : '',
            midterm_start_date: period.midterm_start_date ? period.midterm_start_date.substring(0, 10) : '',
            midterm_end_date: period.midterm_end_date ? period.midterm_end_date.substring(0, 10) : '',
            final_start_date: period.final_start_date ? period.final_start_date.substring(0, 10) : '',
            final_end_date: period.final_end_date ? period.final_end_date.substring(0, 10) : '',
            instructional_weeks: (period.planning_parameters as any)?.instructional_weeks || 18,
            status: period.status,
            is_current: period.is_current,
            notes: period.notes || '',
            planning_rules_version: period.planning_rules_version || 'Default Rules v2',
            planning_parameters: {
                active_weekdays: period.planning_parameters?.active_weekdays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                earliest_class_time: period.planning_parameters?.earliest_class_time || '07:00',
                latest_class_time: period.planning_parameters?.latest_class_time || '21:00',
                allow_saturday: period.planning_parameters?.allow_saturday || false,
                holidays: period.planning_parameters?.holidays || [],
                semester_start_reference: period.planning_parameters?.semester_start_reference || 'class_start_date',
                room_availability_ruleset: period.planning_parameters?.room_availability_ruleset || 'Standard College Matrix (Building A & C)',
                institutional_breaks: (period.planning_parameters as any)?.institutional_breaks || 'Mid-term Break, Christmas Break',
            },
            copy_setup: {
                enabled: false,
                source_period_id: null,
                copy_workload_policies: true,
                copy_recognition_rules: true,
                copy_requirement_templates: true,
                copy_schedule_constraints: true,
                copy_room_availability: true,
            },
        });
        setIsCreateDrawerOpen(true);
    };

    // Save as Draft
    const handleSaveAsDraft = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            status: 'Draft',
            is_current: false,
        };

        if (editingPeriod) {
            router.put(`/administration/academic-periods/${editingPeriod.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDrawerOpen(false);
                    setEditingPeriod(null);
                    reset();
                },
            });
        } else {
            router.post('/administration/academic-periods', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDrawerOpen(false);
                    reset();
                },
            });
        }
    };

    // Create & Activate (prompts confirmation to enforce single-current-period rule)
    const handleCreateAndActivate = (e: React.FormEvent) => {
        e.preventDefault();
        // Set up temporary activation object to trigger confirmation modal
        const simulatedPeriod: AcademicPeriodItem = {
            id: editingPeriod ? editingPeriod.id : 0,
            academic_year: data.academic_year,
            semester: data.semester,
            start_date: data.start_date,
            end_date: data.end_date,
            class_start_date: data.class_start_date,
            class_end_date: data.class_end_date,
            status: 'Active',
            is_current: true,
        };
        setActivatingPeriod(simulatedPeriod);
    };

    const confirmActivationAndSubmit = () => {
        if (!activatingPeriod) return;

        // If it's a new period being created and activated
        if (activatingPeriod.id === 0) {
            const payload = {
                ...data,
                status: 'Active',
                is_current: true,
            };
            router.post('/administration/academic-periods', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setActivatingPeriod(null);
                    setIsCreateDrawerOpen(false);
                    reset();
                },
            });
        } else {
            // Existing period activation
            router.post(`/administration/academic-periods/${activatingPeriod.id}/activate`, {
                close_previous: closePreviousOnActivate,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setActivatingPeriod(null);
                    setIsCreateDrawerOpen(false);
                    setEditingPeriod(null);
                },
            });
        }
    };

    const handleClose = (period: AcademicPeriodItem) => {
        if (confirm(`Close ${period.academic_year} ${period.semester}? Historical records will remain intact, and ordinary editing will be locked.`)) {
            router.post(`/administration/academic-periods/${period.id}/close`, {}, { preserveScroll: true });
        }
    };

    const handleArchive = (period: AcademicPeriodItem) => {
        if (confirm(`Archive ${period.academic_year} ${period.semester}? It will be stored as a historical reference.`)) {
            router.post(`/administration/academic-periods/${period.id}/archive`, {}, { preserveScroll: true });
        }
    };

    const handleDuplicateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const srcId = duplicateSource?.id || duplicateForm.data.source_id;
        router.post(`/administration/academic-periods/${srcId}/duplicate`, {
            target_academic_year: duplicateForm.data.target_academic_year,
            target_semester: duplicateForm.data.target_semester,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDuplicateOpen(false);
                setDuplicateSource(null);
            },
        });
    };

    // Format friendly date string (e.g. "Aug 17, 2026")
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '–';
        try {
            // Strip any timestamp portion if present to prevent UTC offset shifts or invalid formats
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const parts = cleanDateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const d = new Date(cleanDateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Format status badges matching screenshot
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f8f0] text-[#10b981]">
                        Active
                    </span>
                );
            case 'Draft':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        Draft
                    </span>
                );
            case 'Closed':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#3b82f6]">
                        Closed
                    </span>
                );
            case 'Archived':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#f5f3ff] text-[#8b5cf6]">
                        Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    // Metric counts
    const counts = useMemo(() => {
        return {
            all: periods.length,
            active: periods.filter((p) => p.status === 'Active').length,
            draft: periods.filter((p) => p.status === 'Draft').length,
            closed: periods.filter((p) => p.status === 'Closed').length,
            archived: periods.filter((p) => p.status === 'Archived').length,
        };
    }, [periods]);

    // Filtered & Sorted periods
    const filteredPeriods = useMemo(() => {
        return periods
            .filter((p) => {
                if (activeTab !== 'all') {
                    if (p.status.toLowerCase() !== activeTab.toLowerCase()) return false;
                }

                if (statusFilter !== 'all') {
                    if (p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
                }

                if (yearFilter !== 'all') {
                    if (p.academic_year !== yearFilter) return false;
                }

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const mYear = p.academic_year.toLowerCase().includes(q);
                    const mSem = p.semester.toLowerCase().includes(q);
                    const mNotes = p.notes?.toLowerCase().includes(q);
                    if (!mYear && !mSem && !mNotes) return false;
                }

                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.start_date).getTime();
                const dateB = new Date(b.start_date).getTime();
                return sortDirection === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [periods, activeTab, statusFilter, yearFilter, searchQuery, sortDirection]);

    // Pagination
    const totalItems = filteredPeriods.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedPeriods = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPeriods.slice(start, start + pageSize);
    }, [filteredPeriods, currentPage, pageSize]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Periods" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full min-h-screen">
                {/* 1. TOP HEADER BAR: Icon + Title + Create Academic Period Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                            <CalendarDays className="w-6 h-6 text-slate-950 stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <span>Administration</span>
                                <span>&gt;</span>
                                <span className="text-slate-700 font-semibold">Academic Periods</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                                Academic Periods
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage academic years and semesters for all dependent modules.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenCreate}
                        className="h-10 px-4 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Create Academic Period</span>
                    </Button>
                </div>

                {/* 2. FOUR KPI CARDS (Matching user mockup perfectly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Periods */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-700 block">Total Periods</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight block">
                                {counts.all}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">All academic years</span>
                        </div>
                    </div>

                    {/* Card 2: Active Period */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                            <Play className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-700 block">Active Period</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight block">
                                {counts.active}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Currently in use</span>
                        </div>
                    </div>

                    {/* Card 3: Closed Periods */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-700 block">Closed Periods</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight block">
                                {counts.closed}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Completed semesters</span>
                        </div>
                    </div>

                    {/* Card 4: Archived Periods */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                            <Archive className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-700 block">Archived Periods</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight block">
                                {counts.archived}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Historical records</span>
                        </div>
                    </div>
                </div>

                {/* 3. TABS BAR (All Periods, Active, Draft, Closed, Archived) */}
                <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto text-xs font-semibold text-slate-500">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                        className={cn(
                            'pb-3 pt-1 border-b-2 transition-all cursor-pointer whitespace-nowrap',
                            activeTab === 'all'
                                ? 'border-[#f59e0b] text-slate-950 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        )}
                    >
                        All Periods ({counts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Active'); setCurrentPage(1); }}
                        className={cn(
                            'pb-3 pt-1 border-b-2 transition-all cursor-pointer whitespace-nowrap',
                            activeTab === 'Active'
                                ? 'border-[#f59e0b] text-slate-950 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        )}
                    >
                        Active ({counts.active})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Draft'); setCurrentPage(1); }}
                        className={cn(
                            'pb-3 pt-1 border-b-2 transition-all cursor-pointer whitespace-nowrap',
                            activeTab === 'Draft'
                                ? 'border-[#f59e0b] text-slate-950 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        )}
                    >
                        Draft ({counts.draft})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Closed'); setCurrentPage(1); }}
                        className={cn(
                            'pb-3 pt-1 border-b-2 transition-all cursor-pointer whitespace-nowrap',
                            activeTab === 'Closed'
                                ? 'border-[#f59e0b] text-slate-950 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        )}
                    >
                        Closed ({counts.closed})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Archived'); setCurrentPage(1); }}
                        className={cn(
                            'pb-3 pt-1 border-b-2 transition-all cursor-pointer whitespace-nowrap',
                            activeTab === 'Archived'
                                ? 'border-[#f59e0b] text-slate-950 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        )}
                    >
                        Archived ({counts.archived})
                    </button>
                </div>

                {/* 4. FILTER BAR: Search, All Statuses, All Academic Years, Sort */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search academic periods..."
                                className="pl-9 h-10 text-xs rounded-xl border-slate-200/90 bg-white placeholder:text-slate-400 shadow-xs focus-visible:ring-[#f59e0b]"
                            />
                        </div>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-3 text-xs rounded-xl border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 shadow-xs font-normal"
                                >
                                    <span>{statusFilter === 'all' ? 'All Statuses' : statusFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 rounded-xl">
                                {['all', 'Active', 'Draft', 'Closed', 'Archived'].map((st) => (
                                    <DropdownMenuItem
                                        key={st}
                                        onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                                        className={cn("text-xs cursor-pointer", statusFilter === st && "font-bold text-amber-600")}
                                    >
                                        {st === 'all' ? 'All Statuses' : st}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Year Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-3 text-xs rounded-xl border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 shadow-xs font-normal"
                                >
                                    <span>{yearFilter === 'all' ? 'All Academic Years' : yearFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl max-h-56 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={() => { setYearFilter('all'); setCurrentPage(1); }}
                                    className={cn("text-xs cursor-pointer", yearFilter === 'all' && "font-bold text-amber-600")}
                                >
                                    All Academic Years
                                </DropdownMenuItem>
                                {['2026 - 2027', '2025 - 2026', '2024 - 2025', ...academicYears.filter(y => !['2026 - 2027', '2025 - 2026', '2024 - 2025'].includes(y))].map((yr) => (
                                    <DropdownMenuItem
                                        key={yr}
                                        onClick={() => { setYearFilter(yr); setCurrentPage(1); }}
                                        className={cn("text-xs cursor-pointer", yearFilter === yr && "font-bold text-amber-600")}
                                    >
                                        {yr}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Sort Button */}
                    <div className="self-end md:self-auto">
                        <Button
                            variant="outline"
                            onClick={() => setSortDirection((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                            className="h-10 px-3 text-xs rounded-xl border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 shadow-xs font-normal cursor-pointer"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            <span>Sort: {sortDirection === 'newest' ? 'Newest' : 'Oldest'}</span>
                        </Button>
                    </div>
                </div>

                {/* 5. DATA TABLE: Academic Periods */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-700 bg-white">
                                    <th className="py-4 px-4 w-10 text-center">#</th>
                                    <th className="py-4 px-4 font-bold text-slate-900">Academic Year</th>
                                    <th className="py-4 px-4">Semester / Term</th>
                                    <th className="py-4 px-4">Start Date</th>
                                    <th className="py-4 px-4">End Date</th>
                                    <th className="py-4 px-4">Status</th>
                                    <th className="py-4 px-4 text-center">Current</th>
                                    <th className="py-4 px-4">Planning Rules</th>
                                    <th className="py-4 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {paginatedPeriods.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-14 text-center text-slate-400 italic">
                                            <CalendarDays className="w-9 h-9 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                                            <div className="font-semibold text-slate-700 text-sm">No academic periods found.</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Try adjusting search or status filters.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPeriods.map((period, idx) => {
                                        const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                                        return (
                                            <tr key={period.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Index # */}
                                                <td className="py-4 px-4 text-center text-slate-400 font-medium">
                                                    {rowNumber}
                                                </td>

                                                {/* Academic Year */}
                                                <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                                                    {period.academic_year}
                                                </td>

                                                {/* Semester / Term */}
                                                <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                                                    {period.semester}
                                                </td>

                                                {/* Start Date */}
                                                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                                                    {formatDate(period.start_date)}
                                                </td>

                                                {/* End Date */}
                                                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                                                    {formatDate(period.end_date)}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {renderStatusBadge(period.status)}
                                                </td>

                                                {/* Current Star Badge */}
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    {period.is_current ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fffbeb] text-amber-900 border border-amber-300 shadow-2xs">
                                                            <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">–</span>
                                                    )}
                                                </td>

                                                {/* Planning Rules */}
                                                <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                                                    {period.planning_rules_version || 'Default Rules v2'}
                                                </td>

                                                {/* Action 3-dots Menu */}
                                                <td className="py-4 px-4 text-right whitespace-nowrap">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                                            {/* 1. View Details */}
                                                            <DropdownMenuItem
                                                                onClick={() => setViewingPeriod(period)}
                                                                className="text-xs cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>View Details</span>
                                                            </DropdownMenuItem>

                                                            {/* 2. Edit */}
                                                            <DropdownMenuItem
                                                                onClick={() => handleOpenEdit(period)}
                                                                className="text-xs cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Edit className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>

                                                            {/* 3. Copy Setup */}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setDuplicateSource(period);
                                                                    duplicateForm.setData({
                                                                        ...duplicateForm.data,
                                                                        source_id: period.id,
                                                                    });
                                                                    setIsDuplicateOpen(true);
                                                                }}
                                                                className="text-xs cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Copy className="w-3.5 h-3.5 text-amber-500" />
                                                                <span>Copy Setup</span>
                                                            </DropdownMenuItem>

                                                            {/* 4. Set as Current / Activate */}
                                                            {!period.is_current && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setActivatingPeriod(period)}
                                                                    className="text-xs cursor-pointer flex items-center gap-2 text-emerald-600 focus:text-emerald-700"
                                                                >
                                                                    <Power className="w-3.5 h-3.5 text-emerald-600" />
                                                                    <span>Set as Current</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {/* 5. Close Period */}
                                                            {period.status !== 'Closed' && period.status !== 'Archived' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleClose(period)}
                                                                    className="text-xs cursor-pointer flex items-center gap-2 text-blue-600 focus:text-blue-700"
                                                                >
                                                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>Close Period</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {/* 6. Archive */}
                                                            {period.status !== 'Archived' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleArchive(period)}
                                                                    className="text-xs cursor-pointer flex items-center gap-2 text-purple-600 focus:text-purple-700"
                                                                >
                                                                    <Archive className="w-3.5 h-3.5 text-purple-600" />
                                                                    <span>Archive Period</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {/* Delete option if not current */}
                                                            {!period.is_current && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeletingPeriod(period)}
                                                                    className="text-xs cursor-pointer flex items-center gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Delete</span>
                                                                </DropdownMenuItem>
                                                            )}
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
                </div>

                {/* 6. PAGINATION FOOTER */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1 pb-6">
                    <div>
                        Showing{' '}
                        <span className="font-semibold text-slate-800">
                            {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold text-slate-800">
                            {Math.min(currentPage * pageSize, totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-800">
                            {totalItems}
                        </span>{' '}
                        academic periods
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-8 w-8 p-0 rounded-lg border-slate-200 bg-white"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "h-8 w-8 p-0 rounded-lg text-xs font-semibold border-slate-200",
                                    currentPage === page
                                        ? "bg-[#f59e0b] text-slate-950 border-[#f59e0b] font-bold hover:bg-[#d97706]"
                                        : "text-slate-600 hover:bg-slate-50 bg-white"
                                )}
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-8 w-8 p-0 rounded-lg border-slate-200 bg-white"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </Button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 7. SLIDE-OVER DRAWER: CREATE / EDIT ACADEMIC PERIOD FORM                   */}
                {/* Contains the requested 4 collapsible sections + sticky footer             */}
                {/* ========================================================================= */}
                {isCreateDrawerOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                            onClick={() => setIsCreateDrawerOpen(false)}
                        />

                        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
                                {/* Drawer Header */}
                                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                            <CalendarDays className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">
                                                {editingPeriod ? 'Edit Academic Period' : 'Create Academic Period'}
                                            </h2>
                                            <p className="text-[11px] text-slate-400">
                                                Configure academic semester parameters, examination milestones, and planning rules.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateDrawerOpen(false)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Drawer Body with 4 Collapsible Sections */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                                    {/* SECTION 1: Basic Information */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('basic')}
                                            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-amber-500" />
                                                <span>1. Basic Information</span>
                                            </div>
                                            {openSections.basic ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </button>

                                        {openSections.basic && (
                                            <div className="p-5 space-y-4 text-xs">
                                                {/* Academic Year & Semester */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Academic Year *</Label>
                                                        <Input
                                                            value={data.academic_year}
                                                            onChange={(e) => setData('academic_year', e.target.value)}
                                                            placeholder="2026 - 2027"
                                                            className="h-9.5 text-xs rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Semester / Term *</Label>
                                                        <select
                                                            value={data.semester}
                                                            onChange={(e) => setData('semester', e.target.value)}
                                                            className="w-full h-9.5 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                                                            required
                                                        >
                                                            <option value="1st Semester">1st Semester</option>
                                                            <option value="2nd Semester">2nd Semester</option>
                                                            <option value="Summer Term">Summer Term</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Start Date & End Date */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Start Date *</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.start_date}
                                                            onChange={(e) => setData('start_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">End Date *</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.end_date}
                                                            onChange={(e) => setData('end_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Class Start Date & Class End Date */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Class Start Date *</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.class_start_date}
                                                            onChange={(e) => setData('class_start_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Class End Date *</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.class_end_date}
                                                            onChange={(e) => setData('class_end_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Initial Status & Set as Current */}
                                                <div className="grid grid-cols-2 gap-3.5 items-center pt-1">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Initial Status *</Label>
                                                        <select
                                                            value={data.status}
                                                            onChange={(e) => setData('status', e.target.value as any)}
                                                            className="w-full h-9.5 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                                                        >
                                                            <option value="Draft">Draft (Recommended for upcoming)</option>
                                                            <option value="Active">Active (Current semester)</option>
                                                            <option value="Closed">Closed</option>
                                                            <option value="Archived">Archived</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1 pt-4">
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <Checkbox
                                                                checked={data.is_current}
                                                                onCheckedChange={(checked) => setData('is_current', Boolean(checked))}
                                                                className="rounded border-slate-300 data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b] data-[state=checked]:text-slate-950"
                                                            />
                                                            <span className="text-xs font-semibold text-slate-800">Set as Current Period</span>
                                                        </label>
                                                        <span className="text-[10px] text-slate-400 block">Only one period can be current.</span>
                                                    </div>
                                                </div>

                                                {/* Notes / Description */}
                                                <div className="space-y-1 pt-1">
                                                    <Label className="text-[11px] font-bold text-slate-700">Notes / Scope (Optional)</Label>
                                                    <Textarea
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="e.g., Regular semester for AY 2026–2027"
                                                        className="text-xs rounded-xl min-h-[60px]"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION 2: Academic Milestones */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('milestones')}
                                            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4 text-amber-500" />
                                                <span>2. Academic Milestones (Optional)</span>
                                            </div>
                                            {openSections.milestones ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </button>

                                        {openSections.milestones && (
                                            <div className="p-5 space-y-4 text-xs">
                                                {/* Midterm Period */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Midterm Start</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.midterm_start_date || ''}
                                                            onChange={(e) => setData('midterm_start_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Midterm End</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.midterm_end_date || ''}
                                                            onChange={(e) => setData('midterm_end_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Final Examination Period */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Final Start</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.final_start_date || ''}
                                                            onChange={(e) => setData('final_start_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Final End</Label>
                                                        <Input
                                                            type="date"
                                                            value={data.final_end_date || ''}
                                                            onChange={(e) => setData('final_end_date', e.target.value)}
                                                            className="h-9.5 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Instructional Weeks */}
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] font-bold text-slate-700">Instructional Weeks</Label>
                                                    <Input
                                                        type="number"
                                                        value={data.instructional_weeks || 18}
                                                        onChange={(e) => setData('instructional_weeks', Number(e.target.value))}
                                                        className="h-9.5 text-xs rounded-xl max-w-[200px]"
                                                        placeholder="18"
                                                    />
                                                    <span className="text-[10px] text-slate-400 block">Default standard for collegiate semester is 18 weeks.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION 3: Schedule Planning Parameters */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('planning')}
                                            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                                                <span>3. Schedule Planning Parameters</span>
                                            </div>
                                            {openSections.planning ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </button>

                                        {openSections.planning && (
                                            <div className="p-5 space-y-4 text-xs">
                                                {/* Active Weekdays */}
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-700">Active Weekdays *</Label>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                                            const checked = data.planning_parameters.active_weekdays?.includes(day);
                                                            return (
                                                                <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={checked}
                                                                        onCheckedChange={(c) => {
                                                                            const prev = data.planning_parameters.active_weekdays || [];
                                                                            const next = c ? [...prev, day] : prev.filter((d) => d !== day);
                                                                            setData('planning_parameters', {
                                                                                ...data.planning_parameters,
                                                                                active_weekdays: next,
                                                                            });
                                                                        }}
                                                                        className="rounded border-slate-300 data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b] data-[state=checked]:text-slate-950"
                                                                    />
                                                                    <span>{day}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Earliest & Latest Class Times */}
                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Earliest Class Time *</Label>
                                                        <Input
                                                            type="time"
                                                            value={data.planning_parameters.earliest_class_time || '07:00'}
                                                            onChange={(e) => {
                                                                setData('planning_parameters', {
                                                                    ...data.planning_parameters,
                                                                    earliest_class_time: e.target.value,
                                                                });
                                                            }}
                                                            className="h-9 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-bold text-slate-700">Latest Class Time *</Label>
                                                        <Input
                                                            type="time"
                                                            value={data.planning_parameters.latest_class_time || '21:00'}
                                                            onChange={(e) => {
                                                                setData('planning_parameters', {
                                                                    ...data.planning_parameters,
                                                                    latest_class_time: e.target.value,
                                                                });
                                                            }}
                                                            className="h-9 text-xs rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Saturday Classes Toggle */}
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-800 block">Saturday Classes</span>
                                                        <span className="text-[10px] text-slate-400 block">Enable class timetable scheduling on Saturdays</span>
                                                    </div>
                                                    <Checkbox
                                                        checked={data.planning_parameters.allow_saturday}
                                                        onCheckedChange={(c) => {
                                                            setData('planning_parameters', {
                                                                ...data.planning_parameters,
                                                                allow_saturday: Boolean(c),
                                                            });
                                                        }}
                                                        className="rounded border-slate-300 data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b] data-[state=checked]:text-slate-950"
                                                    />
                                                </div>

                                                {/* Institutional Breaks */}
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] font-bold text-slate-700">Institutional Breaks / Exclusions</Label>
                                                    <Input
                                                        value={data.planning_parameters.institutional_breaks}
                                                        onChange={(e) => {
                                                            setData('planning_parameters', {
                                                                ...data.planning_parameters,
                                                                institutional_breaks: e.target.value,
                                                            });
                                                        }}
                                                        placeholder="Mid-term Break, Undas, Christmas Vacation"
                                                        className="h-9.5 text-xs rounded-xl"
                                                    />
                                                </div>

                                                {/* Applicable Room-Availability Rules */}
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] font-bold text-slate-700">Applicable Room-Availability Rules</Label>
                                                    <select
                                                        value={data.planning_parameters.room_availability_ruleset}
                                                        onChange={(e) => {
                                                            setData('planning_parameters', {
                                                                ...data.planning_parameters,
                                                                room_availability_ruleset: e.target.value,
                                                            });
                                                        }}
                                                        className="w-full h-9.5 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                                                    >
                                                        <option value="Standard College Matrix (Building A & C)">Standard College Matrix (Building A & C)</option>
                                                        <option value="Restricted Laboratory Priority Matrix">Restricted Laboratory Priority Matrix</option>
                                                        <option value="Full Campus Open Availability">Full Campus Open Availability</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION 4: Copy Previous Setup */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('copySetup')}
                                            className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Copy className="w-4 h-4 text-amber-500" />
                                                <span>4. Copy Previous Setup (Optional)</span>
                                            </div>
                                            {openSections.copySetup ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </button>

                                        {openSections.copySetup && (
                                            <div className="p-5 space-y-4 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-800 block">Copy configurations from previous period</span>
                                                        <span className="text-[10px] text-slate-400 block">Draft templates and rules will be cloned without copying submissions or records</span>
                                                    </div>
                                                    <Checkbox
                                                        checked={data.copy_setup.enabled}
                                                        onCheckedChange={(c) => {
                                                            setData('copy_setup', {
                                                                ...data.copy_setup,
                                                                enabled: Boolean(c),
                                                            });
                                                        }}
                                                        className="rounded border-slate-300 data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b] data-[state=checked]:text-slate-950"
                                                    />
                                                </div>

                                                {data.copy_setup.enabled && (
                                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                                        <div className="space-y-1">
                                                            <Label className="text-[11px] font-bold text-slate-700">Source Academic Period *</Label>
                                                            <select
                                                                value={data.copy_setup.source_period_id || ''}
                                                                onChange={(e) => {
                                                                    setData('copy_setup', {
                                                                        ...data.copy_setup,
                                                                        source_period_id: Number(e.target.value),
                                                                    });
                                                                }}
                                                                className="w-full h-9.5 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                                                            >
                                                                {periods.map((p) => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.academic_year} | {p.semester} ({p.status})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2 pt-1">
                                                            <Label className="text-[11px] font-bold text-slate-700">Selectable Configuration Types:</Label>
                                                            <div className="space-y-1.5 text-xs text-slate-700 pl-1">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={data.copy_setup.copy_workload_policies}
                                                                        onCheckedChange={(c) => setData('copy_setup', { ...data.copy_setup, copy_workload_policies: Boolean(c) })}
                                                                    />
                                                                    <span>Faculty Workload Policies</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={data.copy_setup.copy_recognition_rules}
                                                                        onCheckedChange={(c) => setData('copy_setup', { ...data.copy_setup, copy_recognition_rules: Boolean(c) })}
                                                                    />
                                                                    <span>Faculty Recognition Rules</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={data.copy_setup.copy_requirement_templates}
                                                                        onCheckedChange={(c) => setData('copy_setup', { ...data.copy_setup, copy_requirement_templates: Boolean(c) })}
                                                                    />
                                                                    <span>Requirement Templates</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={data.copy_setup.copy_schedule_constraints}
                                                                        onCheckedChange={(c) => setData('copy_setup', { ...data.copy_setup, copy_schedule_constraints: Boolean(c) })}
                                                                    />
                                                                    <span>Default Schedule Constraints &amp; Rules</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sticky Footer with Cancel, Save as Draft, Create & Activate actions */}
                                <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDrawerOpen(false)}
                                        className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </Button>

                                    <div className="flex items-center gap-2.5">
                                        <Button
                                            type="button"
                                            onClick={handleSaveAsDraft}
                                            disabled={processing}
                                            variant="outline"
                                            className="h-10 px-4 text-xs font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
                                        >
                                            Save as Draft
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={handleCreateAndActivate}
                                            disabled={processing}
                                            className="h-10 px-4 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                                        >
                                            Create &amp; Activate
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 8. MODAL: ACTIVATE CONFIRMATION (Enforces single-current-period rule)     */}
                {/* ========================================================================= */}
                <Dialog open={!!activatingPeriod} onOpenChange={(open) => !open && setActivatingPeriod(null)}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                Confirm Academic Period Activation
                            </DialogTitle>
                        </DialogHeader>

                        {activatingPeriod && (
                            <div className="space-y-4 text-xs mt-2">
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                    <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                                        You are about to activate <span className="font-bold text-slate-950">{activatingPeriod.academic_year} — {activatingPeriod.semester}</span> as the central current academic period.
                                    </p>
                                    <p className="text-[11px] text-slate-600 mt-2">
                                        This enforces the single-current-period rule. All dependent modules (Requirements, Submissions, Faculty Load, Compliance, Schedules, TV Displays, Reports) will automatically switch to this new period context.
                                    </p>
                                </div>

                                {currentPeriod && currentPeriod.id !== activatingPeriod.id && (
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-700">Currently Active:</span>
                                            <span className="font-semibold text-slate-900">{currentPeriod.academic_year} — {currentPeriod.semester}</span>
                                        </div>

                                        <label className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80 cursor-pointer">
                                            <Checkbox
                                                checked={closePreviousOnActivate}
                                                onCheckedChange={(c) => setClosePreviousOnActivate(Boolean(c))}
                                                className="mt-0.5"
                                            />
                                            <div>
                                                <span className="font-semibold text-slate-800 block">Formally close previous academic period</span>
                                                <span className="text-[10px] text-slate-400 block">
                                                    If unchecked, the unfinished previous period will remain in its existing state (not automatically forced to Closed).
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                <DialogFooter className="pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActivatingPeriod(null)}
                                        className="text-xs rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmActivationAndSubmit}
                                        className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                                    >
                                        Confirm &amp; Activate
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* 9. MODAL: VIEW DETAILS SUMMARY                                            */}
                {/* ========================================================================= */}
                <Dialog open={!!viewingPeriod} onOpenChange={(open) => !open && setViewingPeriod(null)}>
                    <DialogContent className="sm:max-w-[550px] rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-amber-500" />
                                Academic Period Details
                            </DialogTitle>
                        </DialogHeader>

                        {viewingPeriod && (
                            <div className="space-y-4 text-xs mt-2">
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                                            Academic Period
                                        </span>
                                        <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                            {viewingPeriod.academic_year} — {viewingPeriod.semester}
                                        </h3>
                                        <p className="text-[11px] text-slate-600 mt-1">
                                            {formatDate(viewingPeriod.start_date)} – {formatDate(viewingPeriod.end_date)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {renderStatusBadge(viewingPeriod.status)}
                                        {viewingPeriod.is_current && (
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                                Active Current
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Class Schedule Window</span>
                                        <span className="font-bold text-slate-800 text-xs block mt-0.5">
                                            {formatDate(viewingPeriod.class_start_date)} – {formatDate(viewingPeriod.class_end_date)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Midterm Examination</span>
                                        <span className="font-bold text-slate-800 text-xs block mt-0.5">
                                            {viewingPeriod.midterm_start_date ? `${formatDate(viewingPeriod.midterm_start_date)} – ${formatDate(viewingPeriod.midterm_end_date)}` : 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Final Examination</span>
                                        <span className="font-bold text-slate-800 text-xs block mt-0.5">
                                            {viewingPeriod.final_start_date ? `${formatDate(viewingPeriod.final_start_date)} – ${formatDate(viewingPeriod.final_end_date)}` : 'Not specified'}
                                        </span>
                                    </div>
                                </div>

                                {viewingPeriod.notes && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Notes &amp; Description</span>
                                        <p className="text-slate-700 text-xs mt-1 leading-relaxed">{viewingPeriod.notes}</p>
                                    </div>
                                )}

                                <DialogFooter className="pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const p = viewingPeriod;
                                            setViewingPeriod(null);
                                            handleOpenEdit(p);
                                        }}
                                        className="text-xs rounded-xl"
                                    >
                                        Edit Period
                                    </Button>
                                    <Button
                                        onClick={() => setViewingPeriod(null)}
                                        className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs rounded-xl"
                                    >
                                        Close
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* 10. MODAL: STANDALONE COPY SETUP MODAL                                   */}
                {/* ========================================================================= */}
                <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
                    <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Copy className="w-5 h-5 text-amber-500" />
                                Copy Previous Period Setup
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleDuplicateSubmit} className="space-y-4 text-xs mt-2">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-700">Source Academic Period *</Label>
                                <select
                                    value={duplicateForm.data.source_id}
                                    onChange={(e) => duplicateForm.setData('source_id', Number(e.target.value))}
                                    className="w-full h-9.5 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                                >
                                    {periods.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.academic_year} | {p.semester} ({p.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">Target Academic Year *</Label>
                                    <Input
                                        value={duplicateForm.data.target_academic_year}
                                        onChange={(e) => duplicateForm.setData('target_academic_year', e.target.value)}
                                        className="h-9 text-xs rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">Target Semester *</Label>
                                    <select
                                        value={duplicateForm.data.target_semester}
                                        onChange={(e) => duplicateForm.setData('target_semester', e.target.value)}
                                        className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800"
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer Term">Summer Term</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                                Copies reusable templates, rules, and constraints as a new <strong>Draft</strong>. Submissions, attendance records, and faculty loading are never copied.
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDuplicateOpen(false)}
                                    className="text-xs rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs rounded-xl"
                                >
                                    Duplicate Setup
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* 11. MODAL: DELETE CONFIRMATION                                           */}
                {/* ========================================================================= */}
                <DeleteConfirmDialog
                    open={!!deletingPeriod}
                    onOpenChange={(open) => !open && setDeletingPeriod(null)}
                    title="Delete Academic Period"
                    description="Are you sure you want to delete this academic period? This action cannot be undone and will permanently remove all period parameters."
                    itemName={deletingPeriod ? `${deletingPeriod.academic_year} — ${deletingPeriod.semester}` : undefined}
                    confirmLabel="Delete Period"
                    isDeleting={isDeleting}
                    onConfirm={() => {
                        if (!deletingPeriod) return;
                        setIsDeleting(true);
                        router.delete(`/administration/academic-periods/${deletingPeriod.id}`, {
                            preserveScroll: true,
                            onSuccess: () => setDeletingPeriod(null),
                            onFinish: () => setIsDeleting(false),
                        });
                    }}
                />
            </div>
        </AppLayout>
    );
}
