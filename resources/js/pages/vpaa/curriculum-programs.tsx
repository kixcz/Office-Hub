import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, GraduationCap, Layers, CheckSquare } from 'lucide-react';
import React from 'react';

interface ProgramItem {
    id: number;
    code: string;
    name: string;
    college_code: string;
    college_name: string;
    curricula_count: number;
    active_curriculum_version: string;
    total_units: number;
    readiness_status: string;
    faculty_count: number;
}

interface Props {
    programs: ProgramItem[];
    colleges: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Curriculum & Programs', href: '/vpaa/curriculum-programs' },
];

export default function VpaaCurriculumPrograms({ programs, colleges, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Curriculum & Programs Oversight" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <GraduationCap className="h-7 w-7 text-primary" />
                        Program Portfolio & Curriculum Oversight
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Institutional review of degree offerings, active curricula versions, sequencing rules, and course readiness across all colleges.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-foreground">Active Degree Programs ({programs.length})</h3>
                        <span className="text-xs text-muted-foreground">Read & Review Oversight</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="pb-3 pr-4">Program</th>
                                    <th className="pb-3 px-3">College</th>
                                    <th className="pb-3 px-3">Curriculum Version</th>
                                    <th className="pb-3 px-3 text-center">Total Units</th>
                                    <th className="pb-3 px-3 text-center">Faculty Assigned</th>
                                    <th className="pb-3 pl-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {programs.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="py-3.5 pr-4 font-bold text-foreground">
                                            {p.name} ({p.code})
                                        </td>
                                        <td className="py-3.5 px-3 text-xs text-muted-foreground">{p.college_code}</td>
                                        <td className="py-3.5 px-3 text-xs font-semibold text-foreground">
                                            {p.active_curriculum_version} ({p.curricula_count} versions)
                                        </td>
                                        <td className="py-3.5 px-3 text-center text-xs font-bold text-foreground">{p.total_units}</td>
                                        <td className="py-3.5 px-3 text-center text-xs font-bold text-foreground">{p.faculty_count}</td>
                                        <td className="py-3.5 pl-3 text-right">
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                {p.readiness_status}
                                            </span>
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

