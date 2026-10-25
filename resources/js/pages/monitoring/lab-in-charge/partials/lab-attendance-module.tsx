import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ChevronDown,
    X,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Upload,
    Camera,
    Image as ImageIcon,
    RefreshCw,
    Info,
    Send,
    BarChart3,
    FileSpreadsheet,
    FileText,
    Check,
    Layers,
    UserCheck,
    ShieldAlert,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ExpectedSession } from '../index';

export interface ScheduledFacultySession {
    id: number;
    verified_schedule_id: number;
    scheduled_time: string;
    scheduled_start: string;
    scheduled_end: string;
    faculty_name: string;
    faculty_id: number;
    course_code: string;
    course_title: string;
    section: string;
    laboratory: string;
    room_id: number;
    monitoring_status: 'Monitored' | 'Awaiting Monitoring' | 'Late Observed' | 'Needs Verification' | 'Discrepancy Reported';
    actual_room?: string;
    delivery_mode?: 'Face-to-Face' | 'Online/LMS' | 'Blended/Hybrid';
    arrival_time?: string;
    actual_start_time?: string;
    actual_end_time?: string;
    late_minutes?: number;
    observation_choice?: 'Present and Teaching' | 'Late' | 'Not Observed' | 'On Approved Leave' | 'Needs Verification';
    remarks?: string;
    photo_url?: string | null;
    monitored_by?: string;
    observation_timestamp?: string;
    has_discrepancy?: boolean;
}

interface LabAttendanceModuleProps {
    assignedRooms: any[];
    sessionsList: ExpectedSession[];
    allFaculty?: { id: number; first_name: string; last_name: string }[];
    todayName: string;
    todayDate: string;
    todayDateStr?: string;
    currentTime: string;
    currentUserName: string;
    academicPeriod?: {
        name: string;
        code: string;
        class_start_date: string;
    };
    scheduleVersion?: string;
    onRecordObservation?: (payload: Record<string, any>, photo?: File | null) => void;
}

