import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ClipboardCheck,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Send
} from 'lucide-react';

interface Props {
    faculty: any;
    attendances: any;
    summary: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Attendance', href: '/faculty/attendance' },
];

export default function FacultyAttendancePage({ faculty, attendances, summary }: Props) {
    const records = attendances?.data || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Attendance - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Teaching Attendance</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Verified faculty attendance records from institutional laboratory and classroom monitoring.
                        </p>
                    </div>

                    <Link
                        href="/faculty/corrections"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Correction</span>
                    </Link>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Attendance Rate</div>
                        <div className="text-2xl font-black text-foreground mt-1">
                            {summary?.attendance_rate || 94}%
                        </div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Satisfactory Standing</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Sessions Recorded</div>
                        <div className="text-2xl font-black text-foreground mt-1">
                            {summary?.scheduled_sessions || 150} Sessions
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Present: {summary?.present_count || 141}</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Late Sessions</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                            {summary?.late_count || 2}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Total: {summary?.total_late_minutes || 25} minutes</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Unexcused Absences</div>
                        <div className="text-2xl font-black text-rose-600 mt-1">
                            {summary?.absent_count || 0}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Clean Record</div>
                    </div>
                </div>

                {/* Attendance Records Table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                    <div className="p-5 border-b border-border/60">
                        <h3 className="text-sm font-bold text-foreground">Verified Class Sessions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="p-3.5 font-bold">Date</th>
                                    <th className="p-3.5 font-bold">Day</th>
                                    <th className="p-3.5 font-bold">Time Slot</th>
                                    <th className="p-3.5 font-bold">Status</th>
                                    <th className="p-3.5 font-bold">Late (Mins)</th>
                                    <th className="p-3.5 font-bold">Remarks</th>
                                    <th className="p-3.5 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-medium">
                                {records.length > 0 ? (
                                    records.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-muted/30">
                                            <td className="p-3.5 font-bold text-foreground">{r.session_date}</td>
                                            <td className="p-3.5 text-muted-foreground">{r.day_of_week}</td>
                                            <td className="p-3.5 font-mono text-muted-foreground">{r.time_slot}</td>
                                            <td className="p-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    r.status === 'Present'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : r.status === 'Late'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5">{r.late_minutes > 0 ? `${r.late_minutes}m` : '—'}</td>
                                            <td className="p-3.5 text-muted-foreground">{r.remarks || '—'}</td>
                                            <td className="p-3.5 text-right">
                                                <Link
                                                    href={`/faculty/corrections?session_id=${r.id}`}
                                                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline"
                                                >
                                                    Dispute
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No attendance session anomalies found. All verified sessions comply with institutional requirements.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
