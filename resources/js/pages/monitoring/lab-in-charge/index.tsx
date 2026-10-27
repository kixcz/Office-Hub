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
import LabSchedulesModule from './partials/lab-schedules-module';
import LabAttendanceModule from './partials/lab-attendance-module';
import LabDashboardModule from './partials/lab-dashboard-module';
import LabAlertsModule from './partials/lab-alerts-module';
import LabHistoryModule from './partials/lab-history-module';
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
    FileCheck,
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
    UserCog,
    UserCheck,
    Activity,
    Radio,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
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
    program_code?: string;
    program_name?: string;
    section: string;
    expected_faculty: string;
    faculty_id: number;
    academic_period_id?: number;
    schedule_version?: string;
    session_type?: string;
    mapping_confidence?: number;
    scheduled_time: string;
    scheduled_start: string;
    scheduled_end: string;
    scheduled_minutes: number;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
    late_minutes: number;
    observed_minutes: number;
    delivered_minutes?: number;
    variance_minutes: number;
    student_headcount?: number | null;
    observation_status: string;
    room_condition: string;
    session_outcome: string;
    observed_outcome?: string;
    observed_modality?: string;
    observed_faculty_id?: number | null;
    has_discrepancy: boolean;
    remarks?: string | null;
    photo_url?: string | null;
    monitoring_session_id?: number | null;
    administrative_exception?: {
        has_exception: boolean;
        exception_type: string | null;
        exception_reference: string | null;
        exception_overlap_minutes: number;
        banner_text: string | null;
        details?: any;
    };
    verification_status?: string;
    contradiction_flags?: string[];
    makeup_required_minutes?: number;
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
    todayDateStr?: string;
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
    allDiscrepancies?: DiscrepancyItem[];
    openDiscrepancies: DiscrepancyItem[];
    historicalSessions: HistoricalSessionItem[];
    unmonitoredHistoricalCount: number;
    timetablesByRoom: Record<string, TimetableEntry[]>;
    myAssignedLabs: AssignedLabItem[];
    allFaculty: { id: number; first_name: string; last_name: string }[];
    overallLabPeak?: string;
    availableTimeSlots?: TimeSlotOption[];
    endOfDayReport?: any;
    academicPeriod?: {
        name: string;
        code: string;
        class_start_date: string;
        class_start_date_raw?: string;
    };
    scheduleVersion?: string;
    lastSyncTime?: string;
}

