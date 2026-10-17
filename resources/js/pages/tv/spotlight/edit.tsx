import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
    Users,
    Users2,
    Building2,
    Check,
    HelpCircle,
    Info,
    FileText,
    Image as ImageIcon,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { SpotlightSlideHero, SpotlightSlideData, HonoreeItem } from '@/components/spotlight-slide-hero';

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
    spotlight: SpotlightSlideData & {
        faculty_id?: number | null;
        evidence_name?: string | null;
        start_at?: string | null;
        end_at?: string | null;
        group_photo_path?: string | null;
        group_photo_fit?: string;
        group_photo_focal?: string;
        group_photo_overlay?: boolean;
        supporting_media?: any[];
        animation_effect?: string;
        subject_type?: string;
    };
    faculties: FacultyItem[];
    programs: ProgramItem[];
}

const RECOGNITION_TYPES = [
    { id: 'award', label: 'Award & Honors', icon: Trophy, desc: 'Prestigious awards, medals, and official recognitions' },
    { id: 'achievement', label: 'Achievement', icon: Award, desc: 'Professional, career, or academic milestones' },
    { id: 'birthday', label: 'Birthday Celebration', icon: Cake, desc: 'Festive greeting highlighting birthday milestone' },
    { id: 'publication', label: 'Research Publication', icon: BookOpen, desc: 'Recognizing Scopus, WoS, or high-impact papers' },
    { id: 'certification', label: 'Certification / Licensure', icon: ShieldCheck, desc: 'New industry credentials & professional passes' },
    { id: 'promotion', label: 'Academic Promotion', icon: Sparkles, desc: 'Celebrating rank advances (e.g. Professor)' },
    { id: 'research', label: 'Research Recognition', icon: Trophy, desc: 'Grants, best paper, and symposium honors' },
    { id: 'extension', label: 'Extension Recognition', icon: Award, desc: 'Community impact and extension outreach honors' },
    { id: 'welcome', label: 'Welcome to CIDS', icon: User, desc: 'Warm introduction for newly onboarded faculty' },
    { id: 'farewell', label: 'Gratitude & Farewell', icon: Award, desc: 'Honoring retiring or moving faculty' },
    { id: 'custom', label: 'Custom Celebration', icon: Sparkles, desc: 'Bespoke celebratory layouts' },
];

const SUBJECT_TYPES = [
    { id: 'individual', label: 'One Person', icon: User, desc: 'Dedicated single hero portrait' },
    { id: 'multiple', label: 'Multiple People', icon: Users, desc: 'Structured honorees cards (2–6 people)' },
    { id: 'team', label: 'Team / Group', icon: Users2, desc: 'Lab, committee, or research unit' },
    { id: 'program', label: 'Program / Department', icon: Building2, desc: 'Entire department or degree program' },
    { id: 'group_photo', label: 'Custom Group Photo', icon: ImageIcon, desc: 'Single wide team banner photo' },
];

