import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Users, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string | null;
    position: string | null;
    program?: Program;
}

interface Props {
    faculties: Faculty[];
    programs: Program[];
}

export default function FacultiesIndex({ faculties, programs }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        position: '',
        program_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculties', {
            onSuccess: () => {
                reset();
                setIsAdding(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Management" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Faculty Management</h1>
                        <p className="text-sm text-muted-foreground">Manage faculty profiles and assignments.</p>
                    </div>
                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Faculty
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Add Faculty</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Employee ID</label>
                                        <input
                                            value={data.employee_id}
                                            onChange={e => setData('employee_id', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="EMP-001"
                                        />
                                        {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">First Name</label>
                                        <input
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="John"
                                        />
                                        {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Last Name</label>
                                        <input
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Doe"
                                        />
                                        {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="john.doe@example.com"
                                        />
                                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Department</label>
                                        <input
                                            value={data.department}
                                            onChange={e => setData('department', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="e.g. IT Department"
                                        />
                                        {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Position</label>
                                        <input
                                            value={data.position}
                                            onChange={e => setData('position', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="e.g. Professor"
                                        />
                                        {errors.position && <p className="text-sm text-red-500">{errors.position}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Program Assignment</label>
                                        <select
                                            value={data.program_id}
                                            onChange={e => setData('program_id', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">Select a Program</option>
                                            {programs.map(prog => (
                                                <option key={prog.id} value={prog.id}>{prog.code} - {prog.name}</option>
                                            ))}
                                        </select>
                                        {errors.program_id && <p className="text-sm text-red-500">{errors.program_id}</p>}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <button type="button" onClick={() => setIsAdding(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                                    >
                                        Save Faculty
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex-1">
                    {faculties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No faculty profiles</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Get started by adding a new faculty member.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Employee ID</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Name</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Contact</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Department & Position</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Program</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faculties.map((faculty) => (
                                        <tr key={faculty.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {faculty.employee_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{faculty.first_name} {faculty.last_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {faculty.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{faculty.department || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{faculty.position}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {faculty.program ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                                                        {faculty.program.code}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-muted rounded-md">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
