import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    SlidersHorizontal,
    BookOpen,
    Users,
    FlaskConical,
    Settings2,
    Search,
    Plus,
    Filter,
    LayoutGrid,
    List,
    Clock,
    Layers,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    AlertTriangle,
    X,
    Edit3,
    Copy,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    FileCheck,
    Scale,
    ShieldAlert,
    Trash2,
    Calendar,
    Briefcase,
    GraduationCap,
    Info,
    MoreHorizontal,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Load Policies', href: '/schedule/policies' },
];

export interface PolicyItem {
    id: string;
    name: string;
    subtitle: string;
    type: 'Teaching' | 'Laboratory' | 'Designation' | 'Research' | 'Extension' | 'Limit';
    applicableTo: string;
    status: 'Active' | 'Draft' | 'Inactive';
    lastUpdated: string;
    targetLoad?: number;
    minLoad?: number;
    maxLoad?: number;
    prepTime?: string;
    coverage?: string;
    description: string;
}

export interface DesignationRuleItem {
    id: string;
    name: string;
    subtitle: string;
    appliesTo: 'Program' | 'Course' | 'College / Unit';
    designation: string;
    conditions: string[];
    priority: number;
    effectiveTerm: string;
    status: 'Active' | 'Inactive';
    requiredCredits: number;
    creditType: 'Credit (hrs)' | 'Units' | 'Fixed Allowance';
}

export interface CreditMappingItem {
    id: number;
    course_code: string;
    course_title: string;
    course_type: string;
    lecture_units: number;
    lab_units: number;
    total_credits: number;
    contact_hours: string;
    effective_term: string;
    status: 'Active' | 'Draft' | 'Pending Review';
    program_code: string;
}

export interface SpecialRuleItem {
    id: string;
    name: string;
    category: 'Course' | 'Faculty' | 'Time' | 'Laboratory' | 'Institutional';
    appliesTo: string;
    trigger: string;
    action: string;
    priority: number;
    effectiveTerm: string;
    status: 'Active' | 'Inactive';
    approvalRequired: boolean;
    notes?: string;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    creditMappings?: CreditMappingItem[];
    programs?: Array<{ id: number; code: string; name: string }>;
    initialTab?: 'policies' | 'designations' | 'credits' | 'special';
}

const DEFAULT_POLICIES: PolicyItem[] = [
    {
        id: 'POL-01',
        name: 'Standard Faculty Load',
        subtitle: 'Default teaching load policy',
        type: 'Teaching',
        applicableTo: 'All Faculty',
        status: 'Active',
        lastUpdated: 'Nov 10, 2026',
        targetLoad: 12,
        minLoad: 9,
        maxLoad: 15,
        prepTime: '1 hr per unique course',
        coverage: 'All faculty (regular)',
        description: 'Defines the standard teaching load, preparation count, and allowed range for regular faculty members.',
    },
    {
        id: 'POL-02',
        name: 'Laboratory Load Rule',
        subtitle: 'Lab-specific workload and credit',
        type: 'Laboratory',
        applicableTo: 'Lab Instructors',
        status: 'Active',
        lastUpdated: 'Nov 10, 2026',
        targetLoad: 15,
        minLoad: 12,
        maxLoad: 18,
        prepTime: '1.5 hrs per laboratory block',
        coverage: 'Computer & Hardware Labs',
        description: 'Governs computational contact hours vs credit conversions for laboratory and hands-on studio courses.',
    },
    {
        id: 'POL-03',
        name: 'Designation Load Adjustment',
        subtitle: 'Load reduction based on designation',
        type: 'Designation',
        applicableTo: 'Faculty with Designation',
        status: 'Active',
        lastUpdated: 'Nov 08, 2026',
        targetLoad: 6,
        minLoad: 3,
        maxLoad: 9,
        prepTime: 'Standard departmental rules',
        coverage: 'Deans, Program Heads & Coordinators',
        description: 'Administrative load release credits granted to faculty serving in leadership and coordinating roles.',
    },
    {
        id: 'POL-04',
        name: 'Research Credit Allocation',
        subtitle: 'Workload credit for approved research',
        type: 'Research',
        applicableTo: 'Research-Active Faculty',
        status: 'Active',
        lastUpdated: 'Nov 06, 2026',
        targetLoad: 3,
        minLoad: 3,
        maxLoad: 6,
        prepTime: 'Quarterly review verification',
        coverage: 'DSSC Funded & Externally Funded',
        description: 'Equivalent teaching load credit allocated for peer-reviewed research projects verified by R&E office.',
    },
    {
        id: 'POL-05',
        name: 'Extension Credit Allocation',
        subtitle: 'Workload credit for extension activities',
        type: 'Extension',
        applicableTo: 'Extension-Active Faculty',
        status: 'Active',
        lastUpdated: 'Nov 06, 2026',
        targetLoad: 3,
        minLoad: 3,
        maxLoad: 6,
        prepTime: 'Semestral deliverable validation',
        coverage: 'Adopted Communities & Outreach',
        description: 'Credit allocation granted for officially designated institutional extension community engagements.',
    },
    {
        id: 'POL-06',
        name: 'Minimum / Maximum Load',
        subtitle: 'Allowed load range per faculty',
        type: 'Limit',
        applicableTo: 'All Faculty',
        status: 'Active',
        lastUpdated: 'Nov 05, 2026',
        targetLoad: 18,
        minLoad: 12,
        maxLoad: 21,
        prepTime: 'Overload requires VPAA clearance',
        coverage: 'Full-time & Part-time Academic Staff',
        description: 'Institutional cap ensuring faculty do not exceed 21 credit units or drop below 12 statutory minimums.',
    },
];

