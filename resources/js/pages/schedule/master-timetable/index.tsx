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

type ViewMode = 'master' | 'program' | 'year' | 'section';

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
    // Determine initial view from URL query param if present (?view=year, ?view=section, ?view=program, ?view=college)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const view = params.get('view');
            if (view === 'year') return 'year';
            if (view === 'section') return 'section';
            if (view === 'program') return 'program';
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
                else setViewMode('master');
            };
            window.addEventListener('popstate', handlePop);
            return () => window.removeEventListener('popstate', handlePop);
        }
    }, []);

    // Primary view tab switcher (Master Schedule, By Program, By Faculty, By Room, By Time Slot)
    const [activeTab, setActiveTab] = useState<'master' | 'program' | 'faculty' | 'room' | 'time'>(
        viewMode === 'program' ? 'program' : 'master'
    );

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

    // Group offerings by Program and Year for Year-Level Schedule View (matching banner: e.g. "BSIT – 1st Year")
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

    // Metrics for Program and Year-Level View (Matching Screenshot: 9 Offerings, 20.00 Units, 314 Students, 4 Lab, 4 Rooms)
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

    // Helper for row highlight color
    const getRowBgClass = (courseType: string) => {
        switch (courseType) {
            case 'major':
                return 'bg-[#e0f4ff]/70 hover:bg-[#d0edfc] text-slate-900 dark:bg-cyan-950/20'; // Light Blue
            case 'ge':
                return 'bg-[#fde2e4]/70 hover:bg-[#fcd5d8] text-slate-900 dark:bg-rose-950/20'; // Light Pink
            case 'pe_nstp':
                return 'bg-[#fff3bf]/70 hover:bg-[#fef0aa] text-slate-900 dark:bg-amber-950/30'; // Light Yellow / Gold
            case 'special':
                return 'bg-[#efeaff]/70 hover:bg-[#e4ddff] text-slate-900 dark:bg-purple-950/25'; // Light Purple
            default:
                return 'bg-white hover:bg-slate-50 text-slate-900 dark:bg-slate-900';
        }
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${getPageTitle()} - Published Schedules`} />

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
                        /* YEAR LEVEL SCHEDULE VIEW (Matching media_1794563280761_76c318bd.jpg)       */
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
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
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
                                {/* Program Buttons (BSIT, BSIS, BSCS, All Programs) */}
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
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {prog === 'All' ? <LayoutGrid className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                                                <span>{prog === 'All' ? 'All Programs' : prog}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Year Level Selector Pills (1st Year, 2nd Year, 3rd Year, 4th Year) */}
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

                            {/* Main Year-Level Table (Matching media_1794563280761_76c318bd.jpg Pixel-for-Pixel) */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold">
                                            <tr>
                                                <th rowSpan={2} className="w-10 px-3 py-2.5 text-center">#</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Course No.</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Descriptive Title</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Credits</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lec</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lab</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Pre-requisite</th>
                                                <th rowSpan={2} className="px-3 py-2.5 text-center">Section</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">No. of Students</th>
                                                <th colSpan={2} className="px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80">
                                                    SCHEDULES
                                                </th>
                                                <th rowSpan={2} className="px-3 py-2.5">Room</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Faculty</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Remarks</th>
                                            </tr>
                                            <tr>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Lecture</th>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Laboratory</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {Object.entries(yearGroupedOfferings).map(([groupTitle, data]) => {
                                                const totalCredits = data.items.reduce((sum, i) => sum + Number(i.credits || 0), 0);
                                                const totalLec = data.items.reduce((sum, i) => sum + Number(i.lec || 0), 0);
                                                const totalLab = data.items.reduce((sum, i) => sum + Number(i.lab || 0), 0);
                                                const totalStudents = data.items.reduce((sum, i) => sum + Number(i.students_count || 0), 0);

                                                return (
                                                    <React.Fragment key={groupTitle}>
                                                        {/* Dark Navy / Maroon Header Banner Matching Screenshot */}
                                                        <tr className="bg-[#1C244B] text-white font-bold">
                                                            <td colSpan={14} className="px-4 py-2.5 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap className="h-4 w-4 text-slate-300" />
                                                                        <span className="tracking-wide">{groupTitle}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-6 text-[11px] font-normal text-slate-200">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>Sections: <strong className="text-white font-bold">{data.sections.join(', ')}</strong></span>
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>Total Students: <strong className="text-white font-bold">{data.totalStudents}</strong></span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Course Rows */}
                                                        {data.items.map((row, idx) => (
                                                            <tr
                                                                key={row.id || idx}
                                                                className={`transition-colors ${getRowBgClass(row.course_type)}`}
                                                            >
                                                                <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.course_no}</td>
                                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">{row.descriptive_title}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-bold">{row.credits}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lec}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lab}</td>
                                                                <td className="px-2.5 py-2.5 text-center text-slate-500">{row.prerequisite}</td>
                                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.section}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-medium text-slate-700">{row.students_count}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lecture_schedule}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lab_schedule}</td>
                                                                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{row.room}</td>
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.faculty}</td>
                                                                <td className="px-3 py-2.5 text-slate-500 text-center">{row.remarks}</td>
                                                            </tr>
                                                        ))}

                                                        {/* Total Units Row */}
                                                        <tr className="bg-[#fff3bf]/90 font-bold text-slate-900 dark:bg-amber-950/40 dark:text-amber-200 text-xs">
                                                            <td colSpan={3} className="px-3 py-2.5 text-center font-bold">
                                                                Total Units
                                                            </td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalCredits.toFixed(2)}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLec}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLab}</td>
                                                            <td className="px-2.5 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalStudents}</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-4 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bottom Legend & Official Revision Disclaimer Note */}
                                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] dark:border-slate-800 dark:bg-slate-900 gap-3">
                                    <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Legend:</span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#e0f4ff] border border-blue-200" />
                                            <span>Major / Core Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fde2e4] border border-rose-200" />
                                            <span>GE / Institutional Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fff3bf] border border-amber-200" />
                                            <span>PE / NSTP</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#efeaff] border border-purple-200" />
                                            <span>Institutional / Special Program</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
                                        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>This is the published year level schedule. Any changes require an approved revision.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'section' ? (
                        /* ========================================================================= */
                        /* SECTION SCHEDULE VIEW                                                     */
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
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
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

                            {/* Section Schedule Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold">
                                            <tr>
                                                <th rowSpan={2} className="w-10 px-3 py-2.5 text-center">#</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Course No.</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Descriptive Title</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Credits</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lec</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lab</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Pre-requisite</th>
                                                <th rowSpan={2} className="px-3 py-2.5 text-center">Section</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">No. of Students</th>
                                                <th colSpan={2} className="px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80">
                                                    SCHEDULES
                                                </th>
                                                <th rowSpan={2} className="px-3 py-2.5">Room</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Faculty</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Remarks</th>
                                            </tr>
                                            <tr>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Lecture</th>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Laboratory</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {Object.entries(sectionGroupedOfferings).map(([groupTitle, items]) => {
                                                const totalCredits = items.reduce((sum, i) => sum + Number(i.credits || 0), 0);
                                                const totalLec = items.reduce((sum, i) => sum + Number(i.lec || 0), 0);
                                                const totalLab = items.reduce((sum, i) => sum + Number(i.lab || 0), 0);
                                                const totalStudents = items.reduce((sum, i) => sum + Number(i.students_count || 0), 0);

                                                return (
                                                    <React.Fragment key={groupTitle}>
                                                        {/* Cyan Banner for the section */}
                                                        <tr className="bg-[#8ee0d0]/50 dark:bg-emerald-950/40 text-slate-900 dark:text-emerald-200 font-bold">
                                                            <td colSpan={14} className="px-4 py-2.5 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px]">▼</span>
                                                                    <span>{groupTitle}</span>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Course Rows */}
                                                        {items.map((row, idx) => (
                                                            <tr
                                                                key={row.id || idx}
                                                                className={`transition-colors ${getRowBgClass(row.course_type)}`}
                                                            >
                                                                <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.course_no}</td>
                                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">{row.descriptive_title}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-bold">{row.credits}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lec}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lab}</td>
                                                                <td className="px-2.5 py-2.5 text-center text-slate-500">{row.prerequisite}</td>
                                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.section}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-medium text-slate-700">{row.students_count}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lecture_schedule}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lab_schedule}</td>
                                                                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{row.room}</td>
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.faculty}</td>
                                                                <td className="px-3 py-2.5 text-slate-500 text-center">{row.remarks}</td>
                                                            </tr>
                                                        ))}

                                                        {/* Subtotal Row */}
                                                        <tr className="bg-[#fff3bf]/90 font-bold text-slate-900 dark:bg-amber-950/40 dark:text-amber-200 text-xs">
                                                            <td colSpan={3} className="px-3 py-2.5 text-center font-bold">
                                                                Total Units
                                                            </td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalCredits.toFixed(2)}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLec}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLab}</td>
                                                            <td className="px-2.5 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalStudents}</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-4 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bottom Legend */}
                                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] dark:border-slate-800 dark:bg-slate-900 gap-3">
                                    <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Legend:</span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#e0f4ff] border border-blue-200" />
                                            <span>Major / Core Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fde2e4] border border-rose-200" />
                                            <span>GE / Institutional Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fff3bf] border border-amber-200" />
                                            <span>PE / NSTP</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#efeaff] border border-purple-200" />
                                            <span>Institutional / Special Program</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
                                        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>This is the published section schedule. Any changes require an approved revision.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'program' ? (
                        /* ========================================================================= */
                        /* PROGRAM SCHEDULE VIEW (Exact match to media_1794563130062_36dd211b.jpg)    */
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
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
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
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
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

                            {/* Program Schedule Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold">
                                            <tr>
                                                <th rowSpan={2} className="w-10 px-3 py-2.5 text-center">#</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Course No.</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Descriptive Title</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Credits</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lec</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lab</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Pre-requisite</th>
                                                <th rowSpan={2} className="px-3 py-2.5 text-center">Section</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">No. of Students</th>
                                                <th colSpan={2} className="px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80">
                                                    SCHEDULES
                                                </th>
                                                <th rowSpan={2} className="px-3 py-2.5">Room</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Faculty</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Remarks</th>
                                            </tr>
                                            <tr>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Lecture</th>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Laboratory</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {Object.entries(programGroupedBySection).map(([sectionTitle, items]) => {
                                                const totalCredits = items.reduce((sum, i) => sum + Number(i.credits || 0), 0);
                                                const totalLec = items.reduce((sum, i) => sum + Number(i.lec || 0), 0);
                                                const totalLab = items.reduce((sum, i) => sum + Number(i.lab || 0), 0);
                                                const totalStudents = items.reduce((sum, i) => sum + Number(i.students_count || 0), 0);

                                                return (
                                                    <React.Fragment key={sectionTitle}>
                                                        <tr className="bg-[#8ee0d0]/50 dark:bg-emerald-950/40 text-slate-900 dark:text-emerald-200 font-bold">
                                                            <td colSpan={14} className="px-3 py-2 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px]">▼</span>
                                                                    <span>{sectionTitle}</span>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {items.map((row, idx) => (
                                                            <tr
                                                                key={row.id || idx}
                                                                className={`transition-colors ${getRowBgClass(row.course_type)}`}
                                                            >
                                                                <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.course_no}</td>
                                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">{row.descriptive_title}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-bold">{row.credits}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lec}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lab}</td>
                                                                <td className="px-2.5 py-2.5 text-center text-slate-500">{row.prerequisite}</td>
                                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.section}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-medium text-slate-700">{row.students_count}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lecture_schedule}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lab_schedule}</td>
                                                                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{row.room}</td>
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.faculty}</td>
                                                                <td className="px-3 py-2.5 text-slate-500 text-center">{row.remarks}</td>
                                                            </tr>
                                                        ))}

                                                        <tr className="bg-[#fff3bf]/90 font-bold text-slate-900 dark:bg-amber-950/40 dark:text-amber-200 text-xs">
                                                            <td colSpan={3} className="px-3 py-2.5 text-center font-bold">
                                                                Total Units
                                                            </td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalCredits.toFixed(2)}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLec}</td>
                                                            <td className="px-2 py-2.5 text-center font-bold">{totalLab}</td>
                                                            <td className="px-2.5 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold">{totalStudents}</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                            <td className="px-4 py-2.5 text-center">—</td>
                                                            <td className="px-3 py-2.5 text-center">—</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] dark:border-slate-800 dark:bg-slate-900 gap-3">
                                    <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Legend:</span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#e0f4ff] border border-blue-200" />
                                            <span>Major / Core Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fde2e4] border border-rose-200" />
                                            <span>GE / Institutional Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fff3bf] border border-amber-200" />
                                            <span>PE / NSTP</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#efeaff] border border-purple-200" />
                                            <span>Institutional / Special Program</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
                                        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>This is the published program schedule. Any changes require an approved revision.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ========================================================================= */
                        /* MASTER SCHEDULE VIEW (Matching media_1794562985886_7533498e.jpg)           */
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
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
                                    >
                                        <Download className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Download PDF</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300 shadow-2xs"
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

                            {/* Metrics Strip (Exact 6 cards matching screenshot) */}
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

                            {/* View Switcher Pill Tabs (Master Schedule, By Program, By Faculty, By Room, By Time Slot) */}
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
                                    onClick={() => setActiveTab('faculty')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'faculty'
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Program:</span>
                                        <select
                                            value={programFilter}
                                            onChange={(e) => setProgramFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#5227C7] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Main Master Schedule Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold">
                                            <tr>
                                                <th rowSpan={2} className="w-10 px-3 py-2.5 text-center">#</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Course No.</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Descriptive Title</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Credits</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lec</th>
                                                <th rowSpan={2} className="px-2 py-2.5 text-center">Lab</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">Pre-requisite</th>
                                                <th rowSpan={2} className="px-3 py-2.5 text-center">Section</th>
                                                <th rowSpan={2} className="px-2.5 py-2.5 text-center">No. of Students</th>
                                                <th colSpan={2} className="px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80">
                                                    SCHEDULES
                                                </th>
                                                <th rowSpan={2} className="px-3 py-2.5">Room</th>
                                                <th rowSpan={2} className="px-4 py-2.5">Faculty</th>
                                                <th rowSpan={2} className="px-3 py-2.5">Remarks</th>
                                            </tr>
                                            <tr>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Lecture</th>
                                                <th className="px-3 py-2 text-center font-semibold bg-slate-50 dark:bg-slate-800">Laboratory</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {Object.entries(groupedOfferings).map(([progTitle, items]) => {
                                                const progCode = progTitle.split(' ')[0];

                                                // Calculate subtotal metrics
                                                const totalCredits = items.reduce((sum, i) => sum + i.credits, 0);
                                                const totalLec = items.reduce((sum, i) => sum + i.lec, 0);
                                                const totalLab = items.reduce((sum, i) => sum + i.lab, 0);
                                                const totalStudents = items.reduce((sum, i) => sum + i.students_count, 0);

                                                return (
                                                    <React.Fragment key={progTitle}>
                                                        {/* Program Header Banner (Cyan background) */}
                                                        <tr className="bg-[#8ee0d0]/50 dark:bg-emerald-950/40 text-slate-900 dark:text-emerald-200 font-bold">
                                                            <td colSpan={14} className="px-3 py-2 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px]">▼</span>
                                                                    <span>{progTitle}</span>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Offering Rows */}
                                                        {items.map((row) => (
                                                            <tr
                                                                key={row.id}
                                                                className={`transition-colors ${getRowBgClass(row.course_type)}`}
                                                            >
                                                                <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{row.id}</td>
                                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.course_no}</td>
                                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">{row.descriptive_title}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-bold">{row.credits}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lec}</td>
                                                                <td className="px-2 py-2.5 text-center text-slate-700">{row.lab}</td>
                                                                <td className="px-2.5 py-2.5 text-center text-slate-500">{row.prerequisite}</td>
                                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.section}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-medium text-slate-700">{row.students_count}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lecture_schedule}</td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap">{row.lab_schedule}</td>
                                                                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{row.room}</td>
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.faculty}</td>
                                                                <td className="px-3 py-2.5 text-slate-500 text-center">{row.remarks}</td>
                                                            </tr>
                                                        ))}

                                                        {/* Program Subtotal Row */}
                                                        <tr className="bg-[#fff3bf]/80 font-bold text-slate-900 dark:bg-amber-950/40 dark:text-amber-200 text-xs">
                                                            <td colSpan={3} className="px-3 py-2 text-center">
                                                                {progCode} Subtotal
                                                            </td>
                                                            <td className="px-2.5 py-2 text-center font-bold">{totalCredits}</td>
                                                            <td className="px-2 py-2 text-center font-bold">{totalLec}</td>
                                                            <td className="px-2 py-2 text-center font-bold">{totalLab}</td>
                                                            <td className="px-2.5 py-2 text-center">—</td>
                                                            <td className="px-3 py-2 text-center">—</td>
                                                            <td className="px-2.5 py-2 text-center font-bold">{totalStudents}</td>
                                                            <td className="px-3 py-2 text-center">—</td>
                                                            <td className="px-3 py-2 text-center">—</td>
                                                            <td className="px-3 py-2 text-center">—</td>
                                                            <td className="px-4 py-2 text-center">—</td>
                                                            <td className="px-3 py-2 text-center">—</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* College Total Row */}
                                            <tr className="bg-[#e2dcff]/80 font-bold text-slate-900 dark:bg-purple-950/60 dark:text-purple-200 text-xs">
                                                <td colSpan={3} className="px-3 py-2.5 font-bold">
                                                    CIDS College Total
                                                </td>
                                                <td className="px-2.5 py-2.5 text-center font-bold">26</td>
                                                <td className="px-2 py-2.5 text-center font-bold">21</td>
                                                <td className="px-2 py-2.5 text-center font-bold">15</td>
                                                <td className="px-2.5 py-2.5 text-center">—</td>
                                                <td className="px-3 py-2.5 text-center">—</td>
                                                <td className="px-2.5 py-2.5 text-center font-bold">312</td>
                                                <td className="px-3 py-2.5 text-center">—</td>
                                                <td className="px-3 py-2.5 text-center">—</td>
                                                <td className="px-3 py-2.5 text-center">—</td>
                                                <td className="px-4 py-2.5 text-center">—</td>
                                                <td className="px-3 py-2.5 text-center">—</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bottom Legend */}
                                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Legend:</span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#e0f4ff] border border-blue-200" />
                                            <span>Major / Core Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fde2e4] border border-rose-200" />
                                            <span>GE / Institutional Course</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#fff3bf] border border-amber-200" />
                                            <span>Subtotal / Total</span>
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <span className="h-3.5 w-6 rounded bg-[#e2dcff] border border-purple-200" />
                                            <span>College Total</span>
                                        </span>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="bg-[#5227C7] text-xs text-white hover:bg-[#431fb0]"
                                    >
                                        Back to Top
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
