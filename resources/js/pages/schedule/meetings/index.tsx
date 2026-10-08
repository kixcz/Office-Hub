import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, MoreVertical, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Meetings', href: '/schedule/meetings' },
];

export default function MeetingsIndex({ meetings, programs }: any) {
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        venue: '',
        agenda: '',
        notes: '',
        status: 'Scheduled',
        program_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/schedule/meetings', {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings" />
            <div className="p-4 flex flex-col gap-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold">Meetings List</h2>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus size={16} /> Schedule a Meeting
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Schedule a Meeting</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="md:col-span-2">
                                    <Label>Title</Label>
                                    <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="Meeting Title" />
                                    {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} />
                                    {errors.date && <div className="text-red-500 text-sm mt-1">{errors.date}</div>}
                                </div>
                                <div>
                                    <Label>Start Time</Label>
                                    <Input type="time" value={data.start_time} onChange={e => setData('start_time', e.target.value)} />
                                    {errors.start_time && <div className="text-red-500 text-sm mt-1">{errors.start_time}</div>}
                                </div>
                                <div>
                                    <Label>End Time</Label>
                                    <Input type="time" value={data.end_time} onChange={e => setData('end_time', e.target.value)} />
                                    {errors.end_time && <div className="text-red-500 text-sm mt-1">{errors.end_time}</div>}
                                </div>
                                <div>
                                    <Label>Venue</Label>
                                    <Input value={data.venue} onChange={e => setData('venue', e.target.value)} placeholder="Venue" />
                                </div>
                                <div>
                                    <Label>Program (Optional)</Label>
                                    <select 
                                        className="w-full border-gray-300 rounded-md shadow-sm"
                                        value={data.program_id} 
                                        onChange={e => setData('program_id', e.target.value)}
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map((program: any) => (
                                            <option key={program.id} value={program.id}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Agenda</Label>
                                    <Textarea value={data.agenda} onChange={e => setData('agenda', e.target.value)} placeholder="Meeting Agenda" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Notes</Label>
                                    <Textarea value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Notes" />
                                </div>
                                <DialogFooter className="md:col-span-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>Create Meeting</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Title</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Time</th>
                                <th className="p-2">Venue</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Organizer</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map((meeting: any) => (
                                <tr key={meeting.id} className="border-b">
                                    <td className="p-2">{meeting.title}</td>
                                    <td className="p-2">{meeting.date}</td>
                                    <td className="p-2">{meeting.start_time} - {meeting.end_time}</td>
                                    <td className="p-2">{meeting.venue}</td>
                                    <td className="p-2">{meeting.status}</td>
                                    <td className="p-2">{meeting.organizer?.name}</td>
                                    <td className="p-2 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this meeting?')) {
                                                            router.delete(`/schedule/meetings/${meeting.id}`);
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
            </div>
        </AppLayout>
    );
}
