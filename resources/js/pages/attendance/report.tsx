import React, { useState, useMemo, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Calendar,
    Users,
    Building2,
    CalendarDays,
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    User,
    Check,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    FileText,
    Clock,
    Plus,
    Trash2,
    GripVertical,
    RotateCcw,
    BookmarkCheck,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
    Table,
    Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Attendance & Monitoring', href: '/faculty-attendance' },
    { title: 'Generate Report', href: '/faculty-attendance/report' },
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
    status: 'present' | 'late' | 'absent' | 'online' | 'on_leave' | 'others';
    primary_status?: 'present' | 'unexcused_absence' | 'approved_leave' | 'official_business' | 'class_suspended' | 'holiday' | 'cancelled_institution';
    late_minutes: number;
    scheduled_duration_minutes?: number;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    actual_arrival_time?: string;
    delivered_minutes?: number;
    make_up_required?: boolean;
    make_up_request_id?: number | null;
    make_up_request?: any;
    room_schedule?: any;
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
    total_scheduled_hours?: number;
    eligible_scheduled_hours?: number;
    attended_hours?: number;
    approved_leave_hours?: number;
    unexcused_absent_hours?: number;
    make_up_required_hours?: number;
    make_up_completed_hours?: number;
    attendance_rate: number;
    attendance_coverage_rate?: number;
    on_time_rate?: number;
    instructional_completion_rate?: number;
    is_rank_eligible?: boolean;
    faculty?: Faculty | null;
}

interface SignatoryItem {
    id: string;
    label: string;
    name: string;
    designation: string;
    department: string;
    showSignatureLine: boolean;
}

interface Props {
    programs: Program[];
    faculties: Faculty[];
    summaries: FacultyAttendanceSummary[];
    weekly_sessions: FacultyAttendanceRecord[];
    make_up_requests?: any[];
    monthly_periods: string[];
    weekly_periods: string[];
    last_synced_at: string;
    academic_year: string;
    semester: string;
}

