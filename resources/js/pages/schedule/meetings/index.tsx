import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Meetings', href: '/schedule/meetings' },
];

export default function MeetingsIndex({ meetings, programs }: any) {
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
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Schedule a Meeting</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                        <div>
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
                        <Button type="submit" disabled={processing} className="w-fit md:col-span-2">Create Meeting</Button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Meetings List</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Title</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Time</th>
                                <th className="p-2">Venue</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Organizer</th>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
