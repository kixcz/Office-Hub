import { Head, useForm } from '@inertiajs/react';
import {
    Clock,
    FileSearch,
    History,
    Save,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    SquareActivity,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Security & Governance', href: '/institution/audit' },
];

interface AuditLogEntry {
    id: number;
    actor_name: string;
    actor_role: string;
    module: string;
    action: string;
    target_type?: string | null;
    target_name: string;
    entity_scope?: string | null;
    college_scope?: string | null;
    severity: 'info' | 'success' | 'warning' | 'critical';
    previous_value?: Record<string, unknown> | null;
    new_value?: Record<string, unknown> | null;
    reason?: string | null;
    ip_address?: string | null;
    created_at: string;
}

interface SecuritySettings {
    session_timeout_minutes: number;
    enforce_mfa_for_critical_roles: boolean;
    password_min_length: number;
    password_rotation_days: number;
    lockout_max_attempts: number;
    enforce_separation_of_duties: boolean;
    prevent_self_verification_monitoring: boolean;
    prevent_self_approval_makeup: boolean;
    mask_api_credentials_for_non_super_admin: boolean;
    audit_log_retention_years: number;
    report_archive_retention_years: number;
    restrict_cross_college_raw_exports: boolean;
}

interface RoleItem {
    id: number;
    name: string;
    tier: string;
    risk_level: string;
}

interface Props {
    logs: AuditLogEntry[];
    securitySettings: SecuritySettings;
    roles: RoleItem[];
    initialTab?: string;
}

type SecurityTab = 'audit' | 'activity' | 'changes' | 'security' | 'retention' | 'system';

