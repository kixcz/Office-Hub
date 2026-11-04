import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    Bot,
    CheckCircle2,
    Cloud,
    Cpu,
    Database,
    Globe,
    KeyRound,
    Lock,
    RefreshCw,
    Save,
    Sparkles,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Data & Integrations', href: '/institution/integrations' },
];

interface IntegrationItem {
    name: string;
    provider: string;
    connected: boolean;
    domain?: string;
    endpoint?: string;
    model?: string;
    active_syncs?: number;
    quota_healthy?: boolean;
    scopes?: string;
    last_sync: string;
    owner: string;
    masked_credential?: string;
}

interface SyncConfig {
    auto_match_confidence_threshold: number;
    needs_review_threshold: number;
    duplicate_detection_mode: string;
    source_precedence: string;
    require_human_approval_for_schedule_import: boolean;
    require_human_approval_for_calendar_ai: boolean;
    auto_link_faculty_aliases: boolean;
    sync_freshness_interval_minutes: number;
}

interface Props {
    integrations: Record<string, IntegrationItem>;
    syncConfig: SyncConfig;
    initialTab?: string;
}

type IntegrationTab = 'sources' | 'google' | 'external' | 'ai' | 'reconciliation' | 'health';

export default function InstitutionIntegrations({
    integrations = {},
    syncConfig,
    initialTab = 'sources',
}: Props) {
    const validTabs: IntegrationTab[] = ['sources', 'google', 'external', 'ai', 'reconciliation', 'health'];
    const [activeTab, setActiveTab] = useState<IntegrationTab>(
        validTabs.includes(initialTab as IntegrationTab) ? (initialTab as IntegrationTab) : 'sources',
    );

    React.useEffect(() => {
        if (validTabs.includes(initialTab as IntegrationTab)) {
            setActiveTab(initialTab as IntegrationTab);
        }
    }, [initialTab]);

    const form = useForm({
        sync_config: {
            auto_match_confidence_threshold: syncConfig?.auto_match_confidence_threshold ?? 92,
            needs_review_threshold: syncConfig?.needs_review_threshold ?? 75,
            duplicate_detection_mode:
                syncConfig?.duplicate_detection_mode ?? 'Strict Checksum + Normalized Alias',
            source_precedence:
                syncConfig?.source_precedence ??
                'Official Published Schedule > EHRIS Approved OB > Google Sheets Snapshot',
            require_human_approval_for_schedule_import:
                syncConfig?.require_human_approval_for_schedule_import ?? true,
            require_human_approval_for_calendar_ai:
                syncConfig?.require_human_approval_for_calendar_ai ?? true,
            auto_link_faculty_aliases: syncConfig?.auto_link_faculty_aliases ?? true,
            sync_freshness_interval_minutes: syncConfig?.sync_freshness_interval_minutes ?? 15,
        },
    });

    const handleSaveSync = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/institution/integrations/sync-config', {
            preserveScroll: true,
        });
    };

    const entries = Object.entries(integrations);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data & Integrations — Velora Governance" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 space-y-4">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <Database className="h-3.5 w-3.5" />
                                Data & Integrations Governance
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Velora Data Sources, External Systems & AI Governance
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Centrally manage the external data registry, Google Workspace OAuth & Shared Drives,
                                e-HRIS / SIS bridges, Gemini 2.5 AI document understanding, reconciliation thresholds,
                                and live integration health.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
                            {[
                                { id: 'sources', label: 'Data Sources', icon: Database },
                                { id: 'google', label: 'Google Workspace', icon: Globe },
                                { id: 'external', label: 'External Systems', icon: Cpu },
                                { id: 'ai', label: 'AI & Document Understanding', icon: Bot },
                                { id: 'reconciliation', label: 'Sync & Reconciliation', icon: RefreshCw },
                                { id: 'health', label: 'Integration Health', icon: Activity },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setActiveTab(t.id as IntegrationTab)}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                            activeTab === t.id
                                                ? 'bg-indigo-500 text-white shadow-sm'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 1. Data Sources Registry */}
                {activeTab === 'sources' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Institutional Data Sources Registry
                        </h2>
                        <p className="text-xs text-slate-500">
                            Canonical inventory of external datasets feeding Velora, owning scope, sync frequency, and
                            reconciliation requirement.
                        </p>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Source Name</th>
                                        <th className="px-4 py-3">Provider / Type</th>
                                        <th className="px-4 py-3">Owning Scope</th>
                                        <th className="px-4 py-3">Sealed Credential Ref</th>
                                        <th className="px-4 py-3">Last Sync</th>
                                        <th className="px-4 py-3">Reconciliation</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {entries.map(([key, item]) => (
                                        <tr key={key}>
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3">{item.provider}</td>
                                            <td className="px-4 py-3">{item.owner}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-amber-600">
                                                {item.masked_credential || 'VAULT-SEALED'}
                                            </td>
                                            <td className="px-4 py-3 font-mono">{item.last_sync}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                    Required (Threshold ≥ {form.data.sync_config.auto_match_confidence_threshold}%)
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. Google Workspace */}
                {activeTab === 'google' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {entries
                            .filter(([k]) => k === 'google_workspace' || k === 'google_sheets')
                            .map(([key, item]) => (
                                <div
                                    key={key}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {item.name}
                                        </h3>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                            Connected
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Domain: <strong>dssc.edu.ph</strong> · Folder Convention:{' '}
                                        <code className="font-mono">/Velora/{'{Entity}'}/{'{College}'}/{'{AY_Sem}'}</code>
                                    </p>
                                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/40">
                                        <p>
                                            <strong>Authorized OAuth Scopes:</strong> {item.scopes}
                                        </p>
                                        <p className="mt-1">
                                            <strong>Sealed Token:</strong>{' '}
                                            <span className="font-mono">{item.masked_credential}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* 3. External Systems (HRIS, SIS, Biometrics) */}
                {activeTab === 'external' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    DSSC e-HRIS Official Business Bridge
                                </h3>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                    Token Active
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Synchronizes approved Locator Slips and Travel Orders into local MySQL snapshots so
                                page navigation never blocks on remote e-HRIS latency.
                            </p>
                            <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/40">
                                <p>
                                    <strong>Endpoint:</strong>{' '}
                                    <code className="font-mono">http://hris2.dssc.edu.ph:1952/api/v1</code>
                                </p>
                                <p>
                                    <strong>Sealed Bearer Token:</strong>{' '}
                                    <code className="font-mono">SbKZPf9i••••••••••••••••••••La5</code>
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Registrar SIS & Campus Biometric Gateway
                                </h3>
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                    Staged Pilot
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Optional bridge for student section enrollment counts and biometric gate timestamps.
                            </p>
                            <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/40">
                                <p>
                                    <strong>Mode:</strong> CSV / Scheduled Batch Snapshot
                                </p>
                                <p>
                                    <strong>Human Approval Gate:</strong> Enforced before committing to live sections
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. AI & Document Understanding */}
                {activeTab === 'ai' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Google Gemini 2.5 Flash — AI & Document Understanding Governance
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Approved use cases, quota limits, and privacy guardrails. Lower-level users
                                        never access raw API keys.
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                gemini-2.5-flash Online
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: 'Academic Calendar & Memo OCR',
                                    desc: 'Extracts holidays, exam windows, and institutional activities from uploaded PDF/image memos.',
                                    gate: 'Mandatory Human Review Before Publish',
                                },
                                {
                                    title: 'Schedule Review Comment Summarization',
                                    desc: 'Synthesizes Program Head and Dean review flags into actionable conflict briefs.',
                                    gate: 'Advisory Only (Never Mutates Schedule)',
                                },
                                {
                                    title: 'Accomplishment & Research Classification',
                                    desc: 'Pre-tags uploaded faculty evidence and certificates against institutional rubric categories.',
                                    gate: 'Verified by Program Head / Dean',
                                },
                            ].map((useCase) => (
                                <div
                                    key={useCase.title}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                >
                                    <h3 className="font-bold text-slate-900 dark:text-white">{useCase.title}</h3>
                                    <p className="mt-1 text-xs text-slate-500">{useCase.desc}</p>
                                    <span className="mt-3 inline-block rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {useCase.gate}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Sync & Reconciliation */}
                {activeTab === 'reconciliation' && (
                    <form
                        onSubmit={handleSaveSync}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Sync, Alias Matching & Human-Approval Gateways
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Define how imported records from Google Sheets, e-HRIS, and Gemini 2.5 AI are
                                    matched, deduplicated, and staged before affecting live college records.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                <Save className="h-4 w-4" />
                                Save Reconciliation Rules
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Auto-Match Confidence Threshold (%)
                                </label>
                                <input
                                    type="number"
                                    min={50}
                                    max={100}
                                    value={form.data.sync_config.auto_match_confidence_threshold}
                                    onChange={(e) =>
                                        form.setData('sync_config', {
                                            ...form.data.sync_config,
                                            auto_match_confidence_threshold: Number(e.target.value),
                                        })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Needs-Review Queue Threshold (%)
                                </label>
                                <input
                                    type="number"
                                    min={30}
                                    max={95}
                                    value={form.data.sync_config.needs_review_threshold}
                                    onChange={(e) =>
                                        form.setData('sync_config', {
                                            ...form.data.sync_config,
                                            needs_review_threshold: Number(e.target.value),
                                        })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Duplicate Detection Strategy
                                </label>
                                <input
                                    type="text"
                                    value={form.data.sync_config.duplicate_detection_mode}
                                    onChange={(e) =>
                                        form.setData('sync_config', {
                                            ...form.data.sync_config,
                                            duplicate_detection_mode: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Source-of-Truth Precedence Hierarchy
                                </label>
                                <input
                                    type="text"
                                    value={form.data.sync_config.source_precedence}
                                    onChange={(e) =>
                                        form.setData('sync_config', {
                                            ...form.data.sync_config,
                                            source_precedence: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </form>
                )}

                {/* 6. Integration Health */}
                {activeTab === 'health' && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {entries.map(([key, item]) => (
                            <div
                                key={key}
                                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {item.provider} · Last Heartbeat: {item.last_sync}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Healthy (0 Errors)
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                                    <span>Quota & Queue Worker Status: Operational</span>
                                    <span className="font-mono text-[11px]">{item.masked_credential}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
