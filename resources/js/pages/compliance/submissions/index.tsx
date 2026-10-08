import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Submissions', href: '/compliance/submissions' },
];

export default function SubmissionsIndex({ submissions, pendingSubmissions }: any) {
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, put, processing, reset, errors } = useForm({
        submission_id: '',
        submitted_at: '',
        reviewer_comments: '',
        status: 'approved'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!data.submission_id) return alert('Select a submission');
        put(`/compliance/submissions/${data.submission_id}`, {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submission Records" />
            <div className="p-4 flex flex-col gap-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold">Completed Submissions</h2>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus size={16} /> Record Submission
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Record Submission</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                                <div>
                                    <Label>Pending Output</Label>
                                    <select 
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        value={data.submission_id} 
                                        onChange={e => setData('submission_id', e.target.value)}
                                    >
                                        <option value="">Select Pending Submission</option>
                                        {pendingSubmissions.map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.faculty?.first_name} {sub.faculty?.last_name} - {sub.requirement?.title} ({sub.requirement?.program?.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.submission_id && <div className="text-red-500 text-sm mt-1">{errors.submission_id}</div>}
                                </div>
                                <div>
                                    <Label>Submitted At</Label>
                                    <Input type="datetime-local" value={data.submitted_at} onChange={e => setData('submitted_at', e.target.value)} />
                                    {errors.submitted_at && <div className="text-red-500 text-sm mt-1">{errors.submitted_at}</div>}
                                </div>
                                <div>
                                    <Label>Comments</Label>
                                    <Input value={data.reviewer_comments} onChange={e => setData('reviewer_comments', e.target.value)} placeholder="Remarks" />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <select 
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        value={data.status} 
                                        onChange={e => setData('status', e.target.value)}
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>Record</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Completed Submissions</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Faculty</th>
                                <th className="p-2">Requirement</th>
                                <th className="p-2">Submitted At</th>
                                <th className="p-2">Status</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub: any) => (
                                <tr key={sub.id} className="border-b">
                                    <td className="p-2">{sub.faculty?.first_name} {sub.faculty?.last_name}</td>
                                    <td className="p-2">{sub.requirement?.title}</td>
                                    <td className="p-2">{new Date(sub.submitted_at).toLocaleString()}</td>
                                    <td className="p-2">{sub.status}</td>
                                    <td className="p-2 text-right">
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
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
            </div>
        </AppLayout>
    );
}
