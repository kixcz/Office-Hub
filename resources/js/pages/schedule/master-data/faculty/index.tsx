import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Search,
    BookOpen,
    GraduationCap,
    Clock,
    Sparkles,
    Sliders,
    Calendar,
    CheckCircle2,
    CheckCircle,
    AlertCircle,
    Info,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/faculty' },
    { title: 'Faculty Matrix', href: '/schedule/master-data/faculty' },
];

interface SpecializationRecord {
    id: number;
    expertise_area: string;
    qualification_level: string;
    course_category_match?: string | null;
    is_verified?: boolean;
}

interface PreferenceRecord {
    id: number;
    preferred_days?: string[] | null;
    preferred_time_windows?: string[] | null;
    max_days_per_week?: number | null;
    notes?: string | null;
}

interface AvailabilityRecord {
    id: number;
    academic_year?: string | null;
    semester?: string | null;
    day_of_week: string;
    preferred_start_time: string;
    preferred_end_time: string;
    status: string;
    notes?: string | null;
}

interface FacultyMember {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string | null;
    academic_rank?: string | null;
    employment_type?: string | null;
    specialization?: string | null;
    program?: {
        id: number;
        code: string;
        name: string;
        college_id?: number;
    } | null;
    specializations?: SpecializationRecord[];
    preferences?: PreferenceRecord[];
    availabilities?: AvailabilityRecord[];
}

interface Props {
    currentPeriod: any;
    faculties: FacultyMember[];
    initialTab?: 'all' | 'specializations' | 'preferences' | 'availability';
}

