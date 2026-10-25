import React, { useState, useMemo } from 'react';
import {
    Calendar,
    CalendarDays,
    Clock,
    Building2,
    Users,
    Search,
    CheckCircle2,
    AlertTriangle,
    Eye,
    ShieldAlert,
    RefreshCw,
    Info,
    LayoutGrid,
    CalendarRange,
    Table as TableIcon,
    Columns3,
    ArrowRight,
    MapPin,
    AlertCircle,
    SlidersHorizontal,
    X,
    FileSpreadsheet,
    FileText,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ExpectedSession } from '../index';

export interface LabScheduleSession {
    id: number;
    verified_schedule_id?: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    time_label: string;
    course_code: string;
    course_title: string;
    program_code: string;
    program_name?: string;
    section: string;
    faculty_name: string;
    faculty_id?: number;
    room_id: number;
    room_name: string;
    session_type: string;
    scheduled_minutes: number;
    mapping_confidence?: number;
    // Dynamic / monitoring attributes
    observation_status?: string;
    room_condition?: string;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
    late_minutes?: number;
    observed_minutes?: number;
    variance_minutes?: number;
    has_discrepancy?: boolean;
    remarks?: string | null;
    photo_url?: string | null;
    transferred_to_room?: string | null;
    is_historical_reconciliation?: boolean;
}

interface LabSchedulesModuleProps {
    assignedRooms: any[];
    sessionsList: ExpectedSession[];
    timetablesByRoom: Record<string, any[]>;
    todayName: string;
    todayDate: string;
    todayDateStr: string;
    currentTime: string;
    academicPeriod?: {
        name: string;
        code: string;
        class_start_date: string;
        class_start_date_raw?: string;
    };
    scheduleVersion?: string;
    lastSyncTime?: string;
    onOpenObservation: (session: ExpectedSession, historical?: boolean) => void;
    onOpenDisruptionModal: (roomId?: string, scheduleId?: number) => void;
}

