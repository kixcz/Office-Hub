import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Sparkles,
    ArrowLeft,
    Upload,
    Calendar,
    Trophy,
    Award,
    Cake,
    BookOpen,
    ShieldCheck,
    CheckCircle2,
    Eye,
    Save,
    Tv,
    LayoutTemplate,
    User,
    Check,
    HelpCircle,
    Info,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { SpotlightSlideHero, SpotlightSlideData } from '@/components/spotlight-slide-hero';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Recognition & Celebrations', href: '/tv-config/spotlight' },
    { title: 'Create Spotlight Slide', href: '/tv-config/spotlight/create' },
];

interface FacultyItem {
    id: number;
    name: string;
    title_name: string;
    academic_rank: string;
    program_name: string;
    program_code: string;
    photo_url?: string | null;
    birth_date?: string | null;
}

interface ProgramItem {
    id: number;
    name: string;
    code: string;
}

interface Props {
    faculties: FacultyItem[];
    programs: ProgramItem[];
    prefill: {
        type: string;
        faculty_id?: number | string | null;
        honoree_name: string;
        honoree_title: string;
        program_or_department: string;
        headline: string;
        message: string;
        event_title: string;
        awarding_organization: string;
        event_date: string;
        template: string;
        background_style: string;
        accent_style: string;
        headline_alignment: 'left' | 'center' | 'right';
        text_size: 'compact' | 'normal' | 'large';
        display_duration: number;
        transition: string;
        layout_mode: 'hero-split' | 'centered-portrait' | 'banner-card' | 'full-bleed';
        fullscreen_takeover: boolean;
        playlist: string;
        priority: number;
        start_at: string;
        end_at: string;
        status: string;
    };
}

const TEMPLATES = [
    { id: 'award', label: 'Award & Honors', icon: Trophy, desc: 'For prestigious awards, medals, and official recognitions' },
    { id: 'achievement', label: 'Faculty Achievement', icon: Award, desc: 'For notable career, professional, or academic milestones' },
    { id: 'birthday', label: 'Birthday Celebration', icon: Cake, desc: 'Festive greeting highlighting birthday with elegant styling' },
    { id: 'publication', label: 'Research Publication', icon: BookOpen, desc: 'Recognizing Scopus/WoS or high-impact journal papers' },
    { id: 'certification', label: 'Certification / Licensure', icon: ShieldCheck, desc: 'Celebrating new industry credentials & professional passes' },
    { id: 'promotion', label: 'Academic Promotion', icon: Sparkles, desc: 'Celebrating rank advances (e.g. Professor, Assoc. Prof)' },
    { id: 'research', label: 'Research Recognition', icon: Trophy, desc: 'Grants, best research paper, patents & symposium honors' },
    { id: 'extension', label: 'Extension Recognition', icon: Award, desc: 'Community impact, extension programs, and outreach honors' },
    { id: 'welcome', label: 'Welcome to CIDS', icon: User, desc: 'Warm introduction for newly onboarded faculty members' },
    { id: 'farewell', label: 'Gratitude & Farewell', icon: Award, desc: 'Honoring retiring or moving professors for dedicated service' },
    { id: 'custom', label: 'Custom Celebration', icon: Sparkles, desc: 'Fully customizable layout for bespoke department milestones' },
];

