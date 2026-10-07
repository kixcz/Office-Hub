import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import TvLayout from '@/layouts/tv-layout';
import { Megaphone, Calendar as CalendarIcon, CheckCircle, Trophy, Clock, AlertTriangle, FileText, Activity } from 'lucide-react';

export default function TvDisplay({ settings, slides, data, current_term }: any) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [fade, setFade] = useState(true);

    const activeSlides = slides.filter((s: any) => s.is_active);

    useEffect(() => {
        if (activeSlides.length === 0) return;

        const slide = activeSlides[currentSlideIndex];
        const duration = (slide.duration_seconds || 15) * 1000;

        const timer = setTimeout(() => {
            setFade(false); // start fade out
            setTimeout(() => {
                if (currentSlideIndex === activeSlides.length - 1) {
                    // Reached the end, trigger a hard reload to get fresh data
                    router.reload({ only: ['settings', 'slides', 'data'] });
                    setCurrentSlideIndex(0);
                } else {
                    setCurrentSlideIndex(prev => prev + 1);
                }
                setFade(true); // start fade in
            }, 500); // 500ms fade transition
        }, duration);

        return () => clearTimeout(timer);
    }, [currentSlideIndex, activeSlides]);

    if (activeSlides.length === 0) {
        return (
            <TvLayout currentTerm={current_term}>
                <Head title="TV Display" />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-2xl text-gray-500">No active slides configured.</p>
                </div>
            </TvLayout>
        );
    }

    const currentSlide = activeSlides[currentSlideIndex];

    return (
        <TvLayout currentTerm={current_term}>
            <Head title="TV Display" />
            
            <div className={`flex-1 flex flex-col h-full transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                {/* SLIDE 1: Daily Overview */}
                {currentSlide.type === 'Slide 1 - Daily Overview' && (
                    <SlideOne data={data.slide1} slideConfig={currentSlide} />
                )}

                {/* SLIDE 2: Schedule & Meetings */}
                {currentSlide.type === 'Slide 2 - Schedule & Meetings' && (
                    <SlideTwo data={data.slide2} slideConfig={currentSlide} />
                )}

                {/* SLIDE 3: Compliance Monitoring */}
                {currentSlide.type === 'Slide 3 - Compliance Monitoring' && (
                    <SlideThree data={data.slide3} slideConfig={currentSlide} />
                )}

                {/* SLIDE 4: Performance & Recognition */}
                {currentSlide.type === 'Slide 4 - Performance & Recognition' && (
                    <SlideFour data={data.slide4} slideConfig={currentSlide} />
                )}
            </div>

            {/* Footer */}
            <footer className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Live Display &bull; Authorized Internal View</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Rotates automatically every {currentSlide.duration_seconds || 15} seconds</span>
                    <div className="flex gap-1.5">
                        {activeSlides.map((_: any, idx: number) => (
                            <div key={idx} className={`w-2.5 h-2.5 rounded-full ${idx === currentSlideIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        ))}
                    </div>
                    <span className="font-semibold text-gray-700">Slide {currentSlideIndex + 1} of {activeSlides.length}</span>
                </div>
            </footer>
        </TvLayout>
    );
}

// ==========================================
// Slide Components
// ==========================================

