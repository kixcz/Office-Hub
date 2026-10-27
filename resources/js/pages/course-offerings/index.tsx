import React, { useState, useMemo, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    CalendarDays,
    Search,
    Plus,
    Filter,
    Building2,
    Layers,
    Clock,
    UserCheck,
    CheckCircle2,
    Calendar,
    ArrowUpDown,
    Check,
    AlertCircle,
    User,
    Sparkles,
    MoreVertical,
    Edit,
    Trash2,
    Send,
    Eye,
    ShieldAlert,
    BookOpen,
    Split,
    GraduationCap,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Structure',
        href: '/course-offerings',
    },
    {
        title: 'Course Offerings',
        href: '/course-offerings',
    },
];

interface AcademicPeriod {
    id: number;
    name: string;
    academic_year?: string;
    semester?: string;
    is_active: boolean;
}

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Section {
    id: number;
    name: string;
    year_level?: number;
}

interface Course {
    id: number;
    code: string;
    title: string;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    required_facility_type?: string;
}

interface Faculty {
    id: number;
    full_name: string;
    department: string;
    designation: string;
}

interface CourseOffering {
    id: number;
    academic_period_id: number;
    program_id: number;
    curriculum_id: number;
    course_id: number;
    section_id: number;
    faculty_id: number | null;
    offering_code: string;
    course_code: string;
    course_title: string;
    section_name: string;
    year_level: number;
    expected_enrollment: number;
    offering_type: 'Regular' | 'Elective' | 'Retake' | 'Merged' | 'Special';
    units: number;
    lecture_hours: number;
    lab_hours: number;
    room_type_required: string;
    loading_status: 'Unassigned' | 'Assigned' | 'Overloaded';
    timetable_status: 'Pending' | 'Drafted' | 'Scheduled' | 'Conflict';
    publication_status: 'Draft' | 'Ready' | 'Published' | 'Completed';
    special_notes: string | null;
    academic_period?: AcademicPeriod;
    program?: Program;
    section?: Section;
    course?: Course;
    faculty?: Faculty;
}

interface Props {
    offerings: CourseOffering[];
    academicPeriods: AcademicPeriod[];
    currentPeriod: AcademicPeriod | null;
    programs: Program[];
    sections: Section[];
    courses: Course[];
    facultyMembers: Faculty[];
    stats: {
        total_offerings: number;
        faculty_assigned: number;
        scheduled: number;
        published: number;
    };
    filters: {
        academic_period_id?: string;
        program_id?: string;
        year_level?: string;
        section_id?: string;
        loading_status?: string;
        publication_status?: string;
        search?: string;
    };
}

