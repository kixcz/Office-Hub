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
    Palette,
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
    Sliders,
    Database,
    Shield,
    SlidersHorizontal,
    Settings,
    Key,
    Globe,
    FileStack,
    Cpu,
    FileCheck2,
    School,
    Network,
    Compass,
    FileSearch,
    MapPin,
    Plane,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Super Admin Navigation Groups (System-wide configuration, master data, TV display studio, system admin)
const adminNavGroups: NavGroup[] = [
    {
        title: 'SYSTEM MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid, description: 'Overview and workspace metrics.' },
            { title: 'Announcements', url: '/announcements', icon: MegaphoneIcon, description: 'College bulletins and official updates.' },
            { title: 'College Calendar', url: '/schedule/calendar', icon: Calendar, description: 'Unified schedule of collegiate events.' },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: SquareChartGantt, description: 'Academic terms and timelines.' },
        ],
    },
    {
        title: 'ACADEMIC STRUCTURE',
        items: [
            { title: 'Programs & Curriculum', url: '/programs', icon: GraduationCap, description: 'Degree programs and curriculum versions.' },
            { title: 'Courses', url: '/courses', icon: BookOpen, description: 'Subject catalog and syllabus definitions.' },
            { title: 'Sections', url: '/sections', icon: Layers, description: 'Class sections and student cohort batches.' },
            { title: 'Course Offerings', url: '/course-offerings', icon: CalendarDays, description: 'Term subject offerings and load allocation.' },
        ],
    },
    {
        title: 'FACULTY OPERATIONS',
        items: [
            { title: 'Faculty Members', url: '/faculties', icon: Users, description: 'Faculty directory, ranks, and assignments.' },
            { title: 'Compliance', url: '/compliance/requirements', icon: CheckSquare, description: 'Faculty clearance and submission trackers.' },
            { title: 'Locator Slips', url: '/operations/locator-slips', icon: MapPin, description: 'Track official business and faculty movement.' },
            { title: 'Travel Orders', url: '/operations/travel-orders', icon: Plane, description: 'Official travel authorizations and records.' },
            { title: 'Faculty Workload', url: '/operations/faculty-workload', icon: Briefcase, description: 'Teaching loads, prep hours, and units.' },
            { title: 'Make-Up Classes', url: '/operations/make-up-classes', icon: RefreshCw, description: 'Review and approve compensatory sessions.' },
            { title: 'Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays, description: 'Midterm and final exam schedules and proctors.' },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck, description: 'Daily attendance logs and DTR reconciliation.' },
        ],
    },
    {
        title: 'COORDINATION',
        items: [
            { title: 'Meetings', url: '/schedule/meetings', icon: Projector, description: 'Departmental meetings and conferences.' },
            { title: 'Activities', url: '/schedule/activities', icon: Activity, description: 'Extracurricular and academic activities.' },
            { title: 'Tasks & Projects', url: '/tasks', icon: BookCheckIcon, description: 'Collaborative tasks and workflow projects.' },
        ],
    },
    {
        title: 'LABORATORY & FACILITIES',
        items: [
            { title: 'Rooms & Labs', url: '/facilities/rooms', icon: Building2, description: 'Classrooms, computer laboratories, and studios.' },
            { title: 'Lab Inventory', url: '/facilities/lab-inventory', icon: Monitor, description: 'Workstations, hardware assets, and peripherals.' },
            { title: 'Lab Monitoring', url: '/classroom-monitoring', icon: SquareActivity, description: 'Real-time room occupancy and inspection logs.' },
            { title: 'Lab In-Charge', url: '/operations/lab-in-charge', icon: Users, description: 'Laboratory custodians and duty rosters.' },
            { title: 'Room Utilization', url: '/operations/room-utilization', icon: BarChart3, description: 'Facility occupancy and room efficiency rates.' },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle, description: 'Maintenance issues and incident logs.' },
        ],
    },
    {
        title: 'PERFORMANCE & RECOGNITION',
        items: [
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Star, description: 'Performance evaluations and recognition.' },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy, description: 'Accreditation scores and student milestones.' },
            { title: 'Recognition Rules', url: '/performance/rules', icon: BookOpen, description: 'Configure criteria for awards and spot check.' },
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
            { title: 'Schedule Generator', url: '/schedule/generator', icon: Sparkles, description: 'Automated timetable generation and conflict resolution.' },
        ],
    },
    {
        title: 'COLLEGE SETTINGS & BRAND',
        items: [
            { title: 'Brand & Visual Theme', url: '/college/settings/branding', icon: Palette, description: 'Customize college theme, colors, and logos.' },
        ],
    },
    {
        title: 'TV DISPLAY STUDIO',
        items: [
            { title: 'TV Workspace', url: '/tv-config/dashboard', icon: Tv, description: 'Configure public displays and digital signage.' },
        ],
    },
];

