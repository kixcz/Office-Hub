import React, { useState, useEffect } from 'react';
import { Clock, Moon, RefreshCw, Sun } from 'lucide-react';

interface TvLayoutProps {
    children: React.ReactNode;
    currentTerm: string;
    title?: string;
    lastUpdated?: string;
    isDark?: boolean;
    onToggleDark?: () => void;
}

export default function TvLayout({
    children,
    currentTerm,
    title,
    lastUpdated,
    isDark = false,
    onToggleDark,
}: TvLayoutProps) {
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
        <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${
            isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
        }`}>
            {/* Header */}
            <header className="bg-transparent px-8 py-5 flex justify-between items-center z-50 shrink-0 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <img
                            src="/CIDS_Logo.jpg"
                            alt="CIDS Logo"
                            className="h-12 w-auto rounded-lg object-contain shadow-sm ring-2 ring-amber-400/50"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight text-amber-500">
                                OfficeHub <span className={isDark ? 'text-white' : 'text-slate-900'}>TV</span>
                            </span>
                            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-bold text-amber-500 ring-1 ring-amber-400/40 uppercase tracking-wider">
                                Live
                            </span>
                        </div>
                        {title && (
                            <span className={`text-base font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                                {title}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {formatDate(currentTime)}
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm ring-1 ${
                        isDark ? 'bg-slate-900/90 ring-slate-800' : 'bg-white ring-slate-200/80'
                    }`}>
                        <Clock size={22} className="text-amber-500" />
                        <span className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatTime(currentTime)}
                        </span>
                    </div>

                    {/* Dark / Light Mode Toggle */}
                    {onToggleDark && (
                        <button
                            type="button"
                            onClick={onToggleDark}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className={`p-2.5 rounded-xl ring-1 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                                isDark
                                    ? 'bg-slate-900 text-amber-400 ring-slate-800 hover:bg-slate-800 hover:ring-amber-400/50'
                                    : 'bg-white text-slate-700 ring-slate-200/80 hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-300'
                            }`}
                        >
                            {isDark ? <Sun size={22} className="animate-pulse" /> : <Moon size={22} />}
                        </button>
                    )}
                </div>

                <div className={`text-right flex flex-col justify-center px-4 py-2 rounded-xl shadow-sm ring-1 ${
                    isDark ? 'bg-slate-900/90 ring-slate-800' : 'bg-white ring-slate-200/80'
                }`}>
                    <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Internal Staff View</div>
                    <div className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {currentTerm}
                    </div>
                    {lastUpdated && (
                        <div className={`text-xs font-medium mt-0.5 flex items-center justify-end gap-1 ${
                            isDark ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                            <RefreshCw size={11} className="text-amber-500" /> Updated {lastUpdated}
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
