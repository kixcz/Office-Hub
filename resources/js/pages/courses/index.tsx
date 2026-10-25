import React, { useState, useMemo, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    BookOpen,
    Search,
    Plus,
    Filter,
    Building2,
    Layers,
    Clock,
    Monitor,
    Edit,
    Trash2,
    Eye,
    UploadCloud,
    Download,
    CheckCircle2,
    Calendar,
    ArrowUpDown,
    Check,
    AlertCircle,
    UserCheck,
    Cpu,
    ExternalLink,
    Split,
    SlidersHorizontal,
    MoreVertical,
    FileSpreadsheet,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Database,
    Tag
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Structure',
        href: '/courses',
    },
    {
        title: 'Canonical Courses Catalog',
        href: '/courses',
    },
];

interface CurriculumCourse {
    id: number;
    year_level: number;
    semester_placement: string;
    requirement_type: string;
    curriculum: {
        id: number;
        version_name: string;
        program: {
            id: number;
            code: string;
            name: string;
        };
    };
}

interface CourseOffering {
    id: number;
    offering_code: string;
    course_code: string;
    section_name: string;
    academic_period?: {
        id: number;
        name: string;
    };
    section?: {
        id: number;
        name: string;
    };
    faculty?: {
        id: number;
        full_name: string;
    };
}

interface Course {
    id: number;
    code: string;
    title: string;
    description: string | null;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    room_type_required?: string;
    required_facility_type: string;
    required_equipment: string | null;
    consecutive_lab_required?: boolean;
    can_split_lab_hours: boolean;
    preferred_block_length: number | null;
    category: string;
    specialization_tag: string | null;
    prerequisites: string | null;
    corequisites: string | null;
    status: 'Active' | 'Inactive' | 'Phased Out';
    source?: string;
    curriculum_courses?: CurriculumCourse[];
    course_offerings?: CourseOffering[];
}

interface FacultyMember {
    id: number;
    full_name: string;
    department: string;
    designation: string;
    employment_type: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedCourses {
    data: Course[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    courses: PaginatedCourses | Course[];
    facultyMembers: FacultyMember[];
    stats: {
        total_courses: number;
        active_courses: number;
        with_laboratory: number;
        pure_lecture: number;
    };
    facilityTypes: string[];
    categories: string[];
    sources?: string[];
    filters: {
        search?: string;
        facility_type?: string;
        category?: string;
        status?: string;
        source?: string;
        per_page?: string;
    };
}

export default function CoursesCatalogIndex({
    courses: coursesProp,
    facultyMembers,
    stats,
    facilityTypes,
    categories,
    sources = [],
    filters = {},
}: Props) {
    const isPaginated = 'data' in coursesProp && Array.isArray((coursesProp as PaginatedCourses).data);
    const paginatedData = isPaginated ? (coursesProp as PaginatedCourses) : null;
    const coursesList = isPaginated ? (coursesProp as PaginatedCourses).data : (coursesProp as Course[]);

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFacility, setSelectedFacility] = useState(filters.facility_type || 'all');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedSource, setSelectedSource] = useState(filters.source || 'all');

    // Sync from Google Sheets Modal
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState(
        'https://docs.google.com/spreadsheets/u/3/d/13LtlK6wopWwYf-7Q8rgmfOwEDo6gUMMJT32-xwEeVN8/edit?gid=1905905992#gid=1905905992'
    );
    const [isSyncing, setIsSyncing] = useState(false);

    // Drawer / Detail modal
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<
        'academic' | 'scheduling' | 'curriculum' | 'faculty' | 'prereqs' | 'history'
    >('academic');

    // Modals
    const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

    // Form: Create Course
    const addCourseForm = useForm({
        code: '',
        title: '',
        description: '',
        units: 3,
        lecture_hours: 2,
        lab_hours: 3,
        required_facility_type: 'Computer Laboratory',
        required_equipment: '',
        can_split_lab_hours: false,
        preferred_block_length: 3,
        category: 'Major',
        specialization_tag: 'Web & Mobile Development',
        prerequisites: '',
        corequisites: '',
        status: 'Active',
    });

