import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Slide Configuration', href: '/tv-config/slides' },
];

export default function SlideConfigIndex({ slides }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Slide Configuration" />
            <div className="p-4 flex flex-col gap-6">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold">Slide Configuration</h2>
                    <p className="text-gray-500">Configure content rules, visible sections, and record limits for each active slide.</p>
                </div>
                
                {slides.map((slide: any) => (
                    <div key={slide.id} className="bg-white p-6 rounded-md shadow flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h3 className="text-lg font-bold">{slide.title}</h3>
                                <p className="text-sm text-gray-500">Type: {slide.type} | Duration: {slide.duration_seconds}s</p>
                            </div>
                            <Button variant="outline" size="sm">Save Config</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Example placeholder fields based on slide type */}
                            {slide.type === 'announcements_schedule' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Max Announcements</label>
                                        <input type="number" defaultValue="3" className="border rounded p-2" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Max Schedule Items</label>
                                        <input type="number" defaultValue="5" className="border rounded p-2" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Hide Expired Events</label>
                                        <select className="border rounded p-2"><option>Yes</option><option>No</option></select>
                                    </div>
                                </>
                            )}
                            {slide.type === 'compliance_pending' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Visible Requirements</label>
                                        <input type="text" defaultValue="TOS, TQ, Syllabus" className="border rounded p-2" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Max Urgent Pending Records</label>
                                        <input type="number" defaultValue="6" className="border rounded p-2" />
                                    </div>
                                </>
                            )}
                            {slide.type === 'recognition' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Max Top Faculty</label>
                                        <input type="number" defaultValue="5" className="border rounded p-2" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Max Top Programs</label>
                                        <input type="number" defaultValue="3" className="border rounded p-2" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold">Show Faculty Names?</label>
                                        <select className="border rounded p-2"><option>Yes</option><option>No, hide names</option></select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                
                {slides.length === 0 && <p className="text-gray-500">No slides available to configure. Please add slides in the Playlist module.</p>}
            </div>
        </AppLayout>
    );
}