export default function LabAttendanceModule({
    assignedRooms = [],
    sessionsList = [],
    allFaculty = [],
    todayName,
    todayDate,
    todayDateStr = '',
    currentTime,
    currentUserName,
    academicPeriod = {
        name: 'AY 2026–2027 · 1st Semester',
        code: 'AY2026-2027-1S',
        class_start_date: 'Aug 10, 2026',
    },
    scheduleVersion = 'Master Timetable v1',
    onRecordObservation,
}: LabAttendanceModuleProps) {
    // Report & Period States
    const [reportView, setReportView] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
    const [selectedDate, setSelectedDate] = useState<string>(todayDateStr || '2026-10-24');
    const [selectedDateFormatted, setSelectedDateFormatted] = useState<string>(todayDate || 'Oct 24, 2026');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLab, setSelectedLab] = useState('all');
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPersonnel, setSelectedPersonnel] = useState('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    // Side Panel (Drawer) State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ScheduledFacultySession | null>(null);

    // Form inputs for Monitor Session panel
    const [observationChoice, setObservationChoice] = useState<'Present and Teaching' | 'Late' | 'Not Observed' | 'On Approved Leave' | 'Needs Verification'>('Present and Teaching');
    const [arrivalTime, setArrivalTime] = useState('09:00 AM');
    const [classStartTime, setClassStartTime] = useState('09:05 AM');
    const [classEndTime, setClassEndTime] = useState('10:28 AM');
    const [actualRoom, setActualRoom] = useState('CLR 3');
    const [deliveryMode, setDeliveryMode] = useState<'Face-to-Face' | 'Online/LMS' | 'Blended/Hybrid'>('Face-to-Face');
    const [remarks, setRemarks] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Report modal / feedback
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // Map live server sessionsList into rich ScheduledFacultySession records
    const allScheduleData: ScheduledFacultySession[] = useMemo(() => {
        if (!sessionsList || sessionsList.length === 0) {
            return [];
        }

        const list: ScheduledFacultySession[] = [];
        sessionsList.forEach((s, idx) => {
            let status: ScheduledFacultySession['monitoring_status'] = 'Awaiting Monitoring';
            let choice: ScheduledFacultySession['observation_choice'] = 'Present and Teaching';

            if (s.has_discrepancy) {
                status = 'Discrepancy Reported';
            } else if (s.observation_status === 'Completed' || s.observation_status === 'Started On Time') {
                status = 'Monitored';
                choice = 'Present and Teaching';
            } else if (s.observation_status === 'Late Start' || s.late_minutes > 0) {
                status = 'Late Observed';
                choice = 'Late';
            } else if (s.observation_status === 'Needs Verification') {
                status = 'Needs Verification';
                choice = 'Needs Verification';
            } else if (s.observation_status === 'In Progress') {
                status = 'Monitored';
                choice = 'Present and Teaching';
            }

            list.push({
                id: s.verified_schedule_id || idx + 1,
                verified_schedule_id: s.verified_schedule_id,
                scheduled_time: s.scheduled_time,
                scheduled_start: s.scheduled_start,
                scheduled_end: s.scheduled_end,
                faculty_name: s.expected_faculty,
                faculty_id: s.faculty_id,
                course_code: s.course_code,
                course_title: s.course_title,
                section: s.section,
                laboratory: s.room_name,
                room_id: s.room_id,
                monitoring_status: status,
                actual_room: s.room_name,
                delivery_mode: 'Face-to-Face',
                arrival_time: s.actual_start_time ? formatToTime(s.actual_start_time) : formatToTime(s.scheduled_start),
                actual_start_time: s.actual_start_time ? formatToTime(s.actual_start_time) : formatToTime(s.scheduled_start),
                actual_end_time: s.actual_end_time ? formatToTime(s.actual_end_time) : formatToTime(s.scheduled_end),
                late_minutes: s.late_minutes || 0,
                observation_choice: choice,
                remarks: s.remarks || '',
                photo_url: s.photo_url || null,
                monitored_by: currentUserName || 'Lab In-Charge',
                observation_timestamp: `${todayDate} · ${currentTime}`,
                has_discrepancy: s.has_discrepancy,
            });
        });

        return list;
    }, [sessionsList, currentUserName, todayDate, currentTime]);

    // Format HH:MM helper
    function formatToTime(hhmm: string): string {
        if (!hhmm) return '';
        if (hhmm.includes('AM') || hhmm.includes('PM')) return hhmm;
        try {
            const [hStr, mStr] = hhmm.split(':');
            const h = parseInt(hStr, 10);
            const m = parseInt(mStr, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
        } catch {
            return hhmm;
        }
    }

    // Filter sessions
    const filteredSessions = useMemo(() => {
        return allScheduleData.filter((item) => {
            // Lab filter
            if (selectedLab !== 'all' && item.laboratory !== selectedLab) {
                return false;
            }
            // Faculty filter
            if (selectedFaculty !== 'all' && item.faculty_name !== selectedFaculty) {
                return false;
            }
            // Status filter
            if (selectedStatus !== 'all' && item.monitoring_status !== selectedStatus) {
                return false;
            }
            // Personnel filter
            if (selectedPersonnel !== 'all' && item.monitored_by !== selectedPersonnel) {
                return false;
            }
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchFac = item.faculty_name.toLowerCase().includes(q);
                const matchCourse = item.course_code.toLowerCase().includes(q);
                const matchSec = item.section.toLowerCase().includes(q);
                const matchLab = item.laboratory.toLowerCase().includes(q);
                if (!matchFac && !matchCourse && !matchSec && !matchLab) {
                    return false;
                }
            }
            return true;
        });
    }, [allScheduleData, selectedLab, selectedFaculty, selectedStatus, selectedPersonnel, searchQuery]);

    // Compact Summary KPI calculations
    // Important rules:
    // 1. Unmonitored session must not automatically count as faculty absence.
    // 2. A day with zero expected sessions must display N/A for monitoring coverage rather than 100%.
    const summaryMetrics = useMemo(() => {
        const scheduledCount = allScheduleData.length;
        const monitoredCount = allScheduleData.filter((s) => s.monitoring_status === 'Monitored').length;
        const awaitingCount = allScheduleData.filter((s) => s.monitoring_status === 'Awaiting Monitoring').length;
        const lateCount = allScheduleData.filter((s) => s.monitoring_status === 'Late Observed').length;
        const discrepanciesCount = allScheduleData.filter((s) => s.monitoring_status === 'Discrepancy Reported' || s.has_discrepancy).length;

        // Coverage computation
        let coverageDisplay = 'N/A';
        let coverageRatio = '0 of 0 sessions';

        if (scheduledCount > 0) {
            // Monitored coverage includes monitored + late observed + discrepancy handled (anything with active monitoring accountability)
            const accounted = monitoredCount;
            const pct = ((accounted / scheduledCount) * 100).toFixed(1);
            coverageDisplay = `${pct}%`;
            coverageRatio = `${accounted} of ${scheduledCount} sessions`;
        }

        return {
            scheduledCount,
            monitoredCount,
            awaitingCount,
            lateCount,
            discrepanciesCount,
            coverageDisplay,
            coverageRatio,
        };
    }, [allScheduleData]);

    // Paginated list
    const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
    const paginatedSessions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSessions.slice(start, start + pageSize);
    }, [filteredSessions, currentPage, pageSize]);

    // Distinct list of laboratories and faculty for dropdown filters
    const laboratoryOptions = useMemo(() => {
        const labs = new Set<string>();
        assignedRooms.forEach((r) => {
            const name = r.room_name ?? r.name;
            if (name) labs.add(name);
        });
        allScheduleData.forEach((s) => {
            if (s.laboratory) labs.add(s.laboratory);
        });
        return Array.from(labs);
    }, [assignedRooms, allScheduleData]);

    const facultyOptions = useMemo(() => {
        const set = new Set<string>();
        allFaculty.forEach((f) => set.add(`${f.first_name} ${f.last_name}`));
        allScheduleData.forEach((s) => set.add(s.faculty_name));
        return Array.from(set);
    }, [allFaculty, allScheduleData]);

    // Open side panel with pre-filled session
    const handleOpenMonitor = (session: ScheduledFacultySession) => {
        setSelectedSession(session);
        setObservationChoice(session.observation_choice || 'Present and Teaching');
        setArrivalTime(session.arrival_time || '09:00 AM');
        setClassStartTime(session.actual_start_time || '09:05 AM');
        setClassEndTime(session.actual_end_time || '10:28 AM');
        setActualRoom(session.actual_room || session.laboratory);
        setDeliveryMode(session.delivery_mode || 'Face-to-Face');
        setRemarks(session.remarks || 'Faculty arrived on time and discussed the scheduled topics. Class proceeded smoothly.');
        setPhotoFile(null);
        setPhotoPreview(session.photo_url || null);
        setIsPanelOpen(true);
    };

    // Close side panel
    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setSelectedSession(null);
    };

    // Form submission
    const handleSaveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession) return;
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            setIsPanelOpen(false);
            alert(`Observation draft saved for ${selectedSession.faculty_name} (${selectedSession.course_code}).`);
        }, 300);
    };

    const handleSubmitObservation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession) return;
        setIsSubmitting(true);

        const payload: Record<string, any> = {
            verified_schedule_id: selectedSession.verified_schedule_id,
            room_id: selectedSession.room_id,
            actual_start_time: classStartTime,
            actual_end_time: classEndTime,
            observation_status: observationChoice === 'Present and Teaching' ? 'Completed' : (observationChoice === 'Late' ? 'Late Start' : observationChoice),
            room_condition: 'In Use as Scheduled',
            session_outcome: observationChoice === 'Present and Teaching' ? 'Conducted as Scheduled' : (observationChoice === 'Late' ? 'Late Start' : observationChoice),
            remarks: remarks,
            is_historical_reconciliation: false,
        };

        if (photoFile) {
            payload.photo = photoFile;
        }

        router.post(
            route('lab-in-charge.observation'),
            payload,
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsPanelOpen(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleReportDiscrepancy = () => {
        if (!selectedSession) return;
        setIsSubmitting(true);

        router.post(
            route('lab-in-charge.disruption'),
            {
                room_id: selectedSession.room_id,
                verified_schedule_id: selectedSession.verified_schedule_id,
                discrepancy_type: 'Operational Discrepancy Reported',
                severity: 'Needs Attention',
                observed_state: `Observation: ${observationChoice} · Remarks: ${remarks || 'Flagged by Lab In-Charge during session monitor.'}`,
                remarks: remarks,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsPanelOpen(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Helper for rendering status pill in table
    const renderMonitoringStatusPill = (status: ScheduledFacultySession['monitoring_status']) => {
        switch (status) {
            case 'Monitored':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Monitored
                    </span>
                );
            case 'Awaiting Monitoring':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        Awaiting Monitoring
                    </span>
                );
            case 'Late Observed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        Late Observed
                    </span>
                );
            case 'Needs Verification':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Needs Verification
                    </span>
                );
            case 'Discrepancy Reported':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        Discrepancy Reported
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. MODULE-SPECIFIC HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                            Operational Attendance
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                        Lab Attendance Monitoring
                    </h1>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 pt-0.5 font-medium">
                        <span>{academicPeriod.name}</span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>Date: <strong className="text-foreground">{selectedDateFormatted}</strong></span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>Assigned Laboratories: <strong className="text-foreground">{assignedRooms.length || 6}</strong></span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>Verified Schedule: <strong className="text-foreground">{scheduleVersion}</strong></span>
                    </div>
                </div>

                {/* Right Header Actions: Generate Report & Period Pill Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 self-start xl:self-auto shrink-0">
                    {/* Generate Report Button with Dropdown Options */}
                    <div className="relative inline-block">
                        <Button
                            onClick={() => {
                                setReportType(reportView.toLowerCase() as any);
                                setReportModalOpen(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs gap-1.5"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Generate Report</span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                        </Button>
                    </div>

                    {/* Period View Pill Switcher (Daily, Weekly, Monthly) */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setReportView('Daily')}
                            className={cn(
                                'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                                reportView === 'Daily'
                                    ? 'bg-background text-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Daily
                        </button>
                        <button
                            type="button"
                            onClick={() => setReportView('Weekly')}
                            className={cn(
                                'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                                reportView === 'Weekly'
                                    ? 'bg-background text-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Weekly
                        </button>
                        <button
                            type="button"
                            onClick={() => setReportView('Monthly')}
                            className={cn(
                                'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                                reportView === 'Monthly'
                                    ? 'bg-background text-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
            </div>

            {/* Informational Guidance Alert Banner */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-blue-200/60 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                    Generate reports (daily, weekly, or monthly) and filter by faculty, laboratory, and monitoring personnel.
                </span>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search faculty, course, section, or laboratory..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <label className="text-[10px] font-bold text-muted-foreground absolute -top-2 left-2.5 bg-card px-1 z-10">
                            Date
                        </label>
                        <div className="flex items-center h-9 border rounded-xl px-2.5 bg-background text-xs font-bold">
                            <CalendarIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    try {
                                        const d = new Date(e.target.value);
                                        setSelectedDateFormatted(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                                    } catch {
                                        setSelectedDateFormatted(e.target.value);
                                    }
                                }}
                                className="bg-transparent text-xs font-bold w-full focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Laboratory Select */}
                    <div>
                        <select
                            value={selectedLab}
                            onChange={(e) => {
                                setSelectedLab(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                        >
                            <option value="all">All Assigned Labs</option>
                            {laboratoryOptions.map((lab) => (
                                <option key={lab} value={lab}>{lab}</option>
                            ))}
                        </select>
                    </div>

                    {/* Faculty Select */}
                    <div>
                        <select
                            value={selectedFaculty}
                            onChange={(e) => {
                                setSelectedFaculty(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                        >
                            <option value="all">All Faculty</option>
                            {facultyOptions.map((fac) => (
                                <option key={fac} value={fac}>{fac}</option>
                            ))}
                        </select>
                    </div>

                    {/* Monitoring Status Select */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Monitored">Monitored</option>
                            <option value="Awaiting Monitoring">Awaiting Monitoring</option>
                            <option value="Late Observed">Late Observed</option>
                            <option value="Needs Verification">Needs Verification</option>
                            <option value="Discrepancy Reported">Discrepancy Reported</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        This module lists every faculty member scheduled to teach in your assigned laboratories on the selected date.
                    </span>

                    {(searchQuery || selectedLab !== 'all' || selectedFaculty !== 'all' || selectedStatus !== 'all' || selectedPersonnel !== 'all') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedLab('all');
                                setSelectedFaculty('all');
                                setSelectedStatus('all');
                                setSelectedPersonnel('all');
                                setCurrentPage(1);
                            }}
                            className="text-amber-600 hover:underline font-bold text-xs"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* 3. COMPACT SUMMARY KPI CARDS ROW (6 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* 1. Scheduled Sessions */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.scheduledCount}
                        </div>
                        <div className="text-xs font-bold text-foreground">Scheduled Sessions</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                </div>

                {/* 2. Monitored */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-emerald-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.monitoredCount}
                        </div>
                        <div className="text-xs font-bold text-foreground">Monitored</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                {/* 3. Awaiting Monitoring */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.awaitingCount}
                        </div>
                        <div className="text-xs font-bold text-foreground">Awaiting Monitoring</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                {/* 4. Late Sessions */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.lateCount}
                        </div>
                        <div className="text-xs font-bold text-foreground">Late Sessions</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                        <span className="h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">!</span>
                    </div>
                </div>

                {/* 5. Discrepancies */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.discrepanciesCount}
                        </div>
                        <div className="text-xs font-bold text-foreground">Discrepancies</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                </div>

                {/* 6. Monitoring Coverage */}
                {/* Important rule: If scheduledCount is 0, display N/A */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-purple-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            {summaryMetrics.coverageDisplay}
                        </div>
                        <div className="text-xs font-bold text-foreground">Monitoring Coverage</div>
                        <div className="text-[10px] text-muted-foreground">{summaryMetrics.coverageRatio}</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* 4. TODAY'S SCHEDULED FACULTY SESSIONS TABLE */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                {/* Table Header Bar */}
                <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h2 className="text-base font-black text-foreground">
                            Today's Scheduled Faculty Sessions
                        </h2>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium ml-2">
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            Unmonitored sessions do not automatically count as faculty absence.
                        </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ['sessionsList'] })}
                            className="h-8 text-xs font-bold gap-1.5 rounded-lg border-border hover:bg-muted"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-bold border-b">
                            <tr>
                                <th className="py-3 px-4 w-12 text-center">#</th>
                                <th className="py-3 px-4">Scheduled Time</th>
                                <th className="py-3 px-4">Faculty Name</th>
                                <th className="py-3 px-4">Course</th>
                                <th className="py-3 px-4">Section</th>
                                <th className="py-3 px-4">Laboratory</th>
                                <th className="py-3 px-4">Monitoring Status</th>
                                <th className="py-3 px-4 text-center w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {paginatedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                                                <CalendarIcon className="h-7 w-7 stroke-[1.8]" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-foreground tracking-tight">
                                                    No Scheduled Faculty Sessions
                                                </p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {searchQuery || selectedLab !== 'all' || selectedFaculty !== 'all' || selectedStatus !== 'all'
                                                        ? 'No sessions match your applied filters. Try adjusting or clearing search criteria.'
                                                        : `There are currently no verified laboratory classes scheduled for ${selectedDateFormatted}. When sessions are scheduled, they will appear here for monitoring.`}
                                                </p>
                                            </div>
                                            {(searchQuery || selectedLab !== 'all' || selectedFaculty !== 'all' || selectedStatus !== 'all') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedLab('all');
                                                        setSelectedFaculty('all');
                                                        setSelectedStatus('all');
                                                        setSelectedPersonnel('all');
                                                        setSearchQuery('');
                                                    }}
                                                    className="text-xs font-bold rounded-xl h-8 mt-1 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                                                >
                                                    Clear Applied Filters
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSessions.map((session, index) => {
                                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                                    const isHighlighted = selectedSession?.id === session.id && isPanelOpen;
                                    return (
                                        <tr
                                            key={session.id}
                                            className={cn(
                                                'transition-colors hover:bg-muted/30',
                                                isHighlighted ? 'bg-amber-500/10 dark:bg-amber-950/20' : ''
                                            )}
                                        >
                                            <td className="py-3.5 px-4 text-center font-bold text-muted-foreground">
                                                {rowNumber}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                                                {session.scheduled_time}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                                                {session.faculty_name}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="font-bold text-foreground">{session.course_code}</span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground">
                                                {session.section}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-foreground">
                                                {session.laboratory}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {renderMonitoringStatusPill(session.monitoring_status)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenMonitor(session)}
                                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-7.5 px-4 rounded-lg shadow-2xs transition-all cursor-pointer"
                                                >
                                                    Monitor
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div>
                        Showing {filteredSessions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredSessions.length)} of {filteredSessions.length} sessions
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setCurrentPage(p)}
                                className={cn(
                                    'h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all',
                                    currentPage === p
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                                        : 'border border-border hover:bg-muted text-foreground'
                                )}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. MONITOR SESSION SIDE PANEL (DRAWER) */}
            {isPanelOpen && selectedSession && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={handleClosePanel}
                    />

                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-card border-l shadow-2xl flex flex-col h-full">
                            {/* Panel Header */}
                            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-base font-black text-foreground">
                                        Monitor Session
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClosePanel}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Panel Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                                {/* SECTION 1: VERIFIED SCHEDULE (Read-Only) */}
                                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                            <CalendarIcon className="h-3.5 w-3.5 text-amber-600" />
                                            Verified Schedule
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                                            <Check className="h-2.5 w-2.5" />
                                            From {scheduleVersion}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Faculty</span>
                                            <strong className="text-foreground text-sm font-black">{selectedSession.faculty_name}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Course</span>
                                            <strong className="text-foreground text-sm font-black">{selectedSession.course_code}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Section</span>
                                            <strong className="text-foreground">{selectedSession.section}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Laboratory</span>
                                            <strong className="text-foreground">{selectedSession.laboratory}</strong>
                                        </div>
                                        <div className="col-span-2 pt-1 border-t">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Scheduled Time</span>
                                            <span className="font-mono font-bold text-foreground">{selectedSession.scheduled_time}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: FACULTY OBSERVATION (Required Radio Options) */}
                                <div className="space-y-2.5">
                                    <label className="text-xs font-black text-foreground flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                        Faculty Observation <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="space-y-2">
                                        {[
                                            { key: 'Present and Teaching', label: 'Present and Teaching' },
                                            { key: 'Late', label: 'Late' },
                                            { key: 'Not Observed', label: 'Not Observed' },
                                            { key: 'On Approved Leave', label: 'On Approved Leave' },
                                            { key: 'Needs Verification', label: 'Needs Verification' },
                                        ].map((opt) => {
                                            const isChecked = observationChoice === opt.key;
                                            return (
                                                <label
                                                    key={opt.key}
                                                    onClick={() => setObservationChoice(opt.key as any)}
                                                    className={cn(
                                                        'flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all',
                                                        isChecked
                                                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 text-foreground shadow-2xs'
                                                            : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                                                    )}
                                                >
                                                    <span className={cn(
                                                        'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                                                        isChecked ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/40'
                                                    )}>
                                                        {isChecked && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                                                    </span>
                                                    <span>{opt.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* SECTION 3: ACTUAL SESSION DETAILS */}
                                <div className="space-y-3 pt-2 border-t">
                                    <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        Actual Session Details
                                    </div>

                                    {/* Arrival Time */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-muted-foreground">
                                            Arrival Time <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Clock className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={arrivalTime}
                                                onChange={(e) => setArrivalTime(e.target.value)}
                                                placeholder="09:00 AM"
                                                className="pl-9 h-8.5 text-xs font-mono rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Class Start and Class End */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-foreground">
                                                Class Start <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Clock className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={classStartTime}
                                                    onChange={(e) => setClassStartTime(e.target.value)}
                                                    placeholder="09:05 AM"
                                                    className="pl-8 h-8.5 text-xs font-mono rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-foreground">
                                                Class End <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Clock className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={classEndTime}
                                                    onChange={(e) => setClassEndTime(e.target.value)}
                                                    placeholder="10:28 AM"
                                                    className="pl-8 h-8.5 text-xs font-mono rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actual Room & Delivery Mode */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-foreground">
                                                Actual Room <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={actualRoom}
                                                onChange={(e) => setActualRoom(e.target.value)}
                                                className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                                            >
                                                {laboratoryOptions.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-foreground">
                                                Delivery Mode <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={deliveryMode}
                                                onChange={(e) => setDeliveryMode(e.target.value as any)}
                                                className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                                            >
                                                <option value="Face-to-Face">Face-to-Face</option>
                                                <option value="Online/LMS">Online/LMS</option>
                                                <option value="Blended/Hybrid">Blended/Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: REMARKS AND EVIDENCE */}
                                <div className="space-y-2.5 pt-2 border-t">
                                    <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                        <Camera className="h-3.5 w-3.5 text-amber-500" />
                                        Remarks and Evidence
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground">Remarks (optional)</span>
                                            <span className="text-[10px] text-muted-foreground">{remarks.length}/500</span>
                                        </div>
                                        <textarea
                                            value={remarks}
                                            maxLength={500}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            rows={3}
                                            placeholder="Faculty arrived on time and discussed the scheduled topics. Class proceeded smoothly."
                                            className="w-full p-2.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* Photo Upload Box */}
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">Photo Evidence (optional)</span>
                                        {photoPreview ? (
                                            <div className="relative rounded-xl border p-2 bg-muted/20 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs truncate">
                                                    <ImageIcon className="h-4 w-4 text-amber-500 shrink-0" />
                                                    <span className="truncate">{photoFile ? photoFile.name : 'Attached Evidence Photo'}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPhotoFile(null);
                                                        setPhotoPreview(null);
                                                    }}
                                                    className="text-rose-500 hover:text-rose-600 text-xs font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="border border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 hover:bg-muted/30 transition-all">
                                                <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                                                <span className="text-xs font-bold text-foreground">Upload Photo</span>
                                                <span className="text-[10px] text-muted-foreground">JPG, PNG (Max 5MB)</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setPhotoFile(file);
                                                            setPhotoPreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 5: MONITORING ACCOUNTABILITY */}
                                <div className="space-y-2 pt-2 border-t text-xs">
                                    <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                        <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                                        Monitoring Accountability
                                    </div>

                                    <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lab In-Charge</span>
                                            <span className="font-bold text-foreground">{currentUserName || 'Ace Fuentes'}</span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Observation Timestamp</span>
                                            <span className="font-mono text-xs text-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {todayDate} · {currentTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Footer Action Buttons */}
                            <div className="p-4 sm:p-5 border-t bg-card space-y-2.5">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={isSubmitting}
                                        className="h-10 text-xs font-bold rounded-xl border-border hover:bg-muted"
                                    >
                                        Save Draft
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleSubmitObservation}
                                        disabled={isSubmitting}
                                        className="h-10 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs gap-1.5"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        {isSubmitting ? 'Submitting...' : 'Submit Observation'}
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReportDiscrepancy}
                                    disabled={isSubmitting}
                                    className="w-full h-9.5 text-xs font-bold border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-xl gap-1.5"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                    Report Discrepancy
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. REPORT GENERATOR MODAL */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setReportModalOpen(false)}
                    />
                    <div className="relative bg-card rounded-2xl border shadow-2xl max-w-lg w-full p-5 space-y-4 z-10">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                                <h3 className="text-base font-black text-foreground">
                                    Generate Lab Attendance Report
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReportModalOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-muted-foreground leading-relaxed">
                                Filter and export consolidated laboratory faculty attendance reports with monitored sessions, arrival times, delivery modes, and verified accountability.
                            </p>

                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Report Frequency / Scope</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                                        <button
                                            key={freq}
                                            type="button"
                                            onClick={() => setReportType(freq)}
                                            className={cn(
                                                'p-2.5 rounded-xl border text-center font-bold capitalize transition-all',
                                                reportType === freq
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                                                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5">
                                <div><strong>Selected Date / Period:</strong> {selectedDateFormatted}</div>
                                <div><strong>Laboratory Scope:</strong> {selectedLab === 'all' ? 'All Assigned Laboratories' : selectedLab}</div>
                                <div><strong>Faculty Scope:</strong> {selectedFaculty === 'all' ? 'All Faculty Members' : selectedFaculty}</div>
                                <div><strong>Personnel:</strong> {currentUserName || 'Ace Fuentes'}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportModalOpen(false)}
                                className="h-8.5 text-xs font-bold rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    window.print();
                                    setReportModalOpen(false);
                                }}
                                className="h-8.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs gap-1.5"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Print / Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
