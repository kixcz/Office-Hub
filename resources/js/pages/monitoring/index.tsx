import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { RefreshCw, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classroom Monitoring',
        href: '/classroom-monitoring',
    },
];

export default function MonitoringIndex({ facilities, last_updated }: any) {
    const handleSync = () => {
        router.post(route('classroom-monitoring.sync'), {}, {
            preserveScroll: true
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classroom Monitoring" />

            <div className="flex flex-col gap-8 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Classroom & Laboratory Monitoring
                        </h2>
                        <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={16} /> Last synced: {last_updated}
                        </span>
                    </div>
                    <Button onClick={handleSync} className="gap-2">
                        <RefreshCw size={16} /> Sync from Google Sheets
                    </Button>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="mb-6 flex gap-4">
                            <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 flex items-center gap-2">
                                <Activity size={18} /> In Use: {facilities.filter((f: any) => f.status === 'In Use').length}
                            </div>
                            <div className="px-4 py-2 bg-green-50 border border-green-100 rounded-lg text-green-800 flex items-center gap-2">
                                <CheckCircle size={18} /> Available: {facilities.filter((f: any) => f.status === 'Available').length}
                            </div>
                            <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-800 flex items-center gap-2">
                                <AlertTriangle size={18} /> Maintenance: {facilities.filter((f: any) => f.status === 'Maintenance').length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {facilities.map((room: any) => {
                                const statusColors: any = {
                                    'Available': 'bg-green-50 border-green-200',
                                    'In Use': 'bg-blue-50 border-blue-200',
                                    'Reserved': 'bg-amber-50 border-amber-200',
                                    'Maintenance': 'bg-red-50 border-red-200',
                                    'Unavailable': 'bg-gray-50 border-gray-200'
                                };
                                const color = statusColors[room.status] || 'bg-gray-50 border-gray-200';

                                return (
                                    <div key={room.id} className={`border rounded-xl p-5 ${color}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg text-gray-900">{room.room_name}</h3>
                                            <span className="text-xs font-semibold px-2 py-1 bg-white rounded shadow-sm text-gray-600 border">{room.room_type}</span>
                                        </div>
                                        <div className="mb-4">
                                            <span className={`text-sm font-bold px-2 py-1 rounded
                                                ${room.status === 'In Use' ? 'bg-blue-200 text-blue-900' : 
                                                  room.status === 'Available' ? 'bg-green-200 text-green-900' :
                                                  room.status === 'Maintenance' ? 'bg-red-200 text-red-900' :
                                                  'bg-gray-200 text-gray-900'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </div>
                                        {room.current_class && (
                                            <div className="bg-white/80 p-3 rounded-lg mb-3 border border-gray-200">
                                                <p className="font-bold text-gray-800">{room.current_class}</p>
                                                <p className="text-sm text-gray-600">{room.instructor} {room.program ? `(${room.program})` : ''}</p>
                                                <p className="text-xs font-semibold mt-1 text-gray-500">
                                                    {room.start_time?.substring(0,5)} - {room.end_time?.substring(0,5)}
                                                </p>
                                            </div>
                                        )}
                                        {room.remarks && (
                                            <p className="text-sm italic text-gray-600 mt-2">{room.remarks}</p>
                                        )}
                                        {room.next_schedule && (
                                            <div className="mt-3 pt-3 border-t border-gray-200/60">
                                                <p className="text-xs font-semibold text-gray-500 uppercase">Up Next</p>
                                                <p className="text-sm font-medium text-gray-800">{room.next_schedule}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
        </AppLayout>
    );
}
