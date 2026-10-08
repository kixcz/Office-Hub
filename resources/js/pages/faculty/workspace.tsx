import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileUp, Calendar, CheckCircle2, Clock, AlertCircle, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Workspace',
        href: '/faculty/workspace',
    },
];

interface Submission {
    id: number;
    status: string;
    file_path: string | null;
    submitted_at: string | null;
    reviewer_comments: string | null;
}

interface Requirement {
    id: number;
    title: string;
    description: string | null;
    document_type: string;
    academic_year: string;
    semester: string;
    course_section: string | null;
    due_date: string;
    accepted_format: string | null;
    submissions: Submission[];
}

interface PaginationData {
    data: Requirement[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    requirements: PaginationData;
}

export default function FacultyWorkspace({ requirements }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    const handleUploadClick = (requirementId: number) => {
        setUploadingId(requirementId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadingId) {
            router.post(`/requirements/${uploadingId}/submissions`, {
                file: file,
            }, {
                preserveScroll: true,
                onFinish: () => {
                    setUploadingId(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
            });
        } else {
            setUploadingId(null);
        }
    };

    const getStatusDisplay = (submissions: Submission[], dueDate: string) => {
        if (!submissions || submissions.length === 0) {
            const isOverdue = new Date(dueDate) < new Date();
            if (isOverdue) {
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</span>;
            }
            return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }

        const latest = submissions[0];
        switch (latest.status) {
            case 'accepted':
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</span>;
            case 'revision_requested':
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><AlertCircle className="w-3 h-3 mr-1" /> Needs Revision</span>;
            case 'awaiting_review':
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3 mr-1" /> Under Review</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{latest.status}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Workspace" />
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Workspace</h1>
                        <p className="text-sm text-muted-foreground">Manage your assigned requirements and track submission statuses.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Summary Cards */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Total Pending</div>
                        <div className="text-3xl font-bold">{requirements?.data?.filter(r => r.submissions.length === 0).length || 0}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Needs Revision</div>
                        <div className="text-3xl font-bold">{requirements?.data?.filter(r => r.submissions?.[0]?.status === 'revision_requested').length || 0}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Accepted</div>
                        <div className="text-3xl font-bold">{requirements?.data?.filter(r => r.submissions?.[0]?.status === 'accepted').length || 0}</div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {requirements?.data?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <FileUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No requirements assigned</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                You currently have no pending tasks or documents to submit.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Requirement</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Details</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Due Date</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements?.data?.map((requirement) => (
                                        <tr key={requirement.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{requirement.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{requirement.document_type}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs">{requirement.academic_year} | {requirement.semester}</div>
                                                {requirement.course_section && <div className="text-xs mt-1 text-muted-foreground">{requirement.course_section}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-xs">
                                                    <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                                                    {new Date(requirement.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusDisplay(requirement.submissions, requirement.due_date)}
                                                {requirement.submissions?.[0]?.reviewer_comments && (
                                                    <div className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary pl-2">
                                                        " {requirement.submissions[0].reviewer_comments} "
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleUploadClick(requirement.id)} disabled={uploadingId === requirement.id}>
                                                            <FileUp className="mr-2 h-4 w-4" /> {uploadingId === requirement.id ? 'Uploading...' : 'Upload'}
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
