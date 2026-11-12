import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Briefcase, ClipboardCheck, Clock, RefreshCw, Users } from 'lucide-react';
import React from 'react';

interface Props {
    college_metrics: any[];
    faculty_sample: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Faculty & Instruction', href: '/vpaa/faculty-instruction' },
];

export default function VpaaFacultyInstruction({ college_metrics, faculty_sample, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Faculty & Instruction Supervision" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Users className="h-7 w-7 text-primary" />
                        Faculty Loading & Instructional Completion
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Cross-college monitoring of teaching units, workload caps, verified session deliveries, and outstanding make-up classes.
                    </p>
                </div>

                {/* College Workload Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {college_metrics.map((c) => (
                        <div key={c.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-foreground text-sm">{c.code} · {c.name}</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted">
                                    {c.faculty_count} Faculty
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs mt-3 pt-3 border-t border-border/60">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Workload Balance:</span>
                                    <span className="font-bold text-foreground">{c.workload_balance}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Overload / Underload:</span>
                                    <span className="font-semibold text-foreground">
                                        <span className="text-amber-600">{c.overload_count} Over</span> · <span className="text-slate-500">{c.underload_count} Under</span>
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Instruction Delivered:</span>
                                    <span className="font-bold text-emerald-600">{c.completion_rate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Outstanding Make-ups:</span>
                                    <span className="font-bold text-foreground">{c.outstanding_makeups} classes</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sample Faculty Loading Table */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                    <h3 className="text-base font-bold text-foreground mb-4">Faculty Workload Distribution</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="pb-3 pr-4">Faculty Member</th>
                                    <th className="pb-3 px-3">College & Program</th>
                                    <th className="pb-3 px-3 text-center">Assigned Units</th>
                                    <th className="pb-3 px-3 text-center">Load Status</th>
                                    <th className="pb-3 px-3 text-center">Attendance</th>
                                    <th className="pb-3 px-3 text-center">Instruction Delivered</th>
                                    <th className="pb-3 pl-3 text-right">Make-Up Obligations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {faculty_sample.map((f) => (
                                    <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="py-3 pr-4 font-bold text-foreground">
                                            {f.name}
                                            <span className="block text-[11px] font-normal text-muted-foreground">{f.academic_rank}</span>
                                        </td>
                                        <td className="py-3 px-3 text-xs text-muted-foreground">
                                            {f.college_code} · {f.program_code}
                                        </td>
                                        <td className="py-3 px-3 text-center font-bold text-foreground">{f.teaching_units}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    f.load_status === 'Overloaded'
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                                                        : f.load_status === 'Underloaded'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                }`}
                                            >
                                                {f.load_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center text-xs font-semibold">{f.attendance_rate}</td>
                                        <td className="py-3 px-3 text-center text-xs font-bold text-emerald-600">{f.completion_rate}</td>
                                        <td className="py-3 pl-3 text-right text-xs font-bold text-foreground">
                                            {f.pending_makeups > 0 ? (
                                                <span className="text-amber-600">{f.pending_makeups} Required</span>
                                            ) : (
                                                <span className="text-emerald-600">None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

