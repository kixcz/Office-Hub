import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

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
}

interface Props {
    programs: Program[];
}

export default function ProgramsIndex({ programs }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/programs', {
            onSuccess: () => {
                reset();
                setIsAdding(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs Management" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Programs Management</h1>
                        <p className="text-sm text-muted-foreground">Manage academic programs in the system.</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isAdding ? 'Cancel' : 'Add Program'}
                    </button>
                </div>

                {isAdding && (
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="code" className="text-sm font-medium leading-none">Code</label>
                                    <input
                                        id="code"
                                        value={data.code}
                                        onChange={e => setData('code', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. BSIT"
                                    />
                                    {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium leading-none">Name</label>
                                    <input
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. Bachelor of Science in Information Technology"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium leading-none">Description</label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Optional description"
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                                >
                                    Save Program
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex-1">
                    {programs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <h3 className="text-lg font-medium">No programs found</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Get started by adding a new program.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Code</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Name</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {programs.map((program) => (
                                        <tr key={program.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {program.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                {program.name}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {program.description || '-'}
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