    // Form: Edit Course
    const editCourseForm = useForm({
        code: '',
        title: '',
        description: '',
        units: 3,
        lecture_hours: 2,
        lab_hours: 3,
        required_facility_type: 'Computer Laboratory',
        required_equipment: '',
        can_split_lab_hours: false,
        preferred_block_length: 3,
        category: 'Major',
        specialization_tag: '',
        prerequisites: '',
        corequisites: '',
        status: 'Active',
        source: 'Manual Entry',
    });

    const handleOpenEdit = (course: Course) => {
        setEditingCourse(course);
        editCourseForm.setData({
            code: course.code,
            title: course.title,
            description: course.description || '',
            units: Number(course.units),
            lecture_hours: Number(course.lecture_hours),
            lab_hours: Number(course.lab_hours),
            required_facility_type: course.required_facility_type || 'Lecture Room',
            required_equipment: course.required_equipment || '',
            can_split_lab_hours: Boolean(course.can_split_lab_hours),
            preferred_block_length: course.preferred_block_length ? Number(course.preferred_block_length) : 3,
            category: course.category || 'Major',
            specialization_tag: course.specialization_tag || '',
            prerequisites: course.prerequisites || '',
            corequisites: course.corequisites || '',
            status: course.status || 'Active',
            source: course.source || 'Manual Entry',
        });
    };

    const submitAddCourse: FormEventHandler = (e) => {
        e.preventDefault();
        addCourseForm.post('/courses', {
            onSuccess: () => {
                setIsAddCourseOpen(false);
                addCourseForm.reset();
            },
        });
    };

