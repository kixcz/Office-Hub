import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    CheckCircle2,
    Layers,
    Sliders,
    Sparkles,
    XCircle,
} from 'lucide-react';

interface College {
    id: number;
    code: string;
    name: string;
    type?: string;
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
    featureFlags?: Record<string, boolean>;
    initialTab?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Module Management & Feature Flags', href: '/institution/modules' },
];

export default function PlatformModules({
    colleges = [],
    modulesCatalog = [],
    featureFlags = {},
    initialTab = 'modules',
}: Props) {
    const [activeTab, setActiveTab] = React.useState<'modules' | 'flags'>(
        initialTab === 'flags' ? 'flags' : 'modules'
    );

    React.useEffect(() => {
        if (initialTab === 'flags' || initialTab === 'modules') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    const toggleCollegeModule = (collegeId: number, moduleKey: string) => {
        router.post(
            '/institution/modules/college-toggle',
            { college_id: collegeId, module_key: moduleKey },
            { preserveScroll: true }
        );
    };

    const toggleFlag = (flagKey: string) => {
        router.post(
            '/institution/modules/feature-flags',
            { flag_key: flagKey },
            { preserveScroll: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Module Management & Feature Flags · Platform Configuration" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Global, Per-Entity & Per-College Rollout
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Module Management & Feature Flags
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Register and control Velora’s 12 core functional modules globally, per Campus Entity, or per College, and manage experimental feature flags.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('modules')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'modules'
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Module Management
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('flags')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'flags'
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Feature Flags
                            </button>
                        </div>
                        <Link
                            href="/institution/colleges/setup"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-xs shrink-0"
                        >
                            <Sliders className="w-4 h-4" />
                            Guided Unit Onboarding
                        </Link>
                    </div>
                </div>

                {activeTab === 'modules' ? (
                    <>
                        {/* Modules Catalog Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {modulesCatalog.map((mod) => (
                        <div
                            key={mod.id}
                            className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-2.5 flex flex-col justify-between"
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {mod.category}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        Global Active
                                    </span>
                                </div>
                                <h3 className="font-bold text-xs text-foreground">{mod.name}</h3>
                            </div>

                            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>Unit Adoption:</span>
                                <span className="font-bold text-foreground">
                                    {colleges.filter((c) => c.enabled_modules?.[mod.id] === true).length} / {colleges.length} Units
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Entity & College x Module Availability Matrix */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-base font-extrabold">
                            Interactive Entity & College × Module Availability Matrix
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Click any cell to enable or disable a Velora module for that specific Entity or College. Downstream role sidebars adapt to enabled modules.
                        </p>
                    </div>

                    <div className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-muted/95 z-10 min-w-[200px]">
                                        Entity / College Unit
                                    </th>
                                    {modulesCatalog.map((m) => (
                                        <th key={m.id} className="px-2.5 py-3 text-center min-w-[85px]">
                                            {m.name.split(' ')[0]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {colleges.map((col) => (
                                    <tr key={col.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                        col.type === 'Entity'
                                                            ? 'bg-amber-500/15 text-amber-500'
                                                            : 'bg-blue-500/15 text-blue-500'
                                                    }`}
                                                >
                                                    {col.type || 'College'}
                                                </span>
                                                <span>{col.code}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-normal block line-clamp-1">
                                                {col.name}
                                            </span>
                                        </td>
                                        {modulesCatalog.map((m) => {
                                            const isEnabled = col.enabled_modules?.[m.id] === true;
                                            return (
                                                <td
                                                    key={m.id}
                                                    onClick={() => toggleCollegeModule(col.id, m.id)}
                                                    className="px-2.5 py-3 text-center cursor-pointer hover:bg-amber-500/10 transition-colors"
                                                    title={`Toggle ${m.name} for ${col.code}`}
                                                >
                                                    {isEnabled ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-muted-foreground/35 inline-block" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                ) : (
                    /* Feature Flags Section */
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <div>
                                <h3 className="text-base font-extrabold">Controlled Feature Flags Rollout</h3>
                                <p className="text-xs text-muted-foreground">
                                    Toggle optional, experimental, or staged capabilities (AI document extraction, QR inventory scanning, advanced timetable optimization, AI comment summaries) without enabling an entire module.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(featureFlags).map(([flagKey, enabled]) => (
                                <div
                                    key={flagKey}
                                    onClick={() => toggleFlag(flagKey)}
                                    className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-all"
                                >
                                    <div>
                                        <span className="font-mono font-bold text-xs block capitalize">
                                            {flagKey.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Click to {enabled ? 'disable' : 'enable'} globally
                                        </span>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                                            enabled
                                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                                : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                        {enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
