import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Scale,
    Users,
    Layers,
    Clock,
    FileText,
    Search,
    Plus,
    Download,
    Filter,
    Edit3,
    Trash2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    X,
    Building2,
    Calendar,
    Briefcase,
    GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Faculty Loading', href: '/schedule/loading' },
    { title: 'Faculty Credits', href: '/schedule/credits' },
];

export interface FacultyCreditRow {
    id: number;
    faculty_id: number;
    faculty_name: string;
    program_code: string;
    program_name?: string;
    credit_type: string;
    details: string;
    role: string;
    credited_units: number;
    status: 'Approved' | 'Pending' | 'Draft';
    academic_period_id?: number;
    created_at?: string;
}

interface FacultyListItem {
    id: number;
    name: string;
    program: string;
    rank: string;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    credits: FacultyCreditRow[];
    facultyList: FacultyListItem[];
    stats?: {
        total_faculty: number;
        with_credits: number;
        total_credits: number;
        avg_credits: number;
    };
}

export default function FacultyCreditsPage({
    currentPeriod,
    academicPeriods = [],
    credits = [],
    facultyList = [],
    stats = {
        total_faculty: 124,
        with_credits: 96,
        total_credits: 538.0,
        avg_credits: 4.3,
    },
}: Props) {
    // Seed initial display if empty
    const defaultSampleCredits: FacultyCreditRow[] = [
        {
            id: 101,
            faculty_id: 1,
            faculty_name: 'Prof. J. Dela Cruz',
            program_code: 'DIT Program',
            credit_type: 'Designation',
            details: 'Program Head (DIT)',
            role: 'Program Head (DIT)',
            credited_units: 6.0,
            status: 'Approved',
        },
        {
            id: 102,
            faculty_id: 2,
            faculty_name: 'Prof. M. Ramos',
            program_code: 'BSIS Program',
            credit_type: 'Research',
            details: 'Research Project (Funded)',
            role: 'Research Project (Funded)',
            credited_units: 3.0,
            status: 'Approved',
        },
        {
            id: 103,
            faculty_id: 3,
            faculty_name: 'Prof. K. Panaligan',
            program_code: 'DIT Program',
            credit_type: 'Extension',
            details: 'Community Extension Program',
            role: 'Community Extension Program',
            credited_units: 3.0,
            status: 'Approved',
        },
        {
            id: 104,
            faculty_id: 4,
            faculty_name: 'Prof. A. Torres',
            program_code: 'College',
            credit_type: 'Administrative',
            details: 'QA Coordinator',
            role: 'QA Coordinator',
            credited_units: 3.0,
            status: 'Approved',
        },
        {
            id: 105,
            faculty_id: 5,
            faculty_name: 'Prof. Domingo Origines',
            program_code: 'BSIT Program',
            credit_type: 'Designation',
            details: 'Dean Workload Credit',
            role: 'Dean (CIDS)',
            credited_units: 9.0,
            status: 'Approved',
        },
        {
            id: 106,
            faculty_id: 6,
            faculty_name: 'Prof. Jean Nikolai Roxas',
            program_code: 'BSCS Program',
            credit_type: 'Designation',
            details: 'Program Head (BSCS)',
            role: 'Program Head (BSCS)',
            credited_units: 6.0,
            status: 'Approved',
        },
        {
            id: 107,
            faculty_id: 7,
            faculty_name: 'Prof. Rhea Mae Perito',
            program_code: 'BSIS Program',
            credit_type: 'Research',
            details: 'AI Ethics Grant',
            role: 'Lead Researcher',
            credited_units: 3.0,
            status: 'Approved',
        },
        {
            id: 108,
            faculty_id: 8,
            faculty_name: 'Prof. Carlos Mendoza',
            program_code: 'BSDS Program',
            credit_type: 'Extension',
            details: 'Data Science Literacy Drive',
            role: 'Extension Coordinator',
            credited_units: 3.0,
            status: 'Approved',
        },
    ];

    const allCredits = credits && credits.length > 0 ? credits : defaultSampleCredits;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [rowsPerPage, setRowsPerPage] = useState(4);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCredit, setEditingCredit] = useState<FacultyCreditRow | null>(null);
    const [formData, setFormData] = useState({
        faculty_id: facultyList[0]?.id || 1,
        faculty_name: '',
        credit_type: 'Designation',
        details: '',
        credited_units: 3.0,
        status: 'Approved' as 'Approved' | 'Pending' | 'Draft',
    });

    const getInitials = (name: string) => {
        const cleaned = name.replace(/^(Prof\.|Dr\.|Engr\.|Mr\.|Ms\.)\s*/i, '').trim();
        const parts = cleaned.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return cleaned.slice(0, 2).toUpperCase();
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type.toLowerCase()) {
            case 'designation':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'research':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'extension':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'administrative':
                return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
        }
    };

    const filteredCredits = useMemo(() => {
        return allCredits.filter((item) => {
            const matchesSearch =
                item.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.program_code && item.program_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.details.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = selectedType === 'All' || item.credit_type.toLowerCase() === selectedType.toLowerCase();
            const matchesProgram =
                selectedProgram === 'All' ||
                (item.program_code && item.program_code.toLowerCase().includes(selectedProgram.toLowerCase()));
            const matchesStatus = selectedStatus === 'All' || item.status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesType && matchesProgram && matchesStatus;
        });
    }, [allCredits, searchQuery, selectedType, selectedProgram, selectedStatus]);

    const totalPages = Math.ceil(filteredCredits.length / rowsPerPage) || 1;
    const paginatedCredits = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredCredits.slice(start, start + rowsPerPage);
    }, [filteredCredits, currentPage, rowsPerPage]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(paginatedCredits.map((r) => r.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const handleOpenAdd = () => {
        setEditingCredit(null);
        setFormData({
            faculty_id: facultyList[0]?.id || 1,
            faculty_name: facultyList[0]?.name || '',
            credit_type: 'Designation',
            details: '',
            credited_units: 3.0,
            status: 'Approved',
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (item: FacultyCreditRow) => {
        setEditingCredit(item);
        setFormData({
            faculty_id: item.faculty_id,
            faculty_name: item.faculty_name,
            credit_type: item.credit_type,
            details: item.details,
            credited_units: item.credited_units,
            status: item.status,
        });
        setIsAddModalOpen(true);
    };

    const handleSaveCredit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCredit && editingCredit.id < 100) {
            // Real record update
            router.put(`/schedule/credits/${editingCredit.id}`, {
                category: formData.credit_type,
                credited_units: formData.credited_units,
                reference_memo: formData.details,
                status: formData.status,
            });
        } else if (editingCredit) {
            // Local fallback
            editingCredit.credit_type = formData.credit_type;
            editingCredit.details = formData.details;
            editingCredit.credited_units = Number(formData.credited_units);
            editingCredit.status = formData.status;
        } else {
            // Store new
            router.post('/schedule/credits', {
                faculty_id: formData.faculty_id,
                category: formData.credit_type,
                credited_units: formData.credited_units,
                reference_memo: formData.details,
                status: formData.status,
            });
        }
        setIsAddModalOpen(false);
    };

    const handleDeleteCredit = (item: FacultyCreditRow) => {
        if (confirm(`Remove workload credit "${item.details}" for ${item.faculty_name}?`)) {
            if (item.id < 100) {
                router.delete(`/schedule/credits/${item.id}`);
            } else {
                const idx = allCredits.findIndex((c) => c.id === item.id);
                if (idx > -1) {
                    allCredits.splice(idx, 1);
                }
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Credits - Semester Scheduling" />
            <SchedulingWorkspaceLayout
                currentPeriod={currentPeriod}
                academicPeriods={academicPeriods}
                title="Faculty Credits"
                subtitle="Manage faculty workload credits from designations, research, extension, and other assignments."
            >
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#60122B] text-white shadow-md shadow-[#8B1E3F]/20">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Faculty Credits
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Manage faculty workload credits from designations, research, extension, and other assignments.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleOpenAdd}
                                    className="gap-2 bg-[#8B1E3F] text-xs font-semibold text-white shadow-sm hover:bg-[#721833]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Credit
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 4 Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1E3F] dark:bg-[#8B1E3F]/20 dark:text-rose-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {stats.total_faculty}
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Faculty</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {stats.with_credits}
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">With Credits</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {Number(stats.total_credits).toFixed(1)}
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Credits (hrs)</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {Number(stats.avg_credits).toFixed(1)}
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg. Credits per Faculty</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search faculty (name, program)..."
                                className="pl-9 text-xs"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Credit Type:</span>
                                <select
                                    value={selectedType}
                                    onChange={(e) => {
                                        setSelectedType(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <option value="All">All</option>
                                    <option value="Designation">Designation</option>
                                    <option value="Research">Research</option>
                                    <option value="Extension">Extension</option>
                                    <option value="Administrative">Administrative</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Program:</span>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => {
                                        setSelectedProgram(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <option value="All">All</option>
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSIS">BSIS</option>
                                    <option value="BSCS">BSCS</option>
                                    <option value="BSDS">BSDS</option>
                                    <option value="DIT">DIT</option>
                                    <option value="College">College</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Status:</span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <option value="All">All</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                onClick={() => alert('Exporting faculty credits report...')}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Credits Table Card */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                    <tr>
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={
                                                    paginatedCredits.length > 0 &&
                                                    selectedRows.length === paginatedCredits.length
                                                }
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                        </th>
                                        <th className="px-4 py-3 font-semibold">Faculty</th>
                                        <th className="px-4 py-3 font-semibold">Credit Type</th>
                                        <th className="px-4 py-3 font-semibold">Details / Role</th>
                                        <th className="px-4 py-3 font-semibold">Credits (hrs)</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedCredits.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                No faculty credits found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCredits.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.includes(item.id)}
                                                        onChange={() => handleSelectRow(item.id)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {getInitials(item.faculty_name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                                {item.faculty_name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                {item.program_code}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-medium ${getTypeBadgeClass(item.credit_type)}`}
                                                    >
                                                        {item.credit_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                                                    {item.details || item.role}
                                                </td>
                                                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                    {Number(item.credited_units).toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                            onClick={() => handleOpenEdit(item)}
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                                                            onClick={() => handleDeleteCredit(item)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 sm:flex-row">
                            <div>
                                Showing{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {filteredCredits.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-
                                    {Math.min(currentPage * rowsPerPage, filteredCredits.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {filteredCredits.length}
                                </span>{' '}
                                records
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
                                    <button
                                        key={pg}
                                        onClick={() => setCurrentPage(pg)}
                                        className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors ${
                                            currentPage === pg
                                                ? 'bg-[#8B1E3F] text-white'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                {totalPages > 5 && (
                                    <>
                                        <span className="px-1 text-slate-400">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium ${
                                                currentPage === totalPages
                                                    ? 'bg-[#8B1E3F] text-white'
                                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Rows per page:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <option value={4}>4</option>
                                    <option value={8}>8</option>
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add / Edit Credit Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B1E3F] text-white">
                                        <Scale className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {editingCredit ? 'Edit Faculty Credit' : 'Add Workload Credit'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCredit} className="mt-4 space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Faculty Member
                                    </Label>
                                    {editingCredit ? (
                                        <Input
                                            disabled
                                            value={formData.faculty_name}
                                            className="mt-1 bg-slate-50 text-xs dark:bg-slate-800"
                                        />
                                    ) : (
                                        <select
                                            value={formData.faculty_id}
                                            onChange={(e) => {
                                                const id = Number(e.target.value);
                                                const f = facultyList.find((item) => item.id === id);
                                                setFormData({
                                                    ...formData,
                                                    faculty_id: id,
                                                    faculty_name: f ? f.name : '',
                                                });
                                            }}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            {facultyList.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name} ({f.program} - {f.rank})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Credit Type
                                        </Label>
                                        <select
                                            value={formData.credit_type}
                                            onChange={(e) => setFormData({ ...formData, credit_type: e.target.value })}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="Designation">Designation</option>
                                            <option value="Research">Research</option>
                                            <option value="Extension">Extension</option>
                                            <option value="Administrative">Administrative</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Credited Hours / Units
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            max="18"
                                            value={formData.credited_units}
                                            onChange={(e) =>
                                                setFormData({ ...formData, credited_units: Number(e.target.value) })
                                            }
                                            className="mt-1 text-xs"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Details / Role Description
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Program Head (DIT), Research Project (Funded), QA Coordinator"
                                        value={formData.details}
                                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                        className="mt-1 text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Status
                                    </Label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as 'Approved' | 'Pending' | 'Draft',
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="Approved">Approved</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Draft">Draft</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setIsAddModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833]"
                                    >
                                        {editingCredit ? 'Update Credit' : 'Save Credit'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
