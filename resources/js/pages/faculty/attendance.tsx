import React, { useState, useMemo, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Printer,
    Download,
    Send,
    ChevronLeft,
    ChevronRight,
    Search,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    TrendingUp,
    Table as TableIcon,
    RotateCcw,
    SlidersHorizontal,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    academic_rank?: string;
    employment_type?: string;
    program?: {
        id: number;
        code: string;
        name: string;
    };
}

interface SessionRecord {
    id: number;
    session_date: string;
    day_of_week?: string;
    time_slot: string;
    course_code?: string;
    subject?: string;
    section?: string;
    room?: string;
    status: string;
    late_minutes: number;
    remarks?: string;
    week_label: string;
}

interface SummaryData {
    scheduled_sessions: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    total_late_minutes: number;
    attendance_rate: number;
}

interface MonthlySummaryItem {
    id: number;
    period_label: string;
    scheduled_sessions: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    total_late_minutes: number;
    attendance_rate: number;
}

interface Props {
    faculty: Faculty | null;
    sessions: SessionRecord[];
    summary: SummaryData | null;
    monthlySummaries: MonthlySummaryItem[];
    monthlyPeriods: string[];
    weeklyPeriods: string[];
    filters: {
        view_type: 'weekly' | 'monthly';
        month: string;
        week: string;
        status: string;
    };
    academic_year: string;
    semester: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Attendance', href: '/faculty/attendance' },
];