// Institution Super Admin Navigation Groups (Central Platform Governor & Organizational Architect of Ascend)
const institutionSuperAdminNavGroups: NavGroup[] = [
    {
        title: 'INSTITUTION SUPER ADMIN',
        items: [
            { title: 'Dashboard', url: '/institution/dashboard', icon: LayoutGrid, description: 'Platform oversight and institutional metrics.' },
        ],
    },
    {
        title: 'ORGANIZATION',
        items: [
            { title: 'Institution Profile', url: '/institution/profile', icon: Building2, description: 'Institutional identity, charters, and seal.' },
            { title: 'Entities & Campuses', url: '/institution/colleges?view=entities', icon: MapPin, description: 'Campuses, branches, and academic units.' },
            { title: 'Colleges', url: '/institution/colleges?view=colleges', icon: School, description: 'Configure colleges, programs, and leadership.' },
            { title: 'Organization Structure', url: '/institution/colleges?view=tree', icon: Network, description: 'Institutional hierarchy and reporting tree.' },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: SquareChartGantt, description: 'University-wide academic terms and calendars.' },
        ],
    },
    {
        title: 'USERS & ACCESS',
        items: [
            { title: 'Users', url: '/institution/users', icon: Users, description: 'Canonical identities and system user accounts.' },
            { title: 'Roles & Permissions', url: '/institution/roles', icon: ShieldCheck, description: 'Role definitions and platform access permissions.' },
            { title: 'Scoped Role Assignments', url: '/institution/scoped-roles?tab=assignments', icon: Key, description: 'Multi-role appointments across scopes.' },
            { title: 'Administrator Assignments', url: '/institution/scoped-roles?tab=leadership', icon: UserRoundCog, description: 'Deans, secretaries, and unit executives.' },
            { title: 'Access Requests', url: '/institution/scoped-roles?tab=requests', icon: Inbox, description: 'Review and manage user access requests.' },
        ],
    },
    {
        title: 'PLATFORM CONFIGURATION',
        items: [
            { title: 'Modules', url: '/institution/modules?tab=modules', icon: Layers, description: 'Enable, lock, and enforce platform capabilities.' },
            { title: 'Terminology', url: '/institution/terminology', icon: LucideMessageSquareText, description: 'Custom labels, names, and academic terms.' },
            { title: 'Feature Flags', url: '/institution/modules?tab=flags', icon: Sparkles, description: 'Manage progressive rollouts and experimental flags.' },
            { title: 'Policies & Standards', url: '/institution/policies', icon: FileStack, description: 'Institutional standards and academic guidelines.' },
            { title: 'Workflow Builder', url: '/institution/workflows', icon: ArrowLeftRight, description: 'Configure routing and multi-tier approval chains.' },
            { title: 'Global Defaults', url: '/institution/global-defaults', icon: SlidersHorizontal, description: 'Platform-wide configuration and behavior defaults.' },
        ],
    },
    {
        title: 'ACADEMIC GOVERNANCE',
        items: [
            { title: 'Program Portfolio', url: '/institution/academic-governance?tab=programs', icon: GraduationCap, description: 'Portfolio review of institutional degrees.' },
            { title: 'Curriculum Oversight', url: '/institution/academic-governance?tab=curricula', icon: LibraryBig, description: 'Curriculum version approval and pacing.' },
            { title: 'Course Catalog Oversight', url: '/institution/academic-governance?tab=courses', icon: BookOpen, description: 'University-wide master course inventory.' },
            { title: 'Scheduling Oversight', url: '/institution/academic-governance?tab=scheduling', icon: CalendarDays, description: 'Cross-college timetable health and conflicts.' },
        ],
    },
    {
        title: 'DATA & INTEGRATIONS',
        items: [
            { title: 'Data Sources', url: '/institution/integrations?tab=sources', icon: Database, description: 'Connected databases and student information feeds.' },
            { title: 'Google Workspace', url: '/institution/integrations?tab=google', icon: Globe, description: 'Google Workspace directory and calendar sync.' },
            { title: 'External Systems', url: '/institution/integrations?tab=external', icon: Cpu, description: 'Third-party APIs and enterprise webhook connectors.' },
            { title: 'AI & Document Understanding', url: '/institution/integrations?tab=ai', icon: Bot, description: 'Gemini AI models and document extraction.' },
            { title: 'Sync & Reconciliation', url: '/institution/integrations?tab=reconciliation', icon: RefreshCw, description: 'Data reconciliation and schedule sync jobs.' },
            { title: 'Integration Health', url: '/institution/integrations?tab=health', icon: Activity, description: 'Status and latencies of external services.' },
        ],
    },
    {
        title: 'REPORTS & QUALITY',
        items: [
            { title: 'Institution Reports', url: '/institution/reports?tab=reports', icon: FileText, description: 'Executive summaries and institutional analytics.' },
            { title: 'Report Templates', url: '/institution/reports?tab=templates', icon: FileCheck2, description: 'Document schemas and official header templates.' },
            { title: 'Data Quality', url: '/institution/data-quality?tab=data-quality', icon: ShieldAlert, description: 'Identify data anomalies and orphaned records.' },
            { title: 'Configuration Health', url: '/institution/data-quality?tab=config-health', icon: CheckCheckIcon, description: 'Audit readiness of colleges and modules.' },
        ],
    },
    {
        title: 'COMMUNICATIONS',
        items: [
            { title: 'Institution Announcements', url: '/announcements', icon: MegaphoneIcon, description: 'Broadcast university-wide announcements.' },
            { title: 'Institution Calendar', url: '/schedule/calendar', icon: Calendar, description: 'Comprehensive calendar of campus events.' },
            { title: 'Institution TV Workspace', url: '/tv-config/dashboard', icon: Tv, description: 'Central public display networks and feeds.' },
        ],
    },
    {
        title: 'SECURITY & GOVERNANCE',
        items: [
            { title: 'Audit Logs', url: '/institution/audit?tab=audit', icon: FileSearch, description: 'Immutable trail of administrative events.' },
            { title: 'Activity Logs', url: '/institution/audit?tab=activity', icon: SquareActivity, description: 'Real-time user actions and sign-ins.' },
            { title: 'Change History', url: '/institution/audit?tab=changes', icon: History, description: 'Revision logs of platform data objects.' },
            { title: 'Privacy & Security', url: '/institution/audit?tab=security', icon: Shield, description: 'Authentication security and session hygiene.' },
            { title: 'Data Retention', url: '/institution/audit?tab=retention', icon: Clock, description: 'Archival schedules and lifecycle rules.' },
            { title: 'System Settings', url: '/institution/audit?tab=system', icon: Settings },
        ],
    },
];