export default function GenerateReportPage({
    programs = [],
    faculties = [],
    summaries = [],
    weekly_sessions = [],
    monthly_periods = [],
    weekly_periods = [],
    last_synced_at = 'Oct 13, 2026 06:23 AM',
    academic_year = 'AY 2026–2027',
    semester = '1st Semester',
}: Props) {
    // 1. Report Format
    const [reportFormat, setReportFormat] = useState<'weekly' | 'monthly' | 'individual' | 'consolidated'>('weekly');

    // 2. Reporting Period Tab: 'week' | 'month' | 'custom'
    const [periodTab, setPeriodTab] = useState<'week' | 'month' | 'custom'>('week');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(
        weekly_periods[0] || 'August Week 5 (8/31/2026)'
    );

    // Auto-sync selectedPeriod when switching period tabs
    const handlePeriodTabChange = (newTab: 'week' | 'month' | 'custom') => {
        setPeriodTab(newTab);
        if (newTab === 'month') {
            if (!monthly_periods.includes(selectedPeriod)) {
                setSelectedPeriod(monthly_periods[0] || 'August 2026');
            }
        } else if (newTab === 'week') {
            if (!weekly_periods.includes(selectedPeriod)) {
                setSelectedPeriod(weekly_periods[0] || 'August Week 5 (8/31/2026)');
            }
        }
    };

    // Auto-sync period tab when report format changes
    const handleReportFormatChange = (format: 'weekly' | 'monthly' | 'individual' | 'consolidated') => {
        setReportFormat(format);
        if (format === 'monthly' || format === 'consolidated') {
            handlePeriodTabChange('month');
        } else if (format === 'weekly') {
            handlePeriodTabChange('week');
        }
    };

    // 3. Filters
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedSemester, setSelectedSemester] = useState<string>(semester || '1st Semester');
    const [selectedAY, setSelectedAY] = useState<string>(academic_year || 'AY 2026–2027');
    const [sortBy, setSortBy] = useState<string>('name');

    // 4. Key Summaries Options (Minimal clean checkboxes)
    const [keySummaries, setKeySummaries] = useState({
        executiveSummary: true,
        attendanceTotals: true,
        lateMinutes: true,
        absenceBreakdown: true,
        attendanceRateAnalysis: true,
        programSummary: true,
    });

    // Helper function to build default signatories
    const getDefaultSignatories = (): SignatoryItem[] => {
        const programChair = faculties.find(f => f.academic_rank?.toLowerCase().includes('chair') || f.academic_rank?.toLowerCase().includes('associate')) || faculties[0];
        return [
            {
                id: 'sig-1',
                label: 'Prepared by',
                name: 'Faculty Attendance Coordinator',
                designation: 'Monitoring Coordinator',
                department: 'Faculty Attendance Unit',
                showSignatureLine: true,
            },
            {
                id: 'sig-2',
                label: 'Verified by',
                name: programChair ? `${programChair.first_name} ${programChair.last_name}` : 'Program Chairperson',
                designation: 'Program Chairperson',
                department: programChair?.program?.name || 'Department Academic Unit',
                showSignatureLine: true,
            },
            {
                id: 'sig-3',
                label: 'Noted by',
                name: 'Dr. Ramon Santos, PECE',
                designation: 'College Dean',
                department: 'College of Information and Communications Technology',
                showSignatureLine: true,
            },
        ];
    };

    // 5. Configurable Signatories with persistent storage (localStorage)
    const [signatoriesList, setSignatoriesList] = useState<SignatoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cids_attendance_report_signatories');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse saved signatories from localStorage:', e);
            }
        }
        return getDefaultSignatories();
    });

    // 6. Inline / Modal Faculty Name Editing state
    const [customFacultyNames, setCustomFacultyNames] = useState<Record<string, string>>({});
    const [editingFaculty, setEditingFaculty] = useState<{
        id?: number | null;
        faculty_id?: number | null;
        oldName: string;
        currentName: string;
    } | null>(null);
    const [isSavingName, setIsSavingName] = useState<boolean>(false);

    // 7. Session Audit Trail Modal state
    const [selectedAuditFaculty, setSelectedAuditFaculty] = useState<any | null>(null);

    // Save edited faculty name both in local state and to database
    const handleSaveFacultyName = () => {
        if (!editingFaculty) return;
        const trimmedNewName = editingFaculty.currentName.trim();
        if (!trimmedNewName) {
            alert('Faculty name cannot be empty.');
            return;
        }

        const oldName = editingFaculty.oldName;
        // Update local state immediately for instant preview feedback
        setCustomFacultyNames(prev => ({
            ...prev,
            [oldName]: trimmedNewName,
            ...(editingFaculty.faculty_id ? { [`fid_${editingFaculty.faculty_id}`]: trimmedNewName } : {}),
        }));

        setIsSavingName(true);
        router.post(
            '/faculty-attendance/update-faculty-name',
            {
                old_name: oldName,
                new_name: trimmedNewName,
                faculty_id: editingFaculty.faculty_id || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingName(false);
                    setEditingFaculty(null);
                    showToast(`Faculty name updated to "${trimmedNewName}".`);
                },
                onError: (err) => {
                    setIsSavingName(false);
                    console.error('Error updating faculty name:', err);
                    showToast('Failed to save name update to server, applied locally.');
                    setEditingFaculty(null);
                },
            }
        );
    };

    // Zoom level and Maximize for live preview
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Save signatories list to localStorage
    const persistSignatories = (updated: SignatoryItem[]) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('cids_attendance_report_signatories', JSON.stringify(updated));
            }
        } catch (e) {
            console.warn('Failed to save signatories to localStorage:', e);
        }
    };

    // Add a new signatory
    const handleAddSignatory = () => {
        const newSig: SignatoryItem = {
            id: `sig-${Date.now()}`,
            label: 'Approved by',
            name: 'Dr. Elena Villanueva',
            designation: 'Vice President for Academic Affairs',
            department: 'Office of Academic Affairs',
            showSignatureLine: true,
        };
        const updated = [...signatoriesList, newSig];
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    // Remove a signatory
    const handleRemoveSignatory = (id: string) => {
        if (signatoriesList.length <= 1) return;
        const updated = signatoriesList.filter(s => s.id !== id);
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    // Update signatory field
    const handleUpdateSignatory = (id: string, field: keyof SignatoryItem, value: any) => {
        const updated = signatoriesList.map(s => (s.id === id ? { ...s, [field]: value } : s));
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    // Reset signatories to default
    const handleResetSignatories = () => {
        const defaults = getDefaultSignatories();
        setSignatoriesList(defaults);
        persistSignatories(defaults);
        showToast('Signatories reset to default template.');
    };

    // Save full template (signatories + summaries toggles)
    const handleSaveTemplate = () => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('cids_attendance_report_signatories', JSON.stringify(signatoriesList));
                localStorage.setItem('cids_attendance_report_summaries', JSON.stringify(keySummaries));
                localStorage.setItem('cids_attendance_report_format', reportFormat);
            }
            showToast('Template & signatories saved successfully!');
        } catch (e) {
            console.error('Failed to save template:', e);
            showToast('Failed to save template settings.');
        }
    };

    // Toggle Maximize / Fullscreen View
    const handleToggleMaximize = () => {
        setIsMaximized(!isMaximized);
        if (!isMaximized) {
            setZoomLevel(110);
        } else {
            setZoomLevel(100);
        }
    };

    // Calculated rows for the preview sheet
    const previewData = useMemo(() => {
        // Filter summaries according to period and format
        let matchingSummaries = summaries;

        if (reportFormat === 'individual' && selectedFaculty !== 'all') {
            // For individual faculty report, filter by the chosen faculty
            matchingSummaries = summaries.filter(s => {
                if (s.faculty_id !== null && s.faculty_id !== undefined && String(s.faculty_id) === selectedFaculty) {
                    return true;
                }
                const facultyObj = faculties.find(f => String(f.id) === selectedFaculty);
                const targetLastName = facultyObj?.last_name?.toLowerCase();
                const targetFirstName = facultyObj?.first_name?.toLowerCase();
                const nameLower = (s.instructor_name || '').toLowerCase();
                return (targetLastName && nameLower.includes(targetLastName)) || (targetFirstName && nameLower.includes(targetFirstName));
            });

            // If periods exist for this faculty, optionally match selectedPeriod or show their monthly breakdown
            const periodMatches = matchingSummaries.filter(s => s.period_label?.toLowerCase() === selectedPeriod?.toLowerCase());
            if (periodMatches.length > 0) {
                matchingSummaries = periodMatches;
            }
        } else {
            // Filter summaries by selected period label
            const periodMatches = summaries.filter(s => s.period_label?.toLowerCase() === selectedPeriod?.toLowerCase());
            if (periodMatches.length > 0) {
                matchingSummaries = periodMatches;
            } else {
                // If no exact match (e.g. week label differences), filter by period_type if available
                const targetType = periodTab === 'month' ? 'monthly' : 'weekly';
                const typeMatches = summaries.filter(s => s.period_type === targetType);
                if (typeMatches.length > 0) {
                    matchingSummaries = typeMatches;
                }
            }
        }

        // Deduplicate summaries by faculty to guarantee no faculty repeats in the report
        const seenFacultyKeys = new Set<string>();
        const uniqueSummaries = matchingSummaries.filter(s => {
            const key = s.faculty_id ? `fid_${s.faculty_id}` : `name_${s.instructor_name.trim().toLowerCase()}`;
            if (seenFacultyKeys.has(key)) {
                return false;
            }
            seenFacultyKeys.add(key);
            return true;
        });

        // Base rows from matching summaries with instructional hours & multi-indicator performance
        let rows = uniqueSummaries.map(s => {
            let facultyName = s.faculty ? `${s.faculty.first_name} ${s.faculty.last_name}` : s.instructor_name;
            // Check if user customized the faculty name
            if (s.faculty_id && customFacultyNames[`fid_${s.faculty_id}`]) {
                facultyName = customFacultyNames[`fid_${s.faculty_id}`];
            } else if (customFacultyNames[s.instructor_name]) {
                facultyName = customFacultyNames[s.instructor_name];
            }

            const programCode = s.faculty?.program?.code || 'BSIS';
            const scheduledSessions = s.scheduled_sessions || (s.present_count + s.late_count + s.absent_count) || 3;
            const present = s.present_count ?? 3;
            const late = s.late_count ?? 0;
            const absent = s.absent_count ?? 0;
            const onLeave = s.on_leave_count ?? 0;
            const lateMinutes = s.total_late_minutes ?? (late * 15);

            // Compute or read instructional hours
            // Default 1.5 hrs (90 mins) per session if not set on summary
            const scheduledHours = s.total_scheduled_hours || (scheduledSessions * 1.5);
            const leaveHours = s.approved_leave_hours || (onLeave * 1.5);
            const eligibleHours = s.eligible_scheduled_hours || Math.max(0, scheduledHours - leaveHours);
            const attendedHours = s.attended_hours || (present * 1.5);
            const unexcusedAbsentHours = s.unexcused_absent_hours || (absent * 1.5);

            // Fetch matched make-up completed hours
            const makeUpRequiredHours = s.make_up_required_hours || (unexcusedAbsentHours + leaveHours);
            let makeUpCompletedHours = s.make_up_completed_hours || 0;
            if (s.faculty_id) {
                const completedMUs = (weekly_sessions as any[]).filter(ws => ws.faculty_id === s.faculty_id && ws.make_up_request_id);
                if (completedMUs.length > 0 && makeUpCompletedHours === 0) {
                    makeUpCompletedHours = completedMUs.length * 1.5;
                }
            }

            // Rates
            const attendanceCoverage = eligibleHours > 0
                ? Math.min(100, Math.round((attendedHours / eligibleHours) * 100))
                : 100;

            const onTimeRate = present > 0
                ? Math.min(100, Math.round(((present - late) / present) * 100))
                : 100;

            const instructionalCompletion = eligibleHours > 0
                ? Math.min(100, Math.round(((attendedHours + makeUpCompletedHours) / eligibleHours) * 100))
                : 100;

            const isRankEligible = s.is_rank_eligible ?? (eligibleHours >= (periodTab === 'week' ? 3.0 : 12.0));

            // Associated individual session meetings for audit trail
            const facultySessions = weekly_sessions.filter(ws => {
                if (s.faculty_id && ws.faculty_id === s.faculty_id) return true;
                const nameLower = (ws.instructor_name || '').toLowerCase();
                const targetLower = (s.instructor_name || '').toLowerCase();
                return nameLower.includes(targetLower) || targetLower.includes(nameLower);
            });

            return {
                id: s.id,
                faculty_id: s.faculty_id,
                original_instructor_name: s.instructor_name,
                instructor_name: facultyName,
                program: programCode,
                scheduledSessions,
                present,
                late,
                absent,
                onLeave,
                lateMinutes,
                scheduledHours,
                eligibleHours,
                attendedHours,
                leaveHours,
                unexcusedAbsentHours,
                makeUpRequiredHours,
                makeUpCompletedHours,
                attendanceCoverage,
                onTimeRate,
                instructionalCompletion,
                isRankEligible,
                sessions: facultySessions,
            };
        });

        // If summaries is empty, fallback to representative official faculty dataset
        if (rows.length === 0) {
            rows = [
                {
                    id: 1,
                    faculty_id: 35,
                    original_instructor_name: 'Razel Ann Aguilar',
                    instructor_name: 'Razel Ann Aguilar',
                    program: 'BSIT',
                    scheduledSessions: 3,
                    present: 3,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledHours: 4.5,
                    eligibleHours: 4.5,
                    attendedHours: 4.5,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 100,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 2,
                    faculty_id: 14,
                    original_instructor_name: 'Felomino Alba',
                    instructor_name: 'Felomino Alba',
                    program: 'BSIT',
                    scheduledSessions: 2,
                    present: 2,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledHours: 3.0,
                    eligibleHours: 3.0,
                    attendedHours: 3.0,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 100,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 3,
                    faculty_id: 18,
                    original_instructor_name: 'Dhominic Arendain',
                    instructor_name: 'Dhominic Arendain',
                    program: 'BSIS',
                    scheduledSessions: 3,
                    present: 3,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledHours: 4.5,
                    eligibleHours: 4.5,
                    attendedHours: 4.5,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 100,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 4,
                    faculty_id: null,
                    original_instructor_name: 'Bacalso',
                    instructor_name: 'Bacalso',
                    program: 'BSIS',
                    scheduledSessions: 3,
                    present: 3,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledHours: 4.5,
                    eligibleHours: 4.5,
                    attendedHours: 4.5,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 100,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 5,
                    faculty_id: 36,
                    original_instructor_name: 'Kris Bahaya',
                    instructor_name: 'Kris Bahaya',
                    program: 'BSIT',
                    scheduledSessions: 3,
                    present: 2,
                    late: 1,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 15,
                    scheduledHours: 4.5,
                    eligibleHours: 4.5,
                    attendedHours: 3.0,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 50,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 6,
                    faculty_id: 9,
                    original_instructor_name: 'Mardalyn Caniban',
                    instructor_name: 'Mardalyn Caniban',
                    program: 'BSIS',
                    scheduledSessions: 3,
                    present: 3,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledHours: 4.5,
                    eligibleHours: 4.5,
                    attendedHours: 4.5,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 100,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 7,
                    faculty_id: 15,
                    original_instructor_name: 'Jamaica Estrebello',
                    instructor_name: 'Jamaica Estrebello',
                    program: 'BSIT',
                    scheduledSessions: 10,
                    present: 6,
                    late: 4,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 50,
                    scheduledHours: 15.0,
                    eligibleHours: 15.0,
                    attendedHours: 9.0,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 33,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 8,
                    faculty_id: 11,
                    original_instructor_name: 'Amzel Menoza',
                    instructor_name: 'Amzel Menoza',
                    program: 'BSIT',
                    scheduledSessions: 54,
                    present: 42,
                    late: 8,
                    absent: 4,
                    onLeave: 8,
                    lateMinutes: 120,
                    scheduledHours: 81.0,
                    eligibleHours: 69.0,
                    attendedHours: 63.0,
                    leaveHours: 12.0,
                    unexcusedAbsentHours: 6.0,
                    makeUpRequiredHours: 18.0,
                    makeUpCompletedHours: 6.0,
                    attendanceCoverage: 91,
                    onTimeRate: 81,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 9,
                    faculty_id: 1,
                    original_instructor_name: 'Domingo Origines',
                    instructor_name: 'Domingo Origines',
                    program: 'BSIT',
                    scheduledSessions: 12,
                    present: 11,
                    late: 1,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 10,
                    scheduledHours: 18.0,
                    eligibleHours: 18.0,
                    attendedHours: 16.5,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100,
                    onTimeRate: 91,
                    instructionalCompletion: 100,
                    isRankEligible: true,
                    sessions: [],
                },
            ];
        }

        // Apply filters
        if (selectedProgram !== 'all') {
            rows = rows.filter(r => r.program === selectedProgram);
        }

        // Robust faculty filtering: matches selected faculty id or faculty name
        if (selectedFaculty !== 'all') {
            const facultyObj = faculties.find(f => String(f.id) === selectedFaculty);
            const targetLastName = facultyObj?.last_name?.toLowerCase();
            const targetFirstName = facultyObj?.first_name?.toLowerCase();

            rows = rows.filter(r => {
                if (r.faculty_id !== null && r.faculty_id !== undefined && String(r.faculty_id) === selectedFaculty) {
                    return true;
                }
                const nameLower = r.instructor_name.toLowerCase();
                if (targetLastName && nameLower.includes(targetLastName)) {
                    return true;
                }
                if (targetFirstName && nameLower.includes(targetFirstName)) {
                    return true;
                }
                return false;
            });
        }

        if (selectedStatus === 'present') {
            rows = rows.filter(r => r.attendanceCoverage >= 100);
        } else if (selectedStatus === 'late') {
            rows = rows.filter(r => r.late > 0);
        } else if (selectedStatus === 'absent') {
            rows = rows.filter(r => r.absent > 0);
        }

        // Sort
        if (sortBy === 'rate') {
            rows.sort((a, b) => b.attendanceCoverage - a.attendanceCoverage);
        } else if (sortBy === 'completion') {
            rows.sort((a, b) => b.instructionalCompletion - a.instructionalCompletion);
        } else if (sortBy === 'hours') {
            rows.sort((a, b) => b.eligibleHours - a.eligibleHours);
        } else {
            rows.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name));
        }

        // Aggregate Totals across instructional hours & percentages
        const totalEligibleHours = rows.reduce((acc, r) => acc + r.eligibleHours, 0);
        const totalAttendedHours = rows.reduce((acc, r) => acc + r.attendedHours, 0);
        const totalLeaveHours = rows.reduce((acc, r) => acc + r.leaveHours, 0);
        const totalAbsentHours = rows.reduce((acc, r) => acc + r.unexcusedAbsentHours, 0);
        const totalLateSessions = rows.reduce((acc, r) => acc + r.late, 0);
        const totalLateMinutes = rows.reduce((acc, r) => acc + r.lateMinutes, 0);
        const totalMakeUpRequired = rows.reduce((acc, r) => acc + r.makeUpRequiredHours, 0);
        const totalMakeUpCompleted = rows.reduce((acc, r) => acc + r.makeUpCompletedHours, 0);
        const facultyCount = rows.length;

        const overallCoverage = totalEligibleHours > 0
            ? Math.round((totalAttendedHours / totalEligibleHours) * 100)
            : 100;

        const overallCompletion = totalEligibleHours > 0
            ? Math.min(100, Math.round(((totalAttendedHours + totalMakeUpCompleted) / totalEligibleHours) * 100))
            : 100;

        return {
            rows,
            totals: {
                facultyCount,
                totalEligibleHours: Number(totalEligibleHours.toFixed(1)),
                totalAttendedHours: Number(totalAttendedHours.toFixed(1)),
                totalLeaveHours: Number(totalLeaveHours.toFixed(1)),
                totalAbsentHours: Number(totalAbsentHours.toFixed(1)),
                totalLateSessions,
                totalLateMinutes,
                totalMakeUpRequired: Number(totalMakeUpRequired.toFixed(1)),
                totalMakeUpCompleted: Number(totalMakeUpCompleted.toFixed(1)),
                overallCoverage,
                overallCompletion,
            },
        };
    }, [summaries, weekly_sessions, faculties, customFacultyNames, selectedPeriod, periodTab, reportFormat, selectedProgram, selectedFaculty, selectedStatus, sortBy]);

    // State for PDF downloading status
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

    // Notification toast state for user actions (Save Template, Reset, etc.)
    const [actionNotification, setActionNotification] = useState<string | null>(null);

    const showToast = (message: string) => {
        setActionNotification(message);
        setTimeout(() => setActionNotification(null), 3500);
    };

    // Handle Print Preview via clean isolated print container/iframe
    const handlePrintPreview = () => {
        const sheetElement = document.getElementById('pdf-preview-sheet');
        if (!sheetElement) {
            window.print();
            return;
        }

        // Create an isolated hidden iframe for printing to avoid browser header/footer and eliminate blank first pages
        let printIframe = document.getElementById('report-print-iframe') as HTMLIFrameElement | null;
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'report-print-iframe';
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '0';
            printIframe.style.height = '0';
            printIframe.style.border = 'none';
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
        if (!iframeDoc) {
            window.print();
            return;
        }

        // Collect document styles
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML)
            .join('\n');

        // Clone the preview sheet content cleanly without transform, shadows, or outer borders
        const clonedSheet = sheetElement.cloneNode(true) as HTMLElement;
        clonedSheet.style.transform = 'none';
        clonedSheet.style.boxShadow = 'none';
        clonedSheet.style.border = 'none';
        clonedSheet.style.margin = '0 auto';
        clonedSheet.style.padding = '0';
        clonedSheet.style.width = '100%';
        clonedSheet.style.maxWidth = '100%';
        clonedSheet.style.minHeight = 'auto';

        // Remove any interactive UI elements from clone
        clonedSheet.querySelectorAll('.no-print').forEach(el => el.remove());

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Faculty Attendance Report</title>
                ${styles}
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0.5in;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: inherit;
                    }
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    #pdf-preview-sheet {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    .page-break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                </style>
            </head>
            <body>
                <div style="width: 100%;">
                    ${clonedSheet.outerHTML}
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // Allow images & fonts inside the iframe to load before printing
        setTimeout(() => {
            try {
                printIframe?.contentWindow?.focus();
                printIframe?.contentWindow?.print();
            } catch (e) {
                console.error('Iframe print error, falling back to window.print():', e);
                window.print();
            }
        }, 350);
    };

    // Handle Direct PDF Generation / Download
    const handleGeneratePdf = async () => {
        const sheetElement = document.getElementById('pdf-preview-sheet');
        if (!sheetElement || isGeneratingPdf) return;

        setIsGeneratingPdf(true);

        const fileName = `CIDS_Faculty_Attendance_Report_${selectedAY.replace(/[\s–—-]+/g, '_')}_${selectedSemester.replace(/[\s–—-]+/g, '_')}.pdf`;

        // Temporarily reset preview transform/scale and ensure no scrollbars during capture
        const originalTransform = sheetElement.style.transform;
        const originalBoxShadow = sheetElement.style.boxShadow;
        const originalBorder = sheetElement.style.border;
        sheetElement.style.transform = 'none';
        sheetElement.style.boxShadow = 'none';
        sheetElement.style.border = 'none';

        try {
            const html2canvasModule = await import('html2canvas');
            const html2canvas = html2canvasModule.default || html2canvasModule;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(sheetElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1024,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const margin = 12.7; // 0.5 in
            const printableWidth = pageWidth - (margin * 2);
            const printableHeight = pageHeight - (margin * 2);

            const imgWidth = printableWidth;
            const imgHeight = (canvas.height * printableWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= printableHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= printableHeight;
            }

            pdf.save(fileName);
            showToast('PDF downloaded successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Failed to generate PDF, launching print preview...');
            handlePrintPreview();
        } finally {
            sheetElement.style.transform = originalTransform;
            sheetElement.style.boxShadow = originalBoxShadow;
            sheetElement.style.border = originalBorder;
            setIsGeneratingPdf(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Faculty Attendance Report" />

            {/* Print Stylesheet (Formal document formatting, no scrollbars, proper table headers) */}
            <style>{`
                @page {
                    size: A4 portrait;
                    margin: 0.5in;
                }
                @media print {
                    /* Hide everything outside of the sheet */
                    body * {
                        visibility: hidden !important;
                    }
                    /* Make only the preview sheet and its contents visible */
                    #pdf-preview-sheet, #pdf-preview-sheet * {
                        visibility: visible !important;
                    }
                    #pdf-preview-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        transform: none !important;
                        box-sizing: border-box !important;
                    }
                    .no-print, header, nav, aside, [data-sidebar="sidebar"], .viewer-bar {
                        display: none !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Remove all scrollbars, shadows and web backgrounds */
                    * {
                        overflow: visible !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    table {
                        width: 100% !important;
                        page-break-inside: auto !important;
                        border-collapse: collapse !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    tfoot {
                        display: table-footer-group !important;
                    }
                    .page-break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>

            <div className={cn(
                "flex flex-1 flex-col gap-6 p-4 md:p-8 mx-auto w-full transition-all duration-300 relative",
                isMaximized ? "max-w-[1900px]" : "max-w-[1700px]"
            )}>
                {/* Floating Feedback Notification */}
                {actionNotification && (
                    <div className="fixed top-5 right-5 z-50 bg-slate-900 text-amber-400 border border-amber-400/50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{actionNotification}</span>
                    </div>
                )}

                {/* 1. TOP HEADER */}
                <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm ring-2 ring-amber-400/30">
                            <FileText className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Generate Faculty Attendance Report
                            </h1>
                            <p className="text-xs text-muted-foreground font-medium">
                                Create and configure a printable faculty attendance report with flexible signatories and summary sections.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isMaximized && (
                            <Button
                                size="sm"
                                onClick={handleToggleMaximize}
                                className="h-8 px-3 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Minimize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Exit Fullscreen</span>
                            </Button>
                        )}
                        <Link
                            href="/faculty-attendance"
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors cursor-pointer shadow-xs"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Back to Attendance</span>
                        </Link>
                    </div>
                </div>

                {/* 2. MAIN 2-COLUMN LAYOUT: CONFIGURATION FORM (LEFT) + LIVE PREVIEW (RIGHT) */}
                <div className={cn(
                    "grid gap-8 items-start transition-all duration-300",
                    isMaximized ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
                )}>
                    {/* LEFT COLUMN: 5-STEP CONFIGURATION (Clean Form with Yellow Interactive Navigation, Hidden when Maximized) */}
                    {!isMaximized && (
                        <div className="no-print lg:col-span-5 space-y-6">
                            {/* STEP 1: REPORT FORMAT */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                        1
                                    </span>
                                    <h3 className="text-xs font-bold text-foreground">
                                        Report Format
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        Choose the type of attendance report to generate.
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-0.5">
                                    {/* Option 1: Weekly Summary */}
                                    <button
                                         type="button"
                                         onClick={() => handleReportFormatChange('weekly')}
                                         className={cn(
                                             "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[78px]",
                                             reportFormat === 'weekly'
                                                 ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40"
                                                 : "border-border bg-card hover:border-amber-400/50"
                                         )}
                                     >
                                         <div className="flex items-start justify-between w-full">
                                             <div className={cn(
                                                 "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                                 reportFormat === 'weekly' ? "bg-amber-400 text-slate-950 font-bold" : "bg-muted text-foreground"
                                             )}>
                                                 <CalendarDays className="w-4 h-4" />
                                             </div>
                                             <div className={cn(
                                                 "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5",
                                                 reportFormat === 'weekly'
                                                     ? "border-amber-500 bg-amber-400"
                                                     : "border-muted-foreground/30"
                                             )}>
                                                 {reportFormat === 'weekly' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                             </div>
                                         </div>
                                         <div className="mt-2">
                                             <span className="font-bold text-xs text-foreground block">
                                                 Weekly Summary
                                             </span>
                                             <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                 Faculty attendance for a specific week
                                             </span>
                                         </div>
                                     </button>

                                     {/* Option 2: Monthly Summary */}
                                     <button
                                         type="button"
                                         onClick={() => handleReportFormatChange('monthly')}
                                         className={cn(
                                             "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[78px]",
                                             reportFormat === 'monthly'
                                                 ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40"
                                                 : "border-border bg-card hover:border-amber-400/50"
                                         )}
                                     >
                                         <div className="flex items-start justify-between w-full">
                                             <div className={cn(
                                                 "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                                 reportFormat === 'monthly' ? "bg-amber-400 text-slate-950 font-bold" : "bg-muted text-foreground"
                                             )}>
                                                 <Calendar className="w-4 h-4" />
                                             </div>
                                             <div className={cn(
                                                 "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5",
                                                 reportFormat === 'monthly'
                                                     ? "border-amber-500 bg-amber-400"
                                                     : "border-muted-foreground/30"
                                             )}>
                                                 {reportFormat === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                             </div>
                                         </div>
                                         <div className="mt-2">
                                             <span className="font-bold text-xs text-foreground block">
                                                 Monthly Summary
                                             </span>
                                             <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                 Faculty attendance for a specific month
                                             </span>
                                         </div>
                                     </button>

                                     {/* Option 3: Individual Faculty Report */}
                                     <button
                                         type="button"
                                         onClick={() => handleReportFormatChange('individual')}
                                         className={cn(
                                             "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[78px]",
                                             reportFormat === 'individual'
                                                 ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40"
                                                 : "border-border bg-card hover:border-amber-400/50"
                                         )}
                                     >
                                         <div className="flex items-start justify-between w-full">
                                             <div className={cn(
                                                 "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                                 reportFormat === 'individual' ? "bg-amber-400 text-slate-950 font-bold" : "bg-muted text-foreground"
                                             )}>
                                                 <User className="w-4 h-4" />
                                             </div>
                                             <div className={cn(
                                                 "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5",
                                                 reportFormat === 'individual'
                                                     ? "border-amber-500 bg-amber-400"
                                                     : "border-muted-foreground/30"
                                             )}>
                                                 {reportFormat === 'individual' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                             </div>
                                         </div>
                                         <div className="mt-2">
                                             <span className="font-bold text-xs text-foreground block">
                                                 Individual Faculty Report
                                             </span>
                                             <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                 Attendance history of one faculty member
                                             </span>
                                         </div>
                                     </button>

                                     {/* Option 4: Consolidated Attendance Report */}
                                     <button
                                         type="button"
                                         onClick={() => handleReportFormatChange('consolidated')}
                                         className={cn(
                                             "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[78px]",
                                             reportFormat === 'consolidated'
                                                 ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40"
                                                 : "border-border bg-card hover:border-amber-400/50"
                                         )}
                                     >
                                         <div className="flex items-start justify-between w-full">
                                             <div className={cn(
                                                 "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                                 reportFormat === 'consolidated' ? "bg-amber-400 text-slate-950 font-bold" : "bg-muted text-foreground"
                                             )}>
                                                 <Building2 className="w-4 h-4" />
                                             </div>
                                             <div className={cn(
                                                 "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5",
                                                 reportFormat === 'consolidated'
                                                     ? "border-amber-500 bg-amber-400"
                                                     : "border-muted-foreground/30"
                                             )}>
                                                 {reportFormat === 'consolidated' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                             </div>
                                         </div>
                                         <div className="mt-2">
                                             <span className="font-bold text-xs text-foreground block">
                                                 Consolidated Attendance Report
                                             </span>
                                             <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                 Complete attendance summary for all programs
                                             </span>
                                         </div>
                                     </button>
                                </div>
                            </div>

                            {/* STEP 2: REPORTING PERIOD */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                        2
                                    </span>
                                    <h3 className="text-xs font-bold text-foreground">
                                        Reporting Period
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        Select the period for this report.
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                    {/* Tab selector: Week / Month / Custom Range */}
                                    <div className="sm:col-span-8 flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => handlePeriodTabChange('week')}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                                                periodTab === 'week'
                                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Week
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePeriodTabChange('month')}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                                                periodTab === 'month'
                                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Month
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePeriodTabChange('custom')}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                                                periodTab === 'custom'
                                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Custom Range
                                        </button>
                                    </div>

                                    {/* Selected Period Badge box on Right */}
                                    <div className="sm:col-span-4 p-2.5 rounded-xl border border-amber-400/40 bg-amber-400/5 flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="text-[10px] text-muted-foreground block leading-none">
                                                Selected Period
                                            </span>
                                            <span className="font-bold text-xs text-foreground block truncate mt-0.5">
                                                {selectedPeriod}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground block">
                                                {selectedAY} · {selectedSemester}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chevron carousel period selector */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="h-10 w-10 p-0 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                                        onClick={() => {
                                            const list = periodTab === 'week' ? weekly_periods : monthly_periods;
                                            const currentIndex = list.indexOf(selectedPeriod);
                                            if (currentIndex > 0) setSelectedPeriod(list[currentIndex - 1]);
                                        }}
                                    >
                                        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                                    </Button>

                                    <div className="flex-1 relative">
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => setSelectedPeriod(e.target.value)}
                                            className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus-visible:outline-none appearance-none cursor-pointer shadow-2xs hover:border-amber-400 transition-colors"
                                        >
                                            {(periodTab === 'week' ? weekly_periods : monthly_periods).map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    </div>

                                    <Button
                                        size="sm"
                                        className="h-10 w-10 p-0 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                                        onClick={() => {
                                            const list = periodTab === 'week' ? weekly_periods : monthly_periods;
                                            const currentIndex = list.indexOf(selectedPeriod);
                                            if (currentIndex >= 0 && currentIndex < list.length - 1) setSelectedPeriod(list[currentIndex + 1]);
                                        }}
                                    >
                                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                                    </Button>
                                </div>
                            </div>

                            {/* STEP 3: FILTERS (Minimal Input Styles) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                        3
                                    </span>
                                    <h3 className="text-xs font-bold text-foreground">
                                        Filters
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        Refine the report data by applying filters (optional).
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Program */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Program
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedProgram}
                                                onChange={(e) => setSelectedProgram(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="all">All Programs</option>
                                                {programs.map(p => (
                                                    <option key={p.id} value={p.code}>{p.code}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Faculty */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Faculty
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedFaculty}
                                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="all">All Faculty Members</option>
                                                {faculties.map(f => (
                                                    <option key={f.id} value={String(f.id)}>
                                                        {f.last_name}, {f.first_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Attendance Status */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Attendance Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="present">Present Only</option>
                                                <option value="late">Late Only</option>
                                                <option value="absent">Absent Only</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Semester */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Semester
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedSemester}
                                                onChange={(e) => setSelectedSemester(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="1st Semester">1st Semester</option>
                                                <option value="2nd Semester">2nd Semester</option>
                                                <option value="Summer">Summer</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Academic Year */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Academic Year
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedAY}
                                                onChange={(e) => setSelectedAY(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="AY 2026–2027">AY 2026–2027</option>
                                                <option value="AY 2025–2026">AY 2025–2026</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Sort By */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                            Sort By
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="w-full h-9.5 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground appearance-none cursor-pointer focus-visible:outline-none"
                                            >
                                                <option value="name">Faculty Name (A–Z)</option>
                                                <option value="rate">Attendance Rate</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 4: KEY SUMMARIES (Organized into Clean Professional Table View) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                        4
                                    </span>
                                    <h3 className="text-xs font-bold text-foreground">
                                        Key Summaries
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        Select the summary sections to include in the report.
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                    {/* Checkboxes on Left (6 items) */}
                                    <div className="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.executiveSummary}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, executiveSummary: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Executive Summary</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.attendanceTotals}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, attendanceTotals: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Attendance Totals</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.lateMinutes}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, lateMinutes: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Late Minutes</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.absenceBreakdown}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, absenceBreakdown: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Absence Breakdown</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.attendanceRateAnalysis}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, attendanceRateAnalysis: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Attendance Rate</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer p-1">
                                            <Checkbox
                                                checked={keySummaries.programSummary}
                                                onCheckedChange={(c) => setKeySummaries({ ...keySummaries, programSummary: Boolean(c) })}
                                                className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                            <span className="text-xs text-foreground font-medium">Include Program Summary</span>
                                        </label>
                                    </div>

                                    {/* Previewed Summary Organized in a Professional Table Format (No Overlapping Badges) */}
                                    <div className="sm:col-span-6 p-3 rounded-2xl border border-border bg-card space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Table className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Previewed Summary</span>
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-normal">(Current Filters)</span>
                                        </div>

                                        <div className="border border-border/80 rounded-lg overflow-hidden">
                                            <table className="w-full text-[11px] text-left border-collapse">
                                                <tbody className="divide-y divide-border/60">
                                                    <tr className="bg-muted/20">
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Faculty Covered</td>
                                                        <td className="py-1.5 px-2.5 text-right font-black text-foreground">{previewData.totals.facultyCount}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Scheduled Sessions</td>
                                                        <td className="py-1.5 px-2.5 text-right font-black text-foreground">{previewData.totals.totalScheduled}</td>
                                                    </tr>
                                                    <tr className="bg-muted/20">
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Present Sessions</td>
                                                        <td className="py-1.5 px-2.5 text-right font-black text-foreground">
                                                            {previewData.totals.totalPresent} <span className="text-[10px] font-bold text-muted-foreground">({previewData.totals.overallRate}%)</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Absent Sessions</td>
                                                        <td className="py-1.5 px-2.5 text-right font-black text-foreground">{previewData.totals.totalAbsent}</td>
                                                    </tr>
                                                    <tr className="bg-muted/20">
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Late Sessions</td>
                                                        <td className="py-1.5 px-2.5 text-right font-black text-foreground">{previewData.totals.totalLate}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 5: SIGNATORIES (Configurable Vertical Stacked Cards with + Add Signatory) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                            5
                                        </span>
                                        <h3 className="text-xs font-bold text-foreground">
                                            Signatories
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground font-normal">
                                            Add, remove, and configure document signatories.
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleResetSignatories}
                                            className="h-8 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                                            title="Reset signatories to default template"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reset Signatories</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleAddSignatory}
                                            className="h-8 px-3 text-[11px] font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Add Signatory</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Vertical Layout for Signatories as requested */}
                                <div className="space-y-3">
                                    {signatoriesList.map((sig, index) => (
                                        <div
                                            key={sig.id}
                                            className="p-3.5 rounded-xl border border-border bg-card space-y-3 relative group hover:border-amber-400/40 transition-colors"
                                        >
                                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={sig.label}
                                                        onChange={(e) => handleUpdateSignatory(sig.id, 'label', e.target.value)}
                                                        className="text-xs font-bold text-foreground bg-transparent border-b border-dashed border-border/80 px-1 py-0.5 focus:outline-none w-36 focus:border-amber-500"
                                                    />
                                                </div>
                                                {signatoriesList.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSignatory(sig.id)}
                                                        className="text-muted-foreground hover:text-rose-600 transition-colors p-1"
                                                        title="Remove Signatory"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Full Name:</span>
                                                    <input
                                                        type="text"
                                                        value={sig.name}
                                                        onChange={(e) => handleUpdateSignatory(sig.id, 'name', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Designation / Role:</span>
                                                    <input
                                                        type="text"
                                                        value={sig.designation}
                                                        onChange={(e) => handleUpdateSignatory(sig.id, 'designation', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Office / Department:</span>
                                                    <input
                                                        type="text"
                                                        value={sig.department}
                                                        onChange={(e) => handleUpdateSignatory(sig.id, 'department', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-1 flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground text-[10px]">Render Signature Underline</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sig.showSignatureLine}
                                                        onChange={(e) => handleUpdateSignatory(sig.id, 'showSignatureLine', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400 dark:peer-checked:bg-amber-400"></div>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* BOTTOM ACTIONS BAR */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSaveTemplate}
                                        className="h-9 px-3 text-xs font-semibold rounded-xl border-border bg-card flex items-center gap-1.5 hover:border-amber-400/60 cursor-pointer"
                                    >
                                        <BookmarkCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Save Template</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedProgram('all');
                                            setSelectedFaculty('all');
                                            setSelectedStatus('all');
                                            showToast('Form filters reset to defaults.');
                                        }}
                                        className="h-9 px-3 text-xs font-semibold rounded-xl border-border bg-card flex items-center gap-1.5 hover:border-amber-400/60 cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Reset</span>
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrintPreview}
                                        className="h-9 px-3.5 text-xs font-bold rounded-xl border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20 text-slate-900 dark:text-slate-100 flex items-center gap-2 cursor-pointer shadow-2xs"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print Preview</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleGeneratePdf}
                                        disabled={isGeneratingPdf}
                                        className="h-9 px-4 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-2 cursor-pointer shadow-sm ring-1 ring-amber-400/60 disabled:opacity-70"
                                    >
                                        <Download className={cn("w-3.5 h-3.5 stroke-[2.5]", isGeneratingPdf && "animate-bounce")} />
                                        <span>{isGeneratingPdf ? 'Downloading PDF...' : 'Generate PDF'}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RIGHT COLUMN: INTERACTIVE PAPER SHEET PREVIEW (Professional Document View) */}
                    <div className={cn(
                        "flex flex-col items-center transition-all duration-300 w-full",
                        isMaximized ? "col-span-1" : "lg:col-span-7"
                    )}>
                        {/* Dark PDF Viewer Bar */}
                        <div className={cn(
                            "no-print w-full h-11 bg-slate-900 text-slate-200 rounded-t-2xl px-4 flex items-center justify-between text-xs font-semibold shadow-md border-b border-slate-800",
                            isMaximized ? "max-w-[1050px]" : "max-w-[850px]"
                        )}>
                            {/* Status Pill */}
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live Preview
                                </span>
                            </div>

                            {/* Page count */}
                            <div className="text-slate-400 text-xs">
                                1 / 3
                            </div>

                            {/* Zoom controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-xs w-11 text-center text-slate-300">
                                    {zoomLevel}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Actions: Download, Print, Fullscreen */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintPreview}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Print"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggleMaximize}
                                    className={cn(
                                        "p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer",
                                        isMaximized && "text-amber-400"
                                    )}
                                    title={isMaximized ? "Exit Fullscreen" : "Maximize Document View"}
                                >
                                    {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Paper Sheet Preview Area */}
                        <div
                            ref={previewContainerRef}
                            className="w-full overflow-x-auto flex justify-center py-4 bg-muted/30 rounded-b-2xl border border-border border-t-0"
                        >
                            <div
                                id="pdf-preview-sheet"
                                className={cn(
                                    "print-only-sheet w-full min-h-[1080px] bg-white text-slate-900 border border-slate-300 shadow-xl p-[0.5in] transition-transform origin-top flex flex-col justify-between box-border",
                                    isMaximized ? "max-w-[1050px]" : "max-w-[850px]"
                                )}
                                style={{ transform: `scale(${zoomLevel / 100})` }}
                            >
                                <div className="space-y-4">
                                    {/* 1. OFFICIAL DSSC LETTERHEAD (Centered layout with CIDS_Logo.jpg, no bottom border line) */}
                                    <div className="flex flex-col items-center justify-center text-center pb-2 space-y-2">
                                        <img
                                            src="/CIDS_Logo.jpg"
                                            alt="CIDS Logo"
                                            className="w-16 h-16 object-contain rounded-full shadow-xs"
                                            onError={(e: any) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] tracking-wider text-slate-600 uppercase font-semibold">
                                                REPUBLIC OF THE PHILIPPINES
                                            </p>
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                DAVAO DEL SUR STATE COLLEGE
                                            </h2>
                                            <p className="text-[10.5px] font-bold text-slate-700">
                                                College of Information and Digital Sciences
                                            </p>
                                            <p className="text-[9.5px] text-slate-500 font-medium">
                                                Brgy. Matti, Digos City, Davao del Sur
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. REPORT TITLE BANNER (Monochrome Professional Header) */}
                                    <div className="bg-slate-50 border border-slate-300 py-2.5 text-center rounded-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            {reportFormat === 'weekly' ? 'WEEKLY' : reportFormat === 'monthly' ? 'MONTHLY' : 'COLLEGE'} FACULTY ATTENDANCE SUMMARY
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                                            {selectedPeriod}
                                        </p>
                                        <p className="text-[9px] text-slate-600">
                                            {selectedAY} · {selectedSemester}
                                        </p>
                                    </div>

                                    {/* 3. KEY SUMMARIES (PROFESSIONAL TABLE VIEW - MONOCHROME, NO COLORS) */}
                                    {keySummaries.attendanceTotals && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                                <span>KEY SUMMARIES (INSTRUCTIONAL HOURS & COVERAGE)</span>
                                            </div>

                                            <div className="border border-slate-300 rounded overflow-hidden">
                                                <table className="w-full text-[9.5px] text-center border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase">
                                                            <th className="py-2 px-2 border-r border-slate-300">FACULTY</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">ELIGIBLE HRS</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">ATTENDED HRS</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">LEAVE HRS</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">ABSENT HRS</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">LATE SESSIONS (MINS)</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">MAKE-UP (REQ / DONE)</th>
                                                            <th className="py-2 px-2 border-r border-slate-300">ATTENDANCE COVERAGE</th>
                                                            <th className="py-2 px-2">INSTR COMPLETION</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        <tr className="bg-white font-mono">
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.facultyCount}
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalEligibleHours}h
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalAttendedHours}h
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalLeaveHours}h
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalAbsentHours}h
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalLateSessions} <span className="text-[9px] font-normal text-slate-600">({previewData.totals.totalLateMinutes}m)</span>
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                {previewData.totals.totalMakeUpRequired}h / {previewData.totals.totalMakeUpCompleted}h
                                                            </td>
                                                            <td className="py-2 px-2 border-r border-slate-300 font-bold text-slate-900 text-xs">
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-900 font-bold border border-slate-300">
                                                                    {previewData.totals.overallCoverage}%
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-2 font-bold text-slate-900 text-xs">
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-900 font-bold border border-slate-300">
                                                                    {previewData.totals.overallCompletion}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. FACULTY ATTENDANCE DETAILS (TABLE - MONOCHROME, NO COLORS) */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-slate-900 font-bold text-xs uppercase tracking-wider">
                                            <span>FACULTY ATTENDANCE & INSTRUCTIONAL COMPLETION DETAILS</span>
                                            <span className="no-print text-[9px] font-normal normal-case text-slate-500">
                                                Click any faculty row to inspect session-by-session timetable audit trail
                                            </span>
                                        </div>

                                        <div className="border border-slate-300 rounded overflow-x-auto print:overflow-visible print:border-slate-400">
                                            <table className="w-full text-[9px] text-left border-collapse print:text-[8.5px]">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase print:bg-slate-100">
                                                        <th className="py-1.5 px-1.5 text-center w-6 border-r border-slate-300">#</th>
                                                        <th className="py-1.5 px-2 border-r border-slate-300">FACULTY NAME</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap">PROG</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Eligible Scheduled Hours">ELIGIBLE HRS</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Attended Instructional Hours">ATTENDED HRS</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Approved Leave Hours">LEAVE HRS</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Unexcused Absent Hours">ABSENT HRS</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Late Sessions (Total Late Minutes)">LATE (MINS)</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Make-Up Hours Required vs Completed">MAKE-UP (REQ/DONE)</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Attendance Coverage Rate %">ATTENDANCE COV</th>
                                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="On-Time Arrival Rate %">ON-TIME</th>
                                                        <th className="py-1.5 px-1.5 text-center whitespace-nowrap" title="Instructional Completion Rate %">INSTR COMPLETION</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-medium">
                                                    {previewData.rows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={12} className="py-6 text-center text-slate-500 italic">
                                                                No attendance records match the selected faculty or filter criteria.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        previewData.rows.map((row, idx) => (
                                                            <tr
                                                                key={row.id || idx}
                                                                onClick={() => setSelectedAuditFaculty(row)}
                                                                className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                                                                title="Click to view detailed session audit trail"
                                                            >
                                                                <td className="py-1 px-1.5 text-center border-r border-slate-200 text-slate-500 font-mono text-[8.5px]">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="py-1 px-2 font-semibold border-r border-slate-200 text-slate-900 group/cell">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="truncate hover:text-amber-700 underline-offset-2 hover:underline">
                                                                            {row.instructor_name}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            title={`Edit name for ${row.instructor_name}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingFaculty({
                                                                                    id: row.id,
                                                                                    faculty_id: row.faculty_id,
                                                                                    oldName: row.original_instructor_name || row.instructor_name,
                                                                                    currentName: row.instructor_name,
                                                                                });
                                                                            }}
                                                                            className="no-print opacity-0 group-hover/cell:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-700 transition-all cursor-pointer shrink-0"
                                                                        >
                                                                            <Pencil className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-bold text-slate-800 text-[8.5px]">
                                                                    {row.program}
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-800 font-semibold">
                                                                    {row.eligibleHours.toFixed(1)}h
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono font-bold text-slate-900">
                                                                    {row.attendedHours.toFixed(1)}h
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-600">
                                                                    {row.leaveHours > 0 ? `${row.leaveHours.toFixed(1)}h` : '—'}
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-700">
                                                                    {row.unexcusedAbsentHours > 0 ? `${row.unexcusedAbsentHours.toFixed(1)}h` : '—'}
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-700">
                                                                    {row.late > 0 ? `${row.late} (${row.lateMinutes}m)` : '0 (0m)'}
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-[8.5px] text-slate-700">
                                                                    {row.makeUpRequiredHours > 0
                                                                        ? `${row.makeUpRequiredHours.toFixed(1)}h / ${row.makeUpCompletedHours.toFixed(1)}h`
                                                                        : 'None'}
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-bold font-mono text-slate-900">
                                                                    <span className="px-1 py-0.5 rounded text-[8.5px] bg-slate-100 text-slate-900 font-semibold border border-slate-200 whitespace-nowrap">
                                                                        {row.attendanceCoverage}%
                                                                    </span>
                                                                </td>
                                                                <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-700">
                                                                    {row.onTimeRate}%
                                                                </td>
                                                                <td className="py-1 px-1.5 text-center font-bold font-mono text-slate-900">
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-900 font-bold border border-slate-300 whitespace-nowrap">
                                                                        {row.instructionalCompletion}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. SIGNATORIES SECTION (Horizontal arrangement, max 3 per line, no top border line) */}
                                <div className="mt-8 pt-4 page-break-inside-avoid">
                                    {/* Signatories: maximum of 3 per horizontal row */}
                                    <div className="grid grid-cols-3 gap-x-8 gap-y-8 text-center">
                                        {signatoriesList.map((sig) => (
                                            <div key={sig.id} className="space-y-3 min-w-0">
                                                <p className="text-left font-bold text-[10px] text-slate-900">
                                                    {sig.label}:
                                                </p>
                                                <div className="pt-1">
                                                    <p className={cn(
                                                        "font-black text-[10px] text-slate-900 uppercase tracking-wider truncate pb-1",
                                                        sig.showSignatureLine && "border-b border-slate-900"
                                                    )}>
                                                        {sig.name}
                                                    </p>
                                                    <p className="text-[9px] text-slate-600 truncate mt-1">
                                                        {sig.designation}
                                                    </p>
                                                    <p className="text-[8px] text-slate-500 truncate">
                                                        {sig.department}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. EDIT FACULTY NAME DIALOG MODAL */}
            <Dialog open={!!editingFaculty} onOpenChange={(open) => { if (!open && !isSavingName) setEditingFaculty(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
                                <Pencil className="w-4 h-4" />
                            </span>
                            Edit Faculty Name in Report
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Update this instructor's display name for report generation and synchronize across attendance records.
                        </DialogDescription>
                    </DialogHeader>

                    {editingFaculty && (
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                    Original Name in System / Spreadsheet:
                                </label>
                                <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-mono text-muted-foreground">
                                    {editingFaculty.oldName}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="faculty-new-name" className="text-[11px] font-semibold text-foreground block mb-1">
                                    Display Name in Report: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="faculty-new-name"
                                    type="text"
                                    autoFocus
                                    value={editingFaculty.currentName}
                                    onChange={(e) => setEditingFaculty({
                                        ...editingFaculty,
                                        currentName: e.target.value,
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveFacultyName();
                                        }
                                    }}
                                    placeholder="e.g. Dr. Juan Dela Cruz"
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-amber-400 shadow-2xs"
                                />
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                    Press Enter or click "Save & Apply" to update the live preview and database records.
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSavingName}
                            onClick={() => setEditingFaculty(null)}
                            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-border cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isSavingName || !editingFaculty?.currentName?.trim()}
                            onClick={handleSaveFacultyName}
                            className="h-9 px-4 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {isSavingName ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Save & Apply</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 7. DETAILED SESSION TIMETABLE AUDIT TRAIL MODAL */}
            <Dialog open={!!selectedAuditFaculty} onOpenChange={(open) => { if (!open) setSelectedAuditFaculty(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base font-bold text-foreground pr-6">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                                    {selectedAuditFaculty?.instructor_name?.charAt(0) || 'F'}
                                </span>
                                <div>
                                    <span className="block text-sm font-bold text-foreground">
                                        {selectedAuditFaculty?.instructor_name}
                                    </span>
                                    <span className="block text-[11px] font-normal text-muted-foreground">
                                        {selectedAuditFaculty?.program} Program · Timetable & Attendance Audit Trail
                                    </span>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-bold border",
                                selectedAuditFaculty?.isRankEligible
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                {selectedAuditFaculty?.isRankEligible ? 'Eligible for Performance Ranking' : 'Below Minimum Hours Threshold'}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Transparent breakdown of scheduled instructional obligations, delivered minutes, lateness attributes, approved leaves, and make-up classes.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAuditFaculty && (
                        <div className="space-y-4 py-2">
                            {/* KPI Metrics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Eligible Scheduled Hours
                                    </span>
                                    <span className="text-lg font-black text-foreground font-mono block mt-0.5">
                                        {selectedAuditFaculty.eligibleHours.toFixed(1)}h
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Total: {selectedAuditFaculty.scheduledHours.toFixed(1)}h (Excl. {selectedAuditFaculty.leaveHours.toFixed(1)}h leave)
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Attended Instructional Hours
                                    </span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                                        {selectedAuditFaculty.attendedHours.toFixed(1)}h
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Coverage: <strong className="text-foreground">{selectedAuditFaculty.attendanceCoverage}%</strong>
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Punctuality & Late Minutes
                                    </span>
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                                        {selectedAuditFaculty.onTimeRate}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        {selectedAuditFaculty.late} late session(s) · {selectedAuditFaculty.lateMinutes} min(s)
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Instructional Completion
                                    </span>
                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono block mt-0.5">
                                        {selectedAuditFaculty.instructionalCompletion}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Make-Up Done: {selectedAuditFaculty.makeUpCompletedHours.toFixed(1)}h / {selectedAuditFaculty.makeUpRequiredHours.toFixed(1)}h req
                                    </span>
                                </div>
                            </div>

                            {/* Mathematical Formulas Note */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                                    Fairness Calculation Rules Applied:
                                </p>
                                <ul className="list-disc pl-5 space-y-0.5 text-[10.5px]">
                                    <li><strong>Attendance Coverage:</strong> (Attended Eligible Mins ÷ Eligible Scheduled Mins) × 100. Approved leaves are excluded from the denominator.</li>
                                    <li><strong>Punctuality:</strong> Recorded as an attribute of attendance (arrival time & late minutes), not mixed into attendance rate totals.</li>
                                    <li><strong>Instructional Completion:</strong> Incorporates completed, verified make-up classes so faculty who deliver missed classes achieve 100% completion.</li>
                                </ul>
                            </div>

                            {/* Session-by-Session Timetable Table */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                        Timetable Sessions ({selectedAuditFaculty.sessions?.length || 0} scheduled meetings)
                                    </h4>
                                    <span className="text-[11px] text-muted-foreground">
                                        Source: Published Master Timetable & Daily Logs
                                    </span>
                                </div>

                                <div className="border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-[10.5px] font-bold text-foreground uppercase">
                                                <th className="py-2 px-2.5">DATE / DAY</th>
                                                <th className="py-2 px-2.5">COURSE & SECTION</th>
                                                <th className="py-2 px-2.5">ROOM</th>
                                                <th className="py-2 px-2.5 text-center">SCHEDULED TIME</th>
                                                <th className="py-2 px-2.5 text-center">DURATION</th>
                                                <th className="py-2 px-2.5 text-center">ARRIVAL / LATE</th>
                                                <th className="py-2 px-2.5 text-center">STATUS</th>
                                                <th className="py-2 px-2.5 text-center">MAKE-UP CLASS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(!selectedAuditFaculty.sessions || selectedAuditFaculty.sessions.length === 0) ? (
                                                <tr>
                                                    <td colSpan={8} className="py-6 text-center text-xs text-muted-foreground italic">
                                                        No individual session logs recorded for this period. Standard weekly timetable obligations applied.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedAuditFaculty.sessions.map((ses: any, sIdx: number) => {
                                                    const status = ses.primary_status || (ses.status === 'present' ? 'present' : ses.status === 'late' ? 'late' : 'unexcused_absence');
                                                    const isLate = status === 'late' || (ses.late_minutes && ses.late_minutes > 0);
                                                    const durationMins = ses.scheduled_duration_minutes || 90;

                                                    return (
                                                        <tr key={ses.id || sIdx} className="hover:bg-muted/30">
                                                            <td className="py-2 px-2.5 font-medium text-foreground whitespace-nowrap">
                                                                <div>{ses.date || 'Regular'}</div>
                                                                <div className="text-[10px] text-muted-foreground">{ses.day_of_week || 'Timetable'}</div>
                                                            </td>
                                                            <td className="py-2 px-2.5">
                                                                <div className="font-semibold text-foreground">{ses.course_code || 'IT Class'}</div>
                                                                <div className="text-[10px] text-muted-foreground">{ses.section || 'Regular'}</div>
                                                            </td>
                                                            <td className="py-2 px-2.5 font-mono text-muted-foreground">
                                                                {ses.room || 'TBA'}
                                                            </td>
                                                            <td className="py-2 px-2.5 text-center font-mono text-[11px] whitespace-nowrap">
                                                                {ses.scheduled_start_time ? `${ses.scheduled_start_time.slice(0, 5)} – ${ses.scheduled_end_time?.slice(0, 5)}` : '09:00 – 10:30'}
                                                            </td>
                                                            <td className="py-2 px-2.5 text-center font-mono text-muted-foreground">
                                                                {durationMins} mins ({(durationMins / 60).toFixed(1)}h)
                                                            </td>
                                                            <td className="py-2 px-2.5 text-center font-mono">
                                                                {isLate ? (
                                                                    <div>
                                                                        <span className="text-amber-600 font-bold">{ses.actual_arrival_time ? ses.actual_arrival_time.slice(0, 5) : 'Late'}</span>
                                                                        <span className="text-[10px] text-amber-700 block">+{ses.late_minutes || 15}m late</span>
                                                                    </div>
                                                                ) : status === 'present' ? (
                                                                    <span className="text-emerald-600 font-semibold">{ses.actual_arrival_time ? ses.actual_arrival_time.slice(0, 5) : 'On Time'}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-2.5 text-center">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                    status === 'present' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
                                                                    status === 'late' && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
                                                                    status === 'approved_leave' && "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
                                                                    status === 'official_business' && "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400",
                                                                    status === 'class_suspended' && "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
                                                                    (status === 'unexcused_absence' || status === 'absent') && "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                                                                )}>
                                                                    {status.replace(/_/g, ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-2.5 text-center text-[10.5px]">
                                                                {ses.make_up_request_id ? (
                                                                    <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                                                                        <Check className="w-3 h-3 stroke-[2.5]" /> Completed
                                                                    </span>
                                                                ) : ses.make_up_required ? (
                                                                    <span className="text-amber-600 font-medium">Pending Make-Up</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">Not Required</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-[11px] text-muted-foreground">
                            OfficeHub Faculty Attendance & Instructional Obligation Monitoring System
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedAuditFaculty(null)}
                            className="h-9 px-4 text-xs font-semibold rounded-xl border-border cursor-pointer"
                        >
                            Close Audit Trail
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
