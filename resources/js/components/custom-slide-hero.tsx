import React from 'react';
import {
    Table,
    FileText,
    List,
    ListOrdered,
    QrCode,
    AlertCircle,
    Info,
    CheckCircle2,
    Calendar,
    Clock,
    User,
    Tag,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';

export interface ManualTableColumn {
    id: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
}

export interface ManualTableRow {
    id: string;
    cells: Record<string, string>;
    isHighlighted?: boolean;
    badge?: string;
}

export interface ManualTableData {
    columns: ManualTableColumn[];
    rows: ManualTableRow[];
    rowDensity?: 'compact' | 'normal' | 'spacious';
    tableStyle?: 'striped' | 'bordered' | 'cards' | 'clean';
    fontSize?: 'sm' | 'base' | 'lg';
    highlightToday?: boolean;
}

export interface BulletListData {
    items: string[];
    style?: 'disc' | 'check' | 'chevron' | 'star';
    fontSize?: 'sm' | 'base' | 'lg';
}

export interface NumberedListData {
    items: string[];
    style?: 'decimal' | 'badge' | 'roman';
    fontSize?: 'sm' | 'base' | 'lg';
}

export interface CalloutBoxData {
    title?: string;
    content: string;
    type?: 'info' | 'warning' | 'success' | 'urgent';
    icon?: string;
}

export interface ContentBlock {
    id: string;
    type: 'heading' | 'text' | 'table' | 'bullet_list' | 'numbered_list' | 'callout' | 'image' | 'qr_code' | 'divider';
    title?: string;
    content?: string;
    tableData?: ManualTableData;
    bulletListData?: BulletListData;
    numberedListData?: NumberedListData;
    calloutData?: CalloutBoxData;
    imageUrl?: string;
    imageFit?: 'cover' | 'contain' | 'fill';
    qrUrl?: string;
    qrLabel?: string;
    align?: 'left' | 'center' | 'right';
    slot?: 'main' | 'sidebar' | 'column1' | 'column2';
}

export interface CustomContentSlideData {
    id?: number;
    title: string;
    subtitle?: string | null;
    badge?: string | null;
    layout: 'blank' | 'title_table' | 'bulletin' | 'two_column' | 'image_text' | 'qr_instructions' | 'full_image';
    theme: string;
    header_alignment: 'left' | 'center';
    content_blocks?: ContentBlock[];
    primary_image_path?: string | null;
    primary_image_url?: string | null;
    primary_image_fit?: 'cover' | 'contain' | 'fill';
    qr_url?: string | null;
    qr_label?: string | null;
    duration_seconds?: number;
    playlist?: string;
    priority?: number;
    fullscreen_takeover?: boolean;
    start_at?: string | null;
    end_at?: string | null;
    auto_expire?: boolean;
    status?: 'draft' | 'published' | 'expired' | 'archived';
    effective_status?: string;
    created_at?: string;
    creator?: { name: string };
}

interface Props {
    slide: CustomContentSlideData;
    isPreview?: boolean;
    isDark?: boolean;
}

export const CUSTOM_THEMES: Record<string, {
    bg: string;
    cardBg: string;
    border: string;
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    titleColor: string;
    subtitleColor: string;
    accentColor: string;
    tableHeaderBg: string;
    tableHeaderColor: string;
    tableRowAlt: string;
    tableHighlight: string;
}> = {
    'slate-clean': {
        bg: 'bg-slate-900',
        cardBg: 'bg-slate-800/80 backdrop-blur-md',
        border: 'border-slate-700/60',
        headerBg: 'bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80',
        badgeBg: 'bg-blue-500/20 border border-blue-400/40',
        badgeText: 'text-blue-300',
        titleColor: 'text-white',
        subtitleColor: 'text-slate-300',
        accentColor: 'text-blue-400',
        tableHeaderBg: 'bg-slate-950/90',
        tableHeaderColor: 'text-slate-200',
        tableRowAlt: 'bg-slate-800/40',
        tableHighlight: 'bg-blue-500/15 border-l-4 border-l-blue-400',
    },
    'navy-professional': {
        bg: 'bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950',
        cardBg: 'bg-sky-950/60 backdrop-blur-md',
        border: 'border-sky-800/50',
        headerBg: 'bg-sky-950/90',
        badgeBg: 'bg-sky-500/20 border border-sky-400/40',
        badgeText: 'text-sky-300',
        titleColor: 'text-white',
        subtitleColor: 'text-sky-200/90',
        accentColor: 'text-sky-400',
        tableHeaderBg: 'bg-sky-950',
        tableHeaderColor: 'text-sky-100',
        tableRowAlt: 'bg-sky-900/25',
        tableHighlight: 'bg-sky-500/20 border-l-4 border-l-sky-400',
    },
    'emerald-accent': {
        bg: 'bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-900',
        cardBg: 'bg-emerald-950/50 backdrop-blur-md',
        border: 'border-emerald-800/50',
        headerBg: 'bg-emerald-950/90',
        badgeBg: 'bg-emerald-500/20 border border-emerald-400/40',
        badgeText: 'text-emerald-300',
        titleColor: 'text-white',
        subtitleColor: 'text-emerald-100/90',
        accentColor: 'text-emerald-400',
        tableHeaderBg: 'bg-emerald-950',
        tableHeaderColor: 'text-emerald-200',
        tableRowAlt: 'bg-emerald-900/20',
        tableHighlight: 'bg-emerald-500/20 border-l-4 border-l-emerald-400',
    },
    'amber-warm': {
        bg: 'bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950/60',
        cardBg: 'bg-stone-900/80 backdrop-blur-md',
        border: 'border-amber-800/40',
        headerBg: 'bg-stone-950/90',
        badgeBg: 'bg-amber-500/20 border border-amber-400/40',
        badgeText: 'text-amber-300',
        titleColor: 'text-white',
        subtitleColor: 'text-amber-100/90',
        accentColor: 'text-amber-400',
        tableHeaderBg: 'bg-stone-950',
        tableHeaderColor: 'text-amber-200',
        tableRowAlt: 'bg-stone-800/30',
        tableHighlight: 'bg-amber-500/20 border-l-4 border-l-amber-400',
    },
    'ruby-urgent': {
        bg: 'bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-950',
        cardBg: 'bg-rose-950/50 backdrop-blur-md',
        border: 'border-rose-800/50',
        headerBg: 'bg-rose-950/90',
        badgeBg: 'bg-rose-500/25 border border-rose-400/40',
        badgeText: 'text-rose-200',
        titleColor: 'text-white',
        subtitleColor: 'text-rose-100/90',
        accentColor: 'text-rose-400',
        tableHeaderBg: 'bg-rose-950',
        tableHeaderColor: 'text-rose-200',
        tableRowAlt: 'bg-rose-900/20',
        tableHighlight: 'bg-rose-500/25 border-l-4 border-l-rose-400',
    },
    'dark-modern': {
        bg: 'bg-zinc-950',
        cardBg: 'bg-zinc-900/90 backdrop-blur-md',
        border: 'border-zinc-800',
        headerBg: 'bg-zinc-950',
        badgeBg: 'bg-zinc-800 border border-zinc-700',
        badgeText: 'text-zinc-300',
        titleColor: 'text-white',
        subtitleColor: 'text-zinc-400',
        accentColor: 'text-cyan-400',
        tableHeaderBg: 'bg-zinc-900',
        tableHeaderColor: 'text-zinc-200',
        tableRowAlt: 'bg-zinc-850/40',
        tableHighlight: 'bg-cyan-500/15 border-l-4 border-l-cyan-400',
    },
};

export function CustomContentSlideHero({ slide, isPreview = false, isDark = true }: Props) {
    const theme = CUSTOM_THEMES[slide.theme] || CUSTOM_THEMES['slate-clean'];
    const blocks = slide.content_blocks || [];

    // Helper to render individual content block
    const renderBlock = (b: ContentBlock, idx: number) => {
        switch (b.type) {
            case 'heading':
                return (
                    <div key={b.id || idx} className="my-2">
                        <h3 className={`font-bold tracking-tight text-white ${
                            b.align === 'center' ? 'text-center' : b.align === 'right' ? 'text-right' : 'text-left'
                        } ${isPreview ? 'text-base' : 'text-2xl'}`}>
                            {b.title || b.content}
                        </h3>
                    </div>
                );

            case 'text':
                return (
                    <div key={b.id || idx} className="my-1.5">
                        <p className={`text-slate-300 leading-relaxed ${
                            b.align === 'center' ? 'text-center' : b.align === 'right' ? 'text-right' : 'text-left'
                        } ${isPreview ? 'text-xs' : 'text-lg'}`}>
                            {b.content}
                        </p>
                    </div>
                );

            case 'table':
                if (!b.tableData || !b.tableData.columns || b.tableData.columns.length === 0) {
                    return null;
                }
                const cols = b.tableData.columns;
                const rows = b.tableData.rows || [];
                const density = b.tableData.rowDensity || 'normal';
                const paddingY = density === 'compact' ? 'py-1.5' : density === 'spacious' ? 'py-3.5' : 'py-2.5';
                const fSize = b.tableData.fontSize === 'sm' ? 'text-xs' : b.tableData.fontSize === 'lg' ? 'text-base' : 'text-sm';

                return (
                    <div key={b.id || idx} className="my-2 overflow-hidden rounded-xl border border-slate-700/60 shadow-lg">
                        {b.title && (
                            <div className="bg-slate-900/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-700/50">
                                {b.title}
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`${theme.tableHeaderBg} border-b border-slate-700/80`}>
                                    {cols.map((col) => (
                                        <th
                                            key={col.id}
                                            style={{ width: col.width || 'auto' }}
                                            className={`px-4 py-2.5 font-bold uppercase tracking-wider text-[11px] ${theme.tableHeaderColor} ${
                                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                            }`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/40">
                                {rows.map((row, rIdx) => {
                                    const isAlt = rIdx % 2 === 1;
                                    const highlightClass = row.isHighlighted ? theme.tableHighlight : (isAlt ? theme.tableRowAlt : 'bg-transparent');
                                    return (
                                        <tr key={row.id || rIdx} className={`${highlightClass} transition-colors`}>
                                            {cols.map((col) => (
                                                <td
                                                    key={col.id}
                                                    className={`px-4 ${paddingY} ${fSize} text-slate-200 ${
                                                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                                >
                                                    {row.cells[col.id] ?? '—'}
                                                    {row.badge && col.id === cols[0].id && (
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                                            {row.badge}
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );

            case 'bullet_list':
                const bItems = b.bulletListData?.items || [];
                return (
                    <div key={b.id || idx} className="my-2">
                        {b.title && <div className="font-bold text-white text-sm mb-1.5">{b.title}</div>}
                        <ul className="space-y-1.5">
                            {bItems.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-2.5 text-slate-200 text-sm">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );

            case 'numbered_list':
                const nItems = b.numberedListData?.items || [];
                return (
                    <div key={b.id || idx} className="my-2">
                        {b.title && <div className="font-bold text-white text-sm mb-1.5">{b.title}</div>}
                        <ol className="space-y-2">
                            {nItems.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-3 text-slate-200 text-sm">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/40 text-[11px] font-bold text-blue-300">
                                        {iIdx + 1}
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                );

            case 'callout':
                const cType = b.calloutData?.type || 'info';
                const cBg = cType === 'warning'
                    ? 'bg-amber-950/50 border-amber-700/60 text-amber-200'
                    : cType === 'urgent'
                    ? 'bg-rose-950/60 border-rose-700/60 text-rose-100'
                    : cType === 'success'
                    ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                    : 'bg-blue-950/50 border-blue-700/60 text-blue-200';

                return (
                    <div key={b.id || idx} className={`my-2 p-3.5 rounded-xl border ${cBg} flex items-start gap-3 shadow-md`}>
                        {cType === 'warning' ? <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" /> :
                         cType === 'urgent' ? <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" /> :
                         cType === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" /> :
                         <Info className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />}
                        <div className="flex-1">
                            {b.calloutData?.title && (
                                <h4 className="font-bold text-sm tracking-tight mb-0.5 text-white">
                                    {b.calloutData.title}
                                </h4>
                            )}
                            <p className="text-xs leading-relaxed opacity-90">
                                {b.calloutData?.content || b.content}
                            </p>
                        </div>
                    </div>
                );

            case 'image':
                const imgFit = b.imageFit || 'cover';
                return (
                    <div key={b.id || idx} className="my-2 overflow-hidden rounded-xl border border-slate-700/60 shadow-lg">
                        {b.imageUrl ? (
                            <img
                                src={b.imageUrl}
                                alt={b.title || 'Manual Slide Asset'}
                                className={`w-full max-h-64 ${
                                    imgFit === 'contain' ? 'object-contain bg-black/40' : imgFit === 'fill' ? 'object-fill' : 'object-cover'
                                }`}
                            />
                        ) : (
                            <div className="h-40 bg-slate-800/60 flex items-center justify-center text-slate-400 text-xs gap-2">
                                <ImageIcon className="w-6 h-6" />
                                <span>No Image Uploaded</span>
                            </div>
                        )}
                        {b.title && (
                            <div className="bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 border-t border-slate-700/40">
                                {b.title}
                            </div>
                        )}
                    </div>
                );

            case 'qr_code':
                const qrTarget = b.qrUrl || slide.qr_url;
                return (
                    <div key={b.id || idx} className="my-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shrink-0 shadow-md">
                            {qrTarget ? (
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrTarget)}`}
                                    alt="QR Code"
                                    className="w-16 h-16"
                                />
                            ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-slate-100 text-slate-400">
                                    <QrCode className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Scan For Details</div>
                            <div className="text-sm font-semibold text-white mt-0.5">{b.qrLabel || slide.qr_label || 'Scan with your smartphone'}</div>
                            {qrTarget && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[280px] mt-1 font-mono">
                                    {qrTarget}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'divider':
                return <div key={b.id || idx} className="my-3 border-t border-slate-700/60" />;

            default:
                return null;
        }
    };

    // Full Image layout mode
    if (slide.layout === 'full_image') {
        const fullImg = slide.primary_image_url || slide.primary_image_path;
        return (
            <div className={`relative w-full h-full ${theme.bg} overflow-hidden flex flex-col items-center justify-center select-none`}>
                {fullImg ? (
                    <img
                        src={fullImg}
                        alt={slide.title}
                        className={`w-full h-full ${
                            slide.primary_image_fit === 'contain' ? 'object-contain' : slide.primary_image_fit === 'fill' ? 'object-fill' : 'object-cover'
                        }`}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <ImageIcon className="w-16 h-16 mb-3 text-slate-600 animate-pulse" />
                        <h3 className="text-xl font-bold text-white">{slide.title}</h3>
                        <p className="text-sm mt-1 text-slate-400">Full Image Layout — Upload a high-resolution 16:9 poster or image.</p>
                    </div>
                )}
                {/* Floating caption overlay */}
                <div className="absolute bottom-4 left-6 right-6 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                        {slide.badge && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 mr-2">
                                {slide.badge}
                            </span>
                        )}
                        <span className="font-bold text-white text-base">{slide.title}</span>
                        {slide.subtitle && <span className="text-xs text-slate-300 ml-2">· {slide.subtitle}</span>}
                    </div>
                    {slide.qr_url && (
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(slide.qr_url)}`}
                                alt="QR"
                                className="w-8 h-8"
                            />
                            <span className="text-[10px] font-bold text-slate-900 uppercase">Scan Info</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Two-Column Layout
    if (slide.layout === 'two_column') {
        const col1Blocks = blocks.filter((b) => b.slot === 'column1' || !b.slot);
        const col2Blocks = blocks.filter((b) => b.slot === 'column2');

        return (
            <div className={`relative w-full h-full ${theme.bg} text-white flex flex-col p-6 sm:p-8 overflow-hidden select-none`}>
                {/* Header */}
                <header className={`shrink-0 mb-4 pb-3 border-b border-white/10 ${slide.header_alignment === 'center' ? 'text-center' : 'text-left'}`}>
                    <div className="flex items-center gap-3">
                        {slide.badge && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                                {slide.badge}
                            </span>
                        )}
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                            Manual Operational Notice
                        </span>
                    </div>
                    <h1 className={`font-black tracking-tight text-white mt-1 ${isPreview ? 'text-xl' : 'text-3xl lg:text-4xl'}`}>
                        {slide.title}
                    </h1>
                    {slide.subtitle && (
                        <p className={`mt-1 font-medium ${theme.subtitleColor} ${isPreview ? 'text-xs' : 'text-base'}`}>
                            {slide.subtitle}
                        </p>
                    )}
                </header>

                {/* Two Columns Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 min-h-0 overflow-y-auto">
                    <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>Section A</span>
                        </div>
                        {col1Blocks.map(renderBlock)}
                    </div>
                    <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                            <List className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Section B</span>
                        </div>
                        {col2Blocks.map(renderBlock)}
                    </div>
                </div>

                {/* Optional Footer Bar */}
                <footer className="shrink-0 mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Display Rotation: {slide.duration_seconds || 20}s</span>
                    </div>
                    {slide.qr_url && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <QrCode className="w-3.5 h-3.5 text-blue-400" />
                            <span>{slide.qr_label || 'Scan QR for details'}</span>
                        </div>
                    )}
                </footer>
            </div>
        );
    }

    // QR + Instructions Layout
    if (slide.layout === 'qr_instructions') {
        const qrTarget = slide.qr_url || 'https://cids.institution.edu';
        return (
            <div className={`relative w-full h-full ${theme.bg} text-white flex flex-col p-6 sm:p-8 overflow-hidden select-none`}>
                <header className="shrink-0 mb-4 pb-3 border-b border-white/10">
                    {slide.badge && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} mb-1.5`}>
                            {slide.badge}
                        </span>
                    )}
                    <h1 className={`font-black tracking-tight text-white ${isPreview ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}>
                        {slide.title}
                    </h1>
                    {slide.subtitle && (
                        <p className={`mt-1 font-medium ${theme.subtitleColor} ${isPreview ? 'text-xs' : 'text-base'}`}>
                            {slide.subtitle}
                        </p>
                    )}
                </header>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-0">
                    {/* Left: Prominent QR Code Hero */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrTarget)}`}
                                alt="QR Code"
                                className="w-44 h-44 object-contain"
                            />
                        </div>
                        <div className="mt-4 font-bold text-base text-white">{slide.qr_label || 'Scan with Camera'}</div>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Direct your smartphone camera at this code to access forms, rosters, or guidelines instantly.
                        </p>
                    </div>

                    {/* Right: Step-by-Step Instructions or Blocks */}
                    <div className="md:col-span-7 flex flex-col justify-center space-y-3 min-h-0 overflow-y-auto">
                        {blocks.length > 0 ? (
                            blocks.map(renderBlock)
                        ) : (
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                                    <div className="flex h-6 w-6 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs items-center justify-center shrink-0">1</div>
                                    <div>
                                        <div className="font-semibold text-sm text-white">Scan the QR code</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Use your mobile phone camera or QR reader app.</div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                                    <div className="flex h-6 w-6 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs items-center justify-center shrink-0">2</div>
                                    <div>
                                        <div className="font-semibold text-sm text-white">Follow On-Screen Instructions</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Submit your feedback, register attendance, or view documents.</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Image + Text Layout
    if (slide.layout === 'image_text') {
        const sideImg = slide.primary_image_url || slide.primary_image_path;
        return (
            <div className={`relative w-full h-full ${theme.bg} text-white flex flex-col p-6 sm:p-8 overflow-hidden select-none`}>
                <header className="shrink-0 mb-4 pb-3 border-b border-white/10">
                    {slide.badge && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} mb-1.5`}>
                            {slide.badge}
                        </span>
                    )}
                    <h1 className={`font-black tracking-tight text-white ${isPreview ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}>
                        {slide.title}
                    </h1>
                    {slide.subtitle && (
                        <p className={`mt-1 font-medium ${theme.subtitleColor} ${isPreview ? 'text-xs' : 'text-base'}`}>
                            {slide.subtitle}
                        </p>
                    )}
                </header>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-0">
                    <div className="md:col-span-5 h-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl">
                        {sideImg ? (
                            <img
                                src={sideImg}
                                alt={slide.title}
                                className={`w-full h-full ${
                                    slide.primary_image_fit === 'contain' ? 'object-contain' : 'object-cover'
                                }`}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400">
                                <ImageIcon className="w-12 h-12 mb-2 text-slate-600" />
                                <span className="text-xs">No primary image selected</span>
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-7 flex flex-col justify-center space-y-3 min-h-0 overflow-y-auto">
                        {blocks.map(renderBlock)}
                    </div>
                </div>
            </div>
        );
    }

    // Default: Title + Table, Bulletin, or Blank
    return (
        <div className={`relative w-full h-full ${theme.bg} text-white flex flex-col p-6 sm:p-8 overflow-hidden select-none`}>
            {/* Header */}
            <header className={`shrink-0 mb-4 pb-3 border-b border-white/10 ${slide.header_alignment === 'center' ? 'text-center' : 'text-left'}`}>
                <div className={`flex items-center gap-3 ${slide.header_alignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {slide.badge && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                            {slide.badge}
                        </span>
                    )}
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                        {slide.layout === 'title_table' ? 'Structured Schedule / Roster' :
                         slide.layout === 'bulletin' ? 'Office Bulletin Notice' : 'Custom Announcement'}
                    </span>
                </div>
                <h1 className={`font-black tracking-tight text-white mt-1 ${isPreview ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}>
                    {slide.title}
                </h1>
                {slide.subtitle && (
                    <p className={`mt-1 font-medium ${theme.subtitleColor} ${isPreview ? 'text-xs' : 'text-base'}`}>
                        {slide.subtitle}
                    </p>
                )}
            </header>

            {/* Content Region */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                {blocks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <FileText className="w-12 h-12 mb-2 text-slate-600" />
                        <h4 className="text-base font-semibold text-slate-300">No Content Blocks Added</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Add manual tables, lists, text blocks, or callouts in the editor to populate this slide.
                        </p>
                    </div>
                ) : (
                    blocks.map(renderBlock)
                )}
            </div>

            {/* Slide Footer */}
            <footer className="shrink-0 mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Duration: {slide.duration_seconds || 20}s</span>
                    </span>
                    {slide.creator && (
                        <span className="flex items-center gap-1.5 text-slate-400">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>By: {slide.creator.name}</span>
                        </span>
                    )}
                </div>
                {slide.qr_url && (
                    <div className="flex items-center gap-2 text-slate-300">
                        <QrCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>{slide.qr_label || 'Scan QR for details'}</span>
                    </div>
                )}
            </footer>
        </div>
    );
}
