import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Info,
    Layers,
    Monitor,
    Printer,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    TrendingUp,
    Users,
    X,
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
    faculty_count: number;
    program_count: number;
    attendance_rate: number;
    completion_rate: number;
    compliance_rate: number;
    room_utilization: number;
    overload_count: number;
    underload_count: number;
    research_count: number;
    extension_count: number;
    open_issues: number;
    status: 'On Track' | 'Needs Attention' | 'Critical';
    status_reason: string;
}

interface Props {
    initialTab?: 'executive' | 'comparison' | 'academic-operations' | 'compliance' | 'resources' | 'consolidated';
    collegeMetrics: Record<string, CollegeMetric>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Executive Reports', href: '/vpaf/reports' },
];

export default function VpafReports({
    initialTab = 'executive',
    collegeMetrics = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'executive' | 'comparison' | 'academic-operations' | 'compliance' | 'resources' | 'consolidated'>(
        initialTab
    );
    const [selectedCollege, setSelectedCollege] = useState<string>('All');
    const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);

    const collegesList = useMemo(() => Object.values(collegeMetrics), [collegeMetrics]);

    const handleTabChange = (
        tab: 'executive' | 'comparison' | 'academic-operations' | 'compliance' | 'resources' | 'consolidated'
    ) => {
        setActiveTab(tab);
        router.get('/vpaf/reports', { tab }, { preserveState: true, replace: true });
    };

    const handleExportCsv = (reportName: string) => {
        const headers = ['College Code', 'College Name', 'Dean', 'Campus', 'Faculty', 'Attendance %', 'Completion %', 'Compliance %', 'Room Util %', 'Status'];
        const rows = collegesList.map((c) => [
            c.code,
            `"${c.name.replace(/"/g, '""')}"`,
            `"${c.dean_name.replace(/"/g, '""')}"`,
            `"${c.parent_entity.replace(/"/g, '""')}"`,
            c.faculty_count,
            `${c.attendance_rate}%`,
            `${c.completion_rate}%`,
            `${c.compliance_rate}%`,
            `${c.room_utilization}%`,
            c.status,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `DSSC_VPAF_${reportName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Executive Reports — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#5B21B6] border border-violet-200">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C3AED]" />
                                Executive Reporting Engine
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Official Institutional Disclosures</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Executive Reports & Consolidated Governance Briefs
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Formal institutional decision briefings, cross-college comparative matrices, academic delivery verification, and exportable analytics for President and Board reviews.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowBriefingModal(true)}
                            className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-sm font-medium"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Formal Executive Brief
                        </Button>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'executive', label: 'Executive Reports', icon: FileText },
                        { id: 'comparison', label: 'College Comparison Reports', icon: Layers },
                        { id: 'academic-operations', label: 'Academic Operations Reports', icon: BookOpen },
                        { id: 'compliance', label: 'Compliance Reports', icon: ShieldCheck },
                        { id: 'resources', label: 'Resource Reports', icon: Building2 },
                        { id: 'consolidated', label: 'Consolidated Institution Report', icon: FileSpreadsheet },
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
                                        : 'bg-white text-slate-600 hover:text-[#5B21B6] hover:bg-violet-50 border border-indigo-50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7C3AED]'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Report Content Container */}
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-50 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-[#17152E] capitalize">
                                {activeTab.replace('-', ' ')} Summary
                            </h2>
                            <p className="text-xs text-slate-500">
                                Verified institutional data for AY 2026–2027 1st Semester.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleExportCsv(activeTab)}
                                className="border-indigo-200 text-[#5B21B6] hover:bg-violet-50 font-medium text-xs"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs"
                            >
                                <Printer className="w-3.5 h-3.5 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-indigo-100 bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4">College</th>
                                    <th className="py-3 px-4">Campus / Entity</th>
                                    <th className="py-3 px-4 text-center">Faculty</th>
                                    <th className="py-3 px-4 text-center">Attendance</th>
                                    <th className="py-3 px-4 text-center">Completion</th>
                                    <th className="py-3 px-4 text-center">Compliance</th>
                                    <th className="py-3 px-4 text-center">Room Util.</th>
                                    <th className="py-3 px-4 text-center">Overload</th>
                                    <th className="py-3 px-4">Status & Recommendation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50">
                                {collegesList.map((col) => (
                                    <tr key={col.code} className="hover:bg-violet-50/40">
                                        <td className="py-3.5 px-4 font-bold text-[#17152E]">
                                            <span className="px-1.5 py-0.5 rounded text-xs bg-indigo-100 text-[#5B21B6] font-mono mr-2">
                                                {col.code}
                                            </span>
                                            {col.name}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-600">{col.parent_entity}</td>
                                        <td className="py-3.5 px-4 text-center font-medium">{col.faculty_count}</td>
                                        <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">{col.attendance_rate}%</td>
                                        <td className="py-3.5 px-4 text-center font-semibold text-[#5B21B6]">{col.completion_rate}%</td>
                                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{col.compliance_rate}%</td>
                                        <td className="py-3.5 px-4 text-center text-xs font-mono">{col.room_utilization}%</td>
                                        <td className="py-3.5 px-4 text-center">
                                            {col.overload_count > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                    {col.overload_count}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">0</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mr-1.5 ${
                                                col.status === 'On Track'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : col.status === 'Needs Attention'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {col.status}
                                            </span>
                                            <span className="text-slate-500">{col.status_reason}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Formal Briefing Modal */}
                {showBriefingModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-indigo-200 space-y-6">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#5B21B6] text-white flex items-center justify-center font-bold">
                                        V
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#17152E]">
                                            Office of the Vice President for Academic & Financial Affairs
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Davao del Sur State College • Executive Governance Briefing AY 2026–2027
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowBriefingModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                                <h3 className="font-bold text-base text-[#17152E]">Executive Summary & Actionable Directives</h3>
                                <p>
                                    This official consolidated report serves as the foundational decision brief for the College President, VPAF Executive Council, and the Board of Trustees.
                                    Across 5 academic colleges and 3 campus entities, institutional attendance stands at a verified <strong>94.6%</strong>, with <strong>94.0%</strong> instructional contact hour completion.
                                </p>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-[#F7F7FB] rounded-xl border border-indigo-50">
                                    <div>
                                        <strong className="block text-xs uppercase text-slate-400">Total Instructional Workforce</strong>
                                        <span className="text-lg font-bold text-[#17152E]">69 Faculty Members</span>
                                    </div>
                                    <div>
                                        <strong className="block text-xs uppercase text-slate-400">Overall Compliance Index</strong>
                                        <span className="text-lg font-bold text-emerald-700">90.2% Institutional Average</span>
                                    </div>
                                </div>

                                <h4 className="font-bold text-sm text-[#17152E] pt-2">Priority Executive Directives:</h4>
                                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
                                    <li><strong>COE Lab Overhaul:</strong> Authorize immediate procurement for air conditioning overhaul in Eng-104 CAD Lab and calibration of 3 oscilloscopes to resolve 5 blocking timetable conflicts.</li>
                                    <li><strong>CTED Teaching Balance:</strong> Sanction 2 contractual adjunct instructors in CED to absorb 6 faculty overload cases before the 2nd semester enrolment surge.</li>
                                    <li><strong>Smart TV Synchronization:</strong> Affirm 100% broadcast compliance across 6 lobby screens via the Velora Digital Signage network.</li>
                                </ol>
                            </div>

                            <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Generated on November 5, 2026 via Velora Governance Platform</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => window.print()}
                                        className="text-xs border-indigo-200 text-[#5B21B6]"
                                    >
                                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Official PDF
                                    </Button>
                                    <Button
                                        onClick={() => setShowBriefingModal(false)}
                                        className="text-xs bg-[#5B21B6] hover:bg-[#4C1D95] text-white"
                                    >
                                        Close Briefing
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

