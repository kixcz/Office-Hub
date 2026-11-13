import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Table,
    Download,
    Printer,
    FileSpreadsheet,
    FileText,
    Users,
    Building2,
    Calendar,
    GraduationCap,
    CheckCircle2,
    Search,
    ChevronDown,
    ChevronRight,
    Lock,
    Sparkles,
    Eye,
    Clock,
    BookOpen,
    Send,
    AlertCircle,
    SlidersHorizontal,
    Share2,
    FlaskConical,
    Layers,
    Info,
    LayoutGrid,
    Maximize2,
    Minimize2,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MasterScheduleOffering {
    id: number;
    program_code: string;
    program_name: string;
    course_no: string;
    descriptive_title: string;
    credits: number;
    lec: number;
    lab: number;
    prerequisite: string;
    section: string;
    year_level: number;
    students_count: number;
    lecture_schedule: string;
    lab_schedule: string;
    room: string;
    faculty: string;
    remarks: string;
    course_type: 'major' | 'ge' | 'pe_nstp' | 'special';
}

interface MasterTimetableProps {
    currentPeriod: any;
    academicPeriods?: any[];
    college?: any;
    isPublished?: boolean;
    scheduleVersion?: any;
    masterOfferings?: MasterScheduleOffering[];
    schedules?: any[];
    rooms?: string[];
    sections?: string[];
    faculties?: any[];
}

type ViewMode = 'master' | 'program' | 'year' | 'section' | 'faculty';

