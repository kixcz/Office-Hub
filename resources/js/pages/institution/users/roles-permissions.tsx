import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    CheckCircle2,
    Key,
    Plus,
    Shield,
    ShieldAlert,
    ShieldCheck,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionItem {
    id: number;
    name: string;
    module: string;
    capability: string;
    description?: string;
}

interface RoleItem {
    id: number;
    name: string;
    tier?: string;
    risk_level?: string;
    is_system_role?: boolean;
    description?: string;
    users_count?: number;
    scoped_assignments_count?: number;
    permissions: PermissionItem[];
}

interface Props {
    roles: RoleItem[];
    permissions: PermissionItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Role Management & Permission Matrix', href: '/institution/roles' },
];

export default function RolesPermissionsMatrix({ roles = [], permissions = [] }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [moduleFilter, setModuleFilter] = useState('All');

    const { data, setData, post, processing, reset } = useForm({
        name: '',
        tier: 'College',
        risk_level: 'Standard',
        description: '',
        permission_ids: [] as number[],
    });

    const modules = ['All', ...Array.from(new Set(permissions.map((p) => p.module)))];
    const filteredPermissions = permissions.filter((p) => moduleFilter === 'All' || p.module === moduleFilter);

    const handleToggleCell = (roleId: number, permissionId: number) => {
        router.post(
            `/institution/roles/${roleId}/permissions/toggle`,
            { permission_id: permissionId },
            { preserveScroll: true }
        );
    };

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/roles', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const getRiskBadge = (risk?: string) => {
        switch (risk) {
            case 'Critical':
                return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
            case 'High':
                return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
            case 'Elevated':
                return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
            case 'Restricted':
                return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
            default:
                return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management & Permission Matrix · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Granular Action-Based RBAC + Scope Architecture
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Role Management & Permission Matrix
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Roles group granular permissions (`View`, `Create`, `Edit`, `Review`, `Approve`, `Verify`, `Publish`, `Export`, `Configure`, `Assign`, `Reopen`, `Audit`) and do not imply universal access until bound to an explicit Scope in Scoped Role Assignments.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create Reusable Role
                    </Button>
                </div>

                {/* Role Catalog Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3"
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                                        {role.tier || 'College'} Tier
                                    </span>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRiskBadge(
                                            role.risk_level
                                        )}`}
                                    >
                                        {role.risk_level || 'Standard'} Risk
                                    </span>
                                </div>
                                <h3 className="font-extrabold text-xs text-foreground">{role.name}</h3>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {role.description || 'Reusable permission bundle for scoped authority.'}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>Permissions: <strong className="text-foreground">{role.permissions.length}</strong></span>
                                <span>Scoped Bindings: <strong className="text-amber-500">{role.scoped_assignments_count ?? 0}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Permission Matrix */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-extrabold">
                                Interactive Role × Capability Permission Matrix
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Rows represent Velora modules and action capabilities; columns represent roles. Click any cell to grant or revoke a permission and log the change.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {modules.map((mod) => (
                                <button
                                    key={mod}
                                    type="button"
                                    onClick={() => setModuleFilter(mod)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                        moduleFilter === mod
                                            ? 'bg-amber-500 text-slate-950'
                                            : 'bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {mod}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/60 border-b border-border text-[10px] uppercase font-extrabold text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-muted/95 z-10 min-w-[250px]">
                                        Module / Action Permission
                                    </th>
                                    <th className="px-3 py-3 text-center">Capability</th>
                                    {roles.map((r) => (
                                        <th key={r.id} className="px-3 py-3 text-center min-w-[95px]">
                                            <span className="block leading-tight text-foreground">{r.name}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredPermissions.map((perm) => (
                                    <tr key={perm.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-2.5 sticky left-0 bg-card z-10 border-r border-border/50">
                                            <span className="font-mono font-bold text-xs text-foreground block">
                                                {perm.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground block">
                                                {perm.module} — {perm.description}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[10px] border border-amber-500/20">
                                                {perm.capability}
                                            </span>
                                        </td>
                                        {roles.map((r) => {
                                            const hasPerm = r.permissions.some((rp) => rp.id === perm.id);
                                            return (
                                                <td
                                                    key={r.id}
                                                    onClick={() => handleToggleCell(r.id, perm.id)}
                                                    className="px-3 py-2.5 text-center cursor-pointer hover:bg-amber-500/10 transition-colors"
                                                    title={`${r.name} · ${perm.name}`}
                                                >
                                                    {hasPerm ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                                                    ) : (
                                                        <span className="w-4 h-4 inline-block rounded-full border border-border/70 bg-muted/30" />
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

                {/* Create Custom Role Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold">Create Reusable Role</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Define a custom role with tier and security risk classification.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Role Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Accreditation Quality Assurance Lead"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Organizational Tier *</label>
                                        <select
                                            value={data.tier}
                                            onChange={(e) => setData('tier', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Institution">Institution</option>
                                            <option value="Entity">Entity / Campus</option>
                                            <option value="College">College</option>
                                            <option value="Program">Program / Department</option>
                                            <option value="Operational">Operational / Facility</option>
                                            <option value="Academic">Academic</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Risk Classification *</label>
                                        <select
                                            value={data.risk_level}
                                            onChange={(e) => setData('risk_level', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Critical">Critical (Platform Governance)</option>
                                            <option value="High">High (Unit Administration)</option>
                                            <option value="Elevated">Elevated (Approvals & Verification)</option>
                                            <option value="Standard">Standard (Operational)</option>
                                            <option value="Restricted">Restricted (Read-Only / Display)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Role Purpose & Governance Description</label>
                                    <textarea
                                        rows={2}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what permissions this role bundles and what scopes it applies to..."
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
                                    >
                                        Create Role
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

