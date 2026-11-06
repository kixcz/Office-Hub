import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Award,
    BarChart2,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Info,
    Layers,
    LucideIcon,
    RefreshCw,
    Search,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    UserCheck,
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

interface WorkloadBreakdown {
    underloaded: number;
    normal: number;
    overloaded: number;
    excessive: number;
}

interface Props {
    initialTab?: 'workload' | 'attendance' | 'completion' | 'scheduling' | 'exams-makeups';
    collegeMetrics: Record<string, CollegeMetric>;
    workloadBreakdown?: Record<string, WorkloadBreakdown>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Academic Operations', href: '/vpaf/academic-operations' },
];

export default function VpafAcademicOperations({
    initialTab = 'workload',
    collegeMetrics = {},
    workloadBreakdown = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'workload' | 'attendance' | 'completion' | 'scheduling' | 'exams-makeups'>(
        initialTab
    );
    const [selectedCollege, setSelectedCollege] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const collegesList = useMemo(() => Object.values(collegeMetrics), [collegeMetrics]);

    const filteredColleges = useMemo(() => {
        return collegesList.filter((col) => {
            if (selectedCollege !== 'All' && col.code !== selectedCollege) return false;
            if (
                searchQuery &&
                !col.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !col.code.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false;
            }
            return true;
        });
    }, [collegesList, selectedCollege, searchQuery]);

    const handleTabChange = (tab: 'workload' | 'attendance' | 'completion' | 'scheduling' | 'exams-makeups') => {
        setActiveTab(tab);
        router.get(
            '/vpaf/academic-operations',
            { tab },
            { preserveState: true, replace: true }
        );
    };

    // Calculate institutional aggregates for academic ops
    const totalFaculty = collegesList.reduce((acc, c) => acc + c.faculty_count, 0);
    const avgAttendance = (collegesList.reduce((acc, c) => acc + c.attendance_rate, 0) / (collegesList.length || 1)).toFixed(1);
    const avgCompletion = (collegesList.reduce((acc, c) => acc + c.completion_rate, 0) / (collegesList.length || 1)).toFixed(1);
    const totalOverloaded = collegesList.reduce((acc, c) => acc + c.overload_count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Operations — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#0B3A67] dark:text-[#93C5FD] border border-violet-200">
                                <BookOpen className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Academic Operations Management
                            </span>
                            <span className="text-xs text-slate-500 font-medium">AY 2026–2027 • 1st Semester</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Academic Operations & Delivery Telemetry
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Cross-college oversight of faculty teaching workloads, verified classroom attendance, actual syllabus hour completion, scheduling readiness, and examination cycles.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/vpaf/reports?tab=academic-operations">
                            <Button variant="outline" className="border-indigo-200 text-[#0B3A67] dark:text-[#93C5FD] hover:bg-violet-50 font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Operations Report
                            </Button>
                        </Link>
                        <Link href="/vpaf/dashboard">
                            <Button className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-sm font-medium">
                                Executive Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Total Teaching Force</span>
                            <Users className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#17152E]">{totalFaculty}</div>
                        <div className="text-xs text-slate-400 mt-1">Across 5 academic colleges</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Attendance Coverage</span>
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">{avgAttendance}%</div>
                        <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> +1.4% vs midterm baseline
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Instructional Completion</span>
                            <CheckCircle2 className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#0B3A67] dark:text-[#93C5FD]">{avgCompletion}%</div>
                        <div className="text-xs text-slate-400 mt-1">Delivered contact hours vs syllabus target</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Faculty Overload Cases</span>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{totalOverloaded}</div>
                        <div className="text-xs text-slate-400 mt-1">Carrying &gt;21 teaching units</div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'workload', label: 'Faculty Workload', icon: Users, desc: 'Teaching units & load distribution' },
                        { id: 'attendance', label: 'Faculty Attendance', icon: UserCheck, desc: 'Coverage, absences & locator slips' },
                        { id: 'completion', label: 'Instructional Completion', icon: CheckCircle2, desc: 'Delivered vs missed hours & make-ups' },
                        { id: 'scheduling', label: 'Scheduling Readiness', icon: Calendar, desc: 'Timetable status & room conflict checks' },
                        { id: 'exams-makeups', label: 'Exams & Make-Up Sessions', icon: Clock, desc: 'Examination proctoring & make-up classes' },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? 'bg-[#5B21B6] text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:text-[#0B3A67] dark:text-[#93C5FD] hover:bg-violet-50 border border-indigo-50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0B3A67] dark:text-[#93C5FD]'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: FACULTY WORKLOAD */}
                {activeTab === 'workload' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#17152E]">Institutional Faculty Workload Distribution</h2>
                                    <p className="text-xs text-slate-500">
                                        Comparison of teaching unit distributions across regular and contractual faculty to ensure CHED compliant load balance and eliminate excessive overload.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CHED Normal: 18–21 units</span>
                                    <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md font-semibold">Overload: 22–26 units</span>
                                    <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md font-semibold">Excessive: &gt;26 units</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-indigo-100 bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4">College</th>
                                            <th className="py-3 px-4">Faculty Count</th>
                                            <th className="py-3 px-4 text-center">Underloaded (&lt;18 units)</th>
                                            <th className="py-3 px-4 text-center">Normal Load (18–21)</th>
                                            <th className="py-3 px-4 text-center">Overloaded (22–26)</th>
                                            <th className="py-3 px-4 text-center">Excessive (&gt;26 units)</th>
                                            <th className="py-3 px-4">Action / Executive Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {collegesList.map((col) => {
                                            const breakdown = workloadBreakdown[col.code] || {
                                                underloaded: col.underload_count,
                                                normal: col.faculty_count - col.overload_count - col.underload_count,
                                                overloaded: col.overload_count,
                                                excessive: 0,
                                            };
                                            return (
                                                <tr key={col.code} className="hover:bg-violet-50/40 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-[#17152E] flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-semibold">
                                                                {col.code}
                                                            </span>
                                                            {col.name}
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-0.5">{col.dean_name}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-700">{col.faculty_count}</td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {breakdown.underloaded > 0 ? (
                                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                                                                {breakdown.underloaded} faculty
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">0</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                                                        {breakdown.normal} faculty
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {breakdown.overloaded > 0 ? (
                                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                                {breakdown.overloaded} faculty
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">0</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {breakdown.excessive > 0 ? (
                                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
                                                                {breakdown.excessive} faculty!
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">0</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs">
                                                        {breakdown.overloaded >= 4 ? (
                                                            <span className="text-amber-700 font-medium">
                                                                Urgent: Authorize 2 adjunct lecturers for next semester offerings.
                                                            </span>
                                                        ) : breakdown.underloaded > 0 ? (
                                                            <span className="text-sky-700 font-medium">
                                                                Assign research reallocated units or general education subjects.
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-700 font-medium">
                                                                Balanced teaching load. No intervention required.
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Executive Observation Card */}
                        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[#5B21B6] rounded-xl text-white">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#17152E]">Executive Policy Guideline on Teaching Overloads</h3>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                        Per DSSC Faculty Manual & CHED Memorandum Orders, maximum permissible overload is capped at 6 units (total 24 teaching units).
                                        Faculty members with documented research release time or administrative designations (Deans, Chairs) are strictly barred from accepting &gt;3 units overload to safeguard academic quality and research output.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: FACULTY ATTENDANCE */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#17152E]">Finalized Classroom Attendance Telemetry</h2>
                                        <p className="text-xs text-slate-500">Official verified presence vs class schedule</p>
                                    </div>
                                    <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                                        94.6% Institution Average
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {collegesList.map((col) => (
                                        <div key={col.code} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#17152E]">{col.name}</span>
                                                    <span className="text-xs text-slate-500">({col.code})</span>
                                                </div>
                                                <span className={`text-sm font-bold ${
                                                    col.attendance_rate >= 95 ? 'text-emerald-700' : col.attendance_rate >= 90 ? 'text-indigo-700' : 'text-amber-700'
                                                }`}>
                                                    {col.attendance_rate}% Verified Presence
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        col.attendance_rate >= 95
                                                            ? 'bg-emerald-600'
                                                            : col.attendance_rate >= 90
                                                            ? 'bg-[#5B21B6]'
                                                            : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${col.attendance_rate}%` }}
                                                />
                                            </div>

                                            {/* Root Cause & Absence Category Breakdown */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                                                <div>
                                                    <span className="text-slate-400 block">Official Travel (TO):</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {col.code === 'CIDS' ? '2 orders' : col.code === 'CED' ? '5 orders' : '3 orders'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Locator Slips:</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {col.code === 'CED' ? '8 slips' : '2 slips'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Sick / Emergency Leave:</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {col.code === 'COE' ? '6 days' : '1 day'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Monitoring Completeness:</span>
                                                    <span className="font-semibold text-emerald-700">100% Finalized</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Attendance Context & Diagnostic */}
                            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                                <h3 className="text-base font-bold text-[#17152E]">Absence Diagnostic Insight</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    The VPAF oversight mechanism differentiates between excused administrative leaves, academic conferences, and unexcused absences.
                                </p>

                                <div className="space-y-3 pt-2">
                                    <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                                        <div className="text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD]">Travel Order Impact</div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            CED lower presence (91.8%) is primarily driven by 5 faculty members conducting off-campus regional practice teaching supervision with approved Travel Orders.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <div className="text-xs font-bold text-amber-800">Make-Up Class Obligation</div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            All 14 class suspensions due to official university representation have scheduled compensatory make-up class sessions filed in the system.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="text-xs font-bold text-emerald-800">Biometric & RFID Sync</div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            100% of campus biometric turnstiles and faculty room logging terminals are synced daily with the Ascend Governance server.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: INSTRUCTIONAL COMPLETION */}
                {activeTab === 'completion' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#17152E]">Instructional Contact Hours & Syllabus Completion</h2>
                                    <p className="text-xs text-slate-500">
                                        Auditing whether required 54 lecture/lab hours per 3-unit subject were delivered or compensated through verified make-up classes.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-3 py-1 bg-violet-100 text-[#0B3A67] dark:text-[#93C5FD] rounded-full font-semibold">
                                        Standard: 54 Hours per 3-Unit Course
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-indigo-100 bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4">College</th>
                                            <th className="py-3 px-4 text-center">Required Hours</th>
                                            <th className="py-3 px-4 text-center">Delivered Hours</th>
                                            <th className="py-3 px-4 text-center">Completion %</th>
                                            <th className="py-3 px-4 text-center">Outstanding Make-Up Hours</th>
                                            <th className="py-3 px-4">Syllabus Coverage Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {collegesList.map((col) => {
                                            const reqHours = col.faculty_count * 18 * 54;
                                            const deliveredHours = Math.round(reqHours * (col.completion_rate / 100));
                                            const missedHours = reqHours - deliveredHours;
                                            return (
                                                <tr key={col.code} className="hover:bg-violet-50/40 transition-colors">
                                                    <td className="py-3.5 px-4 font-bold text-[#17152E]">
                                                        {col.name} <span className="text-slate-400 font-normal">({col.code})</span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">{reqHours.toLocaleString()} hrs</td>
                                                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#0B3A67] dark:text-[#93C5FD]">{deliveredHours.toLocaleString()} hrs</td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            col.completion_rate >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {col.completion_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {missedHours > 0 ? (
                                                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                                                {missedHours.toLocaleString()} hrs pending make-up
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-emerald-700">0 (Fully Delivered)</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs font-medium">
                                                        {col.completion_rate >= 95 ? (
                                                            <span className="text-emerald-700 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> All course learning outcomes on schedule
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-700 flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" /> Synchronous make-ups requested before Finals
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: SCHEDULING READINESS */}
                {activeTab === 'scheduling' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#17152E]">Semester Timetable & Scheduling Readiness</h2>
                                        <p className="text-xs text-slate-500">Validation of curriculum section offerings and room conflict resolution</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {collegesList.map((col) => (
                                        <div key={col.code} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-[#17152E] text-base">{col.name}</span>
                                                    <p className="text-xs text-slate-500 mt-0.5">{col.scheduling.stage}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    col.scheduling.status === 'Published'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : col.scheduling.status.includes('Conflicts')
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD]'
                                                }`}>
                                                    {col.scheduling.status}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                                                <span>Programs Configured: <strong>{col.program_count}</strong></span>
                                                <span>Assigned Faculty: <strong>{col.faculty_count}</strong></span>
                                                <span>
                                                    Conflict Free Rooms: <strong>{col.code === 'COE' ? '23 / 28' : '100% Clean'}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Scheduling Milestones */}
                            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                                <h3 className="text-base font-bold text-[#17152E]">Schedule Release Milestones</h3>
                                <div className="space-y-4 text-xs text-slate-600">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                                        <div>
                                            <strong className="text-slate-800 block">Curriculum Section Generation</strong>
                                            Automatic creation of section offerings based on student batch quotas. (Done)
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                        <div>
                                            <strong className="text-slate-800 block">Faculty Loading & Room Assignment</strong>
                                            Deans and Program Chairs allocate verified teachers and spaces. (Done)
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                        <div>
                                            <strong className="text-slate-800 block">Conflict Matrix Verification</strong>
                                            Resolving 5 laboratory overlaps in COE CAD laboratories. (In Progress)
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] flex items-center justify-center font-bold text-xs shrink-0">4</div>
                                        <div>
                                            <strong className="text-slate-800 block">VPAF Official Endorsement & Publishing</strong>
                                            Final lock of timetables and public broadcast to Student Portals.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: EXAMS & MAKE-UPS */}
                {activeTab === 'exams-makeups' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#17152E]">Examination Operations & Approved Make-Up Schedules</h2>
                                    <p className="text-xs text-slate-500">
                                        Oversight of Midterm and Final examinations, room proctor deployment, and status of compensatory class schedules.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[#17152E] text-base flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" /> Midterm Examination Deployment
                                        </h3>
                                        <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">100% Conducted</span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        All colleges completed midterm examination periods with zero security compromises. 42 test rooms monitored via institutional RFID logs.
                                    </p>
                                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                                        <div>Proctors Deployed: <strong>68 Faculty Members</strong></div>
                                        <div>Special Retake Permits: <strong>12 Approved (Medical reasons)</strong></div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[#17152E] text-base flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-amber-600" /> Pending Make-Up Class Approvals
                                        </h3>
                                        <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">6 Sessions Pending</span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Compensatory classes filed for classes cancelled during typhoon weather advisories. Requires Dean endorsement and room confirmation.
                                    </p>
                                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                                        <div>Saturday Synchronous Slots: <strong>4 Sessions (COE & CED)</strong></div>
                                        <div>Evening Hybrid Lecture: <strong>2 Sessions (CBA)</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

