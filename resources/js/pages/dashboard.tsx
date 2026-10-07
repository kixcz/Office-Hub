import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { FileCheck, Megaphone, Send, Clock, AlertCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Props {
    stats: {
        active_announcements: number;
        pending_tasks: number;
        active_documents: number;
        pending_requirements: number;
    };
    recent_announcements: any[];
    recent_documents: any[];
    recent_tasks: any[];
}

export default function Dashboard({ stats, recent_announcements, recent_documents, recent_tasks }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="mb-2">
                    <h1 className="text-2xl font-bold tracking-tight">CIDS Office Hub Overview</h1>
                    <p className="text-muted-foreground">Welcome back! Here's what's happening in the college today.</p>
                </div>
                
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Active Announcements</h3>
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-2xl font-bold">{stats.active_announcements}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Pending Tasks</h3>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-2xl font-bold">{stats.pending_tasks}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Pending Requirements</h3>
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-2xl font-bold">{stats.pending_requirements}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Active Documents</h3>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-2xl font-bold">{stats.active_documents}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
                    <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Announcements</h3>
                        </div>
                        <div className="p-0 flex-1 flex flex-col">
                            {recent_announcements.length === 0 ? (
                                <div className="p-6 text-sm text-muted-foreground text-center">No active announcements</div>
                            ) : (
                                recent_announcements.map(ann => (
                                    <div key={ann.id} className="p-4 border-b last:border-0 flex flex-col gap-1 hover:bg-muted/30">
                                        <div className="font-medium text-sm">{ann.title}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-2">{ann.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Documents</h3>
                        </div>
                        <div className="p-0 flex-1 flex flex-col">
                            {recent_documents.length === 0 ? (
                                <div className="p-6 text-sm text-muted-foreground text-center">No documents tracked</div>
                            ) : (
                                recent_documents.map(doc => (
                                    <div key={doc.id} className="p-4 border-b last:border-0 flex flex-col gap-1 hover:bg-muted/30">
                                        <div className="font-medium text-sm flex justify-between">
                                            <span>{doc.title}</span>
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded capitalize">{doc.status}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Tracking #: {doc.tracking_number}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Tasks</h3>
                        </div>
                        <div className="p-0 flex-1 flex flex-col">
                            {recent_tasks.length === 0 ? (
                                <div className="p-6 text-sm text-muted-foreground text-center">No pending tasks</div>
                            ) : (
                                recent_tasks.map(task => (
                                    <div key={task.id} className="p-4 border-b last:border-0 flex flex-col gap-1 hover:bg-muted/30">
                                        <div className="font-medium text-sm">{task.title}</div>
                                        <div className="text-xs text-muted-foreground flex justify-between">
                                            <span className="capitalize text-[10px]">{task.priority} Priority</span>
                                            <span className="capitalize">{task.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
