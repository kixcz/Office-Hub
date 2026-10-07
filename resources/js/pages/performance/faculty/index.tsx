import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Faculty Performance', href: '/performance/faculty' },
];

export default function FacultyPerformanceIndex({ performances }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Performance" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Faculty Performance</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Name</th>
                                <th className="p-2">Program</th>
                                <th className="p-2">Reqs</th>
                                <th className="p-2">Complied</th>
                                <th className="p-2">On Time</th>
                                <th className="p-2">Late</th>
                                <th className="p-2">Overdue</th>
                                <th className="p-2">Comp. Rate</th>
                                <th className="p-2">On-Time Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performances.map((perf: any) => (
                                <tr key={perf.id} className="border-b">
                                    <td className="p-2">{perf.name}</td>
                                    <td className="p-2">{perf.program}</td>
                                    <td className="p-2">{perf.total_requirements}</td>
                                    <td className="p-2 text-green-600">{perf.complied}</td>
                                    <td className="p-2 text-blue-600">{perf.on_time}</td>
                                    <td className="p-2 text-orange-600">{perf.late}</td>
                                    <td className="p-2 text-red-600">{perf.overdue}</td>
                                    <td className="p-2 font-bold">{perf.compliance_rate}%</td>
                                    <td className="p-2 font-bold">{perf.on_time_rate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
