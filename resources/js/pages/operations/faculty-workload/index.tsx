import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    Briefcase,
    Users,
    CheckCircle2,
    Lock,
    Unlock,
    Search,
    Printer,
    FileText,
    Building2,
    Calendar,
    ChevronRight,
    Clock,
    ShieldAlert,
    AlertTriangle,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/faculty-workload' },
    { title: 'Faculty Workload Management', href: '/operations/faculty-workload' },
];

interface WorkloadItem {
    faculty_id: number;
    faculty: {
        id: number;
        name: string;
        academic_rank: string;
        employment_type: string;
        program: string;
    };
    teaching_units: number;
    teaching_hours: number;
    assigned_sections_count: number;
    designation_credits: number;
    research_credits: number;
    extension_credits: number;
    administrative_credits: number;
    total_workload: number;
    workload_status: 'Underload' | 'Balanced' | 'Overload';
    is_locked: boolean;
    document_version: string;
    assignments: Array<{
        id: number;
        course_code: string;
        course_title: string;
        section: string;
        room_name: string;
        day_of_week: string;
        start_time: string;
        end_time: string;
    }>;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    workloads: WorkloadItem[];
    metrics: {
        total_faculty: number;
        balanced_count: number;
        underload_count: number;
        overload_count: number;
        locked_documents_count: number;
    };
    programs: any[];
    filters: any;
}

