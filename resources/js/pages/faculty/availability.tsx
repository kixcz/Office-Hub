import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Clock,
    Plus,
    Check,
    Calendar,
    Save
} from 'lucide-react';

interface Props {
    faculty: any;
    availabilities: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Faculty Availability', href: '/faculty/availability' },
];

export default function FacultyAvailabilityPage({ faculty, availabilities = [] }: Props) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const { data, setData, post, processing, recentlySuccessful, reset } = useForm({
        day_of_week: 'Monday',
        preferred_start_time: '08:00',
        preferred_end_time: '17:00',
        status: 'available',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculty/availability', {
            preserveScroll: true,
            onSuccess: () => reset('notes'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Availability - Schedule Preferences" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Faculty Availability & Preferences</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Declare available teaching hours, preferred time slots, and unavailable periods for upcoming semester scheduling.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Form to declare preference (5 cols) */}
                    <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-5 shadow-2xs">
                        <h3 className="text-sm font-bold text-foreground mb-4">Submit Schedule Preference</h3>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Day of Week</label>
                                <select
                                    value={data.day_of_week}
                                    onChange={(e) => setData('day_of_week', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                >
                                    {days.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-foreground block mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={data.preferred_start_time}
                                        onChange={(e) => setData('preferred_start_time', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-foreground block mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={data.preferred_end_time}
                                        onChange={(e) => setData('preferred_end_time', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Availability Type</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                >
                                    <option value="available">Available (Standard)</option>
                                    <option value="preferred">Highly Preferred Slot</option>
                                    <option value="unavailable">Unavailable (Conflict / Off-duty)</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Notes / Reason (Optional)</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    placeholder="e.g., Graduate studies class, research consultation hours..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Preference</span>
                            </button>

                            {recentlySuccessful && (
                                <div className="text-center text-emerald-600 font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Preference successfully recorded!
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Declared Availability Schedule Table (7 cols) */}
                    <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-5 shadow-2xs">
                        <h3 className="text-sm font-bold text-foreground mb-4">Recorded Schedule Preferences</h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                    <tr>
                                        <th className="p-3 font-bold">Day</th>
                                        <th className="p-3 font-bold">Time Window</th>
                                        <th className="p-3 font-bold">Availability Status</th>
                                        <th className="p-3 font-bold">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    {availabilities.length > 0 ? (
                                        availabilities.map((a) => (
                                            <tr key={a.id} className="hover:bg-muted/30">
                                                <td className="p-3 font-bold text-foreground">{a.day_of_week}</td>
                                                <td className="p-3 font-mono text-muted-foreground">
                                                    {a.preferred_start_time} - {a.preferred_end_time}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        a.status === 'preferred'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : a.status === 'unavailable'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{a.notes || '—'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                                No specific availability preferences recorded yet. Defaults to full institutional operating schedule (8:00 AM - 5:00 PM).
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
