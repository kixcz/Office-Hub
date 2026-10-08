import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Playlist', href: '/tv-config/playlist' },
];

function SlideRow({ slide }: { slide: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState({
        title: slide.title,
        type: slide.type,
        duration_seconds: slide.duration_seconds,
        is_active: slide.is_active,
        order: slide.order,
    });

    const handleSave = () => {
        router.put(`/tv-config/playlist/${slide.id}`, data, {
            onSuccess: () => setIsEditing(false),
            preserveScroll: true
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this slide?')) {
            router.delete(`/tv-config/playlist/${slide.id}`, { preserveScroll: true });
        }
    };

    const toggleStatus = () => {
        router.put(`/tv-config/playlist/${slide.id}`, { is_active: !slide.is_active }, { preserveScroll: true });
    };

    if (isEditing) {
        return (
            <tr className="border-b bg-gray-50">
                <td className="p-2">
                    <Input type="number" className="w-16 h-8" value={data.order} onChange={e => setData({ ...data, order: Number(e.target.value) })} />
                </td>
                <td className="p-2">
                    <Input className="h-8" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                </td>
                <td className="p-2">
                    <select className="w-full border-gray-300 rounded-md shadow-sm h-8 py-0" value={data.type} onChange={e => setData({ ...data, type: e.target.value })}>
                        <option value="Slide 1 - Daily Overview">Daily Overview</option>
                        <option value="Slide 2 - Schedule & Meetings">Schedule & Meetings</option>
                        <option value="Slide 3 - Compliance Monitoring">Compliance Monitoring</option>
                        <option value="Slide 4 - Performance & Recognition">Performance & Recognition</option>
                        <option value="Slide 5 - Classroom Monitoring">Classroom Monitoring</option>
                    </select>
                </td>
                <td className="p-2">
                    <Input type="number" min="5" className="w-20 h-8" value={data.duration_seconds} onChange={e => setData({ ...data, duration_seconds: Number(e.target.value) })} />
                </td>
                <td className="p-2 flex gap-2">
                    <Button size="sm" onClick={handleSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                        setData({ title: slide.title, type: slide.type, duration_seconds: slide.duration_seconds, is_active: slide.is_active, order: slide.order });
                        setIsEditing(false);
                    }}>Cancel</Button>
                </td>
            </tr>
        );
    }

    return (
        <tr className={`border-b ${!slide.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
            <td className="p-2">{slide.order}</td>
            <td className="p-2 font-bold">{slide.title}</td>
            <td className="p-2 text-gray-600">{slide.type}</td>
            <td className="p-2">{slide.duration_seconds}s</td>
            <td className="p-2 flex items-center justify-end gap-2">
                <button onClick={toggleStatus} className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${slide.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {slide.is_active ? 'Active' : 'Disabled'}
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
}

export default function PlaylistIndex({ slides }: any) {
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        type: 'Slide 1 - Daily Overview',
        duration_seconds: 15
    });

    const submit = (e: any) => {
        e.preventDefault();
        post('/tv-config/playlist', {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV Playlist" />
            <div className="p-4 flex flex-col gap-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold">Playlist Order & Status</h2>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus size={16} /> Add New Slide
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New Slide</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
                                <div>
                                    <Label>Slide Title</Label>
                                    <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Weekly Updates" required />
                                </div>
                                <div>
                                    <Label>Slide Type</Label>
                                    <select className="w-full border-gray-300 rounded-md shadow-sm h-10" value={data.type} onChange={e => setData('type', e.target.value)}>
                                        <option value="Slide 1 - Daily Overview">Daily Overview</option>
                                        <option value="Slide 2 - Schedule & Meetings">Schedule & Meetings</option>
                                        <option value="Slide 3 - Compliance Monitoring">Compliance Monitoring</option>
                                        <option value="Slide 4 - Performance & Recognition">Performance & Recognition</option>
                                        <option value="Slide 5 - Classroom Monitoring">Classroom Monitoring</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Duration (seconds)</Label>
                                    <Input type="number" min="5" value={data.duration_seconds} onChange={e => setData('duration_seconds', Number(e.target.value))} required />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>Add to Playlist</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Playlist Order & Status</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2 w-16">Order</th>
                                <th className="p-2">Title</th>
                                <th className="p-2">Type</th>
                                <th className="p-2 w-24">Duration</th>
                                <th className="p-2 w-48">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slides.map((slide: any) => (
                                <SlideRow key={slide.id} slide={slide} />
                            ))}
                            {slides.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">Playlist is empty. Add slides above.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
