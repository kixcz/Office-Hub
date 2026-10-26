import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Calendar,
    Megaphone,
    Layers,
    GraduationCap,
    Users,
    Monitor,
    ClipboardCheck,
    Sparkles,
    CheckSquare,
    Tv,
    Projector,
    Activity,
    BookCheckIcon,
    ClipboardEdit,
    LibraryBig,
    Star,
    AlertTriangle,
    FileCheck,
    BookOpen,
    Trophy,
    UserCircle,
    Clock,
    FileText,
    Inbox,
    Building2,
    Bell,
    Bot,
    FolderKanban,
    CalendarDays,
    FileUp,
    Briefcase,
    RefreshCw,
    BarChart3,
    ArrowLeftRight,
    ShieldAlert,
    Send,
    Award,
    History,
    ShieldCheck,
    CheckCheckIcon,
    UserRoundCog,
    LucideMessageSquareText,
    NotebookIcon,
    Beaker,
    SquareChartGantt,
    MegaphoneIcon,
    SquareActivity,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Super Admin Navigation Groups (System-wide configuration, master data, TV display studio, system admin)
const adminNavGroups: NavGroup[] = [
    {
        title: 'SYSTEM MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Announcements', url: '/announcements', icon: MegaphoneIcon },
            { title: 'College Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: SquareChartGantt },
        ],
    },
    {
        title: 'ACADEMIC STRUCTURE',
        items: [
            { title: 'Programs & Curriculum', url: '/programs', icon: GraduationCap },
            { title: 'Courses', url: '/courses', icon: BookOpen },
            { title: 'Sections', url: '/sections', icon: Layers },
            { title: 'Course Offerings', url: '/course-offerings', icon: CalendarDays },
        ],
    },
    {
        title: 'FACULTY OPERATIONS',
        items: [
            { title: 'Faculty Members', url: '/faculties', icon: Users },
            { title: 'Faculty Workload', url: '/operations/faculty-workload', icon: Briefcase },
            { title: 'Make-Up Classes', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
        ],
    },
    {
        title: 'COORDINATION',
        items: [
            { title: 'Meetings', url: '/schedule/meetings', icon: Projector },
            { title: 'Activities', url: '/schedule/activities', icon: Activity },
            { title: 'Tasks & Projects', url: '/tasks', icon: BookCheckIcon },
        ],
    },
    {
        title: 'LABORATORY & FACILITIES',
        items: [
            { title: 'Rooms & Labs', url: '/facilities/rooms', icon: Building2 },
            { title: 'Lab Inventory', url: '/facilities/lab-inventory', icon: Monitor },
            { title: 'Lab Monitoring', url: '/classroom-monitoring', icon: SquareActivity },
            { title: 'Lab In-Charge', url: '/operations/lab-in-charge', icon: Users },
            { title: 'Room Utilization', url: '/operations/room-utilization', icon: BarChart3 },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle },
        ],
    },
    {
        title: 'COMPLIANCE',
        items: [
            { title: 'Requirements', url: '/compliance/requirements', icon: LibraryBig },
            { title: 'Submission Records', url: '/compliance/submissions', icon: FileCheck },
            { title: 'Pending Outputs', url: '/compliance/pending-outputs', icon: ClipboardEdit, badge: 12 },
            { title: 'Compliance Tracker', url: '/compliance/tracker', icon: CheckSquare },
        ],
    },
    {
        title: 'PERFORMANCE & RECOGNITION',
        items: [
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Star },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recognition Rules', url: '/performance/rules', icon: BookOpen },
        ],
    },
    // {
    //     title: 'REPORTS & ANALYTICS',
    //     items: [
    //         { title: 'College Reports', url: '/performance/faculty', icon: Star },
    //         { title: 'Attendance Reports', url: '/performance/program', icon: Trophy },
    //         { title: 'Laboratory Reports', url: '/performance/rules', icon: BookOpen },
    //         { title: 'Workload Reports', url: '/performance/rules', icon: BookOpen },
    //         { title: 'Compliance  Reports', url: '/performance/rules', icon: BookOpen },
    //         { title: 'Executive  Reports', url: '/performance/rules', icon: BookOpen },
    //     ],
    // },
    {
        title: 'SCHEDULING & OR-TOOLS',
        items: [
            { title: 'Schedule Generator', url: '/schedule/generator', icon: Sparkles },
        ],
    },
    {
        title: 'TV DISPLAY STUDIO',
        items: [
            { title: 'TV Workspace', url: '/tv-config/dashboard', icon: Tv },
        ],
    },
];

