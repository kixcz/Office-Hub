import React from 'react';
import AppLayout from '@/layouts/app-layout';
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
            
            <div className="flex flex-col gap-6 p-6 pb-12 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Control Center</h1>
                        <p className="text-gray-500 font-medium">{current_term}</p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                        <p className="text-lg font-semibold text-gray-700">{today}</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/compliance/requirements" className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Requirements</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_requirements}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                <FileText size={24} />
                            </div>
                        </div>
                    </Link>
                    
                    <Link href="/compliance/submissions" className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_submissions}</p>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                    </Link>

                    <Link href="/compliance/pending-outputs" className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Outputs</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending_outputs}</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-full text-amber-600">
                                <Clock size={24} />
                            </div>
                        </div>
                    </Link>

                    <Link href="/compliance/pending-outputs" className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Overdue Outputs</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overdue_outputs}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-full text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width on LG) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Compliance Summary & Programs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">College-Wide Compliance</h2>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Overall Dial/Number */}
                                <div className="flex flex-col items-center justify-center border-4 border-green-500 rounded-full w-40 h-40">
                                    <span className="text-4xl font-bold text-gray-900">{compliance_summary.compliance_rate}%</span>
                                    <span className="text-xs text-gray-500 font-medium">Complied</span>
                                </div>
                                
                                {/* Breakdown */}
                                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">On-Time</p>
                                        <p className="text-xl font-bold text-green-700">{compliance_summary.on_time}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Late</p>
                                        <p className="text-xl font-bold text-blue-700">{compliance_summary.late}</p>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
                                        <p className="text-xl font-bold text-amber-700">{compliance_summary.pending}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Overdue</p>
                                        <p className="text-xl font-bold text-red-700">{compliance_summary.overdue}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-md font-bold text-gray-700 mt-4">Program Comparison</h3>
                            <div className="flex flex-col gap-3">
                                {program_compliance.map((p: any) => (
                                    <div key={p.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700">{p.name}</span>
                                            <span className="text-gray-600">{p.compliance_rate}% Compliance</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${p.compliance_rate}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Urgent Pending Outputs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center border-b pb-2 mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Urgent Pending Outputs</h2>
                                <Link href="/compliance/pending-outputs" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    View All <ArrowRight size={14} />
                                </Link>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b">
                                            <th className="pb-2 font-medium">Faculty</th>
                                            <th className="pb-2 font-medium">Program</th>
                                            <th className="pb-2 font-medium">Requirement</th>
                                            <th className="pb-2 font-medium">Deadline</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {urgent_pending.map((p: any) => (
                                            <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="py-3 font-medium text-gray-800">{p.faculty}</td>
                                                <td className="py-3 text-gray-600">{p.program}</td>
                                                <td className="py-3 text-gray-800">{p.requirement}</td>
                                                <td className="py-3 text-gray-600">{p.due_date}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {urgent_pending.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-gray-500">No pending outputs. Great job!</td>
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center border-b pb-2 mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CalendarDays size={18} className="text-blue-600" />
                                    Today's Schedule
                                </h2>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {todays_schedule.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start border-l-2 border-blue-400 pl-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.time} &bull; {item.venue}</p>
                                        </div>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.type}</span>
                                    </div>
                                ))}
                                {todays_schedule.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No scheduled meetings or activities today.</p>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Upcoming Deadlines</h2>
                            <div className="flex flex-col gap-3">
                                {upcoming_deadlines.map((req: any) => (
                                    <div key={req.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">{req.title}</p>
                                            <p className="text-xs text-gray-500">{req.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-amber-600">{req.due_date}</p>
                                        </div>
                                    </div>
                                ))}
                                {upcoming_deadlines.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No upcoming deadlines.</p>
                                )}
                            </div>
                        </div>

                        {/* Top Programs */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl shadow-sm border border-indigo-100">
                            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4 border-b border-indigo-200 pb-2">
                                <Trophy size={18} className="text-yellow-500" />
                                Top Performing Programs
                            </h2>
                            <div className="flex flex-col gap-4">
                                {top_programs.map((p: any, i: number) => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-white text-gray-500 border'}`}>
                                            #{i+1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-indigo-900 text-sm">{p.name}</p>
                                            <p className="text-xs text-indigo-700">{p.on_time_rate}% On-Time &bull; {p.compliance_rate}% Comp.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-indigo-200">
                                <Link href="/performance/program" className="text-xs font-semibold text-indigo-600 hover:underline">View Full Rankings &rarr;</Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
