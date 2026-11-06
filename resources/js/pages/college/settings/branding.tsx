import React, { useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem, SharedData } from '@/types';
import {
    Palette,
    Building2,
    Paintbrush,
    RotateCcw,
    Save,
    Camera,
    Upload,
    Check,
    Lock,
    Sparkles,
    Eye,
    Shield,
    Layers,
    Tv,
    FileText,
    CheckCircle2,
    AlertCircle,
    Info,
    Layout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollegeData {
    id: number;
    name: string;
    code: string;
    acronym: string;
    dean_name: string | null;
    contact_email: string | null;
    logo_url: string | null;
    color_theme: string | null;
    branding: {
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        surface_color: string;
        dark_color?: string;
        preset_key?: string;
        slogan: string;
        short_name?: string;
        header_style?: string;
        sidebar_style?: string;
        report_header?: string;
        report_footer?: string;
        tv_theme?: string;
        logo_url?: string | null;
        is_inherited: boolean;
        inherited_from: string;
    };
    parent: {
        id: number;
        code: string;
        name: string;
    } | null;
}

interface Props {
    college: CollegeData;
    institutionBranding: Record<string, any>;
    parentEntityBranding: Record<string, any> | null;
    semanticColors: Record<string, string>;
}

const QUICK_THEME_PRESETS = [
    { key: 'amber', name: 'Gold & Slate', primary_color: '#F9C400', secondary_color: '#1E293B', accent_color: '#FEF3C7', surface_color: '#FFFFFF' },
    { key: 'purple', name: 'Ascend Purple', primary_color: '#7C3AED', secondary_color: '#4C1D95', accent_color: '#EDE9FE', surface_color: '#FFFFFF' },
    { key: 'blue', name: 'Royal Blue', primary_color: '#2563EB', secondary_color: '#1E3A8A', accent_color: '#DBEAFE', surface_color: '#FFFFFF' },
    { key: 'emerald', name: 'Forest Green', primary_color: '#059669', secondary_color: '#064E3B', accent_color: '#D1FAE5', surface_color: '#FFFFFF' },
    { key: 'crimson', name: 'Crimson Red', primary_color: '#DC2626', secondary_color: '#7F1D1D', accent_color: '#FEE2E2', surface_color: '#FFFFFF' },
    { key: 'teal', name: 'Ocean Teal', primary_color: '#0D9488', secondary_color: '#134E4A', accent_color: '#CCFBF1', surface_color: '#FFFFFF' },
];

export default function CollegeBrandSettings({ college, institutionBranding, parentEntityBranding, semanticColors }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(college.branding.logo_url || college.logo_url || null);
    const [activePreviewTab, setActivePreviewTab] = useState<'workspace' | 'report' | 'tv'>('workspace');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: `${college.code} Operations`, href: '/dashboard' },
        { title: 'College Settings', href: '/college/settings/branding' },
        { title: 'Brand & Visual Theme', href: '/college/settings/branding' },
    ];

    const currentBranding = college.branding;

    const { data, setData, post, processing } = useForm({
        primary_color: currentBranding.primary_color || '#7C3AED',
        secondary_color: currentBranding.secondary_color || '#4C1D95',
        accent_color: currentBranding.accent_color || '#EDE9FE',
        surface_color: currentBranding.surface_color || '#FFFFFF',
        dark_color: currentBranding.dark_color || '#17152E',
        preset_key: currentBranding.preset_key || 'purple',
        slogan: currentBranding.slogan || '',
        short_name: currentBranding.short_name || college.acronym || college.code,
        header_style: currentBranding.header_style || 'light',
        sidebar_style: currentBranding.sidebar_style || 'colored_active',
        report_header: currentBranding.report_header || `${college.name} (${college.code})`,
        report_footer: currentBranding.report_footer || 'ISO 9001:2015 Certified · Generated via Ascend Platform',
        tv_theme: currentBranding.tv_theme || 'college_glass',
        logo: null as File | null,
        remove_logo: false,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            setData('remove_logo', false);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setData('logo', null);
        setData('remove_logo', true);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePresetSelect = (preset: typeof QUICK_THEME_PRESETS[0]) => {
        setData({
            ...data,
            preset_key: preset.key,
            primary_color: preset.primary_color,
            secondary_color: preset.secondary_color,
            accent_color: preset.accent_color,
            surface_color: preset.surface_color,
        });
    };

    const handleResetToInstitution = () => {
        if (confirm(`Reset ${college.code} branding to inherit from parent entity and institutional defaults?`)) {
            router.post('/college/settings/branding/reset', {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setLogoPreview(institutionBranding.logo_url || null);
                },
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/college/settings/branding', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Brand & Theme · ${college.code} · College Settings`} />

            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Hidden File Input for Logo */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                />

                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-muted/30 to-card px-5 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors duration-200"
                            style={{
                                backgroundColor: `${data.primary_color}15`,
                                borderColor: `${data.primary_color}40`,
                                color: data.primary_color,
                            }}
                        >
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                                    {college.name}
                                </h1>
                                <span
                                    className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase text-white shadow-2xs"
                                    style={{ backgroundColor: data.primary_color }}
                                >
                                    {college.code}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Scope-Aware Visual Identity & Theme Configuration. Applied dynamically to all faculty, staff, and students within {college.code}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetToInstitution}
                            className="h-10 px-4 rounded-xl border-border bg-card hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            Reset to Institution Default
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="h-10 px-5 rounded-xl text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
                            style={{ backgroundColor: data.primary_color }}
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {processing ? 'Saving...' : 'Save Brand Settings'}
                        </Button>
                    </div>
                </div>

                {/* Inheritance Status Pill */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#7C3AED]" />
                        <span className="font-semibold text-foreground">Inheritance Hierarchy:</span>
                        <span className="text-muted-foreground">Institution ({institutionBranding.scope_code || 'DSSC'})</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="text-muted-foreground">{college.parent ? `Entity (${college.parent.code})` : 'Main Campus'}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-bold text-[#7C3AED]">College Scope ({college.code})</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#1E1B38] border border-border text-muted-foreground">
                        Status: {currentBranding.is_inherited ? `Inheriting from ${currentBranding.inherited_from}` : 'Custom College Override Active'}
                    </span>
                </div>

                {/* Main 2-Column Form & Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Form: Identity, Colors, Slogan, Report Header */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* College Visual Identity */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-2xs">
                            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
                                <Building2 className="w-4 h-4 text-[#7C3AED]" />
                                <h3 className="text-sm font-extrabold text-foreground">College Identity & Assets</h3>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                {/* Logo Avatar Squircle */}
                                <div className="relative group shrink-0">
                                    <div
                                        className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center p-2 bg-[#F7F7FB] dark:bg-[#131126] overflow-hidden shadow-xs transition-colors duration-200"
                                        style={{ borderColor: `${data.primary_color}60` }}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="w-10 h-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                                    >
                                        <Camera className="w-5 h-5 mb-1" />
                                        Change
                                    </button>
                                </div>

                                <div className="space-y-2 flex-1 text-center sm:text-left">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs font-bold rounded-xl"
                                        >
                                            <Upload className="w-3.5 h-3.5 mr-1" />
                                            Upload Logo
                                        </Button>
                                        {logoPreview && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleRemoveLogo}
                                                className="text-xs text-rose-500 hover:text-rose-600 rounded-xl"
                                            >
                                                Use Institution Default
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Recommended: Transparent PNG or SVG, at least 512 &times; 512 px. Displays in the header, TV studio, and official documents.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Wordmark / Short Name</label>
                                    <input
                                        type="text"
                                        value={data.short_name}
                                        onChange={(e) => setData('short_name', e.target.value)}
                                        placeholder="e.g. CIDS"
                                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">College Tagline / Slogan</label>
                                    <input
                                        type="text"
                                        value={data.slogan}
                                        onChange={(e) => setData('slogan', e.target.value)}
                                        placeholder="e.g. Knowledge. Creativity. Service to Society."
                                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Color Theme & Appearance */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3 border-b border-border/80">
                                <div className="flex items-center gap-2">
                                    <Paintbrush className="w-4 h-4 text-[#7C3AED]" />
                                    <h3 className="text-sm font-extrabold text-foreground">Theme Colors & CSS Tokens</h3>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                    Driven by CSS Variables
                                </span>
                            </div>

                            {/* Presets */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground">Quick Palette Presets</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {QUICK_THEME_PRESETS.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset)}
                                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                                data.preset_key === preset.key
                                                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30 bg-muted/40 font-bold'
                                                    : 'border-border hover:border-border/80'
                                            }`}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                                                style={{ backgroundColor: preset.primary_color }}
                                            />
                                            <span className="text-xs truncate">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Pickers */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground">Primary Brand</label>
                                    <div className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background">
                                        <input
                                            type="color"
                                            value={data.primary_color}
                                            onChange={(e) => setData('primary_color', e.target.value)}
                                            className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={data.primary_color}
                                            onChange={(e) => setData('primary_color', e.target.value)}
                                            className="w-full text-xs font-mono uppercase bg-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground">Secondary / Sidebar</label>
                                    <div className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background">
                                        <input
                                            type="color"
                                            value={data.secondary_color}
                                            onChange={(e) => setData('secondary_color', e.target.value)}
                                            className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={data.secondary_color}
                                            onChange={(e) => setData('secondary_color', e.target.value)}
                                            className="w-full text-xs font-mono uppercase bg-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground">Accent / Highlight</label>
                                    <div className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background">
                                        <input
                                            type="color"
                                            value={data.accent_color}
                                            onChange={(e) => setData('accent_color', e.target.value)}
                                            className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={data.accent_color}
                                            onChange={(e) => setData('accent_color', e.target.value)}
                                            className="w-full text-xs font-mono uppercase bg-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-foreground">Surface / Card</label>
                                    <div className="flex items-center gap-2 h-10 px-2 rounded-xl border border-border bg-background">
                                        <input
                                            type="color"
                                            value={data.surface_color}
                                            onChange={(e) => setData('surface_color', e.target.value)}
                                            className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={data.surface_color}
                                            onChange={(e) => setData('surface_color', e.target.value)}
                                            className="w-full text-xs font-mono uppercase bg-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Locked System Semantic Colors Notice */}
                            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>System Semantic Protection Guardrail</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Success, warning, and error colors are protected platform standards and cannot be altered by College Admins to ensure universal clarity across dashboards and audit alerts.
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1 text-[11px]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span>Success</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <span>Warning</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        <span>Destructive</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report & Signatory Defaults */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
                                <FileText className="w-4 h-4 text-[#7C3AED]" />
                                <h3 className="text-sm font-extrabold text-foreground">Official Documents & Letterhead</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">College Report Header</label>
                                    <input
                                        type="text"
                                        value={data.report_header}
                                        onChange={(e) => setData('report_header', e.target.value)}
                                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">College Accreditation / Letterhead Footer</label>
                                    <input
                                        type="text"
                                        value={data.report_footer}
                                        onChange={(e) => setData('report_footer', e.target.value)}
                                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Context Previews */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="sticky top-20 space-y-4">
                            {/* Preview Tabs */}
                            <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-[#7C3AED]" />
                                        <h3 className="text-sm font-extrabold text-foreground">Live Context Preview</h3>
                                    </div>
                                    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewTab('workspace')}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                activePreviewTab === 'workspace' ? 'bg-[#5B21B6] text-white' : 'text-muted-foreground'
                                            }`}
                                        >
                                            Portal UI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewTab('report')}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                activePreviewTab === 'report' ? 'bg-[#5B21B6] text-white' : 'text-muted-foreground'
                                            }`}
                                        >
                                            Report
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewTab('tv')}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                activePreviewTab === 'tv' ? 'bg-[#5B21B6] text-white' : 'text-muted-foreground'
                                            }`}
                                        >
                                            TV Studio
                                        </button>
                                    </div>
                                </div>

                                {activePreviewTab === 'workspace' && (
                                    <div className="space-y-3">
                                        {/* Mock Header */}
                                        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border shadow-2xs"
                                                    style={{ borderColor: `${data.primary_color}60` }}
                                                >
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="leading-tight">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-black text-foreground">Ascend</span>
                                                        <span className="text-xs font-black" style={{ color: data.primary_color }}>
                                                            {data.short_name || college.code}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-muted-foreground block truncate max-w-[180px]">
                                                        {college.name.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                                                style={{ backgroundColor: data.primary_color }}
                                            >
                                                Active Portal
                                            </div>
                                        </div>

                                        {/* Mock Sidebar & Content Frame */}
                                        <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-[#131126] flex min-h-[200px]">
                                            <div
                                                className="w-36 p-3 flex flex-col justify-between text-white shrink-0"
                                                style={{ backgroundColor: data.secondary_color }}
                                            >
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-bold tracking-wider opacity-70">
                                                        {college.code} NAVIGATION
                                                    </div>
                                                    <div
                                                        className="px-2 py-1 rounded-lg text-xs font-bold text-slate-900 shadow-xs"
                                                        style={{ backgroundColor: data.primary_color }}
                                                    >
                                                        Dashboard
                                                    </div>
                                                    <div className="px-2 py-1 text-xs opacity-80">Faculty Loading</div>
                                                    <div className="px-2 py-1 text-xs opacity-80">Class Schedules</div>
                                                    <div className="px-2 py-1 text-xs opacity-80">Requirements</div>
                                                </div>
                                            </div>
                                            <div className="p-3 flex-1 space-y-3 bg-muted/20">
                                                <div className="text-xs font-bold text-foreground">
                                                    Welcome to {college.code} Portal
                                                </div>
                                                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                                                    <div className="text-[10px] text-muted-foreground">Active Primary Accent</div>
                                                    <div
                                                        className="h-2 rounded-full w-2/3"
                                                        style={{ backgroundColor: data.primary_color }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs"
                                                    style={{ backgroundColor: data.primary_color }}
                                                >
                                                    Scope Primary Action
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activePreviewTab === 'report' && (
                                    <div className="rounded-xl border border-border bg-white dark:bg-card p-4 space-y-4 text-slate-900 dark:text-white">
                                        <div className="text-center pb-3 border-b border-border/80 space-y-1">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                Republic of the Philippines · Davao Del Sur State College
                                            </div>
                                            <h4 className="text-sm font-black tracking-tight" style={{ color: data.secondary_color }}>
                                                {data.report_header}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">{data.slogan}</p>
                                        </div>
                                        <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                                            Official Document Content / Matrix Area
                                        </div>
                                        <div className="text-center pt-2 border-t border-border/60 text-[9px] text-muted-foreground">
                                            {data.report_footer}
                                        </div>
                                    </div>
                                )}

                                {activePreviewTab === 'tv' && (
                                    <div
                                        className="rounded-xl border p-4 text-white space-y-3 shadow-lg"
                                        style={{ backgroundColor: data.secondary_color }}
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-white/20">
                                            <div className="flex items-center gap-2">
                                                <Tv className="w-4 h-4" />
                                                <span className="text-xs font-black">{college.code} TV STUDIO CHANNEL</span>
                                            </div>
                                            <span
                                                className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-950"
                                                style={{ backgroundColor: data.primary_color }}
                                            >
                                                LIVE DISPLAY
                                            </span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md space-y-1">
                                            <div className="text-sm font-black">{college.name}</div>
                                            <div className="text-xs opacity-90">{data.slogan}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

