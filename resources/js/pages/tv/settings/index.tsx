import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, Link, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    Tv,
    Eye,
    Settings,
    Play,
    LayoutGrid,
    Shield,
    Activity,
    RefreshCw,
    Layers,
    Clock,
    ChevronRight,
    RotateCcw,
    Save,
    Trash2,
    Users,
    Maximize2,
    Monitor,
    Maximize,
    ChevronDown,
    Check,
    Sparkles,
    ShieldAlert,
    QrCode,
    Sliders,
    Building2,
    Lock,
    ExternalLink
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TvStudioLayout } from '@/components/tv-studio-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Display Settings', href: '/tv-config/settings' },
];

interface Device {
    id: number;
    name: string;
    device_code: string;
    location: string;
    audience_mode: string;
    default_playlist: string;
    default_slide_duration: number;
    transition_type: string;
    screen_resolution: string;
    safe_area_margin: string;
    is_online: boolean;
}

interface SystemStatus {
    connected_name: string;
    is_online: boolean;
    refresh_rate_seconds: number;
    active_slides_count: number;
    privacy_mode: string;
    privacy_badge: string;
    last_updated: string;
    last_updated_by: string;
    tv_pairing_code?: string;
    tv_pairing_code_generated_at?: string;
}

interface Props {
    settings: {
        display_name: string;
        academic_term: string;
        default_audience: string;
        refresh_interval: string;
        tv_pairing_code?: string;
        tv_pairing_code_generated_at?: string;

        fullscreen_mode: string;
        auto_rotate: string;
        slide_duration: string;
        transition_speed: string;
        display_mode: string;
        repeat_playlist: string;

        show_clock: string;
        show_footer: string;
        show_slide_title: string;
        show_status_labels: string;
        enable_empty_state: string;

        allow_faculty_names: string;
        enable_internal_slides: string;
        hide_sensitive_compliance: string;
        audience_mode: string;

        screen_resolution?: string;
        safe_area_margin?: string;
        display_timezone?: string;
        allow_manual_controls?: string;
        auto_launch_on_refresh?: string;
        fallback_screen?: string;
        emergency_takeover_enabled?: string;
    };
    devices?: Device[];
    selected_device?: Device;
    system_status?: SystemStatus;
}

function ToggleSwitch({
    checked,
    onChange,
    id
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            id={id}
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                "w-11 h-6 flex items-center rounded-full p-0.75 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer",
                checked ? "bg-amber-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
            )}
        >
            <span
                className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out"
                )}
            />
        </button>
    );
}

