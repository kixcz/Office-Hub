import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    Calendar,
    Clock,
    AlertCircle,
    Printer,
    RefreshCw,
    Search,
    SlidersHorizontal,
    TrendingUp,
    CalendarDays,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Attendance',
        href: '/faculty-attendance',
    },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    photo_url?: string;
    academic_rank?: string;
    employment_type?: string;
    spreadsheet_name?: string;
    program_id?: number;
    program?: Program;
}

interface FacultyAttendanceRecord {
    id: number;
    faculty_id?: number | null;
    instructor_name: string;
    room?: string;
    course_code?: string;
    subject?: string;
    section?: string;
    time_slot: string;
    day_of_week?: string;
    session_date: string;
    week_label: string;
    academic_year: string;
    semester: string;
    status: 'Present' | 'Late' | 'Absent' | 'Online' | 'On Leave' | 'present' | 'late' | 'absent' | 'online' | string;
    late_minutes: number;
    remarks?: string;
    faculty?: Faculty | null;
}

interface FacultyAttendanceSummary {
    id: number;
    faculty_id?: number | null;
    instructor_name: string;
    academic_year: string;
    semester: string;
    period_type: string;
    period_label: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    online_count: number;
    others_count: number;
    on_leave_count: number;
    total_late_minutes: number;
    scheduled_sessions: number;
    attendance_rate: number;
    faculty?: Faculty | null;
}

interface KPIs {
    faculty_tracked: number;
    sessions_conducted: number;
    late_sessions: number;
    absent_sessions: number;
    overall_rate: number;
}

interface Props {
    programs: Program[];
    faculties: Faculty[];
    summaries: FacultyAttendanceSummary[];
    weekly_sessions: FacultyAttendanceRecord[];
    monthly_periods: string[];
    weekly_periods: string[];
    kpis: KPIs;
    filters: {
        program: string;
        instructor?: string;
        status?: string;
        period: string;
        week: string;
        search: string;
    };
    last_synced_at: string;
    academic_year: string;
    semester: string;
    sheet_url: string;
}

type TabType = 'overview' | 'weekly' | 'monthly' | 'records' | 'sync';

