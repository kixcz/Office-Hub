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
        <div className="w-[300px] sm:w-[320px] p-2 text-slate-800 dark:text-slate-100 font-sans">
            {/* 1. Header Profile Summary Card */}
            <DropdownMenuLabel className="p-2 font-normal focus:outline-none">
                <div className="flex items-start gap-3">
                    {/* Avatar with Online Badge */}
                    <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-2xs border border-primary/20">
                            {photoUrl ? (
                                <img src={photoUrl} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        {/* Green Active Dot */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#17152E] shadow-2xs" />
                    </div>

                    {/* Name, Badge, Title, Email */}
                    <div className="flex-1 min-w-0 leading-tight">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-sm text-foreground truncate max-w-[130px] sm:max-w-[145px]" title={user.name}>
                                {user.name}
                            </span>
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                {roleBadge.length > 18 ? roleBadge.slice(0, 16) + '..' : roleBadge}
                            </span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground truncate mb-0.5">
                            {academicRank}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </DropdownMenuLabel>

            {/* 2. Profile Completion Pill Card */}
            <div className="mt-1 mb-2 px-1">
                <Link
                    href={route('profile.edit')}
                    onClick={cleanup}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border transition-colors group cursor-pointer"
                >
                    {/* Circular Progress Gauge */}
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
                        <svg className="-rotate-90 transform" width="36" height="36" viewBox="0 0 36 36">
                            <circle
                                cx="18"
                                cy="18"
                                r={ringRadius}
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-muted/60"
                            />
                            <circle
                                cx="18"
                                cy="18"
                                r={ringRadius}
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-500"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-foreground">
                            {pct}%
                        </span>
                    </div>

                    {/* Progress Text */}
                    <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-foreground">
                            Profile Completion
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                            Complete your profile to unlock all features.
                        </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
            </div>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 3. Primary User Actions */}
            <DropdownMenuGroup className="space-y-0.5">
                {/* My Profile */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 px-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                    <Link href={route('profile.edit')} className="flex items-center justify-between w-full" onClick={cleanup}>
                        <div className="flex items-center gap-2.5">
                            <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold">My Profile</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>
                </DropdownMenuItem>

                {/* Appearance Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-xl py-2 px-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                        <div className="flex items-center gap-2.5">
                            <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold">Appearance</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">
                                {appearance}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-36 rounded-xl border border-border shadow-lg p-1">
                        <DropdownMenuItem
                            onClick={() => updateAppearance('light')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 focus:bg-sidebar-accent"
                        >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => updateAppearance('dark')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 focus:bg-sidebar-accent"
                        >
                            <Moon className="w-3.5 h-3.5 text-primary" />
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => updateAppearance('system')}
                            className="cursor-pointer rounded-lg text-xs font-medium py-1.5 px-2 flex items-center gap-2 focus:bg-sidebar-accent"
                        >
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            System
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Account Settings */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 px-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                    <Link href={route('profile.edit')} className="flex items-center justify-between w-full" onClick={cleanup}>
                        <div className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold">Account Settings</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 4. Support & Releases */}
            <DropdownMenuGroup className="space-y-0.5">
                {/* Help & Support */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 px-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                    <a
                        href="https://laravel.com/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between w-full"
                        onClick={cleanup}
                    >
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold">Help & Support</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </a>
                </DropdownMenuItem>

                {/* What's New */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 px-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                            <Gift className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold">What's New</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    </div>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5 border-slate-100 dark:border-slate-800" />

            {/* 5. Logout */}
            <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 px-2.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600 dark:focus:text-red-300">
                <Link className="flex items-center gap-2.5 w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold">Log out</span>
                </Link>
            </DropdownMenuItem>
        </div>
    );
}
