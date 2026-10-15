import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, Link, router } from '@inertiajs/react';
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
    ExternalLink,
    Printer,
    Edit3,
    ArrowUpRight,
    MapPin,
    Award,
    Sparkles,
    Send,
    UploadCloud,
    X,
    Info,
    ChevronRight,
    Quote,
} from 'lucide-react';

interface Props {
    faculty: any;
    submissions: Array<any>;
    attendances: Array<any>;
    corrections: Array<any>;
    accomplishments: Array<any>;
    schedules?: Array<any>;
    loading_courses?: Array<any>;
    attendance_summary?: any;
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
    schedules = [],
    loading_courses = [],
    attendance_summary = null,
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
    const [requestModal, setRequestModal] = useState<{
        open: boolean;
        title: string;
        subject: string;
        type: 'attendance' | 'schedule' | 'workload' | 'profile' | 'other';
    }>({
        open: false,
        title: '',
        subject: '',
        type: 'profile',
    });

    const [requestExplanation, setRequestExplanation] = useState('');
    const [requestAttachment, setRequestAttachment] = useState<File | null>(null);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const openAction = (title: string, subject = '', type: 'attendance' | 'schedule' | 'workload' | 'profile' | 'other' = 'profile') => {
        setRequestModal({
            open: true,
            title,
            subject,
            type,
        });
        setRequestExplanation('');
        setRequestAttachment(null);
    };

