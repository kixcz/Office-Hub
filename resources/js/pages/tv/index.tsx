import { Head } from '@inertiajs/react';
import { Calendar, Megaphone, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Announcement {
    id: number;
    title: string;
    message: string;
    priority: string;
    created_at: string;
}

interface Meeting {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
}

interface Props {
    announcements: Announcement[];
    meetings: Meeting[];
}

export default function TvDisplay({ announcements, meetings }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh the page every 5 minutes to get latest data
    useEffect(() => {
        const refreshTimer = setInterval(() => window.location.reload(), 5 * 60 * 1000);
        return () => clearInterval(refreshTimer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getPriorityStyle = (priority: string) => {
        switch(priority) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans">
            <Head title="CIDS TV Display" />
            
            {/* Header */}
            <header className="bg-primary text-primary-foreground p-6 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary-foreground rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-xl">CIDS</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">College of Informatics and Computing Sciences</h1>
                        <p className="text-primary-foreground/80 font-medium">Office Information Display</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold tracking-tighter">{formatTime(currentTime)}</div>
                    <div className="text-lg font-medium text-primary-foreground/90">{formatDate(currentTime)}</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 grid grid-cols-3 gap-6 p-6 h-[calc(100vh-100px)] overflow-hidden">
                
                {/* Announcements Column (2/3 width) */}
                <section className="col-span-2 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-primary/20">
                        <Megaphone className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-primary">Office Announcements</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {announcements.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border shadow-sm">
                                <Megaphone className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-xl">No active announcements</p>
                            </div>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann.id} className="bg-card rounded-2xl border shadow-md overflow-hidden relative">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${getPriorityStyle(ann.priority).split(' ')[0]}`}></div>
                                    <div className="p-6 pl-8">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-2xl font-bold tracking-tight">{ann.title}</h3>
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getPriorityStyle(ann.priority)}`}>
                                                {ann.priority}
                                            </span>
                                        </div>
                                        <p className="text-lg text-foreground/90 whitespace-pre-wrap leading-relaxed">{ann.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Schedule Column (1/3 width) */}
                <section className="col-span-1 flex flex-col gap-4 bg-muted/30 rounded-3xl p-6 border shadow-inner">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-primary/20">
                        <Calendar className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-primary">Today's Schedule</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {meetings.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-center">
                                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-lg">No public events scheduled for today</p>
                            </div>
                        ) : (
                            meetings.map((meeting) => (
                                <div key={meeting.id} className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                    <h3 className="text-xl font-bold mb-3">{meeting.title}</h3>
                                    
                                    <div className="space-y-2 text-base text-muted-foreground">
                                        <div className="flex items-center gap-2 font-medium text-foreground/80">
                                            <Clock className="w-5 h-5 text-primary/70" />
                                            <span>
                                                {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(meeting.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        
                                        {meeting.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-primary/70" />
                                                <span>{meeting.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
