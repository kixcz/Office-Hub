import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData, type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    ExternalLink,
    Gift,
    HelpCircle,
    LogOut,
    Moon,
    Palette,
    Settings,
    Sun,
    User as UserIcon,
} from 'lucide-react';
import React from 'react';

interface UserMenuContentProps {
    user: User;
    completion?: number;
}

export function UserMenuContent({ user, completion = 82 }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();
    const { portal_context } = usePage<SharedData>().props;
    const getInitials = useInitials();

    // Determine role badge and academic rank / subtitle
    const activeAssignment = portal_context?.active_assignment;
    const roleBadge =
        activeAssignment?.role_name ||
        (user as any)?.roles?.[0] ||
        (user.is_institution_super_admin
            ? 'Institution Super Admin'
            : user.is_vpaf
            ? 'VPAF Executive'
            : user.is_college_admin
            ? 'College Admin'
            : 'Faculty Member');

    const academicRank =
        (user as any)?.faculty?.academic_rank ||
        activeAssignment?.display_label ||
        (user.is_institution_super_admin
            ? 'Central Governance'
            : user.is_vpaf
            ? 'Executive Oversight'
            : 'Academic Affairs');

    const photoUrl = (user as any)?.faculty?.photo_url || user.avatar;
    const initials = getInitials(user.name);

    // Profile completion math
    const pct = Math.max(0, Math.min(100, Math.round(completion)));
    const ringRadius = 14;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (pct / 100) * ringCircumference;

    return (
        <div className="w-[300px] sm:w-[320px] p-2 text-[#1E293B] dark:text-slate-100 font-sans">
            {/* 1. Header Profile Summary Card */}
            <DropdownMenuLabel className="p-2 font-normal focus:outline-none">
                <div className="flex items-start gap-3">
                    {/* Avatar with Online Badge */}
                    <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-[#EFF6FF] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] flex items-center justify-center font-bold text-sm shadow-2xs border border-[#175C94]/20">
                            {photoUrl ? (
                                <img src={photoUrl} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        {/* Green Active Dot */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A] shadow-2xs" />
                    </div>

                    {/* Name, Badge, Title, Email */}
                    <div className="flex-1 min-w-0 leading-tight">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-sm text-[#0F172A] dark:text-white truncate max-w-[130px] sm:max-w-[145px]" title={user.name}>
                                {user.name}
                            </span>
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#0B3A67] dark:bg-blue-950/40 dark:text-[#93C5FD] border border-[#175C94]/25">
                                {roleBadge.length > 18 ? roleBadge.slice(0, 16) + '..' : roleBadge}
                            </span>
                        </div>
                        <p className="text-[11px] font-medium text-[#475569] dark:text-slate-400 truncate mb-0.5">
                            {academicRank}
                        </p>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </DropdownMenuLabel>

            {/* 2. Profile Completion Pill Card (Clean Brand-Neutral Gradient: 120deg #EFF6FF -> #F8FAFC -> #F1F5F9) */}
            <div className="mt-1 mb-2 px-1">
                <Link
                    href={route('profile.edit')}
                    onClick={cleanup}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 transition-all group cursor-pointer shadow-xs hover:border-[#175C94]/40"
                    style={{
                        background: 'linear-gradient(120deg, #EFF6FF 0%, #F8FAFC 55%, #F1F5F9 100%)',
                    }}
                >
                    {/* Circular Progress Gauge */}
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
                        <svg className="-rotate-90 transform" width="36" height="36" viewBox="0 0 36 36">
                            <circle
                                cx="18"
                                cy="18"
                                r={ringRadius}
                                fill="transparent"
                                stroke="#CBD5E1"
                                strokeWidth="3"
                                className="dark:stroke-slate-700"
                            />
                            <circle
                                cx="18"
                                cy="18"
                                r={ringRadius}
                                fill="transparent"
                                stroke="#0B3A67"
                                strokeWidth="3"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[#0B3A67] dark:text-[#93C5FD]">
                            {pct}%
                        </span>
                    </div>

                    {/* Progress Text */}
                    <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-[#0F172A] dark:text-white">
                            Profile Completion
                        </span>
                        <span className="block text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                            Complete your profile to unlock all features.
                        </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#175C94] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
            </div>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 3. Primary User Actions */}
            <DropdownMenuGroup className="space-y-0.5">
                {/* My Profile */}
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl py-2 px-2.5 transition-colors border border-transparent text-[#1E293B] dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#F1F5F9] hover:to-[#EFF6FF] hover:text-[#0B3A67] hover:border-transparent focus:bg-gradient-to-r focus:from-[#F1F5F9] focus:to-[#EFF6FF] focus:text-[#0B3A67] focus:ring-1 focus:ring-[#175C94]/20 group"
                >
                    <Link href={route('profile.edit')} className="flex items-center justify-between w-full" onClick={cleanup}>
                        <div className="flex items-center gap-2.5">
                            <UserIcon className="w-4 h-4 text-[#64748B] group-hover:text-[#175C94] transition-colors" />
                            <span className="text-xs font-semibold">My Profile</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#175C94] transition-colors" />
                    </Link>
                </DropdownMenuItem>

                {/* Appearance Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className="cursor-pointer rounded-xl py-2 px-2.5 transition-colors border border-transparent text-[#1E293B] dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#F1F5F9] hover:to-[#EFF6FF] hover:text-[#0B3A67] focus:bg-gradient-to-r focus:from-[#F1F5F9] focus:to-[#EFF6FF] focus:text-[#0B3A67] focus:ring-1 focus:ring-[#175C94]/20 group"
                    >
                        <div className="flex items-center gap-2.5">
                            <Palette className="w-4 h-4 text-[#64748B] group-hover:text-[#175C94] transition-colors" />
                            <span className="text-xs font-semibold">Appearance</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-[#64748B] dark:text-slate-400 px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 capitalize">
                                {appearance}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#175C94] transition-colors" />
                        </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-36 rounded-xl border border-border shadow-lg p-1 bg-white dark:bg-[#0F172A]">
                        <DropdownMenuItem
                            onClick={() => updateAppearance('light')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 hover:bg-[#F1F5F9] focus:bg-[#EFF6FF] focus:text-[#0B3A67]"
                        >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => updateAppearance('dark')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 hover:bg-[#F1F5F9] focus:bg-[#EFF6FF] focus:text-[#0B3A67]"
                        >
                            <Moon className="w-3.5 h-3.5 text-[#175C94]" />
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => updateAppearance('system')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 hover:bg-[#F1F5F9] focus:bg-[#EFF6FF] focus:text-[#0B3A67]"
                        >
                            <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                            System
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Account Settings (Active / Selected State Style Demonstration with Left Blue Accent) */}
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl py-2 px-2.5 transition-colors relative border-l-2 border-l-[#175C94] bg-gradient-to-r from-[#E0F2FE] to-[#EEF2FF] text-[#0B3A67] dark:from-[#0B3A67]/30 dark:to-[#175C94]/20 dark:text-[#93C5FD] focus:bg-gradient-to-r focus:from-[#E0F2FE] focus:to-[#EEF2FF] focus:text-[#0B3A67] focus:ring-1 focus:ring-[#175C94]/20 group font-bold shadow-2xs"
                >
                    <Link href={route('profile.edit')} className="flex items-center justify-between w-full" onClick={cleanup}>
                        <div className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD] transition-colors" />
                            <span className="text-xs">Account Settings</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD] transition-colors" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 4. Support & Releases */}
            <DropdownMenuGroup className="space-y-0.5">
                {/* Help & Support */}
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl py-2 px-2.5 transition-colors border border-transparent text-[#1E293B] dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#F1F5F9] hover:to-[#EFF6FF] hover:text-[#0B3A67] focus:bg-gradient-to-r focus:from-[#F1F5F9] focus:to-[#EFF6FF] focus:text-[#0B3A67] focus:ring-1 focus:ring-[#175C94]/20 group"
                >
                    <a
                        href="https://laravel.com/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between w-full"
                        onClick={cleanup}
                    >
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="w-4 h-4 text-[#64748B] group-hover:text-[#175C94] transition-colors" />
                            <span className="text-xs font-semibold">Help & Support</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#175C94] transition-colors" />
                    </a>
                </DropdownMenuItem>

                {/* What's New */}
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl py-2 px-2.5 transition-colors border border-transparent text-[#1E293B] dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#F1F5F9] hover:to-[#EFF6FF] hover:text-[#0B3A67] focus:bg-gradient-to-r focus:from-[#F1F5F9] focus:to-[#EFF6FF] focus:text-[#0B3A67] focus:ring-1 focus:ring-[#175C94]/20 group"
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                            <Gift className="w-4 h-4 text-[#64748B] group-hover:text-[#175C94] transition-colors" />
                            <span className="text-xs font-semibold">What's New</span>
                        </div>
                        {/* Small Blue Notification Dot */}
                        <span className="w-2 h-2 rounded-full bg-[#175C94] ring-2 ring-[#175C94]/20" />
                    </div>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 5. Logout: Controlled Soft Red Restrained Style */}
            <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-xl py-2 px-2.5 text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] hover:text-[#B91C1C] active:bg-[#FEE2E2] focus:bg-[#FEF2F2] focus:text-[#B91C1C] dark:hover:bg-red-950/40 dark:focus:bg-red-950/40 transition-colors group"
            >
                <Link className="flex items-center gap-2.5 w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="w-4 h-4 shrink-0 text-[#DC2626] group-hover:text-[#B91C1C] transition-colors" />
                    <span className="text-xs font-bold">Log out</span>
                </Link>
            </DropdownMenuItem>
        </div>
    );
}
