import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    Briefcase,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    GraduationCap,
    History,
    Key,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface UnitRef {
    id: number;
    code: string;
    name: string;
}

interface ScopedAssignment {
    id: number;
    scope_level: string;
    designation_type: string;
    status: string;
    effective_from?: string | null;
    effective_until?: string | null;
    notes?: string | null;
    role?: { id: number; name: string };
    entity?: UnitRef | null;
    college?: (UnitRef & { parent?: UnitRef | null }) | null;
    program?: (UnitRef & { college?: UnitRef | null }) | null;
}

interface ActivityLogItem {
    id: string;
    type: string;
    module: string;
    title: string;
    detail: string;
    timestamp: string;
    severity: string;
}

interface FacultyProfile {
    id: number;
    first_name: string;
    last_name: string;
    faculty_id?: string | null;
    academic_rank?: string | null;
    employment_type?: string | null;
    status?: string | null;
    highest_qualification?: string | null;
    specialization?: string | null;
    phone?: string | null;
    office_room?: string | null;
    employment_date?: string | null;
    bio?: string | null;
    quote?: string | null;
    photo_url?: string | null;
    program?: (UnitRef & { college?: (UnitRef & { parent?: UnitRef | null }) | null }) | null;
}

interface UserIdentity {
    id: number;
    institutional_id?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    account_status?: string;
    mfa_required?: boolean;
    force_password_reset?: boolean;
    last_login_at?: string | null;
    effective_from?: string | null;
    effective_until?: string | null;
    roles?: Array<{ id: number; name: string; tier?: string; risk_level?: string }>;
    scoped_role_assignments?: ScopedAssignment[];
    faculty?: FacultyProfile | null;
    resolved_entities?: UnitRef[];
    resolved_colleges?: UnitRef[];
    resolved_programs?: UnitRef[];
    activity_logs?: ActivityLogItem[];
}

interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatorData {
    data: UserIdentity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginatorLink[];
}