export default function LabSchedulesModule({
    assignedRooms = [],
    sessionsList = [],
    timetablesByRoom = {},
    todayName,
    todayDate,
    todayDateStr,
    currentTime,
    academicPeriod = {
        name: 'AY 2026–2027 · 1st Semester',
        code: 'AY2026-2027-1S',
        class_start_date: 'Aug 10, 2026',
        class_start_date_raw: '2026-08-10',
    },
    scheduleVersion = 'Verified Master Timetable v1',
    lastSyncTime = 'Oct 24, 2026, 5:45 PM',
    onOpenObservation,
    onOpenDisruptionModal,
}: LabSchedulesModuleProps) {
    // 1. View Mode: 'weekly' (default) | 'today' | 'timeline' | 'table' | 'compare'
    const [viewMode, setViewMode] = useState<'weekly' | 'today' | 'timeline' | 'table' | 'compare'>('weekly');

    // 2. Filters
    const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
    const [filterFaculty, setFilterFaculty] = useState<string>('all');
    const [filterCourse, setFilterCourse] = useState<string>('all');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterProgram, setFilterProgram] = useState<string>('all');
    const [filterSessionStatus, setFilterSessionStatus] = useState<string>('all');
    const [filterRoomStatus, setFilterRoomStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Date & Week historical navigation
    const [selectedWeek, setSelectedWeek] = useState<string>('current');
    const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, negative = past weeks

    // Selected session for Slide-Over Drawer
    const [drawerSession, setDrawerSession] = useState<LabScheduleSession | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Weekday names
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Convert sessionsList and timetablesByRoom into a unified list of sessions
    const allUnifiedSessions = useMemo(() => {
        const list: LabScheduleSession[] = [];
        const seenKeys = new Set<string>();

        // Build a lookup map of today's monitoring sessions
        const todayMap = new Map<string, ExpectedSession>();
        sessionsList.forEach((s) => {
            todayMap.set(`${s.room_id}-${s.course_code}-${s.scheduled_start}`, s);
            if (s.verified_schedule_id) {
                todayMap.set(String(s.verified_schedule_id), s);
            }
        });

        // 1. Iterate over timetablesByRoom for weekly master entries
        Object.entries(timetablesByRoom).forEach(([roomIdStr, items]) => {
            const rId = Number(roomIdStr);
            const roomObj = assignedRooms.find((r) => r.id === rId);
            const rName = roomObj?.room_name ?? roomObj?.name ?? `Room #${rId}`;

            (items || []).forEach((item: any) => {
                const isToday = item.day_of_week?.toLowerCase() === todayName.toLowerCase();
                const matchedToday = isToday ? (todayMap.get(String(item.id)) || todayMap.get(`${rId}-${item.course_code}-${item.start_time}`)) : null;

                // Derive monitoring status
                let obsStatus = 'Upcoming';
                let roomCond = 'Available';
                let sessionOutcome = 'Conducted as Scheduled';
                let actualStart = null;
                let actualEnd = null;
                let lateMins = 0;
                let varianceMins = 0;
                let remarks = null;
                let photoUrl = null;
                let hasDiscrepancy = false;

                if (matchedToday) {
                    obsStatus = matchedToday.observation_status;
                    roomCond = matchedToday.room_condition;
                    sessionOutcome = matchedToday.session_outcome;
                    actualStart = matchedToday.actual_start_time;
                    actualEnd = matchedToday.actual_end_time;
                    lateMins = matchedToday.late_minutes;
                    varianceMins = matchedToday.variance_minutes;
                    remarks = matchedToday.remarks;
                    photoUrl = matchedToday.photo_url;
                    hasDiscrepancy = matchedToday.has_discrepancy;
                } else if (weekOffset < 0) {
                    // Historical past week
                    obsStatus = 'Completed';
                }

                const entryKey = `${rId}-${item.id}-${item.day_of_week}-${item.start_time}`;
                seenKeys.add(entryKey);

                list.push({
                    id: item.id,
                    verified_schedule_id: item.id,
                    day_of_week: item.day_of_week,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    time_label: item.time_label || `${item.start_time} – ${item.end_time}`,
                    course_code: item.course_code,
                    course_title: item.course_title,
                    program_code: item.program_code || 'BSIT',
                    program_name: item.program_name || 'Information Technology',
                    section: item.section,
                    faculty_name: item.faculty_name,
                    faculty_id: item.faculty_id,
                    room_id: rId,
                    room_name: rName,
                    session_type: item.session_type || 'Laboratory Class',
                    scheduled_minutes: item.scheduled_minutes || 90,
                    mapping_confidence: item.mapping_confidence ?? 1.0,
                    observation_status: obsStatus,
                    room_condition: roomCond,
                    actual_start_time: actualStart,
                    actual_end_time: actualEnd,
                    late_minutes: lateMins,
                    observed_minutes: item.scheduled_minutes || 90,
                    variance_minutes: varianceMins,
                    has_discrepancy: hasDiscrepancy,
                    remarks: remarks,
                    photo_url: photoUrl,
                });
            });
        });

        // 2. Also ensure all today sessions are captured even if room was not in timetablesByRoom
        sessionsList.forEach((s) => {
            const entryKey = `${s.room_id}-${s.verified_schedule_id}-${todayName}-${s.scheduled_start}`;
            if (!seenKeys.has(entryKey)) {
                list.push({
                    id: s.verified_schedule_id,
                    verified_schedule_id: s.verified_schedule_id,
                    day_of_week: todayName,
                    start_time: s.scheduled_start,
                    end_time: s.scheduled_end,
                    time_label: s.scheduled_time,
                    course_code: s.course_code,
                    course_title: s.course_title,
                    program_code: (s as any).program_code || 'BSIT',
                    program_name: (s as any).program_name || 'Information Technology',
                    section: s.section,
                    faculty_name: s.expected_faculty,
                    faculty_id: s.faculty_id,
                    room_id: s.room_id,
                    room_name: s.room_name,
                    session_type: (s as any).session_type || 'Laboratory Class',
                    scheduled_minutes: s.scheduled_minutes,
                    mapping_confidence: (s as any).mapping_confidence ?? 1.0,
                    observation_status: s.observation_status,
                    room_condition: s.room_condition,
                    actual_start_time: s.actual_start_time,
                    actual_end_time: s.actual_end_time,
                    late_minutes: s.late_minutes,
                    observed_minutes: s.observed_minutes,
                    variance_minutes: s.variance_minutes,
                    has_discrepancy: s.has_discrepancy,
                    remarks: s.remarks,
                    photo_url: s.photo_url,
                });
            }
        });

        return list;
    }, [timetablesByRoom, sessionsList, assignedRooms, todayName, weekOffset]);

    // Unique options for filter dropdowns
    const filterOptions = useMemo(() => {
        const faculties = new Set<string>();
        const courses = new Set<string>();
        const sections = new Set<string>();
        const programs = new Set<string>();

        allUnifiedSessions.forEach((s) => {
            if (s.faculty_name) faculties.add(s.faculty_name);
            if (s.course_code) courses.add(s.course_code);
            if (s.section) sections.add(s.section);
            if (s.program_code) programs.add(s.program_code);
        });

        return {
            faculties: Array.from(faculties).sort(),
            courses: Array.from(courses).sort(),
            sections: Array.from(sections).sort(),
            programs: Array.from(programs).sort(),
        };
    }, [allUnifiedSessions]);

    // Filtered sessions
    const filteredSessions = useMemo(() => {
        return allUnifiedSessions.filter((s) => {
            if (selectedRoomId !== 'all' && String(s.room_id) !== selectedRoomId) return false;
            if (filterFaculty !== 'all' && s.faculty_name !== filterFaculty) return false;
            if (filterCourse !== 'all' && s.course_code !== filterCourse) return false;
            if (filterSection !== 'all' && s.section !== filterSection) return false;
            if (filterProgram !== 'all' && s.program_code !== filterProgram) return false;
            if (filterSessionStatus !== 'all' && s.observation_status !== filterSessionStatus) return false;
            if (filterRoomStatus !== 'all' && s.room_condition !== filterRoomStatus) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchCourse = s.course_code.toLowerCase().includes(q) || s.course_title.toLowerCase().includes(q);
                const matchFac = s.faculty_name.toLowerCase().includes(q);
                const matchSec = s.section.toLowerCase().includes(q);
                const matchRoom = s.room_name.toLowerCase().includes(q);
                if (!matchCourse && !matchFac && !matchSec && !matchRoom) return false;
            }

            return true;
        });
    }, [
        allUnifiedSessions,
        selectedRoomId,
        filterFaculty,
        filterCourse,
        filterSection,
        filterProgram,
        filterSessionStatus,
        filterRoomStatus,
        searchQuery,
    ]);

    // Today's filtered sessions for the Today View
    const todayFilteredSessions = useMemo(() => {
        return filteredSessions.filter((s) => s.day_of_week.toLowerCase() === todayName.toLowerCase());
    }, [filteredSessions, todayName]);

    // KPI & Summary Strip calculations
    const summaryMetrics = useMemo(() => {
        const totalThisWeek = filteredSessions.length;
        const totalToday = todayFilteredSessions.length;
        const completedToday = todayFilteredSessions.filter((s) => s.observation_status === 'Completed').length;
        const upcomingToday = todayFilteredSessions.filter((s) => s.observation_status === 'Upcoming' || s.observation_status === 'Ready to Monitor').length;
        const unmonitoredToday = todayFilteredSessions.filter((s) => s.observation_status === 'Unmonitored').length;
        const inProgressToday = todayFilteredSessions.filter((s) => s.observation_status === 'In Progress' || s.observation_status === 'Started On Time').length;
        const disruptionsCount = todayFilteredSessions.filter((s) => s.has_discrepancy || s.observation_status === 'No Faculty Observed' || s.room_condition === 'Occupied by Another Class').length;

        const monitoredCount = completedToday + inProgressToday;
        const expectedCount = totalToday;
        const completeness = expectedCount > 0 ? Math.round((monitoredCount / expectedCount) * 1000) / 10 : 100;

        // Distinct active assigned laboratories with sessions
        const activeLabsCount = new Set(filteredSessions.map((s) => s.room_id)).size;

        return {
            totalThisWeek,
            totalToday,
            completedToday,
            upcomingToday,
            unmonitoredToday,
            inProgressToday,
            disruptionsCount,
            activeLabsCount,
            completeness,
            monitoredCount,
            expectedCount,
        };
    }, [filteredSessions, todayFilteredSessions]);

    // Helper: Badge styling for 10+ operational monitoring statuses
    const getSessionStatusBadge = (status: string = 'Upcoming') => {
        switch (status) {
            case 'Completed':
                return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5">Completed</Badge>;
            case 'In Progress':
            case 'Started On Time':
                return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-0.5 animate-pulse">In Progress</Badge>;
            case 'Ready to Monitor':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] px-2 py-0.5">Ready to Monitor</Badge>;
            case 'Late Start':
                return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-0.5">Late Start</Badge>;
            case 'No Faculty Observed':
                return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5">No Faculty Observed</Badge>;
            case 'Transferred Room':
                return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2 py-0.5">Transferred Room</Badge>;
            case 'Switched Online':
                return <Badge className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] px-2 py-0.5">Switched Online</Badge>;
            case 'Cancelled':
                return <Badge className="bg-rose-800 hover:bg-rose-900 text-white font-bold text-[10px] px-2 py-0.5">Cancelled</Badge>;
            case 'Unmonitored':
                return <Badge variant="destructive" className="font-bold text-[10px] px-2 py-0.5">Unmonitored</Badge>;
            case 'Needs Verification':
                return <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] px-2 py-0.5">Needs Verification</Badge>;
            case 'Upcoming':
            default:
                return <Badge variant="outline" className="border-border text-muted-foreground font-semibold text-[10px] px-2 py-0.5">Upcoming</Badge>;
        }
    };

    // Helper: Badge styling for Room Operational Status
    const getRoomConditionBadge = (cond: string = 'Available') => {
        switch (cond) {
            case 'Occupied by Another Class':
                return <Badge className="bg-purple-700 text-white font-bold text-[10px] px-2 py-0.5">Occupied / Other</Badge>;
            case 'Maintenance':
                return <Badge className="bg-slate-700 text-white font-bold text-[10px] px-2 py-0.5">Maintenance</Badge>;
            case 'Equipment Failure':
            case 'Power/Network Issue':
                return <Badge className="bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5">Equipment / Tech Issue</Badge>;
            case 'Available':
            case 'In Use as Scheduled':
                return <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-[10px] px-2 py-0.5">Normal</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] px-2 py-0.5">{cond}</Badge>;
        }
    };

    // Helper: Session Type tag badge
    const getSessionTypeTag = (type: string = 'Laboratory Class') => {
        switch (type) {
            case 'Laboratory Class':
            case 'Lab':
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">LAB</span>;
            case 'Make-Up Class':
            case 'Make-Up':
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">MAKE-UP</span>;
            case 'Examination':
            case 'Exam':
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">EXAM</span>;
            case 'Online':
            case 'Switched Online':
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">ONLINE</span>;
            case 'Transferred':
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">TRANSFERRED</span>;
            default:
                return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground border">REGULAR</span>;
        }
    };

    // Helper: Contextual primary action button for a session
    const renderContextualAction = (session: LabScheduleSession, compact = false) => {
        const status = session.observation_status;
        const isToday = session.day_of_week.toLowerCase() === todayName.toLowerCase();

        // 1. Session Ended without observation -> Confirm Outcome
        if (status === 'Unmonitored' || (isToday && status === 'Upcoming' && session.end_time < currentTime)) {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                        "font-bold border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20",
                        compact ? "h-6.5 px-2 text-[10px]" : "h-7 px-2.5 text-xs"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Find matching session from sessionsList or construct expected session
                        const matched = sessionsList.find((s) => s.verified_schedule_id === session.verified_schedule_id);
                        if (matched) {
                            onOpenObservation(matched, true);
                        } else {
                            openDrawer(session);
                        }
                    }}
                >
                    <CheckCircle2 className="w-3 h-3 mr-1 text-amber-500" />
                    Confirm Outcome
                </Button>
            );
        }

        // 2. Ready to monitor (around start time) -> Monitor Session
        if (status === 'Ready to Monitor') {
            return (
                <Button
                    size="sm"
                    className={cn(
                        "font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs",
                        compact ? "h-6.5 px-2 text-[10px]" : "h-7 px-2.5 text-xs"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        const matched = sessionsList.find((s) => s.verified_schedule_id === session.verified_schedule_id);
                        if (matched) onOpenObservation(matched);
                        else openDrawer(session);
                    }}
                >
                    <Eye className="w-3 h-3 mr-1" />
                    Monitor Session
                </Button>
            );
        }

        // 3. In Progress -> Open Monitoring
        if (status === 'In Progress' || status === 'Started On Time' || status === 'Late Start') {
            return (
                <Button
                    size="sm"
                    className={cn(
                        "font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs",
                        compact ? "h-6.5 px-2 text-[10px]" : "h-7 px-2.5 text-xs"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        const matched = sessionsList.find((s) => s.verified_schedule_id === session.verified_schedule_id);
                        if (matched) onOpenObservation(matched);
                        else openDrawer(session);
                    }}
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Open Monitoring
                </Button>
            );
        }

        // 4. Completed -> View Record
        if (status === 'Completed') {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                        "font-medium border-border text-foreground hover:bg-muted",
                        compact ? "h-6.5 px-2 text-[10px]" : "h-7 px-2.5 text-xs"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        openDrawer(session);
                    }}
                >
                    <FileText className="w-3 h-3 mr-1 text-muted-foreground" />
                    View Record
                </Button>
            );
        }

        // 5. Default (Upcoming or future days) -> View Details
        return (
            <Button
                size="sm"
                variant="outline"
                className={cn(
                    "font-medium border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                    compact ? "h-6.5 px-2 text-[10px]" : "h-7 px-2.5 text-xs"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(session);
                }}
            >
                <Info className="w-3 h-3 mr-1" />
                View Details
            </Button>
        );
    };

    // Open drawer
    const openDrawer = (session: LabScheduleSession) => {
        setDrawerSession(session);
        setIsDrawerOpen(true);
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedRoomId('all');
        setFilterFaculty('all');
        setFilterCourse('all');
        setFilterSection('all');
        setFilterProgram('all');
        setFilterSessionStatus('all');
        setFilterRoomStatus('all');
        setSearchQuery('');
    };

    const hasActiveFilters =
        selectedRoomId !== 'all' ||
        filterFaculty !== 'all' ||
        filterCourse !== 'all' ||
        filterSection !== 'all' ||
        filterProgram !== 'all' ||
        filterSessionStatus !== 'all' ||
        filterRoomStatus !== 'all' ||
        Boolean(searchQuery.trim());

    // Time slot frames for timeline and grid
    const timeSlotFrames = [
        { label: '07:30 AM – 09:00 AM', start: '07:30', end: '09:00' },
        { label: '09:00 AM – 10:30 AM', start: '09:00', end: '10:30' },
        { label: '10:30 AM – 12:00 PM', start: '10:30', end: '12:00' },
        { label: '01:00 PM – 02:30 PM', start: '13:00', end: '14:30' },
        { label: '02:30 PM – 04:00 PM', start: '14:30', end: '16:00' },
        { label: '04:00 PM – 05:30 PM', start: '16:00', end: '17:30' },
    ];

    return (
        <div className="space-y-4">
            {/* 1. MODULE-SPECIFIC HEADER (Amber Calendar Icon Box + "Lab Schedules" + Subtitle + View Switchers) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                        <CalendarRange className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                Lab Schedules
                            </h1>
                            
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            View expected classes, faculty assignments, and monitoring statuses across the semester.
                        </p>
                       
                    </div>
                </div>

                    {/* View Switcher: Weekly (Default) · Today · Timeline · Table · Lab Comparison */}
                    <div className="flex items-center gap-1.5 flex-wrap bg-muted/50 p-1 rounded-xl border border-border shadow-2xs self-start xl:self-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('weekly')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                viewMode === 'weekly'
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Weekly View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('today')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                viewMode === 'today'
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Today View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('timeline')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                viewMode === 'timeline'
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Timeline</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                viewMode === 'table'
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>Table View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('compare')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                viewMode === 'compare'
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Columns3 className="w-3.5 h-3.5" />
                            <span>Lab Comparison</span>
                        </button>
                    </div>
                </div>

            {/* 2. COMPREHENSIVE FILTER BAR */}
            <div className="bg-card border rounded-2xl p-3.5 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Search input */}
                    <div className="relative flex-1 min-w-[260px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Course Code, Course Title, Section, or Faculty Name..."
                            className="h-9 pl-9 pr-3 text-xs rounded-xl bg-background border-border shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Right: Week Navigator (Historical navigation back to official start of classes) */}
                    <div className="flex items-center gap-1.5 self-start lg:self-auto bg-muted/40 p-1 rounded-xl border border-border">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            disabled={weekOffset <= -10} // capped at class start Aug 10, 2026
                            onClick={() => setWeekOffset((prev) => prev - 1)}
                            title="Previous schedule week"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="px-2 text-xs font-bold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                                {weekOffset === 0
                                    ? 'Current Operational Week (Oct 19–24, 2026)'
                                    : weekOffset === -1
                                    ? 'Previous Week (Oct 12–17, 2026)'
                                    : `Week ${11 + weekOffset} (Official Semester)`}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            disabled={weekOffset >= 1}
                            onClick={() => setWeekOffset((prev) => prev + 1)}
                            title="Next schedule week"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        {weekOffset !== 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6.5 text-[10px] font-bold px-2 ml-1 rounded-lg"
                                onClick={() => setWeekOffset(0)}
                            >
                                Back to Today
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Dropdowns Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 border-t border-border/60">
                    {/* Laboratory */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Laboratory</label>
                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Labs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assigned Labs ({assignedRooms.length})</SelectItem>
                                {assignedRooms.map((r: any) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.room_name ?? r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Faculty */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Faculty</label>
                        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Faculty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Faculty</SelectItem>
                                {filterOptions.faculties.map((f) => (
                                    <SelectItem key={f} value={f}>
                                        {f}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Course */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course</label>
                        <Select value={filterCourse} onValueChange={setFilterCourse}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {filterOptions.courses.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Section</label>
                        <Select value={filterSection} onValueChange={setFilterSection}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Sections" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {filterOptions.sections.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Program */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Program</label>
                        <Select value={filterProgram} onValueChange={setFilterProgram}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Programs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Programs</SelectItem>
                                {filterOptions.programs.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Session Status */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Session Status</label>
                        <Select value={filterSessionStatus} onValueChange={setFilterSessionStatus}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Upcoming">Upcoming</SelectItem>
                                <SelectItem value="Ready to Monitor">Ready to Monitor</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Late Start">Late Start</SelectItem>
                                <SelectItem value="No Faculty Observed">No Faculty Observed</SelectItem>
                                <SelectItem value="Transferred Room">Transferred Room</SelectItem>
                                <SelectItem value="Switched Online">Switched Online</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Unmonitored">Unmonitored</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Room Condition */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Room Status</label>
                        <Select value={filterRoomStatus} onValueChange={setFilterRoomStatus}>
                            <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border">
                                <SelectValue placeholder="All Room Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Room Statuses</SelectItem>
                                <SelectItem value="Available">Available / Normal</SelectItem>
                                <SelectItem value="In Use as Scheduled">In Use as Scheduled</SelectItem>
                                <SelectItem value="Occupied by Another Class">Occupied by Another Class</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                <SelectItem value="Equipment Failure">Equipment Failure</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-muted-foreground font-medium">
                            Showing <strong className="text-foreground">{filteredSessions.length}</strong> matching verified sessions
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-6 px-2 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold"
                        >
                            Reset All Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* 3. SCHEDULE SUMMARY STRIP & MONITORING COVERAGE INDICATOR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {/* 1. Sessions This Week */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Sessions This Week</div>
                    <div className="text-xl font-black text-foreground">{summaryMetrics.totalThisWeek}</div>
                    <div className="text-[10px] text-muted-foreground/80">Across {assignedRooms.length} assigned labs</div>
                </div>

                {/* 2. Sessions Today */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Sessions Today</div>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">{summaryMetrics.totalToday}</div>
                    <div className="text-[10px] text-muted-foreground/80">{todayName} roster</div>
                </div>

                {/* 3. Completed */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Completed</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.completedToday}</div>
                    <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Verified & closed</div>
                </div>

                {/* 4. Upcoming */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Upcoming</div>
                    <div className="text-xl font-black text-foreground">{summaryMetrics.upcomingToday}</div>
                    <div className="text-[10px] text-muted-foreground/80">Remaining slots</div>
                </div>

                {/* 5. Unmonitored */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Unmonitored</div>
                    <div className={cn("text-xl font-black", summaryMetrics.unmonitoredToday > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                        {summaryMetrics.unmonitoredToday}
                    </div>
                    <div className="text-[10px] text-muted-foreground/80">Ended w/o observation</div>
                </div>

                {/* 6. Room Disruptions */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Disruptions</div>
                    <div className={cn("text-xl font-black", summaryMetrics.disruptionsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                        {summaryMetrics.disruptionsCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground/80">Open room flags</div>
                </div>

                {/* 7. Assigned Labs Active */}
                <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Labs Active</div>
                    <div className="text-xl font-black text-foreground">{summaryMetrics.activeLabsCount} / {assignedRooms.length}</div>
                    <div className="text-[10px] text-muted-foreground/80">Occupancy running</div>
                </div>

                {/* 8. MONITORING COVERAGE INDICATOR */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-3 shadow-2xs space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                        <span>Coverage</span>
                        <span>{summaryMetrics.completeness}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                summaryMetrics.completeness >= 90
                                    ? "bg-emerald-500"
                                    : summaryMetrics.completeness >= 60
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                            )}
                            style={{ width: `${Math.min(100, summaryMetrics.completeness)}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                        Today: {summaryMetrics.expectedCount} expected · {summaryMetrics.monitoredCount} monitored · {summaryMetrics.unmonitoredToday} unmonitored
                    </div>
                </div>
            </div>

            {/* 4. MAIN SCHEDULE VIEWS */}

            {/* VIEW A: WEEKLY VIEW (Default - Matrix of days Monday–Saturday) */}
            {viewMode === 'weekly' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {weekDays.map((day) => {
                            const daySessions = filteredSessions
                                .filter((s) => s.day_of_week.toLowerCase() === day.toLowerCase())
                                .sort((a, b) => a.start_time.localeCompare(b.start_time));

                            const isToday = day.toLowerCase() === todayName.toLowerCase();

                            return (
                                <div
                                    key={day}
                                    className={cn(
                                        "rounded-2xl border flex flex-col bg-card shadow-2xs transition-all min-h-[480px]",
                                        isToday
                                            ? "border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 bg-card"
                                            : "border-border/80"
                                    )}
                                >
                                    {/* Day Header */}
                                    <div
                                        className={cn(
                                            "p-3 border-b flex items-center justify-between rounded-t-2xl",
                                            isToday
                                                ? "bg-amber-500/10 border-amber-300 dark:border-amber-500/40"
                                                : "bg-muted/40 border-border/80"
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-sm text-foreground">{day}</span>
                                                {isToday && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {daySessions.length} expected class{daySessions.length === 1 ? '' : 'es'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cards Scroll Area */}
                                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[700px] scrollbar-thin">
                                        {daySessions.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-center p-3 text-muted-foreground/60">
                                                <Calendar className="w-8 h-8 stroke-1 mb-1.5 opacity-40" />
                                                <span className="text-xs font-medium">No sessions scheduled</span>
                                                <span className="text-[10px] opacity-75">Laboratories available</span>
                                            </div>
                                        ) : (
                                            daySessions.map((session) => {
                                                const isTransferred = session.transferred_to_room || session.observation_status === 'Transferred Room';

                                                return (
                                                    <div
                                                        key={`${session.id}-${session.room_id}-${session.start_time}`}
                                                        onClick={() => openDrawer(session)}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs group relative bg-background",
                                                            session.observation_status === 'Completed'
                                                                ? "border-emerald-500/30 hover:border-emerald-500/60"
                                                                : session.observation_status === 'In Progress'
                                                                ? "border-blue-500/50 ring-1 ring-blue-500/20"
                                                                : session.observation_status === 'Unmonitored'
                                                                ? "border-rose-500/40 bg-rose-500/5"
                                                                : session.has_discrepancy
                                                                ? "border-amber-500/50 bg-amber-500/5"
                                                                : "border-border hover:border-border/80"
                                                        )}
                                                    >
                                                        {/* Top row: Time + Session Type Badge */}
                                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                <span>{session.time_label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {getSessionTypeTag(session.session_type)}
                                                            </div>
                                                        </div>

                                                        {/* Course Code & Section */}
                                                        <div className="mb-1">
                                                            <div className="text-xs font-black text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                                                                <span>{session.course_code}</span>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                                                    {session.section}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate" title={session.course_title}>
                                                                {session.course_title}
                                                            </div>
                                                        </div>

                                                        {/* Faculty Name */}
                                                        <div className="flex items-center gap-1 text-[11px] text-foreground font-medium mb-1.5">
                                                            <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                                                            <span className="truncate">{session.faculty_name}</span>
                                                        </div>

                                                        {/* Room Info (Never overwrite planned room) */}
                                                        <div className="flex items-center justify-between gap-1 text-[10px] pt-1.5 border-t border-border/60">
                                                            <div className="flex items-center gap-1 font-bold text-foreground">
                                                                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                                                                <span>{session.room_name}</span>
                                                                {isTransferred && (
                                                                    <span className="text-purple-600 dark:text-purple-400 text-[9px]">
                                                                        → Actual: {session.transferred_to_room || 'Transferred'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                {getSessionStatusBadge(session.observation_status)}
                                                            </div>
                                                        </div>

                                                        {/* Quick Contextual Action on Hover/Card */}
                                                        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between">
                                                            <span className="text-[9px] text-muted-foreground">
                                                                {session.program_code}
                                                            </span>
                                                            {renderContextualAction(session, true)}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW B: TODAY VIEW (1-Click Operational Matrix) */}
            {viewMode === 'today' && (
                <div className="bg-card border rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-3.5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-amber-500" />
                                <span>Today's Complete Verified Roster ({todayFilteredSessions.length} Scheduled Sessions)</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Real-time monitoring matrix for {todayName}, {todayDate}. Click any row to inspect complete schedule and history.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-bold gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                                onClick={() => onOpenDisruptionModal()}
                            >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                Report Disruption
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-3">Time Slot</th>
                                    <th className="p-3">Laboratory</th>
                                    <th className="p-3">Course & Section</th>
                                    <th className="p-3">Expected Faculty</th>
                                    <th className="p-3">Duration</th>
                                    <th className="p-3">Room Condition</th>
                                    <th className="p-3">Session Status</th>
                                    <th className="p-3 text-right">Operational Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {todayFilteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            No verified sessions match the selected criteria for today.
                                        </td>
                                    </tr>
                                ) : (
                                    todayFilteredSessions.map((session) => {
                                        return (
                                            <tr
                                                key={`today-${session.id}-${session.room_id}-${session.start_time}`}
                                                onClick={() => openDrawer(session)}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                            >
                                                {/* Time */}
                                                <td className="p-3 font-mono font-bold text-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span>{session.time_label}</span>
                                                    </div>
                                                </td>

                                                {/* Lab */}
                                                <td className="p-3 font-bold text-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>{session.room_name}</span>
                                                    </div>
                                                </td>

                                                {/* Course & Section */}
                                                <td className="p-3">
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <span>{session.course_code}</span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                                            {session.section}
                                                        </span>
                                                        {getSessionTypeTag(session.session_type)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-xs" title={session.course_title}>
                                                        {session.course_title}
                                                    </div>
                                                </td>

                                                {/* Faculty */}
                                                <td className="p-3 whitespace-nowrap">
                                                    <div className="font-medium text-foreground">{session.faculty_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{session.program_code}</div>
                                                </td>

                                                {/* Duration */}
                                                <td className="p-3 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                                                    {session.scheduled_minutes} min
                                                </td>

                                                {/* Room Status */}
                                                <td className="p-3 whitespace-nowrap">
                                                    {getRoomConditionBadge(session.room_condition)}
                                                </td>

                                                {/* Session Status */}
                                                <td className="p-3 whitespace-nowrap">
                                                    {getSessionStatusBadge(session.observation_status)}
                                                </td>

                                                {/* Contextual Action */}
                                                <td className="p-3 text-right whitespace-nowrap">
                                                    {renderContextualAction(session)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW C: TIMELINE VIEW (Hour-by-hour chronological progression) */}
            {viewMode === 'timeline' && (
                <div className="bg-card border rounded-2xl p-4 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <div>
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span>Chronological Schedule Timeline ({todayName}, {todayDate})</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Continuous timeline view tracking active and upcoming time blocks across all assigned laboratories.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {timeSlotFrames.map((slot) => {
                            const slotSessions = todayFilteredSessions.filter((s) => {
                                return s.start_time <= slot.end && s.end_time >= slot.start;
                            });

                            const isCurrentSlot = currentTime >= slot.start && currentTime <= slot.end;

                            return (
                                <div
                                    key={slot.label}
                                    className={cn(
                                        "rounded-xl border p-3 transition-all",
                                        isCurrentSlot
                                            ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400/30"
                                            : "border-border/80 bg-background"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/60">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-black text-foreground">{slot.label}</span>
                                            {isCurrentSlot && (
                                                <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2">
                                                    Current Time Slot
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-medium">
                                            {slotSessions.length} session{slotSessions.length === 1 ? '' : 's'} running
                                        </div>
                                    </div>

                                    {slotSessions.length === 0 ? (
                                        <div className="py-2 text-xs text-muted-foreground italic flex items-center gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>All assigned computer laboratories free / unreserved during this slot.</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                            {slotSessions.map((session) => (
                                                <div
                                                    key={`tl-${session.id}-${session.room_id}`}
                                                    onClick={() => openDrawer(session)}
                                                    className="p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs font-black text-foreground">
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-3 h-3 text-amber-500" />
                                                                {session.room_name}
                                                            </span>
                                                            {getSessionStatusBadge(session.observation_status)}
                                                        </div>
                                                        <div className="mt-1 text-xs font-bold text-foreground">
                                                            {session.course_code} · {session.section}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground truncate">{session.course_title}</div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">Faculty: {session.faculty_name}</div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                                                        {getSessionTypeTag(session.session_type)}
                                                        {renderContextualAction(session, true)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW D: TABLE VIEW (Tabular sortable view of all filtered verified schedules) */}
            {viewMode === 'table' && (
                <div className="bg-card border rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-3.5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-amber-500" />
                                <span>Master Verified Timetable Records ({filteredSessions.length} total entries)</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Read-only schedule inventory derived from the verified academic timetable specification.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-3">Day</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Laboratory</th>
                                    <th className="p-3">Course Code & Title</th>
                                    <th className="p-3">Section</th>
                                    <th className="p-3">Program</th>
                                    <th className="p-3">Faculty</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredSessions.map((session) => (
                                    <tr
                                        key={`table-${session.id}-${session.room_id}-${session.day_of_week}-${session.start_time}`}
                                        onClick={() => openDrawer(session)}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    >
                                        <td className="p-3 font-bold text-foreground whitespace-nowrap">{session.day_of_week}</td>
                                        <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{session.time_label}</td>
                                        <td className="p-3 font-bold text-foreground whitespace-nowrap">{session.room_name}</td>
                                        <td className="p-3">
                                            <div className="font-bold text-foreground">{session.course_code}</div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-xs">{session.course_title}</div>
                                        </td>
                                        <td className="p-3 font-medium whitespace-nowrap">{session.section}</td>
                                        <td className="p-3 whitespace-nowrap">{session.program_code}</td>
                                        <td className="p-3 font-medium text-foreground whitespace-nowrap">{session.faculty_name}</td>
                                        <td className="p-3 whitespace-nowrap">{getSessionTypeTag(session.session_type)}</td>
                                        <td className="p-3 whitespace-nowrap">{getSessionStatusBadge(session.observation_status)}</td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            {renderContextualAction(session, true)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW E: LAB TIMETABLE COMPARISON (Side-by-side room comparison for rapid vacant lab spotting) */}
            {viewMode === 'compare' && (
                <div className="bg-card border rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
                        <div>
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                                <Columns3 className="w-4 h-4 text-amber-500" />
                                <span>Multi-Lab Timetable Comparison ({todayName}, {todayDate})</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Side-by-side comparison across all assigned laboratories to instantly identify free laboratories and room transfer destinations.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-3 w-40 min-w-[140px]">Time Slot</th>
                                    {assignedRooms.map((r: any) => (
                                        <th key={r.id} className="p-3 text-center min-w-[170px] border-l border-border/60">
                                            <div className="font-black text-foreground text-xs">{r.room_name ?? r.name}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{r.capacity || 40} seats</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {timeSlotFrames.map((slot) => {
                                    return (
                                        <tr key={slot.label} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-3 font-mono font-bold text-foreground bg-muted/20">
                                                <div className="text-xs">{slot.label}</div>
                                            </td>
                                            {assignedRooms.map((room: any) => {
                                                const session = todayFilteredSessions.find((s) => {
                                                    return s.room_id === room.id && s.start_time <= slot.end && s.end_time >= slot.start;
                                                });

                                                return (
                                                    <td
                                                        key={`${room.id}-${slot.start}`}
                                                        className="p-2 border-l border-border/60 align-top"
                                                    >
                                                        {session ? (
                                                            <div
                                                                onClick={() => openDrawer(session)}
                                                                className="p-2 rounded-xl border border-border/80 bg-background hover:bg-muted/40 transition-all cursor-pointer space-y-1 shadow-2xs"
                                                            >
                                                                <div className="flex items-center justify-between text-[11px] font-black text-foreground">
                                                                    <span>{session.course_code}</span>
                                                                    {getSessionTypeTag(session.session_type)}
                                                                </div>
                                                                <div className="text-[10px] font-semibold text-muted-foreground">
                                                                    Sec {session.section} · {session.faculty_name.split(' ').pop()}
                                                                </div>
                                                                <div className="pt-1 border-t border-border/60 flex items-center justify-between">
                                                                    {getSessionStatusBadge(session.observation_status)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center text-center p-1">
                                                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                    Available / Free
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground">Open for transfer</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. HISTORICAL UNMONITORED BANNER (If viewing a past date with unmonitored expected sessions) */}
            {weekOffset < 0 && (
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-xs font-bold text-foreground">
                                Historical Operational Schedule — Past Period View
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                Historical timetable verified by academic authority. If any past sessions lack observation logs, they are flagged as{' '}
                                <strong className="text-foreground font-semibold">"Expected Session — No Monitoring Record"</strong>. You can perform retrospective outcome verification.
                            </div>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-bold border-amber-500 text-amber-700 dark:text-amber-400"
                        onClick={() => setWeekOffset(0)}
                    >
                        Return to Current Week
                    </Button>
                </div>
            )}

            {/* 6. COLOR-CODED STATUS LEGEND */}
            <div className="bg-card border rounded-2xl p-3 shadow-2xs">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Operational Status Legend & Monitoring Codes
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {/* Green: Completed / verified */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Green:</strong> Completed / Verified Session
                        </span>
                    </div>

                    {/* Blue: Upcoming / In Progress */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Blue:</strong> Upcoming / In Progress
                        </span>
                    </div>

                    {/* Yellow: Monitoring Required / Late */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Yellow:</strong> Monitoring Required / Late Start
                        </span>
                    </div>

                    {/* Red: Disruption / Discrepancy */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Red:</strong> Disruption / Room Discrepancy
                        </span>
                    </div>

                    {/* Purple: Special / Make-Up / Exam */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Purple:</strong> Make-Up / Exam / Transferred
                        </span>
                    </div>

                    {/* Gray: No Monitoring Record */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="text-muted-foreground">
                            <strong className="text-foreground">Gray:</strong> No Monitoring Record / N/A
                        </span>
                    </div>
                </div>
            </div>

            {/* 7. SLIDE-OVER SESSION DETAILS DRAWER */}
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col">
                    {drawerSession && (
                        <div className="flex flex-col h-full">
                            {/* Drawer Header */}
                            <div className="p-5 border-b bg-muted/20 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {drawerSession.day_of_week} · {drawerSession.time_label}
                                    </Badge>
                                    {getSessionStatusBadge(drawerSession.observation_status)}
                                </div>
                                <SheetTitle className="text-lg font-black text-foreground">
                                    {drawerSession.course_code} · {drawerSession.section}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground">
                                    {drawerSession.course_title}
                                </SheetDescription>
                            </div>

                            {/* Drawer Body - Verified Record Details (Read-Only) */}
                            <div className="p-5 space-y-4 flex-1">
                                {/* Academic Context */}
                                <div className="rounded-xl border p-3.5 bg-card space-y-2.5 shadow-2xs">
                                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Verified Schedule Information (Read-Only)
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Academic Period</span>
                                            <span className="font-bold text-foreground">{academicPeriod.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Program</span>
                                            <span className="font-bold text-foreground">{drawerSession.program_name || drawerSession.program_code}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Expected Laboratory</span>
                                            <span className="font-bold text-foreground">{drawerSession.room_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Session Type</span>
                                            <div className="mt-0.5">{getSessionTypeTag(drawerSession.session_type)}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Assigned Faculty</span>
                                            <span className="font-bold text-foreground">{drawerSession.faculty_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Scheduled Duration</span>
                                            <span className="font-bold text-foreground font-mono">{drawerSession.scheduled_minutes} minutes</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Master Sync Source</span>
                                            <span className="font-medium text-muted-foreground">{scheduleVersion}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px]">Mapping Confidence</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {Math.round((drawerSession.mapping_confidence ?? 1.0) * 100)}% Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Monitoring Audit History */}
                                <div className="rounded-xl border p-3.5 bg-card space-y-2.5 shadow-2xs">
                                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                        <span>Monitoring Observation History</span>
                                        {drawerSession.observation_status === 'Completed' && (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Logged
                                            </span>
                                        )}
                                    </div>

                                    {drawerSession.actual_start_time ? (
                                        <div className="space-y-2 text-xs">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Actual Start Time</span>
                                                    <span className="font-mono font-bold text-foreground">{drawerSession.actual_start_time}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Actual End Time</span>
                                                    <span className="font-mono font-bold text-foreground">{drawerSession.actual_end_time || 'In Progress'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Late Arrival</span>
                                                    <span className={cn("font-bold", drawerSession.late_minutes && drawerSession.late_minutes > 0 ? "text-amber-600" : "text-foreground")}>
                                                        {drawerSession.late_minutes ?? 0} min
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Room Condition</span>
                                                    <span className="font-bold text-foreground">{drawerSession.room_condition || 'Normal'}</span>
                                                </div>
                                            </div>

                                            {drawerSession.remarks && (
                                                <div className="pt-2 border-t border-border/60">
                                                    <span className="text-muted-foreground block text-[10px]">Observations & Remarks</span>
                                                    <p className="text-xs text-foreground bg-muted/30 p-2 rounded-lg mt-0.5">
                                                        {drawerSession.remarks}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-muted/30 rounded-xl text-center space-y-1">
                                            <span className="text-xs text-muted-foreground">No observation log recorded yet.</span>
                                            <div className="text-[10px] text-muted-foreground/80">
                                                Expected during active room monitoring rounds.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Room Disruption or Transfer Notice (if transferred) */}
                                {drawerSession.transferred_to_room && (
                                    <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-3 space-y-1 text-xs">
                                        <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5" /> Room Transfer Active
                                        </div>
                                        <div className="text-muted-foreground">
                                            Planned Room: <strong className="text-foreground">{drawerSession.room_name}</strong>
                                            <br />
                                            Relocated to: <strong className="text-foreground">{drawerSession.transferred_to_room}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 font-bold text-xs gap-1"
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        onOpenDisruptionModal(String(drawerSession.room_id), drawerSession.verified_schedule_id);
                                    }}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Report Room Issue
                                </Button>

                                <div className="flex items-center gap-2">
                                    {drawerSession.day_of_week.toLowerCase() === todayName.toLowerCase() && (
                                        <Button
                                            size="sm"
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1"
                                            onClick={() => {
                                                setIsDrawerOpen(false);
                                                const matched = sessionsList.find((s) => s.verified_schedule_id === drawerSession.verified_schedule_id);
                                                if (matched) {
                                                    onOpenObservation(matched);
                                                }
                                            }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Record Observation
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setIsDrawerOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