function SlideOne({ data, slideConfig }: any) {
    return (
        <div className="flex-1 flex flex-col h-full gap-6">
            <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 flex items-center gap-3">
                <Megaphone className="text-blue-600" size={32} />
                {slideConfig.title || 'Daily Overview'}
            </h1>
            
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Announcements */}
                <div className="col-span-5 flex flex-col gap-4 bg-white rounded-xl shadow p-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        Active Announcements
                    </h2>
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        {data.announcements.length > 0 ? data.announcements.map((a: any) => (
                            <div key={a.id} className="border-l-4 border-blue-500 bg-blue-50/50 p-4 rounded-r-lg">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{a.title}</h3>
                                <p className="text-gray-700">{a.content}</p>
                            </div>
                        )) : (
                            <p className="text-gray-500 italic">No active announcements today.</p>
                        )}
                    </div>
                </div>

                {/* Schedule & Upcoming */}
                <div className="col-span-7 flex flex-col gap-6">
                    <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col">
                        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Today's Schedule</h2>
                        <div className="flex flex-col gap-3">
                            {data.todays_schedule.length > 0 ? data.todays_schedule.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-lg text-center min-w-[120px]">
                                        {item.time}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-gray-900">{item.title}</p>
                                        <p className="text-gray-600">{item.venue}</p>
                                    </div>
                                    <span className="text-xs uppercase font-bold text-gray-500 tracking-wider px-2 py-1 bg-gray-200 rounded">{item.type}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 italic text-lg p-4 bg-gray-50 rounded-lg text-center">No meetings or activities scheduled for today.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4">Next 3 Meetings</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {data.upcoming_meetings.slice(0,3).map((m: any) => (
                                <div key={m.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                    <p className="text-sm font-bold text-blue-600 mb-1">{m.date}</p>
                                    <p className="font-bold text-gray-900 line-clamp-1">{m.title}</p>
                                    <p className="text-sm text-gray-600 truncate">{m.time}</p>
                                </div>
                            ))}
                            {data.upcoming_meetings.length === 0 && (
                                <p className="text-gray-500 italic col-span-3">No upcoming meetings scheduled.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4 mt-auto">
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Compliance Rate</p>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.compliance_rate}%</p>
                    </div>
                    <CheckCircle className="text-green-500 opacity-20" size={48} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-amber-500 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Pending Review</p>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.pending_review}</p>
                    </div>
                    <Clock className="text-amber-500 opacity-20" size={48} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Overdue Outputs</p>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.overdue_outputs}</p>
                    </div>
                    <AlertTriangle className="text-red-500 opacity-20" size={48} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Meetings This Week</p>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.meetings_this_week}</p>
                    </div>
                    <CalendarIcon className="text-blue-500 opacity-20" size={48} />
                </div>
            </div>
        </div>
    );
}

