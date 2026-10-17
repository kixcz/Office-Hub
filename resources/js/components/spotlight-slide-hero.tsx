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
    PartyPopper
} from 'lucide-react';

export interface SpotlightSlideData {
    id: number | string;
    type: string; // award, achievement, birthday, publication, certification, promotion, research, extension, welcome, farewell, custom
    headline: string;
    message: string;
    effective_honoree_name?: string;
    honoree_name?: string;
    honoree_title?: string;
    program_or_department?: string;
    effective_photo_url?: string | null;
    photo_path?: string | null;
    event_title?: string | null;
    awarding_organization?: string | null;
    event_date?: string | null;
    template?: string;
    background_style?: string; // royal-gold, midnight-prestige, velvet-maroon, emerald-excellence, modern-cyber, celebration-spark, vibrant-gradient, clean-minimal
    accent_style?: string;
    headline_alignment?: 'left' | 'center' | 'right';
    text_size?: 'compact' | 'normal' | 'large';
    layout_mode?: 'hero-split' | 'centered-portrait' | 'banner-card' | 'full-bleed';
    fullscreen_takeover?: boolean;
    display_duration?: number;
    transition?: string;
    status?: string;
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
    const honoreeName = slide.effective_honoree_name || slide.honoree_name || (slide.faculty?.full_name) || 'Distinguished Honoree';
    const honoreeTitle = slide.honoree_title || slide.faculty?.academic_rank || 'Faculty Member';
    const programOrDept = slide.program_or_department || slide.faculty?.program?.name || 'College of Information and Computing Sciences';
    const photoUrl = slide.effective_photo_url || slide.photo_path || slide.faculty?.photo_url || null;

