import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Clock } from 'lucide-react';

export default function TvLayout({ children, currentTerm }: { children: React.ReactNode, currentTerm: string }) {
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
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 text-white px-8 py-4 flex justify-between items-center border-b border-gray-700 shadow-sm z-50 shrink-0 sticky top-0">
                <div className="flex items-center gap-3">
                    <img src="/CIDS_Logo.jpg" alt="CIDS Logo" className="h-10 w-auto rounded-md bg-white object-contain" />
                    <span className="text-xl font-semibold tracking-tight">OfficeHub TV</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-lg font-medium text-gray-200">{formatDate(currentTime)}</div>
                    </div>
                    <div className="bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" />
                        <span className="text-2xl font-bold font-mono tracking-tight">{formatTime(currentTime)}</span>
                    </div>
                </div>
                
                <div className="text-right flex flex-col justify-center">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Internal Staff View</div>
                    <div className="text-md font-medium text-gray-300">{currentTerm}</div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden bg-gray-100 text-gray-900 flex flex-col">
                {children}
            </main>

        </div>
    );
}