const DEFAULT_DESIGNATIONS: DesignationRuleItem[] = [
    {
        id: 'DES-01',
        name: 'Program Chair Load Rule',
        subtitle: 'Load credit and reduction for program chair assignment.',
        appliesTo: 'Program',
        designation: 'Program Chair',
        conditions: ['Officially designated by the college dean', 'One (1) per program', 'With active assignment for the semester'],
        priority: 1,
        effectiveTerm: 'All Semesters',
        status: 'Active',
        requiredCredits: 6.0,
        creditType: 'Credit (hrs)',
    },
    {
        id: 'DES-02',
        name: 'Subject Coordinator Rule',
        subtitle: 'Preparation and coordination credit for subject coordinators.',
        appliesTo: 'Course',
        designation: 'Subject Coordinator',
        conditions: ['Assigned to a specific course', 'With ≥ 2 sections', 'Not concurrently Program Chair'],
        priority: 2,
        effectiveTerm: 'All Semesters',
        status: 'Active',
        requiredCredits: 3.0,
        creditType: 'Credit (hrs)',
    },
    {
        id: 'DES-03',
        name: 'Laboratory Instructor Rule',
        subtitle: 'Additional credit for handling laboratory classes.',
        appliesTo: 'Course',
        designation: 'Laboratory Instructor',
        conditions: ['Handles a laboratory course', 'Valid lab assignment', 'Class type = Laboratory'],
        priority: 2,
        effectiveTerm: 'All Semesters',
        status: 'Active',
        requiredCredits: 2.0,
        creditType: 'Credit (hrs)',
    },
    {
        id: 'DES-04',
        name: 'Clinical Supervisor Rule',
        subtitle: 'Supervision credit for clinical or on-the-job training (OJT).',
        appliesTo: 'Course',
        designation: 'Clinical Supervisor',
        conditions: ['Assigned to clinical/OJT course', 'With active partner institution', 'Max 1 clinical group per faculty'],
        priority: 2,
        effectiveTerm: 'All Semesters',
        status: 'Active',
        requiredCredits: 3.0,
        creditType: 'Credit (hrs)',
    },
];

const DEFAULT_SPECIAL_RULES: SpecialRuleItem[] = [
    {
        id: 'SPEC-01',
        name: 'Cross-listed Course Handling',
        category: 'Course',
        appliesTo: 'All Programs',
        trigger: 'Course is marked as cross-listed (same course code, multiple sections)',
        action: 'Link sections & share faculty assignment',
        priority: 1,
        effectiveTerm: '1st Sem, 2026-2027',
        status: 'Active',
        approvalRequired: false,
        notes: 'Automatically links sections of the same cross-listed course and shares the faculty assignment to avoid duplicate loading.',
    },
    {
        id: 'SPEC-02',
        name: 'Overload Approval Required',
        category: 'Faculty',
        appliesTo: 'All Faculty',
        trigger: 'Assigned load > 15 hrs/week',
        action: 'Require VPAA approval',
        priority: 2,
        effectiveTerm: '1st Sem, 2026-2027',
        status: 'Active',
        approvalRequired: true,
        notes: 'Flags any faculty allocation over 15 units directly into the VPAA Decision Support queue.',
    },
    {
        id: 'SPEC-03',
        name: 'Shared Faculty Restriction',
        category: 'Faculty',
        appliesTo: 'Multi-Program',
        trigger: 'Same faculty assigned to different programs',
        action: 'Prevent time conflict & enforce gap',
        priority: 2,
        effectiveTerm: '1st Sem, 2026-2027',
        status: 'Active',
        approvalRequired: false,
        notes: 'Enforces unified constraint checking so cross-program faculty teaching schedules cannot collide.',
    },
    {
        id: 'SPEC-04',
        name: 'Block Saturday Scheduling',
        category: 'Time',
        appliesTo: 'All Programs',
        trigger: 'Day = Saturday',
        action: 'Prevent regular class assignment',
        priority: 3,
        effectiveTerm: '1st Sem, 2026-2027',
        status: 'Active',
        approvalRequired: false,
        notes: 'Restricts Monday through Friday for undergraduate classes, reserving Saturdays for Masteral & Graduate cohorts.',
    },
    {
        id: 'SPEC-05',
        name: 'Minimum Laboratory Gap',
        category: 'Laboratory',
        appliesTo: 'Laboratory Courses',
        trigger: 'Consecutive lab classes of the same section',
        action: 'Enforce ≥ 1 hr gap',
        priority: 3,
        effectiveTerm: '1st Sem, 2026-2027',
        status: 'Active',
        approvalRequired: false,
        notes: 'Prevents mental fatigue by mandating a minimum lunch or rest window between intensive computing lab blocks.',
    },
];

