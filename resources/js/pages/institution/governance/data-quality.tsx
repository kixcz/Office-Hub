import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Filter,
    HeartPulse,
    ShieldAlert,
    Wrench,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Data Quality & Configuration Health', href: '/institution/data-quality' },
];

interface HealthIssue {
    id: string;
    category: string;
    severity: 'critical' | 'warning' | 'info';
    scope: string;
    title: string;
    description: string;
    action_url: string;
    action_label: string;
}

interface UnitSummary {
    id: number;
    code: string;
    name: string;
    type: string;
    entity_subtype?: string | null;
    status: string;
    setup_progress: number;
    setup_stage: string;
    programs_count: number;
    scoped_roles_count: number;
    dean_name?: string | null;
}

interface Props {
    issues: HealthIssue[];
    units: UnitSummary[];
    score: number;
    initialTab?: string;
}

export default function InstitutionDataQuality({
    issues = [],
    units = [],
    score = 100,
    initialTab = 'data-quality',
}: Props) {
    const [activeTab, setActiveTab] = useState<'data-quality' | 'config-health'>(
        initialTab === 'config-health' ? 'config-health' : 'data-quality',
    );
    const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    React.useEffect(() => {
        if (initialTab === 'config-health' || initialTab === 'data-quality') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const categories = Array.from(new Set(issues.map((i) => i.category)));

    const filteredIssues = issues.filter((issue) => {
        if (severityFilter !== 'all' && issue.severity !== severityFilter) {
            return false;
        }
        if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
            return false;
        }
        return true;
    });

    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Quality & Configuration Health — Ascend Governance" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                                <HeartPulse className="h-3.5 w-3.5" />
                                Continuous Structural & Governance Diagnostics
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Data Quality & Configuration Health
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Detect unresolved mappings, orphan records, missing relationships, and inspect unit-by-unit
                                operational readiness across Ascend.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('data-quality')}
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                                        activeTab === 'data-quality'
                                            ? 'bg-indigo-500 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Data Quality ({issues.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('config-health')}
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                                        activeTab === 'config-health'
                                            ? 'bg-indigo-500 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Configuration Health ({units.length} Units)
                                </button>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xs">
                                <div>
                                    <span className="block text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                                        Readiness Score
                                    </span>
                                    <span className="text-xl font-extrabold text-emerald-400">{score}%</span>
                                </div>
                                <Activity className="h-7 w-7 text-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'data-quality' ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Data Quality Findings ({filteredIssues.length}) · {criticalCount} Critical ·{' '}
                                    {warningCount} Warnings
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {(['all', 'critical', 'warning'] as const).map((sev) => (
                                    <button
                                        key={sev}
                                        type="button"
                                        onClick={() => setSeverityFilter(sev)}
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
                                            severityFilter === sev
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {sev}
                                    </button>
                                ))}

                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className={`flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${
                                        issue.severity === 'critical'
                                            ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/20'
                                            : 'border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                                    issue.severity === 'critical'
                                                        ? 'bg-rose-600 text-white'
                                                        : 'bg-[#0B3A67] text-white'
                                                }`}
                                            >
                                                {issue.severity}
                                            </span>
                                            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                                                {issue.scope}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {issue.category}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{issue.title}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            {issue.description}
                                        </p>
                                    </div>

                                    <Link
                                        href={issue.action_url}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                                    >
                                        <Wrench className="h-3.5 w-3.5" />
                                        {issue.action_label}
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Configuration Health Matrix per Unit */
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {units.map((u) => {
                            const hasAdmin = u.scoped_roles_count > 0;
                            const hasPrograms = u.type === 'Entity' || u.programs_count > 0;
                            const roomsConfigured = u.setup_progress >= 80;
                            const policiesComplete = u.setup_progress >= 90;

                            return (
                                <div
                                    key={u.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="rounded bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                {u.code}
                                            </span>
                                            <span className="text-sm font-extrabold text-emerald-600">
                                                {u.setup_progress}% Ready
                                            </span>
                                        </div>
                                        <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                                            {u.name}
                                        </h3>

                                        <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between">
                                                <span>{u.type === 'Entity' ? 'Entity Admin' : 'College Admin'}</span>
                                                {hasAdmin ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                                        <XCircle className="h-3.5 w-3.5" /> Missing
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Academic Period Inherited</span>
                                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                                                </span>
                                            </div>
                                            {u.type !== 'Entity' && (
                                                <div className="flex items-center justify-between">
                                                    <span>Academic Programs</span>
                                                    {hasPrograms ? (
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> {u.programs_count}{' '}
                                                            Registered
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 font-bold text-[#0B3A67] dark:text-[#93C5FD]">
                                                            <AlertTriangle className="h-3.5 w-3.5" /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span>Rooms & Facilities Registry</span>
                                                {roomsConfigured ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-bold text-[#0B3A67] dark:text-[#93C5FD]">
                                                        <AlertTriangle className="h-3.5 w-3.5" /> Not configured
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Scheduling & Attendance Policies</span>
                                                {policiesComplete ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                                        <XCircle className="h-3.5 w-3.5" /> Incomplete
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Link
                                            href={`/institution/colleges/setup?college=${u.id}`}
                                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            Open Unit Onboarding Checklist →
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
