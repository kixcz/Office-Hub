import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Announcement {
    id: number;
    title: string;
    message: string;
    category: string | null;
    priority: string;
    destination: string;
    status: string;
    publish_at: string | null;
    expire_at: string | null;
}

interface Props {
    announcement: Announcement;
}

export default function AnnouncementEdit({ announcement }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Announcements',
            href: '/announcements',
        },
        {
            title: 'Edit',
            href: `/announcements/${announcement.id}/edit`,
        },
    ];

    // Format dates for datetime-local input
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Ensure it's in YYYY-MM-DDThh:mm format for the input
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const { data, setData, put, destroy, processing, errors } = useForm({
        title: announcement.title,
        message: announcement.message,
        category: announcement.category || '',
        priority: announcement.priority,
        destination: announcement.destination,
        status: announcement.status,
        publish_at: formatDate(announcement.publish_at),
        expire_at: formatDate(announcement.expire_at),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/announcements/${announcement.id}`);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            destroy(`/announcements/${announcement.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${announcement.title}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Announcement</h1>
                        <p className="text-sm text-muted-foreground">Update the details of this announcement.</p>
                    </div>
                    
                    <Link
                        href="/announcements"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Link>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1">
                    <form onSubmit={submit} className="p-6 space-y-8 max-w-3xl">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Title *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.title && <p className="text-sm font-medium text-destructive">{errors.title}</p>}
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    rows={5}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.message && <p className="text-sm font-medium text-destructive">{errors.message}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Category
                                    </label>
                                    <input
                                        id="category"
                                        type="text"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.category && <p className="text-sm font-medium text-destructive">{errors.category}</p>}
                                </div>
                                
                                <div className="grid gap-2">
                                    <label htmlFor="priority" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    {errors.priority && <p className="text-sm font-medium text-destructive">{errors.priority}</p>}
                                </div>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label htmlFor="destination" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Destination Screen
                                    </label>
                                    <select
                                        id="destination"
                                        value={data.destination}
                                        onChange={(e) => setData('destination', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="public">Public Corridor Screens</option>
                                        <option value="office">Internal Office Screens</option>
                                    </select>
                                    {errors.destination && <p className="text-sm font-medium text-destructive">{errors.destination}</p>}
                                </div>
                                
                                <div className="grid gap-2">
                                    <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="approval">Pending Approval</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active (Publish Immediately)</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    {errors.status && <p className="text-sm font-medium text-destructive">{errors.status}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label htmlFor="publish_at" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Publish At (Optional)
                                    </label>
                                    <input
                                        id="publish_at"
                                        type="datetime-local"
                                        value={data.publish_at}
                                        onChange={(e) => setData('publish_at', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.publish_at && <p className="text-sm font-medium text-destructive">{errors.publish_at}</p>}
                                </div>
                                
                                <div className="grid gap-2">
                                    <label htmlFor="expire_at" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Expire At (Optional)
                                    </label>
                                    <input
                                        id="expire_at"
                                        type="datetime-local"
                                        value={data.expire_at}
                                        onChange={(e) => setData('expire_at', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.expire_at && <p className="text-sm font-medium text-destructive">{errors.expire_at}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                {processing ? 'Saving...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Announcement
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
