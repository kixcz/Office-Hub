import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useState, FormEventHandler } from 'react';
import {
    User,
    Shield,
    Bell,
    History,
    KeyRound,
    Mail,
    Building2,
    Calendar,
    Camera,
    Save,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Briefcase,
    BadgeCheck,
    ChevronRight,
    Lock,
    ExternalLink,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import DeleteUser from '@/components/delete-user';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile Settings',
        href: '/settings/profile',
    },
];

type TabKey = 'personal' | 'account' | 'security' | 'notifications' | 'activity';

interface ProfileData {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    email: string;
    phone: string;
    institutional_id: string;
    department: string;
    job_title: string;
    primary_role: string;
    roles: string[];
    bio: string;
    created_at: string;
    account_status: string;
}

interface ActivityItem {
    id: number;
    action: string;
    description: string;
    ip_address: string;
    created_at: string;
}

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    profile?: ProfileData;
    activities?: ActivityItem[];
}

export default function Profile({ mustVerifyEmail, status, profile, activities = [] }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<TabKey>('personal');

    const initialFirstName = profile?.first_name || auth.user.name.split(' ')[0] || 'System';
    const initialLastName = profile?.last_name || auth.user.name.split(' ').slice(1).join(' ') || 'Admin';

    const { data, setData, patch, errors, processing, recentlySuccessful, reset } = useForm({
        first_name: initialFirstName,
        last_name: initialLastName,
        middle_name: profile?.middle_name || '',
        suffix: profile?.suffix || '',
        email: profile?.email || auth.user.email,
        phone: profile?.phone || '',
        department: profile?.department || 'CIDS Administration',
        job_title: profile?.job_title || profile?.primary_role || 'System Administrator',
        bio: profile?.bio || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const handleCancel = () => {
        reset();
    };

    // Initials for avatar
    const initials = (data.first_name?.[0] || 'S') + (data.last_name?.[0] || 'A');
    const displayName = `${data.first_name} ${data.last_name}`.trim() || auth.user.name;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile Settings" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-[#F8FAFC] dark:bg-zinc-950 min-h-screen font-['Poppins',sans-serif]">
                {/* 1. Page Header with Maroon Left Accent Bar */}
                <div className="flex items-start gap-3">
                    <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-[#8B1E3F] via-[#0B3A67] to-[#072445] shrink-0" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            Profile Settings
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage your profile, account, security, notifications, and activity.
                        </p>
                    </div>
                </div>

                {/* 2. Main Two-Column Container */}
                <div className="grid grid-cols-12 gap-6 items-start">
                    {/* Left Hero Card with Navy & Maroon Gradient (Matches Attached Screenshot) */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3.5 xl:col-span-3 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#072445] via-[#0B3A67] to-[#8B1E3F] border border-[#175C94]/40">
                        {/* Soft background glow accents */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#8B1E3F]/40 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#072445]/60 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative flex flex-col items-center text-center">
                            {/* Avatar with Camera badge */}
                            <div className="relative group cursor-pointer mb-3">
                                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white/95 text-[#072445] flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white/20">
                                    {initials.toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#8B1E3F] text-white flex items-center justify-center shadow-md ring-2 ring-white">
                                    <Camera className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {/* User Name & Role Pill */}
                            <h2 className="text-xl font-black text-white tracking-tight leading-tight mt-1">
                                {displayName}
                            </h2>
                            <div className="mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white/90 border border-white/20 backdrop-blur-md">
                                {profile?.primary_role || 'System Administrator'}
                            </div>

                            {/* Details List */}
                            <div className="w-full mt-6 pt-5 border-t border-white/15 space-y-3 text-left text-xs font-medium text-white/90">
                                <div className="flex items-center gap-2.5">
                                    <Mail className="w-4 h-4 text-white/70 shrink-0" />
                                    <span className="truncate">{data.email}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Building2 className="w-4 h-4 text-white/70 shrink-0" />
                                    <span className="truncate">{data.department}</span>
                                </div>
                            </div>

                            {/* Membership Date */}
                            <div className="w-full mt-5 pt-4 border-t border-white/15 flex items-center gap-2.5 text-xs text-white/80">
                                <Calendar className="w-4 h-4 text-white/70 shrink-0" />
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-white/60 block font-semibold leading-none">
                                        Member since
                                    </span>
                                    <span className="font-bold text-white mt-0.5 block">
                                        {profile?.created_at || 'Jan 15, 2024'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tab Navigation & Active Tab Content */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-8.5 xl:col-span-9 flex flex-col gap-5">
                        {/* Tab Bar (Matches Screenshot) */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('personal')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                                    activeTab === 'personal'
                                        ? "bg-[#8B1E3F] text-white shadow-md ring-2 ring-[#8B1E3F]/30"
                                        : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50"
                                )}
                            >
                                <User className="w-4 h-4" />
                                <span>Personal Information</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('account')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                                    activeTab === 'account'
                                        ? "bg-[#8B1E3F] text-white shadow-md ring-2 ring-[#8B1E3F]/30"
                                        : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50"
                                )}
                            >
                                <Lock className="w-4 h-4" />
                                <span>Account Details</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('security')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                                    activeTab === 'security'
                                        ? "bg-[#8B1E3F] text-white shadow-md ring-2 ring-[#8B1E3F]/30"
                                        : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50"
                                )}
                            >
                                <Shield className="w-4 h-4" />
                                <span>Security</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('notifications')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                                    activeTab === 'notifications'
                                        ? "bg-[#8B1E3F] text-white shadow-md ring-2 ring-[#8B1E3F]/30"
                                        : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50"
                                )}
                            >
                                <Bell className="w-4 h-4" />
                                <span>Notification Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('activity')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                                    activeTab === 'activity'
                                        ? "bg-[#8B1E3F] text-white shadow-md ring-2 ring-[#8B1E3F]/30"
                                        : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50"
                                )}
                            >
                                <History className="w-4 h-4" />
                                <span>Activity History</span>
                            </button>
                        </div>

                        {/* TAB 1: Personal Information Form (Matches Reference Screenshot) */}
                        {activeTab === 'personal' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
                                {/* Header */}
                                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Personal Information
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            Update your personal details and how your name appears across the system.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={submit} className="flex flex-col gap-5 mt-6">
                                    {/* First Name & Last Name */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="first_name" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                First Name <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="first_name"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                required
                                                placeholder="e.g. System"
                                                className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="last_name" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Last Name <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="last_name"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                required
                                                placeholder="e.g. Admin"
                                                className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>
                                    </div>

                                    {/* Middle Name & Suffix */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="middle_name" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Middle Name
                                            </Label>
                                            <Input
                                                id="middle_name"
                                                value={data.middle_name}
                                                onChange={(e) => setData('middle_name', e.target.value)}
                                                placeholder="e.g. Del Rosario (Optional)"
                                                className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                            />
                                            <InputError message={errors.middle_name} />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="suffix" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Suffix / Title
                                            </Label>
                                            <Input
                                                id="suffix"
                                                value={data.suffix}
                                                onChange={(e) => setData('suffix', e.target.value)}
                                                placeholder="e.g. Jr., III, Ph.D. (Optional)"
                                                className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                            />
                                            <InputError message={errors.suffix} />
                                        </div>
                                    </div>

                                    {/* Email Address (Read-only / verified info like screenshot) */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="email" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                                className="rounded-2xl text-xs h-11 pl-10 border-slate-200 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-800/40"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                            Your email address is used for account recovery and system notifications.
                                        </p>
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Phone & Job Title */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="phone" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Contact Phone Number
                                            </Label>
                                            <div className="relative">
                                                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <Input
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    placeholder="+63 9XX XXX XXXX"
                                                    className="rounded-2xl text-xs h-11 pl-10 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                                />
                                            </div>
                                            <InputError message={errors.phone} />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="job_title" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Designation / Job Title
                                            </Label>
                                            <div className="relative">
                                                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <Input
                                                    id="job_title"
                                                    value={data.job_title}
                                                    onChange={(e) => setData('job_title', e.target.value)}
                                                    placeholder="e.g. System Administrator"
                                                    className="rounded-2xl text-xs h-11 pl-10 border-slate-200 dark:border-zinc-700 focus:border-[#8B1E3F] focus:ring-[#8B1E3F]/20"
                                                />
                                            </div>
                                            <InputError message={errors.job_title} />
                                        </div>
                                    </div>

                                    {/* Action Buttons: Cancel, Update, Save Changes (Maroon) */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="h-10 px-5 rounded-2xl text-xs font-bold border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="h-10 px-6 rounded-2xl text-xs font-bold bg-[#8B1E3F] hover:bg-[#68152E] text-white shadow-md flex items-center gap-2 cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                                        </Button>
                                    </div>

                                    {recentlySuccessful && (
                                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            Profile information updated successfully!
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* TAB 2: Account Details */}
                        {activeTab === 'account' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B3A67] dark:text-sky-400 flex items-center justify-center shrink-0">
                                        <Lock className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Account Details & Roles
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            Manage your account credentials, institutional identifier, and active role assignments.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                            Institutional ID
                                        </span>
                                        <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                                            {profile?.institutional_id}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Assigned college identifier</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                            Account Status
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                {profile?.account_status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Full administrative authorization</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Assigned Governance Roles
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile?.roles?.map((role, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-xl text-xs font-bold bg-[#072445]/10 text-[#072445] dark:bg-sky-950/60 dark:text-sky-300 border border-[#175C94]/30"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <DeleteUser />
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Security Settings */}
                        {activeTab === 'security' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Security & Password
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            Protect your account with multi-factor authentication and a robust password.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3">
                                    <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            Password Management
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                            To update your password, use the dedicated security flow with mandatory current password confirmation.
                                        </p>
                                        <Link
                                            href="/settings/password"
                                            className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8B1E3F] text-white hover:bg-[#68152E]"
                                        >
                                            <span>Go to Password Settings</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            Two-Factor Authentication (2FA)
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Require an authenticator code when logging in from unrecognized devices.
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Protected
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: Notification Settings */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0B3A67] dark:text-sky-400 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Notification Preferences
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            Choose what updates, announcements, and compliance alerts you receive.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { title: 'Faculty Travel Order & Movement Alerts', desc: 'Notify when new travel orders or locator slips are filed' },
                                        { title: 'Compliance & Syllabi Deadline Reminders', desc: 'Receive notices on approaching syllabus and TOS submission cutoffs' },
                                        { title: 'Facility Incident & Maintenance Reports', desc: 'Alert when a laboratory complaint or equipment breakdown is logged' },
                                        { title: 'TV Display Emergency Broadcast Takeovers', desc: 'Immediate notification when emergency broadcast alerts are issued' },
                                    ].map((item, i) => (
                                        <div key={i} className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                className="w-4 h-4 rounded text-[#8B1E3F] focus:ring-[#8B1E3F] cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 5: Activity History */}
                        {activeTab === 'activity' && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <History className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Activity History & Audit Log
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            View your recent account activity, system actions, and sign-ins.
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {activities.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs">
                                            <p className="font-bold">No previous external audit entries found.</p>
                                            <p className="mt-1">Active session established securely via institutional SSO/Credentials.</p>
                                        </div>
                                    ) : (
                                        activities.map((act) => (
                                            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">{act.action}</span>
                                                    <span className="text-[11px] text-slate-500">{act.description} • IP: {act.ip_address}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">{act.created_at}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4 Quick-Action Bottom Cards (Direct Match to User Screenshot) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-2">
                            {/* Card 1: Account Details */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('account')}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-[#8B1E3F]/50 transition-all text-left shadow-2xs group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] flex items-center justify-center mb-2.5">
                                    <Lock className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#8B1E3F] transition-colors">
                                        Account Details
                                    </h4>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    Manage your account information and role assignments.
                                </p>
                            </button>

                            {/* Card 2: Security */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('security')}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-[#8B1E3F]/50 transition-all text-left shadow-2xs group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] flex items-center justify-center mb-2.5">
                                    <Shield className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#8B1E3F] transition-colors">
                                        Security
                                    </h4>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    Update your password and security options.
                                </p>
                            </button>

                            {/* Card 3: Notification Settings */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('notifications')}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-[#8B1E3F]/50 transition-all text-left shadow-2xs group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] flex items-center justify-center mb-2.5">
                                    <Bell className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#8B1E3F] transition-colors">
                                        Notification Settings
                                    </h4>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    Choose what updates and alerts you want to receive.
                                </p>
                            </button>

                            {/* Card 4: Activity History */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('activity')}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-[#8B1E3F]/50 transition-all text-left shadow-2xs group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#8B1E3F] flex items-center justify-center mb-2.5">
                                    <History className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#8B1E3F] transition-colors">
                                        Activity History
                                    </h4>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    View your recent account activity and system actions.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
