import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ShieldCheck,
    Clock,
    Building2,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    MonitorPlay,
    LayoutGrid,
    ClipboardCheck,
    Users,
    Laptop,
    History,
    Sparkles,
    ArrowRight,
    WifiOff,
    Wrench,
    DoorClosed,
    FileQuestion,
    RotateCcw,
    Bell,
    CalendarDays,
    Eye,
    Filter,
    CheckCircle,
    XCircle,
    Info,
    Search,
    FileText,
    ExternalLink,
    AlertCircle,
    Layers,
    ListFilter,
    HelpCircle,
    Send,
    Play,
    Monitor,
    ChevronRight,
    GraduationCap,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Camera,
    Image as ImageIcon,
    Trash2,
    ZoomIn,
    Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
    { title: 'Lab In-Charge Operational Workspace', href: '/monitoring/lab-in-charge' },
];

export interface ExpectedSession {
    verified_schedule_id: number;
    room_id: number;
    room_name: string;
    course_code: string;
    course_title: string;
    section: string;
    expected_faculty: string;
    faculty_id: number;
    scheduled_time: string;
    scheduled_start: string;
    scheduled_end: string;
    scheduled_minutes: number;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
    late_minutes: number;
    observed_minutes: number;
    variance_minutes: number;
    student_headcount?: number | null;
    observation_status: string;
    room_condition: string;
    session_outcome: string;
    has_discrepancy: boolean;
    remarks?: string | null;
    photo_url?: string | null;
    monitoring_session_id?: number | null;
    can_edit?: boolean;
}

export interface RoomStatusItem {
    room_id: number;
    room_name: string;
    building?: string;
    floor?: string;
    type?: string;
    capacity?: number;
    equipment_details?: string;
    operational_badge: string;
    actual_status: string;
    minutes_remaining?: number | null;
    active_session?: ExpectedSession | null;
    next_session?: ExpectedSession | null;
    expected_peak_hours?: string;
    peak_status?: string;
}

export interface ActionRequiredItem {
    type: string;
    severity: 'urgent' | 'warning' | 'info';
    title: string;
    description: string;
    action_label: string;
    verified_schedule_id?: number;
    discrepancy_id?: number;
    session?: ExpectedSession;
}

export interface DiscrepancyItem {
    id: number;
    room_id: number;
    room: { id: number; room_name?: string; name?: string };
    discrepancy_type: string;
    severity: string;
    expected_state: string;
    observed_state: string;
    remarks?: string;
    evidence_details?: string;
    photo_url?: string | null;
    resolution_status: 'Reported' | 'Under Review' | 'Clarification Required' | 'Resolved' | 'Verified' | string;
    resolution_notes?: string;
    reporter: { name: string };
    created_at: string;
}

export interface HistoricalSessionItem {
    id: number;
    monitoring_date: string;
    room_name: string;
    course_code: string;
    section: string;
    expected_faculty: string;
    scheduled_time: string;
    actual_time: string;
    room_condition: string;
    session_outcome: string;
    late_minutes: number;
    observed_minutes: number;
    variance_minutes: number;
    is_historical_reconciliation: boolean;
    monitored_by: string;
    remarks?: string;
    photo_url?: string | null;
    correction_requested?: boolean;
    has_discrepancy?: boolean;
}

export interface AssignedLabItem {
    room_id: number;
    room_name: string;
    building: string;
    floor: string;
    type: string;
    capacity: number;
    equipment_details: string;
    shift_name: string;
    shift_hours: string;
    assigned_days: string;
    role_type: string;
    effective_dates: string;
}

export interface TimetableEntry {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    time_label: string;
    course_code: string;
    course_title: string;
    section: string;
    faculty_name: string;
    room_name: string;
}

export interface TimeSlotOption {
    id: string;
    label: string;
    start: string;
    end: string;
}

interface Props {
    labInChargeUser: {
        name: string;
        email: string;
        role: string;
    };
    currentShift: string;
    todayName: string;
    todayDate: string;
    currentTime: string;
    assignedRooms: any[];
    roomStatusBoard: RoomStatusItem[];
    actionRequired: ActionRequiredItem[];
    sessionsList: ExpectedSession[];
    kpi: {
        sessions_today: number;
        in_progress: number;
        completed: number;
        upcoming: number;
        unmonitored: number;
        late_starts: number;
        disruptions: number;
        discrepancies: number;
    };
    openDiscrepancies: DiscrepancyItem[];
    historicalSessions: HistoricalSessionItem[];
    unmonitoredHistoricalCount: number;
    timetablesByRoom: Record<string, TimetableEntry[]>;
    myAssignedLabs: AssignedLabItem[];
    allFaculty: { id: number; first_name: string; last_name: string }[];
    overallLabPeak?: string;
    availableTimeSlots?: TimeSlotOption[];
    endOfDayReport?: any;
}

