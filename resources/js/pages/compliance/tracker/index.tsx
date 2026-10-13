import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Layers,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    Search,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    TrendingUp,
    Download,
    BarChart3,
    PieChart,
    CalendarDays,
    Building2,
    BookOpen,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance Tracker', href: '/compliance/tracker' },
];

interface ProgramStat {
    id: number;
    code: string;
    name: string;
    submitted: number;
    pending: number;
    overdue: number;
    total: number;
    compliance_rate: number;
    status: string;
}

interface RequirementProgress {
    title: string;
    completed: number;
    total: number;
    status: string;
}

interface UpcomingDeadline {
    day: string;
    month: string;
    title: string;
    scope: string;
    badge: string;
    badge_color: string;
    days_left: string;
}

interface Props {
    stats: {
        overall_rate: number;
        growth?: string;
        completed: number;
        pending: number;
        overdue: number;
        active_requirements: number;
        total_programs: number;
    };
    program_stats: ProgramStat[];
    requirement_progress: RequirementProgress[];
    upcoming_deadlines: UpcomingDeadline[];
    programs: Array<{ id: number; code: string; name: string }>;
    requirements: Array<{ id: number; title: string }>;
    filters: {
        year: string;
        semester: string;
        program: string;
        requirement: string;
        status: string;
        search: string;
    };
}