export default function FacultyWorkloadIndex({
    currentPeriod,
    workloads = [],
    metrics,
    programs = [],
    filters = {},
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filterProgram, setFilterProgram] = useState(filters.program_id || 'all');
    const [selectedWorkload, setSelectedWorkload] = useState<WorkloadItem | null>(null);

    const filteredWorkloads = useMemo(() => {
        return workloads.filter((w) => {
            const matchesSearch =
                w.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.faculty.academic_rank.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram = filterProgram === 'all' || String(w.faculty.program) === String(filterProgram);
            return matchesSearch && matchesProgram;
        });
    }, [workloads, searchTerm, filterProgram]);

    const handleToggleLock = (facultyId: number, currentlyLocked: boolean) => {
        const action = currentlyLocked ? 'unlock' : 'lock';
        router.post(`/operations/faculty-workload/${facultyId}/${action}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Workload Management - CIDS OfficeHub" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                                Workload Governance
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                Active Period: {currentPeriod ? `${currentPeriod.academic_year} - ${currentPeriod.semester}` : 'AY 2026-2027'}
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            College-wide Faculty Workload Management
                        </h1>
                        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                            Governed validation of teaching assignments, research, extension, and designation credits. Lock official workload forms to prevent silent alterations and export certified institutional copies.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="text-xs gap-1.5" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" /> Print College Summary
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-2xs">
                        <span className="text-xs font-medium text-muted-foreground">Total Faculty</span>
                        <p className="mt-2 text-2xl font-bold text-foreground">{metrics.total_faculty}</p>
                        <p className="text-[11px] text-muted-foreground">Department roster</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:bg-emerald-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Balanced Load</span>
                        <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">{metrics.balanced_count}</p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">18.0 – 21.0 Units</p>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 p-4 dark:bg-amber-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Underload Warning</span>
                        <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">{metrics.underload_count}</p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400">&lt; 18.0 Total Units</p>
                    </div>

                    <div className="rounded-xl border border-rose-500/20 bg-rose-50/40 p-4 dark:bg-rose-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-rose-800 dark:text-rose-300">Overload Warning</span>
                        <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-200">{metrics.overload_count}</p>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-400">&gt; 21.0 Total Units</p>
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-50/40 p-4 dark:bg-blue-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Locked / Issued Forms</span>
                        <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-200">{metrics.locked_documents_count}</p>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-400">Official certified versions</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search instructor name or rank..."
                            className="pl-8 text-xs h-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9"
                            value={filterProgram}
                            onChange={(e) => setFilterProgram(e.target.value)}
                        >
                            <option value="all">All Departments / Programs</option>
                            {programs.map((p) => (
                                <option key={p.id} value={p.code}>
                                    {p.name} ({p.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* College Workload Master Table */}
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/40 font-semibold uppercase text-[11px] text-muted-foreground">
                                <th className="py-3 px-4">Faculty Member</th>
                                <th className="py-3 px-4">Program / Rank</th>
                                <th className="py-3 px-4">Teaching Units</th>
                                <th className="py-3 px-4">Research &amp; Ext.</th>
                                <th className="py-3 px-4">Designation / Admin</th>
                                <th className="py-3 px-4">Total Load</th>
                                <th className="py-3 px-4">Status &amp; Lock</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {filteredWorkloads.map((item) => (
                                <tr key={item.faculty_id} className="hover:bg-muted/20 transition-colors">
                                    <td className="py-3 px-4">
                                        <span className="font-bold text-foreground block">{item.faculty.name}</span>
                                        <span className="text-[11px] text-muted-foreground">{item.faculty.employment_type}</span>
                                    </td>

                                    <td className="py-3 px-4">
                                        <Badge variant="outline" className="text-[11px] font-semibold">{item.faculty.program}</Badge>
                                        <span className="block text-[10px] text-muted-foreground mt-0.5">{item.faculty.academic_rank}</span>
                                    </td>

                                    <td className="py-3 px-4">
                                        <span className="font-bold text-foreground">{item.teaching_units.toFixed(1)} u</span>
                                        <span className="block text-[10px] text-muted-foreground">({item.assigned_sections_count} assigned classes)</span>
                                    </td>

                                    <td className="py-3 px-4">
                                        <span className="text-foreground font-medium">{(item.research_credits + item.extension_credits).toFixed(1)} u</span>
                                        <span className="block text-[10px] text-muted-foreground">R: {item.research_credits} | E: {item.extension_credits}</span>
                                    </td>

                                    <td className="py-3 px-4">
                                        <span className="text-foreground font-medium">{(item.designation_credits + item.administrative_credits).toFixed(1)} u</span>
                                        <span className="block text-[10px] text-muted-foreground">Des: {item.designation_credits} | Adm: {item.administrative_credits}</span>
                                    </td>

                                    <td className="py-3 px-4">
                                        <span className="text-sm font-extrabold text-foreground">{item.total_workload.toFixed(1)}</span>
                                        <Badge
                                            className={`ml-2 text-[10px] ${
                                                item.workload_status === 'Balanced'
                                                    ? 'bg-emerald-600 text-white'
                                                    : item.workload_status === 'Underload'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-rose-600 text-white'
                                            }`}
                                        >
                                            {item.workload_status}
                                        </Badge>
                                    </td>

                                    <td className="py-3 px-4">
                                        {item.is_locked ? (
                                            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                                                <Lock className="h-3.5 w-3.5 text-blue-600" />
                                                <span>Locked ({item.document_version})</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                                <Unlock className="h-3.5 w-3.5 text-amber-500" />
                                                <span>Draft / Unlocked</span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-[11px] gap-1"
                                                onClick={() => setSelectedWorkload(item)}
                                            >
                                                <Eye className="h-3 w-3" /> View Workload
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`h-7 text-[11px] gap-1 ${item.is_locked ? 'border-amber-400 text-amber-800' : 'border-blue-400 text-blue-800'}`}
                                                onClick={() => handleToggleLock(item.faculty_id, item.is_locked)}
                                            >
                                                {item.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                {item.is_locked ? 'Unlock' : 'Lock Form'}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: View Specific Faculty Workload Form */}
            <Dialog open={!!selectedWorkload} onOpenChange={() => setSelectedWorkload(null)}>
                <DialogContent className="max-w-3xl font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                Faculty Workload Sheet: {selectedWorkload?.faculty.name}
                            </span>
                            <Badge variant="outline">{selectedWorkload?.document_version}</Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Official academic workload and assigned teaching responsibilities for AY 2026–2027.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWorkload && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/30 p-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">Rank</span>
                                    <strong>{selectedWorkload.faculty.academic_rank}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">Department</span>
                                    <strong>{selectedWorkload.faculty.program}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">Teaching Units</span>
                                    <strong>{selectedWorkload.teaching_units} Units</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">Total Computed Load</span>
                                    <strong className="text-primary">{selectedWorkload.total_workload} Units</strong>
                                </div>
                            </div>

                            <div className="border border-border/50 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/40 font-semibold uppercase text-[10px] text-muted-foreground border-b border-border/30">
                                        <tr>
                                            <th className="p-2.5">Course Code &amp; Title</th>
                                            <th className="p-2.5">Section</th>
                                            <th className="p-2.5">Schedule &amp; Room</th>
                                            <th className="p-2.5 text-right">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {selectedWorkload.assignments.map((a) => (
                                            <tr key={a.id}>
                                                <td className="p-2.5">
                                                    <span className="font-bold">{a.course_code}</span> - {a.course_title}
                                                </td>
                                                <td className="p-2.5 font-semibold">{a.section}</td>
                                                <td className="p-2.5 text-muted-foreground">
                                                    {a.day_of_week} {a.start_time.substring(0, 5)}–{a.end_time.substring(0, 5)} ({a.room_name})
                                                </td>
                                                <td className="p-2.5 text-right font-bold">3.0</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button variant="outline" onClick={() => setSelectedWorkload(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => window.print()} className="gap-1.5">
                                    <Printer className="h-4 w-4" /> Export Official Workload Form PDF
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
