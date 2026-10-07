import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pending Outputs', href: '/compliance/pending-outputs' },
];

export default function PendingOutputsIndex({ pendingSubmissions }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending Outputs" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Pending Outputs</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Faculty Member</th>
                                <th className="p-2">Missing Output</th>
                                <th className="p-2">Program</th>
                                <th className="p-2">Deadline</th>
                                <th className="p-2">Urgency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingSubmissions.map((sub: any) => (
                                <tr key={sub.id} className="border-b">
                                    <td className="p-2">{sub.faculty?.first_name} {sub.faculty?.last_name}</td>
                                    <td className="p-2">{sub.requirement?.title}</td>
                                    <td className="p-2">{sub.faculty?.program?.code}</td>
                                    <td className="p-2">{new Date(sub.requirement?.due_date).toLocaleString()}</td>
                                    <td className="p-2 font-semibold">
                                        <span className={
                                            sub.urgency === 'Overdue' ? 'text-red-600' : 
                                            sub.urgency === 'Due Today' ? 'text-orange-600' : 
                                            sub.urgency === 'Due Soon' ? 'text-yellow-600' : 'text-blue-600'
                                        }>
                                            {sub.urgency}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {pendingSubmissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">No pending outputs!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
