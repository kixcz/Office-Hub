import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Briefcase,
    Calendar,
    Clock,
    Printer,
    FileSpreadsheet,
    Lock,
    Unlock,
    Building2,
    GraduationCap,
    CheckCircle2,
    BookOpen,
    Layers,
    Award,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Portal', href: '/faculty/dashboard' },
    { title: 'Personal Workload', href: '/faculty/workload' },
];

interface Assignment {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface PageProps {
    faculty: any;
    currentPeriod: any;
    assignments: Assignment[];
    teachingUnits: number;
    teachingHours: number;
    designationCredits: number;
    researchCredits: number;
    extensionCredits: number;
    administrativeCredits: number;
    totalWorkload: number;
    isLocked: boolean;
    documentVersion: string;
}

export default function FacultyWorkloadPage({
    faculty,
    currentPeriod,
    assignments = [],
    teachingUnits = 0,
    teachingHours = 0,
    designationCredits = 0,
    researchCredits = 0,
    extensionCredits = 0,
    administrativeCredits = 0,
    totalWorkload = 0,
    isLocked = false,
    documentVersion = 'v1.0',
}: PageProps) {
    const [viewMode, setViewMode] = useState<'dashboard' | 'official_form'>('dashboard');

    const handlePrint = () => {
        window.print();
    };

    const getStatusText = (total: number) => {
        if (total < 18) return { text: 'Underload', color: 'text-amber-600 bg-amber-500/10 border-amber-200' };
        if (total > 21) return { text: 'Overload', color: 'text-rose-600 bg-rose-500/10 border-rose-200' };
        return { text: 'Regular / Balanced Load', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' };
    };

    const statusBadge = getStatusText(totalWorkload);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Workload & Form" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Screen Top Header (Hidden on print) */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4 print:hidden">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Faculty Personal Workload</h1>
                            {isLocked ? (
                                <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                                    <Lock className="h-3 w-3" />
                                    Officially Locked ({documentVersion})
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                                    <Unlock className="h-3 w-3" />
                                    Provisional (Pending Official Lock)
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review your authoritative teaching assignments, quasi-teaching/research credits, and generate your printable Faculty Workload Form (FWF).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border bg-muted p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('dashboard')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    viewMode === 'dashboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Dashboard View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('official_form')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    viewMode === 'official_form' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Official Workload Form (FWF)
                            </button>
                        </div>

                        <Button onClick={handlePrint} size="sm" className="gap-2 bg-primary text-primary-foreground">
                            <Printer className="h-4 w-4" />
                            Print Official Form
                        </Button>
                    </div>
                </div>

                {/* Dashboard Mode */}
                {viewMode === 'dashboard' && (
                    <div className="space-y-6 print:hidden">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teaching Units</span>
                                <div className="mt-2 text-2xl font-bold">{teachingUnits.toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">{assignments.length} assigned sections</p>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teaching Hours</span>
                                <div className="mt-2 text-2xl font-bold">{teachingHours.toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">hrs/week contact</p>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Designation / Admin</span>
                                <div className="mt-2 text-2xl font-bold">{(designationCredits + administrativeCredits).toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">credit units</p>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Research / Ext</span>
                                <div className="mt-2 text-2xl font-bold">{(researchCredits + extensionCredits).toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">deloading units</p>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm col-span-2 bg-primary/5 border-primary/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Total Workload</span>
                                    <Badge variant="outline" className={`text-xs ${statusBadge.color}`}>
                                        {statusBadge.text}
                                    </Badge>
                                </div>
                                <div className="mt-2 text-3xl font-extrabold text-primary">{totalWorkload.toFixed(1)} Units</div>
                                <p className="text-xs text-muted-foreground mt-0.5">Authoritative active semester computation</p>
                            </div>
                        </div>

                        {/* Teaching Load Schedule Table */}
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <h2 className="font-semibold text-sm">Classroom & Laboratory Teaching Allocations</h2>
                                </div>
                                <span className="text-xs text-muted-foreground">Source: Published Master Timetable</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3 px-4">Subject Code</th>
                                            <th className="py-3 px-4">Descriptive Title</th>
                                            <th className="py-3 px-4">Section</th>
                                            <th className="py-3 px-4">Day</th>
                                            <th className="py-3 px-4">Time</th>
                                            <th className="py-3 px-4">Room / Lab</th>
                                            <th className="py-3 px-4 text-right">Units</th>
                                            <th className="py-3 px-4 text-right">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {assignments.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    No teaching assignments recorded for this semester yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            assignments.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="py-3 px-4 font-mono font-medium text-foreground">{item.course_code}</td>
                                                    <td className="py-3 px-4">{item.course_title}</td>
                                                    <td className="py-3 px-4 font-medium">{item.section}</td>
                                                    <td className="py-3 px-4">{item.day_of_week}</td>
                                                    <td className="py-3 px-4 text-xs font-mono">{item.start_time} - {item.end_time}</td>
                                                    <td className="py-3 px-4 text-xs">{item.room_name || 'TBA'}</td>
                                                    <td className="py-3 px-4 text-right font-semibold">3.0</td>
                                                    <td className="py-3 px-4 text-right font-semibold">3.0</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t bg-muted/30 font-semibold text-xs">
                                            <td colSpan={6} className="py-3 px-4 text-right uppercase text-muted-foreground">Subtotal Teaching Units:</td>
                                            <td className="py-3 px-4 text-right">{teachingUnits.toFixed(1)}</td>
                                            <td className="py-3 px-4 text-right">{teachingHours.toFixed(1)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Non-Teaching Credits Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <Award className="h-4 w-4 text-amber-500" />
                                    <h3 className="font-semibold text-sm">Administrative & Quasi-Teaching Duties</h3>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-dashed">
                                        <span className="text-muted-foreground">Program Head / Department Designation:</span>
                                        <span className="font-medium">{designationCredits.toFixed(1)} Units</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-dashed">
                                        <span className="text-muted-foreground">College Committee & Special Assignments:</span>
                                        <span className="font-medium">{administrativeCredits.toFixed(1)} Units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Research, Creative Works & Extension</h3>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-dashed">
                                        <span className="text-muted-foreground">Approved Research Study Deloading:</span>
                                        <span className="font-medium">{researchCredits.toFixed(1)} Units</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-dashed">
                                        <span className="text-muted-foreground">Community Extension Project Coordination:</span>
                                        <span className="font-medium">{extensionCredits.toFixed(1)} Units</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Printable Official Form (FWF) Component */}
                <div className={`${viewMode === 'official_form' ? 'block' : 'hidden'} print:block bg-white dark:bg-zinc-950 p-8 rounded-xl border shadow-md max-w-4xl mx-auto text-black dark:text-white print:p-0 print:border-none print:shadow-none print:max-w-none`}>
                    {/* Header */}
                    <div className="text-center space-y-1 border-b-2 border-black dark:border-white pb-4 mb-6">
                        <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Republic of the Philippines</div>
                        <div className="text-lg font-extrabold uppercase tracking-wide">University of Science and Technology</div>
                        <div className="text-sm font-semibold">College of Information and Communications Technology</div>
                        <div className="text-base font-bold underline mt-2 tracking-wide uppercase">FACULTY WORKLOAD FORM (FWF)</div>
                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {currentPeriod?.academic_year || 'A.Y. 2026-2027'} | {currentPeriod?.semester || '1st Semester'}
                        </div>
                    </div>

                    {/* Faculty Profile Summary Table */}
                    <div className="grid grid-cols-2 gap-4 text-xs mb-6 border p-3 rounded">
                        <div>
                            <div><span className="font-semibold">Faculty Name:</span> {faculty?.first_name} {faculty?.last_name}</div>
                            <div><span className="font-semibold">Academic Rank:</span> {faculty?.academic_rank || 'Instructor I'}</div>
                            <div><span className="font-semibold">Department / Program:</span> {faculty?.program?.name || 'Computer Science'}</div>
                        </div>
                        <div className="text-right">
                            <div><span className="font-semibold">Employment Status:</span> {faculty?.employment_type || 'Full-Time'}</div>
                            <div><span className="font-semibold">Document Version:</span> {documentVersion}</div>
                            <div><span className="font-semibold">Status:</span> {isLocked ? 'OFFICIAL / LOCKED' : 'PROVISIONAL'}</div>
                        </div>
                    </div>

                    {/* Section I: Teaching Load */}
                    <div className="mb-6">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 border">
                            I. INSTRUCTIONAL / CLASSROOM TEACHING LOAD
                        </div>
                        <table className="w-full text-left text-xs border border-collapse">
                            <thead>
                                <tr className="border-b bg-zinc-50 dark:bg-zinc-900/50 font-semibold">
                                    <th className="border p-2">Course Code</th>
                                    <th className="border p-2">Descriptive Title</th>
                                    <th className="border p-2">Section</th>
                                    <th className="border p-2">Schedule Day & Time</th>
                                    <th className="border p-2">Room</th>
                                    <th className="border p-2 text-right">Units</th>
                                    <th className="border p-2 text-right">Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center p-3 text-zinc-500">No assigned courses</td>
                                    </tr>
                                ) : (
                                    assignments.map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="border p-2 font-mono font-medium">{item.course_code}</td>
                                            <td className="border p-2">{item.course_title}</td>
                                            <td className="border p-2">{item.section}</td>
                                            <td className="border p-2">{item.day_of_week} {item.start_time}-{item.end_time}</td>
                                            <td className="border p-2">{item.room_name}</td>
                                            <td className="border p-2 text-right font-medium">3.0</td>
                                            <td className="border p-2 text-right font-medium">3.0</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-zinc-50 dark:bg-zinc-900/50">
                                    <td colSpan={5} className="border p-2 text-right">SUBTOTAL TEACHING LOAD:</td>
                                    <td className="border p-2 text-right">{teachingUnits.toFixed(1)}</td>
                                    <td className="border p-2 text-right">{teachingHours.toFixed(1)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Section II: Quasi-Teaching & Other Credits */}
                    <div className="mb-6">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 border">
                            II. ADMINISTRATIVE, RESEARCH & EXTENSION CREDITS
                        </div>
                        <table className="w-full text-left text-xs border border-collapse">
                            <thead>
                                <tr className="border-b bg-zinc-50 dark:bg-zinc-900/50 font-semibold">
                                    <th className="border p-2">Category</th>
                                    <th className="border p-2">Description / Designation / Study</th>
                                    <th className="border p-2 text-right">Approved Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="border p-2 font-medium">Administrative Designation</td>
                                    <td className="border p-2">{faculty?.designation || 'Academic Staff Duty'}</td>
                                    <td className="border p-2 text-right">{designationCredits.toFixed(1)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="border p-2 font-medium">Research Load Deloading</td>
                                    <td className="border p-2">University / College Sponsored Research Grant</td>
                                    <td className="border p-2 text-right">{researchCredits.toFixed(1)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="border p-2 font-medium">Community Extension Service</td>
                                    <td className="border p-2">Accredited Extension & Outreach Programs</td>
                                    <td className="border p-2 text-right">{extensionCredits.toFixed(1)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="border p-2 font-medium">Committee / Special Assignment</td>
                                    <td className="border p-2">Institutional Quality Assurance & Taskforces</td>
                                    <td className="border p-2 text-right">{administrativeCredits.toFixed(1)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-zinc-50 dark:bg-zinc-900/50">
                                    <td colSpan={2} className="border p-2 text-right">SUBTOTAL OTHER CREDITS:</td>
                                    <td className="border p-2 text-right">
                                        {(designationCredits + researchCredits + extensionCredits + administrativeCredits).toFixed(1)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Total Summary */}
                    <div className="mb-8 p-3 border-2 border-black dark:border-white flex justify-between items-center text-sm font-bold">
                        <span>GRAND TOTAL OFFICIAL SEMESTER WORKLOAD:</span>
                        <span className="text-base">{totalWorkload.toFixed(1)} UNITS ({statusBadge.text.toUpperCase()})</span>
                    </div>

                    {/* Dynamic Signatories Section */}
                    <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                        <div className="space-y-12">
                            <div>Prepared and Conformed by:</div>
                            <div className="border-t border-black dark:border-white pt-1.5">
                                <div className="font-bold uppercase">{faculty?.first_name} {faculty?.last_name}</div>
                                <div className="text-[11px] text-zinc-500">Faculty Member</div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div>Verified and Endorsed by:</div>
                            <div className="border-t border-black dark:border-white pt-1.5">
                                <div className="font-bold uppercase">Dr. Angela Reyes</div>
                                <div className="text-[11px] text-zinc-500">Program Chairperson</div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div>Approved by:</div>
                            <div className="border-t border-black dark:border-white pt-1.5">
                                <div className="font-bold uppercase">Dr. Ramon Santos, PECE</div>
                                <div className="text-[11px] text-zinc-500">College Dean</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t text-[10px] text-zinc-400 text-center font-mono">
                        Document generated from UST-OfficeHub Master Scheduling Core | Date: {new Date().toLocaleDateString()} | Lock Status: {isLocked ? 'LOCKED' : 'PROVISIONAL'}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
