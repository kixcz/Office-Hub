import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Users, MoreVertical, Edit, Trash, GraduationCap, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Management',
        href: '/faculties',
    },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    program_id?: number | null;
    program?: Program;
}

interface Props {
    faculties: Faculty[];
    programs: Program[];
}

export default function FacultiesIndex({ faculties, programs }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        first_name: '',
        last_name: '',
        program_id: '',
    });

    const openAddDialog = () => {
        setEditingFaculty(null);
        reset();
        clearErrors();
        if (programs.length > 0) {
            setData({
                first_name: '',
                last_name: '',
                program_id: String(programs[0].id),
            });
        }
        setIsDialogOpen(true);
    };

    const openEditDialog = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        clearErrors();
        setData({
            first_name: faculty.first_name,
            last_name: faculty.last_name,
            program_id: faculty.program_id ? String(faculty.program_id) : (programs[0] ? String(programs[0].id) : ''),
        });
        setIsDialogOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaculty) {
            put(`/faculties/${editingFaculty.id}`, {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                    setEditingFaculty(null);
                },
            });
        } else {
            post('/faculties', {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Management" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Users className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight">Faculty Management</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage faculty members and their academic program assignments.
                        </p>
                    </div>

                    <button
                        onClick={openAddDialog}
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Faculty
                    </button>
                </div>

                {/* Add / Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-primary" />
                                {editingFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-foreground">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Maria"
                                        required
                                    />
                                    {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-foreground">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Santos"
                                        required
                                    />
                                    {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-foreground">
                                        Program Assignment <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.program_id}
                                        onChange={e => setData('program_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map(prog => (
                                            <option key={prog.id} value={prog.id}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.program_id && <p className="text-xs text-red-500">{errors.program_id}</p>}
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
                                >
                                    {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Faculty Listing Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-1 flex flex-col">
                    {faculties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full my-auto">
                            <div className="p-4 rounded-full bg-muted/60 mb-3">
                                <Users className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-base font-semibold">No faculty members found</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Click the &quot;Add Faculty&quot; button above to register your first faculty member and assign their program.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold">Faculty Name</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Assigned Program</th>
                                        <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {faculties.map((faculty) => (
                                        <tr key={faculty.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                                        {faculty.first_name[0]}{faculty.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {faculty.first_name} {faculty.last_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Faculty Member
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {faculty.program ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                        <GraduationCap className="w-3.5 h-3.5" />
                                                        <span className="font-semibold">{faculty.program.code}</span>
                                                        <span className="text-muted-foreground">·</span>
                                                        <span>{faculty.program.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-muted rounded-md transition-colors">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36">
                                                        <DropdownMenuItem onClick={() => openEditDialog(faculty)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete ${faculty.first_name} ${faculty.last_name}?`)) {
                                                                    router.delete(`/faculties/${faculty.id}`);
                                                                }
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
