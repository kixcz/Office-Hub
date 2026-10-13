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
    MoreVertical,
    Clock,
    MapPin,
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Modals
    const [viewingPeriod, setViewingPeriod] = useState<AcademicPeriodItem | null>(null);
    const [editingPeriod, setEditingPeriod] = useState<AcademicPeriodItem | null>(null);
    const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
    const [duplicateSource, setDuplicateSource] = useState<AcademicPeriodItem | null>(null);
    const [deletingPeriod, setDeletingPeriod] = useState<AcademicPeriodItem | null>(null);

    // Form for Create / Edit
    const { data, setData, post, put, processing, reset, errors } = useForm({
        academic_year: '2026 – 2027',
        semester: '2nd Semester',
        start_date: '2027-01-11',
        end_date: '2027-05-27',
        class_start_date: '2027-01-11',
        class_end_date: '2027-05-27',
        midterm_start_date: '2027-03-08',
        midterm_end_date: '2027-03-12',
        final_start_date: '2027-05-24',
        final_end_date: '2027-05-27',
        status: 'Draft',
        is_current: false,
        notes: 'e.g., Regular semester for AY 2026–2027',
        planning_rules_version: 'Default Rules v2',
        planning_parameters: {
            active_weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            earliest_class_time: '07:00',
            latest_class_time: '21:00',
            allow_saturday: false,
            holidays: [] as string[],
            semester_start_reference: 'class_start_date',
            room_availability_ruleset: 'Default Rules v2',
        },
    });

    // Form for Copy Previous Period Setup
    const duplicateForm = useForm({
        source_id: currentPeriod ? currentPeriod.id : (periods[0]?.id || 1),
        target_academic_year: '2026 – 2027',
        target_semester: '2nd Semester',
        copy_requirement_types: true,
        copy_program_structures: true,
        copy_recognition_rules: true,
        copy_default_schedule_constraints: true,
        copy_room_availability: true,
    });

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
            status: period.status,
            is_current: period.is_current,
            notes: period.notes || '',
            planning_rules_version: period.planning_rules_version || 'Default Rules v2',
            planning_parameters: period.planning_parameters || {
                active_weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                earliest_class_time: '07:00',
                latest_class_time: '21:00',
                allow_saturday: false,
                holidays: [],
                semester_start_reference: 'class_start_date',
                room_availability_ruleset: 'Default Rules v2',
            },
        });
    };

    const handleOpenCreate = () => {
        setEditingPeriod(null);
        reset();
        setData({
            academic_year: '2026 – 2027',
            semester: '2nd Semester',
            start_date: '2027-01-11',
            end_date: '2027-05-27',
            class_start_date: '2027-01-11',
            class_end_date: '2027-05-27',
            midterm_start_date: '2027-03-08',
            midterm_end_date: '2027-03-12',
            final_start_date: '2027-05-24',
            final_end_date: '2027-05-27',
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
                room_availability_ruleset: 'Default Rules v2',
            },
        });
    };

    const handleSubmitCreateOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPeriod) {
            put(`/administration/academic-periods/${editingPeriod.id}`, {
                onSuccess: () => {
                    setEditingPeriod(null);
                    reset();
                },
            });
        } else {
            post('/administration/academic-periods', {
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    const handleActivate = (period: AcademicPeriodItem) => {
        if (confirm(`Activate ${period.academic_year} ${period.semester}? Previous active periods will be marked as Closed.`)) {
            router.post(`/administration/academic-periods/${period.id}/activate`, {}, { preserveScroll: true });
        }
    };

    const handleClose = (period: AcademicPeriodItem) => {
        if (confirm(`Close ${period.academic_year} ${period.semester}? Ordinary editing will be locked.`)) {
            router.post(`/administration/academic-periods/${period.id}/close`, {}, { preserveScroll: true });
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
            const d = new Date(dateStr);
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                    </span>
                );
            case 'Draft':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Draft
                    </span>
                );
            case 'Closed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Closed
                    </span>
                );
            case 'Archived':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    // Filtered periods
    const filteredPeriods = useMemo(() => {
        return periods.filter((p) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const mYear = p.academic_year.toLowerCase().includes(q);
                const mSem = p.semester.toLowerCase().includes(q);
                const mNotes = p.notes?.toLowerCase().includes(q);
                if (!mYear && !mSem && !mNotes) return false;
            }

            if (statusFilter !== 'all') {
                if (p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
            }

            if (yearFilter !== 'all') {
                if (p.academic_year !== yearFilter) return false;
            }

            return true;
        });
    }, [periods, searchQuery, statusFilter, yearFilter]);

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

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1700px] mx-auto">
                {/* 1. HERO HEADER: Title + Breadcrumbs */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/60">
                            <CalendarDays className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <span>Administration</span>
                                <span>&gt;</span>
                                <span className="text-slate-600">Academic Periods</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                Academic Periods
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Manage academic years and semesters for all dependent modules such as requirements, compliance, schedules, rankings, reports, and TV displays.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. PROMINENT BANNER: Current Academic Period (AY 2026 – 2027 | 1st Semester) */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            {/* Star Badge */}
                            <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
                                <Star className="w-8 h-8 fill-slate-950 text-slate-950" />
                            </div>

                            <div className="space-y-1">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                                    Current Academic Period
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                                    {currentPeriod?.academic_year || 'AY 2026 – 2027'} <span className="text-slate-400 font-light mx-1">|</span> {currentPeriod?.semester || '1st Semester'}
                                </h2>
                                <p className="text-xs font-semibold text-slate-700">
                                    Aug 17, 2026 – Dec 18, 2026 <span className="text-slate-400 mx-1.5">•</span> 18 weeks
                                </p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    All modules inherit the current active academic period from this central module. Never set semesters in individual modules.
                                </p>
                            </div>
                        </div>

                        {/* Sub-cards inside Current Banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 self-stretch lg:self-auto">
                            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-center">
                                <BookOpen className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                <span className="text-[10px] text-slate-400 block font-medium">Class Start</span>
                                <span className="text-xs font-bold text-slate-900 block mt-0.5">Aug 17, 2026</span>
                            </div>
                            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-center">
                                <CalendarDays className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                <span className="text-[10px] text-slate-400 block font-medium">Class End</span>
                                <span className="text-xs font-bold text-slate-900 block mt-0.5">Dec 18, 2026</span>
                            </div>
                            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-center">
                                <CalendarIcon className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                <span className="text-[10px] text-slate-400 block font-medium">Start Date</span>
                                <span className="text-xs font-bold text-slate-900 block mt-0.5">Aug 17, 2026</span>
                            </div>
                            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-center">
                                <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                <span className="text-[10px] text-slate-400 block font-medium">End Date</span>
                                <span className="text-xs font-bold text-slate-900 block mt-0.5">Dec 18, 2026</span>
                            </div>
                            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-center flex flex-col justify-center">
                                <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                                <span className="text-xs font-bold text-emerald-600 block mt-0.5 flex items-center justify-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. METRIC KPI CARDS (4 cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Academic Periods */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight block">
                                {stats.total_periods}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 block">Total Academic Periods</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all academic years</span>
                        </div>
                    </div>

                    {/* Card 2: Dependent Modules Synced */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                            <Share2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight block">
                                {stats.dependent_modules_synced}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 block">Dependent Modules Synced</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Auto-inherit current period</span>
                        </div>
                    </div>

                    {/* Card 3: Active Status */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-emerald-600 tracking-tight leading-tight block">
                                Active
                            </span>
                            <span className="text-xs font-semibold text-slate-700 block">Current Period Status</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.current_period_name}</span>
                        </div>
                    </div>

                    {/* Card 4: Next Semester Prepared */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight block">
                                {stats.next_semester_prepared}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 block">Next Semester Prepared</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.next_semester_label}</span>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN TWO-COLUMN LAYOUT: Left (Table + Details) & Right (Creation/Duplication Forms) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT SECTION (Span 8 Cols): Periods Table + Status Flow + Dependency Coverage */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* ALL ACADEMIC PERIODS TABLE CARD */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4">
                            {/* Card Header with Copy Setup and Create buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0">
                                        <Layers className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">All Academic Periods</h3>
                                        <p className="text-xs text-slate-400">Manage, view, and configure all academic years and semesters.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDuplicateOpen(true)}
                                        className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Copy Previous Period Setup</span>
                                    </Button>

                                    <Button
                                        onClick={handleOpenCreate}
                                        className="h-9 px-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                        <span>Create Academic Period</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Search and Filters Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                                <div className="sm:col-span-6 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Search academic periods..."
                                        className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-amber-400"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                            >
                                                <span>{statusFilter === 'all' ? 'All Statuses' : statusFilter}</span>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-44 rounded-xl">
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
                                </div>

                                <div className="sm:col-span-3 flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                            >
                                                <span>{yearFilter === 'all' ? 'All Academic Years' : yearFilter}</span>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48 rounded-xl max-h-56 overflow-y-auto">
                                            <DropdownMenuItem
                                                onClick={() => { setYearFilter('all'); setCurrentPage(1); }}
                                                className={cn("text-xs cursor-pointer", yearFilter === 'all' && "font-bold text-amber-600")}
                                            >
                                                All Academic Years
                                            </DropdownMenuItem>
                                            {['2026 – 2027', '2025 – 2026', '2024 – 2025', ...academicYears.filter(y => !['2026 – 2027', '2025 – 2026', '2024 – 2025'].includes(y))].map((yr) => (
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

                                    {(searchQuery || statusFilter !== 'all' || yearFilter !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setStatusFilter('all');
                                                setYearFilter('all');
                                                setCurrentPage(1);
                                            }}
                                            className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800 shrink-0"
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6 pt-1">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-600">
                                            <th className="pb-3 pr-3 font-bold text-slate-700">Academic Year</th>
                                            <th className="pb-3 px-3">Semester</th>
                                            <th className="pb-3 px-3">Start Date</th>
                                            <th className="pb-3 px-3">End Date</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3 text-center">Current</th>
                                            <th className="pb-3 px-3">Planning Rules</th>
                                            <th className="pb-3 pl-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {paginatedPeriods.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                                                    No academic periods match your search/filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPeriods.map((period) => {
                                                return (
                                                    <tr key={period.id} className="hover:bg-slate-50/70 transition-colors group">
                                                        <td className="py-3.5 pr-3 font-bold text-slate-900 whitespace-nowrap">
                                                            {period.academic_year}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                                                            {period.semester}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                                                            {formatDate(period.start_date)}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                                                            {formatDate(period.end_date)}
                                                        </td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {renderStatusBadge(period.status)}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                            {period.is_current ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                                    Current
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 font-mono">–</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                                                            {period.planning_rules_version || 'Default Rules v2'}
                                                        </td>
                                                        <td className="py-3.5 pl-3 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                                    <DropdownMenuItem
                                                                        onClick={() => setViewingPeriod(period)}
                                                                        className="text-xs cursor-pointer flex items-center gap-2"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                                        <span>View Summary</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleOpenEdit(period)}
                                                                        className="text-xs cursor-pointer flex items-center gap-2"
                                                                    >
                                                                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                                                                        <span>Edit Period</span>
                                                                    </DropdownMenuItem>

                                                                    {!period.is_current && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleActivate(period)}
                                                                            className="text-xs cursor-pointer flex items-center gap-2 text-emerald-600 focus:text-emerald-700"
                                                                        >
                                                                            <Power className="w-3.5 h-3.5" />
                                                                            <span>Activate Period</span>
                                                                        </DropdownMenuItem>
                                                                    )}

                                                                    {period.status !== 'Closed' && period.status !== 'Archived' && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleClose(period)}
                                                                            className="text-xs cursor-pointer flex items-center gap-2 text-rose-600 focus:text-rose-700"
                                                                        >
                                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                                            <span>Close Period</span>
                                                                        </DropdownMenuItem>
                                                                    )}

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
                                                                        <span>Duplicate Setup</span>
                                                                    </DropdownMenuItem>

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

                            {/* Pagination Footer */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                <div>
                                    Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} academic periods
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="h-8 w-8 p-0 rounded-lg border-slate-200"
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
                                                    ? "bg-amber-400 text-slate-950 border-amber-400 font-bold hover:bg-amber-500"
                                                    : "text-slate-600 hover:bg-slate-50"
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
                                        className="h-8 w-8 p-0 rounded-lg border-slate-200"
                                    >
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* STATUS FLOW & DEPENDENCY COVERAGE (Sub-grid matching bottom left of screenshot) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card 1: Status Flow */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                <div className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status Flow</h4>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Academic periods follow a defined lifecycle. Only one period can be active at a time.
                                </p>

                                <div className="flex items-center justify-between pt-2">
                                    {/* Draft */}
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                                            Draft
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-1">Initial setup</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">→</span>

                                    {/* Active */}
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                                            Active
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-1">Current period</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">→</span>

                                    {/* Closed */}
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800">
                                            Closed
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-1">Period ended</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">→</span>

                                    {/* Archived */}
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800">
                                            Archived
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-1">Historical record</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Dependency Coverage */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dependency Coverage</h4>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    The current active academic period is used by all dependent modules. When you change the active period, all modules automatically switch context.
                                </p>

                                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold text-slate-700">
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <FileText className="w-3.5 h-3.5 text-amber-500" /> Requirements
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" /> Compliance
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <CalendarIcon className="w-3.5 h-3.5 text-amber-500" /> Schedules
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rankings
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Reports
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <GraduationCap className="w-3.5 h-3.5 text-amber-500" /> Performance
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <Users className="w-3.5 h-3.5 text-amber-500" /> Meetings
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <FolderKanban className="w-3.5 h-3.5 text-amber-500" /> Faculty Load
                                    </div>
                                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50">
                                        <Monitor className="w-3.5 h-3.5 text-amber-500" /> TV Displays
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION (Span 4 Cols): Create New Academic Period Form & Planning Parameters */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 1. CREATE / EDIT FORM CARD */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0">
                                        <Plus className="w-4 h-4 text-amber-500 stroke-[3]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                            {editingPeriod ? 'Edit Academic Period' : 'Create New Academic Period'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">Configure a new academic year and semester.</p>
                                    </div>
                                </div>
                                {editingPeriod && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleOpenCreate}
                                        className="text-xs text-slate-400 hover:text-slate-800"
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleSubmitCreateOrUpdate} className="space-y-4">
                                {/* Academic Year & Semester */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Academic Year *</Label>
                                        <Input
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            placeholder="2026 – 2027"
                                            className="h-9 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Semester / Term *</Label>
                                        <select
                                            value={data.semester}
                                            onChange={(e) => setData('semester', e.target.value)}
                                            className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            required
                                        >
                                            <option value="1st Semester">1st Semester</option>
                                            <option value="2nd Semester">2nd Semester</option>
                                            <option value="Summer Term">Summer Term</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date & End Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">End Date *</Label>
                                        <Input
                                            type="date"
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Class Start Date & Class End Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Class Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={data.class_start_date}
                                            onChange={(e) => setData('class_start_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Class End Date *</Label>
                                        <Input
                                            type="date"
                                            value={data.class_end_date}
                                            onChange={(e) => setData('class_end_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Midterm Period & Final Period */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Midterm Start</Label>
                                        <Input
                                            type="date"
                                            value={data.midterm_start_date || ''}
                                            onChange={(e) => setData('midterm_start_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Final End</Label>
                                        <Input
                                            type="date"
                                            value={data.final_end_date || ''}
                                            onChange={(e) => setData('final_end_date', e.target.value)}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Status & Set as Current Active Period */}
                                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-700">Status *</Label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Active">Active</option>
                                            <option value="Closed">Closed</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1 pt-4">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <Checkbox
                                                checked={data.is_current}
                                                onCheckedChange={(checked) => setData('is_current', Boolean(checked))}
                                                className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs font-semibold text-slate-800">Set as Current Period</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400 block">Only one period can be current.</span>
                                    </div>
                                </div>

                                {/* Notes / Description */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Notes / Description (Optional)</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="e.g., Regular semester for AY 2026–2027"
                                        className="text-xs rounded-xl min-h-[60px]"
                                    />
                                </div>

                                {/* 2. SCHEDULE PLANNING PARAMETERS ACCORDION */}
                                <div className="pt-2 border-t border-slate-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">Schedule Planning Parameters</h4>
                                            <p className="text-[10px] text-slate-400">Define default settings for schedules in this period.</p>
                                        </div>
                                    </div>

                                    {/* Active Weekdays checkboxes */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-slate-700">Active Weekdays *</Label>
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
                                                            className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                                        />
                                                        <span>{day}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Earliest & Latest Class Times */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold text-slate-700">Earliest Class Time *</Label>
                                            <Input
                                                type="time"
                                                value={data.planning_parameters.earliest_class_time || '07:00'}
                                                onChange={(e) => {
                                                    setData('planning_parameters', {
                                                        ...data.planning_parameters,
                                                        earliest_class_time: e.target.value,
                                                    });
                                                }}
                                                className="h-8 text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold text-slate-700">Latest Class Time *</Label>
                                            <Input
                                                type="time"
                                                value={data.planning_parameters.latest_class_time || '21:00'}
                                                onChange={(e) => {
                                                    setData('planning_parameters', {
                                                        ...data.planning_parameters,
                                                        latest_class_time: e.target.value,
                                                    });
                                                }}
                                                className="h-8 text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    {/* Saturday Classes Toggle */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-800 block">Saturday Classes Allowed</span>
                                            <span className="text-[10px] text-slate-400 block">Allow scheduling classes on Saturdays</span>
                                        </div>
                                        <Checkbox
                                            checked={data.planning_parameters.allow_saturday}
                                            onCheckedChange={(c) => {
                                                setData('planning_parameters', {
                                                    ...data.planning_parameters,
                                                    allow_saturday: Boolean(c),
                                                });
                                            }}
                                            className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer mt-2"
                                >
                                    {editingPeriod ? 'Update Academic Period' : 'Save Academic Period'}
                                </Button>
                            </form>
                        </div>

                        {/* 3. COPY PREVIOUS PERIOD SETUP CARD (Matching bottom right of screenshot) */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <Copy className="w-4 h-4 text-amber-500" />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">Copy Previous Period Setup</h4>
                                    <p className="text-[10px] text-slate-400">Quickly copy configurations from a previous academic period.</p>
                                </div>
                            </div>

                            <form onSubmit={handleDuplicateSubmit} className="space-y-3.5">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">Copy From Academic Period *</Label>
                                    <select
                                        value={duplicateForm.data.source_id}
                                        onChange={(e) => duplicateForm.setData('source_id', Number(e.target.value))}
                                        className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    >
                                        {periods.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.academic_year} | {p.semester} ({p.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                                    <label className="flex items-center gap-2">
                                        <Checkbox checked={duplicateForm.data.copy_requirement_types} onCheckedChange={(c) => duplicateForm.setData('copy_requirement_types', Boolean(c))} />
                                        <span>Requirement Types</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <Checkbox checked={duplicateForm.data.copy_program_structures} onCheckedChange={(c) => duplicateForm.setData('copy_program_structures', Boolean(c))} />
                                        <span>Program Structures</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <Checkbox checked={duplicateForm.data.copy_recognition_rules} onCheckedChange={(c) => duplicateForm.setData('copy_recognition_rules', Boolean(c))} />
                                        <span>Recognition Rules</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <Checkbox checked={duplicateForm.data.copy_default_schedule_constraints} onCheckedChange={(c) => duplicateForm.setData('copy_default_schedule_constraints', Boolean(c))} />
                                        <span>Default Schedule Constraints</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <Checkbox checked={duplicateForm.data.copy_room_availability} onCheckedChange={(c) => duplicateForm.setData('copy_room_availability', Boolean(c))} />
                                        <span>Room Availability</span>
                                    </label>
                                </div>

                                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[10px] text-blue-800 leading-relaxed">
                                    Submissions, student records, and performance results are NOT copied. Only reusable configuration templates are duplicated.
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="h-9 text-xs rounded-xl font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Duplicate Setup
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const p = periods.find((x) => x.id === duplicateForm.data.source_id);
                                            if (p) handleActivate(p);
                                        }}
                                        className="h-9 text-xs rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-xs cursor-pointer"
                                    >
                                        Activate Period
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* MODAL: VIEW SUMMARY */}
                <Dialog open={!!viewingPeriod} onOpenChange={(open) => !open && setViewingPeriod(null)}>
                    <DialogContent className="sm:max-w-[550px] rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-amber-500" />
                                Academic Period Summary
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
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Notes & Description</span>
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
                                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                                    >
                                        Close
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL: DELETE CONFIRMATION */}
                <Dialog open={!!deletingPeriod} onOpenChange={(open) => !open && setDeletingPeriod(null)}>
                    <DialogContent className="sm:max-w-md rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-rose-600" />
                                Delete Academic Period
                            </DialogTitle>
                        </DialogHeader>
                        {deletingPeriod && (
                            <div className="space-y-3 text-xs mt-2">
                                <p className="text-slate-600">
                                    Are you sure you want to delete{' '}
                                    <span className="font-bold text-slate-900">
                                        {deletingPeriod.academic_year} — {deletingPeriod.semester}
                                    </span>
                                    ? This action cannot be undone.
                                </p>
                                <DialogFooter className="pt-2 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeletingPeriod(null)}
                                        className="text-xs rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            router.delete(`/administration/academic-periods/${deletingPeriod.id}`, {
                                                onSuccess: () => setDeletingPeriod(null),
                                            });
                                        }}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                                    >
                                        Confirm Delete
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
