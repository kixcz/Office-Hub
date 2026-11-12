import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Award, CheckSquare, LibraryBig, ShieldCheck, Star } from 'lucide-react';
import React from 'react';

interface Props {
    college_metrics: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Compliance & Quality', href: '/vpaa/compliance-quality' },
];

export default function VpaaComplianceQuality({ college_metrics, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Compliance & Quality" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <CheckSquare className="h-7 w-7 text-primary" />
                        Academic Requirements & Quality Indicators
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Tracking syllabus submissions, tables of specifications, examination papers, and evidence readiness across programs.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-xs">
                    <h3 className="text-base font-bold text-foreground mb-4">Academic Compliance Ranking by College</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="pb-3 pr-4">College</th>
                                    <th className="pb-3 px-3 text-center">Verified Compliance</th>
                                    <th className="pb-3 px-3 text-center">Instruction Delivered</th>
                                    <th className="pb-3 pl-3 text-right">Accreditation Evidence Readiness</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {college_metrics.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="py-3.5 pr-4 font-bold text-foreground">
                                            {c.name} ({c.code})
                                        </td>
                                        <td className="py-3.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                                            {c.compliance_rate}%
                                        </td>
                                        <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                            {c.completion_rate}%
                                        </td>
                                        <td className="py-3.5 pl-3 text-right">
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-foreground">
                                                {c.compliance_rate >= 90 ? 'Level III Ready' : 'In Progress'}
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

