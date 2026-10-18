import React from 'react';
import {
    Award,
    Trophy,
    Cake,
    Star,
    Sparkles,
    BookOpen,
    ShieldCheck,
    CheckCircle2,
    Calendar,
    Building2,
    GraduationCap,
    HeartHandshake,
    Flame,
    Share2,
    Smile,
    Ribbon,
    PartyPopper,
    Users,
    Users2,
    Image as ImageIcon
} from 'lucide-react';
import { CelebrationEffects } from '@/components/celebration-effects';

export interface HonoreeItem {
    faculty_id?: number | string | null;
    name: string;
    title?: string;
    program?: string;
    photo_url?: string | null;
}

export interface SupportingMediaItem {
    path: string;
    name?: string;
    caption?: string;
}

export interface CollagePhotoItem {
    id?: string;
    path?: string;
    url?: string;
    caption?: string;
    fit?: 'cover' | 'contain';
    is_primary?: boolean;
}

export interface SpotlightSlideData {
    id: number | string;
    type: string; // award, achievement, birthday, publication, certification, promotion, research, extension, welcome, farewell, custom
    subject_type?: 'individual' | 'multiple' | 'team' | 'program' | 'group_photo' | 'collage' | string;
    headline: string;
    message: string;
    effective_honoree_name?: string;
    honoree_name?: string;
    honoree_title?: string;
    program_or_department?: string;
    effective_photo_url?: string | null;
    effective_group_photo_url?: string | null;
    effective_honorees_list?: HonoreeItem[];
    effective_collage_photos?: CollagePhotoItem[];
    collage_style?: '2_split' | '3_grid' | '4_grid' | '1_plus_thumbnails' | 'hero_supporting' | string | null;
    collage_photos?: CollagePhotoItem[] | null;
    honorees?: HonoreeItem[] | null;
    photo_path?: string | null;
    group_photo_path?: string | null;
    group_photo_fit?: 'cover' | 'contain';
    group_photo_focal?: 'center' | 'top' | 'bottom';
    group_photo_overlay?: boolean;
    supporting_media?: SupportingMediaItem[] | null;
    event_title?: string | null;
    awarding_organization?: string | null;
    event_date?: string | null;
    template?: string;
    background_style?: string; // royal-gold, midnight-prestige, velvet-maroon, emerald-excellence, modern-cyber, celebration-spark, vibrant-gradient, clean-minimal
    accent_style?: string;
    headline_alignment?: 'left' | 'center' | 'right';
    text_size?: 'compact' | 'normal' | 'large';
    layout_mode?: 'hero-split' | 'centered-portrait' | 'banner-card' | 'full-bleed';
    animation_effect?: 'confetti' | 'balloons' | 'floating_trophies' | 'medals' | 'sparkles' | 'applause' | 'none' | string;
    fullscreen_takeover?: boolean;
    display_duration?: number;
    transition?: string;
    status?: string;
    priority?: number;
    faculty?: {
        id: number;
        full_name?: string;
        title_name?: string;
        academic_rank?: string;
        photo_url?: string | null;
        program?: {
            name?: string;
            code?: string;
        };
    };
}

interface SpotlightSlideHeroProps {
    slide: SpotlightSlideData;
    isDark?: boolean;
    isPreview?: boolean;
}

