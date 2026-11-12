import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    FileCheck,
    GraduationCap,
    Layers,
    ShieldAlert,
    Sparkles,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    colleges: any[];
    detailed_colleges: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Academic Overview', href: '/vpaa/academic-overview' },
];

export default function VpaaAcademicOverview({ colleges, detailed_colleges, active_tab }: Props) {
    const [currentTab, setCurrentTab] = useState(active_tab);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Academic Overview" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Building2 className="h-7 w-7 text-primary" />
                        Academic Units, Performance & Risk Center
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Hierarchical supervision across all colleges and campuses. Read, review, compare, endorse, and flag without editing operational records.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
                    {[
                        { id: 'colleges-programs', label: 'Colleges & Programs', icon: Building2 },
                        { id: 'performance', label: 'Academic Performance Matrix', icon: BarChart3 },
                        { id: 'risks', label: 'Risk & Attention Center', icon: AlertTriangle },
                        { id: 'decision-support', label: 'Academic Decision Support', icon: Sparkles },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCurrentTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Panes */}
                {currentTab === 'colleges-programs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {colleges.map((col) => (
                            <div
                                key={col.id}
                                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 shadow-xs flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                                            {col.code}
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                                            {col.campus}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-foreground mb-1">{col.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Dean: {col.dean_name} · {col.programs_count} Programs ({col.faculty_count} Faculty)
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-border/60 mb-4">
                                        <div>
                                            <span className="text-[10px] uppercase text-muted-foreground block">Instruction</span>
                                            <span className="font-bold text-foreground">{col.completion_rate}% Delivered</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase text-muted-foreground block">Compliance</span>
                                            <span className="font-bold text-foreground">{col.compliance_rate}% Verified</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] uppercase text-muted-foreground block">Timetable</span>
                                            <span className="font-bold text-foreground">{col.schedule_status}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] uppercase text-muted-foreground block">Workload</span>
                                            <span className="font-bold text-foreground">{col.workload_balance}% Balanced</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {col.schedule_conflicts > 0 ? (
                                            <span className="text-rose-500">{col.schedule_conflicts} Conflict(s)</span>
                                        ) : (
                                            <span className="text-emerald-500">No Conflicts</span>
                                        )}
                                    </span>
                                    <Link
                                        href={`/vpaa/curriculum-programs?college=${col.code}`}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Inspect Programs &gt;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentTab === 'performance' && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                        <h3 className="text-lg font-bold text-foreground mb-1">Comparative Academic Matrix</h3>
                        <p className="text-xs text-muted-foreground mb-6">
                            Matrix of verified instructional, attendance, compliance, and scheduling metrics across all academic units.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="pb-3 pr-4">College</th>
                                        <th className="pb-3 px-3 text-center">Workload Balance</th>
                                        <th className="pb-3 px-3 text-center">Attendance</th>
                                        <th className="pb-3 px-3 text-center">Instruction Delivery</th>
                                        <th className="pb-3 px-3 text-center">Compliance</th>
                                        <th className="pb-3 px-3 text-center">Schedule Status</th>
                                        <th className="pb-3 pl-3 text-right">Outstanding Make-ups</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {colleges.map((c) => (
                                        <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="py-3.5 pr-4">
                                                <div className="font-bold text-foreground">{c.name} ({c.code})</div>
                                                <div className="text-xs text-muted-foreground">{c.campus}</div>
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-bold text-foreground">{c.workload_balance}%</td>
                                            <td className="py-3.5 px-3 text-center font-bold text-foreground">{c.attendance_rate}%</td>
                                            <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{c.completion_rate}%</td>
                                            <td className="py-3.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">{c.compliance_rate}%</td>
                                            <td className="py-3.5 px-3 text-center">
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-foreground">
                                                    {c.schedule_status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pl-3 text-right font-bold text-amber-600 dark:text-amber-400">
                                                {c.outstanding_makeups} classes
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {currentTab === 'risks' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="rounded-3xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10 p-6 shadow-xs">
                            <h3 className="text-base font-bold text-rose-800 dark:text-rose-400 mb-2 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5" />
                                Unresolved Timetable Conflicts (Blocking)
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                5 scheduling collisions detected in COE engineering laboratories requiring dean mediation.
                            </p>
                            <div className="p-3.5 rounded-2xl bg-card border border-rose-200 dark:border-rose-900/40 text-xs">
                                <span className="font-bold text-foreground block mb-1">COE Room 201 & 204 Overlap</span>
                                <span className="text-muted-foreground">Engr. Paolo Mendoza & Engr. Victor Salcedo both assigned 1:00 PM - 4:00 PM Tuesday blocks.</span>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-amber-200 dark:border-amber-950/40 bg-amber-50/30 dark:bg-amber-950/10 p-6 shadow-xs">
                            <h3 className="text-base font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Faculty Overload Policy Cap Exceeded
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                5 faculty members in CED have assignments exceeding 24 units without approved BOR overload clearances.
                            </p>
                            <div className="p-3.5 rounded-2xl bg-card border border-amber-200 dark:border-amber-900/40 text-xs">
                                <span className="font-bold text-foreground block mb-1">Secondary Education Program Overload</span>
                                <span className="text-muted-foreground">Instructors handling 27 to 30 units across GenEd service courses. Recommendation: Transfer 3 loads to CAS.</span>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'decision-support' && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Synthesized Academic Interventions
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Recommendations synthesized from institutional course load, facility availability, and student cohort projections.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="p-4 rounded-2xl border border-border bg-background/50 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Intervention 1</span>
                                <h4 className="text-sm font-bold text-foreground">Section Redistribution: CED to CAS</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Transfer 4 sections of Understanding the Self to CAS faculty with available teaching capacity.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl border border-border bg-background/50 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Intervention 2</span>
                                <h4 className="text-sm font-bold text-foreground">Saturday Lab Scheduling Policy</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Permit COE 4th-year engineering capstone classes to utilize Saturday morning laboratory hours.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl border border-border bg-background/50 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Intervention 3</span>
                                <h4 className="text-sm font-bold text-foreground">Fast-Track Make-up Class Protocol</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Authorize asynchronous online instructional delivery for make-up sessions resulting from institutional holidays.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
