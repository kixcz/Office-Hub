import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileSpreadsheet,
    FileText,
    FolderKanban,
    HelpCircle,
    Info,
    Layers,
    Milestone,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Project {
    id: number;
    type: 'Institutional' | 'Cross-College';
    title: string;
    lead_unit: string;
    progress: number;
    status: 'On Track' | 'Attention' | 'Critical';
    milestone: string;
    due_date: string;
}

interface Props {
    initialTab?: 'institutional' | 'cross-college' | 'performance';
    collegeMetrics: Record<string, any>;
    projects?: Project[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Projects & Initiatives', href: '/vpaf/projects-initiatives' },
];

export default function VpafProjectsInitiatives({
    initialTab = 'institutional',
    projects = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'institutional' | 'cross-college' | 'performance'>(initialTab);

    const handleTabChange = (tab: 'institutional' | 'cross-college' | 'performance') => {
        setActiveTab(tab);
        router.get(
            '/vpaf/projects-initiatives',
            { tab },
            { preserveState: true, replace: true }
        );
    };

    const institutionalProjects = useMemo(
        () => projects.filter((p) => p.type === 'Institutional'),
        [projects]
    );

    const crossCollegeProjects = useMemo(
        () => projects.filter((p) => p.type === 'Cross-College'),
        [projects]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects & Initiatives — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#5B21B6] border border-violet-200">
                                <FolderKanban className="w-3.5 h-3.5 text-[#7C3AED]" />
                                Strategic Projects Oversight
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Institutional Strategic Plan 2026–2030</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Institutional Projects & Cross-College Initiatives
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            High-level progress telemetry on campus-wide strategic developments, multi-college collaborations, milestone completions, and budget burn rates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                            <span>Total Strategic Projects</span>
                            <FolderKanban className="w-4 h-4 text-[#7C3AED]" />
                        </div>
                        <div className="text-2xl font-bold text-[#17152E]">{projects.length} Active</div>
                        <div className="text-xs text-slate-400 mt-1">Cross-Campus Priority Roadmap</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Average Completion</span>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">79%</div>
                        <div className="text-xs text-emerald-600 mt-1 font-medium">On pace for Q4 target</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Projects On Track</span>
                            <CheckCircle2 className="w-4 h-4 text-[#5B21B6]" />
                        </div>
                        <div className="text-2xl font-bold text-[#5B21B6]">2 of 3</div>
                        <div className="text-xs text-slate-400 mt-1">Milestones fully met</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Projects Requiring Attention</span>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">1 Project</div>
                        <div className="text-xs text-slate-400 mt-1">AI Agri Consortium sensor delivery</div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'institutional', label: 'Institutional Projects', icon: Layers },
                        { id: 'cross-college', label: 'Cross-College Initiatives', icon: Users },
                        { id: 'performance', label: 'Project Performance & Milestones', icon: BarChart3 },
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

                {/* TAB 1: INSTITUTIONAL PROJECTS */}
                {activeTab === 'institutional' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Campus-Wide Infrastructure & Digital Modernization</h2>
                            <p className="text-xs text-slate-500 mb-6">Strategic capital projects sanctioned by the Board of Trustees and VPAF Executive Office.</p>

                            <div className="space-y-4">
                                {institutionalProjects.map((p) => (
                                    <div key={p.id} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-[#5B21B6]">
                                                {p.lead_unit}
                                            </span>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                                                {p.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-base text-[#17152E]">{p.title}</h3>
                                        <p className="text-xs text-slate-500">Current Milestone: <strong>{p.milestone}</strong></p>

                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-slate-600">Completion</span>
                                                <span className="text-[#5B21B6]">{p.progress}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#5B21B6]"
                                                    style={{ width: `${p.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between text-xs text-slate-400">
                                            <span>Target Completion: <strong>{p.due_date}</strong></span>
                                            <span>Funding: General Appropriations Act (GAA)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CROSS-COLLEGE INITIATIVES */}
                {activeTab === 'cross-college' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Inter-Disciplinary College Collaborations</h2>
                            <p className="text-xs text-slate-500 mb-6">Synergistic joint programs bringing together expertise across colleges.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {crossCollegeProjects.map((p) => (
                                    <div key={p.id} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#5B21B6] font-mono font-bold">
                                                    {p.lead_unit}
                                                </span>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                    p.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-base text-[#17152E]">{p.title}</h3>
                                            <p className="text-xs text-slate-600">Milestone: {p.milestone}</p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span>Progress</span>
                                                <span className="text-[#5B21B6]">{p.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#5B21B6]"
                                                    style={{ width: `${p.progress}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-slate-400 flex justify-between pt-1">
                                                <span>Target: {p.due_date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: PERFORMANCE */}
                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Project Milestone Execution & Budget Telemetry</h2>
                            <p className="text-xs text-slate-500 mb-6">Audit of deliverable timelines and financial disbursement velocity.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <span className="text-xs text-slate-500 block mb-1">Capital Budget Obligation</span>
                                    <span className="text-2xl font-bold text-[#5B21B6]">₱14.8M / ₱18.0M</span>
                                    <span className="text-xs text-emerald-600 block mt-1 font-medium">82.2% Obligated</span>
                                </div>
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <span className="text-xs text-slate-500 block mb-1">Disbursement Velocity</span>
                                    <span className="text-2xl font-bold text-emerald-700">76.4%</span>
                                    <span className="text-xs text-slate-400 block mt-1">Exceeds DBM quarterly benchmark</span>
                                </div>
                                <div className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                    <span className="text-xs text-slate-500 block mb-1">Audit Findings</span>
                                    <span className="text-2xl font-bold text-slate-800">Zero COA AOMs</span>
                                    <span className="text-xs text-emerald-600 block mt-1 font-medium">Fully compliant procurement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

