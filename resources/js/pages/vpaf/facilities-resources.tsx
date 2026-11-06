import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Building,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Cpu,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Hammer,
    HelpCircle,
    Info,
    Layers,
    Monitor,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Wrench,
    Zap,
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
    room_utilization: number;
    open_issues: number;
    resource_needs: Array<{ need: string; urgency: string; evidence: string }>;
}

interface Props {
    initialTab?: 'utilization' | 'laboratories' | 'inventory' | 'maintenance' | 'resource-needs';
    collegeMetrics: Record<string, CollegeMetric>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'VPAF / Executive Workspace', href: '/vpaf/dashboard' },
    { title: 'Facilities & Resources', href: '/vpaf/facilities-resources' },
];

export default function VpafFacilitiesResources({
    initialTab = 'utilization',
    collegeMetrics = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'utilization' | 'laboratories' | 'inventory' | 'maintenance' | 'resource-needs'>(
        initialTab
    );

    const collegesList = useMemo(() => Object.values(collegeMetrics), [collegeMetrics]);

    const handleTabChange = (tab: 'utilization' | 'laboratories' | 'inventory' | 'maintenance' | 'resource-needs') => {
        setActiveTab(tab);
        router.get(
            '/vpaf/facilities-resources',
            { tab },
            { preserveState: true, replace: true }
        );
    };

    const avgRoomUtil = (
        collegesList.reduce((acc, c) => acc + c.room_utilization, 0) / (collegesList.length || 1)
    ).toFixed(1);

    const totalOpenTickets = collegesList.reduce((acc, c) => acc + c.open_issues, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Facilities & Resources — VPAF Executive Workspace" />

            <div className="min-h-screen bg-[#F7F7FB] p-6 lg:p-8 space-y-6 text-[#17152E]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-[#0B3A67] dark:text-[#93C5FD] border border-violet-200">
                                <Building2 className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Campus Physical & Technical Assets
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Main & Satellite Campus Facilities</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#17152E]">
                            Facilities, Laboratories & Resource Allocation
                        </h1>
                        <p className="text-sm text-slate-500 max-w-3xl">
                            Real-time facility utilization tracking, specialized laboratory health, open maintenance incident resolution, and evidence-backed capital resource requests.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/vpaf/reports?tab=resources">
                            <Button variant="outline" className="border-indigo-200 text-[#0B3A67] dark:text-[#93C5FD] hover:bg-violet-50 font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Resource Report
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
                            <span>Campus Facility Utilization</span>
                            <Building2 className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                        </div>
                        <div className="text-2xl font-bold text-[#17152E]">{avgRoomUtil}%</div>
                        <div className="text-xs text-slate-400 mt-1">Average daytime room occupancy</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Specialized Laboratories</span>
                            <Monitor className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-[#0B3A67] dark:text-[#93C5FD]">18 Labs</div>
                        <div className="text-xs text-slate-400 mt-1">Computer, Electronics, Science & Speech</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Open Maintenance Tickets</span>
                            <Wrench className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{totalOpenTickets} Tickets</div>
                        <div className="text-xs text-slate-400 mt-1">Avg turnaround: 3.2 days</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Pending Resource Requests</span>
                            <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">7 Requests</div>
                        <div className="text-xs text-slate-400 mt-1">Backed by verified utilization evidence</div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-indigo-100 pb-2">
                    {[
                        { id: 'utilization', label: 'Facility Utilization', icon: Building2 },
                        { id: 'laboratories', label: 'Laboratory Status', icon: Monitor },
                        { id: 'inventory', label: 'Inventory & Equipment', icon: Package },
                        { id: 'maintenance', label: 'Maintenance & Incidents', icon: Wrench },
                        { id: 'resource-needs', label: 'Evidence-Backed Resource Needs', icon: Zap },
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

                {/* TAB 1: FACILITY UTILIZATION */}
                {activeTab === 'utilization' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Classroom & Hall Occupancy Telemetry</h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Room capacity utilization comparing peak daytime periods (8:00 AM – 5:00 PM) across all colleges.
                            </p>

                            <div className="space-y-4">
                                {collegesList.map((col) => {
                                    const isCongested = col.room_utilization >= 80;
                                    const isUnderutilized = col.room_utilization < 60;
                                    return (
                                        <div key={col.code} className="p-4 rounded-xl border border-indigo-50 bg-[#F7F7FB]">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className="font-bold text-[#17152E]">{col.name}</span>
                                                    <span className="text-xs text-slate-400 ml-2 font-mono">({col.code})</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        isCongested
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : isUnderutilized
                                                            ? 'bg-sky-100 text-sky-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isCongested ? 'High Congestion' : isUnderutilized ? 'Underutilized' : 'Optimal'}
                                                    </span>
                                                    <span className="font-bold text-sm text-[#17152E]">{col.room_utilization}%</span>
                                                </div>
                                            </div>

                                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        isCongested ? 'bg-rose-600' : isUnderutilized ? 'bg-sky-500' : 'bg-[#5B21B6]'
                                                    }`}
                                                    style={{ width: `${col.room_utilization}%` }}
                                                />
                                            </div>

                                            <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                                <span>Managed Campus: {col.parent_entity}</span>
                                                <span>
                                                    {isCongested
                                                        ? 'Recommendation: Reallocate overflow sections to CAS/CBA rooms.'
                                                        : isUnderutilized
                                                        ? 'Recommendation: Available for inter-college shared classes.'
                                                        : 'Capacity aligned with enrollment.'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: LABORATORIES */}
                {activeTab === 'laboratories' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Specialized Laboratory Status & Capacity</h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Hardware health, network status, and device ratios in high-density teaching laboratories.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { name: 'Computer Laboratory 1', college: 'CIDS', workstations: '45 PCs', ratio: '1:1', status: 'Operational (8 pending repairs)', health: 'Needs Hardware Refresh' },
                                    { name: 'Computer Laboratory 2 (Networking)', college: 'CIDS', workstations: '40 PCs + Cisco Racks', ratio: '1:1', status: 'Operational', health: 'Optimal' },
                                    { name: 'CAD & Engineering Systems Lab', college: 'COE', workstations: '35 Workstations', ratio: '1:1', status: 'Thermal Throttling (AC Alert)', health: 'Critical AC Overhaul' },
                                    { name: 'Circuits & Instrumentation Lab', college: 'COE', workstations: '12 Test Benches', ratio: '1:3', status: 'Operational', health: 'Oscilloscope Calibration' },
                                    { name: 'EdTech Demonstration Studio', college: 'CED', workstations: '25 Desktops', ratio: '1:3', status: 'Capacity Constrained', health: 'Expansion Requested' },
                                    { name: 'Natural Sciences & Wet Lab', college: 'CAS', workstations: '30 Microscopy Stations', ratio: '1:2', status: 'Operational', health: 'Reagent Fridge Needed' },
                                ].map((lab, idx) => (
                                    <div key={idx} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-bold">
                                                    {lab.college}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                                    lab.health.includes('Critical')
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : lab.health.includes('Expansion') || lab.health.includes('Needs')
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {lab.health}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-[#17152E] text-base">{lab.name}</h3>
                                            <p className="text-xs text-slate-500">Inventory: {lab.workstations} • Student Ratio: {lab.ratio}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 font-medium">
                                            Status: {lab.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: INVENTORY */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">High-Value Institutional Equipment Inventory</h2>
                            <p className="text-xs text-slate-500 mb-6">Asset registry tracking lifecycle, maintenance schedules, and software licensing.</p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-[#F7F7FB] rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 block">Total Cataloged Assets</span>
                                    <span className="text-xl font-bold text-[#17152E]">1,248 Items</span>
                                </div>
                                <div className="p-4 bg-[#F7F7FB] rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 block">Fully Functional (Green)</span>
                                    <span className="text-xl font-bold text-emerald-700">1,180 (94.5%)</span>
                                </div>
                                <div className="p-4 bg-[#F7F7FB] rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 block">Scheduled Maintenance</span>
                                    <span className="text-xl font-bold text-amber-600">42 Items</span>
                                </div>
                                <div className="p-4 bg-[#F7F7FB] rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 block">For Decommissioning</span>
                                    <span className="text-xl font-bold text-rose-600">26 Items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: MAINTENANCE & INCIDENTS */}
                {activeTab === 'maintenance' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#17152E] mb-1">Open Facility Tickets & Room Incidents</h2>
                            <p className="text-xs text-slate-500 mb-6">Active repair requests logged by faculty and lab in-charges.</p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-indigo-100 bg-[#F7F7FB] text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4">Ticket ID</th>
                                            <th className="py-3 px-4">Location</th>
                                            <th className="py-3 px-4">Issue Description</th>
                                            <th className="py-3 px-4">Severity</th>
                                            <th className="py-3 px-4">Logged</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {[
                                            { id: 'TKT-1082', loc: 'Eng-104 (CAD Lab)', desc: '2x 3HP split-type air conditioner malfunction, thermal shutdown', sev: 'Critical', age: '3 days ago', status: 'Contractor Dispatched' },
                                            { id: 'TKT-1079', loc: 'ComLab 1', desc: '8 faulty power supply units (PSU) and keyboard replacements', sev: 'High', age: '5 days ago', status: 'Parts Awaiting Delivery' },
                                            { id: 'TKT-1074', loc: 'Room 302 (CED)', desc: 'Smartboard interactive touch digitizer unresponsive', sev: 'Medium', age: '7 days ago', status: 'Technician Scheduled' },
                                            { id: 'TKT-1065', loc: 'CAS Science Hall', desc: 'Fume hood exhaust blower low air flow rate', sev: 'High', age: '10 days ago', status: 'Under Inspection' },
                                        ].map((t) => (
                                            <tr key={t.id} className="hover:bg-violet-50/40">
                                                <td className="py-3.5 px-4 font-mono font-bold text-[#0B3A67] dark:text-[#93C5FD]">{t.id}</td>
                                                <td className="py-3.5 px-4 font-medium text-[#17152E]">{t.loc}</td>
                                                <td className="py-3.5 px-4 text-xs text-slate-600">{t.desc}</td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        t.sev === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {t.sev}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-400">{t.age}</td>
                                                <td className="py-3.5 px-4 text-xs font-medium text-indigo-700">{t.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: RESOURCE NEEDS */}
                {activeTab === 'resource-needs' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#17152E]">Evidence-Backed Capital Resource Requests</h2>
                                    <p className="text-xs text-slate-500">
                                        Prioritized college requisition requests justified with verified room utilization telemetry and incident counts.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 bg-violet-100 text-[#0B3A67] dark:text-[#93C5FD] rounded-full">
                                    VPAF Executive Evaluation Pipeline
                                </span>
                            </div>

                            <div className="space-y-4">
                                {collegesList.map((col) => (
                                    <div key={col.code} className="p-5 rounded-xl border border-indigo-50 bg-[#F7F7FB] space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-bold">
                                                    {col.code}
                                                </span>
                                                <span className="font-bold text-[#17152E]">{col.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">{col.resource_needs.length} Pending Items</span>
                                        </div>

                                        <div className="space-y-2">
                                            {col.resource_needs.map((item, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                                item.urgency === 'Critical'
                                                                    ? 'bg-rose-100 text-rose-800'
                                                                    : item.urgency === 'High'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-indigo-100 text-[#0B3A67] dark:text-[#93C5FD]'
                                                            }`}>
                                                                {item.urgency} Urgency
                                                            </span>
                                                            <span className="font-bold text-sm text-[#17152E]">{item.need}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            <strong>Verified Evidence:</strong> {item.evidence}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button size="sm" className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-medium">
                                                            Endorse to Budget
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="border-slate-200 text-xs">
                                                            Defer
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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