    const handleSubmitCorrection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestModal.subject.trim() || !requestExplanation.trim()) {
            alert('Please provide a subject and explanation for your request.');
            return;
        }

        setIsSubmittingRequest(true);
        const formData = new FormData();
        formData.append('type', requestModal.type);
        formData.append('title', requestModal.subject);
        formData.append('explanation', requestExplanation);
        if (requestAttachment) {
            formData.append('attachment', requestAttachment);
        }

        router.post('/faculty/corrections', formData as any, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmittingRequest(false);
                setRequestModal({ open: false, title: '', subject: '', type: 'profile' });
                showToast('Request submitted to Dean / Academic Admin for review.');
            },
            onError: () => {
                setIsSubmittingRequest(false);
                showToast('Failed to submit request. Please try again.');
            },
        });
    };

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        email: faculty?.email || '',
        phone: faculty?.phone || '',
        office_room: faculty?.office_room || '',
        specialization: faculty?.specialization || '',
        highest_qualification: faculty?.highest_qualification || '',
        bio: faculty?.bio || '',
        quote: faculty?.quote || '',
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
        { id: 'personal', label: 'Personal Information', icon: User, subtitle: 'Manage your contact information and review verified personal records.' },
        { id: 'employment', label: 'Employment Details', icon: Briefcase, subtitle: 'Appointment information, employment history, and approved institutional designations.' },
        { id: 'education', label: 'Education & Qualifications', icon: GraduationCap, subtitle: 'Academic credentials, professional licenses, certificates, and qualifications.' },
        { id: 'teaching', label: 'Teaching Profile', icon: BookOpen, subtitle: 'Subject specializations, eligible courses, and current teaching assignments.' },
        { id: 'loading', label: 'Faculty Loading', icon: Clock, subtitle: 'Teaching and non-teaching workload credits for the selected academic period.' },
        { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, subtitle: 'Verified teaching-session attendance with a formal correction workflow.' },
        { id: 'compliance', label: 'Compliance', icon: CheckCircle2, subtitle: 'Your documentary requirements and official submission decisions.' },
        { id: 'research', label: 'Research & Extension', icon: FlaskConical, subtitle: 'Approved research and extension engagements, milestones, and contributions.' },
        { id: 'accomplishments', label: 'Accomplishments', icon: Trophy, subtitle: 'Verified awards, completed outputs, and documented professional contributions.' },
    ];

    const currentTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];

    // Calculated KPI metrics
    const totalTeachingUnits = loading_courses?.reduce((acc: number, c: any) => acc + (c.units || 3), 0) || 15;
    const totalCreditedLoad = totalTeachingUnits + 3; // +3 for academic coordination/duties
    const eligibleSessionsCount = attendances?.length || 14;
    const presentSessionsCount = attendances?.filter((a: any) => a.status === 'present').length || (attendances?.length ? attendances.length - 1 : 13);
    const attendancePercentage = attendance_summary?.attendance_rate ?? (eligibleSessionsCount > 0 ? Math.round((presentSessionsCount / eligibleSessionsCount) * 100) : 92.9);
    const acceptedSubmissionsCount = submissions?.filter((s: any) => s.status === 'approved' || s.status === 'accepted').length || 9;
    const totalSubmissionsApplicable = submissions?.length || 12;
    const complianceRate = totalSubmissionsApplicable > 0 ? Math.round((acceptedSubmissionsCount / totalSubmissionsApplicable) * 100) : 75;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Faculty Dossier - ${faculty?.full_name || 'My Profile'}`} />

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    .no-print, header, nav, aside, [data-sidebar="sidebar"] {
                        display: none !important;
                    }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-only-sheet {
                        display: block !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 10mm 14mm !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm !important;
                    }
                }
            `}</style>

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-amber-400 border border-amber-400/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* 1. TOP BANNER: FACULTY IDENTITY & PERIOD */}
                <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5 min-w-0">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 text-slate-900 border-4 border-amber-100 dark:border-amber-950/40 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm overflow-hidden">
                                {faculty?.photo_url ? (
                                    <img src={faculty.photo_url} alt={faculty.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{faculty?.first_name ? `${faculty.first_name[0]}${faculty.last_name[0]}` : 'KA'}</span>
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold">
                                    <Camera className="w-5 h-5 mb-0.5" />
                                    <span>Upload</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setData('profile_picture', e.target.files?.[0] || null)}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Identity Info */}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                                    {faculty?.title_name || (faculty ? `Instr. ${faculty.first_name} ${faculty.last_name}` : 'Instr. Kaye Antoinette Panaligan')}
                                </h1>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                                    {faculty?.academic_rank || 'Instructor I'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-medium">
                                <span className="font-bold text-foreground">
                                    {faculty?.employee_id || 'CIDS-2026-012'}
                                </span>
                                <span>•</span>
                                <span>{faculty?.program?.name || 'BS Information Systems'}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Faculty
                                </span>
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-1">
                                College of Information and Digital Sciences · Faculty Dossier & Institutional Workspace
                            </p>

                            {(faculty?.quote || data.quote) && (
                                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-950 dark:text-amber-200 text-xs italic">
                                    <Quote className="w-3 h-3 text-amber-500 shrink-0 not-italic rotate-180" />
                                    <span className="line-clamp-1">"{faculty?.quote || data.quote}"</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banner Right Controls */}
                    <div className="no-print flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                        <div className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-xs">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                Academic Period
                            </span>
                            <span className="font-bold text-foreground block">
                                AY 2026–2027 · 1st Semester
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Dossier</span>
                        </button>

                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openAction('Request Profile Update', 'Profile & Contact Update', 'profile')}
                                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                            >
                                <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Request Update</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. STATS ROW: 4 VERIFIED KPI METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Credited Load */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-400/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Total Credited Load
                            </span>
                            <div className="text-2xl font-black text-foreground tracking-tight leading-none mt-0.5">
                                {totalCreditedLoad} <span className="text-xs font-bold text-muted-foreground">units</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-1">
                                {totalTeachingUnits} teaching · 3 credited duties
                            </span>
                        </div>
                    </div>

                    {/* Stat 2: Teaching Attendance */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Teaching Attendance
                            </span>
                            <div className="text-2xl font-black text-foreground tracking-tight leading-none mt-0.5">
                                {attendancePercentage}%
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-1">
                                {presentSessionsCount} of {eligibleSessionsCount} eligible sessions
                            </span>
                        </div>
                    </div>

                    {/* Stat 3: Submission Compliance */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Submission Compliance
                            </span>
                            <div className="text-2xl font-black text-foreground tracking-tight leading-none mt-0.5">
                                {complianceRate}%
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-1">
                                {acceptedSubmissionsCount} of {totalSubmissionsApplicable} requirements accepted
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Research & Extension */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Research & Extension
                            </span>
                            <div className="text-2xl font-black text-foreground tracking-tight leading-none mt-0.5">
                                3
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-1">
                                Current verified engagements
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. VERIFIED NOTICE CALLOUT */}
                <div className="p-3.5 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                        <strong>Official Faculty Dossier:</strong> Institutional records are maintained in compliance with CIDS Academic Regulations. Personal contact details can be edited directly; academic rank, appointment, and loading changes require verification.
                    </span>
                </div>

                {/* 4. WORKSPACE: LEFT VERTICAL SUBNAV + RIGHT SECTION CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT SUBNAV (Sticky desktop, horizontal scroll on mobile) */}
                    <nav className="no-print lg:col-span-3 bg-card border border-border rounded-2xl p-3 shadow-2xs lg:sticky lg:top-6 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Profile Sections
                        </div>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            );
                        })}

                        <div className="mt-4 pt-3 border-t border-border/60 p-2.5 bg-muted/20 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                            Formal records are read-only. Faculty can request changes, submit evidence, and download authorized personal reports.
                        </div>
                    </nav>

                    {/* RIGHT CONTENT WORKSPACE */}
                    <div className="lg:col-span-9 space-y-5">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-2xs">
                            <div>
                                <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                                    <currentTabMeta.icon className="w-5 h-5 text-amber-500" />
                                    <span>{currentTabMeta.label}</span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {currentTabMeta.subtitle}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print</span>
                                </button>

                                {activeTab === 'personal' && !isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Edit Details</span>
                                    </button>
                                )}

                                {activeTab !== 'personal' && (
                                    <button
                                        type="button"
                                        onClick={() => openAction(
                                            activeTab === 'attendance' ? 'Request Attendance Correction' :
                                            activeTab === 'compliance' ? 'Submit Compliance Document' :
                                            activeTab === 'loading' ? 'Request Load Review' :
                                            activeTab === 'education' ? 'Submit New Credential' :
                                            activeTab === 'research' ? 'Submit Research Evidence' :
                                            activeTab === 'accomplishments' ? 'Record Accomplishment' :
                                            'Request Section Update',
                                            `${currentTabMeta.label} Update`,
                                            activeTab === 'attendance' ? 'attendance' : activeTab === 'loading' ? 'workload' : 'other'
                                        )}
                                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Action</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TAB 1: PERSONAL INFORMATION */}
                        {activeTab === 'personal' && (
                            <div className="space-y-4">
                                {isEditing ? (
                                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xs">
                                        <form onSubmit={handleSave} className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1">Official Email</label>
                                                    <input
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
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
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1">Office Room Assignment</label>
                                                    <input
                                                        type="text"
                                                        value={data.office_room}
                                                        onChange={(e) => setData('office_room', e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="text-xs font-bold text-foreground block mb-1">Area of Specialization</label>
                                                    <input
                                                        type="text"
                                                        value={data.specialization}
                                                        onChange={(e) => setData('specialization', e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="text-xs font-bold text-foreground block mb-1">
                                                        Professional Bio / Statement
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={data.bio}
                                                        onChange={(e) => setData('bio', e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-amber-400 leading-relaxed"
                                                        placeholder="Write a brief professional bio about your academic focus, teaching philosophy, or background..."
                                                    />
                                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                                        Displayed on your faculty dossier and personal profile showcase.
                                                    </span>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="text-xs font-bold text-foreground block mb-1">
                                                        Personal Motto / Inspirational Quote
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={data.quote}
                                                            onChange={(e) => setData('quote', e.target.value)}
                                                            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400 italic"
                                                            placeholder="e.g. Inspiring innovation through practical knowledge."
                                                        />
                                                        <Quote className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 not-italic rotate-180" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-border">
                                                <h4 className="text-xs font-black text-foreground uppercase tracking-wider mb-3">Change Account Password (Optional)</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-muted-foreground block mb-1">New Password</label>
                                                        <input
                                                            type="password"
                                                            value={data.password}
                                                            onChange={(e) => setData('password', e.target.value)}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
                                                            placeholder="Leave blank to keep current"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-muted-foreground block mb-1">Confirm New Password</label>
                                                        <input
                                                            type="password"
                                                            value={data.password_confirmation}
                                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:border-amber-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-3">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                                                >
                                                    <Save className="w-4 h-4 stroke-[2.5]" />
                                                    <span>Save Changes</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                        {/* Left 8-col: Personal & Contact Information */}
                                        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                                    <User className="w-4 h-4 text-amber-500" />
                                                    <span>Personal & Contact Information</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                >
                                                    Edit Details →
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Full Legal Name</span>
                                                    <span className="font-bold text-foreground text-sm">{faculty?.full_name || 'Kaye Antoinette Panaligan'}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Institutional Employee ID</span>
                                                    <span className="font-mono font-bold text-foreground text-sm">{faculty?.employee_id || 'CIDS-2026-012'}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Official Email</span>
                                                    <span className="font-bold text-foreground">{faculty?.email || 'k.panaligan@dssc.edu.ph'}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Contact Number</span>
                                                    <span className="font-bold text-foreground">{faculty?.phone || '+63 917 888 1234'}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60 sm:col-span-2">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Home Program</span>
                                                    <span className="font-bold text-foreground">{faculty?.program?.name || 'Bachelor of Science in Information Systems'}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60 sm:col-span-2">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Primary Specialization</span>
                                                    <span className="font-bold text-foreground">{faculty?.specialization || 'Full Stack & Mobile App Development'}</span>
                                                </div>
                                            </div>

                                            {/* Faculty Bio & Quote Showcase Card */}
                                            <div className="pt-2 border-t border-border/60 space-y-3">
                                                <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
                                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                            <span>Faculty Bio & Showcase</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditing(true)}
                                                            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                                        >
                                                            Edit Bio
                                                        </button>
                                                    </div>

                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        {faculty?.bio || data.bio || (
                                                            <span className="text-muted-foreground italic">
                                                                No professional bio added yet. Click "Edit Bio" to describe your academic journey, teaching philosophy, or focus areas.
                                                            </span>
                                                        )}
                                                    </p>

                                                    {(faculty?.quote || data.quote) ? (
                                                        <div className="pt-2 border-t border-amber-400/20 flex items-start gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 italic">
                                                            <Quote className="w-3.5 h-3.5 text-amber-500 shrink-0 not-italic rotate-180 mt-0.5" />
                                                            <span>"{faculty?.quote || data.quote}"</span>
                                                        </div>
                                                    ) : (
                                                        <div className="pt-2 border-t border-amber-400/20 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                            <Quote className="w-3 h-3 text-amber-500/60 rotate-180" />
                                                            <span>Click "Edit Bio" to add your favorite motto or quote.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right 4-col: Data Access & Privacy */}
                                        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                            <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <span>Data Access</span>
                                            </div>

                                            <div className="space-y-3 text-xs">
                                                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                                    <div>
                                                        <div className="font-bold text-foreground">Contact information</div>
                                                        <div className="text-[10px] text-muted-foreground">Editable subject to verification</div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300">
                                                        Self-Editable
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                                    <div>
                                                        <div className="font-bold text-foreground">Institutional details</div>
                                                        <div className="text-[10px] text-muted-foreground">Maintained by authorized personnel</div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                                                        Read Only
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-foreground">Profile visibility</div>
                                                        <div className="text-[10px] text-muted-foreground">Restricted to authorized accounts</div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                        Protected
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom 12-col: Professional Links & Identifiers */}
                                        <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                            <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                <span>Professional Links & Identifiers</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">ORCID iD</span>
                                                    <span className="font-bold text-foreground">0000-0002-1825-009X</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Google Scholar</span>
                                                    <span className="font-bold text-foreground">Kaye Panaligan, MSIT</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Portfolio / Website</span>
                                                    <span className="font-bold text-foreground">github.com/kpanaligan</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                                    <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Office Assignment</span>
                                                    <span className="font-bold text-foreground">{faculty?.office_room || 'Room 303, CIDS Building'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: EMPLOYMENT DETAILS */}
                        {activeTab === 'employment' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Briefcase className="w-4 h-4 text-amber-500" />
                                        <span>Official Appointment</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Employment Status</span>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                ● Active
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Employment Classification</span>
                                            <span className="font-bold text-foreground text-sm">{faculty?.employment_type || 'Full-Time Regular'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Academic Rank</span>
                                            <span className="font-bold text-foreground text-sm">{faculty?.academic_rank || 'Instructor I'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Home Program</span>
                                            <span className="font-bold text-foreground text-sm">{faculty?.program?.name || 'BS Information Systems'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Date Appointed</span>
                                            <span className="font-bold text-foreground text-sm">{faculty?.employment_date || 'August 15, 2023'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Administrative Supervisor</span>
                                            <span className="font-bold text-foreground text-sm">Program Head / College Dean</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Workload Entitlement</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-foreground">18</div>
                                            <span className="text-[10px] text-muted-foreground">Target units</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-foreground">15</div>
                                            <span className="text-[10px] text-muted-foreground">Teaching</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-foreground">3</div>
                                            <span className="text-[10px] text-muted-foreground">Credited duties</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs">
                                        Credited workload is calculated from approved institutional policies and applies only to the correct academic period.
                                    </div>
                                </div>

                                <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        <span>Employment & Designation History</span>
                                    </div>

                                    <div className="relative pl-4 border-l-2 border-border space-y-4 text-xs ml-2">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-card" />
                                            <div className="font-bold text-foreground">Current Appointment</div>
                                            <div className="text-[11px] text-muted-foreground">Instructor I · BSIS · Active</div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-card" />
                                            <div className="font-bold text-foreground">Approved Designation</div>
                                            <div className="text-[11px] text-muted-foreground">Academic & Curriculum Coordinator · 3 credited units</div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-card" />
                                            <div className="font-bold text-foreground">Initial Appointment</div>
                                            <div className="text-[11px] text-muted-foreground">College of Information and Digital Sciences</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <FileText className="w-4 h-4 text-emerald-500" />
                                        <span>Supporting Employment Records</span>
                                    </div>

                                    <div className="divide-y divide-border text-xs">
                                        <div className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">Appointment Document</div>
                                                <div className="text-[10px] text-muted-foreground">Verified Board Resolution</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">On File</span>
                                        </div>
                                        <div className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">Designation Approval</div>
                                                <div className="text-[10px] text-muted-foreground">Special Order for Academic Coordination</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">Verified</span>
                                        </div>
                                        <div className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">Employment Changes</div>
                                                <div className="text-[10px] text-muted-foreground">No pending promotions or reassignments</div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-semibold">None Pending</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: EDUCATION & QUALIFICATIONS */}
                        {activeTab === 'education' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <GraduationCap className="w-4 h-4 text-amber-500" />
                                        <span>Academic Degrees</span>
                                    </div>

                                    <div className="relative pl-4 border-l-2 border-border space-y-5 text-xs ml-2">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-card" />
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-foreground text-sm">Master in Information Technology</div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">In Progress</span>
                                            </div>
                                            <div className="text-muted-foreground mt-0.5">Specialization: Advanced Data Systems & Cloud Computing</div>
                                            <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Enrolled with Institution Study Permit</div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-card" />
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-foreground text-sm">Bachelor of Science in Information Technology</div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Graduated</span>
                                            </div>
                                            <div className="text-muted-foreground mt-0.5">Davao del Sur State College · Cum Laude</div>
                                            <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Verified by Registrar & Dean's Office</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                                        <span>Credential Verification</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-foreground">2</div>
                                            <span className="text-[10px] text-muted-foreground">Degree entries</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-foreground">3</div>
                                            <span className="text-[10px] text-muted-foreground">Certifications</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/10">
                                            <div className="text-xl font-black text-emerald-600">All</div>
                                            <span className="text-[10px] text-muted-foreground">Verified</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs">
                                        Only approved qualifications should be used by the faculty loading engine to establish subject eligibility.
                                    </div>
                                </div>

                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Award className="w-4 h-4 text-purple-500" />
                                        <span>Certificates & Professional Qualifications</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Qualification / Certification</th>
                                                    <th className="py-2.5 px-3">Issuing Organization</th>
                                                    <th className="py-2.5 px-3">Date Earned</th>
                                                    <th className="py-2.5 px-3">Verification Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                <tr>
                                                    <td className="py-3 px-3 font-bold text-foreground">AWS Certified Cloud Practitioner</td>
                                                    <td className="py-3 px-3 text-muted-foreground">Amazon Web Services (AWS)</td>
                                                    <td className="py-3 px-3 font-mono">2026</td>
                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 px-3 font-bold text-foreground">Higher Education Pedagogy & Teaching Certificate</td>
                                                    <td className="py-3 px-3 text-muted-foreground">CHED / Institutional Training</td>
                                                    <td className="py-3 px-3 font-mono">2025</td>
                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 px-3 font-bold text-foreground">Oracle Database Certified Associate (OCA)</td>
                                                    <td className="py-3 px-3 text-muted-foreground">Oracle University</td>
                                                    <td className="py-3 px-3 font-mono">2024</td>
                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: TEACHING PROFILE */}
                        {activeTab === 'teaching' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
                                        <span>Teaching Areas & Competencies</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 text-xs font-bold">
                                            Artificial Intelligence
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 text-xs font-bold">
                                            Machine Learning
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold">
                                            Web Systems & Technologies
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold">
                                            Data Analytics Programming
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold">
                                            Enterprise Systems Architecture
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold">
                                            Object-Oriented Programming
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pt-2">
                                        Specializations may be self-declared, but course eligibility is approved through Faculty Management.
                                    </p>
                                </div>

                                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <GraduationCap className="w-4 h-4 text-blue-500" />
                                        <span>Course Preferences</span>
                                    </div>
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Preferred Subjects</div>
                                                <div className="text-[10px] text-muted-foreground">Used during faculty loading</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300">
                                                3 recorded
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Approved Eligibility</div>
                                                <div className="text-[10px] text-muted-foreground">Verified by academic administrators</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                4 course groups
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">Cross-Program Teaching</div>
                                                <div className="text-[10px] text-muted-foreground">Subject to scheduling rules</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                                Permitted
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Calendar className="w-4 h-4 text-purple-500" />
                                        <span>Current Teaching Assignments</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Course / Subject</th>
                                                    <th className="py-2.5 px-3">Program & Section</th>
                                                    <th className="py-2.5 px-3">Lecture / Lab</th>
                                                    <th className="py-2.5 px-3">Units</th>
                                                    <th className="py-2.5 px-3">Assigned Schedule</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {schedules?.length > 0 ? (
                                                    schedules.map((sc: any) => (
                                                        <tr key={sc.id}>
                                                            <td className="py-3 px-3 font-bold text-foreground">
                                                                {sc.course_code} · {sc.course_title || 'Professional Course'}
                                                            </td>
                                                            <td className="py-3 px-3">{sc.section || 'Section A'}</td>
                                                            <td className="py-3 px-3">{sc.component_type || 'Lecture + Lab'}</td>
                                                            <td className="py-3 px-3 font-mono font-bold">3</td>
                                                            <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                                                                {sc.day_of_week} {sc.start_time ? `${sc.start_time} - ${sc.end_time}` : ''} ({sc.room_name || 'Room 303'})
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">ITEL 601 · Artificial Intelligence</td>
                                                            <td className="py-3 px-3">DIT 3B</td>
                                                            <td className="py-3 px-3">Lab</td>
                                                            <td className="py-3 px-3 font-mono font-bold">3</td>
                                                            <td className="py-3 px-3">Mon / Wed 7:30–9:00 AM (Comp Lab 1)</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">ISEL 601 · Data Analytics Programming</td>
                                                            <td className="py-3 px-3">BSIS 3A</td>
                                                            <td className="py-3 px-3">Lecture + Lab</td>
                                                            <td className="py-3 px-3 font-mono font-bold">3</td>
                                                            <td className="py-3 px-3">Tue / Thu 10:30–12:00 PM (Room 302)</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">ISEL 602 · Enterprise Systems</td>
                                                            <td className="py-3 px-3">BSIS 3B</td>
                                                            <td className="py-3 px-3">Lecture + Lab</td>
                                                            <td className="py-3 px-3 font-mono font-bold">3</td>
                                                            <td className="py-3 px-3">Mon / Wed 1:00–2:30 PM (Room 303)</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">HCI · Human-Computer Interaction</td>
                                                            <td className="py-3 px-3">BSIT 2A</td>
                                                            <td className="py-3 px-3">Lecture</td>
                                                            <td className="py-3 px-3 font-mono font-bold">3</td>
                                                            <td className="py-3 px-3">Tue / Fri 3:00–4:30 PM (Room 201)</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: FACULTY LOADING */}
                        {activeTab === 'loading' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        <span>Current Semester Load</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">18</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Total target units</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">{totalTeachingUnits}</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Assigned teaching units</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">3</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Approved non-teaching</span>
                                        </div>
                                    </div>

                                    <div className="w-full bg-muted/30 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full w-full" />
                                    </div>

                                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                                        {totalTeachingUnits} teaching + 3 credited duties = 18 total units. Workload policy version is retained with the approved loading.
                                    </div>
                                </div>

                                <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span>Loading Status</span>
                                    </div>

                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        Balanced
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Target fulfilled, officially certified for 1st Semester.
                                    </div>

                                    <div className="pt-2 border-t border-border space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Load Policy</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">No. of Preparations</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">4 unique</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                        <span>Teaching Load Breakdown</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Course / Section</th>
                                                    <th className="py-2.5 px-3 text-center">Lecture Units</th>
                                                    <th className="py-2.5 px-3 text-center">Lab Units</th>
                                                    <th className="py-2.5 px-3 text-center">Credited Units</th>
                                                    <th className="py-2.5 px-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {loading_courses?.length > 0 ? (
                                                    loading_courses.map((c: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="py-3 px-3 font-bold text-foreground">
                                                                {c.course_code} · {c.course_title} ({c.section})
                                                            </td>
                                                            <td className="py-3 px-3 text-center font-mono">2</td>
                                                            <td className="py-3 px-3 text-center font-mono">1</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold">{c.units || 3}</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Artificial Intelligence · DIT 3B</td>
                                                            <td className="py-3 px-3 text-center font-mono">1</td>
                                                            <td className="py-3 px-3 text-center font-mono">2</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold">3</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Data Analytics Programming · BSIS 3A</td>
                                                            <td className="py-3 px-3 text-center font-mono">1</td>
                                                            <td className="py-3 px-3 text-center font-mono">2</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold">3</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Enterprise Systems · BSIS 3B</td>
                                                            <td className="py-3 px-3 text-center font-mono">1</td>
                                                            <td className="py-3 px-3 text-center font-mono">2</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold">3</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">HCI · BSIT 2A</td>
                                                            <td className="py-3 px-3 text-center font-mono">3</td>
                                                            <td className="py-3 px-3 text-center font-mono">0</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold">3</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Approved</span>
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Briefcase className="w-4 h-4 text-purple-500" />
                                        <span>Non-Teaching Credits</span>
                                    </div>

                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Designation Credit</div>
                                                <div className="text-[10px] text-muted-foreground">Academic coordination</div>
                                            </div>
                                            <span className="font-bold text-foreground">3 units</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Research / Extension Credit</div>
                                                <div className="text-[10px] text-muted-foreground">Approved college assignment</div>
                                            </div>
                                            <span className="font-bold text-foreground">1 unit</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="font-bold text-foreground">Total Non-Teaching Credits</div>
                                            <span className="font-black text-sm text-foreground">4 units</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs mt-3">
                                        Faculty can request a review but cannot directly alter approved loading.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: ATTENDANCE */}
                        {activeTab === 'attendance' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        <span>Attendance at a Glance</span>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-foreground">{eligibleSessionsCount}</div>
                                            <span className="text-[10px] text-muted-foreground">Eligible sessions</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-emerald-600">{presentSessionsCount}</div>
                                            <span className="text-[10px] text-muted-foreground">Present</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-amber-600">1</div>
                                            <span className="text-[10px] text-muted-foreground">Late</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-rose-600">0</div>
                                            <span className="text-[10px] text-muted-foreground">Absent</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-foreground">15m</div>
                                            <span className="text-[10px] text-muted-foreground">Late minutes</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border bg-muted/15">
                                            <div className="text-xl font-black text-foreground">{attendancePercentage}%</div>
                                            <span className="text-[10px] text-muted-foreground">Rate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span>Session Attendance</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-base font-black text-foreground">{attendancePercentage}%</span>
                                            <span className="text-[9px] text-muted-foreground">Attended</span>
                                        </div>
                                        <div className="space-y-1 text-xs w-full">
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>On Time</span>
                                                <span className="font-bold text-foreground">{presentSessionsCount} sessions</span>
                                            </div>
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>Late</span>
                                                <span className="font-bold text-foreground">1 session</span>
                                            </div>
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>Absent</span>
                                                <span className="font-bold text-foreground">0 sessions</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center justify-between pb-2 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <span>Weekly Teaching Attendance</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openAction('Request Attendance Correction', 'Session Attendance Discrepancy', 'attendance')}
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            Request Correction →
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Date</th>
                                                    <th className="py-2.5 px-3">Course & Section</th>
                                                    <th className="py-2.5 px-3">Scheduled Time</th>
                                                    <th className="py-2.5 px-3">Recorded Status</th>
                                                    <th className="py-2.5 px-3">Late Mins</th>
                                                    <th className="py-2.5 px-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {attendances?.length > 0 ? (
                                                    attendances.map((att: any) => (
                                                        <tr key={att.id}>
                                                            <td className="py-3 px-3 font-semibold text-foreground font-mono">{att.session_date}</td>
                                                            <td className="py-3 px-3 font-bold text-foreground">{att.course_code || 'IT-301'} ({att.section || 'BSIS 3A'})</td>
                                                            <td className="py-3 px-3">{att.time_slot}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    att.status === 'present' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                                                    att.status === 'late' ? 'bg-amber-400/15 text-amber-900 dark:text-amber-300' :
                                                                    'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                                                }`}>
                                                                    {att.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 font-mono">{att.late_minutes || 0}m</td>
                                                            <td className="py-3 px-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openAction('Request Attendance Correction', `${att.session_date} - ${att.course_code || 'Session'}`, 'attendance')}
                                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                                >
                                                                    Request correction
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-6 text-center text-muted-foreground italic">
                                                            No recent attendance discrepancies recorded for current cycle.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: COMPLIANCE */}
                        {activeTab === 'compliance' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span>Submission Performance</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-base font-black text-foreground">{complianceRate}%</span>
                                            <span className="text-[9px] text-muted-foreground">Accepted</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center w-full">
                                            <div className="p-2.5 rounded-xl border border-border bg-muted/15">
                                                <div className="text-lg font-black text-foreground">{totalSubmissionsApplicable}</div>
                                                <span className="text-[9px] text-muted-foreground">Applicable</span>
                                            </div>
                                            <div className="p-2.5 rounded-xl border border-border bg-muted/15">
                                                <div className="text-lg font-black text-emerald-600">{acceptedSubmissionsCount}</div>
                                                <span className="text-[9px] text-muted-foreground">Accepted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <span>Needs Attention</span>
                                    </div>

                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Table of Specifications (TOS) & Test Questionnaire</div>
                                                <div className="text-[10px] text-muted-foreground">Midterm deadline approaching</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300">
                                                Due Soon
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Course Syllabus (Advanced Systems)</div>
                                                <div className="text-[10px] text-muted-foreground">Awaiting Dean review comments</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                                Under Review
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-foreground">Faculty Workload Confirmation Form</div>
                                                <div className="text-[10px] text-muted-foreground">Submitted on time</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                Complied
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center justify-between pb-2 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-purple-500" />
                                            <span>Requirement & Submission Records</span>
                                        </div>
                                        <Link
                                            href="/faculty/requirements"
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            Go to Requirements Hub →
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Requirement</th>
                                                    <th className="py-2.5 px-3">Period / Frequency</th>
                                                    <th className="py-2.5 px-3">Submitted</th>
                                                    <th className="py-2.5 px-3">Review Decision</th>
                                                    <th className="py-2.5 px-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {submissions?.length > 0 ? (
                                                    submissions.map((sub: any) => (
                                                        <tr key={sub.id}>
                                                            <td className="py-3 px-3 font-bold text-foreground">{sub.requirement?.title || 'Requirement File'}</td>
                                                            <td className="py-3 px-3 text-muted-foreground">{sub.requirement?.frequency || 'Per Semester'}</td>
                                                            <td className="py-3 px-3 font-mono">{sub.submitted_at || 'On File'}</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                                    {sub.status || 'Accepted'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <Link href="/faculty/requirements" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                                                    View
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Table of Specifications (TOS)</td>
                                                            <td className="py-3 px-3 text-muted-foreground">Midterm Exam</td>
                                                            <td className="py-3 px-3 font-mono">Oct 14, 2026</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300">Pending</span>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <Link href="/faculty/requirements" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Submit</Link>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Course Syllabus</td>
                                                            <td className="py-3 px-3 text-muted-foreground">Per Course</td>
                                                            <td className="py-3 px-3 font-mono">Aug 28, 2026</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Accepted</span>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <Link href="/faculty/requirements" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View</Link>
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 8: RESEARCH & EXTENSION */}
                        {activeTab === 'research' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <FlaskConical className="w-4 h-4 text-purple-500" />
                                        <span>Research & Extension Participation</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">2</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Research assignments</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">1</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Extension engagement</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-emerald-600">3</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Verified roles</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs">
                                        Research and extension expectations should reflect approved appointments and workload credits; participation alone does not establish individual performance.
                                    </div>
                                </div>

                                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <FlaskConical className="w-4 h-4 text-blue-500" />
                                        <span>Active Research Projects</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-2">
                                            <div className="font-bold text-xs text-foreground">Explainable Welfare Analytics</div>
                                            <div className="text-[11px] text-muted-foreground">Faculty researcher · Research milestone tracking</div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">In Progress</span>
                                                <button
                                                    type="button"
                                                    onClick={() => openAction('Submit Research Milestone', 'Explainable Welfare Analytics Evidence', 'other')}
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Add evidence →
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-2">
                                            <div className="font-bold text-xs text-foreground">Applied AI Research Initiative</div>
                                            <div className="text-[11px] text-muted-foreground">Collaborating faculty · Approved scope</div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Active</span>
                                                <button
                                                    type="button"
                                                    onClick={() => openAction('Submit Research Evidence', 'Applied AI Initiative Milestone', 'other')}
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Add evidence →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Building2 className="w-4 h-4 text-emerald-500" />
                                        <span>Extension Involvement</span>
                                    </div>

                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <div>
                                                <div className="font-bold text-foreground">Community Digital Literacy</div>
                                                <div className="text-[10px] text-muted-foreground">Training / outreach activity</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                            <span className="text-muted-foreground">Recorded Role</span>
                                            <span className="font-bold text-foreground">Facilitator / Resource Person</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Required Evidence</span>
                                            <span className="font-bold text-foreground">Attendance, certificates, photos</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openAction('Submit Extension Evidence', 'Community Digital Literacy Proof', 'other')}
                                        className="w-full mt-2 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                                    >
                                        Submit Evidence
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 9: ACCOMPLISHMENTS */}
                        {activeTab === 'accomplishments' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        <span>Accomplishment Summary</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">{accomplishments?.length || 5}</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Verified accomplishments</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-amber-600">1</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Under review</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/15">
                                            <div className="text-2xl font-black text-foreground">3</div>
                                            <span className="text-[10px] font-semibold text-muted-foreground">Categories</span>
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                                        Scope: AY 2026–2027 · 1st Semester. Official accomplishments are sourced from verified submissions, institutional projects, seminars, and certified outputs.
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                        <Printer className="w-4 h-4 text-blue-500" />
                                        <span>Printable Statement</span>
                                    </div>

                                    <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-400/5 text-amber-900 dark:text-amber-200 text-xs">
                                        Generate an individual accomplishment report with configurable sections and authorized signatories. Only verified outputs are marked official.
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print Current Statement</span>
                                    </button>
                                </div>

                                <div className="lg:col-span-12 bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                                    <div className="font-bold text-sm text-foreground flex items-center justify-between pb-2 border-b border-border">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-purple-500" />
                                            <span>Documented Accomplishments</span>
                                        </div>
                                        <Link
                                            href="/faculty/accomplishments"
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            + Add New Accomplishment
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-black">
                                                    <th className="py-2.5 px-3">Accomplishment Title</th>
                                                    <th className="py-2.5 px-3">Category</th>
                                                    <th className="py-2.5 px-3">Date Achieved</th>
                                                    <th className="py-2.5 px-3">Evidence</th>
                                                    <th className="py-2.5 px-3">Validation Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {accomplishments?.length > 0 ? (
                                                    accomplishments.map((acc: any) => (
                                                        <tr key={acc.id}>
                                                            <td className="py-3 px-3 font-bold text-foreground">{acc.title}</td>
                                                            <td className="py-3 px-3 capitalize">{acc.category}</td>
                                                            <td className="py-3 px-3 font-mono">{acc.date_achieved}</td>
                                                            <td className="py-3 px-3">{acc.proof_file_path ? 'File attached' : 'Certificate'}</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Data Analytics Faculty Training & Workshop</td>
                                                            <td className="py-3 px-3">Professional Development</td>
                                                            <td className="py-3 px-3 font-mono">Oct 12, 2026</td>
                                                            <td className="py-3 px-3">Certificate</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Digital Literacy Outreach Facilitator</td>
                                                            <td className="py-3 px-3">Community Extension</td>
                                                            <td className="py-3 px-3 font-mono">Oct 10, 2026</td>
                                                            <td className="py-3 px-3">Activity Report</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-bold text-foreground">Midterm Instructional Learning Material Harmonization</td>
                                                            <td className="py-3 px-3">Teaching Output</td>
                                                            <td className="py-3 px-3 font-mono">Oct 9, 2026</td>
                                                            <td className="py-3 px-3">Submitted Materials</td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Verified</span>
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ACTION / REQUEST MODAL */}
            {requestModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div>
                                <h3 className="text-base font-black text-foreground tracking-tight">{requestModal.title}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Submit request to authorized Dean / OfficeHub administrator.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRequestModal({ ...requestModal, open: false })}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-foreground block mb-1">Subject / Affected Record</label>
                                <input
                                    type="text"
                                    value={requestModal.subject}
                                    onChange={(e) => setRequestModal({ ...requestModal, subject: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold focus:outline-none focus:border-amber-400"
                                    placeholder="e.g. Schedule discrepancy, course assignment, contact update"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Remarks & Supporting Explanation</label>
                                <textarea
                                    rows={3}
                                    value={requestExplanation}
                                    onChange={(e) => setRequestExplanation(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium focus:outline-none focus:border-amber-400"
                                    placeholder="Describe the requested correction and relevant details."
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Supporting Document / Evidence (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setRequestAttachment(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-border file:text-xs file:font-bold file:bg-muted/50 file:cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setRequestModal({ ...requestModal, open: false })}
                                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-bold text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingRequest}
                                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingRequest ? (
                                        <span>Submitting...</span>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Submit Request</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
