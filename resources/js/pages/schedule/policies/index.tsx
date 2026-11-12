import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    SlidersHorizontal,
    BookOpen,
    Users,
    FlaskConical,
    Settings2,
    Search,
    Plus,
    Filter,
    Clock,
    Layers,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    X,
    Edit3,
    Copy,
    ChevronDown,
    FileText,
    Scale,
    ShieldAlert,
    Trash2,
    Calendar,
    Briefcase,
    GraduationCap,
    Info,
    RotateCcw,
    Check,
    Monitor,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                checked ? 'bg-[#8B1E3F]' : 'bg-slate-200 dark:bg-slate-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Faculty Loading', href: '/schedule/loading' },
    { title: 'Load Policies', href: '/schedule/policies' },
];

export interface PolicySettings {
    version: string;
    status: string;
    standard_load: number;
    min_load: number;
    max_load: number;
    lab_block: string;
    overload_threshold: number;
    underload_threshold: number;
    enforce_min_max: boolean;
    consider_credits: boolean;
    check_specialization: boolean;
}

interface DesignationRule {
    id: string;
    name: string;
    role: string;
    scope: string;
    credits: number;
    priority: number;
    stackable: boolean;
    status: 'Active' | 'Inactive';
}

interface SpecialRule {
    id: string;
    name: string;
    category: string;
    appliesTo: string;
    condition: string;
    action: string;
    priority: number;
    status: 'Active' | 'Inactive';
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    creditMappings?: any[];
    programs?: any[];
    policySettings?: Partial<PolicySettings>;
    initialTab?: string;
}

