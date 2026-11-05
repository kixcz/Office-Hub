import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Cpu,
    Database,
    FileCheck,
    FileSearch,
    FileStack,
    Globe,
    Inbox,
    Key,
    Layers,
    LayoutGrid,
    Network,
    School,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';

interface UnitItem {
    id: number;
    code: string;
    name: string;
    type: string;
    entity_type?: string | null;
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    setup_stage: string;
    setup_progress: number;
    dean_name?: string;
    parent?: { id: number; code: string; name: string } | null;
    programs?: Array<{ id: number; code: string; name: string }>;
}

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

interface Props {
    entities: UnitItem[];
    colleges: UnitItem[];
    stats: {
        total_entities: number;
        active_entities: number;
        total_colleges: number;
        active_colleges: number;
        in_setup_colleges: number;
        not_configured_colleges: number;
        ready_colleges: number;
        total_programs: number;
        total_users: number;
        active_users: number;
        suspended_users: number;
        total_roles: number;
        scoped_assignments: number;
        pending_access_requests: number;
        active_academic_periods: number;
        enabled_modules_count: number;
        total_modules_count: number;
        health_issues_count: number;
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
    health_issues: HealthIssue[];
    feature_flags: Record<string, boolean>;
    integrations: Record<string, any>;
    terminology: Record<string, any>;
    recent_changes: Array<{
        id: number;
        module?: string;
        action: string;
        target: string;
        actor: string;
        reason?: string | null;
        timestamp: string;
        severity: 'info' | 'success' | 'warning' | 'critical';
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Platform Governor Console', href: '/institution/dashboard' },
];

export default function InstitutionDashboard({
    entities = [],
    colleges = [],
    stats,
    platform_health,
    health_issues = [],
    feature_flags = {},
    integrations = {},
    recent_changes = [],
}: Props) {
    const getStatusBadge = (status: UnitItem['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Ready':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'In Setup':
                return 'bg-[#7C3AED]/10 text-[#5B21B6] dark:text-[#A78BFA] border-[#7C3AED]/20';
            case 'Suspended':
            case 'Archived':
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            case 'Not Configured':
            default:
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        }
    };

    const toggleFlag = (flagKey: string) => {
        router.post('/institution/modules/feature-flags', { flag_key: flagKey }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Super Admin · Platform Governor Console" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Hero Governor Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17152E] via-[#4C1D95] to-[#5B21B6] p-6 md:p-8 text-white border border-[#A78BFA]/30 shadow-xl">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-[#A78BFA]/20 blur-3xl pointer-events-none" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/40">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Platform Governor & Organizational Architect
                                </span>
                                <span className="text-xs text-slate-200 font-mono px-2.5 py-0.5 rounded-md bg-white/10 border border-white/15">
                                    Davao Del Sur State College · Velora Ecosystem
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                                Institution Super Admin Console
                            </h1>
                            <p className="text-xs md:text-sm text-slate-200 max-w-3xl leading-relaxed">
                                Central authority for <strong className="text-[#A78BFA]">Entities & Colleges hierarchy</strong>, canonical user identities, granular permission matrices, time-bounded scoped role assignments, module rollouts, policy inheritance, reusable workflows, external integrations, and immutable audit trails—while daily academic operations cascade cleanly to Entity Admins, College Admins, Deans, Program Heads, Lab In-Charge, and Faculty.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <Link
                                href="/institution/colleges"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7C3AED] text-white hover:bg-[#5B21B6] transition-colors shadow-md border border-[#A78BFA]/40"
                            >
                                <Building2 className="w-4 h-4" />
                                Organization Tree
                            </Link>
                            <Link
                                href="/institution/roles"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/15"
                            >
                                <Key className="w-4 h-4" />
                                Permission Matrix
                            </Link>
                            <Link
                                href="/institution/workflows"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/15"
                            >
                                <Network className="w-4 h-4" />
                                Workflow Builder
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 6-Card Platform-Level Summary KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <Link
                        href="/institution/colleges"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Entities / Campuses</span>
                            <Building2 className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{stats.total_entities ?? entities.length}</span>
                            <span className="text-[11px] font-bold text-emerald-500">({stats.active_entities ?? entities.length} Active)</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span>Colleges: {stats.total_colleges}</span>
                            <span>Programs: {stats.total_programs ?? 0}</span>
                        </div>
                    </Link>

                    <Link
                        href="/institution/colleges/setup"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">College Units</span>
                            <School className="w-4 h-4 text-[#5B21B6]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{stats.total_colleges}</span>
                            <span className="text-[11px] font-bold text-emerald-500">({stats.active_colleges} Live)</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span>Setup: {stats.in_setup_colleges}</span>
                            <span className="text-rose-500 font-semibold">Unconfigured: {stats.not_configured_colleges}</span>
                        </div>
                    </Link>

                    <Link
                        href="/institution/users"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Canonical Identities</span>
                            <Users className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{stats.total_users}</span>
                            <span className="text-[11px] font-bold text-muted-foreground">Accounts</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span>Roles: {stats.total_roles}</span>
                            <span className="text-[#7C3AED] font-bold">{stats.scoped_assignments} Scoped</span>
                        </div>
                    </Link>

                    <Link
                        href="/institution/scoped-roles?tab=requests"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Access Requests</span>
                            <Inbox className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{stats.pending_access_requests ?? 0}</span>
                            <span className="text-[11px] font-bold text-[#7C3AED]">Pending</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span>Delegation Queue</span>
                            <span className="font-semibold text-foreground">Review →</span>
                        </div>
                    </Link>

                    <Link
                        href="/institution/modules"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Enabled Modules</span>
                            <Layers className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">
                                {stats.enabled_modules_count ?? 12}/{stats.total_modules_count ?? 12}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-500">Active</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span>Periods: {stats.active_academic_periods ?? 1} Active</span>
                            <span>Flags: {Object.values(feature_flags).filter(Boolean).length}</span>
                        </div>
                    </Link>

                    <Link
                        href="/institution/data-quality"
                        className="rounded-2xl bg-card p-4 border border-border shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Config & Health</span>
                            <Activity className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{platform_health.data_quality_score}%</span>
                            <span className="text-[11px] font-bold text-emerald-500">Score</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                            <span className="text-[#7C3AED] font-bold">{stats.health_issues_count ?? health_issues.length} Issues</span>
                            <span>SLA {platform_health.uptime}</span>
                        </div>
                    </Link>
                </div>

                {/* Structural & Operational Cascade Strip */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#7C3AED]" />
                            Velora Governance & Operational Delegation Cascade
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Super Admin governs platform architecture; daily operations cascade downward by scope
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px]">
                        {[
                            { role: '1. Super Admin', desc: 'Entities, Colleges, Roles, Policies, Workflows, Audit', active: true },
                            { role: '2. Entity Admin', desc: 'Oversees all Colleges under Campus/Entity', active: false },
                            { role: '3. College Admin', desc: 'Programs, Courses, Sections, Faculty, Scheduling', active: false },
                            { role: '4. College Dean', desc: 'Reviews & approves schedules, workloads, OB', active: false },
                            { role: '5. Program Head', desc: 'Governs assigned program & faculty load', active: false },
                            { role: '6. Head Lab', desc: 'Verifies monitoring, inventory & EOD reports', active: false },
                            { role: '7. Faculty / Lab', desc: 'Teaching self-service & room observation', active: false },
                            { role: '8. VPAF Exec', desc: 'Consumes verified cross-college analytics', active: false },
                        ].map((tier) => (
                            <div
                                key={tier.role}
                                className={`p-2.5 rounded-xl border ${
                                    tier.active
                                        ? 'border-[#7C3AED]/50 bg-[#7C3AED]/10 text-foreground'
                                        : 'border-border/60 bg-muted/20 text-muted-foreground'
                                }`}
                            >
                                <span className={`font-extrabold block ${tier.active ? 'text-[#5B21B6] dark:text-[#A78BFA]' : 'text-foreground'}`}>
                                    {tier.role}
                                </span>
                                <span className="text-[10px] leading-tight block mt-0.5">{tier.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Two-Column Section: Organization Hierarchy & Data Quality / Health Issues */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Entities (Campuses) & Colleges Readiness */}
                    <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-border shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">Organization Hierarchy: Entities (Campuses) & Colleges</h3>
                                <p className="text-xs text-muted-foreground">
                                    Institution → Campus Entity → College → Program structure & onboarding readiness
                                </p>
                            </div>
                            <Link
                                href="/institution/colleges"
                                className="text-xs font-bold text-[#7C3AED] hover:text-[#5B21B6] inline-flex items-center gap-1"
                            >
                                Manage Structure Tree <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Entities Row */}
                        {entities.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    Parent Entities / Campuses ({entities.length})
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {entities.map((ent) => (
                                        <div
                                            key={ent.id}
                                            className="p-3.5 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-extrabold text-xs text-[#5B21B6] dark:text-[#A78BFA]">{ent.code}</span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border">
                                                    {ent.entity_type || 'Campus Entity'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-foreground line-clamp-1">{ent.name}</p>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                {ent.dean_name || 'Entity Admin Assigned'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Colleges Grid */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                Academic Colleges ({colleges.length})
                            </span>
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
                                                    {col.parent && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                            {col.parent.code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium line-clamp-1 mt-0.5">
                                                    {col.name}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/institution/colleges/setup?college=${col.id}`}
                                                className="text-[11px] font-bold text-[#7C3AED] hover:underline shrink-0"
                                            >
                                                Configure
                                            </Link>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span>
                                                    Stage: <strong className="text-foreground">{col.setup_stage}</strong>
                                                </span>
                                                <span className="font-mono font-bold">{col.setup_progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        col.setup_progress === 100
                                                            ? 'bg-emerald-500'
                                                            : col.setup_progress > 50
                                                            ? 'bg-[#7C3AED]'
                                                            : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${col.setup_progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                                            <span>Dean: <strong className="text-foreground">{col.dean_name || 'Unassigned'}</strong></span>
                                            <span>Programs: <strong className="text-foreground">{col.programs?.length ?? 0}</strong></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Continuous Data Quality & Configuration Health Alerts */}
                    <div className="rounded-2xl bg-card p-6 border border-border shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold">Configuration Health Checks</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Actionable structural & governance diagnostics
                                    </p>
                                </div>
                                <Link
                                    href="/institution/data-quality"
                                    className="text-xs font-bold text-[#7C3AED] hover:underline"
                                >
                                    All ({health_issues.length})
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {health_issues.length === 0 ? (
                                    <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-1">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                                        <p className="text-xs font-bold text-emerald-500">All Governance Checks Passing</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Every Entity, College, Role Scope, and Academic Period is properly configured.
                                        </p>
                                    </div>
                                ) : (
                                    health_issues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            className={`p-3 rounded-xl border space-y-1.5 ${
                                                issue.severity === 'critical'
                                                    ? 'border-rose-500/30 bg-rose-500/5'
                                                    : 'border-[#7C3AED]/30 bg-[#7C3AED]/5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                        issue.severity === 'critical'
                                                            ? 'bg-rose-500/20 text-rose-500'
                                                            : 'bg-[#7C3AED]/20 text-[#5B21B6] dark:text-[#A78BFA]'
                                                    }`}
                                                >
                                                    {issue.category}
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {issue.scope}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-foreground leading-snug">{issue.title}</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                                {issue.description}
                                            </p>
                                            <div className="pt-1">
                                                <Link
                                                    href={issue.action_url}
                                                    className="text-[11px] font-bold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
                                                >
                                                    {issue.action_label} →
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Data Governance Integrity:</span>
                            <Link href="/institution/data-quality" className="font-bold text-[#7C3AED] hover:underline">
                                Open Full Health Inspector →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Feature Flags, External Integrations & Immutable Audit Stream */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Interactive Feature Flags */}
                    <div className="rounded-2xl bg-card p-6 border border-border shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">Platform Feature Flags</h3>
                                <p className="text-xs text-muted-foreground">Click any switch to toggle global rollout</p>
                            </div>
                            <Link href="/institution/modules" className="text-xs font-bold text-[#7C3AED] hover:underline">
                                Module Matrix →
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {Object.entries(feature_flags).map(([key, val]) => (
                                <div
                                    key={key}
                                    onClick={() => toggleFlag(key)}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors"
                                >
                                    <span className="text-xs font-mono font-medium capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <button
                                        type="button"
                                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition-colors ${
                                            val
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {val ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Immutable Governance Audit & Change History Stream */}
                    <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-border shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">Immutable Governance & Change History</h3>
                                <p className="text-xs text-muted-foreground">
                                    Traceable record of structural, role, policy, workflow, and integration actions
                                </p>
                            </div>
                            <Link
                                href="/institution/audit"
                                className="text-xs font-bold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
                            >
                                Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-border/60">
                            {recent_changes.map((item) => (
                                <div key={item.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.module && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/10 text-[#5B21B6] dark:text-[#A78BFA] border border-[#7C3AED]/20">
                                                    {item.module}
                                                </span>
                                            )}
                                            <span className="font-bold text-xs text-foreground">{item.action}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                                {item.target}
                                            </span>
                                        </div>
                                        {item.reason && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">{item.reason}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                            Actor: <strong className="text-foreground">{item.actor}</strong>
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
