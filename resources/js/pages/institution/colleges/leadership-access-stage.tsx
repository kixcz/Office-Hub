import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Users,
    Shield,
    UserCheck,
    UserPlus,
    AlertCircle,
    Check,
    Search,
    Edit2,
    Trash2,
    Calendar,
    Clock,
    FileText,
    HelpCircle,
    Info,
    Sparkles,
    Sliders,
    Building2,
    Mail,
    Plus,
    User,
    CheckCircle2,
    Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

export interface LeadershipAssignment {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_avatar?: string | null;
    user_title?: string | null;
    role_id: number;
    role_name: string;
    scope_level: string;
    designation_type: string;
    appointment_reference?: string | null;
    effective_from?: string | null;
    effective_until?: string | null;
    status: string;
}

export interface CollegeRole {
    id: number;
    name: string;
    description?: string | null;
}

export interface AvailableUser {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

interface Props {
    college: {
        id: number;
        name: string;
        code: string;
        dean_name?: string | null;
        inheritance_settings?: Record<string, any> | null;
    };
    leadershipAssignments: LeadershipAssignment[];
    collegeAssignableRoles: CollegeRole[];
    availableUsers: AvailableUser[];
}

export default function LeadershipAccessStage({
    college,
    leadershipAssignments = [],
    collegeAssignableRoles = [],
    availableUsers = [],
}: Props) {
    // Search query for users in modal
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);

    // Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<LeadershipAssignment | null>(null);

