import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ShieldCheck,
    Building2,
    Users,
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    Layers,
    UserCheck,
    UserX,
    ArrowRightLeft,
    RotateCcw,
    Eye,
    ChevronRight,
    Activity,
    FileCheck,
    CalendarDays,
    Radio,
    ShieldAlert,
    ExternalLink,
    Lock,
    Unlock,
    HelpCircle,
    Info,
    X,
    Check,
    ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/lab-in-charge' },
    { title: 'Lab In-Charge Management', href: '/operations/lab-in-charge' },
];

interface AuditEntry {
    id: number;
    action_type: string;
    previous_user_name: string;
    new_user_name: string;
    performed_by_name: string;
    reason: string;
    effective_at: string;
}

interface AssignmentItem {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    room_id: number;
    room_name: string;
    room_building: string;
    room_floor: string;
    academic_period_id?: number | null;
    academic_period_name: string;
    role_type: 'Primary' | 'Backup' | 'Temporary';
    shift_name: string;
    shift_start_time: string;
    shift_end_time: string;
    coverage_schedule: string;
    assigned_days: string;
    effective_from?: string | null;
    effective_until?: string | null;
    effective_period_label: string;
    is_active: boolean;
    status: 'Draft' | 'Scheduled' | 'Active' | 'Temporarily Covered' | 'Suspended' | 'Ended' | 'Archived';
    reliever_user_id?: number | null;
    reliever_user_name?: string | null;
    notes?: string | null;
    assigned_by_user_id?: number | null;
    assigned_by_user_name?: string | null;
    monitoring_completeness: number;
    timeliness_rate: number;
    open_discrepancies_count: number;
    last_activity: string;
    is_expiring_soon: boolean;
    audits: AuditEntry[];
}

interface LaboratoryItem {
    id: number;
    room_name: string;
    building: string;
    floor: string;
    type: string;
    capacity: number;
}

interface LaboratoryProfile {
    id: number;
    room_name: string;
    building: string;
    floor: string;
    type: string;
    capacity: number;
    equipment_details?: string | null;
    primary_user?: {
        id: number;
        name: string;
        email: string;
        shift: string;
        effective_period: string;
    } | null;
    backup_users: Array<{ id: number; name: string; email: string }>;
    temporary_reliever?: { id: number; name: string; email: string } | null;
    has_coverage: boolean;
    coverage_status: 'Unassigned' | 'Covered' | 'Multiple Coverage';
    today_monitoring_completeness: number;
    open_discrepancies: number;
    active_sessions_count: number;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    assigned_rooms: Array<{
        assignment_id: number;
        room_id: number;
        room_name: string;
        role_type: string;
        shift_name: string;
        status: string;
        effective_period: string;
    }>;
    active_rooms_count: number;
    sessions_monitored_today: number;
    eod_reports: Array<{
        id: number;
        date: string;
        status: string;
        completeness_rate: number;
        discrepancies_count: number;
    }>;
    monitoring_completeness: number;
    timeliness_rate: number;
    unresolved_discrepancies: number;
}

interface CollegeSessionItem {
    id: number;
    room_name: string;
    course_code: string;
    section: string;
    faculty_name: string;
    observation_status: string;
    room_condition: string;
    session_outcome: string;
    scheduled_time: string;
    actual_time: string;
    late_minutes: number;
    student_headcount?: number | null;
    monitored_by: string;
    has_discrepancy: boolean;
    remarks?: string | null;
    photo_url?: string | null;
    is_locked: boolean;
    can_reopen: boolean;
}

interface Props {
    kpis: {
        active_users: number;
        laboratories_covered: number;
        total_laboratories: number;
        coverage_percentage: number;
        unassigned_laboratories: number;
        multiple_coverage_laboratories: number;
        current_shift_coverage: string;
        expiring_soon: number;
        open_incidents: number;
        eod_reports_compliance: string;
    };
    assignments: AssignmentItem[];
    laboratories: LaboratoryItem[];
    laboratoryProfiles: LaboratoryProfile[];
    users: Array<{ id: number; name: string; email: string }>;
    userProfiles: UserProfile[];
    academicPeriods: Array<{
        id: number;
        code: string;
        name: string;
        start_date?: string;
        end_date?: string;
        is_current: boolean;
    }>;
    activePeriod?: {
        id: number;
        code: string;
        start_date?: string;
        end_date?: string;
    } | null;
    collegeWideSessions: CollegeSessionItem[];
    collegeEodReports: Array<{
        id: number;
        report_date: string;
        user_name: string;
        shift_name: string;
        completeness_rate: number;
        expected_sessions: number;
        monitored_sessions: number;
        discrepancies_count: number;
        status: string;
        submitted_at: string;
        reviewed_at?: string | null;
        finalized_at?: string | null;
    }>;
    recentAudits: Array<{
        id: number;
        room_name: string;
        action_type: string;
        previous_user: string;
        new_user: string;
        performed_by: string;
        reason: string;
        created_at: string;
    }>;
    filters: {
        status: string;
        role_type: string;
        room_id: string;
        user_id: string;
    };
}