const BACKGROUND_STYLES = [
    { id: 'royal-gold', label: 'Royal Gold & Midnight', bg: 'bg-gradient-to-r from-amber-950 to-slate-900 border-amber-400' },
    { id: 'midnight-prestige', label: 'Midnight Prestige Blue', bg: 'bg-gradient-to-r from-slate-950 to-blue-950 border-indigo-400' },
    { id: 'velvet-maroon', label: 'Velvet Maroon & Gold', bg: 'bg-gradient-to-r from-rose-950 to-red-950 border-rose-400' },
    { id: 'emerald-excellence', label: 'Emerald Excellence', bg: 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-400' },
    { id: 'modern-cyber', label: 'Modern Cyber Cyan', bg: 'bg-gradient-to-r from-cyan-950 to-blue-900 border-cyan-400' },
    { id: 'celebration-spark', label: 'Celebration Spark & Magenta', bg: 'bg-gradient-to-r from-fuchsia-950 to-amber-950 border-fuchsia-400' },
    { id: 'vibrant-gradient', label: 'Vibrant Warm Sunset', bg: 'bg-gradient-to-r from-amber-600 to-rose-700 border-amber-300' },
    { id: 'clean-minimal', label: 'Clean Academic Minimal', bg: 'bg-slate-100 border-slate-300 text-slate-900' },
];

const ANIMATION_EFFECTS = [
    { id: 'confetti', label: 'Vibrant Confetti Rain', icon: '🎉' },
    { id: 'balloons', label: 'Floating Balloons', icon: '🎈' },
    { id: 'floating_trophies', label: 'Moving Golden Trophies', icon: '🏆' },
    { id: 'medals', label: 'Swaying Medals & Ribbons', icon: '🎖️' },
    { id: 'sparkles', label: 'Twinkling Starlight Glints', icon: '✨' },
    { id: 'applause', label: 'Standing Ovation Applause', icon: '👏' },
    { id: 'none', label: 'No Overlay FX', icon: '🚫' },
];

export default function SpotlightEdit({ spotlight, faculties, programs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'TV Studio', href: '/tv-config/dashboard' },
        { title: 'Recognition & Celebrations', href: '/tv-config/spotlight' },
        { title: `Edit: ${spotlight.headline}`, href: `/tv-config/spotlight/${spotlight.id}/edit` },
    ];

    const formatForInput = (dtStr?: string | null) => {
        if (!dtStr) return '';
        try {
            return new Date(dtStr).toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    const [activeTab, setActiveTab] = useState<'subject' | 'media' | 'content' | 'design' | 'display'>('subject');
    const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);

    // Initial honorees
    const [honoreesList, setHonoreesList] = useState<HonoreeItem[]>(() => {
        if (spotlight.honorees && spotlight.honorees.length > 0) return spotlight.honorees;
        if (spotlight.effective_honorees_list && spotlight.effective_honorees_list.length > 0) return spotlight.effective_honorees_list;
        return [];
    });

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        type: spotlight.type || 'achievement',
        subject_type: spotlight.subject_type || 'individual',
        faculty_id: spotlight.faculty_id ? String(spotlight.faculty_id) : '',
        honoree_name: spotlight.honoree_name || '',
        honoree_title: spotlight.honoree_title || '',
        program_or_department: spotlight.program_or_department || '',
        honorees: [] as any[],
        photo: null as File | null,
        group_photo: null as File | null,
        group_photo_fit: spotlight.group_photo_fit || 'cover',
        group_photo_focal: spotlight.group_photo_focal || 'center',
        group_photo_overlay: spotlight.group_photo_overlay ?? true,
        supporting_media_file_1: null as File | null,
        supporting_media_file_2: null as File | null,
        supporting_media_caption_1: spotlight.supporting_media?.[0]?.caption || '',
        supporting_media_caption_2: spotlight.supporting_media?.[1]?.caption || '',
        headline: spotlight.headline || '',
        message: spotlight.message || '',
        event_title: spotlight.event_title || '',
        awarding_organization: spotlight.awarding_organization || '',
        event_date: spotlight.event_date ? String(spotlight.event_date).slice(0, 10) : '',
        template: spotlight.template || 'portrait-left',
        background_style: spotlight.background_style || 'royal-gold',
        accent_style: spotlight.accent_style || 'gold',
        headline_alignment: spotlight.headline_alignment || 'left',
        text_size: spotlight.text_size || 'normal',
        display_duration: spotlight.display_duration || 20,
        transition: spotlight.transition || 'zoom-fade',
        animation_effect: spotlight.animation_effect || 'confetti',
        layout_mode: spotlight.layout_mode || 'hero-split',
        fullscreen_takeover: spotlight.fullscreen_takeover || false,
        playlist: 'Main TV Rotation',
        priority: spotlight.priority || 1,
        start_at: formatForInput(spotlight.start_at),
        end_at: formatForInput(spotlight.end_at),
        status: spotlight.status || 'published',
        evidence: null as File | null,
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(spotlight.effective_photo_url || spotlight.photo_path || null);
    const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(spotlight.effective_group_photo_url || spotlight.group_photo_path || null);
    const [supportingPreview1, setSupportingPreview1] = useState<string | null>(spotlight.supporting_media?.[0]?.path ? `/storage/${spotlight.supporting_media[0].path}` : null);
    const [supportingPreview2, setSupportingPreview2] = useState<string | null>(spotlight.supporting_media?.[1]?.path ? `/storage/${spotlight.supporting_media[1].path}` : null);

    const selectedFaculty = useMemo(() => {
        if (!data.faculty_id) return null;
        return faculties.find((f) => String(f.id) === String(data.faculty_id));
    }, [data.faculty_id, faculties]);

    const compatibleTemplates = useMemo(() => {
        if (data.subject_type === 'individual') {
            return [
                { id: 'portrait-left', label: 'Portrait Left (Classic)', desc: 'Large hero headshot with right-side typography' },
                { id: 'portrait-right', label: 'Portrait Right', desc: 'Left typography with right-side framed portrait' },
                { id: 'centered-celebration', label: 'Centered Celebration', desc: 'Central hero portrait with symmetrical banner' },
                { id: 'academic-hero', label: 'Academic Hero', desc: 'Minimal prestige theme with prominent rank seals' },
            ];
        }

        if (data.subject_type === 'multiple') {
            const count = Math.max(honoreesList.length, 2);
            if (count === 2) {
                return [
                    { id: 'dual-portrait', label: 'Dual Portrait (Side-by-Side)', desc: 'Two prominent hero cards side by side' },
                    { id: 'split-recognition', label: 'Split Recognition', desc: 'Top/bottom or left/right split layout' },
                ];
            } else if (count === 3) {
                return [
                    { id: 'three-card', label: 'Three-Card Colonnade', desc: 'Three balanced cards with individual portraits' },
                    { id: 'trio-celebration', label: 'Trio Celebration', desc: 'Lead investigator centered with two colleagues' },
                ];
            } else {
                return [
                    { id: 'team-grid', label: 'Portrait Grid (Mosaic)', desc: 'Compact clean portrait grid for 4 to 6 people' },
                    { id: 'group-names-list', label: 'Card Gallery + Names', desc: 'Mini headshots with structured commendation' },
                ];
            }
        }

        return [
            { id: 'group-banner', label: 'Wide Group Photo Banner', desc: 'High-visibility wide panoramic group photo' },
            { id: 'program-hero', label: 'Department / Program Hero', desc: 'Formal department seal with group commendation' },
            { id: 'team-mosaic', label: 'Team Achievement Banner', desc: 'Full-bleed photo backdrop with high-contrast text' },
        ];
    }, [data.subject_type, honoreesList.length]);

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
                }));
                if (faculty.photo_url) {
                    setPhotoPreview(faculty.photo_url);
                }
            }
        }
    };

    const handleAddHonoree = (facultyId?: string) => {
        if (facultyId) {
            const faculty = faculties.find((f) => String(f.id) === facultyId);
            if (faculty) {
                setHonoreesList((prev) => [
                    ...prev,
                    {
                        faculty_id: faculty.id,
                        name: faculty.name,
                        title: faculty.academic_rank,
                        program: faculty.program_name,
                        photo_url: faculty.photo_url || null,
                    },
                ]);
                return;
            }
        }
        setHonoreesList((prev) => [
            ...prev,
            {
                faculty_id: null,
                name: `Honoree ${prev.length + 1}`,
                title: 'Faculty / Researcher',
                program: 'CIDS Department',
                photo_url: null,
            },
        ]);
    };

    const handleRemoveHonoree = (index: number) => {
        setHonoreesList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMoveHonoree = (index: number, direction: 'up' | 'down') => {
        setHonoreesList((prev) => {
            const copy = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= copy.length) return prev;
            const temp = copy[index];
            copy[index] = copy[targetIndex];
            copy[targetIndex] = temp;
            return copy;
        });
    };

    const liveSlideData: SpotlightSlideData = useMemo(() => {
        return {
            id: spotlight.id,
            type: data.type,
            subject_type: data.subject_type,
            headline: data.headline || 'CONGRATULATIONS & SALUTE!',
            message: data.message || 'Commendation message and recognition details will appear here with crystal-clear legibility.',
            effective_honoree_name: data.honoree_name || selectedFaculty?.name || (honoreesList[0]?.name) || 'Faculty Member Name',
            honoree_name: data.honoree_name,
            honoree_title: data.honoree_title || selectedFaculty?.academic_rank || 'Assistant Professor',
            program_or_department: data.program_or_department || selectedFaculty?.program_name || 'CIDS Department',
            effective_photo_url: photoPreview || selectedFaculty?.photo_url || null,
            effective_group_photo_url: groupPhotoPreview || null,
            effective_honorees_list: honoreesList,
            group_photo_fit: data.group_photo_fit as any,
            group_photo_focal: data.group_photo_focal as any,
            group_photo_overlay: data.group_photo_overlay,
            supporting_media: [
                ...(supportingPreview1 ? [{ path: supportingPreview1, caption: data.supporting_media_caption_1 || 'Event Context' }] : []),
                ...(supportingPreview2 ? [{ path: supportingPreview2, caption: data.supporting_media_caption_2 || 'Award Certificate' }] : []),
            ],
            event_title: data.event_title || null,
            awarding_organization: data.awarding_organization || null,
            event_date: data.event_date || null,
            template: data.template,
            background_style: data.background_style,
            accent_style: data.accent_style,
            headline_alignment: data.headline_alignment,
            text_size: data.text_size,
            animation_effect: data.animation_effect,
            layout_mode: data.layout_mode,
            display_duration: data.display_duration,
            priority: data.priority,
            status: data.status,
        };
    }, [data, photoPreview, groupPhotoPreview, supportingPreview1, supportingPreview2, honoreesList, selectedFaculty, spotlight.id]);

    const headlineWarn = data.headline.length > 65;
    const messageWarn = data.message.length > 200;
    const allRequiredComplete = Boolean(data.headline.trim() && data.message.trim());

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const formPayload = {
            ...data,
            honorees: JSON.stringify(honoreesList),
        };
        post(`/tv-config/spotlight/${spotlight.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${spotlight.headline} - Recognition & Celebrations`} />

            <TvStudioLayout>
                <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
                    {/* Workspace Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/spotlight"
                                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Edit Spotlight Slide</span>
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black border border-amber-500/30">
                                        ID #{spotlight.id}
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Update recognition subject details, celebration animation effects, and display schedules.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/tv-config/spotlight')}
                                className="text-xs h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={processing || !allRequiredComplete}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 shadow-md cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    {/* Main Two-Column Workspace (Form ~60%, Sticky Preview ~40%) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Segmented Step Editor (7 cols / ~58%) */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* Sticky Step Navigation Bar */}
                            <div className="sticky top-16 z-30 flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xs overflow-x-auto">
                                {[
                                    { id: 'subject', label: '1. Type & Subject' },
                                    { id: 'media', label: '2. Media' },
                                    { id: 'content', label: '3. Content' },
                                    { id: 'design', label: '4. Design & FX' },
                                    { id: 'display', label: '5. Display & Publish' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                                            activeTab === tab.id
                                                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* TAB 1: Recognition Type & Subject Model */}
                            {activeTab === 'subject' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Recognition Category
                                        </Label>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {RECOGNITION_TYPES.map((tmpl) => {
                                                const Icon = tmpl.icon;
                                                const isSelected = data.type === tmpl.id;
                                                return (
                                                    <button
                                                        key={tmpl.id}
                                                        type="button"
                                                        onClick={() => setData('type', tmpl.id)}
                                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-1 ring-amber-500'
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

                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Recognition Subject Model
                                        </Label>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {SUBJECT_TYPES.map((sub) => {
                                                const Icon = sub.icon;
                                                const isSelected = data.subject_type === sub.id;
                                                return (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => setData('subject_type', sub.id)}
                                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                                            isSelected
                                                                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 ring-1 ring-amber-500'
                                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                                                <span>{sub.label}</span>
                                                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {sub.desc}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {data.subject_type === 'individual' && (
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Individual Honoree Information
                                            </Label>

                                            <div>
                                                <Label className="text-xs font-semibold">Select Faculty from CIDS Directory</Label>
                                                <select
                                                    value={data.faculty_id}
                                                    onChange={(e) => handleFacultyChange(e.target.value)}
                                                    className="w-full mt-1.5 h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                >
                                                    <option value="">-- Custom Honoree / Not in Directory --</option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name} ({f.academic_rank}) - {f.program_name || 'Faculty'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs font-semibold">Honoree Display Name *</Label>
                                                    <Input
                                                        value={data.honoree_name}
                                                        onChange={(e) => setData('honoree_name', e.target.value)}
                                                        className="mt-1 text-xs h-9"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">Academic Rank / Title</Label>
                                                    <Input
                                                        value={data.honoree_title}
                                                        onChange={(e) => setData('honoree_title', e.target.value)}
                                                        className="mt-1 text-xs h-9"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs font-semibold">Department or Program</Label>
                                                <Input
                                                    value={data.program_or_department}
                                                    onChange={(e) => setData('program_or_department', e.target.value)}
                                                    className="mt-1 text-xs h-9"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {data.subject_type === 'multiple' && (
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                                    Honoree Manager ({honoreesList.length} Honorees)
                                                </Label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setData('subject_type', 'group_photo')}
                                                    className="text-[11px] h-7"
                                                >
                                                    <ImageIcon className="w-3 h-3 mr-1" />
                                                    Use Group Photo Instead
                                                </Button>
                                            </div>

                                            <div className="flex gap-2">
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleAddHonoree(e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                >
                                                    <option value="">+ Add faculty from directory...</option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name} - {f.academic_rank} ({f.program_name})
                                                        </option>
                                                    ))}
                                                </select>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddHonoree()}
                                                    className="text-xs h-9"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                                    Custom Person
                                                </Button>
                                            </div>

                                            <div className="space-y-2.5">
                                                {honoreesList.map((honoree, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-300/40 overflow-hidden flex items-center justify-center shrink-0">
                                                                {honoree.photo_url ? (
                                                                    <img src={honoree.photo_url} alt={honoree.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-5 h-5 text-amber-300/60" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <input
                                                                    type="text"
                                                                    value={honoree.name}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setHonoreesList((prev) => {
                                                                            const copy = [...prev];
                                                                            copy[idx] = { ...copy[idx], name: val };
                                                                            return copy;
                                                                        });
                                                                    }}
                                                                    className="text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-hidden w-full text-slate-900 dark:text-white"
                                                                />
                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                    {honoree.title} • {honoree.program}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveHonoree(idx, 'up')}
                                                                disabled={idx === 0}
                                                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                                                                title="Move Up"
                                                            >
                                                                <ArrowUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveHonoree(idx, 'down')}
                                                                disabled={idx === honoreesList.length - 1}
                                                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                                                                title="Move Down"
                                                            >
                                                                <ArrowDown className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveHonoree(idx)}
                                                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500"
                                                                title="Remove Honoree"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab('media')}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                        >
                                            Next: Media Uploads →
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Media Uploads */}
                            {activeTab === 'media' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Primary Media
                                        </Label>

                                        {data.subject_type === 'individual' ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                    {photoPreview ? (
                                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        id="single-photo-edit-upload"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setData('photo', file);
                                                                setPhotoPreview(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor="single-photo-edit-upload"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" />
                                                        <span>Replace Portrait Image</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-28 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                        {groupPhotoPreview ? (
                                                            <img src={groupPhotoPreview} alt="Group Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-8 h-8 text-slate-400" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <input
                                                            type="file"
                                                            id="group-photo-edit-upload"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setData('group_photo', file);
                                                                    setGroupPhotoPreview(URL.createObjectURL(file));
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <label
                                                            htmlFor="group-photo-edit-upload"
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" />
                                                            <span>Upload / Replace Group Photo</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <Label className="text-xs font-semibold">Image Fit</Label>
                                                        <select
                                                            value={data.group_photo_fit}
                                                            onChange={(e) => setData('group_photo_fit', e.target.value)}
                                                            className="w-full mt-1 h-9 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                        >
                                                            <option value="cover">Cover (Fill Slot)</option>
                                                            <option value="contain">Contain (Full Aspect)</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-semibold">Focal Alignment</Label>
                                                        <select
                                                            value={data.group_photo_focal}
                                                            onChange={(e) => setData('group_photo_focal', e.target.value)}
                                                            className="w-full mt-1 h-9 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                        >
                                                            <option value="center">Center</option>
                                                            <option value="top">Top (Heads/Faces)</option>
                                                            <option value="bottom">Bottom</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-col justify-end pb-1">
                                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.group_photo_overlay}
                                                                onChange={(e) => setData('group_photo_overlay', e.target.checked)}
                                                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                                                            />
                                                            <span>Legibility Scrim Overlay</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('subject')}
                                            className="text-xs"
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab('content')}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                        >
                                            Next: Content & Headlines →
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Content */}
                            {activeTab === 'content' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-xs font-semibold">Primary Celebratory Headline *</Label>
                                                <span className={`text-[10px] font-bold ${headlineWarn ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {data.headline.length}/60 chars recommended
                                                </span>
                                            </div>
                                            <Input
                                                value={data.headline}
                                                onChange={(e) => setData('headline', e.target.value)}
                                                className={`text-sm font-bold h-10 ${headlineWarn ? 'border-amber-500' : 'border-amber-300 dark:border-amber-800'}`}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-xs font-semibold">Supporting Commendation Message *</Label>
                                                <span className={`text-[10px] font-bold ${messageWarn ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {data.message.length}/180 chars recommended
                                                </span>
                                            </div>
                                            <Textarea
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                className={`text-xs min-h-[90px] ${messageWarn ? 'border-amber-500' : ''}`}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <Label className="text-xs font-semibold">Recognition / Event Title</Label>
                                                <Input
                                                    value={data.event_title}
                                                    onChange={(e) => setData('event_title', e.target.value)}
                                                    className="mt-1 text-xs h-9"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs font-semibold">Awarding Organization</Label>
                                                <Input
                                                    value={data.awarding_organization}
                                                    onChange={(e) => setData('awarding_organization', e.target.value)}
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
                                    </div>

                                    <div className="flex justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('media')}
                                            className="text-xs"
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab('design')}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                        >
                                            Next: Design & Celebration FX →
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: Design & FX */}
                            {activeTab === 'design' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Compatible Layout Templates
                                        </Label>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {compatibleTemplates.map((tmpl) => {
                                                const isSelected = data.template === tmpl.id;
                                                return (
                                                    <button
                                                        key={tmpl.id}
                                                        type="button"
                                                        onClick={() => setData('template', tmpl.id)}
                                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 ring-1 ring-amber-500'
                                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                                            <span>{tmpl.label}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                            {tmpl.desc}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Animation FX */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Celebratory Animation Effects
                                        </Label>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {ANIMATION_EFFECTS.map((fx) => {
                                                const isSelected = data.animation_effect === fx.id;
                                                return (
                                                    <button
                                                        key={fx.id}
                                                        type="button"
                                                        onClick={() => setData('animation_effect', fx.id)}
                                                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex flex-col justify-between h-20 ${
                                                            isSelected
                                                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <span className="text-2xl">{fx.icon}</span>
                                                        <span className="text-[11px] truncate">{fx.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Theme Styles */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            Color Palette
                                        </Label>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                                    <div className="flex justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('content')}
                                            className="text-xs"
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab('display')}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                                        >
                                            Next: Display Settings →
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: Display Settings */}
                            {activeTab === 'display' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
                                            </div>

                                            <div>
                                                <Label className="text-xs font-semibold">Rotation Priority</Label>
                                                <select
                                                    value={data.priority}
                                                    onChange={(e) => setData('priority', parseInt(e.target.value) || 1)}
                                                    className="w-full mt-1 h-9 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                >
                                                    <option value={1}>Normal</option>
                                                    <option value={2}>High (Frequent)</option>
                                                    <option value={3}>Critical Takeover</option>
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

                                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                                            <label className="flex items-start gap-2.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.fullscreen_takeover}
                                                    onChange={(e) => setData('fullscreen_takeover', e.target.checked)}
                                                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 mt-0.5"
                                                />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                        Enable Featured Takeover
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                                        Temporarily interrupts rotation to showcase this slide prominently across TV screens.
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <Label className="text-xs font-semibold">Display Start</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={data.start_at}
                                                    onChange={(e) => setData('start_at', e.target.value)}
                                                    className="mt-1 text-xs h-9"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs font-semibold">Display End</Label>
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
                                                <Label className="text-xs font-semibold">Status:</Label>
                                                <select
                                                    value={data.status}
                                                    onChange={(e) => setData('status', e.target.value)}
                                                    className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                >
                                                    <option value="published">Published (Live)</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('design')}
                                            className="text-xs"
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSubmit()}
                                            disabled={processing || !allRequiredComplete}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10 shadow-md"
                                        >
                                            <Save className="w-4 h-4 mr-1.5" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Sticky 16:9 Live TV Preview (~42% / 5 cols) */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-[90px] space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Tv className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                            Synchronized 16:9 Preview
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFullscreenPreviewOpen(true)}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                        title="Fullscreen QA"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="aspect-video w-full rounded-2xl bg-slate-950 p-2 shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center relative">
                                    <SpotlightSlideHero slide={liveSlideData} isPreview={true} />
                                </div>

                                <div className="space-y-2 pt-1">
                                    <Button
                                        type="button"
                                        onClick={() => handleSubmit()}
                                        disabled={processing || !allRequiredComplete}
                                        className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                                    >
                                        <Save className="w-4 h-4 mr-1.5" />
                                        Save & Update Slide
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setData('status', 'draft');
                                                handleSubmit();
                                            }}
                                            disabled={processing}
                                            className="text-xs h-9"
                                        >
                                            Save as Draft
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFullscreenPreviewOpen(true)}
                                            className="text-xs h-9"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                            Fullscreen QA
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Display Playback Details</span>
                                    </div>
                                    <p>
                                        Duration: <strong>{data.display_duration}s</strong> • Template: <strong>{data.template}</strong> • Animation: <strong>{data.animation_effect}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fullscreen QA Modal */}
                <Dialog open={fullscreenPreviewOpen} onOpenChange={setFullscreenPreviewOpen}>
                    <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-4 flex flex-col justify-between bg-slate-950 border-slate-800 text-white">
                        <DialogHeader className="border-b border-slate-800 pb-2">
                            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                <Tv className="w-4 h-4" />
                                <span>Fullscreen TV Playback Simulation</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 w-full flex items-center justify-center p-2 min-h-0">
                            <div className="aspect-video w-full h-full max-h-[70vh]">
                                <SpotlightSlideHero slide={liveSlideData} isPreview={false} />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </TvStudioLayout>
        </AppLayout>
    );
}
