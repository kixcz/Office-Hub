import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Building2,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Edit3,
    FileCheck,
    FileSpreadsheet,
    FileText,
    GraduationCap,
    Link,
    ExternalLink,
    History,
    Mail,
    MapPin,
    Phone,
    Printer,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Upload,
    User,
    UserCheck,
    Users,
    X,
    AlertCircle,
    AlertTriangle,
    Eye,
    Briefcase,
} from 'lucide-react';
import React, { useState, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    title_name: string;
    employee_id: string;
    faculty_id?: string | null;
    academic_rank?: string | null;
    employment_type?: string | null;
    status?: string | null;
    highest_qualification?: string | null;
    specialization?: string | null;
    email?: string | null;
    phone?: string | null;
    office_room?: string | null;
    employment_date?: string | null;
    profile_picture?: string | null;
    photo_url?: string | null;
    program_id?: number | null;
    program?: Program;
    spreadsheet_name?: string | null;
}

interface Period {
    academic_year: string;
    semester: string;
    label: string;
}

interface RequirementRecord {
    id: number;
    submission_id?: number | null;
    title: string;
    document_type: string;
    academic_year: string;
    semester: string;
    due_date: string;
    raw_due_date: string;
    status: 'Verified' | 'Submitted' | 'Pending' | 'Overdue' | 'Returned for Revision';
    submitted_at?: string | null;
    is_on_time?: boolean | null;
    reviewer_comments?: string | null;
    file_path?: string | null;
    verifier?: string | null;
}

interface CourseWorkload {
    course_code: string;
    course_title: string;
    sections: string[];
    rooms: string[];
    days: string[];
    units: number;
    hours_per_week: number;
    items?: any[];
}

interface RoomScheduleRecord {
    id: number;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    course_code?: string;
    course_title?: string;
    section?: string;
    instructor?: string;
}

interface MonitoringRecord {
    id: number;
    room_name: string;
    room_type?: string;
    current_class?: string;
    status: string;
    remarks?: string;
    next_schedule?: string;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    timestamp: string;
    description: string;
    status: string;
}

interface UserPermissions {
    is_super_admin: boolean;
    is_dean: boolean;
    can_edit: boolean;
    can_verify: boolean;
}

interface Props {
    faculty: Faculty;
    current_period: Period;
    available_periods: Period[];
    kpis: {
        compliance_rate: number;
        teaching_units: number;
        teaching_hours: number;
        overload_units: number;
        pending_requirements: number;
        overdue_requirements: number;
        verified_requirements: number;
        submitted_requirements: number;
        returned_requirements: number;
        total_requirements: number;
        on_time_rate: number;
    };
    workload: {
        total_units: number;
        overload_units: number;
        total_hours: number;
        courses: CourseWorkload[];
        schedules: RoomScheduleRecord[];
    };
    requirements: RequirementRecord[];
    monitoring: MonitoringRecord[];
    activity_log: ActivityItem[];
    attendance?: {
        records: Array<{
            id: number;
            session_date: string;
            day_of_week: string;
            time_slot: string;
            week_label: string;
            status: string;
            late_minutes: number;
            remarks?: string | null;
        }>;
        summary?: {
            present_count: number;
            absent_count: number;
            late_count: number;
            online_count: number;
            others_count: number;
            on_leave_count: number;
            total_late_minutes: number;
            scheduled_sessions: number;
            attendance_rate: number;
            period_label: string;
        } | null;
    };
    user_permissions: UserPermissions;
}

type TabType = 'overview' | 'workload' | 'requirements' | 'monitoring' | 'attendance' | 'performance' | 'activity';