// VPAA / Academic Executive Navigation Groups (Institution Academic Oversight)
const vpaaNavGroups: NavGroup[] = [
    {
        title: 'VPAA / ACADEMIC EXECUTIVE',
        items: [
            { title: 'Dashboard', url: '/vpaa/dashboard', icon: LayoutGrid },
        ],
    },
    {
        title: 'ACADEMIC OVERVIEW',
        items: [
            { title: 'Colleges & Programs', url: '/vpaa/academic-overview?tab=colleges-programs', icon: Building2 },
            { title: 'Academic Performance', url: '/vpaa/academic-overview?tab=performance', icon: BarChart3 },
            { title: 'Risk & Attention Center', url: '/vpaa/academic-overview?tab=risks', icon: AlertTriangle },
            { title: 'Academic Decision Support', url: '/vpaa/academic-overview?tab=decision-support', icon: Sparkles },
        ],
    },
    {
        title: 'CURRICULUM & PROGRAMS',
        items: [
            { title: 'Program Portfolio', url: '/vpaa/curriculum-programs?tab=portfolio', icon: GraduationCap },
            { title: 'Curriculum Oversight', url: '/vpaa/curriculum-programs?tab=curriculum', icon: BookOpen },
            { title: 'Course Offerings', url: '/vpaa/curriculum-programs?tab=offerings', icon: Layers },
            { title: 'Program Status & Readiness', url: '/vpaa/curriculum-programs?tab=readiness', icon: CheckSquare },
        ],
    },
    {
        title: 'FACULTY & INSTRUCTION',
        items: [
            { title: 'Faculty Workload', url: '/vpaa/faculty-instruction?tab=workload', icon: Briefcase },
            { title: 'Faculty Attendance', url: '/vpaa/faculty-instruction?tab=attendance', icon: ClipboardCheck },
            { title: 'Instructional Completion', url: '/vpaa/faculty-instruction?tab=completion', icon: Clock },
            { title: 'Faculty Loading', url: '/vpaa/faculty-instruction?tab=loading', icon: Users },
            { title: 'Make-Up Classes', url: '/vpaa/faculty-instruction?tab=make-up', icon: RefreshCw },
        ],
    },
    {
        title: 'SCHEDULING & EXAMS',
        items: [
            { title: 'Scheduling Readiness', url: '/vpaa/scheduling-exams?tab=readiness', icon: CalendarDays },
            { title: 'Published Schedules', url: '/vpaa/scheduling-exams?tab=published', icon: Calendar },
            { title: 'Schedule Conflicts', url: '/vpaa/scheduling-exams?tab=conflicts', icon: ShieldAlert },
            { title: 'Exam Monitoring', url: '/vpaa/scheduling-exams?tab=exams', icon: BookOpen },
            { title: 'Academic Calendar', url: '/vpaa/scheduling-exams?tab=calendar', icon: Projector },
        ],
    },
    {
        title: 'COMPLIANCE & QUALITY',
        items: [
            { title: 'Academic Compliance', url: '/vpaa/compliance-quality?tab=academic-compliance', icon: CheckSquare },
            { title: 'Requirement Performance', url: '/vpaa/compliance-quality?tab=requirements', icon: LibraryBig },
            { title: 'Program Quality Indicators', url: '/vpaa/compliance-quality?tab=quality-indicators', icon: Star },
            { title: 'Accreditation / Evidence Readiness', url: '/vpaa/compliance-quality?tab=accreditation', icon: ShieldCheck },
        ],
    },
    {
        title: 'RESEARCH & EXTENSION',
        items: [
            { title: 'Research Overview', url: '/vpaa/research-extension?tab=overview', icon: BookOpen },
            { title: 'Extension Overview', url: '/vpaa/research-extension?tab=extension', icon: FolderKanban },
            { title: 'Academic Outputs', url: '/vpaa/research-extension?tab=outputs', icon: Trophy },
        ],
    },
    {
        title: 'REPORTS',
        items: [
            { title: 'Academic Executive Reports', url: '/vpaa/reports?tab=executive', icon: FileText },
            { title: 'College Comparison Reports', url: '/vpaa/reports?tab=comparison', icon: BarChart3 },
            { title: 'Faculty & Instruction Reports', url: '/vpaa/reports?tab=faculty', icon: Briefcase },
            { title: 'Scheduling Reports', url: '/vpaa/reports?tab=scheduling', icon: CalendarDays },
            { title: 'Consolidated Academic Report', url: '/vpaa/reports?tab=consolidated', icon: FileCheck },
        ],
    },
    {
        title: 'TV & COMMUNICATIONS',
        items: [
            { title: 'Executive TV', url: '/vpaa/tv-communications?tab=executive-tv', icon: Tv },
            { title: 'Channel Switcher', url: '/vpaa/tv-communications?tab=switcher', icon: Projector },
            { title: 'College TV Channels', url: '/vpaa/tv-communications?tab=college-channels', icon: Monitor },
            { title: 'Academic Highlights', url: '/vpaa/tv-communications?tab=highlights', icon: Sparkles },
        ],
    },
];

