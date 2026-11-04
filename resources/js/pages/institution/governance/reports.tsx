import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    Layers,
    Printer,
    ShieldCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Institution Reports & Templates', href: '/institution/reports' },
];

interface UnitItem {
    id: number;
    code: string;
    name: string;
    type: string;
    entity_subtype?: string | null;
    status: string;
    setup_progress: number;
    setup_stage: string;
    dean_name?: string | null;
    parent?: { id: number; code: string; name: string } | null;
    programs?: { id: number; code: string; name: string }[];
    enabled_modules?: Record<string, boolean>;
}

interface RoleSummary {
    id: number;
    name: string;
    tier: string;
    risk_level: string;
    users_count: number;
    scoped_assignments_count: number;
    permissions_count: number;
}

interface ModuleCatalogItem {
    id?: string;
    key?: string;
    name?: string;
    label?: string;
    category: string;
    description?: string;
    global_enabled: boolean;
}

interface ReportConfig {
    header_line_1?: string;
    header_line_2?: string;
    header_line_3?: string;
    footer_notice?: string;
    methodology_note?: string;
    naming_convention?: string;
    default_signatories?: {
        prepared_by?: string;
        reviewed_by?: string;
        approved_by?: string;
        executive_noted_by?: string;
    };
}

interface Props {
    units: UnitItem[];
    roles: RoleSummary[];
    modulesCatalog: ModuleCatalogItem[];
    integrations: Record<string, { name: string; provider: string; connected: boolean; last_sync: string }>;
    reportConfig?: ReportConfig;
    healthIssues: { id: string; category: string; severity: string; scope: string; title: string }[];
    auditCount: number;
    initialTab?: string;
}

