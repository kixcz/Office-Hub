import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Calendar, CalendarDays, CheckCircle2, ShieldAlert } from 'lucide-react';
import React from 'react';

interface Props {
    college_metrics: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Scheduling & Exams', href: '/vpaa/scheduling-exams' },
];

export default function VpaaSchedulingExams({ college_metrics, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Scheduling & Exam Oversight" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <CalendarDays className="h-7 w-7 text-primary" />
                        Scheduling Readiness & Examination Governance
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Institutional oversight of timetable generation, dean approvals, laboratory room conflicts, and examination compliance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {college_metrics.map((col) => (
                        <div key={col.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-foreground text-base">{col.code}</span>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        col.schedule_status === 'Published'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                            : col.schedule_conflicts > 0
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                    }`}
                                >
                                    {col.schedule_status}
                                </span>
                            </div>
                            <h4 className="text-xs font-semibold text-foreground mb-1">{col.name}</h4>
                            <p className="text-xs text-muted-foreground mb-4">Stage: {col.schedule_stage}</p>

                            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Unresolved Conflicts:</span>
                                <span className="font-bold text-foreground">
                                    {col.schedule_conflicts > 0 ? (
                                        <span className="text-rose-600 font-extrabold">{col.schedule_conflicts} Blocking Overlaps</span>
                                    ) : (
                                        <span className="text-emerald-600">0 (Clean Timetable)</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