// VPAF / Executive Workspace Navigation Groups (Executive, Comparative, and Decision-Oriented)
const vpafNavGroups: NavGroup[] = [
    {
        title: 'VPAF / EXECUTIVE WORKSPACE',
        items: [
            { title: 'Dashboard', url: '/vpaf/dashboard', icon: LayoutGrid },
        ],
    },
    {
        title: 'EXECUTIVE ANALYTICS',
        items: [
            { title: 'College & Campus Overview', url: '/vpaf/analytics?tab=overview', icon: Building2 },
            { title: 'Performance Comparison', url: '/vpaf/analytics?tab=comparison', icon: BarChart3 },
            { title: 'Risk & Attention Center', url: '/vpaf/analytics?tab=risks', icon: AlertTriangle },
            { title: 'Decision Support', url: '/vpaf/analytics?tab=decision-support', icon: Sparkles },
        ],
    },
    {
        title: 'ACADEMIC OPERATIONS',
        items: [
            { title: 'Faculty Workload', url: '/vpaf/academic-operations?tab=workload', icon: Briefcase },
            { title: 'Faculty Attendance', url: '/vpaf/academic-operations?tab=attendance', icon: ClipboardCheck },
            { title: 'Instructional Completion', url: '/vpaf/academic-operations?tab=completion', icon: Clock },
            { title: 'Scheduling Readiness', url: '/vpaf/academic-operations?tab=scheduling', icon: CalendarDays },
            { title: 'Exam & Make-Up Overview', url: '/vpaf/academic-operations?tab=exams-makeups', icon: RefreshCw },
        ],
    },
    {
        title: 'COMPLIANCE & QUALITY',
        items: [
            { title: 'Compliance Overview', url: '/vpaf/compliance-quality?tab=overview', icon: CheckSquare },
            { title: 'Requirement Performance', url: '/vpaf/compliance-quality?tab=requirements', icon: LibraryBig },
            { title: 'Accreditation / Evidence Status', url: '/vpaf/compliance-quality?tab=accreditation', icon: Award },
            { title: 'Quality Indicators', url: '/vpaf/compliance-quality?tab=quality-indicators', icon: ShieldCheck },
        ],
    },
    {
        title: 'FACILITIES & RESOURCES',
        items: [
            { title: 'Facility Utilization', url: '/vpaf/facilities-resources?tab=utilization', icon: Building2 },
            { title: 'Laboratory Status', url: '/vpaf/facilities-resources?tab=laboratories', icon: Monitor },
            { title: 'Inventory & Equipment', url: '/vpaf/facilities-resources?tab=inventory', icon: Layers },
            { title: 'Maintenance & Incidents', url: '/vpaf/facilities-resources?tab=maintenance', icon: AlertTriangle },
            { title: 'Resource Needs', url: '/vpaf/facilities-resources?tab=resource-needs', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'RESEARCH & EXTENSION',
        items: [
            { title: 'Research Portfolio', url: '/vpaf/research-extension?tab=research', icon: BookOpen },
            { title: 'Extension Portfolio', url: '/vpaf/research-extension?tab=extension', icon: FolderKanban },
            { title: 'Publications & Outputs', url: '/vpaf/research-extension?tab=publications', icon: Trophy },
            { title: 'Partnerships', url: '/vpaf/research-extension?tab=partnerships', icon: Globe },
        ],
    },
    {
        title: 'PROJECTS & INITIATIVES',
        items: [
            { title: 'Institutional Projects', url: '/vpaf/projects-initiatives?tab=institutional', icon: Star },
            { title: 'Cross-College Projects', url: '/vpaf/projects-initiatives?tab=cross-college', icon: Network },
            { title: 'Project Performance', url: '/vpaf/projects-initiatives?tab=performance', icon: Activity },
        ],
    },
    {
        title: 'REPORTS',
        items: [
            { title: 'Executive Reports', url: '/vpaf/reports?tab=executive', icon: FileText },
            { title: 'College Comparison Reports', url: '/vpaf/reports?tab=comparison', icon: BarChart3 },
            { title: 'Academic Operations Reports', url: '/vpaf/reports?tab=academic-operations', icon: Briefcase },
            { title: 'Compliance Reports', url: '/vpaf/reports?tab=compliance', icon: CheckSquare },
            { title: 'Resource Reports', url: '/vpaf/reports?tab=resources', icon: Building2 },
            { title: 'Consolidated Institution Report', url: '/vpaf/reports?tab=consolidated', icon: FileCheck2 },
        ],
    },
    {
        title: 'TV & COMMUNICATIONS',
        items: [
            { title: 'Executive TV', url: '/vpaf/tv-communications?tab=executive-tv', icon: Tv },
            { title: 'Channel Switcher', url: '/vpaf/tv-communications?tab=switcher', icon: Projector },
            { title: 'College TV Channels', url: '/vpaf/tv-communications?tab=college-channels', icon: Monitor },
            { title: 'Institution Highlights', url: '/vpaf/tv-communications?tab=highlights', icon: Sparkles },
        ],
    },
];

// Program Head Navigation Groups (Program Operational Command Center)
const programHeadNavGroups: NavGroup[] = [
    {
        title: 'PROGRAM OPERATIONS',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
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
            { title: 'Requirements', url: '/compliance/requirements', icon: LibraryBig },
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
            { title: 'College Overview', url: '/dashboard', icon: LayoutGrid },
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
            { title: 'College Requirements', url: '/compliance/requirements', icon: LibraryBig },
            { title: 'Locator Slips', url: '/operations/locator-slips', icon: MapPin },
            { title: 'Travel Orders', url: '/operations/travel-orders', icon: Plane },
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
    const isVpaa = roles.includes('VPAA / Academic Executive');
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

    const activePortalType = props.portal_context?.active_assignment?.portal_type;

    // Resolve active navigation group based on the active portal context
    let groups: NavGroup[] = adminNavGroups;

    if (activePortalType === 'faculty') {
        groups = facultyNavGroups;
    } else if (activePortalType === 'vpaa') {
        groups = vpaaNavGroups;
    } else if (activePortalType === 'vpaf') {
        groups = vpafNavGroups;
    } else if (activePortalType === 'institution_super_admin') {
        groups = institutionSuperAdminNavGroups;
    } else if (activePortalType === 'program_head') {
        groups = programHeadNavGroups;
    } else if (activePortalType === 'dean') {
        groups = deanNavGroups;
    } else if (activePortalType === 'lab_in_charge') {
        groups = labInChargeNavGroups;
    } else if (activePortalType === 'college_admin') {
        groups = adminNavGroups;
    } else if (isInstitutionAdmin) {
        groups = institutionSuperAdminNavGroups;
    } else if (isVpaa) {
        groups = vpaaNavGroups;
    } else if (isVpaf) {
        groups = vpafNavGroups;
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