export default function LabInChargeMonitoring({
    labInChargeUser,
    currentShift,
    todayName,
    todayDate,
    todayDateStr = '',
    currentTime,
    assignedRooms = [],
    roomStatusBoard = [],
    actionRequired = [],
    sessionsList = [],
    kpi,
    openDiscrepancies = [],
    allDiscrepancies = [],
    historicalSessions = [],
    unmonitoredHistoricalCount = 14,
    timetablesByRoom = {},
    myAssignedLabs = [],
    allFaculty = [],
    overallLabPeak = '2 PM – 3 PM',
    availableTimeSlots = [],
    endOfDayReport,
    academicPeriod,
    scheduleVersion,
    lastSyncTime,
}: Props) {
    // Top-Level Module Navigation (12 dedicated operational modules)
    const [activeModule, setActiveModule] = useState<
        | 'dashboard'
        | 'today'
        | 'attendance'
        | 'live_monitoring'
        | 'rooms'
        | 'historical'
        | 'discrepancies'
        | 'alerts'
        | 'history'
        | 'assigned_labs'
        | 'action_required'
        | 'timetables'
        | 'schedules'
        | 'end_of_day'
    >(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as any;
            if (tabParam === 'schedules') return 'timetables';
            if (tabParam === 'alerts' || tabParam === 'discrepancies') return 'alerts';
            if (tabParam === 'attendance' || tabParam === 'closing_reports' || tabParam === 'lab-attendance') return 'attendance';
            if (tabParam) return tabParam;
        }
        return 'dashboard';
    });

    // Listen to URL search param changes (e.g. when clicking sidebar navigation links)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as any;
            let target = tabParam === 'schedules' ? 'timetables' : (tabParam === 'discrepancies' ? 'alerts' : tabParam);
            if (tabParam === 'attendance' || tabParam === 'closing_reports' || tabParam === 'lab-attendance') {
                target = 'attendance';
            }
            if (target && target !== activeModule) {
                setActiveModule(target);
            }
        }
    }, []);

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
    const [obsSessionOutcome, setObsSessionOutcome] = useState('Class Conducted by Scheduled Faculty');
    const [obsModality, setObsModality] = useState('Face-to-Face');
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

    // Reassign / Map Faculty Modal State (for Super Admin & Lab In-Charge)
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [reassignSchedule, setReassignSchedule] = useState<ExpectedSession | null>(null);
    const [newFacultyId, setNewFacultyId] = useState('');
    const [reassignType, setReassignType] = useState<'Permanent' | 'Substitute / Temporary' | 'Daily Override'>('Permanent');
    const [reassignReason, setReassignReason] = useState('');
    const [reassignEffectiveDate, setReassignEffectiveDate] = useState(todayDateStr || '');

    const openReassignModal = (session: ExpectedSession) => {
        setReassignSchedule(session);
        setNewFacultyId('');
        setReassignType('Permanent');
        setReassignReason('');
        setReassignEffectiveDate(todayDateStr || '');
        setReassignModalOpen(true);
    };

    const handleReassignFacultySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reassignSchedule) return;
        setIsSubmitting(true);
        router.post(
            `/monitoring/lab-in-charge/schedules/${reassignSchedule.verified_schedule_id}/reassign-faculty`,
            {
                new_faculty_id: newFacultyId,
                reassignment_type: reassignType,
                reason: reassignReason,
                effective_date: reassignEffectiveDate,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setReassignModalOpen(false);
                },
            }
        );
    };

    // Open observation modal pre-populated
    const openObservationModal = (session: ExpectedSession, historical = false) => {
        setTargetSession(session);
        setIsHistoricalMode(historical);

        // Pre-fill observed start/end with defaults if none exist
        setObsActualStart(session.actual_start_time || session.scheduled_start);
        setObsActualEnd(session.actual_end_time || session.scheduled_end);
        setObsStatus(session.observation_status === 'Upcoming' || session.observation_status === 'Ready to Monitor' ? 'In Progress' : session.observation_status);
        setObsRoomCondition(session.room_condition || 'In Use as Scheduled');
        setObsSessionOutcome(session.observed_outcome || session.session_outcome || 'Class Conducted by Scheduled Faculty');
        setObsModality(session.observed_modality || 'Face-to-Face');
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
            observed_outcome: obsSessionOutcome,
            observed_modality: obsModality,
            alternative_room_id: obsAlternativeRoomId ? Number(obsAlternativeRoomId) : null,
            observed_room_id: obsAlternativeRoomId ? Number(obsAlternativeRoomId) : targetSession.room_id,
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
                let liveActive = room.active_session;
                if (!liveActive) {
                    // Match against current time if available, or session marked In Progress / Ready to Monitor
                    const nowPoint = currentTime ? `${currentTime.trim()}:00` : '';
                    liveActive = roomSessions.find((s) => {
                        if (s.observation_status === 'In Progress' || s.observation_status === 'Ready to Monitor') return true;
                        if (nowPoint) {
                            const sStart = `${s.scheduled_start}:00`;
                            const sEnd = `${s.scheduled_end}:00`;
                            return sStart <= nowPoint && sEnd > nowPoint;
                        }
                        return false;
                    }) ?? null;
                }

                return {
                    ...room,
                    active_session: liveActive,
                    next_session: room.next_session,
                    is_in_use: Boolean(liveActive),
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

    const dynamicBreadcrumbs = useMemo((): BreadcrumbItem[] => {
        if (activeModule === 'attendance') {
            return [
                { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
                { title: 'Lab Attendance Monitoring', href: '/monitoring/lab-in-charge?tab=attendance' },
            ];
        }
        if (activeModule === 'alerts' || activeModule === 'discrepancies') {
            return [
                { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
                { title: 'Alerts & Incidents', href: '/monitoring/lab-in-charge?tab=alerts' },
            ];
        }
        if (activeModule === 'history') {
            return [
                { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
                { title: 'Monitoring History', href: '/monitoring/lab-in-charge?tab=history' },
            ];
        }
        if (activeModule === 'timetables' || activeModule === 'schedules') {
            return [
                { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
                { title: 'Lab Schedules', href: '/monitoring/lab-in-charge?tab=schedules' },
            ];
        }
        return breadcrumbs;
    }, [activeModule]);

    const dynamicPageTitle = useMemo(() => {
        if (activeModule === 'attendance') {
            return 'Lab Attendance Monitoring · Operations & Monitoring';
        }
        if (activeModule === 'alerts' || activeModule === 'discrepancies') {
            return 'Alerts & Incidents · Operations & Monitoring';
        }
        if (activeModule === 'history') {
            return 'Monitoring History · Operations & Monitoring';
        }
        if (activeModule === 'timetables' || activeModule === 'schedules') {
            return 'Lab Schedules · Operations & Monitoring';
        }
        return 'Lab In-Charge Operational Workspace';
    }, [activeModule]);

    return (
        <AppLayout breadcrumbs={dynamicBreadcrumbs}>
            <Head title={dynamicPageTitle} />

            <div className="p-3 sm:p-5 space-y-4 w-full">
                {/* Contextual Header for non-dashboard tabs (excluded on dashboard, attendance, alerts, history, and schedules which have their own dedicated module headers) */}
                {activeModule !== 'dashboard' && activeModule !== 'attendance' && activeModule !== 'alerts' && activeModule !== 'discrepancies' && activeModule !== 'history' && activeModule !== 'timetables' && activeModule !== 'schedules' && (
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
                                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                    <span><strong className="text-foreground font-medium">In-Charge:</strong> {labInChargeUser.name}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span><strong className="text-foreground font-medium">Shift:</strong> {currentShift}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="truncate max-w-md"><strong className="text-foreground font-medium">Assigned Labs:</strong> {assignedRooms.map((r: any) => r.room_name ?? r.name).join(', ') || 'All Computer Labs'}</span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7.5 px-2.5 text-xs border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-semibold gap-1.5"
                                    onClick={() => router.get('/monitoring/lab-in-charge/end-of-day')}
                                >
                                    <FileCheck className="h-3.5 w-3.5 text-amber-600" />
                                    End-of-Day Closing Report
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7.5 px-2.5 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 font-semibold gap-1.5"
                                    onClick={() => {
                                        setDisruptRoomId(String(assignedRooms[0]?.id ?? ''));
                                        setDisruptionModalOpen(true);
                                    }}
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Report Room Disruption
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {activeModule === 'dashboard' && (
                    <LabDashboardModule
                        assignedRooms={assignedRooms}
                        sessionsList={sessionsList}
                        timetablesByRoom={timetablesByRoom}
                        allDiscrepancies={allDiscrepancies}
                        openDiscrepancies={openDiscrepancies}
                        historicalSessions={historicalSessions}
                        todayName={todayName}
                        todayDate={todayDate}
                        todayDateStr={todayDateStr}
                        kpi={kpi}
                        onNavigateTab={(tab) => setActiveModule(tab as any)}
                    />
                )}

                {/* MODULE: LAB ATTENDANCE MONITORING (Operational Faculty Attendance Monitoring with Slideover Panel) */}
                {activeModule === 'attendance' && (
                    <LabAttendanceModule
                        assignedRooms={assignedRooms}
                        sessionsList={sessionsList}
                        allFaculty={allFaculty}
                        todayName={todayName}
                        todayDate={todayDate}
                        todayDateStr={todayDateStr}
                        currentTime={currentTime}
                        currentUserName={labInChargeUser.name}
                        academicPeriod={academicPeriod}
                        scheduleVersion={scheduleVersion}
                    />
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

                        {/* Day Table View or Timeline View */}
                        {scheduleViewMode === 'day' ? (
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
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs px-2 gap-1 border-blue-400 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 font-semibold"
                                                                title="Map or change assigned faculty for this schedule (notifies Admin, Dean & Program Head)"
                                                                onClick={() => openReassignModal(s)}
                                                            >
                                                                <UserCog className="h-3.5 w-3.5" />
                                                                Remap Faculty
                                                            </Button>
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
                        ) : (
                            /* Timeline View for Today's Sessions */
                            <div className="rounded-2xl border p-4 bg-card shadow-2xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                        <h3 className="font-black text-sm text-foreground">Chronological Lab Timeline for Today ({todayName})</h3>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        {filteredTodaySessions.length} {filteredTodaySessions.length === 1 ? 'Session' : 'Sessions'}
                                    </span>
                                </div>

                                {filteredTodaySessions.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">
                                        No scheduled laboratory sessions match the selected filters.
                                    </div>
                                ) : (
                                    <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                                        {filteredTodaySessions.map((s) => {
                                            const isLive = s.observation_status === 'In Progress' || s.observation_status === 'Started On Time';
                                            return (
                                                <div
                                                    key={s.verified_schedule_id}
                                                    className={cn(
                                                        "relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all shadow-2xs hover:shadow-xs",
                                                        isLive
                                                            ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-400/80"
                                                            : "bg-background border-border/80 hover:border-amber-400/60"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "absolute -left-[27px] top-4 w-3 h-3 rounded-full border-2 border-background",
                                                        isLive ? "bg-amber-500 animate-ping" : "bg-muted-foreground/50"
                                                    )} />
                                                    <span className={cn(
                                                        "absolute -left-[27px] top-4 w-3 h-3 rounded-full border-2 border-background",
                                                        isLive ? "bg-amber-500" : "bg-muted-foreground/60"
                                                    )} />

                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                                {s.scheduled_time}
                                                            </span>
                                                            <span className="font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground">
                                                                {s.room_name}
                                                            </span>
                                                            <span className="font-black text-sm text-foreground truncate">
                                                                {s.course_code}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                — {s.course_title}
                                                            </span>
                                                            {getBadgeForSession(s.observation_status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                                                            <span>Sec: <strong className="text-foreground">{s.section}</strong></span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                                {s.expected_faculty}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Duration: <strong className="text-foreground">{s.scheduled_minutes}m</strong></span>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-7 px-3 shadow-2xs gap-1"
                                                            onClick={() => openObservationModal(s)}
                                                        >
                                                            <MonitorPlay className="h-3 w-3" />
                                                            Monitor
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
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

                {/* MODULE 5: ALERTS & INCIDENTS (Faithfully matching attached reference design) */}
                {(activeModule === 'alerts' || activeModule === 'discrepancies') && (
                    <LabAlertsModule
                        assignedRooms={assignedRooms}
                        openDiscrepancies={openDiscrepancies}
                        allDiscrepancies={allDiscrepancies}
                        currentUserName={labInChargeUser.name}
                        onOpenDisruptionModal={() => {
                            setDisruptRoomId(String(assignedRooms[0]?.id ?? ''));
                            setDisruptionModalOpen(true);
                        }}
                    />
                )}

                {/* MODULE 6: MONITORING HISTORY (Faithfully matching attached reference design) */}
                {activeModule === 'history' && (
                    <LabHistoryModule
                        assignedRooms={assignedRooms}
                        historicalSessions={historicalSessions}
                        currentUserName={labInChargeUser.name}
                        onRequestCorrection={(item) => {
                            setSelectedHistoryItem(item);
                            setCorrectionModalOpen(true);
                        }}
                    />
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

                {/* MODULE: LAB SCHEDULES & OPERATIONAL TIMETABLE (Read-Only Operational Timetable) */}
                {(activeModule === 'timetables' || activeModule === 'schedules') && (
                    <LabSchedulesModule
                        assignedRooms={assignedRooms}
                        sessionsList={sessionsList}
                        timetablesByRoom={timetablesByRoom}
                        todayName={todayName}
                        todayDate={todayDate}
                        todayDateStr={todayDateStr}
                        currentTime={currentTime}
                        academicPeriod={academicPeriod}
                        scheduleVersion={scheduleVersion}
                        lastSyncTime={lastSyncTime}
                        onOpenObservation={(session, historical) => openObservationModal(session, historical)}
                        onOpenDisruptionModal={(roomId, scheduleId) => {
                            if (roomId) setDisruptRoomId(roomId);
                            setDisruptionModalOpen(true);
                        }}
                    />
                )}

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

            {/* LIVE SESSION MONITORING MODAL: THREE SEPARATED PANELS (Expected Session, Administrative Exception, Observed Outcome) */}
            <Dialog open={monitoringModalOpen} onOpenChange={setMonitoringModalOpen}>
                <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black flex items-center gap-2">
                            <MonitorPlay className="h-5 w-5 text-amber-500" />
                            Session Monitoring & Reconciliation: Expected · Administrative Exception · Observed Outcome
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            OfficeHub reconciles three independent facts: published schedule, official administrative exceptions, and observed classroom delivery.
                        </DialogDescription>
                    </DialogHeader>

                    {targetSession && (
                        <form onSubmit={handleSubmitObservation} className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                                {/* PANEL 1: EXPECTED SESSION (Published master timetable - Read-only) */}
                                <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                                    <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        <span>1. Expected Session</span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Scheduled Laboratory:</span>
                                            <strong className="text-sm font-black text-foreground">{targetSession.room_name}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Course Offering:</span>
                                            <strong className="text-sm font-black text-foreground">{targetSession.course_code}</strong>
                                            <div className="text-muted-foreground text-[11px] leading-tight">{targetSession.course_title}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Section:</span>
                                            <strong className="text-foreground">{targetSession.section}</strong>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Expected Faculty:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMonitoringModalOpen(false);
                                                        openReassignModal(targetSession);
                                                    }}
                                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                                >
                                                    <UserCog className="h-3 w-3" /> Remap
                                                </button>
                                            </div>
                                            <strong className="text-foreground">{targetSession.expected_faculty}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Published Schedule & Duration:</span>
                                            <span className="font-mono font-bold text-foreground">{targetSession.scheduled_time} ({targetSession.scheduled_minutes}m)</span>
                                        </div>
                                        <div className="pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground">
                                            <span>Period: {academicPeriod?.name}</span>
                                            <br />
                                            <span>Version: {scheduleVersion}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL 2: ADMINISTRATIVE EXCEPTION (Official Business, Leave, Suspensions - Read-only Source) */}
                                <div className="space-y-3 bg-card p-3.5 rounded-xl border border-blue-500/30">
                                    <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pb-2 border-b border-blue-500/20">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>2. Administrative Exception</span>
                                    </div>

                                    {targetSession.administrative_exception?.has_exception ? (
                                        <div className="space-y-2.5 text-xs">
                                            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                                                <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                                                    <FileCheck className="w-3.5 h-3.5" />
                                                    <span>{targetSession.administrative_exception.exception_type} Detected</span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground font-mono">
                                                    Ref: <strong>{targetSession.administrative_exception.exception_reference}</strong>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Overlap Window:</span>
                                                    <strong className="font-mono text-foreground text-xs">
                                                        {targetSession.administrative_exception.exception_overlap_minutes} of {targetSession.scheduled_minutes} min
                                                    </strong>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, Math.round((targetSession.administrative_exception.exception_overlap_minutes / targetSession.scheduled_minutes) * 100))}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border leading-tight">
                                                {targetSession.administrative_exception.banner_text}
                                            </div>

                                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 leading-tight">
                                                <strong>Note:</strong> Attendance is excused for overlapping minutes. Your job as Lab In-Charge is only to observe whether teaching actually occurred.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-center p-3 text-muted-foreground space-y-1">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-1" />
                                            <span className="text-xs font-bold text-foreground">No Official Exceptions</span>
                                            <p className="text-[10px] text-muted-foreground max-w-[200px]">
                                                No approved Leave, Travel Order, Locator Slip, or Suspension intersects this class. Standard attendance policy applies.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* PANEL 3: OBSERVED OUTCOME (Recorded by Lab In-Charge) */}
                                <div className="space-y-3 bg-card p-3.5 rounded-xl border border-amber-500/40">
                                    <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pb-2 border-b border-amber-500/20">
                                        <Eye className="h-4 w-4" />
                                        <span>3. Observed Outcome</span>
                                    </div>

                                    {/* Outcome Selector */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Actual Class Outcome</Label>
                                        <Select value={obsSessionOutcome} onValueChange={setObsSessionOutcome}>
                                            <SelectTrigger className="h-8 text-xs font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Class Conducted by Scheduled Faculty">Class Conducted by Scheduled Faculty</SelectItem>
                                                <SelectItem value="Class Conducted by Substitute Faculty">Class Conducted by Substitute Faculty</SelectItem>
                                                <SelectItem value="Transferred to Another Room">Transferred to Another Room</SelectItem>
                                                <SelectItem value="Switched to Online Modality">Switched to Online Modality</SelectItem>
                                                <SelectItem value="Partially Conducted">Partially Conducted</SelectItem>
                                                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                                                <SelectItem value="Not Conducted – Official Business">Not Conducted – Official Business</SelectItem>
                                                <SelectItem value="Not Conducted – Faculty Absent">Not Conducted – Faculty Absent</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                <SelectItem value="Institutionally Suspended">Institutionally Suspended</SelectItem>
                                                <SelectItem value="Different Class Observed">Different Class Observed</SelectItem>
                                                <SelectItem value="Unable to Verify">Unable to Verify</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Modality Selector */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Observed Modality</Label>
                                        <Select value={obsModality} onValueChange={setObsModality}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Face-to-Face">Face-to-Face (Laboratory)</SelectItem>
                                                <SelectItem value="Online - Synchronous">Online - Synchronous (Meet/Zoom)</SelectItem>
                                                <SelectItem value="Online - Asynchronous">Online - Asynchronous</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Room Condition */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Room Condition (Facility)</Label>
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

                                    {/* Actual Start and End Times */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Actual Start</Label>
                                            <Input
                                                type="time"
                                                className="h-8 text-xs font-mono"
                                                value={obsActualStart}
                                                onChange={(e) => setObsActualStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Actual End</Label>
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

                                    {/* Different / Substitute Faculty if observed */}
                                    {(obsSessionOutcome === 'Class Conducted by Substitute Faculty' || obsSessionOutcome === 'Different Faculty Observed') && (
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-purple-600 dark:text-purple-400">Observed Substitute / Alternate Faculty</Label>
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
                                    {(obsSessionOutcome === 'Transferred to Another Room' || obsSessionOutcome === 'Conducted in Alternate Room') && (
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-blue-600 dark:text-blue-400">Actual Room Transferred To</Label>
                                            <Select value={obsAlternativeRoomId} onValueChange={setObsAlternativeRoomId}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select actual room" />
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

            {/* REMAP / REASSIGN FACULTY MODAL (Super Admin & Lab In-Charge) */}
            <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-foreground">
                            <UserCog className="h-5 w-5 text-blue-600" />
                            Remap Faculty on Verified Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Change the assigned faculty member for this schedule slot. The Super Admin, Dean, and Program Head will be automatically notified with your user identity and audit reason.
                        </DialogDescription>
                    </DialogHeader>

                    {reassignSchedule && (
                        <form onSubmit={handleReassignFacultySubmit} className="space-y-3.5">
                            {/* Schedule Summary Box */}
                            <div className="p-3 bg-muted/40 rounded-xl border text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground uppercase text-[10px]">Course:</span>
                                    <strong className="text-foreground">{reassignSchedule.course_code} ({reassignSchedule.section})</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground uppercase text-[10px]">Laboratory:</span>
                                    <strong className="text-foreground">{reassignSchedule.room_name}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground uppercase text-[10px]">Scheduled Window:</span>
                                    <strong className="text-amber-700 dark:text-amber-400 font-mono">{reassignSchedule.scheduled_time}</strong>
                                </div>
                                <div className="flex justify-between pt-1 border-t">
                                    <span className="text-muted-foreground uppercase text-[10px]">Current Faculty:</span>
                                    <strong className="text-rose-600 dark:text-rose-400">{reassignSchedule.expected_faculty}</strong>
                                </div>
                            </div>

                            {/* Select New Faculty */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                    Select New Faculty Assignment
                                </Label>
                                <Select value={newFacultyId} onValueChange={setNewFacultyId} required>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Choose replacing faculty member..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allFaculty
                                            .filter((f) => f.id !== reassignSchedule.faculty_id)
                                            .map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.first_name} {f.last_name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reassignment Scope / Type */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Reassignment Type</Label>
                                <Select value={reassignType} onValueChange={(val: any) => setReassignType(val)}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Permanent">Permanent (Official Semester Mapping)</SelectItem>
                                        <SelectItem value="Substitute / Temporary">Substitute / Temporary Coverage</SelectItem>
                                        <SelectItem value="Daily Override">Daily Session Override</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mandatory Reason */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Audit Reason / Justification</Label>
                                <Textarea
                                    className="text-xs min-h-[70px]"
                                    placeholder="State why this schedule was remapped (e.g. Approved teaching substitution, workload rebalance, faculty department assignment)..."
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Notification Notice */}
                            <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
                                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                                <div>
                                    <strong>Automated Audit Broadcast:</strong> The Super Admin, Dean, and Program Head will receive a notification identifying you (<span className="font-semibold">{labInChargeUser.name}</span>) as the person who performed this remapping.
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReassignModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                    disabled={isSubmitting || !newFacultyId || reassignReason.trim().length < 5}
                                >
                                    {isSubmitting ? 'Remapping...' : 'Confirm Faculty Remap'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
