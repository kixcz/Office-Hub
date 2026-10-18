import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    CalendarDays,
    Clock,
    Plus,
    CheckCircle2,
    RotateCcw,
    MapPin,
    Radio,
    BookOpen,
    Eye,
    AlertCircle,
    Download,
    Printer,
    FileText,
    LayoutGrid,
    Table as TableIcon,
    Search,
    Trash2,
    Calendar,
    Layers,
    FlaskConical,
    GraduationCap,
    SlidersHorizontal,
    X,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Portal', href: '/faculty/dashboard' },
    { title: 'My Exam Schedules', href: '/faculty/exam-schedules' },
];

interface ExamSchedule {
    id: number;
    academic_period_id?: number;
    program_id?: number;
    faculty_id: number;
    room_schedule_id?: number;
    course_code: string;
    course_title: string;
    section: string;
    year_level?: string;
    exam_type: string;
    component_type: 'Lecture' | 'Laboratory';
    custom_exam_title?: string;
    exam_date: string;
    day_of_week?: string;
    start_time: string;
    end_time: string;
    room_name: string;
    modality: string;
    proctor_name?: string;
    is_confirmed: boolean;
    notes?: string;
    status: 'Scheduled' | 'Awaiting Confirmation' | 'Conducted' | 'Rescheduled' | 'Cancelled' | 'Not Conducted';
    conducted_at?: string;
    actual_start_time?: string;
    actual_end_time?: string;
    attendance_count?: number;
    remarks?: string;
}

interface RoomScheduleOffering {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_name: string;
}

interface PageProps {
    faculty: any;
    currentPeriod: any;
    academicPeriods: any[];
    exams: ExamSchedule[];
    myOfferings: RoomScheduleOffering[];
    rooms: string[];
    stats: {
        total: number;
        lecture_count: number;
        lab_count: number;
        scheduled: number;
        awaiting_confirmation: number;
        conducted: number;
    };
    filters: {
        status?: string;
        component_type?: string;
        search?: string;
    };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS_MAP: Record<string, string> = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday',
};

// 1-hour slots from 07:00 to 19:00 (7:00 AM - 7:00 PM)
const TIME_WINDOWS = [
    { label: '7:00 AM', startHour: 7, endHour: 8 },
    { label: '8:00 AM', startHour: 8, endHour: 9 },
    { label: '9:00 AM', startHour: 9, endHour: 10 },
    { label: '10:00 AM', startHour: 10, endHour: 11 },
    { label: '11:00 AM', startHour: 11, endHour: 12 },
    { label: '12:00 PM', startHour: 12, endHour: 13 },
    { label: '1:00 PM', startHour: 13, endHour: 14 },
    { label: '2:00 PM', startHour: 14, endHour: 15 },
    { label: '3:00 PM', startHour: 15, endHour: 16 },
    { label: '4:00 PM', startHour: 16, endHour: 17 },
    { label: '5:00 PM', startHour: 17, endHour: 18 },
    { label: '6:00 PM', startHour: 18, endHour: 19 },
];

function parseTimeToHours(timeStr?: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h + m / 60;
}