export default function InstitutionAuditSecurity({
    logs = [],
    securitySettings,
    roles = [],
    initialTab = 'audit',
}: Props) {
    const validTabs: SecurityTab[] = ['audit', 'activity', 'changes', 'security', 'retention', 'system'];
    const [activeTab, setActiveTab] = useState<SecurityTab>(
        validTabs.includes(initialTab as SecurityTab) ? (initialTab as SecurityTab) : 'audit',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('all');

    React.useEffect(() => {
        if (validTabs.includes(initialTab as SecurityTab)) {
            setActiveTab(initialTab as SecurityTab);
        }
    }, [initialTab]);

    const modules = Array.from(new Set(logs.map((l) => l.module)));

    const filteredLogs = logs.filter((log) => {
        if (moduleFilter !== 'all' && log.module !== moduleFilter) {
            return false;
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            return (
                log.action.toLowerCase().includes(q) ||
                log.target_name.toLowerCase().includes(q) ||
                log.actor_name.toLowerCase().includes(q) ||
                (log.reason || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    const form = useForm({
        security_settings: {
            session_timeout_minutes: securitySettings?.session_timeout_minutes ?? 120,
            enforce_mfa_for_critical_roles: securitySettings?.enforce_mfa_for_critical_roles ?? true,
            password_min_length: securitySettings?.password_min_length ?? 10,
            password_rotation_days: securitySettings?.password_rotation_days ?? 180,
            lockout_max_attempts: securitySettings?.lockout_max_attempts ?? 5,
            enforce_separation_of_duties: securitySettings?.enforce_separation_of_duties ?? true,
            prevent_self_verification_monitoring:
                securitySettings?.prevent_self_verification_monitoring ?? true,
            prevent_self_approval_makeup: securitySettings?.prevent_self_approval_makeup ?? true,
            mask_api_credentials_for_non_super_admin:
                securitySettings?.mask_api_credentials_for_non_super_admin ?? true,
            audit_log_retention_years: securitySettings?.audit_log_retention_years ?? 7,
            report_archive_retention_years: securitySettings?.report_archive_retention_years ?? 5,
            restrict_cross_college_raw_exports:
                securitySettings?.restrict_cross_college_raw_exports ?? true,
        },
    });

    const handleSaveSecurity = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/institution/audit/security', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Security & Governance — Ascend" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 space-y-4">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Security, Auditability & System Governance
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Ascend Security & Governance Center
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Inspect immutable Audit Logs, operational Activity Logs, human-readable Change History,
                                Privacy & Separation-of-Duties rules, Data Retention schedules, and technical System Settings.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
                            {[
                                { id: 'audit', label: 'Audit Logs', icon: FileSearch },
                                { id: 'activity', label: 'Activity Logs', icon: SquareActivity },
                                { id: 'changes', label: 'Change History', icon: History },
                                { id: 'security', label: 'Privacy & Security', icon: Shield },
                                { id: 'retention', label: 'Data Retention', icon: Clock },
                                { id: 'system', label: 'System Settings', icon: Settings },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setActiveTab(t.id as SecurityTab)}
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

                {/* 1. Audit Logs */}
                {activeTab === 'audit' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="relative min-w-[260px] flex-1">
                                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search actor, action, target unit, or audit reason..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                            <select
                                value={moduleFilter}
                                onChange={(e) => setModuleFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                            >
                                <option value="all">All Governance Modules</option>
                                {modules.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Module</th>
                                        <th className="px-4 py-3">High-Impact Action</th>
                                        <th className="px-4 py-3">Target</th>
                                        <th className="px-4 py-3">Actor & Role</th>
                                        <th className="px-4 py-3">Audit Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-indigo-600">{log.module}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                {log.action}
                                            </td>
                                            <td className="px-4 py-3 font-mono">{log.target_name}</td>
                                            <td className="px-4 py-3">
                                                <strong>{log.actor_name}</strong> ({log.actor_role})
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{log.reason || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. Activity Logs */}
                {activeTab === 'activity' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Operational Activity & Access Stream
                        </h2>
                        <p className="text-xs text-slate-500">
                            Tracks authentication sessions, background synchronizations, report exports, and module
                            accesses for operational troubleshooting.
                        </p>

                        <div className="mt-4 space-y-2.5">
                            {[
                                {
                                    event: 'Authenticated Session Started',
                                    detail: 'superadmin@dssc.edu.ph signed in to Institution Super Admin Command Center',
                                    time: 'Just now',
                                },
                                {
                                    event: 'Scheduled e-HRIS Snapshot Sync Completed',
                                    detail: 'Synchronized Locator Slips and Travel Orders into local MySQL cache (0 errors)',
                                    time: '12 mins ago',
                                },
                                {
                                    event: 'Google Sheets Master Timetable Snapshot Verified',
                                    detail: 'Validated 4 active college timetable spreadsheets against canonical aliases',
                                    time: '18 mins ago',
                                },
                                {
                                    event: 'Structural Governance Report Generated',
                                    detail: 'Organization Structure & Role Authority Matrix exported',
                                    time: '1 hour ago',
                                },
                            ].map((act, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{act.event}</p>
                                        <p className="text-slate-500">{act.detail}</p>
                                    </div>
                                    <span className="font-mono text-[11px] text-slate-400">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Human-Readable Change History */}
                {activeTab === 'changes' && (
                    <div className="space-y-3">
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                    <div>
                                        <span className="font-mono text-xs font-bold text-indigo-600">
                                            {new Date(log.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {log.action}: {log.target_name}
                                        </h3>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        Changed by: <strong>{log.actor_name}</strong> ({log.actor_role})
                                    </span>
                                </div>

                                {log.reason && (
                                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                                        <strong>Reason:</strong> {log.reason}
                                    </p>
                                )}

                                {(log.previous_value || log.new_value) && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/50">
                                        <div>
                                            <span className="text-[10px] font-bold text-rose-600 uppercase">
                                                Previous Value
                                            </span>
                                            <pre className="mt-1 overflow-x-auto font-mono text-[11px]">
                                                {log.previous_value
                                                    ? JSON.stringify(log.previous_value, null, 2)
                                                    : '— (Initial State)'}
                                            </pre>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                                New Value
                                            </span>
                                            <pre className="mt-1 overflow-x-auto font-mono text-[11px]">
                                                {log.new_value ? JSON.stringify(log.new_value, null, 2) : '—'}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Privacy & Security */}
                {activeTab === 'security' && (
                    <form
                        onSubmit={handleSaveSecurity}
                        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Privacy, Authentication & Role Separation Controls
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Enforce MFA, sensitive-field masking, cross-college export restrictions, and strict
                                    Separation of Duties.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                            >
                                <Save className="h-4 w-4" /> Save Security Policy
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/40">
                            <label className="flex items-start gap-2.5 text-xs">
                                <input
                                    type="checkbox"
                                    checked={form.data.security_settings.enforce_separation_of_duties}
                                    onChange={(e) =>
                                        form.setData('security_settings', {
                                            ...form.data.security_settings,
                                            enforce_separation_of_duties: e.target.checked,
                                        })
                                    }
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600"
                                />
                                <span>
                                    <strong className="block text-slate-900 dark:text-white">
                                        Enforce Global Separation of Duties (SoD)
                                    </strong>
                                    Prevent any user from approving or verifying a submission they authored.
                                </span>
                            </label>

                            <label className="flex items-start gap-2.5 text-xs">
                                <input
                                    type="checkbox"
                                    checked={form.data.security_settings.enforce_mfa_for_critical_roles}
                                    onChange={(e) =>
                                        form.setData('security_settings', {
                                            ...form.data.security_settings,
                                            enforce_mfa_for_critical_roles: e.target.checked,
                                        })
                                    }
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600"
                                />
                                <span>
                                    <strong className="block text-slate-900 dark:text-white">
                                        Mandatory MFA for High/Critical Risk Roles
                                    </strong>
                                    Require MFA for Institution Super Admin, Entity Admin, College Admin, Dean, and VPAF.
                                </span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                            {roles.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                                        <p className="text-[11px] text-slate-500">{r.tier}</p>
                                    </div>
                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                                        {r.risk_level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </form>
                )}

                {/* 5. Data Retention */}
                {activeTab === 'retention' && (
                    <form
                        onSubmit={handleSaveSecurity}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Institutional Data Retention & Archival Policy
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Define how long immutable audit logs, attendance evidence, historical schedules, and
                                    verified reports are retained before archival.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                            >
                                <Save className="h-4 w-4" /> Save Retention Policy
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Immutable Audit Log Retention (Years)
                                </label>
                                <input
                                    type="number"
                                    value={form.data.security_settings.audit_log_retention_years}
                                    onChange={(e) =>
                                        form.setData('security_settings', {
                                            ...form.data.security_settings,
                                            audit_log_retention_years: Number(e.target.value),
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Verified Report & Schedule Archive Retention (Years)
                                </label>
                                <input
                                    type="number"
                                    value={form.data.security_settings.report_archive_retention_years}
                                    onChange={(e) =>
                                        form.setData('security_settings', {
                                            ...form.data.security_settings,
                                            report_archive_retention_years: Number(e.target.value),
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </form>
                )}

                {/* 6. System Settings */}
                {activeTab === 'system' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Technical System Settings (Ascend Core)
                        </h2>
                        <p className="text-xs text-slate-500">
                            Global technical parameters for locale, timezone, system email identity, upload limits, and
                            maintenance state.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Platform Brand Name', value: 'Ascend Institutional Governance' },
                                { label: 'Default Locale & Timezone', value: 'en_PH · Asia/Manila (UTC+08:00)' },
                                { label: 'System Notification Identity', value: 'noreply-Ascend@dssc.edu.ph' },
                                { label: 'Max Evidence Upload Limit', value: '25 MB per document (PDF/JPG/PNG/XLSX)' },
                                { label: 'Queue & Background Sync Driver', value: 'Database Queue (Asynchronous)' },
                                { label: 'Maintenance Mode Status', value: 'Online · Production Ready' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                                >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {item.label}
                                    </span>
                                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
