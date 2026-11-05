import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    History,
    Key,
    KeyRound,
    Layers,
    Mail,
    MoreHorizontal,
    PauseCircle,
    Phone,
    PlayCircle,
    Printer,
    Search,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    profile_completion?: number;
    missing_profile_fields?: string[];
    designation_label?: string;
    roles?: Array<{ id: number; name: string; tier?: string; risk_level?: string }>;
    scoped_role_assignments?: ScopedAssignment[];
    faculty?: FacultyProfile | null;
    resolved_entities?: UnitRef[];
    resolved_colleges?: UnitRef[];
    resolved_programs?: UnitRef[];
    activity_logs?: ActivityLogItem[];
}

interface FacultyMatrixRow {
    id: number;
    institutional_id: string;
    employee_id: string;
    full_name: string;
    title_name: string;
    email: string;
    phone: string;
    entity_code: string;
    entity_name: string;
    college_code: string;
    college_name: string;
    program_code: string;
    program_name: string;
    academic_rank: string;
    employment_type: string;
    appointment_status: string;
    highest_qualification: string;
    specialization: string;
    office_room: string;
    roles: string;
    status: string;
    profile_completion: number;
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
    facultyMatrix?: FacultyMatrixRow[];
    summaryStats?: {
        total_users: number;
        active_users: number;
        mfa_enforced: number;
        multi_role_users: number;
        entities_covered: number;
        colleges_covered: number;
        total_faculty_matrix?: number;
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

/**
 * Circular Avatar with SVG Progress Ring around it & bottom completion badge
 */
function CircularProgressAvatar({
    name,
    photoUrl,
    completion = 92,
    size = 'md',
    onClick,
}: {
    name: string;
    photoUrl?: string | null;
    completion?: number;
    size?: 'md' | 'lg';
    onClick?: () => void;
}) {
    const pct = Math.max(0, Math.min(100, Math.round(completion)));
    const isLg = size === 'lg';
    const boxSize = isLg ? 68 : 52;
    const strokeWidth = isLg ? 3.5 : 3;
    const radius = (boxSize - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    const initials = name
        .split(' ')
        .filter((part) => !part.endsWith('.'))
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || name.slice(0, 2).toUpperCase();

    return (
        <button
            type="button"
            onClick={onClick}
            title={`Profile Completion: ${pct}%`}
            className="group relative inline-flex shrink-0 items-center justify-center focus:outline-none"
            style={{ width: boxSize, height: boxSize }}
        >
            {/* SVG Progress Ring */}
            <svg
                className="-rotate-90 transform transition-transform duration-300 group-hover:scale-105"
                width={boxSize}
                height={boxSize}
                viewBox={`0 0 ${boxSize} ${boxSize}`}
            >
                <circle
                    cx={boxSize / 2}
                    cy={boxSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-[#EDE9FE] dark:text-[#2D2654]"
                />
                <circle
                    cx={boxSize / 2}
                    cy={boxSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="url(#veloraAvatarGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
                <defs>
                    <linearGradient id="veloraAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#4C1D95" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Inner Circular Avatar */}
            <div
                className={`absolute overflow-hidden rounded-full border border-white bg-[#F3EFFE] text-[#5B21B6] shadow-2xs flex items-center justify-center font-extrabold dark:border-slate-900 dark:bg-[#262246] dark:text-[#A78BFA] ${
                    isLg ? 'h-13 w-13 text-base' : 'h-10 w-10 text-xs'
                }`}
            >
                {photoUrl ? (
                    <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>

            {/* Bottom Completion Percentage Pill */}
            <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-[#A78BFA]/70 bg-[#EDE9FE] px-1.5 py-0.2 font-extrabold tracking-tight text-[#4C1D95] shadow-2xs dark:border-[#7C3AED]/60 dark:bg-[#262246] dark:text-[#DDD6FE] ${
                    isLg ? 'text-[10px]' : 'text-[9px] leading-tight'
                }`}
            >
                {pct}%
            </span>
        </button>
    );
}

export default function UsersIdentityIndex({
    usersPaginator,
    users = [],
    facultyMatrix = [],
    summaryStats,
    filters,
    roles = [],
    entities = [],
    colleges = [],
}: Props) {
    const rows = usersPaginator?.data ?? users;
    const totalCount = usersPaginator?.total ?? users.length;

    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'All');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'All');
    const [entityFilter, setEntityFilter] = useState(filters?.entity ?? 'All');
    const [collegeFilter, setCollegeFilter] = useState(filters?.college ?? 'All');
    const [perPage] = useState<number>(filters?.per_page ?? 12);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [inspectedUser, setInspectedUser] = useState<UserIdentity | null>(null);
    const [drawerTab, setDrawerTab] = useState<'profile' | 'roles' | 'activity'>('profile');

    // Action menu state (horizontally arranged dots)
    const [openActionUserId, setOpenActionUserId] = useState<number | null>(null);
    // Download Reports dropdown & modal state
    const [isHeaderReportMenuOpen, setIsHeaderReportMenuOpen] = useState(false);
    const [isFilterExportMenuOpen, setIsFilterExportMenuOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

    // Faculty Matrix modal filter state
    const [matrixCollegeFilter, setMatrixCollegeFilter] = useState('All');
    const [matrixEmploymentFilter, setMatrixEmploymentFilter] = useState('All');
    const [matrixSearch, setMatrixSearch] = useState('');

    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const headerReportRef = useRef<HTMLDivElement | null>(null);
    const filterExportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
                setOpenActionUserId(null);
            }
            if (headerReportRef.current && !headerReportRef.current.contains(target)) {
                setIsHeaderReportMenuOpen(false);
            }
            if (filterExportRef.current && !filterExportRef.current.contains(target)) {
                setIsFilterExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        setOpenActionUserId(null);
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
        setOpenActionUserId(null);
        setInspectedUser(u);
        setDrawerTab(tab);
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'Invited':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'Suspended':
            case 'Locked':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
            case 'Archived':
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
        }
    };

    // Filtered Faculty Matrix rows for the Download Reports & Matrix Modal
    const filteredMatrix = useMemo(() => {
        return facultyMatrix.filter((f) => {
            if (matrixCollegeFilter !== 'All' && f.college_code !== matrixCollegeFilter) {
                return false;
            }
            if (
                matrixEmploymentFilter !== 'All' &&
                !f.employment_type.toLowerCase().includes(matrixEmploymentFilter.toLowerCase())
            ) {
                return false;
            }
            if (matrixSearch.trim() !== '') {
                const q = matrixSearch.toLowerCase();
                return (
                    f.full_name.toLowerCase().includes(q) ||
                    f.email.toLowerCase().includes(q) ||
                    f.institutional_id.toLowerCase().includes(q) ||
                    f.program_code.toLowerCase().includes(q) ||
                    f.academic_rank.toLowerCase().includes(q) ||
                    f.specialization.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [facultyMatrix, matrixCollegeFilter, matrixEmploymentFilter, matrixSearch]);

    // CSV Download Helper for All-Faculty Matrix
    const downloadFacultyMatrixCsv = (dataset: FacultyMatrixRow[] = filteredMatrix) => {
        const headers = [
            'Institutional ID',
            'Employee ID',
            'Full Name',
            'Official Email',
            'Phone',
            'Entity / Campus',
            'College Code',
            'College Name',
            'Program Code',
            'Program Name',
            'Academic Rank',
            'Employment Type',
            'Appointment Status',
            'Highest Qualification',
            'Specialization',
            'Office / Room',
            'Scoped Roles',
            'Status',
            'Profile Completion (%)',
        ];

        const escapeCsv = (val: string | number) => {
            const s = String(val ?? '').replace(/"/g, '""');
            return `"${s}"`;
        };

        const csvLines = [
            headers.map(escapeCsv).join(','),
            ...dataset.map((row) =>
                [
                    row.institutional_id,
                    row.employee_id,
                    row.full_name,
                    row.email,
                    row.phone,
                    row.entity_name,
                    row.college_code,
                    row.college_name,
                    row.program_code,
                    row.program_name,
                    row.academic_rank,
                    row.employment_type,
                    row.appointment_status,
                    row.highest_qualification,
                    row.specialization,
                    row.office_room,
                    row.roles,
                    row.status,
                    `${row.profile_completion}%`,
                ]
                    .map(escapeCsv)
                    .join(','),
            ),
        ];

        // Include UTF-8 BOM so Microsoft Excel opens it cleanly with columns formatted
        const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Velora_Institutional_Faculty_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsHeaderReportMenuOpen(false);
        setIsFilterExportMenuOpen(false);
    };

    // CSV Download Helper for Canonical Users Directory
    const downloadCanonicalUsersCsv = () => {
        const headers = [
            'Institutional ID',
            'Full Name',
            'Official Email',
            'Designation / Rank',
            'Entities / Campuses',
            'Colleges',
            'Programs',
            'Scoped Roles',
            'Account Status',
            'MFA Enforced',
            'Profile Completion (%)',
        ];

        const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const csvLines = [
            headers.map(escapeCsv).join(','),
            ...rows.map((u) =>
                [
                    u.institutional_id || `DSSC-USR-${u.id}`,
                    u.name,
                    u.email,
                    u.designation_label || u.faculty?.academic_rank || 'Staff',
                    u.resolved_entities?.map((e) => e.name).join('; ') || 'DSSC Main Campus',
                    u.resolved_colleges?.map((c) => `${c.code} - ${c.name}`).join('; ') || 'Institution-Wide',
                    u.resolved_programs?.map((p) => p.code).join('; ') || '—',
                    u.scoped_role_assignments?.map((s) => `${s.role?.name} [${s.college?.code || s.program?.code || s.scope_level}]`).join('; ') ||
                        u.roles?.map((r) => r.name).join('; ') ||
                        '—',
                    u.account_status || 'Active',
                    u.mfa_required ? 'Yes' : 'No',
                    `${u.profile_completion ?? 92}%`,
                ]
                    .map(escapeCsv)
                    .join(','),
            ),
        ];

        const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Velora_Canonical_Users_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsHeaderReportMenuOpen(false);
        setIsFilterExportMenuOpen(false);
    };

    // Printable Faculty Matrix Window
    const printFacultyMatrix = (dataset: FacultyMatrixRow[] = filteredMatrix) => {
        const printWin = window.open('', '_blank', 'width=1200,height=800');
        if (!printWin) return;

        const rowsHtml = dataset
            .map(
                (f, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${f.institutional_id}</strong></td>
                    <td><strong>${f.full_name}</strong><br/><span style="color:#64748b;font-size:10px;">${f.email}</span></td>
                    <td>${f.entity_name}</td>
                    <td><strong>${f.college_code}</strong> — ${f.program_code}</td>
                    <td>${f.academic_rank}</td>
                    <td>${f.employment_type}</td>
                    <td>${f.highest_qualification}</td>
                    <td>${f.specialization}</td>
                    <td>${f.profile_completion}%</td>
                </tr>`,
            )
            .join('');

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Institutional Faculty Matrix — Davao del Sur State College</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; color: #17152E; padding: 24px; }
                    .header { border-bottom: 2px solid #5B21B6; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
                    h1 { margin: 0; font-size: 20px; color: #4C1D95; }
                    p { margin: 4px 0 0; font-size: 12px; color: #475569; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background: #EDE9FE; color: #4C1D95; text-align: left; padding: 8px; border: 1px solid #DDD6FE; text-transform: uppercase; font-size: 10px; }
                    td { padding: 7px 8px; border: 1px solid #E2E8F0; vertical-align: top; }
                    tr:nth-child(even) { background: #F8FAFC; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>VELORA INSTITUTIONAL FACULTY MATRIX</h1>
                        <p>Davao del Sur State College · Canonical Identity & Academic Governance Report</p>
                    </div>
                    <div style="text-align:right;font-size:11px;color:#475569;">
                        Generated: ${new Date().toLocaleString()}<br/>
                        Total Faculty Records: <strong>${dataset.length}</strong>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>DSSC ID</th>
                            <th>Faculty Member</th>
                            <th>Entity / Campus</th>
                            <th>College & Program</th>
                            <th>Academic Rank</th>
                            <th>Employment</th>
                            <th>Qualification</th>
                            <th>Specialization</th>
                            <th>Profile</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <script>window.onload = () => { window.print(); };</script>
            </body>
            </html>
        `);
        printWin.document.close();
        setIsHeaderReportMenuOpen(false);
        setIsFilterExportMenuOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users & Canonical Identity Directory — Velora" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 bg-[#F7F7FB] p-4 md:p-6 dark:bg-background">
                {/* Deep Purple Hero Header Banner */}
                <div className="relative rounded-2xl border border-[#5B21B6]/40 bg-gradient-to-r from-[#1E0B4B] via-[#3B147A] to-[#2E1065] p-6 text-white shadow-lg">
                    {/* Decorative background wave */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                        <div className="absolute -top-20 right-16 h-64 w-64 rounded-full bg-[#7C3AED]/25 blur-3xl" />
                        <div className="absolute -bottom-24 right-0 h-56 w-96 rounded-full bg-[#A78BFA]/20 blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase backdrop-blur-xs">
                                <Users className="h-3.5 w-3.5 text-[#DDD6FE]" />
                                Canonical Identity & User Management
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                Velora Canonical Users & Identity Directory
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[#E9D5FF]/90 sm:text-sm">
                                Browse, manage, and govern all users across every Campus Entity, College, and Program
                                with canonical identities, role bindings, and access control in a single, trusted
                                directory.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                                href="/institution/scoped-roles"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                            >
                                <Key className="h-3.5 w-3.5 text-[#DDD6FE]" />
                                Scoped Role Assignments
                            </Link>

                            {/* Download Reports Dropdown Button */}
                            <div className="relative" ref={headerReportRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsHeaderReportMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17152E] shadow-sm transition hover:bg-[#F7F7FB]"
                                >
                                    <Download className="h-3.5 w-3.5 text-[#5B21B6]" />
                                    Download Reports
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </button>

                                {isHeaderReportMenuOpen && (
                                    <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-[#E5E4F0] bg-white p-1.5 text-xs shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                                        <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-[#5B21B6] uppercase dark:text-[#A78BFA]">
                                            Institutional Reports & Matrix
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsHeaderReportMenuOpen(false);
                                                setIsReportsModalOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-xl bg-[#EDE9FE]/60 px-3 py-2.5 text-left font-bold text-[#4C1D95] transition hover:bg-[#EDE9FE] dark:bg-[#262246] dark:text-[#DDD6FE]"
                                        >
                                            <Sparkles className="h-4 w-4 shrink-0 text-[#7C3AED]" />
                                            <div>
                                                <div>Faculty Matrix Report Center</div>
                                                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                                    Preview & filter all {facultyMatrix.length} faculty records
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => downloadFacultyMatrixCsv(facultyMatrix)}
                                            className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <div>
                                                <div>Download All-Faculty Matrix (.CSV)</div>
                                                <div className="text-[10px] font-normal text-slate-500">
                                                    Excel-ready matrix across all colleges
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => printFacultyMatrix(facultyMatrix)}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <Printer className="h-4 w-4 shrink-0 text-[#5B21B6]" />
                                            <div>
                                                <div>Print / Save PDF Faculty Matrix</div>
                                                <div className="text-[10px] font-normal text-slate-500">
                                                    Formatted institutional letterhead report
                                                </div>
                                            </div>
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                        <button
                                            type="button"
                                            onClick={downloadCanonicalUsersCsv}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <FileText className="h-4 w-4 shrink-0 text-[#7C3AED]" />
                                            <div>
                                                <div>Canonical Identity Directory (.CSV)</div>
                                                <div className="text-[10px] font-normal text-slate-500">
                                                    All accounts, scoped roles & MFA status
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="h-auto rounded-xl bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#6D28D9]"
                            >
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                Provision / Invite User
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 4 KPI Summary Cards with Soft Icon Badges */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA]">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                Total Canonical Identities
                            </span>
                            <p className="mt-0.5 text-2xl font-black text-[#17152E] dark:text-foreground">
                                {summaryStats?.total_users ?? totalCount}
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                                Across {summaryStats?.entities_covered ?? entities.length} Entities &{' '}
                                {summaryStats?.colleges_covered ?? colleges.length} Colleges
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                Active Accounts
                            </span>
                            <p className="mt-0.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {summaryStats?.active_users ?? totalCount}
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                                Verified institutional access
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#262246] dark:text-[#A78BFA]">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                Multi-Scoped Role Holders
                            </span>
                            <p className="mt-0.5 text-2xl font-black text-[#5B21B6] dark:text-[#A78BFA]">
                                {summaryStats?.multi_role_users ?? 0}
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                                Zero duplicate accounts created
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                Mandatory MFA Enforced
                            </span>
                            <p className="mt-0.5 text-2xl font-black text-[#5B21B6] dark:text-[#A78BFA]">
                                {summaryStats?.mfa_enforced ?? 0}
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                                High & critical risk roles
                            </span>
                        </div>
                    </div>
                </div>

                {/* Multi-Dimension Filter Bar + Export Faculty Matrix Button */}
                <div className="rounded-2xl border border-[#E5E4F0] bg-white p-3.5 shadow-2xs dark:border-border dark:bg-card">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onBlur={() => applyFilters({ search })}
                                placeholder="Search name, email, phone, or DSSC ID..."
                                className="w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] py-2 pr-3 pl-9 text-xs text-[#17152E] placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                            />
                        </form>

                        <select
                            value={entityFilter}
                            onChange={(e) => {
                                setEntityFilter(e.target.value);
                                applyFilters({ entity: e.target.value });
                            }}
                            className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                        >
                            <option value="All">All Entities / Campuses</option>
                            {entities.map((ent) => (
                                <option key={ent.id} value={String(ent.id)}>
                                    {ent.code} — {ent.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={collegeFilter}
                            onChange={(e) => {
                                setCollegeFilter(e.target.value);
                                applyFilters({ college: e.target.value });
                            }}
                            className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                        >
                            <option value="All">All Colleges</option>
                            {colleges.map((col) => (
                                <option key={col.id} value={String(col.id)}>
                                    {col.code} — {col.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                applyFilters({ role: e.target.value });
                            }}
                            className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                        >
                            <option value="All">All Roles</option>
                            {roles.map((r) => (
                                <option key={r.id} value={String(r.id)}>
                                    {r.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold text-[#17152E] focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Invited">Invited</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Locked">Locked</option>
                            <option value="Archived">Archived</option>
                        </select>

                        {/* Export Faculty Matrix Button */}
                        <div className="relative" ref={filterExportRef}>
                            <button
                                type="button"
                                onClick={() => setIsFilterExportMenuOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#A78BFA]/70 bg-[#EDE9FE]/55 px-3.5 py-2 text-xs font-bold text-[#5B21B6] transition hover:bg-[#EDE9FE] dark:border-[#7C3AED]/50 dark:bg-[#262246] dark:text-[#DDD6FE]"
                            >
                                <Download className="h-3.5 w-3.5 text-[#7C3AED]" />
                                Export Faculty Matrix
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>

                            {isFilterExportMenuOpen && (
                                <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-[#E5E4F0] bg-white p-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFilterExportMenuOpen(false);
                                            setIsReportsModalOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl bg-[#EDE9FE]/60 px-3 py-2 text-left font-bold text-[#4C1D95] hover:bg-[#EDE9FE] dark:bg-[#262246] dark:text-[#DDD6FE]"
                                    >
                                        <Eye className="h-3.5 w-3.5 text-[#7C3AED]" />
                                        Open Interactive Faculty Matrix ({facultyMatrix.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => downloadFacultyMatrixCsv(facultyMatrix)}
                                        className="mt-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                        Download Faculty Matrix (.CSV / Excel)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => printFacultyMatrix(facultyMatrix)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-[#5B21B6]" />
                                        Print / Save PDF Faculty Matrix
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canonical Identity Directory Table */}
                <div className="rounded-2xl border border-[#E5E4F0] bg-white shadow-2xs dark:border-border dark:bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#E5E4F0] bg-[#F7F7FB] text-[11px] font-bold text-[#17152E] dark:border-border dark:bg-muted/40 dark:text-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">Canonical User & Profile</th>
                                    <th className="px-4 py-3.5">
                                        Affiliations{' '}
                                        <span className="font-normal text-slate-500">
                                            (Entity · Campus · College · Program)
                                        </span>
                                    </th>
                                    <th className="px-4 py-3.5">Scoped Roles</th>
                                    <th className="px-4 py-3.5">Security & Last Login</th>
                                    <th className="px-5 py-3.5 text-right">Profile / Activity / Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E4F0]/80 dark:divide-border/60">
                                {rows.map((user) => {
                                    const completionPct = user.profile_completion ?? 92;
                                    const primaryEntity = user.resolved_entities?.[0];
                                    const primaryCollege = user.resolved_colleges?.[0];
                                    const extraCollegesCount = Math.max(
                                        0,
                                        (user.resolved_colleges?.length ?? 0) - 1,
                                    );
                                    const isActionOpen = openActionUserId === user.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-[#F7F7FB]/70 dark:hover:bg-muted/20"
                                        >
                                            {/* 1. Canonical User & Profile with Circular Progress Avatar */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3.5">
                                                    <CircularProgressAvatar
                                                        name={user.name}
                                                        photoUrl={user.faculty?.photo_url}
                                                        completion={completionPct}
                                                        onClick={() => openUserInspector(user, 'profile')}
                                                    />

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openUserInspector(user, 'profile')}
                                                                className="text-sm font-extrabold text-[#17152E] hover:text-[#5B21B6] hover:underline dark:text-foreground dark:hover:text-[#A78BFA]"
                                                            >
                                                                {user.name}
                                                            </button>
                                                            <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 font-mono text-[10px] font-bold text-[#5B21B6] dark:bg-[#262246] dark:text-[#DDD6FE]">
                                                                {user.institutional_id ||
                                                                    `DSSC-USR-${String(user.id).padStart(3, '0')}`}
                                                            </span>
                                                        </div>

                                                        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                            {user.designation_label ||
                                                                user.faculty?.academic_rank ||
                                                                user.roles?.[0]?.name ||
                                                                'Institutional Staff'}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Clean, Compact Affiliations (Entity · Campus · College · Program) */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {/* Entity / Campus Pill */}
                                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/90 bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-bold text-[#17152E] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                        <Building2 className="h-3 w-3 text-slate-500" />
                                                        {primaryEntity
                                                            ? primaryEntity.name
                                                            : 'DSSC Main Campus (Matti, Digos City)'}
                                                    </span>

                                                    {/* College Pill */}
                                                    {primaryCollege ? (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className="inline-flex items-center rounded-md border border-[#A78BFA]/35 bg-[#EDE9FE]/85 px-2.5 py-0.5 text-[11px] font-bold text-[#4C1D95] dark:border-[#7C3AED]/40 dark:bg-[#262246] dark:text-[#DDD6FE]">
                                                                {primaryCollege.code} - {primaryCollege.name}
                                                            </span>
                                                            {extraCollegesCount > 0 && (
                                                                <span className="rounded-md bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-bold text-[#5B21B6]">
                                                                    +{extraCollegesCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md border border-[#A78BFA]/30 bg-[#EDE9FE]/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA]">
                                                            Central Platform Governance
                                                        </span>
                                                    )}

                                                    {/* Program Badge(s) */}
                                                    {user.resolved_programs && user.resolved_programs.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.resolved_programs.slice(0, 2).map((prog) => (
                                                                <span
                                                                    key={prog.code}
                                                                    className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                >
                                                                    {prog.code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 3. Scoped Roles */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.scoped_role_assignments &&
                                                    user.scoped_role_assignments.length > 0 ? (
                                                        user.scoped_role_assignments.map((sra) => (
                                                            <span
                                                                key={sra.id}
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-100/80 px-2.5 py-1 text-[11px] font-bold text-[#17152E] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                            >
                                                                <span>{sra.role?.name}</span>
                                                                <span className="font-mono font-extrabold text-[#5B21B6] dark:text-[#A78BFA]">
                                                                    [
                                                                    {sra.program?.code ||
                                                                        sra.college?.code ||
                                                                        sra.entity?.code ||
                                                                        sra.scope_level}
                                                                    ]
                                                                </span>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        user.roles?.map((r) => (
                                                            <span
                                                                key={r.id}
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-100/80 px-2.5 py-1 text-[11px] font-bold text-[#17152E] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                            >
                                                                <span>{r.name}</span>
                                                                <span className="font-mono font-extrabold text-[#5B21B6] dark:text-[#A78BFA]">
                                                                    [INST]
                                                                </span>
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>

                                            {/* 4. Security & Last Login */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                                                                user.account_status,
                                                            )}`}
                                                        >
                                                            {user.account_status || 'Active'}
                                                        </span>
                                                        {user.mfa_required && (
                                                            <span className="rounded-md border border-[#A78BFA]/50 bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#5B21B6] dark:bg-[#262246] dark:text-[#DDD6FE]">
                                                                MFA
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="block text-[11px] text-slate-500 dark:text-muted-foreground">
                                                        Last login:{' '}
                                                        {user.last_login_at
                                                            ? user.last_login_at.slice(0, 10)
                                                            : 'Verified'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 5. Profile / Activity / Controls (Horizontal Three Dots Popover Menu) */}
                                            <td className="px-5 py-4 text-right">
                                                <div
                                                    className="relative inline-block text-left"
                                                    ref={isActionOpen ? actionMenuRef : undefined}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenActionUserId((prev) =>
                                                                prev === user.id ? null : user.id,
                                                            )
                                                        }
                                                        aria-label="Open user actions"
                                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                                            isActionOpen
                                                                ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#4C1D95]'
                                                                : 'border-[#D4C5FF] bg-white text-[#17152E] hover:border-[#7C3AED] hover:bg-[#EDE9FE]/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>

                                                    {isActionOpen && (
                                                        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[#E5E4F0] bg-white p-1.5 text-xs shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                                                            <button
                                                                type="button"
                                                                onClick={() => openUserInspector(user, 'profile')}
                                                                className="flex w-full items-center gap-2.5 rounded-xl bg-[#EDE9FE]/70 px-3 py-2 text-left font-bold text-[#4C1D95] transition hover:bg-[#EDE9FE] dark:bg-[#262246] dark:text-[#DDD6FE]"
                                                            >
                                                                <Eye className="h-3.5 w-3.5 text-[#5B21B6] dark:text-[#A78BFA]" />
                                                                View Profile
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => openUserInspector(user, 'activity')}
                                                                className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                <History className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                Activity Log
                                                            </button>

                                                            {(user.account_status || 'Active') === 'Active' ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => runSecurityAction(user.id, 'suspend')}
                                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-200 dark:hover:bg-rose-950/40"
                                                                >
                                                                    <PauseCircle className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                    Suspend Account
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => runSecurityAction(user.id, 'activate')}
                                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                                >
                                                                    <PlayCircle className="h-3.5 w-3.5" />
                                                                    Activate Account
                                                                </button>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    runSecurityAction(user.id, 'reset_password')
                                                                }
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                <KeyRound className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                Reset Access
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => openUserInspector(user, 'roles')}
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                <Users className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                Manage Roles
                                                            </button>

                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                                            <button
                                                                type="button"
                                                                onClick={() => openUserInspector(user, 'activity')}
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] transition hover:bg-[#F7F7FB] dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                View Audit Trail
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Server-Side Pagination Footer */}
                    {usersPaginator && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E4F0] bg-[#F7F7FB]/60 px-5 py-3.5 sm:flex-row dark:border-border/60 dark:bg-muted/20">
                            <p className="text-xs text-slate-500 dark:text-muted-foreground">
                                Showing <strong className="text-[#17152E] dark:text-foreground">{usersPaginator.from ?? 0}</strong> to{' '}
                                <strong className="text-[#17152E] dark:text-foreground">{usersPaginator.to ?? 0}</strong> of{' '}
                                <strong className="text-[#17152E] dark:text-foreground">{usersPaginator.total}</strong> canonical users
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
                                                    ? 'border-[#5B21B6] bg-[#5B21B6] text-white'
                                                    : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#EDE9FE]/50 dark:border-border dark:bg-background dark:text-foreground'
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

                {/* Download Reports & Institutional Faculty Matrix Modal */}
                {isReportsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                        <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E5E4F0] bg-white shadow-2xl dark:border-border dark:bg-card">
                            {/* Modal Header */}
                            <div className="flex flex-col justify-between gap-4 border-b border-[#E5E4F0] bg-gradient-to-r from-[#1E0B4B] via-[#3B147A] to-[#2E1065] px-6 py-5 text-white sm:flex-row sm:items-center">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#DDD6FE] uppercase">
                                        <FileSpreadsheet className="h-3 w-3" />
                                        Download Reports & Institutional Faculty Matrix
                                    </div>
                                    <h2 className="mt-1 text-lg font-extrabold">
                                        All-College Canonical Faculty & Academic Staff Matrix
                                    </h2>
                                    <p className="text-xs text-[#E9D5FF]/85">
                                        Consolidated matrix of all faculty across Entities, Campuses, Colleges, and
                                        Programs with academic rank, qualifications, specialization, and profile
                                        completeness.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => downloadFacultyMatrixCsv(filteredMatrix)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#17152E] shadow-xs hover:bg-slate-100"
                                    >
                                        <Download className="h-3.5 w-3.5 text-[#5B21B6]" />
                                        Download Matrix (.CSV / Excel)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => printFacultyMatrix(filteredMatrix)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        Print / Save PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsReportsModalOpen(false)}
                                        className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Filter Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E4F0] bg-[#F7F7FB] px-6 py-3 dark:border-border dark:bg-muted/30">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <div className="relative w-64">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={matrixSearch}
                                            onChange={(e) => setMatrixSearch(e.target.value)}
                                            placeholder="Filter faculty, rank, specialization..."
                                            className="w-full rounded-xl border border-[#E5E4F0] bg-white py-1.5 pr-3 pl-8 text-xs focus:border-[#7C3AED] focus:outline-none dark:border-border dark:bg-background"
                                        />
                                    </div>

                                    <select
                                        value={matrixCollegeFilter}
                                        onChange={(e) => setMatrixCollegeFilter(e.target.value)}
                                        className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] dark:border-border dark:bg-background dark:text-foreground"
                                    >
                                        <option value="All">All Colleges</option>
                                        {colleges.map((c) => (
                                            <option key={c.id} value={c.code}>
                                                {c.code} — {c.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={matrixEmploymentFilter}
                                        onChange={(e) => setMatrixEmploymentFilter(e.target.value)}
                                        className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] dark:border-border dark:bg-background dark:text-foreground"
                                    >
                                        <option value="All">All Employment Types</option>
                                        <option value="Full">Full-Time / Regular</option>
                                        <option value="Part">Part-Time / Visiting</option>
                                    </select>
                                </div>

                                <div className="text-xs font-bold text-[#5B21B6] dark:text-[#A78BFA]">
                                    Showing {filteredMatrix.length} of {facultyMatrix.length} Faculty Records
                                </div>
                            </div>

                            {/* Faculty Matrix Table Preview */}
                            <div className="flex-1 overflow-auto p-6">
                                <div className="overflow-hidden rounded-xl border border-[#E5E4F0] dark:border-border">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#EDE9FE]/70 text-[10px] font-extrabold tracking-wider text-[#4C1D95] uppercase dark:bg-[#262246] dark:text-[#DDD6FE]">
                                            <tr>
                                                <th className="px-3.5 py-3">DSSC ID</th>
                                                <th className="px-3.5 py-3">Faculty Member</th>
                                                <th className="px-3.5 py-3">College & Program</th>
                                                <th className="px-3.5 py-3">Academic Rank & Type</th>
                                                <th className="px-3.5 py-3">Qualification & Specialization</th>
                                                <th className="px-3.5 py-3">Scoped Roles</th>
                                                <th className="px-3.5 py-3 text-center">Profile</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E4F0] dark:divide-border/60">
                                            {filteredMatrix.map((fac) => (
                                                <tr
                                                    key={fac.id}
                                                    className="hover:bg-[#F7F7FB] dark:hover:bg-muted/20"
                                                >
                                                    <td className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-[#5B21B6] dark:text-[#A78BFA]">
                                                        {fac.institutional_id}
                                                    </td>
                                                    <td className="px-3.5 py-2.5">
                                                        <div className="font-bold text-[#17152E] dark:text-foreground">
                                                            {fac.full_name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">{fac.email}</div>
                                                    </td>
                                                    <td className="px-3.5 py-2.5">
                                                        <span className="inline-flex items-center rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-bold text-[#4C1D95] dark:bg-[#262246] dark:text-[#DDD6FE]">
                                                            {fac.college_code}
                                                        </span>{' '}
                                                        <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                            {fac.program_code}
                                                        </span>
                                                        <div className="mt-0.5 text-[10px] text-slate-500">
                                                            {fac.entity_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2.5">
                                                        <div className="font-semibold text-[#17152E] dark:text-foreground">
                                                            {fac.academic_rank}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {fac.employment_type}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2.5">
                                                        <div className="font-semibold text-[#17152E] dark:text-foreground">
                                                            {fac.highest_qualification}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {fac.specialization}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                        {fac.roles}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-center">
                                                        <span className="inline-flex items-center rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-extrabold text-[#4C1D95] dark:bg-[#262246] dark:text-[#DDD6FE]">
                                                            {fac.profile_completion}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E4F0] bg-[#F7F7FB] px-6 py-3.5 dark:border-border dark:bg-muted/30">
                                <button
                                    type="button"
                                    onClick={downloadCanonicalUsersCsv}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B21B6] hover:underline dark:text-[#A78BFA]"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Also download Canonical Users & Scoped Roles Directory (.CSV)
                                </button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsReportsModalOpen(false)}
                                        className="rounded-xl text-xs font-bold"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => downloadFacultyMatrixCsv(filteredMatrix)}
                                        className="rounded-xl bg-[#5B21B6] text-xs font-bold text-white hover:bg-[#4C1D95]"
                                    >
                                        <Download className="mr-1.5 h-3.5 w-3.5" />
                                        Download Filtered Faculty Matrix (.CSV)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Profile & Activity Log Slide-Over Inspector */}
                {inspectedUser && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
                        <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl">
                            {/* Inspector Header */}
                            <div className="border-b border-border bg-gradient-to-r from-[#1E0B4B] via-[#3B147A] to-[#2E1065] p-6 text-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <CircularProgressAvatar
                                            name={inspectedUser.name}
                                            photoUrl={inspectedUser.faculty?.photo_url}
                                            completion={inspectedUser.profile_completion ?? 92}
                                            size="lg"
                                        />
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 font-mono text-[10px] font-black text-[#4C1D95]">
                                                    {inspectedUser.institutional_id ||
                                                        `DSSC-USR-${String(inspectedUser.id).padStart(3, '0')}`}
                                                </span>
                                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                                    {inspectedUser.account_status || 'Active'}
                                                </span>
                                                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-[#DDD6FE]">
                                                    Profile {inspectedUser.profile_completion ?? 92}% Complete
                                                </span>
                                            </div>
                                            <h2 className="mt-1 text-xl font-extrabold">{inspectedUser.name}</h2>
                                            <p className="font-mono text-xs text-[#E9D5FF]/85">
                                                {inspectedUser.email}
                                            </p>
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
                                <div className="mt-5 flex flex-wrap gap-2">
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
                                                        ? 'bg-white text-[#4C1D95] shadow-sm'
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
                                        {/* Profile Completeness Meter */}
                                        <div className="rounded-2xl border border-[#A78BFA]/40 bg-[#EDE9FE]/35 p-4 dark:bg-[#262246]/40">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className=" inline-flex items-center gap-1.5 font-extrabold text-[#4C1D95] dark:text-[#DDD6FE]">
                                                    <CheckCircle2 className="h-4 w-4 text-[#7C3AED]" />
                                                    Canonical Profile Completeness
                                                </span>
                                                <span className="font-extrabold text-[#5B21B6] dark:text-[#A78BFA]">
                                                    {inspectedUser.profile_completion ?? 92}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EDE9FE] dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4C1D95]"
                                                    style={{
                                                        width: `${inspectedUser.profile_completion ?? 92}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

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
                                                                    className="text-xs font-bold text-[#5B21B6] dark:text-[#A78BFA]"
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
                                                    <Mail className="h-3.5 w-3.5 text-[#7C3AED]" />
                                                    {inspectedUser.email}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1.5 font-mono text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 text-[#5B21B6]" />
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
                                                    <h3 className="text-xs font-extrabold tracking-wider text-[#5B21B6] uppercase dark:text-[#A78BFA]">
                                                        Academic & HR Profile Dossier
                                                    </h3>
                                                    <Link
                                                        href={`/faculties/${inspectedUser.faculty.id}`}
                                                        className="text-xs font-bold text-[#7C3AED] hover:underline"
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
                                                            {inspectedUser.faculty.employment_type ||
                                                                'Regular / Permanent'}
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
                                                            {inspectedUser.faculty.specialization ||
                                                                'Information Systems'}
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
                                                className="text-xs font-bold text-[#7C3AED] hover:underline"
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
                                                        <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[10px] font-bold text-[#5B21B6] dark:bg-[#262246] dark:text-[#DDD6FE]">
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
                                                        <span className="rounded bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#5B21B6] uppercase dark:bg-[#262246] dark:text-[#DDD6FE]">
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
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10"
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
                                        className="rounded text-[#5B21B6]"
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
                                        className="bg-[#5B21B6] text-xs font-bold text-white hover:bg-[#4C1D95]"
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
