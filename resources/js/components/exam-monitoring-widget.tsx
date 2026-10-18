import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExamItem {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    room_name: string;
    start_time: string;
    end_time: string;
    exam_type: string;
    status: string;
}

export function TvExamMonitoringWidget() {
    const [data, setData] = useState<{
        today_exams: ExamItem[];
        upcoming_exams: any[];
        rooms_in_use: string[];
        conducted_today_count: number;
        total_today_count: number;
    } | null>(null);

    useEffect(() => {
        fetch('/operations/exam-monitoring/tv-widget-data')
            .then((res) => res.json())
            .then((res) => setData(res))
            .catch(() => {});
    }, []);

    if (!data || data.today_exams.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-white backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-amber-400" />
                    <span className="font-bold text-sm tracking-wide">Campus Examination Board</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">No scheduled examinations underway at this hour.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-5 text-white backdrop-blur-md shadow-xl font-['Poppins']">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                        <span className="font-extrabold text-sm tracking-wide">Today's Examination Schedule</span>
                        <p className="text-[10px] text-slate-400">College of Information and Computing Studies</p>
                    </div>
                </div>

                <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                    {data.today_exams.length} Active Today
                </Badge>
            </div>

            <div className="mt-3 divide-y divide-white/5 space-y-2">
                {data.today_exams.slice(0, 4).map((e) => (
                    <div key={e.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-300">{e.course_code}</span>
                                <span className="text-slate-300 font-medium">({e.section})</span>
                                <span className="text-[10px] text-slate-400">• {e.exam_type}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                <span><Clock className="inline mr-1 h-3 w-3" />{e.start_time.substring(0, 5)} - {e.end_time.substring(0, 5)}</span>
                                <span>•</span>
                                <span className="text-amber-400"><MapPin className="inline mr-1 h-3 w-3" />{e.room_name}</span>
                            </div>
                        </div>

                        <Badge variant="outline" className={`text-[9px] ${e.status === 'Conducted' ? 'border-emerald-400 text-emerald-400' : 'border-amber-400 text-amber-300'}`}>
                            {e.status}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}
