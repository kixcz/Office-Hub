import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
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
    Tv,
    Eye,
    Layers,
    Sliders,
    Sparkles,
    Calendar,
    ArrowUpRight,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Publication History', href: '/tv-config/history' },
];

interface HistoryRecord {
    id: number;
    version: string;
    action: string;
    target_type: string;
    target_name?: string;
    published_at: string;
    published_by: string;
    changes: string;
    snapshot_before?: any;
    snapshot_after?: any;
    status: string;
}

interface Props {
    history: HistoryRecord[];
}

export default function TvPublicationHistoryPage({ history }: Props) {
    const [selectedSnapshot, setSelectedSnapshot] = useState<HistoryRecord | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);

    const handleRollback = (record: HistoryRecord) => {
        if (!confirm(`Are you sure you want to restore configuration snapshot from ${record.published_at} (${record.version})?`)) {
            return;
        }

        setIsRollingBack(true);
        router.post(`/tv-config/history/${record.id}/rollback`, {}, {
            onFinish: () => {
                setIsRollingBack(false);
                setSelectedSnapshot(null);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Publication History - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <History className="w-4 h-4" />
                                <span>Authoritative Audit & Recovery Trail</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                TV Publication History & Rollbacks
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                                Complete chronological audit log of all live TV display deployments, slide activations, Spotlight publications, and device settings changes with 1-click snapshot restore.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/preview"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Preview Current Live</span>
                            </Link>
                        </div>
                    </div>

                    {/* Timeline List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-semibold">No publication records logged yet.</p>
                            </div>
                        ) : (
                            history.map((record, index) => {
                                const isCurrent = index === 0;

                                return (
                                    <div
                                        key={record.id}
                                        className={cn(
                                            "p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                                            isCurrent ? "bg-amber-50/20 dark:bg-amber-950/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                                        )}
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-xs border",
                                                isCurrent
                                                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                            )}>
                                                {record.version}
                                            </div>

                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {record.action}: {record.target_type}
                                                    </h3>
                                                    {record.target_name && (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            · {record.target_name}
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        isCurrent
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                    )}>
                                                        {isCurrent ? 'Current Live' : record.status}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                    {record.changes}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{record.published_at}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>{record.published_by}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                                            {record.snapshot_after && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedSnapshot(record)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View Snapshot</span>
                                                </button>
                                            )}

                                            {!isCurrent && (
                                                <button
                                                    type="button"
                                                    disabled={isRollingBack}
                                                    onClick={() => handleRollback(record)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>Restore Version</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Snapshot Inspector Dialog */}
                {selectedSnapshot && (
                    <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
                        <DialogContent className="sm:max-w-xl bg-slate-950 text-white border-slate-800 p-6">
                            <DialogHeader>
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                                    <History className="w-4 h-4" />
                                    <span>Audit Snapshot Details</span>
                                </div>
                                <DialogTitle className="text-xl font-black text-white">
                                    {selectedSnapshot.action} ({selectedSnapshot.version})
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 my-2 text-xs">
                                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                                    <span>Published By: <strong className="text-white">{selectedSnapshot.published_by}</strong></span>
                                    <span>{selectedSnapshot.published_at}</span>
                                </div>

                                <p className="text-slate-300 font-medium">
                                    {selectedSnapshot.changes}
                                </p>

                                <div className="space-y-2">
                                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                                        Configuration Snapshot Data (JSON)
                                    </span>
                                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                                        {JSON.stringify(selectedSnapshot.snapshot_after || selectedSnapshot.snapshot_before, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSnapshot(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    disabled={isRollingBack}
                                    onClick={() => handleRollback(selectedSnapshot)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restore This Snapshot</span>
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </TvStudioLayout>
        </AppLayout>
    );
}
