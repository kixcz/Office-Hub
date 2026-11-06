import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Copy,
    Crown,
    Download,
    Edit3,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    GraduationCap,
    Grid,
    HelpCircle,
    History,
    Info,
    Key,
    Layers,
    Lock,
    MoreHorizontal,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Trash2,
    Unlock,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PermissionItem {
    id: number;
    name: string;
    module: string;
    capability: string;
    description?: string;
}

interface AssignedUser {
    id: number;
    name: string;
    email: string;
    institutional_id: string;
    scope_level: string;
    scope_code: string;
    designation_type: string;
    status: string;
}

interface RoleAuditLog {
    id: number;
    action: string;
    target_name: string;
    actor_name: string;
    actor_role: string;
    reason?: string | null;
    severity?: string;
    previous_value?: any;
    new_value?: any;
    timestamp: string;
}

interface RoleItem {
    id: number;
    name: string;
    tier: string;
    risk_level: string;
    is_system_role: boolean;
    status: 'Active' | 'Inactive' | 'Retired';
    description?: string;
    allowed_scopes?: string[];
    requires_mfa?: boolean;
    requires_approval?: boolean;
    icon_key?: string;
    users_count: number;
    scoped_assignments_count?: number;
    assigned_users?: AssignedUser[];
    permissions: PermissionItem[];
    role_audit_logs?: RoleAuditLog[];
    can_delete?: boolean;
    delete_block_reason?: string | null;
    updated_at_formatted?: string;
}

interface Props {
    roles: RoleItem[];
    permissions: PermissionItem[];
    auditHistory?: RoleAuditLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Role Management & Permission Matrix', href: '/institution/roles' },
];

const CAPABILITIES = [
    'View',
    'Create',
    'Edit',
    'Delete',
    'Review',
    'Verify',
    'Approve',
    'Publish',
    'Export',
    'Configure',
    'Assign',
] as const;

