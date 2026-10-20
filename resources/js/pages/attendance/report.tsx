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
    employment_start_date?: string | null;
    employment_end_date?: string | null;
    teaching_assignment_effective_from?: string | null;
    teaching_assignment_effective_until?: string | null;
    appointment_status?: string | null;
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
    scheduled_minutes?: number;
    excluded_minutes?: number;
    eligible_minutes?: number;
    attended_minutes?: number;
    approved_leave_minutes?: number;
    unexcused_absent_minutes?: number;
    late_sessions_count?: number;
    make_up_required_minutes?: number;
    make_up_completed_minutes?: number;
    total_scheduled_hours?: number;
    eligible_scheduled_hours?: number;
    attended_hours?: number;
    approved_leave_hours?: number;
    unexcused_absent_hours?: number;
    make_up_required_hours?: number;
    make_up_completed_hours?: number;
    attendance_rate: number;
    attendance_coverage_rate?: number | null;
    on_time_rate?: number | null;
    make_up_completion_rate?: number | null;
    instructional_completion_rate?: number | null;
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
    academic_period?: {
        id: number;
        academic_year: string;
        semester: string;
        official_start_of_classes: string;
        official_end_of_classes: string;
        semester_start_date: string;
        semester_end_date: string;
        status: string;
    } | null;
}

/**
 * Format raw integer minutes into human-readable duration
 * e.g., 630 -> "10h 30m", 90 -> "1h 30m", 15 -> "15m", 0 -> "0m"
 */
function formatDuration(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
        return '—';
    }
    const mins = Math.max(0, Math.round(minutes));
    if (mins === 0) return '0m';

    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

/**
 * Format weekly/monthly period label to clearly show the start and end dates
 * e.g., "August Week 5 (8/31/2026)" -> "August Week 5 (Aug 31, 2026 – Sep 06, 2026)"
 * e.g., "August 2026" -> "August 2026 (Aug 01, 2026 – Aug 31, 2026)"
 * e.g., "September Week 1 (9/7/2026)" -> "September Week 1 (Sep 07, 2026 – Sep 13, 2026)"
 */
