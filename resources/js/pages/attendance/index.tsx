import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    Printer,
    RefreshCw,
    Search,
    ExternalLink,
    Filter,
    FileText,
    Link2,
    TrendingUp,
    AlertTriangle,
    SlidersHorizontal,
    X,
    Building2,
    CalendarDays,
    BookOpen,
    Eye,
    ChevronRight,
    Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Attendance & Monitoring',
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
    room_number?: string;
    course_code?: string;
    section?: string;
    time_slot: string;
    day_of_week?: string;
    session_date: string;
    week_label: string;
    academic_year: string;
    semester: string;
    status: 'present' | 'late' | 'absent' | 'online' | 'on_leave' | 'others';
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
    academic_year,
    semester,
    sheet_url,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program || 'all');
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || (monthly_periods[0] || 'August 2026'));
    const [selectedWeek, setSelectedWeek] = useState(filters.week || (weekly_periods[0] || 'August 10-14, 2026'));
    const [isSyncing, setIsSyncing] = useState(false);

    // Link Faculty Modal
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedInstructorToLink, setSelectedInstructorToLink] = useState<string | null>(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');

    // Print Report Modal
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [printConfig, setPrintConfig] = useState({
        periodType: 'monthly', // 'monthly' | 'weekly'
        period: selectedPeriod,
        programId: 'all',
        includeOnlyWithRecords: true,
        monitoringCoordinator: 'Mark Bryan C. Pansacala, MIT',
        monitoringCoordinatorTitle: 'Monitoring Coordinator',
        programChair: 'Program Chair',
        programChairTitle: 'BSIT / BSCS Program Chair',
        collegeDean: 'Dean, College of Information and Digital Sciences',
        collegeDeanTitle: 'College Dean',
    });

    const handleFilterChange = (updates: Partial<typeof filters>) => {
        router.get(
            '/faculty-attendance',
            {
                program: updates.program !== undefined ? updates.program : selectedProgram,
                period: updates.period !== undefined ? updates.period : selectedPeriod,
                week: updates.week !== undefined ? updates.week : selectedWeek,
                search: updates.search !== undefined ? updates.search : searchTerm,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/faculty-attendance/sync', {}, {
            preserveScroll: true,
            onFinish: () => setIsSyncing(false),
        });
    };

    const handleOpenLinkModal = (instructorName: string) => {
        setSelectedInstructorToLink(instructorName);
        const match = faculties.find(
            f => f.spreadsheet_name?.toLowerCase() === instructorName.toLowerCase() ||
                 f.last_name.toLowerCase() === instructorName.toLowerCase()
        );
        setSelectedFacultyId(match ? match.id : '');
        setLinkModalOpen(true);
    };

    const handleSaveLink = () => {
        if (!selectedInstructorToLink || !selectedFacultyId) return;
        router.post('/faculty-attendance/link-faculty', {
            instructor_name: selectedInstructorToLink,
            faculty_id: selectedFacultyId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setLinkModalOpen(false);
                setSelectedInstructorToLink(null);
            }
        });
    };

    // Filter summaries and sessions locally if needed
    const filteredSummaries = useMemo(() => {
        return summaries.filter(s => {
            const matchesSearch = s.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [summaries, searchTerm]);

    const filteredWeeklySessions = useMemo(() => {
        return weekly_sessions.filter(s => {
            const matchesSearch = s.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.course_code && s.course_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.room_number && s.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [weekly_sessions, searchTerm]);

    // Data for Print View
    const printRecords = useMemo(() => {
        if (printConfig.periodType === 'monthly') {
            return summaries.filter(s => {
                if (printConfig.programId !== 'all') {
                    return s.faculty?.program_id === Number(printConfig.programId);
                }
                return true;
            });
        } else {
            // For weekly, consolidate per faculty in this week
            const facultyMap = new Map<string, {
                instructor_name: string;
                faculty?: Faculty | null;
                scheduled: number;
                present: number;
                late: number;
                absent: number;
                rate: number;
            }>();

            weekly_sessions.forEach(sess => {
                if (printConfig.programId !== 'all' && sess.faculty?.program_id !== Number(printConfig.programId)) {
                    return;
                }
                const key = sess.instructor_name;
                if (!facultyMap.has(key)) {
                    facultyMap.set(key, {
                        instructor_name: key,
                        faculty: sess.faculty,
                        scheduled: 0,
                        present: 0,
                        late: 0,
                        absent: 0,
                        rate: 100,
                    });
                }
                const item = facultyMap.get(key)!;
                item.scheduled += 1;
                if (sess.status === 'present') item.present += 1;
                else if (sess.status === 'late') item.late += 1;
                else if (sess.status === 'absent') item.absent += 1;
            });

            return Array.from(facultyMap.values()).map(item => ({
                ...item,
                rate: item.scheduled > 0 ? Math.round(((item.present + item.late) / item.scheduled) * 100) : 0
            }));
        }
    }, [summaries, weekly_sessions, printConfig]);

    const triggerBrowserPrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Attendance & Monitoring - CIDS OfficeHub" />

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body, main {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                }
                @media screen {
                    .print-only {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER */}
                <div className="no-print rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-foreground">
                                    Faculty Attendance
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Sync Connected
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">
                                Weekly and monthly teaching attendance monitoring
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <span className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-bold border border-border">
                                    {academic_year}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-bold border border-border">
                                    {semester}
                                </span>
                                <a
                                    href={sheet_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary hover:underline"
                                >
                                    <span>Source: Google Sheets</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                                    Last synchronized: {last_synced_at}
                                </span>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => setPrintModalOpen(true)}
                                className="flex-1 md:flex-none items-center gap-2 text-xs font-bold shadow-xs cursor-pointer"
                            >
                                <Printer className="w-4 h-4 text-primary" />
                                <span>Print Report</span>
                            </Button>
                            <Button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="flex-1 md:flex-none items-center gap-2 text-xs font-bold shadow-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* 2. 4 TOP KPI METRIC CARDS (Exact match with user mockup) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
                        {/* Faculty Tracked */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                                {kpis.faculty_tracked || '—'}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold mt-1">
                                Faculty Tracked
                            </span>
                        </div>

                        {/* Sessions Conducted */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                                {kpis.sessions_conducted || '—'}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold mt-1">
                                Sessions Conducted
                            </span>
                        </div>

                        {/* Late Sessions */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                                {kpis.late_sessions ?? '—'}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold mt-1">
                                Late Sessions
                            </span>
                        </div>

                        {/* Absent Sessions */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                                {kpis.absent_sessions ?? '—'}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold mt-1">
                                Absent Sessions
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. SUB-VIEW NAVIGATION TABS */}
                <div className="no-print flex items-center justify-between border-b border-border overflow-x-auto gap-2 pb-px">
                    <div className="flex items-center gap-2">
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
                                        "flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-tight rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap",
                                        isActive
                                            ? "border-primary text-foreground bg-card shadow-xs"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Search and Program Filter Bar */}
                    <div className="flex items-center gap-3 py-1">
                        <div className="relative w-48 lg:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search faculty name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                            />
                        </div>

                        <select
                            value={selectedProgram}
                            onChange={(e) => {
                                setSelectedProgram(e.target.value);
                                handleFilterChange({ program: e.target.value });
                            }}
                            className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                        >
                            <option value="all">All Programs</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. TAB CONTENTS */}
                <div className="no-print min-h-[420px]">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Summary Card with Preview Layout (Exact user mockup structure) */}
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Faculty Attendance Records</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Consolidated teaching session compliance for {selectedPeriod}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                                            Preview layout
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Faculty</th>
                                                <th className="px-4 py-3 font-semibold text-center">Sessions</th>
                                                <th className="px-4 py-3 font-semibold text-center">Present</th>
                                                <th className="px-4 py-3 font-semibold text-center">Late</th>
                                                <th className="px-4 py-3 font-semibold text-center">Absent</th>
                                                <th className="px-4 py-3 font-semibold text-center">Rate</th>
                                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredSummaries.slice(0, 10).map((summary) => (
                                                <tr key={summary.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                                {summary.instructor_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                                                    <span>{summary.instructor_name}</span>
                                                                    {summary.faculty && (
                                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                                                                            Linked
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {summary.faculty?.program?.code || 'Department of Computing'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-semibold text-foreground tabular-nums">
                                                        {summary.scheduled_sessions}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {summary.present_count}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                        {summary.late_count}
                                                        {summary.total_late_minutes > 0 && (
                                                            <span className="text-[10px] text-muted-foreground font-normal block">
                                                                ({summary.total_late_minutes}m)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                        {summary.absent_count}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={cn(
                                                            "inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold tabular-nums",
                                                            summary.attendance_rate >= 90
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : summary.attendance_rate >= 75
                                                                ? "bg-amber-500/10 text-amber-600"
                                                                : "bg-rose-500/10 text-rose-600"
                                                        )}>
                                                            {summary.attendance_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {summary.faculty ? (
                                                                <Link
                                                                    href={`/faculties/${summary.faculty.id}`}
                                                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                                                >
                                                                    <span>Profile</span>
                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                </Link>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleOpenLinkModal(summary.instructor_name)}
                                                                    className="text-xs text-amber-600 hover:text-amber-700 h-7 px-2 cursor-pointer"
                                                                >
                                                                    <Link2 className="w-3.5 h-3.5 mr-1" />
                                                                    Link
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredSummaries.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                                        No attendance records found for this period. Click <strong>Sync Now</strong> to fetch records from Google Sheets.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-muted/20 border-t border-border mt-2 rounded-b-xl flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                                    <p>Showing {Math.min(filteredSummaries.length, 10)} of {filteredSummaries.length} tracked instructors</p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('monthly')}
                                        className="text-primary font-bold hover:underline cursor-pointer"
                                    >
                                        View Complete Monthly Matrix →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: WEEKLY ATTENDANCE */}
                    {activeTab === 'weekly' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Weekly Teaching Sessions</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Individual teaching sessions conducted, late, or missed per scheduled time-slot
                                        </p>
                                    </div>

                                    {/* Week Selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-semibold">Select Week:</span>
                                        <select
                                            value={selectedWeek}
                                            onChange={(e) => {
                                                setSelectedWeek(e.target.value);
                                                handleFilterChange({ week: e.target.value });
                                            }}
                                            className="h-8 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                        >
                                            {weekly_periods.map(w => (
                                                <option key={w} value={w}>{w}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Day & Date</th>
                                                <th className="px-4 py-3 font-semibold">Time Slot</th>
                                                <th className="px-5 py-3 font-semibold">Instructor</th>
                                                <th className="px-4 py-3 font-semibold">Course / Subject</th>
                                                <th className="px-4 py-3 font-semibold">Room</th>
                                                <th className="px-4 py-3 font-semibold text-center">Status</th>
                                                <th className="px-4 py-3 font-semibold text-right">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredWeeklySessions.map(session => (
                                                <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-bold text-foreground">{session.day_of_week || 'Session'}</div>
                                                        <div className="text-[11px] text-muted-foreground">{session.session_date}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">
                                                        {session.time_slot}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="font-bold text-foreground flex items-center gap-1.5">
                                                            {session.faculty ? (
                                                                <Link
                                                                    href={`/faculties/${session.faculty.id}`}
                                                                    className="hover:text-primary hover:underline"
                                                                >
                                                                    {session.instructor_name}
                                                                </Link>
                                                            ) : (
                                                                <span>{session.instructor_name}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {session.faculty?.program?.code || 'CIDS'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                                                        {session.course_code || 'Lecture Session'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                                                        {session.room_number || 'Main Lab'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                                                            session.status === 'present'
                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                : session.status === 'late'
                                                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                : session.status === 'online'
                                                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                        )}>
                                                            {session.status}
                                                            {session.late_minutes > 0 && ` (${session.late_minutes}m)`}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                        {session.remarks || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredWeeklySessions.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                                        No teaching sessions recorded for {selectedWeek}.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MONTHLY ATTENDANCE */}
                    {activeTab === 'monthly' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Monthly Attendance Matrix</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Consolidated teaching compliance, total late minutes, and verified rates
                                        </p>
                                    </div>

                                    {/* Month Selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-semibold">Reporting Month:</span>
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => {
                                                setSelectedPeriod(e.target.value);
                                                handleFilterChange({ period: e.target.value });
                                            }}
                                            className="h-8 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                        >
                                            {monthly_periods.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Faculty Name</th>
                                                <th className="px-4 py-3 font-semibold">Program</th>
                                                <th className="px-4 py-3 font-semibold text-center">Scheduled</th>
                                                <th className="px-4 py-3 font-semibold text-center">Present</th>
                                                <th className="px-4 py-3 font-semibold text-center">Late Sessions</th>
                                                <th className="px-4 py-3 font-semibold text-center">Late Minutes</th>
                                                <th className="px-4 py-3 font-semibold text-center">Absent</th>
                                                <th className="px-4 py-3 font-semibold text-center">Rate (%)</th>
                                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredSummaries.map(summary => (
                                                <tr key={summary.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5 font-bold text-foreground">
                                                        {summary.instructor_name}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                                                        {summary.faculty?.program?.code || 'CIDS Faculty'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-foreground tabular-nums">
                                                        {summary.scheduled_sessions}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {summary.present_count}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                        {summary.late_count}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground tabular-nums">
                                                        {summary.total_late_minutes}m
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                        {summary.absent_count}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={cn(
                                                            "inline-flex px-2.5 py-0.5 rounded-full text-xs font-black tabular-nums",
                                                            summary.attendance_rate >= 90
                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                : summary.attendance_rate >= 75
                                                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                        )}>
                                                            {summary.attendance_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        {summary.faculty ? (
                                                            <Link
                                                                href={`/faculties/${summary.faculty.id}`}
                                                                className="text-xs font-semibold text-primary hover:underline"
                                                            >
                                                                View Dossier
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenLinkModal(summary.instructor_name)}
                                                                className="text-xs text-amber-600 font-semibold hover:underline cursor-pointer"
                                                            >
                                                                Link Profile
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: FACULTY RECORDS & MAPPING */}
                    {activeTab === 'records' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="pb-4 border-b border-border">
                                    <h2 className="text-base font-bold text-foreground">Faculty Profile Linking & Mapping</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Establish links between Google Spreadsheet instructor identifiers and official CIDS OfficeHub profiles
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                                    {filteredSummaries.map(s => {
                                        const isLinked = !!s.faculty;
                                        return (
                                            <div
                                                key={s.id}
                                                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-mono font-bold text-muted-foreground">
                                                            Sheet: {s.instructor_name}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                                            isLinked
                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                        )}>
                                                            {isLinked ? 'Linked' : 'Unlinked'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3">
                                                        <p className="text-sm font-bold text-foreground">
                                                            {s.faculty?.first_name} {s.faculty?.last_name || s.instructor_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {s.faculty?.program?.name || 'Department of Computing & Information'}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>Rate: <strong>{s.attendance_rate}%</strong></span>
                                                        <span>Sessions: <strong>{s.scheduled_sessions}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenLinkModal(s.instructor_name)}
                                                        className="w-full text-xs font-semibold cursor-pointer"
                                                    >
                                                        <Link2 className="w-3.5 h-3.5 mr-1 text-primary" />
                                                        {isLinked ? 'Change Profile Link' : 'Map to OfficeHub Profile'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: GOOGLE SHEETS SYNC */}
                    {activeTab === 'sync' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="pb-4 border-b border-border">
                                    <h2 className="text-base font-bold text-foreground">Google Spreadsheet Configuration</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Synchronization parameters, column schema mappings, and synchronization status
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                                Connected Spreadsheet URL
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={sheet_url}
                                                className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs font-mono text-foreground"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                                    Spreadsheet ID
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value="15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0"
                                                    className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs font-mono text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                                    Worksheet GID
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value="623072317"
                                                    className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs font-mono text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Connection Status:</span>
                                                <span className="font-bold text-emerald-600">Active & Verified</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Last Successful Sync:</span>
                                                <span className="font-bold text-foreground">{last_synced_at}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Total Records Synced:</span>
                                                <span className="font-bold text-foreground">{weekly_sessions.length} sessions, {summaries.length} faculty totals</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl border border-border bg-card">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                                Synchronization Protocol
                                            </h3>
                                            <ul className="text-xs text-muted-foreground space-y-2.5">
                                                <li className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Live fetch using public Google Sheets CSV export protocol with automatic header skip and multi-block layout parser.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Extracts Monday through Friday scheduled teaching hours and compares marked indicators (Present, Late, Absent).</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Automatically links attendance data to existing faculty profiles by last name and configured aliases.</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={handleSync}
                                                disabled={isSyncing}
                                                className="w-full text-xs font-bold cursor-pointer"
                                            >
                                                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                                                {isSyncing ? 'Synchronizing...' : 'Perform Full Resynchronization'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. LINK FACULTY DIALOG                                                    */}
            {/* ========================================================================= */}
            <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Link Faculty Profile</DialogTitle>
                        <DialogDescription>
                            Connect Google Sheet instructor identifier <strong>"{selectedInstructorToLink}"</strong> to an existing CIDS OfficeHub faculty profile.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Select OfficeHub Faculty
                            </label>
                            <select
                                value={selectedFacultyId}
                                onChange={(e) => setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full h-10 rounded-lg border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                            >
                                <option value="">-- Choose faculty member --</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.last_name}, {f.first_name} ({f.program?.code || 'CIDS'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveLink} disabled={!selectedFacultyId}>
                            Save & Link Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* 6. PRINT CONFIGURATION MODAL                                              */}
            {/* ========================================================================= */}
            <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Printable Attendance Report Configuration</DialogTitle>
                        <DialogDescription>
                            Select the reporting boundaries, format, and designated official signatories for the official attendance report.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        {/* Report Period & Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Report Format
                                </label>
                                <select
                                    value={printConfig.periodType}
                                    onChange={(e) => setPrintConfig({ ...printConfig, periodType: e.target.value })}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-3 font-semibold"
                                >
                                    <option value="monthly">Monthly Summary</option>
                                    <option value="weekly">Weekly Summary</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Period Boundary
                                </label>
                                <select
                                    value={printConfig.period}
                                    onChange={(e) => setPrintConfig({ ...printConfig, period: e.target.value })}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-3 font-semibold"
                                >
                                    {printConfig.periodType === 'monthly'
                                        ? monthly_periods.map(p => <option key={p} value={p}>{p}</option>)
                                        : weekly_periods.map(w => <option key={w} value={w}>{w}</option>)
                                    }
                                </select>
                            </div>
                        </div>

                        {/* Program Filter */}
                        <div>
                            <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                Academic Program
                            </label>
                            <select
                                value={printConfig.programId}
                                onChange={(e) => setPrintConfig({ ...printConfig, programId: e.target.value })}
                                className="w-full h-9 rounded-lg border border-input bg-card px-3 font-semibold"
                            >
                                <option value="all">All College Programs (Consolidated)</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Signatories Configuration */}
                        <div className="pt-2 border-t border-border">
                            <h4 className="font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                Signatories (Unsigned on PDF until official approval)
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="font-semibold text-muted-foreground block mb-1">
                                        Prepared by (Monitoring Coordinator)
                                    </label>
                                    <input
                                        type="text"
                                        value={printConfig.monitoringCoordinator}
                                        onChange={(e) => setPrintConfig({ ...printConfig, monitoringCoordinator: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-input bg-card px-2.5 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-muted-foreground block mb-1">
                                        Verified by (Program Chair)
                                    </label>
                                    <input
                                        type="text"
                                        value={printConfig.programChair}
                                        onChange={(e) => setPrintConfig({ ...printConfig, programChair: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-input bg-card px-2.5 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-muted-foreground block mb-1">
                                        Noted by (College Dean)
                                    </label>
                                    <input
                                        type="text"
                                        value={printConfig.collegeDean}
                                        onChange={(e) => setPrintConfig({ ...printConfig, collegeDean: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-input bg-card px-2.5 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPrintModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setPrintModalOpen(false);
                            setTimeout(() => triggerBrowserPrint(), 300);
                        }}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print / Save as PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* 7. PRINTABLE ATTENDANCE REPORT VIEW (Exact match to user uploaded mockup) */}
            {/* ========================================================================= */}
            <div className="print-only p-8 text-black bg-white max-w-4xl mx-auto">
                {/* Official Institutional Header */}
                <div className="text-center space-y-1 mb-8">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-700">
                        Republic of the Philippines
                    </p>
                    <h1 className="text-lg font-black tracking-wider text-black uppercase">
                        DAVAO DEL SUR STATE COLLEGE
                    </h1>
                    <p className="text-xs font-semibold text-slate-800">
                        College of Information and Digital Sciences
                    </p>
                </div>

                {/* Report Title */}
                <div className="text-center my-6 space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-black">
                        {printConfig.periodType === 'monthly' ? 'MONTHLY' : 'WEEKLY'} FACULTY ATTENDANCE SUMMARY
                    </h2>
                    <p className="text-xs font-semibold text-slate-700">
                        Reporting Period: [{printConfig.period}]
                    </p>
                </div>

                {/* Metadata details line */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 border-b border-slate-300 pb-1">
                    <span>Doc Ref: CIDS-ATT-{new Date().getFullYear()}-{(Math.random() + 1).toString(36).substring(7).toUpperCase()}</span>
                    <span>Source Synced: {last_synced_at}</span>
                    <span>Printed: {new Date().toLocaleDateString()}</span>
                </div>

                {/* Data Table */}
                <div className="mt-4">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black text-[11px] font-bold text-black uppercase">
                                <th className="py-2.5 px-2 text-left">Faculty</th>
                                <th className="py-2.5 px-2 text-center">Scheduled</th>
                                <th className="py-2.5 px-2 text-center">Present</th>
                                <th className="py-2.5 px-2 text-center">Late</th>
                                <th className="py-2.5 px-2 text-center">Absent</th>
                                <th className="py-2.5 px-2 text-center">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {printRecords.map((item: any, idx: number) => {
                                const name = item.instructor_name;
                                const scheduled = item.scheduled_sessions ?? item.scheduled ?? 0;
                                const present = item.present_count ?? item.present ?? 0;
                                const late = item.late_count ?? item.late ?? 0;
                                const absent = item.absent_count ?? item.absent ?? 0;
                                const rate = item.attendance_rate ?? item.rate ?? 0;

                                return (
                                    <tr key={idx} className="text-slate-900">
                                        <td className="py-2 px-2 font-semibold">{name}</td>
                                        <td className="py-2 px-2 text-center tabular-nums">{scheduled}</td>
                                        <td className="py-2 px-2 text-center tabular-nums">{present}</td>
                                        <td className="py-2 px-2 text-center tabular-nums">{late}</td>
                                        <td className="py-2 px-2 text-center tabular-nums">{absent}</td>
                                        <td className="py-2 px-2 text-center font-bold tabular-nums">{rate}%</td>
                                    </tr>
                                );
                            })}
                            {printRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                                        Awaiting report data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Verification Notice matching mockup */}
                <div className="mt-4 text-[10px] text-slate-500 italic flex items-center justify-between">
                    <span>Records generated from verified attendance data</span>
                    <span>Status: Verified Official Dossier</span>
                </div>

                {/* Configurable Official Signatories (Exactly matching user uploaded image mockup) */}
                <div className="mt-16 pt-6">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        {/* Prepared by */}
                        <div>
                            <p className="text-xs font-semibold text-slate-700 mb-12">
                                Prepared by:
                            </p>
                            <div className="border-t border-black pt-2">
                                <p className="text-xs font-bold text-black uppercase">
                                    {printConfig.monitoringCoordinator}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                    {printConfig.monitoringCoordinatorTitle}
                                </p>
                            </div>
                        </div>

                        {/* Verified by */}
                        <div>
                            <p className="text-xs font-semibold text-slate-700 mb-12">
                                Verified by:
                            </p>
                            <div className="border-t border-black pt-2">
                                <p className="text-xs font-bold text-black uppercase">
                                    {printConfig.programChair}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                    {printConfig.programChairTitle}
                                </p>
                            </div>
                        </div>

                        {/* Noted by */}
                        <div>
                            <p className="text-xs font-semibold text-slate-700 mb-12">
                                Noted by:
                            </p>
                            <div className="border-t border-black pt-2">
                                <p className="text-xs font-bold text-black uppercase">
                                    {printConfig.collegeDean}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                    {printConfig.collegeDeanTitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[9px] text-slate-400 text-center mt-12 italic">
                        Example print structure. Actual signatories and document headers follow institutional policy. Signature lines remain unsigned until official review.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