export default function FacultyAttendancePage({
    faculty,
    sessions = [],
    summary,
    monthlySummaries = [],
    monthlyPeriods = [],
    weeklyPeriods = [],
    filters,
    academic_year = 'AY 2026–2027',
    semester = '1st Semester',
}: Props) {
    const [viewType, setViewType] = useState<'weekly' | 'monthly'>(filters.view_type || 'weekly');
    const [selectedWeek, setSelectedWeek] = useState(filters.week || 'all');
    const [selectedMonth, setSelectedMonth] = useState(filters.month || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [searchTerm, setSearchTerm] = useState('');

    // Formal Report Generation Modal State
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportFormat, setReportFormat] = useState<'weekly' | 'monthly'>('weekly');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    // Week navigation stepper
    const currentWeekIndex = useMemo(() => {
        const idx = weeklyPeriods.indexOf(selectedWeek);
        return idx !== -1 ? idx : -1;
    }, [weeklyPeriods, selectedWeek]);

    const handleFilterChange = (updates: Partial<typeof filters>) => {
        router.get(
            '/faculty/attendance',
            {
                view_type: updates.view_type !== undefined ? updates.view_type : viewType,
                week: updates.week !== undefined ? updates.week : selectedWeek,
                month: updates.month !== undefined ? updates.month : selectedMonth,
                status: updates.status !== undefined ? updates.status : selectedStatus,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePrevWeek = () => {
        if (currentWeekIndex > 0) {
            const prev = weeklyPeriods[currentWeekIndex - 1];
            setSelectedWeek(prev);
            handleFilterChange({ week: prev });
        }
    };

    const handleNextWeek = () => {
        if (currentWeekIndex < weeklyPeriods.length - 1) {
            const next = weeklyPeriods[currentWeekIndex + 1];
            setSelectedWeek(next);
            handleFilterChange({ week: next });
        }
    };

    // Filter sessions locally based on search term
    const filteredSessions = useMemo(() => {
        return sessions.filter(s => {
            const matchesSearch = !searchTerm ||
                (s.subject && s.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.course_code && s.course_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.room && s.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.section && s.section.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = selectedStatus === 'all' || s.status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [sessions, searchTerm, selectedStatus]);

    // Printable / Downloadable PDF action using html2canvas & jsPDF
    const handleGeneratePdf = async () => {
        const sheetElement = document.getElementById('faculty-report-sheet');
        if (!sheetElement || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        const fileName = `DSSC_Faculty_Attendance_${faculty?.last_name || 'Faculty'}_${viewType === 'weekly' ? selectedWeek.replace(/[\s–—-]+/g, '_') : selectedMonth.replace(/[\s–—-]+/g, '_')}.pdf`;

        try {
            const html2canvasModule = await import('html2canvas-pro');
            const html2canvas = html2canvasModule.default || html2canvasModule;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(sheetElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
            }

            pdf.save(fileName);
            setIsGeneratingPdf(false);
        } catch (err) {
            console.error('PDF export failed, fallback to print:', err);
            setIsGeneratingPdf(false);
            window.print();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Attendance - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                {/* 1. Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-foreground tracking-tight">Teaching Attendance</h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-300 dark:border-amber-700/50">
                                {academic_year} · {semester}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Authoritative teaching attendance synchronized with institutional monitoring sheets and college master records.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            onClick={() => {
                                setReportFormat(viewType);
                                setReportModalOpen(true);
                            }}
                            variant="outline"
                            className="gap-2 text-xs font-bold rounded-xl h-9"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Generate Official Report</span>
                        </Button>

                        <Link
                            href="/faculty/corrections"
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors h-9"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispute / Request Correction</span>
                        </Link>
                    </div>
                </div>

                {/* 2. KPI Metric Cards (Consolidated with Super Admin metrics) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance Rate</span>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-black text-foreground mt-1">
                            {summary?.attendance_rate ?? 100}%
                        </div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Verified Institutional Standing</div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Sessions</span>
                            <CalendarDays className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-2xl font-black text-foreground mt-1">
                            {summary?.scheduled_sessions ?? sessions.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Assigned lecture/lab slots</div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                            {summary?.present_count ?? sessions.filter(s => in_array_status(s.status, ['present', 'online'])).length}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Conducted on schedule</div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late Sessions</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                            {summary?.late_count ?? 0}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                            {summary?.total_late_minutes ? `${summary.total_late_minutes} mins total` : 'Zero late minutes'}
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absences</span>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-black text-rose-600 mt-1">
                            {summary?.absent_count ?? 0}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                            {(summary?.absent_count ?? 0) === 0 ? 'Clean Attendance Record' : 'Requires Make-Up filing'}
                        </div>
                    </div>
                </div>

                {/* 3. Filter Navigation Tabs & Stepper: Weekly vs Monthly */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-4 shadow-2xs">
                    {/* View Type Toggle */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setViewType('weekly');
                                handleFilterChange({ view_type: 'weekly' });
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                viewType === 'weekly'
                                    ? "bg-background text-foreground shadow-xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                            <span>Weekly Sessions</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewType('monthly');
                                handleFilterChange({ view_type: 'monthly' });
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                viewType === 'monthly'
                                    ? "bg-background text-foreground shadow-xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>Monthly Summary Matrix</span>
                        </button>
                    </div>

                    {/* Dynamic Filters depending on view */}
                    <div className="flex flex-wrap items-center gap-3">
                        {viewType === 'weekly' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Week:</span>
                                <div className="flex items-center gap-1">
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => {
                                            setSelectedWeek(e.target.value);
                                            handleFilterChange({ week: e.target.value });
                                        }}
                                        className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                    >
                                        <option value="all">All Weeks (Full Semester)</option>
                                        {weeklyPeriods.map((w) => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handlePrevWeek}
                                        disabled={currentWeekIndex <= 0}
                                        className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                                        title="Previous Week"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextWeek}
                                        disabled={currentWeekIndex === -1 || currentWeekIndex >= weeklyPeriods.length - 1}
                                        className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                                        title="Next Week"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Month:</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(e.target.value);
                                        handleFilterChange({ month: e.target.value });
                                    }}
                                    className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                >
                                    <option value="all">All Months (Full Semester)</option>
                                    {monthlyPeriods.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                </div>

                {/* 4. Weekly Sessions Table View */}
                {viewType === 'weekly' && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs space-y-4 p-5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
                            <div>
                                <h2 className="text-sm font-bold text-foreground">
                                    Verified Class Sessions ({selectedWeek === 'all' ? 'All Weeks' : selectedWeek})
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Individual classroom teaching sessions logged for your assigned sections.
                                </p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search subject, section, room..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 text-muted-foreground border-b border-border/80 uppercase text-[11px] font-bold">
                                    <tr>
                                        <th className="p-3.5">Date & Day</th>
                                        <th className="p-3.5">Time Slot</th>
                                        <th className="p-3.5">Subject / Course</th>
                                        <th className="p-3.5">Section</th>
                                        <th className="p-3.5">Room / Lab</th>
                                        <th className="p-3.5 text-center">Status</th>
                                        <th className="p-3.5">Late (Mins)</th>
                                        <th className="p-3.5">Remarks</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border font-medium">
                                    {filteredSessions.length > 0 ? (
                                        filteredSessions.map((r) => (
                                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3.5 whitespace-nowrap font-bold text-foreground">
                                                    <div>{r.day_of_week || 'Mon'}</div>
                                                    <div className="text-[11px] text-muted-foreground font-normal">
                                                        {r.session_date ? new Date(r.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 font-mono text-foreground whitespace-nowrap">{r.time_slot}</td>
                                                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">
                                                    {r.subject || r.course_code || '—'}
                                                </td>
                                                <td className="p-3.5 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-muted text-foreground border border-border">
                                                        {r.section || faculty?.program?.code || '—'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-muted-foreground whitespace-nowrap">{r.room || '—'}</td>
                                                <td className="p-3.5 text-center whitespace-nowrap">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                                                        r.status.toLowerCase() === 'present' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                                                        r.status.toLowerCase() === 'late' && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                                                        r.status.toLowerCase() === 'absent' && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
                                                        r.status.toLowerCase() === 'online' && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                                    )}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 whitespace-nowrap">
                                                    {r.late_minutes > 0 ? `${r.late_minutes}m` : '—'}
                                                </td>
                                                <td className="p-3.5 text-muted-foreground whitespace-nowrap">{r.remarks || '—'}</td>
                                                <td className="p-3.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={`/faculty/corrections?session_id=${r.id}`}
                                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline"
                                                    >
                                                        Dispute
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                No attendance session records found for {selectedWeek === 'all' ? 'the selected filter' : selectedWeek}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. Monthly Attendance Matrix Table View */}
                {viewType === 'monthly' && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs space-y-4 p-5">
                        <div className="pb-3 border-b border-border">
                            <h2 className="text-sm font-bold text-foreground">Monthly Attendance Matrix</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Consolidated teaching performance and attendance percentages per academic month.
                            </p>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 text-muted-foreground border-b border-border uppercase text-[11px] font-bold">
                                    <tr>
                                        <th className="p-3.5">Month</th>
                                        <th className="p-3.5 text-center">Scheduled Sessions</th>
                                        <th className="p-3.5 text-center">Present Sessions</th>
                                        <th className="p-3.5 text-center">Late Sessions</th>
                                        <th className="p-3.5 text-center">Absent Sessions</th>
                                        <th className="p-3.5 text-center">Total Late Mins</th>
                                        <th className="p-3.5 text-center">Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border font-medium">
                                    {monthlySummaries.length > 0 ? (
                                        monthlySummaries.map((m) => (
                                            <tr key={m.id} className="hover:bg-muted/30">
                                                <td className="p-3.5 font-bold text-foreground">{m.period_label}</td>
                                                <td className="p-3.5 text-center tabular-nums">{m.scheduled_sessions}</td>
                                                <td className="p-3.5 text-center text-emerald-600 font-bold tabular-nums">{m.present_count}</td>
                                                <td className="p-3.5 text-center text-amber-600 font-bold tabular-nums">{m.late_count}</td>
                                                <td className="p-3.5 text-center text-rose-600 font-bold tabular-nums">{m.absent_count}</td>
                                                <td className="p-3.5 text-center tabular-nums">{m.total_late_minutes}m</td>
                                                <td className="p-3.5 text-center font-black text-emerald-600 tabular-nums">
                                                    {m.attendance_rate}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No monthly attendance summaries computed yet for this semester.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. Formal Report Modal (Identical to Super Admin Faculty Attendance Form) */}
                <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between text-base font-bold">
                                <span>Official Faculty Attendance Report Preview</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                    {academic_year} · {semester}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Official institutional format matching Davao del Sur State College College of Information and Communications Technology standards.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Paper Sheet Preview */}
                        <div className="w-full overflow-x-auto flex justify-center py-4 bg-muted/40 rounded-xl border border-border">
                            <div
                                id="faculty-report-sheet"
                                className="w-full max-w-[800px] min-h-[950px] bg-white text-slate-900 border border-slate-300 shadow-lg p-8 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    {/* DSSC Letterhead */}
                                    <div className="flex flex-col items-center justify-center text-center pb-2 space-y-1">
                                        <img
                                            src="/CIDS_Logo.jpg"
                                            alt="CIDS Logo"
                                            className="w-14 h-14 object-contain rounded-full shadow-xs"
                                            onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] tracking-wider text-slate-600 uppercase font-semibold">
                                                REPUBLIC OF THE PHILIPPINES
                                            </p>
                                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                DAVAO DEL SUR STATE COLLEGE
                                            </h2>
                                            <p className="text-[10px] font-bold text-slate-700">
                                                College of Information and Communications Technology
                                            </p>
                                            <p className="text-[8.5px] text-slate-500 font-medium">
                                                Brgy. Matti, Digos City, Davao del Sur
                                            </p>
                                        </div>
                                    </div>

                                    {/* Report Title */}
                                    <div className="bg-slate-50 border border-slate-300 py-2 text-center rounded-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            INDIVIDUAL FACULTY ATTENDANCE COMPLIANCE REPORT
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                                            {viewType === 'weekly'
                                                ? (selectedWeek === 'all' ? 'All Recorded Weeks (Full Semester)' : selectedWeek)
                                                : (selectedMonth === 'all' ? 'All Recorded Months (Full Semester)' : selectedMonth)}
                                        </p>
                                        <p className="text-[9px] text-slate-600">
                                            {academic_year} · {semester}
                                        </p>
                                    </div>

                                    {/* Faculty Metadata Box */}
                                    <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3 text-[10px] rounded bg-slate-50/50">
                                        <div>
                                            <div><span className="font-bold">Faculty Member:</span> {faculty?.first_name} {faculty?.last_name}</div>
                                            <div><span className="font-bold">Academic Rank:</span> {faculty?.academic_rank || 'Instructor I'}</div>
                                            <div><span className="font-bold">Department / Program:</span> {faculty?.program?.name || 'Computer Science'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div><span className="font-bold">Employment Type:</span> {faculty?.employment_type || 'Full-time'}</div>
                                            <div><span className="font-bold">Generated On:</span> {new Date().toLocaleDateString()}</div>
                                            <div><span className="font-bold">Verification:</span> Official Verified Record</div>
                                        </div>
                                    </div>

                                    {/* Key Totals Table */}
                                    <div className="space-y-1">
                                        <div className="text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                                            I. SUMMARY METRICS
                                        </div>
                                        <table className="w-full text-[10px] text-center border border-slate-300 border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                                                    <th className="py-1.5 border-r border-slate-300">SCHEDULED</th>
                                                    <th className="py-1.5 border-r border-slate-300">PRESENT</th>
                                                    <th className="py-1.5 border-r border-slate-300">LATE</th>
                                                    <th className="py-1.5 border-r border-slate-300">ABSENT</th>
                                                    <th className="py-1.5 border-r border-slate-300">LATE MINS</th>
                                                    <th className="py-1.5">ATTENDANCE RATE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="font-mono font-bold">
                                                    <td className="py-1.5 border-r border-slate-300">{summary?.scheduled_sessions ?? sessions.length}</td>
                                                    <td className="py-1.5 border-r border-slate-300">{summary?.present_count ?? 0}</td>
                                                    <td className="py-1.5 border-r border-slate-300">{summary?.late_count ?? 0}</td>
                                                    <td className="py-1.5 border-r border-slate-300">{summary?.absent_count ?? 0}</td>
                                                    <td className="py-1.5 border-r border-slate-300">{summary?.total_late_minutes ?? 0}m</td>
                                                    <td className="py-1.5 font-black">{summary?.attendance_rate ?? 100}%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Session Details Table */}
                                    <div className="space-y-1">
                                        <div className="text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                                            II. LOGGED SESSION ENTRIES
                                        </div>
                                        <table className="w-full text-[9px] text-left border border-slate-300 border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                                                    <th className="py-1.5 px-2 border-r border-slate-300">DATE & DAY</th>
                                                    <th className="py-1.5 px-2 border-r border-slate-300">TIME SLOT</th>
                                                    <th className="py-1.5 px-2 border-r border-slate-300">SUBJECT</th>
                                                    <th className="py-1.5 px-2 border-r border-slate-300">SECTION</th>
                                                    <th className="py-1.5 px-2 border-r border-slate-300">ROOM</th>
                                                    <th className="py-1.5 px-2 text-center border-r border-slate-300">STATUS</th>
                                                    <th className="py-1.5 px-2">REMARKS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {sessions.length > 0 ? (
                                                    sessions.map((s, idx) => (
                                                        <tr key={s.id || idx}>
                                                            <td className="py-1 px-2 border-r border-slate-200">{s.session_date} ({s.day_of_week || '—'})</td>
                                                            <td className="py-1 px-2 font-mono border-r border-slate-200">{s.time_slot}</td>
                                                            <td className="py-1 px-2 border-r border-slate-200">{s.subject || s.course_code || '—'}</td>
                                                            <td className="py-1 px-2 border-r border-slate-200">{s.section || '—'}</td>
                                                            <td className="py-1 px-2 border-r border-slate-200">{s.room || '—'}</td>
                                                            <td className="py-1 px-2 text-center font-bold border-r border-slate-200">{s.status}</td>
                                                            <td className="py-1 px-2 text-slate-600">{s.remarks || (s.late_minutes > 0 ? `${s.late_minutes}m late` : '—')}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                                                            No verified session entries recorded for this period.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Tri-Signatories Section */}
                                <div className="mt-8 pt-4">
                                    <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
                                        <div className="space-y-8">
                                            <p className="text-left font-bold text-slate-900">Conformed by:</p>
                                            <div className="border-t border-slate-900 pt-1">
                                                <p className="font-black uppercase">{faculty?.first_name} {faculty?.last_name}</p>
                                                <p className="text-[9px] text-slate-600">Faculty Member</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <p className="text-left font-bold text-slate-900">Verified by:</p>
                                            <div className="border-t border-slate-900 pt-1">
                                                <p className="font-black uppercase">Program Chairperson</p>
                                                <p className="text-[9px] text-slate-600">{faculty?.program?.name || 'Department Academic Unit'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <p className="text-left font-bold text-slate-900">Noted by:</p>
                                            <div className="border-t border-slate-900 pt-1">
                                                <p className="font-black uppercase">Dr. Ramon Santos, PECE</p>
                                                <p className="text-[9px] text-slate-600">College Dean</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
                                Close Preview
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleGeneratePdf}
                                disabled={isGeneratingPdf}
                                className="gap-1.5 bg-primary text-primary-foreground font-bold"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

function in_array_status(status: string, arr: string[]): boolean {
    return arr.includes(status.toLowerCase());
}
