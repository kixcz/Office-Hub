import React, { useState, useMemo, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    Search,
    Plus,
    Building2,
    Clock,
    UserCheck,
    CheckCircle2,
    Calendar,
    Check,
    AlertCircle,
    User,
    Sparkles,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Copy,
    GraduationCap,
    BookOpen,
    CalendarDays,
    AlertTriangle,
    Users,
    ChevronRight,
    ChevronDown,
    X,
    Filter,
    Layers,
    FileSpreadsheet,
    Activity,
    History as HistoryIcon,
    ArrowRight,
    LayoutGrid,
    List,
    ShieldAlert,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Structure',
        href: '/sections',
    },
    {
        title: 'Sections',
        href: '/sections',
    },
];

interface AcademicPeriod {
    id: number;
    name: string;
    is_active?: boolean;
}

interface Program {
    id: number;
    code: string;
    name: string;
    curricula?: Curriculum[];
}

interface Curriculum {
    id: number;
    version_name: string;
    status: string;
}

interface Faculty {
    id: number;
    full_name: string;
    first_name?: string;
    last_name?: string;
    designation?: string;
    department?: string;
}

interface CourseOffering {
    id: number;
    offering_code: string;
    course_code: string;
    course_title: string;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    offering_type: string;
    loading_status: string;
    timetable_status: string;
    publication_status: string;
    faculty?: Faculty;
}

interface RoomSchedule {
    id: number;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    course_code: string;
    course_title: string;
    faculty?: Faculty;
}

interface ExamSchedule {
    id: number;
    exam_type: string;
    exam_date: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_name: string;
    course_code: string;
    course_title: string;
    status: string;
}

interface AuditHistoryItem {
    date: string;
    action: string;
    type: string;
}

interface ReadinessChecks {
    curriculum_assigned: boolean;
    required_offerings_complete: boolean;
    faculty_loading_complete: boolean;
    schedule_complete: boolean;
    room_capacity_valid: boolean;
    exam_schedule_complete: boolean;
}

interface SectionItem {
    id: number;
    academic_period_id: number;
    program_id: number;
    curriculum_id: number | null;
    adviser_id: number | null;
    code: string;
    year_level: number;
    population: number;
    actual_count: number | null;
    status: 'Planned' | 'Active' | 'Inactive' | 'Closed';
    effective_from: string | null;
    effective_until: string | null;
    remarks: string | null;
    source?: string;
    program?: Program;
    curriculum?: Curriculum;
    adviser?: Faculty;
    academic_period?: AcademicPeriod;
    course_offerings?: CourseOffering[];
    room_schedules?: RoomSchedule[];
    exam_schedules?: ExamSchedule[];
    validation_warnings?: string[];
    readiness_checks?: ReadinessChecks;
    readiness_status?: 'Ready' | 'Needs Configuration' | 'Needs Faculty Loading' | 'Needs Scheduling' | 'Conflict Detected';
    offerings_count: number;
    expected_offerings_count?: number;
    faculty_assigned_count: number;
    scheduled_count: number;
    exams_count: number;
    room_capacity_valid?: boolean;
    audit_history?: AuditHistoryItem[];
}

interface Props {
    sections: SectionItem[];
    programs: Program[];
    academicPeriods: AcademicPeriod[];
    currentPeriod: AcademicPeriod | null;
    facultyMembers: Faculty[];
    courses?: any[];
    sources?: string[];
    stats: {
        total_sections: number;
        active_sections: number;
        total_students: number;
        ready_sections: number;
        need_attention_sections: number;
    };
    filters: {
        academic_period_id?: string;
        program_id?: string;
        year_level?: string;
        status?: string;
        source?: string;
        search?: string;
        readiness?: string;
    };
}

