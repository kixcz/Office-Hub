import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Download, Check, X, AlertCircle, MoreVertical, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function RequirementShow({ requirement }: { requirement: any }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Compliance Matrix', href: '/compliance-matrix' },
        { title: requirement.title, href: `/requirements/${requirement.id}` },
    ];

    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [comments, setComments] = useState('');

    const handleUpdateStatus = (submissionId: number, status: string) => {
        router.patch(`/submissions/${submissionId}`, {
            status,
            reviewer_comments: comments,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setReviewingId(null);
                setComments('');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review: ${requirement.title}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{requirement.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {requirement.document_type} | Due: {new Date(requirement.due_date).toLocaleDateString()}
                    </p>
                    {requirement.description && (
                        <p className="text-sm mt-4 p-4 bg-muted/30 rounded-lg">{requirement.description}</p>
                    )}
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {requirement.submissions?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No submissions yet</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Faculty</th>
                                        <th className="px-6 py-3 font-medium">Submitted On</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">File</th>
                                        <th className="px-6 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirement.submissions?.map((submission: any) => (
                                        <tr key={submission.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {submission.user?.name || 'Unknown Faculty'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                    submission.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    submission.status === 'revision_requested' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                    {submission.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {submission.file_path && (
                                                    <a href={`/storage/${submission.file_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline text-xs">
                                                        <Download className="w-3 h-3 mr-1" /> Download
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {reviewingId === submission.id ? (
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <textarea 
                                                            value={comments} 
                                                            onChange={(e) => setComments(e.target.value)}
                                                            placeholder="Reviewer comments (optional)"
                                                            className="w-full text-xs min-h-[60px] rounded-md border border-input bg-background px-3 py-2"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setReviewingId(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                                                            <button onClick={() => handleUpdateStatus(submission.id, 'revision_requested')} className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-orange-500 text-white h-7 px-3 hover:bg-orange-600">Request Revision</button>
                                                            <button onClick={() => handleUpdateStatus(submission.id, 'accepted')} className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-green-500 text-white h-7 px-3 hover:bg-green-600">Accept</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setReviewingId(submission.id)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Review
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
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