    const bgStyle = slide.background_style || 'royal-gold';
    const alignment = slide.headline_alignment || 'left';
    const textSize = slide.text_size || 'normal';
    const type = slide.type || 'achievement';
    const isBirthday = type === 'birthday';

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
                    pillGlow: 'from-pink-500 to-rose-400'
                };
            case 'award':
                return {
                    label: 'HONOR & RECOGNITION',
                    icon: Trophy,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                    pillGlow: 'from-amber-400 to-yellow-300'
                };
            case 'publication':
                return {
                    label: 'NOTABLE RESEARCH PUBLICATION',
                    icon: BookOpen,
                    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
                    pillGlow: 'from-blue-400 to-cyan-300'
                };
            case 'certification':
                return {
                    label: 'PROFESSIONAL CERTIFICATION',
                    icon: ShieldCheck,
                    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                    pillGlow: 'from-emerald-400 to-teal-300'
                };
            case 'promotion':
                return {
                    label: 'FACULTY PROMOTION & ADVANCEMENT',
                    icon: Sparkles,
                    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                    pillGlow: 'from-purple-400 to-pink-300'
                };
            case 'welcome':
                return {
                    label: 'WARM WELCOME TO CIDS',
                    icon: HeartHandshake,
                    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
                    pillGlow: 'from-teal-400 to-emerald-300'
                };
            case 'farewell':
                return {
                    label: 'APPRECIATION & FAREWELL',
                    icon: Star,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                    pillGlow: 'from-amber-400 to-orange-300'
                };
            default:
                return {
                    label: 'FACULTY & PROGRAM SPOTLIGHT',
                    icon: Award,
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                    pillGlow: 'from-amber-400 to-yellow-300'
                };
        }
    };

    const badge = getBadgeStyle();
    const BadgeIcon = badge.icon;

    // Font size controls
    const headlineSizeClass = textSize === 'large'
        ? (isPreview ? 'text-2xl lg:text-3xl font-black' : 'text-3xl md:text-5xl lg:text-6xl font-black tracking-tight')
        : textSize === 'compact'
            ? (isPreview ? 'text-lg lg:text-xl font-extrabold' : 'text-2xl md:text-3xl lg:text-4xl font-black tracking-tight')
            : (isPreview ? 'text-xl lg:text-2xl font-black' : 'text-3xl md:text-4xl lg:text-5xl font-black tracking-tight');

    const messageSizeClass = textSize === 'large'
        ? (isPreview ? 'text-xs' : 'text-base md:text-xl lg:text-2xl font-medium leading-relaxed')
        : textSize === 'compact'
            ? (isPreview ? 'text-[10px]' : 'text-xs md:text-sm lg:text-base leading-relaxed')
            : (isPreview ? 'text-xs' : 'text-sm md:text-lg lg:text-xl leading-relaxed');

    return (
        <div
            className={`relative w-full h-full rounded-2xl md:rounded-3xl border overflow-hidden shadow-2xl flex flex-col justify-between ${getBgClasses()} ${
                isPreview ? 'p-4 md:p-6' : 'p-8 md:p-12 lg:p-14'
            }`}
        >
            {/* Ambient Background Decorative Glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle Celebration Confetti/Particles for Birthday or Award */}
            {isBirthday && (
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:24px_24px]" />
            )}

            {/* Top Bar: Spotlight Pill + Department / College Branding */}
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border backdrop-blur-md shadow-xs ${badge.badgeClass}`}>
                        <BadgeIcon className="w-4 h-4 animate-bounce" />
                        <span>{badge.label}</span>
                    </span>

                    {slide.priority && slide.priority > 1 && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            Featured Spotlight
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-right">
                    <div className="hidden sm:block">
                        <div className="text-xs font-black tracking-wider uppercase opacity-90">
                            Office of the Dean & Faculty Affairs
                        </div>
                        <div className="text-[10px] font-medium opacity-60 tracking-wider uppercase">
                            College of Information and Communications Studies
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs text-amber-300 shadow-xs">
                        CIDS
                    </div>
                </div>
            </div>

            {/* Central Hero Body: Split Screen (Honoree Portrait / Photo + Large Typography) */}
            <div className={`relative z-10 flex-1 flex flex-col md:flex-row items-center gap-6 md:gap-12 my-auto ${
                slide.layout_mode === 'centered-portrait' ? 'md:flex-col text-center justify-center' : ''
            }`}>
                {/* Left/Main Column: Honoree Portrait */}
                <div className="shrink-0 flex flex-col items-center">
                    <div className="relative group">
                        {/* Decorative Multi-Ring Halo */}
                        <div className="absolute -inset-2 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
                        
                        <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-2xl md:rounded-[2rem] bg-slate-900 border-2 border-amber-300/60 overflow-hidden shadow-2xl flex items-center justify-center">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={honoreeName}
                                    className="w-full h-full object-cover object-center"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                    <GraduationCap className="w-16 h-16 md:w-24 md:h-24 text-amber-400/80 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70">Faculty Honoree</span>
                                </div>
                            )}
                        </div>

                        {/* Special Ribbon Badge on Photo */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-wider shadow-lg border border-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                            {isBirthday ? <PartyPopper className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
                            <span>{isBirthday ? 'Happy Birthday!' : 'Honoree'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Hero Typographic Message & Details */}
                <div className={`flex-1 flex flex-col justify-center min-w-0 ${
                    alignment === 'center' ? 'items-center text-center' : alignment === 'right' ? 'items-end text-right' : 'items-start text-left'
                }`}>
                    {/* Primary Headline */}
                    <h1 className={`${headlineSizeClass} leading-tight text-white drop-shadow-sm mb-3`}>
                        <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                            {slide.headline}
                        </span>
                    </h1>

                    {/* Honoree Identity Card */}
                    <div className="mb-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                        <div>
                            <div className="text-sm md:text-xl font-bold text-white tracking-wide">
                                {honoreeName}
                            </div>
                            <div className="text-xs md:text-sm font-medium text-amber-200/80">
                                {honoreeTitle} {programOrDept ? `• ${programOrDept}` : ''}
                            </div>
                        </div>
                    </div>

                    {/* Main Celebratory / Commendation Message */}
                    <p className={`${messageSizeClass} text-white/90 max-w-3xl font-light drop-shadow-xs mb-4`}>
                        {slide.message}
                    </p>

                    {/* Metadata Grid (Award/Event Title, Awarding Org, Event Date) */}
                    {(slide.event_title || slide.awarding_organization || slide.event_date) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-3xl pt-3 border-t border-white/10">
                            {slide.event_title && (
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Recognition / Event</div>
                                    <div className="text-xs md:text-sm font-semibold text-white truncate">{slide.event_title}</div>
                                </div>
                            )}

                            {slide.awarding_organization && (
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Conferred By</div>
                                    <div className="text-xs md:text-sm font-semibold text-white truncate">{slide.awarding_organization}</div>
                                </div>
                            )}

                            {slide.event_date && (
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Date of Concurrence</div>
                                    <div className="text-xs md:text-sm font-semibold text-white truncate">{slide.event_date}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer: University / Department Pride Seal & Greetings */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/70">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">CIDS Celebrates Excellence & Faculty Milestones</span>
                </div>

                <div className="text-[11px] font-medium tracking-wider uppercase text-amber-200/80 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>OfficeHub TV Spotlight Experience</span>
                </div>
            </div>
        </div>
    );
}