const BACKGROUND_STYLES = [
    { id: 'royal-gold', label: 'Royal Gold & Midnight', bg: 'bg-gradient-to-r from-amber-950 to-slate-900 border-amber-400' },
    { id: 'midnight-prestige', label: 'Midnight Prestige Blue', bg: 'bg-gradient-to-r from-slate-950 to-blue-950 border-indigo-400' },
    { id: 'velvet-maroon', label: 'Velvet Maroon & Gold', bg: 'bg-gradient-to-r from-rose-950 to-red-950 border-rose-400' },
    { id: 'emerald-excellence', label: 'Emerald Excellence', bg: 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-400' },
    { id: 'modern-cyber', label: 'Modern Cyber Cyan', bg: 'bg-gradient-to-r from-cyan-950 to-blue-900 border-cyan-400' },
    { id: 'celebration-spark', label: 'Celebration Spark & Magenta', bg: 'bg-gradient-to-r from-fuchsia-950 to-amber-950 border-fuchsia-400' },
    { id: 'vibrant-gradient', label: 'Vibrant Warm Sunset', bg: 'bg-gradient-to-r from-amber-600 to-rose-700 border-amber-300' },
    { id: 'clean-minimal', label: 'Clean Academic Minimal', bg: 'bg-slate-100 border-slate-300' },
];

export default function SpotlightCreate({ faculties, programs, prefill }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        type: prefill.type || 'achievement',
        faculty_id: prefill.faculty_id ? String(prefill.faculty_id) : '',
        honoree_name: prefill.honoree_name || '',
        honoree_title: prefill.honoree_title || '',
        program_or_department: prefill.program_or_department || '',
        photo: null as File | null,
        headline: prefill.headline || '',
        message: prefill.message || '',
        event_title: prefill.event_title || '',
        awarding_organization: prefill.awarding_organization || '',
        event_date: prefill.event_date || '',
        template: prefill.template || 'award',
        background_style: prefill.background_style || 'royal-gold',
        accent_style: prefill.accent_style || 'gold',
        headline_alignment: prefill.headline_alignment || 'left',
        text_size: prefill.text_size || 'normal',
        display_duration: prefill.display_duration || 20,
        transition: prefill.transition || 'zoom-fade',
        layout_mode: prefill.layout_mode || 'hero-split',
        fullscreen_takeover: prefill.fullscreen_takeover || false,
        playlist: prefill.playlist || 'Main TV Rotation',
        priority: prefill.priority || 1,
        start_at: prefill.start_at || '',
        end_at: prefill.end_at || '',
        status: prefill.status || 'published',
        evidence: null as File | null,
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Selected faculty object for avatar resolution
    const selectedFaculty = useMemo(() => {
        if (!data.faculty_id) return null;
        return faculties.find((f) => String(f.id) === String(data.faculty_id));
    }, [data.faculty_id, faculties]);

    // Handle faculty selection autofill
    const handleFacultyChange = (facultyId: string) => {
        setData('faculty_id', facultyId);
        if (facultyId) {
            const faculty = faculties.find((f) => String(f.id) === facultyId);
            if (faculty) {
                setData((prev) => ({
                    ...prev,
                    faculty_id: facultyId,
                    honoree_name: faculty.name,
                    honoree_title: faculty.academic_rank || 'Faculty Member',
                    program_or_department: faculty.program_name || '',
                    headline: prev.headline || (data.type === 'birthday' ? `HAPPY BIRTHDAY, ${faculty.title_name.toUpperCase()}!` : `CONGRATULATIONS, ${faculty.title_name.toUpperCase()}!`),
                }));
                if (faculty.photo_url) {
                    setPhotoPreview(faculty.photo_url);
                }
            }
        }
    };

    // Handle template changes with sensible defaults
    const handleTemplateChange = (templateId: string) => {
        setData('template', templateId);
        setData('type', templateId);

        if (templateId === 'birthday') {
            const name = selectedFaculty ? selectedFaculty.title_name : (data.honoree_name || 'COLLEAGUE');
            setData((prev) => ({
                ...prev,
                type: 'birthday',
                template: 'birthday',
                background_style: 'celebration-spark',
                headline: `HAPPY BIRTHDAY, ${name.toUpperCase()}!`,
                message: 'Warmest greetings and best wishes on your special day! CIDS celebrates your dedication, brilliance, and impactful mentorship.',
                display_duration: 20,
            }));
        } else if (templateId === 'publication') {
            setData((prev) => ({
                ...prev,
                type: 'publication',
                template: 'publication',
                background_style: 'midnight-prestige',
                headline: 'RESEARCH EXCELLENCE: NEW PUBLICATION',
                message: 'Commending our esteemed faculty for advancing knowledge and publishing cutting-edge scientific research.',
            }));
        } else if (templateId === 'award') {
            setData((prev) => ({
                ...prev,
                type: 'award',
                template: 'award',
                background_style: 'royal-gold',
                headline: 'CONGRATULATIONS ON YOUR PRESTIGIOUS AWARD!',
                message: 'The College of Information and Computing Sciences takes immense pride in celebrating this distinguished milestone.',
            }));
        }
    };

    // Handle file upload preview
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Live preview object
    const liveSlideData: SpotlightSlideData = {
        id: 'preview',
        type: data.type,
        headline: data.headline || 'CONGRATULATIONS!',
        message: data.message || 'Your supporting message and commendation details will appear here.',
        effective_honoree_name: data.honoree_name || selectedFaculty?.name || 'Faculty Member Name',
        honoree_title: data.honoree_title || selectedFaculty?.academic_rank || 'Assistant Professor',
        program_or_department: data.program_or_department || selectedFaculty?.program_name || 'CIDS Department',
        effective_photo_url: photoPreview || selectedFaculty?.photo_url || null,
        event_title: data.event_title || null,
        awarding_organization: data.awarding_organization || null,
        event_date: data.event_date || null,
        template: data.template,
        background_style: data.background_style,
        accent_style: data.accent_style,
        headline_alignment: data.headline_alignment,
        text_size: data.text_size,
        layout_mode: data.layout_mode,
        display_duration: data.display_duration,
        priority: data.priority,
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tv-config/spotlight', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Spotlight Slide - Recognition & Celebrations" />

            <TvStudioLayout>
                <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/spotlight"
                                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Create Spotlight Slide</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                        Celebratory & Visual
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Configure a full-screen, high-impact recognition slide for the TV display rotation.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/tv-config/spotlight')}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                            >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                Save & Publish Spotlight
                            </Button>
                        </div>
                    </div>

                    {/* Step-by-Step Interactive Form + Live 16:9 TV Preview */}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Form Controls (7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Step 1: Spotlight Template / Type */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">1</span>
                                    <span>Choose Recognition Template</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {TEMPLATES.map((tmpl) => {
                                        const Icon = tmpl.icon;
                                        const isSelected = data.template === tmpl.id;
                                        return (
                                            <button
                                                key={tmpl.id}
                                                type="button"
                                                onClick={() => handleTemplateChange(tmpl.id)}
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-500'
                                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                                </div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                    {tmpl.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Honoree & Faculty Selection */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">2</span>
                                    <span>Select Honoree & Faculty Profile</span>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Select Faculty (from CIDS Directory)
                                        </Label>
                                        <select
                                            value={data.faculty_id}
                                            onChange={(e) => handleFacultyChange(e.target.value)}
                                            className="w-full mt-1.5 h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                        >
                                            <option value="">-- Custom Honoree or Program Entity --</option>
                                            {faculties.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name} ({f.academic_rank}) - {f.program_name || 'Faculty'}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Selecting a faculty member automatically synchronizes their photo, academic rank, and department.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-semibold">Honoree Display Name</Label>
                                            <Input
                                                value={data.honoree_name}
                                                onChange={(e) => setData('honoree_name', e.target.value)}
                                                placeholder="e.g. Prof. Maria Reyes"
                                                className="mt-1 text-xs h-9"
                                            />
                                            {errors.honoree_name && <p className="text-xs text-rose-500 mt-1">{errors.honoree_name}</p>}
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Academic Rank / Title</Label>
                                            <Input
                                                value={data.honoree_title}
                                                onChange={(e) => setData('honoree_title', e.target.value)}
                                                placeholder="e.g. Associate Professor III"
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">Department or Program</Label>
                                        <Input
                                            value={data.program_or_department}
                                            onChange={(e) => setData('program_or_department', e.target.value)}
                                            placeholder="e.g. Department of Computer Science & Information Technology"
                                            className="mt-1 text-xs h-9"
                                        />
                                    </div>

                                    {/* Honoree Portrait Photo Upload */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-semibold flex items-center justify-between">
                                            <span>Honoree Portrait / Image</span>
                                            {photoPreview && (
                                                <span className="text-[10px] text-emerald-600 font-bold">Image loaded</span>
                                            )}
                                        </Label>

                                        <div className="mt-2 flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                {photoPreview ? (
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id="photo-upload"
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="photo-upload"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                                                >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>Upload Custom Portrait</span>
                                                </label>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    Recommended: High-resolution PNG or JPG portrait (minimum 600x600).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Recognition Messaging & Details */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">3</span>
                                    <span>Headlines, Message & Recognition Data</span>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <Label className="text-xs font-semibold">Primary Headline *</Label>
                                        <Input
                                            value={data.headline}
                                            onChange={(e) => setData('headline', e.target.value)}
                                            placeholder="e.g. CONGRATULATIONS! or HAPPY BIRTHDAY, PROF. REYES!"
                                            className="mt-1 text-sm font-bold h-10 border-amber-300 dark:border-amber-800"
                                            required
                                        />
                                        {errors.headline && <p className="text-xs text-rose-500 mt-1">{errors.headline}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">Supporting Commendation Message *</Label>
                                        <Textarea
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="e.g. Recipient of the Best Paper Award at the 2026 Regional ICT Research Conference. CIDS celebrates your dedication and excellence."
                                            className="mt-1 text-xs min-h-[90px]"
                                            required
                                        />
                                        {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-xs font-semibold">Award / Event Title</Label>
                                            <Input
                                                value={data.event_title}
                                                onChange={(e) => setData('event_title', e.target.value)}
                                                placeholder="e.g. Regional ICT Best Paper"
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Conferring Organization</Label>
                                            <Input
                                                value={data.awarding_organization}
                                                onChange={(e) => setData('awarding_organization', e.target.value)}
                                                placeholder="e.g. CHED / IEEE Philippines"
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Event Date</Label>
                                            <Input
                                                type="date"
                                                value={data.event_date}
                                                onChange={(e) => setData('event_date', e.target.value)}
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Optional Internal Verification Attachment */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-semibold flex items-center justify-between">
                                            <span>Internal Evidence Document (Optional)</span>
                                            <span className="text-[10px] text-slate-400">Not displayed on TV slide</span>
                                        </Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => setData('evidence', e.target.files?.[0] || null)}
                                            className="mt-1.5 text-xs h-9"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Upload certificate, official post, or verification memo for audit records.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4: Visual Styling & Layout Controls */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">4</span>
                                    <span>Visual Styling & Layout</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold">Background Theme Style</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                                            {BACKGROUND_STYLES.map((bg) => {
                                                const isSelected = data.background_style === bg.id;
                                                return (
                                                    <button
                                                        key={bg.id}
                                                        type="button"
                                                        onClick={() => setData('background_style', bg.id)}
                                                        className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                                                            isSelected
                                                                ? 'border-amber-500 ring-2 ring-amber-500/40 bg-slate-900 text-white'
                                                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        <span className="truncate">{bg.label}</span>
                                                        {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-xs font-semibold">Headline Alignment</Label>
                                            <select
                                                value={data.headline_alignment}
                                                onChange={(e) => setData('headline_alignment', e.target.value as any)}
                                                className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value="left">Left Aligned</option>
                                                <option value="center">Center Aligned</option>
                                                <option value="right">Right Aligned</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Typography Scale</Label>
                                            <select
                                                value={data.text_size}
                                                onChange={(e) => setData('text_size', e.target.value as any)}
                                                className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value="compact">Compact (Subtle)</option>
                                                <option value="normal">Normal (Balanced)</option>
                                                <option value="large">Large (High Impact)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Screen Layout</Label>
                                            <select
                                                value={data.layout_mode}
                                                onChange={(e) => setData('layout_mode', e.target.value as any)}
                                                className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value="hero-split">Hero Split (Portrait + Text)</option>
                                                <option value="centered-portrait">Centered Portrait</option>
                                                <option value="banner-card">Horizontal Banner</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 5: TV Playlist & Scheduling */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">5</span>
                                    <span>Display Duration & Schedule Automation</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-xs font-semibold">Slide Duration (seconds)</Label>
                                            <Input
                                                type="number"
                                                min={5}
                                                max={120}
                                                value={data.display_duration}
                                                onChange={(e) => setData('display_duration', parseInt(e.target.value) || 20)}
                                                className="mt-1 text-xs h-9"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">Recommended: 15–25 seconds</p>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Priority in Rotation</Label>
                                            <select
                                                value={data.priority}
                                                onChange={(e) => setData('priority', parseInt(e.target.value) || 1)}
                                                className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value={1}>Normal (Regular Rotation)</option>
                                                <option value={2}>High (Every 3rd-4th slide)</option>
                                                <option value={3}>Critical (Exclusive / Top)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Transition Effect</Label>
                                            <select
                                                value={data.transition}
                                                onChange={(e) => setData('transition', e.target.value)}
                                                className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value="zoom-fade">Zoom & Fade</option>
                                                <option value="slide-up">Smooth Slide Up</option>
                                                <option value="elegant-fade">Cross-Dissolve</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <Label className="text-xs font-semibold">Display Start (Auto-Publish)</Label>
                                            <Input
                                                type="datetime-local"
                                                value={data.start_at}
                                                onChange={(e) => setData('start_at', e.target.value)}
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">Display End (Auto-Expire)</Label>
                                            <Input
                                                type="datetime-local"
                                                value={data.end_at}
                                                onChange={(e) => setData('end_at', e.target.value)}
                                                className="mt-1 text-xs h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="fullscreen_takeover"
                                                checked={data.fullscreen_takeover}
                                                onChange={(e) => setData('fullscreen_takeover', e.target.checked)}
                                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                                            />
                                            <label htmlFor="fullscreen_takeover" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                                Takeover Fullscreen Priority
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-semibold">Publish Status:</Label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                <option value="published">Published (Live)</option>
                                                <option value="draft">Draft (Review Only)</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Sticky 16:9 TV Preview (5 cols) */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="sticky top-20 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <Tv className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Live 16:9 TV Preview</span>
                                    </h3>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        Synchronized
                                    </span>
                                </div>

                                {/* Aspect Ratio 16:9 Canvas */}
                                <div className="aspect-video w-full rounded-2xl bg-slate-950 p-2 shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                                    <SpotlightSlideHero slide={liveSlideData} isPreview={true} />
                                </div>

                                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Spotlight Slide Behavior Notice</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Unlike ordinary announcements, this slide will appear as an impactful hero takeover on the TV display for <strong>{data.display_duration} seconds</strong> with custom typography, college insignia, and celebration effects.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    Publish to TV Playlist
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
