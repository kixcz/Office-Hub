import React, { useState } from 'react';
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
    Check
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Display Settings', href: '/tv-config/settings' },
];

interface SystemStatus {
    connected_name: string;
    is_online: boolean;
    refresh_rate_seconds: number;
    active_slides_count: number;
    privacy_mode: string;
    privacy_badge: string;
    last_updated: string;
    last_updated_by: string;
}

interface Props {
    settings: {
        display_name: string;
        academic_term: string;
        default_audience: string;
        refresh_interval: string;

        fullscreen_mode: string;
        auto_rotate: string;
        slide_duration: string;
        transition_speed: string;
        display_mode: string; // fit | fill | contain
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
    };
    system_status?: SystemStatus;
}

// Custom animated toggle switch component matching the pill design in mockup
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
                "w-11 h-6 flex items-center rounded-full p-0.75 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                checked ? "bg-blue-600 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
            )}
        >
            <span
                className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out",
                    checked ? "translate-x-0" : "translate-x-0"
                )}
            />
        </button>
    );
}

export default function DisplaySettingsIndex({ settings, system_status }: Props) {
    const { data, setData, post, processing } = useForm({
        settings: {
            display_name: settings.display_name || 'CIDS Office TV',
            academic_term: settings.academic_term || 'AY 2026-2027, 1st Semester',
            default_audience: settings.default_audience || 'Internal Staff',
            refresh_interval: settings.refresh_interval || '60',

            fullscreen_mode: settings.fullscreen_mode === '1',
            auto_rotate: settings.auto_rotate === '1',
            slide_duration: settings.slide_duration || '10',
            transition_speed: settings.transition_speed || 'Medium (0.5s)',
            display_mode: settings.display_mode || 'fit',
            repeat_playlist: settings.repeat_playlist === '1',

            show_clock: settings.show_clock === '1',
            show_footer: settings.show_footer === '1',
            show_slide_title: settings.show_slide_title === '1',
            show_status_labels: settings.show_status_labels === '1',
            enable_empty_state: settings.enable_empty_state === '1',

            allow_faculty_names: settings.allow_faculty_names === '1',
            enable_internal_slides: settings.enable_internal_slides === '1',
            hide_sensitive_compliance: settings.hide_sensitive_compliance === '1',
            audience_mode: settings.audience_mode || 'Internal Staff',
        }
    });

    const [isSavedSuccess, setIsSavedSuccess] = useState(false);

    const updateSetting = (key: string, value: any) => {
        setData('settings', {
            ...data.settings,
            [key]: value
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            settings: {
                ...data.settings,
                fullscreen_mode: data.settings.fullscreen_mode ? '1' : '0',
                auto_rotate: data.settings.auto_rotate ? '1' : '0',
                repeat_playlist: data.settings.repeat_playlist ? '1' : '0',
                show_clock: data.settings.show_clock ? '1' : '0',
                show_footer: data.settings.show_footer ? '1' : '0',
                show_slide_title: data.settings.show_slide_title ? '1' : '0',
                show_status_labels: data.settings.show_status_labels ? '1' : '0',
                enable_empty_state: data.settings.enable_empty_state ? '1' : '0',
                allow_faculty_names: data.settings.allow_faculty_names ? '1' : '0',
                enable_internal_slides: data.settings.enable_internal_slides ? '1' : '0',
                hide_sensitive_compliance: data.settings.hide_sensitive_compliance ? '1' : '0',
            }
        };

        post('/tv-config/settings', {
            data: payload,
            onSuccess: () => {
                setIsSavedSuccess(true);
                setTimeout(() => setIsSavedSuccess(false), 3000);
            }
        } as any);
    };

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = () => {
        setIsResetConfirmOpen(true);
    };

    const confirmReset = () => {
        setIsResetting(true);
        router.post('/tv-config/settings/reset', {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsResetting(false);
                setIsResetConfirmOpen(false);
            },
        });
    };

    const status = system_status || {
        connected_name: 'CIDS Office TV',
        is_online: true,
        refresh_rate_seconds: 60,
        active_slides_count: 12,
        privacy_mode: 'Internal Staff',
        privacy_badge: 'Restricted',
        last_updated: 'October 13, 2026, 11:32 AM',
        last_updated_by: 'System Admin',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV Display Settings" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                
                {/* 1. Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <Tv className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                TV Display Settings
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Configure global display behavior, privacy, refresh rules, and viewing preferences.
                            </p>
                        </div>
                    </div>

                    {/* Preview TV Display Action Button */}
                    <a
                        href="/tv-display"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl shadow-2xs transition-all w-fit"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview TV Display</span>
                    </a>
                </div>

                {/* Main 2-Column Grid */}
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* LEFT COLUMN: Configuration Sections (2/3 width) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            
                            {/* SECTION 1: General Display Settings */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                <div className="flex items-start gap-3.5 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                        <Settings className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                            General Display Settings
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Basic information and global configuration for your TV display.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* TV Display Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            TV Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings.display_name}
                                            onChange={(e) => updateSetting('display_name', e.target.value)}
                                            placeholder="CIDS Office TV"
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                                        />
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            e.g. Lobby Display, Main Hall TV, Internal Staff Display
                                        </p>
                                    </div>

                                    {/* Academic Term Label */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Academic Term Label
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings.academic_term}
                                            onChange={(e) => updateSetting('academic_term', e.target.value)}
                                            placeholder="AY 2026-2027, 1st Semester"
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                                        />
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Displayed on header and content slides.
                                        </p>
                                    </div>

                                    {/* Default Display Audience */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Default Display Audience
                                        </label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-slate-500" />
                                                        <span>{data.settings.default_audience}</span>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-56">
                                                <DropdownMenuItem onClick={() => updateSetting('default_audience', 'Internal Staff')}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Internal Staff
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateSetting('default_audience', 'Public / Students')}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Public / Students
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateSetting('default_audience', 'Faculty Only')}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Faculty Only
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Determines default content visibility.
                                        </p>
                                    </div>

                                    {/* Data Refresh Interval */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Data Refresh Interval (seconds)
                                        </label>
                                        <div className="relative">
                                            <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                min="10"
                                                value={data.settings.refresh_interval}
                                                onChange={(e) => updateSetting('refresh_interval', e.target.value)}
                                                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            How often to fetch latest content from the system.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Playback & Screen Behavior */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                <div className="flex items-start gap-3.5 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                        <Play className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                            Playback & Screen Behavior
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Control how content is displayed and transitions between slides.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Left Toggles and Slide Duration */}
                                    <div className="flex flex-col gap-5">
                                        {/* Enable Fullscreen Mode */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Enable Fullscreen Mode
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    Hide browser UI and show in fullscreen.
                                                </p>
                                            </div>
                                            <ToggleSwitch
                                                checked={data.settings.fullscreen_mode}
                                                onChange={(c) => updateSetting('fullscreen_mode', c)}
                                            />
                                        </div>

                                        {/* Auto-rotate Playlist */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Auto-rotate Playlist
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    Automatically cycle through slides.
                                                </p>
                                            </div>
                                            <ToggleSwitch
                                                checked={data.settings.auto_rotate}
                                                onChange={(c) => updateSetting('auto_rotate', c)}
                                            />
                                        </div>

                                        {/* Default Slide Duration */}
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Default Slide Duration (seconds)
                                            </label>
                                            <div className="relative">
                                                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    min="3"
                                                    value={data.settings.slide_duration}
                                                    onChange={(e) => updateSetting('slide_duration', e.target.value)}
                                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Time to display each slide before transitioning.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Transition Speed, Display Mode, Repeat Playlist */}
                                    <div className="flex flex-col gap-5">
                                        {/* Transition Speed */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Transition Speed
                                            </label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <span>{data.settings.transition_speed}</span>
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem onClick={() => updateSetting('transition_speed', 'Fast (0.3s)')}>
                                                        Fast (0.3s)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateSetting('transition_speed', 'Medium (0.5s)')}>
                                                        Medium (0.5s)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateSetting('transition_speed', 'Slow (1.0s)')}>
                                                        Slow (1.0s)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Animation speed between slides.
                                            </p>
                                        </div>

                                        {/* Display Mode (Fit to Screen, Fill Screen, Contain) */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Display Mode
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateSetting('display_mode', 'fit')}
                                                    className={cn(
                                                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all border",
                                                        data.settings.display_mode === 'fit'
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                            : "bg-slate-50/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                                    )}
                                                >
                                                    <Maximize className="w-3.5 h-3.5" />
                                                    <span>Fit to Screen</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateSetting('display_mode', 'fill')}
                                                    className={cn(
                                                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all border",
                                                        data.settings.display_mode === 'fill'
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                            : "bg-slate-50/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                                    )}
                                                >
                                                    <Monitor className="w-3.5 h-3.5" />
                                                    <span>Fill Screen</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateSetting('display_mode', 'contain')}
                                                    className={cn(
                                                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all border",
                                                        data.settings.display_mode === 'contain'
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                            : "bg-slate-50/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                                    )}
                                                >
                                                    <Maximize2 className="w-3.5 h-3.5" />
                                                    <span>Contain</span>
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                How slides should scale on the display.
                                            </p>
                                        </div>

                                        {/* Repeat Playlist Toggle */}
                                        <div className="flex items-center justify-between gap-4 pt-1">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Repeat Playlist
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    Restart from the first slide when playlist ends.
                                                </p>
                                            </div>
                                            <ToggleSwitch
                                                checked={data.settings.repeat_playlist}
                                                onChange={(c) => updateSetting('repeat_playlist', c)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: System Status Card (1/3 width) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col gap-5">
                            {/* Card Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                    <Activity className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                        System Status
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Current status and information about the TV display.
                                    </p>
                                </div>
                            </div>

                            {/* Status Item 1: Connected Display Name & Online badge */}
                            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                        <Monitor className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                                            Connected Display Name
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {data.settings.display_name || status.connected_name}
                                        </span>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Online
                                </span>
                            </div>

                            {/* Status Item 2: Refresh Rate */}
                            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                                        Refresh Rate
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {data.settings.refresh_interval} seconds
                                    </span>
                                </div>
                            </div>

                            {/* Status Item 3: Active Slides with Arrow */}
                            <Link 
                                href="/tv-config/slides"
                                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                                            Active Slides
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {status.active_slides_count} slides
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                            </Link>

                            {/* Status Item 4: Privacy Mode */}
                            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                                            Privacy Mode
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {data.settings.default_audience}
                                        </span>
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                    {status.privacy_badge}
                                </span>
                            </div>

                            {/* Status Item 5: Last Updated */}
                            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                                        Last Updated
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                        {status.last_updated}
                                    </span>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                        by {status.last_updated_by}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM ROW: Visibility & Interface Elements + Privacy & Content Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CARD 3: Visibility & Interface Elements */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-start gap-3.5 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                        <Monitor className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                            Visibility & Interface Elements
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Choose which interface elements and information to show on the TV display.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Show Clock and Date */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.show_clock}
                                            onChange={(c) => updateSetting('show_clock', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Show Clock and Date
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Display current time and date on screen.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Show Status Labels */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.show_status_labels}
                                            onChange={(c) => updateSetting('show_status_labels', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Show Status Labels
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Show system status and information labels.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Show Global Footer Ticker */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.show_footer}
                                            onChange={(c) => updateSetting('show_footer', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Show Global Footer Ticker
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Show announcements or important messages.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Enable Empty-state Messages */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.enable_empty_state}
                                            onChange={(c) => updateSetting('enable_empty_state', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Enable Empty-state Messages
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Show helpful messages when no content is available.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Show Slide Title */}
                                    <div className="flex items-start justify-between gap-3 sm:col-span-2">
                                        <ToggleSwitch
                                            checked={data.settings.show_slide_title}
                                            onChange={(c) => updateSetting('show_slide_title', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Show Slide Title
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Display title of current slide.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Privacy & Content Rules */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-start gap-3.5 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                                        <Shield className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                            Privacy & Content Rules
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Manage content visibility and privacy rules for different audiences.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                    {/* Allow Faculty Names */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.allow_faculty_names}
                                            onChange={(c) => updateSetting('allow_faculty_names', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Allow Faculty Names
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Display faculty names in announcements and slides.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hide Sensitive Compliance Details */}
                                    <div className="flex items-start justify-between gap-3">
                                        <ToggleSwitch
                                            checked={data.settings.hide_sensitive_compliance}
                                            onChange={(c) => updateSetting('hide_sensitive_compliance', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Hide Sensitive Compliance Details on Public Displays
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Automatically hide sensitive or confidential information.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Enable Internal-only Slides */}
                                    <div className="flex items-start justify-between gap-3 sm:col-span-2">
                                        <ToggleSwitch
                                            checked={data.settings.enable_internal_slides}
                                            onChange={(c) => updateSetting('enable_internal_slides', c)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Enable Internal-only Slides
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Allow slides to be tagged as internal only (visible to staff only).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audience Mode Selector Bar */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Audience Mode
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                                        >
                                            <Users className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{data.settings.audience_mode}</span>
                                            <span className="text-[11px] text-slate-400 font-normal ml-1">
                                                Controls overall content visibility and filtering behavior.
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => updateSetting('audience_mode', 'Internal Staff')}>
                                            Internal Staff
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateSetting('audience_mode', 'Public / Students')}>
                                            Public / Students
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateSetting('audience_mode', 'Faculty Only')}>
                                            Faculty Only
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS BAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        {/* Left Action Buttons: Save Settings & Reset to Default */}
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs transition-colors"
                            >
                                <RotateCcw className="w-4 h-4 text-slate-500" />
                                <span>Reset to Default</span>
                            </button>

                            {isSavedSuccess && (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                                    <Check className="w-4 h-4" />
                                    Changes saved!
                                </span>
                            )}
                        </div>

                        {/* Right Action Button: Reset Changes */}
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span>Reset Changes</span>
                        </button>
                    </div>
                </form>

                {/* Reset Settings Confirmation Modal */}
                <DeleteConfirmDialog
                    open={isResetConfirmOpen}
                    onOpenChange={setIsResetConfirmOpen}
                    title="Reset All TV Display Settings"
                    description="Are you sure you want to restore all TV display configurations to factory defaults? Custom slide timers, screen orientation, and styling overrides will be lost."
                    confirmLabel="Reset All Settings"
                    isDeleting={isResetting}
                    onConfirm={confirmReset}
                />
            </div>
        </AppLayout>
    );
}