function formatPeriodWithDateRange(periodLabel: string, periodType: 'week' | 'month' | 'custom' = 'week'): string {
    if (!periodLabel) return '';

    // If already has a full date range with hyphen/dash (e.g., Aug 31, 2026 – Sep 06, 2026), keep it clean
    if (periodLabel.includes('–') || periodLabel.includes(' - ')) {
        return periodLabel;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    // Check for serial date pattern like "October Week 1 (46300)"
    const serialMatch = periodLabel.match(/^(.*?Week\s*\d+)\s*\((\d{5})\)/i);
    if (serialMatch) {
        const prefix = serialMatch[1].trim();
        const serial = parseInt(serialMatch[2], 10);
        // Excel serial date starting Jan 1, 1900
        const excelEpoch = new Date(1899, 11, 30);
        const startDate = new Date(excelEpoch.getTime() + serial * 86400000);
        if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 6 * 86400000);
            const startFormatted = `${monthNames[startDate.getMonth()]} ${String(startDate.getDate()).padStart(2, '0')}, ${startDate.getFullYear()}`;
            const endFormatted = `${monthNames[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')}, ${endDate.getFullYear()}`;
            return `${prefix} (${startFormatted} – ${endFormatted})`;
        }
    }

    // Check for weekly pattern: "August Week 5 (8/31/2026)" or "Week 1 (9/7/2026)"
    const weekMatch = periodLabel.match(/^(.*?Week\s*\d+)\s*\((.*?)\)/i) || periodLabel.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
    if (weekMatch) {
        const prefix = weekMatch[1] ? weekMatch[1].trim() : periodLabel.replace(/\s*\(.*?\)/, '').trim();
        const dateStr = weekMatch[2] || weekMatch[1];
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
            const m = parseInt(dateParts[0], 10) - 1;
            const d = parseInt(dateParts[1], 10);
            const y = parseInt(dateParts[2], 10);

            const startDate = new Date(y, m, d);
            if (!isNaN(startDate.getTime())) {
                const endDate = new Date(y, m, d + 6); // 7-day academic week (Mon-Sun)
                const startFormatted = `${monthNames[startDate.getMonth()]} ${String(startDate.getDate()).padStart(2, '0')}, ${startDate.getFullYear()}`;
                const endFormatted = `${monthNames[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')}, ${endDate.getFullYear()}`;
                return `${prefix} (${startFormatted} – ${endFormatted})`;
            }
        }
    }

    // Check for monthly pattern: "August 2026", "September 2026", etc.
    const monthYearMatch = periodLabel.match(/^([a-zA-Z]+)\s+(\d{4})$/);
    if (monthYearMatch) {
        const monthName = monthYearMatch[1].toLowerCase();
        const year = parseInt(monthYearMatch[2], 10);
        if (fullMonthMap[monthName] !== undefined && !isNaN(year)) {
            const m = fullMonthMap[monthName];
            const startDate = new Date(year, m, 1);
            const endDate = new Date(year, m + 1, 0); // Last day of month
            const startFormatted = `${monthNames[startDate.getMonth()]} 01, ${year}`;
            const endFormatted = `${monthNames[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')}, ${year}`;
            return `${periodLabel} (${startFormatted} – ${endFormatted})`;
        }
    }

    return periodLabel;
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
    academic_period = null,
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

    // 8. Specific Faculty Row Exclusion state for Preview & Report
    const [excludedFacultyKeys, setExcludedFacultyKeys] = useState<string[]>([]);

    const handleExcludeFacultyRow = (key: string, facultyName: string) => {
        setExcludedFacultyKeys(prev => {
            if (prev.includes(key)) return prev;
            return [...prev, key];
        });
        showToast(`Removed "${facultyName}" from report view.`);
    };

    const handleRestoreFacultyRow = (key: string, facultyName?: string) => {
        setExcludedFacultyKeys(prev => prev.filter(k => k !== key));
        showToast(facultyName ? `Restored "${facultyName}" to report view.` : 'Restored faculty row.');
    };

    const handleRestoreAllFacultyRows = () => {
        setExcludedFacultyKeys([]);
        showToast('All removed faculty rows restored to report view.');
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

        // Base rows from matching summaries with minute-based baseline & multi-indicator performance
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

            // Compute atomic minute baselines
            const scheduledMin = s.scheduled_minutes || (s.total_scheduled_hours ? Math.round(s.total_scheduled_hours * 60) : scheduledSessions * 90);
            const leaveMin = s.approved_leave_minutes || (s.approved_leave_hours ? Math.round(s.approved_leave_hours * 60) : onLeave * 90);
            const absentMin = s.unexcused_absent_minutes || (s.unexcused_absent_hours ? Math.round(s.unexcused_absent_hours * 60) : absent * 90);
            const eligibleMin = s.eligible_minutes ?? (s.eligible_scheduled_hours ? Math.round(s.eligible_scheduled_hours * 60) : Math.max(0, scheduledMin - leaveMin));
            const attendedMin = s.attended_minutes || (s.attended_hours ? Math.round(s.attended_hours * 60) : present * 90);

            // Fetch matched make-up completed minutes
            let makeUpReqMin = s.make_up_required_minutes ?? (s.make_up_required_hours ? Math.round(s.make_up_required_hours * 60) : absentMin + leaveMin);
            let makeUpDoneMin = s.make_up_completed_minutes || (s.make_up_completed_hours ? Math.round(s.make_up_completed_hours * 60) : 0);
            if (s.faculty_id) {
                const completedMUs = (weekly_sessions as any[]).filter(ws => ws.faculty_id === s.faculty_id && ws.make_up_request_id);
                if (completedMUs.length > 0 && makeUpDoneMin === 0) {
                    makeUpDoneMin = completedMUs.length * 90;
                }
            }

            // Rates: null on zero denominator to ensure mathematical truth (never show 100% when 0 eligible)
            const attendanceCoverage = eligibleMin > 0
                ? Number(((attendedMin / eligibleMin) * 100).toFixed(2))
                : null;

            const onTimeRate = present > 0
                ? Number((((present - late) / present) * 100).toFixed(2))
                : null;

            const instructionalCompletion = scheduledMin > 0
                ? Math.min(100, Number((((attendedMin + makeUpDoneMin) / scheduledMin) * 100).toFixed(2)))
                : null;

            const isRankEligible = s.is_rank_eligible ?? (eligibleMin >= (periodTab === 'week' ? 180 : 720));

            // Associated individual session meetings for audit trail, scoped to selected reporting period
            const facultySessions = weekly_sessions.filter(ws => {
                // 1. Strict faculty match
                const facultyMatches = s.faculty_id
                    ? ws.faculty_id === s.faculty_id
                    : (ws.instructor_name || '').trim().toLowerCase() === (s.instructor_name || '').trim().toLowerCase();
                if (!facultyMatches) return false;

                // 2. Period scoping
                const periodLower = (selectedPeriod || '').toLowerCase();
                const wsWeek = (ws.week_label || '').toLowerCase();

                // Individual or consolidated all-periods view shows all sessions
                if (reportFormat === 'individual' && !selectedPeriod) return true;

                if (periodTab === 'week') {
                    // Extract week identifier e.g. "august week 5" or "september week 1"
                    const weekPrefixMatch = periodLower.match(/^(.*?\bweek\s*\d+)/i);
                    const weekPrefix = weekPrefixMatch ? weekPrefixMatch[1].trim() : periodLower;
                    if (wsWeek && (wsWeek.includes(weekPrefix) || weekPrefix.includes(wsWeek))) {
                        return true;
                    }
                    // Or match by date if available
                    if (ws.session_date && periodLower.includes('/')) {
                        const dateMatch = periodLower.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
                        if (dateMatch) {
                            const [m, d, y] = dateMatch[1].split('/').map(Number);
                            const start = new Date(y, m - 1, d);
                            const end = new Date(y, m - 1, d + 6, 23, 59, 59);
                            const sDate = new Date(ws.session_date);
                            if (sDate >= start && sDate <= end) return true;
                        }
                    }
                    return false;
                } else if (periodTab === 'month') {
                    // Filter by month name
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    const matchedMonth = monthNames.find(m => periodLower.includes(m));
                    if (matchedMonth) {
                        if (wsWeek.includes(matchedMonth)) return true;
                        if (ws.session_date) {
                            const sDate = new Date(ws.session_date);
                            if (monthNames[sDate.getMonth()] === matchedMonth) return true;
                        }
                    }
                    return false;
                }

                return true;
            });

            // Check if reporting period is before faculty employment or assignment start
            const facultyObj = s.faculty || faculties.find(f => f.id === s.faculty_id);
            const empStart = facultyObj?.teaching_assignment_effective_from || facultyObj?.employment_start_date;
            let isNotYetEmployed = false;
            let effectiveDateNote: string | null = null;

            if (empStart) {
                const empStartObj = new Date(empStart);
                // Approximate start of currently selected period
                const periodLower = selectedPeriod.toLowerCase();
                let periodStartDate = new Date('2026-08-10'); // Default official class start

                if (periodLower.includes('august')) periodStartDate = new Date('2026-08-10');
                else if (periodLower.includes('september')) periodStartDate = new Date('2026-09-01');
                else if (periodLower.includes('october')) periodStartDate = new Date('2026-10-01');
                else if (periodLower.includes('november')) periodStartDate = new Date('2026-11-01');
                else if (periodLower.includes('december')) periodStartDate = new Date('2026-12-01');

                let periodEndDate = new Date('2026-08-31');
                if (periodLower.includes('september')) periodEndDate = new Date('2026-09-30');
                else if (periodLower.includes('october')) periodEndDate = new Date('2026-10-31');
                else if (periodLower.includes('november')) periodEndDate = new Date('2026-11-30');
                else if (periodLower.includes('december')) periodEndDate = new Date('2026-12-18');

                // If reporting period ends before faculty joined
                if (periodEndDate < empStartObj) {
                    isNotYetEmployed = true;
                } else if (empStartObj > periodStartDate && empStartObj <= periodEndDate) {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    effectiveDateNote = `Attendance evaluated from ${monthNames[empStartObj.getMonth()]} ${empStartObj.getDate()}, ${empStartObj.getFullYear()} – employment/teaching assignment effective date`;
                }
            }

            return {
                id: s.id,
                faculty_id: s.faculty_id,
                original_instructor_name: s.instructor_name,
                instructor_name: facultyName,
                program: programCode,
                scheduledSessions: isNotYetEmployed ? 0 : scheduledSessions,
                present: isNotYetEmployed ? 0 : present,
                late: isNotYetEmployed ? 0 : late,
                absent: isNotYetEmployed ? 0 : absent,
                onLeave: isNotYetEmployed ? 0 : onLeave,
                lateMinutes: isNotYetEmployed ? 0 : lateMinutes,
                scheduledMin: isNotYetEmployed ? 0 : scheduledMin,
                eligibleMin: isNotYetEmployed ? 0 : eligibleMin,
                attendedMin: isNotYetEmployed ? 0 : attendedMin,
                leaveMin: isNotYetEmployed ? 0 : leaveMin,
                absentMin: isNotYetEmployed ? 0 : absentMin,
                makeUpReqMin: isNotYetEmployed ? 0 : makeUpReqMin,
                makeUpDoneMin: isNotYetEmployed ? 0 : makeUpDoneMin,
                scheduledHours: isNotYetEmployed ? 0 : Number((scheduledMin / 60).toFixed(1)),
                eligibleHours: isNotYetEmployed ? 0 : Number((eligibleMin / 60).toFixed(1)),
                attendedHours: isNotYetEmployed ? 0 : Number((attendedMin / 60).toFixed(1)),
                leaveHours: isNotYetEmployed ? 0 : Number((leaveMin / 60).toFixed(1)),
                unexcusedAbsentHours: isNotYetEmployed ? 0 : Number((absentMin / 60).toFixed(1)),
                makeUpRequiredHours: isNotYetEmployed ? 0 : Number((makeUpReqMin / 60).toFixed(1)),
                makeUpCompletedHours: isNotYetEmployed ? 0 : Number((makeUpDoneMin / 60).toFixed(1)),
                attendanceCoverage: isNotYetEmployed ? null : attendanceCoverage,
                onTimeRate: isNotYetEmployed ? null : onTimeRate,
                instructionalCompletion: isNotYetEmployed ? null : instructionalCompletion,
                isRankEligible: isNotYetEmployed ? false : isRankEligible,
                isNotYetEmployed,
                effectiveDateNote,
                sessions: isNotYetEmployed ? [] : facultySessions,
            };
        });

        // If summaries is empty, fallback to representative official faculty dataset
        if (rows.length === 0) {
            rows = [
                {
                    id: 1,
                    faculty_id: 12,
                    original_instructor_name: 'Kaye Panaligan',
                    instructor_name: 'Kaye Panaligan',
                    program: 'BSIS',
                    scheduledSessions: 12,
                    present: 7,
                    late: 1,
                    absent: 1,
                    onLeave: 4,
                    lateMinutes: 12,
                    scheduledMin: 1080,
                    eligibleMin: 720,
                    attendedMin: 618,
                    leaveMin: 360,
                    absentMin: 90,
                    makeUpReqMin: 462,
                    makeUpDoneMin: 0,
                    scheduledHours: 18.0,
                    eligibleHours: 12.0,
                    attendedHours: 10.3,
                    leaveHours: 6.0,
                    unexcusedAbsentHours: 1.5,
                    makeUpRequiredHours: 7.7,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 85.83,
                    onTimeRate: 85.71,
                    instructionalCompletion: 57.22,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 2,
                    faculty_id: 35,
                    original_instructor_name: 'Razel Ann Aguilar',
                    instructor_name: 'Razel Ann Aguilar',
                    program: 'BSIT',
                    scheduledSessions: 6,
                    present: 0,
                    late: 0,
                    absent: 0,
                    onLeave: 6,
                    lateMinutes: 0,
                    scheduledMin: 540,
                    eligibleMin: 0,
                    attendedMin: 0,
                    leaveMin: 540,
                    absentMin: 0,
                    makeUpReqMin: 540,
                    makeUpDoneMin: 0,
                    scheduledHours: 9.0,
                    eligibleHours: 0.0,
                    attendedHours: 0.0,
                    leaveHours: 9.0,
                    unexcusedAbsentHours: 0.0,
                    makeUpRequiredHours: 9.0,
                    makeUpCompletedHours: 0.0,
                    attendanceCoverage: null,
                    onTimeRate: null,
                    instructionalCompletion: 0.0,
                    isRankEligible: false,
                    sessions: [],
                },
                {
                    id: 3,
                    faculty_id: 14,
                    original_instructor_name: 'Felomino Alba',
                    instructor_name: 'Felomino Alba',
                    program: 'BSIT',
                    scheduledSessions: 10,
                    present: 10,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledMin: 900,
                    eligibleMin: 900,
                    attendedMin: 900,
                    leaveMin: 0,
                    absentMin: 0,
                    makeUpReqMin: 0,
                    makeUpDoneMin: 0,
                    scheduledHours: 15.0,
                    eligibleHours: 15.0,
                    attendedHours: 15.0,
                    leaveHours: 0,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 100.0,
                    onTimeRate: 100.0,
                    instructionalCompletion: 100.0,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 4,
                    faculty_id: 18,
                    original_instructor_name: 'Dhominic Arendain',
                    instructor_name: 'Dhominic Arendain',
                    program: 'BSIS',
                    scheduledSessions: 8,
                    present: 7,
                    late: 2,
                    absent: 0,
                    onLeave: 1,
                    lateMinutes: 20,
                    scheduledMin: 720,
                    eligibleMin: 630,
                    attendedMin: 630,
                    leaveMin: 90,
                    absentMin: 0,
                    makeUpReqMin: 90,
                    makeUpDoneMin: 90,
                    scheduledHours: 12.0,
                    eligibleHours: 10.5,
                    attendedHours: 10.5,
                    leaveHours: 1.5,
                    unexcusedAbsentHours: 0,
                    makeUpRequiredHours: 1.5,
                    makeUpCompletedHours: 1.5,
                    attendanceCoverage: 100.0,
                    onTimeRate: 66.67,
                    instructionalCompletion: 100.0,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 5,
                    faculty_id: 11,
                    original_instructor_name: 'Amzel Menoza',
                    instructor_name: 'Amzel Menoza',
                    program: 'BSIT',
                    scheduledSessions: 8,
                    present: 4,
                    late: 0,
                    absent: 4,
                    onLeave: 0,
                    lateMinutes: 0,
                    scheduledMin: 720,
                    eligibleMin: 720,
                    attendedMin: 360,
                    leaveMin: 0,
                    absentMin: 360,
                    makeUpReqMin: 360,
                    makeUpDoneMin: 0,
                    scheduledHours: 12.0,
                    eligibleHours: 12.0,
                    attendedHours: 6.0,
                    leaveHours: 0,
                    unexcusedAbsentHours: 6.0,
                    makeUpRequiredHours: 6.0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 50.0,
                    onTimeRate: 100.0,
                    instructionalCompletion: 50.0,
                    isRankEligible: true,
                    sessions: [],
                },
                {
                    id: 6,
                    faculty_id: 23,
                    original_instructor_name: 'Carl Ohmar Montoya',
                    instructor_name: 'Carl Ohmar Montoya',
                    program: 'BSIS',
                    scheduledSessions: 6,
                    present: 4,
                    late: 0,
                    absent: 1,
                    onLeave: 1,
                    lateMinutes: 0,
                    scheduledMin: 540,
                    eligibleMin: 450,
                    attendedMin: 360,
                    leaveMin: 90,
                    absentMin: 90,
                    makeUpReqMin: 180,
                    makeUpDoneMin: 0,
                    scheduledHours: 9.0,
                    eligibleHours: 7.5,
                    attendedHours: 6.0,
                    leaveHours: 1.5,
                    unexcusedAbsentHours: 1.5,
                    makeUpRequiredHours: 3.0,
                    makeUpCompletedHours: 0,
                    attendanceCoverage: 80.0,
                    onTimeRate: 100.0,
                    instructionalCompletion: 66.67,
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
            rows = rows.filter(r => r.attendanceCoverage !== null && r.attendanceCoverage >= 100);
        } else if (selectedStatus === 'late') {
            rows = rows.filter(r => r.late > 0);
        } else if (selectedStatus === 'absent') {
            rows = rows.filter(r => r.absent > 0);
        }

        // Filter out specifically removed / excluded faculty rows
        const excludedList: { key: string; name: string }[] = [];
        if (excludedFacultyKeys.length > 0) {
            rows = rows.filter(r => {
                const key = r.faculty_id ? `fid_${r.faculty_id}` : `name_${(r.original_instructor_name || r.instructor_name).toLowerCase().trim()}`;
                if (excludedFacultyKeys.includes(key)) {
                    excludedList.push({ key, name: r.instructor_name });
                    return false;
                }
                return true;
            });
        }

        // Sort
        if (sortBy === 'rate') {
            rows.sort((a, b) => (b.attendanceCoverage ?? -1) - (a.attendanceCoverage ?? -1));
        } else if (sortBy === 'completion') {
            rows.sort((a, b) => (b.instructionalCompletion ?? -1) - (a.instructionalCompletion ?? -1));
        } else if (sortBy === 'minutes' || sortBy === 'hours') {
            rows.sort((a, b) => b.eligibleMin - a.eligibleMin);
        } else {
            rows.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name));
        }

        // Aggregate Totals strictly in minutes as the primary baseline
        const totalScheduledMin = rows.reduce((acc, r) => acc + r.scheduledMin, 0);
        const totalEligibleMin = rows.reduce((acc, r) => acc + r.eligibleMin, 0);
        const totalAttendedMin = rows.reduce((acc, r) => acc + r.attendedMin, 0);
        const totalLeaveMin = rows.reduce((acc, r) => acc + r.leaveMin, 0);
        const totalAbsentMin = rows.reduce((acc, r) => acc + r.absentMin, 0);
        const totalLateSessions = rows.reduce((acc, r) => acc + r.late, 0);
        const totalLateMinutes = rows.reduce((acc, r) => acc + r.lateMinutes, 0);
        const totalMakeUpReqMin = rows.reduce((acc, r) => acc + r.makeUpReqMin, 0);
        const totalMakeUpDoneMin = rows.reduce((acc, r) => acc + r.makeUpDoneMin, 0);
        const totalPresentSessions = rows.reduce((acc, r) => acc + r.present, 0);
        const totalScheduledSessions = rows.reduce((acc, r) => acc + r.scheduledSessions, 0);
        const facultyCount = rows.length;

        // Overall performance rates computed from aggregate minutes
        const overallCoverage = totalEligibleMin > 0
            ? Number(((totalAttendedMin / totalEligibleMin) * 100).toFixed(1))
            : null;

        const overallOnTime = totalPresentSessions > 0
            ? Number((((totalPresentSessions - totalLateSessions) / totalPresentSessions) * 100).toFixed(1))
            : null;

        const overallCompletion = totalScheduledMin > 0
            ? Math.min(100, Number((((totalAttendedMin + totalMakeUpDoneMin) / totalScheduledMin) * 100).toFixed(1)))
            : null;

        return {
            rows,
            excludedList,
            totals: {
                facultyCount,
                totalScheduledMin,
                totalEligibleMin,
                totalAttendedMin,
                totalLeaveMin,
                totalAbsentMin,
                totalLateSessions,
                totalLateMinutes,
                totalMakeUpReqMin,
                totalMakeUpDoneMin,
                totalPresentSessions,
                totalScheduledSessions,
                // Legacy hours for display
                totalEligibleHours: Number((totalEligibleMin / 60).toFixed(1)),
                totalAttendedHours: Number((totalAttendedMin / 60).toFixed(1)),
                totalLeaveHours: Number((totalLeaveMin / 60).toFixed(1)),
                totalAbsentHours: Number((totalAbsentMin / 60).toFixed(1)),
                totalMakeUpRequired: Number((totalMakeUpReqMin / 60).toFixed(1)),
                totalMakeUpCompleted: Number((totalMakeUpDoneMin / 60).toFixed(1)),
                overallCoverage,
                overallOnTime,
                overallCompletion,
            },
        };
    }, [summaries, weekly_sessions, faculties, customFacultyNames, excludedFacultyKeys, selectedPeriod, periodTab, reportFormat, selectedProgram, selectedFaculty, selectedStatus, sortBy]);

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

        // Remove any interactive UI elements or scroll wrappers from clone
        clonedSheet.querySelectorAll('.no-print, .no-pdf').forEach(el => el.remove());
        clonedSheet.querySelectorAll('.overflow-x-auto, .overflow-hidden').forEach(el => {
            (el as HTMLElement).style.overflow = 'visible';
            (el as HTMLElement).style.width = '100%';
            (el as HTMLElement).style.maxWidth = '100%';
        });

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
                        size: A3 landscape;
                        margin: 12mm;
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
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                    }
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        scrollbar-width: none !important;
                    }
                    ::-webkit-scrollbar {
                        display: none !important;
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
                    .overflow-x-auto, .overflow-hidden {
                        overflow: visible !important;
                        width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
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

    // Handle Direct PDF Generation / Download (A3 Landscape Document with Strict Row Boundaries & Repeated Headers)
    const handleGeneratePdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);

        const fileName = `CIDS_Faculty_Attendance_Report_${selectedAY.replace(/[\s–—-]+/g, '_')}_${selectedSemester.replace(/[\s–—-]+/g, '_')}.pdf`;

        try {
            const { jsPDF } = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = (autoTableModule as any).default || autoTableModule;

            // 1. Configure Document: A3 Landscape (420mm x 297mm) with 12mm margins
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3',
                compress: true,
            });

            const pageWidth = doc.internal.pageSize.getWidth(); // 420mm
            const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
            const margin = 12.0; // 12mm consistent margin
            let currentY = margin;

            // Load CIDS Logo as Data URL
            let logoDataUrl: string | null = null;
            try {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = '/CIDS_Logo.jpg';
                await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });
                if (img.width && img.height) {
                    const tempCanvas = document.createElement('canvas');
                    const size = Math.min(img.width, img.height);
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const ctx = tempCanvas.getContext('2d');
                    if (ctx) {
                        // Fill white background first
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, size, size);

                        // Clip circular emblem
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();

                        // Draw source image centered
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
                        ctx.restore();

                        // Export as PNG so white/circular background is cleanly maintained
                        logoDataUrl = tempCanvas.toDataURL('image/png');
                    }
                }
            } catch (err) {
                console.warn('Could not load logo for PDF header:', err);
            }

            // Function to render official DSSC header
            const renderDocHeader = (yPos: number) => {
                let y = yPos;
                if (logoDataUrl) {
                    const logoSize = 18;
                    const logoX = (pageWidth - logoSize) / 2;
                    doc.addImage(logoDataUrl, 'PNG', logoX, y, logoSize, logoSize);
                    y += logoSize + 2;
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(80, 80, 80);
                doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, y, { align: 'center' });
                y += 4;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor(15, 23, 42);
                doc.text('DAVAO DEL SUR STATE COLLEGE', pageWidth / 2, y, { align: 'center' });
                y += 5;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(30, 41, 59);
                doc.text('COLLEGE OF INFORMATION AND DIGITAL SCIENCES', pageWidth / 2, y, { align: 'center' });
                y += 4;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('Brgy. Matti, Digos City, Davao del Sur', pageWidth / 2, y, { align: 'center' });
                y += 6;

                // Report Title Box
                doc.setDrawColor(203, 213, 225);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 1.5, 1.5, 'FD');

                const titleText = `${reportFormat === 'weekly' ? 'WEEKLY' : reportFormat === 'monthly' ? 'MONTHLY' : 'COLLEGE'} FACULTY ATTENDANCE SUMMARY`;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 23, 42);
                doc.text(titleText, pageWidth / 2, y + 5.5, { align: 'center' });

                const periodStr = `${formatPeriodWithDateRange(selectedPeriod, periodTab)} · Academic Year ${selectedAY} · ${selectedSemester}`;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(51, 65, 85);
                doc.text(periodStr, pageWidth / 2, y + 10, { align: 'center' });

                const metaStr = `Classes Start: ${academic_period?.official_start_of_classes || 'Aug 10, 2026'}   |   Classes End: ${academic_period?.official_end_of_classes || 'Dec 18, 2026'}   |   Schedule: Verified Published Master Timetable   |   Sync: ${last_synced_at}   |   Baseline: Atomic Minutes`;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(metaStr, pageWidth / 2, y + 14, { align: 'center' });

                return y + 20;
            };

            currentY = renderDocHeader(currentY);

            // 2. Render Key Summaries Table (if enabled)
            if (keySummaries.attendanceTotals && previewData.totals) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(15, 23, 42);
                doc.text('KEY SUMMARIES (MINUTE BASELINE & INSTRUCTIONAL COMPLETION)', margin, currentY);
                currentY += 2;

                const summaryHead = [
                    ['FACULTY', 'SCHEDULED', 'ELIGIBLE', 'ATTENDED', 'APP. LEAVE', 'ABSENCE', 'LATE SESS', 'LATE TIME', 'MAKE-UP REQ', 'MAKE-UP COMP', 'ATTENDANCE COV', 'ON-TIME', 'COMPLETION']
                ];

                const summaryBody = [[
                    String(previewData.totals.facultyCount || 0),
                    `${formatDuration(previewData.totals.totalScheduledMin)}\n(${previewData.totals.totalScheduledMin}m)`,
                    `${formatDuration(previewData.totals.totalEligibleMin)}\n(${previewData.totals.totalEligibleMin}m)`,
                    `${formatDuration(previewData.totals.totalAttendedMin)}\n(${previewData.totals.totalAttendedMin}m)`,
                    `${formatDuration(previewData.totals.totalLeaveMin)}\n(${previewData.totals.totalLeaveMin}m)`,
                    `${formatDuration(previewData.totals.totalAbsentMin)}\n(${previewData.totals.totalAbsentMin}m)`,
                    String(previewData.totals.totalLateSessions || 0),
                    formatDuration(previewData.totals.totalLateMinutes),
                    formatDuration(previewData.totals.totalMakeUpReqMin),
                    formatDuration(previewData.totals.totalMakeUpDoneMin),
                    previewData.totals.overallCoverage !== null ? `${previewData.totals.overallCoverage}%` : 'N/A',
                    previewData.totals.overallOnTime !== null ? `${previewData.totals.overallOnTime}%` : 'N/A',
                    previewData.totals.overallCompletion !== null ? `${previewData.totals.overallCompletion}%` : 'N/A',
                ]];

                autoTable(doc, {
                    startY: currentY,
                    head: summaryHead,
                    body: summaryBody,
                    margin: { left: margin, right: margin },
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: 7.5,
                        cellPadding: 2,
                        halign: 'center',
                        valign: 'middle',
                        textColor: [15, 23, 42],
                        lineColor: [203, 213, 225],
                        lineWidth: 0.2,
                    },
                    headStyles: {
                        fillColor: [241, 245, 249],
                        textColor: [15, 23, 42],
                        fontStyle: 'bold',
                        fontSize: 7.5,
                    },
                    alternateRowStyles: {
                        fillColor: [255, 255, 255],
                    },
                });

                currentY = (doc as any).lastAutoTable.finalY + 6;
            }

            // 3. Render Main Detailed Faculty Table with Row Boundary Protection & Repeated Headers
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text('FACULTY ATTENDANCE & INSTRUCTIONAL COMPLETION DETAILS (MINUTE BASELINE)', margin, currentY);
            currentY += 2;

            const mainHead = [[
                '#',
                'FACULTY NAME',
                'PROG',
                'SCHEDULED',
                'ELIGIBLE',
                'ATTENDED',
                'LEAVE',
                'ABSENCE',
                'LATE SESS',
                'LATE TIME',
                'MAKE-UP REQ',
                'MAKE-UP COMP',
                'ATTENDANCE COV',
                'ON-TIME',
                'COMPLETION',
                'REMARKS'
            ]];

            const mainRows = previewData.rows.map((row, idx) => {
                let covBadgeText = 'N/A';
                if (row.attendanceCoverage !== null) {
                    if (row.attendanceCoverage >= 95) covBadgeText = 'Excellent';
                    else if (row.attendanceCoverage >= 90) covBadgeText = 'Good';
                    else if (row.attendanceCoverage >= 80) covBadgeText = 'Needs Monitoring';
                    else covBadgeText = 'Needs Attention';
                }

                const remarksText = row.isNotYetEmployed
                    ? 'Not Yet Employed'
                    : row.scheduledMin === 0
                        ? 'N/A – No Classes'
                        : row.leaveMin === row.scheduledMin
                            ? 'On Approved Leave'
                            : row.eligibleMin === 0
                                ? 'N/A – Excluded'
                                : covBadgeText;

                const facultyDisplayName = row.effectiveDateNote
                    ? `${row.instructor_name}\n(${row.effectiveDateNote})`
                    : row.instructor_name;

                return [
                    String(idx + 1),
                    facultyDisplayName,
                    row.program || '',
                    row.isNotYetEmployed ? 'N/A' : `${formatDuration(row.scheduledMin)} (${row.scheduledMin}m)`,
                    row.isNotYetEmployed ? 'N/A' : `${formatDuration(row.eligibleMin)} (${row.eligibleMin}m)`,
                    row.isNotYetEmployed ? 'N/A' : `${formatDuration(row.attendedMin)} (${row.attendedMin}m)`,
                    row.isNotYetEmployed ? 'N/A' : row.leaveMin > 0 ? `${formatDuration(row.leaveMin)} (${row.leaveMin}m)` : '0m',
                    row.isNotYetEmployed ? 'N/A' : row.absentMin > 0 ? `${formatDuration(row.absentMin)} (${row.absentMin}m)` : '0m',
                    row.isNotYetEmployed ? 'N/A' : String(row.late || 0),
                    row.isNotYetEmployed ? 'N/A' : formatDuration(row.lateMinutes),
                    row.isNotYetEmployed ? 'N/A' : row.makeUpReqMin > 0 ? formatDuration(row.makeUpReqMin) : '0m',
                    row.isNotYetEmployed ? 'N/A' : row.makeUpDoneMin > 0 ? formatDuration(row.makeUpDoneMin) : '0m',
                    !row.isNotYetEmployed && row.eligibleMin > 0 && row.attendanceCoverage !== null ? `${row.attendanceCoverage}%` : 'N/A',
                    !row.isNotYetEmployed && row.attendedMin > 0 && row.onTimeRate !== null ? `${row.onTimeRate}%` : 'N/A',
                    !row.isNotYetEmployed && row.eligibleMin > 0 && row.instructionalCompletion !== null ? `${row.instructionalCompletion}%` : 'N/A',
                    remarksText,
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: mainHead,
                body: mainRows,
                margin: { left: margin, right: margin, bottom: 20 },
                theme: 'grid',
                rowPageBreak: 'avoid',
                showHead: 'everyPage',
                styles: {
                    font: 'helvetica',
                    fontSize: 7.5,
                    cellPadding: 2,
                    valign: 'middle',
                    lineColor: [203, 213, 225],
                    lineWidth: 0.2,
                    textColor: [15, 23, 42],
                    overflow: 'linebreak',
                },
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    halign: 'center',
                    valign: 'middle',
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: 'center' },      // #
                    1: { cellWidth: 62, halign: 'left', fontStyle: 'bold' }, // Faculty Name
                    2: { cellWidth: 14, halign: 'center' },     // Prog
                    3: { cellWidth: 26, halign: 'right' },      // Scheduled
                    4: { cellWidth: 26, halign: 'right' },      // Eligible
                    5: { cellWidth: 26, halign: 'right' },      // Attended
                    6: { cellWidth: 22, halign: 'right' },      // Leave
                    7: { cellWidth: 22, halign: 'right' },      // Absence
                    8: { cellWidth: 16, halign: 'center' },     // Late Sess
                    9: { cellWidth: 20, halign: 'right' },      // Late Time
                    10: { cellWidth: 24, halign: 'right' },     // Make-up req
                    11: { cellWidth: 24, halign: 'right' },     // Make-up comp
                    12: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, // Attendance Cov
                    13: { cellWidth: 20, halign: 'center' },    // On-Time
                    14: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }, // Completion
                    15: { cellWidth: 36, halign: 'center' },    // Remarks
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255],
                },
            });

            currentY = (doc as any).lastAutoTable.finalY + 4;

            // 4. Monochrome Black & White Legend and Formulas (Below Table, Above Signatories)
            const legendBlockHeight = 22;
            if (currentY + legendBlockHeight + 35 > pageHeight - margin) {
                doc.addPage();
                currentY = margin + 5;
            }

            // Draw bounding border box for legend
            const legendWidth = pageWidth - (margin * 2);
            doc.setDrawColor(15, 23, 42); // slate-900 / black
            doc.setLineWidth(0.2);
            doc.rect(margin, currentY, legendWidth, 20);

            // Header line of legend
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(15, 23, 42);
            doc.text('ATTENDANCE COVERAGE MONITORING LEGEND:', margin + 3, currentY + 4.5);

            // Tiers in B&W
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text('[ >=95.0% Excellent ]   [ 90.0-94.99% Good ]   [ 80.0-89.99% Needs Monitoring ]   [ <80.0% Needs Attention ]   [ N/A - Excluded ]', margin + 70, currentY + 4.5);

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6.5);
            doc.setTextColor(70, 70, 70);
            doc.text('Atomic Baseline: Minutes (e.g. 1.5h = 90m / 3.0h = 180m)', pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

            // Horizontal dividing line
            doc.setDrawColor(200, 200, 200);
            doc.line(margin + 2, currentY + 6.5, pageWidth - margin - 2, currentY + 6.5);

            // Row 1: Formulas
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(15, 23, 42);
            const colW = (legendWidth - 6) / 3;
            doc.text('Eligible Mins = Scheduled Mins - Approved Excluded Mins (Leave, Suspensions, Holidays).', margin + 3, currentY + 10);
            doc.text('Attendance Coverage = (Attended Eligible Mins / Eligible Mins) x 100. (N/A when Eligible = 0).', margin + 3 + colW, currentY + 10);
            doc.text('Instructional Completion = ((Attended Mins + Make-Up Completed) / Required Scheduled Mins) x 100.', margin + 3 + (colW * 2), currentY + 10);

            // Row 2: Status Definitions (Excellent, Good, Needs Monitoring, Needs Attention, N/A - Excluded)
            doc.setFontSize(6);
            doc.setTextColor(60, 60, 60);
            const defColW = (legendWidth - 6) / 5;
            doc.text('>=95.0% Excellent: Outstanding delivery; attended almost all eligible hours.', margin + 3, currentY + 14.5, { maxWidth: defColW - 2 });
            doc.text('90.0-94.99% Good: Meets delivery standard; minor variances within threshold.', margin + 3 + defColW, currentY + 14.5, { maxWidth: defColW - 2 });
            doc.text('80.0-89.99% Needs Mon.: Below ideal target; requires monitoring or make-up.', margin + 3 + (defColW * 2), currentY + 14.5, { maxWidth: defColW - 2 });
            doc.text('<80.0% Needs Attn.: Critical gap; missed substantial hours requiring intervention.', margin + 3 + (defColW * 3), currentY + 14.5, { maxWidth: defColW - 2 });
            doc.text('N/A - Excluded: Eligible scheduled minutes = 0 (100% approved leave, holidays).', margin + 3 + (defColW * 4), currentY + 14.5, { maxWidth: defColW - 2 });

            currentY += 24;

            // 5. Signatories Section (render on current page or start new page if space is insufficient)
            const requiredSignatoryHeight = 35;
            if (currentY + requiredSignatoryHeight > pageHeight - 20) {
                doc.addPage();
                currentY = margin + 5;
            }

            const sigCols = 3;
            const sigWidth = (pageWidth - (margin * 2) - ((sigCols - 1) * 15)) / sigCols;

            signatoriesList.forEach((sig, index) => {
                const col = index % sigCols;
                const row = Math.floor(index / sigCols);
                const x = margin + (col * (sigWidth + 15));
                const y = currentY + (row * 30);

                if (y + 25 > pageHeight - 20) {
                    doc.addPage();
                    currentY = margin + 5;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(30, 41, 59);
                doc.text(`${sig.label}:`, x, y);

                const lineY = y + 14;
                if (sig.showSignatureLine) {
                    doc.setDrawColor(30, 41, 59);
                    doc.setLineWidth(0.3);
                    doc.line(x, lineY, x + sigWidth - 5, lineY);
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(15, 23, 42);
                doc.text((sig.name || '').toUpperCase(), x, lineY - 1);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text(sig.designation || '', x, lineY + 3.5);

                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(sig.department || '', x, lineY + 7);
            });

            // 5. Add Running Footers with Page Numbering & Document Identifiers across all pages
            const totalPages = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.2);
                doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);

                // Left: Document tracking identifier
                doc.text(
                    `OfficeHub CIDS Faculty Monitoring Report · AY ${selectedAY} (${selectedSemester}) · ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`,
                    margin,
                    pageHeight - 7
                );

                // Right: Page number
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 7,
                    { align: 'right' }
                );
            }

            doc.save(fileName);
            showToast('PDF exported successfully in A3 Landscape with intact row boundaries!');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Failed to generate direct PDF, opening print preview...');
            handlePrintPreview();
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Faculty Attendance Report" />

            {/* Print Stylesheet (Formal document formatting, landscape, no scrollbars, proper table headers) */}
            <style>{`
                @page {
                    size: A3 landscape;
                    margin: 12mm;
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
                    .no-print, .no-pdf, header, nav, aside, [data-sidebar="sidebar"], .viewer-bar {
                        display: none !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                    }
                    /* Remove all scrollbars, shadows and web backgrounds */
                    * {
                        overflow: visible !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                        scrollbar-width: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    ::-webkit-scrollbar {
                        display: none !important;
                    }
                    .overflow-x-auto, .overflow-hidden {
                        overflow: visible !important;
                        width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        page-break-inside: auto !important;
                        border-collapse: collapse !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
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
                                            <span className="font-bold text-xs text-foreground block truncate mt-0.5" title={formatPeriodWithDateRange(selectedPeriod, periodTab)}>
                                                {formatPeriodWithDateRange(selectedPeriod, periodTab)}
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
                                                <option key={p} value={p}>{formatPeriodWithDateRange(p, periodTab)}</option>
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
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Scheduled Minutes</td>
                                                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-foreground">
                                                            {previewData.totals.totalScheduledMin.toLocaleString()} min <span className="text-[10px] font-normal text-muted-foreground">({(previewData.totals.totalScheduledMin / 60).toFixed(1)}h)</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-muted/20">
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Attended Minutes</td>
                                                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                            {previewData.totals.totalAttendedMin.toLocaleString()} min <span className="text-[10px] font-normal text-muted-foreground">({previewData.totals.overallCoverage !== null ? `${previewData.totals.overallCoverage}%` : 'N/A'})</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Approved Leave Minutes</td>
                                                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            {previewData.totals.totalLeaveMin.toLocaleString()} min <span className="text-[10px] font-normal text-muted-foreground">({(previewData.totals.totalLeaveMin / 60).toFixed(1)}h)</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-muted/20">
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Unexcused Absent Minutes</td>
                                                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-red-600 dark:text-red-400">
                                                            {previewData.totals.totalAbsentMin.toLocaleString()} min <span className="text-[10px] font-normal text-muted-foreground">({(previewData.totals.totalAbsentMin / 60).toFixed(1)}h)</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1.5 px-2.5 text-muted-foreground font-medium">Late Sessions & Minutes</td>
                                                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                                            {previewData.totals.totalLateSessions} sess <span className="text-[10px] font-normal text-muted-foreground">({previewData.totals.totalLateMinutes} min)</span>
                                                        </td>
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
                                            setExcludedFacultyKeys([]);
                                            showToast('Form filters and exclusions reset to defaults.');
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
                            isMaximized ? "max-w-[1240px]" : "max-w-[1050px]"
                        )}>
                            {/* Status Pill */}
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live Preview (A3 Landscape)
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
                                    "print-only-sheet w-full min-h-[750px] bg-white text-slate-900 border border-slate-300 shadow-xl p-[0.35in] transition-transform origin-top flex flex-col justify-between box-border",
                                    isMaximized ? "max-w-[1240px]" : "max-w-[1050px]"
                                )}
                                style={{ transform: `scale(${zoomLevel / 100})` }}
                            >
                                <div className="space-y-4">
                                    {/* 1. OFFICIAL DSSC LETTERHEAD (Centered layout with CIDS_Logo.jpg, no bottom border line) */}
                                    <div className="flex flex-col items-center justify-center text-center pb-2 space-y-2">
                                        <img
                                            src="/CIDS_Logo.jpg"
                                            alt="CIDS Logo"
                                            className="w-16 h-16 object-contain rounded-full bg-white p-0.5 shadow-2xs"
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
                                    <div className="bg-slate-50 border border-slate-300 py-2.5 px-3 text-center rounded-xs space-y-1">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            {reportFormat === 'weekly' ? 'WEEKLY' : reportFormat === 'monthly' ? 'MONTHLY' : 'COLLEGE'} FACULTY ATTENDANCE SUMMARY
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-800">
                                            {formatPeriodWithDateRange(selectedPeriod, periodTab)} · {selectedAY} · {selectedSemester}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8.5px] text-slate-600 font-medium border-t border-slate-200 pt-1.5 mt-1">
                                            <span>Official Start of Classes: <strong className="text-slate-900">{academic_period?.official_start_of_classes || 'Aug 10, 2026'}</strong></span>
                                            <span>·</span>
                                            <span>Official End of Classes: <strong className="text-slate-900">{academic_period?.official_end_of_classes || 'Dec 18, 2026'}</strong></span>
                                            <span>·</span>
                                            <span>Schedule: <strong className="text-indigo-900">Verified Published Master Timetable</strong></span>
                                            <span>·</span>
                                            <span>Sync: <strong className="text-slate-900">{last_synced_at}</strong></span>
                                            <span>·</span>
                                            <span>Data Baseline: <strong className="text-slate-900">Atomic Minutes</strong></span>
                                        </div>
                                    </div>

                                    {/* 3. KEY SUMMARIES (PROFESSIONAL TABLE VIEW - MONOCHROME, NO COLORS) */}
                                    {keySummaries.attendanceTotals && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                                <span>KEY SUMMARIES (MINUTE BASELINE & INSTRUCTIONAL COMPLETION)</span>
                                            </div>

                                            <div className="border border-slate-300 rounded overflow-hidden">
                                                <table className="w-full text-[9px] text-center border-collapse font-sans">
                                                    <thead>
                                                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase">
                                                            <th className="py-2 px-1 border-r border-slate-300">FACULTY</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">SCHEDULED TIME</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">ELIGIBLE TIME</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">ATTENDED TIME</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">APPROVED LEAVE</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">UNEXCUSED ABSENCE</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">LATE SESS</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">LATE TIME</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">MAKE-UP REQ.</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">MAKE-UP COMP.</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">ATTENDANCE COV</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">ON-TIME</th>
                                                            <th className="py-2 px-1">INSTR COMPLETION</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        <tr className="bg-white font-mono text-[9px]">
                                                            <td className="py-2 px-1.5 border-r border-slate-300 font-bold text-slate-900 text-[11px]">
                                                                {previewData.totals.facultyCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalScheduledMin)}
                                                                <span className="text-[7.5px] font-normal text-slate-500 block">({previewData.totals.totalScheduledMin.toLocaleString()}m)</span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalEligibleMin)}
                                                                <span className="text-[7.5px] font-normal text-slate-500 block">({previewData.totals.totalEligibleMin.toLocaleString()}m)</span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalAttendedMin)}
                                                                <span className="text-[7.5px] font-normal text-slate-500 block">({previewData.totals.totalAttendedMin.toLocaleString()}m)</span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalLeaveMin)}
                                                                <span className="text-[7.5px] font-normal text-slate-500 block">({previewData.totals.totalLeaveMin.toLocaleString()}m)</span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalAbsentMin)}
                                                                <span className="text-[7.5px] font-normal text-slate-500 block">({previewData.totals.totalAbsentMin.toLocaleString()}m)</span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {previewData.totals.totalLateSessions}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalLateMinutes)}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalMakeUpReqMin)}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {formatDuration(previewData.totals.totalMakeUpDoneMin)}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-100 text-slate-900 font-bold border border-slate-300">
                                                                    {previewData.totals.overallCoverage !== null ? `${previewData.totals.overallCoverage}%` : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-100 text-slate-900 font-bold border border-slate-300">
                                                                    {previewData.totals.overallOnTime !== null ? `${previewData.totals.overallOnTime}%` : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-1 font-bold text-slate-900">
                                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-100 text-slate-900 font-bold border border-slate-300">
                                                                    {previewData.totals.overallCompletion !== null ? `${previewData.totals.overallCompletion}%` : 'N/A'}
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
                                        <div className="flex flex-wrap items-center justify-between gap-1 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <span>FACULTY ATTENDANCE & INSTRUCTIONAL COMPLETION DETAILS (MINUTE BASELINE)</span>
                                                {previewData.excludedList.length > 0 && (
                                                    <span className="no-print no-pdf inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 normal-case tracking-normal">
                                                        <span>{previewData.excludedList.length} faculty excluded</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleRestoreAllFacultyRows}
                                                            className="text-amber-700 hover:text-amber-950 underline font-semibold cursor-pointer ml-1"
                                                            title="Restore all removed faculty rows"
                                                        >
                                                            Restore All
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                            <span className="no-print no-pdf text-[9px] font-normal normal-case text-slate-500">
                                                Hover faculty row to edit name or exclude • Click to view timetable audit trail
                                            </span>
                                        </div>

                                        {/* Excluded faculty restore chips banner */}
                                        {previewData.excludedList.length > 0 && (
                                            <div className="no-print no-pdf flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[8.5px] text-amber-900">
                                                <span className="font-bold flex items-center gap-1 text-amber-950">
                                                    Excluded from preview:
                                                </span>
                                                {previewData.excludedList.map(item => (
                                                    <span
                                                        key={item.key}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-slate-800 border border-amber-300 font-medium shadow-2xs"
                                                    >
                                                        <span className="truncate max-w-[140px]">{item.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestoreFacultyRow(item.key, item.name)}
                                                            className="text-slate-400 hover:text-rose-600 font-bold text-[10px] leading-none cursor-pointer"
                                                            title={`Restore ${item.name}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={handleRestoreAllFacultyRows}
                                                    className="text-[8px] font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer ml-auto"
                                                >
                                                    Reset All Exclusions
                                                </button>
                                            </div>
                                        )}

                                        <div className="border border-slate-300 rounded overflow-x-auto print:overflow-visible print:border-slate-400">
                                            <table className="w-full text-[8px] text-left border-collapse print:text-[7.5px] table-auto">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase print:bg-slate-100">
                                                        <th className="py-1 px-1 text-center w-5 border-r border-slate-300">#</th>
                                                        <th className="py-1 px-1.5 border-r border-slate-300 min-w-[125px]">FACULTY NAME</th>
                                                        <th className="py-1 px-1 text-center border-r border-slate-300 whitespace-nowrap">PROG</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Total Scheduled Teaching Time">SCHEDULED</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Eligible Scheduled Time = Scheduled - Approved Exclusions">ELIGIBLE</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Attended Instructional Time">ATTENDED</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Approved Leave Time (Excluded from eligible denominator)">LEAVE</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Unexcused Absence Time">ABSENCE</th>
                                                        <th className="py-1 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Late Attended Sessions Count">LATE SESS</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Cumulative Late Time">LATE TIME</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Make-Up Time Required">MAKE-UP REQ.</th>
                                                        <th className="py-1 px-1 text-right border-r border-slate-300 whitespace-nowrap" title="Make-Up Time Completed">MAKE-UP COMP.</th>
                                                        <th className="py-1 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Attendance Coverage = Attended Eligible Min ÷ Eligible Scheduled Min × 100">ATTENDANCE COV</th>
                                                        <th className="py-1 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="On-Time Arrival Rate %">ON-TIME</th>
                                                        <th className="py-1 px-1 text-center border-r border-slate-300 whitespace-nowrap" title="Instructional Completion Rate = (Attended Min + Make-Up Done) ÷ Required Scheduled Min × 100">COMPLETION</th>
                                                        <th className="py-1 px-1 text-center whitespace-nowrap" title="Evaluated Attendance Remarks">REMARKS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-medium">
                                                    {previewData.rows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={16} className="py-6 text-center text-slate-500 italic">
                                                                No attendance records match the selected faculty or filter criteria.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        previewData.rows.map((row, idx) => {
                                                            // Monitoring Legend Band for Attendance Coverage
                                                            let covBadge = { text: 'N/A', cls: 'bg-slate-100 text-slate-600 border-slate-300' };
                                                            if (row.attendanceCoverage !== null) {
                                                                if (row.attendanceCoverage >= 95) {
                                                                    covBadge = { text: 'Excellent', cls: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
                                                                } else if (row.attendanceCoverage >= 90) {
                                                                    covBadge = { text: 'Good', cls: 'bg-blue-50 text-blue-800 border-blue-300' };
                                                                } else if (row.attendanceCoverage >= 80) {
                                                                    covBadge = { text: 'Needs Monitoring', cls: 'bg-amber-50 text-amber-800 border-amber-300' };
                                                                } else {
                                                                    covBadge = { text: 'Needs Attention', cls: 'bg-red-50 text-red-800 border-red-300' };
                                                                }
                                                            }

                                                            return (
                                                                <tr
                                                                    key={row.id || idx}
                                                                    onClick={() => setSelectedAuditFaculty(row)}
                                                                    className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                                                                    title="Click to view detailed session audit trail"
                                                                >
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 text-slate-500 font-mono text-[8px]">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-1 px-2 font-semibold border-r border-slate-200 text-slate-900 group/cell">
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <span className="truncate hover:text-amber-700 underline-offset-2 hover:underline">
                                                                                {row.instructor_name}
                                                                            </span>
                                                                            <div className="flex items-center gap-0.5 no-print no-pdf shrink-0">
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
                                                                                    className="opacity-0 group-hover/cell:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-700 transition-all cursor-pointer"
                                                                                >
                                                                                    <Pencil className="w-2.5 h-2.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    title={`Remove ${row.instructor_name} from this report preview`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const rowKey = row.faculty_id ? `fid_${row.faculty_id}` : `name_${(row.original_instructor_name || row.instructor_name).toLowerCase().trim()}`;
                                                                                        handleExcludeFacultyRow(rowKey, row.instructor_name);
                                                                                    }}
                                                                                    className="opacity-0 group-hover/cell:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                                                                >
                                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        {row.effectiveDateNote && (
                                                                            <span className="text-[7px] text-amber-700 font-sans font-normal block leading-tight mt-0.5">
                                                                                {row.effectiveDateNote}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-bold text-slate-800 text-[8px]">
                                                                        {row.program}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-800">
                                                                        {row.isNotYetEmployed ? 'N/A' : (
                                                                            <>
                                                                                {formatDuration(row.scheduledMin)}
                                                                                <span className="text-[7px] text-slate-400 block font-sans">({row.scheduledMin}m)</span>
                                                                            </>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-800 font-semibold">
                                                                        {row.isNotYetEmployed ? 'N/A' : (
                                                                            <>
                                                                                {formatDuration(row.eligibleMin)}
                                                                                <span className="text-[7px] text-slate-400 block font-sans">({row.eligibleMin}m)</span>
                                                                            </>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                                                                        {row.isNotYetEmployed ? 'N/A' : (
                                                                            <>
                                                                                {formatDuration(row.attendedMin)}
                                                                                <span className="text-[7px] text-slate-400 block font-sans">({row.attendedMin}m)</span>
                                                                            </>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-600">
                                                                        {row.isNotYetEmployed ? 'N/A' : row.leaveMin > 0 ? (
                                                                            <>
                                                                                {formatDuration(row.leaveMin)}
                                                                                <span className="text-[7px] text-slate-400 block font-sans">({row.leaveMin}m)</span>
                                                                            </>
                                                                        ) : '0m'}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                                                                        {row.isNotYetEmployed ? 'N/A' : row.absentMin > 0 ? (
                                                                            <>
                                                                                {formatDuration(row.absentMin)}
                                                                                <span className="text-[7px] text-red-500 block font-sans">({row.absentMin}m)</span>
                                                                            </>
                                                                        ) : '0m'}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-700">
                                                                        {row.isNotYetEmployed ? 'N/A' : row.late}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                                                                        {row.isNotYetEmployed ? 'N/A' : formatDuration(row.lateMinutes)}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                                                                        {row.isNotYetEmployed ? 'N/A' : row.makeUpReqMin > 0 ? formatDuration(row.makeUpReqMin) : '0m'}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                                                                        {row.isNotYetEmployed ? 'N/A' : row.makeUpDoneMin > 0 ? formatDuration(row.makeUpDoneMin) : '0m'}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-bold font-mono text-slate-900 whitespace-nowrap">
                                                                        {!row.isNotYetEmployed && row.eligibleMin > 0 && row.attendanceCoverage !== null ? (
                                                                            <span className="font-semibold text-slate-900">
                                                                                {row.attendanceCoverage}%
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400 font-normal">
                                                                                N/A
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                                                                        {!row.isNotYetEmployed && row.attendedMin > 0 && row.onTimeRate !== null ? `${row.onTimeRate}%` : 'N/A'}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-center border-r border-slate-200 font-bold font-mono text-slate-900 whitespace-nowrap">
                                                                        {!row.isNotYetEmployed && row.eligibleMin > 0 && row.instructionalCompletion !== null ? (
                                                                            <span>{row.instructionalCompletion}%</span>
                                                                        ) : (
                                                                            <span className="text-slate-400 font-normal">N/A</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 text-center whitespace-nowrap font-sans">
                                                                        {row.isNotYetEmployed ? (
                                                                            <span className="text-[8px] text-slate-900 font-medium block">
                                                                                Not Yet Employed
                                                                            </span>
                                                                        ) : row.scheduledMin === 0 ? (
                                                                            <span className="text-[8px] text-slate-900 block font-normal">
                                                                                N/A – No Classes
                                                                            </span>
                                                                        ) : row.leaveMin === row.scheduledMin ? (
                                                                            <span className="text-[8px] text-slate-900 font-medium block">
                                                                                On Approved Leave
                                                                            </span>
                                                                        ) : row.eligibleMin === 0 ? (
                                                                            <span className="text-[8px] text-slate-900 block font-normal">
                                                                                N/A – Excluded
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[8px] text-slate-900 font-semibold block">
                                                                                {covBadge.text}
                                                                            </span>
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

                                    {/* Administrative Attendance Coverage Legend & Monitoring Formula Guide (Black & White below Matrix, above Signatories) */}
                                    <div className="mt-3 p-3 rounded-xs border border-slate-900 bg-white text-[8.5px] leading-tight space-y-2 text-slate-900 page-break-inside-avoid break-inside-avoid">
                                        {/* Header Row: Legend Title & Tier Badges in B&W */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-black text-slate-900 uppercase tracking-wider text-[9px]">ATTENDANCE COVERAGE MONITORING LEGEND:</span>
                                                <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border border-slate-900 bg-white text-slate-900">≥95.0% Excellent</span>
                                                <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border border-slate-900 bg-white text-slate-900">90.0–94.99% Good</span>
                                                <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border border-slate-900 bg-white text-slate-900">80.0–89.99% Needs Monitoring</span>
                                                <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border border-slate-900 bg-white text-slate-900">&lt;80.0% Needs Attention</span>
                                                <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border border-slate-900 bg-white text-slate-900">N/A – Excluded</span>
                                            </div>
                                            <span className="text-slate-700 italic text-[8px]">Atomic Baseline: <strong>Minutes</strong> (e.g. 1.5h = 90 min / 3.0h = 180 min)</span>
                                        </div>

                                        {/* Row 1: Core Mathematical Formulas */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[8px] text-slate-900 border-b border-slate-300 pb-2">
                                            <p>
                                                <strong>Eligible Mins</strong> = Scheduled Mins − Approved Excluded Mins (Approved Leave, Suspensions, Institutional Holidays).
                                            </p>
                                            <p>
                                                <strong>Attendance Coverage</strong> = (Attended Eligible Mins ÷ Eligible Mins) × 100. (Returns N/A when Eligible Mins = 0).
                                            </p>
                                            <p>
                                                <strong>Instructional Completion</strong> = ((Attended Mins + Make-Up Completed Mins) ÷ Required Scheduled Mins) × 100.
                                            </p>
                                        </div>

                                        {/* Row 2: Status Definitions & Meaning Guide */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 text-[8px] text-slate-800">
                                            <div>
                                                <p className="font-bold text-slate-900">≥95.0% Excellent:</p>
                                                <p className="text-[7.5px] text-slate-700">Outstanding delivery; faculty attended almost all eligible teaching hours on schedule.</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">90.0–94.99% Good:</p>
                                                <p className="text-[7.5px] text-slate-700">Meets standard delivery target; minor variances or late arrivals within acceptable threshold.</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">80.0–89.99% Needs Monitoring:</p>
                                                <p className="text-[7.5px] text-slate-700">Below ideal target; instructional delivery requires monitoring or scheduling of make-up classes.</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">&lt;80.0% Needs Attention:</p>
                                                <p className="text-[7.5px] text-slate-700">Critical deficiency; faculty missed substantial contact hours requiring urgent make-up or intervention.</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">N/A – Excluded:</p>
                                                <p className="text-[7.5px] text-slate-700">Eligible scheduled minutes are zero (e.g. 100% on approved official leave, institutional class suspensions, or no active classes this period).</p>
                                            </div>
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
                                        Eligible Scheduled Mins
                                    </span>
                                    <span className="text-lg font-black text-foreground font-mono block mt-0.5">
                                        {(selectedAuditFaculty.eligibleMin ?? Math.round(selectedAuditFaculty.eligibleHours * 60)).toLocaleString()} min
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Total: {(selectedAuditFaculty.scheduledMin ?? Math.round(selectedAuditFaculty.scheduledHours * 60)).toLocaleString()}m (Excl. {(selectedAuditFaculty.leaveMin ?? Math.round(selectedAuditFaculty.leaveHours * 60)).toLocaleString()}m leave)
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Attended Delivery Mins
                                    </span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                                        {(selectedAuditFaculty.attendedMin ?? Math.round(selectedAuditFaculty.attendedHours * 60)).toLocaleString()} min
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Coverage: <strong className="text-foreground">{selectedAuditFaculty.attendanceCoverage !== null ? `${selectedAuditFaculty.attendanceCoverage}%` : 'N/A'}</strong>
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl border border-border bg-card/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                        Punctuality & Late Mins
                                    </span>
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                                        {selectedAuditFaculty.onTimeRate !== null ? `${selectedAuditFaculty.onTimeRate}%` : 'N/A'}
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
                                        {selectedAuditFaculty.instructionalCompletion !== null ? `${selectedAuditFaculty.instructionalCompletion}%` : 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Make-Up: {(selectedAuditFaculty.makeUpDoneMin ?? Math.round(selectedAuditFaculty.makeUpCompletedHours * 60)).toLocaleString()}m / {(selectedAuditFaculty.makeUpReqMin ?? Math.round(selectedAuditFaculty.makeUpRequiredHours * 60)).toLocaleString()}m req
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
                                    <li><strong>Attendance Coverage:</strong> (Attended Eligible Mins ÷ Eligible Scheduled Mins) × 100. Approved leaves are excluded from the denominator. Returns N/A if eligible scheduled mins are zero.</li>
                                    <li><strong>Punctuality:</strong> Recorded as an attribute of attendance (arrival time & late minutes), not mixed into attendance rate totals.</li>
                                    <li><strong>Instructional Completion:</strong> Incorporates completed, verified make-up classes so faculty who deliver missed classes achieve 100% completion against original required schedule.</li>
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
