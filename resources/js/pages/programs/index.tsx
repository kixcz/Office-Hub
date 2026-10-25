import React, { useState, useMemo, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Layers,
    Clock,
    Search,
    Building2,
    Plus,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Copy,
    Check,
    FileText,
    ArrowUpDown,
    AlertCircle,
    Calendar,
    ChevronRight,
    ChevronDown,
    X,
    Filter,
    ShieldCheck,
    Sparkles,
    ArrowRightLeft,
    SlidersHorizontal,
    PlusCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Structure',
        href: '/programs',
    },
    {
        title: 'Programs & Curriculum',
        href: '/programs',
    },
];

interface Course {
    id: number;
    code: string;
    title: string;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    required_facility_type?: string;
    category?: string;
    prerequisites?: string;
    corequisites?: string;
}

interface CurriculumCourse {
    id: number;
    curriculum_id: number;
    course_id: number;
    year_level: number;
    semester_placement: string;
    requirement_type: string;
    prerequisite_override: string | null;
    corequisite_override: string | null;
    sequence_order: number;
    course: Course;
}

interface Curriculum {
    id: number;
    program_id: number;
    version_name: string;
    effective_year: string;
    total_units: number;
    description: string | null;
    status: 'Active' | 'Draft' | 'Archived';
    is_active: boolean;
    curriculum_courses_count?: number;
    courses_count?: number;
    curriculum_courses?: CurriculumCourse[];
}

interface Program {
    id: number;
    code: string;
    name: string;
    degree_level: string;
    department: string;
    duration_years: number;
    status: 'Active' | 'Inactive' | 'Phased Out';
    description: string | null;
    curricula: Curriculum[];
}

interface Props {
    programs: Program[];
    coursesCatalog: Course[];
    stats: {
        total_programs: number;
        active_programs: number;
        total_curricula: number;
        active_curricula: number;
        degree_levels: string[];
    };
    filters: {
        search?: string;
        department?: string;
        degree_level?: string;
        status?: string;
    };
}

