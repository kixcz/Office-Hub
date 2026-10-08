import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Plus, Trash2, MapPin, Users, Tv, MoreVertical, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Meeting {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
    is_public: boolean;
    organizer: User;
}

interface Props {
    meetings: Meeting[];
}

export default function MeetingsIndex({ meetings }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Meetings & Activities', href: '/meetings' },
    ];

    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        is_public: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/meetings', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    const deleteMeeting = (id: number) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            router.delete(`/meetings/${id}`);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings & Activities" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Meetings & Activities</h1>
                        <p className="text-sm text-muted-foreground">Schedule and coordinate college events and meetings.</p>
                    </div>
                    
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <Plus className="mr-2 h-4 w-4" /> Schedule Event
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Schedule New Event</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Title / Subject</label>
                                    <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Time</label>
                                    <input type="datetime-local" value={data.start_time} onChange={e => setData('start_time', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">End Time</label>
                                    <input type="datetime-local" value={data.end_time} onChange={e => setData('end_time', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input type="text" placeholder="e.g. Conference Room A" value={data.location} onChange={e => setData('location', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="is_public" checked={data.is_public} onChange={e => setData('is_public', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <label htmlFor="is_public" className="text-sm font-medium">Show on TV Display</label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                    <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>

                                <DialogFooter className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 py-2">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Schedule Event'}
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 auto-rows-max">
                    {meetings.length === 0 ? (
                        <div className="col-span-full rounded-xl border bg-card text-card-foreground shadow flex flex-col items-center justify-center p-12 text-center h-64">
                            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No meetings scheduled</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Schedule an event or meeting to coordinate with the college.
                            </p>
                        </div>
                    ) : (
                        meetings.map((meeting) => (
                            <div key={meeting.id} className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex flex-col">
                                <div className="p-4 border-b flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{meeting.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {formatDateTime(meeting.start_time)} - {new Date(meeting.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => deleteMeeting(meeting.id)}
                                        className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted"
                                        title="Delete Meeting"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-4 flex-1 text-sm flex flex-col gap-2">
                                    {meeting.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {meeting.location}
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="w-4 h-4 mr-2" />
                                        Organizer: {meeting.organizer.name}
                                    </div>
                                    {meeting.is_public && (
                                        <div className="flex items-center text-blue-600 dark:text-blue-400 mt-1 bg-blue-50 dark:bg-blue-950/30 p-1.5 rounded-md w-fit text-xs font-medium">
                                            <Tv className="w-3 h-3 mr-1" />
                                            TV Display Broadcast
                                        </div>
                                    )}
                                    {meeting.description && (
                                        <p className="mt-2 text-foreground/80 pt-2 border-t text-xs">
                                            {meeting.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
