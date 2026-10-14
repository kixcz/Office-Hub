import React, { useState, useMemo, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import { 
    GraduationCap, 
    BookOpen, 
    CheckCircle2, 
    Layers, 
    Clock, 
    Search, 
    Building2, 
    Plus, 
    MoreVertical, 
    Eye, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    ArrowUpDown,
    Monitor,
    Laptop,
    Share2,
    X,
    Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Programs Management',
        href: '/programs',
    },
];

interface Program {
    id: number;
    code: string;
    name: string;
    description: string | null;
    department?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    programs: Program[];
    stats?: {
        total: number;
        active: number;
        degree_types: number;
        last_updated_date: string;
        last_updated_time: string;
    };
    departments?: string[];
    filters?: {
        search?: string;
        department?: string;
        status?: string;
    };
}

export default function ProgramsIndex({ 
    programs, 
    stats = {
        total: 4,
        active: 4,
        degree_types: 2,
        last_updated_date: 'Oct 13, 2026',
        last_updated_time: '11:25 AM by System Admin',
    },
    departments = ['College of Information and Digital Sciences'],
    filters = {}
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    
    // Checkbox selections
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modal dialogs state
    const [isAdding, setIsAdding] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
    const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form for Add Program
    const addForm = useForm({
        code: '',
        name: '',
        description: '',
    });

    // Form for Edit Program
    const editForm = useForm({
        code: '',
        name: '',
        description: '',
    });

    const handleOpenEdit = (program: Program) => {
        setEditingProgram(program);
        editForm.setData({
            code: program.code,
            name: program.name,
            description: program.description || '',
        });
    };

    const submitAdd: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post('/programs', {
            onSuccess: () => {
                addForm.reset();
                setIsAdding(false);
            },
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingProgram) return;
        editForm.put(`/programs/${editingProgram.id}`, {
            onSuccess: () => {
                setEditingProgram(null);
            },
        });
    };

    const handleDelete = (program: Program) => {
        setDeletingProgram(program);
    };

    const confirmDelete = () => {
        if (!deletingProgram) return;
        setIsDeleting(true);
        router.delete(`/programs/${deletingProgram.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingProgram(null);
                setIsDeleting(false);
                setSelectedIds((prev) => prev.filter((id) => id !== deletingProgram.id));
            },
            onError: () => {
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false);

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeletingOpen(true);
    };

    const confirmBulkDelete = () => {
        setIsDeleting(true);
        selectedIds.forEach((id) => {
            router.delete(`/programs/${id}`, { preserveScroll: true });
        });
        setSelectedIds([]);
        setIsDeleting(false);
        setIsBulkDeletingOpen(false);
    };

    // Filter list client-side
    const filteredPrograms = useMemo(() => {
        return programs.filter((p) => {
            const matchesSearch = searchTerm === '' || 
                p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.department || 'College of Information and Digital Sciences').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesDept = selectedDepartment === 'all' || 
                (p.department || 'College of Information and Digital Sciences') === selectedDepartment;

            const matchesStatus = selectedStatus === 'all' || 
                (p.status || 'active').toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [programs, searchTerm, selectedDepartment, selectedStatus]);

    // Checkbox selection handlers
    const isAllSelected = filteredPrograms.length > 0 && selectedIds.length === filteredPrograms.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredPrograms.map((p) => p.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Helper for visual program code badges matching attached mockup
    const getProgramIcon = (code: string) => {
        const c = code.toUpperCase();
        if (c === 'BLIS') {
            return (
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                </div>
            );
        }
        if (c === 'BSCS') {
            return (
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Monitor className="w-4 h-4" />
                </div>
            );
        }
        if (c === 'BSIT') {
            return (
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Laptop className="w-4 h-4" />
                </div>
            );
        }
        if (c === 'BSIS') {
            return (
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Share2 className="w-4 h-4" />
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs Management" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                
                {/* 1. Hero Header Banner */}
                <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
                    {/* Left Info: Amber Graduation Cap + Title */}
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-13 h-13 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs p-3">
                            <GraduationCap className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Programs Management
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                Manage academic programs in the system.
                            </p>
                        </div>
                    </div>

                    {/* Subtle campus illustration in background */}
                    <div className="absolute inset-y-0 right-48 hidden lg:flex items-center opacity-15 pointer-events-none select-none">
                        <svg className="w-56 h-28 text-slate-600 dark:text-slate-300" viewBox="0 0 240 100" fill="currentColor">
                            <rect x="20" y="30" width="70" height="60" rx="3" fillOpacity="0.4" />
                            <polygon points="15,30 55,10 95,30" fillOpacity="0.6" />
                            <rect x="35" y="45" width="12" height="15" rx="1" fill="#fff" />
                            <rect x="58" y="45" width="12" height="15" rx="1" fill="#fff" />
                            <rect x="47" y="70" width="16" height="20" fill="#fff" />
                            <rect x="105" y="40" width="85" height="50" rx="2" fillOpacity="0.3" />
                            <polygon points="100,40 147,20 195,40" fillOpacity="0.5" />
                            <circle cx="147.5" cy="55" r="7" fill="#fff" fillOpacity="0.8" />
                            <circle cx="210" cy="50" r="14" fillOpacity="0.25" />
                            <rect x="208" y="50" width="4" height="40" fillOpacity="0.4" />
                        </svg>
                    </div>

                    {/* Right CIDS Department Identity Block */}
                    <div className="hidden md:flex flex-col items-start pl-6 border-l border-slate-200 dark:border-slate-800 z-10 shrink-0">
                        <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            CIDS
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-tight">
                            College of Information and Digital Sciences
                        </span>
                        <div className="w-10 h-0.75 bg-amber-500 rounded-full mt-2" />
                    </div>
                </div>

                {/* 2. Bento Metric Cards (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Programs */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Programs</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.total}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Academic programs in the system
                            </p>
                        </div>
                    </div>

                    {/* Active Programs */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Programs</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.active}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Currently active and offered
                            </p>
                        </div>
                    </div>

                    {/* Degree Types */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Degree Types</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.degree_types}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                Bachelor's programs
                            </p>
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Updated</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {stats.last_updated_date}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                                {stats.last_updated_time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Search & Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search programs by code, name, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    {/* Filters & Add Program */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Department Filter */}
                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                            {selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}
                                        </span>
                                        <span className="text-slate-400 ml-1">⌄</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuItem onClick={() => setSelectedDepartment('all')}>
                                        All Departments
                                    </DropdownMenuItem>
                                    {departments.map((dept) => (
                                        <DropdownMenuItem key={dept} onClick={() => setSelectedDepartment(dept)}>
                                            {dept}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="capitalize">
                                            {selectedStatus === 'all' ? 'All Status' : selectedStatus}
                                        </span>
                                        <span className="text-slate-400 ml-1">⌄</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                                        All Status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                                        Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('inactive')}>
                                        Inactive
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Bulk Delete Button when items selected */}
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 rounded-xl border border-red-200 dark:border-red-800 shadow-2xs transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                        )}

                        {/* Add Program Button */}
                        <button
                            onClick={() => setIsAdding(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Add Program</span>
                        </button>
                    </div>
                </div>

                {/* 4. Programs Table Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                                    <th className="py-3.5 px-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                            <span>CODE</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                            <span>PROGRAM NAME</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                            <span>DEPARTMENT / COLLEGE</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                            <span>DESCRIPTION</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                            <span>STATUS</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold text-right pr-6">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                                {filteredPrograms.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                            No programs found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrograms.map((program) => {
                                        const isSelected = selectedIds.includes(program.id);
                                        const department = program.department || 'College of Information and Digital Sciences';
                                        const status = program.status || 'Active';

                                        return (
                                            <tr 
                                                key={program.id}
                                                className={cn(
                                                    "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group",
                                                    isSelected && "bg-amber-50/30 dark:bg-amber-950/10"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-4 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectOne(program.id)}
                                                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 w-4 h-4 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Code with Icon Badge */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {getProgramIcon(program.code)}
                                                        <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                                                            {program.code}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Program Name */}
                                                <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                                                    {program.name}
                                                </td>

                                                {/* Department / College */}
                                                <td className="py-4 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {department}
                                                </td>

                                                {/* Description */}
                                                <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                    {program.description ? program.description : '-'}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-36">
                                                            <DropdownMenuItem onClick={() => setViewingProgram(program)}>
                                                                <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(program)}>
                                                                <Edit className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDelete(program)}
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-2 text-red-600" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Showing 1 to {filteredPrograms.length} of {filteredPrograms.length} programs
                        </span>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                                disabled
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:bg-amber-600 transition-colors"
                            >
                                1
                            </button>
                            <button
                                disabled
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Add Program */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Add Academic Program</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd} className="flex flex-col gap-4 mt-2">
                        <div className="space-y-1.5">
                            <label htmlFor="add-code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Program Code
                            </label>
                            <input
                                id="add-code"
                                value={addForm.data.code}
                                onChange={(e) => addForm.setData('code', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                placeholder="e.g. BSCS, BSIT, BLIS"
                                required
                            />
                            {addForm.errors.code && <p className="text-xs text-red-500">{addForm.errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="add-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Program Name
                            </label>
                            <input
                                id="add-name"
                                value={addForm.data.name}
                                onChange={(e) => addForm.setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                placeholder="e.g. Bachelor of Science in Computer Science"
                                required
                            />
                            {addForm.errors.name && <p className="text-xs text-red-500">{addForm.errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="add-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Description (Optional)
                            </label>
                            <textarea
                                id="add-desc"
                                value={addForm.data.description}
                                onChange={(e) => addForm.setData('description', e.target.value)}
                                rows={3}
                                className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                placeholder="Program overview or description..."
                            />
                            {addForm.errors.description && <p className="text-xs text-red-500">{addForm.errors.description}</p>}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addForm.processing}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Save Program
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Program */}
            <Dialog open={!!editingProgram} onOpenChange={(open) => !open && setEditingProgram(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Edit Academic Program</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4 mt-2">
                        <div className="space-y-1.5">
                            <label htmlFor="edit-code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Program Code
                            </label>
                            <input
                                id="edit-code"
                                value={editForm.data.code}
                                onChange={(e) => editForm.setData('code', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                required
                            />
                            {editForm.errors.code && <p className="text-xs text-red-500">{editForm.errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="edit-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Program Name
                            </label>
                            <input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                required
                            />
                            {editForm.errors.name && <p className="text-xs text-red-500">{editForm.errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="edit-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Description
                            </label>
                            <textarea
                                id="edit-desc"
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                rows={3}
                                className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                            {editForm.errors.description && <p className="text-xs text-red-500">{editForm.errors.description}</p>}
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingProgram(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Update Program
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: View Program Details */}
            <Dialog open={!!viewingProgram} onOpenChange={(open) => !open && setViewingProgram(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-3">
                            {viewingProgram && getProgramIcon(viewingProgram.code)}
                            <span>{viewingProgram?.code} Details</span>
                        </DialogTitle>
                    </DialogHeader>
                    {viewingProgram && (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Full Title</span>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                                    {viewingProgram.name}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Department</span>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                                        {viewingProgram.department || 'College of Information and Digital Sciences'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</span>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {viewingProgram.status || 'Active'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Description</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    {viewingProgram.description || 'No additional description provided.'}
                                </p>
                            </div>

                            <DialogFooter className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => setViewingProgram(null)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors w-full"
                                >
                                    Close
                                </button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal: Delete Single Program Confirmation */}
            <DeleteConfirmDialog
                open={!!deletingProgram}
                onOpenChange={(open) => !open && setDeletingProgram(null)}
                title="Delete Academic Program"
                description="Are you sure you want to permanently delete this academic program? Any faculty members or schedules associated with this program will be unlinked."
                itemName={deletingProgram ? `${deletingProgram.code} (${deletingProgram.name})` : undefined}
                confirmLabel="Delete Program"
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
            />

            {/* Modal: Bulk Delete Programs Confirmation */}
            <DeleteConfirmDialog
                open={isBulkDeletingOpen}
                onOpenChange={setIsBulkDeletingOpen}
                title="Delete Selected Programs"
                description={`Are you sure you want to permanently delete ${selectedIds.length} selected academic program(s)? This action cannot be undone.`}
                confirmLabel={`Delete ${selectedIds.length} Programs`}
                isDeleting={isDeleting}
                onConfirm={confirmBulkDelete}
            />
        </AppLayout>
    );
}
