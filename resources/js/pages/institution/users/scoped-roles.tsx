import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Inbox,
    Key,
    Plus,
    ShieldCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Assignment {
    id: number;
    institution: string;
    scope_level?: string;
    designation_type?: string;
    status: string;
    effective_from: string | null;
    effective_until: string | null;
    appointment_reference?: string | null;
    assignment_reason?: string | null;
    notes: string | null;
    assigned_by?: { id: number; name: string; email: string } | null;
    user: { id: number; name: string; email: string; institutional_id?: string };
    role: { id: number; name: string; portal_type?: string };
    entity?: { id: number; code: string; name: string } | null;
    college?: { id: number; code: string; name: string } | null;
    program?: { id: number; code: string; name: string } | null;
    facility?: { id: number; room_name: string } | null;
    replacing_user?: { id: number; name: string } | null;
}

interface AccessRequestItem {
    id: number;
    scope_level: string;
    designation_type: string;
    effective_from?: string | null;
    effective_until?: string | null;
    justification: string;
    status: string;
    decision_remarks?: string | null;
    requester?: { id: number; name: string; email: string };
    target_user?: { id: number; name: string; email: string };
    requested_role?: { id: number; name: string };
    entity?: { id: number; code: string; name: string } | null;
    college?: { id: number; code: string; name: string } | null;
    program?: { id: number; code: string; name: string } | null;
    reviewer?: { id: number; name: string } | null;
}

interface Props {
    assignments: Assignment[];
    accessRequests?: AccessRequestItem[];
    users: Array<{ id: number; name: string; email: string; institutional_id?: string }>;
    roles: Array<{ id: number; name: string }>;
    entities?: Array<{ id: number; code: string; name: string }>;
    colleges: Array<{ id: number; code: string; name: string }>;
    programs: Array<{ id: number; code: string; name: string }>;
    facilities?: Array<{ id: number; room_name: string }>;
    initialTab?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Scoped Role Assignments & Delegation', href: '/institution/scoped-roles' },
];

