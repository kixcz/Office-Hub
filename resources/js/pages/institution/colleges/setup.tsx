import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Bell,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileText,
    FolderOpen,
    Info,
    Layers,
    LayoutGrid,
    Paintbrush,
    Palette,
    RotateCcw,
    Save,
    Shield,
    Sliders,
    Trash2,
    Upload,
    User,
    Users,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollegeBranding {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    surface_color: string;
    preset_key?: string;
    slogan: string;
    logo_url?: string | null;
}

interface College {
    id: number;
    code: string;
    name: string;
    acronym?: string | null;
    type: string;
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    setup_stage: string;
    setup_progress: number;
    enabled_modules: Record<string, boolean>;
    dean_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    logo_url?: string | null;
    color_theme?: string | null;
    branding?: CollegeBranding;
    parent?: {
        id: number;
        code: string;
        name: string;
    } | null;
}

interface Props {
    colleges: College[];
    currentCollege: College;
    initialStage?: string | null;
}

const STAGES = [
    { id: 'Identity', num: 1, label: '1. Identity', desc: 'Name, code, dean, contacts' },
    { id: 'Branding', num: 2, label: '2. Branding & Theming', desc: 'Logo, colors, slogan, visual identity' },
    { id: 'Modules', num: 3, label: '3. Modules', desc: 'Enable/disable platform tools' },
    { id: 'Admins', num: 4, label: '4. Admins', desc: 'College admin designations' },
    { id: 'Programs', num: 5, label: '5. Programs', desc: 'Academic departments & degrees' },
    { id: 'Facilities', num: 6, label: '6. Facilities', desc: 'Classrooms, labs, studios' },
    { id: 'Policies', num: 7, label: '7. Policies', desc: 'Inherited institutional rules' },
    { id: 'Workflows', num: 8, label: '8. Workflows', desc: 'Approval & routing processes' },
    { id: 'Reports', num: 9, label: '9. Reports', desc: 'Signatories & document headers' },
    { id: 'TV', num: 10, label: '10. TV Studio', desc: 'Digital signage displays' },
    { id: 'Activation', num: 11, label: '11. Activation', desc: 'Operational status launch' },
];

const QUICK_THEME_PRESETS = [
    {
        key: 'amber',
        name: 'Gold & Royal Purple',
        primary_color: '#F9C400',
        secondary_color: '#4B2E83',
        accent_color: '#FFF3C4',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #F9C400 0%, #F59E0B 55%, #4B2E83 100%)',
    },
    {
        key: 'blue',
        name: 'Sapphire & Navy',
        primary_color: '#3B82F6',
        secondary_color: '#1E3A8A',
        accent_color: '#DBEAFE',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 55%, #1E3A8A 100%)',
    },
    {
        key: 'emerald',
        name: 'Forest & Emerald',
        primary_color: '#10B981',
        secondary_color: '#064E3B',
        accent_color: '#D1FAE5',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 55%, #064E3B 100%)',
    },
    {
        key: 'rose',
        name: 'Crimson & Maroon',
        primary_color: '#E11D48',
        secondary_color: '#881337',
        accent_color: '#FFE4E6',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #F87171 0%, #DC2626 55%, #7F1D1D 100%)',
    },
    {
        key: 'teal',
        name: 'Ocean Teal & Slate',
        primary_color: '#14B8A6',
        secondary_color: '#134E4A',
        accent_color: '#CCFBF1',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 55%, #134E4A 100%)',
    },
    {
        key: 'purple',
        name: 'Velora Violet & Magenta',
        primary_color: '#7C3AED',
        secondary_color: '#4C1D95',
        accent_color: '#EDE9FE',
        surface_color: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #F472B6 0%, #9333EA 55%, #4C1D95 100%)',
    },
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Colleges & Organizational Units', href: '/institution/colleges?view=colleges' },
    { title: 'College Setup & Configuration', href: '/institution/colleges/setup' },
];

/**
 * Determine whether text on a given hex background should be dark or white for contrast
 */
function getContrastText(hex: string): string {
    const clean = (hex || '#5B21B6').replace('#', '');
    if (clean.length !== 6) {
        return '#FFFFFF';
    }
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 155 ? '#17152E' : '#FFFFFF';
}

