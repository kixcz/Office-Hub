import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, FolderKanban, Trophy } from 'lucide-react';
import React from 'react';

interface Props {
    college_metrics: any[];
    active_tab: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic Executive', href: '/vpaa/dashboard' },
    { title: 'Research & Extension', href: '/vpaa/research-extension' },
];

export default function VpaaResearchExtension({ college_metrics, active_tab }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="VPAA Research & Extension Outputs" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Trophy className="h-7 w-7 text-primary" />
                        Research & Extension Academic Outputs
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Consolidated academic research papers, utility patents, citations, and community extension programs across colleges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-card">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Peer-Reviewed Papers</span>
                        <div className="text-3xl font-black text-foreground mt-2">48</div>
                        <p className="text-xs text-muted-foreground mt-1">Published in Scopus / WoS indexed journals</p>
                    </div>
                    <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-card">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Utility Models & Patents</span>
                        <div className="text-3xl font-black text-foreground mt-2">12</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered with IPOPHIL</p>
                    </div>
                    <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-card">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Extension Engagements</span>
                        <div className="text-3xl font-black text-foreground mt-2">26</div>
                        <p className="text-xs text-muted-foreground mt-1">Community transfer programs active</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