// Program Head Navigation Groups (Program Operational Command Center)
const programHeadNavGroups: NavGroup[] = [
    {
        title: 'PROGRAM OPERATIONS',
        items: [
            { title: 'Command Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Program Faculty', url: '/faculties', icon: Users },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Program Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings & Activities', url: '/schedule/meetings', icon: Projector },
            { title: 'Classroom & Lab Mon.', url: '/classroom-monitoring', icon: Monitor },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle },
        ],
    },
    {
        title: 'PROGRAM SCHEDULING',
        items: [
            { title: 'Faculty Loading', url: '/schedule/loading', icon: Briefcase },
            { title: 'Schedule Candidates', url: '/schedule/generator?tab=candidates', icon: Sparkles },
            { title: 'Program Head Review', url: '/schedule/reviews?role=program_head', icon: FileCheck },
            { title: 'Review Flags & Notes', url: '/schedule/reviews?tab=flags', icon: ShieldAlert },
            { title: 'Program Master Schedule', url: '/schedule/master-timetable?view=program', icon: CalendarDays },
            { title: 'Swap Requests Review', url: '/schedule/adjustments?tab=requests', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'ACADEMIC MONITORING',
        items: [
            { title: 'Compliance Tracker', url: '/compliance/tracker', icon: CheckSquare },
            { title: 'Pending Outputs', url: '/compliance/pending-outputs', icon: ClipboardEdit },
            { title: 'Make-Up Classes', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Lab / Room Utilization', url: '/operations/room-utilization', icon: BarChart3 },
        ],
    },
    {
        title: 'RESEARCH & EXCELLENCE',
        items: [
            { title: 'Faculty Accomplishments', url: '/accomplishments', icon: Award },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recommend Spotlight', url: '/tv-config/spotlight', icon: Sparkles },
            { title: 'Program Reports', url: '/performance/faculty/report', icon: FileText },
        ],
    },
];

// Dean Navigation Groups (College-Wide Executive Oversight & Approvals)
const deanNavGroups: NavGroup[] = [
    {
        title: 'COLLEGE EXECUTIVE',
        items: [
            { title: 'College Executive Dash.', url: '/dashboard', icon: LayoutGrid },
            { title: 'College Faculty Directory', url: '/faculties', icon: Users },
            { title: 'College Programs', url: '/programs', icon: GraduationCap },
            { title: 'College Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Executive Meetings', url: '/schedule/meetings', icon: Projector },
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
        ],
    },
    {
        title: 'COLLEGE SCHEDULING',
        items: [
            { title: 'Faculty Loading Oversight', url: '/operations/faculty-workload', icon: Briefcase },
            { title: 'Candidate Consultation', url: '/schedule/generator?tab=candidates', icon: Sparkles },
            { title: 'Dean Schedule Review', url: '/schedule/reviews?role=dean', icon: FileCheck },
            { title: 'Review Flags & AI Summary', url: '/schedule/reviews?tab=flags', icon: ShieldAlert },
            { title: 'Master College Timetable', url: '/schedule/master-timetable?view=college', icon: CalendarDays },
            { title: 'Adjustment Batch Approval', url: '/schedule/adjustments?tab=batches', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'COLLEGE OVERSIGHT',
        items: [
            { title: 'College Compliance Overview', url: '/compliance/tracker', icon: CheckSquare },
            { title: 'Faculty Attendance Monitor', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Make-Up Class Approvals', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'College Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Room & Lab Utilization', url: '/operations/room-utilization', icon: BarChart3 },
            { title: 'Facility Issues', url: '/operations/facility-reports', icon: AlertTriangle },
        ],
    },
    {
        title: 'PERFORMANCE & ACCREDITATION',
        items: [
            { title: 'College Performance', url: '/performance/program', icon: Trophy },
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Star },
            { title: 'Accomplishment Portfolios', url: '/accomplishments', icon: Award },
            { title: 'Institutional Spotlights', url: '/tv-config/spotlight', icon: Sparkles },
            { title: 'College Reports', url: '/performance/faculty/report', icon: FileText },
        ],
    },
];

// Faculty Self-Service Navigation Groups
const facultyNavGroups: NavGroup[] = [
    {
        title: 'MY WORK',
        items: [
            { title: 'Dashboard', url: '/faculty/dashboard', icon: LayoutGrid },
            { title: 'My Profile', url: '/faculty/profile', icon: UserCircle },
            { title: 'Teaching Load', url: '/faculty/loading', icon: Briefcase },
            { title: 'Class Schedule', url: '/faculty/schedule', icon: CalendarDays },
            { title: 'My Exam Schedules', url: '/faculty/exam-schedules', icon: BookOpen },
            { title: 'My Attendance', url: '/faculty/attendance', icon: ClipboardCheck },
            { title: 'Make-Up Classes', url: '/faculty/make-up-classes', icon: RefreshCw },
            { title: 'Faculty Availability', url: '/faculty/availability', icon: Clock },
            { title: 'My Calendar', url: '/faculty/calendar', icon: Calendar },
        ],
    },
    {
        title: 'SUBMISSIONS & COMPLIANCE',
        items: [
            { title: 'My Requirements', url: '/faculty/requirements', icon: LibraryBig },
            { title: 'My Submissions', url: '/faculty/submissions', icon: FileUp },
        ],
    },
    {
        title: 'PROJECTS & ENGAGEMENT',
        items: [
            { title: 'Tasks & Projects', url: '/faculty/tasks', icon: BookCheckIcon },
            { title: 'Research & Extension', url: '/faculty/research-extension', icon: FolderKanban },
            { title: 'Meetings & Events', url: '/faculty/meetings', icon: Projector },
            { title: 'Accomplishments', url: '/faculty/accomplishments', icon: Trophy },
        ],
    },
    {
        title: 'RECORDS & SERVICES',
        items: [
            { title: 'My Documents', url: '/faculty/documents', icon: FileText },
            { title: 'Requests & Corrections', url: '/faculty/corrections', icon: Inbox },
        ],
    },
    {
        title: 'COMMUNICATION',
        items: [
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
            { title: 'Notifications', url: '/faculty/notifications', icon: Bell },
        ],
    },
    {
        title: 'TOOLS',
        items: [
            { title: 'Gemini Assistant', url: '/dashboard', icon: Bot },
        ],
    },
];

// Lab In-Charge Navigation Groups (Operational Workspace)
const labInChargeNavGroups: NavGroup[] = [
    {
        title: 'OPERATIONS',
        items: [
            { title: 'Dashboard', url: '/monitoring/lab-in-charge?tab=dashboard', icon: LayoutGrid },
            // { title: 'Live Lab Monitoring', url: '/monitoring/lab-in-charge?tab=live', icon: Monitor },
            { title: 'Lab Schedules', url: '/monitoring/lab-in-charge?tab=schedules', icon: CalendarDays },
            { title: 'Lab Attendance', url: '/monitoring/lab-in-charge?tab=attendance', icon: NotebookIcon },
            { title: 'EOD Reports', url: '/monitoring/lab-in-charge/end-of-day', icon: ClipboardCheck },
            
        ],
    },
    {
        title: 'MONITORING & RECORDS',
        items: [
            { title: 'Alerts & Incidents', url: '/monitoring/lab-in-charge?tab=alerts', icon: AlertTriangle, badge: 0 },
            { title: 'Monitoring History', url: '/monitoring/lab-in-charge?tab=history', icon: History },
        ],
    },
    {
        title: 'COMMUNICATION',
        items: [
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
        ],
    },
   
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const contentRef = useRef<HTMLDivElement>(null);
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user as any;

    const roles: string[] = user?.roles || [];
    const isProgramHead = roles.includes('Program Head') || roles.includes('Program Chair');
    const isDean = roles.includes('Dean');
    const isCollegeAdmin = roles.includes('College Admin') || roles.includes('System Administrator') || roles.includes('Super Admin');
    const isInstitutionAdmin = roles.includes('Institution Super Admin');
    const isVpaf = roles.includes('VPAF / Executive Oversight');
    const isLabInCharge = roles.includes('Lab In-Charge') || roles.includes('Head Lab / Facility In-Charge') || roles.includes('Non-Teaching Lab / Facility In-Charge');
    const isFaculty = user?.is_faculty || roles.includes('Faculty Member');

    const canSwitchWorkspace = (isProgramHead || isDean || isCollegeAdmin || isInstitutionAdmin) && isFaculty;

    // Workspace mode state: 'management' | 'faculty'
    const [workspaceMode, setWorkspaceMode] = useState<'management' | 'faculty'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('officehub_workspace_mode');
            if (saved === 'faculty' || saved === 'management') return saved;
        }
        if (url.startsWith('/faculty/')) return 'faculty';
        return 'management';
    });

    // Update localStorage when mode changes
    const toggleWorkspace = (mode: 'management' | 'faculty') => {
        setWorkspaceMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('officehub_workspace_mode', mode);
        }
    };

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const savedScroll = sessionStorage.getItem('officehub_sidebar_scroll');
        if (savedScroll) {
            el.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
            sessionStorage.setItem('officehub_sidebar_scroll', el.scrollTop.toString());
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Resolve active navigation group
    let groups: NavGroup[] = adminNavGroups;

    if (canSwitchWorkspace && workspaceMode === 'faculty') {
        groups = facultyNavGroups;
    } else if (isProgramHead) {
        groups = programHeadNavGroups;
    } else if (isDean) {
        groups = deanNavGroups;
    } else if (isLabInCharge && !isCollegeAdmin && !isInstitutionAdmin) {
        groups = labInChargeNavGroups;
    } else if (isFaculty && !isCollegeAdmin && !isInstitutionAdmin) {
        groups = facultyNavGroups;
    } else {
        groups = adminNavGroups;
    }

    const managementTitle = isInstitutionAdmin
        ? 'Institution Super Admin'
        : isVpaf
        ? 'VPAF Executive Oversight'
        : isProgramHead
        ? 'Program Head Workspace'
        : isDean
        ? 'Dean Executive Workspace'
        : 'College Admin Workspace';

    const managementShort = isInstitutionAdmin
        ? 'ISA'
        : isVpaf
        ? 'VP'
        : isProgramHead
        ? 'PH'
        : isDean
        ? 'DN'
        : 'CA';

    const managementLabel = isInstitutionAdmin
        ? 'Institution Admin'
        : isVpaf
        ? 'VPAF Exec'
        : isProgramHead
        ? 'Program Head'
        : isDean
        ? 'Dean Oversight'
        : 'College Admin';

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="top-16 h-[calc(100svh-4rem)] border-r border-border/80 bg-sidebar">
            {/* Seamless Dual-Role Workspace Switcher for Program Heads, Deans, and College Admins */}
            {canSwitchWorkspace && (
                <div scroll-region="true" className="p-3 border-b border-border/60 group-data-[collapsible=icon]:p-1 shrink-0 bg-muted/30">
                    <div className="flex flex-col gap-1.5 group-data-[collapsible=icon]:items-center">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
                            <span>Workspace View</span>
                            <span className="text-amber-500 font-extrabold">
                                {workspaceMode === 'faculty' ? 'Faculty Portal' : managementLabel}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-background border border-border group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col">
                            <button
                                type="button"
                                onClick={() => toggleWorkspace('management')}
                                className={`text-[11px] font-bold py-1 px-2 rounded-md transition-all text-center truncate ${
                                    workspaceMode === 'management'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title={managementTitle}
                            >
                                <span className="group-data-[collapsible=icon]:hidden">
                                    {managementLabel}
                                </span>
                                <span className="hidden group-data-[collapsible=icon]:inline text-xs font-bold">
                                    {managementShort}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleWorkspace('faculty')}
                                className={`text-[11px] font-bold py-1 px-2 rounded-md transition-all text-center truncate ${
                                    workspaceMode === 'faculty'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Faculty Self-Service Portal"

                            >
                                <span className="group-data-[collapsible=icon]:hidden">Faculty Portal</span>
                                <span className="hidden group-data-[collapsible=icon]:inline text-xs font-bold">FAC</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SidebarContent ref={contentRef} className="pt-2 scrollbar-none">
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
