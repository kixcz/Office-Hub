import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Briefcase,
    BookOpen,
    Clock,
    FileCheck,
    AlertCircle,
    Info
} from 'lucide-react';

interface Props {
    faculty: any;
    courses: Array<any>;
    total_units: number;
    total_hours: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Faculty Loading', href: '/faculty/loading' },
];

export default function FacultyLoadingPage({ faculty, courses = [], total_units, total_hours }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Loading - Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0B3A67] via-[#175C94] to-[#8B1E3F] p-6 md:p-7 shadow-lg text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs shadow-xs">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xs">Approved Faculty Workload</h1>
                                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                                    Approved teaching assignments and credited workload for AY 2026–2027, 1st Semester.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 backdrop-blur-xs shadow-2xs">
                                Official Load Assignment
                            </span>
                        </div>
                    </div>
                </div>

                {/* Workload Metric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Total Teaching Units</div>
                        <div className="text-2xl font-black text-foreground mt-1">{total_units} Units</div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Full-Time Standard Met</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Contact Hours / Week</div>
                        <div className="text-2xl font-black text-foreground mt-1">{total_hours} Hours</div>
                        <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Lecture & Laboratory</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Course Preparations</div>
                        <div className="text-2xl font-black text-foreground mt-1">{courses.length} Preps</div>
                        <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Assigned Subjects</div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs">
                        <div className="text-xs font-semibold text-muted-foreground">Workload Status</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">Approved</div>
                        <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Dean Verified</div>
                    </div>
                </div>

                {/* Assigned Courses Table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                    <div className="p-5 border-b border-border/60">
                        <h3 className="text-sm font-bold text-foreground">Course Teaching Assignments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="p-3.5 font-bold">Course Code</th>
                                    <th className="p-3.5 font-bold">Course Title</th>
                                    <th className="p-3.5 font-bold">Assigned Section</th>
                                    <th className="p-3.5 font-bold">Room</th>
                                    <th className="p-3.5 font-bold">Days</th>
                                    <th className="p-3.5 font-bold">Units</th>
                                    <th className="p-3.5 font-bold">Hours/Wk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-medium">
                                {courses.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                        <td className="p-3.5 font-bold text-foreground">{c.course_code}</td>
                                        <td className="p-3.5 font-semibold text-foreground">{c.course_title}</td>
                                        <td className="p-3.5 text-muted-foreground">{c.section}</td>
                                        <td className="p-3.5 text-muted-foreground">{c.room}</td>
                                        <td className="p-3.5 text-muted-foreground">{c.days}</td>
                                        <td className="p-3.5 font-bold text-foreground">{c.units}</td>
                                        <td className="p-3.5 font-bold text-foreground">{c.hours}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