export default function ComplianceTrackerIndex({
    stats,
    program_stats = [],
    requirement_progress = [],
    upcoming_deadlines = [],
    programs = [],
    requirements = [],
    filters,
}: Props) {
    const [selectedYear, setSelectedYear] = useState(filters?.year || '2026 – 2027');
    const [selectedSemester, setSelectedSemester] = useState(filters?.semester || '1st Semester');
    const [selectedProgram, setSelectedProgram] = useState(filters?.program || 'all');
    const [selectedRequirement, setSelectedRequirement] = useState(filters?.requirement || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const filteredProgramStats = useMemo(() => {
        return program_stats.filter(p => {
            const matchesSearch = !searchTerm ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProg = selectedProgram === 'all' || p.code.toLowerCase() === selectedProgram.toLowerCase();
            return matchesSearch && matchesProg;
        });
    }, [program_stats, searchTerm, selectedProgram]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compliance Tracker - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground">
                            Compliance Tracker
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            Monitor college-wide submission progress, pending requirements, and overdue outputs.
                        </p>
                    </div>
                </div>

                {/* 2. FIVE KPI METRIC CARDS (Exact match to screenshot) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Overall Compliance Rate */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            {/* Circular progress donut indicator */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/30"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-orange-500"
                                        strokeDasharray="100, 100"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Overall Compliance Rate
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {stats.overall_rate}%
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-0.5" />
                                        {stats.growth || '+12%'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">vs. last month</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Completed */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Completed
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {stats.completed}
                                </div>
                                <div className="space-y-1 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground font-medium block">
                                        of {stats.completed} requirements
                                    </span>
                                    <div className="w-16 h-1 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Pending */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Pending
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {stats.pending}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    0% of all requirements
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Total Overdue */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Overdue
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5 text-rose-600">
                                    {stats.overdue}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    0% of all requirements
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Active Requirements */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Active Requirements
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {stats.active_requirements || 33}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    across 4 programs
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FILTER BAR WITH ACTION BUTTONS (Exact match to screenshot) */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                    {/* Filter Dropdown Selectors */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Academic Year */}
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 h-9 shadow-xs">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="2026 – 2027">2026 – 2027</option>
                                <option value="2025 – 2026">2025 – 2026</option>
                            </select>
                        </div>

                        {/* Semester */}
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 h-9 shadow-xs">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="1st Semester">1st Semester</option>
                                <option value="2nd Semester">2nd Semester</option>
                                <option value="Summer Term">Summer Term</option>
                            </select>
                        </div>

                        {/* Program */}
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 h-9 shadow-xs">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Programs</option>
                                <option value="bsit">BSIT</option>
                                <option value="bsis">BSIS</option>
                                <option value="blis">BLIS</option>
                                <option value="bscs">BSCS</option>
                            </select>
                        </div>

                        {/* Requirement */}
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 h-9 shadow-xs">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={selectedRequirement}
                                onChange={(e) => setSelectedRequirement(e.target.value)}
                                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Requirements</option>
                                {requirements.map(r => (
                                    <option key={r.id} value={r.id}>{r.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 h-9 shadow-xs">
                            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="compliant">Compliant</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Side Buttons: Export Summary, Generate Report, Search Box */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-3.5 rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30 text-xs font-bold shadow-xs cursor-pointer gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Summary</span>
                        </Button>

                        <Link
                            href="/compliance/matrix"
                            className="h-9 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Generate Report</span>
                        </Link>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search programs, faculty, or requirements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. THREE UPPER CHARTS & PROGRESS PANELS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Panel 1: Overall Compliance Donut Chart (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-foreground">Overall Compliance</h3>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                AY 2026 – 2027 · 1st Semester
                            </span>
                        </div>

                        <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-8">
                            {/* Large Donut Graphic */}
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/20"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-orange-500"
                                        strokeDasharray="100, 100"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-2xl font-black text-foreground leading-none">100%</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Compliant</span>
                                    <span className="text-[9px] text-muted-foreground">33 of 33</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="font-semibold text-muted-foreground">Completed</span>
                                    <span className="font-bold text-foreground ml-auto pl-4">33 (100%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="font-semibold text-muted-foreground">Pending</span>
                                    <span className="font-bold text-foreground ml-auto pl-4">0 (0%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span className="font-semibold text-muted-foreground">Overdue</span>
                                    <span className="font-bold text-foreground ml-auto pl-4">0 (0%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground text-center border-t border-border/70 pt-2.5">
                            Target institutional benchmark: 95% compliance rate
                        </div>
                    </div>

                    {/* Panel 2: Compliance by Program (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-foreground">Compliance by Program</h3>
                            </div>
                            <select className="h-6 text-[10px] font-bold rounded-lg border border-border bg-card px-2 text-muted-foreground cursor-pointer">
                                <option>Compliance Rate</option>
                                <option>Total Submissions</option>
                            </select>
                        </div>

                        <div className="py-3 space-y-4">
                            {/* BSIT */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground w-12">BSIT</span>
                                    <div className="flex-1 mx-3 bg-muted rounded-full h-3 overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full w-full" />
                                    </div>
                                    <span className="font-black text-foreground tabular-nums text-xs">100%</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">8 of 8</span>
                                </div>
                            </div>

                            {/* BSIS */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground w-12">BSIS</span>
                                    <div className="flex-1 mx-3 bg-muted rounded-full h-3 overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full w-full" />
                                    </div>
                                    <span className="font-black text-foreground tabular-nums text-xs">100%</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">8 of 8</span>
                                </div>
                            </div>

                            {/* BLIS */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground w-12">BLIS</span>
                                    <div className="flex-1 mx-3 bg-muted rounded-full h-3 overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full w-full" />
                                    </div>
                                    <span className="font-black text-foreground tabular-nums text-xs">100%</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">8 of 8</span>
                                </div>
                            </div>

                            {/* BSCS */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground w-12">BSCS</span>
                                    <div className="flex-1 mx-3 bg-muted rounded-full h-3 overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full w-full" />
                                    </div>
                                    <span className="font-black text-foreground tabular-nums text-xs">100%</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">9 of 9</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground text-center border-t border-border/70 pt-2.5">
                            All 4 college academic programs reached 100% compliance threshold
                        </div>
                    </div>

                    {/* Panel 3: Requirement Progress (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-foreground">Requirement Progress</h3>
                            </div>
                            <Link href="/compliance/requirements" className="text-[11px] font-bold text-primary hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="py-2 space-y-3">
                            {requirement_progress.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="font-bold text-foreground truncate max-w-[150px]">
                                        {item.title}
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-orange-500 h-full rounded-full w-full" />
                                        </div>
                                        <span className="text-[11px] text-muted-foreground font-semibold">
                                            {item.completed}/{item.total}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                            Completed
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-[10px] text-muted-foreground text-center border-t border-border/70 pt-2.5">
                            Outputs evaluated across academic programs
                        </div>
                    </div>
                </div>

                {/* 5. BOTTOM SECTION: PROGRAM COMPLIANCE DETAILS TABLE & UPCOMING DEADLINES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Table: Program Compliance Details (Col span 8) */}
                    <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-foreground">Program Compliance Details</h3>
                            </div>
                            <Link href="/compliance/matrix" className="text-[11px] font-bold text-primary hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="overflow-x-auto border border-border/80 rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th className="w-10 px-3 py-3 text-center">#</th>
                                        <th className="px-4 py-3 font-semibold">Program</th>
                                        <th className="px-3 py-3 font-semibold text-center">Submitted</th>
                                        <th className="px-3 py-3 font-semibold text-center">Pending</th>
                                        <th className="px-3 py-3 font-semibold text-center">Overdue</th>
                                        <th className="px-3 py-3 font-semibold text-center">Compliance Rate</th>
                                        <th className="px-3 py-3 font-semibold text-center">Status</th>
                                        <th className="px-3 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredProgramStats.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-foreground">
                                                {item.name}
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-foreground tabular-nums">
                                                {item.submitted}
                                            </td>
                                            <td className="px-3 py-3 text-center font-medium text-muted-foreground tabular-nums">
                                                {item.pending}
                                            </td>
                                            <td className="px-3 py-3 text-center font-medium text-muted-foreground tabular-nums">
                                                {item.overdue}
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {item.compliance_rate}%
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    Compliant
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Card: Upcoming Deadlines (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-foreground">Upcoming Deadlines</h3>
                            </div>
                            <Link href="/schedule/calendar" className="text-[11px] font-bold text-primary hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3.5">
                            {upcoming_deadlines.map((deadline, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        {/* Date badge */}
                                        <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-tight">
                                                {deadline.month}
                                            </span>
                                            <span className="text-base font-black text-foreground leading-none">
                                                {deadline.day}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-xs text-foreground leading-snug">
                                                {deadline.title}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {deadline.scope}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                                            deadline.badge_color === 'amber'
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                                : "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                                        )}>
                                            {deadline.badge}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                                            {deadline.days_left}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
