import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Users,
    MoreVertical,
    Edit,
    Trash,
    GraduationCap,
    UserCheck,
    Camera,
    Upload,
    X,
    Search,
    User,
    ArrowRight,
    Briefcase,
    ShieldCheck,
    Building2,
    Mail,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ChevronRight,
    Filter,
    Download,
    Eye,
    LayoutGrid,
    List,
    AlertCircle,
    FileText,
    ArrowUpRight,
} from 'lucide-react';
import React, { useState, useMemo, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Management',
        href: '/faculties',
    },
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
    full_name?: string;
    title_name?: string;
    employee_id?: string;
    faculty_id?: string | null;
    academic_rank?: string | null;
    employment_type?: string | null;
    status?: string | null;
    highest_qualification?: string | null;
    specialization?: string | null;
    email?: string | null;
    phone?: string | null;
    office_room?: string | null;
    profile_picture?: string | null;
    photo_url?: string | null;
    program_id?: number | null;
    program?: Program;
    spreadsheet_name?: string | null;
    created_at?: string;
    updated_at?: string;
    submissions?: any[];
}

interface NeedsAttentionItem {
    id: number;
    name: string;
    initials: string;
    program: string;
    primary_issue: string;
    severity: 'warning' | 'destructive';
    issue_count: number;
    issues: Array<{
        label: string;
        type: string;
        severity: string;
    }>;
    photo_url: string | null;
}

interface RecentUpdateItem {
    id: number;
    faculty_name: string;
    program: string;
    action: string;
    time_formatted: string;
    time_ago: string;
    type: 'create' | 'update';
}

interface Props {
    faculties: Faculty[];
    programs: Program[];
    ranks?: string[];
    stats?: {
        total_faculty: number;
        active_faculty: number;
        on_leave?: number;
        study_leave?: number;
        full_time: number;
        part_time: number;
        needs_attention: number;
        needs_attention_pct: number;
    };
    needsAttention?: NeedsAttentionItem[];
    profileCompletion?: {
        completion_rate: number;
        complete_count: number;
        incomplete_count: number;
        missing_requirements_count: number;
        total_faculty: number;
    };
    recentUpdates?: RecentUpdateItem[];
    user_permissions?: {
        is_super_admin: boolean;
        is_dean: boolean;
        is_program_head: boolean;
        can_edit: boolean;
        can_delete: boolean;
        program_id?: number | null;
    };
}