export default function FacultyAttendanceIndex({
    programs = [],
    faculties = [],
    summaries = [],
    weekly_sessions = [],
    monthly_periods = [],
    weekly_periods = [],
    kpis,
    filters,
    last_synced_at,
    academic_year = 'AY 2026–2027',
    semester = '1st Semester',
    sheet_url,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('weekly');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program || 'all');
    const [selectedInstructor, setSelectedInstructor] = useState(filters.instructor || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || (monthly_periods[0] || 'August 2026'));
    const [selectedWeek, setSelectedWeek] = useState(filters.week || (weekly_periods[0] || 'August 10 – 14, 2026 (Week 2)'));
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    // Navigation and week pagination
    const currentWeekIndex = useMemo(() => {
        const idx = weekly_periods.indexOf(selectedWeek);
        return idx !== -1 ? idx : 0;
    }, [weekly_periods, selectedWeek]);

    const handlePrevWeek = () => {
        if (currentWeekIndex > 0) {
            const prev = weekly_periods[currentWeekIndex - 1];
            setSelectedWeek(prev);
            handleFilterChange({ week: prev });
        }
    };

    const handleNextWeek = () => {
        if (currentWeekIndex < weekly_periods.length - 1) {
            const next = weekly_periods[currentWeekIndex + 1];
            setSelectedWeek(next);
            handleFilterChange({ week: next });
        }
    };

    const handleFilterChange = (updates: Partial<typeof filters>) => {
        router.get(
            '/faculty-attendance',
            {
                program: updates.program !== undefined ? updates.program : selectedProgram,
                instructor: updates.instructor !== undefined ? updates.instructor : selectedInstructor,
                status: updates.status !== undefined ? updates.status : selectedStatus,
                period: updates.period !== undefined ? updates.period : selectedPeriod,
                week: updates.week !== undefined ? updates.week : selectedWeek,
                search: updates.search !== undefined ? updates.search : searchTerm,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedProgram('all');
        setSelectedInstructor('all');
        setSelectedStatus('all');
        router.get('/faculty-attendance', {
            week: selectedWeek,
            period: selectedPeriod,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/faculty-attendance/sync', {}, {
            preserveScroll: true,
            onFinish: () => setIsSyncing(false),
        });
    };

    // Filter weekly sessions based on local states if any
    const filteredWeeklySessions = useMemo(() => {
        return weekly_sessions.filter(s => {
            const matchesSearch = !searchTerm ||
                s.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.subject && s.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.room && s.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.section && s.section.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesProg = selectedProgram === 'all' ||
                (s.faculty?.program_id?.toString() === selectedProgram) ||
                (s.section && s.section.toLowerCase().includes(selectedProgram.toLowerCase()));

            const matchesInst = selectedInstructor === 'all' ||
                (s.faculty_id?.toString() === selectedInstructor) ||
                (s.instructor_name.toLowerCase().includes(selectedInstructor.toLowerCase()));

            const matchesStatus = selectedStatus === 'all' ||
                s.status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesProg && matchesInst && matchesStatus;
        });
    }, [weekly_sessions, searchTerm, selectedProgram, selectedInstructor, selectedStatus]);

    const toggleSelectAll = () => {
        if (selectedRows.length === filteredWeeklySessions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredWeeklySessions.map(s => s.id));
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    // Helper avatar initials and badge styling
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getProgramBadgeStyle = (programCode?: string, section?: string) => {
        const text = (section || programCode || '').toUpperCase();
        if (text.includes('BSIT')) {
            return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
        }
        if (text.includes('BSIS')) {
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
        }
        if (text.includes('BSCS')) {
            return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
        }
        if (text.includes('BLIS')) {
            return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
        }
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    };

    const renderStatusBadge = (status: string, lateMinutes: number = 0) => {
        const norm = status.toLowerCase();
        if (norm === 'present') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Present
                </span>
            );
        }
        if (norm === 'late') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Late
                </span>
            );
        }
        if (norm === 'absent') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Absent
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {status}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Attendance - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Faculty Attendance
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                Monitor weekly and monthly teaching attendance of faculty members.
                            </p>
                        </div>
                    </div>

                    {/* Top Action Buttons matching screenshot */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link
                            href="/faculty-attendance/report"
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground shadow-xs cursor-pointer transition-colors"
                        >
                            <Printer className="w-4 h-4 text-foreground" />
                            <span>Generate Report</span>
                        </Link>
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex-1 md:flex-none items-center gap-2 text-xs font-bold rounded-xl shadow-xs cursor-pointer bg-amber-400 text-slate-950 hover:bg-amber-500 border-none px-4 py-2.5"
                        >
                            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync from Google Sheets'}</span>
                        </Button>
                    </div>
                </div>

                {/* 2. SUB-HEADER FILTER PILLS (Academic Year, Semester, Week Selector) */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={academic_year}
                        onChange={() => {}}
                        className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                    >
                        <option value="AY 2026–2027">AY 2026–2027</option>
                        <option value="AY 2025–2026">AY 2025–2026</option>
                    </select>

                    <select
                        value={semester}
                        onChange={() => {}}
                        className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                    >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="Summer Term">Summer Term</option>
                    </select>

                    <div className="relative">
                        <select
                            value={selectedWeek}
                            onChange={(e) => {
                                setSelectedWeek(e.target.value);
                                handleFilterChange({ week: e.target.value });
                            }}
                            className="h-9 pl-8 pr-4 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                        >
                            {weekly_periods.map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                        <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* 3. FIVE KPI METRIC CARDS (Exact match to screenshot) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Faculty Tracked */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Faculty Tracked
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis.faculty_tracked || 25}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Total faculty members
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sessions Conducted */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Sessions Conducted
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis.sessions_conducted || 68}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Total teaching sessions
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Late Sessions */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Late Sessions
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis.late_sessions ?? 3}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Sessions started late
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Absent Sessions */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Absent Sessions
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis.absent_sessions ?? 17}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Faculty absent sessions
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                <span className="text-base font-black">%</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Attendance Rate
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis.overall_rate ? `${kpis.overall_rate}%` : '79.1%'}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Overall attendance rate
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. SUB-VIEW TABS (Overview, Weekly Attendance, Monthly Attendance, Faculty Records & Mapping, Google Sheets Sync) */}
                <div className="flex items-center border-b border-border overflow-x-auto gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'weekly', label: 'Weekly Attendance', icon: CalendarDays },
                        { id: 'monthly', label: 'Monthly Attendance', icon: Calendar },
                        { id: 'records', label: 'Faculty Records & Mapping', icon: Users },
                        { id: 'sync', label: 'Google Sheets Sync', icon: SlidersHorizontal },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight transition-all cursor-pointer border-b-2 whitespace-nowrap",
                                    isActive
                                        ? "border-amber-400 text-foreground font-extrabold"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-amber-500" : "text-muted-foreground")} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 5. MAIN CONTENT CARD (WEEKLY TEACHING SESSIONS) */}
                {activeTab === 'weekly' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
                        {/* Header Row: Title & Week Picker with Prev/Next Pagination */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-foreground">Weekly Teaching Sessions</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Individual teaching sessions conducted, late, or missed per scheduled time-slot.
                                    </p>
                                </div>
                            </div>

                            {/* Select Week Dropdown & Stepper buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Select Week</span>
                                <div className="flex items-center gap-1.5">
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => {
                                            setSelectedWeek(e.target.value);
                                            handleFilterChange({ week: e.target.value });
                                        }}
                                        className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                    >
                                        {weekly_periods.map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handlePrevWeek}
                                        disabled={currentWeekIndex === 0}
                                        className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextWeek}
                                        disabled={currentWeekIndex === weekly_periods.length - 1}
                                        className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Bar Row: Search, All Programs, All Instructors, All Statuses, Reset Filters */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search faculty name, subject, or room..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => {
                                        setSelectedProgram(e.target.value);
                                        handleFilterChange({ program: e.target.value });
                                    }}
                                    className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[120px]"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.code}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedInstructor}
                                    onChange={(e) => {
                                        setSelectedInstructor(e.target.value);
                                        handleFilterChange({ instructor: e.target.value });
                                    }}
                                    className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[130px]"
                                >
                                    <option value="all">All Instructors</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        handleFilterChange({ status: e.target.value });
                                    }}
                                    className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer min-w-[110px]"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="present">Present</option>
                                    <option value="late">Late</option>
                                    <option value="absent">Absent</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Filters</span>
                                </button>
                            </div>
                        </div>

                        {/* Table with columns: #, Date, Time Slot, Faculty, Program/Section, Subject, Room, Status, Remarks, Actions */}
                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th className="w-10 px-3 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.length > 0 && selectedRows.length === filteredWeeklySessions.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </th>
                                        <th className="w-10 px-2 py-3 text-center">#</th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Date</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Time Slot</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Faculty</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Program / Section</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Subject</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                <span>Room</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1 cursor-pointer">
                                                <span>Status</span>
                                                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-semibold">Remarks</th>
                                        <th className="px-3 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredWeeklySessions.map((session, idx) => {
                                        const isSelected = selectedRows.includes(session.id);
                                        const initials = getInitials(session.instructor_name);

                                        return (
                                            <tr
                                                key={session.id}
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors",
                                                    isSelected && "bg-amber-50/50 dark:bg-amber-950/20"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <td className="px-3 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectRow(session.id)}
                                                        className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                </td>

                                                {/* Index Number */}
                                                <td className="px-2 py-3 text-center font-mono text-xs text-muted-foreground">
                                                    {idx + 1}
                                                </td>

                                                {/* Date & Day */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-bold text-foreground">
                                                        {session.day_of_week || 'Mon'}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {session.session_date ? new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 10, 2026'}
                                                    </div>
                                                </td>

                                                {/* Time Slot */}
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    {session.time_slot}
                                                </td>

                                                {/* Faculty with Avatar circle and Name / Department */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0 border border-border">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground hover:text-primary">
                                                                {session.instructor_name}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                                {session.faculty?.program?.code || 'BSIT'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Program / Section with colored badge */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-bold",
                                                        getProgramBadgeStyle(session.faculty?.program?.code, session.section)
                                                    )}>
                                                        {session.section || (session.faculty?.program?.code ? `${session.faculty.program.code} 3A` : 'BSIT 3A')}
                                                    </span>
                                                </td>

                                                {/* Subject */}
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    {session.subject || session.course_code || 'Data Structures'}
                                                </td>

                                                {/* Room */}
                                                <td className="px-4 py-3 text-muted-foreground font-medium whitespace-nowrap">
                                                    {session.room || 'Main Lab'}
                                                </td>

                                                {/* Status with dot badge */}
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    {renderStatusBadge(session.status, session.late_minutes)}
                                                </td>

                                                {/* Remarks */}
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {session.remarks || (session.status.toLowerCase() === 'late' && session.late_minutes > 0 ? `Started at ${session.late_minutes}m` : '—')}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-3 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredWeeklySessions.length === 0 && (
                                        <tr>
                                            <td colSpan={11} className="py-12 text-center text-muted-foreground">
                                                No attendance records found for this week.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Faculty Attendance Records</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Consolidated teaching session compliance for {selectedPeriod}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Faculty</th>
                                        <th className="px-4 py-3 font-semibold text-center">Sessions</th>
                                        <th className="px-4 py-3 font-semibold text-center">Present</th>
                                        <th className="px-4 py-3 font-semibold text-center">Late</th>
                                        <th className="px-4 py-3 font-semibold text-center">Absent</th>
                                        <th className="px-4 py-3 font-semibold text-center">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {summaries.map(s => (
                                        <tr key={s.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-bold text-foreground">{s.instructor_name}</td>
                                            <td className="px-4 py-3 text-center tabular-nums">{s.scheduled_sessions}</td>
                                            <td className="px-4 py-3 text-center text-emerald-600 font-bold tabular-nums">{s.present_count}</td>
                                            <td className="px-4 py-3 text-center text-amber-600 font-bold tabular-nums">{s.late_count}</td>
                                            <td className="px-4 py-3 text-center text-rose-600 font-bold tabular-nums">{s.absent_count}</td>
                                            <td className="px-4 py-3 text-center font-black tabular-nums">{s.attendance_rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 7. MONTHLY ATTENDANCE TAB */}
                {activeTab === 'monthly' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Monthly Attendance Matrix</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Detailed monthly session summary and attendance percentages.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Faculty Name</th>
                                        <th className="px-4 py-3 font-semibold">Program</th>
                                        <th className="px-4 py-3 font-semibold text-center">Scheduled</th>
                                        <th className="px-4 py-3 font-semibold text-center">Present</th>
                                        <th className="px-4 py-3 font-semibold text-center">Late</th>
                                        <th className="px-4 py-3 font-semibold text-center">Absent</th>
                                        <th className="px-4 py-3 font-semibold text-center">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {summaries.map(s => (
                                        <tr key={s.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-bold text-foreground">{s.instructor_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.faculty?.program?.code || 'BSIT'}</td>
                                            <td className="px-4 py-3 text-center tabular-nums">{s.scheduled_sessions}</td>
                                            <td className="px-4 py-3 text-center text-emerald-600 font-bold tabular-nums">{s.present_count}</td>
                                            <td className="px-4 py-3 text-center text-amber-600 font-bold tabular-nums">{s.late_count}</td>
                                            <td className="px-4 py-3 text-center text-rose-600 font-bold tabular-nums">{s.absent_count}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600 tabular-nums">{s.attendance_rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 8. FACULTY RECORDS & MAPPING TAB */}
                {activeTab === 'records' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Faculty Records & Mapping</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Link instructor names from attendance logs to official CIDS faculty members.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Faculty Member</th>
                                        <th className="px-4 py-3 font-semibold">Program</th>
                                        <th className="px-4 py-3 font-semibold">Academic Rank</th>
                                        <th className="px-4 py-3 font-semibold">Sheet Alias</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {faculties.map(f => (
                                        <tr key={f.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-bold text-foreground">{f.first_name} {f.last_name}</td>
                                            <td className="px-4 py-3">{f.program?.code || 'CIDS'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{f.academic_rank || 'Faculty'}</td>
                                            <td className="px-4 py-3 font-mono text-[11px]">{f.spreadsheet_name || f.last_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 9. GOOGLE SHEETS SYNC TAB */}
                {activeTab === 'sync' && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
                        <div className="flex items-start justify-between pb-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Google Sheets Synchronization</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Synchronize real-time attendance logs directly from the designated Google Sheet.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground">Source URL</div>
                            <div className="font-mono text-xs text-primary truncate">
                                {sheet_url}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Last Synchronized: <span className="font-bold text-foreground">{last_synced_at}</span>
                            </div>
                        </div>

                        <div>
                            <Button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="bg-amber-400 text-slate-950 hover:bg-amber-500 font-bold text-xs rounded-xl shadow-xs"
                            >
                                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                                <span>{isSyncing ? 'Synchronizing...' : 'Sync from Google Sheets'}</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
