import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft,
    User,
    Users,
    Building2,
    Star,
    Printer,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Maximize2,
    FileSpreadsheet,
    FileText,
    Award,
    Calendar,
    CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Faculty Performance', href: '/performance/faculty' },
    { title: 'Generate Report', href: '/performance/faculty/report' },
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
}

interface Props {
    faculties: FacultyPerformanceItem[];
    programs: Program[];
    academic_year: string;
    semester: string;
}

export default function GenerateFacultyPerformanceReport({
    faculties = [],
    programs = [],
    academic_year = '2026 - 2027',
    semester = '1st Semester',
}: Props) {
    // 1. Report Type: 'individual' | 'program' | 'consolidated' | 'top'
    const [reportType, setReportType] = useState<'individual' | 'program' | 'consolidated' | 'top'>('consolidated');

    // 2. Reporting Period
    const [selectedAY, setSelectedAY] = useState('2026 - 2027');
    const [selectedSemester, setSelectedSemester] = useState('1st Semester');
    const [customDateRange, setCustomDateRange] = useState('');

    // 3. Filters
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // 4. Signatories
    const [signatories, setSignatories] = useState({
        prepared: true,
        preparedName: 'Dr. Maria Cristina D. Reyes',
        preparedTitle: 'Faculty Performance Coordinator',
        verified: true,
        verifiedName: 'Prof. Antonio L. Santos',
        verifiedTitle: 'Department Chairperson',
        noted: true,
        notedName: 'Dr. Elena P. Villanueva',
        notedTitle: 'College Dean',
    });

    // 5. Additional Options
    const [options, setOptions] = useState({
        includeRankings: true,
        includeRemarks: true,
        includeCharts: true,
        includeDetailedRecords: false,
    });

    // Zoom & display
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    // Filter Rows for Preview
    const previewRows = useMemo(() => {
        let list = faculties.filter((f) => {
            const matchesProgram =
                selectedProgram === 'all' ||
                f.program.toLowerCase() === selectedProgram.toLowerCase() ||
                String(f.program_id) === selectedProgram;
            const matchesFaculty =
                selectedFaculty === 'all' ||
                String(f.id) === selectedFaculty ||
                f.name.toLowerCase().includes(selectedFaculty.toLowerCase());
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'top' && f.compliance_rate === 100) ||
                (selectedStatus === 'overdue' && f.overdue > 0) ||
                (selectedStatus === 'good' && f.overdue === 0);

            return matchesProgram && matchesFaculty && matchesStatus;
        });

        if (reportType === 'individual' && selectedFaculty !== 'all') {
            list = list.filter((f) => String(f.id) === selectedFaculty);
        } else if (reportType === 'top') {
            list = [...list]
                .filter((f) => f.compliance_rate >= 100)
                .sort((a, b) => b.on_time_rate - a.on_time_rate);
        } else if (reportType === 'program' && selectedProgram !== 'all') {
            list = list.filter((f) => f.program.toLowerCase() === selectedProgram.toLowerCase());
        }

        return list;
    }, [faculties, reportType, selectedProgram, selectedFaculty, selectedStatus]);

    // Summary Totals
    const summaryTotals = useMemo(() => {
        const totalFaculty = previewRows.length;
        const totalReqs = previewRows.reduce((acc, curr) => acc + curr.total_requirements, 0);
        const totalComplied = previewRows.reduce((acc, curr) => acc + curr.complied, 0);
        const totalOnTime = previewRows.reduce((acc, curr) => acc + curr.on_time, 0);
        const totalLate = previewRows.reduce((acc, curr) => acc + curr.late, 0);
        const totalOverdue = previewRows.reduce((acc, curr) => acc + curr.overdue, 0);

        const overallCompliance = totalReqs > 0 ? ((totalComplied / totalReqs) * 100).toFixed(1) : '100';
        const overallOnTime = totalReqs > 0 ? ((totalOnTime / totalReqs) * 100).toFixed(2) : '66.67';

        return {
            totalFaculty,
            totalReqs,
            totalComplied,
            totalOnTime,
            totalLate,
            totalOverdue,
            overallCompliance,
            overallOnTime,
        };
    }, [previewRows]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Faculty Performance Report" />

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    .no-print, nav, header, aside, .sidebar, [data-sidebar="sidebar"] {
                        display: none !important;
                    }
                    body, main {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-page-target {
                        display: block !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        transform: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                }
            `}</style>

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                {/* 1. TOP HEADER */}
                <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground">
                            Generate Faculty Performance Report
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Configure the report settings and preview the faculty performance report before generating and printing.
                        </p>
                    </div>

                    <Link
                        href="/performance/faculty"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Faculty Performance</span>
                    </Link>
                </div>

                {/* 2. MAIN 2-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: 5-STEP CONFIGURATION FORM */}
                    <div className="no-print lg:col-span-5 space-y-6">
                        {/* STEP 1: REPORT TYPE */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                    1
                                </span>
                                <h3 className="font-bold text-sm text-foreground">
                                    Report Type
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-1 ml-8">
                                Select the type of faculty performance report to generate.
                            </p>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {/* Option 1: Individual Faculty */}
                                <button
                                    type="button"
                                    onClick={() => setReportType('individual')}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col gap-2",
                                        reportType === 'individual'
                                            ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400"
                                            : "border-border bg-card hover:border-amber-400/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center",
                                            reportType === 'individual'
                                                ? "border-amber-500 bg-amber-500"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {reportType === 'individual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xs text-foreground block">
                                            Individual Faculty
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                                            Performance report for a specific faculty member.
                                        </span>
                                    </div>
                                </button>

                                {/* Option 2: Program Summary */}
                                <button
                                    type="button"
                                    onClick={() => setReportType('program')}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col gap-2",
                                        reportType === 'program'
                                            ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400"
                                            : "border-border bg-card hover:border-amber-400/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center",
                                            reportType === 'program'
                                                ? "border-amber-500 bg-amber-500"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {reportType === 'program' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xs text-foreground block">
                                            Program Summary
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                                            Summary report for a specific program.
                                        </span>
                                    </div>
                                </button>

                                {/* Option 3: Consolidated Faculty Performance */}
                                <button
                                    type="button"
                                    onClick={() => setReportType('consolidated')}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col gap-2",
                                        reportType === 'consolidated'
                                            ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400"
                                            : "border-border bg-card hover:border-amber-400/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center",
                                            reportType === 'consolidated'
                                                ? "border-amber-500 bg-amber-500"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {reportType === 'consolidated' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xs text-foreground block">
                                            Consolidated Faculty Performance
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                                            Overall performance of all faculty members.
                                        </span>
                                    </div>
                                </button>

                                {/* Option 4: Top Performers */}
                                <button
                                    type="button"
                                    onClick={() => setReportType('top')}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col gap-2",
                                        reportType === 'top'
                                            ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400"
                                            : "border-border bg-card hover:border-amber-400/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                            <Star className="w-4 h-4" />
                                        </div>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center",
                                            reportType === 'top'
                                                ? "border-amber-500 bg-amber-500"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {reportType === 'top' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xs text-foreground block">
                                            Top Performers
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                                            List of faculty with highest performance rates.
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* STEP 2: REPORTING PERIOD */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                    2
                                </span>
                                <h3 className="font-bold text-sm text-foreground">
                                    Reporting Period
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-1 ml-8">
                                Select the academic period for the report.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Academic Year
                                    </label>
                                    <select
                                        value={selectedAY}
                                        onChange={(e) => setSelectedAY(e.target.value)}
                                        className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                    >
                                        <option value="2026 - 2027">2026 - 2027</option>
                                        <option value="2025 - 2026">2025 - 2026</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                        className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Custom Date Range (Optional)
                                    </label>
                                    <div className="relative">
                                        <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="text"
                                            value={customDateRange}
                                            onChange={(e) => setCustomDateRange(e.target.value)}
                                            placeholder="Select date range"
                                            className="h-10 pl-9 pr-3 text-xs rounded-xl border border-border bg-card text-foreground w-full placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: FILTERS */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                    3
                                </span>
                                <h3 className="font-bold text-sm text-foreground">
                                    Filters
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-1 ml-8">
                                Apply filters to narrow down the report data.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Program
                                    </label>
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                        className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                    >
                                        <option value="all">All Programs</option>
                                        {programs.map((p) => (
                                            <option key={p.id} value={p.code}>
                                                {p.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Faculty
                                    </label>
                                    <select
                                        value={selectedFaculty}
                                        onChange={(e) => setSelectedFaculty(e.target.value)}
                                        className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                    >
                                        <option value="all">All Faculty Members</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={String(f.id)}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="top">Top Performers</option>
                                        <option value="good">Good Standing</option>
                                        <option value="overdue">With Overdue</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* STEP 4: SIGNATORIES */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                    4
                                </span>
                                <h3 className="font-bold text-sm text-foreground">
                                    Signatories
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-1 ml-8">
                                Specify the signatories for the report.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                {/* Prepared by */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-muted-foreground block">
                                        Prepared by
                                    </label>
                                        <select
                                            value={signatories.preparedName}
                                            onChange={(e) => setSignatories({ ...signatories, preparedName: e.target.value })}
                                            className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                        >
                                            {faculties.map((f) => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                            {faculties.length === 0 && (
                                                <option value="CIDS Program Chair">CIDS Program Chair</option>
                                            )}
                                        </select>
                                        <input
                                            type="text"
                                            value={signatories.preparedTitle}
                                            onChange={(e) => setSignatories({ ...signatories, preparedTitle: e.target.value })}
                                            className="h-8 px-2.5 text-[11px] rounded-lg border border-border bg-muted/40 text-muted-foreground w-full"
                                        />
                                    </div>

                                    {/* Verified by */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-muted-foreground block">
                                            Verified by
                                        </label>
                                        <select
                                            value={signatories.verifiedName}
                                            onChange={(e) => setSignatories({ ...signatories, verifiedName: e.target.value })}
                                            className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                        >
                                            {faculties.map((f) => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                            {faculties.length === 0 && (
                                                <option value="Academic Coordinator">Academic Coordinator</option>
                                            )}
                                        </select>
                                        <input
                                            type="text"
                                            value={signatories.verifiedTitle}
                                            onChange={(e) => setSignatories({ ...signatories, verifiedTitle: e.target.value })}
                                            className="h-8 px-2.5 text-[11px] rounded-lg border border-border bg-muted/40 text-muted-foreground w-full"
                                        />
                                    </div>

                                    {/* Noted by */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-muted-foreground block">
                                            Noted by
                                        </label>
                                        <select
                                            value={signatories.notedName}
                                            onChange={(e) => setSignatories({ ...signatories, notedName: e.target.value })}
                                            className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground w-full cursor-pointer"
                                        >
                                            {faculties.map((f) => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                            <option value="College Dean">College Dean</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={signatories.notedTitle}
                                            onChange={(e) => setSignatories({ ...signatories, notedTitle: e.target.value })}
                                            className="h-8 px-2.5 text-[11px] rounded-lg border border-border bg-muted/40 text-muted-foreground w-full"
                                        />
                                </div>
                            </div>
                        </div>

                        {/* STEP 5: ADDITIONAL OPTIONS */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                    5
                                </span>
                                <h3 className="font-bold text-sm text-foreground">
                                    Additional Options
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-1 ml-8">
                                Include additional information in the report.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={options.includeRankings}
                                        onCheckedChange={(checked) => setOptions({ ...options, includeRankings: Boolean(checked) })}
                                        className="border-muted-foreground data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                        Include rankings (for Top Performers report)
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={options.includeCharts}
                                        onCheckedChange={(checked) => setOptions({ ...options, includeCharts: Boolean(checked) })}
                                        className="border-muted-foreground data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                        Include charts and visualizations
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={options.includeRemarks}
                                        onCheckedChange={(checked) => setOptions({ ...options, includeRemarks: Boolean(checked) })}
                                        className="border-muted-foreground data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                        Include remarks
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={options.includeDetailedRecords}
                                        onCheckedChange={(checked) => setOptions({ ...options, includeDetailedRecords: Boolean(checked) })}
                                        className="border-muted-foreground data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                        Include detailed faculty records (per requirement)
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* BOTTOM ACTION BUTTONS */}
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <Button
                                variant="outline"
                                onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
                                className="flex-1 h-11 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Preview Report</span>
                            </Button>

                            <Button
                                onClick={handlePrint}
                                className="flex-1 h-11 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-xs font-black"
                            >
                                <Printer className="w-4 h-4 text-slate-950" />
                                <span>Generate & Print Report</span>
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INTERACTIVE PDF SHEET VIEWER */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                        {/* 1. PDF VIEWER DARK TOOLBAR (Matches Mockup) */}
                        <div className="no-print w-full max-w-[800px] h-11 bg-slate-900 text-slate-200 rounded-t-xl px-4 flex items-center justify-between text-xs font-semibold shadow-md border-b border-slate-800">
                            {/* Page count */}
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">1 / 1</span>
                            </div>

                            {/* Center: Zoom controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-xs w-12 text-center text-slate-300">
                                    {zoomLevel}%
                                </span>
                                <button
                                    onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Right actions: Download & Print */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Download as PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Print"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setZoomLevel(100)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                                    title="Reset Fit"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* 2. THE OFFICIAL WHITE PAPER SHEET (MATCHES ATTACHED SCREENSHOT EXACTLY) */}
                        <div className="w-full overflow-x-auto flex justify-center py-4 bg-muted/40 rounded-b-xl border border-border border-t-0">
                            <div
                                className="print-page-target bg-white text-slate-900 shadow-2xl transition-transform origin-top w-full max-w-[800px] min-h-[1050px] p-8 sm:p-12 relative flex flex-col justify-between"
                                style={{ transform: `scale(${zoomLevel / 100})` }}
                            >
                                {/* DOCUMENT CONTENT */}
                                <div className="space-y-6">
                                    {/* 1. OFFICIAL DSSC HEADER */}
                                    <div className="flex flex-col items-center text-center space-y-1">
                                        {/* DSSC Logo */}
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center p-1 mb-1">
                                            <img
                                                src="/dssc-logo.png"
                                                alt="DSSC Logo"
                                                className="w-full h-full object-contain"
                                                onError={(e: any) => {
                                                    // Fallback image if logo is unavailable
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>

                                        <p className="text-[11px] uppercase tracking-wider text-slate-600 font-medium">
                                            Republic of the Philippines
                                        </p>
                                        <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                                            DAVAO DEL SUR STATE COLLEGE
                                        </h2>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            COLLEGE OF INFORMATION AND DIGITAL SCIENCES
                                        </h3>
                                        <p className="text-[10px] text-slate-500">
                                            Brgy. Matti, Digos City, Davao del Sur 8002
                                        </p>
                                    </div>

                                    {/* 2. REPORT TITLE & BANNER */}
                                    <div className="text-center pt-2 pb-1 border-t border-b border-slate-200">
                                        <h1 className="text-sm font-black tracking-wider text-slate-900 uppercase">
                                            {reportType === 'top'
                                                ? 'TOP PERFORMING FACULTY REPORT'
                                                : reportType === 'program'
                                                ? `FACULTY PERFORMANCE SUMMARY REPORT (${selectedProgram.toUpperCase()})`
                                                : 'FACULTY PERFORMANCE SUMMARY REPORT'}
                                        </h1>
                                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                                            AY {selectedAY} | {selectedSemester}
                                        </p>
                                    </div>

                                    {/* 3. REPORT METADATA */}
                                    <div className="grid grid-cols-2 text-[10px] text-slate-700 py-1">
                                        <div className="space-y-0.5">
                                            <div className="flex">
                                                <span className="w-28 font-bold text-slate-900">Report No.</span>
                                                <span>: CIDS-FPR-2026-001</span>
                                            </div>
                                            <div className="flex">
                                                <span className="w-28 font-bold text-slate-900">Generated On</span>
                                                <span>: {new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="w-28 font-bold text-slate-900">Reporting Period</span>
                                                <span>: AY {selectedAY}, {selectedSemester}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="w-28 font-bold text-slate-900">Source</span>
                                                <span>: CIDS OfficeHub – Faculty Performance Monitoring System</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. PERFORMANCE SUMMARY TABLE (MATCHES MOCKUP TABLE EXACTLY) */}
                                    <div className="border border-slate-300 rounded overflow-hidden">
                                        <table className="w-full text-[10px] text-slate-800 border-collapse">
                                            <thead>
                                                <tr className="bg-amber-100/70 border-b border-slate-300 font-bold text-slate-900">
                                                    <th className="py-1.5 px-2 text-left border-r border-slate-300 w-8">No.</th>
                                                    <th className="py-1.5 px-3 text-left border-r border-slate-300">Faculty Name</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Program</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Requirements</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Complied</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">On Time</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Late</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Overdue</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">Compliance Rate</th>
                                                    <th className="py-1.5 px-2 text-center">On-Time Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 font-medium">
                                                {previewRows.map((f, i) => (
                                                    <tr key={f.id} className="hover:bg-slate-50">
                                                        <td className="py-1.5 px-2 text-left border-r border-slate-200 text-slate-500 font-mono">
                                                            {i + 1}
                                                        </td>
                                                        <td className="py-1.5 px-3 font-bold border-r border-slate-200 text-slate-900">
                                                            {f.name}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200 font-semibold">
                                                            {f.program}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                                                            {f.total_requirements}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200 font-semibold text-emerald-700">
                                                            {f.complied}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200 font-semibold text-sky-700">
                                                            {f.on_time}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                                                            {f.late}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                                                            {f.overdue}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold">
                                                            {f.compliance_rate}%
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center font-bold">
                                                            {f.on_time_rate}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 5. SUMMARY ROW CARD (Matches Mockup) */}
                                    <div className="border border-slate-300 rounded overflow-hidden">
                                        <div className="bg-amber-100/70 border-b border-slate-300 py-1 px-3 text-center font-bold text-[10px] text-slate-900">
                                            Summary
                                        </div>
                                        <div className="grid grid-cols-8 divide-x divide-slate-200 text-center text-[10px]">
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total Faculty Members</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalFaculty}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total Requirements</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalReqs}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total Complied</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalComplied}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total On-Time</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalOnTime}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total Late</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalLate}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Total Overdue</div>
                                                <div className="font-bold text-slate-900 mt-0.5">{summaryTotals.totalOverdue}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Overall Compliance Rate</div>
                                                <div className="font-bold text-emerald-700 mt-0.5">{summaryTotals.overallCompliance}%</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[9px] text-slate-500 font-semibold">Overall On-Time Rate</div>
                                                <div className="font-bold text-sky-700 mt-0.5">{summaryTotals.overallOnTime}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. REMARKS */}
                                    {options.includeRemarks && (
                                        <div className="text-[10px] text-slate-700 space-y-1 pt-1">
                                            <p className="font-bold text-slate-900">Remarks:</p>
                                            <p className="leading-relaxed">
                                                This report presents the faculty performance based on the submitted requirements for AY {selectedAY}, {selectedSemester}.
                                                All faculty members are compliant with the required submissions. Further monitoring is recommended for those with late submissions to improve on-time compliance.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 7. OFFICIAL SIGNATORIES SECTION (At bottom of paper sheet) */}
                                <div className="pt-8 mt-6 border-t border-slate-200">
                                    <div className="grid grid-cols-3 gap-6 text-[10px] text-slate-800 text-center">
                                        {/* Prepared by */}
                                        <div className="space-y-4">
                                            <p className="text-left font-bold text-slate-900">Prepared by:</p>
                                            {/* Stylized official signature stroke */}
                                            <div className="h-10 flex items-center justify-center italic font-serif text-slate-600 text-sm select-none">
                                                ~ C. Reyes ~
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase border-t border-slate-400 pt-1 tracking-wider">
                                                    {signatories.preparedName}
                                                </p>
                                                <p className="text-[9px] text-slate-600">
                                                    {signatories.preparedTitle}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-2 text-left">
                                                    Date: ____________________
                                                </p>
                                            </div>
                                        </div>

                                        {/* Verified by */}
                                        <div className="space-y-4">
                                            <p className="text-left font-bold text-slate-900">Verified by:</p>
                                            {/* Stylized official signature stroke */}
                                            <div className="h-10 flex items-center justify-center italic font-serif text-slate-600 text-sm select-none">
                                                ~ A. Santos ~
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase border-t border-slate-400 pt-1 tracking-wider">
                                                    {signatories.verifiedName}
                                                </p>
                                                <p className="text-[9px] text-slate-600">
                                                    {signatories.verifiedTitle}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-2 text-left">
                                                    Date: ____________________
                                                </p>
                                            </div>
                                        </div>

                                        {/* Noted by */}
                                        <div className="space-y-4">
                                            <p className="text-left font-bold text-slate-900">Noted by:</p>
                                            {/* Stylized official signature stroke */}
                                            <div className="h-10 flex items-center justify-center italic font-serif text-slate-600 text-sm select-none">
                                                ~ E. Villanueva ~
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase border-t border-slate-400 pt-1 tracking-wider">
                                                    {signatories.notedName}
                                                </p>
                                                <p className="text-[9px] text-slate-600">
                                                    {signatories.notedTitle}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-2 text-left">
                                                    Date: ____________________
                                                </p>
                                            </div>
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