    // Form state for assignment
    const [selectedRoleId, setSelectedRoleId] = useState<number>(() => {
        const deanRole = collegeAssignableRoles.find((r) => r.name === 'Dean');
        return deanRole ? deanRole.id : collegeAssignableRoles[0]?.id || 0;
    });
    const [designationType, setDesignationType] = useState('Primary');
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [effectiveUntil, setEffectiveUntil] = useState('');
    const [appointmentRef, setAppointmentRef] = useState('');
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Invite new user form state
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRoleId, setInviteRoleId] = useState<number>(() => {
        const secRole = collegeAssignableRoles.find((r) => r.name === 'College Secretary') || collegeAssignableRoles[0];
        return secRole ? secRole.id : 0;
    });
    const [isInviting, setIsInviting] = useState(false);

    // Group leadership assignments
    const deanAssignment = useMemo(() => {
        return leadershipAssignments.find((a) => a.role_name === 'Dean');
    }, [leadershipAssignments]);

    const adminAssignments = useMemo(() => {
        return leadershipAssignments.filter(
            (a) => a.role_name === 'College Admin' || a.role_name === 'College Secretary'
        );
    }, [leadershipAssignments]);

    const additionalAssignments = useMemo(() => {
        return leadershipAssignments.filter(
            (a) => a.role_name !== 'Dean' && a.role_name !== 'College Admin' && a.role_name !== 'College Secretary'
        );
    }, [leadershipAssignments]);

    // Metrics Ribbon
    const metrics = useMemo(() => {
        const total = leadershipAssignments.length;
        const leadership = deanAssignment ? 1 : 0;
        const admin = adminAssignments.length;
        const vacancies = (deanAssignment ? 0 : 1) + (adminAssignments.length === 0 ? 1 : 0);

        return {
            total,
            leadership,
            admin,
            vacancies,
        };
    }, [leadershipAssignments, deanAssignment, adminAssignments]);

    // Filter available users for search in modal
    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) {
            return availableUsers.slice(0, 8);
        }
        return availableUsers
            .filter(
                (u) =>
                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
            )
            .slice(0, 10);
    }, [availableUsers, userSearchQuery]);

    // Open Assign Modal with preselected role
    const handleOpenAssignModal = (preselectedRoleName?: string) => {
        if (preselectedRoleName) {
            const r = collegeAssignableRoles.find((role) => role.name === preselectedRoleName);
            if (r) {
                setSelectedRoleId(r.id);
            }
        }
        setSelectedUser(null);
        setUserSearchQuery('');
        setDesignationType('Primary');
        setEffectiveFrom(new Date().toISOString().split('T')[0]);
        setEffectiveUntil('');
        setAppointmentRef('');
        setAssignmentNotes('');
        setIsAssignModalOpen(true);
    };

    // Submit Assignment
    const handleSaveAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Please select an existing Velora user to assign.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/institution/colleges/${college.id}/leadership/assign`,
            {
                user_id: selectedUser.id,
                role_id: selectedRoleId,
                designation_type: designationType,
                effective_from: effectiveFrom,
                effective_until: effectiveUntil || null,
                appointment_reference: appointmentRef || null,
                notes: assignmentNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAssignModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (err) => {
                    alert('Failed to assign role: ' + Object.values(err)[0]);
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Remove Assignment
    const handleConfirmDelete = () => {
        if (!assignmentToDelete) return;
        setIsSubmitting(true);

        router.delete(`/institution/colleges/${college.id}/leadership/${assignmentToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setAssignmentToDelete(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Submit Invite
    const handleInviteUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteName.trim() || !inviteEmail.trim()) {
            alert('Name and Email are required.');
            return;
        }

        setIsInviting(true);
        router.post(
            `/institution/colleges/${college.id}/leadership/invite`,
            {
                name: inviteName.trim(),
                email: inviteEmail.trim(),
                role_id: inviteRoleId,
                designation_type: 'Primary',
                effective_from: effectiveFrom,
                appointment_reference: appointmentRef || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsInviteModalOpen(false);
                    setInviteName('');
                    setInviteEmail('');
                    setIsInviting(false);
                },
                onError: (err) => {
                    alert('Error creating/inviting user: ' + Object.values(err)[0]);
                    setIsInviting(false);
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Stage Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs">
                <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] shrink-0 shadow-xs">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                Stage 4: Leadership & Access
                            </h2>
                            <span className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-[#8B1E3F]/30">
                                Scoped Role Assignments
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Assign college-level leadership and administrative roles for {college.code}. Multiple roles are attached to a single canonical identity with multi-portal switching.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="text-xs font-bold rounded-xl border-border hover:bg-muted/80 flex items-center gap-1.5"
                    >
                        <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Invite New User</span>
                    </Button>

                    <Button
                        type="button"
                        onClick={() => handleOpenAssignModal()}
                        className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        + Assign Role
                    </Button>
                </div>
            </div>

            {/* Metrics Ribbon (Mockup visual fidelity) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Active Assignments */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.total}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Active Assignments
                        </div>
                    </div>
                </div>

                {/* Leadership Roles */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.leadership}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Leadership Role (Dean)
                        </div>
                    </div>
                </div>

                {/* Administrative Roles */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.admin}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Administrative Roles
                        </div>
                    </div>
                </div>

                {/* Vacancies */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            metrics.vacancies > 0
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div
                            className={`text-xl font-extrabold leading-tight ${
                                metrics.vacancies > 0 ? 'text-amber-600' : 'text-foreground'
                            }`}
                        >
                            {metrics.vacancies}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Key Vacancies
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: College Leadership (Dean) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD]">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                College Leadership (Dean)
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Chief academic executive responsible for college strategic direction, faculty appointments, and curriculum approvals.
                            </p>
                        </div>
                    </div>
                </div>

                {deanAssignment ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60 gap-3">
                        <div className="flex items-center gap-3.5">
                            {deanAssignment.user_avatar ? (
                                <img
                                    src={deanAssignment.user_avatar}
                                    alt={deanAssignment.user_name}
                                    className="w-12 h-12 rounded-xl object-cover border border-border shadow-2xs"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white font-extrabold flex items-center justify-center text-sm shadow-2xs">
                                    {deanAssignment.user_name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                        {deanAssignment.user_name}
                                    </h4>
                                    <span className="text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded-full border border-[#8B1E3F]/30">
                                        Dean · {college.code}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {deanAssignment.user_email}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px]">
                                        <Calendar className="w-3 h-3" />
                                        Effective: {deanAssignment.effective_from || 'Aug 1, 2026'} – Present
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignModal('Dean')}
                                className="text-xs font-bold rounded-xl border-border"
                            >
                                <Edit2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                                Change Assignment
                            </Button>
                            <button
                                type="button"
                                onClick={() => setAssignmentToDelete(deanAssignment)}
                                title="Revoke Dean Assignment"
                                className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                No Dean Assigned for {college.code}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                                Assign an existing faculty member or academic leader to serve as Dean.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => handleOpenAssignModal('Dean')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                        >
                            + Assign Dean
                        </Button>
                    </div>
                )}
            </div>

            {/* Section 2: College Administration (College Admin & College Secretary) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                            <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                College Administration
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Primary administrators and College Secretary (admin role credentials: admin@cids.edu) managing timetables, facilities, and records.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Primary College Admin Card */}
                    {(() => {
                        const primAdmin = adminAssignments.find((a) => a.role_name === 'College Admin');
                        return (
                            <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200">
                                            Primary Administrator
                                        </span>
                                        {primAdmin && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-extrabold text-sm text-[#17152E] dark:text-white mt-2">
                                        {primAdmin ? primAdmin.user_name : 'No Primary Admin Assigned'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {primAdmin ? primAdmin.user_email : 'Requires College Admin assignment'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground">
                                        {primAdmin ? `Assigned: ${primAdmin.effective_from || 'Aug 1, 2026'}` : 'Vacant'}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenAssignModal('College Admin')}
                                        className="text-[11px] font-bold rounded-lg h-7"
                                    >
                                        {primAdmin ? 'Change' : '+ Assign'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* College Secretary Card */}
                    {(() => {
                        const secAdmin = adminAssignments.find((a) => a.role_name === 'College Secretary');
                        return (
                            <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-200">
                                            College Secretary
                                        </span>
                                        {secAdmin && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-extrabold text-sm text-[#17152E] dark:text-white mt-2">
                                        {secAdmin ? secAdmin.user_name : 'No College Secretary Assigned'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {secAdmin ? secAdmin.user_email : 'Configurable delegated administrative role'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground">
                                        {secAdmin ? `Assigned: ${secAdmin.effective_from || 'Aug 1, 2026'}` : 'Vacant'}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenAssignModal('College Secretary')}
                                        className="text-[11px] font-bold rounded-lg h-7"
                                    >
                                        {secAdmin ? 'Change' : '+ Assign'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Section 3: Additional Delegated College Roles */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                Additional Delegated Roles
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Research Coordinators, Extension Officers, TV Studio Managers, and other delegated officers.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignModal()}
                        className="text-xs font-bold rounded-xl border-border cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        + Assign Delegated Role
                    </Button>
                </div>

                {additionalAssignments.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs italic">
                        No additional delegated roles assigned yet. Click "+ Assign Delegated Role" to add coordinators or studio managers.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {additionalAssignments.map((a) => (
                            <div
                                key={a.id}
                                className="p-3.5 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60 flex items-center justify-between text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-extrabold text-foreground">{a.user_name}</div>
                                    <div className="text-[11px] text-muted-foreground">{a.user_email}</div>
                                    <div className="pt-1 flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            {a.role_name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {a.effective_from || 'Active'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAssignmentToDelete(a)}
                                    title="Revoke Assignment"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 4: Assignment Architecture Safeguards & Settings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-muted text-[#0B3A67] dark:text-[#93C5FD]">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                        Velora Assignment Safeguards & Principles
                    </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-foreground">Reuses Existing Canonical Accounts:</strong> When Dr. Eleanor Vance is assigned as Dean, Velora adds Dean @ CIDS without deleting her existing Faculty @ CIDS profile.
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-foreground">Multi-Portal Switching:</strong> Multi-role users see the Portal Switcher in the main header and can seamlessly move between Dean, Faculty, and Admin contexts.
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-foreground">Scope Constrained to {college.code}:</strong> All designations in this stage automatically bind `scope_level = College` and `college_id = {college.id}`.
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-foreground">Auditable Appointment History:</strong> Scoped role assignments record effective dates, appointment references, and issuing authority in `InstitutionAuditLog`.
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAL: ASSIGN COLLEGE ROLE ================= */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Assign College Role
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Bind an existing Velora user identity to a leadership or administrative position for {college.code}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
                        {/* User Search & Selection */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-foreground">
                                Select Existing Velora User <span className="text-rose-500">*</span>
                            </label>

                            {selectedUser ? (
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                                            {selectedUser.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-emerald-900 dark:text-emerald-200">
                                                {selectedUser.name}
                                            </div>
                                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                                {selectedUser.email}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                    >
                                        Change User
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search user by name or email..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-[#0B3A67]"
                                        />
                                    </div>

                                    <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border/60">
                                        {filteredUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                onClick={() => setSelectedUser(u)}
                                                className="p-2.5 hover:bg-muted/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                            >
                                                <div>
                                                    <div className="font-bold text-foreground">{u.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                                                </div>
                                                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs font-bold">
                                                    Select
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Role Dropdown */}
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">
                                College Role <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}
                                className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold text-xs"
                            >
                                {collegeAssignableRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Scope (Locked to this college) */}
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Organizational Scope</label>
                            <input
                                type="text"
                                readOnly
                                value={`${college.name} (${college.code}) — Locked`}
                                className="w-full h-9 rounded-xl border border-border bg-muted px-3 text-xs font-medium text-muted-foreground"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Effective From</label>
                                <input
                                    type="date"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Effective Until (Optional)</label>
                                <input
                                    type="date"
                                    value={effectiveUntil}
                                    onChange={(e) => setEffectiveUntil(e.target.value)}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium"
                                />
                            </div>
                        </div>

                        {/* Appointment Reference */}
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Appointment Reference / Special Order</label>
                            <input
                                type="text"
                                placeholder="e.g. Board Resolution No. 42 s. 2026 or Special Order 108"
                                value={appointmentRef}
                                onChange={(e) => setAppointmentRef(e.target.value)}
                                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAssignModalOpen(false)}
                                className="text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !selectedUser}
                                className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                                {isSubmitting ? 'Assigning...' : 'Assign Role'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: INVITE NEW USER ================= */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Invite & Register New Leader
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            If the user does not exist in Velora yet, create their account credentials and assign them to {college.code}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInviteUser} className="space-y-4 text-xs">
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Full Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Dr. Eleanor Vance"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Official Institutional Email *</label>
                            <input
                                type="email"
                                placeholder="e.g. dean@cids.edu"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Designated Role *</label>
                            <select
                                value={inviteRoleId}
                                onChange={(e) => setInviteRoleId(parseInt(e.target.value))}
                                className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold text-xs"
                            >
                                {collegeAssignableRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isInviting}
                                className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                                {isInviting ? 'Inviting...' : 'Create & Assign'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: DELETE / REVOKE CONFIRMATION ================= */}
            <Dialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-rose-600" />
                            Revoke Role Assignment
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to revoke{' '}
                            <strong className="text-foreground">
                                {assignmentToDelete?.user_name}
                            </strong>{' '}
                            from the{' '}
                            <strong className="text-foreground">
                                {assignmentToDelete?.role_name}
                            </strong>{' '}
                            role in {college.code}? This will not delete their Velora user account or other scoped roles.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAssignmentToDelete(null)}
                            className="text-xs font-bold rounded-xl cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            {isSubmitting ? 'Revoking...' : 'Revoke Assignment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

