import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    BookCheckIcon,
    Calendar,
    Clock,
    CheckCircle2,
    CheckSquare,
    AlertCircle,
    User
} from 'lucide-react';

interface Props {
    faculty: any;
    tasks: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Tasks & Projects', href: '/faculty/tasks' },
];

export default function FacultyTasksPage({ faculty, tasks = [] }: Props) {
    const updateStatus = (taskId: number, newStatus: string) => {
        router.patch(`/faculty/tasks/${taskId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks & Projects - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Assigned Tasks & Projects</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Track department deliverables, institutional committee projects, deadlines, and completion statuses.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        task.priority === 'high'
                                            ? 'bg-rose-100 text-rose-700'
                                            : task.priority === 'medium'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {task.priority?.toUpperCase()} PRIORITY
                                    </span>

                                    <select
                                        value={task.status}
                                        onChange={(e) => updateStatus(task.id, e.target.value)}
                                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-border bg-background"
                                    >
                                        <option value="to_do">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Ready for Review</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-foreground leading-snug">{task.title}</h3>
                                    {task.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{task.description}</p>
                                    )}
                                </div>

                                <div className="text-[11px] text-muted-foreground space-y-1 font-medium pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Due: {task.due_date || 'No due date'}</span>
                                    </div>
                                    {task.creator && (
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>Assigned by: {task.creator.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground">Progress</span>
                                <span className="font-bold text-foreground">
                                    {task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : '0%'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