function SlideTwo({ data, slideConfig }: any) {
    return (
        <div className="flex-1 flex flex-col h-full gap-6">
            <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 flex items-center gap-3">
                <CalendarIcon className="text-blue-600" size={32} />
                {slideConfig.title || 'Weekly Schedule & Meetings'}
            </h1>
            
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Weekly Grid */}
                <div className="col-span-8 bg-white rounded-xl shadow p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">This Week</h2>
                    <div className="grid grid-cols-5 gap-3 flex-1">
                        {data.weekly_schedule.map((day: any, i: number) => (
                            <div key={i} className={`flex flex-col border rounded-lg overflow-hidden ${day.is_today ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200'}`}>
                                <div className={`text-center py-2 font-bold ${day.is_today ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                    {day.date.split(',')[0]}<br/>
                                    <span className="text-sm font-normal opacity-80">{day.date.split(',')[1]}</span>
                                </div>
                                <div className="p-2 flex flex-col gap-2 flex-1 bg-white">
                                    {day.items.map((item: any, j: number) => (
                                        <div key={j} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                            <p className="font-bold text-blue-700 mb-0.5">{item.time}</p>
                                            <p className="font-semibold text-gray-800 line-clamp-2 leading-tight">{item.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white rounded-xl shadow p-6 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Upcoming Meetings</h2>
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                            {data.upcoming_meetings.map((m: any) => (
                                <div key={m.id} className="border-l-4 border-blue-500 pl-3 py-1">
                                    <p className="text-sm font-bold text-blue-600">{m.date} &bull; {m.time}</p>
                                    <p className="font-bold text-gray-900">{m.title}</p>
                                    <p className="text-sm text-gray-600">{m.venue}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-xl shadow p-6 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Calendar Highlights</h2>
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                            {data.upcoming_deadlines.map((d: any) => (
                                <div key={d.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-bold text-red-900">{d.title}</p>
                                        <p className="text-xs text-red-700">Submission Deadline</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-700">{d.due_date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4 mt-auto">
                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><CalendarIcon size={24}/></div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.meetings_this_week}</p>
                        <p className="text-sm font-bold text-gray-500 uppercase">Meetings This Week</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Activity size={24}/></div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.activities_this_week}</p>
                        <p className="text-sm font-bold text-gray-500 uppercase">Activities This Week</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={24}/></div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{data.kpis.deadlines_this_week}</p>
                        <p className="text-sm font-bold text-gray-500 uppercase">Deadlines This Week</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SlideThree({ data, slideConfig }: any) {
    return (
        <div className="flex-1 flex flex-col h-full gap-6">
            <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 flex items-center gap-3">
                <FileText className="text-blue-600" size={32} />
                {slideConfig.title || 'Compliance Monitoring'}
            </h1>
            
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-4 bg-white rounded-xl shadow p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-6 border-b pb-2">Compliance Summary</h2>
                    <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2">
                        {data.compliance_summary.map((req: any) => (
                            <div key={req.id}>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="font-bold text-gray-800 text-lg">{req.title}</span>
                                    <span className="text-gray-500 font-medium">{req.rate}% &bull; {req.complied} / {req.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className={`h-3 rounded-full ${req.rate >= 80 ? 'bg-green-500' : req.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${req.rate}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-8 flex flex-col gap-6">
                    <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Top 6 Pending Faculty Outputs</h2>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-500 border-b-2 border-gray-100">
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-sm">Faculty</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-sm">Program</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-sm">Pending Output</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-sm">Deadline</th>
                                        <th className="pb-3 font-semibold uppercase tracking-wider text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pending_outputs.length > 0 ? data.pending_outputs.map((p: any) => (
                                        <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                            <td className="py-4 font-bold text-gray-900 text-lg">{p.faculty}</td>
                                            <td className="py-4 font-semibold text-gray-600">{p.program}</td>
                                            <td className="py-4 text-gray-800">{p.requirement}</td>
                                            <td className="py-4 font-medium text-gray-600">{p.due_date}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase tracking-wider
                                                    ${p.status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' : 
                                                      p.status === 'Due Soon' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                                                      'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-xl text-gray-500 italic">All currently due requirements are complete.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-auto">
                <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Overall Compliance Rate</p>
                        <p className="text-4xl font-bold text-gray-900">{data.kpis.compliance_rate}%</p>
                    </div>
                    <CheckCircle className="text-green-500 opacity-20" size={56} />
                </div>
                <div className="bg-white p-5 rounded-xl shadow border-l-4 border-amber-500 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Pending Outputs</p>
                        <p className="text-4xl font-bold text-gray-900">{data.kpis.pending_outputs}</p>
                    </div>
                    <Clock className="text-amber-500 opacity-20" size={56} />
                </div>
                <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Overdue Outputs</p>
                        <p className="text-4xl font-bold text-gray-900">{data.kpis.overdue_outputs}</p>
                    </div>
                    <AlertTriangle className="text-red-500 opacity-20" size={56} />
                </div>
            </div>
        </div>
    );
}

function SlideFour({ data, slideConfig }: any) {
    return (
        <div className="flex-1 flex flex-col h-full gap-6">
            <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 flex items-center gap-3">
                <Trophy className="text-yellow-500" size={32} />
                {slideConfig.title || 'Performance & Recognition'}
            </h1>
            
            <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Top Programs */}
                <div className="col-span-5 flex flex-col gap-6">
                    <div className="bg-gradient-to-b from-indigo-900 to-blue-900 rounded-xl shadow-xl p-8 text-white flex-1 flex flex-col">
                        <h2 className="text-2xl font-bold text-indigo-100 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-3">
                            <Trophy size={28} className="text-yellow-400" /> Top Programs
                        </h2>
                        
                        <div className="flex flex-col gap-6 flex-1 justify-center">
                            {data.top_programs.map((p: any, i: number) => (
                                <div key={p.id} className={`flex items-center gap-6 p-4 rounded-xl ${i === 0 ? 'bg-white/10 border border-white/20 transform scale-105' : ''}`}>
                                    <div className={`text-4xl font-black ${i === 0 ? 'text-yellow-400' : 'text-indigo-300'}`}>
                                        #{i+1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-3xl font-bold tracking-wider">{p.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-400">{p.on_time_rate}%</p>
                                        <p className="text-sm text-indigo-200 uppercase tracking-wider font-semibold">On-Time</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Faculty */}
                <div className="col-span-7 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow p-8 flex-1 flex flex-col">
                        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-6 border-b-2 pb-4">Top Performing Faculty</h2>
                        
                        <div className="flex flex-col gap-4 flex-1">
                            {data.top_faculty.map((f: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-xl">
                                            {i+1}
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900">{f.name}</p>
                                            <p className="font-semibold text-gray-500 uppercase tracking-wider text-sm">{f.program}</p>
                                        </div>
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-xl border border-green-200">
                                        {f.on_time_rate}% On-Time
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 grid grid-cols-3 gap-6">
                <div>
                    <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">College On-Time Rate</p>
                    <p className="text-3xl font-black text-indigo-900 mt-1">{data.kpis.college_on_time_rate}%</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Zero-Overdue Faculty Count</p>
                    <p className="text-3xl font-black text-indigo-900 mt-1">{data.kpis.zero_overdue_faculty}</p>
                </div>
                <div className="flex items-center justify-end">
                    <p className="text-lg font-semibold text-indigo-700 italic">
                        "{data.top_programs[0]?.name || 'N/A'} currently leads with a {data.top_programs[0]?.on_time_rate || 0}% on-time submission rate."
                    </p>
                </div>
            </div>
        </div>
    );
}
