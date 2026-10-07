import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance Tracker', href: '/compliance/tracker' },
];

export default function ComplianceTrackerIndex({ stats }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compliance Tracker" />
            <div className="p-4 flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-md shadow flex flex-col items-center justify-center">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Overall Compliance Rate</h3>
                        <div className="text-4xl font-bold text-blue-600 mt-2">{stats.overall_rate}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-md shadow flex flex-col items-center justify-center">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Completed</h3>
                        <div className="text-4xl font-bold text-green-600 mt-2">{stats.completed}</div>
                    </div>
                    <div className="bg-white p-6 rounded-md shadow flex flex-col items-center justify-center">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Pending</h3>
                        <div className="text-4xl font-bold text-yellow-600 mt-2">{stats.pending}</div>
                    </div>
                    <div className="bg-white p-6 rounded-md shadow flex flex-col items-center justify-center">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Overdue</h3>
                        <div className="text-4xl font-bold text-red-600 mt-2">{stats.overdue}</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
