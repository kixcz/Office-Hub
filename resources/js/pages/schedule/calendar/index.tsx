import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Calendar', href: '/schedule/calendar' },
];

export default function CalendarIndex({ events }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-2xl font-bold mb-6">Consolidated Calendar</h2>
                    
                    <div className="grid gap-4">
                        {events.length === 0 ? (
                            <p className="text-gray-500">No scheduled events found.</p>
                        ) : (
                            events.map((event: any) => (
                                <div key={event.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-md shadow-sm">
                                    <div className="flex-shrink-0 w-32 flex flex-col justify-center border-r pr-4 text-center">
                                        <span className="text-xl font-bold text-gray-800">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        <span className="text-sm text-gray-500">{event.start_time}</span>
                                    </div>
                                    <div className="flex-grow flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                                                event.type === 'activity' ? 'bg-purple-100 text-purple-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {event.type.toUpperCase()}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                                                {event.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold">{event.title}</h3>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span><strong>Venue:</strong> {event.venue}</span> | 
                                            <span className="ml-2"><strong>Program:</strong> {event.program}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
