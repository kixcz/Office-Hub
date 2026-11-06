import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, ArrowRightLeft, Home } from 'lucide-react';
import { SharedData } from '@/types';

interface ErrorProps {
    status: number;
    message?: string;
    requiredWorkspace?: string;
    currentWorkspace?: string;
    targetAssignmentId?: number;
}

export default function ErrorPage({
    status = 404,
    message,
    requiredWorkspace,
    currentWorkspace,
    targetAssignmentId,
}: ErrorProps) {
    const { portal_context, active_branding } = usePage<SharedData>().props;
    const active = portal_context?.active_assignment;
    const available = portal_context?.available_assignments || [];

    const isAccessRestricted = status === 403;
    const currentName = currentWorkspace || active?.display_label || 'Current Workspace';

    const matchedAssignment = targetAssignmentId
        ? available.find((a) => a.id === targetAssignmentId)
        : requiredWorkspace
        ? available.find(
              (a) =>
                  a.role_name?.toLowerCase().includes(requiredWorkspace.toLowerCase()) ||
                  a.portal_type?.toLowerCase().includes(requiredWorkspace.toLowerCase())
          )
        : null;

    const targetName =
        requiredWorkspace ||
        matchedAssignment?.display_label ||
        'Designated Workspace';

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
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(active?.landing_url || '/dashboard');
        }
    };

    const brandingStyles = active_branding?.css_variables
        ? (active_branding.css_variables as unknown as React.CSSProperties)
        : undefined;

    return (
        <div
            style={brandingStyles}
            className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0F0D1D] text-white relative overflow-hidden font-['Poppins']"
        >
            <Head title={isAccessRestricted ? 'Access Restricted - Velora' : `${status} Error - Velora`} />

            {/* Ambient Dynamic College Themed Glow */}
            <div
                className="absolute w-[500px] h-[400px] rounded-full blur-[130px] opacity-30 pointer-events-none"
                style={{
                    backgroundColor: 'var(--brand-primary, #F9C400)',
                }}
            />

            {/* Glassmorphic Modal Card */}
            <div
                className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#161329]/95 text-white shadow-2xl p-6 sm:p-8 backdrop-blur-xl"
                style={{
                    boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Icon with Dynamic Theme Tint */}
                <div className="flex justify-center mb-5">
                    <div
                        className="relative flex items-center justify-center w-16 h-16 rounded-2xl border border-white/20 shadow-lg"
                        style={{
                            backgroundColor: 'var(--brand-primary, #F9C400)',
                            boxShadow: '0 10px 25px -5px var(--brand-primary, #F9C400)',
                        }}
                    >
                        <ShieldAlert className="w-8 h-8 text-slate-950 drop-shadow" />
                    </div>
                </div>

                {/* Title & Status Badge */}
                <div className="text-center space-y-1.5 mb-5">
                    <div className="inline-flex items-center gap-2">
                        <h2 className="text-2xl font-black tracking-tight text-white">
                            {isAccessRestricted ? 'Access Restricted' : status === 404 ? 'Page Not Found' : 'Error'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                            {status}
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                        {message ||
                            (isAccessRestricted ? (
                                <>
                                    You are currently in the <span className="font-bold text-white">*{currentName}*</span> workspace, but this page belongs to the <span className="font-bold text-white">*{targetName}*</span> workspace.
                                </>
                            ) : status === 404 ? (
                                'The page or resource you requested could not be found or is not accessible within your current role.'
                            ) : (
                                'An unexpected error occurred.'
                            ))}
                    </p>
                </div>

                {/* Workspace Comparison Strips (When in restricted context) */}
                {isAccessRestricted && (
                    <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                            <span className="text-slate-400 font-medium">Current Workspace:</span>
                            <span className="font-bold text-white/90">{currentName}</span>
                        </div>

                        <div
                            className="flex items-center justify-between px-4 py-3 rounded-xl border text-xs"
                            style={{
                                borderColor: 'var(--brand-primary, #F9C400)66',
                                backgroundColor: 'var(--brand-primary, #F9C400)1a',
                            }}
                        >
                            <span className="text-slate-300 font-medium">Required Workspace:</span>
                            <span
                                className="font-bold"
                                style={{
                                    color: 'var(--brand-primary, #F9C400)',
                                }}
                            >
                                {targetName}
                            </span>
                        </div>
                    </div>
                )}

                {/* Switcher Helper Subtext */}
                <p className="text-[11px] text-center text-slate-400 mb-6 leading-relaxed">
                    {isAccessRestricted
                        ? 'To access your designated features, please switch to the required workspace using the button below or the header switcher.'
                        : 'You can return to the dashboard or go back to your previous page.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {isAccessRestricted ? (
                        <button
                            type="button"
                            onClick={handleSwitch}
                            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-950 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                            style={{
                                backgroundColor: 'var(--brand-primary, #F9C400)',
                                boxShadow: '0 8px 20px -4px var(--brand-primary, #F9C400)',
                            }}
                        >
                            <ArrowRightLeft className="w-4 h-4 text-slate-950" />
                            <span>Switch to {targetName} Workspace</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => router.visit(active?.landing_url || '/dashboard')}
                            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-950 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                            style={{
                                backgroundColor: 'var(--brand-primary, #F9C400)',
                                boxShadow: '0 8px 20px -4px var(--brand-primary, #F9C400)',
                            }}
                        >
                            <Home className="w-4 h-4 text-slate-950" />
                            <span>Return to Dashboard</span>
                        </button>
                    )}

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

