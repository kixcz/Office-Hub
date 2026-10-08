import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PlusCircle, Search, Megaphone, CalendarIcon, AlertCircle, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, FormEventHandler } from 'react';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Announcements',
        href: '/announcements',
    },
];

interface Announcement {
    id: number;
    title: string;
    message: string;
    category: string;
    priority: string;
    destination: string;
    status: string;
    author?: { name: string };
    publish_at?: string;
    expire_at?: string;
    created_at: string;
}

interface PaginationData {
    data: Announcement[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    announcements: PaginationData;
}

export default function AnnouncementsIndex({ announcements }: Props) {
    const [isCreating, setIsCreating] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        message: '',
        category: '',
        priority: 'normal',
        destination: 'public',
        status: 'draft',
        publish_at: '',
        expire_at: '',
    });

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        post('/announcements', {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Urgent</span>;
            case 'high':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">High</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Normal</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>;
            case 'draft':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Draft</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 capitalize">{status}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                        <p className="text-sm text-muted-foreground">Manage official communications for the college and public displays.</p>
                    </div>
                    
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Announcement
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle>Create Announcement</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4 mt-4">
                                <div className="grid gap-2">
                                    <label htmlFor="title" className="text-sm font-medium">Title *</label>
                                    <input id="title" type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message *</label>
                                    <textarea id="message" value={data.message} onChange={e => setData('message', e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label htmlFor="category" className="text-sm font-medium">Category</label>
                                        <input id="category" type="text" value={data.category} onChange={e => setData('category', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Academic, Event" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                                        <select id="priority" value={data.priority} onChange={e => setData('priority', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 py-2">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Save Announcement'}
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters and Search - Placeholder */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search announcements..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {announcements?.data?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No announcements found</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Get started by creating a new announcement for the faculty or public screens.
                            </p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Announcement
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Title</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Category</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Priority</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Author</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {announcements?.data?.map((announcement) => (
                                        <tr key={announcement.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {announcement.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                {announcement.category || 'General'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getPriorityBadge(announcement.priority)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(announcement.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {announcement.author?.name || 'System'}
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
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/announcements/${announcement.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" /> View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/announcements/${announcement.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                                                            if (confirm('Are you sure you want to delete this announcement?')) {
                                                                router.delete(`/announcements/${announcement.id}`);
                                                            }
                                                        }}>
                                                            <Trash className="mr-2 h-4 w-4" /> Delete
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
