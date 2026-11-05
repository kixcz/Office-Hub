import { Button } from '@/components/ui/button';
import { type PortalAssignment, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Check,
    Crown,
    ExternalLink,
    GraduationCap,
    Layers,
    LucideIcon,
    Shield,
    Sparkles,
    Star,
    UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    availablePortals: PortalAssignment[];
    defaultPortalId?: number | null;
}

const getPortalIcon = (portalType: string): LucideIcon => {
    switch (portalType) {
        case 'institution_super_admin':
            return Crown;
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

export default function ChooseWorkspace({ availablePortals = [], defaultPortalId }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [selectedId, setSelectedId] = useState<number>(
        defaultPortalId || availablePortals[0]?.id || 0
    );
    const [makeDefault, setMakeDefault] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSelectPortal = (portal: PortalAssignment) => {
        setIsSubmitting(true);

        if (makeDefault) {
            router.post(
                '/context/default',
                { scoped_role_assignment_id: portal.id },
                {
                    preserveState: true,
                    onSuccess: () => {
                        router.post('/context/switch', { scoped_role_assignment_id: portal.id });
                    },
                    onError: () => setIsSubmitting(false),
                }
            );
        } else {
            router.post(
                '/context/switch',
                { scoped_role_assignment_id: portal.id },
                {
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F7FB] flex flex-col items-center justify-center p-4 sm:p-6 text-[#17152E]">
            <Head title="Choose Workspace — Velora Governance" />

            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-100 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 text-[#5B21B6] shadow-2xs mb-1">
                        <Sparkles className="w-6 h-6 text-[#7C3AED]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17152E]">
                        Choose Workspace Context
                    </h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Signed in as <strong className="text-slate-800">{auth?.user?.name}</strong> ({auth?.user?.email}).
                        Your canonical identity holds multiple authorized role assignments.
                    </p>
                </div>

                {/* Portals list */}
                <div className="space-y-3 pt-2">
                    {availablePortals.map((portal) => {
                        const Icon = getPortalIcon(portal.portal_type);
                        const isSelected = portal.id === selectedId;

                        return (
                            <div
                                key={portal.id}
                                onClick={() => setSelectedId(portal.id)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                    isSelected
                                        ? 'border-[#5B21B6] bg-violet-50/60 shadow-sm'
                                        : 'border-slate-100 bg-[#F7F7FB] hover:border-violet-200'
                                }`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <div
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                            isSelected
                                                ? 'bg-[#5B21B6] text-white shadow-2xs'
                                                : 'bg-white text-slate-600 border border-slate-200'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base text-[#17152E]">
                                                {portal.display_label}
                                            </span>
                                            {portal.is_default && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                    <Star className="w-2.5 h-2.5 fill-amber-500" /> Default
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-600">
                                            Scope: <strong>{portal.scope_name}</strong>
                                        </p>

                                        {portal.appointment_reference && (
                                            <p className="text-[11px] text-slate-400">
                                                Appointment Ref: {portal.appointment_reference}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectPortal(portal);
                                    }}
                                    disabled={isSubmitting}
                                    className={`shrink-0 font-bold text-xs ${
                                        isSelected
                                            ? 'bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-sm'
                                            : 'bg-white hover:bg-violet-50 text-[#5B21B6] border border-indigo-200'
                                    }`}
                                >
                                    Enter Workspace
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Make default toggle & note */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={makeDefault}
                            onChange={(e) => setMakeDefault(e.target.checked)}
                            className="rounded border-slate-300 text-[#5B21B6] focus:ring-[#7C3AED]"
                        />
                        <span>Remember my selected portal as default upon sign in</span>
                    </label>

                    <span className="text-[11px] text-slate-400">
                        You can switch portals anytime via the header switcher.
                    </span>
                </div>
            </div>
        </div>
    );
}