export default function LoadPoliciesPage({
    currentPeriod,
    academicPeriods = [],
    creditMappings = [],
    programs = [],
    policySettings: initialSettings,
    initialTab = 'general',
}: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'designations' | 'load-rules' | 'laboratory' | 'other'>(
        (initialTab as any) === 'designations'
            ? 'designations'
            : (initialTab as any) === 'special'
              ? 'other'
              : 'general',
    );

    // Form settings state (matching top-left quadrant)
    const [settings, setSettings] = useState<PolicySettings>({
        version: initialSettings?.version || 'Version 3',
        status: initialSettings?.status || 'Active',
        standard_load: initialSettings?.standard_load ?? 12.0,
        min_load: initialSettings?.min_load ?? 9.0,
        max_load: initialSettings?.max_load ?? 18.0,
        lab_block: initialSettings?.lab_block || 'Uninterrupted',
        overload_threshold: initialSettings?.overload_threshold ?? 18.0,
        underload_threshold: initialSettings?.underload_threshold ?? 9.0,
        enforce_min_max: initialSettings?.enforce_min_max ?? true,
        consider_credits: initialSettings?.consider_credits ?? true,
        check_specialization: initialSettings?.check_specialization ?? true,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Designation Rules State
    const [designations, setDesignations] = useState<DesignationRule[]>([
        {
            id: 'DES-01',
            name: 'College Dean Workload Credit',
            role: 'Dean',
            scope: 'College-wide',
            credits: 9.0,
            priority: 1,
            stackable: false,
            status: 'Active',
        },
        {
            id: 'DES-02',
            name: 'Academic Program Head',
            role: 'Program Head',
            scope: 'BSIT, BSIS, BSCS, BSDS',
            credits: 6.0,
            priority: 2,
            stackable: false,
            status: 'Active',
        },
        {
            id: 'DES-03',
            name: 'Laboratory Coordinator',
            role: 'Lab Coordinator',
            scope: 'Computer Labs & CLRs',
            credits: 3.0,
            priority: 3,
            stackable: true,
            status: 'Active',
        },
        {
            id: 'DES-04',
            name: 'Research Coordinator',
            role: 'Research Head',
            scope: 'College R&D Unit',
            credits: 3.0,
            priority: 3,
            stackable: true,
            status: 'Active',
        },
        {
            id: 'DES-05',
            name: 'Community Extension Coordinator',
            role: 'Extension Lead',
            scope: 'External Services',
            credits: 3.0,
            priority: 3,
            stackable: true,
            status: 'Active',
        },
    ]);

    // Special Exception Rules State
    const [specialRules, setSpecialRules] = useState<SpecialRule[]>([
        {
            id: 'SP-01',
            name: 'Cross-listed Course Handling',
            category: 'Course',
            appliesTo: 'All Programs',
            condition: 'Course is marked as cross-listed (same code, multiple sections)',
            action: 'Link sections & share faculty assignment',
            priority: 1,
            status: 'Active',
        },
        {
            id: 'SP-02',
            name: 'Overload Approval Required',
            category: 'Faculty',
            appliesTo: 'All Faculty',
            condition: 'Assigned load > 18.0 hrs/week',
            action: 'Require Dean / VPAA approval',
            priority: 2,
            status: 'Active',
        },
        {
            id: 'SP-03',
            name: 'Shared Faculty Restriction',
            category: 'Faculty',
            appliesTo: 'Multi-Program',
            condition: 'Same faculty assigned to different programs',
            action: 'Prevent cross-program time conflicts',
            priority: 2,
            status: 'Active',
        },
        {
            id: 'SP-04',
            name: 'Block Saturday Scheduling',
            category: 'Time',
            appliesTo: 'All Programs',
            condition: 'Day = Saturday',
            action: 'Prevent class assignment unless extension',
            priority: 3,
            status: 'Active',
        },
        {
            id: 'SP-05',
            name: 'Minimum Laboratory Gap',
            category: 'Laboratory',
            appliesTo: 'Laboratory Courses',
            condition: 'Consecutive lab classes of the same section',
            action: 'Enforce ≥ 1 hr gap or break',
            priority: 3,
            status: 'Active',
        },
    ]);

    const handleReset = () => {
        setSettings({
            version: 'Version 3',
            status: 'Active',
            standard_load: 12.0,
            min_load: 9.0,
            max_load: 18.0,
            lab_block: 'Uninterrupted',
            overload_threshold: 18.0,
            underload_threshold: 9.0,
            enforce_min_max: true,
            consider_credits: true,
            check_specialization: true,
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        router.post(
            '/schedule/policies/update',
            {
                standard_load: settings.standard_load,
                min_load: settings.min_load,
                max_load: settings.max_load,
                enforce_min_max: settings.enforce_min_max,
                consider_credits: settings.consider_credits,
                check_specialization: settings.check_specialization,
                version: settings.version,
            },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                },
                onError: () => setIsSaving(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Load Policies - Semester Scheduling" />
            <SchedulingWorkspaceLayout
                currentPeriod={currentPeriod}
                academicPeriods={academicPeriods}
                title="Load Policies"
                subtitle="Configure the rules and parameters that govern faculty workload and course assignment."
            >
                <div className="space-y-6">
                    {/* Header Card matching Top-Left Quadrant */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#60122B] text-white shadow-md shadow-[#8B1E3F]/20">
                                    <SlidersHorizontal className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Load Policies
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Configure the rules and parameters that govern faculty workload and course assignment.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <span>{settings.version}</span>
                                    <span className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        {settings.status}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation (Pill style matching quadrant) */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                activeTab === 'general'
                                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                            General Policy
                        </button>
                        <button
                            onClick={() => setActiveTab('designations')}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                activeTab === 'designations'
                                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                            Designation Credits
                        </button>
                        <button
                            onClick={() => setActiveTab('load-rules')}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                activeTab === 'load-rules'
                                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                            Load Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('laboratory')}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                activeTab === 'laboratory'
                                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                            Laboratory Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('other')}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                activeTab === 'other'
                                    ? 'bg-[#8B1E3F] text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                            Other Rules
                        </button>
                    </div>

                    {/* GENERAL POLICY TAB (Main quadrant match) */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Left Card: Teaching Load Policy & Key Rules */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#8B1E3F] dark:bg-slate-800 dark:text-rose-400">
                                            <Monitor className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Teaching Load Policy
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Set the standard, minimum, and maximum teaching load.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3 Select / Inputs */}
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Standard Load (hrs/wk)
                                            </Label>
                                            <select
                                                value={settings.standard_load}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, standard_load: Number(e.target.value) })
                                                }
                                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value={9.0}>9.0 hrs/wk</option>
                                                <option value={12.0}>12.0 hrs/wk (Standard)</option>
                                                <option value={15.0}>15.0 hrs/wk</option>
                                                <option value={18.0}>18.0 hrs/wk</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Minimum Load (hrs/wk)
                                            </Label>
                                            <select
                                                value={settings.min_load}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, min_load: Number(e.target.value) })
                                                }
                                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value={6.0}>6.0 hrs/wk</option>
                                                <option value={9.0}>9.0 hrs/wk (Standard Minimum)</option>
                                                <option value={12.0}>12.0 hrs/wk</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Maximum Load (hrs/wk)
                                            </Label>
                                            <select
                                                value={settings.max_load}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, max_load: Number(e.target.value) })
                                                }
                                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value={15.0}>15.0 hrs/wk</option>
                                                <option value={18.0}>18.0 hrs/wk (Standard Maximum)</option>
                                                <option value={21.0}>21.0 hrs/wk (Overload Cap)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Key Rules Toggles Section */}
                                    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Settings2 className="h-4 w-4 text-[#8B1E3F]" />
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                Key Rules
                                            </h4>
                                        </div>

                                        <div className="space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                                    Enforce minimum and maximum load
                                                </span>
                                                <ToggleSwitch
                                                    checked={settings.enforce_min_max}
                                                    onChange={(val) =>
                                                        setSettings({ ...settings, enforce_min_max: val })
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                                    Consider designation/research/extension credits
                                                </span>
                                                <ToggleSwitch
                                                    checked={settings.consider_credits}
                                                    onChange={(val) =>
                                                        setSettings({ ...settings, consider_credits: val })
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                                    Check specialization match
                                                </span>
                                                <ToggleSwitch
                                                    checked={settings.check_specialization}
                                                    onChange={(val) =>
                                                        setSettings({ ...settings, check_specialization: val })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Card: Policy Summary */}
                                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div>
                                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#8B1E3F] dark:bg-slate-800 dark:text-rose-400">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Policy Summary
                                            </h3>
                                        </div>

                                        <div className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Standard Load</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {Number(settings.standard_load).toFixed(1)} hrs/wk
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Minimum Load</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {Number(settings.min_load).toFixed(1)} hrs/wk
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Maximum Load</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {Number(settings.max_load).toFixed(1)} hrs/wk
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Laboratory Block</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {settings.lab_block}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Overload Threshold</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    &gt; {Number(settings.max_load).toFixed(1)} hrs/wk
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-slate-500">Underload Threshold</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    &lt; {Number(settings.min_load).toFixed(1)} hrs/wk
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        {saveSuccess && (
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Saved!
                                            </span>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReset}
                                            className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Reset
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isSaving}
                                            onClick={handleSave}
                                            className="h-9 gap-1.5 bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833]"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DESIGNATION CREDITS TAB */}
                    {activeTab === 'designations' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Official Designation Workload Reductions
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Workload release units officially credited to leadership, coordination, and administrative roles.
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Rule Name</th>
                                                <th className="px-4 py-3 font-semibold">Role / Position</th>
                                                <th className="px-4 py-3 font-semibold">Scope</th>
                                                <th className="px-4 py-3 font-semibold">Credited Units</th>
                                                <th className="px-4 py-3 font-semibold">Priority</th>
                                                <th className="px-4 py-3 font-semibold">Stackable</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {designations.map((d) => (
                                                <tr
                                                    key={d.id}
                                                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                        {d.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            {d.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500">{d.scope}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                        {d.credits.toFixed(1)} hrs
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">Priority {d.priority}</td>
                                                    <td className="px-4 py-3">
                                                        {d.stackable ? (
                                                            <span className="text-emerald-600 font-medium">Yes</span>
                                                        ) : (
                                                            <span className="text-slate-400">No</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {d.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOAD RULES TAB */}
                    {activeTab === 'load-rules' && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#8B1E3F]">
                                        <Scale className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Overload Rules
                                    </h4>
                                </div>
                                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                    <p>
                                        Teaching loads exceeding <strong>18.0 hrs/week</strong> trigger an automated
                                        administrative review flag.
                                    </p>
                                    <div className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                        Overload requires explicit endorsement from the Academic Dean and approval from
                                        the Office of the Vice President for Academic Affairs.
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Underload Rules
                                    </h4>
                                </div>
                                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                    <p>
                                        Full-time regular faculty carrying below <strong>9.0 hrs/week</strong> are flagged
                                        as underloaded.
                                    </p>
                                    <div className="rounded-lg bg-blue-50 p-3 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                        Underloaded faculty can be supplemented with research units, committee work, or
                                        co-teaching assignments.
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                        <Layers className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Preparation Count
                                    </h4>
                                </div>
                                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                    <p>
                                        Standard policy limits distinct subject preparations to a maximum of{' '}
                                        <strong>3 courses</strong> per semester.
                                    </p>
                                    <div className="rounded-lg bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        A 4th preparation requires written justification and approval by the Department
                                        Chair.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LABORATORY RULES TAB */}
                    {activeTab === 'laboratory' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Laboratory Workload & Contact Rules
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Policies governing hands-on lab sessions, block scheduling, and contact hour conversion.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                            <FlaskConical className="h-4 w-4 text-[#8B1E3F]" />
                                            Uninterrupted 3-Hour Lab Blocks
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Computer laboratory classes must be scheduled in single uninterrupted 3-hour
                                            blocks to facilitate hands-on practical exercises.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                            <Clock className="h-4 w-4 text-[#8B1E3F]" />
                                            Lab Contact Hour Multiplier
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Every 3 hours of laboratory contact time counts as 1.0 unit towards student
                                            credit and 3.0 contact hours towards faculty teaching load.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OTHER RULES TAB */}
                    {activeTab === 'other' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Special Exception Rules
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Custom constraints for cross-listing, Saturday scheduling, and inter-program teaching.
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Rule Name</th>
                                                <th className="px-4 py-3 font-semibold">Category</th>
                                                <th className="px-4 py-3 font-semibold">Applies To</th>
                                                <th className="px-4 py-3 font-semibold">Trigger Condition</th>
                                                <th className="px-4 py-3 font-semibold">Resulting Action</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {specialRules.map((r) => (
                                                <tr
                                                    key={r.id}
                                                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                        {r.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                                            {r.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{r.appliesTo}</td>
                                                    <td className="px-4 py-3 text-slate-500">{r.condition}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                        {r.action}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
