import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    BarChart3,
    BookOpen,
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
    HelpCircle,
    Info,
    Layers,
    MapPin,
    Network,
    Printer,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
    resource_needs: Array<{ need: string; urgency: string; evidence: string }>;
    color_theme: string;
    tv_channel_status: string;
}

interface DecisionInsight {
    category: string;
    title: string;
    finding: string;
    evidence: string;
    action: string;
}

interface Props {
    initialTab?: 'overview' | 'comparison' | 'risks' | 'decision-support';
    collegeMetrics: Record<string, CollegeMetric>;
    decisionInsights?: DecisionInsight[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Executive Analytics', href: '/vpaf/analytics' },
];

export default function VpafAnalytics({
    initialTab = 'overview',
    collegeMetrics = {},
    decisionInsights = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'risks' | 'decision-support'>(
        initialTab
    );

    const [selectedCollegeForDrilldown, setSelectedCollegeForDrilldown] = useState<string | null>(null);

    // Comparison Matrix Sorting State
    const [sortColumn, setSortColumn] = useState<keyof CollegeMetric>('attendance_rate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [matrixSearch, setMatrixSearch] = useState('');

    const collegeList = Object.values(collegeMetrics);

    const sortedCollegeList = useMemo(() => {
        return [...collegeList]
            .filter((col) => {
                if (matrixSearch.trim() === '') return true;
                const q = matrixSearch.toLowerCase();
                return col.code.toLowerCase().includes(q) || col.name.toLowerCase().includes(q);
            })
            .sort((a, b) => {
                const valA = a[sortColumn];
                const valB = b[sortColumn];
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'desc' ? valB - valA : valA - valB;
                }
                return 0;
            });
    }, [collegeList, sortColumn, sortDirection, matrixSearch]);

    const handleSort = (column: keyof CollegeMetric) => {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const downloadComparisonCsv = () => {
        const headers = [
            'College Code',
            'College Name',
            'Parent Entity / Campus',
            'Faculty Count',
            'Programs Count',
            'Attendance Coverage (%)',
            'Instructional Completion (%)',
            'Deliverables Compliance (%)',
            'Room Utilization (%)',
            'Overloaded Faculty (>24 units)',
            'Research Projects',
            'Extension Activities',
            'Open Facility Issues',
            'Operational Status',
        ];

        const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const lines = [
            headers.map(escapeCsv).join(','),
            ...sortedCollegeList.map((col) =>
                [
                    col.code,
                    col.name,
                    col.parent_entity,
                    col.faculty_count,
                    col.program_count,
                    col.attendance_rate,
                    col.completion_rate,
                    col.compliance_rate,
                    col.room_utilization,
                    col.overload_count,
                    col.research_count,
                    col.extension_count,
                    col.open_issues,
                    col.status,
                ]
                    .map(escapeCsv)
                    .join(',')
            ),
        ];

        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VPAF_College_Performance_Comparison_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Executive Analytics & Comparative Decision Support — VPAF" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 bg-[#F7F7FB] p-4 md:p-6 dark:bg-background">
                {/* Header Banner */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs sm:flex-row sm:items-center dark:border-border dark:bg-card">
                    <div>
                        <div className="mb-1.5 inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#0B3A67] dark:text-[#93C5FD] uppercase dark:bg-slate-800 dark:text-[#BFDBFE]">
                            <BarChart3 className="h-3 w-3" />
                            Executive Analytics & Comparative Decision Support
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-[#17152E] dark:text-foreground">
                            Cross-College Executive Analytics
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-muted-foreground">
                            Compare campuses and colleges side by side, drill down into organizational tiers, inspect
                            risk indicators, and review verified evidence-based decision guidance.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            onClick={downloadComparisonCsv}
                            variant="outline"
                            className="rounded-xl border-[#E5E4F0] text-xs font-bold text-[#17152E] hover:bg-[#F1F5F9] dark:border-border dark:text-foreground"
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Export Comparison Matrix (.CSV)
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'overview'
                                ? 'border-[#5B21B6] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'overview'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">College & Campus Overview</div>
                            <div className={`text-[10px] ${activeTab === 'overview' ? 'text-white/80' : 'text-slate-400'}`}>
                                Hierarchical drill-down view
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('comparison')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'comparison'
                                ? 'border-[#5B21B6] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'comparison'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Performance Comparison</div>
                            <div className={`text-[10px] ${activeTab === 'comparison' ? 'text-white/80' : 'text-slate-400'}`}>
                                Multi-indicator matrix
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('risks')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'risks'
                                ? 'border-[#5B21B6] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'risks'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                        >
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Risk & Attention Center</div>
                            <div className={`text-[10px] ${activeTab === 'risks' ? 'text-white/80' : 'text-slate-400'}`}>
                                Critical alerts & bottlenecks
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('decision-support')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'decision-support'
                                ? 'border-[#5B21B6] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'decision-support'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                            }`}
                        >
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Decision Support</div>
                            <div className={`text-[10px] ${activeTab === 'decision-support' ? 'text-white/80' : 'text-slate-400'}`}>
                                Verified management guidance
                            </div>
                        </div>
                    </button>
                </div>

                {/* TAB 1: COLLEGE & CAMPUS OVERVIEW (Hierarchical Drill-Down) */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-[#17152E] dark:text-foreground">
                                    Hierarchy: Institution → Campus / Entity → College → Degree Program
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Click any college card to inspect programs, leadership, and operational telemetry.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {collegeList.map((col) => (
                                <div
                                    key={col.code}
                                    className="flex flex-col justify-between rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card"
                                >
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-mono text-xs font-black text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                    {col.code}
                                                </span>
                                                <h4 className="mt-1 text-base font-extrabold text-[#17152E] dark:text-foreground">
                                                    {col.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-400">
                                                    {col.parent_entity} · Dean: {col.dean_name}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                                    col.status === 'On Track'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : col.status === 'Needs Attention'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                {col.status}
                                            </span>
                                        </div>

                                        {/* Status Diagnosis */}
                                        <div className="mt-3 rounded-xl bg-[#F7F7FB] p-2.5 text-[11px] text-slate-600 dark:bg-muted/30 dark:text-slate-300">
                                            {col.status_reason}
                                        </div>

                                        {/* Comparative Quick Stats */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 uppercase">Attendance</span>
                                                <div className="font-extrabold">{col.attendance_rate}%</div>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 uppercase">Delivered</span>
                                                <div className="font-extrabold text-[#0B3A67] dark:text-[#93C5FD]">{col.completion_rate}%</div>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 uppercase">Compliance</span>
                                                <div className="font-extrabold text-emerald-600">{col.compliance_rate}%</div>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 uppercase">Room Util</span>
                                                <div className="font-extrabold">{col.room_utilization}%</div>
                                            </div>
                                        </div>

                                        {/* Resource Needs preview */}
                                        {col.resource_needs && col.resource_needs.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Evidence-Backed Resource Request:
                                                </span>
                                                <p className="text-[11px] font-semibold text-rose-600">
                                                    • {col.resource_needs[0].need}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-[#E5E4F0] pt-3 flex items-center justify-between text-xs dark:border-border">
                                        <span className="text-slate-400 font-mono">
                                            {col.faculty_count} faculty · {col.program_count} progs
                                        </span>
                                        <Link
                                            href={`/vpaf/academic-operations?tab=workload&college=${col.code}`}
                                            className="font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline dark:text-[#93C5FD]"
                                        >
                                            View Workload & Schedules →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: PERFORMANCE COMPARISON (Configurable Matrix) */}
                {activeTab === 'comparison' && (
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex flex-col justify-between gap-3 border-b border-[#E5E4F0] pb-4 sm:flex-row sm:items-center dark:border-border">
                            <div>
                                <h3 className="text-base font-extrabold text-[#17152E] dark:text-foreground">
                                    Cross-College Multi-Indicator Comparison Matrix
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Compare all colleges side by side across key metrics. Click any column header to sort.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-56">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={matrixSearch}
                                        onChange={(e) => setMatrixSearch(e.target.value)}
                                        placeholder="Search college code or name..."
                                        className="w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] py-1.5 pr-3 pl-8 text-xs focus:bg-white focus:outline-none dark:border-border dark:bg-background"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Interactive Matrix Table */}
                        <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E4F0] dark:border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#F7F7FB] text-[10px] font-bold text-slate-400 uppercase dark:bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 sticky left-0 bg-[#F7F7FB] z-10">College Unit</th>
                                        <th
                                            onClick={() => handleSort('attendance_rate')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Attendance {sortColumn === 'attendance_rate' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('completion_rate')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Completion {sortColumn === 'completion_rate' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('compliance_rate')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Compliance {sortColumn === 'compliance_rate' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('room_utilization')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Room Util. {sortColumn === 'room_utilization' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('overload_count')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Overloaded Fac. {sortColumn === 'overload_count' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('research_count')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Research {sortColumn === 'research_count' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('extension_count')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Extension {sortColumn === 'extension_count' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('open_issues')}
                                            className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/50"
                                        >
                                            Open Issues {sortColumn === 'open_issues' && (sortDirection === 'desc' ? '↓' : '↑')}
                                        </th>
                                        <th className="px-3 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E4F0] dark:divide-border/60">
                                    {sortedCollegeList.map((col) => (
                                        <tr key={col.code} className="hover:bg-[#F7F7FB] dark:hover:bg-muted/20">
                                            <td className="px-4 py-3 sticky left-0 bg-white dark:bg-card z-10">
                                                <div className="font-extrabold text-[#17152E] dark:text-foreground">
                                                    {col.code} — {col.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{col.parent_entity}</div>
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-[#17152E] dark:text-foreground">
                                                {col.attendance_rate}%
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                {col.completion_rate}%
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-emerald-600">
                                                {col.compliance_rate}%
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {col.room_utilization}%
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-bold ${
                                                        col.overload_count > 3
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {col.overload_count}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                                                {col.research_count}
                                            </td>
                                            <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                                                {col.extension_count}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-bold ${
                                                        col.open_issues > 4
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {col.open_issues}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                                        col.status === 'On Track'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : col.status === 'Needs Attention'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    {col.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: RISK & ATTENTION CENTER */}
                {activeTab === 'risks' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs dark:border-rose-950/60 dark:bg-rose-950/20">
                            <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-400">
                                <AlertTriangle className="h-4 w-4" />
                                Institutional Risk & Intervention Filter
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                                Surfaces colleges exceeding institutional risk thresholds: compliance below 88%,
                                faculty overload &gt;3 members, peak laboratory congestion &gt;80%, or recurring schedule
                                conflicts.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {collegeList
                                .filter((c) => c.status !== 'On Track')
                                .map((col) => (
                                    <div
                                        key={col.code}
                                        className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card"
                                    >
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                        {col.code}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                                            col.status === 'Critical'
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}
                                                    >
                                                        {col.status} Priority
                                                    </span>
                                                </div>
                                                <h4 className="mt-1 text-base font-extrabold text-[#17152E] dark:text-foreground">
                                                    {col.name}
                                                </h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                                    <strong>Root Cause:</strong> {col.status_reason}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/vpaf/facilities-resources?tab=resource-needs&college=${col.code}`}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4C1D95]"
                                            >
                                                Review Evidence & Intervene <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>

                                        {/* Specific evidence details */}
                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                                            <div className="rounded-xl bg-[#F7F7FB] p-3 dark:bg-muted/30">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Compliance & Submissions
                                                </span>
                                                <div className="mt-1 font-extrabold text-rose-600">
                                                    {col.compliance_rate}% (Below 90% Threshold)
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-[#F7F7FB] p-3 dark:bg-muted/30">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Workload Congestion
                                                </span>
                                                <div className="mt-1 font-extrabold text-amber-600">
                                                    {col.overload_count} overloaded faculty members
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-[#F7F7FB] p-3 dark:bg-muted/30">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Open Facility Tickets
                                                </span>
                                                <div className="mt-1 font-extrabold text-rose-600">
                                                    {col.open_issues} tickets pending repair
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: DECISION SUPPORT (Verified Management Insights) */}
                {activeTab === 'decision-support' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs dark:border-indigo-950/60 dark:bg-indigo-950/20">
                            <div className="flex items-center gap-2 font-black text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                <Sparkles className="h-4 w-4" />
                                Verified Executive Management Guidance
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                                Synthesis of validated operational data, attendance logs, and facility telemetry. No
                                invented conclusions—every finding is backed by specific institutional records.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {decisionInsights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] uppercase dark:bg-slate-800 dark:text-[#BFDBFE]">
                                            {insight.category}
                                        </span>
                                    </div>
                                    <h4 className="mt-2 text-base font-extrabold text-[#17152E] dark:text-foreground">
                                        {insight.title}
                                    </h4>
                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <strong>Finding:</strong> {insight.finding}
                                    </p>
                                    <div className="mt-3 rounded-xl bg-[#F7F7FB] p-3 text-xs text-slate-600 dark:bg-muted/30 dark:text-slate-300">
                                        <strong>Validated Evidence:</strong> {insight.evidence}
                                    </div>
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                                        <strong>Recommended Executive Action:</strong> {insight.action}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

