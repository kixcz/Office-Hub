import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash,
    Eye,
    FileCheck,
    Search,
    GraduationCap,
    Clock,
    AlertCircle,
    Calendar,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance', href: '/compliance/tracker' },
    { title: 'Requirements', href: '/compliance/requirements' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Submission {
    id: number;
    status: string;
    submitted_at: string | null;
}

interface Requirement {
    id: number;
    title: string;
    document_type: string;
    academic_year: string;
    semester: string;
    due_date: string;
    program_id: number;
    program?: Program;
    submissions?: Submission[];
}

interface Props {
    requirements: Requirement[];
    programs: Program[];
}

const formatDatetimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function RequirementsIndex({ requirements = [], programs = [] }: Props) {
    // Create Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Edit Modal state
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

    // View Details Modal state
    const [viewingRequirement, setViewingRequirement] = useState<Requirement | null>(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState<string>('all');

    // Create form using Inertia useForm
    const createForm = useForm({
        title: '',
        document_type: '',
        academic_year: '2026-2027',
        semester: '1st',
        due_date: '',
        program_id: programs.length > 0 ? String(programs[0].id) : '',
    });

    // Edit form using Inertia useForm
    const editForm = useForm({
        title: '',
        document_type: '',
        academic_year: '',
        semester: '',
        due_date: '',
        program_id: '',
    });

    const openCreateDialog = () => {
        createForm.reset();
        createForm.clearErrors();
        if (programs.length > 0) {
            createForm.setData('program_id', String(programs[0].id));
        }
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/compliance/requirements', {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const openEditDialog = (req: Requirement) => {
        setEditingRequirement(req);
        editForm.clearErrors();
        editForm.setData({
            title: req.title,
            document_type: req.document_type,
            academic_year: req.academic_year || '',
            semester: req.semester || '',
            due_date: formatDatetimeLocal(req.due_date),
            program_id: String(req.program_id),
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequirement) return;

        editForm.put(`/compliance/requirements/${editingRequirement.id}`, {
            onSuccess: () => {
                setEditingRequirement(null);
            },
        });
    };

    const handleDelete = (req: Requirement) => {
        if (confirm(`Are you sure you want to delete the requirement "${req.title}"? This will also remove its associated submissions.`)) {
            router.delete(`/compliance/requirements/${req.id}`);
        }
    };

    // Filter requirements
    const filteredRequirements = useMemo(() => {
        return requirements.filter((req) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                !searchQuery ||
                req.title.toLowerCase().includes(searchLower) ||
                req.document_type.toLowerCase().includes(searchLower) ||
                (req.program?.code || '').toLowerCase().includes(searchLower);

            const matchesProgram =
                programFilter === 'all' || String(req.program_id) === programFilter;

            return matchesSearch && matchesProgram;
        });
    }, [requirements, searchQuery, programFilter]);

    // Urgency helper
    const getUrgency = (dueDateStr?: string) => {
        if (!dueDateStr) return { label: 'No Deadline', color: 'text-muted-foreground bg-muted' };
        const due = new Date(dueDateStr).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: `Overdue (${Math.abs(diffDays)}d)`,
                color: 'text-red-700 bg-red-500/10 border-red-500/20 dark:text-red-400',
            };
        }
        if (diffDays === 0) {
            return {
                label: 'Due Today',
                color: 'text-orange-700 bg-orange-500/10 border-orange-500/20 dark:text-orange-400',
            };
        }
        if (diffDays <= 3) {
            return {
                label: `Due in ${diffDays}d`,
                color: 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
            };
        }
        return {
            label: `Due in ${diffDays}d`,
            color: 'text-blue-700 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Requirements" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileCheck className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Requirements Management
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create, distribute, and manage compliance requirements across academic programs.
                        </p>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Requirement
                    </Button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Total Requirements
                            </span>
                            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileCheck className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {requirements.length}
                            </span>
                            <span className="text-xs text-muted-foreground">assigned tasks</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Academic Programs
                            </span>
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <GraduationCap className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {programs.length}
                            </span>
                            <span className="text-xs text-muted-foreground">active programs</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Total Submissions
                            </span>
                            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Users className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {requirements.reduce(
                                    (acc, r) => acc + (r.submissions ? r.submissions.length : 0),
                                    0
                                )}
                            </span>
                            <span className="text-xs text-muted-foreground">distributed outputs</span>
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, document type, or program..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        <div className="w-full sm:w-56">
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((prog) => (
                                    <option key={prog.id} value={String(prog.id)}>
                                        {prog.code} — {prog.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <span className="text-xs text-muted-foreground">
                        Showing {filteredRequirements.length} of {requirements.length} requirements
                    </span>
                </div>

                {/* Requirements Table Card */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                    {filteredRequirements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-4 rounded-full bg-muted/60 mb-3">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                                No requirements found
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                {searchQuery || programFilter !== 'all'
                                    ? 'No requirements match your search or program filter.'
                                    : 'Get started by creating your first academic requirement using the "Add Requirement" button.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold">
                                            Title & Document Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold">
                                            Assigned Program
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold">
                                            Academic Period
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold">
                                            Deadline & Urgency
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold">
                                            Submissions
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredRequirements.map((req) => {
                                        const urgency = getUrgency(req.due_date);
                                        const totalSubs = req.submissions ? req.submissions.length : 0;
                                        const completedSubs = req.submissions
                                            ? req.submissions.filter((s) => s.submitted_at !== null).length
                                            : 0;

                                        return (
                                            <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-semibold text-foreground">
                                                            {req.title}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                                                            {req.document_type}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {req.program ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                            <GraduationCap className="w-3.5 h-3.5" />
                                                            <span className="font-semibold">{req.program.code}</span>
                                                            <span className="text-muted-foreground">·</span>
                                                            <span>{req.program.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-foreground font-medium">
                                                        {req.academic_year || '—'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {req.semester || '—'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-xs text-foreground">
                                                            {req.due_date
                                                                ? new Date(req.due_date).toLocaleDateString(undefined, {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                      year: 'numeric',
                                                                  })
                                                                : 'No date'}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${urgency.color}`}
                                                        >
                                                            {urgency.label}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs">
                                                            <span className="font-semibold text-foreground">
                                                                {completedSubs}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                /{totalSubs} submitted
                                                            </span>
                                                        </div>
                                                        {totalSubs > 0 && (
                                                            <Badge
                                                                variant={
                                                                    completedSubs === totalSubs
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                                className="text-[10px] px-1.5 py-0"
                                                            >
                                                                {Math.round((completedSubs / totalSubs) * 100)}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                aria-label={`Actions for ${req.title}`}
                                                                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => setViewingRequirement(req)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(req)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                onClick={() => handleDelete(req)}
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* CREATE REQUIREMENT MODAL */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                Create New Requirement
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Add an academic output requirement. A submission record will automatically be generated for each faculty assigned to the program.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData('title', e.target.value)}
                                    placeholder="e.g. Course Syllabus - 1st Semester"
                                    required
                                />
                                {createForm.errors.title && (
                                    <p className="text-xs text-red-500">{createForm.errors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Document Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.document_type}
                                        onChange={(e) => createForm.setData('document_type', e.target.value)}
                                        placeholder="e.g. Syllabus, TOS, Exam"
                                        required
                                    />
                                    {createForm.errors.document_type && (
                                        <p className="text-xs text-red-500">{createForm.errors.document_type}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Academic Program <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={createForm.data.program_id}
                                        onChange={(e) => createForm.setData('program_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.program_id && (
                                        <p className="text-xs text-red-500">{createForm.errors.program_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Academic Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.academic_year}
                                        onChange={(e) => createForm.setData('academic_year', e.target.value)}
                                        placeholder="e.g. 2026-2027"
                                        required
                                    />
                                    {createForm.errors.academic_year && (
                                        <p className="text-xs text-red-500">{createForm.errors.academic_year}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Semester <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={createForm.data.semester}
                                        onChange={(e) => createForm.setData('semester', e.target.value)}
                                        placeholder="e.g. 1st Semester"
                                        required
                                    />
                                    {createForm.errors.semester && (
                                        <p className="text-xs text-red-500">{createForm.errors.semester}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Due Date & Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={createForm.data.due_date}
                                    onChange={(e) => createForm.setData('due_date', e.target.value)}
                                    required
                                />
                                {createForm.errors.due_date && (
                                    <p className="text-xs text-red-500">{createForm.errors.due_date}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="bg-primary text-primary-foreground font-semibold"
                                >
                                    {createForm.processing ? 'Creating...' : 'Create Requirement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* EDIT REQUIREMENT MODAL */}
                <Dialog
                    open={!!editingRequirement}
                    onOpenChange={(open) => !open && setEditingRequirement(null)}
                >
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-primary" />
                                Edit Requirement
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Modify requirement details, period, or deadline.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    placeholder="Title"
                                    required
                                />
                                {editForm.errors.title && (
                                    <p className="text-xs text-red-500">{editForm.errors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Document Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.document_type}
                                        onChange={(e) => editForm.setData('document_type', e.target.value)}
                                        placeholder="e.g. Syllabus, TOS"
                                        required
                                    />
                                    {editForm.errors.document_type && (
                                        <p className="text-xs text-red-500">{editForm.errors.document_type}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Program Assignment <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={editForm.data.program_id}
                                        onChange={(e) => editForm.setData('program_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {editForm.errors.program_id && (
                                        <p className="text-xs text-red-500">{editForm.errors.program_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Academic Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.academic_year}
                                        onChange={(e) => editForm.setData('academic_year', e.target.value)}
                                        placeholder="e.g. 2026-2027"
                                        required
                                    />
                                    {editForm.errors.academic_year && (
                                        <p className="text-xs text-red-500">{editForm.errors.academic_year}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Semester <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={editForm.data.semester}
                                        onChange={(e) => editForm.setData('semester', e.target.value)}
                                        placeholder="e.g. 1st Semester"
                                        required
                                    />
                                    {editForm.errors.semester && (
                                        <p className="text-xs text-red-500">{editForm.errors.semester}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Due Date & Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={editForm.data.due_date}
                                    onChange={(e) => editForm.setData('due_date', e.target.value)}
                                    required
                                />
                                {editForm.errors.due_date && (
                                    <p className="text-xs text-red-500">{editForm.errors.due_date}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingRequirement(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="bg-primary text-primary-foreground font-semibold"
                                >
                                    {editForm.processing ? 'Saving...' : 'Update Requirement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* VIEW DETAILS MODAL */}
                <Dialog
                    open={!!viewingRequirement}
                    onOpenChange={(open) => !open && setViewingRequirement(null)}
                >
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Requirement Details
                            </DialogTitle>
                        </DialogHeader>

                        {viewingRequirement && (
                            <div className="flex flex-col gap-4 mt-2">
                                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                                            Title
                                        </span>
                                        <h3 className="text-base font-bold text-foreground">
                                            {viewingRequirement.title}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Document Type:</span>
                                            <div className="font-semibold text-foreground uppercase">
                                                {viewingRequirement.document_type}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Program:</span>
                                            <div className="font-semibold text-foreground">
                                                {viewingRequirement.program?.code || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Academic Year:</span>
                                            <div className="font-semibold text-foreground">
                                                {viewingRequirement.academic_year || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Semester:</span>
                                            <div className="font-semibold text-foreground">
                                                {viewingRequirement.semester || '—'}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Due Date:</span>
                                            <div className="font-semibold text-foreground">
                                                {viewingRequirement.due_date
                                                    ? new Date(viewingRequirement.due_date).toLocaleString()
                                                    : 'No deadline'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border border-border bg-card">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                                        Submission Statistics
                                    </span>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span>Total Assigned Faculty:</span>
                                        <span className="font-bold text-foreground">
                                            {viewingRequirement.submissions?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span>Completed Submissions:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {viewingRequirement.submissions?.filter((s) => s.submitted_at !== null).length || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span>Pending Submissions:</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                            {viewingRequirement.submissions?.filter((s) => s.submitted_at === null).length || 0}
                                        </span>
                                    </div>
                                </div>

                                <DialogFooter className="mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setViewingRequirement(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const req = viewingRequirement;
                                            setViewingRequirement(null);
                                            openEditDialog(req);
                                        }}
                                        className="gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit Requirement
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
