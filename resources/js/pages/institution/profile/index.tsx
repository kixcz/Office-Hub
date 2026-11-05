import React, { useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Award,
    Building2,
    Camera,
    Check,
    ChevronDown,
    Clock,
    Eye,
    FileText,
    Globe,
    Layers,
    Link2,
    Mail,
    MapPin,
    RotateCcw,
    Save,
    Settings,
    Upload,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileData {
    name: string;
    acronym: string;
    address: string;
    timezone: string;
    email: string;
    website: string;
    logo_url: string;
    report_header: string;
    report_footer: string;
    last_updated?: string;
    report_config?: Record<string, any>;
}

interface Props {
    profile: ProfileData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Institution Management', href: '/institution/profile' },
    { title: 'Institution Profile', href: '/institution/profile' },
];

const TIMEZONE_OPTIONS = [
    'Asia/Manila (UTC+08:00)',
    'Asia/Singapore (UTC+08:00)',
    'Asia/Tokyo (UTC+09:00)',
    'UTC (UTC+00:00)',
];

export default function InstitutionProfile({ profile }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(
        profile.logo_url || '/velora_logo-removebg-preview.png',
    );
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        acronym: string;
        address: string;
        timezone: string;
        email: string;
        website: string;
        report_header: string;
        report_footer: string;
        logo: File | null;
    }>({
        name: profile.name || 'Davao Del Sur State College',
        acronym: profile.acronym || 'DSSC',
        address: profile.address || 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002',
        timezone: profile.timezone || 'Asia/Manila (UTC+08:00)',
        email: profile.email || 'president@dssc.edu.ph',
        website: profile.website || 'https://www.dssc.edu.ph',
        report_header: profile.report_header || 'Republic of the Philippines · DAVAO DEL SUR STATE COLLEGE',
        report_footer:
            profile.report_footer ||
            'ISO 9001:2015 Certified · Generated via Velora / COMPASS Institutional Governance Platform',
        logo: null,
    });

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setData('logo', file);
        setSelectedFileName(file.name);
        const objectUrl = URL.createObjectURL(file);
        setLogoPreview(objectUrl);
    };

    const handleResetChanges = () => {
        setData({
            name: profile.name,
            acronym: profile.acronym,
            address: profile.address,
            timezone: profile.timezone,
            email: profile.email,
            website: profile.website,
            report_header: profile.report_header,
            report_footer: profile.report_footer,
            logo: null,
        });
        setLogoPreview(profile.logo_url || '/velora_logo-removebg-preview.png');
        setSelectedFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/profile', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedFileName(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Profile · Platform Governance" />

            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Top Header Banner Card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#A78BFA]/30 bg-gradient-to-r from-[#F7F7FB] via-[#F3E8FF]/60 to-[#EDE9FE]/80 dark:from-[#17152E] dark:via-[#1E1B38] dark:to-[#262246] px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Soft decorative lavender wave */}
                    <div className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-72 rounded-full bg-[#A78BFA]/25 blur-2xl" />

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/40 shadow-2xs">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#17152E] dark:text-white leading-tight">
                                Institution Profile & Identity
                            </h1>
                            <p className="text-xs md:text-[13px] text-muted-foreground mt-0.5">
                                Institutional identity, official address, timezone, and report standards configuration.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <Link
                            href="/institution/global-defaults"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE] dark:bg-[#262246] dark:text-[#A78BFA] border border-[#A78BFA]/40 transition-colors shadow-2xs"
                        >
                            <Settings className="w-3.5 h-3.5 text-[#7C3AED]" />
                            Institution Settings
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pl-3 border-l border-border/80">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Last updated: {profile.last_updated || 'Nov 5, 2026, 10:24 AM'}</span>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Content Grid */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Hidden File Input for Logo Change */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleLogoSelect}
                        className="hidden"
                    />

                    {/* LEFT COLUMN (5 Cols): Institutional Identity Card */}
                    <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between space-y-5">
                        {/* Card Header */}
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-[#17152E] dark:text-white leading-snug">
                                    Institutional Identity
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Core institutional details and branding.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Logo Squircle with Camera Upload Trigger */}
                        <div className="flex flex-col items-center text-center pt-1">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                title="Click to upload or change the official Institution Logo"
                                className="group relative w-32 h-32 rounded-3xl bg-gradient-to-b from-[#FFFFFF] to-[#F3E8FF]/60 dark:from-[#1E1B38] dark:to-[#262246] border-2 border-[#A78BFA]/40 shadow-md p-4 flex items-center justify-center cursor-pointer hover:border-[#7C3AED] transition-all"
                            >
                                <img
                                    src={logoPreview}
                                    alt="Institutional Seal"
                                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/velora_logo-removebg-preview.png';
                                    }}
                                />

                                {/* Hover overlay hint */}
                                <div className="absolute inset-0 rounded-3xl bg-[#17152E]/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                                    <Upload className="w-4 h-4" />
                                    <span>Change Logo</span>
                                </div>

                                {/* Bottom-right Camera Badge */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="absolute bottom-2 right-2 h-8 w-8 rounded-xl bg-white dark:bg-[#17152E] text-[#5B21B6] dark:text-[#A78BFA] border border-[#A78BFA]/50 shadow-sm flex items-center justify-center hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                                    title="Change Logo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            {selectedFileName && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>New logo staged: {selectedFileName}</span>
                                </div>
                            )}
                            {errors.logo && (
                                <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.logo}</p>
                            )}

                            <h3 className="font-extrabold text-lg text-[#17152E] dark:text-white mt-4 leading-snug">
                                {data.name}
                            </h3>
                            <span className="inline-block mt-1.5 px-4 py-1 text-xs font-extrabold rounded-full bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA] border border-[#A78BFA]/40">
                                {data.acronym}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/70" />

                        {/* Metadata List */}
                        <div className="space-y-3.5 text-xs text-left">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-[#5B21B6] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-[#17152E] dark:text-white block">
                                        Official Address
                                    </span>
                                    <span className="text-muted-foreground leading-relaxed block mt-0.5">
                                        {data.address}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Globe className="w-4 h-4 text-[#5B21B6] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-[#17152E] dark:text-white block">
                                        System Timezone
                                    </span>
                                    <span className="text-muted-foreground block mt-0.5">{data.timezone}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-[#5B21B6] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-[#17152E] dark:text-white block">
                                        Institutional Email
                                    </span>
                                    <span className="text-muted-foreground block mt-0.5">{data.email}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Link2 className="w-4 h-4 text-[#5B21B6] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-[#17152E] dark:text-white block">
                                        Institution Website
                                    </span>
                                    <span className="text-muted-foreground block mt-0.5">{data.website}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Sub-card: Institution Seal / Brand Identity */}
                        <div className="rounded-2xl bg-[#F7F7FB] dark:bg-[#1E1B38] border border-[#A78BFA]/30 p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/40">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-[#17152E] dark:text-white">
                                        Institution Seal / Brand Identity
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Official seal, logo, and visual identity used in reports and letterheads.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPreviewModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#17152E] border border-border text-xs font-bold text-[#17152E] dark:text-white hover:border-[#7C3AED] transition-colors shrink-0 shadow-2xs cursor-pointer"
                            >
                                <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                                Preview
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (7 Cols): Stacked Configuration Cards */}
                    <div className="lg:col-span-7 flex flex-col gap-5">
                        {/* Card 1: Institutional Configuration Parameters */}
                        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-[#17152E] dark:text-white leading-snug">
                                            Institutional Configuration Parameters
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Core institutional information used across the platform.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A78BFA]/50 bg-[#F7F7FB] hover:bg-[#EDE9FE] dark:bg-[#1E1B38] text-[11px] font-bold text-[#5B21B6] dark:text-[#A78BFA] transition-colors shrink-0 cursor-pointer"
                                >
                                    <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
                                    Upload New Logo
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                    Full Legal Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full h-10 rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 text-xs font-semibold text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                />
                                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                        Acronym / Abbreviation *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.acronym}
                                        onChange={(e) => setData('acronym', e.target.value)}
                                        className="w-full h-10 rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 text-xs font-bold text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                        System Timezone *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.timezone}
                                            onChange={(e) => setData('timezone', e.target.value)}
                                            className="w-full h-10 rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 pr-9 text-xs font-medium text-[#17152E] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] cursor-pointer"
                                        >
                                            {TIMEZONE_OPTIONS.map((tz) => (
                                                <option key={tz} value={tz}>
                                                    {tz}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                    Official Campus Address *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 py-2.5 text-xs font-medium text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                />
                            </div>
                        </div>

                        {/* Card 2: Report & Letterhead Defaults */}
                        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-[#17152E] dark:text-white leading-snug">
                                        Report & Letterhead Defaults
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Default content and standards for institutional reports and documents.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                    Report Header Letterhead
                                </label>
                                <input
                                    type="text"
                                    value={data.report_header}
                                    onChange={(e) => setData('report_header', e.target.value)}
                                    className="w-full h-10 rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 font-mono text-xs font-semibold text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#17152E] dark:text-white block">
                                    Accreditation Footer Notice
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.report_footer}
                                    onChange={(e) => setData('report_footer', e.target.value)}
                                    className="w-full rounded-xl border border-border/80 bg-[#F7F7FB] dark:bg-[#131126] px-3.5 py-2.5 font-mono text-xs font-medium text-[#17152E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                                />
                            </div>
                        </div>

                        {/* Card 3: Branding & Identity Rules */}
                        <div className="rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] dark:bg-[#262246] text-[#5B21B6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border border-[#A78BFA]/30">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white leading-snug">
                                        Branding & Identity Rules
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                        Institutional reports, letterheads, and branding follow central platform standards and are inherited by all colleges and units.
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA] border border-[#A78BFA]/40 shrink-0 self-start sm:self-center">
                                <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                                Inherited from Platform Standards
                            </span>
                        </div>

                        {/* Bottom Action Buttons Row */}
                        <div className="flex items-center justify-end gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetChanges}
                                className="h-11 px-5 rounded-xl border-border/90 bg-card text-xs font-bold text-[#17152E] dark:text-white hover:bg-muted/60 cursor-pointer shadow-2xs"
                            >
                                <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" />
                                Reset Changes
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 px-6 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs shadow-md shadow-[#5B21B6]/20 cursor-pointer"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving Changes...' : 'Save Institution Profile'}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Brand Identity & Letterhead Preview Modal */}
                {isPreviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2.5">
                                    <Award className="w-5 h-5 text-[#7C3AED]" />
                                    <h3 className="text-base font-extrabold text-[#17152E] dark:text-white">
                                        Official Letterhead & Brand Identity Preview
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Simulated Official Document Header & Footer */}
                            <div className="rounded-xl border border-border bg-white text-slate-900 p-6 shadow-inner space-y-6">
                                <div className="flex items-center gap-4 border-b-2 border-[#4C1D95] pb-4">
                                    <img
                                        src={logoPreview}
                                        alt="Seal"
                                        className="w-16 h-16 object-contain shrink-0"
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                            {data.report_header}
                                        </p>
                                        <h4 className="text-base font-black text-[#17152E] uppercase">
                                            {data.name} ({data.acronym})
                                        </h4>
                                        <p className="text-[11px] text-slate-600">{data.address}</p>
                                    </div>
                                </div>

                                <div className="py-6 text-center text-xs text-slate-400 italic">
                                    [ Institutional Report Body & Verified Academic Governance Metrics ]
                                </div>

                                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                    <span>{data.report_footer}</span>
                                    <span>{data.timezone}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPreviewModalOpen(false);
                                        fileInputRef.current?.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B21B6] hover:underline cursor-pointer"
                                >
                                    <Camera className="w-4 h-4" />
                                    Change Official Logo
                                </button>
                                <Button
                                    type="button"
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold rounded-xl"
                                >
                                    Close Preview
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