export default function ScopedRolesIndex({
    assignments = [],
    accessRequests = [],
    users = [],
    roles = [],
    entities = [],
    colleges = [],
    programs = [],
    facilities = [],
    initialTab = 'assignments',
}: Props) {
    const [activeTab, setActiveTab] = useState<'assignments' | 'leadership' | 'requests'>(
        initialTab === 'requests' ? 'requests' : initialTab === 'leadership' ? 'leadership' : 'assignments'
    );
    const [isGrantOpen, setIsGrantOpen] = useState(false);
    const [isRequestOpen, setIsRequestOpen] = useState(false);

    React.useEffect(() => {
        if (initialTab === 'requests' || initialTab === 'leadership' || initialTab === 'assignments') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const leadershipRoleNames = [
        'Institution Super Admin',
        'VPAF / Executive Oversight',
        'Entity Admin',
        'College Admin',
        'Dean',
        'Program Head',
        'Head Lab / Facility In-Charge',
        'Institution TV / Communications Manager',
    ];

    const displayedAssignments =
        activeTab === 'leadership'
            ? assignments.filter((a) => leadershipRoleNames.includes(a.role?.name || ''))
            : assignments;

    const { data, setData, post, processing, reset } = useForm({
        user_id: '',
        role_id: '',
        scope_level: 'College',
        entity_id: '',
        college_id: '',
        program_id: '',
        facility_id: '',
        designation_type: 'Primary',
        replacing_user_id: '',
        effective_from: '2026-08-01',
        effective_until: '',
        appointment_reference: '',
        assignment_reason: '',
        notes: '',
    });

    const reqForm = useForm({
        target_user_id: '',
        requested_role_id: '',
        scope_level: 'College',
        entity_id: '',
        college_id: '',
        program_id: '',
        designation_type: 'Acting',
        effective_from: '2026-11-05',
        effective_until: '2026-12-31',
        justification: '',
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

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        reqForm.post('/institution/access-requests', {
            onSuccess: () => {
                setIsRequestOpen(false);
                reqForm.reset();
            },
        });
    };

    const handleAssignmentStatus = (id: number, status: string) => {
        router.patch(
            `/institution/scoped-roles/${id}/status`,
            { status, reason: `Status updated to ${status} by Institution Super Admin` },
            { preserveScroll: true }
        );
    };

    const handleReviewRequest = (id: number, decision: 'Approved' | 'Denied') => {
        router.post(
            `/institution/access-requests/${id}/review`,
            {
                decision,
                decision_remarks:
                    decision === 'Approved'
                        ? 'Approved by Institution Super Admin & converted into active Scoped Role Assignment.'
                        : 'Denied per separation-of-duties / scope boundary review.',
            },
            { preserveScroll: true }
        );
    };

    const pendingCount = accessRequests.filter((r) => r.status === 'Pending').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scoped Role Assignments & Access Requests · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] border border-[#0B3A67]/20">
                                Identity + Role + Scope + Effective Period
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Scoped Role Assignments & Delegation
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Bind <code className="font-mono text-[#0B3A67] dark:text-[#93C5FD]">User + Role + Scope (Institution / Entity / College / Program / Facility) + Effective Period</code>. Supports Primary, Secondary, Acting, Replacement during leave, and Scheduled future assignments with automatic expiration.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('assignments')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'assignments'
                                        ? 'bg-[#0B3A67] text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Scoped Role Assignments ({assignments.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('leadership')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'leadership'
                                        ? 'bg-[#0B3A67] text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Administrator Assignments
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('requests')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'requests'
                                        ? 'bg-[#0B3A67] text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Access Requests
                                {pendingCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setIsRequestOpen(true)}
                            className="text-xs font-bold rounded-xl"
                        >
                            <Inbox className="w-4 h-4 mr-1.5" />
                            Log Delegation Request
                        </Button>
                        <Button
                            onClick={() => setIsGrantOpen(true)}
                            className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs rounded-xl shadow-xs"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Bind Scoped Role
                        </Button>
                    </div>
                </div>

                {activeTab === 'assignments' || activeTab === 'leadership' ? (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                        {activeTab === 'leadership' && (
                            <div className="border-b border-border/60 bg-[#0B3A67]/5 px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
                                <span>
                                    <strong className="text-foreground">Leadership & Administrator Positions View:</strong> Showing Entity Admins, College Admins, Deans, Program Heads, Head Lab In-Charge, and TV Managers, including Acting appointments and expiration dates.
                                </span>
                                <span className="font-mono font-bold text-[#0B3A67] dark:text-[#93C5FD]">
                                    {displayedAssignments.length} Active Leadership Posts
                                </span>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 py-3.5">Canonical User</th>
                                        <th className="px-4 py-3.5">Role & Designation</th>
                                        <th className="px-4 py-3.5">Scope Boundary</th>
                                        <th className="px-4 py-3.5">Effective Period</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Appointment & Authority</th>
                                        <th className="px-4 py-3.5 text-right">Lifecycle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {displayedAssignments.map((asgn) => (
                                        <tr key={asgn.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <span className="font-bold text-foreground block">
                                                    {asgn.user?.name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-mono block">
                                                    {asgn.user?.email}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-muted font-bold text-foreground inline-flex items-center gap-1">
                                                        <Key className="w-3 h-3 text-[#0B3A67] dark:text-[#93C5FD]" />
                                                        {asgn.role?.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] font-bold text-[10px] border border-[#0B3A67]/20">
                                                        {asgn.designation_type || 'Primary'}
                                                    </span>
                                                </div>
                                                {asgn.replacing_user && (
                                                    <span className="text-[10px] text-blue-500 block mt-0.5">
                                                        Covering for: {asgn.replacing_user.name}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        {asgn.scope_level || 'College'}
                                                    </span>
                                                    {asgn.entity && (
                                                        <span className="font-bold text-[#0B3A67] dark:text-[#93C5FD] block">
                                                            Entity: {asgn.entity.code}
                                                        </span>
                                                    )}
                                                    {asgn.college && (
                                                        <span className="font-extrabold text-foreground block">
                                                            College: {asgn.college.code}
                                                        </span>
                                                    )}
                                                    {asgn.program && (
                                                        <span className="text-[11px] text-blue-500 font-bold block">
                                                            Program: {asgn.program.code}
                                                        </span>
                                                    )}
                                                    {asgn.facility && (
                                                        <span className="text-[11px] text-emerald-500 font-bold block">
                                                            Facility: {asgn.facility.room_name}
                                                        </span>
                                                    )}
                                                    {!asgn.entity && !asgn.college && !asgn.program && !asgn.facility && (
                                                        <span className="text-muted-foreground italic block">
                                                            Institution-Wide (DSSC)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                                                {asgn.effective_from
                                                    ? `${String(asgn.effective_from).slice(0, 10)} → ${
                                                          asgn.effective_until
                                                              ? String(asgn.effective_until).slice(0, 10)
                                                              : 'Indefinite'
                                                      }`
                                                    : 'Indefinite'}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        asgn.status === 'Active'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : asgn.status === 'Scheduled'
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}
                                                >
                                                    {asgn.status}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-[11px] max-w-xs space-y-1">
                                                {asgn.appointment_reference && (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] border border-[#0B3A67]/20">
                                                        {asgn.appointment_reference}
                                                    </span>
                                                )}
                                                {asgn.assignment_reason && (
                                                    <div className="font-semibold text-foreground text-[11px] leading-tight">
                                                        {asgn.assignment_reason}
                                                    </div>
                                                )}
                                                {asgn.notes && asgn.notes !== asgn.appointment_reference && (
                                                    <div className="text-muted-foreground text-[10px] truncate">
                                                        {asgn.notes}
                                                    </div>
                                                )}
                                                {asgn.assigned_by && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Assigned by: <span className="font-medium text-foreground">{asgn.assigned_by.name}</span>
                                                    </div>
                                                )}
                                                {!asgn.appointment_reference && !asgn.assignment_reason && !asgn.notes && (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                {asgn.status === 'Active' ? (
                                                    <div className="inline-flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignmentStatus(asgn.id, 'Expired')}
                                                            className="px-2 py-1 rounded border border-border hover:bg-muted text-[10px] font-semibold"
                                                        >
                                                            Expire
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignmentStatus(asgn.id, 'Revoked')}
                                                            className="px-2 py-1 rounded border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[10px] font-bold"
                                                        >
                                                            Revoke
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAssignmentStatus(asgn.id, 'Active')}
                                                        className="px-2 py-1 rounded border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-[10px] font-bold"
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Access Requests & Delegation Queue */
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 py-3.5">Target User & Requester</th>
                                        <th className="px-4 py-3.5">Requested Role & Designation</th>
                                        <th className="px-4 py-3.5">Requested Scope & Term</th>
                                        <th className="px-4 py-3.5">Justification</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5 text-right">Super Admin Decision</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {accessRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <span className="font-bold text-foreground block">
                                                    {req.target_user?.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    Requested by: {req.requester?.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-bold text-[#0B3A67] dark:text-[#93C5FD] block">
                                                    {req.requested_role?.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {req.designation_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-bold block">
                                                    {req.college?.code || req.entity?.code || req.scope_level}
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {req.effective_from ? String(req.effective_from).slice(0, 10) : 'Now'} →{' '}
                                                    {req.effective_until ? String(req.effective_until).slice(0, 10) : 'Indefinite'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 max-w-xs text-[11px] text-muted-foreground">
                                                {req.justification}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        req.status === 'Approved'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : req.status === 'Pending'
                                                            ? 'bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] border-[#0B3A67]/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                {req.status === 'Pending' ? (
                                                    <div className="inline-flex gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReviewRequest(req.id, 'Approved')}
                                                            className="h-7 px-2.5 text-[10px] font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                                                        >
                                                            Approve & Bind
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReviewRequest(req.id, 'Denied')}
                                                            className="h-7 px-2.5 text-[10px] font-bold text-rose-500 border-rose-500/30"
                                                        >
                                                            Deny
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        Audited ({req.reviewer?.name || 'Super Admin'})
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Bind Scoped Role Dialog */}
                {isGrantOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                        <div className="w-full max-w-xl rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div>
                                    <h3 className="text-base font-extrabold">
                                        Bind Scoped Role Assignment (User + Role + Scope + Period)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Assign Primary, Secondary, Acting, Replacement, or Scheduled future authority.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsGrantOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Canonical User *</label>
                                        <select
                                            required
                                            value={data.user_id}
                                            onChange={(e) => setData('user_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Select User...</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Reusable Role *</label>
                                        <select
                                            required
                                            value={data.role_id}
                                            onChange={(e) => setData('role_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                        >
                                            <option value="">Select Role...</option>
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Scope Boundary Level *</label>
                                        <select
                                            value={data.scope_level}
                                            onChange={(e) => setData('scope_level', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Institution">Institution-Wide</option>
                                            <option value="Entity">Entity / Campus</option>
                                            <option value="College">College</option>
                                            <option value="Program">Program / Department</option>
                                            <option value="Facility">Facility / Laboratory</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Designation Type *</label>
                                        <select
                                            value={data.designation_type}
                                            onChange={(e) => setData('designation_type', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Primary">Primary Administrator / Lead</option>
                                            <option value="Secondary">Secondary / Co-Administrator</option>
                                            <option value="Acting">Acting / Officer-in-Charge (OIC)</option>
                                            <option value="Replacement">Leave Replacement Coverage</option>
                                            <option value="Scheduled">Scheduled Future Appointment</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Entity / Campus Scope</label>
                                        <select
                                            value={data.entity_id}
                                            onChange={(e) => setData('entity_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">All Entities / Not Entity-Scoped</option>
                                            {entities.map((ent) => (
                                                <option key={ent.id} value={ent.id}>
                                                    {ent.code} — {ent.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">College Scope</label>
                                        <select
                                            value={data.college_id}
                                            onChange={(e) => setData('college_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">All Colleges / Not College-Scoped</option>
                                            {colleges.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.code} — {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Program Scope (Optional)</label>
                                        <select
                                            value={data.program_id}
                                            onChange={(e) => setData('program_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">All Programs</option>
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.code} — {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Replacing User (If Leave Coverage)</label>
                                        <select
                                            value={data.replacing_user_id}
                                            onChange={(e) => setData('replacing_user_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">None</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
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
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Effective Until (Auto-Expires)</label>
                                        <input
                                            type="date"
                                            value={data.effective_until}
                                            onChange={(e) => setData('effective_until', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Appointment Reference / BOR / SO</label>
                                        <input
                                            type="text"
                                            value={data.appointment_reference}
                                            onChange={(e) => setData('appointment_reference', e.target.value)}
                                            placeholder="e.g. BOR Res. No. 2026-44 · SO No. 081"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Assignment Reason / Purpose</label>
                                        <input
                                            type="text"
                                            value={data.assignment_reason}
                                            onChange={(e) => setData('assignment_reason', e.target.value)}
                                            placeholder="e.g. Designated as VPAF / Program Chair"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Administrative Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Additional delegation remarks or audit trail metadata"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => setIsGrantOpen(false)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs"
                                    >
                                        Bind Scoped Role
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Log Delegation / Access Request Modal */}
                {isRequestOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold">Submit Access / Delegation Request</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Request temporary acting or elevated scope authority for Super Admin approval.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRequestOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRequestSubmit} className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Target User *</label>
                                        <select
                                            required
                                            value={reqForm.data.target_user_id}
                                            onChange={(e) => reqForm.setData('target_user_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Select User...</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Requested Role *</label>
                                        <select
                                            required
                                            value={reqForm.data.requested_role_id}
                                            onChange={(e) => reqForm.setData('requested_role_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                        >
                                            <option value="">Select Role...</option>
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Target College</label>
                                        <select
                                            value={reqForm.data.college_id}
                                            onChange={(e) => reqForm.setData('college_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Select College...</option>
                                            {colleges.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.code} — {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Elevation Type</label>
                                        <select
                                            value={reqForm.data.designation_type}
                                            onChange={(e) => reqForm.setData('designation_type', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Acting">Acting / OIC</option>
                                            <option value="Secondary">Secondary Admin</option>
                                            <option value="Emergency Elevation">Emergency Elevation</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Justification *</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={reqForm.data.justification}
                                        onChange={(e) => reqForm.setData('justification', e.target.value)}
                                        placeholder="State operational need and duration for this access elevation..."
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={reqForm.processing}
                                        className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs"
                                    >
                                        Submit Request
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