export default function InstitutionReports({
    units = [],
    roles = [],
    modulesCatalog = [],
    integrations = {},
    reportConfig,
    healthIssues = [],
    auditCount = 0,
    initialTab = 'reports',
}: Props) {
    const [topMode, setTopMode] = useState<'reports' | 'templates'>(
        initialTab === 'templates' ? 'templates' : 'reports',
    );
    const [activeReport, setActiveReport] = useState<
        'structure' | 'roles' | 'modules' | 'onboarding' | 'integrations'
    >('structure');

    React.useEffect(() => {
        if (initialTab === 'templates' || initialTab === 'reports') {
            setTopMode(initialTab);
        }
    }, [initialTab]);

    const entities = units.filter((u) => u.type === 'Entity');
    const colleges = units.filter((u) => u.type !== 'Entity');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Reports & Report Templates — Velora" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <FileText className="h-3.5 w-3.5" />
                                Structural Reports & Standardized Layouts
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Institution Reports & Report Templates
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Generate structural and platform-governance reports (distinct from VPAF performance
                                analytics) and govern institutional PDF/Excel headers, footers, methodology blocks, and
                                signatory placeholders.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
                                <button
                                    type="button"
                                    onClick={() => setTopMode('reports')}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                        topMode === 'reports'
                                            ? 'bg-indigo-500 text-white'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Institution Reports
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTopMode('templates')}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                        topMode === 'templates'
                                            ? 'bg-indigo-500 text-white'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Report Templates
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
                            >
                                <Printer className="h-4 w-4" /> Print / PDF
                            </button>
                        </div>
                    </div>
                </div>

                {topMode === 'templates' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Institutional Report Templates & Signatory Placeholders
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Standardized PDF/Excel headers, footers, methodology notes, and signatory blocks
                                    inherited by all Entities and Colleges.
                                </p>
                            </div>
                            <Link
                                href="/institution/profile"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                            >
                                <FileCheck2 className="h-4 w-4" /> Edit in Institution Profile
                            </Link>
                        </div>

                        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="text-center">
                                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                                    {reportConfig?.header_line_1 || 'Republic of the Philippines'}
                                </p>
                                <h3 className="mt-0.5 text-lg font-black tracking-wide text-slate-900 dark:text-white">
                                    {reportConfig?.header_line_2 || 'DAVAO DEL SUR STATE COLLEGE'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {reportConfig?.header_line_3 ||
                                        'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002'}
                                </p>
                            </div>

                            <div className="my-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <strong className="block text-slate-900 dark:text-white">
                                    Standard Methodology Block:
                                </strong>
                                {reportConfig?.methodology_note ||
                                    'Attendance, schedule, and workload metrics are reconciled across verified schedules, EHRIS official business records, and physical facility monitoring.'}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                {[
                                    {
                                        label: 'Prepared By',
                                        role:
                                            reportConfig?.default_signatories?.prepared_by ||
                                            'College Admin / Secretary',
                                    },
                                    {
                                        label: 'Reviewed By',
                                        role:
                                            reportConfig?.default_signatories?.reviewed_by ||
                                            'Program Head / Department Chair',
                                    },
                                    {
                                        label: 'Approved By',
                                        role: reportConfig?.default_signatories?.approved_by || 'College Dean',
                                    },
                                    {
                                        label: 'Noted By',
                                        role:
                                            reportConfig?.default_signatories?.executive_noted_by ||
                                            'Vice President for Academic Affairs / VPAF',
                                    },
                                ].map((sig) => (
                                    <div
                                        key={sig.label}
                                        className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            {sig.label}
                                        </span>
                                        <p className="mt-3 border-t border-slate-300 pt-1.5 font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                                            {sig.role}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-5 text-center text-[11px] text-slate-500">
                                {reportConfig?.footer_notice ||
                                    'ISO 9001:2015 Certified · Generated via Velora Institutional Governance Platform'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Report Selector Tabs */}
                        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                            {[
                                { id: 'structure', label: '1. Organization Structure Report', icon: Building2 },
                                { id: 'roles', label: '2. User & Role Assignment Report', icon: Users },
                                { id: 'modules', label: '3. Module Adoption Report', icon: Layers },
                                { id: 'onboarding', label: '4. College Setup & Data Quality Report', icon: CheckCircle2 },
                                { id: 'integrations', label: '5. Integration Health & Audit Report', icon: ShieldCheck },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveReport(
                                                tab.id as
                                                    | 'structure'
                                                    | 'roles'
                                                    | 'modules'
                                                    | 'onboarding'
                                                    | 'integrations',
                                            )
                                        }
                                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                            activeReport === tab.id
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {activeReport === 'structure' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Official Organization Structure Report ({entities.length} Entities ·{' '}
                                    {colleges.length} Colleges)
                                </h2>
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-4 py-3">Code</th>
                                                <th className="px-4 py-3">Unit Name</th>
                                                <th className="px-4 py-3">Classification</th>
                                                <th className="px-4 py-3">Parent Entity</th>
                                                <th className="px-4 py-3">Dean / Executive Lead</th>
                                                <th className="px-4 py-3">Programs</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {units.map((u) => (
                                                <tr key={u.id}>
                                                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                                                        {u.code}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                        {u.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {u.type === 'Entity'
                                                            ? `Entity (${u.entity_subtype || 'Campus'})`
                                                            : 'Academic College'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {u.parent ? `${u.parent.code} · ${u.parent.name}` : 'Institution Root'}
                                                    </td>
                                                    <td className="px-4 py-3">{u.dean_name || '—'}</td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {u.programs?.length ?? 0}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                            {u.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeReport === 'roles' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    User & Role Assignment Report
                                </h2>
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-4 py-3">Role Name</th>
                                                <th className="px-4 py-3">Governance Tier</th>
                                                <th className="px-4 py-3">Risk Level</th>
                                                <th className="px-4 py-3">Capabilities</th>
                                                <th className="px-4 py-3">Canonical Users</th>
                                                <th className="px-4 py-3">Scoped Assignments</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {roles.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                        {r.name}
                                                    </td>
                                                    <td className="px-4 py-3">{r.tier}</td>
                                                    <td className="px-4 py-3">{r.risk_level}</td>
                                                    <td className="px-4 py-3 font-semibold">{r.permissions_count}</td>
                                                    <td className="px-4 py-3 font-semibold">{r.users_count}</td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {r.scoped_assignments_count}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeReport === 'modules' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Velora Module Adoption Report
                                </h2>
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {modulesCatalog.map((mod) => {
                                        const modKey = mod.id || mod.key || '';
                                        const modLabel = mod.name || mod.label || modKey;
                                        const enabledUnitsCount = units.filter(
                                            (u) => u.enabled_modules?.[modKey] === true,
                                        ).length;
                                        return (
                                            <div
                                                key={modKey}
                                                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-indigo-600 uppercase">
                                                        {mod.category}
                                                    </span>
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                                        {enabledUnitsCount} / {units.length} Units
                                                    </span>
                                                </div>
                                                <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                                                    {modLabel}
                                                </h3>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeReport === 'onboarding' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    College Setup & Data Quality Report ({healthIssues.length} Findings)
                                </h2>
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {colleges.map((col) => (
                                        <div
                                            key={col.id}
                                            className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-indigo-600">
                                                        {col.code}
                                                    </span>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                                        {col.name}
                                                    </h3>
                                                </div>
                                                <span className="text-sm font-extrabold text-emerald-600">
                                                    {col.setup_progress}%
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Stage: <strong>{col.setup_stage}</strong> · Status:{' '}
                                                <strong>{col.status}</strong>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeReport === 'integrations' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Integration Health & Audit Summary ({auditCount} Logged Events)
                                </h2>
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {Object.entries(integrations).map(([key, item]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                        >
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {item.provider} · Last Sync: {item.last_sync}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                                {item.connected ? 'Healthy' : 'Offline'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