export default function RolesPermissionsIndex({ roles = [], permissions = [], auditHistory = [] }: Props) {
    // Main Top Tabs: 'roles' (Split View / Directory), 'matrix' (Permission Matrix), 'authority' (Assignment Authority Matrix), 'cards' (Role Cards), 'table' (All Roles Table), 'audit' (Global Audit Trail)
    const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'authority' | 'cards' | 'table' | 'audit'>('roles');

    // Selected role in the split view (defaults to first role or Institution Super Admin)
    const [selectedRoleId, setSelectedRoleId] = useState<number>(() => {
        const superAdmin = roles.find((r) => r.name === 'Institution Super Admin');
        return superAdmin ? superAdmin.id : roles[0]?.id ?? 1;
    });

    // Sub-tab inside selected role detail panel: 'permissions' | 'details' | 'users' | 'activity'
    const [roleDetailTab, setRoleDetailTab] = useState<'permissions' | 'details' | 'users' | 'activity'>('permissions');

    // Permissions view mode inside selected role: 'grouped' | 'all'
    const [rolePermViewMode, setRolePermViewMode] = useState<'grouped' | 'all'>('grouped');

    // Collapsed modules inside the selected role permission accordion
    const [collapsedRoleModules, setCollapsedRoleModules] = useState<Record<string, boolean>>({});

    // Filter and search controls
    const [roleSearch, setRoleSearch] = useState('');
    const [matrixSearch, setMatrixSearch] = useState('');
    const [matrixModuleFilter, setMatrixModuleFilter] = useState('All');
    const [tierFilter, setTierFilter] = useState('All');
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 6;

    // Modals / Full-Height Drawer state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [roleToDuplicate, setRoleToDuplicate] = useState<RoleItem | null>(null);
    const [duplicateName, setDuplicateName] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
    const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
    const [roleToDeactivate, setRoleToDeactivate] = useState<RoleItem | null>(null);

    // Active dropdown in table view
    const [openMenuRoleId, setOpenMenuRoleId] = useState<number | null>(null);

    // Modules list from permissions
    const uniqueModules = useMemo(() => {
        return Array.from(new Set(permissions.map((p) => p.module))).sort();
    }, [permissions]);

    // Selected Role object
    const selectedRole = useMemo(() => {
        return roles.find((r) => r.id === selectedRoleId) ?? roles[0] ?? null;
    }, [roles, selectedRoleId]);

    // Permissions grouped by module for selected role
    const permissionsByModule = useMemo(() => {
        const groups: Record<string, PermissionItem[]> = {};
        for (const perm of permissions) {
            if (!groups[perm.module]) {
                groups[perm.module] = [];
            }
            groups[perm.module].push(perm);
        }
        return groups;
    }, [permissions]);

    // Filtered roles for left sidebar / table / cards
    const filteredRoles = useMemo(() => {
        return roles.filter((r) => {
            if (tierFilter !== 'All' && r.tier !== tierFilter) {
                return false;
            }
            if (roleSearch.trim() !== '') {
                const q = roleSearch.toLowerCase();
                return (
                    r.name.toLowerCase().includes(q) ||
                    (r.description && r.description.toLowerCase().includes(q)) ||
                    r.tier.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [roles, tierFilter, roleSearch]);

    // Paginated roles for left sidebar
    const paginatedSidebarRoles = useMemo(() => {
        const start = (pageNumber - 1) * pageSize;
        return filteredRoles.slice(start, start + pageSize);
    }, [filteredRoles, pageNumber]);

    const totalPages = Math.ceil(filteredRoles.length / pageSize) || 1;

    // Role Editor Form
    const {
        data: editorData,
        setData: setEditorData,
        post: postRole,
        put: putRole,
        processing: editorProcessing,
        errors: editorErrors,
        reset: resetEditor,
    } = useForm({
        name: '',
        tier: 'College',
        risk_level: 'Standard',
        status: 'Active',
        description: '',
        allowed_scopes: ['College', 'Program'] as string[],
        requires_mfa: false,
        requires_approval: false,
        permission_ids: [] as number[],
        reason: '',
    });

    // Editor internal tab & permission filter
    const [editorTab, setEditorTab] = useState<'basic' | 'permissions' | 'scopes' | 'review'>('basic');
    const [editorPermSearch, setEditorPermSearch] = useState('');
    const [editorModuleFilter, setEditorModuleFilter] = useState('All');

    // Open Role Editor for Creating
    const handleOpenCreate = () => {
        resetEditor();
        setEditorData({
            name: '',
            tier: 'College',
            risk_level: 'Standard',
            status: 'Active',
            description: '',
            allowed_scopes: ['College', 'Program'],
            requires_mfa: false,
            requires_approval: false,
            permission_ids: [],
            reason: 'Created new custom role.',
        });
        setEditorMode('create');
        setEditingRole(null);
        setEditorTab('basic');
        setEditorOpen(true);
    };

    // Open Role Editor for Editing
    const handleOpenEdit = (role: RoleItem) => {
        setEditingRole(role);
        setEditorData({
            name: role.name,
            tier: role.tier || 'College',
            risk_level: role.risk_level || 'Standard',
            status: role.status || 'Active',
            description: role.description || '',
            allowed_scopes: role.allowed_scopes && role.allowed_scopes.length > 0 ? role.allowed_scopes : [role.tier],
            requires_mfa: !!role.requires_mfa,
            requires_approval: !!role.requires_approval,
            permission_ids: role.permissions.map((p) => p.id),
            reason: '',
        });
        setEditorMode('edit');
        setEditorTab('basic');
        setEditorOpen(true);
    };

    // Save Role Editor
    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (editorMode === 'create') {
            postRole('/institution/roles', {
                preserveScroll: true,
                onSuccess: () => {
                    setEditorOpen(false);
                    resetEditor();
                },
            });
        } else if (editingRole) {
            putRole(`/institution/roles/${editingRole.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditorOpen(false);
                },
            });
        }
    };

    // Handle Quick Cell Toggle in Matrix / Selected Role
    const handleToggleCell = (roleId: number, permissionId: number) => {
        router.post(
            `/institution/roles/${roleId}/permissions/toggle`,
            { permission_id: permissionId },
            { preserveScroll: true }
        );
    };

    // Handle Module Bulk Select / Deselect for a Role
    const handleToggleModuleForRole = (role: RoleItem, moduleName: string, grantAll: boolean) => {
        const modulePerms = permissions.filter((p) => p.module === moduleName);
        const modulePermIds = modulePerms.map((p) => p.id);
        const currentRolePermIds = role.permissions.map((p) => p.id);

        let nextIds: number[];
        if (grantAll) {
            nextIds = Array.from(new Set([...currentRolePermIds, ...modulePermIds]));
        } else {
            nextIds = currentRolePermIds.filter((id) => !modulePermIds.includes(id));
        }

        router.post(
            `/institution/roles/${role.id}/permissions/bulk`,
            {
                permission_ids: nextIds,
                reason: `${grantAll ? 'Granted' : 'Revoked'} all permissions for module '${moduleName}'.`,
            },
            { preserveScroll: true }
        );
    };

    // Open Duplicate Modal
    const handleOpenDuplicate = (role: RoleItem) => {
        setRoleToDuplicate(role);
        setDuplicateName(`${role.name} (Copy)`);
        setDuplicateModalOpen(true);
    };

    // Submit Duplicate
    const handleConfirmDuplicate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleToDuplicate) return;
        router.post(
            `/institution/roles/${roleToDuplicate.id}/duplicate`,
            { name: duplicateName },
            {
                preserveScroll: true,
                onSuccess: () => setDuplicateModalOpen(false),
            }
        );
    };

    // Toggle Role Status (Active / Inactive)
    const handleToggleRoleStatus = (role: RoleItem) => {
        if (role.name === 'Institution Super Admin') return;
        const nextStatus = role.status === 'Active' ? 'Inactive' : 'Active';
        router.post(
            `/institution/roles/${role.id}/status`,
            {
                status: nextStatus,
                reason: `Toggled role status to ${nextStatus}.`,
            },
            { preserveScroll: true }
        );
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!roleToDelete) return;
        router.delete(`/institution/roles/${roleToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setRoleToDelete(null);
            },
        });
    };

    // Helper for Tier Badge
    const getTierBadge = (tier?: string) => {
        switch (tier) {
            case 'Institution':
                return 'bg-[#F1F5F9] text-[#0B3A67] border-[#8B1E3F]/30 dark:bg-slate-800 dark:text-[#BFDBFE]';
            case 'Entity':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
            case 'College':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300';
            case 'Program':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
            case 'Operational':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    // Helper for Risk Badge
    const getRiskBadge = (risk?: string) => {
        switch (risk) {
            case 'Critical':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
            case 'High':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            case 'Elevated':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
        }
    };

    // Role Icon Selector
    const getRoleIcon = (roleName: string, tier: string) => {
        if (roleName.includes('Super Admin') || roleName.includes('Executive')) {
            return <Crown className="h-4 w-4 text-amber-500" />;
        }
        if (roleName.includes('Admin')) {
            return <Shield className="h-4 w-4 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]" />;
        }
        if (roleName.includes('Dean') || roleName.includes('Coordinator')) {
            return <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
        }
        if (roleName.includes('Program')) {
            return <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
        }
        if (roleName.includes('Faculty')) {
            return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
        }
        return <Key className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    };

    // CSV Download Helper for Permission Matrix
    const downloadMatrixCsv = () => {
        const headers = ['Module', 'Action Permission', 'Capability', 'Description', ...roles.map((r) => r.name)];
        const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const lines = [
            headers.map(escapeCsv).join(','),
            ...permissions.map((perm) => {
                const roleFlags = roles.map((r) => (r.permissions.some((p) => p.id === perm.id) ? 'YES' : 'NO'));
                return [perm.module, perm.name, perm.capability, perm.description ?? '', ...roleFlags]
                    .map(escapeCsv)
                    .join(',');
            }),
        ];

        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ascend_Role_Permission_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management & Permission Matrix — Ascend Governance" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 bg-[#F7F7FB] p-4 md:p-6 dark:bg-background">
                {/* Header Banner */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs sm:flex-row sm:items-center dark:border-border dark:bg-card">
                    <div>
                        <div className="mb-1.5 inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#0B3A67] dark:text-[#93C5FD] uppercase dark:bg-slate-800 dark:text-[#BFDBFE]">
                            <Key className="h-3 w-3" />
                            Access Control & Governance Architecture
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-[#17152E] dark:text-foreground">
                            Role Management & Permissions
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-muted-foreground">
                            Create and manage system roles, define their access permissions, and control what each role
                            can do across Ascend modules. Roles define <em>what</em> is allowed; scoped assignments
                            determine <em>where</em>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* KPI Summary Pills */}
                        <div className="flex items-center gap-2 rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 dark:border-border dark:bg-muted/40">
                            <Users className="h-4 w-4 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]" />
                            <div className="text-left">
                                <div className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                    {roles.length}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400">Total Roles</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 dark:border-border dark:bg-muted/40">
                            <Grid className="h-4 w-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                            <div className="text-left">
                                <div className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                    {permissions.length}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400">Permissions</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] px-3 py-2 dark:border-border dark:bg-muted/40">
                            <Layers className="h-4 w-4 text-emerald-600" />
                            <div className="text-left">
                                <div className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                    {uniqueModules.length}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400">Modules</div>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={downloadMatrixCsv}
                            variant="outline"
                            className="rounded-xl border-[#E5E4F0] text-xs font-bold text-[#17152E] hover:bg-[#F1F5F9] dark:border-border dark:text-foreground"
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Download Matrix (.CSV)
                        </Button>
                    </div>
                </div>

                {/* Primary Navigation Tabs */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('roles')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'roles'
                                ? 'border-[#0B3A67] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'roles'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Roles Directory</div>
                            <div className={`text-[10px] ${activeTab === 'roles' ? 'text-white/80' : 'text-slate-400'}`}>
                                Split view & focused configuration
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('matrix')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'matrix'
                                ? 'border-[#0B3A67] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'matrix'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <Grid className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Permission Matrix</div>
                            <div className={`text-[10px] ${activeTab === 'matrix' ? 'text-white/80' : 'text-slate-400'}`}>
                                Cross-role side-by-side comparison
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('authority')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'authority'
                                ? 'border-[#0B3A67] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'authority'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Assignment Authority</div>
                            <div className={`text-[10px] ${activeTab === 'authority' ? 'text-white/80' : 'text-slate-400'}`}>
                                Who can assign which roles
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('cards')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'cards'
                                ? 'border-[#0B3A67] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'cards'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <Layers className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">Role Cards</div>
                            <div className={`text-[10px] ${activeTab === 'cards' ? 'text-white/80' : 'text-slate-400'}`}>
                                Visual tiers & catalog view
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                            activeTab === 'table'
                                ? 'border-[#0B3A67] bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white shadow-md'
                                : 'border-[#E5E4F0] bg-white text-[#17152E] hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                activeTab === 'table'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD]'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold">All Roles Table</div>
                            <div className={`text-[10px] ${activeTab === 'table' ? 'text-white/80' : 'text-slate-400'}`}>
                                Searchable directory & ⋯ actions
                            </div>
                        </div>
                    </button>
                </div>

                {/* TAB 1: ROLES DIRECTORY (SPLIT VIEW - Matches User's Screenshot Exactly) */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                        {/* Left Column: All Roles List (5 Cols) */}
                        <div className="flex flex-col rounded-2xl border border-[#E5E4F0] bg-white p-4 shadow-2xs lg:col-span-4 dark:border-border dark:bg-card">
                            <div className="flex items-center justify-between pb-3">
                                <h2 className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                    All Roles ({roles.length})
                                </h2>
                                <Button
                                    type="button"
                                    onClick={handleOpenCreate}
                                    className="h-8 rounded-xl bg-[#0B3A67] px-3 text-xs font-bold text-white hover:bg-[#082847]"
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Create Role
                                </Button>
                            </div>

                            {/* Search bar inside list */}
                            <div className="relative mb-3">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={roleSearch}
                                    onChange={(e) => {
                                        setRoleSearch(e.target.value);
                                        setPageNumber(1);
                                    }}
                                    placeholder="Search roles..."
                                    className="w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] py-2 pr-9 pl-9 text-xs text-[#17152E] placeholder:text-slate-400 focus:border-[#0B3A67] focus:bg-white focus:outline-none dark:border-border dark:bg-background dark:text-foreground"
                                />
                                <Filter className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            </div>

                            {/* Roles List */}
                            <div className="flex flex-col gap-2">
                                {paginatedSidebarRoles.map((role) => {
                                    const isSelected = selectedRole?.id === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setSelectedRoleId(role.id)}
                                            className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                                                isSelected
                                                    ? 'border-[#A78BFA] bg-[#F1F5F9] shadow-2xs dark:border-[#0B3A67]/20 dark:bg-slate-800'
                                                    : 'border-[#E5E4F0] bg-white hover:bg-[#F7F7FB] dark:border-border dark:bg-card dark:hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                        role.name.includes('Super Admin')
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                                                    }`}
                                                >
                                                    {getRoleIcon(role.name, role.tier)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-extrabold text-[#17152E] dark:text-foreground">
                                                        {role.name}
                                                    </div>
                                                    <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                                                        {role.description || 'Configured role bundle for platform authority.'}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                {role.permissions.length} perms
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            <div className="mt-4 flex items-center justify-between border-t border-[#E5E4F0] pt-3 text-xs dark:border-border">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPageNumber(idx + 1)}
                                            className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                                                pageNumber === idx + 1
                                                    ? 'bg-[#0B3A67] text-white'
                                                    : 'bg-[#F7F7FB] text-slate-600 hover:bg-[#F1F5F9] dark:bg-muted dark:text-slate-300'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    {(pageNumber - 1) * pageSize + 1}-
                                    {Math.min(pageNumber * pageSize, filteredRoles.length)} of {filteredRoles.length} roles
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Selected Role Detail Panel (7 Cols) */}
                        {selectedRole && (
                            <div className="flex flex-col rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs lg:col-span-8 dark:border-border dark:bg-card">
                                {/* Role Header Bar */}
                                <div className="flex flex-col justify-between gap-4 border-b border-[#E5E4F0] pb-4 sm:flex-row sm:items-center dark:border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-2xs dark:bg-amber-950/30">
                                            {getRoleIcon(selectedRole.name, selectedRole.tier)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-black text-[#17152E] dark:text-foreground">
                                                    {selectedRole.name}
                                                </h2>
                                                {selectedRole.is_system_role && (
                                                    <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                        System Role
                                                    </span>
                                                )}
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRiskBadge(
                                                        selectedRole.risk_level
                                                    )}`}
                                                >
                                                    {selectedRole.risk_level} Risk
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                                                {selectedRole.description ||
                                                    'Full system access to all features, modules, and data across the entire institution.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons: Edit, Duplicate, Delete, Active Toggle */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(selectedRole)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] shadow-2xs hover:bg-[#F7F7FB] dark:border-border dark:bg-background dark:text-foreground"
                                        >
                                            <Edit3 className="h-3.5 w-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenDuplicate(selectedRole)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] shadow-2xs hover:bg-[#F7F7FB] dark:border-border dark:bg-background dark:text-foreground"
                                        >
                                            <Copy className="h-3.5 w-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                            Duplicate
                                        </button>

                                        {selectedRole.can_delete ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRoleToDelete(selectedRole);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        ) : (
                                            <span
                                                title={selectedRole.delete_block_reason || 'Role is protected.'}
                                                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-800/60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </span>
                                        )}

                                        {/* Active Status Pill Button */}
                                        <button
                                            type="button"
                                            disabled={selectedRole.name === 'Institution Super Admin'}
                                            onClick={() => handleToggleRoleStatus(selectedRole)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition ${
                                                selectedRole.status === 'Active'
                                                    ? 'bg-emerald-500 text-white shadow-xs'
                                                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    selectedRole.status === 'Active' ? 'bg-white' : 'bg-slate-500'
                                                }`}
                                            />
                                            {selectedRole.status === 'Active' ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-Tabs: Permissions | Role Details | Assigned Users | Activity Log */}
                                <div className="mt-4 flex flex-wrap gap-2 border-b border-[#E5E4F0] pb-2 dark:border-border">
                                    <button
                                        type="button"
                                        onClick={() => setRoleDetailTab('permissions')}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                            roleDetailTab === 'permissions'
                                                ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                                                : 'text-slate-500 hover:text-[#17152E] dark:hover:text-foreground'
                                        }`}
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        Permissions ({selectedRole.permissions.length})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRoleDetailTab('details')}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                            roleDetailTab === 'details'
                                                ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                                                : 'text-slate-500 hover:text-[#17152E] dark:hover:text-foreground'
                                        }`}
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                        Role Details
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRoleDetailTab('users')}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                            roleDetailTab === 'users'
                                                ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                                                : 'text-slate-500 hover:text-[#17152E] dark:hover:text-foreground'
                                        }`}
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        Assigned Users ({selectedRole.users_count})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRoleDetailTab('activity')}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                            roleDetailTab === 'activity'
                                                ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]'
                                                : 'text-slate-500 hover:text-[#17152E] dark:hover:text-foreground'
                                        }`}
                                    >
                                        <History className="h-3.5 w-3.5" />
                                        Activity Log ({selectedRole.role_audit_logs?.length ?? 0})
                                    </button>
                                </div>

                                {/* Sub-Tab 1: Permissions List / Accordion */}
                                {roleDetailTab === 'permissions' && (
                                    <div className="mt-4 flex-1 space-y-4">
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                                    Module Access & Permissions
                                                </h3>
                                                <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                                                    Define what this role can access and which actions are allowed per module.
                                                </p>
                                            </div>

                                            {/* View Mode Toggle: Grouped by Module | All Permissions */}
                                            <div className="flex items-center gap-1 rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] p-1 text-[11px] font-bold dark:border-border dark:bg-muted/40">
                                                <span className="px-2 text-slate-400">View Mode:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRolePermViewMode('grouped')}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                                                        rolePermViewMode === 'grouped'
                                                            ? 'bg-white text-[#0B3A67] dark:text-[#93C5FD] shadow-2xs dark:bg-card dark:text-[#93C5FD]'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    <Layers className="h-3 w-3" />
                                                    Grouped by Module
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRolePermViewMode('all')}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                                                        rolePermViewMode === 'all'
                                                            ? 'bg-white text-[#0B3A67] dark:text-[#93C5FD] shadow-2xs dark:bg-card dark:text-[#93C5FD]'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    <Grid className="h-3 w-3" />
                                                    All Permissions
                                                </button>
                                            </div>
                                        </div>

                                        {/* Module Accordions */}
                                        <div className="space-y-3">
                                            {uniqueModules.map((moduleName) => {
                                                const modPerms = permissionsByModule[moduleName] || [];
                                                const grantedCount = modPerms.filter((p) =>
                                                    selectedRole.permissions.some((rp) => rp.id === p.id)
                                                ).length;
                                                const isAllGranted = grantedCount === modPerms.length && modPerms.length > 0;
                                                const isCollapsed = !!collapsedRoleModules[moduleName];

                                                return (
                                                    <div
                                                        key={moduleName}
                                                        className="overflow-hidden rounded-2xl border border-[#E5E4F0] bg-white shadow-2xs dark:border-border dark:bg-card"
                                                    >
                                                        {/* Module Accordion Header */}
                                                        <div className="flex items-center justify-between bg-[#F7F7FB] p-3 dark:bg-muted/30">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                                    <Building2 className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-extrabold text-[#17152E] dark:text-foreground">
                                                                        {moduleName}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400">
                                                                        {modPerms[0]?.description || 'Module governance and operations.'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    {grantedCount} of {modPerms.length} enabled
                                                                </span>

                                                                {isAllGranted ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleToggleModuleForRole(
                                                                                selectedRole,
                                                                                moduleName,
                                                                                true
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-[#8B1E3F]/30 bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:bg-[#DDD6FE]"
                                                                    >
                                                                        Enable All
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setCollapsedRoleModules((prev) => ({
                                                                            ...prev,
                                                                            [moduleName]: !prev[moduleName],
                                                                        }))
                                                                    }
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                                                                >
                                                                    {isCollapsed ? (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Module Permissions Table (expanded) */}
                                                        {!isCollapsed && (
                                                            <div className="overflow-x-auto border-t border-[#E5E4F0] p-2 dark:border-border">
                                                                <table className="w-full text-left text-xs">
                                                                    <thead className="text-[10px] font-bold text-slate-400 uppercase">
                                                                        <tr>
                                                                            <th className="w-10 px-3 py-2 text-center">✓</th>
                                                                            <th className="px-3 py-2">Permission</th>
                                                                            <th className="px-3 py-2">Capability</th>
                                                                            <th className="px-3 py-2">Description</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-[#E5E4F0]/60 dark:divide-border/40">
                                                                        {modPerms.map((perm) => {
                                                                            const isChecked = selectedRole.permissions.some(
                                                                                (p) => p.id === perm.id
                                                                            );
                                                                            return (
                                                                                <tr
                                                                                    key={perm.id}
                                                                                    onClick={() =>
                                                                                        handleToggleCell(
                                                                                            selectedRole.id,
                                                                                            perm.id
                                                                                        )
                                                                                    }
                                                                                    className="cursor-pointer transition hover:bg-[#F7F7FB] dark:hover:bg-muted/20"
                                                                                >
                                                                                    <td className="px-3 py-2.5 text-center">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            readOnly
                                                                                            checked={isChecked}
                                                                                            className="h-4 w-4 rounded border-[#A78BFA] text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67]"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 font-bold text-[#17152E] dark:text-foreground">
                                                                                        {perm.name}
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5">
                                                                                        <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                                                            {perm.capability}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-slate-500 dark:text-muted-foreground">
                                                                                        {perm.description}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Sub-Tab 2: Role Details */}
                                {roleDetailTab === 'details' && (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-[#E5E4F0] p-4 text-xs dark:border-border">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                                                    Organizational Tier
                                                </span>
                                                <p className="mt-1 font-extrabold text-[#17152E] dark:text-foreground">
                                                    {selectedRole.tier} Tier
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Applies by default to {selectedRole.tier} level organizational units.
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[#E5E4F0] p-4 text-xs dark:border-border">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                                                    Security Risk Classification
                                                </span>
                                                <p className="mt-1 font-extrabold text-[#17152E] dark:text-foreground">
                                                    {selectedRole.risk_level} Risk
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    MFA Enforced: {selectedRole.requires_mfa ? 'Yes' : 'Optional'}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[#E5E4F0] p-4 text-xs dark:border-border">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                                                    Permitted Scope Bindings
                                                </span>
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {(selectedRole.allowed_scopes ?? [selectedRole.tier]).map((sc) => (
                                                        <span
                                                            key={sc}
                                                            className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]"
                                                        >
                                                            {sc}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-[#E5E4F0] p-4 text-xs dark:border-border">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                                                    Last Governance Modification
                                                </span>
                                                <p className="mt-1 font-mono font-bold text-[#17152E] dark:text-foreground">
                                                    {selectedRole.updated_at_formatted}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Status: <strong>{selectedRole.status}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-[#E5E4F0] bg-[#F7F7FB] p-4 text-xs dark:border-border dark:bg-muted/20">
                                            <h4 className="font-extrabold text-[#17152E] dark:text-foreground">
                                                Role Purpose & Governance Context
                                            </h4>
                                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                                                {selectedRole.description ||
                                                    'This role bundles standardized capabilities for institutional administration.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Sub-Tab 3: Assigned Users */}
                                {roleDetailTab === 'users' && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-extrabold text-[#17152E] dark:text-foreground">
                                                Active Users Assigned to {selectedRole.name} (
                                                {selectedRole.assigned_users?.length ?? 0})
                                            </h3>
                                            <a
                                                href="/institution/scoped-roles"
                                                className="text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline dark:text-[#93C5FD]"
                                            >
                                                + Assign Role to Another User
                                            </a>
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-[#E5E4F0] dark:border-border">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[#F7F7FB] text-[10px] font-bold text-slate-400 uppercase dark:bg-muted/40">
                                                    <tr>
                                                        <th className="px-3.5 py-2.5">User Identity</th>
                                                        <th className="px-3.5 py-2.5">Scope Level & Unit</th>
                                                        <th className="px-3.5 py-2.5">Designation</th>
                                                        <th className="px-3.5 py-2.5">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E5E4F0] dark:divide-border/60">
                                                    {(selectedRole.assigned_users ?? []).map((u) => (
                                                        <tr key={u.id} className="hover:bg-[#F7F7FB] dark:hover:bg-muted/20">
                                                            <td className="px-3.5 py-2.5">
                                                                <div className="font-bold text-[#17152E] dark:text-foreground">
                                                                    {u.name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    {u.institutional_id} · {u.email}
                                                                </div>
                                                            </td>
                                                            <td className="px-3.5 py-2.5">
                                                                <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                                    {u.scope_level}: {u.scope_code}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-2.5 font-semibold text-slate-600 dark:text-slate-300">
                                                                {u.designation_type}
                                                            </td>
                                                            <td className="px-3.5 py-2.5">
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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

                                {/* Sub-Tab 4: Activity Log */}
                                {roleDetailTab === 'activity' && (
                                    <div className="mt-4 space-y-3">
                                        <h3 className="text-xs font-extrabold text-[#17152E] dark:text-foreground">
                                            Audit History for {selectedRole.name}
                                        </h3>
                                        <div className="space-y-2">
                                            {(selectedRole.role_audit_logs ?? []).map((log) => (
                                                <div
                                                    key={log.id}
                                                    className="rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] p-3 text-xs dark:border-border dark:bg-muted/20"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-[#17152E] dark:text-foreground">
                                                            {log.action}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-slate-400">
                                                            {log.timestamp}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                        By <strong>{log.actor_name}</strong> ({log.actor_role})
                                                    </p>
                                                    {log.reason && (
                                                        <p className="mt-1 text-[11px] text-slate-600 italic dark:text-slate-300">
                                                            "{log.reason}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                            {(selectedRole.role_audit_logs ?? []).length === 0 && (
                                                <p className="text-xs text-slate-400">No recent modification logs found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: PERMISSION MATRIX (Cross-Role Comparison) */}
                {activeTab === 'matrix' && (
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex flex-col justify-between gap-3 border-b border-[#E5E4F0] pb-4 sm:flex-row sm:items-center dark:border-border">
                            <div>
                                <h2 className="text-base font-black text-[#17152E] dark:text-foreground">
                                    Interactive Role × Capability Permission Matrix
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                                    Compare roles side by side across action capabilities: View, Create, Edit, Delete,
                                    Review, Verify, Approve, Publish, Export, Configure, and Assign.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={matrixSearch}
                                        onChange={(e) => setMatrixSearch(e.target.value)}
                                        placeholder="Filter actions or capabilities..."
                                        className="w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] py-1.5 pr-3 pl-8 text-xs focus:border-[#0B3A67] focus:bg-white focus:outline-none dark:border-border dark:bg-background"
                                    />
                                </div>

                                <select
                                    value={matrixModuleFilter}
                                    onChange={(e) => setMatrixModuleFilter(e.target.value)}
                                    className="rounded-xl border border-[#E5E4F0] bg-white px-3 py-1.5 text-xs font-bold text-[#17152E] dark:border-border dark:bg-background dark:text-foreground"
                                >
                                    <option value="All">All Modules ({uniqueModules.length})</option>
                                    {uniqueModules.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sticky Matrix Table */}
                        <div className="mt-4 max-h-[700px] overflow-auto rounded-xl border border-[#E5E4F0] dark:border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 z-20 border-b border-[#E5E4F0] bg-[#F7F7FB] text-[10px] font-bold text-slate-500 uppercase dark:border-border dark:bg-slate-900">
                                    <tr>
                                        <th className="sticky left-0 z-30 min-w-[260px] border-r border-[#E5E4F0] bg-[#F7F7FB] px-4 py-3 dark:border-border dark:bg-slate-900">
                                            Module / Action Capability
                                        </th>
                                        <th className="px-3 py-3 text-center">Action</th>
                                        {roles.map((r) => (
                                            <th key={r.id} className="min-w-[110px] px-3 py-3 text-center">
                                                <div className="font-extrabold text-[#17152E] dark:text-foreground">
                                                    {r.name}
                                                </div>
                                                <span className="text-[9px] font-normal text-slate-400">
                                                    ({r.permissions.length} perms)
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E4F0] dark:divide-border/60">
                                    {permissions
                                        .filter((p) => {
                                            if (matrixModuleFilter !== 'All' && p.module !== matrixModuleFilter) {
                                                return false;
                                            }
                                            if (matrixSearch.trim() !== '') {
                                                const q = matrixSearch.toLowerCase();
                                                return (
                                                    p.name.toLowerCase().includes(q) ||
                                                    p.capability.toLowerCase().includes(q) ||
                                                    p.module.toLowerCase().includes(q)
                                                );
                                            }
                                            return true;
                                        })
                                        .map((perm) => (
                                            <tr key={perm.id} className="hover:bg-[#F7F7FB] dark:hover:bg-muted/20">
                                                <td className="sticky left-0 z-10 border-r border-[#E5E4F0] bg-white px-4 py-2.5 dark:border-border dark:bg-card">
                                                    <span className="font-mono font-bold text-[#17152E] dark:text-foreground">
                                                        {perm.name}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400">
                                                        {perm.module} — {perm.description}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                        {perm.capability}
                                                    </span>
                                                </td>
                                                {roles.map((r) => {
                                                    const hasPerm = r.permissions.some((p) => p.id === perm.id);
                                                    return (
                                                        <td
                                                            key={r.id}
                                                            onClick={() => handleToggleCell(r.id, perm.id)}
                                                            className="cursor-pointer px-3 py-2.5 text-center transition hover:bg-[#F1F5F9]/50"
                                                            title={`Click to toggle ${perm.name} on ${r.name}`}
                                                        >
                                                            {hasPerm ? (
                                                                <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                                                            ) : (
                                                                <span className="inline-block h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700" />
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
                )}

                {/* TAB 3: ASSIGNMENT AUTHORITY MATRIX */}
                {activeTab === 'authority' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-[#E5E4F0] bg-white p-6 shadow-2xs dark:border-border dark:bg-card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E4F0] pb-5 dark:border-border">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-[#0B3A67] dark:text-[#93C5FD] dark:bg-violet-950/60 dark:text-[#93C5FD]">
                                            Scoped Governance Policy
                                        </span>
                                        <span className="text-xs text-slate-400">Institutional Appointment Rules</span>
                                    </div>
                                    <h2 className="text-lg font-black text-[#17152E] dark:text-foreground mt-1">
                                        Role Assignment Authority Matrix
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-muted-foreground max-w-3xl">
                                        Role assignment authority must itself be scoped. Deans cannot assign arbitrary roles globally, and VPAFs cannot assign Institution Super Admins.
                                        This matrix defines who holds delegated jurisdiction to create, designate, or recommend specific roles.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link href="/institution/scoped-roles">
                                        <Button className="bg-[#0B3A67] hover:bg-[#082847] text-white text-xs font-bold shadow-2xs">
                                            Open Scoped Role Assignments
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-x-auto mt-6">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#E5E4F0] bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider dark:border-border dark:bg-muted/40 dark:text-slate-300">
                                            <th className="py-3.5 px-4">Role Assigning Authority</th>
                                            <th className="py-3.5 px-4">Permitted Assignable Roles</th>
                                            <th className="py-3.5 px-4">Allowed Target Scopes</th>
                                            <th className="py-3.5 px-4">Operational Governance Rules</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E4F0] dark:divide-border">
                                        {[
                                            {
                                                authority: 'Institution Super Admin',
                                                tag: 'Supreme Platform Authority',
                                                tagColor: 'bg-purple-100 text-purple-800',
                                                roles: 'Any role across the entire institution catalog (System & Custom)',
                                                scopes: 'Institution, Entity, College, Program, Facility',
                                                rules: 'Unrestricted role creation and assignment. Only entity authorized to designate VPAF, Entity Admins, and platform administrators.',
                                            },
                                            {
                                                authority: 'VPAF / Executive Oversight',
                                                tag: 'Executive Delegation',
                                                tagColor: 'bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD]',
                                                roles: 'Dean, Program Head, Research Coordinator, Extension Coordinator, College Admin, Entity Admin',
                                                scopes: 'Institution, Campus Entity, College',
                                                rules: 'Authorizes academic and administrative leadership designations across DSSC entities per Board of Trustees appointment orders.',
                                            },
                                            {
                                                authority: 'Entity Admin',
                                                tag: 'Branch / Campus Scope',
                                                tagColor: 'bg-emerald-100 text-emerald-800',
                                                roles: 'Campus Director, Extension Coordinator, Facility In-Charge, Delegated Campus Roles',
                                                scopes: 'Own Assigned Campus Entity (e.g. Sulop, Kapatagan)',
                                                rules: 'May assign operational and academic roles within their assigned campus branch. Cannot assign roles across other campuses or platform-wide.',
                                            },
                                            {
                                                authority: 'College Admin',
                                                tag: 'College Operations',
                                                tagColor: 'bg-blue-100 text-blue-800',
                                                roles: 'Head Lab In-Charge, Lab In-Charge, College TV Manager, Department Staff, Faculty Member',
                                                scopes: 'Own College, Programs, & Physical Facilities',
                                                rules: 'Manages college-level operational staffing, lab in-charges, and room custody within their college.',
                                            },
                                            {
                                                authority: 'Dean',
                                                tag: 'Academic Governance',
                                                tagColor: 'bg-amber-100 text-amber-800',
                                                roles: 'Program Head, Research Coordinator, Extension Coordinator, Faculty Member, Academic Committees',
                                                scopes: 'Own College & Academic Programs',
                                                rules: 'Directly designates academic chairs and coordinators within their college. Cannot appoint Deans or admins of other colleges.',
                                            },
                                            {
                                                authority: 'Program Head',
                                                tag: 'Department Coordination',
                                                tagColor: 'bg-sky-100 text-sky-800',
                                                roles: 'Task Lead, Curriculum Reviewer, Proctors, Class Ad-Hoc Responsibilities',
                                                scopes: 'Own Degree Program (e.g. BSIS, BSIT)',
                                                rules: 'Coordinates program teaching loads and class assignment verifications. No permanent role assignment authority.',
                                            },
                                            {
                                                authority: 'Head Lab In-Charge',
                                                tag: 'Facility Custody',
                                                tagColor: 'bg-slate-100 text-slate-800',
                                                roles: 'Lab Reliever, Duty Monitor, Shift Custodian',
                                                scopes: 'Assigned Laboratories & Rooms',
                                                rules: 'Assigns daily room monitoring coverage and equipment maintenance custody within authorized facilities.',
                                            },
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-violet-50/40 dark:hover:bg-muted/30 transition-colors">
                                                <td className="py-4 px-4 font-bold text-[#17152E] dark:text-foreground">
                                                    <div className="font-extrabold text-sm">{row.authority}</div>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${row.tagColor}`}>
                                                        {row.tag}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {row.roles}
                                                </td>
                                                <td className="py-4 px-4 text-xs font-mono font-medium text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                    {row.scopes}
                                                </td>
                                                <td className="py-4 px-4 text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">
                                                    {row.rules}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: ROLE CARDS (Visual Tiers Overview) */}
                {activeTab === 'cards' && (
                    <div className="space-y-6">
                        {['Institution', 'Entity', 'College', 'Program', 'Academic', 'Operational'].map((tierName) => {
                            const tierRoles = roles.filter((r) => r.tier === tierName);
                            if (tierRoles.length === 0) return null;

                            return (
                                <div key={tierName} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-[#17152E] uppercase tracking-wider dark:text-foreground">
                                            {tierName} Tier Roles ({tierRoles.length})
                                        </h3>
                                        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                            {tierName} Scope Authority
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {tierRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex flex-col justify-between rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-border dark:bg-card"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                                {getRoleIcon(role.name, role.tier)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-extrabold text-[#17152E] dark:text-foreground">
                                                                    {role.name}
                                                                </h4>
                                                                <span
                                                                    className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${getRiskBadge(
                                                                        role.risk_level
                                                                    )}`}
                                                                >
                                                                    {role.risk_level} Risk
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                role.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {role.status}
                                                        </span>
                                                    </div>

                                                    <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-muted-foreground">
                                                        {role.description || 'Configured role bundle for platform authority.'}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {role.permissions.slice(0, 3).map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="rounded bg-[#F7F7FB] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600 dark:bg-muted dark:text-slate-300"
                                                            >
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                        {role.permissions.length > 3 && (
                                                            <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[9px] font-bold text-[#0B3A67] dark:text-[#93C5FD]">
                                                                +{role.permissions.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between border-t border-[#E5E4F0] pt-3 text-xs dark:border-border">
                                                    <span className="text-slate-400">
                                                        Assigned: <strong className="text-[#17152E] dark:text-foreground">{role.users_count} users</strong>
                                                    </span>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedRoleId(role.id);
                                                                setActiveTab('roles');
                                                            }}
                                                            className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:bg-[#DDD6FE]"
                                                        >
                                                            Inspect
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(role)}
                                                            className="rounded-lg border border-[#E5E4F0] px-2 py-1 text-xs font-bold hover:bg-[#F7F7FB]"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TAB 4: ALL ROLES TABLE (Searchable with ⋯ Action Menu) */}
                {activeTab === 'table' && (
                    <div className="rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xs dark:border-border dark:bg-card">
                        <div className="flex flex-col justify-between gap-3 border-b border-[#E5E4F0] pb-4 sm:flex-row sm:items-center dark:border-border">
                            <div>
                                <h2 className="text-base font-black text-[#17152E] dark:text-foreground">
                                    All System & Reusable Roles Directory
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                                    Full catalog with hierarchy tier, risk level, assigned users count, permission totals,
                                    and action controls.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={handleOpenCreate}
                                className="rounded-xl bg-[#0B3A67] text-xs font-bold text-white hover:bg-[#082847]"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Create Role
                            </Button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E4F0] dark:border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#F7F7FB] text-[10px] font-bold text-slate-400 uppercase dark:bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3">Role Name</th>
                                        <th className="px-3 py-3">Hierarchy Tier</th>
                                        <th className="px-3 py-3">Type</th>
                                        <th className="px-3 py-3 text-center">Assigned Users</th>
                                        <th className="px-3 py-3 text-center">Permissions</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3">Last Modified</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E4F0] dark:divide-border/60">
                                    {roles.map((role) => (
                                        <tr key={role.id} className="hover:bg-[#F7F7FB] dark:hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <div className="font-extrabold text-[#17152E] dark:text-foreground">
                                                    {role.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {role.description?.slice(0, 50)}...
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getTierBadge(
                                                        role.tier
                                                    )}`}
                                                >
                                                    {role.tier}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                    {role.is_system_role ? 'System' : 'Custom'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-[#17152E] dark:text-foreground">
                                                {role.users_count}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#BFDBFE]">
                                                    {role.permissions.length}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        role.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {role.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                                                {role.updated_at_formatted}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenMenuRoleId((prev) =>
                                                                prev === role.id ? null : role.id
                                                            )
                                                        }
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E4F0] bg-white text-slate-600 hover:bg-[#F7F7FB]"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>

                                                    {openMenuRoleId === role.id && (
                                                        <div className="absolute right-0 z-30 mt-1 w-48 rounded-2xl border border-[#E5E4F0] bg-white p-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuRoleId(null);
                                                                    handleOpenEdit(role);
                                                                }}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-bold text-[#17152E] hover:bg-[#F1F5F9] hover:text-[#0B3A67] dark:text-[#93C5FD] dark:text-slate-200"
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                                Edit Role
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuRoleId(null);
                                                                    handleOpenDuplicate(role);
                                                                }}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] hover:bg-[#F7F7FB] dark:text-slate-200"
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                                Duplicate
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuRoleId(null);
                                                                    setSelectedRoleId(role.id);
                                                                    setActiveTab('roles');
                                                                    setRoleDetailTab('users');
                                                                }}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] hover:bg-[#F7F7FB] dark:text-slate-200"
                                                            >
                                                                <Users className="h-3.5 w-3.5" />
                                                                View Assigned Users ({role.users_count})
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={role.name === 'Institution Super Admin'}
                                                                onClick={() => {
                                                                    setOpenMenuRoleId(null);
                                                                    handleToggleRoleStatus(role);
                                                                }}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-[#17152E] hover:bg-[#F7F7FB] dark:text-slate-200"
                                                            >
                                                                <PowerIcon className="h-3.5 w-3.5" />
                                                                {role.status === 'Active' ? 'Deactivate Role' : 'Activate Role'}
                                                            </button>

                                                            {role.can_delete && (
                                                                <>
                                                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenMenuRoleId(null);
                                                                            setRoleToDelete(role);
                                                                            setDeleteModalOpen(true);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Delete Role
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ROLE EDITOR (FULL-HEIGHT SLIDE-OVER DRAWER) */}
                {editorOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
                        <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-[#E5E4F0] bg-white shadow-2xl dark:border-border dark:bg-card">
                            {/* Editor Header */}
                            <div className="flex items-center justify-between border-b border-[#E5E4F0] bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#68152E] p-5 text-white">
                                <div>
                                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-[#BFDBFE] uppercase">
                                        {editorMode === 'create' ? 'Create New Role' : 'Focused Role Editor'}
                                    </span>
                                    <h2 className="mt-1 text-lg font-black">
                                        {editorMode === 'create' ? 'Create Reusable Custom Role' : `Edit '${editorData.name}'`}
                                    </h2>
                                    <p className="text-xs text-[#E9D5FF]/80">
                                        Configure role metadata, action permissions, scope restrictions, and review impact summary.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditorOpen(false)}
                                    className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Editor Steps / Tabs Navigation */}
                            <div className="flex border-b border-[#E5E4F0] bg-[#F7F7FB] px-6 py-2.5 text-xs font-bold dark:border-border dark:bg-muted/40">
                                {[
                                    { id: 'basic', label: '1. Basic Information' },
                                    { id: 'permissions', label: `2. Module Permissions (${editorData.permission_ids.length})` },
                                    { id: 'scopes', label: '3. Scope Restrictions' },
                                    { id: 'review', label: '4. Review Changes & Impact' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setEditorTab(tab.id as any)}
                                        className={`mr-4 border-b-2 py-1 transition ${
                                            editorTab === tab.id
                                                ? 'border-[#0B3A67] text-[#0B3A67] dark:text-[#93C5FD] dark:border-[#A78BFA] dark:text-[#93C5FD]'
                                                : 'border-transparent text-slate-500 hover:text-[#17152E]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Editor Body */}
                            <form onSubmit={handleSaveRole} className="flex flex-1 flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                    {/* Section 1: Basic Information */}
                                    {editorTab === 'basic' && (
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                                    Role Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editorData.name}
                                                    onChange={(e) => setEditorData('name', e.target.value)}
                                                    placeholder="e.g. Accreditation QA Lead"
                                                    className="w-full rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold text-[#17152E] dark:border-border dark:bg-background dark:text-foreground"
                                                />
                                                {editorErrors.name && (
                                                    <p className="text-[11px] text-rose-500">{editorErrors.name}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                                        Hierarchy Tier *
                                                    </label>
                                                    <select
                                                        value={editorData.tier}
                                                        onChange={(e) => setEditorData('tier', e.target.value)}
                                                        className="w-full rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold dark:border-border dark:bg-background"
                                                    >
                                                        <option value="Institution">Institution Tier</option>
                                                        <option value="Entity">Entity / Campus Tier</option>
                                                        <option value="College">College Tier</option>
                                                        <option value="Program">Program Tier</option>
                                                        <option value="Operational">Operational Tier</option>
                                                        <option value="Academic">Academic Tier</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                                        Risk Level *
                                                    </label>
                                                    <select
                                                        value={editorData.risk_level}
                                                        onChange={(e) => setEditorData('risk_level', e.target.value)}
                                                        className="w-full rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs font-bold dark:border-border dark:bg-background"
                                                    >
                                                        <option value="Critical">Critical Risk</option>
                                                        <option value="High">High Risk</option>
                                                        <option value="Elevated">Elevated Risk</option>
                                                        <option value="Standard">Standard Risk</option>
                                                        <option value="Restricted">Restricted (Display / Kiosk)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                                    Role Purpose & Governance Description
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={editorData.description}
                                                    onChange={(e) => setEditorData('description', e.target.value)}
                                                    placeholder="State the purpose of this role, who holds it, and its organizational expectations..."
                                                    className="w-full rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs text-[#17152E] dark:border-border dark:bg-background dark:text-foreground"
                                                />
                                            </div>

                                            <div className="rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] p-4 text-xs space-y-2 dark:border-border dark:bg-muted/20">
                                                <label className="flex items-center gap-2 font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={editorData.requires_mfa}
                                                        onChange={(e) => setEditorData('requires_mfa', e.target.checked)}
                                                        className="rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                                    />
                                                    Mandatory Multi-Factor Authentication (MFA)
                                                </label>
                                                <label className="flex items-center gap-2 font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={editorData.requires_approval}
                                                        onChange={(e) => setEditorData('requires_approval', e.target.checked)}
                                                        className="rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                                    />
                                                    Require Institutional Approval for Role Assignment
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 2: Module Permissions */}
                                    {editorTab === 'permissions' && (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="relative w-64">
                                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={editorPermSearch}
                                                        onChange={(e) => setEditorPermSearch(e.target.value)}
                                                        placeholder="Search permissions..."
                                                        className="w-full rounded-xl border border-[#E5E4F0] bg-[#F7F7FB] py-1.5 pr-3 pl-8 text-xs focus:bg-white focus:outline-none dark:border-border dark:bg-background"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditorData('permission_ids', permissions.map((p) => p.id))}
                                                        className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD]"
                                                    >
                                                        Select All ({permissions.length})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditorData('permission_ids', [])}
                                                        className="rounded-lg border border-[#E5E4F0] px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-[#F7F7FB]"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Module Accordions inside Editor */}
                                            <div className="space-y-3">
                                                {uniqueModules.map((moduleName) => {
                                                    const modPerms = permissionsByModule[moduleName] || [];
                                                    const selectedInMod = modPerms.filter((p) =>
                                                        editorData.permission_ids.includes(p.id)
                                                    ).length;

                                                    return (
                                                        <div
                                                            key={moduleName}
                                                            className="rounded-xl border border-[#E5E4F0] p-3 text-xs dark:border-border"
                                                        >
                                                            <div className="flex items-center justify-between pb-2 border-b border-[#E5E4F0] dark:border-border">
                                                                <span className="font-extrabold text-[#17152E] dark:text-foreground">
                                                                    {moduleName} ({selectedInMod}/{modPerms.length})
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const idsToAdd = modPerms.map((p) => p.id);
                                                                        const allAlready = idsToAdd.every((id) =>
                                                                            editorData.permission_ids.includes(id)
                                                                        );
                                                                        if (allAlready) {
                                                                            setEditorData(
                                                                                'permission_ids',
                                                                                editorData.permission_ids.filter(
                                                                                    (id) => !idsToAdd.includes(id)
                                                                                )
                                                                            );
                                                                        } else {
                                                                            setEditorData(
                                                                                'permission_ids',
                                                                                Array.from(
                                                                                    new Set([...editorData.permission_ids, ...idsToAdd])
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline"
                                                                >
                                                                    {selectedInMod === modPerms.length ? 'Deselect Module' : 'Select Module'}
                                                                </button>
                                                            </div>

                                                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {modPerms.map((perm) => {
                                                                    const checked = editorData.permission_ids.includes(perm.id);
                                                                    return (
                                                                        <label
                                                                            key={perm.id}
                                                                            className="flex items-start gap-2 rounded-lg p-1.5 hover:bg-[#F7F7FB] dark:hover:bg-muted/20 cursor-pointer"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        setEditorData('permission_ids', [
                                                                                            ...editorData.permission_ids,
                                                                                            perm.id,
                                                                                        ]);
                                                                                    } else {
                                                                                        setEditorData(
                                                                                            'permission_ids',
                                                                                            editorData.permission_ids.filter(
                                                                                                (id) => id !== perm.id
                                                                                            )
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="mt-0.5 rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                                                            />
                                                                            <div>
                                                                                <div className="font-bold text-[#17152E] dark:text-foreground">
                                                                                    {perm.name}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-400">
                                                                                    {perm.capability} — {perm.description}
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 3: Scope Restrictions */}
                                    {editorTab === 'scopes' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-xs font-extrabold text-[#17152E] dark:text-foreground">
                                                    Permitted Scope Bindings
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Select which organizational levels this role can be attached to during
                                                    Scoped Role Assignments.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {['Institution', 'Entity', 'College', 'Program', 'Operational'].map((scope) => {
                                                    const checked = editorData.allowed_scopes.includes(scope);
                                                    return (
                                                        <label
                                                            key={scope}
                                                            className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                                                                checked
                                                                    ? 'border-[#0B3A67] bg-[#F1F5F9] dark:bg-slate-800'
                                                                    : 'border-[#E5E4F0] bg-white dark:border-border dark:bg-card'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setEditorData('allowed_scopes', [
                                                                            ...editorData.allowed_scopes,
                                                                            scope,
                                                                        ]);
                                                                    } else {
                                                                        setEditorData(
                                                                            'allowed_scopes',
                                                                            editorData.allowed_scopes.filter((s) => s !== scope)
                                                                        );
                                                                    }
                                                                }}
                                                                className="rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                                            />
                                                            <div>
                                                                <div className="text-xs font-bold">{scope} Level</div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    Attachable to {scope} units
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 4: Review Changes & Impact */}
                                    {editorTab === 'review' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                                                <div className="flex items-center gap-2 font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                    <Info className="h-4 w-4" />
                                                    Pre-Save Impact Summary
                                                </div>
                                                <p className="mt-1 text-slate-600 dark:text-slate-300">
                                                    You are configuring role <strong>{editorData.name}</strong> with{' '}
                                                    <strong>{editorData.permission_ids.length} permissions</strong> across{' '}
                                                    <strong>{editorData.allowed_scopes.length} scope levels</strong>.
                                                </p>
                                                {editingRole && (
                                                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                                                        This will affect <strong>{editingRole.users_count} user(s)</strong>{' '}
                                                        currently assigned to this role.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-[#17152E] dark:text-foreground">
                                                    Reason for Audit Trail *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editorData.reason}
                                                    onChange={(e) => setEditorData('reason', e.target.value)}
                                                    placeholder="e.g. Updated curriculum review capabilities for Program Heads"
                                                    className="w-full rounded-xl border border-[#E5E4F0] bg-white px-3 py-2 text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sticky Editor Footer */}
                                <div className="flex items-center justify-between border-t border-[#E5E4F0] bg-[#F7F7FB] px-6 py-4 dark:border-border dark:bg-muted/30">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditorOpen(false)}
                                        className="rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        {editorTab !== 'review' ? (
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (editorTab === 'basic') setEditorTab('permissions');
                                                    else if (editorTab === 'permissions') setEditorTab('scopes');
                                                    else if (editorTab === 'scopes') setEditorTab('review');
                                                }}
                                                className="rounded-xl bg-[#0B3A67] text-xs font-bold text-white hover:bg-[#082847]"
                                            >
                                                Continue to Next Step →
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={editorProcessing}
                                                className="rounded-xl bg-[#0B3A67] text-xs font-bold text-white hover:bg-[#082847]"
                                            >
                                                {editorProcessing
                                                    ? 'Saving Role...'
                                                    : editorMode === 'create'
                                                    ? 'Save & Create Role'
                                                    : 'Save Role Changes'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DUPLICATE ROLE MODAL */}
                {duplicateModalOpen && roleToDuplicate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-2xl border border-[#E5E4F0] bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                            <h3 className="text-base font-extrabold text-[#17152E] dark:text-foreground">
                                Duplicate Role Definition
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Clone all {roleToDuplicate.permissions.length} permissions and scope defaults from '
                                {roleToDuplicate.name}'.
                            </p>

                            <form onSubmit={handleConfirmDuplicate} className="mt-4 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold">New Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={duplicateName}
                                        onChange={(e) => setDuplicateName(e.target.value)}
                                        className="w-full rounded-xl border border-[#E5E4F0] px-3 py-2 text-xs font-bold"
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDuplicateModalOpen(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#0B3A67] text-xs font-bold text-white hover:bg-[#082847]"
                                    >
                                        Confirm Duplicate
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE ROLE MODAL */}
                {deleteModalOpen && roleToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl dark:border-rose-900 dark:bg-card">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="h-5 w-5" />
                                <h3 className="text-base font-extrabold">Permanent Role Deletion</h3>
                            </div>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                Are you sure you want to permanently delete custom role <strong>{roleToDelete.name}</strong>?
                                This role has 0 assigned users and 0 dependencies.
                            </p>

                            <div className="mt-5 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
                                >
                                    Delete Permanently
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function PowerIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2v10" />
            <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
        </svg>
    );
}
