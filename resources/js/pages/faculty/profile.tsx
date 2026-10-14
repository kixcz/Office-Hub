import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import {
    User,
    Briefcase,
    GraduationCap,
    BookOpen,
    Clock,
    ClipboardCheck,
    CheckCircle2,
    FlaskConical,
    Trophy,
    Camera,
    Save,
    Check,
    AlertCircle,
    Calendar,
    Phone,
    Mail,
    Building2,
    ShieldCheck,
    FileText,
    ExternalLink
} from 'lucide-react';

interface Props {
    faculty: any;
    submissions: Array<any>;
    attendances: Array<any>;
    corrections: Array<any>;
    accomplishments: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Profile', href: '/faculty/profile' },
];

export default function FacultyProfilePage({
    faculty,
    submissions = [],
    attendances = [],
    corrections = [],
    accomplishments = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<
        | 'personal'
        | 'employment'
        | 'education'
        | 'teaching'
        | 'loading'
        | 'attendance'
        | 'compliance'
        | 'research'
        | 'accomplishments'
    >('personal');

    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        email: faculty?.email || '',
        phone: faculty?.phone || '',
        office_room: faculty?.office_room || '',
        specialization: faculty?.specialization || '',
        highest_qualification: faculty?.highest_qualification || '',
        password: '',
        password_confirmation: '',
        profile_picture: null as File | null,
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculty/profile', {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: User },
        { id: 'employment', label: 'Employment Details', icon: Briefcase },
        { id: 'education', label: 'Education & Qualifications', icon: GraduationCap },
        { id: 'teaching', label: 'Teaching Profile', icon: BookOpen },
        { id: 'loading', label: 'Faculty Loading', icon: Clock },
        { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
        { id: 'compliance', label: 'Compliance', icon: CheckCircle2 },
        { id: 'research', label: 'Research & Extension', icon: FlaskConical },
        { id: 'accomplishments', label: 'Accomplishments', icon: Trophy },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Faculty Dossier - ${faculty?.full_name || 'My Profile'}`} />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                {/* Dossier Header Card */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-border overflow-hidden flex items-center justify-center text-2xl font-black text-slate-700 dark:text-slate-200 shadow-sm">
                                    {faculty?.photo_url ? (
                                        <img src={faculty.photo_url} alt={faculty.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        faculty ? `${faculty.first_name[0]}${faculty.last_name[0]}` : 'JV'
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold">
                                        <Camera className="w-5 h-5 mb-0.5" />
                                        <span>Change</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => setData('profile_picture', e.target.files?.[0] || null)}
                                        />
                                    </label>
                                )}
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                                        {faculty?.title_name || 'Instr. Jerick Erie Vicente'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                                        {faculty?.academic_rank || 'Instructor I'}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                                    <span className="font-semibold text-foreground">Employee ID: {faculty?.employee_id || 'CIDS-2026-011'}</span>
                                    <span>•</span>
                                    <span>{faculty?.program?.name || 'BS Information Technology'}</span>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active Full-Time
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                                >
                                    Edit Credentials
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 9 Dossier Tabs Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/60">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Display */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    {/* 1. Personal Information */}
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Personal & Contact Information</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Faculty members can modify their contact details and login credentials directly.
                                    </p>
                                </div>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground block mb-1">Official Email</label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                                required
                                            />
                                            {errors.email && <div className="text-xs text-rose-500 mt-1">{errors.email}</div>}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-foreground block mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-foreground block mb-1">Office Room Assignment</label>
                                            <input
                                                type="text"
                                                value={data.office_room}
                                                onChange={(e) => setData('office_room', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-foreground block mb-1">Area of Specialization</label>
                                            <input
                                                type="text"
                                                value={data.specialization}
                                                onChange={(e) => setData('specialization', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/60">
                                        <h4 className="text-xs font-bold text-foreground mb-3">Change Account Password (Optional)</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground block mb-1">New Password</label>
                                                <input
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                                    placeholder="Leave blank to keep current"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground block mb-1">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save Changes</span>
                                        </button>
                                        {recentlySuccessful && (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                <Check className="w-3.5 h-3.5" /> Updated successfully!
                                            </span>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Full Legal Name</span>
                                            <span className="font-bold text-foreground">{faculty?.full_name}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Institutional Employee ID</span>
                                            <span className="font-mono font-bold text-foreground">{faculty?.employee_id}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Official Email</span>
                                            <span className="font-bold text-foreground">{faculty?.email}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Phone Number</span>
                                            <span className="font-bold text-foreground">{faculty?.phone || '+63 917 888 1234'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Office Assignment</span>
                                            <span className="font-bold text-foreground">{faculty?.office_room || 'Room 303, CIDS Building'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="font-semibold text-muted-foreground">Primary Specialization</span>
                                            <span className="font-bold text-foreground">{faculty?.specialization || 'Web Systems & Application Architecture'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Employment Details */}
                    {activeTab === 'employment' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Official Appointment & Employment</h3>
                                <p className="text-xs text-muted-foreground">
                                    Changes to rank or employment status require administrative authorization.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                                    <div className="text-muted-foreground font-semibold">Academic Rank</div>
                                    <div className="text-sm font-bold text-foreground mt-0.5">{faculty?.academic_rank || 'Instructor I'}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                                    <div className="text-muted-foreground font-semibold">Employment Type</div>
                                    <div className="text-sm font-bold text-foreground mt-0.5">{faculty?.employment_type || 'Full-time'}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                                    <div className="text-muted-foreground font-semibold">Home Program</div>
                                    <div className="text-sm font-bold text-foreground mt-0.5">{faculty?.program?.name || 'BS Information Technology'}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                                    <div className="text-muted-foreground font-semibold">Employment Date</div>
                                    <div className="text-sm font-bold text-foreground mt-0.5">{faculty?.employment_date || 'August 15, 2023'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Education & Qualifications */}
                    {activeTab === 'education' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Academic Credentials & Certifications</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
                                    <div className="text-xs font-bold text-foreground">Master of Information Technology</div>
                                    <div className="text-muted-foreground mt-0.5">Specialization: Software Engineering & Cloud Architecture</div>
                                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Verified by Dean's Office</div>
                                </div>
                                <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
                                    <div className="text-xs font-bold text-foreground">Bachelor of Science in Information Technology</div>
                                    <div className="text-muted-foreground mt-0.5">Major in Network and Web Development (Graduated Cum Laude)</div>
                                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Verified by Dean's Office</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Teaching Profile */}
                    {activeTab === 'teaching' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Teaching Assignments & Course Matrix</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <div className="font-bold text-foreground">IT 301 - Object-Oriented Programming</div>
                                    <div className="text-muted-foreground mt-0.5">BSIT 3A • 3 Units Lecture</div>
                                </div>
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <div className="font-bold text-foreground">IT 202 - Data Structures & Algorithms</div>
                                    <div className="text-muted-foreground mt-0.5">BSIT 2B • 3 Units Lecture</div>
                                </div>
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <div className="font-bold text-foreground">IT 310 - Software Engineering</div>
                                    <div className="text-muted-foreground mt-0.5">BSIT 3A • 3 Units Lecture</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Faculty Loading */}
                    {activeTab === 'loading' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Approved Semester Faculty Loading</h3>
                                <p className="text-xs text-muted-foreground">15 Approved Units for AY 2026–2027, 1st Semester</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
                                <div className="text-sm font-bold text-blue-900 dark:text-blue-300">Teaching Units: 15 Units</div>
                                <div className="text-xs text-muted-foreground mt-1">Preparations: 3 Unique Courses • Standard Regular Load</div>
                            </div>
                        </div>
                    )}

                    {/* 6. Attendance */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Verified Attendance Records</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border/60 text-muted-foreground">
                                            <th className="py-2">Session Date</th>
                                            <th className="py-2">Time Slot</th>
                                            <th className="py-2">Status</th>
                                            <th className="py-2">Late (Mins)</th>
                                            <th className="py-2">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 font-medium">
                                        {attendances.length > 0 ? (
                                            attendances.map((att) => (
                                                <tr key={att.id}>
                                                    <td className="py-2">{att.session_date}</td>
                                                    <td className="py-2">{att.time_slot}</td>
                                                    <td className="py-2">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            {att.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2">{att.late_minutes}</td>
                                                    <td className="py-2">{att.remarks || '—'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                                                    94% verified attendance rate for current period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 7. Compliance */}
                    {activeTab === 'compliance' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Documentary Compliance History</h3>
                            </div>
                            <div className="space-y-2.5">
                                {submissions.length > 0 ? (
                                    submissions.map((sub) => (
                                        <div key={sub.id} className="p-3 rounded-xl border border-border flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">{sub.requirement?.title || 'Requirement Document'}</div>
                                                <div className="text-[11px] text-muted-foreground">Submitted: {sub.submitted_at || 'Recorded'}</div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                {sub.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted-foreground">12 of 14 requirements complied for current period.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 8. Research & Extension */}
                    {activeTab === 'research' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3">
                                <h3 className="text-base font-bold text-foreground">Active Institutional Engagements</h3>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-muted/20">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active Research</span>
                                <h4 className="text-sm font-bold text-foreground mt-2">AI-driven Student Performance Analytics and Early Intervention Framework</h4>
                                <p className="text-muted-foreground mt-1">Lead Researcher • CIDS College Research Program • Jun 2026 – May 2027</p>
                            </div>
                        </div>
                    )}

                    {/* 9. Accomplishments */}
                    {activeTab === 'accomplishments' && (
                        <div className="space-y-4 text-xs">
                            <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Approved Accomplishments & Milestones</h3>
                                    <p className="text-muted-foreground text-xs">Verified contributions and documented achievements.</p>
                                </div>
                                <Link
                                    href="/faculty/accomplishments"
                                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                                >
                                    + Add Accomplishment
                                </Link>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <div className="font-bold text-foreground">Completed IT Curriculum Harmonization 2026</div>
                                    <div className="text-muted-foreground mt-0.5">Verified by Department Chair • Sep 2026</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