export default function SectionsIndex({
    sections,
    programs,
    academicPeriods,
    currentPeriod,
    facultyMembers,
    sources = [],
    stats,
    filters = {},
}: Props) {
    // 1. Filter States
    const [selectedPeriod, setSelectedPeriod] = useState(filters.academic_period_id || String(currentPeriod?.id || ''));
    const [selectedProgramFilter, setSelectedProgramFilter] = useState(filters.program_id || 'all');
    const [selectedYearFilter, setSelectedYearFilter] = useState(filters.year_level || 'all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters.status || 'all');
    const [selectedSourceFilter, setSelectedSourceFilter] = useState(filters.source || 'all');
    const [selectedReadinessFilter, setSelectedReadinessFilter] = useState(filters.readiness || 'all');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Sync from Google Sheets Modal
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState(
        'https://docs.google.com/spreadsheets/u/3/d/13LtlK6wopWwYf-7Q8rgmfOwEDo6gUMMJT32-xwEeVN8/edit?gid=1905905992#gid=1905905992'
    );
    const [isSyncing, setIsSyncing] = useState(false);

    // Collapsed state tracking for programs & year levels
    const [collapsedPrograms, setCollapsedPrograms] = useState<Record<number, boolean>>({});
    const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});

    const toggleProgramCollapse = (progId: number) => {
        setCollapsedPrograms((prev) => ({ ...prev, [progId]: !prev[progId] }));
    };

    const toggleYearCollapse = (key: string) => {
        setCollapsedYears((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Right-Side Drawer / Workspace for Detailed Section View
    const [viewingSection, setViewingSection] = useState<SectionItem | null>(null);
    const [detailTab, setDetailTab] = useState<
        'overview' | 'offerings' | 'faculty' | 'schedule' | 'exams' | 'history'
    >('overview');
    const [scheduleViewMode, setScheduleViewMode] = useState<'grid' | 'list'>('grid');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isCopyPreviousOpen, setIsCopyPreviousOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
    const [deletingSection, setDeletingSection] = useState<SectionItem | null>(null);

    // Form: Single Section
    const createForm = useForm({
        academic_period_id: currentPeriod?.id || academicPeriods[0]?.id || '',
        program_id: programs[0]?.id || '',
        curriculum_id: '',
        adviser_id: '',
        code: '',
        year_level: 1,
        population: 40,
        actual_count: 40,
        status: 'Active',
        source: 'Manual Entry',
        effective_from: '',
        effective_until: '',
        remarks: '',
        auto_generate_offerings: true,
    });

    // Form: Bulk Create
    const bulkForm = useForm({
        academic_period_id: currentPeriod?.id || academicPeriods[0]?.id || '',
        program_id: programs[0]?.id || '',
        year_level: 1,
        curriculum_id: '',
        section_suffixes: 'A, B',
        population: 40,
        status: 'Active',
        auto_generate_offerings: true,
    });

    // Form: Copy Previous
    const copyForm = useForm({
        source_period_id: academicPeriods[1]?.id || academicPeriods[0]?.id || '',
        target_period_id: currentPeriod?.id || academicPeriods[0]?.id || '',
        advance_year_level: true,
    });

    // Form: Edit Section
    const editForm = useForm({
        code: '',
        curriculum_id: '' as string | number,
        adviser_id: '' as string | number,
        year_level: 1,
        population: 40,
        actual_count: 40,
        status: 'Active',
        source: 'Manual Entry',
        effective_from: '',
        effective_until: '',
        remarks: '',
    });

    // Selected Program in Create Dialog to suggest curriculum and code
    const selectedCreateProgram = useMemo(() => {
        return programs.find((p) => String(p.id) === String(createForm.data.program_id));
    }, [programs, createForm.data.program_id]);

    const activeCurriculumForCreate = useMemo(() => {
        if (!selectedCreateProgram?.curricula) return null;
        return selectedCreateProgram.curricula.find((c) => c.status === 'Active') || selectedCreateProgram.curricula[0] || null;
    }, [selectedCreateProgram]);

    // Update code suggestion in create form when program or year level changes
    const handleProgramOrYearChange = (programId: number, yearLvl: number) => {
        const prog = programs.find((p) => p.id === programId);
        if (prog) {
            // Suggest BSIT-1A format if code is empty or matches pattern
            const suggested = `${prog.code}-${yearLvl}A`;
            createForm.setData((prev) => ({
                ...prev,
                program_id: programId,
                year_level: yearLvl,
                code: suggested,
            }));
        }
    };

    const handleOpenEdit = (sec: SectionItem) => {
        setEditingSection(sec);
        editForm.setData({
            code: sec.code,
            curriculum_id: sec.curriculum_id || '',
            adviser_id: sec.adviser_id || '',
            year_level: sec.year_level,
            population: sec.population,
            actual_count: sec.actual_count || sec.population,
            status: sec.status,
            source: sec.source || 'Manual Entry',
            effective_from: sec.effective_from || '',
            effective_until: sec.effective_until || '',
            remarks: sec.remarks || '',
        });
    };

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post('/sections', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitBulk: FormEventHandler = (e) => {
        e.preventDefault();
        bulkForm.post('/sections/bulk', {
            onSuccess: () => {
                setIsBulkOpen(false);
                bulkForm.reset();
            },
        });
    };

    const submitCopyPrevious: FormEventHandler = (e) => {
        e.preventDefault();
        copyForm.post('/sections/copy-previous', {
            onSuccess: () => {
                setIsCopyPreviousOpen(false);
            },
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingSection) return;
        editForm.put(`/sections/${editingSection.id}`, {
            onSuccess: () => {
                setEditingSection(null);
            },
        });
    };

    const confirmDelete = () => {
        if (!deletingSection) return;
        router.delete(`/sections/${deletingSection.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSection(null);
                if (viewingSection?.id === deletingSection.id) {
                    setViewingSection(null);
                }
            },
        });
    };

    const handleGenerateOfferings = (sec: SectionItem) => {
        router.post(`/sections/${sec.id}/generate-offerings`, {}, {
            preserveScroll: true,
        });
    };

    // Check if any non-default filter is currently active
    const hasActiveFilters = useMemo(() => {
        return (
            selectedProgramFilter !== 'all' ||
            selectedYearFilter !== 'all' ||
            selectedStatusFilter !== 'all' ||
            selectedSourceFilter !== 'all' ||
            selectedReadinessFilter !== 'all' ||
            searchTerm.trim() !== ''
        );
    }, [selectedProgramFilter, selectedYearFilter, selectedStatusFilter, selectedSourceFilter, selectedReadinessFilter, searchTerm]);

    const clearFilters = () => {
        setSelectedProgramFilter('all');
        setSelectedYearFilter('all');
        setSelectedStatusFilter('all');
        setSelectedSourceFilter('all');
        setSelectedReadinessFilter('all');
        setSearchTerm('');
    };

    // Filter sections based on control bar inputs
    const filteredSections = useMemo(() => {
        return sections.filter((s) => {
            const matchesPeriod = selectedPeriod === 'all' || String(s.academic_period_id) === String(selectedPeriod);
            const matchesProgram = selectedProgramFilter === 'all' || String(s.program_id) === String(selectedProgramFilter);
            const matchesYear = selectedYearFilter === 'all' || String(s.year_level) === String(selectedYearFilter);
            const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;
            const matchesSource = selectedSourceFilter === 'all' || s.source === selectedSourceFilter;

            let matchesReadiness = true;
            if (selectedReadinessFilter === 'Ready') {
                matchesReadiness = s.readiness_status === 'Ready';
            } else if (selectedReadinessFilter === 'Needs Attention') {
                matchesReadiness = s.readiness_status !== 'Ready';
            } else if (selectedReadinessFilter === 'Missing Offerings') {
                matchesReadiness = !s.readiness_checks?.required_offerings_complete || s.offerings_count === 0;
            } else if (selectedReadinessFilter === 'Missing Faculty') {
                matchesReadiness = !s.readiness_checks?.faculty_loading_complete;
            } else if (selectedReadinessFilter === 'Not Scheduled') {
                matchesReadiness = !s.readiness_checks?.schedule_complete;
            }

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                searchTerm === '' ||
                s.code.toLowerCase().includes(searchLower) ||
                (s.source && s.source.toLowerCase().includes(searchLower)) ||
                (s.remarks && s.remarks.toLowerCase().includes(searchLower)) ||
                (s.program?.code && s.program.code.toLowerCase().includes(searchLower)) ||
                (s.program?.name && s.program.name.toLowerCase().includes(searchLower)) ||
                (s.adviser?.full_name && s.adviser.full_name.toLowerCase().includes(searchLower));

            return matchesPeriod && matchesProgram && matchesYear && matchesStatus && matchesSource && matchesReadiness && matchesSearch;
        });
    }, [sections, selectedPeriod, selectedProgramFilter, selectedYearFilter, selectedStatusFilter, selectedSourceFilter, selectedReadinessFilter, searchTerm]);

    const handleSyncFromSheets = () => {
        setIsSyncing(true);
        router.post('/sections/sync-sheets', {
            spreadsheet_url: spreadsheetUrl,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSyncing(false);
                setIsSyncModalOpen(false);
            },
        });
    };

    const getSectionSourceBadge = (source?: string) => {
        if (!source || source === 'Manual Entry' || source === 'Database') {
            return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Building2 className="w-2.5 h-2.5 text-slate-400" />
                    <span>{source || 'Manual Entry'}</span>
                </span>
            );
        }

        if (source.includes('BSIT')) {
            return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-500" />
                    <span>Sheets (BSIT)</span>
                </span>
            );
        }

        if (source.includes('BSIS')) {
            return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-cyan-500" />
                    <span>Sheets (BSIS)</span>
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <FileSpreadsheet className="w-2.5 h-2.5 text-amber-500" />
                <span>{source}</span>
            </span>
        );
    };

    // Hierarchical grouping: Program -> Year Level -> Sections
    const hierarchicalHierarchy = useMemo(() => {
        const programMap = new Map<number, { program: Program; yearLevels: Map<number, SectionItem[]> }>();

        filteredSections.forEach((sec) => {
            const progId = sec.program_id;
            const prog = sec.program || { id: progId, code: 'OTHER', name: 'Other Program' };

            if (!programMap.has(progId)) {
                programMap.set(progId, {
                    program: prog,
                    yearLevels: new Map<number, SectionItem[]>(),
                });
            }

            const pEntry = programMap.get(progId)!;
            const yr = sec.year_level || 1;

            if (!pEntry.yearLevels.has(yr)) {
                pEntry.yearLevels.set(yr, []);
            }

            pEntry.yearLevels.get(yr)!.push(sec);
        });

        return Array.from(programMap.values()).map((pEntry) => ({
            program: pEntry.program,
            years: Array.from(pEntry.yearLevels.entries())
                .sort(([a], [b]) => a - b)
                .map(([year, list]) => ({
                    year,
                    sections: list.sort((a, b) => a.code.localeCompare(b.code)),
                })),
            totalSections: Array.from(pEntry.yearLevels.values()).reduce((sum, list) => sum + list.length, 0),
            totalStudents: Array.from(pEntry.yearLevels.values()).reduce((sum, list) => sum + list.reduce((acc, s) => acc + (s.actual_count ?? s.population), 0), 0),
            issueCount: Array.from(pEntry.yearLevels.values()).reduce((sum, list) => sum + list.filter((s) => s.readiness_status !== 'Ready').length, 0),
        }));
    }, [filteredSections]);

    // Bulk creation preview calculation
    const bulkPreview = useMemo(() => {
        const prog = programs.find((p) => p.id === Number(bulkForm.data.program_id));
        const progCode = prog?.code || 'SECT';
        const yr = bulkForm.data.year_level || 1;
        const suffixes = bulkForm.data.section_suffixes
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);

        return suffixes.map((suf) => `${progCode}-${yr}${suf}`);
    }, [programs, bulkForm.data.program_id, bulkForm.data.year_level, bulkForm.data.section_suffixes]);

    // Copy previous preview calculation
    const copyPreview = useMemo(() => {
        const sourceSections = sections.filter((s) => String(s.academic_period_id) === String(copyForm.data.source_period_id));
        return sourceSections.map((sec) => {
            if (copyForm.data.advance_year_level) {
                if (sec.year_level >= 4) {
                    return {
                        source: sec.code,
                        proposed: 'Not copied — graduating cohort',
                        status: 'graduating',
                    };
                }
                const nextYear = sec.year_level + 1;
                const nextCode = sec.code.replace(new RegExp(`-${sec.year_level}`), `-${nextYear}`);
                return {
                    source: sec.code,
                    proposed: nextCode !== sec.code ? nextCode : `${sec.code}-Y${nextYear}`,
                    status: 'promoted',
                };
            }
            return {
                source: sec.code,
                proposed: sec.code,
                status: 'same',
            };
        });
    }, [sections, copyForm.data.source_period_id, copyForm.data.advance_year_level]);

    // Helper for grouping faculty assignments in section workspace
    const facultyWorkloadGrouping = useMemo(() => {
        if (!viewingSection?.course_offerings) return [];

        const facultyMap = new Map<number, { faculty: Faculty; offerings: CourseOffering[]; totalHours: number }>();

        viewingSection.course_offerings.forEach((co) => {
            if (!co.faculty) return;
            const fid = co.faculty.id;
            if (!facultyMap.has(fid)) {
                facultyMap.set(fid, {
                    faculty: co.faculty,
                    offerings: [],
                    totalHours: 0,
                });
            }
            const item = facultyMap.get(fid)!;
            item.offerings.push(co);
            item.totalHours += (co.lecture_hours || 0) + (co.lab_hours || 0);
        });

        return Array.from(facultyMap.values());
    }, [viewingSection]);

    // Timetable Grid Helper: Monday - Saturday x Time Slots
    const weeklyTimetableSlots = useMemo(() => {
        if (!viewingSection?.room_schedules) return [];

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days.map((day) => {
            const daySchedules = viewingSection.room_schedules?.filter(
                (rs) => rs.day_of_week?.toLowerCase() === day.toLowerCase()
            ) || [];
            return {
                day,
                schedules: daySchedules.sort((a, b) => a.start_time.localeCompare(b.start_time)),
            };
        });
    }, [viewingSection]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sections · Student Cohorts" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full transition-colors">
                {/* 1. LAYER ONE: Clean Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Sections
                            </h1>
                            {currentPeriod && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{currentPeriod.name}</span>
                                    <span className="text-amber-400">·</span>
                                    <span className="text-[11px] font-bold">Active Scope</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Manage student cohorts by program and year level for the current academic period.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* More Actions Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-all cursor-pointer">
                                    <span>More Actions</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 text-xs">
                                <DropdownMenuItem onClick={() => setIsBulkOpen(true)} className="cursor-pointer">
                                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                                    <span>Bulk Create Sections</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsCopyPreviousOpen(true)} className="cursor-pointer">
                                    <Copy className="w-4 h-4 mr-2 text-slate-500" />
                                    <span>Copy Previous Semester</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Import / Sync Spreadsheet Button */}
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Sync Spreadsheet</span>
                        </button>

                        {/* Primary Action Button */}
                        <button
                            onClick={() => {
                                handleProgramOrYearChange(Number(createForm.data.program_id) || programs[0]?.id, 1);
                                setIsCreateOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>+ Create Section</span>
                        </button>
                    </div>
                </div>

                {/* 2. LAYER ONE: Operational KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Active Sections */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Sections</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.active_sections}
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
                                    / {stats.total_sections} total
                                </span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Live student cohorts</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>

                    {/* Total Students */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Students</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.total_students}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Across cohort sections</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-slate-500" />
                        </div>
                    </div>

                    {/* Ready for Scheduling */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ready for Scheduling</span>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">
                                {stats.ready_sections}
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
                                    / {stats.total_sections} Ready
                                </span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">All prerequisites valid</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Needing Attention (Clickable to Filter) */}
                    <button
                        onClick={() => setSelectedReadinessFilter(selectedReadinessFilter === 'Needs Attention' ? 'all' : 'Needs Attention')}
                        className={cn(
                            'p-4 rounded-xl border text-left shadow-2xs flex items-center justify-between transition-all cursor-pointer',
                            selectedReadinessFilter === 'Needs Attention'
                                ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-400/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                        )}
                    >
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Needs Attention</span>
                                {selectedReadinessFilter === 'Needs Attention' && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white">Filtered</span>
                                )}
                            </div>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-0.5">
                                {stats.need_attention_sections}
                                <span className="text-xs font-semibold text-slate-400 ml-1.5">Need attention</span>
                            </p>
                            <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/80 mt-0.5">Click to filter hierarchy</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-900/40">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </button>
                </div>

                {/* 3. LAYER ONE: Compact Filter Control Bar */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search section code, adviser, remarks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        {/* Program Filter */}
                        <select
                            value={selectedProgramFilter}
                            onChange={(e) => setSelectedProgramFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Programs</option>
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>{p.code}</option>
                            ))}
                        </select>

                        {/* Year Level Filter */}
                        <select
                            value={selectedYearFilter}
                            onChange={(e) => setSelectedYearFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Year Levels</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Planned">Planned</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Closed">Closed</option>
                        </select>

                        {/* Readiness Filter */}
                        <select
                            value={selectedReadinessFilter}
                            onChange={(e) => setSelectedReadinessFilter(e.target.value)}
                            className={cn(
                                'border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500',
                                selectedReadinessFilter !== 'all'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            )}
                        >
                            <option value="all">Readiness: All</option>
                            <option value="Ready">Ready</option>
                            <option value="Needs Attention">Needs Attention</option>
                            <option value="Missing Offerings">Missing Offerings</option>
                            <option value="Missing Faculty">Missing Faculty</option>
                            <option value="Not Scheduled">Not Scheduled</option>
                        </select>

                        {/* Data Source Filter */}
                        <select
                            value={selectedSourceFilter}
                            onChange={(e) => setSelectedSourceFilter(e.target.value)}
                            className={cn(
                                'border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500',
                                selectedSourceFilter !== 'all'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            )}
                        >
                            <option value="all">Origin: All Sources</option>
                            {sources.length > 0 ? (
                                sources.map((src) => (
                                    <option key={src} value={src}>{src}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Manual Entry">Manual Entry</option>
                                    <option value="Google Sheets (BSIT Class)">Google Sheets (BSIT Class)</option>
                                    <option value="Google Sheets (BSIS Class)">Google Sheets (BSIS Class)</option>
                                    <option value="CSV File Import">CSV File Import</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Clear Filters (Only visible when active) */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear Filters</span>
                        </button>
                    )}
                </div>

                {/* 4. LAYER TWO: Collapsible Hierarchy (Program → Year Level → Section Workspace) */}
                <div className="flex flex-col gap-4">
                    {hierarchicalHierarchy.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400">
                            <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                            <p className="font-bold text-slate-600 dark:text-slate-300">No student cohort sections found</p>
                            <p className="text-xs text-slate-400 mt-1">
                                No sections matched your current filter selection. Try clearing filters or create a new section.
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-3 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        hierarchicalHierarchy.map(({ program, years, totalSections, totalStudents, issueCount }) => {
                            const isProgCollapsed = !!collapsedPrograms[program.id];

                            return (
                                <div
                                    key={program.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
                                >
                                    {/* Compact Program Header */}
                                    <div
                                        onClick={() => toggleProgramCollapse(program.id)}
                                        className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                                                <ChevronDown
                                                    className={cn('w-4 h-4 transition-transform duration-200', isProgCollapsed && '-rotate-90')}
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 tracking-wide">
                                                    {program.code}
                                                </span>
                                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                                    {program.name}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {totalSections} {totalSections === 1 ? 'Section' : 'Sections'}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {totalStudents} Students
                                                </span>
                                                {issueCount > 0 ? (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">·</span>
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            <span>{issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">·</span>
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>All Ready</span>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collapsible Body: Year Levels */}
                                    {!isProgCollapsed && (
                                        <div className="p-4 space-y-5">
                                            {years.map(({ year, sections: yearSections }) => {
                                                const yearKey = `${program.id}-${year}`;
                                                const isYearCollapsed = !!collapsedYears[yearKey];

                                                return (
                                                    <div key={year} className="space-y-3">
                                                        {/* Collapsible Year Level Row */}
                                                        <div
                                                            onClick={() => toggleYearCollapse(yearKey)}
                                                            className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors border-l-2 border-amber-500"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ChevronDown
                                                                    className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isYearCollapsed && '-rotate-90')}
                                                                />
                                                                <span className="tracking-wide">
                                                                    {year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : `${year}th Year`}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] font-semibold text-slate-400">
                                                                {yearSections.length} {yearSections.length === 1 ? 'Section' : 'Sections'}
                                                            </span>
                                                        </div>

                                                        {/* 5. Section Cards Grid */}
                                                        {!isYearCollapsed && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pl-2">
                                                                {yearSections.map((sec) => {
                                                                    const isReady = sec.readiness_status === 'Ready';
                                                                    const checks = sec.readiness_checks;

                                                                    return (
                                                                        <div
                                                                            key={sec.id}
                                                                            className={cn(
                                                                                'rounded-xl border p-4 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all hover:shadow-xs relative',
                                                                                !isReady
                                                                                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/10'
                                                                                    : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
                                                                            )}
                                                                        >
                                                                            <div>
                                                                                {/* Top Bar: Section Code & Status */}
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <div>
                                                                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                                                                                            {sec.code}
                                                                                        </h3>
                                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                                            {sec.actual_count || sec.population} students · {sec.curriculum?.version_name || 'No Curriculum'}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                                                        {getSectionSourceBadge(sec.source)}
                                                                                        <span
                                                                                            className={cn(
                                                                                                'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                                                                                                sec.status === 'Active'
                                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                                                            )}
                                                                                        >
                                                                                            {sec.status}
                                                                                        </span>

                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <button className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                                                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent align="end" className="w-40 text-xs">
                                                                                                <DropdownMenuItem onClick={() => {
                                                                                                    setViewingSection(sec);
                                                                                                    setDetailTab('overview');
                                                                                                }}>
                                                                                                    <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                                                                    Open Section
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem onClick={() => handleOpenEdit(sec)}>
                                                                                                    <Edit className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                                                                    Edit Section
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem onClick={() => handleGenerateOfferings(sec)}>
                                                                                                    <RefreshCw className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                                                                                    Sync Offerings
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() => setDeletingSection(sec)}
                                                                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                                                                                                >
                                                                                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-red-600" />
                                                                                                    Delete
                                                                                                </DropdownMenuItem>
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Compact Readiness Strip */}
                                                                                <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                                                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                                                                                        <span>Readiness</span>
                                                                                        <span
                                                                                            className={cn(
                                                                                                'font-bold',
                                                                                                isReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                                                                            )}
                                                                                        >
                                                                                            {sec.readiness_status}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Check 1: Course Offerings */}
                                                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                                                        {checks?.required_offerings_complete ? (
                                                                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                                        ) : (
                                                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                                        )}
                                                                                        <span className="text-slate-700 dark:text-slate-300">
                                                                                            {sec.offerings_count} / {sec.expected_offerings_count || sec.offerings_count || 0} Offerings
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Check 2: Faculty Assigned */}
                                                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                                                        {checks?.faculty_loading_complete ? (
                                                                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                                        ) : (
                                                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                                        )}
                                                                                        <span className="text-slate-700 dark:text-slate-300">
                                                                                            {sec.faculty_assigned_count} / {sec.offerings_count} Faculty Assigned
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Check 3: Scheduled Sessions */}
                                                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                                                        {checks?.schedule_complete ? (
                                                                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                                        ) : (
                                                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                                        )}
                                                                                        <span className="text-slate-700 dark:text-slate-300">
                                                                                            {sec.scheduled_count} / {sec.offerings_count} Scheduled
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Adviser */}
                                                                                <div className="mt-2.5 text-[11px] flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                                                                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                                    <span className="truncate">
                                                                                        Adviser: <strong className="font-semibold text-slate-800 dark:text-slate-200">{sec.adviser?.full_name || 'None Assigned'}</strong>
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Card Bottom Action */}
                                                                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setViewingSection(sec);
                                                                                        setDetailTab('overview');
                                                                                    }}
                                                                                    className={cn(
                                                                                        'w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer',
                                                                                        isReady
                                                                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                                                                                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                                                                                    )}
                                                                                >
                                                                                    <span>{isReady ? 'Open Section' : 'Resolve Issues'}</span>
                                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 6. LAYER THREE: Proper Section Workspace / Drawer Dialog */}
                <Dialog open={!!viewingSection} onOpenChange={(open) => !open && setViewingSection(null)}>
                    <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
                        {viewingSection && (
                            <>
                                {/* Persistent Header */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {viewingSection.code}
                                                </h2>
                                                {getSectionSourceBadge(viewingSection.source)}
                                                <span
                                                    className={cn(
                                                        'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                                                        viewingSection.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                    )}
                                                >
                                                    {viewingSection.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                {viewingSection.year_level === 1 ? '1st Year' : viewingSection.year_level === 2 ? '2nd Year' : `${viewingSection.year_level}th Year`} · {viewingSection.program?.name} ({viewingSection.program?.code}) · {viewingSection.academic_period?.name || 'Current Term'} · {viewingSection.actual_count || viewingSection.population} Students
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(viewingSection)}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleGenerateOfferings(viewingSection)}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                <span>Generate Offerings</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Workspace Tabs Navigation */}
                                    <div className="flex items-center gap-1.5 mt-5 border-b border-slate-200/90 dark:border-slate-700 pb-1 overflow-x-auto text-xs font-bold">
                                        <button
                                            onClick={() => setDetailTab('overview')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'overview'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('offerings')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'offerings'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Course Offerings ({viewingSection.course_offerings?.length || 0})
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('faculty')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'faculty'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Faculty ({facultyWorkloadGrouping.length})
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('schedule')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'schedule'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Schedule ({viewingSection.scheduled_count})
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('exams')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'exams'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Exams ({viewingSection.exams_count})
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('history')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                detailTab === 'history'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            History
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Contents: Scrollable */}
                                <div className="p-6 overflow-y-auto max-h-[calc(92vh-180px)] text-xs">
                                    {/* 1. OVERVIEW TAB: Operational Summary */}
                                    {detailTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* SECTION IDENTITY */}
                                            <div>
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                                                    Section Identity
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                    <div className="p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Program</span>
                                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{viewingSection.program?.code}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Year Level</span>
                                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Year {viewingSection.year_level}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Curriculum</span>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{viewingSection.curriculum?.version_name || 'None'}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{viewingSection.actual_count || viewingSection.population}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Adviser</span>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{viewingSection.adviser?.full_name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* READINESS BREAKDOWN */}
                                            <div>
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                                                    Readiness & Validation Breakdown
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Course Offerings</span>
                                                            <p className="text-[11px] text-slate-500">Required courses instantiated from curriculum</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                                            <span>{viewingSection.offerings_count} / {viewingSection.expected_offerings_count || viewingSection.offerings_count}</span>
                                                            {viewingSection.readiness_checks?.required_offerings_complete ? (
                                                                <Check className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Faculty Assigned</span>
                                                            <p className="text-[11px] text-slate-500">Instructors designated to teach section subjects</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                                            <span>{viewingSection.faculty_assigned_count} / {viewingSection.offerings_count}</span>
                                                            {viewingSection.readiness_checks?.faculty_loading_complete ? (
                                                                <Check className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Scheduled Sessions</span>
                                                            <p className="text-[11px] text-slate-500">Room and timetable slots published</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                                            <span>{viewingSection.scheduled_count} / {viewingSection.offerings_count}</span>
                                                            {viewingSection.readiness_checks?.schedule_complete ? (
                                                                <Check className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Room Capacity</span>
                                                            <p className="text-[11px] text-slate-500">Cohort size fits within facility thresholds</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                                            <span>{viewingSection.room_capacity_valid ? 'Valid Capacity' : 'Exceeds Room Limit'}</span>
                                                            {viewingSection.room_capacity_valid ? (
                                                                <Check className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACADEMIC SUMMARY */}
                                            <div>
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                                                    Academic Summary
                                                </h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="p-3.5 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-center">
                                                        <span className="text-slate-500 text-xs font-semibold">Lecture Courses</span>
                                                        <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                            {viewingSection.course_offerings?.filter((c) => (c.lecture_hours || 0) > 0).length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="p-3.5 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-center">
                                                        <span className="text-slate-500 text-xs font-semibold">Laboratory Courses</span>
                                                        <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                            {viewingSection.course_offerings?.filter((c) => (c.lab_hours || 0) > 0).length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="p-3.5 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-center">
                                                        <span className="text-slate-500 text-xs font-semibold">Weekly Contact Hours</span>
                                                        <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                            {viewingSection.course_offerings?.reduce(
                                                                (acc, c) => acc + (c.lecture_hours || 0) + (c.lab_hours || 0),
                                                                0
                                                            ) || 0}h
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. COURSE OFFERINGS TAB: Complete Lifecycle Data Table */}
                                    {detailTab === 'offerings' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-slate-500 text-xs">
                                                    Comprehensive subject lifecycle for cohort {viewingSection.code}:
                                                </p>
                                                <button
                                                    onClick={() => handleGenerateOfferings(viewingSection)}
                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>Re-sync from Curriculum</span>
                                                </button>
                                            </div>

                                            {viewingSection.course_offerings && viewingSection.course_offerings.length > 0 ? (
                                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                                <th className="p-3">Course</th>
                                                                <th className="p-3">Type</th>
                                                                <th className="p-3">Lec / Lab</th>
                                                                <th className="p-3">Faculty</th>
                                                                <th className="p-3">Loading</th>
                                                                <th className="p-3">Timetable</th>
                                                                <th className="p-3">Publication</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                            {viewingSection.course_offerings.map((co) => (
                                                                <tr key={co.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="p-3">
                                                                        <span className="font-extrabold text-slate-900 dark:text-white block">{co.course_code}</span>
                                                                        <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">{co.course_title}</span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                            {co.offering_type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                                                                        {co.units}u ({co.lecture_hours}h / {co.lab_hours}h)
                                                                    </td>
                                                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                                                        {co.faculty?.full_name || <span className="text-amber-500 font-normal italic">Unassigned</span>}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span
                                                                            className={cn(
                                                                                'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                                                co.loading_status === 'Assigned'
                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                            )}
                                                                        >
                                                                            {co.loading_status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                                                            {co.timetable_status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span
                                                                            className={cn(
                                                                                'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                                                co.publication_status === 'Published'
                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                                                            )}
                                                                        >
                                                                            {co.publication_status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    No course offerings linked to this section yet. Click "Re-sync from Curriculum" to instantiate.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. FACULTY ASSIGNMENTS TAB: Grouped by Instructor */}
                                    {detailTab === 'faculty' && (
                                        <div className="space-y-4">
                                            <p className="text-slate-500 text-xs">
                                                Instructors teaching subjects for this section (grouped without duplicate cards):
                                            </p>

                                            {facultyWorkloadGrouping.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                    {facultyWorkloadGrouping.map(({ faculty, offerings, totalHours }) => (
                                                        <div
                                                            key={faculty.id}
                                                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-2xs space-y-3"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                                        {faculty.full_name}
                                                                    </h5>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                        {faculty.designation || 'Faculty Member'} · {faculty.department || 'Academic Dept'}
                                                                    </p>
                                                                </div>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                                                    {totalHours}h Load
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                                                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Assigned Subjects</span>
                                                                {offerings.map((off) => (
                                                                    <div key={off.id} className="flex items-center justify-between text-xs py-0.5">
                                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                            {off.course_code} - {off.course_title}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-400">
                                                                            {(off.lecture_hours || 0) + (off.lab_hours || 0)} hrs/wk
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    No instructors assigned to this section's offerings yet. Assign faculty via the Faculty Loading module.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. SCHEDULE TAB: Weekly Timetable Grid & List Mode */}
                                    {detailTab === 'schedule' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-slate-500 text-xs">
                                                    Timetable sessions for this cohort:
                                                </p>
                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => setScheduleViewMode('grid')}
                                                        className={cn(
                                                            'px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors',
                                                            scheduleViewMode === 'grid'
                                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                                                : 'text-slate-500 hover:text-slate-800'
                                                        )}
                                                    >
                                                        <LayoutGrid className="w-3.5 h-3.5" />
                                                        <span>Weekly Grid</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setScheduleViewMode('list')}
                                                        className={cn(
                                                            'px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors',
                                                            scheduleViewMode === 'list'
                                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                                                : 'text-slate-500 hover:text-slate-800'
                                                        )}
                                                    >
                                                        <List className="w-3.5 h-3.5" />
                                                        <span>List</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {scheduleViewMode === 'grid' ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                                    {weeklyTimetableSlots.map(({ day, schedules }) => (
                                                        <div key={day} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                                            <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-center font-bold text-slate-700 dark:text-slate-300 text-xs border-b border-slate-200 dark:border-slate-800">
                                                                {day}
                                                            </div>
                                                            <div className="p-2 space-y-2 min-h-[140px]">
                                                                {schedules.length > 0 ? (
                                                                    schedules.map((sc) => (
                                                                        <div key={sc.id} className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] space-y-0.5">
                                                                            <span className="font-extrabold text-slate-900 dark:text-white block">{sc.course_code}</span>
                                                                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">{sc.start_time} - {sc.end_time}</span>
                                                                            <span className="text-[10px] text-slate-500 block truncate">{sc.room_name} · {sc.faculty?.full_name || 'TBA'}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="h-full flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700 italic pt-6">
                                                                        No Classes
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                                    {viewingSection.room_schedules && viewingSection.room_schedules.length > 0 ? (
                                                        viewingSection.room_schedules.map((rs) => (
                                                            <div key={rs.id} className="p-3 flex items-center justify-between text-xs">
                                                                <div>
                                                                    <span className="font-extrabold text-slate-900 dark:text-white">{rs.course_code} - {rs.course_title}</span>
                                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                                        {rs.day_of_week} {rs.start_time} – {rs.end_time} · Room: {rs.room_name} · Faculty: {rs.faculty?.full_name || 'TBA'}
                                                                    </p>
                                                                </div>
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                    Scheduled
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 text-center text-slate-400 italic">No scheduled timetable sessions found.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 5. EXAMS TAB: Coverage & Status Breakdown */}
                                    {detailTab === 'exams' && (
                                        <div className="space-y-4">
                                            {/* Exam Coverage Summary */}
                                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                <span>Exam Coverage</span>
                                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                                    {viewingSection.course_offerings?.length || 0} courses · {viewingSection.exams_count} scheduled · {Math.max(0, (viewingSection.course_offerings?.length || 0) - viewingSection.exams_count)} not scheduled
                                                </span>
                                            </div>

                                            {viewingSection.exam_schedules && viewingSection.exam_schedules.length > 0 ? (
                                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                                                                <th className="p-3">Course</th>
                                                                <th className="p-3">Exam Type</th>
                                                                <th className="p-3">Date & Time</th>
                                                                <th className="p-3">Room</th>
                                                                <th className="p-3">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {viewingSection.exam_schedules.map((ex) => (
                                                                <tr key={ex.id}>
                                                                    <td className="p-3 font-bold text-slate-900 dark:text-white">{ex.course_code}</td>
                                                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{ex.exam_type}</td>
                                                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                                                        {ex.exam_date} ({ex.day_of_week}) {ex.start_time} - {ex.end_time}
                                                                    </td>
                                                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{ex.room_name}</td>
                                                                    <td className="p-3">
                                                                        <span
                                                                            className={cn(
                                                                                'px-2 py-0.5 rounded text-[10px] font-bold border',
                                                                                ex.status === 'Scheduled' && 'bg-blue-50 text-blue-700 border-blue-200',
                                                                                ex.status === 'Conducted' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                                                ex.status === 'Rescheduled' && 'bg-amber-50 text-amber-700 border-amber-200',
                                                                                ex.status === 'Cancelled' && 'bg-red-50 text-red-700 border-red-200'
                                                                            )}
                                                                        >
                                                                            {ex.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    No exam schedules recorded for this cohort yet.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 6. HISTORY TAB: Audit Trail Timeline */}
                                    {detailTab === 'history' && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                                                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    Cohort Audit Timeline
                                                </h5>
                                                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                                    {viewingSection.audit_history && viewingSection.audit_history.length > 0 ? (
                                                        viewingSection.audit_history.map((ah, idx) => (
                                                            <div key={idx} className="relative text-xs">
                                                                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
                                                                <span className="text-[10px] text-slate-400 font-bold block">{ah.date}</span>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{ah.action}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-slate-400 italic text-xs">No audit entries recorded.</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Admin Remarks & Notes</span>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {viewingSection.remarks || 'No operational remarks on file for this section.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                    <button
                                        onClick={() => setViewingSection(null)}
                                        className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
                                    >
                                        Close Workspace
                                    </button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL: Create Section (3 Visual Groups) */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                                Create Student Cohort Section
                            </DialogTitle>
                            <DialogDescription>
                                Set up an operational section under your academic structure.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitCreate} className="space-y-5 py-2">
                            {/* Group 1: Academic Context */}
                            <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                    1. Academic Context
                                </span>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree Program</label>
                                        <select
                                            required
                                            value={createForm.data.program_id}
                                            onChange={(e) => {
                                                const pid = Number(e.target.value);
                                                handleProgramOrYearChange(pid, createForm.data.year_level);
                                            }}
                                            className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg font-semibold"
                                        >
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Year Level</label>
                                        <select
                                            value={createForm.data.year_level}
                                            onChange={(e) => {
                                                const yl = Number(e.target.value);
                                                handleProgramOrYearChange(Number(createForm.data.program_id), yl);
                                            }}
                                            className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg font-semibold"
                                        >
                                            <option value={1}>1st Year</option>
                                            <option value={2}>2nd Year</option>
                                            <option value={3}>3rd Year</option>
                                            <option value={4}>4th Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                                    <span>Active Curriculum: <strong>{activeCurriculumForCreate?.version_name || 'Standard Curriculum'}</strong></span>
                                    <span>Term: <strong>{currentPeriod?.name || 'Current'}</strong></span>
                                </div>
                            </div>

                            {/* Group 2: Section Details */}
                            <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                    2. Section Details
                                </span>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Code</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. BSIT-1A"
                                            value={createForm.data.code}
                                            onChange={(e) => createForm.setData('code', e.target.value.toUpperCase())}
                                            className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg font-black tracking-wide"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Size</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            required
                                            value={createForm.data.population}
                                            onChange={(e) => createForm.setData('population', Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designated Section Adviser</label>
                                    <select
                                        value={createForm.data.adviser_id}
                                        onChange={(e) => createForm.setData('adviser_id', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="">No Adviser Assigned</option>
                                        {facultyMembers.map((f) => (
                                            <option key={f.id} value={f.id}>{f.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks / Operational Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Regular day cohort, evening shift..."
                                        value={createForm.data.remarks}
                                        onChange={(e) => createForm.setData('remarks', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Group 3: Automation */}
                            <div className="space-y-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                    3. Automation
                                </span>

                                <div className="space-y-2 text-xs">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="offering_mode"
                                            checked={createForm.data.auto_generate_offerings}
                                            onChange={() => createForm.setData('auto_generate_offerings', true)}
                                            className="mt-0.5 text-amber-500 focus:ring-amber-500"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                                Generate required course offerings automatically
                                            </span>
                                            <span className="text-[11px] text-slate-500 block">
                                                Instantiates subject offerings from {activeCurriculumForCreate?.version_name || 'curriculum'} for Year {createForm.data.year_level}.
                                            </span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                                        <input
                                            type="radio"
                                            name="offering_mode"
                                            checked={!createForm.data.auto_generate_offerings}
                                            onChange={() => createForm.setData('auto_generate_offerings', false)}
                                            className="mt-0.5 text-amber-500 focus:ring-amber-500"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                                Create section only
                                            </span>
                                            <span className="text-[11px] text-slate-500 block">
                                                Manual subject assignment will be performed later.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer"
                                >
                                    Create Section
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Bulk Create Sections with Visual Preview */}
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <span>Bulk Create Sections</span>
                            </DialogTitle>
                            <DialogDescription>
                                Rapidly configure multiple section cohorts for a degree program.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitBulk} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program</label>
                                    <select
                                        required
                                        value={bulkForm.data.program_id}
                                        onChange={(e) => bulkForm.setData('program_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                                    >
                                        {programs.map((p) => (
                                            <option key={p.id} value={p.id}>{p.code}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Year Level</label>
                                    <select
                                        value={bulkForm.data.year_level}
                                        onChange={(e) => bulkForm.setData('year_level', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                                    >
                                        <option value={1}>1st Year</option>
                                        <option value={2}>2nd Year</option>
                                        <option value={3}>3rd Year</option>
                                        <option value={4}>4th Year</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Suffixes (Comma Separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="A, B, C, D"
                                    value={bulkForm.data.section_suffixes}
                                    onChange={(e) => bulkForm.setData('section_suffixes', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold tracking-wide"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Students Per Section</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={120}
                                    value={bulkForm.data.population}
                                    onChange={(e) => bulkForm.setData('population', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            {/* Visual Preview Box */}
                            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                                    Generated Preview ({bulkPreview.length} sections)
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {bulkPreview.map((code) => (
                                        <span key={code} className="px-2.5 py-1 rounded-md text-xs font-black bg-white dark:bg-slate-800 border border-amber-300 text-slate-800 dark:text-slate-200">
                                            {code}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                    {bulkPreview.length} sections · {bulkForm.data.population} target students each · Automatic offerings enabled
                                </p>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing || bulkPreview.length === 0}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer"
                                >
                                    Create {bulkPreview.length} Sections
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Copy Previous Semester with Preview Table */}
                <Dialog open={isCopyPreviousOpen} onOpenChange={setIsCopyPreviousOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Copy className="w-5 h-5 text-slate-500" />
                                <span>Copy Previous Semester Sections</span>
                            </DialogTitle>
                            <DialogDescription>
                                Safeguard-checked replication with cohort promotion preview.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitCopyPrevious} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Source Term</label>
                                    <select
                                        required
                                        value={copyForm.data.source_period_id}
                                        onChange={(e) => copyForm.setData('source_period_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {academicPeriods.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Term</label>
                                    <select
                                        required
                                        value={copyForm.data.target_period_id}
                                        onChange={(e) => copyForm.setData('target_period_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {academicPeriods.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="advance_yr"
                                    checked={copyForm.data.advance_year_level}
                                    onChange={(e) => copyForm.setData('advance_year_level', e.target.checked)}
                                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500/20"
                                />
                                <label htmlFor="advance_yr" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Advance cohort year level (e.g. BSIT-1A → BSIT-2A)
                                </label>
                            </div>

                            {/* Preview Table */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold text-slate-600 dark:text-slate-300 border-b">
                                    Replication Preview ({copyPreview.length} cohorts)
                                </div>
                                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {copyPreview.map((item, idx) => (
                                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.source}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                            <span className={cn(
                                                'font-mono font-bold',
                                                item.status === 'graduating' ? 'text-amber-600 dark:text-amber-400 italic text-[11px]' : 'text-emerald-600 dark:text-emerald-400'
                                            )}>
                                                {item.proposed}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCopyPreviousOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={copyForm.processing || copyPreview.length === 0}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer"
                                >
                                    Replicate Cohorts
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Edit Section */}
                <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Section: {editingSection?.code}</DialogTitle>
                            <DialogDescription>
                                Update cohort enrollment, status, and designated adviser.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3.5 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Code</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.code}
                                    onChange={(e) => editForm.setData('code', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                                    placeholder="e.g. BSIT-1A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Size</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        required
                                        value={editForm.data.population}
                                        onChange={(e) => editForm.setData('population', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Planned">Planned</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Adviser</label>
                                    <select
                                        value={editForm.data.adviser_id}
                                        onChange={(e) => editForm.setData('adviser_id', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="">No Adviser Assigned</option>
                                        {facultyMembers.map((f) => (
                                            <option key={f.id} value={f.id}>{f.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data Source / Origin</label>
                                    <select
                                        value={editForm.data.source || 'Manual Entry'}
                                        onChange={(e) => editForm.setData('source', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Manual Entry">Manual Entry</option>
                                        <option value="Google Sheets (BSIT Class)">Google Sheets (BSIT Class)</option>
                                        <option value="Google Sheets (BSIS Class)">Google Sheets (BSIS Class)</option>
                                        <option value="CSV File Import">CSV File Import</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks</label>
                                <textarea
                                    rows={2}
                                    value={editForm.data.remarks}
                                    onChange={(e) => editForm.setData('remarks', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingSection(null)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                                >
                                    Update Section
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Sync from Google Sheets */}
                <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                <span>Sync Cohorts & Offerings from Google Sheets</span>
                            </DialogTitle>
                            <DialogDescription>
                                Import live sections, offerings, and course loading from the Google Spreadsheet (BSIT Class &amp; BSIS Class). Sections and courses will automatically be tagged with their source origin.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Google Spreadsheet URL</label>
                                <input
                                    type="url"
                                    value={spreadsheetUrl}
                                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-200"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Direct link to the BSIS / BSIT class loading document.
                                </p>
                            </div>

                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Source Origin Tracking</span>
                                </p>
                                <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                                    Imported records will have their source labeled as <code className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-semibold font-mono">Google Sheets (BSIT Class)</code> or <code className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-semibold font-mono">Google Sheets (BSIS Class)</code> for auditability and origin filtering.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="mt-2">
                            <button
                                type="button"
                                onClick={() => setIsSyncModalOpen(false)}
                                disabled={isSyncing}
                                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSyncFromSheets}
                                disabled={isSyncing}
                                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                                {isSyncing ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Syncing Data...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        <span>Start Sync</span>
                                    </>
                                )}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRM DIALOG */}
                <DeleteConfirmDialog
                    isOpen={!!deletingSection}
                    onClose={() => setDeletingSection(null)}
                    onConfirm={confirmDelete}
                    title="Remove Student Cohort Section"
                    description={`Are you sure you want to delete section "${deletingSection?.code}"? All linked semester offerings will also be removed.`}
                />
            </div>
        </AppLayout>
    );
}
