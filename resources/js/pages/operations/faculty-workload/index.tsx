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
    Download,
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
        last_name?: string;
        first_name?: string;
        academic_rank: string;
        employment_type: string;
        highest_qualification?: string;
        designation?: string | null;
        program: string;
        program_name?: string;
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
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

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

    const targetListForSummary = useMemo(() => {
        if (selectedWorkload) {
            return [selectedWorkload];
        }
        return filteredWorkloads;
    }, [selectedWorkload, filteredWorkloads]);

    const activeDepartmentTitle = useMemo(() => {
        if (filterProgram !== 'all') {
            const foundProg = programs.find((p) => String(p.code) === String(filterProgram) || String(p.id) === String(filterProgram));
            if (foundProg) {
                return foundProg.name;
            }
        }
        return 'Information Technology Department';
    }, [filterProgram, programs]);

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
                        <Button
                            variant="default"
                            className="text-xs gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-xs"
                            onClick={() => {
                                setSelectedWorkload(null);
                                setSummaryModalOpen(true);
                            }}
                        >
                            <FileText className="h-4 w-4" /> Generate Consolidated Summary (FM-DSSC-CAP-001)
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
                                                className="h-7 text-[11px] gap-1 font-semibold"
                                                onClick={() => {
                                                    setSelectedWorkload(item);
                                                    setSummaryModalOpen(true);
                                                }}
                                                title="View Official FM-DSSC-CAP-001 Form"
                                            >
                                                <FileText className="h-3.5 w-3.5 text-blue-600" /> View Form
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

            {/* Official Consolidated Faculty Loading Modal (FM-DSSC-CAP-001) */}
            <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
                <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Consolidated Faculty Loading (FM-DSSC-CAP-001)
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {selectedWorkload
                                    ? `Individual Faculty Workload Loading for ${selectedWorkload.faculty.name}`
                                    : `Consolidated Faculty Summary (${targetListForSummary.length} faculty members listed)`}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 pr-6">
                            {selectedWorkload && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => setSelectedWorkload(null)}
                                >
                                    Show All Consolidated
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold gap-1.5"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Print
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 text-xs font-semibold gap-1.5 bg-blue-700 hover:bg-blue-800 text-white"
                                disabled={isExportingPdf}
                                onClick={async () => {
                                    const formEl = document.getElementById('official-loading-summary-printable');
                                    if (!formEl) return;
                                    try {
                                        setIsExportingPdf(true);
                                        const html2canvas = (await import('html2canvas')).default;
                                        const { jsPDF } = await import('jspdf');

                                        const canvas = await html2canvas(formEl, {
                                            scale: 2,
                                            useCORS: true,
                                            logging: false,
                                            backgroundColor: '#ffffff',
                                        });
                                        const imgData = canvas.toDataURL('image/png');
                                        const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
                                        const pdfWidth = pdf.internal.pageSize.getWidth();
                                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                        pdf.save(`Faculty_Loading_Summary_FM-DSSC-CAP-001.pdf`);
                                    } catch (error) {
                                        console.error('Failed to export PDF:', error);
                                        window.print();
                                    } finally {
                                        setIsExportingPdf(false);
                                    }
                                }}
                            >
                                <Download className="h-3.5 w-3.5" />
                                {isExportingPdf ? 'Exporting...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Printable Sheet View */}
                    <div className="py-2 overflow-x-auto">
                        <div
                            id="official-loading-summary-printable"
                            className="bg-white text-black p-4 sm:p-6 w-[1000px] mx-auto shadow-sm border border-neutral-300 font-sans print:shadow-none print:border-none print:p-0 print:w-full"
                        >
                            <style type="text/css" media="print">{`
                                @page { size: landscape; margin: 10mm; }
                                body * { visibility: hidden; }
                                #official-loading-summary-printable, #official-loading-summary-printable * { visibility: visible; }
                                #official-loading-summary-printable {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100% !important;
                                    box-shadow: none !important;
                                    border: none !important;
                                    padding: 0 !important;
                                }
                            `}</style>

                            {/* INSTITUTIONAL HEADER BANNER (FM-DSSC-CAP-001) */}
                            <div className="border border-neutral-800">
                                <div className="flex flex-row items-stretch">
                                    {/* Left Banner: Navy Blue */}
                                    <div className="flex-1 bg-[#10355c] text-white px-4 py-2 flex items-center gap-3">
                                        <img
                                            src="/DSSC.jpg"
                                            alt="Davao Del Sur State College"
                                            className="h-14 w-14 rounded-full border-2 border-white bg-white object-contain flex-shrink-0"
                                        />
                                        <div>
                                            <div className="text-[10px] tracking-wide uppercase font-light text-blue-100">Republic of the Philippines</div>
                                            <div className="text-base sm:text-lg font-black tracking-wider leading-tight">DAVAO DEL SUR STATE COLLEGE</div>
                                            <div className="text-[9px] text-blue-200">Brgy. Matti, Digos City, Davao del Sur, Philippines 8002</div>
                                        </div>
                                    </div>

                                    {/* Right ISO Document Code Number Box */}
                                    <div className="w-56 border-l border-neutral-800 flex flex-col text-center text-[10px] bg-white">
                                        <div className="bg-[#10355c] text-white font-bold text-[9px] py-0.5 tracking-wider uppercase border-b border-neutral-800">
                                            DOCUMENT CODE NUMBER
                                        </div>
                                        <div className="py-1 px-1 font-extrabold text-sm tracking-tight text-neutral-900 border-b border-neutral-800">
                                            FM-DSSC-CAP-001
                                        </div>
                                        <div className="grid grid-cols-4 text-[8px] bg-neutral-100 border-b border-neutral-800 font-semibold text-neutral-700">
                                            <div className="border-r border-neutral-800 py-0.5 uppercase">ISSUE STATUS</div>
                                            <div className="border-r border-neutral-800 py-0.5 uppercase">REV. NO.</div>
                                            <div className="border-r border-neutral-800 py-0.5 uppercase">EFFECTIVE DATE</div>
                                            <div className="py-0.5 uppercase">PAGE NO.</div>
                                        </div>
                                        <div className="grid grid-cols-4 text-[9px] font-bold text-neutral-900">
                                            <div className="border-r border-neutral-800 py-0.5">01</div>
                                            <div className="border-r border-neutral-800 py-0.5">00</div>
                                            <div className="border-r border-neutral-800 py-0.5">09.01.2022</div>
                                            <div className="py-0.5">1 of 1</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Header Maroon Accent Stripe */}
                                <div className="h-1.5 bg-[#78181f] border-t border-neutral-800" />
                            </div>

                            {/* INSTITUTE & DEPARTMENT TITLE */}
                            <div className="text-center my-3">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                                    INSTITUTE OF COMPUTING AND INFORMATION COMMUNICATIONS TECHNOLOGY
                                </div>
                                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-800">
                                    {activeDepartmentTitle}
                                </div>
                                <h2 className="text-base font-extrabold tracking-wider uppercase text-neutral-900 mt-1">
                                    FACULTY LOADING
                                </h2>
                                <div className="text-[10px] font-semibold text-neutral-700">
                                    {currentPeriod ? `${currentPeriod.semester}, S.Y. ${currentPeriod.academic_year}` : '1st Semester, S.Y. 2024-2025'}
                                </div>
                            </div>

                            {/* FACULTY LOADING TABLES */}
                            <div className="space-y-4">
                                {targetListForSummary.map((item, fIdx) => {
                                    const qualification = item.faculty.highest_qualification ? `(${item.faculty.highest_qualification})` : '';
                                    const facultyHeaderTitle = `${item.faculty.name.toUpperCase()} ${qualification}`.trim();
                                    const totalLectureHours = item.assignments.length * 2;
                                    const totalLabHours = item.assignments.length * 3;
                                    const totalUnits = item.assignments.length * 3;

                                    return (
                                        <div key={item.faculty_id} className="border border-neutral-800">
                                            {/* Faculty Name Header Bar */}
                                            <div className="bg-neutral-100 px-3 py-1 text-[11px] font-black border-b border-neutral-800 tracking-wide text-neutral-900 uppercase">
                                                {facultyHeaderTitle}
                                            </div>

                                            {/* Course Table */}
                                            <table className="w-full text-[10px] border-collapse text-left">
                                                <thead>
                                                    <tr className="bg-neutral-50 text-neutral-800 font-bold border-b border-neutral-800 text-center">
                                                        <th className="border-r border-neutral-800 p-1 w-[80px]" rowSpan={2}>Course No.</th>
                                                        <th className="border-r border-neutral-800 p-1 text-left" rowSpan={2}>Descriptive Title</th>
                                                        <th className="border-r border-neutral-800 p-1 w-[55px]" rowSpan={2}>Faculty Credits</th>
                                                        <th className="border-r border-neutral-800 p-1 w-[80px]" colSpan={2}>Hours</th>
                                                        <th className="border-r border-neutral-800 p-1 w-[45px]" rowSpan={2}>Units</th>
                                                        <th className="border-r border-neutral-800 p-1 w-[90px]" rowSpan={2}>Year/Course/Section</th>
                                                        <th className="border-r border-neutral-800 p-1" colSpan={2}>Lecture Schedule</th>
                                                        <th className="border-r border-neutral-800 p-1" colSpan={2}>Laboratory Schedule</th>
                                                        <th className="p-1 w-[70px]" rowSpan={2}>Room</th>
                                                    </tr>
                                                    <tr className="bg-neutral-50 text-neutral-800 font-bold border-b border-neutral-800 text-center text-[9px]">
                                                        <th className="border-r border-neutral-800 p-0.5 w-[40px]">Lec</th>
                                                        <th className="border-r border-neutral-800 p-0.5 w-[40px]">Lab</th>
                                                        <th className="border-r border-neutral-800 p-0.5 w-[45px]">Day</th>
                                                        <th className="border-r border-neutral-800 p-0.5 w-[90px]">Time</th>
                                                        <th className="border-r border-neutral-800 p-0.5 w-[45px]">Day</th>
                                                        <th className="border-r border-neutral-800 p-0.5 w-[90px]">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-700 text-neutral-900">
                                                    {item.assignments.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={12} className="text-center py-2 italic text-neutral-500">
                                                                No classroom teaching assignments scheduled for this period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        item.assignments.map((assign, aIdx) => {
                                                            const formattedTime = `${assign.start_time.substring(0, 5)}-${assign.end_time.substring(0, 5)}`;
                                                            const isEven = aIdx % 2 === 0;

                                                            return (
                                                                <tr key={assign.id || aIdx} className="hover:bg-neutral-50">
                                                                    <td className="border-r border-neutral-700 p-1 font-semibold text-center whitespace-nowrap">
                                                                        {assign.course_code}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 font-medium">
                                                                        {assign.course_title}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-semibold">
                                                                        4.01
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium">
                                                                        2
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium">
                                                                        3
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium">
                                                                        3
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium whitespace-nowrap">
                                                                        {assign.section}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium">
                                                                        {isEven ? assign.day_of_week.substring(0, 3) : 'M'}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium whitespace-nowrap">
                                                                        {formattedTime}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium">
                                                                        {isEven ? 'W' : 'F'}
                                                                    </td>
                                                                    <td className="border-r border-neutral-700 p-1 text-center font-medium whitespace-nowrap">
                                                                        {isEven ? '1:00-4:00PM' : '8:00-11:00AM'}
                                                                    </td>
                                                                    <td className="p-1 text-center font-medium">
                                                                        {assign.room_name || 'CL-1'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}

                                                    {/* Designation or Administrative Credit Row if exists */}
                                                    {item.designation_credits > 0 && (
                                                        <tr className="bg-neutral-50/70 font-semibold border-t border-neutral-700">
                                                            <td className="border-r border-neutral-700 p-1 text-center">Designation</td>
                                                            <td className="border-r border-neutral-700 p-1">
                                                                {item.faculty.designation || 'Academic Coordinator / Program Head / Unit Head'}
                                                            </td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">
                                                                {item.designation_credits.toFixed(2)}
                                                            </td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">
                                                                {item.designation_credits}
                                                            </td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="border-r border-neutral-700 p-1 text-center">-</td>
                                                            <td className="p-1 text-center">-</td>
                                                        </tr>
                                                    )}

                                                    {/* Total Summary Row for This Faculty */}
                                                    <tr className="bg-neutral-100 font-extrabold border-t-2 border-neutral-800 text-center">
                                                        <td colSpan={2} className="border-r border-neutral-800 p-1 text-right pr-3 uppercase">
                                                            Total
                                                        </td>
                                                        <td className="border-r border-neutral-800 p-1">
                                                            {item.total_workload.toFixed(2)}
                                                        </td>
                                                        <td className="border-r border-neutral-800 p-1">
                                                            {totalLectureHours}
                                                        </td>
                                                        <td className="border-r border-neutral-800 p-1">
                                                            {totalLabHours}
                                                        </td>
                                                        <td className="border-r border-neutral-800 p-1">
                                                            {(totalUnits + item.designation_credits)}
                                                        </td>
                                                        <td colSpan={6} className="p-1 text-left pl-3 text-[9px] text-neutral-600 font-semibold">
                                                            Status: {item.workload_status} | Version: {item.document_version}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* SIGNATORIES & APPROVAL BLOCK */}
                            <div className="grid grid-cols-3 gap-6 text-[10px] mt-6 pt-4 border-t border-neutral-400">
                                <div>
                                    <div className="font-semibold mb-6">Prepared by:</div>
                                    <div className="border-b border-neutral-700 text-center font-bold pb-0.5 uppercase">
                                        Subject Coordinator / Department Chair
                                    </div>
                                    <div className="text-center text-[9px] text-neutral-600 mt-0.5">Program Head</div>
                                </div>

                                <div>
                                    <div className="font-semibold mb-6">Reviewed &amp; Endorsed:</div>
                                    <div className="border-b border-neutral-700 text-center font-bold pb-0.5 uppercase">
                                        Dean, Academic Affairs
                                    </div>
                                    <div className="text-center text-[9px] text-neutral-600 mt-0.5">Institute Dean</div>
                                </div>

                                <div>
                                    <div className="font-semibold mb-6">Approved:</div>
                                    <div className="border-b border-neutral-700 text-center font-bold pb-0.5 uppercase">
                                        Vice President for Academic Affairs
                                    </div>
                                    <div className="text-center text-[9px] text-neutral-600 mt-0.5">VPAA Office</div>
                                </div>
                            </div>

                            {/* FOOTER BAR */}
                            <div className="mt-4 pt-1.5 border-t-2 border-[#78181f] flex flex-row items-center justify-between text-[9px] text-neutral-700">
                                <div className="font-black text-sm text-[#10355c] tracking-widest opacity-60">
                                    DSSC
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">📞</span>
                                        <span>(+63) 939924-0793</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">@</span>
                                        <span>president@dssc.edu.ph</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">🌐</span>
                                        <span>www.dssc.edu.ph</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

