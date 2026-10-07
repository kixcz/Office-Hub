import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Filter, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Compliance Matrix',
        href: '/compliance-matrix',
    },
];

interface User {
    id: number;
    name: string;
}

interface Submission {
    id: number;
    status: string;
    submitted_at: string | null;
    user: User;
}

interface Requirement {
    id: number;
    title: string;
    document_type: string;
    due_date: string;
    user?: User; // if assigned to a specific user
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

export default function ComplianceMatrix({ requirements }: Props) {
    
    // Helper to calculate compliance rate for a requirement (simplified)
    // Note: In reality, we'd need to know TOTAL faculty expected to submit, 
    // but for this MVP we'll just show the count of submissions.
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compliance Matrix" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Compliance Matrix</h1>
                        <p className="text-sm text-muted-foreground">Monitor faculty submissions and review documents.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter & Export
                        </button>
                        <Link
                            href="/requirements/create"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            New Requirement
                        </Link>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search requirements..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {requirements?.data?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No requirements found</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Create new requirements to start tracking compliance.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Requirement</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Assigned To</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Due Date</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Submissions</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
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
                                                {requirement.user ? requirement.user.name : 'All Faculty'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs ${new Date(requirement.due_date) < new Date() ? 'text-red-600 font-medium' : ''}`}>
                                                    {new Date(requirement.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                        {requirement.submissions.length} submitted
                                                    </span>
                                                    {requirement.submissions.filter(s => s.status === 'awaiting_review').length > 0 && (
                                                        <span className="inline-flex items-center text-orange-600 font-medium">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {requirement.submissions.filter(s => s.status === 'awaiting_review').length} to review
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/requirements/${requirement.id}`}
                                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                                >
                                                    View Details
                                                </Link>
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