export default function LabInChargeManagement({
    kpis,
    assignments,
    laboratories,
    laboratoryProfiles,
    users,
    userProfiles,
    academicPeriods,
    activePeriod,
    collegeWideSessions,
    collegeEodReports,
    recentAudits,
    filters,
}: Props) {
    // Active navigation tab within module: 'assignments' | 'college_monitoring' | 'eod_oversight' | 'audit_history'
    const [activeTab, setActiveTab] = useState<'assignments' | 'college_monitoring' | 'eod_oversight' | 'audit_history'>('assignments');

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>(filters.status || 'all');
    const [filterRole, setFilterRole] = useState<string>(filters.role_type || 'all');
    const [filterRoom, setFilterRoom] = useState<string>(filters.room_id || 'all');

    // Modals
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [relieverModalOpen, setRelieverModalOpen] = useState(false);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [endModalOpen, setEndModalOpen] = useState(false);
    const [reopenModalOpen, setReopenModalOpen] = useState(false);

    // Selected items for drawers & modals
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
    const [selectedLabProfile, setSelectedLabProfile] = useState<LaboratoryProfile | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
    const [selectedSessionForReopen, setSelectedSessionForReopen] = useState<CollegeSessionItem | null>(null);

    // Form handlers
    const createUserForm = useForm({
        name: '',
        email: '',
        password: '',
    });

    const assignForm = useForm<{
        user_id: string;
        room_ids: string[];
        academic_period_id: string;
        role_type: 'Primary' | 'Backup' | 'Temporary';
        shift_name: string;
        shift_start_time: string;
        shift_end_time: string;
        assigned_days: string;
        effective_from: string;
        effective_until: string;
        notes: string;
    }>({
        user_id: '',
        room_ids: [],
        academic_period_id: activePeriod?.id ? String(activePeriod.id) : '',
        role_type: 'Primary',
        shift_name: 'Full Day Shift (07:30 AM – 05:30 PM)',
        shift_start_time: '07:30:00',
        shift_end_time: '17:30:00',
        assigned_days: 'Monday–Saturday',
        effective_from: activePeriod?.start_date || '2026-08-10',
        effective_until: activePeriod?.end_date || '2026-12-18',
        notes: '',
    });

    const relieverForm = useForm({
        reliever_user_id: '',
        effective_from: '2026-10-20',
        effective_until: '2026-10-24',
        reason: 'Authorized Sick / Emergency Leave coverage',
    });

    const reassignForm = useForm({
        new_user_id: '',
        role_type: 'Primary',
        reason: 'Operational shift rotation and facility staffing adjustment',
    });

    const suspendForm = useForm({
        reason: 'Temporary administrative suspension pending room maintenance and schedule reconfiguration',
    });

    const endForm = useForm({
        reason: 'Formal conclusion of assignment period / reassigned to alternate facility',
    });

    const reopenForm = useForm({
        correction_notes: 'Administrative correction requested by Super Admin after review of faculty attendance logs',
    });

    // Filtered assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter((item) => {
            const matchesSearch =
                !searchQuery.trim() ||
                item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.shift_name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchesRole = filterRole === 'all' || item.role_type === filterRole;
            const matchesRoom = filterRoom === 'all' || String(item.room_id) === filterRoom;

            return matchesSearch && matchesStatus && matchesRole && matchesRoom;
        });
    }, [assignments, searchQuery, filterStatus, filterRole, filterRoom]);

    // Handle submit Create User
    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserForm.post('/operations/lab-in-charge/users', {
            onSuccess: () => {
                setCreateUserModalOpen(false);
                createUserForm.reset();
            },
        });
    };

    // Handle submit Store Assignment
    const handleStoreAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/operations/lab-in-charge/assignments', {
            onSuccess: () => {
                setAssignModalOpen(false);
                assignForm.reset();
            },
        });
    };

    // Handle submit Add Temporary Coverage
    const handleAddTemporaryCoverage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;
        relieverForm.post(`/operations/lab-in-charge/assignments/${selectedAssignment.id}/temporary-coverage`, {
            onSuccess: () => {
                setRelieverModalOpen(false);
                relieverForm.reset();
                setSelectedAssignment(null);
            },
        });
    };

    // Handle submit Reassign
    const handleReassign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;
        reassignForm.post(`/operations/lab-in-charge/assignments/${selectedAssignment.id}/reassign`, {
            onSuccess: () => {
                setReassignModalOpen(false);
                reassignForm.reset();
                setSelectedAssignment(null);
            },
        });
    };

    // Handle submit Suspend
    const handleSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;
        suspendForm.post(`/operations/lab-in-charge/assignments/${selectedAssignment.id}/suspend`, {
            onSuccess: () => {
                setSuspendModalOpen(false);
                suspendForm.reset();
                setSelectedAssignment(null);
            },
        });
    };

    // Handle submit End Assignment
    const handleEndAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;
        endForm.post(`/operations/lab-in-charge/assignments/${selectedAssignment.id}/end`, {
            onSuccess: () => {
                setEndModalOpen(false);
                endForm.reset();
                setSelectedAssignment(null);
            },
        });
    };

    // Handle submit Reopen Monitoring Session
    const handleReopenSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSessionForReopen) return;
        reopenForm.post(`/operations/lab-in-charge/sessions/${selectedSessionForReopen.id}/reopen`, {
            onSuccess: () => {
                setReopenModalOpen(false);
                reopenForm.reset();
                setSelectedSessionForReopen(null);
            },
        });
    };

    // Status badge style helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return <Badge className="bg-emerald-600 text-white font-semibold text-[10.5px]">Active</Badge>;
            case 'Temporarily Covered':
                return <Badge className="bg-amber-600 text-white font-semibold text-[10.5px]">Temporarily Covered</Badge>;
            case 'Scheduled':
                return <Badge className="bg-blue-600 text-white font-semibold text-[10.5px]">Scheduled</Badge>;
            case 'Suspended':
                return <Badge variant="destructive" className="font-semibold text-[10.5px]">Suspended</Badge>;
            case 'Ended':
                return <Badge variant="secondary" className="font-semibold text-[10.5px]">Ended</Badge>;
            case 'Draft':
                return <Badge variant="outline" className="font-semibold text-[10.5px]">Draft</Badge>;
            default:
                return <Badge variant="outline" className="text-[10.5px]">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Primary':
                return <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">Primary</Badge>;
            case 'Backup':
                return <Badge variant="secondary" className="font-medium text-[10px]">Backup</Badge>;
            case 'Temporary':
                return <Badge className="bg-purple-600 text-white font-medium text-[10px]">Temporary</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lab In-Charge Management - Super Admin Operations" />

            <div className="flex-1 space-y-4 p-4 md:p-6 font-['Poppins']">
                {/* 1. TOP HEADER & PRIMARY ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-amber-500" />
                                Lab In-Charge Facility Responsibility & Governance
                            </h1>
                            <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                                Super Admin Operations
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Assign specific named users to laboratories with effective-dated coverage, prevent gaps, enforce shift accountability, and audit college-wide lab monitoring.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateUserModalOpen(true)}
                            className="h-8 text-xs font-semibold gap-1.5"
                        >
                            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                            Create Lab In-Charge User
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setAssignModalOpen(true)}
                            className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-2xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Assign Laboratory
                        </Button>
                    </div>
                </div>

                {/* 2. OPERATIONAL KPI SUMMARY CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Active Users
                                <Users className="h-3.5 w-3.5 text-blue-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-black text-foreground font-mono">
                                {kpis.active_users}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Designated Lab In-Charge accounts
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Covered Labs
                                <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-black text-emerald-600 font-mono">
                                {kpis.laboratories_covered} <span className="text-xs text-muted-foreground font-normal">/ {kpis.total_laboratories}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {kpis.coverage_percentage}% total laboratory coverage
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Unassigned Labs
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className={cn("text-2xl font-black font-mono", kpis.unassigned_laboratories > 0 ? "text-rose-600" : "text-slate-900 dark:text-foreground")}>
                                {kpis.unassigned_laboratories}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {kpis.unassigned_laboratories === 0 ? 'Zero uncovered laboratories' : 'Immediate assignment needed'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Multi-Coverage
                                <Layers className="h-3.5 w-3.5 text-purple-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-black text-purple-600 font-mono">
                                {kpis.multiple_coverage_laboratories}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Dual primary shift overlap
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Current Shift
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-base font-bold text-foreground truncate">
                                {kpis.current_shift_coverage}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                07:30 AM – 05:30 PM (Mon–Sat)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-2xs">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                                Expiring Soon
                                <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-black text-amber-600 font-mono">
                                {kpis.expiring_soon}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Within next 14 days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. MODULE NAVIGATION TABS */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 border-b border-border/60 scrollbar-none">
                    {[
                        { id: 'assignments', label: `Facility Assignments (${assignments.length})`, icon: ShieldCheck },
                        { id: 'college_monitoring', label: `College-Wide Live Feed (${collegeWideSessions.length})`, icon: Radio },
                        { id: 'eod_oversight', label: `Closing Reports Compliance (${collegeEodReports.length})`, icon: FileCheck },
                        { id: 'audit_history', label: `Assignment Audit Trail (${recentAudits.length})`, icon: ClipboardList },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border h-8",
                                    isSelected
                                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-2xs font-bold"
                                        : "bg-card text-muted-foreground border-border/70 hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <a
                        href="/monitoring/lab-in-charge?tab=dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap border bg-card text-muted-foreground border-border/70 hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 ml-auto h-8"
                    >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>Open Lab In-Charge Workspace</span>
                    </a>
                </div>

                {/* TAB 1: FACILITY ASSIGNMENTS & GOVERNANCE TABLE */}
                {activeTab === 'assignments' && (
                    <div className="space-y-3">
                        {/* Filters and search toolbar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 bg-card p-3 border rounded-xl shadow-2xs">
                            <div className="relative sm:col-span-2">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Lab In-Charge name, email, or room..."
                                    className="h-8 pl-8 pr-3 text-xs rounded-lg bg-card"
                                />
                            </div>

                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Temporarily Covered">Temporarily Covered</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                    <SelectItem value="Ended">Ended</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="Primary">Primary</SelectItem>
                                    <SelectItem value="Backup">Backup</SelectItem>
                                    <SelectItem value="Temporary">Temporary</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterRoom} onValueChange={setFilterRoom}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Laboratories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Laboratories</SelectItem>
                                    {laboratories.map((lab) => (
                                        <SelectItem key={lab.id} value={String(lab.id)}>
                                            {lab.room_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Searchable Assignments Table */}
                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Lab In-Charge</TableHead>
                                        <TableHead className="font-bold text-xs">Assigned Lab(s)</TableHead>
                                        <TableHead className="font-bold text-xs">Role</TableHead>
                                        <TableHead className="font-bold text-xs">Coverage Schedule</TableHead>
                                        <TableHead className="font-bold text-xs">Effective Period</TableHead>
                                        <TableHead className="font-bold text-xs">Current Status</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Completeness</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Open Incidents</TableHead>
                                        <TableHead className="font-bold text-xs">Last Activity</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs">
                                                No laboratory assignments found matching your filter criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAssignments.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/30">
                                                {/* Lab In-Charge Name & Profile Drawer Trigger */}
                                                <TableCell className="font-medium text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const p = userProfiles.find((u) => u.id === item.user_id);
                                                            if (p) setSelectedUserProfile(p);
                                                        }}
                                                        className="text-left font-bold text-foreground hover:text-amber-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Users className="h-3 w-3 text-amber-500" />
                                                        <span>{item.user_name}</span>
                                                    </button>
                                                    <div className="text-[10px] text-muted-foreground truncate">{item.user_email}</div>
                                                </TableCell>

                                                {/* Assigned Room & Room Profile Drawer Trigger */}
                                                <TableCell className="text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const r = laboratoryProfiles.find((l) => l.id === item.room_id);
                                                            if (r) setSelectedLabProfile(r);
                                                        }}
                                                        className="font-bold text-foreground hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                                        <span>{item.room_name}</span>
                                                    </button>
                                                    <div className="text-[10px] text-muted-foreground truncate">{item.room_building} · {item.room_floor}</div>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    {getRoleBadge(item.role_type)}
                                                </TableCell>

                                                {/* Coverage Schedule */}
                                                <TableCell className="text-[11px] font-mono">
                                                    <div>{item.assigned_days}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {CarbonDaysFormat(item.shift_start_time, item.shift_end_time)}
                                                    </div>
                                                </TableCell>

                                                {/* Effective Period */}
                                                <TableCell className="text-[11px]">
                                                    <div className="font-semibold">{item.effective_period_label}</div>
                                                    {item.is_expiring_soon && (
                                                        <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                                                            Expiring Soon
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Current Status */}
                                                <TableCell>
                                                    {getStatusBadge(item.status)}
                                                    {item.status === 'Temporarily Covered' && item.reliever_user_name && (
                                                        <div className="text-[9.5px] text-muted-foreground mt-0.5 truncate">
                                                            Reliever: <strong>{item.reliever_user_name}</strong>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Completeness */}
                                                <TableCell className="text-center font-mono font-bold text-xs text-emerald-600">
                                                    {item.monitoring_completeness}%
                                                </TableCell>

                                                {/* Open Incidents */}
                                                <TableCell className="text-center font-mono text-xs">
                                                    {item.open_discrepancies_count > 0 ? (
                                                        <span className="text-rose-600 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                            {item.open_discrepancies_count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">0</span>
                                                    )}
                                                </TableCell>

                                                {/* Last Activity */}
                                                <TableCell className="text-[10.5px] text-muted-foreground whitespace-nowrap">
                                                    {item.last_activity}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAssignment(item);
                                                                setRelieverModalOpen(true);
                                                            }}
                                                            className="h-6.5 text-[10.5px] px-2 font-semibold"
                                                            title="Add Temporary Coverage / Reliever"
                                                        >
                                                            Reliever
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAssignment(item);
                                                                setReassignModalOpen(true);
                                                            }}
                                                            className="h-6.5 text-[10.5px] px-2 font-semibold text-amber-700 hover:text-amber-800"
                                                            title="Transfer Responsibility / Reassign"
                                                        >
                                                            Reassign
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAssignment(item);
                                                                setEndModalOpen(true);
                                                            }}
                                                            className="h-6.5 text-[10.5px] px-1.5 text-rose-600 hover:text-rose-700"
                                                            title="End Assignment"
                                                        >
                                                            End
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

                {/* TAB 2: COLLEGE-WIDE LIVE MONITORING FEED */}
                {activeTab === 'college_monitoring' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-base font-bold text-foreground">College-Wide Live Laboratory Sessions Feed</h3>
                                <p className="text-xs text-muted-foreground">
                                    Real-time observations, facility room conditions, student headcounts, and verified outcomes recorded by assigned Lab In-Charge monitors.
                                </p>
                            </div>
                            <Badge className="bg-emerald-600 text-white font-bold text-xs">
                                Live Session Synced
                            </Badge>
                        </div>

                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Laboratory</TableHead>
                                        <TableHead className="font-bold text-xs">Course & Section</TableHead>
                                        <TableHead className="font-bold text-xs">Expected Faculty</TableHead>
                                        <TableHead className="font-bold text-xs">Times (Sched / Actual)</TableHead>
                                        <TableHead className="font-bold text-xs">Room Condition</TableHead>
                                        <TableHead className="font-bold text-xs">Session Outcome</TableHead>
                                        <TableHead className="font-bold text-xs">Monitored By</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Headcount</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collegeWideSessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                                                No laboratory sessions recorded yet today.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        collegeWideSessions.map((session) => (
                                            <TableRow key={session.id} className="hover:bg-muted/30">
                                                <TableCell className="font-bold text-xs text-foreground">
                                                    {session.room_name}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="font-semibold text-foreground">{session.course_code}</span>
                                                    <div className="text-[10px] text-muted-foreground">{session.section}</div>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {session.faculty_name}
                                                </TableCell>
                                                <TableCell className="text-[11px] font-mono">
                                                    <div>{session.scheduled_time}</div>
                                                    <div className="text-[10px] text-muted-foreground">Actual: {session.actual_time}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-muted/60 border text-foreground">
                                                        {session.room_condition}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-[10px] font-semibold", session.session_outcome === 'Conducted as Scheduled' ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                                                        {session.session_outcome}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-foreground">
                                                    {session.monitored_by}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {session.student_headcount ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedSessionForReopen(session);
                                                            setReopenModalOpen(true);
                                                        }}
                                                        className="h-6.5 text-[10.5px] px-2 font-semibold border-amber-300 text-amber-800 hover:bg-amber-50"
                                                    >
                                                        <Unlock className="h-3 w-3 mr-1" />
                                                        Reopen Record
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

                {/* TAB 3: CLOSING REPORTS COMPLIANCE & RECONCILIATION */}
                {activeTab === 'eod_oversight' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-base font-bold text-foreground">End-of-Day Monitoring Reports & Submission Compliance</h3>
                                <p className="text-xs text-muted-foreground">
                                    Audited daily closing submissions across all laboratories, verifying room occupancy matrices, exception checklists, and administrator lock dates.
                                </p>
                            </div>
                            <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                                Compliance Rate: {kpis.eod_reports_compliance}
                            </Badge>
                        </div>

                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Report Date</TableHead>
                                        <TableHead className="font-bold text-xs">Lab In-Charge</TableHead>
                                        <TableHead className="font-bold text-xs">Shift</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Completeness</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Sessions (Obs / Exp)</TableHead>
                                        <TableHead className="font-bold text-xs text-center">Exceptions</TableHead>
                                        <TableHead className="font-bold text-xs">Status</TableHead>
                                        <TableHead className="font-bold text-xs">Submitted At</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collegeEodReports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                                                No daily closing reports submitted yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        collegeEodReports.map((report) => (
                                            <TableRow key={report.id} className="hover:bg-muted/30">
                                                <TableCell className="font-bold text-xs text-foreground">
                                                    {report.report_date}
                                                </TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    {report.user_name}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {report.shift_name}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-xs text-amber-600">
                                                    {report.completeness_rate}%
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {report.monitored_sessions} / {report.expected_sessions}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {report.discrepancies_count > 0 ? (
                                                        <span className="text-rose-600 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                            {report.discrepancies_count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600 font-medium">0</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-[10px] font-semibold", report.status === 'Finalized' ? "bg-emerald-600 text-white" : "bg-blue-600 text-white")}>
                                                        {report.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-[11px] text-muted-foreground">
                                                    {report.submitted_at}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <a
                                                        href="/monitoring/lab-in-charge/end-of-day"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                                                    >
                                                        Review Matrix
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* TAB 4: IMMUTABLE AUDIT TRAIL LOGS */}
                {activeTab === 'audit_history' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Immutable Assignment Audit History</h3>
                                <p className="text-xs text-muted-foreground">
                                    Preserves complete chain of custody for all laboratory assignments, transfers, temporary covers, and suspensions without deleting historical monitoring ownership.
                                </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Audit Locked & Preserved
                            </Badge>
                        </div>

                        <div className="border rounded-xl bg-card overflow-x-auto shadow-2xs">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Timestamp</TableHead>
                                        <TableHead className="font-bold text-xs">Laboratory</TableHead>
                                        <TableHead className="font-bold text-xs">Action Type</TableHead>
                                        <TableHead className="font-bold text-xs">Previous Lab In-Charge</TableHead>
                                        <TableHead className="font-bold text-xs">New Lab In-Charge</TableHead>
                                        <TableHead className="font-bold text-xs">Reason / Operational Justification</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Performed By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentAudits.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                                                No assignment modifications recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentAudits.map((audit) => (
                                            <TableRow key={audit.id} className="hover:bg-muted/30">
                                                <TableCell className="text-[11px] font-mono whitespace-nowrap text-muted-foreground">
                                                    {audit.created_at}
                                                </TableCell>
                                                <TableCell className="font-bold text-xs text-foreground">
                                                    {audit.room_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-muted text-foreground border font-medium text-[10px]">
                                                        {audit.action_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {audit.previous_user}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-foreground">
                                                    {audit.new_user}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-sm truncate text-muted-foreground">
                                                    {audit.reason}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-bold text-foreground">
                                                    {audit.performed_by}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. MODALS & DRAWERS */}

            {/* CREATE LAB IN-CHARGE USER MODAL */}
            <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-amber-500" />
                            Create Named Lab In-Charge User
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Create an individual named account with the Lab In-Charge role. Generic shared accounts are discouraged to establish clear monitoring accountability.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Full Name</Label>
                            <Input
                                required
                                value={createUserForm.data.name}
                                onChange={(e) => createUserForm.setData('name', e.target.value)}
                                placeholder="e.g. John Doe"
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Institutional Email</Label>
                            <Input
                                required
                                type="email"
                                value={createUserForm.data.email}
                                onChange={(e) => createUserForm.setData('email', e.target.value)}
                                placeholder="e.g. jdoe.lab@cids.edu"
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Temporary Password (Optional)</Label>
                            <Input
                                type="password"
                                value={createUserForm.data.password}
                                onChange={(e) => createUserForm.setData('password', e.target.value)}
                                placeholder="Defaults to LabInCharge2026!"
                                className="h-8.5 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                The user will be required to change their credentials on first sign-in.
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCreateUserModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={createUserForm.processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                            >
                                Create Account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ASSIGN LABORATORY MODAL (Single / Bulk Multi-Lab) */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-amber-500" />
                            Assign Laboratory to Lab In-Charge
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Designate formal responsibility for one or multiple computer laboratories. The assigned user will inherit monitoring scope across these facilities.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleStoreAssignment} className="space-y-3 py-2 text-xs">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Select Named User</Label>
                            <Select
                                value={assignForm.data.user_id}
                                onValueChange={(val) => assignForm.setData('user_id', val)}
                            >
                                <SelectTrigger className="h-8.5 text-xs">
                                    <SelectValue placeholder="Select Lab In-Charge user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Select Laboratory / Laboratories</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-muted/20 border rounded-lg max-h-36 overflow-y-auto">
                                {laboratories.map((lab) => {
                                    const isChecked = assignForm.data.room_ids.includes(String(lab.id));
                                    return (
                                        <label
                                            key={lab.id}
                                            className={cn(
                                                "flex items-center gap-1.5 p-1.5 rounded border text-[11px] cursor-pointer transition-colors",
                                                isChecked ? "bg-amber-500/20 border-amber-500 font-bold" : "hover:bg-muted/40"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-border text-amber-500"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const idStr = String(lab.id);
                                                    if (e.target.checked) {
                                                        assignForm.setData('room_ids', [...assignForm.data.room_ids, idStr]);
                                                    } else {
                                                        assignForm.setData('room_ids', assignForm.data.room_ids.filter((i) => i !== idStr));
                                                    }
                                                }}
                                            />
                                            <span className="truncate">{lab.room_name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Assignment Role</Label>
                                <Select
                                    value={assignForm.data.role_type}
                                    onValueChange={(val: any) => assignForm.setData('role_type', val)}
                                >
                                    <SelectTrigger className="h-8.5 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Primary">Primary (Lead Monitor)</SelectItem>
                                        <SelectItem value="Backup">Backup (Secondary Monitor)</SelectItem>
                                        <SelectItem value="Temporary">Temporary Reliever</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Academic Period</Label>
                                <Select
                                    value={assignForm.data.academic_period_id}
                                    onValueChange={(val) => assignForm.setData('academic_period_id', val)}
                                >
                                    <SelectTrigger className="h-8.5 text-xs">
                                        <SelectValue placeholder="Current Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicPeriods.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.code} ({p.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Shift Name</Label>
                                <Select
                                    value={assignForm.data.shift_name}
                                    onValueChange={(val) => {
                                        assignForm.setData('shift_name', val);
                                        if (val.includes('Morning')) {
                                            assignForm.setData('shift_start_time', '07:30:00');
                                            assignForm.setData('shift_end_time', '12:30:00');
                                        } else if (val.includes('Afternoon')) {
                                            assignForm.setData('shift_start_time', '12:30:00');
                                            assignForm.setData('shift_end_time', '17:30:00');
                                        } else {
                                            assignForm.setData('shift_start_time', '07:30:00');
                                            assignForm.setData('shift_end_time', '17:30:00');
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8.5 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full Day Shift (07:30 AM – 05:30 PM)">Full Day (07:30 AM – 05:30 PM)</SelectItem>
                                        <SelectItem value="Morning Shift (07:30 AM – 12:30 PM)">Morning Shift (07:30 AM – 12:30 PM)</SelectItem>
                                        <SelectItem value="Afternoon Shift (12:30 PM – 05:30 PM)">Afternoon Shift (12:30 PM – 05:30 PM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Monitoring Days</Label>
                                <Input
                                    value={assignForm.data.assigned_days}
                                    onChange={(e) => assignForm.setData('assigned_days', e.target.value)}
                                    placeholder="Monday–Saturday"
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Effective Start Date</Label>
                                <Input
                                    type="date"
                                    value={assignForm.data.effective_from}
                                    onChange={(e) => assignForm.setData('effective_from', e.target.value)}
                                    className="h-8.5 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Effective End Date</Label>
                                <Input
                                    type="date"
                                    value={assignForm.data.effective_until}
                                    onChange={(e) => assignForm.setData('effective_until', e.target.value)}
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Administrative Notes / Scope Justification</Label>
                            <Textarea
                                value={assignForm.data.notes}
                                onChange={(e) => assignForm.setData('notes', e.target.value)}
                                placeholder="e.g. Lead laboratory monitor responsible for daily opening, session observation, and closing verification."
                                className="h-16 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={assignForm.processing || assignForm.data.room_ids.length === 0 || !assignForm.data.user_id}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                            >
                                Save Assignment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ADD TEMPORARY COVERAGE / RELIEVER MODAL */}
            <Dialog open={relieverModalOpen} onOpenChange={setRelieverModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                            Add Temporary Coverage (Reliever)
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Temporarily assign a reliever for <strong>{selectedAssignment?.room_name}</strong> while <strong>{selectedAssignment?.user_name}</strong> is unavailable. Original assignment status will update to <em>Temporarily Covered</em>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddTemporaryCoverage} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Select Reliever User</Label>
                            <Select
                                value={relieverForm.data.reliever_user_id}
                                onValueChange={(val) => relieverForm.setData('reliever_user_id', val)}
                            >
                                <SelectTrigger className="h-8.5 text-xs">
                                    <SelectValue placeholder="Select reliever" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users
                                        .filter((u) => u.id !== selectedAssignment?.user_id)
                                        .map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Reliever From Date</Label>
                                <Input
                                    type="date"
                                    value={relieverForm.data.effective_from}
                                    onChange={(e) => relieverForm.setData('effective_from', e.target.value)}
                                    className="h-8.5 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Reliever Until Date</Label>
                                <Input
                                    type="date"
                                    value={relieverForm.data.effective_until}
                                    onChange={(e) => relieverForm.setData('effective_until', e.target.value)}
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Coverage Reason / Note</Label>
                            <Textarea
                                required
                                value={relieverForm.data.reason}
                                onChange={(e) => relieverForm.setData('reason', e.target.value)}
                                className="h-16 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRelieverModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={relieverForm.processing || !relieverForm.data.reliever_user_id}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                            >
                                Assign Temporary Reliever
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* REASSIGN / TRANSFER RESPONSIBILITY MODAL */}
            <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-amber-500" />
                            Transfer Facility Responsibility
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Transfer monitoring responsibility for <strong>{selectedAssignment?.room_name}</strong> to a new user. The existing assignment will be formally ended while preserving all past monitoring audit trails.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReassign} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">New Lab In-Charge User</Label>
                            <Select
                                value={reassignForm.data.new_user_id}
                                onValueChange={(val) => reassignForm.setData('new_user_id', val)}
                            >
                                <SelectTrigger className="h-8.5 text-xs">
                                    <SelectValue placeholder="Select new monitor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users
                                        .filter((u) => u.id !== selectedAssignment?.user_id)
                                        .map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Role in Facility</Label>
                            <Select
                                value={reassignForm.data.role_type}
                                onValueChange={(val: any) => reassignForm.setData('role_type', val)}
                            >
                                <SelectTrigger className="h-8.5 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Primary">Primary (Lead Monitor)</SelectItem>
                                    <SelectItem value="Backup">Backup (Secondary Monitor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Transfer Justification / Reason</Label>
                            <Textarea
                                required
                                value={reassignForm.data.reason}
                                onChange={(e) => reassignForm.setData('reason', e.target.value)}
                                className="h-16 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReassignModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={reassignForm.processing || !reassignForm.data.new_user_id}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                            >
                                Transfer Responsibility
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* END ASSIGNMENT MODAL */}
            <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <UserX className="h-5 w-5" />
                            End Laboratory Assignment
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Conclude assignment of <strong>{selectedAssignment?.user_name}</strong> for <strong>{selectedAssignment?.room_name}</strong>. Future sessions will cease to appear in their workspace, while previous monitoring submissions are locked and retained.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEndAssignment} className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Termination Reason</Label>
                            <Textarea
                                required
                                value={endForm.data.reason}
                                onChange={(e) => endForm.setData('reason', e.target.value)}
                                className="h-16 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEndModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                disabled={endForm.processing}
                                className="font-bold"
                            >
                                Confirm End Assignment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* SUPER ADMIN AUDITABLE CORRECTION / REOPEN RECORD MODAL */}
            <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5 text-amber-500" />
                            Auditable Record Correction / Unlock
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Super Admin workflow to reopen locked monitoring record for <strong>{selectedSessionForReopen?.course_code}</strong> in <strong>{selectedSessionForReopen?.room_name}</strong>. An immutable audit trail entry is enforced.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReopenSession} className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Administrative Correction Notes</Label>
                            <Textarea
                                required
                                value={reopenForm.data.correction_notes}
                                onChange={(e) => reopenForm.setData('correction_notes', e.target.value)}
                                className="h-20 text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReopenModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={reopenForm.processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                            >
                                Unlock & File Audit Entry
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* LAB IN-CHARGE USER PROFILE DRAWER / DIALOG */}
            {selectedUserProfile && (
                <Dialog open={!!selectedUserProfile} onOpenChange={() => setSelectedUserProfile(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-amber-500" />
                                {selectedUserProfile.name} — Operational Governance Profile
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Individual accountability record, active facility scopes, shift coverage, and monitoring completeness metrics.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2 text-xs">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-lg border">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Labs</span>
                                    <div className="text-base font-black text-foreground">{selectedUserProfile.active_rooms_count}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Completeness</span>
                                    <div className="text-base font-black text-emerald-600">{selectedUserProfile.monitoring_completeness}%</div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Timeliness</span>
                                    <div className="text-base font-black text-blue-600">{selectedUserProfile.timeliness_rate}%</div>
                                </div>
                            </div>

                            {/* Assigned Rooms List */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-amber-500" />
                                    Authorized Laboratory Rooms
                                </h4>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {selectedUserProfile.assigned_rooms.map((room) => (
                                        <div key={room.assignment_id} className="p-2 border rounded-lg bg-card flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-foreground">{room.room_name}</span>
                                                <div className="text-[10px] text-muted-foreground">{room.shift_name} · {room.effective_period}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {getRoleBadge(room.role_type)}
                                                {getStatusBadge(room.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent End-of-Day Submissions */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                                    <FileCheck className="h-4 w-4 text-emerald-500" />
                                    Recent Daily Closing Submissions
                                </h4>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {selectedUserProfile.eod_reports.length === 0 ? (
                                        <p className="text-muted-foreground italic text-xs">No closing reports submitted yet.</p>
                                    ) : (
                                        selectedUserProfile.eod_reports.map((r) => (
                                            <div key={r.id} className="p-2 border rounded-lg bg-card flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-foreground">{r.date}</span>
                                                    <div className="text-[10px] text-muted-foreground">Exceptions: {r.discrepancies_count}</div>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-mono">
                                                    <span className="text-emerald-600 font-bold">{r.completeness_rate}%</span>
                                                    <Badge className="text-[9.5px] bg-emerald-600 text-white">{r.status}</Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUserProfile(null)}
                            >
                                Close Profile
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* LABORATORY FACILITY COVERAGE PROFILE DRAWER */}
            {selectedLabProfile && (
                <Dialog open={!!selectedLabProfile} onOpenChange={() => setSelectedLabProfile(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-amber-500" />
                                {selectedLabProfile.room_name} — Facility Coverage Audit
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Current responsible monitors, shift allocations, equipment profile, and today's observation readiness.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3.5 py-2 text-xs">
                            <div className="p-3 bg-muted/30 border rounded-lg space-y-1.5">
                                <div><strong>Location:</strong> {selectedLabProfile.building} · {selectedLabProfile.floor}</div>
                                <div><strong>Type & Capacity:</strong> {selectedLabProfile.type} · {selectedLabProfile.capacity} workstations</div>
                                <div><strong>Equipment:</strong> {selectedLabProfile.equipment_details || '40 Desktop PCs, Split AC, Projector'}</div>
                            </div>

                            {/* Primary Monitor */}
                            <div className="space-y-1">
                                <span className="font-bold text-foreground uppercase text-[10.5px]">Primary Assigned Lab In-Charge</span>
                                {selectedLabProfile.primary_user ? (
                                    <div className="p-2.5 bg-card border rounded-lg flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-foreground">{selectedLabProfile.primary_user.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{selectedLabProfile.primary_user.email}</div>
                                            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">{selectedLabProfile.primary_user.shift}</div>
                                        </div>
                                        <Badge className="bg-amber-500 text-slate-950 font-bold">Primary</Badge>
                                    </div>
                                ) : (
                                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-semibold flex items-center gap-1.5">
                                        <AlertTriangle className="h-4 w-4" />
                                        Unassigned — No primary monitor currently designated!
                                    </div>
                                )}
                            </div>

                            {/* Backup & Reliever */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="font-bold text-foreground uppercase text-[10px]">Backup Monitors</span>
                                    <div className="p-2 bg-muted/20 border rounded-lg min-h-[50px]">
                                        {selectedLabProfile.backup_users.length === 0 ? (
                                            <span className="text-muted-foreground text-[10.5px]">None assigned</span>
                                        ) : (
                                            selectedLabProfile.backup_users.map((b) => (
                                                <div key={b.id} className="font-semibold text-foreground truncate">{b.name}</div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="font-bold text-foreground uppercase text-[10px]">Temporary Reliever</span>
                                    <div className="p-2 bg-muted/20 border rounded-lg min-h-[50px]">
                                        {selectedLabProfile.temporary_reliever ? (
                                            <span className="font-bold text-purple-700 dark:text-purple-400 truncate block">
                                                {selectedLabProfile.temporary_reliever.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-[10.5px]">Normal coverage active</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedLabProfile(null)}
                            >
                                Close Facility View
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}

// Helpers
function CarbonDaysFormat(start?: string, end?: string): string {
    if (!start || !end) return '07:30 AM – 05:30 PM';
    try {
        const s = start.substring(0, 5);
        const e = end.substring(0, 5);
        return `${s} – ${e}`;
    } catch {
        return '07:30 AM – 05:30 PM';
    }
}
