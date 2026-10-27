import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    CalendarDays,
    CheckCircle2,
    CheckSquare,
    ClipboardCheck,
    Layers,
    Monitor,
    Sliders,
    Sparkles,
    Trophy,
    Tv,
    XCircle,
} from 'lucide-react';

interface College {
    id: number;
    code: string;
    name: string;
    enabled_modules: Record<string, boolean>;
}

interface ModuleCatalogItem {
    id: string;
    name: string;
    category: string;
    icon: string;
    global_enabled: boolean;
}

interface Props {
    colleges: College[];
    modulesCatalog: ModuleCatalogItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Platform Configuration', href: '/institution/modules' },
    { title: 'Module Management', href: '/institution/modules' },
];

export default function PlatformModules({ colleges, modulesCatalog }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Module Management · Platform Configuration" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Platform Module Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Control which COMPASS functional capabilities exist globally and which colleges are authorized to access them.
                        </p>
                    </div>

                    <Link
                        href="/institution/colleges/setup"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-xs"
                    >
                        <Sliders className="w-4 h-4" />
                        Configure by College
                    </Link>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {modulesCatalog.map((mod) => (
                        <div
                            key={mod.id}
                            className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {mod.category}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Global Active
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-foreground">{mod.name}</h3>
                            </div>

                            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>College Access:</span>
                                <span className="font-bold text-foreground">
                                    {colleges.filter((c) => c.enabled_modules?.[mod.id] !== false).length} / {colleges.length} Units
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* College x Module Availability Matrix */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-lg font-bold">Cross-College Module Matrix</h3>
                        <p className="text-xs text-muted-foreground">
                            Active functional boundaries enabled per college or organizational unit.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-4 py-3">College Unit</th>
                                    {modulesCatalog.map((m) => (
                                        <th key={m.id} className="px-3 py-3 text-center">
                                            {m.name.split(' ')[0]}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {colleges.map((col) => (
                                    <tr key={col.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>{col.code}</span>
                                                <span className="text-[11px] text-muted-foreground font-normal">
                                                    ({col.name})
                                                </span>
                                            </div>
                                        </td>
                                        {modulesCatalog.map((m) => {
                                            const isEnabled = col.enabled_modules?.[m.id] !== false;
                                            return (
                                                <td key={m.id} className="px-3 py-3 text-center">
                                                    {isEnabled ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-muted-foreground/40 inline-block" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/institution/colleges/setup?college=${col.id}`}
                                                className="text-amber-500 hover:underline font-bold text-[11px]"
                                            >
                                                Edit Access
                                            </Link>
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