export default function CollegeSetup({ colleges, currentCollege, initialStage }: Props) {
    const defaultBranding: CollegeBranding = currentCollege.branding || {
        primary_color: currentCollege.code === 'CAS' ? '#F9C400' : '#7C3AED',
        secondary_color: currentCollege.code === 'CAS' ? '#4B2E83' : '#4C1D95',
        accent_color: currentCollege.code === 'CAS' ? '#FFF3C4' : '#EDE9FE',
        surface_color: '#FFFFFF',
        preset_key: currentCollege.color_theme || (currentCollege.code === 'CAS' ? 'amber' : 'purple'),
        slogan:
            currentCollege.code === 'CAS'
                ? 'Knowledge. Creativity. Service to Society.'
                : 'Educating today, innovating tomorrow.',
        logo_url: currentCollege.logo_url || null,
    };

    const resolvedInitialStage =
        initialStage ||
        (currentCollege.setup_stage === 'Active' ? 'Branding' : currentCollege.setup_stage || 'Branding');

    const [activeStage, setActiveStage] = useState(
        STAGES.some((s) => s.id === resolvedInitialStage) ? resolvedInitialStage : 'Branding',
    );
    const [logoPreview, setLogoPreview] = useState<string | null>(
        currentCollege.logo_url || defaultBranding.logo_url || null,
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        setup_stage: activeStage,
        setup_progress: Math.max(currentCollege.setup_progress || 82, 20),
        status: currentCollege.status || 'In Setup',
        name: currentCollege.name || '',
        code: currentCollege.code || '',
        acronym: currentCollege.acronym || currentCollege.code || '',
        dean_name: currentCollege.dean_name || '',
        contact_email: currentCollege.contact_email || '',
        contact_phone: currentCollege.contact_phone || '',
        address: currentCollege.address || '',
        color_theme: defaultBranding.preset_key || currentCollege.color_theme || 'amber',
        primary_color: defaultBranding.primary_color,
        secondary_color: defaultBranding.secondary_color,
        accent_color: defaultBranding.accent_color,
        surface_color: defaultBranding.surface_color,
        preset_key: defaultBranding.preset_key || 'amber',
        slogan: defaultBranding.slogan,
        logo: null as File | null,
        remove_logo: false,
        enabled_modules: currentCollege.enabled_modules || {
            scheduling: true,
            compliance: true,
            faculty_attendance: true,
            lab_monitoring: true,
            tv_studio: true,
            performance: true,
        },
    });

    // Sync state when switching colleges from the unit dropdown
    useEffect(() => {
        const b = currentCollege.branding || {
            primary_color: currentCollege.code === 'CAS' ? '#F9C400' : '#7C3AED',
            secondary_color: currentCollege.code === 'CAS' ? '#4B2E83' : '#4C1D95',
            accent_color: currentCollege.code === 'CAS' ? '#FFF3C4' : '#EDE9FE',
            surface_color: '#FFFFFF',
            preset_key: currentCollege.color_theme || (currentCollege.code === 'CAS' ? 'amber' : 'purple'),
            slogan:
                currentCollege.code === 'CAS'
                    ? 'Knowledge. Creativity. Service to Society.'
                    : 'Educating today, innovating tomorrow.',
            logo_url: currentCollege.logo_url || null,
        };
        setLogoPreview(currentCollege.logo_url || b.logo_url || null);
        setData({
            setup_stage: activeStage,
            setup_progress: currentCollege.setup_progress || 82,
            status: currentCollege.status || 'In Setup',
            name: currentCollege.name || '',
            code: currentCollege.code || '',
            acronym: currentCollege.acronym || currentCollege.code || '',
            dean_name: currentCollege.dean_name || '',
            contact_email: currentCollege.contact_email || '',
            contact_phone: currentCollege.contact_phone || '',
            address: currentCollege.address || '',
            color_theme: b.preset_key || currentCollege.color_theme || 'amber',
            primary_color: b.primary_color,
            secondary_color: b.secondary_color,
            accent_color: b.accent_color,
            surface_color: b.surface_color,
            preset_key: b.preset_key || 'amber',
            slogan: b.slogan,
            logo: null,
            remove_logo: false,
            enabled_modules: currentCollege.enabled_modules || {
                scheduling: true,
                compliance: true,
                faculty_attendance: true,
                lab_monitoring: true,
                tv_studio: true,
                performance: true,
            },
        });
    }, [currentCollege.id]);

    const activeStageIndex = STAGES.findIndex((s) => s.id === activeStage);

    const handleStageClick = (stageId: string, idx: number) => {
        setActiveStage(stageId);
        const progressScore = Math.max(data.setup_progress, Math.round(((idx + 1) / STAGES.length) * 100));
        setData((prev) => ({
            ...prev,
            setup_stage: stageId,
            setup_progress: progressScore,
        }));
    };

    const handlePresetSelect = (preset: (typeof QUICK_THEME_PRESETS)[number]) => {
        setData((prev) => ({
            ...prev,
            color_theme: preset.key,
            preset_key: preset.key,
            primary_color: preset.primary_color,
            secondary_color: preset.secondary_color,
            accent_color: preset.accent_color,
            surface_color: preset.surface_color,
        }));
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setData((prev) => ({
            ...prev,
            logo: file,
            remove_logo: false,
        }));
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') {
                setLogoPreview(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setData((prev) => ({
            ...prev,
            logo: null,
            remove_logo: true,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleResetToDefault = () => {
        const fallbackPreset =
            QUICK_THEME_PRESETS.find((p) => p.key === (currentCollege.code === 'CAS' ? 'amber' : 'purple')) ||
            QUICK_THEME_PRESETS[0];
        setLogoPreview(currentCollege.logo_url || null);
        setData((prev) => ({
            ...prev,
            name: currentCollege.name,
            code: currentCollege.code,
            acronym: currentCollege.acronym || currentCollege.code,
            color_theme: fallbackPreset.key,
            preset_key: fallbackPreset.key,
            primary_color: fallbackPreset.primary_color,
            secondary_color: fallbackPreset.secondary_color,
            accent_color: fallbackPreset.accent_color,
            surface_color: fallbackPreset.surface_color,
            slogan:
                currentCollege.code === 'CAS'
                    ? 'Knowledge. Creativity. Service to Society.'
                    : 'Educating today, innovating tomorrow.',
            logo: null,
            remove_logo: false,
        }));
    };

    const handleSaveSetup = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        post(`/institution/colleges/${currentCollege.id}/setup`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const toggleModule = (moduleKey: string) => {
        setData('enabled_modules', {
            ...data.enabled_modules,
            [moduleKey]: !data.enabled_modules[moduleKey],
        });
    };

    const primaryTextContrast = getContrastText(data.primary_color);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setup · ${currentCollege.code} · Platform Governance`} />

            {/* Hidden File Input for College Logo */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoFileChange}
                className="hidden"
            />

            <div className="flex flex-col gap-5 p-4 md:p-7 max-w-[1480px] mx-auto w-full">
                {/* 1. Top Header & College Unit Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] border border-[#A78BFA]/40">
                                Guided Onboarding Workspace
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                                College Setup &amp; Configuration
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl md:text-[28px] font-black tracking-tight text-[#17152E] dark:text-white leading-tight">
                                {data.name || currentCollege.name} ({data.code || currentCollege.code})
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] border border-[#A78BFA]/40">
                                {data.code || currentCollege.code}
                            </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-muted-foreground">
                            Configure the college&apos;s identity, branding, modules, access, and operational settings.
                        </p>
                    </div>

                    {/* Select Unit Dropdown */}
                    <div className="flex items-center gap-3 self-start lg:self-center">
                        <label className="text-xs font-bold text-[#17152E] dark:text-slate-200 whitespace-nowrap">
                            Select Unit:
                        </label>
                        <div className="relative min-w-[290px] sm:min-w-[330px]">
                            <select
                                value={currentCollege.id}
                                onChange={(e) =>
                                    router.get(
                                        `/institution/colleges/setup?college=${e.target.value}&stage=${activeStage}`,
                                    )
                                }
                                className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-border/90 bg-card text-xs font-bold text-[#17152E] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] shadow-2xs cursor-pointer"
                            >
                                {colleges.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} — {c.name} ({c.setup_progress}%)
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* 2. Setup Completion Status Horizontal Banner */}
                <div className="rounded-2xl border border-[#A78BFA]/25 bg-card px-5 py-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-[#17152E] dark:text-white">
                                Setup Completion Status
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Complete all required stages to fully configure the college.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-2xl flex items-center gap-4">
                        <div className="flex-1 h-2.5 rounded-full bg-[#EDE9FE] dark:bg-[#262246] overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.max(10, Math.min(100, data.setup_progress))}%`,
                                    background: `linear-gradient(90deg, ${data.primary_color || '#F59E0B'}, #F59E0B)`,
                                }}
                            />
                        </div>
                        <span className="text-xs font-extrabold text-[#17152E] dark:text-white whitespace-nowrap">
                            {data.setup_progress}% Complete
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {data.status === 'Not Configured' ? 'In Progress' : data.status}
                        </span>
                    </div>
                </div>

                {/* 3. Main Guided Onboarding Grid: Left Timeline Stepper + Right Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (3 cols): Vertical Connected Onboarding Steps */}
                    <div className="lg:col-span-3 rounded-2xl border border-[#A78BFA]/25 bg-card p-5 shadow-xs">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-4 px-1">
                            Onboarding Steps
                        </h3>

                        <div className="relative space-y-1">
                            {STAGES.map((stage, idx) => {
                                const isCurrent = activeStage === stage.id;
                                const isCompleted = idx < activeStageIndex;
                                const isLast = idx === STAGES.length - 1;

                                return (
                                    <div key={stage.id} className="relative flex items-start gap-3">
                                        {/* Vertical connector line */}
                                        {!isLast && (
                                            <div
                                                className={`absolute left-[13px] top-7 bottom-[-8px] w-[2px] ${
                                                    isCompleted
                                                        ? 'bg-emerald-500/50'
                                                        : 'bg-border/80'
                                                }`}
                                            />
                                        )}

                                        {/* Step Circle Indicator */}
                                        <button
                                            type="button"
                                            onClick={() => handleStageClick(stage.id, idx)}
                                            className={`relative z-10 mt-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all cursor-pointer ${
                                                isCompleted
                                                    ? 'bg-emerald-500 text-white shadow-2xs'
                                                    : isCurrent
                                                      ? 'bg-[#4C1D95] text-white ring-4 ring-[#EDE9FE] dark:ring-[#262246]'
                                                      : 'bg-card border-2 border-border text-muted-foreground hover:border-[#7C3AED]'
                                            }`}
                                        >
                                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stage.num}
                                        </button>

                                        {/* Step Pill Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleStageClick(stage.id, idx)}
                                            className={`flex-1 text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm'
                                                    : 'hover:bg-[#F7F7FB] dark:hover:bg-[#1E1B38] text-[#17152E] dark:text-white'
                                            }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p
                                                    className={`text-xs font-extrabold leading-snug truncate ${
                                                        isCurrent ? 'text-white' : 'text-[#17152E] dark:text-white'
                                                    }`}
                                                >
                                                    {stage.label}
                                                </p>
                                                <p
                                                    className={`text-[11px] truncate mt-0.5 ${
                                                        isCurrent ? 'text-white/85' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {stage.desc}
                                                </p>
                                            </div>
                                            {isCurrent && <ChevronRight className="w-4 h-4 text-white shrink-0" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column (9 cols): Active Stage Workspace */}
                    <div className="lg:col-span-9 rounded-2xl border border-[#A78BFA]/25 bg-card p-6 shadow-xs">
                        <form onSubmit={handleSaveSetup} className="space-y-6">
                            {/* Stage 2: Branding & Theming (Matches Attached Reference Image) */}
                            {activeStage === 'Branding' && (
                                <div className="space-y-6">
                                    {/* Top Header Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                                                <Paintbrush className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-black text-[#17152E] dark:text-white tracking-tight">
                                                    Branding &amp; Theming
                                                </h2>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Define the college&apos;s visual identity. These settings will be applied to all users under this college.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleResetToDefault}
                                                className="h-10 px-4 rounded-xl border-border/90 bg-card hover:bg-muted text-xs font-bold text-[#17152E] dark:text-white cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                                Reset to Default
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#5B21B6] text-white text-xs font-extrabold shadow-sm cursor-pointer"
                                            >
                                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                                {processing ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Two-Column Branding Layout */}
                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                        {/* Left Sub-Card (5 Cols): College Identity (Logo, Name, Acronym, Slogan) */}
                                        <div className="xl:col-span-5 rounded-2xl border border-border/80 bg-[#F7F7FB]/50 dark:bg-[#1E1B38]/40 p-5 space-y-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                                    College Identity
                                                </h3>
                                                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                            </div>

                                            {/* College Logo Upload Block */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#17152E] dark:text-slate-200 block">
                                                    College Logo
                                                </label>
                                                <div className="flex items-start gap-4">
                                                    {/* Logo Preview Box */}
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-28 h-28 rounded-2xl bg-card border-2 border-border/80 shadow-xs flex items-center justify-center p-2.5 shrink-0 cursor-pointer hover:border-[#7C3AED] transition-all overflow-hidden group relative"
                                                        title="Click to upload college seal/logo"
                                                    >
                                                        {logoPreview ? (
                                                            <img
                                                                src={logoPreview}
                                                                alt={data.code}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            /* Stylized Crest Default when no image file is uploaded */
                                                            <div
                                                                className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-inner border-4 relative"
                                                                style={{
                                                                    backgroundColor: data.secondary_color || '#4B2E83',
                                                                    borderColor: data.primary_color || '#F9C400',
                                                                }}
                                                            >
                                                                <BookOpen
                                                                    className="w-6 h-6 mb-0.5"
                                                                    style={{ color: data.primary_color || '#F9C400' }}
                                                                />
                                                                <span
                                                                    className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-black/30 text-white"
                                                                >
                                                                    {data.code || 'CAS'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Upload & Remove Controls */}
                                                    <div className="space-y-2 flex-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-[#A78BFA]/60 bg-[#EDE9FE]/70 hover:bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] text-xs font-extrabold transition-colors cursor-pointer"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" />
                                                            Upload New Logo
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveLogo}
                                                            className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Remove
                                                        </button>

                                                        <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                                                            Recommended: PNG or SVG, at least 512 × 512 px (1:1 ratio), transparent background.
                                                        </p>
                                                        {errors.logo && (
                                                            <p className="text-[11px] text-rose-600 font-semibold">
                                                                {errors.logo}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-border/60 pt-4 space-y-4">
                                                {/* College Name & Acronym / Code */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="sm:col-span-2 space-y-1.5">
                                                        <label className="text-xs font-bold text-[#17152E] dark:text-slate-200 block">
                                                            College Name <span className="text-rose-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            className="w-full h-10 px-3 rounded-xl border border-border/90 bg-card text-xs font-semibold text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-[#17152E] dark:text-slate-200 block">
                                                            Acronym / Code <span className="text-rose-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={data.code}
                                                            onChange={(e) => {
                                                                const up = e.target.value.toUpperCase();
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    code: up,
                                                                    acronym: up,
                                                                }));
                                                            }}
                                                            className="w-full h-10 px-3 rounded-xl border border-border/90 bg-card text-xs font-extrabold uppercase text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* College Slogan / Tagline */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-[#17152E] dark:text-slate-200 block">
                                                        College Slogan / Tagline
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={100}
                                                        value={data.slogan}
                                                        onChange={(e) => setData('slogan', e.target.value)}
                                                        placeholder="e.g. Knowledge. Creativity. Service to Society."
                                                        className="w-full h-10 px-3 rounded-xl border border-border/90 bg-card text-xs font-medium text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                                    />
                                                    <div className="text-right text-[11px] font-medium text-muted-foreground">
                                                        {(data.slogan || '').length} / 100
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sub-Card (7 Cols): College Theme & Appearance + Quick Presets + Live Theme Preview */}
                                        <div className="xl:col-span-7 rounded-2xl border border-border/80 bg-[#F7F7FB]/50 dark:bg-[#1E1B38]/40 p-5 space-y-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center">
                                                    <Palette className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white leading-tight">
                                                        College Theme &amp; Appearance
                                                    </h3>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Set the college&apos;s primary colors and UI theme.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 4 Color Swatch Pickers */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {/* Primary Color */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-[#17152E] dark:text-slate-200 block">
                                                        Primary Color <span className="text-rose-500">*</span>
                                                    </label>
                                                    <label className="flex items-center justify-between gap-2 h-10 px-2.5 rounded-xl border border-border/90 bg-card cursor-pointer hover:border-[#7C3AED] transition-colors shadow-2xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                type="color"
                                                                value={data.primary_color}
                                                                onChange={(e) =>
                                                                    setData('primary_color', e.target.value.toUpperCase())
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <span
                                                                className="w-5 h-5 rounded-md border border-black/10 shrink-0 shadow-2xs"
                                                                style={{ backgroundColor: data.primary_color }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={data.primary_color}
                                                                onChange={(e) =>
                                                                    setData('primary_color', e.target.value.toUpperCase())
                                                                }
                                                                className="w-full text-[11px] font-mono font-bold text-[#17152E] dark:text-white bg-transparent focus:outline-none uppercase"
                                                            />
                                                        </div>
                                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    </label>
                                                </div>

                                                {/* Secondary Color */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-[#17152E] dark:text-slate-200 block">
                                                        Secondary Color
                                                    </label>
                                                    <label className="flex items-center justify-between gap-2 h-10 px-2.5 rounded-xl border border-border/90 bg-card cursor-pointer hover:border-[#7C3AED] transition-colors shadow-2xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                type="color"
                                                                value={data.secondary_color}
                                                                onChange={(e) =>
                                                                    setData('secondary_color', e.target.value.toUpperCase())
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <span
                                                                className="w-5 h-5 rounded-md border border-black/10 shrink-0 shadow-2xs"
                                                                style={{ backgroundColor: data.secondary_color }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={data.secondary_color}
                                                                onChange={(e) =>
                                                                    setData('secondary_color', e.target.value.toUpperCase())
                                                                }
                                                                className="w-full text-[11px] font-mono font-bold text-[#17152E] dark:text-white bg-transparent focus:outline-none uppercase"
                                                            />
                                                        </div>
                                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    </label>
                                                </div>

                                                {/* Accent Color */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-[#17152E] dark:text-slate-200 block">
                                                        Accent Color
                                                    </label>
                                                    <label className="flex items-center justify-between gap-2 h-10 px-2.5 rounded-xl border border-border/90 bg-card cursor-pointer hover:border-[#7C3AED] transition-colors shadow-2xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                type="color"
                                                                value={data.accent_color}
                                                                onChange={(e) =>
                                                                    setData('accent_color', e.target.value.toUpperCase())
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <span
                                                                className="w-5 h-5 rounded-md border border-black/15 shrink-0 shadow-2xs"
                                                                style={{ backgroundColor: data.accent_color }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={data.accent_color}
                                                                onChange={(e) =>
                                                                    setData('accent_color', e.target.value.toUpperCase())
                                                                }
                                                                className="w-full text-[11px] font-mono font-bold text-[#17152E] dark:text-white bg-transparent focus:outline-none uppercase"
                                                            />
                                                        </div>
                                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    </label>
                                                </div>

                                                {/* Surface / Card */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-[#17152E] dark:text-slate-200 block">
                                                        Surface / Card
                                                    </label>
                                                    <label className="flex items-center justify-between gap-2 h-10 px-2.5 rounded-xl border border-border/90 bg-card cursor-pointer hover:border-[#7C3AED] transition-colors shadow-2xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                type="color"
                                                                value={data.surface_color}
                                                                onChange={(e) =>
                                                                    setData('surface_color', e.target.value.toUpperCase())
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <span
                                                                className="w-5 h-5 rounded-md border border-slate-300 shrink-0 shadow-2xs"
                                                                style={{ backgroundColor: data.surface_color }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={data.surface_color}
                                                                onChange={(e) =>
                                                                    setData('surface_color', e.target.value.toUpperCase())
                                                                }
                                                                className="w-full text-[11px] font-mono font-bold text-[#17152E] dark:text-white bg-transparent focus:outline-none uppercase"
                                                            />
                                                        </div>
                                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Quick Theme Presets */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-extrabold text-[#17152E] dark:text-slate-200 block">
                                                    Quick Theme Presets
                                                </label>
                                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                                                    {QUICK_THEME_PRESETS.map((preset) => {
                                                        const isSelected =
                                                            data.preset_key === preset.key ||
                                                            (data.primary_color.toUpperCase() ===
                                                                preset.primary_color.toUpperCase() &&
                                                                data.secondary_color.toUpperCase() ===
                                                                    preset.secondary_color.toUpperCase());

                                                        return (
                                                            <button
                                                                key={preset.key}
                                                                type="button"
                                                                onClick={() => handlePresetSelect(preset)}
                                                                title={preset.name}
                                                                className={`relative h-10 rounded-xl transition-all cursor-pointer flex items-center justify-end pr-2.5 ${
                                                                    isSelected
                                                                        ? 'ring-2 ring-[#5B21B6] ring-offset-2 scale-[1.02] shadow-sm'
                                                                        : 'opacity-90 hover:opacity-100 hover:scale-[1.02]'
                                                                }`}
                                                                style={{ background: preset.gradient }}
                                                            >
                                                                {isSelected && (
                                                                    <span className="w-5 h-5 rounded-full bg-[#4C1D95] text-white flex items-center justify-center shadow-xs border border-white/60">
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Live Theme Preview (Matches Reference Pic Faculty Workspace Mockup) */}
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-extrabold text-[#17152E] dark:text-slate-200">
                                                        Live Theme Preview
                                                    </label>
                                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                                        Applied automatically when {data.code || 'College'} faculty &amp; staff log in
                                                    </span>
                                                </div>

                                                <div className="rounded-2xl border border-border/90 overflow-hidden shadow-md flex min-h-[220px] bg-white">
                                                    {/* Mini Sidebar Preview */}
                                                    <div
                                                        className="w-44 sm:w-48 p-3.5 flex flex-col justify-between shrink-0 text-white transition-colors duration-300"
                                                        style={{ backgroundColor: data.secondary_color || '#4B2E83' }}
                                                    >
                                                        <div className="space-y-4">
                                                            {/* College Crest & Acronym */}
                                                            <div className="flex items-center gap-2.5 px-1">
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 bg-white/10"
                                                                    style={{ borderColor: data.primary_color || '#F9C400' }}
                                                                >
                                                                    {logoPreview ? (
                                                                        <img
                                                                            src={logoPreview}
                                                                            alt={data.code}
                                                                            className="w-full h-full object-contain"
                                                                        />
                                                                    ) : (
                                                                        <BookOpen
                                                                            className="w-4 h-4"
                                                                            style={{ color: data.primary_color || '#F9C400' }}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className="font-black text-sm tracking-tight text-white truncate">
                                                                    {data.code || 'CAS'}
                                                                </span>
                                                            </div>

                                                            {/* Nav Items */}
                                                            <div className="space-y-1.5 text-xs">
                                                                <div
                                                                    className="px-3 py-2 rounded-xl font-extrabold flex items-center gap-2 shadow-xs transition-colors duration-300"
                                                                    style={{
                                                                        backgroundColor: data.primary_color || '#F9C400',
                                                                        color: primaryTextContrast,
                                                                    }}
                                                                >
                                                                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                                                                    <span>Dashboard</span>
                                                                </div>
                                                                <div className="px-3 py-1.5 rounded-xl text-white/80 flex items-center gap-2 font-medium">
                                                                    <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                                                    <span>My Classes</span>
                                                                </div>
                                                                <div className="px-3 py-1.5 rounded-xl text-white/80 flex items-center gap-2 font-medium">
                                                                    <BarChart3 className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                                                    <span>Reports</span>
                                                                </div>
                                                                <div className="px-3 py-1.5 rounded-xl text-white/80 flex items-center gap-2 font-medium">
                                                                    <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                                                    <span className="truncate">College Resources</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mini Main Content Preview */}
                                                    <div
                                                        className="flex-1 p-4 flex flex-col justify-between relative overflow-hidden transition-colors duration-300"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${data.surface_color || '#FFFFFF'} 35%, ${data.accent_color || '#FFF3C4'} 100%)`,
                                                        }}
                                                    >
                                                        {/* Top Right Bell & User Avatar */}
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-600">
                                                                <Bell className="w-3 h-3" />
                                                            </div>
                                                            <div
                                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                                                style={{ backgroundColor: data.secondary_color || '#4B2E83' }}
                                                            >
                                                                <User className="w-3 h-3" />
                                                            </div>
                                                        </div>

                                                        {/* Greeting & College Name + Slogan */}
                                                        <div className="my-2 z-10">
                                                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                                                                Good afternoon, Faculty!
                                                            </h4>
                                                            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                                                                {data.name || 'College of Arts and Sciences'} ({data.code || 'CAS'})
                                                            </p>
                                                            {data.slogan && (
                                                                <p
                                                                    className="text-[10px] italic font-semibold mt-1"
                                                                    style={{ color: data.secondary_color || '#4B2E83' }}
                                                                >
                                                                    &ldquo;{data.slogan}&rdquo;
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* 3 Mini Metric Cards */}
                                                        <div className="grid grid-cols-3 gap-2.5 z-10 pt-2">
                                                            {[
                                                                { icon: Calendar, label: 'Schedule' },
                                                                { icon: Users, label: 'Classes' },
                                                                { icon: BarChart3, label: 'Compliance' },
                                                            ].map((item, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-2"
                                                                    style={{ backgroundColor: data.surface_color || '#FFFFFF' }}
                                                                >
                                                                    <div
                                                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                                        style={{
                                                                            backgroundColor: data.accent_color || '#FFF3C4',
                                                                            color: data.secondary_color || '#4B2E83',
                                                                        }}
                                                                    >
                                                                        <item.icon
                                                                            className="w-3.5 h-3.5"
                                                                            style={{ color: data.primary_color === '#FFFFFF' ? '#4B2E83' : data.primary_color }}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="h-1.5 w-3/4 rounded-full bg-slate-300" />
                                                                        <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stage 1: Identity */}
                            {activeStage === 'Identity' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                                1. College Identity &amp; Leadership
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Configure official college name, code, dean, and contact details.
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white hover:from-[#4C1D95] hover:to-[#5B21B6] font-bold text-xs rounded-xl cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">College Code / Acronym *</label>
                                            <input
                                                type="text"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">Unit Type</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={currentCollege.type}
                                                className="w-full h-10 rounded-xl border border-border bg-muted px-3 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Full Official College Name *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">College Dean / Unit Head</label>
                                            <input
                                                type="text"
                                                value={data.dean_name}
                                                onChange={(e) => setData('dean_name', e.target.value)}
                                                placeholder="e.g. Dr. Rebecca Miranda"
                                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">Official Contact Email</label>
                                            <input
                                                type="email"
                                                value={data.contact_email}
                                                onChange={(e) => setData('contact_email', e.target.value)}
                                                placeholder="dean@dssc.edu.ph"
                                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Building / Campus Location</label>
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="e.g. Academic Block A, DSSC Main Campus"
                                            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stage 3: Modules */}
                            {activeStage === 'Modules' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                                3. Enabled Velora Capability Modules
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Select which platform modules are enabled for {data.code}.
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white hover:from-[#4C1D95] hover:to-[#5B21B6] font-bold text-xs rounded-xl cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { key: 'scheduling', label: 'Semester Timetable & Generator', desc: 'Timetables, rooms, and AI loading' },
                                            { key: 'compliance', label: 'Compliance & Submissions', desc: 'Faculty syllabus and report submissions' },
                                            { key: 'faculty_attendance', label: 'Faculty Attendance Oversight', desc: 'Class check-ins & make-up classes' },
                                            { key: 'lab_monitoring', label: 'Lab & Facility Monitoring', desc: 'Laboratory in-charge schedules & EOD' },
                                            { key: 'tv_studio', label: 'Campus TV Studio Feed', desc: 'Digital signage highlights & playlists' },
                                            { key: 'performance', label: 'Faculty Recognition & Portfolios', desc: 'Accomplishment records & analytics' },
                                        ].map((mod) => (
                                            <div
                                                key={mod.key}
                                                onClick={() => toggleModule(mod.key)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                                                    data.enabled_modules[mod.key]
                                                        ? 'border-[#7C3AED]/50 bg-[#EDE9FE]/50 dark:bg-[#262246]/50'
                                                        : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <span className="font-bold text-xs block text-[#17152E] dark:text-white">
                                                        {mod.label}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground block">
                                                        {mod.desc}
                                                    </span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={!!data.enabled_modules[mod.key]}
                                                    onChange={() => {}}
                                                    className="rounded border-border text-[#7C3AED] focus:ring-[#7C3AED] shrink-0 mt-0.5"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stage 11: Activation */}
                            {activeStage === 'Activation' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                                11. Operational Activation &amp; Readiness
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Set the college lifecycle state and onboarding completion percentage.
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white hover:from-[#4C1D95] hover:to-[#5B21B6] font-bold text-xs rounded-xl cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>

                                    <div className="p-4 rounded-xl border border-[#7C3AED]/30 bg-[#EDE9FE]/50 dark:bg-[#262246]/40 space-y-1.5">
                                        <h4 className="font-bold text-xs text-[#5B21B6] dark:text-[#A78BFA]">
                                            Platform Readiness Check
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Activating this college allows assigned College Admins, Deans, Program Heads, and Faculty to access their themed operational portals.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">Operational Lifecycle Status</label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value as College['status'])}
                                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:ring-1 focus:ring-[#7C3AED]"
                                            >
                                                <option value="Not Configured">Not Configured</option>
                                                <option value="In Setup">In Setup (Configuration ongoing)</option>
                                                <option value="Ready">Ready (Pre-flight verified)</option>
                                                <option value="Active">Active (Live in Velora)</option>
                                                <option value="Suspended">Suspended (Temporarily restricted)</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold">Completion Progress (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={data.setup_progress}
                                                onChange={(e) =>
                                                    setData('setup_progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                                                }
                                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:ring-1 focus:ring-[#7C3AED]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other Stages (Admins, Programs, Facilities, Policies, Workflows, Reports, TV) */}
                            {activeStage !== 'Branding' &&
                                activeStage !== 'Identity' &&
                                activeStage !== 'Modules' &&
                                activeStage !== 'Activation' && (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                            <div>
                                                <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                                    Stage: {activeStage} Configuration
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    Governance standards and operational defaults for {data.code}.
                                                </p>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white hover:from-[#4C1D95] hover:to-[#5B21B6] font-bold text-xs rounded-xl cursor-pointer"
                                            >
                                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                                {processing ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>

                                        <div className="p-8 rounded-2xl border border-dashed border-[#A78BFA]/40 bg-[#F7F7FB]/60 dark:bg-[#1E1B38]/30 flex flex-col items-center justify-center text-center space-y-3">
                                            <div className="p-3.5 rounded-2xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA]">
                                                <Sliders className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-sm text-[#17152E] dark:text-white">
                                                    {activeStage} Baseline Ready for {data.code}
                                                </h4>
                                                <p className="text-xs text-muted-foreground max-w-md">
                                                    Default institutional configuration rules for {activeStage} are inherited from Davao Del Sur State College global governance standards.
                                                </p>
                                            </div>
                                            <div className="text-[11px] font-bold text-[#5B21B6] dark:text-[#A78BFA] bg-[#EDE9FE] dark:bg-[#262246] px-3.5 py-1.5 rounded-full border border-[#A78BFA]/30">
                                                ✓ Inherited from Institution Super Admin Defaults
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