export default function TvDisplaySettingsPage({ settings, devices = [], selected_device, system_status }: Props) {
    const [selectedDeviceId, setSelectedDeviceId] = useState<number | string>(selected_device?.id || devices[0]?.id || 'global');

    const form = useForm({
        device_id: selected_device?.id || null,
        settings: {
            display_name: settings.display_name || 'CIDS Office TV',
            academic_term: settings.academic_term || 'AY 2026-2027, 1st Semester',
            default_audience: settings.default_audience || 'Internal Staff',
            refresh_interval: settings.refresh_interval || '60',

            fullscreen_mode: settings.fullscreen_mode === '1',
            auto_rotate: settings.auto_rotate === '1',
            slide_duration: settings.slide_duration || '15',
            transition_speed: settings.transition_speed || 'fade',
            display_mode: settings.display_mode || 'fit',
            repeat_playlist: settings.repeat_playlist === '1',

            show_header: settings.show_header !== '0',
            show_clock: settings.show_clock !== '0',
            show_footer: settings.show_footer !== '0',
            show_slide_title: settings.show_slide_title !== '0',
            show_status_labels: settings.show_status_labels !== '0',
            enable_empty_state: settings.enable_empty_state !== '0',

            allow_faculty_names: settings.allow_faculty_names === '1',
            enable_internal_slides: settings.enable_internal_slides === '1',
            hide_sensitive_compliance: settings.hide_sensitive_compliance === '1',
            audience_mode: settings.audience_mode || 'Internal Staff',

            screen_resolution: settings.screen_resolution || '1920x1080',
            safe_area_margin: settings.safe_area_margin || 'normal',
            display_timezone: settings.display_timezone || 'Asia/Manila',
            allow_manual_controls: settings.allow_manual_controls === '1',
            auto_launch_on_refresh: settings.auto_launch_on_refresh === '1',
            fallback_screen: settings.fallback_screen || 'logo_welcome',
            emergency_takeover_enabled: settings.emergency_takeover_enabled === '1',
        }
    });

    const activeDevice = devices.find(d => d.id === Number(selectedDeviceId)) || selected_device || devices[0];

    React.useEffect(() => {
        if (activeDevice?.id && form.data.device_id !== activeDevice.id) {
            form.setData('device_id', activeDevice.id);
        }
    }, [activeDevice?.id]);

    const handleDeviceSwitch = (deviceId: number) => {
        setSelectedDeviceId(deviceId);
        router.get('/tv-config/settings', { device_id: deviceId }, { preserveState: false });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/tv-config/settings', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Display Settings - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <Settings className="w-4 h-4" />
                                <span>Global Screen Operation & Hardware Controls</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                TV Display Settings
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                                Configure television hardware behaviors, device-specific audience modes, rotation parameters, safe margins, and public vs internal privacy controls. Changes reflect instantly on live displays.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={activeDevice ? `/tv-display/${activeDevice.device_code}` : '/tv-display'}
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open This Display</span>
                            </Link>
                        </div>
                    </div>

                    {/* Device Selector Card */}
                    {devices.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Active TV Screen Configuration
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Configure parameters per television screen or apply globally.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                                {devices.map((dev) => (
                                    <button
                                        key={dev.id}
                                        type="button"
                                        onClick={() => handleDeviceSwitch(dev.id)}
                                        className={cn(
                                            "px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2 cursor-pointer",
                                            activeDevice?.id === dev.id
                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                        )}
                                    >
                                        <span className={cn("w-2 h-2 rounded-full", dev.is_online ? "bg-emerald-500" : "bg-slate-400")} />
                                        <span>{dev.name}</span>
                                        <span className="text-[10px] opacity-75 font-mono">[{dev.audience_mode.toUpperCase()}]</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* LEFT COLUMN: Hardware, Rotation & Display (2 cols) */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* 1. Display Hardware & Resolution */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 sm:p-6 space-y-5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        <Tv className="w-4 h-4" />
                                        <span>Display Hardware & Safe Margins</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Display Device Name
                                            </label>
                                            <input
                                                type="text"
                                                value={form.data.settings.display_name}
                                                onChange={(e) => form.setData('settings', { ...form.data.settings, display_name: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Target Screen Resolution
                                            </label>
                                            <select
                                                value={form.data.settings.screen_resolution}
                                                onChange={(e) => form.setData('settings', { ...form.data.settings, screen_resolution: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                            >
                                                <option value="1920x1080">1920 × 1080 (Full HD 16:9 Standard)</option>
                                                <option value="3840x2160">3840 × 2160 (4K UHD TV)</option>
                                                <option value="1366x768">1366 × 768 (Commercial Wall Monitor)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Safe-Area Margins (Overscan Protection)
                                            </label>
                                            <select
                                                value={form.data.settings.safe_area_margin}
                                                onChange={(e) => form.setData('settings', { ...form.data.settings, safe_area_margin: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                            >
                                                <option value="none">None (0px padding - Edge to edge)</option>
                                                <option value="compact">Compact (16px safe margin)</option>
                                                <option value="normal">Normal (32px safe margin recommended for TVs)</option>
                                                <option value="spacious">Spacious (48px safe margin)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Fallback Screen (If No Active Playlist)
                                            </label>
                                            <select
                                                value={form.data.settings.fallback_screen}
                                                onChange={(e) => form.setData('settings', { ...form.data.settings, fallback_screen: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                            >
                                                <option value="logo_welcome">CIDS University Emblem & Welcome Banner</option>
                                                <option value="black_screen">Blank Black Canvas</option>
                                                <option value="maintenance">Office Schedule Under Maintenance Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Automatic Full-Screen</span>
                                                <span className="text-[11px] text-slate-400">Request native fullscreen on browser launch</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.fullscreen_mode}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, fullscreen_mode: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Emergency Takeover Alerts</span>
                                                <span className="text-[11px] text-slate-400">Allow critical Spotlights to override queue</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.emergency_takeover_enabled}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, emergency_takeover_enabled: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Rotation & Timings */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 sm:p-6 space-y-5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        <Clock className="w-4 h-4" />
                                        <span>Rotation Timings & Dynamic Transitions</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Default Slide Duration
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="120"
                                                    value={form.data.settings.slide_duration}
                                                    onChange={(e) => form.setData('settings', { ...form.data.settings, slide_duration: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">sec</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Transition Effect
                                            </label>
                                            <select
                                                value={form.data.settings.transition_speed}
                                                onChange={(e) => form.setData('settings', { ...form.data.settings, transition_speed: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                            >
                                                <option value="fade">Smooth Fade (500ms)</option>
                                                <option value="slide">Horizontal Slide (400ms)</option>
                                                <option value="zoom">Scale Zoom (500ms)</option>
                                                <option value="instant">Instant Cut (0ms)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Data Refresh Interval
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="3600"
                                                    value={form.data.settings.refresh_interval}
                                                    onChange={(e) => form.setData('settings', { ...form.data.settings, refresh_interval: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">sec</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Auto-Rotate Playlist</span>
                                                <span className="text-[11px] text-slate-400">Advance slides automatically on countdown</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.auto_rotate}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, auto_rotate: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Manual Arrow Controls</span>
                                                <span className="text-[11px] text-slate-400">Enable keyboard & on-screen navigation</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.allow_manual_controls}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, allow_manual_controls: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Header & Footer Presentation */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 sm:p-6 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        <Layers className="w-4 h-4" />
                                        <span>Display Chrome, Header & Footers</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Show Official Header</span>
                                                <span className="text-[11px] text-slate-400">CIDS emblem, college banner & clock</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.show_header}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, show_header: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Show Progress Footer</span>
                                                <span className="text-[11px] text-slate-400">Slide pagination ticks & pause indicator</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.show_footer}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, show_footer: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Synchronized Clock</span>
                                                <span className="text-[11px] text-slate-400">Accurate Philippine Standard Time</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.show_clock}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, show_clock: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block">Show Slide Category Labels</span>
                                                <span className="text-[11px] text-slate-400">Badge indicating slide module type</span>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.data.settings.show_status_labels}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, show_status_labels: val })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Audience Mode, Privacy & Actions (1 col) */}
                            <div className="space-y-6">

                                {/* Audience & Privacy Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        <Shield className="w-4 h-4" />
                                        <span>Audience & Privacy Filter</span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Display Mode
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => form.setData('settings', {
                                                    ...form.data.settings,
                                                    audience_mode: 'Internal Staff',
                                                    allow_faculty_names: true,
                                                    hide_sensitive_compliance: false
                                                })}
                                                className={cn(
                                                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                                    form.data.settings.audience_mode === 'Internal Staff'
                                                        ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                                                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                                )}
                                            >
                                                <span className="font-black text-xs block">Internal Mode</span>
                                                <span className="text-[10px] opacity-75">Dean's office, faculty names, full compliance metrics</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => form.setData('settings', {
                                                    ...form.data.settings,
                                                    audience_mode: 'Public',
                                                    allow_faculty_names: false,
                                                    hide_sensitive_compliance: true
                                                })}
                                                className={cn(
                                                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                                    form.data.settings.audience_mode === 'Public'
                                                        ? "bg-sky-500/10 border-sky-500 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20"
                                                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                                )}
                                            >
                                                <span className="font-black text-xs block">Public Mode</span>
                                                <span className="text-[10px] opacity-75">Hallways, guest screens, sanitized records</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-600 dark:text-slate-300">Allow Faculty Names</span>
                                            <ToggleSwitch
                                                checked={form.data.settings.allow_faculty_names}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, allow_faculty_names: val })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-600 dark:text-slate-300">Hide Sensitive Compliance</span>
                                            <ToggleSwitch
                                                checked={form.data.settings.hide_sensitive_compliance}
                                                onChange={(val) => form.setData('settings', { ...form.data.settings, hide_sensitive_compliance: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pairing Code Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <span>Display Pairing Code</span>
                                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-900 text-center border border-slate-800 font-mono text-lg font-black text-amber-400 tracking-widest">
                                        {settings.tv_pairing_code || 'CIDS-2026'}
                                    </div>

                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        Physical television smart browsers can pair instantly by entering this access code at <code className="text-amber-600 dark:text-amber-400 font-bold">/tv-display</code>.
                                    </p>
                                </div>

                                {/* Save Button Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{form.processing ? 'Broadcasting Changes...' : 'Save & Broadcast Settings'}</span>
                                    </button>

                                    <p className="text-[11px] text-center text-slate-400">
                                        Changes take effect immediately on all connected display screens.
                                    </p>
                                </div>

                            </div>
                        </div>
                    </form>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
