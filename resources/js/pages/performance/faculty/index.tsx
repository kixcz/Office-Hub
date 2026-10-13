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
    FolderKanban
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
    academic_rank: string;
    program_id: number;
    program: string;
    program_name: string;
    total_requirements: number;
    complied: number;
    on_time: number;
    late: number;
    overdue: number;
    compliance_rate: number;
    on_time_rate: number;
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

    // Filter & Sort
    const filteredPerformances = useMemo(() => {
        let list = performances.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.program.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram =
                selectedProgram === 'all' ||
                item.program.toLowerCase() === selectedProgram.toLowerCase() ||
                String(item.program_id) === selectedProgram;
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'top' && item.compliance_rate === 100) ||
                (selectedStatus === 'overdue' && item.overdue > 0) ||
                (selectedStatus === 'good' && item.overdue === 0);

            return matchesSearch && matchesProgram && matchesStatus;
        });

        // Sorting
        return list.sort((a, b) => {
            if (sortBy === 'compliance') return b.compliance_rate - a.compliance_rate;
            if (sortBy === 'on_time') return b.on_time_rate - a.on_time_rate;
            return a.name.localeCompare(b.name);
        });
    }, [performances, searchTerm, selectedProgram, selectedStatus, sortBy]);

    // Top Performers List (faculty with 100% compliance rate, sorted by on_time_rate)
    const topPerformers = useMemo(() => {
        return [...performances]
            .filter((p) => p.compliance_rate >= 100)
            .sort((a, b) => b.on_time_rate - a.on_time_rate)
            .slice(0, 5);
    }, [performances]);

    // Insights counts
    const insights = useMemo(() => {
        const total = performances.length || 1;
        const perfectCompliance = performances.filter((p) => p.compliance_rate === 100).length;
        const perfectOnTime = performances.filter((p) => p.on_time_rate === 100).length;
        const withLate = performances.filter((p) => p.late > 0).length;
        const withOverdue = performances.filter((p) => p.overdue > 0).length;

        return {
            perfectCompliance,
            perfectCompliancePct: Math.round((perfectCompliance / total) * 100),
            perfectOnTime,
            perfectOnTimePct: Math.round((perfectOnTime / total) * 100),
            withLate,
            withLatePct: Math.round((withLate / total) * 100),
            withOverdue,
            withOverduePct: Math.round((withOverdue / total) * 100),
        };
    }, [performances]);

    // Avatar initials helper
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Color theme for avatars based on name hash
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
            'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
            'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
            'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
            'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Performance" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            Faculty Performance
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Monitor compliance, on-time submission performance, and faculty output status.
                        </p>
                    </div>
                </div>

                {/* 2. FOUR KPI CARDS (Matches Mockup) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Faculty */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Total Faculty
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-foreground">
                                    {kpis?.total_faculty ?? performances.length}
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +0 this month
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Average Compliance Rate */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Average Compliance Rate
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-foreground">
                                    {kpis?.compliance_rate ?? 89.6}%
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +12.4%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: Average On-Time Rate */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Average On-Time Rate
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-foreground">
                                    {kpis?.on_time_rate ?? 68.1}%
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ +15.2%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: Overdue Cases */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Overdue Cases
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-foreground">
                                    {kpis?.overdue_cases ?? 0}
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                                    ↑ -75%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. CONTROLS BAR: FILTERS + ACTIONS */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Filters on Left */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Semester / Academic Year Selector */}
                        <div className="flex flex-col gap-1 min-w-[210px]">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Semester / Academic Year
                            </span>
                            <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <select
                                    value={selectedSemesterAY}
                                    onChange={(e) => setSelectedSemesterAY(e.target.value)}
                                    className="h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 appearance-none w-full cursor-pointer shadow-2xs"
                                >
                                    <option value="1st Semester, AY 2026-2027">1st Semester, AY 2026-2027</option>
                                    <option value="2nd Semester, AY 2026-2027">2nd Semester, AY 2026-2027</option>
                                    <option value="Summer, AY 2026-2027">Summer, AY 2026-2027</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Program Filter */}
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Program
                            </span>
                            <div className="relative">
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 appearance-none w-full cursor-pointer shadow-2xs"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.code}>
                                            {p.code}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1 min-w-[140px]">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Status
                            </span>
                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 appearance-none w-full cursor-pointer shadow-2xs"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="top">Top Performers</option>
                                    <option value="good">Good Standing</option>
                                    <option value="overdue">With Overdue</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                            <span className="text-[11px] font-semibold text-muted-foreground opacity-0">
                                Search
                            </span>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search faculty name..."
                                    className="h-10 pl-9 text-xs rounded-xl border-border bg-card"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions on Right */}
                    <div className="flex items-center gap-2 self-end lg:self-end pt-5">
                        {/* Export Button */}
                        <Button
                            variant="outline"
                            className="h-10 px-3.5 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer shadow-2xs"
                            onClick={() => {
                                const csvContent =
                                    'data:text/csv;charset=utf-8,' +
                                    ['#', 'Faculty Name', 'Program', 'Requirements', 'Complied', 'On Time', 'Late', 'Overdue', 'Compliance Rate', 'On-Time Rate'].join(',') +
                                    '\n' +
                                    filteredPerformances
                                        .map((p, i) =>
                                            [i + 1, `"${p.name}"`, p.program, p.total_requirements, p.complied, p.on_time, p.late, p.overdue, `${p.compliance_rate}%`, `${p.on_time_rate}%`].join(',')
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

                        {/* Generate Report Button (Links to new Generate Report page) */}
                        <Link
                            href="/performance/faculty/report"
                            className="h-10 px-4 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>Generate Report</span>
                        </Link>

                        {/* Add Recognition Rule Button */}
                        <Link
                            href="/performance/rules"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 cursor-pointer shadow-xs transition-colors font-black"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Recognition Rule</span>
                        </Link>
                    </div>
                </div>

                {/* 4. MAIN CONTENT AREA: TABLE + RIGHT SIDEBAR CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Faculty List Table (8 or 9 cols) */}
                    <div className="lg:col-span-8 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                        {/* Table Header Bar */}
                        <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <span>Faculty List</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                                        {filteredPerformances.length}
                                    </span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Showing {filteredPerformances.length} of {performances.length} faculty members
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Sort by
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground focus:outline-hidden cursor-pointer"
                                >
                                    <option value="name">Name (A–Z)</option>
                                    <option value="compliance">Compliance Rate</option>
                                    <option value="on_time">On-Time Rate</option>
                                </select>

                                <div className="flex items-center border border-border rounded-lg p-0.5 ml-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "p-1 rounded-md text-xs transition-colors",
                                            viewMode === 'list'
                                                ? "bg-amber-500 text-slate-950"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="List View"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={cn(
                                            "p-1 rounded-md text-xs transition-colors",
                                            viewMode === 'grid'
                                                ? "bg-amber-500 text-slate-950"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table View */}
                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                                            <th className="py-3 px-3 text-left w-10 font-medium">#</th>
                                            <th className="py-3 px-4 text-left font-semibold">Faculty Name</th>
                                            <th className="py-3 px-2 text-center font-semibold">Program</th>
                                            <th className="py-3 px-2 text-center font-semibold">Requirements</th>
                                            <th className="py-3 px-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">Complied</th>
                                            <th className="py-3 px-2 text-center font-semibold text-sky-600 dark:text-sky-400">On Time</th>
                                            <th className="py-3 px-2 text-center font-semibold text-amber-600 dark:text-amber-400">Late</th>
                                            <th className="py-3 px-2 text-center font-semibold text-rose-600 dark:text-rose-400">Overdue</th>
                                            <th className="py-3 px-4 text-left font-semibold min-w-[130px]">Compliance Rate</th>
                                            <th className="py-3 px-4 text-left font-semibold min-w-[130px]">On-Time Rate</th>
                                            <th className="py-3 px-3 text-center w-12 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50 font-medium">
                                        {filteredPerformances.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="py-12 text-center text-muted-foreground">
                                                    No faculty records found matching the filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPerformances.map((perf, index) => (
                                                <tr key={perf.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="py-3.5 px-3 text-muted-foreground font-mono">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-foreground">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0", getAvatarColor(perf.name))}>
                                                                {getInitials(perf.name)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                                                                    {perf.name}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                                    {perf.academic_rank}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase",
                                                            perf.program === 'BSIS' ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20" :
                                                            perf.program === 'BSIT' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                                            perf.program === 'BSCS' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" :
                                                            "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                                        )}>
                                                            {perf.program}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center font-bold text-foreground">
                                                        {perf.total_requirements}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                                        {perf.complied}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center font-bold text-sky-600 dark:text-sky-400">
                                                        {perf.on_time}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                                                        {perf.late}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center font-bold text-rose-600 dark:text-rose-400">
                                                        {perf.overdue}
                                                    </td>
                                                    {/* Compliance Rate Progress Bar */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-between font-bold text-[11px]">
                                                                <span>{perf.compliance_rate}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                                    style={{ width: `${perf.compliance_rate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* On-Time Rate Progress Bar */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-between font-bold text-[11px]">
                                                                <span>{perf.on_time_rate}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                                                                    style={{ width: `${perf.on_time_rate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Actions Menu */}
                                                    <td className="py-3.5 px-3 text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/faculties/${perf.id}`} className="cursor-pointer">
                                                                        <Eye className="w-3.5 h-3.5 mr-2" />
                                                                        <span>View Profile</span>
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
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Grid Card View */
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredPerformances.map((perf) => (
                                    <div
                                        key={perf.id}
                                        className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:shadow-xs transition-all space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0", getAvatarColor(perf.name))}>
                                                    {getInitials(perf.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-foreground">
                                                        {perf.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-muted-foreground">
                                                            {perf.academic_rank}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-muted text-foreground">
                                                            {perf.program}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                perf.compliance_rate === 100
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            )}>
                                                {perf.compliance_rate}%
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 text-center py-2 border-y border-border/60 text-xs">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground">Reqs</div>
                                                <div className="font-bold">{perf.total_requirements}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-emerald-600">Complied</div>
                                                <div className="font-bold text-emerald-600">{perf.complied}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-sky-600">On Time</div>
                                                <div className="font-bold text-sky-600">{perf.on_time}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-rose-600">Overdue</div>
                                                <div className="font-bold text-rose-600">{perf.overdue}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between text-[11px] font-semibold">
                                                <span className="text-muted-foreground">On-Time Rate</span>
                                                <span className="text-foreground">{perf.on_time_rate}%</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-sky-500"
                                                    style={{ width: `${perf.on_time_rate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Top Performers & Performance Insights Cards (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 1. TOP PERFORMERS CARD (Matches Mockup) */}
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">
                                            Top Performers
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Faculty with 100% compliance rate
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
                                    View All
                                </span>
                            </div>

                            <div className="space-y-3 pt-1">
                                {topPerformers.map((faculty, rankIndex) => (
                                    <div
                                        key={faculty.id}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Rank Badge */}
                                            <div className="w-6 text-center font-black text-xs text-muted-foreground">
                                                {rankIndex + 1}
                                            </div>
                                            {/* Initials Badge */}
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0", getAvatarColor(faculty.name))}>
                                                {getInitials(faculty.name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-foreground leading-tight">
                                                    {faculty.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {faculty.program}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                100%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. PERFORMANCE INSIGHTS CARD (Matches Mockup) */}
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                <h3 className="text-sm font-bold text-foreground">
                                    Performance Insights
                                </h3>
                            </div>

                            <div className="space-y-3 pt-1 text-xs">
                                {/* Insight 1: 100% Compliance */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">
                                                {insights.perfectCompliance} faculty members
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                with 100% compliance rate
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black text-xs text-foreground">
                                        {insights.perfectCompliancePct}%
                                    </span>
                                </div>

                                {/* Insight 2: On-Time */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                            <Clock className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">
                                                {insights.perfectOnTime} faculty members
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                with 100% on-time rate
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black text-xs text-foreground">
                                        {insights.perfectOnTimePct}%
                                    </span>
                                </div>

                                {/* Insight 3: Late Submissions */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">
                                                {insights.withLate} faculty members
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                with late submissions
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black text-xs text-foreground">
                                        {insights.withLatePct}%
                                    </span>
                                </div>

                                {/* Insight 4: Overdue Submissions */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">
                                                {insights.withOverdue} faculty members
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                with overdue requirements
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-black text-xs text-foreground">
                                        {insights.withOverduePct}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
