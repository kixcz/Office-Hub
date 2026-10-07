import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Playlist', href: '/tv-config/playlist' },
];

export default function PlaylistIndex({ slides }: any) {
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        type: 'announcements_schedule',
        duration_seconds: 15
    });

    const submit = (e: any) => {
        e.preventDefault();
        post('/tv-config/playlist', {
            onSuccess: () => reset()
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TV Playlist" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Add New Slide</h2>
                    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <Label>Slide Title</Label>
                            <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Weekly Updates" required />
                        </div>
                        <div className="flex-1">
                            <Label>Slide Type</Label>
                            <select className="w-full border-gray-300 rounded-md shadow-sm h-10" value={data.type} onChange={e => setData('type', e.target.value)}>
                                <option value="announcements_schedule">Announcements & Schedule</option>
                                <option value="compliance_pending">Compliance & Pending Outputs</option>
                                <option value="recognition">Top Faculty & Programs</option>
                            </select>
                        </div>
                        <div className="w-32">
                            <Label>Duration (s)</Label>
                            <Input type="number" min="5" value={data.duration_seconds} onChange={e => setData('duration_seconds', Number(e.target.value))} required />
                        </div>
                        <Button type="submit" disabled={processing}>Add to Playlist</Button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Playlist Order & Status</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Order</th>
                                <th className="p-2">Title</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slides.map((slide: any) => (
                                <tr key={slide.id} className={`border-b ${!slide.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                                    <td className="p-2">{slide.order}</td>
                                    <td className="p-2 font-bold">{slide.title}</td>
                                    <td className="p-2 text-gray-600">{slide.type}</td>
                                    <td className="p-2">{slide.duration_seconds}s</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${slide.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {slide.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {slides.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">Playlist is empty. Add slides above.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <p className="text-sm text-gray-500 mt-4">* To reorder or toggle status, use the API or edit functionality (stubbed for demonstration).</p>
                </div>
            </div>
        </AppLayout>
    );
}