export default function ProgramsCurriculumIndex({
    programs,
    coursesCatalog = [],
    stats,
    filters = {},
}: Props) {
    // Left pane selection
    const [selectedProgramId, setSelectedProgramId] = useState<number>(programs[0]?.id || 1);
    const selectedProgram = useMemo(
        () => programs.find((p) => p.id === selectedProgramId) || programs[0],
        [programs, selectedProgramId]
    );

    // Active curriculum version tab for selected program
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);

    const activeCurriculum = useMemo(() => {
        if (!selectedProgram || !selectedProgram.curricula || selectedProgram.curricula.length === 0) {
            return null;
        }
        if (selectedCurriculumId) {
            const found = selectedProgram.curricula.find((c) => c.id === selectedCurriculumId);
            if (found) return found;
        }
        // Default to active curriculum or first
        return selectedProgram.curricula.find((c) => c.is_active || c.status === 'Active') || selectedProgram.curricula[0];
    }, [selectedProgram, selectedCurriculumId]);

    // Search and filter in left sidebar
    const [programSearch, setProgramSearch] = useState(filters.search || '');
    const [filterLevel, setFilterLevel] = useState(filters.degree_level || 'all');

    const filteredPrograms = useMemo(() => {
        return programs.filter((p) => {
            const matchesSearch =
                programSearch === '' ||
                p.code.toLowerCase().includes(programSearch.toLowerCase()) ||
                p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
                p.department.toLowerCase().includes(programSearch.toLowerCase());

            const matchesLevel = filterLevel === 'all' || p.degree_level === filterLevel;

            return matchesSearch && matchesLevel;
        });
    }, [programs, programSearch, filterLevel]);

    // Modals
    const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
    const [isEditProgramOpen, setIsEditProgramOpen] = useState(false);
    const [isAddCurriculumOpen, setIsAddCurriculumOpen] = useState(false);
    const [isCopyCurriculumOpen, setIsCopyCurriculumOpen] = useState(false);
    const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
    const [isCompareCurriculaOpen, setIsCompareCurriculaOpen] = useState(false);
    const [compareTargetId, setCompareTargetId] = useState<number | null>(null);

    // Delete dialog
    const [deletingCoursePivot, setDeletingCoursePivot] = useState<{ curriculumId: number; course: Course } | null>(null);

    // Forms
    const addProgramForm = useForm({
        code: '',
        name: '',
        degree_level: "Bachelor's Degree",
        department: 'College of Information and Digital Sciences',
        duration_years: 4,
        status: 'Active',
        description: '',
        initial_curriculum_name: '',
        effective_year: '2026',
    });

    const editProgramForm = useForm({
        code: '',
        name: '',
        degree_level: "Bachelor's Degree",
        department: 'College of Information and Digital Sciences',
        duration_years: 4,
        status: 'Active',
        description: '',
    });

    const addCurriculumForm = useForm({
        version_name: '',
        effective_year: '2026',
        total_units: 140,
        status: 'Active',
        description: '',
    });

    const copyCurriculumForm = useForm({
        new_version_name: '',
        effective_year: '2027',
    });

    const addCourseForm = useForm({
        course_id: coursesCatalog[0]?.id || '',
        year_level: 1,
        semester_placement: '1st Semester',
        requirement_type: 'Required',
        prerequisite_override: '',
        corequisite_override: '',
    });

    const handleOpenEditProgram = (prog: Program) => {
        editProgramForm.setData({
            code: prog.code,
            name: prog.name,
            degree_level: prog.degree_level,
            department: prog.department,
            duration_years: prog.duration_years,
            status: prog.status,
            description: prog.description || '',
        });
        setIsEditProgramOpen(true);
    };

    const submitAddProgram: FormEventHandler = (e) => {
        e.preventDefault();
        addProgramForm.post('/programs', {
            onSuccess: () => {
                setIsAddProgramOpen(false);
                addProgramForm.reset();
            },
        });
    };

    const submitEditProgram: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedProgram) return;
        editProgramForm.put(`/programs/${selectedProgram.id}`, {
            onSuccess: () => {
                setIsEditProgramOpen(false);
            },
        });
    };

    const submitAddCurriculum: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedProgram) return;
        addCurriculumForm.post(`/programs/${selectedProgram.id}/curricula`, {
            onSuccess: () => {
                setIsAddCurriculumOpen(false);
                addCurriculumForm.reset();
            },
        });
    };

    const submitCopyCurriculum: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeCurriculum) return;
        copyCurriculumForm.post(`/curricula/${activeCurriculum.id}/copy`, {
            onSuccess: () => {
                setIsCopyCurriculumOpen(false);
                copyCurriculumForm.reset();
            },
        });
    };

    const handleCurriculumStatusChange = (status: 'Active' | 'Draft' | 'Archived') => {
        if (!activeCurriculum) return;
        router.patch(
            `/curricula/${activeCurriculum.id}/status`,
            { status },
            { preserveScroll: true }
        );
    };

    const submitAddCourse: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeCurriculum) return;
        addCourseForm.post(`/curricula/${activeCurriculum.id}/courses`, {
            onSuccess: () => {
                setIsAddCourseOpen(false);
                addCourseForm.reset({
                    course_id: coursesCatalog[0]?.id || '',
                    year_level: 1,
                    semester_placement: '1st Semester',
                    requirement_type: 'Required',
                    prerequisite_override: '',
                    corequisite_override: '',
                });
            },
        });
    };

    const confirmRemoveCourse = () => {
        if (!deletingCoursePivot) return;
        router.delete(`/curricula/${deletingCoursePivot.curriculumId}/courses/${deletingCoursePivot.course.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingCoursePivot(null);
            },
        });
    };

    // Matrix Grouping: Group curriculumCourses by Year Level -> Semester Placement
    const matrixGroups = useMemo(() => {
        if (!activeCurriculum || !activeCurriculum.curriculum_courses) {
            return [];
        }

        const years = selectedProgram?.duration_years || 4;
        const semesters = ['1st Semester', '2nd Semester'];

        const groups = [];

        for (let y = 1; y <= years; y++) {
            for (const sem of semesters) {
                const coursesInSem = activeCurriculum.curriculum_courses.filter(
                    (cc) => cc.year_level === y && cc.semester_placement === sem
                );

                const semUnits = coursesInSem.reduce((sum, cc) => sum + Number(cc.course?.units || 0), 0);
                const semLec = coursesInSem.reduce((sum, cc) => sum + Number(cc.course?.lecture_hours || 0), 0);
                const semLab = coursesInSem.reduce((sum, cc) => sum + Number(cc.course?.lab_hours || 0), 0);

                groups.push({
                    year: y,
                    semester: sem,
                    courses: coursesInSem,
                    totalUnits: semUnits,
                    totalLec: semLec,
                    totalLab: semLab,
                });
            }
        }

        return groups;
    }, [activeCurriculum, selectedProgram]);

    // Validation checks for the curriculum
    const validationIssues = useMemo(() => {
        if (!activeCurriculum || !activeCurriculum.curriculum_courses) return [];
        const issues: string[] = [];
        const seenCourses = new Map<number, string>();

        activeCurriculum.curriculum_courses.forEach((cc) => {
            const loc = `Year ${cc.year_level} - ${cc.semester_placement}`;
            if (seenCourses.has(cc.course_id)) {
                issues.push(`Duplicate course placement: ${cc.course.code} is placed in ${loc} and ${seenCourses.get(cc.course_id)}`);
            } else {
                seenCourses.set(cc.course_id, loc);
            }
        });

        return issues;
    }, [activeCurriculum]);

    // Comparison logic
    const compareTarget = useMemo(() => {
        if (!selectedProgram || !compareTargetId) return null;
        return selectedProgram.curricula.find((c) => c.id === compareTargetId) || null;
    }, [selectedProgram, compareTargetId]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs & Curriculum Blueprint" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full transition-colors">
                {/* 1. Hero Header Banner */}
                <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-13 h-13 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs p-3">
                            <GraduationCap className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    Programs & Curriculum
                                </h1>
                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Academic Blueprint
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                                Define degree blueprints, versioned curricula, year-level sequencing rules, and prerequisite chains for cohort graduation requirements.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <button
                            onClick={() => setIsAddProgramOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Create Degree Program</span>
                        </button>
                    </div>
                </div>

                {/* 2. Top Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Programs</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.total_programs}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Degree & tech offerings</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Curricula</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.active_curricula} / {stats.total_curricula}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">In-effect versions</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Canonical Subjects</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {coursesCatalog.length}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Catalog master items</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration Range</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                2 - 4 Years
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Ladderized & Degree</p>
                        </div>
                    </div>
                </div>

                {/* 3. Main Workspace Split: Programs List on Left, Curriculum Matrix on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANE: Program List (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-amber-500" />
                                    <span>Academic Programs</span>
                                </h2>
                                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {filteredPrograms.length}
                                </span>
                            </div>

                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by code or name..."
                                    value={programSearch}
                                    onChange={(e) => setProgramSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>

                            {/* List of Programs */}
                            <div className="flex flex-col gap-2 max-h-[680px] overflow-y-auto pr-1">
                                {filteredPrograms.map((prog) => {
                                    const isSelected = prog.id === selectedProgram?.id;
                                    const activeCurricCount = prog.curricula?.filter((c) => c.status === 'Active').length || 0;

                                    return (
                                        <div
                                            key={prog.id}
                                            onClick={() => {
                                                setSelectedProgramId(prog.id);
                                                setSelectedCurriculumId(null);
                                            }}
                                            className={cn(
                                                'p-3.5 rounded-xl border transition-all cursor-pointer text-left relative group',
                                                isSelected
                                                    ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700/80 shadow-xs ring-1 ring-amber-400/30'
                                                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={cn(
                                                        'font-extrabold text-sm px-2.5 py-1 rounded-lg tracking-tight',
                                                        isSelected
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-amber-100 group-hover:text-amber-800 dark:group-hover:bg-amber-900/40'
                                                    )}>
                                                        {prog.code}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                        {prog.duration_years} yrs • {prog.degree_level}
                                                    </span>
                                                </div>

                                                <span className={cn(
                                                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                                    prog.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                )}>
                                                    {prog.status}
                                                </span>
                                            </div>

                                            <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                                                {prog.name}
                                            </h3>

                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                {prog.department}
                                            </p>

                                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                                                <span>Curricula: <strong className="text-slate-700 dark:text-slate-300">{prog.curricula?.length || 0}</strong> ({activeCurricCount} active)</span>
                                                <ChevronRight className={cn(
                                                    'w-4 h-4 transition-transform',
                                                    isSelected ? 'text-amber-500 translate-x-1' : 'opacity-40'
                                                )} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: Curriculum Version Bar & Matrix Table (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        {selectedProgram ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5">
                                
                                {/* Program Header & Edit button */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                                                {selectedProgram.code}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                                {selectedProgram.name}
                                            </h2>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {selectedProgram.department} • Normal Duration: {selectedProgram.duration_years} Years
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleOpenEditProgram(selectedProgram)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            <span>Edit Program</span>
                                        </button>
                                        <button
                                            onClick={() => setIsAddCurriculumOpen(true)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>New Curriculum Version</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Curriculum Version Tabs */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                            Versions:
                                        </span>
                                        {selectedProgram.curricula && selectedProgram.curricula.length > 0 ? (
                                            selectedProgram.curricula.map((curric) => {
                                                const isCurrent = curric.id === activeCurriculum?.id;
                                                return (
                                                    <button
                                                        key={curric.id}
                                                        onClick={() => setSelectedCurriculumId(curric.id)}
                                                        className={cn(
                                                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                                                            isCurrent
                                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                        )}
                                                    >
                                                        <span>{curric.version_name}</span>
                                                        <span className={cn(
                                                            'w-2 h-2 rounded-full',
                                                            curric.status === 'Active'
                                                                ? 'bg-emerald-500'
                                                                : curric.status === 'Draft'
                                                                ? 'bg-amber-400'
                                                                : 'bg-slate-400'
                                                        )} />
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-slate-400 italic px-2">No curriculum versions yet.</span>
                                        )}
                                    </div>

                                    {/* Action buttons for active curriculum */}
                                    {activeCurriculum && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsCopyCurriculumOpen(true)}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                                                title="Clone this curriculum into a new version"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Clone</span>
                                            </button>

                                            {/* Activate / Archive Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>Status: {activeCurriculum.status}</span>
                                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleCurriculumStatusChange('Active')}>
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCurriculumStatusChange('Draft')}>
                                                        <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                                        Set Draft
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCurriculumStatusChange('Archived')}>
                                                        <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Compare button */}
                                            {selectedProgram.curricula && selectedProgram.curricula.length > 1 && (
                                                <button
                                                    onClick={() => setIsCompareCurriculaOpen(true)}
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                                                >
                                                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>Compare</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setIsAddCourseOpen(true)}
                                                className="px-3 py-1 text-xs font-bold rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" />
                                                <span>Add Course</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Active Curriculum Metadata Bar */}
                                {activeCurriculum && (
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs">
                                        <div className="flex items-center gap-4">
                                            <span>Effective Year: <strong>{activeCurriculum.effective_year}</strong></span>
                                            <span>Total Required Units: <strong>{activeCurriculum.total_units} units</strong></span>
                                            <span>Courses Enrolled: <strong>{activeCurriculum.curriculum_courses?.length || 0} subjects</strong></span>
                                        </div>

                                        {validationIssues.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{validationIssues.length} Placement Warning(s)</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Curriculum Matrix grouped by Year Level & Semester */}
                                <div className="mt-5 flex flex-col gap-6">
                                    {matrixGroups.map((group) => (
                                        <div
                                            key={`y${group.year}-s${group.semester}`}
                                            className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs"
                                        >
                                            {/* Subheader banner */}
                                            <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                                        Year {group.year} • {group.semester}
                                                    </h3>
                                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                        ({group.courses.length} subjects)
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    <span>Lec: <strong className="text-slate-900 dark:text-white">{group.totalLec}h</strong></span>
                                                    <span>Lab: <strong className="text-slate-900 dark:text-white">{group.totalLab}h</strong></span>
                                                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                                                        {group.totalUnits} Units
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Courses Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40">
                                                            <th className="py-2.5 px-4 font-bold">Course Code</th>
                                                            <th className="py-2.5 px-4 font-bold">Course Title</th>
                                                            <th className="py-2.5 px-3 font-bold text-center">Units</th>
                                                            <th className="py-2.5 px-3 font-bold text-center">Lec / Lab</th>
                                                            <th className="py-2.5 px-4 font-bold">Prerequisite / Co-requisite</th>
                                                            <th className="py-2.5 px-3 font-bold">Requirement Type</th>
                                                            <th className="py-2.5 px-3 font-bold text-right pr-4">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {group.courses.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                                                                    No courses sequenced for this term yet. Click "+ Add Course" to place subjects.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            group.courses.map((cc) => (
                                                                <tr
                                                                    key={cc.id}
                                                                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                                                >
                                                                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span>{cc.course?.code}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                                                        {cc.course?.title}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                                                                        {cc.course?.units}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
                                                                        {cc.course?.lecture_hours}h / {cc.course?.lab_hours}h
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        {cc.prerequisite_override || cc.course?.prerequisites ? (
                                                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                                                                {cc.prerequisite_override || cc.course?.prerequisites}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400 text-[11px]">None</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-3">
                                                                        <span className={cn(
                                                                            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                                            cc.requirement_type === 'Required' || cc.requirement_type === 'Major'
                                                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                                                : cc.requirement_type === 'Elective'
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                                        )}>
                                                                            {cc.requirement_type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-3 text-right pr-4">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!activeCurriculum) return;
                                                                                setDeletingCoursePivot({
                                                                                    curriculumId: activeCurriculum.id,
                                                                                    course: cc.course,
                                                                                });
                                                                            }}
                                                                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                                            title="Remove from curriculum"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400">
                                Select an academic program from the left pane to view its curriculum blueprints.
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL: Create Program */}
                <Dialog open={isAddProgramOpen} onOpenChange={setIsAddProgramOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Academic Program</DialogTitle>
                            <DialogDescription>
                                Add a new degree offering to the institutional blueprint catalog.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAddProgram} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. BSIT"
                                        value={addProgramForm.data.code}
                                        onChange={(e) => addProgramForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (Years)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={8}
                                        required
                                        value={addProgramForm.data.duration_years}
                                        onChange={(e) => addProgramForm.setData('duration_years', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree Program Full Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Bachelor of Science in Information Technology"
                                    value={addProgramForm.data.name}
                                    onChange={(e) => addProgramForm.setData('name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree Level</label>
                                    <select
                                        value={addProgramForm.data.degree_level}
                                        onChange={(e) => addProgramForm.setData('degree_level', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none"
                                    >
                                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                                        <option value="Associate Degree">Associate Degree</option>
                                        <option value="Master's Degree">Master's Degree</option>
                                        <option value="Doctoral Degree">Doctoral Degree</option>
                                        <option value="Diploma / Certificate">Diploma / Certificate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department / College</label>
                                    <input
                                        type="text"
                                        required
                                        value={addProgramForm.data.department}
                                        onChange={(e) => addProgramForm.setData('department', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold text-amber-700 dark:text-amber-400">Baseline Curriculum Version</label>
                                <div className="grid grid-cols-2 gap-3 mt-1.5">
                                    <input
                                        type="text"
                                        placeholder="e.g. BSIT Curriculum 2026"
                                        value={addProgramForm.data.initial_curriculum_name}
                                        onChange={(e) => addProgramForm.setData('initial_curriculum_name', e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Effective Year: 2026"
                                        value={addProgramForm.data.effective_year}
                                        onChange={(e) => addProgramForm.setData('effective_year', e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProgramOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addProgramForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg"
                                >
                                    Save Program Blueprint
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Edit Program */}
                <Dialog open={isEditProgramOpen} onOpenChange={setIsEditProgramOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Program Definition</DialogTitle>
                            <DialogDescription>
                                Modify degree metadata and offering parameters.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEditProgram} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={editProgramForm.data.code}
                                        onChange={(e) => editProgramForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (Years)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={8}
                                        required
                                        value={editProgramForm.data.duration_years}
                                        onChange={(e) => editProgramForm.setData('duration_years', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editProgramForm.data.name}
                                    onChange={(e) => editProgramForm.setData('name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                    <select
                                        value={editProgramForm.data.status}
                                        onChange={(e) => editProgramForm.setData('status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Phased Out">Phased Out</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={editProgramForm.data.department}
                                        onChange={(e) => editProgramForm.setData('department', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProgramOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProgramForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg"
                                >
                                    Update Program
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: New Curriculum Version */}
                <Dialog open={isAddCurriculumOpen} onOpenChange={setIsAddCurriculumOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Curriculum Version</DialogTitle>
                            <DialogDescription>
                                Create a new cohort curriculum version for {selectedProgram?.code}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAddCurriculum} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Version Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. BSIT Curriculum 2026"
                                    value={addCurriculumForm.data.version_name}
                                    onChange={(e) => addCurriculumForm.setData('version_name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Effective Academic Year</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="2026"
                                        value={addCurriculumForm.data.effective_year}
                                        onChange={(e) => addCurriculumForm.setData('effective_year', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Required Units</label>
                                    <input
                                        type="number"
                                        required
                                        value={addCurriculumForm.data.total_units}
                                        onChange={(e) => addCurriculumForm.setData('total_units', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                <select
                                    value={addCurriculumForm.data.status}
                                    onChange={(e) => addCurriculumForm.setData('status', e.target.value as any)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    <option value="Active">Active (Cohort Default)</option>
                                    <option value="Draft">Draft (In Review)</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCurriculumOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addCurriculumForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg"
                                >
                                    Create Version
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Copy / Clone Previous Curriculum */}
                <Dialog open={isCopyCurriculumOpen} onOpenChange={setIsCopyCurriculumOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Clone Previous Curriculum</DialogTitle>
                            <DialogDescription>
                                Copy all subjects, sequence placement, and rules from "{activeCurriculum?.version_name}".
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitCopyCurriculum} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Version Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. BSIT Curriculum 2027 Revision"
                                    value={copyCurriculumForm.data.new_version_name}
                                    onChange={(e) => copyCurriculumForm.setData('new_version_name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Effective Year</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="2027"
                                    value={copyCurriculumForm.data.effective_year}
                                    onChange={(e) => copyCurriculumForm.setData('effective_year', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCopyCurriculumOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={copyCurriculumForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg"
                                >
                                    Clone Sequence Matrix
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Add Course to Curriculum */}
                <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Course to Curriculum</DialogTitle>
                            <DialogDescription>
                                Place a canonical catalog subject into Year Level & Semester of {activeCurriculum?.version_name}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAddCourse} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Canonical Course</label>
                                <select
                                    required
                                    value={addCourseForm.data.course_id}
                                    onChange={(e) => addCourseForm.setData('course_id', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    {coursesCatalog.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} - {c.title} ({c.units} units)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Year Level</label>
                                    <select
                                        value={addCourseForm.data.year_level}
                                        onChange={(e) => addCourseForm.setData('year_level', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value={1}>1st Year</option>
                                        <option value={2}>2nd Year</option>
                                        <option value={3}>3rd Year</option>
                                        <option value={4}>4th Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester Placement</label>
                                    <select
                                        value={addCourseForm.data.semester_placement}
                                        onChange={(e) => addCourseForm.setData('semester_placement', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer Term</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requirement Classification</label>
                                <select
                                    value={addCourseForm.data.requirement_type}
                                    onChange={(e) => addCourseForm.setData('requirement_type', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    <option value="Required">Required Major</option>
                                    <option value="Major">Professional Core</option>
                                    <option value="Elective">Professional Elective</option>
                                    <option value="Specialization">Specialization Track</option>
                                    <option value="General Education">General Education (GE)</option>
                                    <option value="Institutional">Institutional Mandated</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prerequisite Override</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. IT 111, MATH 101"
                                        value={addCourseForm.data.prerequisite_override}
                                        onChange={(e) => addCourseForm.setData('prerequisite_override', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Co-requisite Override</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. IT 112 Lab"
                                        value={addCourseForm.data.corequisite_override}
                                        onChange={(e) => addCourseForm.setData('corequisite_override', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCourseOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addCourseForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg"
                                >
                                    Place in Matrix
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Compare Curriculum Versions */}
                <Dialog open={isCompareCurriculaOpen} onOpenChange={setIsCompareCurriculaOpen}>
                    <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                                <span>Curriculum Version Comparison</span>
                            </DialogTitle>
                            <DialogDescription>
                                Compare "{activeCurriculum?.version_name}" side-by-side with another revision.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-2 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Compare With:</label>
                                <select
                                    value={compareTargetId || ''}
                                    onChange={(e) => setCompareTargetId(Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    <option value="">Select target curriculum version...</option>
                                    {selectedProgram?.curricula
                                        ?.filter((c) => c.id !== activeCurriculum?.id)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.version_name} ({c.status})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {activeCurriculum && compareTarget ? (
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    {/* Left Version */}
                                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white pb-2 border-b">
                                            {activeCurriculum.version_name} (Current)
                                        </h4>
                                        <p className="mt-2 text-slate-500">Total Units: <strong>{activeCurriculum.total_units}</strong></p>
                                        <p className="text-slate-500">Subjects: <strong>{activeCurriculum.curriculum_courses?.length || 0}</strong></p>
                                        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
                                            {activeCurriculum.curriculum_courses?.map((cc) => (
                                                <div key={cc.id} className="p-1.5 rounded bg-white dark:bg-slate-800 border text-[11px] flex justify-between">
                                                    <span><strong>{cc.course.code}</strong> - Y{cc.year_level} Sem{cc.semester_placement.includes('1') ? 1 : 2}</span>
                                                    <span>{cc.course.units}u</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Version */}
                                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white pb-2 border-b">
                                            {compareTarget.version_name}
                                        </h4>
                                        <p className="mt-2 text-slate-500">Total Units: <strong>{compareTarget.total_units}</strong></p>
                                        <p className="text-slate-500">Subjects: <strong>{compareTarget.curriculum_courses?.length || 0}</strong></p>
                                        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
                                            {compareTarget.curriculum_courses?.map((cc) => (
                                                <div key={cc.id} className="p-1.5 rounded bg-white dark:bg-slate-800 border text-[11px] flex justify-between">
                                                    <span><strong>{cc.course.code}</strong> - Y{cc.year_level} Sem{cc.semester_placement.includes('1') ? 1 : 2}</span>
                                                    <span>{cc.course.units}u</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-6">
                                    Please pick a target curriculum from the dropdown to compare subject placements.
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setIsCompareCurriculaOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            >
                                Close Comparison
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRM DIALOG */}
                <DeleteConfirmDialog
                    isOpen={!!deletingCoursePivot}
                    onClose={() => setDeletingCoursePivot(null)}
                    onConfirm={confirmRemoveCourse}
                    title="Remove Course from Curriculum"
                    description={`Are you sure you want to remove "${deletingCoursePivot?.course.code} - ${deletingCoursePivot?.course.title}" from this curriculum matrix?`}
                />
            </div>
        </AppLayout>
    );
}