export default function FacultyExamSchedulesPage({
    faculty,
    currentPeriod,
    academicPeriods = [],
    exams = [],
    myOfferings = [],
    rooms = [],
    stats = {
        total: 0,
        lecture_count: 0,
        lab_count: 0,
        scheduled: 0,
        awaiting_confirmation: 0,
        conducted: 0,
    },
    filters = {},
}: PageProps) {
    const [viewMode, setViewMode] = useState<'timetable' | 'cards' | 'table'>('timetable');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [componentFilter, setComponentFilter] = useState(filters.component_type || 'all');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOfferingIndex, setSelectedOfferingIndex] = useState<string>('');
    const [courseCode, setCourseCode] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [section, setSection] = useState('');
    const [examType, setExamType] = useState('Midterm');
    const [componentType, setComponentType] = useState<'Lecture' | 'Laboratory'>('Lecture');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');
    const [roomName, setRoomName] = useState(rooms[0] || 'IT Lab 1');
    const [modality, setModality] = useState('Face-to-Face');
    const [proctorName, setProctorName] = useState(faculty?.title_name || faculty?.full_name || '');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmExam, setDeleteConfirmExam] = useState<ExamSchedule | null>(null);

    // Auto-update Day of Week when Exam Date changes
    const handleDateChange = (newDate: string) => {
        setExamDate(newDate);
        if (newDate) {
            const parsed = new Date(newDate);
            const dayName = parsed.toLocaleDateString('en-US', { weekday: 'long' });
            setDayOfWeek(dayName);
        }
    };

    // Auto-fill from Course/Subject selection
    const handleOfferingChange = (offeringIndexStr: string) => {
        setSelectedOfferingIndex(offeringIndexStr);
        if (offeringIndexStr === '') return;

        const idx = parseInt(offeringIndexStr, 10);
        const item = myOfferings[idx];
        if (item) {
            setCourseCode(item.course_code || '');
            setCourseTitle(item.course_title || '');
            setSection(item.section || '');
            if (item.room_name) setRoomName(item.room_name);

            // Inherit default time and day from class schedule if available
            if (item.day_of_week) {
                setDayOfWeek(SHORT_DAYS_MAP[item.day_of_week] || item.day_of_week);
            }
            if (item.start_time) setStartTime(item.start_time.substring(0, 5));
            if (item.end_time) setEndTime(item.end_time.substring(0, 5));

            // Auto-detect if room/subject suggests Laboratory
            const isLabRoom = (item.room_name || '').toLowerCase().includes('lab') ||
                (item.course_title || '').toLowerCase().includes('lab');
            if (isLabRoom) {
                setComponentType('Laboratory');
                setModality('Laboratory Hands-on');
            } else {
                setComponentType('Lecture');
                setModality('Face-to-Face');
            }
        }
    };

    const handleCreateExam = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            course_code: courseCode,
            course_title: courseTitle,
            section: section,
            exam_type: examType,
            component_type: componentType,
            exam_date: examDate,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            room_name: roomName,
            modality: modality,
            proctor_name: proctorName,
            notes: notes,
            room_schedule_id: selectedOfferingIndex !== '' ? myOfferings[parseInt(selectedOfferingIndex, 10)]?.id : null,
        };

        router.post('/faculty/exam-schedules', payload, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setIsSubmitting(false);
                setNotes('');
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDeleteExam = (exam: ExamSchedule) => {
        router.delete(`/faculty/exam-schedules/${exam.id}`, {
            onSuccess: () => {
                setDeleteConfirmExam(null);
            },
        });
    };

    // Filtered Exams
    const filteredExams = useMemo(() => {
        return exams.filter((exam) => {
            const matchesSearch = searchTerm === '' ||
                exam.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.room_name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
            const matchesComponent = componentFilter === 'all' || exam.component_type === componentFilter;

            return matchesSearch && matchesStatus && matchesComponent;
        });
    }, [exams, searchTerm, statusFilter, componentFilter]);

    // Check slots for Timetable view
    const getExamsForSlot = (dayName: string, slotStart: number, slotEnd: number) => {
        return filteredExams.filter((exam) => {
            const examDay = exam.day_of_week || (exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'long' }) : '');
            if (examDay.toLowerCase() !== dayName.toLowerCase()) return false;

            const examStart = parseTimeToHours(exam.start_time);
            const examEnd = parseTimeToHours(exam.end_time);

            return Math.max(examStart, slotStart) < Math.min(examEnd, slotEnd);
        });
    };

    const getStatusBadge = (status: ExamSchedule['status']) => {
        switch (status) {
            case 'Scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Scheduled
                    </span>
                );
            case 'Awaiting Confirmation':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Awaiting Confirmation
                    </span>
                );
            case 'Conducted':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Conducted
                    </span>
                );
            case 'Rescheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <RotateCcw className="h-3 w-3 text-purple-500" />
                        Rescheduled
                    </span>
                );
            case 'Not Conducted':
            case 'Cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        {status}
                    </span>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Exam Schedules - Timetable & Room Monitoring" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto">
                {/* 1. Header Banner & Hero Info */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-300/40 dark:border-amber-800/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50">
                                    <BookOpen className="w-5 h-5" />
                                </span>
                                <h1 className="text-2xl font-black text-foreground tracking-tight">My Exam Schedules</h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/50">
                                    {currentPeriod?.name || '1st Semester AY 2026-2027'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                                Manage and schedule examination windows for your Lecture and Laboratory classes.
                                All entries synchronize in real-time with the <strong>Super Admin Exam Monitoring Hub</strong>,
                                <strong>Program Heads</strong>, and <strong>Room Utilization Analytics</strong>.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                onClick={() => {
                                    if (myOfferings.length > 0 && selectedOfferingIndex === '') {
                                        handleOfferingChange('0');
                                    }
                                    setIsCreateModalOpen(true);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Exam Schedule
                            </Button>
                        </div>
                    </div>

                    {/* KPI Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-amber-200/40 dark:border-amber-900/40">
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-muted-foreground block">Total Exams</span>
                            <span className="text-xl font-black text-foreground">{stats.total}</span>
                        </div>
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 block flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Lecture Exams
                            </span>
                            <span className="text-xl font-black text-sky-700 dark:text-sky-300">{stats.lecture_count}</span>
                        </div>
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block flex items-center gap-1">
                                <FlaskConical className="w-3 h-3" /> Lab Practical Exams
                            </span>
                            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">{stats.lab_count}</span>
                        </div>
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">Upcoming / Scheduled</span>
                            <span className="text-xl font-black text-blue-600">{stats.scheduled}</span>
                        </div>
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">Awaiting Confirmation</span>
                            <span className="text-xl font-black text-amber-600">{stats.awaiting_confirmation}</span>
                        </div>
                        <div className="bg-card/70 backdrop-blur-xs p-3 rounded-xl border border-border/60">
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">Conducted</span>
                            <span className="text-xl font-black text-emerald-600">{stats.conducted}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Filter Toolbar & View Mode Switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        <div className="relative min-w-[240px] max-w-sm flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search subject, section, room..."
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        <select
                            value={componentFilter}
                            onChange={(e) => setComponentFilter(e.target.value)}
                            className="h-9 px-3 text-xs rounded-md border border-input bg-background"
                        >
                            <option value="all">All Components (Lecture & Lab)</option>
                            <option value="Lecture">Lecture Exams Only</option>
                            <option value="Laboratory">Laboratory Exams Only</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-xs rounded-md border border-input bg-background"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Awaiting Confirmation">Awaiting Confirmation</option>
                            <option value="Conducted">Conducted</option>
                            <option value="Rescheduled">Rescheduled</option>
                        </select>

                        {(searchTerm || componentFilter !== 'all' || statusFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setComponentFilter('all');
                                    setStatusFilter('all');
                                }}
                                className="text-xs h-9 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reset Filters
                            </Button>
                        )}
                    </div>

                    {/* View Switcher: Timetable vs Cards vs Table */}
                    <div className="flex items-center p-1 rounded-xl bg-muted/70 border border-border shrink-0 self-start md:self-auto">
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
                            <span>Timetable</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                viewMode === 'cards'
                                    ? "bg-background text-foreground shadow-xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                            <span>Cards</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                viewMode === 'table'
                                    ? "bg-background text-foreground shadow-xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Table List</span>
                        </button>
                    </div>
                </div>

                {/* 3. Main Display Views */}
                {viewMode === 'timetable' && (
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                            <div>
                                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Weekly Examination Timetable Grid
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Visual mapping of your scheduled exam blocks across the week (Monday - Saturday).
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-amber-400 border border-amber-600 inline-block" />
                                    <span className="font-medium text-muted-foreground">Lecture Exam</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-indigo-400 border border-indigo-600 inline-block" />
                                    <span className="font-medium text-muted-foreground">Laboratory Exam</span>
                                </div>
                            </div>
                        </div>

                        {/* Timetable Matrix */}
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full border-collapse text-xs select-none">
                                <thead>
                                    <tr className="bg-[#fef9c3] dark:bg-amber-950/40 text-[#422006] dark:text-amber-200 border-b border-[#fde047] dark:border-amber-800/50">
                                        <th className="py-3 px-3 text-left font-black w-24 uppercase tracking-wider text-[11px] border-r border-[#fde047]/60 dark:border-amber-800/30">
                                            Time Window
                                        </th>
                                        {DAYS.map((day) => (
                                            <th
                                                key={day}
                                                className="py-3 px-3 text-left font-black uppercase tracking-wider text-[11px] border-r border-[#fde047]/60 dark:border-amber-800/30 min-w-[190px]"
                                            >
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {TIME_WINDOWS.map((window) => (
                                        <tr key={window.label} className="hover:bg-muted/15 transition-colors h-20 divide-x divide-border/50">
                                            <td className="py-2 px-3 align-top font-bold text-muted-foreground text-xs bg-muted/10 whitespace-nowrap">
                                                {window.label}
                                            </td>

                                            {DAYS.map((dayName) => {
                                                const slotExams = getExamsForSlot(dayName, window.startHour, window.endHour);

                                                return (
                                                    <td key={dayName} className="p-1.5 align-top relative">
                                                        {slotExams.map((exam) => {
                                                            const itemStart = parseTimeToHours(exam.start_time);
                                                            const isStartSlot = itemStart >= window.startHour && itemStart < window.endHour;

                                                            if (!isStartSlot) {
                                                                return (
                                                                    <div
                                                                        key={exam.id}
                                                                        className={cn(
                                                                            "w-full h-2 rounded-full mb-1",
                                                                            exam.component_type === 'Laboratory'
                                                                                ? "bg-indigo-300 dark:bg-indigo-800/50"
                                                                                : "bg-amber-300 dark:bg-amber-800/50"
                                                                        )}
                                                                        title={`${exam.course_code} continued`}
                                                                    />
                                                                );
                                                            }

                                                            const isLab = exam.component_type === 'Laboratory';

                                                            return (
                                                                <div
                                                                    key={exam.id}
                                                                    className={cn(
                                                                        "p-2.5 rounded-xl border text-xs shadow-xs transition-all mb-1.5 hover:shadow-md",
                                                                        isLab
                                                                            ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100"
                                                                            : "bg-amber-50/90 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                                        <span className={cn(
                                                                            "px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                                                            isLab
                                                                                ? "bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200"
                                                                                : "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                                                                        )}>
                                                                            {isLab ? 'Lab Exam' : 'Lecture Exam'}
                                                                        </span>
                                                                        <span className="font-bold text-[10px] text-muted-foreground">
                                                                            {exam.exam_type}
                                                                        </span>
                                                                    </div>

                                                                    <div className="font-extrabold text-foreground text-xs leading-tight">
                                                                        {exam.course_code} · {exam.section}
                                                                    </div>
                                                                    <div className="text-[11px] text-muted-foreground truncate mb-1">
                                                                        {exam.course_title}
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                                                                        <span className="flex items-center gap-0.5 font-bold text-foreground">
                                                                            <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                                                            {exam.room_name}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="font-mono">
                                                                            {exam.start_time.substring(0, 5)} - {exam.end_time.substring(0, 5)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-1.5 pt-1 flex items-center justify-between">
                                                                        {getStatusBadge(exam.status)}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => setDeleteConfirmExam(exam)}
                                                                            className="h-5 w-5 text-muted-foreground hover:text-rose-600"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Cards View */}
                {viewMode === 'cards' && (
                    <div>
                        {filteredExams.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-6 space-y-3">
                                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
                                <h3 className="font-bold text-foreground text-base">No examination schedules found</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    You have not scheduled any lecture or lab exams matching the current criteria. Click below to add your first exam.
                                </p>
                                <Button
                                    onClick={() => {
                                        if (myOfferings.length > 0 && selectedOfferingIndex === '') {
                                            handleOfferingChange('0');
                                        }
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                >
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Exam Schedule
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredExams.map((exam) => {
                                    const isLab = exam.component_type === 'Laboratory';

                                    return (
                                        <div
                                            key={exam.id}
                                            className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            {/* Card Top Header */}
                                            <div className={cn(
                                                "p-4 border-b",
                                                isLab
                                                    ? "bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-200/50 dark:border-indigo-900/50"
                                                    : "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/50 dark:border-amber-900/50"
                                            )}>
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider",
                                                        isLab
                                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                                    )}>
                                                        {isLab ? <FlaskConical className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                                        {exam.component_type}
                                                    </span>

                                                    <Badge variant="outline" className="font-bold text-xs">
                                                        {exam.exam_type}
                                                    </Badge>
                                                </div>

                                                <h3 className="font-black text-foreground text-base tracking-tight">
                                                    {exam.course_code} · {exam.section}
                                                </h3>
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {exam.course_title}
                                                </p>
                                            </div>

                                            {/* Card Body Details */}
                                            <div className="p-4 space-y-3 flex-1 text-xs">
                                                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Exam Date & Day</span>
                                                        <span className="font-bold text-foreground">
                                                            {new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                                            {exam.day_of_week || 'Regular Day'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Time Window</span>
                                                        <span className="font-mono font-bold text-foreground">
                                                            {exam.start_time.substring(0, 5)} - {exam.end_time.substring(0, 5)}
                                                        </span>
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            ({exam.modality})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs pt-1">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                                        Venue:
                                                    </span>
                                                    <span className="font-bold text-foreground">{exam.room_name}</span>
                                                </div>

                                                {exam.proctor_name && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Proctor:</span>
                                                        <span className="font-medium text-foreground">{exam.proctor_name}</span>
                                                    </div>
                                                )}

                                                {exam.notes && (
                                                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 text-[11px] text-muted-foreground italic">
                                                        "{exam.notes}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between">
                                                {getStatusBadge(exam.status)}

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirmExam(exam)}
                                                        className="text-xs text-muted-foreground hover:text-rose-600 h-8 px-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Table View */}
                {viewMode === 'table' && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 font-semibold uppercase text-[11px] text-muted-foreground">
                                        <th className="py-3 px-4">Course & Section</th>
                                        <th className="py-3 px-4">Component</th>
                                        <th className="py-3 px-4">Exam Type</th>
                                        <th className="py-3 px-4">Exam Date & Day</th>
                                        <th className="py-3 px-4">Time Window</th>
                                        <th className="py-3 px-4">Assigned Room</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredExams.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                                                No exam schedules found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExams.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-foreground block">{exam.course_code}</span>
                                                    <span className="text-[11px] text-muted-foreground">{exam.course_title} • <strong>{exam.section}</strong></span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
                                                        exam.component_type === 'Laboratory'
                                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                                    )}>
                                                        {exam.component_type === 'Laboratory' ? <FlaskConical className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                                        {exam.component_type}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="font-semibold text-xs">
                                                        {exam.exam_type}
                                                    </Badge>
                                                    <span className="block text-[10px] text-muted-foreground mt-0.5">{exam.modality}</span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-foreground">
                                                        {new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                                        {exam.day_of_week || 'Regular Day'}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-mono font-bold text-foreground">
                                                        {exam.start_time.substring(0, 5)} - {exam.end_time.substring(0, 5)}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 font-semibold text-foreground">
                                                        <MapPin className="h-3 w-3 text-amber-500" />
                                                        {exam.room_name}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    {getStatusBadge(exam.status)}
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirmExam(exam)}
                                                        className="text-xs text-muted-foreground hover:text-rose-600 h-8"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE EXAM SCHEDULE MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                            <BookOpen className="w-5 h-5 text-amber-500" />
                            Add Examination Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Define the date, day, time, and room for your lecture or laboratory examination.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateExam} className="space-y-4 pt-2">
                        {/* Auto Select from Course Offerings */}
                        {myOfferings.length > 0 && (
                            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                                <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                                    Quick Select from Teaching Load / Course Offerings:
                                </label>
                                <select
                                    value={selectedOfferingIndex}
                                    onChange={(e) => handleOfferingChange(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2.5 font-medium"
                                >
                                    <option value="">-- Choose Course Offering or Enter Manually --</option>
                                    {myOfferings.map((item, idx) => (
                                        <option key={item.id} value={idx.toString()}>
                                            {item.course_code} - {item.course_title} ({item.section}) • {item.day_of_week} ({item.room_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Course Code *</label>
                                <Input
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    placeholder="e.g. IT 311"
                                    required
                                    className="text-xs h-9"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Section *</label>
                                <Input
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    placeholder="e.g. BSIT 3A"
                                    required
                                    className="text-xs h-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-foreground">Course Title *</label>
                            <Input
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                                placeholder="e.g. Mobile Application Development"
                                required
                                className="text-xs h-9"
                            />
                        </div>

                        {/* Component Selection: Lecture vs Lab */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Exam Component *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setComponentType('Lecture');
                                            setModality('Face-to-Face');
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                                            componentType === 'Lecture'
                                                ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                                                : "bg-background text-muted-foreground border-input hover:text-foreground"
                                        )}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Lecture
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setComponentType('Laboratory');
                                            setModality('Laboratory Hands-on');
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                                            componentType === 'Laboratory'
                                                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                                : "bg-background text-muted-foreground border-input hover:text-foreground"
                                        )}
                                    >
                                        <FlaskConical className="w-3.5 h-3.5" />
                                        Laboratory
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">Exam Period *</label>
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2 h-9 font-medium"
                                >
                                    <option value="Preliminary">Preliminary Examination</option>
                                    <option value="Midterm">Midterm Examination</option>
                                    <option value="Final">Final Examination</option>
                                    <option value="Practical/Laboratory Exam">Practical / Hands-on Lab Exam</option>
                                    <option value="Quiz/Departmental Exam">Quiz / Departmental Exam</option>
                                </select>
                            </div>
                        </div>

                        {/* Date & Day of Week */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Exam Date *</label>
                                <Input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    required
                                    className="text-xs h-9"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Day of Week *</label>
                                <select
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2 h-9 font-medium"
                                >
                                    {DAYS.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Time Slots & Room */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Start Time *</label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    className="text-xs h-9 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">End Time *</label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    className="text-xs h-9 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Exam Room / Lab *</label>
                                <select
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2 h-9 font-medium"
                                >
                                    {rooms.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                    {rooms.length === 0 && (
                                        <>
                                            <option value="IT Lab 1">IT Lab 1</option>
                                            <option value="IT Lab 2">IT Lab 2</option>
                                            <option value="Room 301">Room 301</option>
                                            <option value="Room 302">Room 302</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Modality</label>
                                <select
                                    value={modality}
                                    onChange={(e) => setModality(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2 h-9 font-medium"
                                >
                                    <option value="Face-to-Face">Face-to-Face Written</option>
                                    <option value="Laboratory Hands-on">Laboratory Hands-on Machine</option>
                                    <option value="Online">Online Proctored</option>
                                    <option value="Hybrid">Hybrid / Blended</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-foreground">Proctor Name</label>
                                <Input
                                    value={proctorName}
                                    onChange={(e) => setProctorName(e.target.value)}
                                    placeholder="Proctor Instructor"
                                    className="text-xs h-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-foreground">Special Instructions / Remarks</label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Bring scientific calculator, install VS Code beforehand"
                                className="text-xs h-9"
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                            >
                                {isSubmitting ? 'Saving...' : 'Confirm & Save Schedule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={!!deleteConfirmExam} onOpenChange={() => setDeleteConfirmExam(null)}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Remove Examination Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Are you sure you want to remove the <strong>{deleteConfirmExam?.component_type}</strong> exam schedule for{' '}
                            <strong>{deleteConfirmExam?.course_code} ({deleteConfirmExam?.section})</strong>? This slot will be released from the schedule.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteConfirmExam(null)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteConfirmExam && handleDeleteExam(deleteConfirmExam)}
                            className="text-xs"
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