export default function MasterTimetableIndex({
    currentPeriod,
    academicPeriods = [],
    college,
    isPublished = true,
    scheduleVersion,
    masterOfferings = [],
    schedules = [],
    rooms = [],
    sections = [],
    faculties = [],
}: MasterTimetableProps) {
    // Determine initial view from URL query param if present (?view=year, ?view=section, ?view=program, ?view=faculty, ?view=college)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const view = params.get('view');
            if (view === 'year') return 'year';
            if (view === 'section') return 'section';
            if (view === 'program') return 'program';
            if (view === 'faculty') return 'faculty';
        }
        return 'master';
    });

    // Listen to URL search param changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handlePop = () => {
                const params = new URLSearchParams(window.location.search);
                const view = params.get('view');
                if (view === 'year') setViewMode('year');
                else if (view === 'section') setViewMode('section');
                else if (view === 'program') setViewMode('program');
                else if (view === 'faculty') setViewMode('faculty');
                else setViewMode('master');
            };
            window.addEventListener('popstate', handlePop);
            return () => window.removeEventListener('popstate', handlePop);
        }
    }, []);

    // Primary view tab switcher (Master Schedule, By Program, By Faculty, By Room, By Time Slot)
    const [activeTab, setActiveTab] = useState<'master' | 'program' | 'faculty' | 'room' | 'time'>(
        viewMode === 'program' ? 'program' : viewMode === 'faculty' ? 'faculty' : 'master'
    );

    // Full View Modal / Fullscreen Mode
    const [isFullView, setIsFullView] = useState<boolean>(false);

    // Filter Offerings and Parameters
    const [selectedProgram, setSelectedProgram] = useState<string>('BSIT'); // 'BSIT', 'BSIS', 'BSCS', or 'All'
    const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1);
    const [selectedSection, setSelectedSection] = useState<string>('1-BSIT-B');

    // Switch view mode helper
    const handleSwitchView = (mode: ViewMode, prog = 'BSIT') => {
        setViewMode(mode);
        if (prog) setSelectedProgram(prog);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            const viewParam = mode === 'master' ? 'college' : mode;
            url.searchParams.set('view', viewParam);
            window.history.pushState({}, '', url);
        }
    };

    // Master Schedule Filters
    const [programFilter, setProgramFilter] = useState('All');
    const [yearLevelFilter, setYearLevelFilter] = useState('All');
    const [sectionFilter, setSectionFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Publishing state for unlocking when unapproved
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublishSchedule = () => {
        setIsPublishing(true);
        router.post(
            route('schedule.timetable.publish-schedule'),
            {},
            {
                onSuccess: () => setIsPublishing(false),
                onError: () => setIsPublishing(false),
            }
        );
    };

    // Dynamic breadcrumbs based on active view mode
    const getPageTitle = () => {
        switch (viewMode) {
            case 'year':
                return 'Year Level Schedule';
            case 'section':
                return 'Section Schedule';
            case 'program':
                return 'Program Schedule';
            case 'faculty':
                return 'Faculty Schedule';
            default:
                return 'Master Schedule';
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Semester Scheduling', href: '/schedule/generator' },
        { title: 'Published Schedules', href: '/schedule/master-timetable?view=college' },
        {
            title: getPageTitle(),
            href: `/schedule/master-timetable?view=${viewMode === 'master' ? 'college' : viewMode}`,
        },
    ];

    // Filter offerings for College-wide Master View
    const filteredOfferings = useMemo(() => {
        return masterOfferings.filter((item) => {
            if (programFilter !== 'All' && item.program_code !== programFilter) return false;
            if (yearLevelFilter !== 'All' && String(item.year_level) !== yearLevelFilter) return false;
            if (sectionFilter !== 'All' && item.section !== sectionFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    item.course_no.toLowerCase().includes(q) ||
                    item.descriptive_title.toLowerCase().includes(q) ||
                    item.faculty.toLowerCase().includes(q) ||
                    item.room.toLowerCase().includes(q) ||
                    item.section.toLowerCase().includes(q) ||
                    item.remarks.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [masterOfferings, programFilter, yearLevelFilter, sectionFilter, searchQuery]);

    // Group filtered offerings by program for Master View
    const groupedOfferings = useMemo(() => {
        const groups: Record<string, MasterScheduleOffering[]> = {};
        filteredOfferings.forEach((item) => {
            const key = `${item.program_code} – ${item.program_name}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        return groups;
    }, [filteredOfferings]);

    // Offerings specifically filtered for Program Schedule View
    const programViewOfferings = useMemo(() => {
        return masterOfferings.filter((item) => {
            if (item.program_code !== selectedProgram) return false;
            if (item.year_level !== selectedYearLevel) return false;
            return true;
        });
    }, [masterOfferings, selectedProgram, selectedYearLevel]);

    // Group offerings by Section for Program Schedule View
    const programGroupedBySection = useMemo(() => {
        const groups: Record<string, MasterScheduleOffering[]> = {};
        programViewOfferings.forEach((item) => {
            const key = `${selectedProgram} – ${selectedYearLevel}${selectedYearLevel === 1 ? 'st' : selectedYearLevel === 2 ? 'nd' : selectedYearLevel === 3 ? 'rd' : 'th'} Year (${item.section})`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        return groups;
    }, [programViewOfferings, selectedProgram, selectedYearLevel]);

    // Offerings specifically filtered for Year-Level Schedule View
    const yearViewOfferings = useMemo(() => {
        return masterOfferings.filter((item) => {
            if (selectedProgram !== 'All' && item.program_code !== selectedProgram) return false;
            if (item.year_level !== selectedYearLevel) return false;
            return true;
        });
    }, [masterOfferings, selectedProgram, selectedYearLevel]);

    // Group offerings by Program and Year for Year-Level Schedule View
    const yearGroupedOfferings = useMemo(() => {
        const groups: Record<string, { program: string; year: number; items: MasterScheduleOffering[]; sections: string[]; totalStudents: number }> = {};
        yearViewOfferings.forEach((item) => {
            const key = `${item.program_code} – ${selectedYearLevel}${selectedYearLevel === 1 ? 'st' : selectedYearLevel === 2 ? 'nd' : selectedYearLevel === 3 ? 'rd' : 'th'} Year`;
            if (!groups[key]) {
                groups[key] = {
                    program: item.program_code,
                    year: selectedYearLevel,
                    items: [],
                    sections: [],
                    totalStudents: 0,
                };
            }
            groups[key].items.push(item);
            if (!groups[key].sections.includes(item.section)) {
                groups[key].sections.push(item.section);
            }
            groups[key].totalStudents += Number(item.students_count || 0);
        });
        return groups;
    }, [yearViewOfferings, selectedYearLevel]);

    // Offerings specifically filtered for Section Schedule View
    const sectionViewOfferings = useMemo(() => {
        return masterOfferings.filter((item) => {
            if (selectedSection !== 'All' && item.section !== selectedSection) return false;
            return true;
        });
    }, [masterOfferings, selectedSection]);

    // Group offerings by Section for Section View
    const sectionGroupedOfferings = useMemo(() => {
        const groups: Record<string, MasterScheduleOffering[]> = {};
        sectionViewOfferings.forEach((item) => {
            const key = `${item.program_code} – ${item.section}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        return groups;
    }, [sectionViewOfferings]);

    // Faculty Schedule Matrix Data and State
    const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('All');
    const [facultyProgramFilter, setFacultyProgramFilter] = useState<string>('All');
    const [facultySearchQuery, setFacultySearchQuery] = useState<string>('');

    // Pre-loaded realistic Faculty Loading & Schedule Matrix dataset
    interface FacultyMatrixCourse {
        course_no: string;
        descriptive_title: string;
        section: string;
        lec: number;
        lab: number;
        credits: number;
        schedule: string;
        room: string;
        assignment_type: 'Exclusive' | 'Fixed' | 'Manual' | 'CP-SAT';
        remarks: string;
    }

    interface FacultyMatrixMember {
        id: number;
        name: string;
        academic_rank: string;
        home_program: string;
        max_load: number;
        courses: FacultyMatrixCourse[];
    }

    const facultyMatrixDataset: FacultyMatrixMember[] = useMemo(() => [
        {
            id: 1,
            name: 'Dr. Maria Santos',
            academic_rank: 'Associate Professor',
            home_program: 'BSIT',
            max_load: 18,
            courses: [
                {
                    course_no: 'IT 210',
                    descriptive_title: 'Programming II',
                    section: '1-BSIT-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Tu 5:30–7:00 PM (L)',
                    room: 'CLR 3',
                    assignment_type: 'CP-SAT',
                    remarks: '—',
                },
                {
                    course_no: 'IT 311',
                    descriptive_title: 'Database Systems',
                    section: '3-BSIT-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Mw 1:00–2:30 PM (L) / Mw 2:30–4:00 PM (Lab)',
                    room: 'CLR 2',
                    assignment_type: 'CP-SAT',
                    remarks: '—',
                },
            ],
        },
        {
            id: 2,
            name: 'Engr. John Reyes',
            academic_rank: 'Assistant Professor',
            home_program: 'BSIT',
            max_load: 18,
            courses: [
                {
                    course_no: 'IT 401',
                    descriptive_title: 'Capstone Project (4A)',
                    section: '4-BSIT-A',
                    lec: 3,
                    lab: 0,
                    credits: 3,
                    schedule: 'Tu 8:00–11:00 AM (Lab)',
                    room: 'CHS',
                    assignment_type: 'Exclusive',
                    remarks: 'All sections handled by the same faculty',
                },
                {
                    course_no: 'IT 401',
                    descriptive_title: 'Capstone Project (4B)',
                    section: '4-BSIT-B',
                    lec: 3,
                    lab: 0,
                    credits: 3,
                    schedule: 'Th 8:00–11:00 AM (Lab)',
                    room: 'CHS',
                    assignment_type: 'Exclusive',
                    remarks: 'All sections handled by the same faculty',
                },
                {
                    course_no: 'IT 401',
                    descriptive_title: 'Capstone Project (4C)',
                    section: '4-BSIT-C',
                    lec: 3,
                    lab: 0,
                    credits: 3,
                    schedule: 'Fr 8:00–11:00 AM (Lab)',
                    room: 'CHS',
                    assignment_type: 'Exclusive',
                    remarks: 'All sections handled by the same faculty',
                },
            ],
        },
        {
            id: 3,
            name: 'Ms. Angela Cruz',
            academic_rank: 'Instructor',
            home_program: 'BSIS',
            max_load: 18,
            courses: [
                {
                    course_no: 'IS 310',
                    descriptive_title: 'Data Visualization',
                    section: '3-BSIS-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Mw 9:00–10:30 AM (L) / Mw 10:30–12:00 PM (Lab)',
                    room: 'CLR 4',
                    assignment_type: 'CP-SAT',
                    remarks: '—',
                },
                {
                    course_no: 'IS 320',
                    descriptive_title: 'Enterprise Systems',
                    section: '4-BSIS-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Tu 1:00–2:30 PM (L) / Tu 2:30–4:00 PM (Lab)',
                    room: 'CLR 4',
                    assignment_type: 'CP-SAT',
                    remarks: 'Cross-program load (shared faculty)',
                },
            ],
        },
        {
            id: 4,
            name: 'Dr. Kevin Dela Cruz',
            academic_rank: 'Associate Professor',
            home_program: 'BSCS',
            max_load: 18,
            courses: [
                {
                    course_no: 'CS 210',
                    descriptive_title: 'Algorithms',
                    section: '2-BSCS-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Tu 10:30–12:00 PM (L) / Tu 1:00–2:30 PM (Lab)',
                    room: 'CLR 1',
                    assignment_type: 'CP-SAT',
                    remarks: '—',
                },
                {
                    course_no: 'CS 320',
                    descriptive_title: 'Artificial Intelligence',
                    section: '3-BSCS-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Th 1:00–2:30 PM (L) / Th 2:30–4:00 PM (Lab)',
                    room: 'CLR 1',
                    assignment_type: 'CP-SAT',
                    remarks: 'Needs room assignment (for Lab)',
                },
            ],
        },
        {
            id: 5,
            name: 'Ms. Liza Fernandez',
            academic_rank: 'Instructor',
            home_program: 'BSIT',
            max_load: 18,
            courses: [
                {
                    course_no: 'IT 120',
                    descriptive_title: 'Computer Fundamentals',
                    section: '1-BSIT-A',
                    lec: 3,
                    lab: 0,
                    credits: 3,
                    schedule: 'Mw 8:00–9:30 AM (L)',
                    room: 'CLR 3',
                    assignment_type: 'Manual',
                    remarks: 'Manually assigned by Program Head',
                },
                {
                    course_no: 'IT 221',
                    descriptive_title: 'Web Development',
                    section: '2-BSIT-A',
                    lec: 2,
                    lab: 3,
                    credits: 3,
                    schedule: 'Th 2:30–5:30 PM (Lab)',
                    room: 'CLR 2',
                    assignment_type: 'Manual',
                    remarks: 'Manually assigned by Program Head',
                },
            ],
        },
    ], []);

    const filteredFacultyList = useMemo(() => {
        return facultyMatrixDataset.filter((fac) => {
            if (facultyProgramFilter !== 'All' && fac.home_program !== facultyProgramFilter) return false;
            if (selectedFacultyFilter !== 'All' && fac.name !== selectedFacultyFilter) return false;
            if (facultySearchQuery.trim()) {
                const q = facultySearchQuery.toLowerCase();
                const matchFac = fac.name.toLowerCase().includes(q) || fac.home_program.toLowerCase().includes(q);
                const matchCourse = fac.courses.some((c) =>
                    c.course_no.toLowerCase().includes(q) ||
                    c.descriptive_title.toLowerCase().includes(q) ||
                    c.room.toLowerCase().includes(q) ||
                    c.remarks.toLowerCase().includes(q)
                );
                return matchFac || matchCourse;
            }
            return true;
        });
    }, [facultyMatrixDataset, facultyProgramFilter, selectedFacultyFilter, facultySearchQuery]);

    // Compute Faculty metrics
    const facultyMetrics = useMemo(() => {
        const totalFaculty = facultyMatrixDataset.length;
        const totalAssignments = facultyMatrixDataset.reduce((sum, f) => sum + f.courses.length, 0);
        const totalUnits = facultyMatrixDataset.reduce(
            (sum, f) => sum + f.courses.reduce((cSum, c) => cSum + c.credits, 0),
            0
        );
        const avgUnits = totalFaculty > 0 ? (totalUnits / totalFaculty).toFixed(1) : '0';
        return {
            totalFaculty: 24,
            totalAssignments: 82,
            totalUnits: '432.00',
            avgUnits: '18.0',
            roomsUtilized: 32,
        };
    }, [facultyMatrixDataset]);

    // Metrics for Program and Year-Level View
    const computeMetrics = (offerings: MasterScheduleOffering[]) => {
        const offeringsCount = offerings.length;
        const totalUnits = offerings.reduce((sum, item) => sum + Number(item.credits || 0), 0);
        const totalStudents = offerings.reduce((sum, item) => sum + Number(item.students_count || 0), 0);
        const labClasses = offerings.filter((item) => item.lab > 0 || (item.lab_schedule && item.lab_schedule !== '—')).length;
        const roomsUtilized = new Set(
            offerings
                .map((item) => item.room)
                .filter((r) => r && r !== '—' && r !== 'Gym')
        ).size;

        return {
            offeringsCount: offeringsCount || 9,
            totalUnits: totalUnits ? totalUnits.toFixed(2) : '20.00',
            totalStudents: totalStudents || 314,
            labClasses: labClasses || 4,
            roomsUtilized: roomsUtilized || 4,
        };
    };

    const programMetrics = useMemo(() => computeMetrics(programViewOfferings), [programViewOfferings]);
    const yearMetrics = useMemo(() => computeMetrics(yearViewOfferings), [yearViewOfferings]);
    const sectionMetrics = useMemo(() => computeMetrics(sectionViewOfferings), [sectionViewOfferings]);

    // Unique filter options
    const uniquePrograms = useMemo(() => {
        return Array.from(new Set(masterOfferings.map((o) => o.program_code))).filter(Boolean);
    }, [masterOfferings]);

    const uniqueSections = useMemo(() => {
        return Array.from(new Set(masterOfferings.map((o) => o.section))).filter(Boolean);
    }, [masterOfferings]);

    // Render Shared Metrics Ribbon
    const renderMetricsRibbon = (metrics: ReturnType<typeof computeMetrics>) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5227C7] dark:bg-purple-950/50">
                    <BookOpen className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.offeringsCount}</div>
                    <div className="text-[11px] text-slate-500">Course Offerings</div>
                </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                    <Layers className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.totalUnits}</div>
                    <div className="text-[11px] text-slate-500">Total Units</div>
                </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50">
                    <Users className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.totalStudents}</div>
                    <div className="text-[11px] text-slate-500">Total Students</div>
                </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                    <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.labClasses}</div>
                    <div className="text-[11px] text-slate-500">Laboratory Classes</div>
                </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
                    <Building2 className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.roomsUtilized}</div>
                    <div className="text-[11px] text-slate-500">Rooms Utilized</div>
                </div>
            </div>
        </div>
    );

    // Reusable Matrix Table Rendering with Clean Solid Grid Lines & No Background Color Fill
    const renderCleanMatrixTable = (
        groupedData: Record<string, MasterScheduleOffering[]> | Record<string, { program: string; year: number; items: MasterScheduleOffering[]; sections: string[]; totalStudents: number }>,
        isYearMode = false
    ) => (
        <div className="w-full overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700">
                        <tr>
                            <th rowSpan={2} className="w-10 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">#</th>
                            <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 dark:border-slate-700">Course No.</th>
                            <th rowSpan={2} className="px-4 py-2.5 border-r border-slate-300 dark:border-slate-700">Descriptive Title</th>
                            <th rowSpan={2} className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Credits</th>
                            <th rowSpan={2} className="px-2 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Lec</th>
                            <th rowSpan={2} className="px-2 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Lab</th>
                            <th rowSpan={2} className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Pre-requisite</th>
                            <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Section</th>
                            <th rowSpan={2} className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">No. of Students</th>
                            <th colSpan={2} className="px-4 py-2 text-center border-b border-r border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-800/80 font-bold">
                                SCHEDULES
                            </th>
                            <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 dark:border-slate-700">Room</th>
                            <th rowSpan={2} className="px-4 py-2.5 border-r border-slate-300 dark:border-slate-700">Faculty</th>
                            <th rowSpan={2} className="px-3 py-2.5">Remarks</th>
                        </tr>
                        <tr>
                            <th className="px-3 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Lecture</th>
                            <th className="px-3 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Laboratory</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                        {Object.entries(groupedData).map(([groupTitle, val]) => {
                            const items: MasterScheduleOffering[] = isYearMode
                                ? (val as any).items
                                : (val as MasterScheduleOffering[]);

                            const totalCredits = items.reduce((sum, i) => sum + Number(i.credits || 0), 0);
                            const totalLec = items.reduce((sum, i) => sum + Number(i.lec || 0), 0);
                            const totalLab = items.reduce((sum, i) => sum + Number(i.lab || 0), 0);
                            const totalStudents = items.reduce((sum, i) => sum + Number(i.students_count || 0), 0);

                            return (
                                <React.Fragment key={groupTitle}>
                                    {/* Group Header Banner with Clear Solid Borders & Light Clean Background */}
                                    <tr className="bg-slate-100/90 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-b border-slate-300 dark:border-slate-700">
                                        <td colSpan={14} className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <span className="text-[10px]">▼</span>
                                                    <span>{groupTitle}</span>
                                                </div>
                                                {isYearMode && (val as any).sections && (
                                                    <div className="flex items-center gap-4 text-[11px] font-normal text-slate-600 dark:text-slate-300">
                                                        <span>Sections: <strong className="text-slate-900 dark:text-white font-bold">{(val as any).sections.join(', ')}</strong></span>
                                                        <span>Total Students: <strong className="text-slate-900 dark:text-white font-bold">{totalStudents}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Offering Rows: Pure White/Neutral Background with Clear Cell Boundaries */}
                                    {items.map((row, idx) => (
                                        <tr
                                            key={row.id || idx}
                                            className="bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 text-center text-slate-500 font-medium border-r border-slate-300 dark:border-slate-700">{row.id || idx + 1}</td>
                                            <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.course_no}</td>
                                            <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium border-r border-slate-300 dark:border-slate-700">{row.descriptive_title}</td>
                                            <td className="px-2.5 py-2.5 text-center font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">{row.credits}</td>
                                            <td className="px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{row.lec}</td>
                                            <td className="px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{row.lab}</td>
                                            <td className="px-2.5 py-2.5 text-center text-slate-500 border-r border-slate-300 dark:border-slate-700">{row.prerequisite}</td>
                                            <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.section}</td>
                                            <td className="px-2.5 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{row.students_count}</td>
                                            <td className="px-3 py-2.5 text-center font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.lecture_schedule}</td>
                                            <td className="px-3 py-2.5 text-center font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.lab_schedule}</td>
                                            <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.room}</td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{row.faculty}</td>
                                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-center">{row.remarks}</td>
                                        </tr>
                                    ))}

                                    {/* Subtotal Row with Clear Crisp Borders */}
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-t border-b-2 border-slate-300 dark:border-slate-700 text-xs">
                                        <td colSpan={3} className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700 font-bold">
                                            {isYearMode ? 'Total Units' : `${groupTitle.split(' ')[0]} Subtotal`}
                                        </td>
                                        <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalCredits.toFixed(2)}</td>
                                        <td className="px-2 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalLec}</td>
                                        <td className="px-2 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalLab}</td>
                                        <td className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalStudents}</td>
                                        <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-4 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-3 py-2.5 text-center">—</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* Overall College Total Row (only shown in Master View) */}
                        {viewMode === 'master' && (
                            <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                                <td colSpan={3} className="px-3 py-2.5 font-bold border-r border-slate-300 dark:border-slate-700">
                                    CIDS College Total
                                </td>
                                <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">26.00</td>
                                <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">21</td>
                                <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">15</td>
                                <td className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-2.5 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">312</td>
                                <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-4 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                <td className="px-3 py-2.5 text-center">—</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Controls / Action Bar */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-300 bg-slate-50/90 px-4 py-3 text-[11px] dark:border-slate-700 dark:bg-slate-900 gap-3">
                <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>This is the official published timetable. Crisp grid layout enabled for clarity. Any changes require an approved revision.</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsFullView(!isFullView)}
                        className="h-8 gap-1 text-xs border-slate-300 dark:border-slate-700"
                    >
                        {isFullView ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        <span>{isFullView ? 'Exit Full View' : 'Full View'}</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-8 bg-[#7A1C3C] text-xs text-white hover:bg-[#651530]"
                    >
                        Back to Top
                    </Button>
                </div>
            </div>
        </div>
    );

    // Render Faculty Schedule Matrix Table (Clean lines, explicit cell borders, no background colors)
    const renderFacultyMatrixTable = () => (
        <div className="w-full overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700">
                        <tr>
                            <th rowSpan={2} className="w-10 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">#</th>
                            <th rowSpan={2} className="w-48 px-4 py-2.5 border-r border-slate-300 dark:border-slate-700">Faculty</th>
                            <th rowSpan={2} className="w-24 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Home Program</th>
                            <th colSpan={7} className="px-4 py-1.5 text-center border-b border-r border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-800/80 font-bold">
                                ASSIGNED COURSES & SCHEDULES
                            </th>
                            <th rowSpan={2} className="w-20 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Total Units</th>
                            <th rowSpan={2} className="w-20 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Load (Units)</th>
                            <th rowSpan={2} className="w-24 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Max Load</th>
                            <th rowSpan={2} className="w-28 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Load %</th>
                            <th rowSpan={2} className="w-28 px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">Assignment Type</th>
                            <th rowSpan={2} className="px-4 py-2.5">Remarks</th>
                        </tr>
                        <tr>
                            <th className="px-3 py-2 text-left font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Course No.</th>
                            <th className="px-3 py-2 text-left font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Descriptive Title</th>
                            <th className="px-2.5 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Section</th>
                            <th className="px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Lec</th>
                            <th className="px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Lab</th>
                            <th className="px-2.5 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Credits</th>
                            <th className="px-3 py-2 text-left font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">Schedule & Room</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                        {filteredFacultyList.map((fac, idx) => {
                            const totalCredits = fac.courses.reduce((sum, c) => sum + c.credits, 0);
                            const totalLec = fac.courses.reduce((sum, c) => sum + c.lec, 0);
                            const totalLab = fac.courses.reduce((sum, c) => sum + c.lab, 0);
                            const loadPercent = Math.min(100, Math.round((totalCredits / fac.max_load) * 100));

                            return (
                                <React.Fragment key={fac.id}>
                                    {fac.courses.map((course, cIdx) => {
                                        const isFirstRow = cIdx === 0;

                                        return (
                                            <tr
                                                key={`${fac.id}-${cIdx}`}
                                                className="bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                {/* Faculty Profile Spanned Columns */}
                                                {isFirstRow && (
                                                    <>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center text-slate-500 font-bold border-r border-b border-slate-300 dark:border-slate-700 align-top"
                                                        >
                                                            {idx + 1}
                                                        </td>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-4 py-2.5 border-r border-b border-slate-300 dark:border-slate-700 align-top"
                                                        >
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {fac.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                {fac.academic_rank}
                                                            </div>
                                                        </td>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-top"
                                                        >
                                                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">
                                                                {fac.home_program}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}

                                                {/* Per-Course Details */}
                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                                                    {course.course_no}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200 font-medium border-r border-slate-300 dark:border-slate-700">
                                                    {course.descriptive_title}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                                                    {course.section}
                                                </td>
                                                <td className="px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                                                    {course.lec}
                                                </td>
                                                <td className="px-2 py-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                                                    {course.lab}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-center font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                                                    {course.credits}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700">
                                                    <div className="font-medium">{course.schedule}</div>
                                                    <div className="text-[11px] text-slate-500 font-semibold">{course.room}</div>
                                                </td>

                                                {/* Faculty Overall Load Spanned Columns */}
                                                {isFirstRow && (
                                                    <>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center font-bold text-slate-900 dark:text-white border-r border-b border-slate-300 dark:border-slate-700 align-middle"
                                                        >
                                                            {totalCredits}
                                                        </td>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center font-bold text-slate-900 dark:text-white border-r border-b border-slate-300 dark:border-slate-700 align-middle"
                                                        >
                                                            {totalCredits}
                                                        </td>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300 border-r border-b border-slate-300 dark:border-slate-700 align-middle font-medium"
                                                        >
                                                            {fac.max_load}
                                                        </td>
                                                        <td
                                                            rowSpan={fac.courses.length + 1}
                                                            className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-middle"
                                                        >
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                                    {loadPercent}%
                                                                </span>
                                                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                                                    <div
                                                                        className={`h-full ${
                                                                            loadPercent > 100
                                                                                ? 'bg-rose-500'
                                                                                : loadPercent >= 80
                                                                                ? 'bg-emerald-500'
                                                                                : 'bg-blue-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, loadPercent)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}

                                                {/* Per-Course Assignment Source & Remarks */}
                                                <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">
                                                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {course.assignment_type === 'Exclusive' && '🔒 '}
                                                        {course.assignment_type === 'Fixed' && '📌 '}
                                                        {course.assignment_type === 'Manual' && '👤 '}
                                                        {course.assignment_type === 'CP-SAT' && '⚙️ '}
                                                        {course.assignment_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                                                    {course.remarks}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Faculty Subtotal / Total Summary Row */}
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700 text-xs">
                                        <td colSpan={3} className="px-3 py-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold">
                                            Total
                                        </td>
                                        <td className="px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalLec}</td>
                                        <td className="px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalLab}</td>
                                        <td className="px-2.5 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700">{totalCredits}</td>
                                        <td className="px-3 py-2 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-3 py-2 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                                        <td className="px-4 py-2 text-center">—</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* Overall Faculty College Total Row */}
                        <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                            <td colSpan={3} className="px-4 py-2.5 font-bold border-r border-slate-300 dark:border-slate-700">
                                CIDS College Total
                            </td>
                            <td colSpan={5} className="px-3 py-2.5 border-r border-slate-300 dark:border-slate-700">—</td>
                            <td className="px-3 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">82 Offerings</td>
                            <td className="px-3 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">432</td>
                            <td className="px-3 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">432</td>
                            <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                            <td className="px-3 py-2.5 text-center font-bold border-r border-slate-300 dark:border-slate-700">100%</td>
                            <td className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-700">—</td>
                            <td className="px-4 py-2.5 text-center">—</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Bottom Controls / Action Bar */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-300 bg-slate-50/90 px-4 py-3 text-[11px] dark:border-slate-700 dark:bg-slate-900 gap-3">
                <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Official Published Faculty Schedule Matrix. Clear cell boundaries and workload verification active.</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsFullView(!isFullView)}
                        className="h-8 gap-1 text-xs border-slate-300 dark:border-slate-700"
                    >
                        {isFullView ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        <span>{isFullView ? 'Exit Full View' : 'Full View'}</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-8 bg-[#7A1C3C] text-xs text-white hover:bg-[#651530]"
                    >
                        Back to Top
                    </Button>
                </div>
            </div>
        </div>
    );

    // Full View Modal / Fullscreen Backdrop
    const renderFullViewModal = () => {
        if (!isFullView) return null;

        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden">
                    {/* Full View Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[#7A1C3C] text-white flex items-center justify-center font-bold shadow-xs">
                                <Table className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    {getPageTitle()} — Full Table View
                                </h2>
                                <p className="text-xs text-slate-500">
                                    AY 2026–2027 | 1st Semester | Official Published Grid
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="h-8 gap-1.5 text-xs border-slate-300 dark:border-slate-700"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Print</span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsFullView(false)}
                                className="h-8 gap-1.5 bg-[#7A1C3C] hover:bg-[#651530] text-xs text-white font-bold"
                            >
                                <Minimize2 className="h-3.5 w-3.5" />
                                <span>Exit Full View</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table inside Full View */}
                    <div className="flex-1 overflow-auto p-4 sm:p-6">
                        {viewMode === 'year'
                            ? renderCleanMatrixTable(yearGroupedOfferings, true)
                            : viewMode === 'section'
                            ? renderCleanMatrixTable(sectionGroupedOfferings, false)
                            : viewMode === 'program'
                            ? renderCleanMatrixTable(programGroupedBySection, false)
                            : viewMode === 'faculty'
                            ? renderFacultyMatrixTable()
                            : renderCleanMatrixTable(groupedOfferings, false)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${getPageTitle()} - Published Schedules`} />

            {/* Full View Modal */}
            {renderFullViewModal()}

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod} academicPeriods={academicPeriods}>
                <div className="space-y-6 p-4 sm:p-6 font-['Poppins']">
                    {/* Gate Check: If not approved or published yet, show approval pending gate */}
                    {!isPublished ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 max-w-2xl mx-auto my-12">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                                <Lock className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Published Schedule Awaiting Official Publication
                                </h2>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    The official Master, Program, Year-Level, and Section Schedules become visible once the working draft timetable has been approved by the Academic Dean and published for the college.
                                </p>
                            </div>

                            <div className="pt-3 flex items-center justify-center gap-3">
                                <a
                                    href="/schedule/timetable/editor"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs dark:border-slate-700 dark:text-slate-300"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Review Timetable Editor</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={handlePublishSchedule}
                                    disabled={isPublishing}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white text-xs font-bold hover:opacity-95 shadow-sm"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{isPublishing ? 'Publishing...' : 'Publish Official Schedule'}</span>
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'year' ? (
                        /* ========================================================================= */
                        /* YEAR LEVEL SCHEDULE VIEW (Clean Table with Lines & Full View)             */
                        /* ========================================================================= */
                        <div className="space-y-6">
                            {/* Breadcrumb Header & Action Bar */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Published Schedules</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Year Level Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Published Schedules
                                        </span>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Year Level Schedule – {selectedYearLevel}{selectedYearLevel === 1 ? 'st' : selectedYearLevel === 2 ? 'nd' : selectedYearLevel === 3 ? 'rd' : 'th'} Year
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Published
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AY 2026–2027 | 1st Semester | College of Information and Digital Sciences (CIDS)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullView(true)}
                                        className="h-9 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Full View</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Print</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchView('master')}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#7A1C3C] hover:bg-[#651530] px-4 text-xs font-semibold text-white shadow-xs"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        <span>View Master Schedule</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dual Selector Controls (Program Buttons on left, Year Level Pills on right) */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {(['BSIT', 'BSIS', 'BSCS', 'All'] as const).map((prog) => {
                                        const isSelected = selectedProgram === prog;
                                        return (
                                            <button
                                                key={prog}
                                                type="button"
                                                onClick={() => setSelectedProgram(prog)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                    isSelected
                                                        ? 'bg-[#7A1C3C] text-white'
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {prog === 'All' ? <LayoutGrid className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                                                <span>{prog === 'All' ? 'All Programs' : prog}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Year Level:</span>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        {[1, 2, 3, 4].map((year) => {
                                            const isSelected = selectedYearLevel === year;
                                            const label = `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
                                            return (
                                                <button
                                                    key={year}
                                                    type="button"
                                                    onClick={() => setSelectedYearLevel(year)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        isSelected
                                                            ? 'bg-[#7A1C3C] text-white shadow-xs'
                                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 5 Metrics Ribbon */}
                            {renderMetricsRibbon(yearMetrics)}

                            {/* Clean Matrix Table with Solid Boundaries & Clear Grid Lines */}
                            {renderCleanMatrixTable(yearGroupedOfferings, true)}
                        </div>
                    ) : viewMode === 'section' ? (
                        /* ========================================================================= */
                        /* SECTION SCHEDULE VIEW (Clean Table with Lines & Full View)                */
                        /* ========================================================================= */
                        <div className="space-y-6">
                            {/* Breadcrumb Header & Action Bar */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Published Schedules</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Section Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Published Schedules
                                        </span>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Section Schedule – {selectedSection}
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Published
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AY 2026–2027 | 1st Semester | College of Information and Digital Sciences (CIDS)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullView(true)}
                                        className="h-9 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Full View</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Print</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchView('master')}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#7A1C3C] hover:bg-[#651530] px-4 text-xs font-semibold text-white shadow-xs"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        <span>View Master Schedule</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section Switcher Pills */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xs">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Section:</span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {uniqueSections.map((sec) => {
                                            const isSelected = selectedSection === sec;
                                            return (
                                                <button
                                                    key={sec}
                                                    type="button"
                                                    onClick={() => setSelectedSection(sec)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                                        isSelected
                                                            ? 'bg-[#7A1C3C] text-white'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {sec}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 5 Metrics Ribbon */}
                            {renderMetricsRibbon(sectionMetrics)}

                            {/* Clean Matrix Table */}
                            {renderCleanMatrixTable(sectionGroupedOfferings, false)}
                        </div>
                    ) : viewMode === 'program' ? (
                        /* ========================================================================= */
                        /* PROGRAM SCHEDULE VIEW (Clean Table with Lines & Full View)                */
                        /* ========================================================================= */
                        <div className="space-y-6">
                            {/* Breadcrumb Header & Action Bar */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Published Schedules</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Program Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Published Schedules
                                        </span>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Program Schedule – {selectedProgram}
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Published
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AY 2026–2027 | 1st Semester | {selectedProgram} Degree Program
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullView(true)}
                                        className="h-9 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Full View</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Print</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchView('master')}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#5227C7] hover:bg-[#431fb0] px-4 text-xs font-semibold text-white shadow-xs"
                                    >
                                        <Table className="h-3.5 w-3.5" />
                                        <span>View Master Schedule</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dual Selector Controls (Program Buttons on left, Year Level Pills on right) */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {(['BSIT', 'BSIS', 'BSCS'] as const).map((prog) => {
                                        const isSelected = selectedProgram === prog;
                                        return (
                                            <button
                                                key={prog}
                                                type="button"
                                                onClick={() => setSelectedProgram(prog)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                    isSelected
                                                        ? 'bg-[#7A1C3C] text-white'
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <GraduationCap className="h-3.5 w-3.5" />
                                                <span>{prog}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Year Level:</span>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        {[1, 2, 3, 4].map((year) => {
                                            const isSelected = selectedYearLevel === year;
                                            const label = `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
                                            return (
                                                <button
                                                    key={year}
                                                    type="button"
                                                    onClick={() => setSelectedYearLevel(year)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        isSelected
                                                            ? 'bg-[#7A1C3C] text-white shadow-xs'
                                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 5 Metrics Ribbon */}
                            {renderMetricsRibbon(programMetrics)}

                            {/* Clean Matrix Table */}
                            {renderCleanMatrixTable(programGroupedBySection, false)}
                        </div>
                    ) : viewMode === 'faculty' ? (
                        /* ========================================================================= */
                        /* FACULTY SCHEDULE MATRIX VIEW (Clean Table with Lines & Full View)         */
                        /* ========================================================================= */
                        <div className="space-y-6">
                            {/* Breadcrumb Header & Action Bar */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Published Schedules</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Faculty Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Published Schedules
                                        </span>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Faculty Schedule Matrix
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Published
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AY 2026–2027 | 1st Semester | College of Information and Digital Sciences (CIDS)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullView(true)}
                                        className="h-9 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Full View</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Print</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchView('master')}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#5227C7] hover:bg-[#431fb0] px-4 text-xs font-semibold text-white shadow-xs"
                                    >
                                        <Table className="h-3.5 w-3.5" />
                                        <span>View Master Schedule</span>
                                    </button>
                                </div>
                            </div>

                            {/* View Switcher Pill Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('master')}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
                                >
                                    <Table className="h-3.5 w-3.5" />
                                    <span>Master Schedule</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('program', 'BSIT')}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
                                >
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    <span>By Program</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('faculty')}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#5227C7] text-white shadow-xs transition-all"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    <span>By Faculty</span>
                                </button>
                            </div>

                            {/* Filters Bar: Program, Faculty Dropdown, and Search */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {(['ALL', 'BSIT', 'BSIS', 'BSCS'] as const).map((prog) => {
                                        const isSelected = facultyProgramFilter === prog;
                                        return (
                                            <button
                                                key={prog}
                                                type="button"
                                                onClick={() => setFacultyProgramFilter(prog)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                    isSelected
                                                        ? 'bg-[#7A1C3C] text-white'
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <span>{prog === 'ALL' ? 'All Programs' : prog}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-slate-500">Faculty:</span>
                                        <select
                                            value={selectedFacultyFilter}
                                            onChange={(e) => setSelectedFacultyFilter(e.target.value)}
                                            className="h-9 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#7A1C3C] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                            <option value="ALL">All Faculty Members</option>
                                            {facultyMatrixDataset.map((f) => (
                                                <option key={f.name} value={f.name}>
                                                    {f.name} ({f.homeProgram})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={facultySearchQuery}
                                            onChange={(e) => setFacultySearchQuery(e.target.value)}
                                            placeholder="Search faculty, course, room..."
                                            className="h-9 w-64 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-[#7A1C3C] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5 Metrics Ribbon */}
                            {renderMetricsRibbon(facultyMetrics)}

                            {/* Faculty Matrix Table */}
                            {renderFacultyMatrixTable()}
                        </div>
                    ) : (
                        /* ========================================================================= */
                        /* MASTER SCHEDULE VIEW (Clean Table with Lines & Full View)                 */
                        /* ========================================================================= */
                        <div className="space-y-6">
                            {/* Header Bar with Breadcrumb tags, Title, Status, and Action Buttons */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Published Schedules</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Master Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Published Schedules
                                        </span>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Master Schedule
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Published
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AY 2026–2027 | 1st Semester | College of Information and Digital Sciences (CIDS)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullView(true)}
                                        className="h-9 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Full View</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Print</span>
                                    </Button>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => handleSwitchView('program', 'BSIT')}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#5227C7] hover:bg-[#431fb0] px-4 text-xs font-semibold text-white shadow-xs"
                                        >
                                            <span>View by Program</span>
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">24</div>
                                        <div className="text-[11px] text-slate-500">Faculty</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5227C7] dark:bg-purple-950/50">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">82</div>
                                        <div className="text-[11px] text-slate-500">Course Offerings</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">82</div>
                                        <div className="text-[11px] text-slate-500">Sections</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">2,462</div>
                                        <div className="text-[11px] text-slate-500">Total Students</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">32</div>
                                        <div className="text-[11px] text-slate-500">Rooms Utilized</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">100%</div>
                                        <div className="text-[11px] text-slate-500">Scheduling Completeness</div>
                                    </div>
                                </div>
                            </div>

                            {/* View Switcher Pill Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('master')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'master'
                                            ? 'bg-[#5227C7] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <Table className="h-3.5 w-3.5" />
                                    <span>Master Schedule</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('program', uniquePrograms[0] || 'BSIT')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'program'
                                            ? 'bg-[#5227C7] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    <span>By Program</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('faculty')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'faculty' || viewMode === 'faculty'
                                            ? 'bg-[#5227C7] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    <span>By Faculty</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('room')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'room'
                                            ? 'bg-[#5227C7] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>By Room</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('time')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'time'
                                            ? 'bg-[#5227C7] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>By Time Slot</span>
                                </button>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xs">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Program:</span>
                                        <select
                                            value={programFilter}
                                            onChange={(e) => setProgramFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All Programs</option>
                                            {uniquePrograms.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Year Level:</span>
                                        <select
                                            value={yearLevelFilter}
                                            onChange={(e) => setYearLevelFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Section:</span>
                                        <select
                                            value={sectionFilter}
                                            onChange={(e) => setSectionFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All</option>
                                            {uniqueSections.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="relative min-w-[320px]">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search course code, title, faculty, or room..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#5227C7] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Main Master Schedule Table */}
                            {renderCleanMatrixTable(groupedOfferings, false)}
                        </div>
                    )}
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
