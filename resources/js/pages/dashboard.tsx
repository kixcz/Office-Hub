import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    CheckSquare,
    Calendar,
    FlaskConical,
    Sprout,
    Users,
    TrendingUp,
    ChevronDown,
    MoreVertical,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Eye,
    Download,
    Printer,
    SlidersHorizontal,
    Info,
    CalendarDays,
    Building2,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    user_role?: 'Program Head' | 'Dean' | 'Super Admin' | string;
    program_name?: string | null;
    program_code?: string | null;
    action_required?: {
        pending_make_ups: number;
        overdue_outputs: number;
        unconfirmed_exams: number;
        schedule_flags: number;
        pending_accomplishments: number;
    };
    filters: {
        period_id: number;
        academic_year: string;
        semester: string;
        program_id: string;
        faculty_id: string;
        start_date: string;
        end_date: string;
        compare_previous: boolean;
    };
    available_periods: Array<{
        id: number;
        label: string;
        academic_year: string;
        semester: string;
        is_current: boolean;
    }>;
    available_programs: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    available_faculties: Array<{
        id: number;
        first_name: string;
        last_name: string;
        academic_rank: string;
        program_id: number;
    }>;
    kpis: {
        compliance_rate: number;
        compliance_trend: string;
        compliance_fraction: string;
        attendance_rate: number;
        attendance_trend: string;
        attendance_low_count: number;
        tasks_completed: number;
        tasks_total: number;
        tasks_in_progress: number;
        tasks_overdue: number;
        tasks_rate: number;
        events_meetings: number;
        events_meetings_trend: string;
        research_active: number;
        extension_active: number;
        total_faculty: number;
        all_programs_avg?: number;
    };
    productivity_by_program: Array<{
        id: number;
        code: string;
        name: string;
        rate: number;
    }>;
    all_programs_avg?: number;
    metrics_distribution: {
        total_faculty: number;
        compliance: {
            compliant: number;
            compliant_pct: number;
            minor_issues: number;
            minor_issues_pct: number;
            needs_attention: number;
            needs_attention_pct: number;
            non_compliant: number;
            non_compliant_pct: number;
        };
        attendance: {
            compliant: number;
            compliant_pct: number;
            minor_issues: number;
            minor_issues_pct: number;
            needs_attention: number;
            needs_attention_pct: number;
            non_compliant: number;
            non_compliant_pct: number;
        };
        tasks: {
            compliant: number;
            compliant_pct: number;
            minor_issues: number;
            minor_issues_pct: number;
            needs_attention: number;
            needs_attention_pct: number;
            non_compliant: number;
            non_compliant_pct: number;
        };
    };
    trend_data?: Array<{
        month: string;
        attendance: number;
        compliance: number;
        tasks: number;
        research_extension: number;
    }>;
    weekly_attendance_rates?: number[];
    recent_research_extension_activities?: Array<{
        title: string;
        type: string;
        date: string;
    }>;
    faculty_needs_attention: Array<{
        id: number;
        faculty_id: number;
        name: string;
        program: string;
        issue: string;
        issue_type: string;
        severity: string;
        details: string;
        status: string;
    }>;
    upcoming_activities: Array<{
        date_time: string;
        title: string;
        type: string;
        location: string;
        participants: string;
    }>;
    last_sync: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function SuperAdminDashboard({
    user_role = 'Super Admin',
    program_name,
    program_code,
    action_required,
    filters,
    available_periods = [],
    available_programs = [],
    available_faculties = [],
    kpis,
    productivity_by_program = [],
    all_programs_avg,
    metrics_distribution,
    trend_data = [],
    weekly_attendance_rates = [],
    recent_research_extension_activities = [],
    faculty_needs_attention = [],
    upcoming_activities = [],
    last_sync,
}: Props) {
    const isProgramHead = user_role === 'Program Head';
    const isDean = user_role === 'Dean';

    const [periodId, setPeriodId] = useState(filters.period_id);
    const [programId, setProgramId] = useState(filters.program_id);
    const [facultyId, setFacultyId] = useState(filters.faculty_id);
    const [distributionTab, setDistributionTab] = useState<'Compliance' | 'Attendance' | 'Tasks'>('Compliance');
    const [reportModalOpen, setReportModalOpen] = useState(false);

    // Keep state in sync with filters prop whenever page is refreshed or filtered
    React.useEffect(() => {
        setPeriodId(filters.period_id);
        setProgramId(filters.program_id);
        setFacultyId(filters.faculty_id);
    }, [filters.period_id, filters.program_id, filters.faculty_id]);

    const activePeriod = available_periods.find((p) => p.id === Number(periodId)) || available_periods[0];
    const academicYear = activePeriod?.academic_year || filters.academic_year || '2026-2027';
    const semester = activePeriod?.semester || filters.semester || '1st Semester';
    const dateRange = `${filters.start_date} – ${filters.end_date}`;

    // Unique academic years and semesters from available_periods
    const uniqueAcademicYears = Array.from(new Set(available_periods.map((p) => p.academic_year)));
    const semestersForCurrentYear = available_periods
        .filter((p) => p.academic_year === academicYear)
        .map((p) => p.semester);

    const computedAverage =
        all_programs_avg ??
        kpis?.all_programs_avg ??
        (productivity_by_program.length > 0
            ? Math.round(
                  productivity_by_program.reduce((acc, curr) => acc + (curr.rate || 0), 0) /
                      productivity_by_program.length
              )
            : 86);

    // Apply filters
    const handleFilterChange = (updates: Partial<typeof filters>) => {
        router.get(
            '/dashboard',
            {
                period_id: updates.period_id ?? periodId,
                program_id: updates.program_id ?? programId,
                faculty_id: updates.faculty_id ?? facultyId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleAcademicYearChange = (year: string) => {
        const matchingPeriod = available_periods.find((p) => p.academic_year === year && p.semester === semester)
            || available_periods.find((p) => p.academic_year === year)
            || available_periods[0];

        if (matchingPeriod) {
            setPeriodId(matchingPeriod.id);
            handleFilterChange({ period_id: matchingPeriod.id });
        }
    };

    const handleSemesterChange = (sem: string) => {
        const matchingPeriod = available_periods.find((p) => p.academic_year === academicYear && p.semester === sem)
            || available_periods.find((p) => p.semester === sem)
            || available_periods[0];

        if (matchingPeriod) {
            setPeriodId(matchingPeriod.id);
            handleFilterChange({ period_id: matchingPeriod.id });
        }
    };

    // Helper to build smooth SVG path through data points (viewBox 500 x 180)
    // Points at X = [50, 150, 250, 350, 450]
    // Y mapped from rate (0% -> 155, 100% -> 25)
    const buildTrendPath = (dataPoints: number[]) => {
        const xs = [50, 150, 250, 350, 450];
        const points = dataPoints.map((val, i) => {
            const clamped = Math.max(0, Math.min(100, val ?? 0));
            const y = 155 - (clamped / 100) * 130;
            return { x: xs[i] ?? 50, y: Math.round(y * 10) / 10 };
        });

        if (points.length < 2) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX = (p0.x + p1.x) / 2;
            d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    // Helper to build sparkline path for Attendance Rate card (viewBox 300 x 60)
    const buildSparklinePath = (rates: number[] = []) => {
        if (!rates || rates.length === 0) return 'M 10 40 Q 60 25 120 35 T 290 20';
        const startX = 15;
        const endX = 285;
        const stepX = (endX - startX) / Math.max(1, rates.length - 1);
        const points = rates.map((r, i) => {
            const clamped = Math.max(0, Math.min(100, r));
            const y = 52 - (clamped / 100) * 44;
            return { x: Math.round((startX + i * stepX) * 10) / 10, y: Math.round(y * 10) / 10 };
        });

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX = (p0.x + p1.x) / 2;
            d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    // Active Category for Key Metrics Distribution
    const activeCategoryKey = (distributionTab.toLowerCase() as 'compliance' | 'attendance' | 'tasks');
    const currentDistribution = metrics_distribution?.[activeCategoryKey] || metrics_distribution?.compliance || {
        compliant: 0,
        compliant_pct: 0,
        minor_issues: 0,
        minor_issues_pct: 0,
        needs_attention: 0,
        needs_attention_pct: 0,
        non_compliant: 0,
        non_compliant_pct: 0,
    };

    // Calculate circumference for Donut chart: r = 40 => circumference = 2 * PI * 40 ~= 251.32
    const donutCircumference = 2 * Math.PI * 40;
    const compliantDash = (currentDistribution.compliant_pct / 100) * donutCircumference;
    const minorDash = (currentDistribution.minor_issues_pct / 100) * donutCircumference;
    const needsAttnDash = (currentDistribution.needs_attention_pct / 100) * donutCircumference;
    const nonCompliantDash = (currentDistribution.non_compliant_pct / 100) * donutCircumference;

    const minorOffset = -compliantDash;
    const needsAttnOffset = -(compliantDash + minorDash);
    const nonCompliantOffset = -(compliantDash + minorDash + needsAttnDash);

    const dashboardTitle = isProgramHead
        ? `${program_code || 'Program'} Operational Command Center`
        : isDean
        ? 'College Executive Oversight Dashboard'
        : 'Institutional Performance Dashboard';

    const dashboardSubtitle = isProgramHead
        ? `Operational command workspace for ${program_name || 'your academic program'}. Monitor program faculty, attendance, compliance outputs, make-up classes, exam schedules, and scheduling reviews.`
        : isDean
        ? 'College-wide executive oversight across all programs: compliance rates, workload equity, timetable endorsements, make-up class approvals, and institutional performance.'
        : 'Live overview of compliance, attendance, productivity, schedules, meetings, research, extension, and faculty activity for the selected academic period.';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${dashboardTitle} - CIDS OfficeHub`} />

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1600px] mx-auto font-sans">
                {/* 1. Header with Compact Persistent Filters Row */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {dashboardTitle}
                                </h1>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    isProgramHead
                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        : isDean
                                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}>
                                    {user_role}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                                {dashboardSubtitle}
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mt-1.5">
                                <span>🎓 AY {academicYear} • {semester}</span>
                                {program_code && (
                                    <>
                                        <span>•</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-extrabold">{program_code}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Academic Year */}
                        <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-muted-foreground mb-1">Academic Year</span>
                            <div className="relative">
                                <select
                                    value={academicYear}
                                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                                    className="appearance-none bg-background border border-border text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 hover:border-slate-400 cursor-pointer focus:ring-1 focus:ring-amber-500 shadow-2xs"
                                >
                                    {uniqueAcademicYears.map((ay) => (
                                        <option key={ay} value={ay}>
                                            {ay}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Semester */}
                        <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-muted-foreground mb-1">Semester</span>
                            <div className="relative">
                                <select
                                    value={semester}
                                    onChange={(e) => handleSemesterChange(e.target.value)}
                                    className="appearance-none bg-background border border-border text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 hover:border-slate-400 cursor-pointer focus:ring-1 focus:ring-amber-500 shadow-2xs"
                                >
                                    {(semestersForCurrentYear.length > 0 ? semestersForCurrentYear : ['1st Semester', '2nd Semester']).map((sem) => (
                                        <option key={sem} value={sem}>
                                            {sem}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Program */}
                        <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-muted-foreground mb-1">Program</span>
                            <div className="relative">
                                <select
                                    value={programId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setProgramId(val);
                                        setFacultyId('all');
                                        handleFilterChange({ program_id: val, faculty_id: 'all' });
                                    }}
                                    className="appearance-none bg-background border border-border text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 hover:border-slate-400 cursor-pointer focus:ring-1 focus:ring-amber-500 shadow-2xs"
                                >
                                    <option value="all">All Programs</option>
                                    {available_programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Faculty Filter */}
                        <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-muted-foreground mb-1">Faculty</span>
                            <div className="relative">
                                <select
                                    value={facultyId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFacultyId(val);
                                        handleFilterChange({ faculty_id: val });
                                    }}
                                    className="appearance-none bg-background border border-border text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 hover:border-slate-400 cursor-pointer focus:ring-1 focus:ring-amber-500 shadow-2xs max-w-[150px] truncate"
                                >
                                    <option value="all">College-Wide</option>
                                    {available_faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.last_name}, {f.first_name[0]}.
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Range Badge */}
                        <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-muted-foreground mb-1">Reporting Date Range</span>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/30 text-xs font-semibold text-foreground">
                                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{dateRange}</span>
                            </div>
                        </div>

                        {/* Generate Report Button */}
                        <div className="flex flex-col text-[11px] self-end">
                            <span className="invisible mb-1">Report</span>
                            <Link
                                href="/performance/faculty/report"
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Report</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Compact Action Required / For Your Review Operational Hub */}
                <div className="bg-card rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-card to-card p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                !
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                                    {isProgramHead
                                        ? 'Action Required — Program Oversight Queue'
                                        : isDean
                                        ? 'For Your Review — College Executive Approvals'
                                        : 'Priority Action Center'}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {isProgramHead
                                        ? 'Items requiring your immediate verification, endorsement, or follow-up before deadlines.'
                                        : isDean
                                        ? 'College-wide submissions, schedule endorsements, and make-up classes awaiting final executive action.'
                                        : 'Direct links to records requiring administrative review and intervention.'}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                            Requires Immediate Attention
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <Link
                            href="/compliance/pending-outputs"
                            className="flex flex-col p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors group"
                        >
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                Overdue Deliverables
                            </span>
                            <span className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                                {action_required?.overdue_outputs ?? 3} Outputs
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1 font-semibold">
                                TOS & Syllabi pending <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </Link>

                        <Link
                            href="/operations/make-up-classes"
                            className="flex flex-col p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors group"
                        >
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                Make-Up Classes
                            </span>
                            <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">
                                {action_required?.pending_make_ups ?? 2} Pending
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1 font-semibold">
                                {isProgramHead ? 'Endorsement needed' : 'Awaiting approval'} <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </Link>

                        <Link
                            href="/operations/exam-monitoring"
                            className="flex flex-col p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group"
                        >
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                Unconfirmed Exams
                            </span>
                            <span className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1">
                                {action_required?.unconfirmed_exams ?? 4} Exams
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1 font-semibold">
                                Passed exam date <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </Link>

                        <Link
                            href="/schedule/reviews?tab=flags"
                            className="flex flex-col p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors group"
                        >
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                Schedule Flags
                            </span>
                            <span className="text-xl font-black text-purple-700 dark:text-purple-400 mt-1">
                                {action_required?.schedule_flags ?? 2} Flags
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1 font-semibold">
                                {isProgramHead ? '1 Blocking flag open' : 'College flags to review'} <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </Link>

                        <Link
                            href="/accomplishments"
                            className="flex flex-col p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
                        >
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                Accomplishments
                            </span>
                            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                {action_required?.pending_accomplishments ?? 4} For Review
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1 font-semibold">
                                Validate evidence <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* 2. Top Metric Cards Row (6 Metric Cards matching design) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Compliance Rate */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Compliance Rate</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.compliance_rate}%
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {kpis.compliance_trend}
                            </div>
                        </div>
                    </div>

                    {/* Overall Attendance Rate */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Overall Attendance Rate</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.attendance_rate}%
                            </div>
                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {kpis.attendance_trend}
                            </div>
                        </div>
                    </div>

                    {/* Tasks Completed */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Tasks Completed</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.tasks_completed} <span className="text-sm font-semibold text-muted-foreground">/ {kpis.tasks_total}</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full rounded-full"
                                    style={{ width: `${kpis.tasks_rate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Events & Meetings */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Events & Meetings</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.events_meetings}
                            </div>
                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                                {kpis.events_meetings_trend}
                            </div>
                        </div>
                    </div>

                    {/* Research Involvement */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Research Involvement</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.research_active}
                            </div>
                            <div className="text-[11px] font-semibold text-muted-foreground mt-1">
                                Active projects
                            </div>
                        </div>
                    </div>

                    {/* Extension Involvement */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                                <Sprout className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground">Extension Involvement</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.extension_active}
                            </div>
                            <div className="text-[11px] font-semibold text-muted-foreground mt-1">
                                Active programs
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Middle Section: College-Wide Productivity Line Chart | Key Metrics Distribution Donut | Productivity by Program Bars */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* College-Wide Productivity Trends (5 cols) */}
                    <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">College-Wide Productivity</h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        Overall productivity based on compliance, attendance, research, extension, and tasks.
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                                    This Semester
                                </span>
                            </div>

                            {/* SVG Multi-Line Chart representing trends */}
                            <div className="mt-5 space-y-3">
                                <div className="h-44 w-full relative">
                                    <svg className="w-full h-full" viewBox="0 0 500 180" fill="none">
                                        {/* Horizontal grid lines */}
                                        <line x1="30" y1="20" x2="490" y2="20" stroke="currentColor" strokeOpacity="0.1" />
                                        <line x1="30" y1="60" x2="490" y2="60" stroke="currentColor" strokeOpacity="0.1" />
                                        <line x1="30" y1="100" x2="490" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                                        <line x1="30" y1="140" x2="490" y2="140" stroke="currentColor" strokeOpacity="0.1" />

                                        {/* Y-axis labels */}
                                        <text x="5" y="24" fontSize="10" fill="currentColor" opacity="0.4">100%</text>
                                        <text x="5" y="64" fontSize="10" fill="currentColor" opacity="0.4">75%</text>
                                        <text x="5" y="104" fontSize="10" fill="currentColor" opacity="0.4">50%</text>
                                        <text x="5" y="144" fontSize="10" fill="currentColor" opacity="0.4">25%</text>

                                        {/* Lines generated dynamically from DB trend_data */}
                                        {/* Attendance (Blue) */}
                                        <path
                                            d={buildTrendPath((trend_data || []).map((t) => t.attendance))}
                                            stroke="#3b82f6"
                                            strokeWidth="2.5"
                                            fill="none"
                                        />
                                        {/* Compliance (Emerald) */}
                                        <path
                                            d={buildTrendPath((trend_data || []).map((t) => t.compliance))}
                                            stroke="#10b981"
                                            strokeWidth="2.5"
                                            fill="none"
                                        />
                                        {/* Tasks (Purple) */}
                                        <path
                                            d={buildTrendPath((trend_data || []).map((t) => t.tasks))}
                                            stroke="#a855f7"
                                            strokeWidth="2.5"
                                            fill="none"
                                        />
                                        {/* Research/Extension (Amber) */}
                                        <path
                                            d={buildTrendPath((trend_data || []).map((t) => t.research_extension))}
                                            stroke="#f59e0b"
                                            strokeWidth="2.5"
                                            fill="none"
                                        />
                                    </svg>
                                </div>

                                {/* Month labels */}
                                <div className="flex justify-between px-6 text-[10px] font-bold text-muted-foreground uppercase">
                                    {(trend_data && trend_data.length > 0 ? trend_data : [
                                        { month: 'Aug' }, { month: 'Sep' }, { month: 'Oct' }, { month: 'Nov' }, { month: 'Dec' }
                                    ]).map((t, idx) => (
                                        <span key={idx}>{t.month}</span>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-border/50 text-[11px] font-bold">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span>Compliance Rate</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                        <span>Attendance Rate</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                        <span>Tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <span>Research / Extension</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Distribution (3 cols) */}
                    <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Key Metrics Distribution</h3>
                                    <p className="text-[11px] text-muted-foreground">Faculty status breakdown.</p>
                                </div>
                                <select
                                    value={distributionTab}
                                    onChange={(e) => setDistributionTab(e.target.value as any)}
                                    className="bg-muted text-[11px] font-bold rounded-lg px-2 py-1 border-0 cursor-pointer"
                                >
                                    <option value="Compliance">Compliance</option>
                                    <option value="Attendance">Attendance</option>
                                    <option value="Tasks">Tasks</option>
                                </select>
                            </div>

                            <div className="mt-5 flex flex-col items-center">
                                {/* Dynamic SVG Donut */}
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        {/* Background Track */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="currentColor"
                                            className="text-muted/20"
                                            strokeWidth="12"
                                            fill="transparent"
                                        />
                                        {/* Compliant segment (Emerald) */}
                                        {currentDistribution.compliant_pct > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#10b981"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={`${compliantDash} ${donutCircumference}`}
                                                strokeDashoffset="0"
                                            />
                                        )}
                                        {/* Minor Issues segment (Amber) */}
                                        {currentDistribution.minor_issues_pct > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#f59e0b"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={`${minorDash} ${donutCircumference}`}
                                                strokeDashoffset={minorOffset}
                                            />
                                        )}
                                        {/* Needs Attention segment (Orange) */}
                                        {currentDistribution.needs_attention_pct > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#f97316"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={`${needsAttnDash} ${donutCircumference}`}
                                                strokeDashoffset={needsAttnOffset}
                                            />
                                        )}
                                        {/* Non-Compliant segment (Rose) */}
                                        {currentDistribution.non_compliant_pct > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#f43f5e"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={`${nonCompliantDash} ${donutCircumference}`}
                                                strokeDashoffset={nonCompliantOffset}
                                            />
                                        )}
                                    </svg>
                                    <div className="absolute text-center pointer-events-none">
                                        <div className="text-xl font-black text-foreground">
                                            {metrics_distribution?.total_faculty ?? 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-semibold">Faculty Members</div>
                                    </div>
                                </div>

                                <div className="w-full mt-6 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <span className="font-medium text-muted-foreground">Compliant</span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                            {currentDistribution.compliant} ({currentDistribution.compliant_pct}%)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            <span className="font-medium text-muted-foreground">Minor Issues</span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                            {currentDistribution.minor_issues} ({currentDistribution.minor_issues_pct}%)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                            <span className="font-medium text-muted-foreground">Needs Attention</span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                            {currentDistribution.needs_attention} ({currentDistribution.needs_attention_pct}%)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                            <span className="font-medium text-muted-foreground">Non-Compliant</span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                            {currentDistribution.non_compliant} ({currentDistribution.non_compliant_pct}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Productivity by Program Bars (4 cols) */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Productivity by Program</h3>
                                    <p className="text-[11px] text-muted-foreground">Program comparison metrics.</p>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                                    Compliance Rate
                                </span>
                            </div>

                            <div className="mt-5 space-y-4">
                                {productivity_by_program.map((p) => (
                                    <div key={p.code} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-foreground">{p.code}</span>
                                            <span className="font-mono font-bold text-foreground">{p.rate}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    p.code === 'BSIT'
                                                        ? 'bg-emerald-500'
                                                        : p.code === 'BSIS'
                                                        ? 'bg-teal-500'
                                                        : p.code === 'BSCS'
                                                        ? 'bg-blue-500'
                                                        : p.code === 'BSDS'
                                                        ? 'bg-sky-500'
                                                        : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${p.rate}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Average row */}
                                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-black">
                                    <span className="text-muted-foreground">All Programs (Avg)</span>
                                    <span className="text-emerald-600 font-mono">
                                        {computedAverage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Secondary Row: Attendance Rate Curve | Research & Extension Involvement | Tasks & Projects Radial */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Attendance Rate */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Attendance Rate</h3>
                                    <p className="text-[11px] text-muted-foreground">Faculty attendance for classes, meetings, and activities.</p>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                                    This Semester
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-black text-foreground">{kpis.attendance_rate}%</div>
                                    <div className="text-xs text-muted-foreground font-semibold">Overall Attendance</div>
                                    <div className="text-[11px] font-bold text-emerald-600 mt-0.5">{kpis.attendance_trend}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-rose-600">{kpis.attendance_low_count}</div>
                                    <div className="text-[11px] text-muted-foreground font-semibold">Absences Recorded</div>
                                    <Link
                                        href="/faculty-attendance"
                                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 justify-end mt-1"
                                    >
                                        View Details <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-4 h-16 w-full">
                                <svg className="w-full h-full text-blue-500" viewBox="0 0 300 60" fill="none">
                                    <path
                                        d={buildSparklinePath(weekly_attendance_rates || [])}
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Research & Extension Involvement */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Research & Extension Involvement</h3>
                                    <p className="text-[11px] text-muted-foreground">Active research and extension projects with faculty participation.</p>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                                    This Semester
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                                    <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                        {kpis.research_active}
                                    </div>
                                    <div className="text-xs font-bold text-foreground mt-0.5">Active Research Projects</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Current academic period</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                                    <div className="text-2xl font-black text-teal-700 dark:text-teal-300">
                                        {kpis.extension_active}
                                    </div>
                                    <div className="text-xs font-bold text-foreground mt-0.5">Active Extension Programs</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Current academic period</div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recent Engagements</div>
                                <div className="text-xs space-y-1.5 font-medium">
                                    {(recent_research_extension_activities && recent_research_extension_activities.length > 0) ? (
                                        recent_research_extension_activities.map((act, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${act.type === 'Research' ? 'bg-purple-500' : 'bg-teal-500'}`} />
                                                    <span className="truncate">{act.title}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{act.date}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground italic py-1">
                                            No active projects recorded for this selection.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks & Projects */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Tasks & Projects</h3>
                                    <p className="text-[11px] text-muted-foreground">Departmental task execution progress.</p>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                                    This Semester
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                                {/* Radial progress */}
                                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="currentColor"
                                            className="text-muted/20"
                                            strokeWidth="10"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="#10b981"
                                            strokeWidth="10"
                                            fill="transparent"
                                            strokeDasharray={`${(kpis.tasks_rate / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                                            strokeDashoffset="0"
                                        />
                                    </svg>
                                    <div className="absolute text-center pointer-events-none">
                                        <div className="text-lg font-black text-foreground">{kpis.tasks_rate}%</div>
                                        <div className="text-[8px] text-muted-foreground font-semibold uppercase">Completion</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-muted-foreground font-medium">Completed</span>
                                        </div>
                                        <span className="font-bold text-foreground">{kpis.tasks_completed}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-muted-foreground font-medium">In Progress</span>
                                        </div>
                                        <span className="font-bold text-foreground">{kpis.tasks_in_progress}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-muted-foreground font-medium">Overdue / Todo</span>
                                        </div>
                                        <span className="font-bold text-rose-600">{kpis.tasks_overdue}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border/60">
                                <Link
                                    href="/tasks"
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    View All Tasks <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Bottom Section: Faculty Needs Attention Table (Left) | Upcoming Activities (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Faculty Needs Attention (8 cols) */}
                    <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">Faculty Needs Attention</h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Prioritizes faculty with unresolved compliance, low attendance, overdue deliverables, or missing required records.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/performance/faculty"
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                        <tr>
                                            <th className="p-3 font-bold">#</th>
                                            <th className="p-3 font-bold">Faculty Name</th>
                                            <th className="p-3 font-bold">Program</th>
                                            <th className="p-3 font-bold">Issue</th>
                                            <th className="p-3 font-bold">Details</th>
                                            <th className="p-3 font-bold">Status</th>
                                            <th className="p-3 font-bold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 font-medium">
                                        {faculty_needs_attention.map((f, idx) => (
                                            <tr key={f.id} className="hover:bg-muted/30">
                                                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="p-3 font-bold text-foreground">{f.name}</td>
                                                <td className="p-3 text-muted-foreground font-semibold">{f.program}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        f.issue_type === 'attendance'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : f.issue_type === 'compliance'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : f.issue_type === 'workload'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        ● {f.issue}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{f.details}</td>
                                                <td className="p-3">
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                        {f.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Link
                                                        href={`/faculties/${f.faculty_id}`}
                                                        className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold hover:bg-muted inline-flex items-center gap-1 shadow-2xs"
                                                    >
                                                        <Eye className="w-3 h-3" /> View Dossier
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Activities (4 cols) */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-bold text-foreground">Upcoming Activities</h3>
                                </div>
                                <Link
                                    href="/schedule/calendar"
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="mt-4 space-y-3">
                                {upcoming_activities.map((a, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-blue-600 font-mono">
                                                {a.date_time}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                {a.type}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-foreground mt-1">{a.title}</h4>
                                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
                                            <span>Location: {a.location}</span>
                                            <span>{a.participants}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