export default function FacultiesIndex({
    faculties = [],
    programs = [],
    ranks = [],
    stats = {
        total_faculty: faculties.length,
        active_faculty: faculties.filter((f) => f.status === 'Active').length,
        on_leave: faculties.filter((f) => f.status === 'On Leave' || f.status === 'Sabbatical').length,
        study_leave: faculties.filter((f) => f.status === 'Study Leave').length,
        full_time: faculties.filter((f) => (f.employment_type || '').toLowerCase().includes('full')).length,
        part_time: faculties.filter((f) => (f.employment_type || '').toLowerCase().includes('part')).length,
        needs_attention: 0,
        needs_attention_pct: 0,
    },
    needsAttention = [],
    profileCompletion = {
        completion_rate: 0,
        complete_count: 0,
        incomplete_count: 0,
        missing_requirements_count: 0,
        total_faculty: faculties.length,
    },
    recentUpdates = [],
    user_permissions = {
        is_super_admin: true,
        is_dean: false,
        is_program_head: false,
        can_edit: true,
        can_delete: true,
        program_id: null,
    },
}: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('all');
    const [employmentStatusFilter, setEmploymentStatusFilter] = useState('all');
    const [academicRankFilter, setAcademicRankFilter] = useState('all');
    const [attentionStatusFilter, setAttentionStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'recent' | 'rank'>('name_asc');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [spreadsheetName, setSpreadsheetName] = useState('');
    const [academicRank, setAcademicRank] = useState('Instructor I');
    const [employmentType, setEmploymentType] = useState('Full-time');
    const [status, setStatus] = useState('Active');
    const [programId, setProgramId] = useState('');
    const [highestQualification, setHighestQualification] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [officeRoom, setOfficeRoom] = useState('');
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Set of faculty IDs needing attention computed from real data
    const attentionFacultyIds = useMemo(() => {
        return new Set(needsAttention.map((item) => item.id));
    }, [needsAttention]);

    // Calculate individual faculty profile completion percentage (0 - 100)
    const getFacultyCompletion = (faculty: Faculty): number => {
        const fields = [
            faculty.first_name,
            faculty.last_name,
            faculty.faculty_id || faculty.employee_id,
            faculty.academic_rank,
            faculty.program_id,
            faculty.specialization,
            faculty.highest_qualification,
            faculty.email,
            faculty.phone,
            faculty.photo_url || faculty.profile_picture,
        ];
        const filled = fields.filter((f) => f !== null && f !== undefined && String(f).trim() !== '').length;
        return Math.round((filled / fields.length) * 100);
    };

    const openAddDialog = () => {
        setEditingFaculty(null);
        setFirstName('');
        setLastName('');
        setFacultyId('');
        setSpreadsheetName('');
        setAcademicRank(ranks.length > 0 ? ranks[0] : 'Instructor I');
        setEmploymentType('Full-time');
        setStatus('Active');
        setProgramId(programs.length > 0 ? String(programs[0].id) : '');
        setHighestQualification('');
        setSpecialization('');
        setEmail('');
        setPhone('');
        setOfficeRoom('');
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(false);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const openEditDialog = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setFirstName(faculty.first_name);
        setLastName(faculty.last_name);
        setFacultyId(faculty.faculty_id || faculty.employee_id || '');
        setSpreadsheetName(faculty.spreadsheet_name || '');
        setAcademicRank(faculty.academic_rank || 'Instructor I');
        setEmploymentType(faculty.employment_type || 'Full-time');
        setStatus(faculty.status || 'Active');
        setProgramId(faculty.program_id ? String(faculty.program_id) : (programs[0] ? String(programs[0].id) : ''));
        setHighestQualification(faculty.highest_qualification || '');
        setSpecialization(faculty.specialization || '');
        setEmail(faculty.email || '');
        setPhone(faculty.phone || '');
        setOfficeRoom(faculty.office_room || '');
        setSelectedPhotoFile(null);
        setPhotoPreview(faculty.photo_url || null);
        setRemovePhoto(false);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setRemovePhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const commonPayload: any = {
            first_name: firstName,
            last_name: lastName,
            program_id: programId,
            faculty_id: facultyId,
            spreadsheet_name: spreadsheetName,
            academic_rank: academicRank,
            employment_type: employmentType,
            status: status,
            highest_qualification: highestQualification,
            specialization: specialization,
            email: email,
            phone: phone,
            office_room: officeRoom,
        };

        if (editingFaculty) {
            const payload: any = {
                _method: 'put',
                ...commonPayload,
            };

            if (selectedPhotoFile) {
                payload.profile_picture = selectedPhotoFile;
            } else if (removePhoto) {
                payload.remove_photo = 1;
            }

            router.post(`/faculties/${editingFaculty.id}`, payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingFaculty(null);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } else {
            const payload: any = {
                ...commonPayload,
            };

            if (selectedPhotoFile) {
                payload.profile_picture = selectedPhotoFile;
            }

            router.post('/faculties', payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Filter & Sort faculties from actual DB state
    const filteredFaculties = useMemo(() => {
        let result = faculties.filter((faculty) => {
            const fullName = `${faculty.first_name} ${faculty.last_name}`.toLowerCase();
            const idNumber = (faculty.faculty_id || faculty.employee_id || '').toLowerCase();
            const rank = (faculty.academic_rank || '').toLowerCase();
            const programCode = (faculty.program?.code || '').toLowerCase();
            const specialization = (faculty.specialization || '').toLowerCase();
            const searchLower = searchQuery.toLowerCase();

            const matchesSearch =
                !searchQuery ||
                fullName.includes(searchLower) ||
                idNumber.includes(searchLower) ||
                rank.includes(searchLower) ||
                programCode.includes(searchLower) ||
                specialization.includes(searchLower);

            const matchesProgram =
                programFilter === 'all' ||
                String(faculty.program_id) === programFilter;

            const matchesEmployment =
                employmentStatusFilter === 'all' ||
                (faculty.employment_type || '').toLowerCase() === employmentStatusFilter.toLowerCase() ||
                (faculty.status || '').toLowerCase() === employmentStatusFilter.toLowerCase();

            const matchesRank =
                academicRankFilter === 'all' ||
                (faculty.academic_rank || '').toLowerCase() === academicRankFilter.toLowerCase();

            const matchesAttention =
                attentionStatusFilter === 'all' ||
                (attentionStatusFilter === 'needs_attention' && attentionFacultyIds.has(faculty.id)) ||
                (attentionStatusFilter === 'compliant' && !attentionFacultyIds.has(faculty.id));

            return matchesSearch && matchesProgram && matchesEmployment && matchesRank && matchesAttention;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'name_asc') {
                return a.last_name.localeCompare(b.last_name);
            }
            if (sortBy === 'name_desc') {
                return b.last_name.localeCompare(a.last_name);
            }
            if (sortBy === 'rank') {
                return (a.academic_rank || '').localeCompare(b.academic_rank || '');
            }
            if (sortBy === 'recent') {
                return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
            }
            return 0;
        });

        return result;
    }, [
        faculties,
        searchQuery,
        programFilter,
        employmentStatusFilter,
        academicRankFilter,
        attentionStatusFilter,
        sortBy,
        attentionFacultyIds,
    ]);

    // Unique academic ranks for dropdown
    const rankOptions = useMemo(() => {
        if (ranks && ranks.length > 0) return ranks;
        const set = new Set<string>();
        faculties.forEach((f) => {
            if (f.academic_rank) set.add(f.academic_rank);
        });
        return Array.from(set).sort();
    }, [ranks, faculties]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Management" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/20 font-['Poppins',sans-serif]">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-xs">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Users className="w-6 h-6" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        {user_permissions.is_program_head ? 'Program Faculty Directory' : 'Faculty Management'}
                                    </h1>
                                    {user_permissions.is_program_head && (
                                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                            Departmental Scope
                                        </Badge>
                                    )}
                                    {user_permissions.is_dean && (
                                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-semibold">
                                            College-Wide Directory
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {user_permissions.is_program_head
                                        ? 'View assigned departmental faculty, workload, specializations, compliance history, and course eligibility.'
                                        : 'View and manage faculty profiles, teaching workload, requirements, and performance.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {user_permissions.can_delete && (
                        <button
                            onClick={openAddDialog}
                            className="inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all bg-amber-500 hover:bg-amber-600 text-slate-950 h-10 px-5 py-2 shadow-xs cursor-pointer active:scale-98"
                        >
                            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                            Add Faculty
                        </button>
                    )}
                </div>

                {/* Main 2-Column Content: Left (Cards + Table) | Right (Needs Attention, Profile Completion, Recent Updates) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left Column (8 or 9 cols) */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        {/* 4 Metric Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Total Faculty */}
                            <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-muted-foreground truncate">Total Faculty</p>
                                    <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.total_faculty}</h3>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">All faculty members</p>
                                </div>
                            </div>

                            {/* Active Faculty */}
                            <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-muted-foreground truncate">Active Faculty</p>
                                    <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.active_faculty}</h3>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {((stats.study_leave ?? 0) > 0 || (stats.on_leave ?? 0) > 0) ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                +{((stats.study_leave ?? 0) + (stats.on_leave ?? 0))} on leave / study leave
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                {stats.total_faculty > 0 ? Math.round((stats.active_faculty / stats.total_faculty) * 100) : 0}% active
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Full-Time */}
                            <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-muted-foreground truncate">Full-Time</p>
                                    <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.full_time}</h3>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {stats.total_faculty > 0 ? Math.round((stats.full_time / stats.total_faculty) * 100) : 0}% of total
                                    </p>
                                </div>
                            </div>

                            {/* Needs Attention */}
                            <div
                                onClick={() => setAttentionStatusFilter(attentionStatusFilter === 'needs_attention' ? 'all' : 'needs_attention')}
                                className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all ${
                                    attentionStatusFilter === 'needs_attention'
                                        ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800'
                                        : 'bg-white dark:bg-card border-border hover:border-rose-200'
                                }`}
                            >
                                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 truncate">Needs Attention</p>
                                    <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.needs_attention}</h3>
                                    <p className="text-[10px] text-rose-500 truncate mt-0.5">
                                        {stats.needs_attention_pct}% of total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search & Comprehensive Filters Bar matching Mockup */}
                        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-xs flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                {/* Search input */}
                                <div className="md:col-span-5 relative">
                                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search faculty by name, ID, rank, program, or specialization..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Program dropdown */}
                                <div className="md:col-span-2">
                                    <select
                                        value={programFilter}
                                        onChange={(e) => setProgramFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Programs</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Employment & Faculty Status */}
                                <div className="md:col-span-2">
                                    <select
                                        value={employmentStatusFilter}
                                        onChange={(e) => setEmploymentStatusFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Statuses</option>
                                        <optgroup label="Faculty Status">
                                            <option value="Active">Active</option>
                                            <option value="Study Leave">Study Leave</option>
                                            <option value="On Leave">On Leave</option>
                                            <option value="Sabbatical">Sabbatical</option>
                                            <option value="Inactive">Inactive</option>
                                        </optgroup>
                                        <optgroup label="Employment Type">
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Guest Lecturer">Guest Lecturer</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {/* Academic Rank */}
                                <div className="md:col-span-3">
                                    <select
                                        value={academicRankFilter}
                                        onChange={(e) => setAcademicRankFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Ranks</option>
                                        {rankOptions.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sub bar: Filter badge, Sort, and View layout switcher */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span>
                                        Showing <strong className="text-foreground">{filteredFaculties.length}</strong> of{' '}
                                        <strong className="text-foreground">{faculties.length}</strong> faculty members
                                    </span>
                                    {attentionStatusFilter !== 'all' && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] cursor-pointer hover:bg-destructive/20"
                                            onClick={() => setAttentionStatusFilter('all')}
                                        >
                                            Filtered: Needs Attention <X className="w-3 h-3 ml-1" />
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Sort dropdown */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px]">Sort by:</span>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="h-8 rounded-lg border border-input bg-background px-2 text-[11px] focus-visible:outline-none"
                                        >
                                            <option value="name_asc">Name (A-Z)</option>
                                            <option value="name_desc">Name (Z-A)</option>
                                            <option value="rank">Academic Rank</option>
                                            <option value="recent">Recently Updated</option>
                                        </select>
                                    </div>

                                    {/* Layout toggle */}
                                    <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`p-1 rounded-md transition-colors ${
                                                viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                                            }`}
                                            title="Table view"
                                        >
                                            <List className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1 rounded-md transition-colors ${
                                                viewMode === 'grid' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                                            }`}
                                            title="Grid cards view"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Faculty Table / Grid */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                            {filteredFaculties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="p-4 rounded-full bg-muted/60 mb-3">
                                        <Users className="h-8 w-8 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">No faculty members found</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                        No faculty match your active filters or search terms. Try clearing filters to view all members.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setProgramFilter('all');
                                            setEmploymentStatusFilter('all');
                                            setAcademicRankFilter('all');
                                            setAttentionStatusFilter('all');
                                        }}
                                        className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-[11px] font-semibold text-muted-foreground uppercase bg-slate-50/80 dark:bg-muted/30 border-b border-border">
                                            <tr>
                                                <th scope="col" className="px-5 py-3.5">Faculty</th>
                                                <th scope="col" className="px-4 py-3.5">Academic Rank</th>
                                                <th scope="col" className="px-4 py-3.5">Assigned Program</th>
                                                <th scope="col" className="px-4 py-3.5">Employment Status</th>
                                                <th scope="col" className="px-4 py-3.5">Specialization / Qualification</th>
                                                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredFaculties.map((faculty) => {
                                                const hasAttention = attentionFacultyIds.has(faculty.id);
                                                const initials = `${faculty.first_name?.[0] || ''}${faculty.last_name?.[0] || ''}`.toUpperCase();

                                                return (
                                                    <tr
                                                        key={faculty.id}
                                                        onClick={() => router.visit(`/faculties/${faculty.id}`)}
                                                        className="hover:bg-slate-50/80 dark:hover:bg-muted/30 transition-colors cursor-pointer group"
                                                    >
                                                        {/* Faculty Name & Photo with Profile Completion Indicator Ring */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                {(() => {
                                                                    const completionPct = getFacultyCompletion(faculty);
                                                                    const strokeColor =
                                                                        completionPct >= 80
                                                                            ? '#eab308' // primary amber/yellow
                                                                            : completionPct >= 50
                                                                            ? '#f59e0b' // amber
                                                                            : '#fbbf24'; // light amber/yellow
                                                                    return (
                                                                        <div
                                                                            className="relative w-11 h-11 shrink-0 flex items-center justify-center"
                                                                            title={`Profile Completion: ${completionPct}%`}
                                                                        >
                                                                            {/* Circular SVG Donut Progress Ring */}
                                                                            <svg className="w-11 h-11 -rotate-90 pointer-events-none absolute inset-0" viewBox="0 0 44 44">
                                                                                <circle
                                                                                    cx="22"
                                                                                    cy="22"
                                                                                    r="19"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2.5"
                                                                                    className="text-amber-500/15 dark:text-amber-500/20"
                                                                                />
                                                                                <circle
                                                                                    cx="22"
                                                                                    cy="22"
                                                                                    r="19"
                                                                                    fill="none"
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="2.5"
                                                                                    strokeDasharray={`${(completionPct / 100) * 119.38} 119.38`}
                                                                                    strokeLinecap="round"
                                                                                    className="transition-all duration-700 ease-out"
                                                                                />
                                                                            </svg>

                                                                            {/* Avatar circle inside donut */}
                                                                            {faculty.photo_url ? (
                                                                                <img
                                                                                    src={faculty.photo_url}
                                                                                    alt={`${faculty.first_name} ${faculty.last_name}`}
                                                                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold text-[11px] flex items-center justify-center shrink-0">
                                                                                    {initials}
                                                                                </div>
                                                                            )}

                                                                            {/* Small percentage badge on bottom-right of donut */}
                                                                            <span className="absolute -bottom-1 -right-1 text-[8px] font-black font-mono leading-none bg-amber-500 text-slate-950 px-1 py-0.5 rounded-full border border-background shadow-2xs">
                                                                                {completionPct}%
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })()}

                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                                        <span className="truncate">
                                                                            {faculty.title_name || `Prof. ${faculty.first_name} ${faculty.last_name}`}
                                                                        </span>
                                                                        {hasAttention && (
                                                                            <span
                                                                                className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                                                                                title="This faculty requires attention"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                                            {faculty.faculty_id || faculty.employee_id || `CIDS-2026-${faculty.id.toString().padStart(3, '0')}`}
                                                                        </span>
                                                                        {faculty.spreadsheet_name && (
                                                                            <span
                                                                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                                                                title="Linked Google Sheets Alias"
                                                                            >
                                                                                Sheet: {faculty.spreadsheet_name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Academic Rank */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="font-medium text-foreground">
                                                                {faculty.academic_rank || 'Instructor I'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                                                                {faculty.highest_qualification || '—'}
                                                            </div>
                                                        </td>

                                                        {/* Program */}
                                                        <td className="px-4 py-3.5">
                                                            {faculty.program ? (
                                                                <div className="flex flex-col">
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 text-xs">
                                                                        <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                                                                        {faculty.program.code}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                        {faculty.program.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground italic">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Employment Status */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex flex-col items-start gap-1">
                                                                {(() => {
                                                                    const currentStatus = faculty.status || 'Active';
                                                                    const isStudyLeave = currentStatus === 'Study Leave';
                                                                    const isOnLeave = currentStatus === 'On Leave' || currentStatus === 'Sabbatical';
                                                                    const isInactive = currentStatus === 'Inactive';

                                                                    if (isStudyLeave) {
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                                                Study Leave
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (isOnLeave) {
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                                {currentStatus}
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (isInactive) {
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                                                Inactive
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                            Active
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <span className="text-[10px] text-muted-foreground font-medium pl-0.5">
                                                                    {faculty.employment_type || 'Full-time'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Specialization / Qualification */}
                                                        <td className="px-4 py-3.5">
                                                            {faculty.specialization ? (
                                                                <div>
                                                                    <div className="font-medium text-foreground truncate max-w-[180px]">
                                                                        {faculty.specialization}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                                                        {faculty.highest_qualification || 'Degree verified'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] text-muted-foreground italic">
                                                                    Not yet specified
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-5 py-3.5 text-right">
                                                            <div
                                                                className="flex items-center justify-end gap-1.5"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button
                                                                            className="p-1.5 hover:bg-amber-500/10 hover:text-amber-600 rounded-md transition-colors text-muted-foreground"
                                                                            title="Actions"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-44 text-xs font-['Poppins']">
                                                                        <DropdownMenuItem onClick={() => router.visit(`/faculties/${faculty.id}`)}>
                                                                            <User className="h-3.5 w-3.5 mr-2 text-primary" />
                                                                            View Dossier
                                                                        </DropdownMenuItem>
                                                                        {user_permissions.can_edit && (
                                                                            <DropdownMenuItem onClick={() => openEditDialog(faculty)}>
                                                                                <Edit className="h-3.5 w-3.5 mr-2" />
                                                                                Edit Credentials
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {user_permissions.can_delete && (
                                                                            <>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                                    onClick={() => setDeletingFaculty(faculty)}
                                                                                >
                                                                                    <Trash className="h-3.5 w-3.5 mr-2" />
                                                                                    Delete Faculty
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (4 cols) — Real DB Data: Faculty Needing Attention, Profile Completion, Recent Updates */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        {/* 1. Faculty Needing Attention Panel (Live from DB) */}
                        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                        <AlertTriangle className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <h2 className="text-xs font-bold text-foreground">Faculty Needing Attention</h2>
                                        <p className="text-[10px] text-muted-foreground">
                                            Incomplete profiles or missing requirements
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    {needsAttention.length}
                                </span>
                            </div>

                            <div className="divide-y divide-border/60 mt-2">
                                {needsAttention.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted-foreground">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                                        All faculty profiles and compliance requirements are up to date!
                                    </div>
                                ) : (
                                    needsAttention.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.visit(`/faculties/${item.id}`)}
                                            className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-muted/30 px-2 rounded-xl transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {item.photo_url ? (
                                                    <img
                                                        src={item.photo_url}
                                                        alt={item.name}
                                                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-foreground font-semibold text-xs flex items-center justify-center shrink-0">
                                                        {item.initials}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 truncate mt-0.5">
                                                        {item.primary_issue}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] py-0 px-1.5 border-rose-500/30 text-rose-600 bg-rose-500/10"
                                                >
                                                    {item.program}
                                                </Badge>
                                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {needsAttention.length > 5 && (
                                <button
                                    onClick={() => setAttentionStatusFilter('needs_attention')}
                                    className="w-full mt-3 py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl border border-transparent hover:border-amber-500/20 transition-all flex items-center justify-center gap-1"
                                >
                                    <span>View All ({needsAttention.length})</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 2. Profile Completion Widget (Live from DB) */}
                        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Clock className="w-4 h-4" />
                                    </span>
                                    <h2 className="text-xs font-bold text-foreground">Profile Completion</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-4">
                                {/* Circular gauge */}
                                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-amber-500/15 dark:text-amber-500/20"
                                            strokeWidth="3.5"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-amber-500 transition-all duration-1000 ease-out"
                                            strokeDasharray={`${profileCompletion.completion_rate}, 100`}
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <span className="absolute text-xs font-bold text-foreground">
                                        {profileCompletion.completion_rate}%
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-foreground">Complete Profiles</h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {profileCompletion.complete_count} of {profileCompletion.total_faculty} faculty members
                                    </p>
                                </div>
                            </div>

                            {/* Status item rows */}
                            <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-muted-foreground text-[11px]">Complete</span>
                                    </div>
                                    <span className="font-bold text-foreground">{profileCompletion.complete_count}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-muted-foreground text-[11px]">Incomplete</span>
                                    </div>
                                    <span className="font-bold text-foreground">{profileCompletion.incomplete_count}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-muted-foreground text-[11px]">Missing Requirements</span>
                                    </div>
                                    <span className="font-bold text-foreground">{profileCompletion.missing_requirements_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Recent Updates Panel (Live from DB) */}
                        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Clock className="w-4 h-4" />
                                    </span>
                                    <h2 className="text-xs font-bold text-foreground">Recent Updates</h2>
                                </div>
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer">
                                    Audit Trail
                                </span>
                            </div>

                            <div className="divide-y divide-border/60 mt-2">
                                {recentUpdates.length === 0 ? (
                                    <div className="py-4 text-center text-xs text-muted-foreground">
                                        No recent updates logged.
                                    </div>
                                ) : (
                                    recentUpdates.map((update, idx) => (
                                        <div
                                            key={`${update.id}-${idx}`}
                                            onClick={() => router.visit(`/faculties/${update.id}`)}
                                            className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50/60 dark:hover:bg-muted/30 px-2 rounded-xl transition-colors cursor-pointer group"
                                        >
                                            <span
                                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                    update.type === 'create'
                                                        ? 'bg-amber-500'
                                                        : idx % 2 === 0
                                                        ? 'bg-emerald-500'
                                                        : 'bg-blue-500'
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                    {update.faculty_name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {update.action}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                                                    {update.time_formatted} ({update.time_ago})
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add / Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto font-['Poppins']">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-primary" />
                                {editingFaculty ? 'Edit Faculty Member' : 'Register New Faculty Member'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
                            {/* Profile Picture Upload Section */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border">
                                <div className="relative group">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Faculty preview"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-4 border-background shadow-md">
                                            {firstName ? firstName[0] : ''}
                                            {lastName ? lastName[0] : (firstName ? '' : <Users className="w-8 h-8 opacity-40" />)}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform hover:scale-105"
                                        title="Upload photo"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        {photoPreview ? 'Change Photo' : 'Upload Profile Picture'}
                                    </button>

                                    {photoPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1 ml-2"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <p className="text-[11px] text-muted-foreground mt-1 text-center">
                                    Shown across TV screens, faculty profile dossiers, and schedule displays. PNG, JPG up to 5MB.
                                </p>
                                {formErrors.profile_picture && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.profile_picture}</p>
                                )}
                            </div>

                            {/* Core Identity Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Maria"
                                        required
                                    />
                                    {formErrors.first_name && (
                                        <p className="text-xs text-red-500">{formErrors.first_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Santos"
                                        required
                                    />
                                    {formErrors.last_name && (
                                        <p className="text-xs text-red-500">{formErrors.last_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Faculty ID Number
                                    </label>
                                    <input
                                        type="text"
                                        value={facultyId}
                                        onChange={(e) => setFacultyId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. CIDS-2026-001"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Spreadsheet / Schedule Name Alias
                                        </label>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            Google Sheets Match
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={spreadsheetName}
                                        onChange={(e) => setSpreadsheetName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                                        placeholder="e.g. ROXAS or Santos, M. (optional alias)"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Allows editing official names in OfficeHub without affecting or breaking auto-sync with the Google spreadsheet.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Program Assignment <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={programId}
                                        onChange={(e) => setProgramId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={prog.id}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.program_id && (
                                        <p className="text-xs text-red-500">{formErrors.program_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Academic Rank
                                    </label>
                                    <input
                                        type="text"
                                        value={academicRank}
                                        onChange={(e) => setAcademicRank(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Assistant Professor I"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Employment Type
                                    </label>
                                    <select
                                        value={employmentType}
                                        onChange={(e) => setEmploymentType(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="Full-time">Full-time Faculty</option>
                                        <option value="Part-time">Part-time Faculty</option>
                                        <option value="Guest Lecturer">Guest Lecturer</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Faculty Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Study Leave">Study Leave</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Sabbatical">Sabbatical</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Highest Qualification
                                    </label>
                                    <input
                                        type="text"
                                        value={highestQualification}
                                        onChange={(e) => setHighestQualification(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Master of Information Technology"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Specialization / Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Software Engineering"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Institutional Email
                                        </label>
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                            Auto-creates login account
                                        </span>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. maria.santos@cids.edu.ph"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        An account with default password <span className="font-mono font-semibold text-foreground">password</span> is automatically provisioned for faculty portal access.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Office Room / Consultation Desk
                                    </label>
                                    <input
                                        type="text"
                                        value={officeRoom}
                                        onChange={(e) => setOfficeRoom(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. CIDS Faculty Room 302"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 h-9 px-4 py-2 disabled:opacity-50 transition-colors shadow-2xs"
                                >
                                    {isSubmitting ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <DeleteConfirmDialog
                    open={!!deletingFaculty}
                    onOpenChange={(open) => !open && setDeletingFaculty(null)}
                    title="Delete Faculty Member"
                    description="Are you sure you want to delete this faculty member? This will remove their record from all department listings."
                    itemName={deletingFaculty ? `${deletingFaculty.first_name} ${deletingFaculty.last_name}` : undefined}
                    confirmLabel="Delete Faculty"
                    isDeleting={isDeleting}
                    onConfirm={() => {
                        if (!deletingFaculty) return;
                        setIsDeleting(true);
                        router.delete(`/faculties/${deletingFaculty.id}`, {
                            preserveScroll: true,
                            onFinish: () => {
                                setIsDeleting(false);
                                setDeletingFaculty(null);
                            },
                        });
                    }}
                />
            </div>
        </AppLayout>
    );
}
