import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    FileText, 
    CheckSquare, 
    Clock, 
    AlertTriangle,
    CalendarDays,
    Trophy,
    ArrowRight,
    MapPin,
    Target,
    Users,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { ConsolidatedCalendarModal } from '@/components/consolidated-calendar-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard({ 
    stats, 
    compliance_summary, 
    program_compliance,
    todays_schedule,
    upcoming_deadlines,
    urgent_pending,
    top_programs,
    current_term,
    calendar_data,
}: any) {
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState('AY 2026-2027 - 1st Semester');
    const [selectedProgramRankingFilter, setSelectedProgramRankingFilter] = useState('This Semester');

    // Baseline fallback data matching the UI mockup
    const activeStats = {
        active_requirements: stats?.active_requirements ?? 2,
        total_submissions: stats?.total_submissions ?? 63,
        pending_outputs: stats?.pending_outputs ?? 8,
        overdue_outputs: stats?.overdue_outputs ?? 3,
    };

    const activeCompliance = {
        compliance_rate: compliance_summary?.compliance_rate ?? 82.5,
        on_time: compliance_summary?.on_time ?? 33,
        late: compliance_summary?.late ?? 19,
        pending: compliance_summary?.pending ?? 8,
        overdue: compliance_summary?.overdue ?? 3,
    };

    // Program compliance comparison items matching mockup
    const activePrograms = program_compliance && program_compliance.length > 0 
        ? program_compliance 
        : [
            { id: 1, name: 'BSIT', compliance_rate: 90 },
            { id: 2, name: 'BSIS', compliance_rate: 85.7 },
            { id: 3, name: 'BLIS', compliance_rate: 50 },
            { id: 4, name: 'BSCS', compliance_rate: 66.7 },
        ];

    // Urgent pending outputs matching mockup
    const activeUrgentPending = urgent_pending && urgent_pending.length > 0
        ? urgent_pending
        : [
            { id: 1, faculty: 'Arnel Reyes', program: 'BSIS', requirement: 'Course Syllabus', due_date: 'Oct 3, 2026', status: 'Overdue' },
            { id: 2, faculty: 'Peter Parker', program: 'BSIT', requirement: 'Course Syllabus', due_date: 'Oct 3, 2026', status: 'Overdue' },
            { id: 3, faculty: 'Clark Kent', program: 'BSCS', requirement: 'Course Syllabus', due_date: 'Oct 3, 2026', status: 'Overdue' },
            { id: 4, faculty: 'Cristina Lopez', program: 'BLIS', requirement: 'Midterm TOS and TQ', due_date: 'Oct 16, 2026', status: 'Pending' },
            { id: 5, faculty: 'Tony Stark', program: 'BSIS', requirement: 'Midterm TOS and TQ', due_date: 'Oct 16, 2026', status: 'Pending' },
        ];

    // Today's schedule items matching mockup
    const activeSchedule = todays_schedule && todays_schedule.length > 0
        ? todays_schedule
        : [
            { title: 'Department Heads Sync', time: '09:00 AM - 10:30 AM', venue: "Dean's Office", type: 'Meeting', dotColor: 'bg-blue-500' },
            { title: 'Curriculum Review', time: '01:00 PM - 03:00 PM', venue: 'Conference Room A', type: 'Meeting', dotColor: 'bg-blue-500' },
            { title: 'Faculty Council Meeting', time: '03:00 PM - 05:00 PM', venue: 'AVR', type: 'Meeting', dotColor: 'bg-purple-500' },
            { title: 'Student Organization Orientation', time: '07:00 PM - 09:00 PM', venue: 'University Gym', type: 'Activity', dotColor: 'bg-amber-500' },
        ];

    // Top performing programs ranking matching mockup
    const activeRankings = top_programs && top_programs.length > 0
        ? top_programs
        : [
            { id: 1, name: 'BSIS', compliance_rate: 76.2, change: '+ 8%', changeType: 'up' },
            { id: 2, name: 'BSIT', compliance_rate: 40, change: '+ 5%', changeType: 'up' },
            { id: 3, name: 'BSCS', compliance_rate: 66.7, change: '+ 3%', changeType: 'up' },
            { id: 4, name: 'BLIS', compliance_rate: 50, change: '- 2%', changeType: 'down' },
        ];

    const openCalendar = () => {
        setIsCalendarModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />
            
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                {/* Compact Header: Dashboard Overview & Subtitle */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Dashboard Overview
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {current_term || 'AY 2026–2027, 1st Semester'} • Live overview of compliance, submissions, schedules, and key activities.
                        </p>
                    </div>
                </div>

                {/* KPI Cards Row (Starts directly below the compact header) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Requirements */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Requirements</span>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                    {activeStats.active_requirements}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                ↓ 33% vs. last month
                            </span>
                            {/* Blue SVG Sparkline */}
                            <svg className="w-20 h-6 text-blue-500 shrink-0" viewBox="0 0 100 30" fill="none">
                                <path d="M0 25 C 20 28, 40 18, 60 12 C 80 5, 90 2, 100 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Total Submissions */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Submissions</span>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                    {activeStats.total_submissions}
                                </p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/50 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-400">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                ↑ 12% vs. last month
                            </span>
                            {/* Purple SVG Sparkline */}
                            <svg className="w-20 h-6 text-purple-500 shrink-0" viewBox="0 0 100 30" fill="none">
                                <path d="M0 22 C 20 26, 35 15, 60 20 C 75 24, 85 8, 100 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Pending Outputs */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Outputs</span>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                    {activeStats.pending_outputs}
                                </p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                ↓ 20% vs. last month
                            </span>
                            {/* Amber SVG Sparkline */}
                            <svg className="w-20 h-6 text-amber-500 shrink-0" viewBox="0 0 100 30" fill="none">
                                <path d="M0 20 C 15 24, 35 12, 50 22 C 70 30, 85 10, 100 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Overdue Outputs */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue Outputs</span>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                    {activeStats.overdue_outputs}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                                ↓ 40% vs. last month
                            </span>
                            {/* Red SVG Sparkline */}
                            <svg className="w-20 h-6 text-red-500 shrink-0" viewBox="0 0 100 30" fill="none">
                                <path d="M0 24 C 20 28, 40 18, 55 24 C 70 30, 85 5, 100 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Main Bento Grid: 2 Columns on LG */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (8 of 12 cols): Compliance & Urgent Outputs */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* College-Wide Compliance Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        College-Wide Compliance
                                    </h2>
                                </div>

                                <div className="relative">
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                        className="appearance-none bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
                                    >
                                        <option value="AY 2026-2027 - 1st Semester">AY 2026–2027 - 1st Semester</option>
                                        <option value="AY 2025-2026 - 2nd Semester">AY 2025–2026 - 2nd Semester</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                                </div>
                            </div>

                            {/* Donut Dial & 4 Metric Boxes */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
                                {/* Donut Progress Dial (5 cols) */}
                                <div className="md:col-span-5 flex flex-col items-center justify-center">
                                    <div className="relative flex items-center justify-center w-36 h-36">
                                        {/* SVG Donut Circle */}
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                            <circle
                                                cx="60"
                                                cy="60"
                                                r="48"
                                                className="stroke-slate-100 dark:stroke-slate-800"
                                                strokeWidth="12"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="60"
                                                cy="60"
                                                r="48"
                                                className="stroke-emerald-500"
                                                strokeWidth="12"
                                                strokeDasharray={2 * Math.PI * 48}
                                                strokeDashoffset={(2 * Math.PI * 48) * (1 - activeCompliance.compliance_rate / 100)}
                                                strokeLinecap="round"
                                                fill="transparent"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center text-center">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {activeCompliance.compliance_rate}%
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                Complied
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Breakdown Metric Boxes with Mini Bar Charts (7 cols) */}
                                <div className="md:col-span-7 grid grid-cols-2 gap-3">
                                    {/* ON-TIME */}
                                    <div className="bg-slate-50/70 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">ON-TIME</span>
                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCompliance.on_time}</p>
                                        </div>
                                        <div className="flex items-end gap-1 h-8 pb-0.5">
                                            <span className="w-1.5 h-3 bg-emerald-500/40 rounded-full" />
                                            <span className="w-1.5 h-5 bg-emerald-500/60 rounded-full" />
                                            <span className="w-1.5 h-7 bg-emerald-500 rounded-full" />
                                            <span className="w-1.5 h-4 bg-emerald-500/50 rounded-full" />
                                        </div>
                                    </div>

                                    {/* LATE */}
                                    <div className="bg-slate-50/70 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">LATE</span>
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{activeCompliance.late}</p>
                                        </div>
                                        <div className="flex items-end gap-1 h-8 pb-0.5">
                                            <span className="w-1.5 h-5 bg-blue-500/40 rounded-full" />
                                            <span className="w-1.5 h-7 bg-blue-500 rounded-full" />
                                            <span className="w-1.5 h-4 bg-blue-500/60 rounded-full" />
                                            <span className="w-1.5 h-6 bg-blue-500/80 rounded-full" />
                                        </div>
                                    </div>

                                    {/* PENDING */}
                                    <div className="bg-slate-50/70 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">PENDING</span>
                                            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{activeCompliance.pending}</p>
                                        </div>
                                        <div className="flex items-end gap-1 h-8 pb-0.5">
                                            <span className="w-1.5 h-3 bg-amber-500/40 rounded-full" />
                                            <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                            <span className="w-1.5 h-4 bg-amber-500/60 rounded-full" />
                                            <span className="w-1.5 h-5 bg-amber-500/80 rounded-full" />
                                        </div>
                                    </div>

                                    {/* OVERDUE */}
                                    <div className="bg-slate-50/70 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">OVERDUE</span>
                                            <p className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">{activeCompliance.overdue}</p>
                                        </div>
                                        <div className="flex items-end gap-1 h-8 pb-0.5">
                                            <span className="w-1.5 h-4 bg-red-500/40 rounded-full" />
                                            <span className="w-1.5 h-7 bg-red-500 rounded-full" />
                                            <span className="w-1.5 h-5 bg-red-500/60 rounded-full" />
                                            <span className="w-1.5 h-6 bg-red-500/80 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Program Compliance Comparison Horizontal Bars */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-3">
                                    Program Compliance Comparison
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    {activePrograms.map((p: any) => (
                                        <div key={p.id || p.name} className="flex items-center gap-3 text-xs">
                                            <span className="w-12 font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                                {p.name || p.code}
                                            </span>
                                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${p.compliance_rate}%` }}
                                                />
                                            </div>
                                            <span className="w-12 text-right font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                                {p.compliance_rate}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Urgent Pending Outputs Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        Urgent Pending Outputs
                                    </h2>
                                </div>
                                <Link 
                                    href="/compliance/pending-outputs" 
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                >
                                    View All <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="text-slate-400 dark:text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-2.5 pr-3 font-semibold">Faculty</th>
                                            <th className="py-2.5 px-3 font-semibold">Program</th>
                                            <th className="py-2.5 px-3 font-semibold">Requirement</th>
                                            <th className="py-2.5 px-3 font-semibold">Deadline</th>
                                            <th className="py-2.5 pl-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {activeUrgentPending.map((p: any, idx: number) => (
                                            <tr key={p.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                                                <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-slate-100">{p.faculty}</td>
                                                <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">{p.program}</td>
                                                <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{p.requirement}</td>
                                                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{p.due_date}</td>
                                                <td className="py-3 pl-3 text-right">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        p.status === 'Overdue'
                                                            ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 border border-red-200/50 dark:border-red-900/40'
                                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (4 of 12 cols): Today's Schedule & Top Programs */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Today's Schedule Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <CalendarIcon className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        Today's Schedule
                                    </h2>
                                </div>
                                <button 
                                    type="button"
                                    onClick={openCalendar}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Open Consolidated Calendar Modal"
                                >
                                    View All <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeSchedule.map((item: any, i: number) => (
                                    <div 
                                        key={i} 
                                        onClick={openCalendar}
                                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col gap-1 group"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                                {item.time}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                item.type === 'Activity'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotColor || 'bg-blue-500'}`} />
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors leading-snug truncate">
                                                {item.title}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pl-4 mt-0.5">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">{item.venue}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Performing Programs Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        Top Performing Programs
                                    </h2>
                                </div>
                                
                                <div className="relative">
                                    <select
                                        value={selectedProgramRankingFilter}
                                        onChange={(e) => setSelectedProgramRankingFilter(e.target.value)}
                                        className="appearance-none bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
                                    >
                                        <option value="This Semester">This Semester</option>
                                        <option value="Annual">Annual</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3.5">
                                {activeRankings.map((p: any, i: number) => {
                                    const rankBadgeStyles = [
                                        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
                                        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
                                        'bg-amber-200/70 text-amber-900 border-amber-400 dark:bg-amber-900/60 dark:text-amber-200',
                                        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-850 dark:text-slate-400',
                                    ];

                                    return (
                                        <div key={p.id || i} className="flex items-center gap-3">
                                            {/* Rank Circle */}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${rankBadgeStyles[i] || rankBadgeStyles[3]}`}>
                                                {i + 1}
                                            </div>

                                            {/* Name */}
                                            <span className="w-12 font-bold text-xs text-slate-900 dark:text-slate-100 shrink-0">
                                                {p.name || p.code}
                                            </span>

                                            {/* Progress Bar */}
                                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                                    style={{ width: `${p.compliance_rate}%` }}
                                                />
                                            </div>

                                            {/* Percentage */}
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-right">
                                                {p.compliance_rate}%
                                            </span>

                                            {/* Trend Badge */}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${
                                                p.changeType === 'down'
                                                    ? 'text-red-600 bg-red-50 dark:bg-red-950/60 dark:text-red-300'
                                                    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            }`}>
                                                {p.change || '+ 5%'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* In-Page Consolidated Calendar Modal (also accessible via header) */}
            <ConsolidatedCalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                events={calendar_data?.events}
                programs={calendar_data?.programs}
                venues={calendar_data?.venues}
                initialDate="2026-10-13"
            />
        </AppLayout>
    );
}
