import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Key,
    Plus,
    School,
    Shield,
    ShieldCheck,
    UserCircle,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Assignment {
    id: number;
    institution: string;
    status: string;
    effective_from: string | null;
    effective_until: string | null;
    notes: string | null;
    user: { id: number; name: string; email: string };
    role: { id: number; name: string };
    college?: { id: number; code: string; name: string } | null;
    program?: { id: number; code: string; name: string } | null;
}

interface Props {
    assignments: Assignment[];
    users: Array<{ id: number; name: string; email: string }>;
    roles: Array<{ id: number; name: string }>;
    colleges: Array<{ id: number; code: string; name: string }>;
    programs: Array<{ id: number; code: string; name: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Users & Access', href: '/institution/scoped-roles' },
    { title: 'Scoped Role Assignments', href: '/institution/scoped-roles' },
];

export default function ScopedRolesIndex({
    assignments,
    users,
    roles,
    colleges,
    programs,
}: Props) {
    const [isGrantOpen, setIsGrantOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        role_id: '',
        college_id: '',
        program_id: '',
        effective_from: '',
        effective_until: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/scoped-roles', {
            onSuccess: () => {
                setIsGrantOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scoped Role Assignments · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Scoped Role Assignments</h1>
                        <p className="text-sm text-muted-foreground">
                            Multi-college authority delegation: assign a user a role scoped explicitly to an Institution, College, Program, or Facility with validity periods.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsGrantOpen(true)}
                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shadow-xs"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Grant Scoped Role
                    </Button>
                </div>

                {/* Explanation Banner */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs space-y-1">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Multi-College Scoping Architecture
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                        A single user identity can hold multiple roles across distinct boundaries (e.g. Faculty in CIDS while simultaneously serving as College Admin or Program Head for BSIS) without requiring duplicate login accounts.
                    </p>
                </div>

                {/* Assignments Table */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-5 py-3.5">User Identity</th>
                                    <th className="px-5 py-3.5">Assigned Role</th>
                                    <th className="px-5 py-3.5">Scope Boundary</th>
                                    <th className="px-5 py-3.5">Validity Dates</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                                            No scoped role assignments recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.map((asgn) => (
                                        <tr key={asgn.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                                                        {asgn.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-foreground block">{asgn.user.name}</span>
                                                        <span className="text-[11px] text-muted-foreground font-mono block">
                                                            {asgn.user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 rounded-md bg-muted font-bold text-foreground inline-flex items-center gap-1.5">
                                                    <Key className="w-3 h-3 text-amber-500" />
                                                    {asgn.role.name}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                {asgn.college ? (
                                                    <div className="space-y-0.5">
                                                        <span className="font-extrabold text-foreground">
                                                            {asgn.college.code}
                                                        </span>
                                                        {asgn.program && (
                                                            <span className="text-[11px] text-muted-foreground block">
                                                                Prog: {asgn.program.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Institution-Wide</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                                                {asgn.effective_from ? `${asgn.effective_from} to ${asgn.effective_until || 'Indefinite'}` : 'Indefinite'}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    {asgn.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 text-muted-foreground text-[11px] max-w-xs truncate">
                                                {asgn.notes || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grant Scoped Role Dialog */}
                {isGrantOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Grant Scoped Role Assignment</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Bind user authority to an institutional unit or college program.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsGrantOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold">User Identity *</label>
                                    <select
                                        required
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="">Select User...</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.user_id && <p className="text-[11px] text-rose-500">{errors.user_id}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Role *</label>
                                    <select
                                        required
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="">Select Role...</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role_id && <p className="text-[11px] text-rose-500">{errors.role_id}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">College Scope</label>
                                        <select
                                            value={data.college_id}
                                            onChange={(e) => setData('college_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="">Institution-Wide (No College restriction)</option>
                                            {colleges.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.code} — {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Program Scope (Optional)</label>
                                        <select
                                            value={data.program_id}
                                            onChange={(e) => setData('program_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="">All College Programs</option>
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Effective From</label>
                                        <input
                                            type="date"
                                            value={data.effective_from}
                                            onChange={(e) => setData('effective_from', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Effective Until</label>
                                        <input
                                            type="date"
                                            value={data.effective_until}
                                            onChange={(e) => setData('effective_until', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Assignment Notes / Appointment Ref</label>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="e.g. Special Order No. 2026-081"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsGrantOpen(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
                                    >
                                        {processing ? 'Granting...' : 'Grant Scoped Role'}
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
