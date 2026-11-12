import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Award,
    BarChart3,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    GraduationCap,
    Layers,
    Monitor,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import React from 'react';

interface CollegeMetric {
    id: number;
    code: string;
    name: string;
    dean_name: string;
    campus: string;
    programs_count: number;
    faculty_count: number;
    attendance_rate: number;
    completion_rate: number;
    compliance_rate: number;
    workload_balance: number;
    overload_count: number;
    underload_count: number;
    outstanding_makeups: number;
    schedule_status: string;
    schedule_stage: string;
    schedule_conflicts: number;
    badge_color: string;
    requires_attention: boolean;
}

interface RiskItem {
    id: number;
    severity: 'critical' | 'warning' | 'info';
    college_code: string;
    title: string;
    description: string;
    action: string;
}

interface DecisionItem {
    category: string;
    title: string;
    impact: string;
    status: string;
}

interface Props {
    metrics: {
        total_colleges: number;
        total_programs: number;
        total_faculty: number;
        avg_attendance: number;
        avg_completion: number;
        avg_compliance: number;
        avg_workload_balance: number;
        total_makeups: number;
        total_conflicts: number;
        attention_count: number;
    };
    college_comparison: CollegeMetric[];
    academic_risks: RiskItem[];
    decision_support: DecisionItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Dashboard', href: '/vpaa/dashboard' },
];

export default function VpaaDashboard({ metrics, college_comparison, academic_risks, decision_support }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Academic Executive Dashboard" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner: Academic Governance & Institution Scope */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3A67] via-[#164E87] to-[#8B1E3F] p-6 md:p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>Institution-Wide Academic Supervision & Governance</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                VPAA Academic Operations & Quality Dashboard
                            </h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                Supervising academic delivery, curriculum integrity, faculty loading balance, and timetable readiness across all campuses and colleges.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/vpaa/academic-overview?tab=performance"
                                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/25 transition-all border border-white/20"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Academic Matrix
                            </Link>
                            <Link
                                href="/vpaa/tv-communications"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0B3A67] shadow-md hover:bg-neutral-100 transition-all"
                            >
                                <Monitor className="h-4 w-4 text-[#8B1E3F]" />
                                Executive TV Desk
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Primary KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Colleges / Units</span>
                            <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-foreground">{metrics.total_colleges}</div>
                        <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
                            {metrics.total_programs} Active Degree Programs
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Instruction Rate</span>
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            {metrics.avg_completion}%
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
                            {metrics.avg_attendance}% Attendance Coverage
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Workload Balance</span>
                            <Users className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                            {metrics.avg_workload_balance}%
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
                            {metrics.total_faculty} Total Faculty Monitored
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Syllabus & TOS</span>
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                            {metrics.avg_compliance}%
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
                            Academic Compliance Rate
                        </span>
                    </div>

                    <div className="col-span-2 md:col-span-4 lg:col-span-1 rounded-2xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20 p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Attention Needed</span>
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-300">
                            {metrics.attention_count} Units
                        </div>
                        <span className="text-[11px] font-semibold text-rose-600/90 dark:text-rose-400 mt-1 block">
                            {metrics.total_conflicts} Blocking Conflicts · {metrics.total_makeups} Make-ups
                        </span>
                    </div>
                </div>

                {/* Comparative Academic Matrix (Colleges & Performance) */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Cross-College Academic Performance & Readiness Matrix
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Comparative oversight across all academic units for strategic coordination and resource allocation.
                            </p>
                        </div>
                        <Link
                            href="/vpaa/academic-overview?tab=performance"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            Detailed Matrix Breakdown <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="pb-3 pr-4">College</th>
                                    <th className="pb-3 px-3 text-center">Workload Balance</th>
                                    <th className="pb-3 px-3 text-center">Attendance</th>
                                    <th className="pb-3 px-3 text-center">Instruction Delivery</th>
                                    <th className="pb-3 px-3 text-center">Compliance</th>
                                    <th className="pb-3 px-3 text-center">Schedule Status</th>
                                    <th className="pb-3 pl-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {college_comparison.map((col) => (
                                    <tr key={col.id} className="hover:bg-muted/40 transition-colors group">
                                        <td className="py-3.5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                                    {col.code}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-foreground text-sm truncate">{col.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Dean: {col.dean_name} · {col.programs_count} Programs ({col.faculty_count} Faculty)
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <span className="font-bold text-foreground">{col.workload_balance}%</span>
                                            <div className="text-[11px] text-muted-foreground">
                                                {col.overload_count > 0 ? (
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">{col.overload_count} Overloaded</span>
                                                ) : (
                                                    <span className="text-emerald-600 dark:text-emerald-400">Balanced</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <span className="font-bold text-foreground">{col.attendance_rate}%</span>
                                            <div className="text-[11px] text-muted-foreground">Coverage</div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <span className={`font-bold ${col.completion_rate >= 95 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                                {col.completion_rate}%
                                            </span>
                                            <div className="text-[11px] text-muted-foreground">
                                                {col.outstanding_makeups} Make-ups
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <span className={`font-bold ${col.compliance_rate >= 95 ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                                                {col.compliance_rate}%
                                            </span>
                                            <div className="text-[11px] text-muted-foreground">Verified</div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    col.schedule_status === 'Published'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                        : col.schedule_conflicts > 0
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                                }`}
                                            >
                                                {col.schedule_status}
                                            </span>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">{col.schedule_stage}</div>
                                        </td>
                                        <td className="py-3.5 pl-3 text-right">
                                            <Link
                                                href={`/vpaa/curriculum-programs?college=${col.code}`}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                            >
                                                Drilldown
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Two-Column: Risk & Attention Center + Academic Decision Support */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk & Attention Center */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                                    Risk & Attention Center
                                </h3>
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                                    {academic_risks.length} Action Items
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Critical operational flags surfaced from verified class monitoring, room schedules, and faculty loading data.
                            </p>

                            <div className="space-y-3">
                                {academic_risks.map((risk) => (
                                    <div
                                        key={risk.id}
                                        className={`p-3.5 rounded-2xl border text-left ${
                                            risk.severity === 'critical'
                                                ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'
                                                : risk.severity === 'warning'
                                                ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20'
                                                : 'border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                                                        {risk.college_code}
                                                    </span>
                                                    <span className="text-xs font-bold text-foreground">{risk.title}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-foreground/80">
                                                Recommended: {risk.action}
                                            </span>
                                            <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                                                Review Flag &gt;
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border/70 flex justify-end">
                            <Link
                                href="/vpaa/academic-overview?tab=risks"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                Open Full Risk Center &gt;
                            </Link>
                        </div>
                    </div>

                    {/* Academic Decision Support */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 md:p-6 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                    Academic Decision Support
                                </h3>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                                    Synthesized Policy Guidance
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Data-driven institutional interventions to optimize student cohorts, balance academic loading, and avoid delivery bottlenecks.
                            </p>

                            <div className="space-y-3">
                                {decision_support.map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-background/50 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                {item.category}
                                            </span>
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-foreground mb-1">{item.title}</div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{item.impact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border/70 flex justify-end">
                            <Link
                                href="/vpaa/academic-overview?tab=decision-support"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                Explore Institutional Interventions &gt;
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

