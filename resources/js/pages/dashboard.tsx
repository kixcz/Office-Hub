import React from 'react';
import AppLayout from '@/layouts/app-layout';
import AppearanceToggleTab from '@/components/appearance-tabs';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    FileText, 
    CheckCircle, 
    Clock, 
    AlertTriangle,
    CalendarDays,
    Trophy,
    ArrowRight
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard({ 
    stats, 
    compliance_summary, 
    program_compliance,
    todays_schedule,
    upcoming_deadlines,
    urgent_pending,
    top_programs,
    current_term
}: any) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />
            
            <div className="flex flex-col gap-6 p-6 pb-12 max-w-7xl mx-auto w-full transition-colors">
                {/* Header with Super Admin Tag and Theme Switcher */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 gap-4 transition-colors">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control Center</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                Super Admin
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-0.5">{current_term}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{today}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">Live Campus Operations</p>
                        </div>
                        <div className="flex items-center">
                            <AppearanceToggleTab />
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/compliance/requirements" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 border-l-4 border-l-blue-500 hover:shadow-md dark:hover:bg-slate-850 transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Requirements</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.active_requirements}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-full text-blue-600 dark:text-blue-400">
                                <FileText size={24} />
                            </div>
                        </div>
                    </Link>
                    
                    <Link href="/compliance/submissions" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 border-l-4 border-l-indigo-500 hover:shadow-md dark:hover:bg-slate-850 transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Submissions</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_submissions}</p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                    </Link>

                    <Link href="/compliance/pending-outputs" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 border-l-4 border-l-amber-500 hover:shadow-md dark:hover:bg-slate-850 transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Outputs</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending_outputs}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-full text-amber-600 dark:text-amber-400">
                                <Clock size={24} />
                            </div>
                        </div>
                    </Link>

                    <Link href="/compliance/pending-outputs" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 border-l-4 border-l-red-500 hover:shadow-md dark:hover:bg-slate-850 transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Overdue Outputs</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.overdue_outputs}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/50 p-3 rounded-full text-red-600 dark:text-red-400">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width on LG) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Compliance Summary & Programs */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 flex flex-col gap-6 transition-colors">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">College-Wide Compliance</h2>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Overall Dial/Number */}
                                <div className="flex flex-col items-center justify-center border-4 border-green-500 rounded-full w-40 h-40 bg-gray-50/50 dark:bg-slate-800/40">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{compliance_summary.compliance_rate}%</span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Complied</span>
                                </div>
                                
                                {/* Breakdown */}
                                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-100 dark:border-green-900/40">
                                        <p className="text-xs text-gray-500 dark:text-green-300/80 uppercase font-semibold">On-Time</p>
                                        <p className="text-xl font-bold text-green-700 dark:text-green-400">{compliance_summary.on_time}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40">
                                        <p className="text-xs text-gray-500 dark:text-blue-300/80 uppercase font-semibold">Late</p>
                                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{compliance_summary.late}</p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/40">
                                        <p className="text-xs text-gray-500 dark:text-amber-300/80 uppercase font-semibold">Pending</p>
                                        <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{compliance_summary.pending}</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/40">
                                        <p className="text-xs text-gray-500 dark:text-red-300/80 uppercase font-semibold">Overdue</p>
                                        <p className="text-xl font-bold text-red-700 dark:text-red-400">{compliance_summary.overdue}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-md font-bold text-gray-700 dark:text-slate-200 mt-4">Program Comparison</h3>
                            <div className="flex flex-col gap-3">
                                {program_compliance.map((p: any) => (
                                    <div key={p.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700 dark:text-slate-200">{p.name}</span>
                                            <span className="text-gray-600 dark:text-slate-400">{p.compliance_rate}% Compliance</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${p.compliance_rate}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Urgent Pending Outputs */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 transition-colors">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Urgent Pending Outputs</h2>
                                <Link href="/compliance/pending-outputs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                                    View All <ArrowRight size={14} />
                                </Link>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                                            <th className="pb-2 font-medium">Faculty</th>
                                            <th className="pb-2 font-medium">Program</th>
                                            <th className="pb-2 font-medium">Requirement</th>
                                            <th className="pb-2 font-medium">Deadline</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {urgent_pending.map((p: any) => (
                                            <tr key={p.id} className="border-b border-gray-100 dark:border-slate-800/70 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 font-medium text-gray-800 dark:text-slate-200">{p.faculty}</td>
                                                <td className="py-3 text-gray-600 dark:text-slate-400">{p.program}</td>
                                                <td className="py-3 text-gray-800 dark:text-slate-200">{p.requirement}</td>
                                                <td className="py-3 text-gray-600 dark:text-slate-400">{p.due_date}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                        p.status === 'Overdue' 
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border dark:border-red-800/50' 
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/50'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {urgent_pending.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-slate-400">No pending outputs. Great job!</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (1/3 width on LG) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* Today's Schedule */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 transition-colors">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
                                    Today's Schedule
                                </h2>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {todays_schedule.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start border-l-2 border-blue-400 dark:border-blue-500 pl-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{item.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{item.time} &bull; {item.venue}</p>
                                        </div>
                                        <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">{item.type}</span>
                                    </div>
                                ))}
                                {todays_schedule.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-slate-400 italic">No scheduled meetings or activities today.</p>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-100 dark:border-slate-800 transition-colors">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">Upcoming Deadlines</h2>
                            <div className="flex flex-col gap-3">
                                {upcoming_deadlines.map((req: any) => (
                                    <div key={req.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-transparent dark:border-slate-800/50">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{req.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{req.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{req.due_date}</p>
                                        </div>
                                    </div>
                                ))}
                                {upcoming_deadlines.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-slate-400 italic">No upcoming deadlines.</p>
                                )}
                            </div>
                        </div>

                        {/* Top Programs */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 p-6 rounded-xl shadow-xs border border-indigo-100 dark:border-indigo-900/50 transition-colors">
                            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 mb-4 border-b border-indigo-200 dark:border-indigo-800/60 pb-2">
                                <Trophy size={18} className="text-yellow-500" />
                                Top Performing Programs
                            </h2>
                            <div className="flex flex-col gap-4">
                                {top_programs.map((p: any, i: number) => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                            i === 0 
                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700' 
                                                : 'bg-white text-gray-500 border border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                        }`}>
                                            #{i+1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">{p.name}</p>
                                            <p className="text-xs text-indigo-700 dark:text-indigo-300">{p.on_time_rate}% On-Time &bull; {p.compliance_rate}% Comp.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800/60">
                                <Link href="/performance/program" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">View Full Rankings &rarr;</Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
