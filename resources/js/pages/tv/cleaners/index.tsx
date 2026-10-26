import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import {
    Sparkles,
    Calendar,
    Users,
    Save,
    RotateCcw,
    Eye,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Building2,
    ShieldCheck,
    Heart,
    Sliders,
    Search,
    UserCheck,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Cleaners Schedule Slide', href: '/tv-config/cleaners' },
];

interface FacultyOption {
    id: number;
    name: string;
    initials: string;
    academic_rank?: string;
    program_name?: string;
    program_code?: string;
    photo_url?: string;
}

interface CleanerEntry {
    name: string;
    initials: string;
    role: string;
    faculty_id?: number | null;
    photo_url?: string | null;
}

interface DayData {
    day: string;
    date_label: string;
    day_number: number;
    slogan: string;
    cleaners: CleanerEntry[];
}

interface ScheduleModel {
    id: number;
    title: string;
    subtitle: string;
    scope_badge: string;
    motto_title: string;
    motto_description: string;
    week_label: string;
    week_start_date: string;
    days_data: DayData[];
    highlights: Array<{ title: string; icon: string }>;
    is_active: boolean;
    duration_seconds: number;
    order: number;
}

interface Props {
    schedule: ScheduleModel;
    faculties: FacultyOption[];
}

export default function CleanersScheduleEditor({ schedule, faculties }: Props) {
    const [activeTab, setActiveTab] = useState<'roster' | 'header' | 'preview'>('roster');
    const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
    const [facultySearch, setFacultySearch] = useState('');

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        title: schedule.title || 'OFFICE CLEANING SCHEDULE',
        subtitle: schedule.subtitle || 'FACULTY CLEANERS',
        scope_badge: schedule.scope_badge || 'CIDS OFFICE AREAS ONLY',
        motto_title: schedule.motto_title || 'A Clean Office, A Brighter CIDS.',
        motto_description: schedule.motto_description || "LET'S KEEP OUR WORKPLACE CLEAN, ORGANIZED, AND WELCOMING FOR EVERYONE.",
        week_label: schedule.week_label || 'OCT 19 - OCT 23, 2026',
        week_start_date: schedule.week_start_date || '2026-10-19',
        days_data: schedule.days_data || [],
        highlights: schedule.highlights || [],
        is_active: schedule.is_active ?? true,
        duration_seconds: schedule.duration_seconds || 25,
    });

    const activeDay = data.days_data[selectedDayIdx] || data.days_data[0];

    // Cleaner roster management for selected day
    const handleAddCleaner = (facultyIdStr: string) => {
        if (!facultyIdStr) return;
        const faculty = faculties.find(f => f.id.toString() === facultyIdStr);
        if (!faculty) return;

        const newCleaner: CleanerEntry = {
            name: faculty.name,
            initials: faculty.initials,
            role: 'Faculty Cleaner',
            faculty_id: faculty.id,
            photo_url: faculty.photo_url || null,
        };

        const updatedDays = [...data.days_data];
        updatedDays[selectedDayIdx] = {
            ...updatedDays[selectedDayIdx],
            cleaners: [...(updatedDays[selectedDayIdx].cleaners || []), newCleaner],
        };
        setData('days_data', updatedDays);
    };

    const handleRemoveCleaner = (cleanerIdx: number) => {
        const updatedDays = [...data.days_data];
        const newCleaners = [...(updatedDays[selectedDayIdx].cleaners || [])];
        newCleaners.splice(cleanerIdx, 1);
        updatedDays[selectedDayIdx] = {
            ...updatedDays[selectedDayIdx],
            cleaners: newCleaners,
        };
        setData('days_data', updatedDays);
    };

    const handleUpdateCleanerRole = (cleanerIdx: number, newRole: string) => {
        const updatedDays = [...data.days_data];
        const newCleaners = [...(updatedDays[selectedDayIdx].cleaners || [])];
        newCleaners[cleanerIdx] = {
            ...newCleaners[cleanerIdx],
            role: newRole,
        };
        updatedDays[selectedDayIdx] = {
            ...updatedDays[selectedDayIdx],
            cleaners: newCleaners,
        };
        setData('days_data', updatedDays);
    };

    const handleUpdateDaySlogan = (newSlogan: string) => {
        const updatedDays = [...data.days_data];
        updatedDays[selectedDayIdx] = {
            ...updatedDays[selectedDayIdx],
            slogan: newSlogan,
        };
        setData('days_data', updatedDays);
    };

    const handleUpdateDateLabel = (newDateLabel: string) => {
        const updatedDays = [...data.days_data];
        updatedDays[selectedDayIdx] = {
            ...updatedDays[selectedDayIdx],
            date_label: newDateLabel,
        };
        setData('days_data', updatedDays);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('tv-config.cleaners.update', schedule.id));
    };

    const handleReset = () => {
        if (confirm('Reset cleaning schedule to default layout and faculty roster?')) {
            router.post(route('tv-config.cleaners.reset', schedule.id));
        }
    };

    const filteredFaculties = faculties.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        (f.program_name && f.program_name.toLowerCase().includes(facultySearch.toLowerCase()))
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cleaners Schedule Slide - TV Studio" />

            <TvStudioLayout currentUrl="/tv-config/cleaners">
                <form onSubmit={handleSubmit} className="p-6 max-w-7xl mx-auto space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Sparkles size={24} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Faculty Cleaners Duty Slide
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                                        Slide 12
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Select faculty from the dropdown to assign cleaners per day and customize office cleaning banners.
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                className="h-9 px-3 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <RotateCcw size={14} className="mr-1.5" />
                                Reset Default
                            </Button>
                            <a
                                href={route('tv-display')}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
                            >
                                <Eye size={14} className="mr-1.5" />
                                View TV
                            </a>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-9 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25 cursor-pointer"
                            >
                                <Save size={14} className="mr-1.5" />
                                {processing ? 'Saving...' : 'Save & Publish to TV'}
                            </Button>
                        </div>
                    </div>

                    {/* Notification Alert on Success */}
                    {recentlySuccessful && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
                            <CheckCircle2 size={16} />
                            <span>Cleaning schedule saved! TV cache cleared and changes will appear immediately.</span>
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab('roster')}
                            className={cn(
                                "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                activeTab === 'roster'
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <Users size={14} />
                            Daily Faculty Roster (Mon–Fri)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('header')}
                            className={cn(
                                "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                activeTab === 'header'
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <Sliders size={14} />
                            Slide Titles & General Settings
                        </button>
                    </div>

                    {/* TAB 1: DAILY FACULTY ROSTER */}
                    {activeTab === 'roster' && (
                        <div className="space-y-6">
                            {/* Day Tabs (Monday to Friday) */}
                            <div className="grid grid-cols-5 gap-2.5">
                                {data.days_data.map((d: DayData, idx: number) => {
                                    const isSelected = idx === selectedDayIdx;
                                    const cleanersCount = d.cleaners?.length || 0;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedDayIdx(idx)}
                                            className={cn(
                                                "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden",
                                                isSelected
                                                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/40"
                                                    : "bg-white dark:bg-[#131b2e] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-400/50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-wider">
                                                    {d.day}
                                                </span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide",
                                                    isSelected ? "bg-slate-950 text-amber-400" : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                                )}>
                                                    {cleanersCount} Cleaners
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-[10px] font-bold mt-1",
                                                isSelected ? "text-slate-900" : "text-slate-400"
                                            )}>
                                                {d.date_label}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Day Editor Panel */}
                            {activeDay && (
                                <div className="grid grid-cols-12 gap-6">
                                    {/* Left: Day Details & Faculty Dropdown Picker (5 cols) */}
                                    <div className="col-span-12 lg:col-span-5 space-y-4 bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                    <span>📅</span> {activeDay.day} Configuration
                                                </h3>
                                                <p className="text-[11px] text-slate-400">
                                                    Assign cleaners and customize the cheerful cheer slogan.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date Label & Slogan */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                                    Date Label (e.g. OCT 19, 2026)
                                                </label>
                                                <Input
                                                    value={activeDay.date_label || ''}
                                                    onChange={e => handleUpdateDateLabel(e.target.value)}
                                                    placeholder="OCT 19, 2026"
                                                    className="h-9 text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                                    Day Cheer Slogan (Displayed at bottom of column)
                                                </label>
                                                <Input
                                                    value={activeDay.slogan || ''}
                                                    onChange={e => handleUpdateDaySlogan(e.target.value)}
                                                    placeholder="Clean Monday! / Tidy Tuesday!"
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 dark:border-white/5 pt-3">
                                            <label className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1 flex items-center gap-1.5">
                                                <Plus size={14} className="text-amber-500" />
                                                Select Faculty from Dropdown
                                            </label>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                                                Pick any faculty member from the database to add to {activeDay.day}'s cleaning roster.
                                            </p>

                                            <div className="space-y-2">
                                                <Input
                                                    type="text"
                                                    value={facultySearch}
                                                    onChange={e => setFacultySearch(e.target.value)}
                                                    placeholder="Search faculty name or program..."
                                                    className="h-8.5 text-xs mb-2"
                                                />

                                                <Select onValueChange={handleAddCleaner}>
                                                    <SelectTrigger className="h-10 text-xs w-full bg-slate-50 dark:bg-white/[0.04]">
                                                        <SelectValue placeholder="-- Choose Faculty Member --" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-72">
                                                        {filteredFaculties.map(f => (
                                                            <SelectItem key={f.id} value={f.id.toString()} className="text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-5 h-5 rounded-full bg-amber-400/90 text-slate-950 font-black text-[9px] flex items-center justify-center">
                                                                        {f.initials}
                                                                    </span>
                                                                    <span className="font-semibold">{f.name}</span>
                                                                    {f.program_code && (
                                                                        <span className="text-[10px] text-slate-400">
                                                                            ({f.program_code})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Assigned Cleaners List for Active Day (7 cols) */}
                                    <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                    <span>🧹</span> {activeDay.day} Cleaning Roster ({activeDay.cleaners?.length || 0})
                                                </h3>
                                                <p className="text-[11px] text-slate-400">
                                                    Preview of scheduled faculty for this day. Reorder, update role, or remove.
                                                </p>
                                            </div>
                                        </div>

                                        {(!activeDay.cleaners || activeDay.cleaners.length === 0) ? (
                                            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                                <Users size={28} className="mx-auto mb-2 opacity-50 text-amber-500" />
                                                <p className="text-xs font-bold">No cleaners assigned for {activeDay.day} yet.</p>
                                                <p className="text-[10px]">Use the dropdown on the left to add faculty cleaners.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {activeDay.cleaners.map((cleaner: CleanerEntry, cIdx: number) => (
                                                    <div
                                                        key={cIdx}
                                                        className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-3 transition-all hover:border-amber-400/60"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="w-5 text-center font-black text-xs text-slate-400">
                                                                {cIdx + 1}
                                                            </span>
                                                            {cleaner.photo_url ? (
                                                                <img
                                                                    src={cleaner.photo_url}
                                                                    alt={cleaner.name}
                                                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400 shadow-xs shrink-0"
                                                                    onError={(e) => {
                                                                        // Fallback to initials if image fails
                                                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                                                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                                                                        if (next) next.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={cn(
                                                                    "w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs items-center justify-center shadow-xs shrink-0",
                                                                    cleaner.photo_url ? "hidden" : "flex"
                                                                )}
                                                            >
                                                                {cleaner.initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                    {cleaner.name}
                                                                </p>
                                                                <Input
                                                                    value={cleaner.role}
                                                                    onChange={e => handleUpdateCleanerRole(cIdx, e.target.value)}
                                                                    placeholder="Faculty Cleaner"
                                                                    className="h-6 text-[10px] w-36 py-0 px-2 mt-0.5 border-dashed"
                                                                />
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveCleaner(cIdx)}
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0 cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: SLIDE TITLES & GENERAL SETTINGS */}
                    {activeTab === 'header' && (
                        <div className="bg-white dark:bg-[#131b2e] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs space-y-6">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-3">
                                Slide Header & Motivational Banners
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Main Title
                                    </label>
                                    <Input
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="OFFICE CLEANING SCHEDULE"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Subtitle / Group Label
                                    </label>
                                    <Input
                                        value={data.subtitle}
                                        onChange={e => setData('subtitle', e.target.value)}
                                        placeholder="FACULTY CLEANERS"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Scope Yellow Badge
                                    </label>
                                    <Input
                                        value={data.scope_badge}
                                        onChange={e => setData('scope_badge', e.target.value)}
                                        placeholder="CIDS OFFICE AREAS ONLY"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Cleaning Week Label
                                    </label>
                                    <Input
                                        value={data.week_label}
                                        onChange={e => setData('week_label', e.target.value)}
                                        placeholder="OCT 19 - OCT 23, 2026"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Motivational Motto Headline
                                    </label>
                                    <Input
                                        value={data.motto_title}
                                        onChange={e => setData('motto_title', e.target.value)}
                                        placeholder="A Clean Office, A Brighter CIDS."
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Display Duration on TV (seconds)
                                    </label>
                                    <Input
                                        type="number"
                                        min={5}
                                        max={120}
                                        value={data.duration_seconds}
                                        onChange={e => setData('duration_seconds', parseInt(e.target.value) || 25)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Motivational Description
                                </label>
                                <Textarea
                                    rows={2}
                                    value={data.motto_description}
                                    onChange={e => setData('motto_description', e.target.value)}
                                    placeholder="LET'S KEEP OUR WORKPLACE CLEAN, ORGANIZED, AND WELCOMING FOR EVERYONE."
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span>Enable this slide in the TV slide rotation</span>
                                </label>
                            </div>
                        </div>
                    )}
                </form>
            </TvStudioLayout>
        </AppLayout>
    );
}
