import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, FileText, Calendar, Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface IsoDocumentHeaderProps {
    institutionName?: string;
    collegeName?: string;
    documentTitle: string;
    documentCode: string;
    revisionNumber: string;
    effectiveDate?: string;
    recordReference?: string | null;
    status?: string;
    confidentiality?: string;
    academicPeriod?: string | null;
    className?: string;
}

export function IsoDocumentHeader({
    institutionName = 'DAVAO DEL SUR STATE COLLEGE',
    collegeName = 'COLLEGE OF INFORMATION AND DIGITAL SCIENCES',
    documentTitle,
    documentCode,
    revisionNumber,
    effectiveDate,
    recordReference,
    status = 'approved',
    confidentiality = 'internal',
    academicPeriod,
    className = '',
}: IsoDocumentHeaderProps) {
    const getStatusBadge = (statusName: string) => {
        switch (statusName.toLowerCase()) {
            case 'approved':
            case 'published':
            case 'active':
            case 'completed':
                return (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        CONTROLLED · {statusName.toUpperCase()}
                    </Badge>
                );
            case 'under_review':
            case 'in_review':
            case 'for_review':
            case 'for coding':
            case 'submitted':
                return (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        IN REVIEW
                    </Badge>
                );
            case 'obsolete':
            case 'superseded':
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 font-semibold gap-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        OBSOLETE
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 font-semibold">
                        {statusName.toUpperCase()}
                    </Badge>
                );
        }
    };

    return (
        <div className={`rounded-xl border-2 border-primary/20 bg-card overflow-hidden shadow-sm ${className}`}>
            {/* Top Security Banner */}
            <div className="bg-muted/70 px-4 py-1.5 border-b border-border flex items-center justify-between text-[11px] font-mono font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="font-semibold uppercase tracking-wider">ISO 9001:2026 QMS Controlled Document</span>
                </div>
                <div className="flex items-center gap-3">
                    {confidentiality && (
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-background border border-border">
                            {confidentiality}
                        </span>
                    )}
                    {getStatusBadge(status)}
                </div>
            </div>

            {/* Standard Tabular Header Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Institutional & College Identity */}
                <div className="md:col-span-4 p-4 flex flex-col justify-center space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-[11px] font-bold tracking-tight text-foreground/80 leading-tight">
                            {institutionName}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-primary pl-6 tracking-tight">
                        {collegeName}
                    </p>
                    {academicPeriod && (
                        <p className="text-[11px] text-muted-foreground pl-6">
                            Academic Term: <span className="font-medium text-foreground">{academicPeriod}</span>
                        </p>
                    )}
                </div>

                {/* Document Title */}
                <div className="md:col-span-5 p-4 flex flex-col justify-center">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
                        Document / Form Title
                    </div>
                    <h2 className="text-base font-extrabold text-foreground leading-snug">
                        {documentTitle}
                    </h2>
                    {recordReference && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="text-[11px] font-medium">Record Ref:</span>
                            <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                {recordReference}
                            </span>
                        </div>
                    )}
                </div>

                {/* ISO Control Metadata Matrix */}
                <div className="md:col-span-3 p-3 bg-muted/30 grid grid-cols-2 divide-x divide-y divide-border text-center text-xs">
                    <div className="p-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block">Doc Code</span>
                        <span className="font-mono font-bold text-foreground text-xs tracking-tight">
                            {documentCode}
                        </span>
                    </div>
                    <div className="p-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block">Revision</span>
                        <span className="font-mono font-bold text-foreground text-xs">
                            {revisionNumber}
                        </span>
                    </div>
                    <div className="p-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block">Effective</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {effectiveDate || 'Formal Approval'}
                        </span>
                    </div>
                    <div className="p-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block">Page</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                            1 of 1
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default IsoDocumentHeader;
