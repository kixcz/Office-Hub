import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, Briefcase, CalendarDays, FileCheck, FileText } from 'lucide-react';
import React from 'react';

interface Props {
    college_metrics: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Academic Reports', href: '/vpaa/reports' },
];

export default function VpaaReports({ college_metrics, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Consolidated Academic Reports" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <FileText className="h-7 w-7 text-primary" />
                        Executive Academic & Performance Reports
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Certified institutional reports, college comparisons, faculty loading distribution, and schedule compliance for BOR presentation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                        { title: 'Consolidated Academic Report', desc: 'Comprehensive summary of teaching completion, attendance, and compliance.', icon: FileCheck },
                        { title: 'College Comparison Matrix', desc: 'Normalized indicators comparing colleges of varying sizes and program counts.', icon: BarChart3 },
                        { title: 'Faculty Workload Distribution', desc: 'Overload, regular load, and underload breakdown by academic unit.', icon: Briefcase },
                        { title: 'Scheduling & Timetable Report', desc: 'Room utilization, lab bottlenecks, and schedule publication timestamps.', icon: CalendarDays },
                    ].map((rep, idx) => {
                        const Icon = rep.icon;
                        return (
                            <div key={idx} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs flex flex-col justify-between">
                                <div>
                                    <Icon className="h-6 w-6 text-primary mb-3" />
                                    <h4 className="text-sm font-bold text-foreground mb-1">{rep.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{rep.desc}</p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-muted-foreground">PDF / XLSX Ready</span>
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Generate &gt;
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}

