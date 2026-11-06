import React from 'react';
import { type PortalAssignment, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface AccessRestrictedModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    currentWorkspaceName?: string;
    requiredWorkspaceName?: string;
    requiredPortalType?: string;
    customMessage?: string;
    targetAssignmentId?: number;
}

export function AccessRestrictedModal({
    isOpen = true,
    onClose,
    currentWorkspaceName,
    requiredWorkspaceName,
    requiredPortalType,
    customMessage,
    targetAssignmentId,
}: AccessRestrictedModalProps) {
    const { portal_context, active_branding } = usePage<SharedData>().props;
    const active = portal_context?.active_assignment;
    const available = portal_context?.available_assignments || [];

    const currentName = currentWorkspaceName || active?.display_label || 'Current Workspace';

    // Find the matching target assignment if available in user's scoped roles
    const matchedAssignment = targetAssignmentId
        ? available.find((a) => a.id === targetAssignmentId)
        : requiredPortalType
        ? available.find((a) => a.portal_type === requiredPortalType)
        : requiredWorkspaceName
        ? available.find(
              (a) =>
                  a.role_name?.toLowerCase().includes(requiredWorkspaceName.toLowerCase()) ||
                  a.portal_type?.toLowerCase().includes(requiredWorkspaceName.toLowerCase())
          )
        : null;

    const targetName =
        requiredWorkspaceName ||
        matchedAssignment?.display_label ||
        (requiredPortalType ? requiredPortalType.replace('_', ' ').toUpperCase() : 'Faculty');

    const handleSwitch = () => {
        if (matchedAssignment) {
            router.post(
                '/context/switch',
                { scoped_role_assignment_id: matchedAssignment.id },
                {
                    preserveScroll: false,
                }
            );
        } else {
            router.visit('/context/choose-workspace');
        }
    };

    const handleGoBack = () => {
        if (onClose) {
            onClose();
        } else if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(active?.landing_url || '/dashboard');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            {/* Themed Glow Backdrop */}
            <div
                className="absolute w-[450px] h-[350px] rounded-full blur-[100px] opacity-35 pointer-events-none"
                style={{
                    backgroundColor: 'var(--brand-primary, #6366f1)',
                }}
            />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#161329]/95 text-white shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all"
                style={{
                    boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Shield Icon with Dynamic Tinted Background */}
                <div className="flex justify-center mb-5">
                    <div
                        className="relative flex items-center justify-center w-16 h-16 rounded-2xl border border-white/20 shadow-lg"
                        style={{
                            backgroundColor: 'var(--brand-primary, #6366f1)',
                            boxShadow: '0 10px 25px -5px var(--brand-primary, #6366f1)',
                        }}
                    >
                        <ShieldAlert className="w-8 h-8 text-white drop-shadow" />
                    </div>
                </div>

                {/* Title & Badge */}
                <div className="text-center space-y-1.5 mb-5">
                    <div className="inline-flex items-center gap-2">
                        <h2 className="text-2xl font-black tracking-tight text-white">Access Restricted</h2>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                            403
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                        {customMessage || (
                            <>
                                You are currently in the <span className="font-bold text-white">*{currentName}*</span> workspace, but this page belongs to the <span className="font-bold text-white">*{targetName}*</span> workspace.
                            </>
                        )}
                    </p>
                </div>

                {/* Workspace Comparison Strips */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                        <span className="text-slate-400 font-medium">Current Workspace:</span>
                        <span className="font-bold text-white/90">{currentName}</span>
                    </div>

                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl border text-xs"
                        style={{
                            borderColor: 'var(--brand-primary, #6366f1)66',
                            backgroundColor: 'var(--brand-primary, #6366f1)1a',
                        }}
                    >
                        <span className="text-slate-300 font-medium">Required Workspace:</span>
                        <span
                            className="font-bold"
                            style={{
                                color: 'var(--brand-primary, #e2e8f0)',
                            }}
                        >
                            {targetName}
                        </span>
                    </div>
                </div>

                {/* Switcher Helper Subtext */}
                <p className="text-[11px] text-center text-slate-400 mb-6 leading-relaxed">
                    To access your designated features, please switch to the required workspace using the button below or the header switcher.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSwitch}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                        style={{
                            backgroundColor: 'var(--brand-primary, #6366f1)',
                            boxShadow: '0 8px 20px -4px var(--brand-primary, #6366f1)',
                        }}
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Switch to {targetName} Workspace</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Bottom Assistance Link */}
                <div className="mt-5 text-center">
                    <button
                        type="button"
                        onClick={() => router.visit('/context/choose-workspace')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <span>ⓘ Learn about workspace access</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

