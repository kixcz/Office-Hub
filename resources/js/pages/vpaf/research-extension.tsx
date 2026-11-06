import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookMarked,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FileText,
    Globe,
    GraduationCap,
    Handshake,
    HelpCircle,
    Info,
    Layers,
    Lightbulb,
    Search,
    Share2,
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
    research_count: number;
    extension_count: number;
}

interface Props {
    initialTab?: 'research' | 'extension' | 'publications' | 'partnerships';
    collegeMetrics: Record<string, CollegeMetric>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Research & Extension', href: '/vpaf/research-extension' },
];

export default function VpafResearchExtension({
    initialTab = 'research',
    collegeMetrics = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'research' | 'extension' | 'publications' | 'partnerships'>(
        initialTab
    );

    const collegesList = useMemo(() => Object.values(collegeMetrics), [collegeMetrics]);

    const handleTabChange = (tab: 'research' | 'extension' | 'publications' | 'partnerships') => {
        setActiveTab(tab);
        router.get(
            '/vpaf/research-extension',
            { tab },
            { preserveState: true, replace: true }
        );
    };

    const totalResearch = collegesList.reduce((acc, c) => acc + c.research_count, 0);
    const totalExtension = collegesList.reduce((acc, c) => acc + c.extension_count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Research & Extension — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#0B3A67] dark:text-[#93C5FD] border border-violet-200">
                                <Lightbulb className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Scholarly Output & Community Impact
                            </span>
                            <span className="text-xs text-slate-500 font-medium">AY 2026–2027 Institutional Grants</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Research, Extension & Academic Partnerships
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Institutional portfolio oversight of funded research projects, community extension outreach, Scopus-indexed publications, and industry Memoranda of Agreement (MOAs).
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
                            <span>Active Research Projects</span>
                            <BookOpen className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#17152E]">{totalResearch} Projects</div>
                        <div className="text-xs text-slate-400 mt-1">DSSC & Externally Funded</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Extension Engagements</span>
                            <Globe className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">{totalExtension} Programs</div>
                        <div className="text-xs text-slate-400 mt-1">Partner LGUs & Cooperatives</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Scopus / WoS Publications</span>
                            <Award className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-[#0B3A67] dark:text-[#93C5FD]">18 Indexed Papers</div>
                        <div className="text-xs text-slate-400 mt-1">CY 2026 Institutional Record</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Active MOUs / MOAs</span>
                            <Handshake className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">24 Partnerships</div>
                        <div className="text-xs text-slate-400 mt-1">Industry, LGUs, & Universities</div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'research', label: 'Research Portfolio', icon: BookOpen },
                        { id: 'extension', label: 'Extension Portfolio', icon: Globe },
                        { id: 'publications', label: 'Publications & Outputs', icon: Award },
                        { id: 'partnerships', label: 'Partnerships & MOUs', icon: Handshake },
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

                {/* TAB 1: RESEARCH PORTFOLIO */}
                {activeTab === 'research' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Active Research Grants by College</h2>
                            <p className="text-xs text-slate-500 mb-6">Tracking research deliverables, budget disbursement rates, and milestone ethics clearances.</p>

                            <div className="space-y-4">
                                {[
                                    { title: 'AI-Driven Smart Irrigation & Soil Quality Telemetry for Davao del Sur Coffee Farms', college: 'CIDS & COE', fund: 'DOST-PCIEERD (₱2.4M)', lead: 'Dr. Manuel Torres', progress: 75, status: 'On Track' },
                                    { title: 'Local Indigenous Knowledge Integration into Secondary STEM Curricula in Southern Mindanao', college: 'CED', fund: 'Institutional Grant (₱350K)', lead: 'Dr. Carmela Bautista', progress: 90, status: 'Final Review' },
                                    { title: 'Financial Literacy and MSME Resilience Post-Pandemic in Region XI', college: 'CBA', fund: 'CHED-GIA (₱850K)', lead: 'Prof. Alicia Tan', progress: 65, status: 'On Track' },
                                    { title: 'Phytochemical Screening and Bioactivity Analysis of Endemic Ferns in Mt. Apo Foothills', college: 'CAS', fund: 'Institutional Grant (₱420K)', lead: 'Dr. Reynaldo Cruz', progress: 80, status: 'On Track' },
                                ].map((res, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-bold">
                                                    {res.college}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600">{res.fund}</span>
                                            </div>
                                            <h3 className="font-bold text-[#17152E] text-base">{res.title}</h3>
                                            <p className="text-xs text-slate-500">Lead Proponent: {res.lead}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 block">Progress</span>
                                                <span className="font-bold text-sm text-[#0B3A67] dark:text-[#93C5FD]">{res.progress}%</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                {res.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: EXTENSION PORTFOLIO */}
                {activeTab === 'extension' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Community Extension Engagements</h2>
                            <p className="text-xs text-slate-500 mb-6">Direct community impact programs across Digos City, Sulop, and surrounding municipalities.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { title: 'Project CODE (Community Digital Empowerment)', unit: 'CIDS', target: 'Youth & Barangay Officials of Brgy. Matti', beneficiaries: '180 participants', impact: 'Basic IT Literacy & Cybersecurity Awareness' },
                                    { title: 'TEACH-Davao: Capacity Building for Remote Educators', unit: 'CED', target: 'Public Elementary Teachers in Sulop District', beneficiaries: '120 teachers', impact: 'Instructional Material Design & Assessment Tools' },
                                    { title: 'Kabuhayan Agri-Business Mentorship', unit: 'CBA', target: 'Women Farmers Agrarian Reform Beneficiaries', beneficiaries: '85 micro-entrepreneurs', impact: 'Bookkeeping, Costing & Market Linkages' },
                                    { title: 'Safe Water Testing & Watershed Conservation Clinic', unit: 'CAS & COE', target: 'Barangay Kapatagan Upland Communities', beneficiaries: '350 households', impact: 'Bacteriological Water Quality Testing' },
                                ].map((ext, idx) => (
                                    <div key={idx} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-bold">
                                                {ext.unit}
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                {ext.beneficiaries}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-[#17152E] text-base">{ext.title}</h3>
                                        <p className="text-xs text-slate-600">Partner: {ext.target}</p>
                                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                                            Outcome: <strong>{ext.impact}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: PUBLICATIONS */}
                {activeTab === 'publications' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Scopus, WoS & Peer-Reviewed Publications</h2>
                            <p className="text-xs text-slate-500 mb-6">Faculty citation impact and international indexed research milestones.</p>

                            <div className="space-y-3">
                                {[
                                    { title: 'Deep Learning Architectures for Early Blight Detection in Solanaceae Crops', journal: 'IEEE Access (Scopus Q1)', author: 'Dr. Manuel Torres (CIDS)', year: '2026', citations: '14 citations' },
                                    { title: 'Pedagogical Resilience in Island-Bound Secondary Schools: A Mixed-Methods Study', journal: 'Asia-Pacific Journal of Teacher Education (Scopus Q2)', author: 'Dr. Carmela Bautista (CED)', year: '2026', citations: '8 citations' },
                                    { title: 'Optimization of Photovoltaic Efficiency under High-Humidity Tropical Conditions', journal: 'Renewable Energy Reports (Scopus Q2)', author: 'Engr. Victor Salcedo (COE)', year: '2026', citations: '6 citations' },
                                ].map((pub, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-[#17152E] text-sm">{pub.title}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{pub.author} • <span className="font-medium text-[#0B3A67] dark:text-[#93C5FD]">{pub.journal}</span></p>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-violet-100 text-[#0B3A67] dark:text-[#93C5FD] rounded-md shrink-0">
                                            {pub.citations}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: PARTNERSHIPS */}
                {activeTab === 'partnerships' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Institutional Industry & LGU Memoranda of Agreement</h2>
                            <p className="text-xs text-slate-500 mb-6">Active partnerships supporting student on-the-job training (OJT) and research funding.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { name: 'Provincial Government of Davao del Sur', type: 'Government / LGU', scope: 'Agricultural data sharing & municipal scholarships', validity: 'Valid thru 2028' },
                                    { name: 'Accenture Philippines', type: 'Industry Partner', scope: 'Cloud computing curriculum alignment & fast-track hiring', validity: 'Valid thru 2027' },
                                    { name: 'Department of Science and Technology (DOST-XI)', type: 'National Agency', scope: 'Regional research innovation hub & grant funding', validity: 'Valid thru 2029' },
                                    { name: 'Philippine Chamber of Commerce & Industry (PCCI)', type: 'Industry Partner', scope: 'Business administration student incubation', validity: 'Valid thru 2027' },
                                    { name: 'National Grid Corporation of the Philippines (NGCP)', type: 'Industry Partner', scope: 'Electrical engineering technical apprenticeships', validity: 'Valid thru 2028' },
                                    { name: 'DepEd Schools Division of Digos City', type: 'Academic Partner', scope: 'Student teacher internship deployment in 14 public schools', validity: 'Valid thru 2027' },
                                ].map((part, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD] bg-indigo-50 px-2 py-0.5 rounded">
                                                {part.type}
                                            </span>
                                            <span className="text-xs font-medium text-emerald-700">{part.validity}</span>
                                        </div>
                                        <h3 className="font-bold text-[#17152E] text-sm">{part.name}</h3>
                                        <p className="text-xs text-slate-500">{part.scope}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

