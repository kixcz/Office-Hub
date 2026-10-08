import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Clock, CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface User {
    id: number;
    name: string;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'to_do' | 'in_progress' | 'completed';
    due_date: string | null;
    creator: User;
    assignee: User | null;
}

interface Props {
    tasks: Task[];
    users: User[];
}

export default function TasksIndex({ tasks, users }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tasks & Projects', href: '/tasks' },
    ];

    const [isCreating, setIsCreating] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
    });

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tasks', {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    const updateStatus = (taskId: number, newStatus: string) => {
        router.patch(`/tasks/${taskId}`, { status: newStatus }, { preserveScroll: true });
    };

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const TaskCard = ({ task }: { task: Task }) => (
        <div className="bg-card text-card-foreground border rounded-lg p-4 shadow-sm flex flex-col gap-3">
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm leading-tight">{task.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)} uppercase tracking-wider`}>
                        {task.priority}
                    </span>
                </div>
                {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
            </div>
            
            <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    {task.assignee ? <span>Assigned to: <span className="font-medium text-foreground">{task.assignee.name}</span></span> : <span>Unassigned</span>}
                    {task.due_date && <span className={new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
                
                <div className="flex gap-1">
                    {task.status !== 'to_do' && (
                        <button onClick={() => updateStatus(task.id, 'to_do')} className="p-1.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors" title="Move to To Do">
                            <CircleDashed className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {task.status !== 'in_progress' && (
                        <button onClick={() => updateStatus(task.id, 'in_progress')} className="p-1.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors" title="Move to In Progress">
                            <Clock className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {task.status !== 'completed' && (
                        <button onClick={() => updateStatus(task.id, 'completed')} className="p-1.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors" title="Move to Completed">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks & Projects" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tasks & Projects</h1>
                        <p className="text-sm text-muted-foreground">Manage ongoing tasks, assign responsibilities, and track progress.</p>
                    </div>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <Plus className="w-4 h-4 mr-2" /> New Task
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                    <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select value={data.priority} onChange={e => setData('priority', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                                    <input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Assign To (Optional)</label>
                                    <select value={data.assigned_to} onChange={e => setData('assigned_to', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        <option value="">Unassigned</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <DialogFooter className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Create Task'}
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[500px]">
                    {/* To Do Column */}
                    <div className="flex flex-col bg-muted/30 rounded-xl p-4 border">
                        <div className="flex items-center gap-2 mb-4 font-semibold text-sm">
                            <CircleDashed className="w-4 h-4 text-muted-foreground" />
                            To Do <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">{tasks.filter(t => t.status === 'to_do').length}</span>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            {tasks.filter(t => t.status === 'to_do').map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>

                    {/* In Progress Column */}
                    <div className="flex flex-col bg-muted/30 rounded-xl p-4 border">
                        <div className="flex items-center gap-2 mb-4 font-semibold text-sm">
                            <Clock className="w-4 h-4 text-blue-500" />
                            In Progress <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">{tasks.filter(t => t.status === 'in_progress').length}</span>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            {tasks.filter(t => t.status === 'in_progress').map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>

                    {/* Completed Column */}
                    <div className="flex flex-col bg-muted/30 rounded-xl p-4 border">
                        <div className="flex items-center gap-2 mb-4 font-semibold text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Completed <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">{tasks.filter(t => t.status === 'completed').length}</span>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                            {tasks.filter(t => t.status === 'completed').map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
