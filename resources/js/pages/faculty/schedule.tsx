import React, { useState, useMemo, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Table as TableIcon,
    LayoutGrid,
    MapPin,
    Clock,
    BookOpen,
    Download,
    Printer,
    Users,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Search,
    GraduationCap,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScheduleItem {
    id: number;
    course_code?: string;
    course_title?: string;
    section?: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_name: string;
    instructor?: string;
}

interface Props {
    faculty: {
        id: number;
        first_name: string;
        last_name: string;
        academic_rank?: string;
        employment_type?: string;
        program?: {
            id: number;
            name: string;
            code: string;
        };
    } | null;
    schedules: ScheduleItem[];
    academic_year?: string;
    semester?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Teaching Schedule', href: '/faculty/schedule' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS_MAP: Record<string, string> = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
};

// 1-hour slots from 07:00 to 18:00 (6:00 PM)
const TIME_WINDOWS = [
    { label: '7:00', startHour: 7, endHour: 8 },
    { label: '8:00', startHour: 8, endHour: 9 },
    { label: '9:00', startHour: 9, endHour: 10 },
    { label: '10:00', startHour: 10, endHour: 11 },
    { label: '11:00', startHour: 11, endHour: 12 },
    { label: '12:00', startHour: 12, endHour: 13 },
    { label: '1:00', startHour: 13, endHour: 14 },
    { label: '2:00', startHour: 14, endHour: 15 },
    { label: '3:00', startHour: 15, endHour: 16 },
    { label: '4:00', startHour: 16, endHour: 17 },
    { label: '5:00', startHour: 17, endHour: 18 },
    { label: '6:00', startHour: 18, endHour: 19 },
];

// Helper to convert "HH:MM:SS" or "HH:MM" to decimal hours (e.g. "07:30:00" -> 7.5)
function parseTimeToHours(timeStr?: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h + m / 60;
}

// Generate color accents for distinct subjects
const SUBJECT_COLORS = [
    { bg: 'bg-amber-100 dark:bg-amber-950/60', border: 'border-amber-300 dark:border-amber-700/60', text: 'text-amber-900 dark:text-amber-200', tag: 'bg-amber-200/60 text-amber-900' },
    { bg: 'bg-sky-100 dark:bg-sky-950/60', border: 'border-sky-300 dark:border-sky-700/60', text: 'text-sky-900 dark:text-sky-200', tag: 'bg-sky-200/60 text-sky-900' },
    { bg: 'bg-emerald-100 dark:bg-emerald-950/60', border: 'border-emerald-300 dark:border-emerald-700/60', text: 'text-emerald-900 dark:text-emerald-200', tag: 'bg-emerald-200/60 text-emerald-900' },
    { bg: 'bg-purple-100 dark:bg-purple-950/60', border: 'border-purple-300 dark:border-purple-700/60', text: 'text-purple-900 dark:text-purple-200', tag: 'bg-purple-200/60 text-purple-900' },
    { bg: 'bg-rose-100 dark:bg-rose-950/60', border: 'border-rose-300 dark:border-rose-700/60', text: 'text-rose-900 dark:text-rose-200', tag: 'bg-rose-200/60 text-rose-900' },
    { bg: 'bg-indigo-100 dark:bg-indigo-950/60', border: 'border-indigo-300 dark:border-indigo-700/60', text: 'text-indigo-900 dark:text-indigo-200', tag: 'bg-indigo-200/60 text-indigo-900' },
];

export default function FacultySchedulePage({
    faculty,
    schedules = [],
    academic_year = 'AY 2026–2027',
    semester = '1st Semester',
}: Props) {
    const [viewMode, setViewMode] = useState<'timetable' | 'list'>('timetable');
    const [selectedDay, setSelectedDay] = useState<string>('All');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const timetablePrintRef = useRef<HTMLDivElement>(null);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Map course codes to persistent color indices
    const courseColorMap = useMemo(() => {
        const map: Record<string, typeof SUBJECT_COLORS[0]> = {};
        let colorIdx = 0;
        schedules.forEach((s) => {
            const key = s.course_code || s.course_title || 'General';
            if (!map[key]) {
                map[key] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
                colorIdx++;
            }
        });
        return map;
    }, [schedules]);

    // Filter schedules for card/list view
    const filteredSchedules = useMemo(() => {
        if (selectedDay === 'All') return schedules;
        return schedules.filter((s) => s.day_of_week.toLowerCase() === selectedDay.toLowerCase());
    }, [schedules, selectedDay]);

    // Check if an item is active during a given hour slot on a given day
    const getSchedulesForSlot = (dayShort: string, slotStart: number, slotEnd: number) => {
        const fullDay = FULL_DAYS_MAP[dayShort] || dayShort;
        return schedules.filter((s) => {
            const dayMatches = s.day_of_week.toLowerCase().startsWith(fullDay.toLowerCase().substring(0, 3));
            if (!dayMatches) return false;

            const itemStart = parseTimeToHours(s.start_time);
            const itemEnd = parseTimeToHours(s.end_time);

            // True if session overlaps with this 1-hour slot
            return Math.max(itemStart, slotStart) < Math.min(itemEnd, slotEnd);
        });
    };

    // PDF / Print Handler
    const handleExportPdf = async () => {
        const element = document.getElementById('faculty-timetable-printable');
        if (!element || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        const fileName = `Class_Timetable_${faculty?.last_name || 'Faculty'}_${academic_year.replace(/[\s–—-]+/g, '_')}.pdf`;

        try {
            const html2canvasModule = await import('html2canvas-pro');
            const html2canvas = html2canvasModule.default || html2canvasModule;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for wide timetable
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
            console.error('PDF export failed, falling back to window.print():', err);
            setIsGeneratingPdf(false);
            window.print();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Class Schedule - Timetable & Load" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto">
                {/* 1. Top Header & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-foreground tracking-tight">My Class Schedule</h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-300 dark:border-amber-700/50">
                                {academic_year} · {semester}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Official verified class timetable for {faculty?.first_name} {faculty?.last_name} ({faculty?.program?.name || 'College of Information and Communications Technology'}).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Timetable vs List View Switcher */}
                        <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('timetable')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                    viewMode === 'timetable'
                                        ? "bg-background text-foreground shadow-xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <TableIcon className="w-3.5 h-3.5 text-amber-500" />
                                <span>Timetable View</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                    viewMode === 'list'
                                        ? "bg-background text-foreground shadow-xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                                <span>Card List</span>
                            </button>
                        </div>

                        <Link
                            href="/schedule/adjustments"
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Request Swap</span>
                        </Link>

                        <Button
                            variant="outline"
                            onClick={handleExportPdf}
                            disabled={isGeneratingPdf}
                            className="gap-1.5 text-xs font-bold rounded-xl h-9 border-border hover:bg-muted"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isGeneratingPdf ? 'Exporting PDF...' : 'Export to PDF / Print'}</span>
                        </Button>
                    </div>
                </div>

                {/* 2. TIMETABLE VIEW (Matching User's Attached Screenshot & DSSC Formal Specifications) */}
                {viewMode === 'timetable' && (
                    <div className="space-y-4">
                        {/* Interactive Printable Timetable Sheet Container */}
                        <div
                            id="faculty-timetable-printable"
                            className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden p-4 md:p-6 bg-white dark:bg-card text-foreground"
                        >
                            {/* Institutional Letterhead (Shown in Print / Export) */}
                            <div className="flex flex-col sm:flex-row items-center justify-between pb-5 border-b border-border/80 gap-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/CIDS_Logo.jpg"
                                        alt="DSSC CIDS Logo"
                                        className="w-12 h-12 object-contain rounded-full shadow-2xs"
                                        onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Davao del Sur State College · CICT
                                        </p>
                                        <h2 className="text-base font-black text-foreground">
                                            OFFICIAL FACULTY CLASS TIMETABLE
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Instructor: <span className="font-bold text-foreground">{faculty?.first_name} {faculty?.last_name}</span> · {academic_year}, {semester}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right text-xs space-y-0.5">
                                    <div className="font-semibold text-muted-foreground">
                                        Assigned Units: <span className="font-bold text-foreground">{schedules.length * 3} units</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Total Active Classes: <span className="font-bold text-foreground">{schedules.length} sections</span>
                                    </div>
                                </div>
                            </div>

                            {/* The Timetable Grid */}
                            <div className="overflow-x-auto mt-4 rounded-xl border border-border">
                                <table className="w-full border-collapse text-xs select-none">
                                    <thead>
                                        {/* Yellow-tinted header matching attached user mockup */}
                                        <tr className="bg-[#fef9c3] dark:bg-amber-950/40 text-[#422006] dark:text-amber-200 border-b border-[#fde047] dark:border-amber-800/50">
                                            <th className="py-3 px-3 text-left font-black w-20 uppercase tracking-wider text-[11px] border-r border-[#fde047]/60 dark:border-amber-800/30">
                                                Time
                                            </th>
                                            {DAYS.map((d) => (
                                                <th
                                                    key={d}
                                                    className="py-3 px-3 text-left font-black uppercase tracking-wider text-[11px] border-r border-[#fde047]/60 dark:border-amber-800/30 min-w-[170px]"
                                                >
                                                    {d}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {TIME_WINDOWS.map((window) => {
                                            return (
                                                <tr
                                                    key={window.label}
                                                    className="hover:bg-muted/15 transition-colors h-16 divide-x divide-border/50"
                                                >
                                                    {/* Time Column */}
                                                    <td className="py-2 px-3 align-top font-bold text-muted-foreground text-xs bg-muted/10 whitespace-nowrap">
                                                        {window.label}
                                                    </td>

                                                    {/* Days Columns */}
                                                    {DAYS.map((dayShort) => {
                                                        const slotItems = getSchedulesForSlot(dayShort, window.startHour, window.endHour);

                                                        return (
                                                            <td
                                                                key={dayShort}
                                                                className="p-1.5 align-top relative"
                                                            >
                                                                {slotItems.map((item) => {
                                                                    const itemStart = parseTimeToHours(item.start_time);
                                                                    // Only render card body on the starting slot
                                                                    const isStartSlot = itemStart >= window.startHour && itemStart < window.endHour;

                                                                    if (!isStartSlot) {
                                                                        // Render a subtle continuation indicator
                                                                        return (
                                                                            <div
                                                                                key={item.id}
                                                                                className="w-full h-2 rounded-full bg-amber-300/40 dark:bg-amber-700/30 mb-1"
                                                                                title={`${item.course_code || 'Subject'} continuation`}
                                                                            />
                                                                        );
                                                                    }

                                                                    const colors = courseColorMap[item.course_code || item.course_title || 'General'] || SUBJECT_COLORS[0];

                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            className={cn(
                                                                                "p-2.5 rounded-xl border shadow-2xs space-y-1 transition-all hover:scale-[1.01]",
                                                                                // Warm cream/yellow accent default matching image
                                                                                colors.bg,
                                                                                colors.border,
                                                                                colors.text
                                                                            )}
                                                                        >
                                                                            <div className="font-black text-xs leading-tight tracking-tight">
                                                                                {item.course_code || 'CLASS'}
                                                                            </div>
                                                                            <div className="text-[11px] font-bold opacity-90 truncate">
                                                                                {item.section || 'All Sections'}
                                                                            </div>

                                                                            <div className="pt-1 flex items-center justify-between text-[10px] font-medium opacity-80">
                                                                                <span className="flex items-center gap-0.5">
                                                                                    <MapPin className="w-3 h-3 text-amber-600" />
                                                                                    <span>{item.room_name}</span>
                                                                                </span>
                                                                                <span className="font-mono text-[9.5px]">
                                                                                    {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tri-Signatories Section for Formal Report / Print */}
                            <div className="mt-8 pt-6 border-t border-border">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                                    <div className="space-y-6">
                                        <p className="text-left font-bold text-muted-foreground text-[11px]">Prepared by:</p>
                                        <div className="border-t border-foreground/30 pt-1">
                                            <p className="font-black uppercase text-foreground">{faculty?.first_name} {faculty?.last_name}</p>
                                            <p className="text-[10px] text-muted-foreground">Faculty Member</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-left font-bold text-muted-foreground text-[11px]">Verified by:</p>
                                        <div className="border-t border-foreground/30 pt-1">
                                            <p className="font-black uppercase text-foreground">Program Chairperson</p>
                                            <p className="text-[10px] text-muted-foreground">{faculty?.program?.name || 'Department Academic Unit'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-left font-bold text-muted-foreground text-[11px]">Approved by:</p>
                                        <div className="border-t border-foreground/30 pt-1">
                                            <p className="font-black uppercase text-foreground">Dr. Ramon Santos, PECE</p>
                                            <p className="text-[10px] text-muted-foreground">College Dean</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CARD LIST VIEW (Alternative Compact Perspective) */}
                {viewMode === 'list' && (
                    <div className="space-y-5">
                        {/* Day filters */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedDay('All')}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    selectedDay === 'All'
                                        ? "bg-primary text-primary-foreground shadow-2xs"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                All Days ({schedules.length})
                            </button>
                            {days.map((d) => {
                                const count = schedules.filter((s) => s.day_of_week.toLowerCase() === d.toLowerCase()).length;
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setSelectedDay(d)}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                                            selectedDay === d
                                                ? "bg-primary text-primary-foreground shadow-2xs"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <span>{d}</span>
                                        {count > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchedules.length > 0 ? (
                                filteredSchedules.map((s) => (
                                    <div
                                        key={s.id}
                                        className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                {s.day_of_week}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-muted-foreground">
                                                {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-sm font-extrabold text-foreground leading-snug">
                                                {s.course_code ? `${s.course_code} - ` : ''}
                                                {s.course_title || 'Subject Class'}
                                            </div>
                                            <div className="text-xs font-semibold text-muted-foreground mt-1">
                                                Section: {s.section || 'All Sections'}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                                <span>{s.room_name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-emerald-600">
                                                Confirmed Active
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground text-xs font-medium bg-card rounded-2xl border border-border">
                                    No scheduled classes found for {selectedDay}.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
