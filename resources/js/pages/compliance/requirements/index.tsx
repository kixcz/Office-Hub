import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
    Folder,
    FolderPlus,
    LayoutGrid,
    List,
    Search,
    Clock,
    AlertCircle,
    Calendar,
    Users,
    ChevronDown,
    FileText,
    TrendingUp,
    CheckCircle2,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    SlidersHorizontal,
    Sparkles,
    Download,
    Eye,
    MoreHorizontal,
    X,
    Filter,
    ShieldAlert,
    ExternalLink,
    Building2,
    CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Faculty Operations', href: '/compliance/requirements' },
    { title: 'Compliance', href: '/compliance/requirements' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface FacultyMember {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
    program?: { code: string; name: string };
}

interface MatrixCell {
    requirement_id: number;
    requirement_title: string;
    status: string;
    label: string;
    color: 'green' | 'amber' | 'red' | 'gray' | 'muted';
    submission_date?: string | null;
    days_info?: string | null;
}

interface MatrixRow {
    index: number;
    faculty_id: number;
    faculty_name: string;
    faculty_email: string;
    program_code: string;
    program_name?: string;
    avatar_url?: string | null;
    cells: Record<number, MatrixCell>;
}

interface MatrixColumn {
    id: number;
    title: string;
    short_title: string;
    category: string;
    due_date: string;
    raw_due_date?: string;
}

interface FolderCard {
    id: number;
    title: string;
    description?: string;
    category: string;
    document_type: string;
    due_date: string;
    status: string;
    health_indicator: 'On Track' | 'Needs Attention' | 'Critical';
    assigned_count: number;
    on_time_count: number;
    late_count: number;
    pending_count: number;
    overdue_count: number;
    compliance_rate: number;
}

interface AttentionAlert {
    id: number;
    type: string;
    title: string;
    message: string;
    requirement_id?: number | null;
    level: 'critical' | 'warning' | 'info';
}

interface Props {
    requirements: any[];
    enhancedFolders: FolderCard[];
    programs: Program[];
    faculties: FacultyMember[];
    filters: {
        period: string;
        program: string;
        faculty: string;
        category: string;
    };
    kpiCards: {
        active_folders: number;
        active_folders_trend: string;
        expected_faculty: number;
        expected_faculty_trend: string;
        submitted_on_time: number;
        submitted_on_time_trend: string;
        submitted_late: number;
        submitted_late_trend: string;
        pending: number;
        pending_trend: string;
        overdue: number;
        overdue_trend: string;
        overall_rate: number;
        overall_rate_trend: string;
        avg_days_late: number;
        avg_days_late_trend: string;
    };
    matrix: {
        columns: MatrixColumn[];
        rows: MatrixRow[];
    };
    charts: {
        requirement_rates: { id: number; name: string; short_name: string; rate: number }[];
        status_distribution: {
            total: number;
            on_time: { count: number; percentage: number };
            late: { count: number; percentage: number };
            pending: { count: number; percentage: number };
            overdue: { count: number; percentage: number };
            not_required: { count: number; percentage: number };
        };
        late_trend: { month: string; count: number }[];
        program_comparison: { code: string; rate: number }[];
    };
    attentionAlerts: AttentionAlert[];
}

export default function ComplianceManagementIndex({
    enhancedFolders = [],
    programs = [],
    faculties = [],
    filters: initialFilters,
    kpiCards,
    matrix,
    charts,
    attentionAlerts = [],
}: Props) {
    // Main Tab Toggle: Overview vs Requirements
    const [mainTab, setMainTab] = useState<'overview' | 'requirements'>('overview');

    // Filter bar state
    const [academicPeriod, setAcademicPeriod] = useState(initialFilters?.period || 'AY 2026–2027 • 1st Semester');
    const [selectedProgram, setSelectedProgram] = useState(initialFilters?.program || 'all');
    const [selectedFaculty, setSelectedFaculty] = useState(initialFilters?.faculty || 'all');
    const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || 'all');
    const [dateRange, setDateRange] = useState('Aug 1, 2026 - Oct 31, 2026');

    // Matrix search & view toggle
    const [matrixSearch, setMatrixSearch] = useState('');
    const [matrixView, setMatrixView] = useState<'matrix' | 'list'>('matrix');

    // Requirements Tab: Search, Status filter, Category filter, Grid vs List
    const [folderSearch, setFolderSearch] = useState('');
    const [folderCategory, setFolderCategory] = useState('all');
    const [folderStatus, setFolderStatus] = useState('all');
    const [folderView, setFolderView] = useState<'grid' | 'list'>('grid');

    // Create Folder Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        category: 'Teaching and Learning Requirements',
        document_type: 'TOS/TQ',
        academic_year: 'AY 2026–2027',
        semester: '1st Semester',
        due_date: '2026-08-30T23:59',
        open_date: '2026-08-01T08:00',
        grace_period_days: 0,
        required_file_types: 'pdf,docx',
        allow_multiple_files: false,
        naming_convention: '',
        late_policy: 'allowed_with_flag',
        status: 'Open',
        program_id: 'all',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/compliance/requirements', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    // Filter matrix rows based on search
    const filteredMatrixRows = useMemo(() => {
        if (!matrixSearch.trim()) return matrix?.rows || [];
        const q = matrixSearch.toLowerCase();
        return (matrix?.rows || []).filter(
            (row) =>
                row.faculty_name.toLowerCase().includes(q) ||
                row.program_code.toLowerCase().includes(q) ||
                row.faculty_email.toLowerCase().includes(q)
        );
    }, [matrix?.rows, matrixSearch]);

    // Filter folder cards for Requirements tab
    const filteredFolders = useMemo(() => {
        return (enhancedFolders || []).filter((f) => {
            const matchesSearch =
                !folderSearch.trim() ||
                f.title.toLowerCase().includes(folderSearch.toLowerCase()) ||
                (f.description && f.description.toLowerCase().includes(folderSearch.toLowerCase())) ||
                f.category.toLowerCase().includes(folderSearch.toLowerCase());

            const matchesCategory = folderCategory === 'all' || f.category === folderCategory;
            const matchesStatus = folderStatus === 'all' || f.status === folderStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [enhancedFolders, folderSearch, folderCategory, folderStatus]);

    const applyFilters = () => {
        router.get(
            '/compliance/requirements',
            {
                period: academicPeriod,
                program: selectedProgram,
                faculty: selectedFaculty,
                category: selectedCategory,
            },
            { preserveState: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compliance Management - OfficeHub" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] dark:bg-zinc-950 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                            <Folder className="w-6 h-6 fill-amber-500 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                Compliance Management
                            </h1>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Monitor and manage faculty requirement submissions
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons Top Right */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                            Create Requirement Folder
                        </Button>
                        <Button
                            variant="outline"
                            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-xs md:text-sm px-3.5 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 shadow-xs"
                            onClick={() => window.print()}
                        >
                            <FileText className="w-4 h-4 mr-1.5 text-zinc-500" />
                            Generate Report
                        </Button>
                        <Button
                            variant="outline"
                            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-xs md:text-sm px-3.5 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 shadow-xs"
                            onClick={() => alert('Exporting compliance tracker matrix to CSV...')}
                        >
                            <Download className="w-4 h-4 mr-1.5 text-zinc-500" />
                            Export Matrix
                        </Button>
                    </div>
                </div>

                {/* Sub-navigation Tabs: Overview vs Requirements */}
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                    <button
                        onClick={() => setMainTab('overview')}
                        className={cn(
                            'px-5 py-2 text-sm font-bold rounded-xl transition-all',
                            mainTab === 'overview'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        )}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setMainTab('requirements')}
                        className={cn(
                            'px-5 py-2 text-sm font-bold rounded-xl transition-all',
                            mainTab === 'requirements'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        )}
                    >
                        Requirements
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: OVERVIEW COMPLIANCE COMMAND CENTER */}
                {/* ========================================================================= */}
                {mainTab === 'overview' && (
                    <div className="flex flex-col gap-6">
                        {/* Top Filters Row */}
                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-3">
                            <div className="flex flex-col min-w-[200px] flex-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                    Academic Period
                                </label>
                                <select
                                    value={academicPeriod}
                                    onChange={(e) => setAcademicPeriod(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="AY 2026–2027 • 1st Semester">AY 2026–2027 • 1st Semester</option>
                                    <option value="AY 2026–2027 • 2nd Semester">AY 2026–2027 • 2nd Semester</option>
                                    <option value="AY 2025–2026 • 2nd Semester">AY 2025–2026 • 2nd Semester</option>
                                </select>
                            </div>

                            <div className="flex flex-col min-w-[150px] flex-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                    Program
                                </label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.code}>
                                            {p.code} - {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col min-w-[150px] flex-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                    Faculty
                                </label>
                                <select
                                    value={selectedFaculty}
                                    onChange={(e) => setSelectedFaculty(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="all">All Faculty</option>
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.last_name}, {f.first_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col min-w-[160px] flex-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                    Requirement Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="Teaching and Learning Requirements">Teaching and Learning</option>
                                    <option value="Workload and Assignments">Workload and Assignments</option>
                                    <option value="Course Documents">Course Documents</option>
                                    <option value="Grading and Assessment">Grading and Assessment</option>
                                    <option value="Performance Evaluation">Performance Evaluation</option>
                                    <option value="Research and Extension">Research and Extension</option>
                                </select>
                            </div>

                            <div className="flex flex-col min-w-[200px] flex-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                    Date Range
                                </label>
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>{dateRange}</span>
                                </div>
                            </div>

                            <div className="flex items-end self-end">
                                <Button
                                    onClick={applyFilters}
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs px-5 py-2 rounded-xl h-[34px] shadow-xs"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>

                        {/* 8 KPI Cards Matching User Screenshot */}
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                            {/* 1. Active Requirement Folders */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                                        <Folder className="w-4 h-4 fill-blue-500 text-blue-600" />
                                    </div>
                                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                        {kpiCards?.active_folders ?? 6}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Active Requirement Folders
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                                        {kpiCards?.active_folders_trend ?? '↑ 2 vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Faculty Expected to Submit */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                        {kpiCards?.expected_faculty ?? 38}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Faculty Expected to Submit
                                    </p>
                                    <p className="text-[10px] font-semibold text-zinc-400 mt-1">
                                        {kpiCards?.expected_faculty_trend ?? '0% vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Submitted On Time */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        {kpiCards?.submitted_on_time ?? 24}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Submitted On Time
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                        {kpiCards?.submitted_on_time_trend ?? '↑ 12% vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 4. Submitted Late */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                        {kpiCards?.submitted_late ?? 6}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Submitted Late
                                    </p>
                                    <p className="text-[10px] font-semibold text-rose-500 mt-1">
                                        {kpiCards?.submitted_late_trend ?? '↑ 2% vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 5. Pending */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-zinc-800 dark:text-zinc-200">
                                        {kpiCards?.pending ?? 5}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Pending
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                        {kpiCards?.pending_trend ?? '↓ 3% vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 6. Overdue */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                        {kpiCards?.overdue ?? 3}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Overdue
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                        {kpiCards?.overdue_trend ?? '↓ 5% vs. last period'}
                                    </p>
                                </div>
                            </div>

                            {/* 7. Overall Compliance Rate Gauge */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Overall Compliance Rate
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-zinc-100 dark:text-zinc-800"
                                                strokeWidth="3.8"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className="text-emerald-500"
                                                strokeDasharray={`${kpiCards?.overall_rate ?? 76}, 100`}
                                                strokeWidth="3.8"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                        <span className="absolute text-xs font-black text-zinc-900 dark:text-zinc-100">
                                            {kpiCards?.overall_rate ?? 76}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                                            {kpiCards?.overall_rate ?? 76}%
                                        </span>
                                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            {kpiCards?.overall_rate_trend ?? '↑ 6% vs. last period'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 8. Average Days Late */}
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                                        <CalendarDays className="w-4 h-4" />
                                    </div>
                                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                        {kpiCards?.avg_days_late ?? 2.3}{' '}
                                        <span className="text-xs font-medium text-zinc-500">days</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
                                        Average Days Late
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                        {kpiCards?.avg_days_late_trend ?? '↓ 1.7 vs. last period'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Central Section: Left = Compliance Tracker Matrix, Right = Charts & Attention Required */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* LEFT: Compliance Tracker Matrix (7 cols on 12-col grid) */}
                            <div className="lg:col-span-8 flex flex-col gap-4">
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                                                <Folder className="w-4 h-4 fill-amber-500 text-amber-600" />
                                            </div>
                                            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                Compliance Tracker Matrix
                                                <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold flex items-center justify-center">
                                                    i
                                                </span>
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            {/* Matrix / List toggle pills */}
                                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-bold">
                                                <span className="text-[11px] text-zinc-400 px-2">View:</span>
                                                <button
                                                    onClick={() => setMatrixView('matrix')}
                                                    className={cn(
                                                        'px-3 py-1 rounded-lg transition-all',
                                                        matrixView === 'matrix'
                                                            ? 'bg-[#F59E0B] text-white shadow-xs'
                                                            : 'text-zinc-600 dark:text-zinc-400'
                                                    )}
                                                >
                                                    Matrix
                                                </button>
                                                <button
                                                    onClick={() => setMatrixView('list')}
                                                    className={cn(
                                                        'px-3 py-1 rounded-lg transition-all',
                                                        matrixView === 'list'
                                                            ? 'bg-[#F59E0B] text-white shadow-xs'
                                                            : 'text-zinc-600 dark:text-zinc-400'
                                                    )}
                                                >
                                                    List
                                                </button>
                                            </div>

                                            {/* Search input */}
                                            <div className="relative w-44">
                                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search faculty..."
                                                    value={matrixSearch}
                                                    onChange={(e) => setMatrixSearch(e.target.value)}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Matrix Table */}
                                    <div className="overflow-x-auto border border-zinc-200/70 dark:border-zinc-800 rounded-xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                                    <th className="py-3 px-3 w-8 text-center">#</th>
                                                    <th className="py-3 px-3 min-w-[170px]">Faculty Name</th>
                                                    <th className="py-3 px-3 w-16">Program</th>
                                                    {(matrix?.columns || []).map((col) => (
                                                        <th
                                                            key={col.id}
                                                            className="py-3 px-3 text-center min-w-[125px] border-l border-zinc-200/50 dark:border-zinc-800"
                                                        >
                                                            <Link
                                                                href={`/compliance/requirements/${col.id}`}
                                                                className="hover:underline flex flex-col items-center group"
                                                            >
                                                                <span className="font-black text-zinc-800 dark:text-zinc-200 group-hover:text-amber-600 transition-colors">
                                                                    {col.title}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-amber-500">
                                                                    {col.due_date}
                                                                </span>
                                                            </Link>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                                {filteredMatrixRows.map((row) => (
                                                    <tr
                                                        key={row.faculty_id}
                                                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                                    >
                                                        <td className="py-3 px-3 text-center font-bold text-zinc-400">
                                                            {row.index}
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                                    {row.faculty_name
                                                                        .split(' ')
                                                                        .map((n) => n[0])
                                                                        .slice(0, 2)
                                                                        .join('')}
                                                                </div>
                                                                <span className="font-bold text-xs">{row.faculty_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 font-bold text-zinc-600 dark:text-zinc-400 text-xs">
                                                            {row.program_code}
                                                        </td>

                                                        {(matrix?.columns || []).map((col) => {
                                                            const cell = row.cells[col.id] || {
                                                                status: 'Pending',
                                                                label: 'Pending',
                                                                color: 'gray',
                                                            };

                                                            // Determine styling badge
                                                            let badgeClass =
                                                                'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';

                                                            if (cell.color === 'green') {
                                                                badgeClass =
                                                                    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800';
                                                            } else if (cell.color === 'amber') {
                                                                badgeClass =
                                                                    'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800';
                                                            } else if (cell.color === 'red') {
                                                                badgeClass =
                                                                    'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800';
                                                            } else if (cell.color === 'muted') {
                                                                badgeClass =
                                                                    'bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-400 border border-transparent';
                                                            }

                                                            return (
                                                                <td
                                                                    key={col.id}
                                                                    className="py-2 px-2 text-center border-l border-zinc-200/50 dark:border-zinc-800 cursor-pointer hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors"
                                                                    onClick={() =>
                                                                        router.visit(
                                                                            `/compliance/requirements/${col.id}`
                                                                        )
                                                                    }
                                                                >
                                                                    <span
                                                                        className={cn(
                                                                            'inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold transition-all shadow-2xs whitespace-nowrap',
                                                                            badgeClass
                                                                        )}
                                                                    >
                                                                        {cell.label}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Visualizations & Attention Required Panel (4 cols on 12-col grid) */}
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                {/* 1. Compliance Rate by Requirement Bar Chart */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                                        Compliance Rate by Requirement
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {(charts?.requirement_rates || []).map((item) => (
                                            <div key={item.id} className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-zinc-700 dark:text-zinc-300">
                                                        {item.short_name}
                                                    </span>
                                                    <span className="text-zinc-900 dark:text-zinc-100 font-black">
                                                        {item.rate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-500',
                                                            item.rate >= 75
                                                                ? 'bg-[#F59E0B]'
                                                                : item.rate >= 60
                                                                ? 'bg-amber-400'
                                                                : 'bg-rose-500'
                                                        )}
                                                        style={{ width: `${item.rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Submission Status Distribution Donut */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Submission Status Distribution
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        {/* Donut graphic */}
                                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    className="text-zinc-100 dark:text-zinc-800"
                                                    strokeWidth="4"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="text-emerald-500"
                                                    strokeDasharray="64, 100"
                                                    strokeWidth="4"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="text-amber-500"
                                                    strokeDasharray="16, 100"
                                                    strokeDashoffset="-64"
                                                    strokeWidth="4"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="text-rose-500"
                                                    strokeDasharray="8, 100"
                                                    strokeDashoffset="-80"
                                                    strokeWidth="4"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                                                    {charts?.status_distribution?.total ?? 38}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-400">Total</span>
                                            </div>
                                        </div>

                                        {/* Legend with exact labels */}
                                        <div className="flex flex-col gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span>Submitted On Time: 24 (64%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                <span>Submitted Late: 6 (16%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                                                <span>Pending: 5 (13%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                <span>Overdue: 3 (8%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                <span>Not Required: 2 (5%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Late Submission Trend */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                                        Late Submission Trend
                                    </h3>
                                    <div className="h-28 flex items-end justify-between gap-4 pt-4 px-2">
                                        {(charts?.late_trend || [
                                            { month: 'Aug', count: 2 },
                                            { month: 'Sep', count: 7 },
                                            { month: 'Oct', count: 4 },
                                        ]).map((point) => (
                                            <div key={point.month} className="flex-1 flex flex-col items-center gap-1.5">
                                                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                                                    {point.count}
                                                </span>
                                                <div
                                                    className="w-full max-w-[28px] bg-amber-400 hover:bg-amber-500 rounded-t-lg transition-all"
                                                    style={{ height: `${point.count * 10 + 15}px` }}
                                                />
                                                <span className="text-[10px] font-bold text-zinc-400">
                                                    {point.month}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Attention Required Panel Matching Screenshot */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                            Attention Required
                                        </h3>
                                        <button className="text-[11px] font-bold text-zinc-400 hover:text-amber-600 flex items-center gap-0.5">
                                            See All <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                        {attentionAlerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                onClick={() => {
                                                    if (alert.requirement_id) {
                                                        router.visit(`/compliance/requirements/${alert.requirement_id}`);
                                                    }
                                                }}
                                                className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 px-1 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className={cn(
                                                            'w-2 h-2 rounded-full shrink-0',
                                                            alert.level === 'critical'
                                                                ? 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/60'
                                                                : alert.level === 'warning'
                                                                ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60'
                                                                : 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950/60'
                                                        )}
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">
                                                            {alert.title}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-zinc-500">
                                                            {alert.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. Program Compliance Comparison Progress Bars */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
                                    <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                        Program Compliance Comparison
                                    </h3>
                                    <div className="flex flex-col gap-2.5">
                                        {(charts?.program_comparison || [
                                            { code: 'BSIT', rate: 82 },
                                            { code: 'BSIS', rate: 74 },
                                            { code: 'DIT', rate: 66 },
                                        ]).map((prog) => (
                                            <div key={prog.code} className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-zinc-700 dark:text-zinc-300">{prog.code}</span>
                                                    <span className="text-zinc-900 dark:text-zinc-100 font-black">
                                                        {prog.rate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-500',
                                                            prog.rate >= 80 ? 'bg-[#F59E0B]' : 'bg-amber-300'
                                                        )}
                                                        style={{ width: `${prog.rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: REQUIREMENTS OPERATIONAL WORKSPACE (Folders Grid / List) */}
                {/* ========================================================================= */}
                {mainTab === 'requirements' && (
                    <div className="flex flex-col gap-6">
                        {/* Search and Filter Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                {/* Grid / List toggle pills */}
                                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-bold">
                                    <button
                                        onClick={() => setFolderView('grid')}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all',
                                            folderView === 'grid'
                                                ? 'bg-[#F59E0B] text-white shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        )}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        Grid View
                                    </button>
                                    <button
                                        onClick={() => setFolderView('list')}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all',
                                            folderView === 'list'
                                                ? 'bg-[#F59E0B] text-white shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        )}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        List View
                                    </button>
                                </div>

                                {/* Search requirement folders input */}
                                <div className="relative w-72">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search requirement folders..."
                                        value={folderSearch}
                                        onChange={(e) => setFolderSearch(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>

                                {/* Category filter */}
                                <select
                                    value={folderCategory}
                                    onChange={(e) => setFolderCategory(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="Teaching and Learning Requirements">Teaching and Learning</option>
                                    <option value="Workload and Assignments">Workload and Assignments</option>
                                    <option value="Course Documents">Course Documents</option>
                                    <option value="Grading and Assessment">Grading and Assessment</option>
                                    <option value="Performance Evaluation">Performance Evaluation</option>
                                    <option value="Research and Extension">Research and Extension</option>
                                </select>

                                {/* Status filter */}
                                <select
                                    value={folderStatus}
                                    onChange={(e) => setFolderStatus(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        {/* GRID VIEW: Requirement Folder Cards matching screenshot */}
                        {folderView === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredFolders.map((folder) => {
                                    // Health badge styling
                                    let healthBadge =
                                        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80';
                                    if (folder.health_indicator === 'Needs Attention') {
                                        healthBadge =
                                            'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80';
                                    } else if (folder.health_indicator === 'Critical') {
                                        healthBadge =
                                            'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80';
                                    }

                                    return (
                                        <div
                                            key={folder.id}
                                            onClick={() => router.visit(`/compliance/requirements/${folder.id}`)}
                                            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                                                            <Folder className="w-5 h-5 fill-amber-500 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">
                                                                {folder.title}
                                                            </h3>
                                                            <p className="text-[11px] font-semibold text-zinc-400">
                                                                {folder.category}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={cn(
                                                            'px-2.5 py-1 rounded-full text-[10px] font-bold border',
                                                            healthBadge
                                                        )}
                                                    >
                                                        {folder.health_indicator}
                                                    </span>
                                                </div>

                                                {/* Assigned, On Time, Late, Overdue counters */}
                                                <div className="grid grid-cols-4 gap-2 text-center py-3 my-2 border-y border-zinc-100 dark:border-zinc-800">
                                                    <div>
                                                        <p className="text-base font-black text-zinc-900 dark:text-zinc-100">
                                                            {folder.assigned_count}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-zinc-400">Assigned</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                            {folder.on_time_count}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-zinc-400">On Time</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-amber-600 dark:text-amber-400">
                                                            {folder.late_count}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-zinc-400">Late</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-rose-600 dark:text-rose-400">
                                                            {folder.overdue_count}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-zinc-400">Overdue</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Due Date & Compliance Rate Bar */}
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                                    <span className="text-zinc-400 text-[11px]">
                                                        Due: {folder.due_date}
                                                    </span>
                                                    <span className="text-zinc-900 dark:text-zinc-100 font-black">
                                                        {folder.compliance_rate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-500',
                                                            folder.compliance_rate >= 75
                                                                ? 'bg-emerald-500'
                                                                : folder.compliance_rate >= 60
                                                                ? 'bg-amber-400'
                                                                : 'bg-rose-500'
                                                        )}
                                                        style={{ width: `${folder.compliance_rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* LIST VIEW: Table with comprehensive columns */}
                        {folderView === 'list' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                                <th className="py-3 px-4">Requirement Folder</th>
                                                <th className="py-3 px-4">Category</th>
                                                <th className="py-3 px-3 text-center">Assigned</th>
                                                <th className="py-3 px-3 text-center">On Time</th>
                                                <th className="py-3 px-3 text-center">Late</th>
                                                <th className="py-3 px-3 text-center">Pending</th>
                                                <th className="py-3 px-3 text-center">Overdue</th>
                                                <th className="py-3 px-4">Due Date</th>
                                                <th className="py-3 px-3 text-center">Compliance Rate</th>
                                                <th className="py-3 px-3 text-center">Status</th>
                                                <th className="py-3 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                                            {filteredFolders.map((folder) => (
                                                <tr
                                                    key={folder.id}
                                                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                                                        <Link
                                                            href={`/compliance/requirements/${folder.id}`}
                                                            className="flex items-center gap-2.5 hover:text-amber-600 transition-colors"
                                                        >
                                                            <Folder className="w-4 h-4 text-amber-500 fill-amber-400" />
                                                            <span>{folder.title}</span>
                                                        </Link>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-medium">
                                                        {folder.category}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-black">
                                                        {folder.assigned_count}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-black text-emerald-600">
                                                        {folder.on_time_count}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-black text-amber-600">
                                                        {folder.late_count}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-black text-zinc-500">
                                                        {folder.pending_count}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-black text-rose-600">
                                                        {folder.overdue_count}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-semibold text-[11px]">
                                                        {folder.due_date}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                                                            {folder.compliance_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {folder.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(`/compliance/requirements/${folder.id}`)
                                                            }
                                                            className="h-7 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        >
                                                            Open
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Requirement Folder Modal */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-amber-500" />
                                Create Requirement Folder
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Configure compliance requirements, timeline, policies, and assign eligible faculty submitters.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Folder Name *
                                    </Label>
                                    <Input
                                        placeholder="e.g. TOS/TQ, Syllabi, IPCR"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Document / Short Code *
                                    </Label>
                                    <Input
                                        placeholder="e.g. TOS, SYLLABUS, IPCR"
                                        value={data.document_type}
                                        onChange={(e) => setData('document_type', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Category *
                                </Label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                >
                                    <option value="Teaching and Learning Requirements">Teaching and Learning Requirements</option>
                                    <option value="Workload and Assignments">Workload and Assignments</option>
                                    <option value="Course Documents">Course Documents</option>
                                    <option value="Grading and Assessment">Grading and Assessment</option>
                                    <option value="Performance Evaluation">Performance Evaluation</option>
                                    <option value="Research and Extension">Research and Extension</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Description
                                </Label>
                                <textarea
                                    rows={2}
                                    placeholder="Provide detailed submission instructions and guidelines..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Applicable Program(s)
                                    </Label>
                                    <select
                                        value={data.program_id}
                                        onChange={(e) => setData('program_id', e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                    >
                                        <option value="all">All College Programs</option>
                                        {programs.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.code} - {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Academic Period
                                    </Label>
                                    <Input
                                        value={data.academic_year}
                                        onChange={(e) => setData('academic_year', e.target.value)}
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Open Date
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.open_date}
                                        onChange={(e) => setData('open_date', e.target.value)}
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Due Date *
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Grace Period (Days)
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={data.grace_period_days}
                                        onChange={(e) => setData('grace_period_days', parseInt(e.target.value, 10))}
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Required File Types
                                    </Label>
                                    <Input
                                        placeholder="pdf,docx,xlsx"
                                        value={data.required_file_types}
                                        onChange={(e) => setData('required_file_types', e.target.value)}
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Naming Convention Template
                                    </Label>
                                    <Input
                                        placeholder="e.g. TOS_[Course]_[LastName]"
                                        value={data.naming_convention}
                                        onChange={(e) => setData('naming_convention', e.target.value)}
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                                >
                                    {processing ? 'Creating...' : 'Create Folder & Notify'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