export default function LoadPoliciesIndex({
    currentPeriod,
    academicPeriods = [],
    creditMappings = [],
    programs = [],
    initialTab = 'policies',
}: Props) {
    const [activeTab, setActiveTab] = useState<'policies' | 'designations' | 'credits' | 'special'>(initialTab);

    // Selected Policy for Right Inspection Panel (Tab 1)
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem>(DEFAULT_POLICIES[0]);
    const [policyInspectorTab, setPolicyInspectorTab] = useState<'overview' | 'rules' | 'applicability' | 'history'>('overview');

    // Right Drawer / Modal State for Designation (Tab 2)
    const [showDesignationDrawer, setShowDesignationDrawer] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<DesignationRuleItem | null>(null);

    // Right Drawer / Modal State for Credit Mapping (Tab 3)
    const [showCreditDrawer, setShowCreditDrawer] = useState(false);
    const [creditSearch, setCreditSearch] = useState('');
    const [creditProgramFilter, setCreditProgramFilter] = useState('all');
    const [creditTypeFilter, setCreditTypeFilter] = useState('all');

    // Right Drawer / Modal State for Special Rule (Tab 4)
    const [showSpecialRuleDrawer, setShowSpecialRuleDrawer] = useState(false);
    const [editingSpecialRule, setEditingSpecialRule] = useState<SpecialRuleItem | null>(null);

    // Filters for Tab 1
    const [policySearch, setPolicySearch] = useState('');
    const [policyTypeFilter, setPolicyTypeFilter] = useState('all');
    const [policyStatusFilter, setPolicyStatusFilter] = useState('all');

    // Filters for Tab 2
    const [designationSearch, setDesignationSearch] = useState('');
    const [designationTypeFilter, setDesignationTypeFilter] = useState('all');

    // Filters for Tab 4
    const [specialSearch, setSpecialSearch] = useState('');
    const [specialCategoryFilter, setSpecialCategoryFilter] = useState('all');

    // Filtered lists
    const filteredPolicies = useMemo(() => {
        return DEFAULT_POLICIES.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(policySearch.toLowerCase()) || p.description.toLowerCase().includes(policySearch.toLowerCase());
            const matchesType = policyTypeFilter === 'all' || p.type === policyTypeFilter;
            const matchesStatus = policyStatusFilter === 'all' || p.status === policyStatusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [policySearch, policyTypeFilter, policyStatusFilter]);

    const filteredDesignations = useMemo(() => {
        return DEFAULT_DESIGNATIONS.filter((d) => {
            const matchesSearch = d.name.toLowerCase().includes(designationSearch.toLowerCase()) || d.designation.toLowerCase().includes(designationSearch.toLowerCase());
            const matchesType = designationTypeFilter === 'all' || d.appliesTo === designationTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [designationSearch, designationTypeFilter]);

    const filteredCredits = useMemo(() => {
        return creditMappings.filter((c) => {
            const matchesSearch = c.course_code.toLowerCase().includes(creditSearch.toLowerCase()) || c.course_title.toLowerCase().includes(creditSearch.toLowerCase());
            const matchesProg = creditProgramFilter === 'all' || c.program_code === creditProgramFilter;
            const matchesType = creditTypeFilter === 'all' || c.course_type.toLowerCase().includes(creditTypeFilter.toLowerCase());
            return matchesSearch && matchesProg && matchesType;
        });
    }, [creditMappings, creditSearch, creditProgramFilter, creditTypeFilter]);

    const filteredSpecialRules = useMemo(() => {
        return DEFAULT_SPECIAL_RULES.filter((r) => {
            const matchesSearch = r.name.toLowerCase().includes(specialSearch.toLowerCase()) || r.action.toLowerCase().includes(specialSearch.toLowerCase());
            const matchesCat = specialCategoryFilter === 'all' || r.category === specialCategoryFilter;
            return matchesSearch && matchesCat;
        });
    }, [specialSearch, specialCategoryFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Load Policies - Semester Scheduling Workspace" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center shadow-xs">
                                    <SlidersHorizontal className="size-5 text-white" />
                                </span>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                        Load Policies
                                    </h1>
                                    <p className="text-xs text-gray-500">
                                        Define and manage faculty workload policies, credit mappings, and loading rules used in schedule generation and faculty loading.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl border-gray-200">
                                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                Policy Templates
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl border-gray-200">
                                <Download className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                Import Policy
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (activeTab === 'policies') {
                                        // add policy
                                    } else if (activeTab === 'designations') {
                                        setEditingDesignation(null);
                                        setShowDesignationDrawer(true);
                                    } else if (activeTab === 'credits') {
                                        setShowCreditDrawer(true);
                                    } else {
                                        setEditingSpecialRule(null);
                                        setShowSpecialRuleDrawer(true);
                                    }
                                }}
                                className="h-9 px-4 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white hover:opacity-95 shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                {activeTab === 'policies' && '+ Add Load Policy'}
                                {activeTab === 'designations' && '+ Add Designation Rule'}
                                {activeTab === 'credits' && '+ Add Credit Mapping'}
                                {activeTab === 'special' && '+ Add Special Rule'}
                            </Button>
                        </div>
                    </div>

                    {/* KPI Stat Cards (Top row matching screenshot) */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900 leading-none">8</div>
                                <span className="text-[11px] font-semibold text-gray-500">Active Policies</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900 leading-none">18</div>
                                <span className="text-[11px] font-semibold text-gray-500">Designations</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900 leading-none">3</div>
                                <span className="text-[11px] font-semibold text-gray-500">Teaching Load Rules</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900 leading-none">2</div>
                                <span className="text-[11px] font-semibold text-gray-500">Laboratory Rules</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                <Settings2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900 leading-none">2</div>
                                <span className="text-[11px] font-semibold text-gray-500">Special Rules</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Concern Tabs Pill Bar */}
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('policies')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'policies'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <List className="w-4 h-4" />
                            <span>Policy List</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'policies' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {DEFAULT_POLICIES.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('designations')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'designations'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Designation Rules</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'designations' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {DEFAULT_DESIGNATIONS.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('credits')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'credits'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Scale className="w-4 h-4" />
                            <span>Credit Mapping</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'credits' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {creditMappings.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('special')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'special'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Settings2 className="w-4 h-4" />
                            <span>Special Rules</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'special' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {DEFAULT_SPECIAL_RULES.length}
                            </span>
                        </button>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: POLICY LIST (Overview & Governance Layer)                         */}
                    {/* ========================================================================= */}
                    {activeTab === 'policies' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Table area */}
                            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="relative w-full sm:w-72">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={policySearch}
                                            onChange={(e) => setPolicySearch(e.target.value)}
                                            placeholder="Search policy..."
                                            className="pl-9 h-9 text-xs rounded-xl border-gray-200"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <select
                                            value={policyTypeFilter}
                                            onChange={(e) => setPolicyTypeFilter(e.target.value)}
                                            className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="Teaching">Teaching</option>
                                            <option value="Laboratory">Laboratory</option>
                                            <option value="Designation">Designation</option>
                                            <option value="Research">Research</option>
                                            <option value="Extension">Extension</option>
                                            <option value="Limit">Limit</option>
                                        </select>

                                        <select
                                            value={policyStatusFilter}
                                            onChange={(e) => setPolicyStatusFilter(e.target.value)}
                                            className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                        >
                                            <option value="all">Active</option>
                                            <option value="Draft">Draft</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="w-8 py-3 px-3">
                                                    <input type="checkbox" className="rounded text-[#0B3A67]" />
                                                </th>
                                                <th className="py-3 px-3">Policy Name</th>
                                                <th className="py-3 px-3">Type</th>
                                                <th className="py-3 px-3">Applicable To</th>
                                                <th className="py-3 px-3 text-center">Status</th>
                                                <th className="py-3 px-3">Last Updated</th>
                                                <th className="py-3 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredPolicies.map((policy) => {
                                                const isSelected = selectedPolicy?.id === policy.id;
                                                return (
                                                    <tr
                                                        key={policy.id}
                                                        onClick={() => setSelectedPolicy(policy)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isSelected ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/80'
                                                        }`}
                                                    >
                                                        <td className="py-3.5 px-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => setSelectedPolicy(policy)}
                                                                className="rounded text-[#0B3A67]"
                                                            />
                                                        </td>
                                                        <td className="py-3.5 px-3">
                                                            <div className="font-bold text-gray-900">{policy.name}</div>
                                                            <div className="text-[11px] text-gray-400 font-normal">{policy.subtitle}</div>
                                                        </td>
                                                        <td className="py-3.5 px-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                                                    policy.type === 'Teaching'
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                        : policy.type === 'Laboratory'
                                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                        : policy.type === 'Designation'
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : policy.type === 'Research'
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : policy.type === 'Extension'
                                                                        ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}
                                                            >
                                                                {policy.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-gray-700 font-medium">
                                                            {policy.applicableTo}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                {policy.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-gray-500">
                                                            {policy.lastUpdated}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                                    <span>Showing 1 - {filteredPolicies.length} of 8 policies</span>
                                    <div className="flex items-center gap-1">
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="w-7 h-7 rounded-lg bg-[#0B3A67] text-white font-bold flex items-center justify-center text-xs">
                                            1
                                        </span>
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                                            2
                                        </button>
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Detail Card (Right side matching screenshot) */}
                            {selectedPolicy && (
                                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Inspector Header */}
                                    <div className="bg-[#0B3A67] text-white p-5 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-white leading-tight">
                                                        {selectedPolicy.name}
                                                    </h3>
                                                    <p className="text-[11px] text-white/70">
                                                        {selectedPolicy.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                                                {selectedPolicy.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inspector Nav Tabs */}
                                    <div className="flex items-center border-b border-gray-100 bg-gray-50/70 px-4 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setPolicyInspectorTab('overview')}
                                            className={`py-2.5 px-3 border-b-2 transition-all ${
                                                policyInspectorTab === 'overview'
                                                    ? 'border-[#0B3A67] text-[#0B3A67]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPolicyInspectorTab('rules')}
                                            className={`py-2.5 px-3 border-b-2 transition-all ${
                                                policyInspectorTab === 'rules'
                                                    ? 'border-[#0B3A67] text-[#0B3A67]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            Rules
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPolicyInspectorTab('applicability')}
                                            className={`py-2.5 px-3 border-b-2 transition-all ${
                                                policyInspectorTab === 'applicability'
                                                    ? 'border-[#0B3A67] text-[#0B3A67]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            Applicability
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPolicyInspectorTab('history')}
                                            className={`py-2.5 px-3 border-b-2 transition-all ${
                                                policyInspectorTab === 'history'
                                                    ? 'border-[#0B3A67] text-[#0B3A67]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            History
                                        </button>
                                    </div>

                                    {/* Inspector Body */}
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Policy Type</span>
                                            <div className="flex items-center gap-1.5">
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                                                    {selectedPolicy.type}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</span>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {selectedPolicy.description}
                                            </p>
                                        </div>

                                        {/* Metric Blocks */}
                                        <div className="grid grid-cols-3 gap-2.5 pt-2">
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                                <Clock className="w-4 h-4 mx-auto text-rose-500 mb-1" />
                                                <div className="text-sm font-black text-gray-900">{selectedPolicy.targetLoad || 12} hrs</div>
                                                <span className="text-[10px] text-gray-500">Target Load</span>
                                            </div>

                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                                <Layers className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                                                <div className="text-sm font-black text-gray-900">
                                                    {selectedPolicy.minLoad || 9} - {selectedPolicy.maxLoad || 15} hrs
                                                </div>
                                                <span className="text-[10px] text-gray-500">Allowed Range</span>
                                            </div>

                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                                <BookOpen className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
                                                <div className="text-sm font-black text-gray-900">1 hr</div>
                                                <span className="text-[10px] text-gray-500">Per Preparation</span>
                                            </div>
                                        </div>

                                        {/* Key Settings List */}
                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                            <span className="text-xs font-bold text-gray-900 block">Key Settings</span>
                                            <ul className="space-y-1.5 text-xs text-gray-600">
                                                <li className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Teaching Load (Target): {selectedPolicy.targetLoad || 12} hours/week</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Minimum Load: {selectedPolicy.minLoad || 9} hours/week</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Maximum Load: {selectedPolicy.maxLoad || 15} hours/week</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Preparation Time: {selectedPolicy.prepTime || '1 hour per unique course'}</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Coverage: {selectedPolicy.coverage || 'All faculty (regular)'}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                            <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold rounded-xl border-gray-200">
                                                <Edit3 className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                                Edit Policy
                                            </Button>
                                            <Button size="sm" className="flex-1 text-xs font-semibold rounded-xl bg-[#0B3A67] text-white hover:bg-[#0B3A67]/90">
                                                <Copy className="w-3.5 h-3.5 mr-1" />
                                                Duplicate
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: DESIGNATION RULES (Administrative Load Adjustments)                */}
                    {/* ========================================================================= */}
                    {activeTab === 'designations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            <div className={`${showDesignationDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4`}>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="relative w-full sm:w-80">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={designationSearch}
                                            onChange={(e) => setDesignationSearch(e.target.value)}
                                            placeholder="Search rule name or designation..."
                                            className="pl-9 h-9 text-xs rounded-xl border-gray-200"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={designationTypeFilter}
                                            onChange={(e) => setDesignationTypeFilter(e.target.value)}
                                            className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="Program">Program</option>
                                            <option value="Course">Course</option>
                                            <option value="College / Unit">College / Unit</option>
                                        </select>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setEditingDesignation(null);
                                                setShowDesignationDrawer(true);
                                            }}
                                            className="h-9 px-3 text-xs font-semibold rounded-xl bg-[#0B3A67] text-white"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Designation Rule
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="py-3 px-3">Rule Name</th>
                                                <th className="py-3 px-3">Applies To</th>
                                                <th className="py-3 px-3">Designation</th>
                                                <th className="py-3 px-3">Conditions</th>
                                                <th className="py-3 px-3 text-center">Priority</th>
                                                <th className="py-3 px-3">Effective Term</th>
                                                <th className="py-3 px-3 text-center">Status</th>
                                                <th className="py-3 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredDesignations.map((rule) => (
                                                <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-gray-900">{rule.name}</div>
                                                        <div className="text-[11px] text-gray-400 font-normal">{rule.subtitle}</div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                                            {rule.appliesTo}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                                                            {rule.designation}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <ul className="list-disc list-inside text-[11px] text-gray-600 space-y-0.5">
                                                            {rule.conditions.map((c, i) => (
                                                                <li key={i}>{c}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                                                            {rule.priority}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-600 text-[11px]">
                                                        {rule.effectiveTerm}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                            {rule.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingDesignation(rule);
                                                                    setShowDesignationDrawer(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-[#0B3A67] rounded-lg hover:bg-gray-100"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                                            >
                                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Create / Edit Designation Drawer (Right Side matching screenshot) */}
                            {showDesignationDrawer && (
                                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900">
                                                    {editingDesignation ? 'Edit Designation Rule' : 'Create Designation Rule'}
                                                </h3>
                                                <p className="text-[11px] text-gray-500">
                                                    Define rule and its workload credit adjustments.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowDesignationDrawer(false)}
                                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3.5 text-xs">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Rule Name *</Label>
                                            <Input
                                                defaultValue={editingDesignation?.name || 'Program Chair Load Rule'}
                                                className="h-9 text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Designation *</Label>
                                            <select
                                                defaultValue={editingDesignation?.designation || 'Program Chair'}
                                                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                            >
                                                <option value="Program Chair">Program Chair</option>
                                                <option value="Subject Coordinator">Subject Coordinator</option>
                                                <option value="Laboratory Coordinator">Laboratory Coordinator</option>
                                                <option value="Research Coordinator">Research Coordinator</option>
                                                <option value="Extension Coordinator">Extension Coordinator</option>
                                                <option value="Clinical Supervisor">Clinical Supervisor</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Scope (Applies To) *</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    className="p-2.5 rounded-xl border-2 border-blue-500 bg-blue-50/40 text-left"
                                                >
                                                    <div className="font-bold text-blue-900 text-xs">Program</div>
                                                    <span className="text-[10px] text-blue-700">Per academic program</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-2.5 rounded-xl border border-gray-200 text-left hover:bg-gray-50"
                                                >
                                                    <div className="font-bold text-gray-800 text-xs">Course</div>
                                                    <span className="text-[10px] text-gray-500">Per specific course</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Eligibility Conditions *</Label>
                                            <Textarea
                                                rows={3}
                                                defaultValue="• Officially designated by the college dean&#10;• One (1) per program&#10;• With active assignment for the semester"
                                                className="text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Credit Metric *</Label>
                                                <select className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                    <option>Credit (hrs)</option>
                                                    <option>Units</option>
                                                    <option>Fixed Allowance</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Amount *</Label>
                                                <Input defaultValue="6.0" className="h-9 text-xs rounded-xl border-gray-200" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Priority *</Label>
                                                <select className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                    <option>1 (Highest)</option>
                                                    <option>2</option>
                                                    <option>3</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Effective Semester *</Label>
                                                <select className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                    <option>All Semesters</option>
                                                    <option>1st Semester Only</option>
                                                    <option>2nd Semester Only</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                                            <div>
                                                <div className="font-bold text-gray-900 text-xs">Active Rule</div>
                                                <span className="text-[10px] text-gray-500">Enable for schedule generation</span>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0B3A67] rounded" />
                                        </div>

                                        <div className="flex items-center gap-2 pt-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowDesignationDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl border-gray-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setShowDesignationDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl bg-[#0B3A67] text-white hover:bg-[#0B3A67]/90"
                                            >
                                                Save Rule
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: CREDIT MAPPING (Activity to Workload Credits Translation)          */}
                    {/* ========================================================================= */}
                    {activeTab === 'credits' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            <div className={`${showCreditDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4`}>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="relative w-full sm:w-80">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={creditSearch}
                                            onChange={(e) => setCreditSearch(e.target.value)}
                                            placeholder="Search course (code or title)..."
                                            className="pl-9 h-9 text-xs rounded-xl border-gray-200"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={creditProgramFilter}
                                            onChange={(e) => setCreditProgramFilter(e.target.value)}
                                            className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                        >
                                            <option value="all">Program: All</option>
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.code}>Program: {p.code}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={creditTypeFilter}
                                            onChange={(e) => setCreditTypeFilter(e.target.value)}
                                            className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                        >
                                            <option value="all">Course Type: All</option>
                                            <option value="Lab">Lecture + Lab</option>
                                            <option value="Lecture Only">Lecture Only</option>
                                        </select>

                                        <Button
                                            size="sm"
                                            onClick={() => setShowCreditDrawer(true)}
                                            className="h-9 px-3 text-xs font-semibold rounded-xl bg-[#0B3A67] text-white"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Credit Mapping
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th className="w-8 py-3 px-3">
                                                    <input type="checkbox" className="rounded text-[#0B3A67]" />
                                                </th>
                                                <th className="py-3 px-3">Course Code</th>
                                                <th className="py-3 px-3">Course Title</th>
                                                <th className="py-3 px-3">Course Type</th>
                                                <th className="py-3 px-3 text-center">Lecture Units</th>
                                                <th className="py-3 px-3 text-center">Lab Units</th>
                                                <th className="py-3 px-3 text-center">Total Credits</th>
                                                <th className="py-3 px-3">Contact Hours</th>
                                                <th className="py-3 px-3">Effective Term</th>
                                                <th className="py-3 px-3 text-center">Status</th>
                                                <th className="py-3 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredCredits.slice(0, 15).map((course) => (
                                                <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-3">
                                                        <input type="checkbox" className="rounded text-[#0B3A67]" />
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-gray-900">
                                                        {course.course_code}
                                                    </td>
                                                    <td className="py-3 px-3 font-medium text-gray-800">
                                                        {course.course_title}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                                                course.course_type.includes('Lab')
                                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            }`}
                                                        >
                                                            {course.course_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center font-semibold text-gray-700">
                                                        {course.lecture_units}
                                                    </td>
                                                    <td className="py-3 px-3 text-center font-semibold text-gray-700">
                                                        {course.lab_units}
                                                    </td>
                                                    <td className="py-3 px-3 text-center font-bold text-gray-900">
                                                        {course.total_credits}
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold text-blue-600">
                                                        {course.contact_hours}
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-500 text-[11px]">
                                                        {course.effective_term}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                            {course.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <button
                                                            type="button"
                                                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                                    <span>Showing 1 - {Math.min(15, filteredCredits.length)} of {filteredCredits.length} mappings</span>
                                    <div className="flex items-center gap-1">
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="w-7 h-7 rounded-lg bg-[#0B3A67] text-white font-bold flex items-center justify-center text-xs">
                                            1
                                        </span>
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                                            2
                                        </button>
                                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add Credit Mapping Drawer (Right side matching screenshot) */}
                            {showCreditDrawer && (
                                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Scale className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900">Add Credit Mapping</h3>
                                                <p className="text-[11px] text-gray-500">Create a new course credit mapping.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreditDrawer(false)}
                                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3.5 text-xs">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Course Code *</Label>
                                            <Input placeholder="e.g., ITEL 601" className="h-9 text-xs rounded-xl border-gray-200" />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Course Title *</Label>
                                            <Input placeholder="e.g., Artificial Intelligence" className="h-9 text-xs rounded-xl border-gray-200" />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Course Type *</Label>
                                            <select className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                <option>Lecture + Laboratory</option>
                                                <option>Lecture Only</option>
                                                <option>Laboratory Only</option>
                                                <option>Studio / Practicum</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Lecture Credits *</Label>
                                                <Input type="number" defaultValue="3" className="h-9 text-xs rounded-xl border-gray-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Laboratory Credits *</Label>
                                                <Input type="number" defaultValue="1" className="h-9 text-xs rounded-xl border-gray-200" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Total Credits *</Label>
                                                <Input defaultValue="4" readOnly className="h-9 text-xs rounded-xl border-gray-200 bg-gray-50" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Contact Hours *</Label>
                                                <Input defaultValue="6" className="h-9 text-xs rounded-xl border-gray-200" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Effective Semester *</Label>
                                            <select className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                <option>1st Semester, AY 2026–2027</option>
                                                <option>2nd Semester, AY 2026–2027</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Notes (Optional)</Label>
                                            <Textarea
                                                rows={2}
                                                placeholder="Add remarks, e.g., curriculum reference, policy, or special allocation..."
                                                className="text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowCreditDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl border-gray-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setShowCreditDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl bg-[#0B3A67] text-white hover:bg-[#0B3A67]/90"
                                            >
                                                Save Mapping
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 4: SPECIAL RULES (Exceptions & Condition Builder)                     */}
                    {/* ========================================================================= */}
                    {activeTab === 'special' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            <div className={`${showSpecialRuleDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="relative w-full sm:w-80">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                value={specialSearch}
                                                onChange={(e) => setSpecialSearch(e.target.value)}
                                                placeholder="Search rule..."
                                                className="pl-9 h-9 text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <select
                                                value={specialCategoryFilter}
                                                onChange={(e) => setSpecialCategoryFilter(e.target.value)}
                                                className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                            >
                                                <option value="all">All Categories</option>
                                                <option value="Course">Course</option>
                                                <option value="Faculty">Faculty</option>
                                                <option value="Time">Time</option>
                                                <option value="Laboratory">Laboratory</option>
                                            </select>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setEditingSpecialRule(null);
                                                    setShowSpecialRuleDrawer(true);
                                                }}
                                                className="h-9 px-3 text-xs font-semibold rounded-xl bg-[#0B3A67] text-white"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Add Special Rule
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-gray-600">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                                <tr>
                                                    <th className="py-3 px-3">Rule Name</th>
                                                    <th className="py-3 px-3">Rule Category</th>
                                                    <th className="py-3 px-3">Applies To</th>
                                                    <th className="py-3 px-3">Trigger or Condition</th>
                                                    <th className="py-3 px-3">Action</th>
                                                    <th className="py-3 px-3 text-center">Priority</th>
                                                    <th className="py-3 px-3">Effective Term</th>
                                                    <th className="py-3 px-3 text-center">Status</th>
                                                    <th className="py-3 px-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredSpecialRules.map((rule) => (
                                                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 px-3 font-bold text-gray-900">
                                                            {rule.name}
                                                        </td>
                                                        <td className="py-3.5 px-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                                                    rule.category === 'Course'
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                        : rule.category === 'Faculty'
                                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                        : rule.category === 'Time'
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}
                                                            >
                                                                {rule.category}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3.5 px-3 font-medium text-gray-700">
                                                            {rule.appliesTo}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-gray-600 max-w-xs text-[11px]">
                                                            {rule.trigger}
                                                        </td>
                                                        <td className="py-3.5 px-3 font-semibold text-blue-700 text-[11px]">
                                                            {rule.action}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                                                                {rule.priority}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                                                            {rule.effectiveTerm}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                {rule.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingSpecialRule(rule);
                                                                    setShowSpecialRuleDrawer(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-[#0B3A67] rounded-lg hover:bg-gray-100"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Rule Conflicts & Warnings + Recent Activity Banners (Matching screenshot) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                <h4 className="text-xs font-bold text-amber-900">Rule Conflicts & Warnings</h4>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                                1 Issue
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-800 leading-relaxed">
                                            &ldquo;Block Saturday Scheduling&rdquo; may conflict with &ldquo;Special Off-site Class Allowance,&rdquo; which allows Saturday classes for extension programs.
                                        </p>
                                        <div className="pt-1">
                                            <button className="text-xs font-bold text-amber-900 hover:underline inline-flex items-center gap-1">
                                                Resolve Conflict &rarr;
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-gray-900">Recent Activity / Rule History</h4>
                                            <span className="text-[10px] text-gray-400">View All</span>
                                        </div>
                                        <ul className="space-y-2 text-xs text-gray-600">
                                            <li className="flex items-start gap-2">
                                                <Edit3 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-semibold text-gray-800">Updated &ldquo;Overload Approval Required&rdquo;</span>
                                                    <div className="text-[10px] text-gray-400">Changed approval route to VPAA • Nov 12, 2026, 09:10 PM</div>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-semibold text-gray-800">Added &ldquo;Minimum Laboratory Gap&rdquo;</span>
                                                    <div className="text-[10px] text-gray-400">New rule for laboratory courses • Nov 10, 2026, 02:34 PM</div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Edit / Add Special Rule Condition Builder Drawer (Right side matching screenshot) */}
                            {showSpecialRuleDrawer && (
                                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Settings2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900">
                                                    {editingSpecialRule ? 'Edit Special Rule' : 'Add Special Rule'}
                                                </h3>
                                                <p className="text-[11px] text-gray-500">Update the rule details and conditions.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSpecialRuleDrawer(false)}
                                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3.5 text-xs">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Rule Name *</Label>
                                            <Input
                                                defaultValue={editingSpecialRule?.name || 'Cross-listed Course Handling'}
                                                className="h-9 text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Category *</Label>
                                                <select
                                                    defaultValue={editingSpecialRule?.category || 'Course'}
                                                    className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                                >
                                                    <option value="Course">Course</option>
                                                    <option value="Faculty">Faculty</option>
                                                    <option value="Time">Time</option>
                                                    <option value="Laboratory">Laboratory</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Scope / Applies To *</Label>
                                                <select
                                                    defaultValue={editingSpecialRule?.appliesTo || 'All Programs'}
                                                    className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                                >
                                                    <option>All Programs</option>
                                                    <option>Laboratory Courses</option>
                                                    <option>Multi-Program</option>
                                                    <option>All Faculty</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Condition Builder Box */}
                                        <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                Condition Builder *
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <select className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] bg-white flex-1">
                                                    <option>Course Type</option>
                                                    <option>Assigned Load</option>
                                                    <option>Day</option>
                                                </select>
                                                <span className="text-gray-400 text-xs">is</span>
                                                <select className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] bg-white flex-1">
                                                    <option>Cross-listed</option>
                                                    <option>Overload</option>
                                                </select>
                                                <button className="text-gray-400 hover:text-rose-500 p-1">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1.5 pt-1">
                                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black">AND</span>
                                                <select className="h-8 px-2 rounded-lg border border-gray-200 text-[11px] bg-white flex-1">
                                                    <option>Section Count</option>
                                                    <option>Total Hours</option>
                                                </select>
                                                <span className="text-gray-400 text-xs">≥</span>
                                                <Input defaultValue="2" className="h-8 w-14 text-center text-xs rounded-lg border-gray-200 bg-white" />
                                                <button className="text-gray-400 hover:text-rose-500 p-1">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="w-full py-1.5 text-center text-[11px] font-bold text-[#0B3A67] hover:underline"
                                            >
                                                + Add Condition
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Resulting Action *</Label>
                                            <select
                                                defaultValue={editingSpecialRule?.action || 'Link sections & share faculty assignment'}
                                                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                            >
                                                <option value="Link sections & share faculty assignment">Link sections & share faculty assignment</option>
                                                <option value="Require VPAA approval">Require VPAA approval</option>
                                                <option value="Prevent time conflict">Prevent time conflict</option>
                                                <option value="Prevent regular class assignment">Prevent regular class assignment</option>
                                                <option value="Enforce ≥ 1 hr gap">Enforce ≥ 1 hr gap</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Priority *</Label>
                                                <select className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                    <option>1 - Highest</option>
                                                    <option>2</option>
                                                    <option>3</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Effective Semester *</Label>
                                                <select className="w-full h-9 px-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800">
                                                    <option>1st Sem, 2026-2027</option>
                                                    <option>All Semesters</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div>
                                                <div className="font-bold text-gray-900 text-xs">Approval Required</div>
                                                <span className="text-[10px] text-gray-500">Must be endorsed by VPAA</span>
                                            </div>
                                            <input type="checkbox" defaultChecked={editingSpecialRule?.approvalRequired} className="w-4 h-4 text-[#0B3A67] rounded" />
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <div>
                                                <div className="font-bold text-gray-900 text-xs">Active (Enable Rule)</div>
                                                <span className="text-[10px] text-gray-500">Inject into solver engine</span>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0B3A67] rounded" />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Notes</Label>
                                            <Textarea
                                                rows={2}
                                                defaultValue={editingSpecialRule?.notes || 'Automatically links sections of the same cross-listed course and shares the faculty assignment to avoid duplicate loading and schedule conflicts.'}
                                                className="text-xs rounded-xl border-gray-200"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowSpecialRuleDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl border-gray-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setShowSpecialRuleDrawer(false)}
                                                className="flex-1 text-xs h-9 rounded-xl bg-[#0B3A67] text-white hover:bg-[#0B3A67]/90"
                                            >
                                                Save Rule
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

