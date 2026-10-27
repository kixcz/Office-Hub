import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Activity,
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Cpu,
    Database,
    FileCheck,
    Globe,
    Layers,
    LayoutGrid,
    Megaphone,
    Network,
    RefreshCw,
    School,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';

interface CollegeItem {
    id: number;
    code: string;
    name: string;
    type: string;
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    setup_stage: string;
    setup_progress: number;
    dean_name?: string;
}

interface Props {
    colleges: CollegeItem[];
    stats: {
        total_colleges: number;
        active_colleges: number;
        in_setup_colleges: number;
        not_configured_colleges: number;
        ready_colleges: number;
        total_users: number;
        total_roles: number;
        scoped_assignments: number;
    };
    platform_health: {
        uptime: string;
        api_gateway: string;
        llm_status: string;
        storage_used: string;
        unresolved_syncs: number;
        audit_alerts: number;
        data_quality_score: number;
    };
    feature_flags: Record<string, boolean>;
    integrations: Record<string, string>;
    terminology: Record<string, any>;
    recent_changes: Array<{
        id: number;
        action: string;
        target: string;
        actor: string;
        timestamp: string;
        severity: 'info' | 'success' | 'warning' | 'alert';
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Platform Health & Governance', href: '/institution/dashboard' },
];

export default function InstitutionDashboard({
    colleges,
    stats,
    platform_health,
    feature_flags,
    integrations,
    recent_changes,
}: Props) {
    const getStatusBadge = (status: CollegeItem['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Ready':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'In Setup':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'Not Configured':
            default:
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Super Admin · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 text-white border border-amber-500/20 shadow-xl">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Institution Platform Administration
                                </span>
                                <span className="text-xs text-slate-400 font-mono">Davao Del Sur State College</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                                Institution Super Admin Console
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Manage colleges and organizational units, institutional identities, scoped role delegations, module matrix, and system-wide governance across the entire COMPASS ecosystem.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/institution/colleges/setup"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-md"
                            >
                                <Sliders className="w-4 h-4" />
                                Guided College Setup
                            </Link>
                            <Link
                                href="/institution/scoped-roles"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
                            >
                                <Users className="w-4 h-4" />
                                Scoped Roles
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Platform Health KPI Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-card p-5 border border-border shadow-xs hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Colleges Onboarded</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <School className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl font-black tracking-tight">{stats.total_colleges}</span>
                            <span className="text-xs font-bold text-emerald-500">({stats.active_colleges} Active)</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                            <span>In Setup: {stats.in_setup_colleges}</span>
                            <span>Pending: {stats.not_configured_colleges}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-card p-5 border border-border shadow-xs hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Institution Users</span>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl font-black tracking-tight">{stats.total_users}</span>
                            <span className="text-xs font-bold text-muted-foreground">Accounts</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                            <span>Roles: {stats.total_roles}</span>
                            <span className="text-amber-500 font-semibold">{stats.scoped_assignments} Scoped</span>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-card p-5 border border-border shadow-xs hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Platform Availability</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Zap className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl font-black tracking-tight">{platform_health.uptime}</span>
                            <span className="text-xs font-bold text-emerald-500">Live SLA</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                            <span>Gateway: OK</span>
                            <span>Sync Errors: {platform_health.unresolved_syncs}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-card p-5 border border-border shadow-xs hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Data Quality Score</span>
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl font-black tracking-tight">{platform_health.data_quality_score}%</span>
                            <span className="text-xs font-bold text-emerald-500">High Integrity</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                            <span>Audit Alerts: {platform_health.audit_alerts}</span>
                            <span className="text-blue-500 font-semibold">Gemini LLM Active</span>
                        </div>
                    </div>
                </div>

                {/* College Setup Status & Onboarding Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-border shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Colleges Setup & Onboarding Pipeline</h3>
                                <p className="text-xs text-muted-foreground">
                                    Current readiness across institutional academic colleges and organizational units
                                </p>
                            </div>
                            <Link
                                href="/institution/colleges"
                                className="text-xs font-bold text-amber-500 hover:text-amber-600 inline-flex items-center gap-1"
                            >
                                View All Units →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {colleges.map((col) => (
                                <div
                                    key={col.id}
                                    className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-all space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-sm">{col.code}</span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                                                        col.status
                                                    )}`}
                                                >
                                                    {col.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium line-clamp-1 mt-0.5">
                                                {col.name}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/institution/colleges/setup?college=${col.id}`}
                                            className="text-[11px] font-bold text-amber-500 hover:underline shrink-0"
                                        >
                                            Configure
                                        </Link>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>Stage: <strong className="text-foreground">{col.setup_stage}</strong></span>
                                            <span className="font-mono font-bold">{col.setup_progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    col.setup_progress === 100
                                                        ? 'bg-emerald-500'
                                                        : col.setup_progress > 50
                                                        ? 'bg-amber-500'
                                                        : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${col.setup_progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {col.dean_name && (
                                        <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                                            Dean: <span className="font-medium text-foreground">{col.dean_name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Integrations & External Connections */}
                    <div className="rounded-2xl bg-card p-6 border border-border shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">External Integrations</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Healthy
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Google Workspace</p>
                                        <p className="text-[11px] text-muted-foreground">Domain OAuth & Drive Sync</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500">{integrations.google_workspace || 'Connected'}</span>
                            </div>

                            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <Database className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Google Sheets Engine</p>
                                        <p className="text-[11px] text-muted-foreground">Timetable Reconciliation</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500">{integrations.google_sheets || 'Operational'}</span>
                            </div>

                            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Gemini 2.5 AI Service</p>
                                        <p className="text-[11px] text-muted-foreground">Document Extraction</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500">{integrations.ai_service || 'Connected'}</span>
                            </div>

                            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Cpu className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Campus TV Stream Hub</p>
                                        <p className="text-[11px] text-muted-foreground">Digital Signage Displays</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500">{integrations.tv_stream_hub || 'Broadcasting'}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border/60">
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>Storage Quota:</span>
                                <span className="font-mono font-bold text-foreground">{platform_health.storage_used}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Flags & Recent Governance Audit Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Feature Flags Matrix */}
                    <div className="rounded-2xl bg-card p-6 border border-border shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">Platform Feature Flags</h3>
                            <Link href="/institution/modules" className="text-xs font-bold text-amber-500 hover:underline">
                                Module Matrix →
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Global runtime switches controlling specialized capabilities across colleges.
                        </p>

                        <div className="space-y-2.5">
                            {Object.entries(feature_flags).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/10">
                                    <span className="text-xs font-mono font-medium capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            val
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {val ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Changes & System Audit */}
                    <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-border shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Governance & Configuration Audit Log</h3>
                                <p className="text-xs text-muted-foreground">Immutable history of high-level changes and platform configurations</p>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                                Real-time Stream
                            </span>
                        </div>

                        <div className="divide-y divide-border/60">
                            {recent_changes.map((item) => (
                                <div key={item.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs text-foreground">{item.action}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                                {item.target}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Initiated by <strong className="text-foreground">{item.actor}</strong>
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                        {item.timestamp}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
