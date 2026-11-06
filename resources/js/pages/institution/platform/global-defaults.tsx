import { Head, useForm } from '@inertiajs/react';
import {
    Bell,
    Clock,
    FileCode2,
    Layers,
    Save,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Global Defaults', href: '/institution/global-defaults' },
];

interface GlobalDefaultsData {
    operating_hours_start: string;
    operating_hours_end: string;
    time_format: string;
    default_pagination: number;
    report_naming_convention: string;
    default_retention_years: number;
    session_timeout_minutes: number;
    notification_channels: {
        in_app: boolean;
        email_digest: boolean;
        tv_ticker_urgent: boolean;
    };
    common_statuses: string[];
}

interface Props {
    defaults: GlobalDefaultsData;
}

export default function InstitutionGlobalDefaults({ defaults }: Props) {
    const form = useForm({
        defaults: {
            operating_hours_start: defaults?.operating_hours_start ?? '07:00',
            operating_hours_end: defaults?.operating_hours_end ?? '21:00',
            time_format: defaults?.time_format ?? '12-hour (AM/PM)',
            default_pagination: defaults?.default_pagination ?? 25,
            report_naming_convention:
                defaults?.report_naming_convention ??
                '{INSTITUTION}_{ENTITY}_{COLLEGE}_{MODULE}_{AY}_{SEM}_{DATE}',
            default_retention_years: defaults?.default_retention_years ?? 5,
            session_timeout_minutes: defaults?.session_timeout_minutes ?? 120,
            notification_channels: defaults?.notification_channels ?? {
                in_app: true,
                email_digest: true,
                tv_ticker_urgent: true,
            },
            common_statuses: defaults?.common_statuses ?? [
                'Draft',
                'Submitted',
                'Under Review',
                'Verified',
                'Approved',
                'Published',
                'Archived',
            ],
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/institution/global-defaults', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Global Defaults — Ascend Platform Configuration" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Inherited Platform Behaviors
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Ascend Global Defaults
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Configure baseline settings inherited by all Entities and Colleges: default operating
                                hours, time display format, table pagination, standardized report file naming,
                                archival retention, session duration, and lifecycle state labels.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
                        >
                            <Save className="h-4 w-4" />
                            Save Global Defaults
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-8">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                                <Clock className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Operating Window, Pagination & Session Defaults
                                </h2>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Daily Operating Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={form.data.defaults.operating_hours_start}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                operating_hours_start: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Daily Operating End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={form.data.defaults.operating_hours_end}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                operating_hours_end: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Time Display Format
                                    </label>
                                    <select
                                        value={form.data.defaults.time_format}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                time_format: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="12-hour (AM/PM)">12-hour (AM/PM)</option>
                                        <option value="24-hour (Military)">24-hour (07:00 – 21:00)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Table Pagination Size
                                    </label>
                                    <select
                                        value={form.data.defaults.default_pagination}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                default_pagination: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value={15}>15 rows per page</option>
                                        <option value={25}>25 rows per page</option>
                                        <option value={50}>50 rows per page</option>
                                        <option value={100}>100 rows per page</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Record Retention (Years)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={form.data.defaults.default_retention_years}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                default_retention_years: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Session Timeout (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min={15}
                                        max={480}
                                        value={form.data.defaults.session_timeout_minutes}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                session_timeout_minutes: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Exported Report File Naming Convention
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.defaults.report_naming_convention}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                report_naming_convention: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                                <Bell className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Notification Channels
                                </h2>
                            </div>

                            <div className="mt-4 space-y-3">
                                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="font-semibold">In-App Governance Alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={form.data.defaults.notification_channels.in_app}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                notification_channels: {
                                                    ...form.data.defaults.notification_channels,
                                                    in_app: e.target.checked,
                                                },
                                            })
                                        }
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                </label>
                                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="font-semibold">Institutional Email Digests</span>
                                    <input
                                        type="checkbox"
                                        checked={form.data.defaults.notification_channels.email_digest}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                notification_channels: {
                                                    ...form.data.defaults.notification_channels,
                                                    email_digest: e.target.checked,
                                                },
                                            })
                                        }
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                </label>
                                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="font-semibold">Urgent TV Signage Ticker Broadcast</span>
                                    <input
                                        type="checkbox"
                                        checked={form.data.defaults.notification_channels.tv_ticker_urgent}
                                        onChange={(e) =>
                                            form.setData('defaults', {
                                                ...form.data.defaults,
                                                notification_channels: {
                                                    ...form.data.defaults.notification_channels,
                                                    tv_ticker_urgent: e.target.checked,
                                                },
                                            })
                                        }
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                                <Layers className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Standard Lifecycle States
                                </h2>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {form.data.defaults.common_statuses.map((st) => (
                                    <span
                                        key={st}
                                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    >
                                        {st}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