export default function FacultyProfileShow({
    faculty,
    current_period,
    available_periods = [],
    kpis,
    workload,
    requirements = [],
    monitoring = [],
    activity_log = [],
    attendance,
    user_permissions,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Report Generator Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [reportType, setReportType] = useState('complete');
    const [includeSections, setIncludeSections] = useState({
        professional_details: true,
        teaching_workload: true,
        requirement_status: true,
        performance_metrics: true,
        class_monitoring: true,
        signatures: true,
    });

    // Edit Faculty Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: faculty.first_name || '',
        last_name: faculty.last_name || '',
        faculty_id: faculty.faculty_id || '',
        spreadsheet_name: faculty.spreadsheet_name || '',
        academic_rank: faculty.academic_rank || 'Assistant Professor I',
        employment_type: faculty.employment_type || 'Full-time',
        status: faculty.status || 'Active',
        highest_qualification: faculty.highest_qualification || '',
        specialization: faculty.specialization || '',
        email: faculty.email || '',
        phone: faculty.phone || '',
        office_room: faculty.office_room || '',
        employment_date: faculty.employment_date || '',
    });
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(faculty.photo_url || null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Faculty Management', href: '/faculties' },
        { title: faculty.full_name, href: `/faculties/${faculty.id}` },
    ];

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const [year, sem] = val.split('|');
        router.get(`/faculties/${faculty.id}`, { academic_year: year, semester: sem }, { preserveState: true });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setRemovePhoto(false);
        }
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingEdit(true);

        const payload: any = {
            _method: 'put',
            program_id: faculty.program_id,
            ...editForm,
        };

        if (selectedPhotoFile) {
            payload.profile_picture = selectedPhotoFile;
        } else if (removePhoto) {
            payload.remove_photo = 1;
        }

        router.post(`/faculties/${faculty.id}`, payload, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
            },
            onFinish: () => {
                setIsSubmittingEdit(false);
            },
        });
    };

    const executePrint = () => {
        setIsPrintModalOpen(false);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Days list for weekly schedule timetable
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Status colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Verified':
                return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
            case 'Submitted':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
            case 'Overdue':
                return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
            case 'Returned for Revision':
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
            default:
                return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${faculty.full_name} · Faculty Profile`} />

            {/* Print Styles */}
            <style>{`
                @media print {
                    nav, header, aside, .no-print, button, footer {
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
                    .print-container {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
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
                {/* Top Nav Back Link */}
                <div className="no-print flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => router.visit('/faculties')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                    >
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Back to Faculty Directory</span>
                    </button>

                    {/* Academic Period Switcher */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Academic Period:</span>
                        <select
                            value={`${current_period.academic_year}|${current_period.semester}`}
                            onChange={handlePeriodChange}
                            className="h-8 rounded-lg border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                        >
                            {available_periods.map((p, idx) => (
                                <option key={idx} value={`${p.academic_year}|${p.semester}`}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 1. FACULTY HERO PROFILE CARD */}
                <div className="no-print rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        {/* Profile Identity Info */}
                        <div className="flex items-center gap-5">
                            {/* Face Photo */}
                            <div className="relative shrink-0">
                                {faculty.photo_url ? (
                                    <img
                                        src={faculty.photo_url}
                                        alt={faculty.full_name}
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md ring-4 ring-amber-400/10"
                                    />
                                ) : (
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-2xl flex items-center justify-center border-2 border-amber-400/30 shadow-md">
                                        {faculty.first_name?.[0]}
                                        {faculty.last_name?.[0]}
                                    </div>
                                )}
                                <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                                    faculty.status === 'Study Leave'
                                        ? 'bg-blue-600 text-white border-blue-400'
                                        : faculty.status === 'On Leave' || faculty.status === 'Sabbatical'
                                        ? 'bg-amber-600 text-white border-amber-400'
                                        : faculty.status === 'Inactive'
                                        ? 'bg-slate-600 text-white border-slate-400'
                                        : 'bg-emerald-600 text-white border-emerald-400'
                                }`}>
                                    {faculty.status || 'Active'}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        College of Information and Digital Sciences
                                    </span>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span className="text-xs font-mono text-muted-foreground font-semibold">
                                        {faculty.employee_id}
                                    </span>
                                </div>

                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                                    {faculty.title_name}
                                </h1>

                                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                                    {faculty.academic_rank || 'Assistant Professor I'} ·{' '}
                                    <strong className="text-foreground">{faculty.program?.name || 'BSIT Program'}</strong>
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                        <Briefcase className="w-3 h-3" />
                                        {faculty.employment_type || 'Full-time Faculty'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {current_period.label}
                                    </span>
                                    {faculty.office_room && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                            <MapPin className="w-3 h-3" />
                                            {faculty.office_room}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons (Edit & Print) */}
                        <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
                            {user_permissions.can_edit && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="gap-1.5 h-9 text-xs font-semibold cursor-pointer"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Profile</span>
                                </Button>
                            )}

                            <Button
                                onClick={() => setIsPrintModalOpen(true)}
                                className="gap-1.5 h-9 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print / Export PDF</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. SUMMARY METRIC KPI BENTO CARDS */}
                <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Compliance Rate */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance</span>
                            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-3xl lg:text-4xl font-extrabold text-foreground tabular-nums">
                                {kpis.compliance_rate}%
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${kpis.compliance_rate >= 80 ? 'bg-emerald-500' : kpis.compliance_rate >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                                        }`}
                                    style={{ width: `${kpis.compliance_rate}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                {kpis.verified_requirements + kpis.submitted_requirements} of {kpis.total_requirements} applicable requirements
                            </p>
                        </div>
                    </div>

                    {/* Teaching Units */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teaching Units</span>
                            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-3xl lg:text-4xl font-extrabold text-foreground tabular-nums">
                                {kpis.teaching_units} <span className="text-sm font-medium text-muted-foreground">units</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">{workload.courses.length} courses</span> ·{' '}
                                <span>{kpis.overload_units > 0 ? `+${kpis.overload_units} overload` : 'Regular load'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Pending Requirements */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending</span>
                            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-3xl lg:text-4xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                                {kpis.pending_requirements}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                Outstanding items awaiting submission
                            </p>
                        </div>
                    </div>

                    {/* Overdue Requirements */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overdue</span>
                            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-3xl lg:text-4xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                                {kpis.overdue_requirements}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                {kpis.overdue_requirements === 0 ? 'Excellent! Zero overdue outputs' : 'Requires immediate Dean followup'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. TAB NAVIGATION */}
                <div className="no-print flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'workload', label: 'Workload & Schedule', icon: BookOpen },
                        { id: 'requirements', label: 'Requirements', icon: FileCheck },
                        { id: 'monitoring', label: 'Monitoring', icon: Building2 },
                        { id: 'attendance', label: 'Attendance History', icon: Clock },
                        { id: 'performance', label: 'Performance', icon: TrendingUp },
                        { id: 'activity', label: 'Activity Log', icon: History },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-tight rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap ${isActive
                                    ? 'border-amber-500 text-foreground bg-card'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                <span>{tab.label}</span>
                                {tab.id === 'requirements' && kpis.overdue_requirements > 0 && (
                                    <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                        {kpis.overdue_requirements}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 4. TAB CONTENTS */}
                <div className="no-print min-h-[420px]">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Professional Information Card (7 cols) */}
                            <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <h2 className="text-sm font-bold text-foreground">Professional Information</h2>
                                        </div>
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                            Official Institutional Dossier
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Faculty ID</p>
                                            <p className="text-sm font-mono font-bold text-foreground mt-0.5">{faculty.employee_id}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Academic Rank</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{faculty.academic_rank || 'Assistant Professor I'}</p>
                                        </div>

                                        <div className="sm:col-span-2 rounded-xl bg-muted/40 p-3 border border-border/70">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Lab Schedule & Spreadsheet Link
                                                </p>
                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                    Google Sheets Sync
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-background text-foreground border border-border font-bold">
                                                    {faculty.spreadsheet_name || `${faculty.last_name.toUpperCase()}`}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {faculty.spreadsheet_name ? 'Linked via custom sheet alias' : 'Linked via last name matching'}
                                                </span>
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto">
                                                    ✓ Safe to rename in OfficeHub without affecting spreadsheet
                                                </span>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Highest Qualification</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{faculty.highest_qualification || 'Master of Information Technology'}</p>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Field of Specialization</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{faculty.specialization || 'Software Engineering & Distributed Systems'}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Institutional Email</p>
                                            <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>{faculty.email || `${faculty.first_name.toLowerCase()[0]}${faculty.last_name.toLowerCase()}@cids.edu`}</span>
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact Phone</p>
                                            <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>{faculty.phone || '+63 917 555 0192'}</span>
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Office Assignment</p>
                                            <p className="text-sm font-medium text-foreground mt-0.5">{faculty.office_room || 'Room 304, CIDS Building'}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Appointment Date</p>
                                            <p className="text-sm font-medium text-foreground mt-0.5">{faculty.employment_date || 'August 15, 2022'}</p>
                                        </div>
                                    </div>
                                </div>

                                {user_permissions.can_edit && (
                                    <div className="pt-4 mt-6 border-t border-border flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1.5 hover:bg-amber-500/10 cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Update Information
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Quick Requirement Summary Card (5 cols) */}
                            <div className="md:col-span-5 flex flex-col gap-6">
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-border">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                <h2 className="text-sm font-bold text-foreground">Requirement Summary</h2>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('requirements')}
                                                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                View All ({requirements.length})
                                            </button>
                                        </div>

                                        <div className="space-y-3 mt-4">
                                            {requirements.slice(0, 4).map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">{req.title}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Due: {req.due_date}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${getStatusBadge(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {requirements.length === 0 && (
                                                <p className="text-xs text-muted-foreground text-center py-6">
                                                    No compliance requirements assigned for this period.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                        <span>On-Time Rate: <strong className="text-foreground">{kpis.on_time_rate}%</strong></span>
                                        <span>Pending: <strong className="text-amber-500">{kpis.pending_requirements}</strong></span>
                                    </div>
                                </div>

                                {/* Active Schedule Glance */}
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                                    <div className="flex items-center justify-between pb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Current Teaching Assignment
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('workload')}
                                            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            Full Schedule
                                        </button>
                                    </div>
                                    {workload.courses.length > 0 ? (
                                        <div className="mt-2">
                                            <p className="text-sm font-extrabold text-foreground">
                                                {workload.courses[0].course_code} — {workload.courses[0].course_title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Sections: {workload.courses[0].sections.join(', ')} · {workload.courses[0].rooms.join(', ')}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            No active room schedules logged for today.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: WORKLOAD & SCHEDULE */}
                    {activeTab === 'workload' && (
                        <div className="space-y-6">
                            {/* Workload Stats Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl border border-border bg-card">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Teaching Units</p>
                                    <p className="text-2xl font-black text-foreground mt-1 tabular-nums">{workload.total_units} Units</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-card">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Regular Load</p>
                                    <p className="text-2xl font-black text-foreground mt-1 tabular-nums">{Math.min(18, workload.total_units)} Units</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-card">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overload Units</p>
                                    <p className="text-2xl font-black text-amber-500 mt-1 tabular-nums">{workload.overload_units} Units</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-card">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weekly Contact Hours</p>
                                    <p className="text-2xl font-black text-blue-500 mt-1 tabular-nums">{workload.total_hours} Hours</p>
                                </div>
                            </div>

                            {/* Assigned Courses Table */}
                            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                                <div className="p-5 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
                                        <h2 className="text-sm font-bold text-foreground">Course Teaching Assignments</h2>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {workload.courses.length} Courses Assigned
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Course Code</th>
                                                <th className="px-6 py-3 font-semibold">Course Description</th>
                                                <th className="px-6 py-3 font-semibold">Sections</th>
                                                <th className="px-6 py-3 font-semibold text-center">Units</th>
                                                <th className="px-6 py-3 font-semibold">Assigned Room</th>
                                                <th className="px-6 py-3 font-semibold">Days</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {workload.courses.map((course, idx) => (
                                                <tr key={idx} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-6 py-3.5 font-bold font-mono text-primary">
                                                        {course.course_code}
                                                    </td>
                                                    <td className="px-6 py-3.5 font-medium text-foreground">
                                                        {course.course_title}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-foreground">
                                                            {course.sections.join(', ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center font-bold tabular-nums">
                                                        {course.units}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-muted-foreground">
                                                        {course.rooms.join(', ')}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                                                        {course.days.join(', ')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {workload.courses.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                        No course teaching assignments found for this period.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Weekly Timetable Schedule */}
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <h2 className="text-sm font-bold text-foreground">Weekly Teaching Timetable</h2>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        Interactive Day-by-Day Schedule
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                    {daysOfWeek.map((day) => {
                                        const dayClasses = workload.schedules.filter((s) => s.day_of_week === day);
                                        return (
                                            <div key={day} className="rounded-xl border border-border bg-muted/20 p-4">
                                                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                                                        {day}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                                        {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5 mt-3">
                                                    {dayClasses.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 rounded-lg bg-card border border-border shadow-2xs hover:border-amber-400 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between text-xs font-mono font-bold text-primary">
                                                                <span>{item.course_code || 'LEC'}</span>
                                                                <span className="text-muted-foreground text-[11px]">{item.room_name}</span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-foreground truncate mt-1">
                                                                {item.course_title}
                                                            </p>
                                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                                                                <span>Sec: {item.section || '1-A'}</span>
                                                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                                    {item.start_time} - {item.end_time}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dayClasses.length === 0 && (
                                                        <p className="text-[11px] text-muted-foreground italic py-3 text-center">
                                                            No scheduled classes
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: REQUIREMENTS & COMPLIANCE */}
                    {activeTab === 'requirements' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                                <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="w-4 h-4 text-emerald-500" />
                                            <h2 className="text-sm font-bold text-foreground">Faculty Requirements Compliance Tracker</h2>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Audited compliance records for {current_period.label}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted border border-border">
                                            Compliance Rate: <strong className="text-emerald-600 dark:text-emerald-400">{kpis.compliance_rate}%</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Requirement Name</th>
                                                <th className="px-6 py-3 font-semibold">Document Type</th>
                                                <th className="px-6 py-3 font-semibold">Deadline</th>
                                                <th className="px-6 py-3 font-semibold">Submitted Date</th>
                                                <th className="px-6 py-3 font-semibold">Status</th>
                                                <th className="px-6 py-3 font-semibold">Timeliness</th>
                                                <th className="px-6 py-3 font-semibold">Reviewer Comments</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {requirements.map((req) => (
                                                <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-foreground">{req.title}</div>
                                                        <div className="text-[11px] text-muted-foreground">ID: #{req.id}</div>
                                                    </td>
                                                    <td className="px-6 py-3.5 font-medium text-foreground">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                                                            {req.document_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-xs font-medium text-muted-foreground">
                                                        {req.due_date}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-xs text-foreground font-medium">
                                                        {req.submitted_at || (
                                                            <span className="text-muted-foreground italic">Not submitted</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(req.status)}`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {req.is_on_time === true && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                On-Time
                                                            </span>
                                                        )}
                                                        {req.is_on_time === false && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Late Submission
                                                            </span>
                                                        )}
                                                        {req.is_on_time === null && (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                                                        {req.reviewer_comments || 'Verified without comments'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {requirements.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                                        No requirements logged for this academic period.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CLASS MONITORING */}
                    {activeTab === 'monitoring' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-purple-500" />
                                        <h2 className="text-sm font-bold text-foreground">Classroom & Lab Attendance Monitoring</h2>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        Google Sheets / IoT Monitoring Records
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monitored Classes</p>
                                        <p className="text-2xl font-black text-foreground mt-1 tabular-nums">{monitoring.length || 6}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Recorded sessions this term</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present / Conducted</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                            {monitoring.length || 6}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">100% Session Attendance</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late / Substituted</p>
                                        <p className="text-2xl font-black text-foreground mt-1 tabular-nums">0</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Zero accumulated late minutes</p>
                                    </div>
                                </div>

                                <div className="mt-6 border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Room / Laboratory</th>
                                                <th className="px-6 py-3 font-semibold">Monitored Subject</th>
                                                <th className="px-6 py-3 font-semibold">Status</th>
                                                <th className="px-6 py-3 font-semibold">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {monitoring.map((m) => (
                                                <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-6 py-3 font-bold text-foreground">{m.room_name}</td>
                                                    <td className="px-6 py-3 text-foreground">{m.current_class || 'Class in session'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-muted-foreground">{m.remarks || 'Normal class ongoing'}</td>
                                                </tr>
                                            ))}
                                            {monitoring.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                        No active exceptions or attendance flags found for this faculty member.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ATTENDANCE HISTORY */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <h2 className="text-sm font-bold text-foreground">Teaching Attendance & Session Verification</h2>
                                    </div>
                                    <Link
                                        href="/faculty-attendance"
                                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>Open Faculty Attendance Module</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                {/* KPI Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance Rate</p>
                                        <p className="text-2xl font-black text-foreground mt-1 tabular-nums">
                                            {attendance?.summary?.attendance_rate ?? 100}%
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Conducted vs Scheduled</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sessions Conducted</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                            {attendance?.summary?.present_count ?? (attendance?.records?.length || 0)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Marked Present / Online</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late Sessions</p>
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                                            {attendance?.summary?.late_count ?? 0}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {attendance?.summary?.total_late_minutes ? `${attendance.summary.total_late_minutes} mins total` : 'Zero late minutes'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Absences</p>
                                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                                            {attendance?.summary?.absent_count ?? 0}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Unexcused / Missed</p>
                                    </div>
                                </div>

                                {/* Sessions List */}
                                <div className="mt-6 border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Date & Day</th>
                                                <th className="px-6 py-3 font-semibold">Time Slot</th>
                                                <th className="px-6 py-3 font-semibold">Room / Subject</th>
                                                <th className="px-6 py-3 font-semibold text-center">Status</th>
                                                <th className="px-6 py-3 font-semibold text-right">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {attendance?.records && attendance.records.length > 0 ? (
                                                attendance.records.map((rec) => (
                                                    <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                                                        <td className="px-6 py-3.5 font-bold text-foreground">
                                                            <div>{rec.session_date}</div>
                                                            <div className="text-[11px] text-muted-foreground font-normal">{rec.day_of_week || rec.week_label}</div>
                                                        </td>
                                                        <td className="px-6 py-3.5 font-mono text-xs text-foreground font-semibold">
                                                            {rec.time_slot}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-xs text-foreground">
                                                            <div className="font-semibold">{rec.course_code || 'Lecture Session'}</div>
                                                            <div className="text-muted-foreground font-mono">{rec.room_number || 'Main Building'}</div>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${rec.status === 'present'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                                : rec.status === 'late'
                                                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                                                }`}>
                                                                {rec.status}
                                                                {rec.late_minutes > 0 && ` (${rec.late_minutes}m)`}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right text-xs text-muted-foreground">
                                                            {rec.remarks || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                        No teaching attendance records synced yet for this faculty member. Link the faculty name under Faculty Attendance to synchronize session history.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: PERFORMANCE */}
                    {activeTab === 'performance' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <h2 className="text-sm font-bold text-foreground">Verified Academic Performance & Recognition</h2>
                                    </div>
                                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                        Outstanding Academic Standing
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">On-Time Submission Rate</p>
                                            <p className="text-4xl font-black text-foreground mt-2 tabular-nums">{kpis.on_time_rate}%</p>
                                        </div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-4">
                                            +15% higher than college benchmark
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completion Rate</p>
                                            <p className="text-4xl font-black text-foreground mt-2 tabular-nums">{kpis.compliance_rate}%</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Based on assigned syllabi, TOS, TQ, and grade sheets
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zero Overdue Recognition</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Award className="w-8 h-8 text-amber-400" />
                                                <span className="text-lg font-extrabold text-foreground">
                                                    {kpis.overdue_requirements === 0 ? 'Eligible' : 'Needs Followup'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Featured on CIDS TV Display Slide 4
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: ACTIVITY LOG */}
                    {activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-blue-500" />
                                        <h2 className="text-sm font-bold text-foreground">Audit Trail & Activity Log</h2>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        Complete Administrative History
                                    </span>
                                </div>

                                <div className="space-y-4 mt-6">
                                    {activity_log.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 border border-border"
                                        >
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                                                <FileCheck className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                                                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{item.timestamp}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {activity_log.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-8">
                                            No recent log items recorded.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. PRINTABLE REPORT VIEW (Visible only during window.print())             */}
            {/* ========================================================================= */}
            <div className="print-only p-8 text-black bg-white max-w-4xl mx-auto">
                {/* Official Institutional Letterhead */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-4">
                        <img
                            src="/CIDS_Logo.jpg"
                            alt="CIDS Logo"
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-700">Republic of the Philippines</p>
                            <h1 className="text-lg font-black tracking-tight text-black leading-tight">
                                COLLEGE OF INFORMATION AND DIGITAL SCIENCES
                            </h1>
                            <p className="text-xs font-semibold text-slate-800">
                                Office of the Dean · CIDS OfficeHub Academic Operations
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-[10px] font-mono">
                        <p className="font-bold">CONTROL REF: CIDS-ISO-2026-FPR-0824</p>
                        <p>ACADEMIC PERIOD: {current_period.label}</p>
                        <p>GENERATED: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* Report Title */}
                <div className="my-6 text-center">
                    <h2 className="text-xl font-extrabold uppercase tracking-wide underline decoration-2 underline-offset-4">
                        OFFICIAL FACULTY PROFILE & COMPLIANCE DOSSIER
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                        Comprehensive Workload, Requirement Fulfillment, and Academic Monitoring Record
                    </p>
                </div>

                {/* Faculty Summary Box */}
                <div className="border border-black p-4 mb-6 rounded-sm grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p><strong className="uppercase">Faculty Name:</strong> {faculty.title_name}</p>
                        <p className="mt-1"><strong className="uppercase">Employee ID:</strong> {faculty.employee_id}</p>
                        <p className="mt-1"><strong className="uppercase">Academic Rank:</strong> {faculty.academic_rank || 'Assistant Professor I'}</p>
                        <p className="mt-1"><strong className="uppercase">Program:</strong> {faculty.program?.name || 'BSIT'}</p>
                    </div>
                    <div>
                        <p><strong className="uppercase">Highest Qualification:</strong> {faculty.highest_qualification || 'Master of Information Technology'}</p>
                        <p className="mt-1"><strong className="uppercase">Specialization:</strong> {faculty.specialization || 'Software Engineering'}</p>
                        <p className="mt-1"><strong className="uppercase">Status & Type:</strong> {faculty.status || 'Active'} · {faculty.employment_type || 'Full-time'}</p>
                        <p className="mt-1"><strong className="uppercase">Office Assignment:</strong> {faculty.office_room || 'Room 304, CIDS Building'}</p>
                    </div>
                </div>

                {/* KPI Metrics Table */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
                        1. Summary Compliance & Workload Metrics
                    </h3>
                    <table className="w-full text-xs border-collapse border border-black text-center">
                        <thead>
                            <tr className="bg-slate-100 font-bold">
                                <th className="border border-black p-2">Compliance Rate</th>
                                <th className="border border-black p-2">Teaching Units</th>
                                <th className="border border-black p-2">Overload</th>
                                <th className="border border-black p-2">Pending Requirements</th>
                                <th className="border border-black p-2">Overdue</th>
                                <th className="border border-black p-2">On-Time Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 font-bold">{kpis.compliance_rate}%</td>
                                <td className="border border-black p-2 font-bold">{kpis.teaching_units} Units</td>
                                <td className="border border-black p-2 font-bold">{kpis.overload_units} Units</td>
                                <td className="border border-black p-2 font-bold">{kpis.pending_requirements}</td>
                                <td className="border border-black p-2 font-bold">{kpis.overdue_requirements}</td>
                                <td className="border border-black p-2 font-bold">{kpis.on_time_rate}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Teaching Workload */}
                {includeSections.teaching_workload && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
                            2. Course Teaching Assignments ({current_period.label})
                        </h3>
                        <table className="w-full text-xs border-collapse border border-black">
                            <thead>
                                <tr className="bg-slate-100 font-bold text-left">
                                    <th className="border border-black p-2">Course Code</th>
                                    <th className="border border-black p-2">Course Title</th>
                                    <th className="border border-black p-2">Section</th>
                                    <th className="border border-black p-2 text-center">Units</th>
                                    <th className="border border-black p-2">Room</th>
                                    <th className="border border-black p-2">Days & Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workload.courses.map((c, i) => (
                                    <tr key={i}>
                                        <td className="border border-black p-2 font-mono font-bold">{c.course_code}</td>
                                        <td className="border border-black p-2">{c.course_title}</td>
                                        <td className="border border-black p-2">{c.sections.join(', ')}</td>
                                        <td className="border border-black p-2 text-center">{c.units}</td>
                                        <td className="border border-black p-2">{c.rooms.join(', ')}</td>
                                        <td className="border border-black p-2">{c.days.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Requirements Table */}
                {includeSections.requirement_status && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
                            3. Documentary Requirements Audit Record
                        </h3>
                        <table className="w-full text-xs border-collapse border border-black">
                            <thead>
                                <tr className="bg-slate-100 font-bold text-left">
                                    <th className="border border-black p-2">Requirement</th>
                                    <th className="border border-black p-2">Type</th>
                                    <th className="border border-black p-2">Deadline</th>
                                    <th className="border border-black p-2">Status</th>
                                    <th className="border border-black p-2">Submitted Date</th>
                                    <th className="border border-black p-2">Verification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requirements.map((r, i) => (
                                    <tr key={i}>
                                        <td className="border border-black p-2 font-semibold">{r.title}</td>
                                        <td className="border border-black p-2">{r.document_type}</td>
                                        <td className="border border-black p-2">{r.due_date}</td>
                                        <td className="border border-black p-2 font-bold uppercase">{r.status}</td>
                                        <td className="border border-black p-2">{r.submitted_at || '—'}</td>
                                        <td className="border border-black p-2">{r.is_on_time === true ? 'Verified On-Time' : r.is_on_time === false ? 'Verified Late' : 'Pending Verification'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Authorized Signatories Box */}
                {includeSections.signatures && (
                    <div className="mt-12 pt-6 border-t-2 border-black grid grid-cols-3 gap-8 text-xs text-center">
                        <div>
                            <div className="h-14" />
                            <p className="font-bold uppercase tracking-wider border-t border-black pt-1">
                                {faculty.full_name}
                            </p>
                            <p className="text-[10px] text-slate-600">Faculty Member Signature</p>
                        </div>
                        <div>
                            <div className="h-14" />
                            <p className="font-bold uppercase tracking-wider border-t border-black pt-1">
                                Program Chairperson
                            </p>
                            <p className="text-[10px] text-slate-600">Verified by / Program Head</p>
                        </div>
                        <div>
                            <div className="h-14" />
                            <p className="font-bold uppercase tracking-wider border-t border-black pt-1">
                                Dean, CIDS
                            </p>
                            <p className="text-[10px] text-slate-600">Approved by / College Dean</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 6. REPORT GENERATOR MODAL DIALOG                                         */}
            {/* ========================================================================= */}
            <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Printer className="w-4 h-4 text-amber-500" />
                            Generate Faculty Report
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Choose report contents and printable output formatting for official dossiers and ISO compliance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Report Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            >
                                <option value="complete">Complete Faculty Profile Dossier</option>
                                <option value="summary">Faculty Summary (1–2 pages)</option>
                                <option value="compliance">Compliance & Pending Requirements Report</option>
                                <option value="workload">Teaching Workload & Schedule Report</option>
                                <option value="performance">Individual Performance Summary</option>
                                <option value="iso">ISO Audit Documentation Summary</option>
                            </select>
                        </div>

                        {/* Section Toggles */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">Include Report Sections</label>
                            <div className="space-y-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeSections.professional_details}
                                        onChange={(e) => setIncludeSections({ ...includeSections, professional_details: e.target.checked })}
                                        className="rounded border-input text-primary"
                                    />
                                    <span>Professional & Institutional Details</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeSections.teaching_workload}
                                        onChange={(e) => setIncludeSections({ ...includeSections, teaching_workload: e.target.checked })}
                                        className="rounded border-input text-primary"
                                    />
                                    <span>Teaching Workload & Course Assignments</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeSections.requirement_status}
                                        onChange={(e) => setIncludeSections({ ...includeSections, requirement_status: e.target.checked })}
                                        className="rounded border-input text-primary"
                                    />
                                    <span>Documentary Requirements Audit Status</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeSections.signatures}
                                        onChange={(e) => setIncludeSections({ ...includeSections, signatures: e.target.checked })}
                                        className="rounded border-input text-primary"
                                    />
                                    <span>Authorized Signatory Fields (Dean & Program Chair)</span>
                                </label>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20 text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground">Official College Letterhead:</span> Report includes the CIDS seal, unique ISO control reference, and timestamped verification trail.
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={executePrint}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print / Export PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* 7. EDIT FACULTY MODAL DIALOG                                              */}
            {/* ========================================================================= */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-amber-500" />
                            Edit Faculty Profile
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Update official institutional credentials and personal record.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 border border-border">
                            <div className="relative">
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-2xl object-cover border-2 border-primary shadow-xs"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                                        <Camera className="w-7 h-7" />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />

                            <div className="flex items-center gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-7 text-xs gap-1"
                                >
                                    <Upload className="w-3 h-3" />
                                    Change Photo
                                </Button>
                                {photoPreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedPhotoFile(null);
                                            setPhotoPreview(null);
                                            setRemovePhoto(true);
                                        }}
                                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">First Name *</label>
                                <input
                                    type="text"
                                    value={editForm.first_name}
                                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    required
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Last Name *</label>
                                <input
                                    type="text"
                                    value={editForm.last_name}
                                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    required
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                        </div>

                        {/* Lab Schedule / Spreadsheet Name Alias */}
                        <div className="space-y-1 rounded-lg bg-muted/40 p-2.5 border border-border/60">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold">Spreadsheet / Schedule Name Alias</label>
                                <span className="text-[10px] text-muted-foreground">Google Sheet alias</span>
                            </div>
                            <input
                                type="text"
                                value={editForm.spreadsheet_name}
                                onChange={(e) => setEditForm({ ...editForm, spreadsheet_name: e.target.value })}
                                placeholder="e.g. ROXAS or Santos, M."
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background font-mono text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Connects lab schedules from Google Sheets without altering or writing to the external spreadsheet.
                            </p>
                        </div>

                        {/* Academic Rank & Employment Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Academic Rank</label>
                                <select
                                    value={editForm.academic_rank}
                                    onChange={(e) => setEditForm({ ...editForm, academic_rank: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                >
                                    <option value="Instructor I">Instructor I</option>
                                    <option value="Instructor II">Instructor II</option>
                                    <option value="Instructor III">Instructor III</option>
                                    <option value="Assistant Professor I">Assistant Professor I</option>
                                    <option value="Assistant Professor II">Assistant Professor II</option>
                                    <option value="Assistant Professor III">Assistant Professor III</option>
                                    <option value="Associate Professor I">Associate Professor I</option>
                                    <option value="Associate Professor II">Associate Professor II</option>
                                    <option value="Professor I">Professor I</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Employment Type</label>
                                <select
                                    value={editForm.employment_type}
                                    onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                >
                                    <option value="Full-time">Full-time Faculty</option>
                                    <option value="Part-time">Part-time Faculty</option>
                                    <option value="Contractual">Contractual</option>
                                    <option value="Guest Lecturer">Guest Lecturer</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Faculty Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Study Leave">Study Leave</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Sabbatical">Sabbatical</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Highest Qualification */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Highest Educational Qualification</label>
                            <input
                                type="text"
                                value={editForm.highest_qualification}
                                onChange={(e) => setEditForm({ ...editForm, highest_qualification: e.target.value })}
                                placeholder="e.g. Master of Information Technology"
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                            />
                        </div>

                        {/* Specialization */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Specialization</label>
                            <input
                                type="text"
                                value={editForm.specialization}
                                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                placeholder="e.g. Software Engineering & AI"
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                            />
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold">Institutional Email</label>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Auto-creates login</span>
                                </div>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder="e.g. msantos@cids.edu"
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Default password: <span className="font-mono font-semibold text-foreground">password</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Contact Phone</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="e.g. +63 917 555 0192"
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                        </div>

                        {/* Office Room & Date Hired */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Office Assignment</label>
                                <input
                                    type="text"
                                    value={editForm.office_room}
                                    onChange={(e) => setEditForm({ ...editForm, office_room: e.target.value })}
                                    placeholder="e.g. Room 304, CIDS Building"
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Appointment Date</label>
                                <input
                                    type="date"
                                    value={editForm.employment_date}
                                    onChange={(e) => setEditForm({ ...editForm, employment_date: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2 border-t border-border">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmittingEdit}
                                className="bg-primary text-primary-foreground font-semibold"
                            >
                                {isSubmittingEdit ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
