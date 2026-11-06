import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Award,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    FolderCheck,
    HelpCircle,
    Info,
    Layers,
    Shield,
    ShieldAlert,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CollegeMetric {
    id: number;
    code: string;
    name: string;
    dean_name: string;
    parent_entity: string;
    entity_code: string;
    faculty_count: number;
    compliance_rate: number;
    open_issues: number;
    status: 'On Track' | 'Needs Attention' | 'Critical';
}

interface FolderComparison {
    folder: string;
    CIDS: number;
    CED: number;
    CBA: number;
    COE: number;
    CAS: number;
}

interface Props {
    initialTab?: 'overview' | 'requirements' | 'accreditation' | 'quality-indicators';
    collegeMetrics: Record<string, CollegeMetric>;
    folderComparison?: FolderComparison[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Compliance & Quality', href: '/vpaf/compliance-quality' },
];

export default function VpafComplianceQuality({
    initialTab = 'overview',
    collegeMetrics = {},
    folderComparison = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'accreditation' | 'quality-indicators'>(
        initialTab
    );

    const collegesList = useMemo(() => Object.values(collegeMetrics), [collegeMetrics]);

    const handleTabChange = (tab: 'overview' | 'requirements' | 'accreditation' | 'quality-indicators') => {
        setActiveTab(tab);
        router.get(
            '/vpaf/compliance-quality',
            { tab },
            { preserveState: true, replace: true }
        );
    };

    const avgCompliance = (
        collegesList.reduce((acc, c) => acc + c.compliance_rate, 0) / (collegesList.length || 1)
    ).toFixed(1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compliance & Quality — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#0B3A67] dark:text-[#93C5FD] border border-violet-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Institutional Quality Assurance
                            </span>
                            <span className="text-xs text-slate-500 font-medium">ISO 9001:2015 & AACCUP Ready</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Compliance, Quality & Accreditation Governance
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Real-time tracking of institutional document submission folders, accreditation evidence archives, dean review turnaround velocities, and regulatory quality indicators.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/vpaf/reports?tab=compliance">
                            <Button variant="outline" className="border-indigo-200 text-[#0B3A67] dark:text-[#93C5FD] hover:bg-violet-50 font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Compliance Report
                            </Button>
                        </Link>
                        <Link href="/vpaf/dashboard">
                            <Button className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-sm font-medium">
                                Executive Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Institution Compliance Rate</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">{avgCompliance}%</div>
                        <div className="text-xs text-slate-400 mt-1">Across all 5 academic colleges</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Target Threshold</span>
                            <Award className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#17152E]">90.0%</div>
                        <div className="text-xs text-slate-400 mt-1">Institutional standard minimum</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Compliant Colleges (&ge;90%)</span>
                            <CheckCircle2 className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#0B3A67] dark:text-[#93C5FD]">3 of 5</div>
                        <div className="text-xs text-slate-400 mt-1">CIDS (94.0%), CBA (97.3%), CAS (89.0%)</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Under-Threshold Colleges</span>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">2 Colleges</div>
                        <div className="text-xs text-slate-400 mt-1">CED (86.2%), COE (84.5%)</div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'overview', label: 'Compliance Overview', icon: ShieldCheck },
                        { id: 'requirements', label: 'Requirement Performance (Folders)', icon: FolderCheck },
                        { id: 'accreditation', label: 'Accreditation / Evidence Status', icon: Award },
                        { id: 'quality-indicators', label: 'Quality Indicators & Turnaround', icon: Activity },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? 'bg-[#5B21B6] text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:text-[#0B3A67] dark:text-[#93C5FD] hover:bg-violet-50 border border-indigo-50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0B3A67] dark:text-[#93C5FD]'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">College Compliance Performance Matrix</h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Verified document deliverables compliance score for AY 2026–2027 1st Semester.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {collegesList.map((col) => {
                                    const isCompliant = col.compliance_rate >= 90;
                                    return (
                                        <div
                                            key={col.code}
                                            className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-bold">
                                                        {col.code}
                                                    </span>
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        isCompliant
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {isCompliant ? 'Compliant' : 'Needs Follow-Up'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-[#17152E] text-base">{col.name}</h3>
                                                <p className="text-xs text-slate-500">{col.dean_name}</p>

                                                <div className="space-y-1.5 pt-2">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-slate-600">Compliance Rate</span>
                                                        <span className={isCompliant ? 'text-emerald-700' : 'text-amber-700'}>
                                                            {col.compliance_rate}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                isCompliant ? 'bg-emerald-600' : 'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${col.compliance_rate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between">
                                                <span>Faculty Force: <strong>{col.faculty_count}</strong></span>
                                                <span>Pending Review: <strong>{isCompliant ? '1–2' : '8–14'}</strong></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: REQUIREMENT PERFORMANCE (FOLDER MATRIX) */}
                {activeTab === 'requirements' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#17152E]">Folder-by-Folder Compliance Matrix</h2>
                                    <p className="text-xs text-slate-500">
                                        Cross-college comparison of major institutional requirement folders to isolate specific operational bottlenecks.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-[#0B3A67] dark:text-[#93C5FD] border border-violet-200 rounded-full">
                                    5 Core Institutional Categories
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-indigo-100 bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4">Requirement Folder Name</th>
                                            <th className="py-3 px-4 text-center">CIDS</th>
                                            <th className="py-3 px-4 text-center">CED</th>
                                            <th className="py-3 px-4 text-center">CBA</th>
                                            <th className="py-3 px-4 text-center">COE</th>
                                            <th className="py-3 px-4 text-center">CAS</th>
                                            <th className="py-3 px-4">Executive Diagnosis</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {folderComparison.map((f, idx) => (
                                            <tr key={idx} className="hover:bg-violet-50/40 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-[#17152E] flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                                                    {f.folder}
                                                </td>
                                                {['CIDS', 'CED', 'CBA', 'COE', 'CAS'].map((col) => {
                                                    const val = (f as any)[col];
                                                    return (
                                                        <td key={col} className="py-3.5 px-4 text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                                                val >= 95
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : val >= 90
                                                                    ? 'bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD]'
                                                                    : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {val}%
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                                                    {f.CED < 90 || f.COE < 90 ? (
                                                        <span className="text-amber-700">
                                                            Delays in CED & COE syllabus alignment. Auto-reminders dispatched.
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-700">
                                                            Exemplary on-time submission rate.
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: ACCREDITATION / EVIDENCE STATUS */}
                {activeTab === 'accreditation' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">AACCUP & ISO 9001:2015 Audit Readiness</h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Evidence repository completeness for upcoming institutional accreditations and program surveys.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[#17152E] text-base flex items-center gap-2">
                                            <Award className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" /> AACCUP Level III Survey (BSCS & BSIS)
                                        </h3>
                                        <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                                            96% Evidence Ready
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Area III (Curriculum & Instruction) and Area VII (Library & Facilities) evidence portfolios uploaded and verified by internal accreditors.
                                    </p>
                                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                                        Lead College: <strong>College of Information and Digital Sciences</strong>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[#17152E] text-base flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-indigo-600" /> ISO 9001:2015 Surveillance Audit
                                        </h3>
                                        <span className="text-xs px-2.5 py-1 bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] rounded-full font-bold">
                                            92% Documented
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Faculty syllabi compliance, examination TOS validation, and corrective action requests (CARs) archived in the Ascend Digital Repository.
                                    </p>
                                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                                        Auditor: <strong>Office of Quality Assurance & Accreditation</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: QUALITY INDICATORS */}
                {activeTab === 'quality-indicators' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Dean Review Velocity & Quality Turnaround</h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Metrics tracking how quickly submitted requirements are vetted and approved by college deans and program heads.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">Average Dean Approval Velocity</div>
                                    <div className="text-2xl font-bold text-[#0B3A67] dark:text-[#93C5FD]">1.8 Days</div>
                                    <div className="text-xs text-emerald-600 mt-1 font-medium">Faster than 3.0-day SLA</div>
                                </div>

                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">First-Time Submission Pass Rate</div>
                                    <div className="text-2xl font-bold text-emerald-700">89.4%</div>
                                    <div className="text-xs text-slate-400 mt-1">10.6% returned for corrections</div>
                                </div>

                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">Overdue Action Inquiries</div>
                                    <div className="text-2xl font-bold text-amber-600">4 Inquiries</div>
                                    <div className="text-xs text-slate-400 mt-1">Requiring VPAF intervention</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

