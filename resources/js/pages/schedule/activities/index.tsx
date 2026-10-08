import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Activities', href: '/schedule/activities' },
];

export default function ActivitiesIndex({ activities, programs }: any) {
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/schedule/activities', {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activities" />
            <div className="p-4 flex flex-col gap-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold">Activities List</h2>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus size={16} /> Create Activity
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Activity</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="Activity Title" />
                                    {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <Input value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Training" />
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
                                    <Label>Description</Label>
                                    <Textarea value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Description" />
                                </div>
                                <DialogFooter className="md:col-span-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>Create Activity</Button>
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
                                <th className="p-2">Category</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Time</th>
                                <th className="p-2">Venue</th>
                                <th className="p-2">Status</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity: any) => (
                                <tr key={activity.id} className="border-b">
                                    <td className="p-2">{activity.title}</td>
                                    <td className="p-2">{activity.category}</td>
                                    <td className="p-2">{activity.date}</td>
                                    <td className="p-2">{activity.start_time} - {activity.end_time}</td>
                                    <td className="p-2">{activity.venue}</td>
                                    <td className="p-2">{activity.status}</td>
                                    <td className="p-2 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 hover:bg-gray-100 rounded-md">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this activity?')) {
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
            </div>
        </AppLayout>
    );
}
