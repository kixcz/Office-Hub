import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    FolderKanban,
    GraduationCap,
    Layers,
    MapPin,
    Monitor,
    Projector,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Tv,
    Users,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CollegeMetric {
    id: number;
    code: string;
    name: string;
    dean_name: string;
    parent_entity: string;
    entity_code: string;
    faculty_count: number;
    program_count: number;
    attendance_rate: number;
    completion_rate: number;
    compliance_rate: number;
    room_utilization: number;
    overload_count: number;
    underload_count: number;
    research_count: number;
    extension_count: number;
    open_issues: number;
    scheduling: {
        status: string;
        stage: string;
        color: string;
    };
    status: 'On Track' | 'Needs Attention' | 'Critical';
    status_reason: string;
    color_theme: string;
    tv_channel_status: string;
}

interface ExecutiveAlert {
    id: string;
    severity: 'Critical' | 'Warning' | 'Info';
    title: string;
    entity: string;
    metric: string;
    trend: string;
    recommendation: string;
    link: string;
}

interface Props {
    period?: any;
    periods?: Array<{ id: number; academic_year: string; semester: string }>;
    entities?: Array<{ id: number; code: string; name: string }>;
    colleges?: Array<{ id: number; code: string; name: string }>;
    programs?: Array<{ id: number; code: string; name: string }>;
    kpis: {
        total_colleges: number;
        total_faculty: number;
        overall_attendance: number;
        instructional_completion: number;
        overall_compliance: number;
        facility_utilization: number;
        overloaded_faculty: number;
        underloaded_faculty: number;
        open_maintenance_issues: number;
        active_research_projects: number;
        active_extension_projects: number;
        critical_alerts: number;
        needs_attention_colleges: number;
    };
    collegeMetrics: Record<string, CollegeMetric>;
    executiveAlerts: ExecutiveAlert[];
    filters: {
        period_id: string | number;
        entity_id: string;
        college_id: string;
        program_id: string;
        start_date: string;
        end_date: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Institution Command Dashboard', href: '/vpaf/dashboard' },
];

export default function VpafDashboard({
    period,
    periods = [],
    entities = [],
    colleges = [],
    programs = [],
    kpis,
    collegeMetrics = {},
    executiveAlerts = [],
    filters,
}: Props) {
    const [periodFilter, setPeriodFilter] = useState(filters?.period_id ?? '');
    const [entityFilter, setEntityFilter] = useState(filters?.entity_id ?? 'All');
    const [collegeFilter, setCollegeFilter] = useState(filters?.college_id ?? 'All');
    const [programFilter, setProgramFilter] = useState(filters?.program_id ?? 'All');
    const [dateRangeStart, setDateRangeStart] = useState(filters?.start_date ?? '2026-08-10');
    const [dateRangeEnd, setDateRangeEnd] = useState(filters?.end_date ?? '2026-12-18');

    const collegeList = Object.values(collegeMetrics);

    const applyFilters = () => {
        router.get(
            '/vpaf/dashboard',
            {
                period_id: periodFilter,
                entity_id: entityFilter,
                college_id: collegeFilter,
                program_id: programFilter,
                start_date: dateRangeStart,
                end_date: dateRangeEnd,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const getStatusBadge = (status: CollegeMetric['status']) => {
        switch (status) {
            case 'On Track':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
            case 'Needs Attention':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            case 'Critical':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getAlertSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'Critical':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
            case 'Warning':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAF Executive Command Dashboard — Velora" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 bg-[#F7F7FB] p-4 md:p-6 dark:bg-background">
                {/* Executive Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-[#5B21B6]/30 bg-gradient-to-r from-[#1E0B4B] via-[#3B147A] to-[#2E1065] p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#DDD6FE] uppercase backdrop-blur-xs">
                                <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
                                Executive Oversight & Decision-Support Workspace
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                Vice President for Academic Affairs (VPAF)
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[#E9D5FF]/90 sm:text-sm">
                                High-level institutional intelligence across all campuses, entities, and colleges.
                                Monitor cross-college attendance, instructional delivery, compliance health, facility
                                bottlenecks, and TV broadcasts in a single decision-oriented cockpit.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                                href="/vpaf/tv-communications?tab=switcher"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17152E] shadow-sm transition hover:bg-[#EDE9FE]"
                            >
                                <Projector className="h-4 w-4 text-[#5B21B6]" />
                                TV Channel Switcher
                            </Link>

                            <Link
                                href="/vpaf/reports?tab=consolidated"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                            >
                                <FileText className="h-4 w-4 text-[#A78BFA]" />
                                Consolidated Report
                            </Link>

                            <Link
                                href="/vpaf/analytics?tab=risks"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#6D28D9]"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Risk Center ({kpis.critical_alerts + kpis.needs_attention_colleges})
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Top Executive Multi-Dimension Filter Bar */}
                <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E4F0] dark:border-border mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#17152E] dark:text-foreground">
                            <Filter className="h-4 w-4 text-[#5B21B6]" />
                            <span>Executive Filters: Scope & Observation Period</span>
                        </div>
                        <Button
                            type="button"
                            onClick={applyFilters}
                            className="h-8 rounded-xl bg-[#5B21B6] px-3.5 text-xs font-bold text-white hover:bg-[#4C1D95]"
                        >
                            Apply Filters
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
                        {/* Period Filter */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">Academic Period</label>
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            >
                                {periods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        AY {p.academic_year} · {p.semester}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campus / Entity */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">Campus / Entity</label>
                            <select
                                value={entityFilter}
                                onChange={(e) => setEntityFilter(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            >
                                <option value="All">All Campuses & Entities</option>
                                {entities.map((ent) => (
                                    <option key={ent.id} value={String(ent.id)}>
                                        {ent.code} — {ent.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* College */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">College Unit</label>
                            <select
                                value={collegeFilter}
                                onChange={(e) => setCollegeFilter(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            >
                                <option value="All">All Colleges ({colleges.length})</option>
                                {colleges.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.code} — {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Program */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">Degree Program</label>
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            >
                                <option value="All">All Programs ({programs.length})</option>
                                {programs.map((prog) => (
                                    <option key={prog.id} value={String(prog.id)}>
                                        {prog.code} — {prog.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">Observation Start</label>
                            <input
                                type="date"
                                value={dateRangeStart}
                                onChange={(e) => setDateRangeStart(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-400">Observation End</label>
                            <input
                                type="date"
                                value={dateRangeEnd}
                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Institutional KPI Dashboard Grid (10 Core Decision Indicators) */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
                    {/* 1. Attendance Coverage */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Attendance Coverage</span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                93.0% Bench
                            </span>
                        </div>
                        <p className="mt-1 text-2xl font-black text-[#17152E] dark:text-foreground">
                            {kpis.overall_attendance}%
                        </p>
                        <span className="text-[11px] text-slate-500">Across {kpis.total_faculty} Faculty Members</span>
                    </div>

                    {/* 2. Instructional Completion */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Instructional Completion</span>
                            <Clock className="h-4 w-4 text-[#5B21B6]" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-[#5B21B6] dark:text-[#A78BFA]">
                            {kpis.instructional_completion}%
                        </p>
                        <span className="text-[11px] text-slate-500">Actual teaching hours delivered</span>
                    </div>

                    {/* 3. Compliance Rate */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Deliverables Compliance</span>
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-emerald-600">
                            {kpis.overall_compliance}%
                        </p>
                        <span className="text-[11px] text-slate-500">Syllabi, grades & TOS folders</span>
                    </div>

                    {/* 4. Faculty Workload Balance */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Faculty Overload</span>
                            <Briefcase className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-amber-600">
                            {kpis.overloaded_faculty}
                        </p>
                        <span className="text-[11px] text-slate-500">
                            {kpis.underloaded_faculty} underloaded · 16 normal
                        </span>
                    </div>

                    {/* 5. Facility & Lab Utilization */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Facility Utilization</span>
                            <Building2 className="h-4 w-4 text-[#7C3AED]" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-[#17152E] dark:text-foreground">
                            {kpis.facility_utilization}%
                        </p>
                        <span className="text-[11px] text-slate-500">Classrooms & computer labs</span>
                    </div>

                    {/* 6. Open Maintenance Issues */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Facility Issues</span>
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-rose-600">
                            {kpis.open_maintenance_issues}
                        </p>
                        <span className="text-[11px] text-slate-500">Equipment & aircon tickets</span>
                    </div>

                    {/* 7. Active Research Projects */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Research Projects</span>
                            <FolderKanban className="h-4 w-4 text-indigo-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-[#17152E] dark:text-foreground">
                            {kpis.active_research_projects}
                        </p>
                        <span className="text-[11px] text-slate-500">Faculty-led academic papers</span>
                    </div>

                    {/* 8. Active Extension Engagements */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Extension Outreach</span>
                            <Award className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-[#17152E] dark:text-foreground">
                            {kpis.active_extension_projects}
                        </p>
                        <span className="text-[11px] text-slate-500">Community partner projects</span>
                    </div>

                    {/* 9. Critical Bottlenecks */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Critical Units</span>
                            <XCircle className="h-4 w-4 text-rose-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-rose-600">
                            {kpis.critical_alerts}
                        </p>
                        <span className="text-[11px] text-slate-500">Requires executive intervention</span>
                    </div>

                    {/* 10. Needs Attention Colleges */}
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Attention Needed</span>
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="mt-1 text-2xl font-black text-amber-600">
                            {kpis.needs_attention_colleges}
                        </p>
                        <span className="text-[11px] text-slate-500">Underperforming thresholds</span>
                    </div>
                </div>

                {/* College Health Summary (Dedicated Comparative Cards) */}
                <div className="space-y-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-base font-black text-[#17152E] dark:text-foreground">
                                College Health & Operational Overview
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground">
                                Detailed status per college unit avoiding simplistic aggregate scoring, showing validated
                                operational telemetry, workload balance, and bottlenecks.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/vpaf/analytics?tab=comparison"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] shadow-2xs hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground"
                            >
                                <BarChart3 className="h-3.5 w-3.5 text-[#5B21B6]" />
                                Open Comparison Matrix →
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {collegeList.map((col) => (
                            <div
                                key={col.code}
                                className="flex flex-col justify-between rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-border dark:bg-card"
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-extrabold text-[#5B21B6] dark:text-[#A78BFA]">
                                                    {col.code}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-2 py-0.2 text-[10px] font-extrabold ${getStatusBadge(
                                                        col.status
                                                    )}`}
                                                >
                                                    {col.status}
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                                {col.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-400">
                                                {col.parent_entity} · {col.dean_name}
                                            </p>
                                        </div>

                                        <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#5B21B6] dark:bg-[#262246] dark:text-[#DDD6FE]">
                                            TV: {col.tv_channel_status}
                                        </span>
                                    </div>

                                    {/* Status Reason Callout */}
                                    <div className="mt-3 rounded-xl bg-[#F7F7FB] p-2.5 text-[11px] leading-relaxed text-slate-600 dark:bg-muted/30 dark:text-slate-300">
                                        <strong>Diagnosis:</strong> {col.status_reason}
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Attendance Coverage
                                            </span>
                                            <p className="font-extrabold text-[#17152E] dark:text-foreground">
                                                {col.attendance_rate}%
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Instructional Delivered
                                            </span>
                                            <p className="font-extrabold text-[#5B21B6] dark:text-[#A78BFA]">
                                                {col.completion_rate}%
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Compliance Rate
                                            </span>
                                            <p className="font-extrabold text-emerald-600">
                                                {col.compliance_rate}%
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Room Utilization
                                            </span>
                                            <p className="font-extrabold text-[#17152E] dark:text-foreground">
                                                {col.room_utilization}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Operational Indicators: Scheduling, Overload, Open Issues */}
                                    <div className="mt-3 space-y-1.5 text-[11px]">
                                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                            <span>Scheduling Readiness:</span>
                                            <span className="font-bold text-[#5B21B6] dark:text-[#A78BFA]">
                                                {col.scheduling.status} ({col.scheduling.stage})
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                            <span>Overloaded Faculty:</span>
                                            <span className="font-bold text-amber-600">
                                                {col.overload_count} faculty carrying &gt;24 units
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                            <span>Unresolved Facility Issues:</span>
                                            <span className="font-bold text-rose-600">
                                                {col.open_issues} tickets open
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Drill-Down */}
                                <div className="mt-4 flex items-center justify-between border-t border-[#E5E4F0] pt-3 text-xs dark:border-border">
                                    <span className="text-[11px] text-slate-400">
                                        {col.faculty_count} faculty · {col.program_count} programs
                                    </span>
                                    <Link
                                        href={`/vpaf/analytics?tab=overview&college=${col.code}`}
                                        className="inline-flex items-center gap-1 font-bold text-[#5B21B6] hover:underline dark:text-[#A78BFA]"
                                    >
                                        Inspect Unit <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Executive Risk & Attention Center Summary */}
                <div className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between border-b border-[#E5E4F0] pb-3 dark:border-border">
                        <div>
                            <h2 className="text-base font-black text-[#17152E] dark:text-foreground">
                                High-Impact Executive Alerts & Intervention Priorities
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground">
                                Only issues requiring vice presidential or administrative resource action are surfaced here.
                            </p>
                        </div>

                        <Link
                            href="/vpaf/analytics?tab=risks"
                            className="text-xs font-bold text-[#5B21B6] hover:underline dark:text-[#A78BFA]"
                        >
                            Open Risk & Attention Center →
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {executiveAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex flex-col justify-between gap-3 rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] p-4 sm:flex-row sm:items-center dark:border-border dark:bg-muted/20"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${getAlertSeverityBadge(
                                                alert.severity
                                            )}`}
                                        >
                                            {alert.severity}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">{alert.entity}</span>
                                        <span className="text-slate-300">·</span>
                                        <span className="text-xs font-semibold text-slate-400">{alert.metric}</span>
                                    </div>
                                    <h4 className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                        {alert.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        <strong>Recommended Action:</strong> {alert.recommendation}
                                    </p>
                                </div>

                                <Link
                                    href={alert.link}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#5B21B6] shadow-2xs hover:bg-[#EDE9FE] dark:bg-card dark:text-[#A78BFA]"
                                >
                                    Review & Action <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