export default function CourseOfferingsIndex({
    offerings,
    academicPeriods,
    currentPeriod,
    programs,
    sections,
    courses,
    facultyMembers,
    stats,
    filters = {},
}: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.academic_period_id || String(currentPeriod?.id || ''));
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || 'all');
    const [selectedYear, setSelectedYear] = useState(filters.year_level || 'all');
    const [selectedSection, setSelectedSection] = useState(filters.section_id || 'all');
    const [selectedLoading, setSelectedLoading] = useState(filters.loading_status || 'all');
    const [selectedPub, setSelectedPub] = useState(filters.publication_status || 'all');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modals
    const [isAddOfferingOpen, setIsAddOfferingOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);
    const [deletingOffering, setDeletingOffering] = useState<CourseOffering | null>(null);

    // Form: Create Offering
    const addForm = useForm({
        academic_period_id: currentPeriod?.id || academicPeriods[0]?.id || '',
        program_id: programs[0]?.id || '',
        section_id: sections[0]?.id || '',
        course_id: courses[0]?.id || '',
        faculty_id: '',
        expected_enrollment: 40,
        offering_type: 'Regular',
        publication_status: 'Draft',
        special_notes: '',
    });

    // Form: Generate from Curriculum
    const generateForm = useForm({
        academic_period_id: currentPeriod?.id || academicPeriods[0]?.id || '',
        program_id: programs[0]?.id || '',
    });

    // Form: Edit Offering
    const editForm = useForm({
        faculty_id: '' as string | number,
        expected_enrollment: 40,
        offering_type: 'Regular',
        loading_status: 'Unassigned',
        timetable_status: 'Pending',
        publication_status: 'Draft',
        special_notes: '',
    });

    const handleOpenEdit = (offering: CourseOffering) => {
        setEditingOffering(offering);
        editForm.setData({
            faculty_id: offering.faculty_id || '',
            expected_enrollment: offering.expected_enrollment,
            offering_type: offering.offering_type,
            loading_status: offering.loading_status,
            timetable_status: offering.timetable_status,
            publication_status: offering.publication_status,
            special_notes: offering.special_notes || '',
        });
    };

    const submitAddOffering: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post('/course-offerings', {
            onSuccess: () => {
                setIsAddOfferingOpen(false);
                addForm.reset();
            },
        });
    };

    const submitGenerate: FormEventHandler = (e) => {
        e.preventDefault();
        generateForm.post('/course-offerings/generate', {
            onSuccess: () => {
                setIsGenerateOpen(false);
            },
        });
    };

    const submitEditOffering: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingOffering) return;
        editForm.put(`/course-offerings/${editingOffering.id}`, {
            onSuccess: () => {
                setEditingOffering(null);
            },
        });
    };

    const confirmDelete = () => {
        if (!deletingOffering) return;
        router.delete(`/course-offerings/${deletingOffering.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingOffering(null);
            },
        });
    };

    const handleBulkStatusChange = (status: 'Draft' | 'Ready' | 'Published' | 'Completed') => {
        if (selectedIds.length === 0) return;
        router.post(
            '/course-offerings/bulk-status',
            {
                offering_ids: selectedIds,
                publication_status: status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                },
            }
        );
    };

    // Filter list client-side
    const filteredOfferings = useMemo(() => {
        return offerings.filter((o) => {
            const matchesPeriod = selectedPeriod === 'all' || String(o.academic_period_id) === String(selectedPeriod);
            const matchesProgram = selectedProgram === 'all' || String(o.program_id) === String(selectedProgram);
            const matchesYear = selectedYear === 'all' || String(o.year_level) === String(selectedYear);
            const matchesSection = selectedSection === 'all' || String(o.section_id) === String(selectedSection);
            const matchesLoading = selectedLoading === 'all' || o.loading_status === selectedLoading;
            const matchesPub = selectedPub === 'all' || o.publication_status === selectedPub;

            const matchesSearch =
                searchTerm === '' ||
                o.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.offering_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.faculty?.full_name && o.faculty.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

            return (
                matchesPeriod &&
                matchesProgram &&
                matchesYear &&
                matchesSection &&
                matchesLoading &&
                matchesPub &&
                matchesSearch
            );
        });
    }, [offerings, selectedPeriod, selectedProgram, selectedYear, selectedSection, selectedLoading, selectedPub, searchTerm]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const totalPages = Math.max(1, Math.ceil(filteredOfferings.length / perPage));

    const safeCurrentPage = useMemo(() => {
        if (currentPage > totalPages) return totalPages;
        if (currentPage < 1) return 1;
        return currentPage;
    }, [currentPage, totalPages]);

    const paginatedOfferings = useMemo(() => {
        const start = (safeCurrentPage - 1) * perPage;
        return filteredOfferings.slice(start, start + perPage);
    }, [filteredOfferings, safeCurrentPage, perPage]);

    const isCurrentPageAllSelected = paginatedOfferings.length > 0 && paginatedOfferings.every((o) => selectedIds.includes(o.id));

    const toggleSelectCurrentPage = () => {
        if (isCurrentPageAllSelected) {
            setSelectedIds(selectedIds.filter((id) => !paginatedOfferings.some((o) => o.id === id)));
        } else {
            const pageIds = paginatedOfferings.map((o) => o.id);
            const combined = Array.from(new Set([...selectedIds, ...pageIds]));
            setSelectedIds(combined);
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((x) => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semester Course Offerings" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full transition-colors">
                {/* 1. Header Hero Banner */}
                <div className="rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-13 h-13 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs p-3">
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    Semester Course Offerings
                                </h1>
                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    Operational Delivery Layer
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                                Bridges the curriculum blueprint into live semester section classes. Assigns faculty loading, feeds the automated timetable generator, and manages lifecycle from Planned → Ready → Published.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <button
                            onClick={() => setIsGenerateOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Auto-Generate from Curriculum</span>
                        </button>
                        <button
                            onClick={() => setIsAddOfferingOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>New Course Offering</span>
                        </button>
                    </div>
                </div>

                {/* 2. Bento Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Classes Offered</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.total_offerings}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Subject-section pairs</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Assigned</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.faculty_assigned} / {stats.total_offerings}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Instructor designated</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Timetable Scheduled</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.scheduled}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Day/Time/Room booked</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published to Campus</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.published}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Visible on TV & Portals</p>
                        </div>
                    </div>
                </div>

                {/* 3. Search & Filter Bar */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-[280px] max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search course code, section, or faculty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Bulk publish bar */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-800 dark:text-blue-300">
                                <span>{selectedIds.length} Selected</span>
                                <button
                                    onClick={() => handleBulkStatusChange('Published')}
                                    className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer text-[11px]"
                                >
                                    Publish Selected
                                </button>
                                <button
                                    onClick={() => handleBulkStatusChange('Ready')}
                                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer text-[11px]"
                                >
                                    Mark Ready
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Dropdown Pills */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {/* Period Filter */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Academic Periods</option>
                                {academicPeriods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.is_active ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Program Filter */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>{p.code}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Level Filter */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Year Levels</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        {/* Section Filter */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 font-bold">Sec:</span>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Sections</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Loading Status */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedLoading}
                                onChange={(e) => setSelectedLoading(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Loading Status</option>
                                <option value="Unassigned">Unassigned</option>
                                <option value="Assigned">Assigned</option>
                            </select>
                        </div>

                        {/* Publication Status */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Send className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedPub}
                                onChange={(e) => setSelectedPub(e.target.value)}
                                className="bg-transparent font-semibold focus:outline-none text-slate-700 dark:text-slate-200 text-xs"
                            >
                                <option value="all">All Publication Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Ready">Ready</option>
                                <option value="Published">Published</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Course Offerings Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3 px-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isCurrentPageAllSelected}
                                            onChange={toggleSelectCurrentPage}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                        />
                                    </th>
                                    <th className="py-3 px-4 font-bold">Course & Subject</th>
                                    <th className="py-3 px-3 font-bold">Section</th>
                                    <th className="py-3 px-3 font-bold text-center">Enrollment</th>
                                    <th className="py-3 px-4 font-bold">Assigned Faculty</th>
                                    <th className="py-3 px-3 font-bold text-center">Hours (Lec/Lab)</th>
                                    <th className="py-3 px-3 font-bold">Loading Status</th>
                                    <th className="py-3 px-3 font-bold">Schedule</th>
                                    <th className="py-3 px-3 font-bold">Publication</th>
                                    <th className="py-3 px-4 font-bold text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredOfferings.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                                            No semester course offerings found matching criteria. Click "Auto-Generate" or "New Course Offering".
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOfferings.map((offering) => {
                                        const isSelected = selectedIds.includes(offering.id);

                                        return (
                                            <tr
                                                key={offering.id}
                                                className={cn(
                                                    'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                                                    isSelected && 'bg-blue-50/40 dark:bg-blue-950/20'
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-3 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectOne(offering.id)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                                    />
                                                </td>

                                                {/* Course & Title */}
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-extrabold text-slate-900 dark:text-white">
                                                            {offering.course_code}
                                                        </span>
                                                        <span className="font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                                                            {offering.course_title}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                            Code: {offering.offering_code}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Section */}
                                                <td className="py-3 px-3">
                                                    <span className="px-2.5 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                                                        {offering.section_name}
                                                    </span>
                                                </td>

                                                {/* Enrollment */}
                                                <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                                    {offering.expected_enrollment} studs
                                                </td>

                                                {/* Assigned Faculty */}
                                                <td className="py-3 px-4">
                                                    {offering.faculty ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                                                                {offering.faculty.full_name.charAt(0)}
                                                            </div>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                {offering.faculty.full_name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold italic text-[11px] flex items-center gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span>Unassigned</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Lec / Lab */}
                                                <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                                                    {offering.lecture_hours}h / {offering.lab_hours}h
                                                </td>

                                                {/* Loading Status */}
                                                <td className="py-3 px-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        offering.loading_status === 'Assigned'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                    )}>
                                                        {offering.loading_status}
                                                    </span>
                                                </td>

                                                {/* Schedule Status */}
                                                <td className="py-3 px-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        offering.timetable_status === 'Scheduled'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                                            : offering.timetable_status === 'Conflict'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                    )}>
                                                        {offering.timetable_status}
                                                    </span>
                                                </td>

                                                {/* Publication Status */}
                                                <td className="py-3 px-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        offering.publication_status === 'Published'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : offering.publication_status === 'Ready'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                    )}>
                                                        {offering.publication_status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEdit(offering)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                                            title="Edit Class Assignment"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingOffering(offering)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-400 transition-colors"
                                                            title="Remove Offering"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredOfferings.length > 0 && (
                        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                            {/* Page size & items counter */}
                            <div className="flex items-center gap-2">
                                <span>Show</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>
                                    per page · Showing {Math.min((safeCurrentPage - 1) * perPage + 1, filteredOfferings.length)} to{' '}
                                    {Math.min(safeCurrentPage * perPage, filteredOfferings.length)} of {filteredOfferings.length} offerings
                                </span>
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={safeCurrentPage === 1}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                        if (
                                            totalPages > 7 &&
                                            pageNum !== 1 &&
                                            pageNum !== totalPages &&
                                            Math.abs(pageNum - safeCurrentPage) > 1
                                        ) {
                                            if (pageNum === 2 || pageNum === totalPages - 1) {
                                                return (
                                                    <span key={pageNum} className="w-6 text-center text-slate-400">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }

                                        const isActive = safeCurrentPage === pageNum;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                                    isActive
                                                        ? "bg-amber-400 text-slate-950 shadow-xs"
                                                        : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                )}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safeCurrentPage === totalPages}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL: Auto-Generate Offerings from Curriculum */}
                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <span>Auto-Generate Course Offerings</span>
                            </DialogTitle>
                            <DialogDescription>
                                Automatically instantiate semester section offerings based on the active curriculum blueprint and registered cohort sections.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitGenerate} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Academic Period</label>
                                <select
                                    required
                                    value={generateForm.data.academic_period_id}
                                    onChange={(e) => generateForm.setData('academic_period_id', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    {academicPeriods.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.is_active ? '(Active Term)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Program</label>
                                <select
                                    required
                                    value={generateForm.data.program_id}
                                    onChange={(e) => generateForm.setData('program_id', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} - {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                                <p className="font-semibold">How Generation Works:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-blue-800 dark:text-blue-300">
                                    <li>Reads the active curriculum matrix for the program</li>
                                    <li>Maps each cohort section's year level to corresponding semester subjects</li>
                                    <li>Creates planned offerings ready for Faculty Loading & Timetabling</li>
                                    <li>Skips subjects already instantiated for the section</li>
                                </ul>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={generateForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Generate Offerings
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: New Manual Offering */}
                <Dialog open={isAddOfferingOpen} onOpenChange={setIsAddOfferingOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Semester Course Offering</DialogTitle>
                            <DialogDescription>
                                Add a specific course offering for a section (e.g. elective, retake tutorial, merged class).
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAddOffering} className="space-y-3.5 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Period</label>
                                    <select
                                        required
                                        value={addForm.data.academic_period_id}
                                        onChange={(e) => addForm.setData('academic_period_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {academicPeriods.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program</label>
                                    <select
                                        required
                                        value={addForm.data.program_id}
                                        onChange={(e) => addForm.setData('program_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {programs.map((p) => (
                                            <option key={p.id} value={p.id}>{p.code}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical Course</label>
                                    <select
                                        required
                                        value={addForm.data.course_id}
                                        onChange={(e) => addForm.setData('course_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {courses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.code} - {c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Section</label>
                                    <select
                                        required
                                        value={addForm.data.section_id}
                                        onChange={(e) => addForm.setData('section_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        {sections.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Faculty (Optional)</label>
                                    <select
                                        value={addForm.data.faculty_id}
                                        onChange={(e) => addForm.setData('faculty_id', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="">Leave unassigned for now</option>
                                        {facultyMembers.map((f) => (
                                            <option key={f.id} value={f.id}>{f.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Enrollment</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        required
                                        value={addForm.data.expected_enrollment}
                                        onChange={(e) => addForm.setData('expected_enrollment', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Offering Type</label>
                                    <select
                                        value={addForm.data.offering_type}
                                        onChange={(e) => addForm.setData('offering_type', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Regular">Regular Cohort Offering</option>
                                        <option value="Elective">Professional Elective</option>
                                        <option value="Retake">Retake / Tutorial Class</option>
                                        <option value="Merged">Merged Combined Sections</option>
                                        <option value="Special">Special Petitioned Class</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publication Status</label>
                                    <select
                                        value={addForm.data.publication_status}
                                        onChange={(e) => addForm.setData('publication_status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Draft">Draft (Internal Planning)</option>
                                        <option value="Ready">Ready for Loading / Timetabling</option>
                                        <option value="Published">Published (Active Schedule)</option>
                                    </select>
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOfferingOpen(false)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Create Offering
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Edit Offering */}
                <Dialog open={!!editingOffering} onOpenChange={(open) => !open && setEditingOffering(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Update Course Offering</DialogTitle>
                            <DialogDescription>
                                Modify faculty assignment, loading status, and lifecycle state for {editingOffering?.offering_code}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEditOffering} className="space-y-3.5 py-2">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign Faculty Instructor</label>
                                <select
                                    value={editForm.data.faculty_id}
                                    onChange={(e) => {
                                        const facId = e.target.value ? Number(e.target.value) : '';
                                        editForm.setData({
                                            ...editForm.data,
                                            faculty_id: facId,
                                            loading_status: facId ? 'Assigned' : 'Unassigned',
                                        });
                                    }}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                >
                                    <option value="">No Instructor Assigned (Unassigned)</option>
                                    {facultyMembers.map((f) => (
                                        <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Class Size</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        required
                                        value={editForm.data.expected_enrollment}
                                        onChange={(e) => editForm.setData('expected_enrollment', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Offering Type</label>
                                    <select
                                        value={editForm.data.offering_type}
                                        onChange={(e) => editForm.setData('offering_type', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Regular">Regular</option>
                                        <option value="Elective">Elective</option>
                                        <option value="Retake">Retake</option>
                                        <option value="Merged">Merged</option>
                                        <option value="Special">Special</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Timetable Status</label>
                                    <select
                                        value={editForm.data.timetable_status}
                                        onChange={(e) => editForm.setData('timetable_status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Drafted">Drafted</option>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Conflict">Conflict</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publication Status</label>
                                    <select
                                        value={editForm.data.publication_status}
                                        onChange={(e) => editForm.setData('publication_status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Published">Published</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Special Notes</label>
                                <textarea
                                    rows={2}
                                    placeholder="Any scheduling constraints or merged section details..."
                                    value={editForm.data.special_notes}
                                    onChange={(e) => editForm.setData('special_notes', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingOffering(null)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Update Offering
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRM DIALOG */}
                <DeleteConfirmDialog
                    isOpen={!!deletingOffering}
                    onClose={() => setDeletingOffering(null)}
                    onConfirm={confirmDelete}
                    title="Remove Semester Course Offering"
                    description={`Are you sure you want to delete course offering "${deletingOffering?.offering_code}"? Any associated schedules will need to be reassigned.`}
                />
            </div>
        </AppLayout>
    );
}
