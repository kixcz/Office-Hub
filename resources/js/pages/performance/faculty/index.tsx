import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    Printer,
    Download,
    Plus,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Trophy,
    Award,
    TrendingUp,
    LayoutGrid,
    List,
    Eye,
    Edit,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Calendar,
    FolderKanban,
    Columns,
    Info,
    HelpCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Faculty Performance', href: '/performance/faculty' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface FacultyPerformanceItem {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    academic_rank: string;
    program_id: number;
    program: string;
    program_name: string;
    total_requirements: number;
    complied: number;
    on_time: number;
    late: number;
    overdue: number;
    pending?: number;
    compliance_rate: number;
    on_time_rate: number;
    has_submitted?: boolean;
    status: string;
}

interface KPIs {
    total_faculty: number;
    compliance_rate: number;
    on_time_rate: number;
    overdue_cases: number;
}

interface Props {
    performances: FacultyPerformanceItem[];
    programs: Program[];
    kpis: KPIs;
    filters: {
        ay: string;
        semester: string;
        program: string;
        status: string;
        search: string;
    };
    academic_year: string;
    semester: string;
}

export default function FacultyPerformanceIndex({
    performances = [],
    programs = [],
    kpis,
    filters,
    academic_year = 'AY 2026-2027',
    semester = '1st Semester',
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedProgram, setSelectedProgram] = useState(filters?.program || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all');
    const [selectedSemesterAY, setSelectedSemesterAY] = useState('1st Semester, AY 2026-2027');
    const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'on_time'>('name');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Normalize each performance item to ensure full status coverage
    const normalizedPerformances = useMemo(() => {
        return performances.map((item) => {
            const total = item.total_requirements || 0;
            const complied = item.complied || 0;
            const overdue = item.overdue || 0;
            // The remaining requirements are Pending (Active/Upcoming, not yet submitted and not overdue)
            const pending = item.pending !== undefined ? item.pending : Math.max(0, total - (complied + overdue));

            // Derive clear status label & color
            let statusBadge = {
                label: 'On Track',
                className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
                icon: CheckCircle2,
            };

            if (overdue > 0) {
                statusBadge = {
                    label: 'Overdue',
                    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
                    icon: AlertTriangle,
                };
            } else if (complied === total && total > 0) {
                statusBadge = {
                    label: 'Excellent',
                    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
                    icon: CheckCircle2,
                };
            } else if (item.compliance_rate >= 50 || pending > 0) {
                statusBadge = {
                    label: 'On Track',
                    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
                    icon: CheckCircle2,
                };
            } else {
                statusBadge = {
                    label: 'Needs Attention',
                    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
                    icon: AlertTriangle,
                };
            }

            return {
                ...item,
                pending,
                statusBadge,
            };
        });
    }, [performances]);

    // Filter & Sort
    const filteredPerformances = useMemo(() => {
        let list = normalizedPerformances.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.academic_rank.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram =
                selectedProgram === 'all' ||
                item.program.toLowerCase() === selectedProgram.toLowerCase() ||
                String(item.program_id) === selectedProgram;
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'top' && item.compliance_rate >= 80) ||
                (selectedStatus === 'overdue' && item.overdue > 0) ||
                (selectedStatus === 'ontrack' && item.overdue === 0 && item.pending > 0) ||
                (selectedStatus === 'good' && item.overdue === 0);

            return matchesSearch && matchesProgram && matchesStatus;
        });

        // Sorting
        return list.sort((a, b) => {
            if (sortBy === 'compliance') return b.compliance_rate - a.compliance_rate;
            if (sortBy === 'on_time') return b.on_time_rate - a.on_time_rate;
            return a.name.localeCompare(b.name);
        });
    }, [normalizedPerformances, searchTerm, selectedProgram, selectedStatus, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPerformances.length / pageSize));
    const paginatedPerformances = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPerformances.slice(start, start + pageSize);
    }, [filteredPerformances, currentPage, pageSize]);

    // Top Performers List (highest compliance rate, then on_time_rate)
    const topPerformers = useMemo(() => {
        return [...normalizedPerformances]
            .sort((a, b) => {
                if (b.compliance_rate !== a.compliance_rate) {
                    return b.compliance_rate - a.compliance_rate;
                }
                return b.on_time_rate - a.on_time_rate;
            })
            .slice(0, 5);
    }, [normalizedPerformances]);

    // Needs Attention List (high overdue cases or lowest compliance rate)
    const needsAttentionList = useMemo(() => {
        return [...normalizedPerformances]
            .filter((p) => p.overdue > 0 || p.compliance_rate < 30)
            .sort((a, b) => {
                if (b.overdue !== a.overdue) {
                    return b.overdue - a.overdue;
                }
                return a.compliance_rate - b.compliance_rate;
            })
            .slice(0, 5);
    }, [normalizedPerformances]);

    // Performance Insights stats
    const insights = useMemo(() => {
        const highCompliance = normalizedPerformances.filter((p) => p.compliance_rate >= 80).length;
        const lowCompliance = normalizedPerformances.filter((p) => p.compliance_rate < 20).length;
        const highOnTime = normalizedPerformances.filter((p) => p.complied > 0 && p.on_time_rate >= 80).length;
        const withOverdue = normalizedPerformances.filter((p) => p.overdue > 0).length;

        return {
            highCompliance,
            lowCompliance,
            highOnTime,
            withOverdue,
        };
    }, [normalizedPerformances]);

    // Avatar initials helper
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Curated soft avatar colors
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
            'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
            'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
            'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
            'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Performance - CIDS OfficeHub" />

            {/* FULL WIDTH MAIN CONTENT WRAPPER */}
            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 w-full max-w-full font-poppins">
                {/* 1. TOP HEADER WITH ACADEMIC PERIOD SELECTOR */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Faculty Performance
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Monitor compliance, on-time submission performance, and faculty output status.
                            </p>
                        </div>
                    </div>

                    {/* Academic Term Picker */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedSemesterAY}
                                onChange={(e) => setSelectedSemesterAY(e.target.value)}
                                className="h-10 pl-9 pr-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer shadow-2xs"
                            >
                                <option value="1st Semester, AY 2026-2027">1st Semester, AY 2026-2027</option>
                                <option value="2nd Semester, AY 2026-2027">2nd Semester, AY 2026-2027</option>
                                <option value="Summer, AY 2026-2027">Summer, AY 2026-2027</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* 2. FOUR KPI STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Faculty */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                                Total Faculty
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                    {kpis?.total_faculty ?? performances.length}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +0 this month
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Average Compliance Rate */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                                    Average Compliance Rate
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                    {kpis?.compliance_rate ?? 0}%
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +12.4%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: Average On-Time Rate */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                                    Average On-Time Rate
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                    {kpis?.on_time_rate ?? 0}%
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +15.2%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: Overdue Cases */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                                Overdue Cases
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                    {kpis?.overdue_cases ?? 0}
                                </span>
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center">
                                    ↓ -75%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. FILTERS & ACTION CONTROLS BAR */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    {/* Left: Filters */}
                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                        {/* Academic Period Selector */}
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Academic Period
                            </span>
                            <div className="relative">
                                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedSemesterAY}
                                    onChange={(e) => setSelectedSemesterAY(e.target.value)}
                                    className="h-9.5 pl-8.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 appearance-none w-full cursor-pointer"
                                >
                                    <option value="1st Semester, AY 2026-2027">1st Semester, AY 2026-2027</option>
                                    <option value="2nd Semester, AY 2026-2027">2nd Semester, AY 2026-2027</option>
                                    <option value="Summer, AY 2026-2027">Summer, AY 2026-2027</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Program Filter */}
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Program
                            </span>
                            <div className="relative">
                                <Users className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => {
                                        setSelectedProgram(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9.5 pl-8.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 appearance-none w-full cursor-pointer"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.code}>
                                            {p.code} - {p.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1 min-w-[140px]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Status
                            </span>
                            <div className="relative">
                                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9.5 pl-8.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 appearance-none w-full cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="overdue">With Overdue</option>
                                    <option value="ontrack">On Track (Pending)</option>
                                    <option value="top">High Compliance (≥80%)</option>
                                    <option value="good">Without Overdue</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 opacity-0 hidden sm:block">
                                Search
                            </span>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search faculty name, program, or rank..."
                                    className="h-9.5 pl-9 text-xs font-medium rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions Buttons */}
                    <div className="flex items-center gap-2 pt-1 xl:pt-0 shrink-0 self-end xl:self-end">
                        {/* Export Button */}
                        <Button
                            variant="outline"
                            className="h-9.5 px-3.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-2xs"
                            onClick={() => {
                                const csvContent =
                                    'data:text/csv;charset=utf-8,' +
                                    ['#', 'Faculty Name', 'Rank', 'Program', 'Requirements', 'Complied', 'On Time', 'Late', 'Overdue', 'Pending', 'Compliance Rate', 'On-Time Rate', 'Status'].join(',') +
                                    '\n' +
                                    filteredPerformances
                                        .map((p, i) =>
                                            [
                                                i + 1,
                                                `"${p.name}"`,
                                                `"${p.academic_rank}"`,
                                                p.program,
                                                p.total_requirements,
                                                p.complied,
                                                p.on_time,
                                                p.late,
                                                p.overdue,
                                                p.pending,
                                                `${p.compliance_rate}%`,
                                                p.complied > 0 ? `${p.on_time_rate}%` : 'N/A',
                                                p.statusBadge.label
                                            ].join(',')
                                        )
                                        .join('\n');
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement('a');
                                link.setAttribute('href', encodedUri);
                                link.setAttribute('download', 'faculty-performance-summary.csv');
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </Button>

                        {/* Generate Report Button */}
                        <Link
                            href="/performance/faculty/report"
                            className="h-9.5 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Generate Report</span>
                        </Link>

                        {/* Add Recognition Rule Button */}
                        <Link
                            href="/performance/rules"
                            className="h-9.5 px-4 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add Recognition Rule</span>
                        </Link>
                    </div>
                </div>

                {/* 4. MAIN CONTENT AREA: 2-COLUMN LAYOUT (Table 8 cols + Sidebars 4 cols) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Faculty List Table (xl:col-span-8) */}
                    <div className="xl:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
                        {/* Table Header Bar */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                            Faculty List
                                        </h2>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                                            {filteredPerformances.length}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Showing {filteredPerformances.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                                        {Math.min(currentPage * pageSize, filteredPerformances.length)} of {performances.length} faculty members
                                    </p>
                                </div>
                            </div>

                            {/* Sort & View Mode Controls */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="text-[11px] font-semibold text-slate-400">Sort by</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                                    >
                                        <option value="name">Name (A–Z)</option>
                                        <option value="compliance">Compliance Rate</option>
                                        <option value="on_time">On-Time Rate</option>
                                    </select>
                                </div>

                                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "p-1.5 rounded-md text-xs transition-colors",
                                            viewMode === 'list'
                                                ? "bg-amber-500 text-slate-950 font-black"
                                                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        )}
                                        title="List View"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={cn(
                                            "p-1.5 rounded-md text-xs transition-colors",
                                            viewMode === 'grid'
                                                ? "bg-amber-500 text-slate-950 font-black"
                                                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        )}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TABLE CONTENT */}
                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <th className="py-3 px-3 text-center w-8">#</th>
                                            <th className="py-3 px-3.5 min-w-[170px]">Faculty Name</th>
                                            <th className="py-3 px-2.5 text-center">Program</th>
                                            <th className="py-3 px-2 text-center" title="Total Assigned Requirements">Requirements</th>
                                            <th className="py-3 px-2 text-center text-emerald-600 dark:text-emerald-400" title="Complied Requirements">Complied</th>
                                            <th className="py-3 px-2 text-center text-sky-600 dark:text-sky-400" title="Complied On-Time">On Time</th>
                                            <th className="py-3 px-2 text-center text-amber-600 dark:text-amber-400" title="Complied Late">Late</th>
                                            <th className="py-3 px-2 text-center text-rose-600 dark:text-rose-400" title="Overdue Submissions">Overdue</th>
                                            <th className="py-3 px-2 text-center text-slate-500 dark:text-slate-400" title="Pending / Active Requirements (Not Overdue)">Pending</th>
                                            <th className="py-3 px-3 min-w-[130px]">Compliance Rate</th>
                                            <th className="py-3 px-3 min-w-[130px]">On-Time Rate</th>
                                            <th className="py-3 px-3 text-center">Status</th>
                                            <th className="py-3 px-2 text-center w-10">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {paginatedPerformances.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="py-12 text-center text-slate-400">
                                                    No faculty records found matching the filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPerformances.map((perf, idx) => {
                                                const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                                                const StatusIcon = perf.statusBadge.icon;
                                                return (
                                                    <tr key={perf.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                                                            {globalIdx}
                                                        </td>
                                                        <td className="py-3 px-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                {perf.photo_url ? (
                                                                    <img
                                                                        src={perf.photo_url}
                                                                        alt={perf.name}
                                                                        className="w-7.5 h-7.5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                                                                    />
                                                                ) : (
                                                                    <div className={cn("w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs", getAvatarColor(perf.name))}>
                                                                        {getInitials(perf.name)}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <Link
                                                                        href={`/faculties/${perf.id}`}
                                                                        className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate"
                                                                    >
                                                                        {perf.name}
                                                                    </Link>
                                                                    <span className="text-[10px] text-slate-400 font-normal truncate">
                                                                        {perf.academic_rank}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2.5 text-center">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase inline-block",
                                                                perf.program === 'BSIS' ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50" :
                                                                perf.program === 'BSIT' ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50" :
                                                                perf.program === 'BSCS' ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50" :
                                                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            )}>
                                                                {perf.program}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                                                            {perf.total_requirements}
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-black text-emerald-600 dark:text-emerald-400">
                                                            {perf.complied}
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-bold text-sky-600 dark:text-sky-400">
                                                            {perf.on_time}
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                                                            {perf.late}
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-black text-rose-600 dark:text-rose-400">
                                                            {perf.overdue}
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                                                            {perf.pending}
                                                        </td>

                                                        {/* Compliance Rate Column */}
                                                        <td className="py-3 px-3">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center justify-between text-[11px] font-black text-slate-800 dark:text-slate-200">
                                                                    <span>{perf.compliance_rate}%</span>
                                                                    <span className="text-[9px] font-semibold text-slate-400">
                                                                        ({perf.complied}/{perf.total_requirements})
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                                        style={{ width: `${perf.compliance_rate}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* On-Time Rate Column */}
                                                        <td className="py-3 px-3">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center justify-between text-[11px] font-black text-slate-800 dark:text-slate-200">
                                                                    {perf.complied > 0 ? (
                                                                        <>
                                                                            <span>{perf.on_time_rate}%</span>
                                                                            <span className="text-[9px] font-semibold text-slate-400">
                                                                                ({perf.on_time}/{perf.complied})
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="text-slate-400 font-semibold italic text-[10.5px]">No submissions</span>
                                                                            <span className="text-[9px] font-semibold text-slate-400">—</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                                                                        style={{ width: `${perf.complied > 0 ? perf.on_time_rate : 0}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status Column */}
                                                        <td className="py-3 px-3 text-center">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0",
                                                                perf.statusBadge.className
                                                            )}>
                                                                <StatusIcon className="w-3 h-3 stroke-[2.5]" />
                                                                {perf.statusBadge.label}
                                                            </span>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="py-3 px-2 text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40 font-poppins">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/faculties/${perf.id}`} className="cursor-pointer">
                                                                            <Eye className="w-3.5 h-3.5 mr-2" />
                                                                            <span>View Profile</span>
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={`/tv-config/spotlight/create?type=achievement&faculty_id=${perf.id}&headline=CONGRATULATIONS%2C%20${encodeURIComponent(perf.name.toUpperCase())}!&message=${encodeURIComponent(`${perf.name} demonstrated outstanding teaching and academic performance in ${perf.program_name} with ${perf.compliance_rate}% compliance.`)}&template=achievement`}
                                                                            className="cursor-pointer text-amber-600 dark:text-amber-400 font-bold"
                                                                        >
                                                                            <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                                                            <span>Create Spotlight Slide</span>
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/performance/faculty/report?faculty=${perf.id}`} className="cursor-pointer">
                                                                            <FileText className="w-3.5 h-3.5 mr-2" />
                                                                            <span>Print Report</span>
                                                                        </Link>
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
                        ) : (
                            /* GRID CARD VIEW */
                            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paginatedPerformances.map((perf) => (
                                    <div
                                        key={perf.id}
                                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-900 shadow-2xs transition-all space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {perf.photo_url ? (
                                                    <img
                                                        src={perf.photo_url}
                                                        alt={perf.name}
                                                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                                                    />
                                                ) : (
                                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs", getAvatarColor(perf.name))}>
                                                        {getInitials(perf.name)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                        {perf.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-400">
                                                            {perf.academic_rank}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                            {perf.program}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                                                perf.statusBadge.className
                                            )}>
                                                {perf.statusBadge.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-5 gap-1.5 text-center py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
                                            <div>
                                                <div className="text-[9.5px] font-bold text-slate-400">Reqs</div>
                                                <div className="font-black text-slate-800 dark:text-slate-200">{perf.total_requirements}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9.5px] font-bold text-emerald-600">Complied</div>
                                                <div className="font-black text-emerald-600">{perf.complied}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9.5px] font-bold text-sky-600">On Time</div>
                                                <div className="font-black text-sky-600">{perf.on_time}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9.5px] font-bold text-rose-600">Overdue</div>
                                                <div className="font-black text-rose-600">{perf.overdue}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9.5px] font-bold text-slate-500">Pending</div>
                                                <div className="font-black text-slate-600 dark:text-slate-300">{perf.pending}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                                    <span className="text-slate-400">Compliance</span>
                                                    <span className="text-emerald-600 font-black">{perf.compliance_rate}%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${perf.compliance_rate}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                                    <span className="text-slate-400">On-Time</span>
                                                    <span className="text-sky-600 font-black">{perf.complied > 0 ? `${perf.on_time_rate}%` : 'N/A'}</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${perf.complied > 0 ? perf.on_time_rate : 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TABLE FOOTER: PAGINATION & PAGE SIZE */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            {/* Page size selector */}
                            <div className="flex items-center gap-2">
                                <span>Show</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-8 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span>of {filteredPerformances.length} faculty members</span>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "w-7 h-7 rounded-lg text-xs font-bold transition-colors",
                                            currentPage === page
                                                ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR WIDGETS (xl:col-span-4) */}
                    <div className="xl:col-span-4 space-y-5">
                        {/* 1. TOP PERFORMERS CARD (Matching attached design) */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Top Performers
                                        </h3>
                                        <p className="text-[10px] text-slate-400">
                                            Faculty with highest compliance rate
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSortBy('compliance')}
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="space-y-3 pt-1">
                                {topPerformers.map((faculty, rankIndex) => (
                                    <div
                                        key={faculty.id}
                                        className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Rank Badge */}
                                            <span className="w-4 text-center font-black text-xs text-amber-600 dark:text-amber-400">
                                                {rankIndex + 1}
                                            </span>
                                            {/* Initials Badge */}
                                            <div className={cn("w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs", getAvatarColor(faculty.name))}>
                                                {getInitials(faculty.name)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                    {faculty.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    {faculty.academic_rank} • {faculty.program}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{ width: `${Math.min(100, faculty.compliance_rate)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {faculty.compliance_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. NEEDS ATTENTION CARD (Matching attached design) */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Needs Attention
                                        </h3>
                                        <p className="text-[10px] text-slate-400">
                                            Faculty with low compliance or high overdue cases
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStatus('overdue')}
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="space-y-3 pt-1">
                                {needsAttentionList.map((faculty, rankIndex) => (
                                    <div
                                        key={faculty.id}
                                        className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-4 text-center font-black text-xs text-rose-600 dark:text-rose-400">
                                                {rankIndex + 1}
                                            </span>
                                            <div className={cn("w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs", getAvatarColor(faculty.name))}>
                                                {getInitials(faculty.name)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                    {faculty.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    {faculty.academic_rank} • {faculty.program}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {faculty.overdue > 0 && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50">
                                                    {faculty.overdue} overdue
                                                </span>
                                            )}
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">
                                                {faculty.compliance_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. PERFORMANCE INSIGHTS CARD (Matching attached design) */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3.5">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Performance Insights
                                    </h3>
                                </div>
                                <Link
                                    href="/performance/faculty/report"
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                    View Details
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                                {/* Insight 1: High Compliance */}
                                <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 dark:text-white text-xs">
                                            {insights.highCompliance} faculty members
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            with ≥ 80% compliance
                                        </div>
                                    </div>
                                </div>

                                {/* Insight 2: High On-Time */}
                                <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 dark:text-white text-xs">
                                            {insights.highOnTime} faculty members
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            with ≥ 80% on-time rate
                                        </div>
                                    </div>
                                </div>

                                {/* Insight 3: Low Compliance */}
                                <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 dark:text-white text-xs">
                                            {insights.lowCompliance} faculty members
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            with &lt; 20% compliance
                                        </div>
                                    </div>
                                </div>

                                {/* Insight 4: Overdue Requirements */}
                                <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 dark:text-white text-xs">
                                            {insights.withOverdue} faculty members
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            with overdue requirements
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