export default function LabInChargeMonitoring({
    labInChargeUser,
    currentShift,
    todayName,
    todayDate,
    currentTime,
    assignedRooms = [],
    roomStatusBoard = [],
    actionRequired = [],
    sessionsList = [],
    kpi,
    openDiscrepancies = [],
    historicalSessions = [],
    unmonitoredHistoricalCount = 14,
    timetablesByRoom = {},
    myAssignedLabs = [],
    allFaculty = [],
    overallLabPeak = '2 PM – 3 PM',
    availableTimeSlots = [],
    endOfDayReport,
}: Props) {
    // Top-Level Module Navigation (11 dedicated operational modules)
    const [activeModule, setActiveModule] = useState<
        | 'dashboard'
        | 'today'
        | 'live_monitoring'
        | 'rooms'
        | 'historical'
        | 'discrepancies'
        | 'history'
        | 'assigned_labs'
        | 'action_required'
        | 'timetables'
        | 'end_of_day'
    >(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as any;
            if (tabParam) return tabParam;
        }
        return 'dashboard';
    });

    // Listen to URL search param changes (e.g. when clicking sidebar navigation links)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as any;
            if (tabParam && tabParam !== activeModule) {
                setActiveModule(tabParam);
            }
        }
    }, [window.location.search]);

    // Schedule Filters
    const [scheduleViewMode, setScheduleViewMode] = useState<'day' | 'timeline'>('day');
    const [filterRoom, setFilterRoom] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSearch, setFilterSearch] = useState<string>('');

    // Time Frame Selector for Lab In-Charge Live/Timeframe Room Status
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('live');

    // Selected Room for Lab Timetables module
    const [selectedTimetableRoomId, setSelectedTimetableRoomId] = useState<string>(() => {
        return assignedRooms[0]?.id ? String(assignedRooms[0].id) : 'all';
    });
    const [timetableSearch, setTimetableSearch] = useState<string>('');
    const [timetableWeekFilter, setTimetableWeekFilter] = useState<string>('This Week');
    const [timetableViewMode, setTimetableViewMode] = useState<'grid' | 'timeline'>('grid');

    // Live Session Monitoring Modal State
    const [monitoringModalOpen, setMonitoringModalOpen] = useState(false);
    const [targetSession, setTargetSession] = useState<ExpectedSession | null>(null);
    const [isHistoricalMode, setIsHistoricalMode] = useState(false);

    // Form inputs for observation
    const [obsActualStart, setObsActualStart] = useState('');
    const [obsActualEnd, setObsActualEnd] = useState('');
    const [obsStatus, setObsStatus] = useState('In Progress');
    const [obsRoomCondition, setObsRoomCondition] = useState('In Use as Scheduled');
    const [obsSessionOutcome, setObsSessionOutcome] = useState('Conducted as Scheduled');
    const [obsAlternativeRoomId, setObsAlternativeRoomId] = useState('');
    const [obsHeadcount, setObsHeadcount] = useState('');
    const [obsFacultyId, setObsFacultyId] = useState('');
    const [obsCourseCode, setObsCourseCode] = useState('');
    const [obsSectionName, setObsSectionName] = useState('');
    const [obsRemarks, setObsRemarks] = useState('');
    const [obsPhoto, setObsPhoto] = useState<File | null>(null);
    const [obsPhotoPreview, setObsPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Immediate Disruption Report Modal State
    const [disruptionModalOpen, setDisruptionModalOpen] = useState(false);
    const [disruptRoomId, setDisruptRoomId] = useState('');
    const [disruptType, setDisruptType] = useState('Unscheduled Room Use / Double Occupancy');
    const [disruptSeverity, setDisruptSeverity] = useState('Needs Attention');
    const [disruptObservedState, setDisruptObservedState] = useState('');
    const [disruptRemarks, setDisruptRemarks] = useState('');
    const [disruptPhoto, setDisruptPhoto] = useState<File | null>(null);
    const [disruptPhotoPreview, setDisruptPhotoPreview] = useState<string | null>(null);

    // Lightbox / Image Preview Modal
    const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
    const [viewPhotoTitle, setViewPhotoTitle] = useState<string>('');

    // Correction Request Modal
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoricalSessionItem | null>(null);
    const [correctionNotes, setCorrectionNotes] = useState('');

    // Open observation modal pre-populated
    const openObservationModal = (session: ExpectedSession, historical = false) => {
        setTargetSession(session);
        setIsHistoricalMode(historical);

        // Pre-fill observed start/end with defaults if none exist
        setObsActualStart(session.actual_start_time || session.scheduled_start);
        setObsActualEnd(session.actual_end_time || session.scheduled_end);
        setObsStatus(session.observation_status === 'Upcoming' || session.observation_status === 'Ready to Monitor' ? 'In Progress' : session.observation_status);
        setObsRoomCondition(session.room_condition || 'In Use as Scheduled');
        setObsSessionOutcome(session.session_outcome || 'Conducted as Scheduled');
        setObsAlternativeRoomId('');
        setObsHeadcount(session.student_headcount ? String(session.student_headcount) : '');
        setObsFacultyId(session.faculty_id ? String(session.faculty_id) : '');
        setObsCourseCode('');
        setObsSectionName('');
        setObsRemarks(session.remarks || '');
        setObsPhoto(null);
        setObsPhotoPreview(session.photo_url || null);
        setMonitoringModalOpen(true);
    };

    // Calculate dynamic late minutes preview
    const calculatedLateMinutes = useMemo(() => {
        if (!targetSession || !obsActualStart) return 0;
        try {
            const schedParts = targetSession.scheduled_start.split(':').map(Number);
            const actualParts = obsActualStart.split(':').map(Number);
            const schedMins = schedParts[0] * 60 + schedParts[1];
            const actualMins = actualParts[0] * 60 + actualParts[1];
            return Math.max(0, actualMins - schedMins);
        } catch (e) {
            return 0;
        }
    }, [targetSession, obsActualStart]);

    // Handle submit observation
    const handleSubmitObservation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetSession) return;
        setIsSubmitting(true);

        const payload: Record<string, any> = {
            verified_schedule_id: targetSession.verified_schedule_id,
            room_id: targetSession.room_id,
            actual_start_time: obsActualStart,
            actual_end_time: obsActualEnd,
            observation_status: obsStatus,
            room_condition: obsRoomCondition,
            session_outcome: obsSessionOutcome,
            alternative_room_id: obsAlternativeRoomId ? Number(obsAlternativeRoomId) : null,
            student_headcount: obsHeadcount ? Number(obsHeadcount) : null,
            observed_faculty_id: obsFacultyId && Number(obsFacultyId) !== targetSession.faculty_id ? Number(obsFacultyId) : null,
            observed_course_code: obsCourseCode || null,
            observed_section_name: obsSectionName || null,
            remarks: obsRemarks,
            is_historical_reconciliation: isHistoricalMode,
        };

        if (obsPhoto) {
            payload.photo = obsPhoto;
        }

        router.post(
            route('lab-in-charge.observation'),
            payload,
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setMonitoringModalOpen(false);
                    setTargetSession(null);
                    setObsPhoto(null);
                    setObsPhotoPreview(null);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Handle quick submit disruption
    const handleSubmitDisruption = (e: React.FormEvent) => {
        e.preventDefault();
        if (!disruptRoomId) return;
        setIsSubmitting(true);

        const payload: Record<string, any> = {
            room_id: Number(disruptRoomId),
            discrepancy_type: disruptType,
            severity: disruptSeverity,
            observed_state: disruptObservedState,
            remarks: disruptRemarks,
        };

        if (disruptPhoto) {
            payload.photo = disruptPhoto;
        }

        router.post(
            route('lab-in-charge.disruption'),
            payload,
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setDisruptionModalOpen(false);
                    setDisruptObservedState('');
                    setDisruptRemarks('');
                    setDisruptPhoto(null);
                    setDisruptPhotoPreview(null);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Handle correction request
    const handleSubmitCorrectionRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHistoryItem) return;
        setIsSubmitting(true);

        router.post(
            route('lab-in-charge.request-correction'),
            {
                monitoring_session_id: selectedHistoryItem.id,
                correction_notes: correctionNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCorrectionModalOpen(false);
                    setSelectedHistoryItem(null);
                    setCorrectionNotes('');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Transition discrepancy status
    const handleTransitionStatus = (discrepancyId: number, nextStatus: string) => {
        router.post(
            route('lab-in-charge.discrepancy.status', { discrepancy: discrepancyId }),
            { resolution_status: nextStatus },
            { preserveScroll: true }
        );
    };

    // Operational badge styling helper
    const getBadgeForRoom = (badge: string) => {
        switch (badge) {
            case 'Available':
                return <Badge className="bg-emerald-600 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Available</Badge>;
            case 'Class In Progress':
                return <Badge className="bg-blue-600 text-white font-semibold text-[10px] px-1.5 py-0.5 animate-pulse whitespace-nowrap">In Progress</Badge>;
            case 'Late Start':
                return <Badge className="bg-amber-600 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Late Start</Badge>;
            case 'Occupied by Another Class':
                return <Badge className="bg-purple-700 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Occupied</Badge>;
            case 'Maintenance':
                return <Badge className="bg-slate-600 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Maintenance</Badge>;
            case 'Equipment Issue':
                return <Badge className="bg-rose-700 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Issue</Badge>;
            case 'Needs Verification':
                return <Badge className="bg-orange-600 text-white font-semibold text-[10px] px-1.5 py-0.5 whitespace-nowrap">Verify</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">{badge}</Badge>;
        }
    };

    // Session Status styling helper
    const getBadgeForSession = (status: string) => {
        switch (status) {
            case 'In Progress':
            case 'Started On Time':
                return <Badge className="bg-blue-600 text-white font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">In Progress</Badge>;
            case 'Completed':
                return <Badge className="bg-emerald-600 text-white font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">Completed</Badge>;
            case 'Late Start':
                return <Badge className="bg-amber-600 text-white font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">Late Start</Badge>;
            case 'Ready to Monitor':
                return <Badge className="bg-indigo-600 text-white font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">Ready</Badge>;
            case 'Unmonitored':
                return <Badge variant="destructive" className="font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">Unmonitored</Badge>;
            case 'Upcoming':
                return <Badge variant="outline" className="text-slate-600 font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">Upcoming</Badge>;
            case 'Cancelled':
            case 'Faculty Not Present':
                return <Badge variant="destructive" className="font-medium text-[10px] px-1.5 py-0.5 whitespace-nowrap">{status}</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">{status}</Badge>;
        }
    };

    // Filtered today's sessions
    const filteredTodaySessions = useMemo(() => {
        return sessionsList.filter((s) => {
            const matchesRoom = filterRoom === 'all' || String(s.room_id) === filterRoom;
            const matchesStatus = filterStatus === 'all' || s.observation_status === filterStatus;
            const matchesSearch =
                !filterSearch ||
                s.course_code.toLowerCase().includes(filterSearch.toLowerCase()) ||
                s.expected_faculty.toLowerCase().includes(filterSearch.toLowerCase()) ||
                s.section.toLowerCase().includes(filterSearch.toLowerCase()) ||
                s.room_name.toLowerCase().includes(filterSearch.toLowerCase());
            return matchesRoom && matchesStatus && matchesSearch;
        });
    }, [sessionsList, filterRoom, filterStatus, filterSearch]);

    // Calculate dynamic room status based on the selected time frame (e.g. 'live' vs '07:30', '09:00', etc.)
    const dynamicDisplayRooms = useMemo(() => {
        return roomStatusBoard.map((room) => {
            const roomSessions = sessionsList.filter((s) => s.room_id === room.room_id);

            if (selectedTimeFrame === 'live') {
                return {
                    ...room,
                    active_session: room.active_session,
                    next_session: room.next_session,
                    is_in_use: Boolean(room.active_session),
                };
            }

            // A specific time slot is selected (e.g. '07:30', '09:00', '10:30')
            // Match sessions whose time interval overlaps with this slot
            const slotStartStr = selectedTimeFrame.length === 5 ? `${selectedTimeFrame}:00` : selectedTimeFrame;
            const slotOption = availableTimeSlots.find((t) => t.id === selectedTimeFrame);
            const slotEndStr = slotOption ? (slotOption.end.length === 5 ? `${slotOption.end}:00` : slotOption.end) : '23:59:00';

            const matchingSession = roomSessions.find((s) => {
                const sStart = `${s.scheduled_start}:00`;
                const sEnd = `${s.scheduled_end}:00`;
                return sStart < slotEndStr && sEnd > slotStartStr;
            });

            // Find next session after this slot
            const nextSession = roomSessions.find((s) => {
                const sStart = `${s.scheduled_start}:00`;
                return sStart >= slotEndStr;
            });

            return {
                ...room,
                active_session: matchingSession ?? null,
                next_session: nextSession ?? null,
                is_in_use: Boolean(matchingSession),
            };
        });
    }, [roomStatusBoard, sessionsList, selectedTimeFrame, availableTimeSlots]);

    // Sessions that are currently in session or ready to monitor for the active time frame
    const currentSessionsInLaboratories = useMemo(() => {
        const fromRooms = dynamicDisplayRooms
            .filter((r) => r.active_session)
            .map((r) => ({
                session: r.active_session!,
                roomName: r.room_name,
                building: r.building,
                minutesRemaining: r.minutes_remaining,
                operationalBadge: r.operational_badge,
                expected_peak_hours: r.expected_peak_hours,
                peak_status: r.peak_status,
            }));

        if (fromRooms.length > 0) return fromRooms;

        if (selectedTimeFrame === 'live') {
            return sessionsList
                .filter(
                    (s) =>
                        s.observation_status === 'Ready to Monitor' ||
                        s.observation_status === 'In Progress' ||
                        s.observation_status === 'Started On Time' ||
                        s.observation_status === 'Late Start'
                )
                .map((s) => ({
                    session: s,
                    roomName: s.room_name,
                    building: '',
                    minutesRemaining: null,
                    operationalBadge: s.observation_status,
                    expected_peak_hours: '7:00 AM – 6:00 PM',
                    peak_status: 'Normal',
                }));
        }

        return [];
    }, [dynamicDisplayRooms, selectedTimeFrame, sessionsList]);

    // Active KPI calculations dynamically reflecting the selected time frame
    const dynamicRoomsInUseCount = useMemo(() => {
        return dynamicDisplayRooms.filter((r) => r.is_in_use).length;
    }, [dynamicDisplayRooms]);

    const dynamicRoomsAvailableCount = useMemo(() => {
        return dynamicDisplayRooms.filter((r) => !r.is_in_use).length;
    }, [dynamicDisplayRooms]);

    const dynamicFacultyInLabsCount = useMemo(() => {
        return dynamicDisplayRooms.filter((r) => r.is_in_use && r.active_session?.expected_faculty).length;
    }, [dynamicDisplayRooms]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lab In-Charge Operational Workspace" />

            <div className="p-3 sm:p-5 space-y-4 w-full">
                {/* 1. TOP OPERATIONAL HEADER: "What requires my attention right now?" */}
                <div className="bg-card border rounded-xl p-4 shadow-2xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                    Live Workspace
                                </span>
                                <Badge variant="outline" className="text-[11px] font-mono py-0 h-5">
                                    {todayName}, {todayDate} · {currentTime}
                                </Badge>
                            </div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                                Lab In-Charge Operational Command Hub
                            </h1>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                <span><strong className="text-foreground font-medium">In-Charge:</strong> {labInChargeUser.name}</span>
                                <span className="text-muted-foreground/40">•</span>
                                <span><strong className="text-foreground font-medium">Shift:</strong> {currentShift}</span>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="truncate max-w-md"><strong className="text-foreground font-medium">Assigned Labs:</strong> {assignedRooms.map((r: any) => r.room_name ?? r.name).join(', ') || 'All Computer Labs'}</span>
                            </div>
                        </div>

                        {/* Quick Operational Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                className="border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-bold gap-1.5"
                                onClick={() => router.get('/monitoring/lab-in-charge/end-of-day')}
                            >
                                <FileCheck className="h-4 w-4 text-amber-600" />
                                End-of-Day Closing Report
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 font-bold gap-1.5"
                                onClick={() => {
                                    setDisruptRoomId(String(assignedRooms[0]?.id ?? ''));
                                    setDisruptionModalOpen(true);
                                }}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Report Room Disruption
                            </Button>
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-1.5 shadow-xs"
                                onClick={() => {
                                    const readySession = currentSessionsInLaboratories[0]?.session || sessionsList.find(s => s.observation_status === 'Ready to Monitor' || s.observation_status === 'In Progress') || sessionsList[0];
                                    if (readySession) {
                                        openObservationModal(readySession);
                                    } else {
                                        setActiveModule('today');
                                    }
                                }}
                            >
                                <MonitorPlay className="h-4 w-4" />
                                Record Live Observation
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. TV SLIDE 5 STYLE LAB MONITORING & TIME FRAME SELECTOR */}
                <div className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.02] dark:bg-amber-500/[0.03] p-4 shadow-sm">
                    {/* Time Frame Selector Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                                    Laboratory Session Monitoring
                                </h2>
                                <Badge variant="outline" className="text-[10px] bg-background font-mono py-0 h-5 border-amber-500/40 text-amber-800 dark:text-amber-300">
                                    {selectedTimeFrame === 'live' ? 'Live Now' : `${selectedTimeFrame} Session`}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select a scheduled time window below to verify which faculty members are currently in session across computer laboratories.
                            </p>
                        </div>

                        {/* Quick Time Frame Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                Time Window:
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedTimeFrame('live')}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs",
                                    selectedTimeFrame === 'live'
                                        ? "bg-amber-500 text-slate-950 border-amber-500 ring-2 ring-amber-500/20 font-black"
                                        : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full", selectedTimeFrame === 'live' ? "bg-slate-950 animate-pulse" : "bg-emerald-500")} />
                                Live (Now)
                            </button>

                            {(availableTimeSlots || [
                                { id: '07:30', label: '07:30 – 09:00 AM', start: '07:30', end: '09:00' },
                                { id: '09:00', label: '09:00 – 10:30 AM', start: '09:00', end: '10:30' },
                                { id: '10:30', label: '10:30 – 12:00 PM', start: '10:30', end: '12:00' },
                                { id: '13:00', label: '01:00 – 02:30 PM', start: '13:00', end: '14:30' },
                                { id: '14:30', label: '02:30 – 04:00 PM', start: '14:30', end: '16:00' },
                                { id: '16:00', label: '04:00 – 05:30 PM', start: '16:00', end: '17:30' },
                            ]).map((slot) => {
                                const isSelected = selectedTimeFrame === slot.id;
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => setSelectedTimeFrame(slot.id)}
                                        className={cn(
                                            "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap shadow-2xs",
                                            isSelected
                                                ? "bg-amber-500 text-slate-950 border-amber-500 ring-2 ring-amber-500/20 font-black"
                                                : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        {slot.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top 4 KPI Cards (Slide 5 Style) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Rooms in use */}
                        <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-400/40 dark:bg-amber-500/15 text-foreground shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    <Monitor className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate text-muted-foreground">Rooms in use</p>
                                    <p className="text-2xl font-extrabold tracking-tight tabular-nums text-foreground">{dynamicRoomsInUseCount}</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-6 text-amber-500 opacity-75 shrink-0">
                                <span className="w-1 h-2 rounded-full bg-current opacity-40" />
                                <span className="w-1 h-5 rounded-full bg-current opacity-90" />
                                <span className="w-1 h-3 rounded-full bg-current opacity-60" />
                                <span className="w-1 h-6 rounded-full bg-current opacity-100" />
                            </div>
                        </div>

                        {/* 2. Available rooms */}
                        <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-400/30 dark:bg-emerald-500/15 text-foreground shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate text-muted-foreground">Available rooms</p>
                                    <p className="text-2xl font-extrabold tracking-tight tabular-nums text-foreground">{dynamicRoomsAvailableCount}</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-6 text-emerald-500 opacity-75 shrink-0">
                                <span className="w-1 h-2 rounded-full bg-current opacity-40" />
                                <span className="w-1 h-5 rounded-full bg-current opacity-90" />
                                <span className="w-1 h-3 rounded-full bg-current opacity-60" />
                                <span className="w-1 h-6 rounded-full bg-current opacity-100" />
                            </div>
                        </div>

                        {/* 3. Peak Lab Hours */}
                        <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 bg-orange-500/10 border border-orange-400/30 dark:bg-orange-500/15 text-foreground shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                    <Flame className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate text-muted-foreground">Peak Lab Hours · {todayName}</p>
                                    <p className="text-lg font-extrabold tracking-tight truncate text-foreground">{overallLabPeak || '2 PM – 3 PM'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">Highest simultaneous lab usage</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-6 text-orange-500 opacity-75 shrink-0">
                                <span className="w-1 h-2 rounded-full bg-current opacity-40" />
                                <span className="w-1 h-5 rounded-full bg-current opacity-90" />
                                <span className="w-1 h-3 rounded-full bg-current opacity-60" />
                                <span className="w-1 h-6 rounded-full bg-current opacity-100" />
                            </div>
                        </div>

                        {/* 4. Faculty in labs */}
                        <div className="rounded-xl p-3.5 flex items-center justify-between gap-3 bg-purple-500/10 border border-purple-400/30 dark:bg-purple-500/15 text-foreground shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-600 dark:text-purple-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate text-muted-foreground">Faculty in labs</p>
                                    <p className="text-2xl font-extrabold tracking-tight tabular-nums text-foreground">{dynamicFacultyInLabsCount}</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-6 text-purple-500 opacity-75 shrink-0">
                                <span className="w-1 h-2 rounded-full bg-current opacity-40" />
                                <span className="w-1 h-5 rounded-full bg-current opacity-90" />
                                <span className="w-1 h-3 rounded-full bg-current opacity-60" />
                                <span className="w-1 h-6 rounded-full bg-current opacity-100" />
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid of Laboratories (Exact 4-column layout as in TV Slide 5 screenshot) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {dynamicDisplayRooms.map((room) => {
                            const isOccupied = room.is_in_use;
                            const active = room.active_session;
                            const next = room.next_session;
                            const expectedPeak = room.expected_peak_hours || '7:00 AM – 6:00 PM';
                            const peakStatus = room.peak_status || 'Heavy Traffic';

                            return (
                                <div
                                    key={room.room_id}
                                    className={cn(
                                        "flex flex-col justify-between rounded-2xl p-4 transition-all border",
                                        isOccupied
                                            ? "border-amber-400 bg-amber-500/[0.04] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_4px_16px_rgba(245,158,11,0.12)]"
                                            : "bg-card border-border/80 shadow-2xs"
                                    )}
                                >
                                    <div>
                                        {/* Room Header */}
                                        <div className="flex items-start justify-between gap-2.5">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-base font-bold text-foreground">{room.room_name}</h3>
                                                <p className="truncate text-xs text-muted-foreground">{room.type || 'Laboratory'}</p>
                                            </div>
                                            <span
                                                className={cn(
                                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                                                    isOccupied
                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                )}
                                            >
                                                <span className={cn("h-1.5 w-1.5 rounded-full", isOccupied ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                                {isOccupied ? 'In Use' : 'Available'}
                                            </span>
                                        </div>

                                        {/* Instructor and Session Details */}
                                        {active ? (
                                            <div className="mt-2.5 rounded-xl p-2.5 bg-muted/40 dark:bg-card/60 border border-border/60">
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap className="h-4 w-4 shrink-0 text-amber-500" />
                                                    <p className="line-clamp-1 text-sm font-bold text-foreground">
                                                        {active.expected_faculty || 'Instructor'}
                                                    </p>
                                                </div>
                                                <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-foreground/90">
                                                    {active.course_code} {active.course_title ? `${active.course_title}` : ''}
                                                </p>
                                                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                                    {active.section}
                                                </p>
                                                <div className="mt-1 flex items-center justify-between text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                                    <span>{active.scheduled_time || `${active.scheduled_start} - ${active.scheduled_end}`}</span>
                                                    {active.observation_status && (
                                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                                            {active.observation_status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2.5 flex min-h-[92px] items-center justify-center rounded-xl p-2.5 text-center bg-muted/20 border border-border/40 text-muted-foreground">
                                                <p className="text-xs font-medium">Ready for next session</p>
                                            </div>
                                        )}

                                        {/* Expected Peak Hours Badge */}
                                        {expectedPeak && (
                                            <div className="mt-2 rounded-lg px-2.5 py-1.5 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/25 flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold truncate">
                                                    <Flame className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                    <span className="truncate">Peak: <strong className="font-bold">{expectedPeak}</strong></span>
                                                </div>
                                                {peakStatus && (
                                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400 bg-amber-400/20">
                                                        {peakStatus}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Up Next Preview */}
                                        {next && (
                                            <p className="mt-2 line-clamp-1 border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
                                                <strong className="font-bold text-foreground">Up next:</strong> {next.expected_faculty || next.course_code} at {next.scheduled_start?.substring(0, 5)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Button: Monitor or View Timetable */}
                                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTimetableRoomId(String(room.room_id));
                                                setActiveModule('timetables');
                                            }}
                                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                                        >
                                            Timetable <ChevronRight className="h-3 w-3" />
                                        </button>

                                        {active ? (
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-7 px-2.5 shadow-2xs gap-1"
                                                onClick={() => openObservationModal(active)}
                                            >
                                                <MonitorPlay className="h-3 w-3" />
                                                Monitor Now
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs h-7 px-2.5 font-medium"
                                                onClick={() => {
                                                    setSelectedTimetableRoomId(String(room.room_id));
                                                    setActiveModule('timetables');
                                                }}
                                            >
                                                View Schedule
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>



                {/* 3. MODULE CONTENT ROUTING */}

                {/* MODULE 1: DASHBOARD (Attention-First, KPI Counts, Action Required, Timeline, Availability Now) */}
                {activeModule === 'dashboard' && (
                    <div className="space-y-4">
                        {/* Operational KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {[
                                { label: 'Sessions Today', value: kpi.sessions_today, color: 'text-foreground', bg: 'bg-card' },
                                { label: 'In Progress', value: kpi.in_progress, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
                                { label: 'Completed', value: kpi.completed, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
                                { label: 'Upcoming', value: kpi.upcoming, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-card' },
                                { label: 'Unmonitored', value: kpi.unmonitored, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
                                { label: 'Late Starts', value: kpi.late_starts, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
                                { label: 'Disruptions', value: kpi.disruptions, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-950/20' },
                                { label: 'Discrepancies', value: kpi.discrepancies, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
                            ].map((card, i) => (
                                <div key={i} className={cn('p-2.5 border rounded-lg shadow-2xs text-center flex flex-col justify-center min-w-0', card.bg)}>
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight truncate leading-tight" title={card.label}>
                                        {card.label}
                                    </div>
                                    <div className={cn('text-lg sm:text-xl font-bold mt-0.5 leading-none', card.color)}>{card.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Action Required Panel (Prominent) */}
                        <Card className="border-amber-400/40 bg-amber-500/5 shadow-2xs">
                            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between border-b border-amber-500/10">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                                        <Bell className="h-4 w-4" />
                                        Action Required Right Now ({actionRequired.length})
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Immediate operational alerts requiring your confirmation or observation.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveModule('action_required')}
                                    className="text-xs h-7 font-semibold text-amber-700 dark:text-amber-400 px-2"
                                >
                                    Full List <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-3 space-y-1.5">
                                {actionRequired.length === 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-md">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        All assigned laboratories and scheduled sessions are currently verified and up to date.
                                    </div>
                                ) : (
                                    actionRequired.slice(0, 4).map((act, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-background border rounded-md shadow-2xs hover:border-amber-400/60 transition-all"
                                        >
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                                                        {act.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="font-semibold text-xs text-foreground truncate">{act.title}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate">{act.description}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-[11px] h-7 px-3 shrink-0 self-start sm:self-auto"
                                                onClick={() => {
                                                    if (act.session) {
                                                        openObservationModal(act.session);
                                                    } else if (act.discrepancy_id) {
                                                        setActiveModule('discrepancies');
                                                    }
                                                }}
                                            >
                                                {act.action_label}
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Current Laboratory Status Board (Visual cards with countdown & operational badges) */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                        <MonitorPlay className="h-4 w-4 text-amber-500" />
                                        Current Laboratory Status Board
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Real-time operational condition, minutes remaining, and current activity across assigned laboratories.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveModule('rooms')}
                                    className="text-xs h-7 font-medium px-2"
                                >
                                    Full Room Board <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {roomStatusBoard.map((room) => {
                                    const active = room.active_session;
                                    return (
                                        <Card key={room.room_id} className="border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                                            <CardHeader className="py-2.5 px-3 border-b bg-muted/20">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-sm font-bold truncate">{room.room_name}</CardTitle>
                                                        <CardDescription className="text-[11px] truncate">
                                                            {room.building} · Cap: {room.capacity}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="shrink-0">{getBadgeForRoom(room.operational_badge)}</div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                                                {active ? (
                                                    <div className="space-y-1.5 min-w-0">
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                            Current Activity:
                                                        </div>
                                                        <div className="bg-muted/40 p-2 rounded-md border space-y-0.5 text-xs">
                                                            <div className="font-bold text-foreground truncate">
                                                                {active.course_code} · {active.section}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground truncate">
                                                                Faculty: <strong className="text-foreground font-medium">{active.expected_faculty}</strong>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Time: {active.scheduled_time}
                                                            </div>
                                                            {room.minutes_remaining !== null && (
                                                                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-0.5">
                                                                    <Clock className="h-3 w-3" />
                                                                    Ends in {room.minutes_remaining}m
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 py-1.5">
                                                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                            Available / No Class
                                                        </div>
                                                        {room.next_session ? (
                                                            <div className="text-[11px] text-muted-foreground truncate">
                                                                Next: <strong className="text-foreground">{room.next_session.course_code}</strong> at {room.next_session.scheduled_start}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                No further sessions today.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t flex items-center justify-between gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[11px] h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2"
                                                        onClick={() => {
                                                            setDisruptRoomId(String(room.room_id));
                                                            setDisruptionModalOpen(true);
                                                        }}
                                                    >
                                                        Report Issue
                                                    </Button>
                                                    {active ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] h-7 px-2.5"
                                                            onClick={() => openObservationModal(active)}
                                                        >
                                                            Monitor
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-[11px] h-7 px-2"
                                                            onClick={() => {
                                                                setSelectedTimetableRoomId(String(room.room_id));
                                                                setActiveModule('timetables');
                                                            }}
                                                        >
                                                            Timetable
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Today's Timeline Table & Room Availability Now */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Today's Timeline (2 cols) */}
                            <div className="lg:col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                        Today's Verified Lab Timeline
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveModule('today')}
                                        className="text-xs h-7 font-medium px-2"
                                    >
                                        Full Schedule <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>

                                <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                <TableHead className="font-bold text-[11px] py-2 px-3">Time</TableHead>
                                                <TableHead className="font-bold text-[11px] py-2 px-3">Lab</TableHead>
                                                <TableHead className="font-bold text-[11px] py-2 px-3">Course & Section</TableHead>
                                                <TableHead className="font-bold text-[11px] py-2 px-3">Expected Faculty</TableHead>
                                                <TableHead className="font-bold text-[11px] py-2 px-3">Status</TableHead>
                                                <TableHead className="text-right font-bold text-[11px] py-2 px-3">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessionsList.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                                                        No verified laboratory sessions scheduled for {todayName}.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sessionsList.slice(0, 8).map((s) => (
                                                    <TableRow key={s.verified_schedule_id} className="hover:bg-muted/30">
                                                        <TableCell className="font-mono text-[11px] font-bold whitespace-nowrap py-2 px-3">
                                                            {s.scheduled_time}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-semibold whitespace-nowrap py-2 px-3">
                                                            {s.room_name}
                                                        </TableCell>
                                                        <TableCell className="text-xs py-2 px-3">
                                                            <div className="font-bold text-foreground truncate max-w-[140px]">{s.course_code}</div>
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{s.section}</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs py-2 px-3 truncate max-w-[140px]">{s.expected_faculty}</TableCell>
                                                        <TableCell className="text-xs py-2 px-3 whitespace-nowrap">{getBadgeForSession(s.observation_status)}</TableCell>
                                                        <TableCell className="text-right py-2 px-3">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 text-[11px] px-2 font-medium"
                                                                onClick={() => openObservationModal(s)}
                                                            >
                                                                Monitor
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Room Availability Now (1 col) */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-emerald-500" />
                                    Room Availability Right Now
                                </h3>
                                <div className="border rounded-xl bg-card p-3 space-y-2 shadow-2xs">
                                    {assignedRooms.map((room: any) => {
                                        const statusItem = roomStatusBoard.find(r => r.room_id === room.id);
                                        const isFree = statusItem?.operational_badge === 'Available';
                                        return (
                                            <div
                                                key={room.id}
                                                className="flex items-center justify-between p-2 rounded-md border bg-muted/20 gap-2 min-w-0"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground truncate">{room.room_name ?? room.name}</div>
                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                        {isFree ? 'Free for ad-hoc / make-up' : statusItem?.active_session?.course_code || 'Occupied'}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {getBadgeForRoom(statusItem?.operational_badge ?? 'Available')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODULE 2: TODAY'S LAB SCHEDULE */}
                {activeModule === 'today' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h2 className="text-xl font-black text-foreground">Today's Verified Lab Schedule</h2>
                                <p className="text-xs text-muted-foreground">
                                    Generated from OfficeHub's verified timetable records. Non-editable timetable specification.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="border rounded-lg p-0.5 flex bg-muted/40">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleViewMode('day')}
                                        className={cn('px-3 py-1 text-xs font-bold rounded-md transition-all', scheduleViewMode === 'day' ? 'bg-background shadow-xs font-black' : 'text-muted-foreground')}
                                    >
                                        Day Table View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleViewMode('timeline')}
                                        className={cn('px-3 py-1 text-xs font-bold rounded-md transition-all', scheduleViewMode === 'timeline' ? 'bg-background shadow-xs font-black' : 'text-muted-foreground')}
                                    >
                                        Timeline View
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card p-3 border rounded-xl shadow-2xs">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Filter by Room</Label>
                                <Select value={filterRoom} onValueChange={setFilterRoom}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="All Laboratories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Laboratories</SelectItem>
                                        {assignedRooms.map((r: any) => (
                                            <SelectItem key={r.id} value={String(r.id)}>{r.room_name ?? r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Filter by Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                                        <SelectItem value="Ready to Monitor">Ready to Monitor</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Unmonitored">Unmonitored</SelectItem>
                                        <SelectItem value="Late Start">Late Start</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs font-bold">Search Course, Faculty, Section</Label>
                                <div className="relative">
                                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                                    <Input
                                        className="h-8 text-xs pl-8"
                                        placeholder="Type search keyword..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table View */}
                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table className="w-full text-left">
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-[11px] py-2 px-3 whitespace-nowrap">Time</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3 whitespace-nowrap">Lab</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3">Course</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3 whitespace-nowrap">Section</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3">Expected Faculty</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-2 text-center whitespace-nowrap">Duration</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3 whitespace-nowrap">Room Condition</TableHead>
                                        <TableHead className="font-bold text-[11px] py-2 px-3 whitespace-nowrap">Session Status</TableHead>
                                        <TableHead className="text-right font-bold text-[11px] py-2 px-3 sticky right-0 bg-muted/40 sm:bg-transparent shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] sm:shadow-none">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTodaySessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                                                No scheduled laboratory sessions match the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTodaySessions.map((s) => (
                                            <TableRow key={s.verified_schedule_id} className="hover:bg-muted/30">
                                                <TableCell className="font-mono text-[11px] font-bold whitespace-nowrap py-2 px-3">
                                                    {s.scheduled_time}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold whitespace-nowrap py-2 px-3">{s.room_name}</TableCell>
                                                <TableCell className="text-xs py-2 px-3">
                                                    <div className="font-bold text-foreground truncate max-w-[140px]">{s.course_code}</div>
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{s.course_title}</div>
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold whitespace-nowrap py-2 px-3">{s.section}</TableCell>
                                                <TableCell className="text-xs py-2 px-3 whitespace-nowrap">{s.expected_faculty}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground text-center py-2 px-2 whitespace-nowrap">{s.scheduled_minutes}m</TableCell>
                                                <TableCell className="text-xs py-2 px-3 whitespace-nowrap">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-normal">
                                                        {s.room_condition}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs py-2 px-3 whitespace-nowrap">{getBadgeForSession(s.observation_status)}</TableCell>
                                                <TableCell className="text-right py-2 px-3 sticky right-0 bg-card sm:bg-transparent shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] sm:shadow-none whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {s.photo_url && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs px-2 gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-bold"
                                                                onClick={() => {
                                                                    setViewPhotoUrl(s.photo_url!);
                                                                    setViewPhotoTitle(`${s.room_name} · ${s.course_code}`);
                                                                }}
                                                            >
                                                                <ImageIcon className="h-3.5 w-3.5" />
                                                                Photo
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            className="h-7 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 shadow-2xs"
                                                            onClick={() => openObservationModal(s)}
                                                        >
                                                            Monitor
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* MODULE 3: ROOM STATUS BOARD (Facility condition vs Academic outcome distinction) */}
                {activeModule === 'rooms' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h2 className="text-xl font-black text-foreground">Room Status Board</h2>
                                <p className="text-xs text-muted-foreground">
                                    Visual operational state of all assigned laboratories. Note: Facility room condition is decoupled from academic session outcome.
                                </p>
                            </div>
                            <Button
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
                                onClick={() => {
                                    setDisruptRoomId(String(assignedRooms[0]?.id ?? ''));
                                    setDisruptionModalOpen(true);
                                }}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Report Facility Disruption
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roomStatusBoard.map((room) => {
                                const active = room.active_session;
                                return (
                                    <Card key={room.room_id} className="border-2 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between">
                                        <CardHeader className="bg-muted/30 pb-3 border-b">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-xl font-black">{room.room_name}</CardTitle>
                                                    <CardDescription className="text-xs font-medium">
                                                        {room.type} · Capacity: {room.capacity} · {room.building}
                                                    </CardDescription>
                                                </div>
                                                {getBadgeForRoom(room.operational_badge)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                            {active ? (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-muted/40 rounded-xl border space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black uppercase text-amber-600">Active Class</span>
                                                            <span className="text-xs font-mono font-bold">{active.scheduled_time}</span>
                                                        </div>
                                                        <div className="text-base font-black text-foreground">
                                                            {active.section} · {active.course_code}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Expected Faculty: <strong className="text-foreground">{active.expected_faculty}</strong>
                                                        </div>
                                                        {room.minutes_remaining !== null && (
                                                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 pt-1 flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                Ends in {room.minutes_remaining} minutes
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        <div><strong>Facility Condition:</strong> {active.room_condition}</div>
                                                        <div><strong>Session Outcome:</strong> {active.session_outcome}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 py-4 text-center">
                                                    <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-8 w-8" />
                                                    </div>
                                                    <div className="font-black text-base text-emerald-600">AVAILABLE</div>
                                                    {room.next_session ? (
                                                        <div className="text-xs text-muted-foreground">
                                                            Next Scheduled: <strong>{room.next_session.course_code}</strong> ({room.next_session.section}) at {room.next_session.scheduled_start}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground">No upcoming sessions today.</div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="pt-3 border-t flex items-center justify-between gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs text-rose-600 border-rose-200"
                                                    onClick={() => {
                                                        setDisruptRoomId(String(room.room_id));
                                                        setDisruptionModalOpen(true);
                                                    }}
                                                >
                                                    Report Disruption
                                                </Button>
                                                {active ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                                        onClick={() => openObservationModal(active)}
                                                    >
                                                        Record Observation
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs font-bold"
                                                        onClick={() => {
                                                            setSelectedTimetableRoomId(String(room.room_id));
                                                            setActiveModule('timetables');
                                                        }}
                                                    >
                                                        View Schedule Grid
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MODULE 4: HISTORICAL MONITORING (Expected sessions from class start date, missing logs marked Needs Verification) */}
                {activeModule === 'historical' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                    <History className="h-5 w-5 text-amber-600" />
                                    Historical Monitoring Reconciliation (Semester Start: Aug 10, 2026)
                                </h3>
                                <p className="text-xs text-amber-800 dark:text-amber-400">
                                    Expected sessions with no monitoring evidence are strictly labeled <strong>"No Monitoring Record / Needs Historical Verification"</strong> (never marked absent or present).
                                </p>
                            </div>
                            <Badge className="bg-amber-600 text-white font-bold text-xs self-start md:self-auto">
                                {unmonitoredHistoricalCount} Historical Sessions Pending Verification
                            </Badge>
                        </div>

                        <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Date</TableHead>
                                        <TableHead className="font-bold text-xs">Laboratory</TableHead>
                                        <TableHead className="font-bold text-xs">Expected Session</TableHead>
                                        <TableHead className="font-bold text-xs">Expected Faculty</TableHead>
                                        <TableHead className="font-bold text-xs">Scheduled Time</TableHead>
                                        <TableHead className="font-bold text-xs">Monitoring Status</TableHead>
                                        <TableHead className="font-bold text-xs">Provenance</TableHead>
                                        <TableHead className="text-right font-bold text-xs">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historicalSessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                                                No historical monitoring sessions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        historicalSessions.map((h) => (
                                            <TableRow key={h.id} className="hover:bg-muted/30">
                                                <TableCell className="font-mono text-xs font-bold whitespace-nowrap">
                                                    {h.monitoring_date}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold">{h.room_name}</TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="font-bold text-foreground">{h.course_code}</div>
                                                    <div className="text-[11px] text-muted-foreground">{h.section}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{h.expected_faculty}</TableCell>
                                                <TableCell className="text-xs font-mono">{h.scheduled_time}</TableCell>
                                                <TableCell className="text-xs">
                                                    {h.is_historical_reconciliation ? (
                                                        <Badge className="bg-purple-600 text-white text-[10px]">Historical Entry</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px]">{h.session_outcome}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {h.monitored_by}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs font-bold"
                                                        onClick={() => {
                                                            setSelectedHistoryItem(h);
                                                            setCorrectionModalOpen(true);
                                                        }}
                                                    >
                                                        Request Correction
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* MODULE 5: DISCREPANCIES & INCIDENTS (Lifecycle: Reported -> Under Review -> Clarification Required -> Resolved -> Verified) */}
                {activeModule === 'discrepancies' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h2 className="text-xl font-black text-foreground">Discrepancies & Operational Incidents</h2>
                                <p className="text-xs text-muted-foreground">
                                    Evidence chain preserving differences between expected timetables and actual observed conditions.
                                </p>
                            </div>
                            <Button
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
                                onClick={() => {
                                    setDisruptRoomId(String(assignedRooms[0]?.id ?? ''));
                                    setDisruptionModalOpen(true);
                                }}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                File New Discrepancy / Incident
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {openDiscrepancies.length === 0 ? (
                                <div className="border rounded-xl p-8 text-center bg-card text-muted-foreground text-sm">
                                    No active discrepancies or unresolved operational incidents logged for your assigned laboratories.
                                </div>
                            ) : (
                                openDiscrepancies.map((disc) => (
                                    <Card key={disc.id} className="border shadow-xs hover:border-amber-400 transition-all">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={disc.severity === 'Blocking' ? 'bg-rose-600' : 'bg-amber-600'}>
                                                        {disc.severity}
                                                    </Badge>
                                                    <span className="font-black text-sm text-foreground">
                                                        #{disc.id} · {disc.discrepancy_type}
                                                    </span>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {disc.room.room_name ?? disc.room.name}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">Lifecycle Status:</span>
                                                    <Badge className="bg-blue-600 text-white font-bold">{disc.resolution_status}</Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border">
                                                <div>
                                                    <strong className="text-muted-foreground block text-[11px] uppercase">Expected Timetable Value:</strong>
                                                    <span className="text-foreground">{disc.expected_state}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-muted-foreground block text-[11px] uppercase">Observed Reality:</strong>
                                                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{disc.observed_state}</span>
                                                </div>
                                            </div>

                                            {disc.photo_url && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className="text-[11px] text-muted-foreground font-semibold">Attached Evidence:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setViewPhotoUrl(disc.photo_url!);
                                                            setViewPhotoTitle(`Discrepancy #${disc.id} Evidence Photo`);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-md transition-colors"
                                                    >
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                        View Incident Photo
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
                                                <div>
                                                    Reported by: <strong>{disc.reporter.name}</strong> · {disc.created_at}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-foreground">Transition Lifecycle:</span>
                                                    {['Reported', 'Under Review', 'Clarification Required', 'Resolved', 'Verified'].map((st) => (
                                                        <Button
                                                            key={st}
                                                            size="sm"
                                                            variant={disc.resolution_status === st ? 'default' : 'outline'}
                                                            className={cn('h-6 text-[10px] px-2', disc.resolution_status === st && 'bg-amber-500 text-slate-950 font-bold')}
                                                            onClick={() => handleTransitionStatus(disc.id, st)}
                                                        >
                                                            {st}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* MODULE 6: MONITORING HISTORY (Searchable audit trail with correction window) */}
                {activeModule === 'history' && (
                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-black text-foreground">Monitoring Audit History</h2>
                            <p className="text-xs text-muted-foreground">
                                Immutable audit trail of recorded observations. Records can only be edited directly within a 12-hour shift window; otherwise a formal correction request is enforced.
                            </p>
                        </div>

                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Date</TableHead>
                                        <TableHead className="font-bold text-xs">Laboratory</TableHead>
                                        <TableHead className="font-bold text-xs">Course & Section</TableHead>
                                        <TableHead className="font-bold text-xs">Expected Faculty</TableHead>
                                        <TableHead className="font-bold text-xs">Times (Sched / Actual)</TableHead>
                                        <TableHead className="font-bold text-xs">Late Mins</TableHead>
                                        <TableHead className="font-bold text-xs">Observed Mins</TableHead>
                                        <TableHead className="font-bold text-xs">Outcome</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Photo</TableHead>
                                        <TableHead className="text-right font-bold text-xs">Audit Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historicalSessions.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs font-bold whitespace-nowrap">
                                                {item.monitoring_date}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold">{item.room_name}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="font-bold text-foreground">{item.course_code}</div>
                                                <div className="text-[11px] text-muted-foreground">{item.section}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">{item.expected_faculty}</TableCell>
                                            <TableCell className="text-xs font-mono">
                                                <div>Sched: {item.scheduled_time}</div>
                                                <div className="text-muted-foreground">Act: {item.actual_time}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {item.late_minutes > 0 ? (
                                                    <span className="text-amber-600 font-bold">+{item.late_minutes}m</span>
                                                ) : (
                                                    <span className="text-muted-foreground">0m</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold">{item.observed_minutes}m</TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant="outline" className="text-[10px]">{item.session_outcome}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.photo_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setViewPhotoUrl(item.photo_url!);
                                                            setViewPhotoTitle(`${item.room_name} · ${item.monitoring_date}`);
                                                        }}
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline bg-amber-500/10 px-2 py-1 rounded"
                                                    >
                                                        <ImageIcon className="h-3 w-3" />
                                                        View
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground/60">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs font-bold"
                                                    onClick={() => {
                                                        setSelectedHistoryItem(item);
                                                        setCorrectionModalOpen(true);
                                                    }}
                                                >
                                                    Request Correction
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* MODULE 7: MY ASSIGNED LABORATORIES (Operating scope, capacity, shift, role) */}
                {activeModule === 'assigned_labs' && (
                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-black text-foreground">My Authorized Assigned Laboratories</h2>
                            <p className="text-xs text-muted-foreground">
                                Operational scope and authorization boundaries designated by College Administration. Lab In-Charge monitors within these assigned spaces and shifts.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myAssignedLabs.map((lab) => (
                                <Card key={lab.room_id} className="border shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
                                    <CardHeader className="bg-muted/20 pb-3 border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-black">{lab.room_name}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {lab.building} · {lab.floor}
                                                </CardDescription>
                                            </div>
                                            <Badge className="bg-amber-500 text-slate-950 font-black">
                                                {lab.role_type}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 flex-1 text-xs">
                                        <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border">
                                            <div><strong>Shift Assigned:</strong> {lab.shift_name} ({lab.shift_hours})</div>
                                            <div><strong>Monitoring Days:</strong> {lab.assigned_days}</div>
                                            <div><strong>Effective Period:</strong> {lab.effective_dates}</div>
                                            <div><strong>Capacity:</strong> {lab.capacity} workstations</div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="font-bold text-muted-foreground uppercase text-[10px]">Equipment & Facility Details:</div>
                                            <p className="text-foreground leading-relaxed">{lab.equipment_details}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODULE 8: ACTION REQUIRED / NOTIFICATIONS */}
                {activeModule === 'action_required' && (
                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                                <Bell className="h-5 w-5 text-amber-500" />
                                Action Required & Immediate Operational Reminders
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Direct operational prompts generated by OfficeHub requiring immediate confirmation or review.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {actionRequired.length === 0 ? (
                                <div className="p-8 border rounded-xl bg-card text-center text-sm text-muted-foreground">
                                    No pending actions or unconfirmed sessions at this moment.
                                </div>
                            ) : (
                                actionRequired.map((act, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border rounded-xl shadow-xs hover:border-amber-400 transition-all"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className={act.severity === 'urgent' ? 'bg-rose-600' : 'bg-amber-600'}>
                                                    {act.severity.toUpperCase()}
                                                </Badge>
                                                <span className="font-black text-base text-foreground">{act.title}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{act.description}</p>
                                        </div>
                                        <Button
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0"
                                            onClick={() => {
                                                if (act.session) {
                                                    openObservationModal(act.session);
                                                } else if (act.discrepancy_id) {
                                                    setActiveModule('discrepancies');
                                                }
                                            }}
                                        >
                                            {act.action_label}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* MODULE 9: LABORATORY TIMETABLES (Refined based on modern command hub design) */}
                {activeModule === 'timetables' && (() => {
                    const roomSchedules = timetablesByRoom[selectedTimetableRoomId] || [];
                    const activeLabObj = assignedRooms.find(r => String(r.id) === selectedTimetableRoomId) || assignedRooms[0];
                    const activeLabName = activeLabObj?.room_name ?? activeLabObj?.name ?? 'CLR 1';

                    // Days config with dates matching current semester schedule week (Oct 19-24, 2026)
                    const weekDays = [
                        { day: 'Monday', dateStr: 'Oct 19, 2026' },
                        { day: 'Tuesday', dateStr: 'Oct 20, 2026' },
                        { day: 'Wednesday', dateStr: 'Oct 21, 2026' },
                        { day: 'Thursday', dateStr: 'Oct 22, 2026' },
                        { day: 'Friday', dateStr: 'Oct 23, 2026' },
                        { day: 'Saturday', dateStr: 'Oct 24, 2026' },
                    ];

                    // Filtered schedules for this room
                    const filteredRoomSchedules = roomSchedules.filter(item => {
                        if (!timetableSearch.trim()) return true;
                        const q = timetableSearch.toLowerCase();
                        return (
                            item.course_code.toLowerCase().includes(q) ||
                            item.course_title.toLowerCase().includes(q) ||
                            item.section.toLowerCase().includes(q) ||
                            item.faculty_name.toLowerCase().includes(q)
                        );
                    });

                    // Room utilization calculation: total booked slots vs 10 available slots per day (7:30 AM to 5:30 PM = 5 daily 1.5h sessions)
                    const totalPossibleWeeklySessions = 6 * 5; // 30 sessions
                    const utilizationRate = Math.min(100, Math.round((roomSchedules.length / 22) * 100)) || 78;

                    // Find ongoing or next class for this room right now
                    const tuesdaySchedules = roomSchedules.filter(s => s.day_of_week.toLowerCase() === 'tuesday');
                    const ongoingSession = tuesdaySchedules.find(s => s.start_time <= '09:00' && s.end_time >= '09:00') || tuesdaySchedules[0];

                    return (
                        <div className="space-y-4">
                            {/* Filter & Global Stats Toolbar */}
                            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                                {/* Left: Search + Week Selector + Lab Dropdown + View Toggle */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Search Input */}
                                    <div className="relative min-w-[220px] sm:w-[260px]">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        <Input
                                            type="text"
                                            value={timetableSearch}
                                            onChange={(e) => setTimetableSearch(e.target.value)}
                                            placeholder="Search classes, course code, or instructor..."
                                            className="h-8.5 pl-8.5 pr-3 text-xs rounded-xl bg-card border-border shadow-2xs"
                                        />
                                    </div>

                                    {/* Week Selector */}
                                    <Select value={timetableWeekFilter} onValueChange={setTimetableWeekFilter}>
                                        <SelectTrigger className="h-8.5 text-xs rounded-xl bg-card border-border w-[125px] shadow-2xs font-medium">
                                            <Calendar className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="This Week">This Week</SelectItem>
                                            <SelectItem value="Next Week">Next Week</SelectItem>
                                            <SelectItem value="All Weeks">All Weeks</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Laboratory Dropdown */}
                                    <Select value={selectedTimetableRoomId} onValueChange={setSelectedTimetableRoomId}>
                                        <SelectTrigger className="h-8.5 text-xs rounded-xl bg-card border-border min-w-[130px] shadow-2xs font-bold text-foreground">
                                            <SelectValue placeholder="Select Lab" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignedRooms.map((r: any) => (
                                                <SelectItem key={r.id} value={String(r.id)} className="font-medium">
                                                    {r.room_name ?? r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* View Toggle Buttons */}
                                    <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/70 shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => setTimetableViewMode('grid')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                                timetableViewMode === 'grid'
                                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            <span>Weekly Grid</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTimetableViewMode('timeline')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer",
                                                timetableViewMode === 'timeline'
                                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <ListFilter className="w-3.5 h-3.5" />
                                            <span>Timeline</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Quick Stats Pills */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                                    {/* Today's Sessions */}
                                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card shadow-2xs">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-xs font-black text-foreground">
                                                {roomSchedules.filter(s => s.day_of_week.toLowerCase() === 'tuesday').length || 4}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap">Today's Sessions</div>
                                        </div>
                                    </div>

                                    {/* Active Labs */}
                                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card shadow-2xs">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                            <Building2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-xs font-black text-foreground">6</div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap">Active Labs</div>
                                        </div>
                                    </div>

                                    {/* Pending Issues */}
                                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card shadow-2xs">
                                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-xs font-black text-foreground">{openDiscrepancies.length}</div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap">Pending Issues</div>
                                        </div>
                                    </div>

                                    {/* Room Utilization */}
                                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card shadow-2xs">
                                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                            <Clock className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-xs font-black text-foreground">{utilizationRate}%</div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap">Utilization</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Layout: Timetable Grid on Left (9 cols) + Laboratory Insights on Right (3 cols) */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                                {/* Left Side: Timetable Section Header + Week Columns Grid */}
                                <div className="xl:col-span-9 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-600 flex items-center justify-center">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-foreground">Laboratory Weekly Timetables</h2>
                                            <p className="text-[11px] text-muted-foreground">
                                                Weekly schedule grid and utilization spec for each assigned computer laboratory (Monday–Saturday).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Weekly Days Columns */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                                        {weekDays.map(({ day, dateStr }) => {
                                            const daySchedules = filteredRoomSchedules.filter(
                                                (item) => item.day_of_week.toLowerCase() === day.toLowerCase()
                                            );
                                            const isToday = day.toLowerCase() === todayName.toLowerCase();

                                            return (
                                                <div
                                                    key={day}
                                                    className={cn(
                                                        "rounded-2xl border transition-all flex flex-col min-h-[460px] overflow-hidden shadow-2xs",
                                                        isToday
                                                            ? "bg-amber-500/5 border-amber-400/60 ring-1 ring-amber-400/30"
                                                            : "bg-card border-border/80"
                                                    )}
                                                >
                                                    {/* Day Column Header */}
                                                    <div className={cn(
                                                        "px-3 py-2.5 border-b flex items-center justify-between",
                                                        isToday ? "bg-amber-400/15 border-amber-300/40" : "bg-muted/30 border-border/70"
                                                    )}>
                                                        <div className="text-left">
                                                            <div className="font-black text-xs uppercase tracking-wider text-foreground">
                                                                {day}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-medium">
                                                                {dateStr}
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                                                            isToday
                                                                ? "bg-slate-900 text-amber-400 shadow-2xs"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {daySchedules.length}
                                                        </span>
                                                    </div>

                                                    {/* Day Schedule Cards */}
                                                    <div className="p-2 space-y-2 flex-1">
                                                        {daySchedules.length === 0 ? (
                                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 py-16 space-y-2">
                                                                <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
                                                                    <CalendarDays className="w-6 h-6 stroke-[1.5]" />
                                                                </div>
                                                                <div className="text-xs font-bold text-foreground">No scheduled lab classes</div>
                                                                <div className="text-[10px] text-muted-foreground max-w-[120px] leading-tight">
                                                                    There are no laboratory classes scheduled for this day.
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            daySchedules.map((sched, sIdx) => {
                                                                // Highlight first session on Tuesday as ongoing/current session if matching now
                                                                const isOngoing = isToday && (sIdx === 0 || (sched.start_time <= '09:00' && sched.end_time >= '09:00'));

                                                                return (
                                                                    <div
                                                                        key={sched.id}
                                                                        onClick={() => {
                                                                            // Quick monitor trigger: find matching session in today's sessionsList
                                                                            const matchingExpected = sessionsList.find(s => s.verified_schedule_id === sched.id) || {
                                                                                verified_schedule_id: sched.id,
                                                                                room_id: Number(selectedTimetableRoomId),
                                                                                room_name: sched.room_name || activeLabName,
                                                                                course_code: sched.course_code,
                                                                                course_title: sched.course_title,
                                                                                section: sched.section,
                                                                                expected_faculty: sched.faculty_name,
                                                                                faculty_id: 1,
                                                                                scheduled_time: sched.time_label,
                                                                                scheduled_start: sched.start_time,
                                                                                scheduled_end: sched.end_time,
                                                                                scheduled_minutes: 90,
                                                                                late_minutes: 0,
                                                                                observed_minutes: 90,
                                                                                variance_minutes: 0,
                                                                                observation_status: isOngoing ? 'In Progress' : 'Ready to Monitor',
                                                                                room_condition: 'In Use as Scheduled',
                                                                                session_outcome: 'Conducted as Scheduled',
                                                                                has_discrepancy: false,
                                                                                can_edit: true,
                                                                            };
                                                                            openObservationModal(matchingExpected);
                                                                        }}
                                                                        className={cn(
                                                                            "p-2.5 rounded-xl border transition-all text-xs space-y-1.5 cursor-pointer shadow-2xs group relative hover:shadow-xs",
                                                                            isOngoing
                                                                                ? "bg-amber-500/10 border-amber-400 hover:border-amber-500"
                                                                                : "bg-card border-border/80 hover:border-amber-400/80"
                                                                        )}
                                                                    >
                                                                        {/* Time & Status Badge */}
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                                                {sched.time_label}
                                                                            </span>
                                                                            {isOngoing ? (
                                                                                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-amber-400 text-slate-950 uppercase tracking-tight shadow-2xs animate-pulse">
                                                                                    Ongoing
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                                                    Scheduled
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Course Code */}
                                                                        <div className="font-black text-sm text-foreground tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                                            {sched.course_code}
                                                                        </div>

                                                                        {/* Section */}
                                                                        <div className="text-[11px] text-muted-foreground font-medium">
                                                                            Sec: <span className="text-foreground font-semibold">{sched.section}</span>
                                                                        </div>

                                                                        {/* Instructor Name with icon */}
                                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate pt-0.5 border-t border-border/40">
                                                                            <Users className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                                                            <span className="truncate">{sched.faculty_name}</span>
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

                                {/* Right Side: Laboratory Insights Sidebar */}
                                <div className="xl:col-span-3 space-y-3">
                                    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
                                        {/* Sidebar Header */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                <Calendar className="w-4 h-4 text-amber-500" />
                                                <span>Laboratory Insights</span>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                                                    Select Laboratory
                                                </Label>
                                                <Select value={selectedTimetableRoomId} onValueChange={setSelectedTimetableRoomId}>
                                                    <SelectTrigger className="h-8 text-xs rounded-xl bg-card border-border font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {assignedRooms.map((r: any) => (
                                                            <SelectItem key={r.id} value={String(r.id)}>
                                                                {r.room_name ?? r.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Room Utilization Progress Card */}
                                        <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
                                                    <Monitor className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-base font-black text-foreground leading-none">{utilizationRate}%</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Room Utilization</div>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full bg-muted-foreground/20 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${utilizationRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Next / Current Class Card */}
                                        {ongoingSession && (
                                            <div
                                                onClick={() => {
                                                    const match = sessionsList.find(s => s.course_code === ongoingSession.course_code) || sessionsList[0];
                                                    if (match) openObservationModal(match);
                                                }}
                                                className="p-3 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/15 transition-all cursor-pointer space-y-2 shadow-2xs group"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-foreground group-hover:text-amber-600 transition-colors">
                                                                {ongoingSession.course_code}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">Next Class</div>
                                                        </div>
                                                    </div>
                                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 uppercase tracking-tight shadow-2xs">
                                                        Ongoing
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground pl-9 space-y-0.5">
                                                    <div>{ongoingSession.time_label}</div>
                                                    <div>Sec: {ongoingSession.section}</div>
                                                    <div className="font-semibold text-foreground truncate">{ongoingSession.faculty_name}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vacant Slots Card */}
                                        <div className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-foreground">2</div>
                                                    <div className="text-[10px] text-muted-foreground">Vacant Slots Today</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>

                                        {/* Pending Issues Card */}
                                        <div
                                            onClick={() => setActiveModule('discrepancies')}
                                            className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-foreground">{openDiscrepancies.length}</div>
                                                    <div className="text-[10px] text-muted-foreground">Pending Issues</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>

                                        {/* Total Sessions This Week Card */}
                                        <div className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                    <CalendarDays className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-foreground">
                                                        {roomSchedules.length || 14}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">Total Sessions (This Week)</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* MODULE 11: END-OF-DAY CLOSING REPORT */}
                {activeModule === 'end_of_day' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                                        <FileCheck className="h-5 w-5 text-amber-500" />
                                        End-of-Day Monitoring Report & Reconciliation
                                    </h2>
                                    <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                                        Daily Closing
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Compiles all expected sessions for assigned rooms, performs reconciliation against monitoring observations, and closes the day for attendance analytics.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => router.get('/monitoring/lab-in-charge/end-of-day')}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-1.5 text-xs shadow-xs"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open Full Report & Print View
                                </Button>
                            </div>
                        </div>

                        {/* Summary Metrics & Completeness Banner */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <Card className="border shadow-2xs bg-amber-500/5 border-amber-500/30">
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                                        Completeness Rate
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="text-2xl font-black text-amber-600 font-mono">
                                        {endOfDayReport?.completeness_rate ?? 100}%
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {endOfDayReport?.monitored_sessions_count ?? 0} of {endOfDayReport?.expected_sessions_count ?? 0} expected monitored
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-2xs">
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                                        Report Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="text-base font-bold text-foreground">
                                        {endOfDayReport?.status ?? 'Draft'}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {endOfDayReport?.can_clean_close ? 'Eligible for clean close' : 'Closed with exceptions'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-2xs">
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                                        Recorded Exceptions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className={cn("text-2xl font-black font-mono", (endOfDayReport?.discrepancies_count ?? 0) > 0 ? "text-rose-600" : "text-emerald-600")}>
                                        {endOfDayReport?.discrepancies_count ?? 0}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Flagged variances / disruptions
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-2xs">
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                                        Assigned Shift
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="text-base font-bold text-foreground truncate">
                                        {endOfDayReport?.shift_name ?? currentShift}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        {endOfDayReport?.covered_labs ?? 'Assigned Laboratories'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Interactive Guidance Box */}
                        <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Daily Reconciliation & Audit Lock Ready
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    View the 4 consolidated matrices (Daily Summary, Faculty/Class, Room Utilization, Exceptions), verify checklist items, and submit the frozen report for administrative review.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.get('/monitoring/lab-in-charge/end-of-day')}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 shadow-xs"
                            >
                                Proceed to End-of-Day Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. MODALS & DIALOGS */}

            {/* LIVE SESSION MONITORING MODAL (Expected vs Observed side-by-side) */}
            <Dialog open={monitoringModalOpen} onOpenChange={setMonitoringModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black flex items-center gap-2">
                            <MonitorPlay className="h-5 w-5 text-amber-500" />
                            Live Session Monitoring: Expected vs Observed
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Verify what is actually happening in the laboratory against the verified expected timetable.
                        </DialogDescription>
                    </DialogHeader>

                    {targetSession && (
                        <form onSubmit={handleSubmitObservation} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* LEFT SIDE: EXPECTED (Verified Timetable - Read-only) */}
                                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                                    <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <CalendarDays className="h-4 w-4" />
                                        Verified Expected Schedule
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase">Laboratory:</span>
                                            <strong className="text-sm font-black text-foreground">{targetSession.room_name}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase">Course:</span>
                                            <strong className="text-sm font-black text-foreground">{targetSession.course_code}</strong>
                                            <div className="text-muted-foreground text-[11px]">{targetSession.course_title}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase">Section:</span>
                                            <strong className="text-foreground">{targetSession.section}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase">Expected Faculty:</span>
                                            <strong className="text-foreground">{targetSession.expected_faculty}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase">Scheduled Time & Duration:</span>
                                            <span className="font-mono font-bold text-foreground">{targetSession.scheduled_time} ({targetSession.scheduled_minutes}m)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE: OBSERVED (Completed by Lab In-Charge) */}
                                <div className="space-y-3 bg-card p-4 rounded-xl border border-amber-500/30">
                                    <div className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                                        <Eye className="h-4 w-4" />
                                        Observed Reality in Laboratory
                                    </div>

                                    {/* Room Condition */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">1. Room Condition (Facility State)</Label>
                                        <Select value={obsRoomCondition} onValueChange={setObsRoomCondition}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="In Use as Scheduled">In Use as Scheduled</SelectItem>
                                                <SelectItem value="Available">Available</SelectItem>
                                                <SelectItem value="Occupied by Another Class">Occupied by Another Class</SelectItem>
                                                <SelectItem value="Unscheduled Use">Unscheduled Use</SelectItem>
                                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                <SelectItem value="Equipment Failure">Equipment Failure</SelectItem>
                                                <SelectItem value="Power/Network Issue">Power/Network Issue</SelectItem>
                                                <SelectItem value="Closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Session Outcome */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">2. Session Outcome (Academic Delivery)</Label>
                                        <Select value={obsSessionOutcome} onValueChange={setObsSessionOutcome}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Conducted as Scheduled">Conducted as Scheduled</SelectItem>
                                                <SelectItem value="Late Start">Late Start</SelectItem>
                                                <SelectItem value="Conducted in Alternate Room">Conducted in Alternate Room</SelectItem>
                                                <SelectItem value="Switched to Online">Switched to Online</SelectItem>
                                                <SelectItem value="Partially Conducted">Partially Conducted</SelectItem>
                                                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                <SelectItem value="Faculty Not Present">Faculty Not Present</SelectItem>
                                                <SelectItem value="Different Faculty Observed">Different Faculty Observed</SelectItem>
                                                <SelectItem value="Different Class Observed">Different Class Observed</SelectItem>
                                                <SelectItem value="Pending Resolution">Pending Resolution</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Actual Times */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Actual Start Time</Label>
                                            <Input
                                                type="time"
                                                className="h-8 text-xs font-mono"
                                                value={obsActualStart}
                                                onChange={(e) => setObsActualStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Actual End Time</Label>
                                            <Input
                                                type="time"
                                                className="h-8 text-xs font-mono"
                                                value={obsActualEnd}
                                                onChange={(e) => setObsActualEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-Calculated Late Variance Preview */}
                                    <div className="p-2 rounded-md bg-muted/40 text-xs flex items-center justify-between font-mono">
                                        <span className="text-muted-foreground">OfficeHub Computed Variance:</span>
                                        <span className={calculatedLateMinutes > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                                            {calculatedLateMinutes > 0 ? `Late Start: ${calculatedLateMinutes}m` : 'On Time (0m)'}
                                        </span>
                                    </div>

                                    {/* Different Faculty if observed */}
                                    {obsSessionOutcome === 'Different Faculty Observed' && (
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-purple-600">Observed Faculty</Label>
                                            <Select value={obsFacultyId} onValueChange={setObsFacultyId}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select faculty present" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allFaculty.map((f) => (
                                                        <SelectItem key={f.id} value={String(f.id)}>
                                                            {f.first_name} {f.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Alternate room if transferred */}
                                    {obsSessionOutcome === 'Conducted in Alternate Room' && (
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-blue-600">Alternate Room Transferred To</Label>
                                            <Select value={obsAlternativeRoomId} onValueChange={setObsAlternativeRoomId}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select alternate room" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assignedRooms.map((r: any) => (
                                                        <SelectItem key={r.id} value={String(r.id)}>{r.room_name ?? r.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Headcount */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Approximate Student Headcount (Optional)</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            placeholder="e.g. 35"
                                            value={obsHeadcount}
                                            onChange={(e) => setObsHeadcount(e.target.value)}
                                        />
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Operational Remarks & Evidence</Label>
                                        <Textarea
                                            className="text-xs min-h-[60px]"
                                            placeholder="Document room condition, network issues, or class remarks..."
                                            value={obsRemarks}
                                            onChange={(e) => setObsRemarks(e.target.value)}
                                        />
                                    </div>

                                    {/* Photo Evidence Upload */}
                                    <div className="space-y-1.5 pt-1 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold flex items-center gap-1.5">
                                                <Camera className="h-3.5 w-3.5 text-amber-500" />
                                                Laboratory Photo Evidence
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
                                        </div>

                                        {obsPhotoPreview ? (
                                            <div className="relative group rounded-lg overflow-hidden border bg-muted/30">
                                                <img
                                                    src={obsPhotoPreview}
                                                    alt="Observation preview"
                                                    className="w-full h-36 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                    onClick={() => {
                                                        setViewPhotoUrl(obsPhotoPreview);
                                                        setViewPhotoTitle(`${targetSession.room_name} · Observation Photo`);
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-7 text-xs gap-1 font-bold shadow-md"
                                                        onClick={() => {
                                                            setViewPhotoUrl(obsPhotoPreview);
                                                            setViewPhotoTitle(`${targetSession.room_name} · Observation Photo`);
                                                        }}
                                                    >
                                                        <ZoomIn className="h-3.5 w-3.5" /> View
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-7 text-xs gap-1 font-bold shadow-md"
                                                        onClick={() => {
                                                            setObsPhoto(null);
                                                            setObsPhotoPreview(null);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Remove
                                                    </Button>
                                                </div>
                                                <div className="p-1.5 bg-background/90 text-[10px] flex items-center justify-between px-2 text-muted-foreground border-t">
                                                    <span>{obsPhoto ? obsPhoto.name : 'Saved photo attached'}</span>
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ready</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-amber-500 rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-all text-center">
                                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-1 text-amber-500">
                                                    <Upload className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-foreground">Click to upload room / board photo</span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">Capture occupancy, classroom whiteboard, or equipment condition</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setObsPhoto(file);
                                                            setObsPhotoPreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMonitoringModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Recording...' : 'Save Verified Observation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* REPORT ROOM DISRUPTION MODAL */}
            <Dialog open={disruptionModalOpen} onOpenChange={setDisruptionModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                            Report Room Disruption / Incident
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Log immediate laboratory facility issues, equipment failures, or unscheduled occupancy.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitDisruption} className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Laboratory</Label>
                            <Select value={disruptRoomId} onValueChange={setDisruptRoomId}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select Laboratory" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignedRooms.map((r: any) => (
                                        <SelectItem key={r.id} value={String(r.id)}>{r.room_name ?? r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Disruption Type</Label>
                            <Select value={disruptType} onValueChange={setDisruptType}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Unscheduled Room Use / Double Occupancy">Unscheduled Room Use / Double Occupancy</SelectItem>
                                    <SelectItem value="Facility / Equipment Failure">Facility / Equipment Failure (PCs, Projector, AC)</SelectItem>
                                    <SelectItem value="Power / Internet Outage">Power / Internet Outage</SelectItem>
                                    <SelectItem value="Room Locked / Key Unavailable">Room Locked / Key Unavailable</SelectItem>
                                    <SelectItem value="Scheduled Room Empty">Scheduled Room Empty / Faculty Absent</SelectItem>
                                    <SelectItem value="Emergency Maintenance">Emergency Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Severity</Label>
                            <Select value={disruptSeverity} onValueChange={setDisruptSeverity}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Advisory">Advisory</SelectItem>
                                    <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                                    <SelectItem value="Blocking">Blocking (Immediate Intervention Required)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Observed Reality / Disruption Details</Label>
                            <Textarea
                                className="text-xs min-h-[60px]"
                                placeholder="e.g. 15 PCs rebooting constantly, Room occupied by unannounced training..."
                                value={disruptObservedState}
                                onChange={(e) => setDisruptObservedState(e.target.value)}
                                required
                            />
                        </div>

                        {/* Disruption Photo Evidence */}
                        <div className="space-y-1.5 pt-1 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold flex items-center gap-1.5">
                                    <Camera className="h-3.5 w-3.5 text-rose-600" />
                                    Disruption Incident Photo (Optional)
                                </Label>
                                <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP</span>
                            </div>

                            {disruptPhotoPreview ? (
                                <div className="relative group rounded-lg overflow-hidden border bg-muted/30">
                                    <img
                                        src={disruptPhotoPreview}
                                        alt="Disruption preview"
                                        className="w-full h-28 object-cover cursor-pointer"
                                        onClick={() => {
                                            setViewPhotoUrl(disruptPhotoPreview);
                                            setViewPhotoTitle('Disruption Incident Photo');
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="h-7 text-xs gap-1 font-bold shadow-md"
                                            onClick={() => {
                                                setViewPhotoUrl(disruptPhotoPreview);
                                                setViewPhotoTitle('Disruption Incident Photo');
                                            }}
                                        >
                                            <ZoomIn className="h-3.5 w-3.5" /> View
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            className="h-7 text-xs gap-1 font-bold shadow-md"
                                            onClick={() => {
                                                setDisruptPhoto(null);
                                                setDisruptPhotoPreview(null);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Remove
                                        </Button>
                                    </div>
                                    <div className="p-1 bg-background/90 text-[10px] px-2 text-muted-foreground border-t truncate">
                                        {disruptPhoto?.name}
                                    </div>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 hover:border-rose-500 rounded-lg p-2.5 cursor-pointer hover:bg-muted/30 transition-all text-xs font-semibold text-muted-foreground hover:text-foreground">
                                    <Upload className="h-4 w-4 text-rose-500" />
                                    <span>Attach equipment/room photo evidence</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setDisruptPhoto(file);
                                                setDisruptPhotoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDisruptionModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Filing...' : 'Submit Disruption Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* FULLSCREEN PHOTO PREVIEW LIGHTBOX */}
            <Dialog open={!!viewPhotoUrl} onOpenChange={(open) => !open && setViewPhotoUrl(null)}>
                <DialogContent className="max-w-3xl p-2 bg-slate-950 text-white border-slate-800">
                    <DialogHeader className="p-2 pb-0">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                            <ImageIcon className="h-4 w-4 text-amber-500" />
                            {viewPhotoTitle || 'Laboratory Evidence Photo'}
                        </DialogTitle>
                    </DialogHeader>
                    {viewPhotoUrl && (
                        <div className="flex flex-col items-center justify-center p-2">
                            <img
                                src={viewPhotoUrl}
                                alt="Laboratory evidence full view"
                                className="max-h-[75vh] w-auto max-w-full rounded-md object-contain shadow-2xl"
                            />
                            <div className="pt-2 text-center text-xs text-slate-400">
                                Monitored physical laboratory evidence record
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* REQUEST CORRECTION MODAL (Audit Protection) */}
            <Dialog open={correctionModalOpen} onOpenChange={setCorrectionModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-amber-500" />
                            Request Monitoring Correction
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Audit protection: Observations older than 12 hours require an administrator correction workflow.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHistoryItem && (
                        <form onSubmit={handleSubmitCorrectionRequest} className="space-y-3">
                            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1 border">
                                <div><strong>Session:</strong> {selectedHistoryItem.course_code} ({selectedHistoryItem.room_name})</div>
                                <div><strong>Date:</strong> {selectedHistoryItem.monitoring_date}</div>
                                <div><strong>Current Recorded Outcome:</strong> {selectedHistoryItem.session_outcome}</div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Reason & Specific Correction Details</Label>
                                <Textarea
                                    className="text-xs min-h-[80px]"
                                    placeholder="Explain the required correction and provide supporting evidence..."
                                    value={correctionNotes}
                                    onChange={(e) => setCorrectionNotes(e.target.value)}
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCorrectionModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Send Correction Request'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
