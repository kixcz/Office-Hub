import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { 
    History, 
    RotateCcw, 
    CheckCircle2, 
    Clock, 
    User, 
    ShieldAlert, 
    ArrowRight,
    FileSpreadsheet,
    Tv
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Publication History', href: '/tv-config/history' },
];

interface VersionRecord {
    version: string;
    published_at: string;
    published_by: string;
    changes: string;
    slides_count: number;
    status: string;
}

interface Props {
    history: VersionRecord[];
}

export default function TvPublicationHistoryPage({ history }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Publication History - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                <History className="w-4 h-4" />
                                <span>Audit & Deployment Log</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                TV Publication History & Rollbacks
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Trace who published slide changes, inspect diffs, and safely revert to previous display configurations.
                            </p>
                        </div>
                    </div>

                    {/* Timeline List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {history.map((record, index) => {
                            const isCurrent = record.status === 'Current Live';

                            return (
                                <div
                                    key={record.version}
                                    className={cn(
                                        "p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                                        isCurrent ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                                    )}
                                >
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
                                            isCurrent
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        )}>
                                            {record.version}
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Release {record.version}
                                                </h3>
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                    isCurrent
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                )}>
                                                    {record.status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                {record.changes}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {record.published_at}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {record.published_by}
                                                </span>
                                                <span>
                                                    {record.slides_count} Active Slides
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                                        {isCurrent ? (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Active on Displays
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => alert(`Reverting to ${record.version}... Display will update on next refresh cycle.`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Rollback to this version</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
