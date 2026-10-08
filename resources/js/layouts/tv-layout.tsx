import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Clock, RefreshCw } from 'lucide-react';

export default function TvLayout({ children, currentTerm, title, lastUpdated }: { children: React.ReactNode, currentTerm: string, title?: string, lastUpdated?: string }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-transparent px-8 py-6 flex justify-between items-center z-50 shrink-0 sticky top-0">
                <div className="flex items-center gap-4">
                    <img src="/CIDS_Logo.jpg" alt="CIDS Logo" className="h-12 w-auto rounded-md object-contain shadow-sm" />
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">OfficeHub TV</span>
                        {title && <span className="text-lg font-semibold text-blue-800">{title}</span>}
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-lg font-semibold text-slate-700">{formatDate(currentTime)}</div>
                    </div>
                    <div className="bg-white shadow-sm ring-1 ring-slate-200/70 px-4 py-2 rounded-xl flex items-center gap-3">
                        <Clock size={24} className="text-blue-700" />
                        <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">{formatTime(currentTime)}</span>
                    </div>
                </div>
                
                <div className="text-right flex flex-col justify-center bg-white shadow-sm ring-1 ring-slate-200/70 px-4 py-2 rounded-xl">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Staff View</div>
                    <div className="text-lg font-semibold text-slate-800">{currentTerm}</div>
                    {lastUpdated && (
                        <div className="text-xs font-medium text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                            <RefreshCw size={12} /> Updated {lastUpdated}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative min-h-0 overflow-hidden bg-transparent flex flex-col">
                {children}
            </main>

        </div>
    );
}