export default function MasterDataFacultyIndex({
    currentPeriod,
    faculties = [],
    initialTab = 'all',
}: Props) {
    const [activeTab, setActiveTab] = useState<'all' | 'specializations' | 'preferences' | 'availability'>(initialTab);
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('all');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as any;
            if (['all', 'specializations', 'preferences', 'availability'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    const filtered = useMemo(() => {
        return faculties.filter((f) => {
            const name = `${f.first_name} ${f.last_name} ${f.title_name || ''}`.toLowerCase();
            const spec = (f.specialization || '').toLowerCase();
            const specTags = (f.specializations || []).map((s) => s.expertise_area.toLowerCase()).join(' ');
            const matchesSearch =
                name.includes(search.toLowerCase()) ||
                spec.includes(search.toLowerCase()) ||
                specTags.includes(search.toLowerCase());
            const matchesProg = programFilter === 'all' || f.program?.code === programFilter;
            return matchesSearch && matchesProg;
        });
    }, [faculties, search, programFilter]);

    const programs = useMemo(() => {
        const set = new Set<string>();
        faculties.forEach((f) => {
            if (f.program?.code) set.add(f.program.code);
        });
        return Array.from(set);
    }, [faculties]);

    const totalSpecs = useMemo(() => {
        return faculties.reduce((sum, f) => sum + (f.specializations?.length || (f.specialization ? 1 : 0)), 0);
    }, [faculties]);

    const totalPrefs = useMemo(() => {
        return faculties.filter((f) => (f.preferences && f.preferences.length > 0) || f.specialization).length;
    }, [faculties]);

    const totalAvailSlots = useMemo(() => {
        return faculties.reduce((sum, f) => sum + (f.availabilities?.length || 0), 0);
    }, [faculties]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Matrix - Scheduling Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white">
                                    <Users className="size-5" />
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Faculty Academic Master Data
                                </h1>
                                <Badge className="bg-gradient-to-r from-[#0B3A67]/15 to-[#8B1E3F]/15 text-[#0B3A67] border-[#0B3A67]/30 text-xs font-semibold">
                                    College Scoped
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 max-w-2xl">
                                Instructors, disciplinary expertise tags, scheduling preferences, and teaching availability within your college.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/faculties">
                                    Faculty Directory &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'all'
                                    ? 'bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Faculty Members</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {faculties.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('specializations')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'specializations'
                                    ? 'bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Faculty Specializations</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'specializations' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {totalSpecs}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('preferences')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'preferences'
                                    ? 'bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Sliders className="w-4 h-4" />
                            <span>Faculty Preferences</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'preferences' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {totalPrefs}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('availability')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'availability'
                                    ? 'bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            <span>Faculty Availability</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'availability' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {totalAvailSlots}
                            </span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">College Faculty Pool</span>
                            <div className="text-2xl font-black text-gray-900">{faculties.length}</div>
                            <span className="text-[11px] text-gray-500">Department instructional pool</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Specialization Matrix</span>
                            <div className="text-2xl font-black text-emerald-600">{totalSpecs}</div>
                            <span className="text-[11px] text-gray-500">Course match tags</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Preference Profiles</span>
                            <div className="text-2xl font-black text-purple-600">{totalPrefs}</div>
                            <span className="text-[11px] text-gray-500">Day/time preference registered</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Loading Workload Target</span>
                            <div className="text-2xl font-black text-blue-600">18 Units</div>
                            <span className="text-[11px] text-gray-500">Institutional standard full-time</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by instructor, rank, or specialty..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={programFilter}
                                    onChange={(e) => setProgramFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-semibold"
                                >
                                    <option value="all">All Programs in College</option>
                                    {programs.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <Button asChild size="sm" className="bg-[#0B3A67] hover:bg-[#0B3A67]/90 text-white font-semibold text-xs">
                                    <Link href="/schedule/loading">
                                        View Load Allocation &rarr;
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* TAB 1: FACULTY MEMBERS (ALL) */}
                        {activeTab === 'all' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="py-3 px-4">Faculty Member</th>
                                            <th className="py-3 px-4">Home Program</th>
                                            <th className="py-3 px-4">Academic Rank</th>
                                            <th className="py-3 px-4">Employment</th>
                                            <th className="py-3 px-4">Primary Specialty</th>
                                            <th className="py-3 px-4 text-center">Eligibility</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.map((faculty) => (
                                            <tr key={faculty.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 font-bold text-gray-900">
                                                    {faculty.title_name ? `${faculty.title_name} ` : ''}
                                                    {faculty.first_name} {faculty.last_name}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-700">
                                                    {faculty.program?.code || 'General'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {faculty.academic_rank || 'Instructor'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {faculty.employment_type || 'Full-time'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {faculty.specialization ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                                                            {faculty.specialization}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px]">No tags assigned</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                        Assignable
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                                        <Link href="/schedule/loading">
                                                            Inspect Load &rarr;
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 2: FACULTY SPECIALIZATIONS */}
                        {activeTab === 'specializations' && (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Specializations define verified subject expertise used by the scheduler to pair faculty with course offerings.</span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="py-3 px-4">Faculty Member</th>
                                                <th className="py-3 px-4">Program</th>
                                                <th className="py-3 px-4">Specialization Area(s)</th>
                                                <th className="py-3 px-4">Match Category</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-right">Verification</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map((faculty) => {
                                                const specs = faculty.specializations || [];
                                                return (
                                                    <tr key={faculty.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-gray-900">
                                                            {faculty.title_name || `${faculty.first_name} ${faculty.last_name}`}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-700">
                                                            {faculty.program?.code || 'General'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {specs.length > 0 ? (
                                                                    specs.map((s) => (
                                                                        <span
                                                                            key={s.id}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium"
                                                                        >
                                                                            {s.expertise_area}
                                                                        </span>
                                                                    ))
                                                                ) : faculty.specialization ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                                                                        {faculty.specialization}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 italic text-[11px]">No tags recorded</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            {specs[0]?.course_category_match || 'Major Courses'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                Active
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Dean Verified
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: FACULTY PREFERENCES */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-2 text-xs text-purple-800">
                                    <Info className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>Faculty preferences (day combinations, preferred teaching hours, and maximum days) guide the automated solver.</span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="py-3 px-4">Faculty Member</th>
                                                <th className="py-3 px-4">Home Program</th>
                                                <th className="py-3 px-4">Preferred Days</th>
                                                <th className="py-3 px-4">Time Windows</th>
                                                <th className="py-3 px-4 text-center">Max Days / Wk</th>
                                                <th className="py-3 px-4">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map((faculty) => {
                                                const pref = (faculty.preferences && faculty.preferences[0]) || null;
                                                const days = pref?.preferred_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                                                const times = pref?.preferred_time_windows || ['08:00 - 12:00', '13:00 - 17:00'];
                                                return (
                                                    <tr key={faculty.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-gray-900">
                                                            {faculty.title_name || `${faculty.first_name} ${faculty.last_name}`}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-700">
                                                            {faculty.program?.code || 'General'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {days.map((d: string) => (
                                                                    <span
                                                                        key={d}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium"
                                                                    >
                                                                        {d.slice(0, 3)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {times.map((t: string) => (
                                                                    <span
                                                                        key={t}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium"
                                                                    >
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                                                            {pref?.max_days_per_week || 4} days
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                                                            {pref?.notes || 'Standard department loading constraints apply.'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: FACULTY AVAILABILITY */}
                        {activeTab === 'availability' && (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-2 text-xs text-amber-800">
                                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Weekly availability time windows logged by faculty members for the active academic semester.</span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="py-3 px-4">Faculty Member</th>
                                                <th className="py-3 px-4">Program</th>
                                                <th className="py-3 px-4">Available Days</th>
                                                <th className="py-3 px-4">Time Slot Allocation</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map((faculty) => {
                                                const avails = faculty.availabilities || [];
                                                return (
                                                    <tr key={faculty.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-gray-900">
                                                            {faculty.title_name || `${faculty.first_name} ${faculty.last_name}`}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-700">
                                                            {faculty.program?.code || 'General'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {avails.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {avails.map((a) => (
                                                                        <span
                                                                            key={a.id}
                                                                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium"
                                                                        >
                                                                            {a.day_of_week} ({a.preferred_start_time}-{a.preferred_end_time})
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 text-[11px]">Monday–Friday (08:00–17:00 Standard)</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            40 hrs / week standard window
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                Available
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                                                <Link href="/schedule/loading">
                                                                    View Timetable &rarr;
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
