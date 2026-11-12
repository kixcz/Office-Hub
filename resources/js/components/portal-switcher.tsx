import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type PortalAssignment, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Check,
    ChevronDown,
    Crown,
    ExternalLink,
    GraduationCap,
    Layers,
    LucideIcon,
    Radio,
    Shield,
    Sparkles,
    Star,
    UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';

const getPortalIcon = (portalType: string): LucideIcon => {
    switch (portalType) {
        case 'institution_super_admin':
            return Crown;
        case 'vpaa':
            return GraduationCap;
        case 'vpaf':
            return Sparkles;
        case 'dean':
            return Building2;
        case 'college_admin':
            return Layers;
        case 'program_head':
            return GraduationCap;
        case 'faculty':
            return UserCheck;
        case 'entity_admin':
            return Shield;
        case 'lab_in_charge':
            return Briefcase;
        default:
            return Layers;
    }
};

export function PortalSwitcher() {
    const { auth, portal_context } = usePage<SharedData>().props;
    const [isSwitching, setIsSwitching] = useState(false);

    if (!auth?.user || !portal_context?.active_assignment) {
        return null;
    }

    const active = portal_context.active_assignment;
    const assignments = portal_context.available_assignments || [active];

    // Only display the switcher if the user has more than one role/workspace context
    if (assignments.length <= 1) {
        return null;
    }

    const ActiveIcon = getPortalIcon(active.portal_type);

    const handleSwitch = (assignment: PortalAssignment) => {
        if (assignment.id === active.id || isSwitching) return;
        setIsSwitching(true);

        router.post(
            '/context/switch',
            { scoped_role_assignment_id: assignment.id },
            {
                preserveScroll: false,
                onFinish: () => setIsSwitching(false),
            }
        );
    };

    const handleSetDefault = (e: React.MouseEvent, assignmentId: number) => {
        e.stopPropagation();
        router.post(
            '/context/default',
            { scoped_role_assignment_id: assignmentId },
            { preserveScroll: true }
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={isSwitching}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white hover:bg-gradient-to-r hover:from-[#F8FAFC] hover:to-[#EFF6FF] text-[#1E293B] dark:bg-card dark:text-foreground transition-all shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#175C94]/20 data-[state=open]:bg-gradient-to-r data-[state=open]:from-[#EFF6FF] data-[state=open]:to-[#E0F2FE] data-[state=open]:border-[#175C94] data-[state=open]:shadow-sm"
                    title="Switch Active Portal & Workspace Context"
                >
                    <div className="w-5 h-5 rounded-lg bg-[#EFF6FF] text-[#0B3A67] dark:bg-slate-800 dark:text-[#93C5FD] flex items-center justify-center shrink-0 border border-[#175C94]/20">
                        <ActiveIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold tracking-tight text-[#0F172A] dark:text-white truncate max-w-[130px] sm:max-w-[160px]">
                                {active.short_label}
                            </span>
                            {active.is_default && (
                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" title="Default Workspace" />
                            )}
                        </div>
                        <span className="text-[9px] font-semibold text-[#64748B] dark:text-slate-400 truncate max-w-[130px] sm:max-w-[160px] mt-0.5">
                            Scope: {active.scope_code || active.scope_level}
                        </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#175C94] transition-colors ml-0.5 shrink-0" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-xl border border-border bg-card">
                <DropdownMenuLabel className="p-2 space-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-primary">
                            Portal Switcher
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {assignments.length} {assignments.length === 1 ? 'Workspace' : 'Workspaces'}
                        </span>
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                        {auth.user.name} • One Identity, Scoped Roles
                    </p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-1 border-border" />

                <div className="space-y-1 max-h-72 overflow-y-auto py-1">
                    {assignments.map((assignment) => {
                        const Icon = getPortalIcon(assignment.portal_type);
                        const isActive = assignment.id === active.id;

                        return (
                            <DropdownMenuItem
                                key={assignment.id}
                                onClick={() => handleSwitch(assignment)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[#E0F2FE] to-[#EEF2FF] text-[#0B3A67] border-l-2 border-l-[#175C94] font-semibold dark:from-[#0B3A67]/30 dark:to-[#175C94]/20 dark:text-[#93C5FD]'
                                        : 'hover:bg-gradient-to-r hover:from-[#F1F5F9] hover:to-[#EFF6FF] hover:text-[#0B3A67] text-[#1E293B] dark:text-slate-200'
                                }`}
                            >
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                        isActive
                                            ? 'bg-[#0B3A67] text-white shadow-2xs'
                                            : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold truncate group-hover:text-[#0B3A67] dark:group-hover:text-[#93C5FD]">
                                            {assignment.display_label}
                                        </span>
                                        {isActive && (
                                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD] shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <span className="truncate">
                                            {assignment.scope_name}
                                        </span>
                                        {assignment.appointment_reference && (
                                            <>
                                                <span>•</span>
                                                <span className="font-mono truncate">{assignment.appointment_reference}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </div>

                <DropdownMenuSeparator className="my-1 border-border" />

                <div className="p-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <Link
                        href={auth.user?.roles?.includes('Institution Super Admin') ? '/institution/scoped-roles' : '/faculty/profile'}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                        <span>Manage My Access</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>

                    {active && !active.is_default && (
                        <button
                            type="button"
                            onClick={(e) => handleSetDefault(e, active.id)}
                            className="text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
                            title="Make this my default workspace upon login"
                        >
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>Set as Default</span>
                        </button>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

