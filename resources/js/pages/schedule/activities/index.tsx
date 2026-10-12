import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, MoreVertical, Edit, Trash, Eye, Calendar, Clock, MapPin, Tag, Activity as ActivityIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Activities', href: '/schedule/activities' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Activity {
    id: number;
    title: string;
    category?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    venue?: string | null;
    description?: string | null;
    visibility: string;
    status: string;
    program_id?: number | null;
    program?: Program | null;
}

interface Props {
    activities: Activity[];
    programs: Program[];
}

export default function ActivitiesIndex({ activities, programs }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({
        title: '',
        category: '',
        date: '',
        start_time: '',
        end_time: '',
        venue: '',
        description: '',
        visibility: 'public',
        status: 'Scheduled',
        program_id: '',
    });

    const openCreateDialog = () => {
        setEditingActivity(null);
        clearErrors();
        reset();
        setData({
            title: '',
            category: 'Event',
            date: new Date().toISOString().split('T')[0],
            start_time: '08:00',
            end_time: '17:00',
            venue: '',
            description: '',
            visibility: 'public',
            status: 'Scheduled',
            program_id: '',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (activity: Activity) => {
        setEditingActivity(activity);
        clearErrors();
        setData({
            title: activity.title || '',
            category: activity.category || '',
            date: activity.date ? activity.date.slice(0, 10) : '',
            start_time: activity.start_time ? activity.start_time.slice(0, 5) : '',
            end_time: activity.end_time ? activity.end_time.slice(0, 5) : '',
            venue: activity.venue || '',
            description: activity.description || '',
            visibility: activity.visibility || 'public',
            status: activity.status || 'Scheduled',
            program_id: activity.program_id ? String(activity.program_id) : '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingActivity) {
            put(`/schedule/activities/${editingActivity.id}`, {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                    setEditingActivity(null);
                },
            });
        } else {
            post('/schedule/activities', {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                },
            });
        }
    };

    const formatTimeDisplay = (timeStr?: string | null) => {
        if (!timeStr) return '';
        try {
            const parts = timeStr.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parts[1] || '00';
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            return `${formattedHour}:${minute} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activities" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <ActivityIcon className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight">Activities Management</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Schedule, monitor, and coordinate institutional and academic activities.
                        </p>
                    </div>

                    <Button onClick={openCreateDialog} className="gap-2 shadow-sm">
                        <Plus size={16} /> Create Activity
                    </Button>
                </div>

                {/* Add / Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5 text-primary" />
                                {editingActivity ? 'Edit Activity' : 'Create New Activity'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="title">Activity Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder="e.g. IT Olympiad 2026"
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    placeholder="e.g. Event, Workshop, Seminar"
                                />
                                {errors.category && <div className="text-red-500 text-xs mt-1">{errors.category}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    required
                                />
                                {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="start_time">Start Time <span className="text-red-500">*</span></Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={data.start_time}
                                    onChange={e => setData('start_time', e.target.value)}
                                    required
                                />
                                {errors.start_time && <div className="text-red-500 text-xs mt-1">{errors.start_time}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="end_time">End Time <span className="text-red-500">*</span></Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={data.end_time}
                                    onChange={e => setData('end_time', e.target.value)}
                                    required
                                />
                                {errors.end_time && <div className="text-red-500 text-xs mt-1">{errors.end_time}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="venue">Venue</Label>
                                <Input
                                    id="venue"
                                    value={data.venue}
                                    onChange={e => setData('venue', e.target.value)}
                                    placeholder="e.g. University Gymnasium"
                                />
                                {errors.venue && <div className="text-red-500 text-xs mt-1">{errors.venue}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="program_id">Program (Optional)</Label>
                                <select
                                    id="program_id"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.program_id}
                                    onChange={e => setData('program_id', e.target.value)}
                                >
                                    <option value="">All Programs / General</option>
                                    {programs.map((program: Program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.code} — {program.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.program_id && <div className="text-red-500 text-xs mt-1">{errors.program_id}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    required
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="visibility">Visibility <span className="text-red-500">*</span></Label>
                                <select
                                    id="visibility"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.visibility}
                                    onChange={e => setData('visibility', e.target.value)}
                                    required
                                >
                                    <option value="public">Public</option>
                                    <option value="Internal">Internal (College Only)</option>
                                    <option value="Confidential">Confidential</option>
                                </select>
                                {errors.visibility && <div className="text-red-500 text-xs mt-1">{errors.visibility}</div>}
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="description">Description / Notes</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Provide detailed description, prerequisites, or notes..."
                                    rows={3}
                                />
                                {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                            </div>

                            <DialogFooter className="md:col-span-2 mt-4 gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Details Dialog */}
                <Dialog open={!!viewingActivity} onOpenChange={(open) => !open && setViewingActivity(null)}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5 text-blue-500" />
                                Activity Details
                            </DialogTitle>
                        </DialogHeader>

                        {viewingActivity && (
                            <div className="space-y-4 text-sm mt-2">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{viewingActivity.title}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {viewingActivity.category && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <Tag className="w-3 h-3" />
                                                {viewingActivity.category}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            viewingActivity.status === 'Completed'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : viewingActivity.status === 'Ongoing'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                : 'bg-primary/10 text-primary'
                                        }`}>
                                            {viewingActivity.status}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                            {viewingActivity.visibility}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" /> Date
                                        </div>
                                        <div className="font-semibold text-foreground">
                                            {viewingActivity.date}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" /> Time
                                        </div>
                                        <div className="font-semibold text-foreground">
                                            {formatTimeDisplay(viewingActivity.start_time)} - {formatTimeDisplay(viewingActivity.end_time)}
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-1 pt-1 border-t border-border">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" /> Venue
                                        </div>
                                        <div className="font-semibold text-foreground">
                                            {viewingActivity.venue || 'No venue specified'}
                                        </div>
                                    </div>

                                    {viewingActivity.program && (
                                        <div className="col-span-2 space-y-1 pt-1 border-t border-border">
                                            <div className="text-xs text-muted-foreground">Assigned Program</div>
                                            <div className="font-medium text-foreground">
                                                {viewingActivity.program.code} — {viewingActivity.program.name}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {viewingActivity.description && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Description</Label>
                                        <p className="p-3 rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed whitespace-pre-wrap">
                                            {viewingActivity.description}
                                        </p>
                                    </div>
                                )}

                                <DialogFooter className="mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const act = viewingActivity;
                                            setViewingActivity(null);
                                            openEditDialog(act);
                                        }}
                                        className="gap-2"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Activity
                                    </Button>
                                    <Button onClick={() => setViewingActivity(null)}>
                                        Close
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Activities Listing Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-1 flex flex-col">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full my-auto">
                            <div className="p-4 rounded-full bg-muted/60 mb-3">
                                <ActivityIcon className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-base font-semibold">No activities scheduled</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Click the &quot;Create Activity&quot; button to schedule your first activity or event.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold">Activity</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Category</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Date & Time</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Venue</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Program</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Status</th>
                                        <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{activity.title}</div>
                                                {activity.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs mt-0.5">
                                                        {activity.description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {activity.category ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        {activity.category}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-foreground font-medium text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    {activity.date}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    {formatTimeDisplay(activity.start_time)} - {formatTimeDisplay(activity.end_time)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-muted-foreground text-xs">
                                                {activity.venue ? (
                                                    <div className="flex items-center gap-1 text-foreground">
                                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                        <span>{activity.venue}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            <td className="px-6 py-4 text-xs">
                                                {activity.program ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                                        {activity.program.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">General</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    activity.status === 'Completed'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : activity.status === 'Ongoing'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : activity.status === 'Cancelled'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : 'bg-primary/10 text-primary'
                                                }`}>
                                                    {activity.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-muted rounded-md transition-colors">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36">
                                                        <DropdownMenuItem onClick={() => setViewingActivity(activity)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete "${activity.title}"?`)) {
                                                                    router.delete(`/schedule/activities/${activity.id}`);
                                                                }
                                                            }}
                                                        >
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