    const submitEditCourse: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingCourse) return;
        editCourseForm.put(`/courses/${editingCourse.id}`, {
            onSuccess: () => {
                setEditingCourse(null);
            },
        });
    };

    const confirmDelete = () => {
        if (!deletingCourse) return;
        router.delete(`/courses/${deletingCourse.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingCourse(null);
                if (selectedCourse?.id === deletingCourse.id) {
                    setSelectedCourse(null);
                }
            },
        });
    };

    // Apply server filters with Inertia router
    const handleFilterChange = (updates: Record<string, string>) => {
        const nextFilters = {
            search: searchTerm,
            facility_type: selectedFacility,
            category: selectedCategory,
            status: selectedStatus,
            source: selectedSource,
            ...updates,
        };

        router.get('/courses', nextFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Filter catalog (if list is provided directly or on current page)
    const filteredCourses = useMemo(() => {
        return coursesList.filter((c) => {
            const matchesSearch =
                searchTerm === '' ||
                c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.source && c.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.specialization_tag && c.specialization_tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.required_facility_type && c.required_facility_type.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesFacility =
                selectedFacility === 'all' || c.required_facility_type === selectedFacility;

            const matchesCategory =
                selectedCategory === 'all' || c.category === selectedCategory;

            const matchesStatus =
                selectedStatus === 'all' || c.status.toLowerCase() === selectedStatus.toLowerCase();

            const matchesSource =
                selectedSource === 'all' || c.source === selectedSource;

            return matchesSearch && matchesFacility && matchesCategory && matchesStatus && matchesSource;
        });
    }, [coursesList, searchTerm, selectedFacility, selectedCategory, selectedStatus, selectedSource]);

    const handleSyncFromSheets = () => {
        setIsSyncing(true);
        router.post('/courses/sync-sheets', {
            spreadsheet_url: spreadsheetUrl,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSyncing(false);
                setIsSyncModalOpen(false);
            },
        });
    };

    const getSourceBadge = (source?: string) => {
        if (!source || source === 'Manual Entry' || source === 'Database') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Database className="w-2.5 h-2.5 text-slate-400" />
                    <span>{source || 'Manual Entry'}</span>
                </span>
            );
        }

        if (source.includes('BSIT')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-500" />
                    <span>Sheet (BSIT)</span>
                </span>
            );
        }

        if (source.includes('BSIS')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-cyan-500" />
                    <span>Sheet (BSIS)</span>
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Tag className="w-2.5 h-2.5 text-purple-500" />
                <span>{source}</span>
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Canonical Course Catalog" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full transition-colors">
                {/* 1. Header Hero Banner */}
                <div className="rounded-2xl border border-purple-200/60 dark:border-purple-900/40 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-950/30 dark:via-purple-950/10 dark:to-transparent p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-13 h-13 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200/90 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs p-3">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    Canonical Courses Catalog
                                </h1>
                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Single Source of Truth
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                                Reusable academic entities defining credit units, lecture/laboratory contact rules, required facility types, prerequisites, and tracked data source origins.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Import / Sync Spreadsheet</span>
                        </button>

                        <button
                            onClick={() => setIsAddCourseOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-500 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Add Canonical Course</span>
                        </button>
                    </div>
                </div>

                {/* 2. Bento Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Subjects</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.total_courses}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Universal catalog entities</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Subjects</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.active_courses}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Available for loading</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">With Laboratory</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.with_laboratory}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Computer/Specialized labs</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pure Lecture</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                {stats.pure_lecture}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">General ed & theory</p>
                        </div>
                    </div>
                </div>

                {/* 3. Search & Filter Toolbars */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search course code, title, facility, specialization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Facility Type Filter */}
                        <select
                            value={selectedFacility}
                            onChange={(e) => setSelectedFacility(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Facilities</option>
                            {facilityTypes.map((fac) => (
                                <option key={fac} value={fac}>{fac}</option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Classifications</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Phased Out">Phased Out</option>
                        </select>

                        {/* Data Source Filter */}
                        <select
                            value={selectedSource}
                            onChange={(e) => {
                                setSelectedSource(e.target.value);
                                handleFilterChange({ source: e.target.value });
                            }}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Data Sources</option>
                            <option value="Manual Entry">Manual Entry</option>
                            <option value="Google Sheets (BSIT Class)">Google Sheets (BSIT)</option>
                            <option value="Google Sheets (BSIS Class)">Google Sheets (BSIS)</option>
                            {sources.filter(s => !['Manual Entry', 'Google Sheets (BSIT Class)', 'Google Sheets (BSIS Class)'].includes(s)).map((src) => (
                                <option key={src} value={src}>{src}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. Canonical Catalog Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3 px-4 font-bold">Course Code & Title</th>
                                    <th className="py-3 px-3 font-bold text-center">Units</th>
                                    <th className="py-3 px-3 font-bold text-center">Lec / Lab Hrs</th>
                                    <th className="py-3 px-4 font-bold">Facility & Split Rule</th>
                                    <th className="py-3 px-4 font-bold">Prerequisites</th>
                                    <th className="py-3 px-3 font-bold">Category</th>
                                    <th className="py-3 px-3 font-bold">Data Source</th>
                                    <th className="py-3 px-3 font-bold">Status</th>
                                    <th className="py-3 px-4 font-bold text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                                            No canonical courses found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCourses.map((course) => {
                                        const totalHrs = Number(course.lecture_hours) + Number(course.lab_hours);
                                        const isSelected = selectedCourse?.id === course.id;

                                        return (
                                            <tr
                                                key={course.id}
                                                className={cn(
                                                    'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                                                    isSelected && 'bg-purple-50/40 dark:bg-purple-950/20'
                                                )}
                                            >
                                                {/* Code & Title */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                                            {course.code}
                                                        </span>
                                                        <span className="font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                                                            {course.title}
                                                        </span>
                                                        {course.specialization_tag && (
                                                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                                                                Track: {course.specialization_tag}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Units */}
                                                <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                                                    {course.units}
                                                </td>

                                                {/* Lec / Lab Contact */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                            {course.lecture_hours}h / {course.lab_hours}h
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {totalHrs}h contact
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Facility & Lab Split Rule */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                            <Monitor className="w-3.5 h-3.5 text-purple-500" />
                                                            <span>{course.required_facility_type || 'Lecture Room'}</span>
                                                        </span>
                                                        {Number(course.lab_hours) > 0 && (
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                <Split className="w-3 h-3 text-slate-400" />
                                                                <span>{course.can_split_lab_hours ? 'Lab Splittable' : 'Continuous Block (Single day)'}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Prerequisites */}
                                                <td className="py-3.5 px-4">
                                                    {course.prerequisites ? (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                                            {course.prerequisites}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">None</span>
                                                    )}
                                                </td>

                                                {/* Category */}
                                                <td className="py-3.5 px-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        course.category === 'Major'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                            : course.category === 'General Education'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                                    )}>
                                                        {course.category}
                                                    </span>
                                                </td>

                                                {/* Data Source Tracking */}
                                                <td className="py-3.5 px-3">
                                                    {getSourceBadge(course.source)}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        course.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                    )}>
                                                        {course.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCourse(course);
                                                                setActiveTab('academic');
                                                            }}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                                            title="Inspect Course Specification"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(course)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                                            title="Edit Course Properties"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingCourse(course)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-400 transition-colors"
                                                            title="Delete from Catalog"
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

                    {/* Pagination Controls */}
                    {paginatedData && paginatedData.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{paginatedData.from ?? 0}</span> to{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{paginatedData.to ?? 0}</span> of{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{paginatedData.total}</span> courses
                            </span>

                            <div className="flex items-center gap-1.5">
                                {paginatedData.links.map((link, idx) => {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                preserveScroll
                                                preserveState
                                                className={cn(
                                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors',
                                                    !link.url
                                                        ? 'opacity-40 pointer-events-none text-slate-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                                )}
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                <span>Prev</span>
                                            </Link>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                preserveScroll
                                                preserveState
                                                className={cn(
                                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors',
                                                    !link.url
                                                        ? 'opacity-40 pointer-events-none text-slate-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                                )}
                                            >
                                                <span>Next</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg font-bold transition-colors',
                                                link.active
                                                    ? 'bg-slate-900 text-white dark:bg-purple-600'
                                                    : link.url
                                                    ? 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                                    : 'opacity-40 pointer-events-none text-slate-400'
                                            )}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Course Details Drawer / Modal with Multi-Tabs */}
                <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        {selectedCourse && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{selectedCourse.code}</span>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span>{selectedCourse.title}</span>
                                            </DialogTitle>
                                            <DialogDescription>
                                                Canonical Course Master Definition • {selectedCourse.units} Units • {selectedCourse.category}
                                            </DialogDescription>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex items-center gap-2 mt-4 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
                                        <button
                                            onClick={() => setActiveTab('academic')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                activeTab === 'academic'
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Academic Details
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('scheduling')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                activeTab === 'scheduling'
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Scheduling Requirements
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('curriculum')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                activeTab === 'curriculum'
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Curriculum Usage ({selectedCourse.curriculum_courses?.length || 0})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('faculty')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                activeTab === 'faculty'
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Qualified Faculty Mapping
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                                activeTab === 'history'
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            Historical Offerings ({selectedCourse.course_offerings?.length || 0})
                                        </button>
                                    </div>
                                </DialogHeader>

                                {/* Tab Contents */}
                                <div className="py-4 text-xs">
                                    {activeTab === 'academic' && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">Catalog Description</h4>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {selectedCourse.description || 'No formal course description has been registered for this catalog entity.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="p-3 rounded-lg border bg-white dark:bg-slate-800">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Credit Units</span>
                                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedCourse.units} Units</p>
                                                </div>
                                                <div className="p-3 rounded-lg border bg-white dark:bg-slate-800">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Lecture Hours</span>
                                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedCourse.lecture_hours} hrs/wk</p>
                                                </div>
                                                <div className="p-3 rounded-lg border bg-white dark:bg-slate-800">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Laboratory Hours</span>
                                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedCourse.lab_hours} hrs/wk</p>
                                                </div>
                                                <div className="p-3 rounded-lg border bg-white dark:bg-slate-800">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Contact</span>
                                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                                                        {Number(selectedCourse.lecture_hours) + Number(selectedCourse.lab_hours)} hrs/wk
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'scheduling' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Required Room / Facility</span>
                                                    <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1">
                                                        {selectedCourse.required_facility_type || 'Lecture Room'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">Automated timetable generator will enforce this room type constraint.</p>
                                                </div>
                                                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Lab Split Policy</span>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">
                                                        {selectedCourse.can_split_lab_hours ? 'May Split Across 2 Days' : 'Must Be Scheduled Continuously'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">Preferred Block Length: {selectedCourse.preferred_block_length || 3} Hours</p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">Specialized Hardware & Software Requirements</span>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                    {selectedCourse.required_equipment || 'Standard computer workstation with internet access, development IDEs, and office suite.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'curriculum' && (
                                        <div className="space-y-3">
                                            <p className="text-slate-500">
                                                This canonical course is referenced across the following institutional program blueprints:
                                            </p>
                                            {selectedCourse.curriculum_courses && selectedCourse.curriculum_courses.length > 0 ? (
                                                <div className="divide-y border rounded-xl overflow-hidden">
                                                    {selectedCourse.curriculum_courses.map((cc) => (
                                                        <div key={cc.id} className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between">
                                                            <div>
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {cc.curriculum.program.code} - {cc.curriculum.version_name}
                                                                </span>
                                                                <p className="text-[11px] text-slate-500">
                                                                    Year {cc.year_level} • {cc.semester_placement} • {cc.requirement_type}
                                                                </p>
                                                            </div>
                                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                                                                Sequenced
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 italic py-4 text-center">
                                                    Not currently placed in any program curriculum matrix.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'faculty' && (
                                        <div className="space-y-3">
                                            <p className="text-slate-500">
                                                Qualified faculty members mapped by specialization track (<strong>{selectedCourse.specialization_tag || 'General IT/IS'}</strong>):
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                                {facultyMembers.map((fac) => (
                                                    <div key={fac.id} className="p-2.5 rounded-lg border bg-white dark:bg-slate-800 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-200">{fac.full_name}</p>
                                                            <span className="text-[10px] text-slate-400">{fac.department} • {fac.designation}</span>
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                            Eligible
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="space-y-3">
                                            <p className="text-slate-500">
                                                Historical semester offerings for this course entity:
                                            </p>
                                            {selectedCourse.course_offerings && selectedCourse.course_offerings.length > 0 ? (
                                                <div className="divide-y border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {selectedCourse.course_offerings.map((co) => (
                                                        <div key={co.id} className="p-2.5 bg-white dark:bg-slate-800 flex items-center justify-between">
                                                            <div>
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                    {co.section_name} ({co.offering_code})
                                                                </span>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Term: {co.academic_period?.name || 'Academic Period'} • Faculty: {co.faculty?.full_name || 'Unassigned'}
                                                                </p>
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                                Offered
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 italic py-4 text-center">
                                                    No past semester offerings recorded.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCourse(null)}
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL: Add Course */}
                <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Canonical Course</DialogTitle>
                            <DialogDescription>
                                Register a reusable subject entity into the academic master catalog.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAddCourse} className="space-y-3.5 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. IT 111"
                                        value={addCourseForm.data.code}
                                        onChange={(e) => addCourseForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credit Units</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={addCourseForm.data.units}
                                        onChange={(e) => addCourseForm.setData('units', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Descriptive Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Introduction to Computing"
                                    value={addCourseForm.data.title}
                                    onChange={(e) => addCourseForm.setData('title', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lecture Hours / Week</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={addCourseForm.data.lecture_hours}
                                        onChange={(e) => addCourseForm.setData('lecture_hours', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Laboratory Hours / Week</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={addCourseForm.data.lab_hours}
                                        onChange={(e) => addCourseForm.setData('lab_hours', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Required Facility Type</label>
                                    <select
                                        value={addCourseForm.data.required_facility_type}
                                        onChange={(e) => addCourseForm.setData('required_facility_type', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Computer Laboratory">Computer Laboratory</option>
                                        <option value="Lecture Room">Lecture Room</option>
                                        <option value="Network / Hardware Lab">Network / Hardware Lab</option>
                                        <option value="Multimedia Studio">Multimedia Studio</option>
                                        <option value="Auditorium">Auditorium</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject Classification</label>
                                    <select
                                        value={addCourseForm.data.category}
                                        onChange={(e) => addCourseForm.setData('category', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Major">Professional Major</option>
                                        <option value="General Education">General Education</option>
                                        <option value="Elective">Professional Elective</option>
                                        <option value="Specialization">Specialization Track</option>
                                        <option value="Institutional">Institutional</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prerequisites (Codes)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. IT 111, MATH 101"
                                        value={addCourseForm.data.prerequisites}
                                        onChange={(e) => addCourseForm.setData('prerequisites', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Specialization / Domain Tag</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Data Analytics, Cyber"
                                        value={addCourseForm.data.specialization_tag}
                                        onChange={(e) => addCourseForm.setData('specialization_tag', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="split_lab"
                                    checked={addCourseForm.data.can_split_lab_hours}
                                    onChange={(e) => addCourseForm.setData('can_split_lab_hours', e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500/20"
                                />
                                <label htmlFor="split_lab" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Laboratory hours may be split across multiple days (e.g. 1.5h + 1.5h)
                                </label>
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
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-purple-600 rounded-lg"
                                >
                                    Register Subject
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Edit Course */}
                <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Course Definition</DialogTitle>
                            <DialogDescription>
                                Update scheduling attributes and contact specifications for {editingCourse?.code}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEditCourse} className="space-y-3.5 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={editCourseForm.data.code}
                                        onChange={(e) => editCourseForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Units</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={editCourseForm.data.units}
                                        onChange={(e) => editCourseForm.setData('units', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={editCourseForm.data.title}
                                    onChange={(e) => editCourseForm.setData('title', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lecture Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={editCourseForm.data.lecture_hours}
                                        onChange={(e) => editCourseForm.setData('lecture_hours', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lab Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        required
                                        value={editCourseForm.data.lab_hours}
                                        onChange={(e) => editCourseForm.setData('lab_hours', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Required Facility</label>
                                    <select
                                        value={editCourseForm.data.required_facility_type}
                                        onChange={(e) => editCourseForm.setData('required_facility_type', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Computer Laboratory">Computer Laboratory</option>
                                        <option value="Lecture Room">Lecture Room</option>
                                        <option value="Network / Hardware Lab">Network / Hardware Lab</option>
                                        <option value="Multimedia Studio">Multimedia Studio</option>
                                        <option value="Auditorium">Auditorium</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                    <select
                                        value={editCourseForm.data.status}
                                        onChange={(e) => editCourseForm.setData('status', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Phased Out">Phased Out</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prerequisites</label>
                                    <input
                                        type="text"
                                        value={editCourseForm.data.prerequisites}
                                        onChange={(e) => editCourseForm.setData('prerequisites', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data Source</label>
                                    <select
                                        value={editCourseForm.data.source || 'Manual Entry'}
                                        onChange={(e) => editCourseForm.setData('source', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                                    >
                                        <option value="Manual Entry">Manual Entry</option>
                                        <option value="Google Sheets (BSIT Class)">Google Sheets (BSIT Class)</option>
                                        <option value="Google Sheets (BSIS Class)">Google Sheets (BSIS Class)</option>
                                        <option value="CSV File Import">CSV File Import</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="split_lab_edit"
                                    checked={editCourseForm.data.can_split_lab_hours}
                                    onChange={(e) => editCourseForm.setData('can_split_lab_hours', e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500/20"
                                />
                                <label htmlFor="split_lab_edit" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Laboratory hours may be split across multiple days
                                </label>
                            </div>

                            <DialogFooter className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingCourse(null)}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editCourseForm.processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-purple-600 rounded-lg"
                                >
                                    Update Course
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL: Sync from Google Sheets */}
                <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Import / Sync with Google Spreadsheet
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                        Fetch and import BSIT and BSIS curriculum courses and section loading directly into the database.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-2 text-xs">
                            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 space-y-1.5">
                                <p className="font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Origin Tracking & Auto-Mapping</span>
                                </p>
                                <p className="text-[11px] leading-relaxed text-emerald-700/90 dark:text-emerald-300/80">
                                    All synced entities will automatically be tagged with their origin:
                                    <span className="font-bold underline ml-1">Google Sheets (BSIT Class)</span> or
                                    <span className="font-bold underline ml-1">Google Sheets (BSIS Class)</span>.
                                    You can review and modify any synced subject right in the catalog table anytime.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Published Google Spreadsheet URL / Document Link
                                </label>
                                <input
                                    type="url"
                                    value={spreadsheetUrl}
                                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Includes GID <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">1905905992</code> (BSIT) & <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">468505916</code> (BSIS).
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="mt-3">
                            <button
                                type="button"
                                onClick={() => setIsSyncModalOpen(false)}
                                disabled={isSyncing}
                                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSyncFromSheets}
                                disabled={isSyncing || !spreadsheetUrl}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                                <span>{isSyncing ? 'Syncing Catalog...' : 'Start Sync & Import'}</span>
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRM DIALOG */}
                <DeleteConfirmDialog
                    isOpen={!!deletingCourse}
                    onClose={() => setDeletingCourse(null)}
                    onConfirm={confirmDelete}
                    title="Remove Canonical Course"
                    description={`Are you sure you want to permanently delete "${deletingCourse?.code} - ${deletingCourse?.title}" from the canonical course catalog?`}
                />
            </div>
        </AppLayout>
    );
}
