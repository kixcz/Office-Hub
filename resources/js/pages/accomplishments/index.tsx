import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Trophy, FileText, Download, Plus, Search, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface User {
    id: number;
    name: string;
}

interface Accomplishment {
    id: number;
    title: string;
    category: string;
    date_achieved: string;
    description: string | null;
    proof_file_path: string | null;
    user: User;
}

interface Props {
    accomplishments: Accomplishment[];
    is_admin: boolean;
}

export default function AccomplishmentsIndex({ accomplishments, is_admin }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Accomplishments', href: '/accomplishments' },
    ];

    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        category: 'certification',
        date_achieved: '',
        description: '',
        proof_file: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accomplishments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreating(false);
                reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accomplishments" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Accomplishments</h1>
                        <p className="text-sm text-muted-foreground">Track certifications, research, seminars, and awards.</p>
                    </div>
                    
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <Plus className="mr-2 h-4 w-4" /> Add Accomplishment
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Log New Accomplishment</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select value={data.category} onChange={e => setData('category', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        <option value="certification">Certification</option>
                                        <option value="research">Research/Publication</option>
                                        <option value="seminar">Seminar/Training</option>
                                        <option value="award">Award</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Date Achieved</label>
                                    <input type="date" value={data.date_achieved} onChange={e => setData('date_achieved', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                                    {errors.date_achieved && <p className="text-red-500 text-xs mt-1">{errors.date_achieved}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                    <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Proof Document (Optional)</label>
                                    <input type="file" ref={fileInputRef} onChange={e => setData('proof_file', e.target.files?.[0] || null)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                                </div>

                                <DialogFooter className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Save Accomplishment'}
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {accomplishments?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No accomplishments recorded</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Start tracking your professional development and achievements.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Title & Category</th>
                                        {is_admin && <th scope="col" className="px-6 py-3 font-medium">Faculty</th>}
                                        <th scope="col" className="px-6 py-3 font-medium">Date Achieved</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Proof</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accomplishments.map((acc) => (
                                        <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{acc.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1 capitalize">{acc.category}</div>
                                                {acc.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{acc.description}</div>}
                                            </td>
                                            {is_admin && (
                                                <td className="px-6 py-4">
                                                    {acc.user?.name}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                {new Date(acc.date_achieved).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {acc.proof_file_path ? (
                                                    <a href={`/storage/${acc.proof_file_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline text-xs">
                                                        <Download className="w-3 h-3 mr-1" /> View Proof
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">No file</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-gray-100 rounded-md">
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
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => {
                                                            if (confirm('Are you sure you want to delete this accomplishment?')) {
                                                                router.delete(`/accomplishments/${acc.id}`);
                                                            }
                                                        }}>
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