export function SpotlightSlideHero({ slide, isDark = false, isPreview = false }: SpotlightSlideHeroProps) {
    const subjectType = slide.subject_type || 'individual';
    const honoreesList: HonoreeItem[] = slide.effective_honorees_list && slide.effective_honorees_list.length > 0
        ? slide.effective_honorees_list
        : (slide.honorees && slide.honorees.length > 0)
            ? slide.honorees
            : [{
                name: slide.effective_honoree_name || slide.honoree_name || slide.faculty?.full_name || 'Distinguished Honoree',
                title: slide.honoree_title || slide.faculty?.academic_rank || 'Faculty Member',
                program: slide.program_or_department || slide.faculty?.program?.name || 'College Faculty',
                photo_url: slide.effective_photo_url || slide.photo_path || slide.faculty?.photo_url || null,
            }];

    const honoreeName = slide.effective_honoree_name || slide.honoree_name || (slide.faculty?.full_name) || (honoreesList[0]?.name) || 'Distinguished Honoree';
    const honoreeTitle = slide.honoree_title || slide.faculty?.academic_rank || honoreesList[0]?.title || 'Faculty Member';
    const programOrDept = slide.program_or_department || slide.faculty?.program?.name || honoreesList[0]?.program || 'College of Information and Communications Studies';
    const photoUrl = slide.effective_photo_url || slide.photo_path || slide.faculty?.photo_url || honoreesList[0]?.photo_url || null;
    const groupPhotoUrl = slide.effective_group_photo_url || slide.group_photo_path || null;

    const bgStyle = slide.background_style || 'royal-gold';
    const alignment = slide.headline_alignment || 'left';
    const textSize = slide.text_size || 'normal';
    const type = slide.type || 'achievement';
    const template = slide.template || 'portrait-left';
    const isBirthday = type === 'birthday';
    const animEffect = slide.animation_effect || (isBirthday ? 'balloons' : 'confetti');

    // Theme style mapping
    const getBgClasses = () => {
        switch (bgStyle) {
            case 'royal-gold':
                return 'bg-gradient-to-br from-amber-950 via-slate-950 to-amber-900 border-amber-500/40 text-amber-50';
            case 'midnight-prestige':
                return 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 border-indigo-500/30 text-indigo-50';
            case 'velvet-maroon':
                return 'bg-gradient-to-br from-rose-950 via-slate-950 to-red-950 border-rose-500/30 text-rose-50';
            case 'emerald-excellence':
                return 'bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 border-emerald-500/30 text-emerald-50';
            case 'modern-cyber':
                return 'bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-900 border-cyan-500/40 text-cyan-50';
            case 'celebration-spark':
                return 'bg-gradient-to-br from-fuchsia-950 via-purple-950 to-amber-950 border-fuchsia-500/30 text-fuchsia-50';
            case 'vibrant-gradient':
                return 'bg-gradient-to-br from-amber-700 via-rose-800 to-purple-900 border-amber-300/40 text-white';
            case 'clean-minimal':
                return isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-100'
                    : 'bg-gradient-to-br from-slate-50 via-amber-50/30 to-blue-50/30 border-slate-200 text-slate-900';
            default:
                return 'bg-gradient-to-br from-amber-950 via-slate-950 to-amber-900 border-amber-500/40 text-amber-50';
        }
    };

    const getBadgeStyle = () => {
        switch (type) {
            case 'birthday':
                return {
                    label: 'BIRTHDAY CELEBRATION',
                    icon: Cake,
                    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
                };
            case 'award':
                return {
                    label: 'HONOR & RECOGNITION',
                    icon: Trophy,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                };
            case 'publication':
                return {
                    label: 'NOTABLE RESEARCH PUBLICATION',
                    icon: BookOpen,
                    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
                };
            case 'certification':
                return {
                    label: 'PROFESSIONAL CERTIFICATION',
                    icon: ShieldCheck,
                    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                };
            case 'promotion':
                return {
                    label: 'FACULTY PROMOTION & ADVANCEMENT',
                    icon: Sparkles,
                    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                };
            case 'welcome':
                return {
                    label: 'WARM WELCOME TO CIDS',
                    icon: HeartHandshake,
                    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
                };
            case 'farewell':
                return {
                    label: 'APPRECIATION & FAREWELL',
                    icon: Star,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                };
            default:
                return {
                    label: 'FACULTY & PROGRAM SPOTLIGHT',
                    icon: Award,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                };
        }
    };

    const badge = getBadgeStyle();
    const BadgeIcon = badge.icon;

    // Font size controls
    const headlineSizeClass = textSize === 'large'
        ? (isPreview ? 'text-xl lg:text-2xl font-black' : 'text-3xl md:text-5xl lg:text-6xl font-black tracking-tight')
        : textSize === 'compact'
            ? (isPreview ? 'text-sm lg:text-base font-extrabold' : 'text-2xl md:text-3xl lg:text-4xl font-black tracking-tight')
            : (isPreview ? 'text-base lg:text-xl font-black' : 'text-2xl md:text-4xl lg:text-5xl font-black tracking-tight');

    const messageSizeClass = textSize === 'large'
        ? (isPreview ? 'text-[11px] leading-relaxed' : 'text-base md:text-xl lg:text-2xl font-medium leading-relaxed')
        : textSize === 'compact'
            ? (isPreview ? 'text-[9px] leading-tight' : 'text-xs md:text-sm lg:text-base leading-relaxed')
            : (isPreview ? 'text-[10px] leading-snug' : 'text-sm md:text-lg lg:text-xl leading-relaxed');

    const formattedEventDate = slide.event_date ? (() => {
        try {
            const d = new Date(slide.event_date);
            return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return slide.event_date;
        }
    })() : null;

    // Check collage photos list
    const collagePhotosList: CollagePhotoItem[] = slide.effective_collage_photos && slide.effective_collage_photos.length > 0
        ? slide.effective_collage_photos
        : (slide.collage_photos && slide.collage_photos.length > 0)
            ? slide.collage_photos
            : [];

    const isCollage = subjectType === 'collage' || (collagePhotosList.length > 0 && subjectType !== 'individual');
    // Check if wide group photo layout or multiple honorees layout
    const isGroupPhoto = !isCollage && (subjectType === 'group_photo' || (subjectType === 'team' && groupPhotoUrl));
    const isMultiHonoree = !isCollage && !isGroupPhoto && (subjectType === 'multiple' || honoreesList.length > 1);

    const collageStyle = slide.collage_style || '3_grid';

    return (
        <div
            className={`relative w-full h-full rounded-2xl md:rounded-3xl border overflow-hidden shadow-2xl flex flex-col justify-between ${getBgClasses()} ${
                isPreview ? 'p-3 md:p-5' : 'p-6 md:p-10 lg:p-12'
            }`}
        >
            {/* Animated Celebration FX (Confetti, Balloons, Trophies, Medals, Sparkles, Applause) */}
            <CelebrationEffects type={animEffect} isPreview={isPreview} />

            {/* Ambient Background Decorative Glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Spotlight Pill + Subject Count Badge + College Branding */}
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-wider uppercase border backdrop-blur-md shadow-xs ${badge.badgeClass}`}>
                        <BadgeIcon className="w-3.5 h-3.5 animate-bounce shrink-0" />
                        <span>{badge.label}</span>
                    </span>

                    {/* Subject Model Tag */}
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                        {isCollage ? (
                            <>
                                <Sparkles className="w-3 h-3 text-fuchsia-300" />
                                <span>Celebration Collage ({collagePhotosList.length} Photos)</span>
                            </>
                        ) : isGroupPhoto ? (
                            <>
                                <ImageIcon className="w-3 h-3 text-amber-300" />
                                <span>Group Photo</span>
                            </>
                        ) : isMultiHonoree ? (
                            <>
                                <Users2 className="w-3 h-3 text-cyan-300" />
                                <span>{honoreesList.length} Honorees</span>
                            </>
                        ) : (
                            <>
                                <GraduationCap className="w-3 h-3 text-amber-300" />
                                <span>Individual</span>
                            </>
                        )}
                    </span>

                    {slide.priority && slide.priority > 1 && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            Featured Takeover
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-right">
                    <div className="hidden sm:block">
                        <div className="text-[11px] font-black tracking-wider uppercase opacity-90">
                            Office of the Dean & Faculty Affairs
                        </div>
                        <div className="text-[9px] font-medium opacity-60 tracking-wider uppercase">
                            College of Information and Communications Studies
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs text-amber-300 shadow-xs">
                        CIDS
                    </div>
                </div>
            </div>

            {/* Central Hero Body - Switches adaptively based on Subject Type and Layout */}
            <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0 py-2">
                {/* MODE D: Celebration Collage (2 to 6 Event Photos) */}
                {isCollage ? (
                    <div className="flex flex-col h-full justify-between gap-2.5">
                        {/* Top Section: Headline & Commendation */}
                        <div className="text-center max-w-4xl mx-auto shrink-0">
                            <h1 className={`${headlineSizeClass} leading-tight text-white drop-shadow-sm mb-1`}>
                                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                                    {slide.headline}
                                </span>
                            </h1>
                            <p className={`${messageSizeClass} text-white/90 max-w-2xl mx-auto font-light line-clamp-2`}>
                                {slide.message}
                            </p>
                        </div>

                        {/* Collage Images Container based on collageStyle */}
                        <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full max-w-5xl mx-auto">
                            {collageStyle === '2_split' ? (
                                <div className="grid grid-cols-2 gap-3 md:gap-5 w-full h-[180px] md:h-[260px]">
                                    {(collagePhotosList.length > 0 ? collagePhotosList.slice(0, 2) : [null, null]).map((photo, idx) => (
                                        <div key={idx} className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900/80 shadow-2xl group flex items-center justify-center">
                                            {photo?.url ? (
                                                <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className={`w-full h-full ${photo.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-3 text-white/40">
                                                    <ImageIcon className="w-8 h-8 mb-1 text-amber-300/40" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Photo #{idx + 1}</span>
                                                </div>
                                            )}
                                            {photo?.caption && (
                                                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-200 border border-white/10 truncate font-semibold">
                                                    {photo.caption}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : collageStyle === '3_grid' ? (
                                <div className="grid grid-cols-3 gap-2.5 md:gap-4 w-full h-[180px] md:h-[260px]">
                                    {(collagePhotosList.length > 0 ? collagePhotosList.slice(0, 3) : [null, null, null]).map((photo, idx) => (
                                        <div key={idx} className={`relative rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900/80 shadow-2xl flex items-center justify-center ${idx === 0 ? 'ring-2 ring-amber-400/50' : ''}`}>
                                            {photo?.url ? (
                                                <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className={`w-full h-full ${photo.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-3 text-white/40">
                                                    <ImageIcon className="w-8 h-8 mb-1 text-amber-300/40" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Photo #{idx + 1}</span>
                                                </div>
                                            )}
                                            {photo?.caption && (
                                                <div className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md text-[9px] text-amber-200 border border-white/10 truncate font-medium">
                                                    {photo.caption}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : collageStyle === '4_grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3.5 w-full h-[180px] md:h-[260px]">
                                    {(collagePhotosList.length > 0 ? collagePhotosList.slice(0, 4) : [null, null, null, null]).map((photo, idx) => (
                                        <div key={idx} className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900/80 shadow-2xl flex items-center justify-center">
                                            {photo?.url ? (
                                                <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className={`w-full h-full ${photo.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-2 text-white/40">
                                                    <ImageIcon className="w-6 h-6 mb-1 text-amber-300/40" />
                                                    <span className="text-[9px] uppercase font-bold tracking-wider">Photo #{idx + 1}</span>
                                                </div>
                                            )}
                                            {photo?.caption && (
                                                <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-slate-950/85 text-[9px] text-amber-200 border border-white/10 truncate">
                                                    {photo.caption}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* 1 Large Hero + Supporting Thumbnails */
                                <div className="flex flex-col sm:flex-row gap-3 w-full h-[190px] md:h-[270px]">
                                    {/* Primary Hero image */}
                                    <div className="flex-1 sm:w-2/3 h-full relative rounded-2xl overflow-hidden border-2 border-amber-300/60 bg-slate-900/90 shadow-2xl flex items-center justify-center">
                                        {(collagePhotosList[0]?.url) ? (
                                            <img
                                                src={collagePhotosList[0].url}
                                                alt={collagePhotosList[0]?.caption || 'Hero celebration photo'}
                                                className={`w-full h-full ${collagePhotosList[0].fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-4 text-white/50">
                                                <ImageIcon className="w-10 h-10 mb-1 text-amber-300/60" />
                                                <span className="text-xs uppercase font-bold tracking-wider text-amber-200">Primary Hero Photo</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                                            Primary Visual
                                        </div>
                                        {collagePhotosList[0]?.caption && (
                                            <div className="absolute bottom-2 left-2 right-2 px-3 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-[10px] text-amber-200 border border-white/10 truncate font-semibold">
                                                {collagePhotosList[0].caption}
                                            </div>
                                        )}
                                    </div>

                                    {/* Supporting Thumbnails Strip */}
                                    <div className="sm:w-1/3 flex sm:flex-col gap-2 h-full overflow-hidden">
                                        {(collagePhotosList.length > 1 ? collagePhotosList.slice(1, 4) : [null, null]).map((photo, idx) => (
                                            <div key={idx} className="flex-1 relative rounded-xl overflow-hidden border border-white/20 bg-slate-900/80 shadow flex items-center justify-center">
                                                {photo?.url ? (
                                                    <img src={photo.url} alt={photo.caption || `Thumbnail ${idx + 1}`} className={`w-full h-full ${photo.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-center p-1 text-white/40">
                                                        <ImageIcon className="w-4 h-4 text-amber-300/40" />
                                                        <span className="text-[8px] uppercase tracking-wider font-bold">Photo #{idx + 2}</span>
                                                    </div>
                                                )}
                                                {photo?.caption && (
                                                    <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.2 rounded bg-slate-950/85 text-[8px] text-white/90 truncate">
                                                        {photo.caption}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Metadata bar */}
                        {(slide.event_title || slide.awarding_organization || formattedEventDate) && (
                            <div className="flex items-center justify-center gap-4 text-center pt-2 border-t border-white/10 text-[10px] md:text-xs text-amber-200/90 shrink-0">
                                {slide.event_title && <span><strong>Concurrence:</strong> {slide.event_title}</span>}
                                {slide.awarding_organization && <span>• <strong>Organization:</strong> {slide.awarding_organization}</span>}
                                {formattedEventDate && <span>• <strong>Date:</strong> {formattedEventDate}</span>}
                            </div>
                        )}
                    </div>
                ) : isGroupPhoto ? (
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 h-full">
                        {/* Group Photo Display */}
                        <div className="w-full md:w-1/2 h-44 sm:h-56 md:h-full relative rounded-2xl overflow-hidden border-2 border-amber-300/40 shadow-2xl bg-slate-950 shrink-0">
                            {groupPhotoUrl ? (
                                <img
                                    src={groupPhotoUrl}
                                    alt="Recognition Group"
                                    className={`w-full h-full ${
                                        slide.group_photo_fit === 'contain' ? 'object-contain' : 'object-cover'
                                    } ${
                                        slide.group_photo_focal === 'top' ? 'object-top' : slide.group_photo_focal === 'bottom' ? 'object-bottom' : 'object-center'
                                    }`}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                    <Users className="w-12 h-12 text-amber-300/50 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70">Group / Team Photo</span>
                                </div>
                            )}

                            {slide.group_photo_overlay && (
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                            )}

                            <div className="absolute bottom-2.5 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-300/40 text-[10px] font-bold text-amber-300 backdrop-blur-md flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                <span>{honoreeName || 'Honored Team'}</span>
                            </div>
                        </div>

                        {/* Text and Recognition Details for Group */}
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                            <h1 className={`${headlineSizeClass} leading-tight text-white drop-shadow-sm mb-2`}>
                                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                                    {slide.headline}
                                </span>
                            </h1>

                            {/* Commendation message */}
                            <p className={`${messageSizeClass} text-white/90 font-light drop-shadow-xs mb-3 line-clamp-4`}>
                                {slide.message}
                            </p>

                            {/* Honorees list or tags if defined */}
                            {honoreesList.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300/80 mb-1.5">Honored Members</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {honoreesList.map((h, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] md:text-xs font-semibold border border-white/15">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <span>{h.name}</span>
                                                {h.program && <span className="text-amber-200/60 font-normal">({h.program})</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            {(slide.event_title || slide.awarding_organization || formattedEventDate) && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
                                    {slide.event_title && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Event / Milestone</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{slide.event_title}</div>
                                        </div>
                                    )}
                                    {slide.awarding_organization && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Organization</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{slide.awarding_organization}</div>
                                        </div>
                                    )}
                                    {formattedEventDate && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5 col-span-2 sm:col-span-1">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Date</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{formattedEventDate}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : isMultiHonoree ? (
                    /* MODE B: Multi-Person Grid / Mosaic (2 to 6 people) */
                    <div className="flex flex-col h-full justify-between gap-3">
                        {/* Top Section: Headline & Commendation */}
                        <div className="text-center max-w-4xl mx-auto">
                            <h1 className={`${headlineSizeClass} leading-tight text-white drop-shadow-sm mb-1`}>
                                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                                    {slide.headline}
                                </span>
                            </h1>
                            <p className={`${messageSizeClass} text-white/90 max-w-2xl mx-auto font-light line-clamp-2`}>
                                {slide.message}
                            </p>
                        </div>

                        {/* Cards Row/Grid for 2, 3, 4, 5, or 6 honorees */}
                        <div className={`grid gap-2.5 md:gap-4 my-auto ${
                            honoreesList.length === 2
                                ? 'grid-cols-2 max-w-2xl mx-auto'
                                : honoreesList.length === 3
                                    ? 'grid-cols-3 max-w-4xl mx-auto'
                                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-5xl mx-auto'
                        }`}>
                            {honoreesList.map((honoree, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center p-2.5 md:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-center"
                                >
                                    <div className="relative mb-2">
                                        <div className={`${
                                            honoreesList.length <= 2
                                                ? (isPreview ? 'w-16 h-16' : 'w-28 h-28 md:w-36 md:h-36')
                                                : honoreesList.length === 3
                                                    ? (isPreview ? 'w-12 h-12' : 'w-24 h-24 md:w-28 md:h-28')
                                                    : (isPreview ? 'w-10 h-10' : 'w-16 h-16 md:w-20 md:h-20')
                                        } rounded-2xl bg-slate-900 border-2 border-amber-300/60 overflow-hidden shadow-lg flex items-center justify-center`}>
                                            {honoree.photo_url ? (
                                                <img src={honoree.photo_url} alt={honoree.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <GraduationCap className="w-6 h-6 text-amber-300/60" />
                                            )}
                                        </div>
                                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="text-[11px] md:text-sm font-bold text-white truncate max-w-full">
                                        {honoree.name}
                                    </div>
                                    <div className="text-[9px] md:text-xs text-amber-200/80 truncate max-w-full">
                                        {honoree.title || honoree.program || 'Faculty'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Metadata bar */}
                        {(slide.event_title || slide.awarding_organization || formattedEventDate) && (
                            <div className="flex items-center justify-center gap-4 text-center pt-2 border-t border-white/10 text-[10px] md:text-xs text-amber-200/90">
                                {slide.event_title && <span><strong>Concurrence:</strong> {slide.event_title}</span>}
                                {slide.awarding_organization && <span>• <strong>Organization:</strong> {slide.awarding_organization}</span>}
                                {formattedEventDate && <span>• <strong>Date:</strong> {formattedEventDate}</span>}
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODE C: Hero Single-Person Portrait (Portrait Left, Portrait Right, Academic Hero, Minimal) */
                    <div className={`flex flex-col md:flex-row items-center gap-6 md:gap-10 my-auto ${
                        template === 'portrait-right' ? 'md:flex-row-reverse' : ''
                    } ${
                        slide.layout_mode === 'centered-portrait' || template === 'centered-celebration' ? 'md:flex-col text-center justify-center' : ''
                    }`}>
                        {/* Portrait Container */}
                        <div className="shrink-0 flex flex-col items-center">
                            <div className="relative group">
                                <div className="absolute -inset-2 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
                                
                                <div className={`${
                                    isPreview ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64'
                                } rounded-2xl md:rounded-[2rem] bg-slate-900 border-2 border-amber-300/60 overflow-hidden shadow-2xl flex items-center justify-center relative`}>
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={honoreeName}
                                            className="w-full h-full object-cover object-center"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-3">
                                            <GraduationCap className="w-12 h-12 text-amber-400/80 mb-1" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/70">Faculty Honoree</span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] md:text-xs uppercase tracking-wider shadow-lg border border-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                                    {isBirthday ? <PartyPopper className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                                    <span>{isBirthday ? 'Happy Birthday!' : 'Distinguished Honoree'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Text Message & Metadata */}
                        <div className={`flex-1 flex flex-col justify-center min-w-0 ${
                            alignment === 'center' || template === 'centered-celebration' ? 'items-center text-center' : alignment === 'right' ? 'items-end text-right' : 'items-start text-left'
                        }`}>
                            <h1 className={`${headlineSizeClass} leading-tight text-white drop-shadow-sm mb-2`}>
                                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                                    {slide.headline}
                                </span>
                            </h1>

                            <div className="mb-3 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                                <div>
                                    <div className="text-xs md:text-base font-bold text-white tracking-wide">
                                        {honoreeName}
                                    </div>
                                    <div className="text-[10px] md:text-xs font-medium text-amber-200/80">
                                        {honoreeTitle} {programOrDept ? `• ${programOrDept}` : ''}
                                    </div>
                                </div>
                            </div>

                            <p className={`${messageSizeClass} text-white/90 max-w-3xl font-light drop-shadow-xs mb-3 line-clamp-4`}>
                                {slide.message}
                            </p>

                            {/* Supporting Context Media (e.g. Certificate, trophy photo, conference badge) */}
                            {slide.supporting_media && slide.supporting_media.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[9px] font-bold uppercase text-amber-300 tracking-wider">Supporting Proof:</span>
                                    {slide.supporting_media.slice(0, 2).map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-[9px] text-white">
                                            <ImageIcon className="w-3 h-3 text-amber-300" />
                                            <span className="truncate max-w-[120px]">{m.caption || m.name || 'Event photo'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Metadata */}
                            {(slide.event_title || slide.awarding_organization || formattedEventDate) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-3xl pt-2 border-t border-white/10">
                                    {slide.event_title && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Recognition / Event</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{slide.event_title}</div>
                                        </div>
                                    )}

                                    {slide.awarding_organization && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Conferred By</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{slide.awarding_organization}</div>
                                        </div>
                                    )}

                                    {formattedEventDate && (
                                        <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">Date of Concurrence</div>
                                            <div className="text-[11px] font-semibold text-white truncate">{formattedEventDate}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Footer: University / Department Pride Seal & Greetings */}
            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-[10px] md:text-xs text-white/70 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">CIDS Celebrates Excellence & Milestones</span>
                </div>

                <div className="text-[10px] font-medium tracking-wider uppercase text-amber-200/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>OfficeHub Spotlight Experience</span>
                </div>
            </div>
        </div>
    );
}