interface Props {
    usersPaginator?: PaginatorData;
    users: UserIdentity[];
    summaryStats?: {
        total_users: number;
        active_users: number;
        mfa_enforced: number;
        multi_role_users: number;
        entities_covered: number;
        colleges_covered: number;
    };
    filters?: {
        search: string;
        status: string;
        role: string;
        entity: string;
        college: string;
        per_page: number;
    };
    roles: Array<{ id: number; name: string; tier?: string }>;
    entities: UnitRef[];
    colleges: UnitRef[];
    programs: UnitRef[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Users & Canonical Identity Directory', href: '/institution/users' },
];

export default function UsersIdentityIndex({
    usersPaginator,
    users = [],
    summaryStats,
    filters,
    roles = [],
    entities = [],
    colleges = [],
    programs = [],
}: Props) {
    const rows = usersPaginator?.data ?? users;
    const totalCount = usersPaginator?.total ?? users.length;

    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'All');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'All');
    const [entityFilter, setEntityFilter] = useState(filters?.entity ?? 'All');
    const [collegeFilter, setCollegeFilter] = useState(filters?.college ?? 'All');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? 12);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [inspectedUser, setInspectedUser] = useState<UserIdentity | null>(null);
    const [drawerTab, setDrawerTab] = useState<'profile' | 'roles' | 'activity'>('profile');

    const { data, setData, post, processing, errors, reset } = useForm({
        institutional_id: `DSSC-USR-${String(totalCount + 1).padStart(3, '0')}`,
        name: '',
        email: '',
        phone: '',
        password: 'password',
        account_status: 'Active',
        mfa_required: false,
        effective_from: '2026-08-01',
        effective_until: '',
        initial_role_id: '',
        scope_level: 'College',
        entity_id: '',
        college_id: '',
        program_id: '',
    });

    const applyFilters = (overrides: Partial<NonNullable<Props['filters']>> = {}) => {
        const next = {
            search: overrides.search !== undefined ? overrides.search : search,
            status: overrides.status !== undefined ? overrides.status : statusFilter,
            role: overrides.role !== undefined ? overrides.role : roleFilter,
            entity: overrides.entity !== undefined ? overrides.entity : entityFilter,
            college: overrides.college !== undefined ? overrides.college : collegeFilter,
            per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
        };

        router.get('/institution/users', next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const runSecurityAction = (userId: number, action: string) => {
        router.post(
            `/institution/users/${userId}/status`,
            {
                action,
                reason: `Executed '${action}' via Velora Canonical Identity Directory.`,
            },
            { preserveScroll: true },
        );
    };

    const openUserInspector = (u: UserIdentity, tab: 'profile' | 'roles' | 'activity' = 'profile') => {
        setInspectedUser(u);
        setDrawerTab(tab);
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Invited':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'Suspended':
            case 'Locked':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'Archived':
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default:
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users & Canonical Identity Directory — Velora" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300 uppercase">
                                <Users className="h-3.5 w-3.5" />
                                One Canonical Account Per Person · Multi-Scope Attachable
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Velora Canonical Users & Identity Directory
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Browse all users across every Campus Entity, College, and Program regardless of role.
                                Inspect full academic/administrative profiles, multi-scope role bindings, and personal
                                Activity & Audit Logs.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                                href="/institution/scoped-roles"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20"
                            >
                                <Key className="h-3.5 w-3.5 text-amber-400" />
                                Scoped Role Assignments
                            </Link>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="rounded-xl bg-amber-500 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
                            >
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                Provision / Invite User
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Total Canonical Identities
                        </span>
                        <p className="mt-1 text-2xl font-black text-foreground">
                            {summaryStats?.total_users ?? totalCount}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                            Across {summaryStats?.entities_covered ?? entities.length} Entities &{' '}
                            {summaryStats?.colleges_covered ?? colleges.length} Colleges
                        </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Active Accounts
                        </span>
                        <p className="mt-1 text-2xl font-black text-emerald-500">
                            {summaryStats?.active_users ?? totalCount}
                        </p>
                        <span className="text-[11px] text-muted-foreground">Verified institutional access</span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Multi-Scoped Role Holders
                        </span>
                        <p className="mt-1 text-2xl font-black text-amber-500">
                            {summaryStats?.multi_role_users ?? 0}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                            Zero duplicate accounts created
                        </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Mandatory MFA Enforced
                        </span>
                        <p className="mt-1 text-2xl font-black text-indigo-500">
                            {summaryStats?.mfa_enforced ?? 0}
                        </p>
                        <span className="text-[11px] text-muted-foreground">High & critical risk roles</span>
                    </div>
                </div>

                {/* Multi-Dimension Filter & Search Bar */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <form onSubmit={handleSearchSubmit} className="relative md:col-span-4">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onBlur={() => applyFilters({ search })}
                                placeholder="Search name, email, phone, or DSSC ID..."
                                className="w-full rounded-xl border border-border bg-background py-2 pr-3 pl-9 text-xs"
                            />
                        </form>

                        <div className="md:col-span-2">
                            <select
                                value={entityFilter}
                                onChange={(e) => {
                                    setEntityFilter(e.target.value);
                                    applyFilters({ entity: e.target.value });
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                            >
                                <option value="All">All Entities / Campuses</option>
                                {entities.map((ent) => (
                                    <option key={ent.id} value={String(ent.id)}>
                                        {ent.code} — {ent.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={collegeFilter}
                                onChange={(e) => {
                                    setCollegeFilter(e.target.value);
                                    applyFilters({ college: e.target.value });
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                            >
                                <option value="All">All Colleges</option>
                                {colleges.map((col) => (
                                    <option key={col.id} value={String(col.id)}>
                                        {col.code} — {col.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    applyFilters({ role: e.target.value });
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                            >
                                <option value="All">All Roles</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 md:col-span-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Invited">Invited</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Locked">Locked</option>
                                <option value="Archived">Archived</option>
                            </select>

                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const nextPageSize = Number(e.target.value);
                                    setPerPage(nextPageSize);
                                    applyFilters({ per_page: nextPageSize });
                                }}
                                className="rounded-xl border border-border bg-background px-2 py-2 text-xs font-semibold"
                                title="Rows per page"
                            >
                                <option value={10}>10 / pg</option>
                                <option value={12}>12 / pg</option>
                                <option value={25}>25 / pg</option>
                                <option value={50}>50 / pg</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Canonical Identity Directory Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/60 bg-muted/50 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3.5">Canonical User & Profile</th>
                                    <th className="px-4 py-3.5">Entity / Campus & College Affiliations</th>
                                    <th className="px-4 py-3.5">Attached Scoped Roles</th>
                                    <th className="px-4 py-3.5">Security & Last Login</th>
                                    <th className="px-4 py-3.5 text-right">Profile, Activity & Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {rows.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-muted/20">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => openUserInspector(user, 'profile')}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-extrabold text-amber-500"
                                                >
                                                    {user.faculty?.photo_url ? (
                                                        <img
                                                            src={user.faculty.photo_url}
                                                            alt={user.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name.slice(0, 2).toUpperCase()
                                                    )}
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                                                            {user.institutional_id || `DSSC-USR-${user.id}`}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openUserInspector(user, 'profile')}
                                                            className="font-bold text-foreground hover:text-amber-500 hover:underline"
                                                        >
                                                            {user.name}
                                                        </button>
                                                    </div>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                        <span className="font-mono">{user.email}</span>
                                                        {user.faculty?.academic_rank && (
                                                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                                                                {user.faculty.academic_rank}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Entity & College Affiliations */}
                                        <td className="px-4 py-3.5">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.resolved_entities && user.resolved_entities.length > 0 ? (
                                                        user.resolved_entities.map((ent) => (
                                                            <span
                                                                key={ent.code}
                                                                className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-800"
                                                            >
                                                                <MapPin className="h-2.5 w-2.5 text-amber-400" />
                                                                {ent.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-800">
                                                            DSSC Institution-Wide
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {user.resolved_colleges?.map((col) => (
                                                        <span
                                                            key={col.code}
                                                            className="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
                                                        >
                                                            {col.code} · {col.name}
                                                        </span>
                                                    ))}
                                                    {user.resolved_programs?.map((prog) => (
                                                        <span
                                                            key={prog.code}
                                                            className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            {prog.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Attached Scoped Roles */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.scoped_role_assignments &&
                                                user.scoped_role_assignments.length > 0 ? (
                                                    user.scoped_role_assignments.map((sra) => (
                                                        <span
                                                            key={sra.id}
                                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-foreground"
                                                        >
                                                            <span>{sra.role?.name}</span>
                                                            <span className="font-mono text-amber-500">
                                                                [
                                                                {sra.program?.code ||
                                                                    sra.college?.code ||
                                                                    sra.entity?.code ||
                                                                    sra.scope_level}
                                                                ]
                                                            </span>
                                                            {sra.designation_type &&
                                                                sra.designation_type !== 'Primary' && (
                                                                    <span className="text-blue-500">
                                                                        ({sra.designation_type})
                                                                    </span>
                                                                )}
                                                        </span>
                                                    ))
                                                ) : (
                                                    user.roles?.map((r) => (
                                                        <span
                                                            key={r.id}
                                                            className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-semibold"
                                                        >
                                                            {r.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>

                                        {/* Security & Last Login */}
                                        <td className="px-4 py-3.5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                                                            user.account_status,
                                                        )}`}
                                                    >
                                                        {user.account_status || 'Active'}
                                                    </span>
                                                    {user.mfa_required && (
                                                        <span className="rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-500">
                                                            MFA
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="block font-mono text-[10px] text-muted-foreground">
                                                    Last login:{' '}
                                                    {user.last_login_at
                                                        ? user.last_login_at.slice(0, 16).replace('T', ' ')
                                                        : 'Verified'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="inline-flex flex-wrap justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openUserInspector(user, 'profile')}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                                                >
                                                    <Eye className="h-3 w-3" /> Profile
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openUserInspector(user, 'activity')}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-500/25 dark:text-indigo-400"
                                                >
                                                    <History className="h-3 w-3" /> Activity Log (
                                                    {user.activity_logs?.length || 1})
                                                </button>
                                                {(user.account_status || 'Active') === 'Active' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => runSecurityAction(user.id, 'suspend')}
                                                        className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold hover:bg-rose-500/10 hover:text-rose-500"
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => runSecurityAction(user.id, 'activate')}
                                                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Server-Side Pagination Footer */}
                    {usersPaginator && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-3.5 sm:flex-row">
                            <p className="text-xs text-muted-foreground">
                                Showing <strong className="text-foreground">{usersPaginator.from ?? 0}</strong> to{' '}
                                <strong className="text-foreground">{usersPaginator.to ?? 0}</strong> of{' '}
                                <strong className="text-foreground">{usersPaginator.total}</strong> canonical users
                                across all Entities & Colleges
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {usersPaginator.links.map((link, idx) => {
                                    const cleanLabel = link.label
                                        .replace('&laquo; Previous', '← Prev')
                                        .replace('Next &raquo;', 'Next →');

                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="rounded-lg border border-border/40 px-2.5 py-1 text-xs text-muted-foreground/40"
                                            >
                                                {cleanLabel}
                                            </span>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                                                link.active
                                                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                                                    : 'border-border bg-background text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {cleanLabel}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile & Activity Log Slide-Over Inspector */}
                {inspectedUser && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
                        <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl">
                            {/* Inspector Header */}
                            <div className="border-b border-border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-amber-500/20 text-lg font-black text-amber-300">
                                            {inspectedUser.faculty?.photo_url ? (
                                                <img
                                                    src={inspectedUser.faculty.photo_url}
                                                    alt={inspectedUser.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                inspectedUser.name.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-black text-slate-950">
                                                    {inspectedUser.institutional_id || `DSSC-USR-${inspectedUser.id}`}
                                                </span>
                                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                                    {inspectedUser.account_status || 'Active'}
                                                </span>
                                            </div>
                                            <h2 className="mt-1 text-xl font-extrabold">{inspectedUser.name}</h2>
                                            <p className="font-mono text-xs text-slate-300">{inspectedUser.email}</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setInspectedUser(null)}
                                        className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Drawer Tabs */}
                                <div className="mt-5 flex gap-2">
                                    {[
                                        { id: 'profile', label: '1. Identity & Academic Profile', icon: Eye },
                                        { id: 'roles', label: '2. Scoped Roles & Affiliations', icon: Key },
                                        {
                                            id: 'activity',
                                            label: `3. User Activity & Audit Log (${inspectedUser.activity_logs?.length || 1})`,
                                            icon: History,
                                        },
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() =>
                                                    setDrawerTab(tab.id as 'profile' | 'roles' | 'activity')
                                                }
                                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                                                    drawerTab === tab.id
                                                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                                                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Inspector Body */}
                            <div className="flex-1 space-y-5 overflow-y-auto p-6">
                                {drawerTab === 'profile' && (
                                    <>
                                        {/* Organizational Affiliations */}
                                        <div className="rounded-2xl border border-border bg-muted/20 p-4">
                                            <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                                                Organizational Affiliations Across Velora
                                            </h3>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="rounded-xl border border-border bg-card p-3">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        Campus / Entity
                                                    </span>
                                                    <div className="mt-1 space-y-1">
                                                        {inspectedUser.resolved_entities &&
                                                        inspectedUser.resolved_entities.length > 0 ? (
                                                            inspectedUser.resolved_entities.map((e) => (
                                                                <p
                                                                    key={e.code}
                                                                    className="text-xs font-bold text-foreground"
                                                                >
                                                                    {e.code} — {e.name}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs font-bold">DSSC Main Campus</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-border bg-card p-3">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        College(s)
                                                    </span>
                                                    <div className="mt-1 space-y-1">
                                                        {inspectedUser.resolved_colleges &&
                                                        inspectedUser.resolved_colleges.length > 0 ? (
                                                            inspectedUser.resolved_colleges.map((c) => (
                                                                <p
                                                                    key={c.code}
                                                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                                                                >
                                                                    {c.code} — {c.name}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs font-bold">Institution Executive</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-border bg-card p-3">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        Program(s)
                                                    </span>
                                                    <div className="mt-1 space-y-1">
                                                        {inspectedUser.resolved_programs &&
                                                        inspectedUser.resolved_programs.length > 0 ? (
                                                            inspectedUser.resolved_programs.map((p) => (
                                                                <p
                                                                    key={p.code}
                                                                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                                                                >
                                                                    {p.code} — {p.name}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                                College / Campus Level
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity & Contact Details */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl border border-border p-3.5 text-xs">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Official Email & Phone
                                                </span>
                                                <p className="mt-1 flex items-center gap-1.5 font-mono font-semibold">
                                                    <Mail className="h-3.5 w-3.5 text-amber-500" />
                                                    {inspectedUser.email}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1.5 font-mono text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                                    {inspectedUser.phone ||
                                                        inspectedUser.faculty?.phone ||
                                                        '+63 917 000 0000'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-border p-3.5 text-xs">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Effective Association Dates
                                                </span>
                                                <p className="mt-1 flex items-center gap-1.5 font-mono font-semibold">
                                                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                                                    {inspectedUser.effective_from
                                                        ? inspectedUser.effective_from.slice(0, 10)
                                                        : '2024-08-01'}{' '}
                                                    →{' '}
                                                    {inspectedUser.effective_until
                                                        ? inspectedUser.effective_until.slice(0, 10)
                                                        : 'Present'}
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    MFA Required: {inspectedUser.mfa_required ? 'Yes' : 'Optional'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Academic / Faculty Dossier if linked */}
                                        {inspectedUser.faculty && (
                                            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-extrabold tracking-wider text-amber-500 uppercase">
                                                        Academic & HR Profile Dossier
                                                    </h3>
                                                    <Link
                                                        href={`/faculties/${inspectedUser.faculty.id}`}
                                                        className="text-xs font-bold text-indigo-500 hover:underline"
                                                    >
                                                        Open Full Faculty Portfolio →
                                                    </Link>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            Academic Rank
                                                        </span>
                                                        <p className="font-bold">
                                                            {inspectedUser.faculty.academic_rank || 'Instructor I'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            Employment Type
                                                        </span>
                                                        <p className="font-bold">
                                                            {inspectedUser.faculty.employment_type || 'Regular / Permanent'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            Highest Qualification
                                                        </span>
                                                        <p className="font-bold">
                                                            {inspectedUser.faculty.highest_qualification ||
                                                                'Master / Doctorate'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            Specialization
                                                        </span>
                                                        <p className="font-bold">
                                                            {inspectedUser.faculty.specialization || 'Information Systems'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            Office / Consultation Room
                                                        </span>
                                                        <p className="font-bold">
                                                            {inspectedUser.faculty.office_room || 'Faculty Center'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {inspectedUser.faculty.bio && (
                                                    <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground italic">
                                                        "{inspectedUser.faculty.bio}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {drawerTab === 'roles' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                                                Active Scoped Role Assignments (
                                                {inspectedUser.scoped_role_assignments?.length || 0})
                                            </h3>
                                            <Link
                                                href="/institution/scoped-roles"
                                                className="text-xs font-bold text-amber-500 hover:underline"
                                            >
                                                + Bind Additional Role
                                            </Link>
                                        </div>

                                        {inspectedUser.scoped_role_assignments &&
                                        inspectedUser.scoped_role_assignments.length > 0 ? (
                                            inspectedUser.scoped_role_assignments.map((sra) => (
                                                <div
                                                    key={sra.id}
                                                    className="rounded-xl border border-border bg-muted/20 p-4 text-xs"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-foreground">
                                                            {sra.role?.name}
                                                        </span>
                                                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                                                            {sra.designation_type || 'Primary'} · {sra.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-muted-foreground">
                                                        Scope Level: <strong>{sra.scope_level}</strong> ·{' '}
                                                        {sra.entity?.name || 'DSSC Main Campus'}{' '}
                                                        {sra.college ? `→ ${sra.college.code}` : ''}{' '}
                                                        {sra.program ? `→ ${sra.program.code}` : ''}
                                                    </p>
                                                    {sra.notes && (
                                                        <p className="mt-1 text-[11px] text-muted-foreground italic">
                                                            {sra.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                No scoped assignments found.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {drawerTab === 'activity' && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                                            Personal Activity, Authentication & Governance Audit Trail
                                        </h3>

                                        {(inspectedUser.activity_logs || []).map((ev) => (
                                            <div
                                                key={ev.id}
                                                className="rounded-xl border border-border bg-muted/20 p-4 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-500 uppercase">
                                                            {ev.type}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                                            {ev.module}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        {ev.timestamp}
                                                    </span>
                                                </div>
                                                <h4 className="mt-1.5 font-bold text-foreground">{ev.title}</h4>
                                                {ev.detail && (
                                                    <p className="mt-0.5 text-muted-foreground">{ev.detail}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Inspector Footer Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => runSecurityAction(inspectedUser.id, 'toggle_mfa')}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted"
                                    >
                                        Toggle MFA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => runSecurityAction(inspectedUser.id, 'reset_password')}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted"
                                    >
                                        Reset Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => runSecurityAction(inspectedUser.id, 'force_logout')}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
                                    >
                                        Force Session Logout
                                    </button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setInspectedUser(null)}
                                    className="text-xs font-bold"
                                >
                                    Close Dossier
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Provision / Invite Canonical User Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">
                        <div className="my-8 w-full max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div>
                                    <h3 className="text-lg font-extrabold">Provision Canonical User Identity</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Create a single institutional account and optionally bind its initial scoped role.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Institutional Identifier *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.institutional_id}
                                            onChange={(e) => setData('institutional_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Account Status *</label>
                                        <select
                                            value={data.account_status}
                                            onChange={(e) => setData('account_status', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Invited">Invited (Pending First Login)</option>
                                            <option value="Suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Full Legal Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Dr. Lorenzo Dela Cruz"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                    {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Official Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="ldelacruz@dssc.edu.ph"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                        {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+63 917 000 0000"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                                    <span className="block text-xs font-bold">
                                        Initial Scoped Role Binding (Optional)
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={data.initial_role_id}
                                            onChange={(e) => setData('initial_role_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Select Initial Role...</option>
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={data.college_id}
                                            onChange={(e) => setData('college_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Institution / Entity Scope...</option>
                                            {colleges.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.code} — {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <label className="flex cursor-pointer items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={data.mfa_required}
                                        onChange={(e) => setData('mfa_required', e.target.checked)}
                                        className="rounded text-amber-500"
                                    />
                                    <span className="font-semibold">
                                        Require Multi-Factor Authentication (MFA) for this account
                                    </span>
                                </label>

                                <div className="flex justify-end gap-2 border-t border-border pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400"
                                    >
                                        {processing ? 'Provisioning...' : 'Create Canonical Identity'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
