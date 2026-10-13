import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-zinc-950 font-sans selection:bg-amber-400 selection:text-slate-950">
            {/* Left Div: Form Container */}
            <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-zinc-950 z-10 overflow-y-auto">
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
                    {/* Logo on top */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-105 duration-200">
                            <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 p-2.5 border-2 border-amber-300 shadow-lg shadow-amber-400/15 flex items-center justify-center">
                                <AppLogoIcon className="size-full object-contain rounded-xl" />
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {name || 'CIDS Office Hub'}
                            </div>
                        </Link>
                    </div>

                    {title && (
                        <div className="text-center space-y-1.5 mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                        </div>
                    )}

                    {children}
                </div>

                <div className="w-full text-center text-xs text-slate-400 dark:text-slate-600 pt-4 pb-2">
                    &copy; {new Date().getFullYear()} CIDS Office Hub • College of Information and Computing Sciences
                </div>
            </div>

            {/* Right Div: Yellow and White Visual with Sunburst */}
            <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-700 flex-col justify-between p-10 xl:p-14 text-slate-900 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4)_0%,_rgba(255,255,255,0.1)_40%,_transparent_75%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 size-96 rounded-full bg-yellow-200/40 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-amber-300/40 blur-3xl pointer-events-none" />

                {/* SVG Sunburst Graphic */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="400" cy="400" r="360" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" strokeDasharray="8 8" />
                    <circle cx="400" cy="400" r="280" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
                    <circle cx="400" cy="400" r="180" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
                    <circle cx="400" cy="400" r="95" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="2" fill="rgba(255, 255, 255, 0.08)" />

                    <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="400" y2="800" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="117" y1="117" x2="683" y2="683" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="117" y1="683" x2="683" y2="117" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                </svg>

                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-white text-xs font-bold text-amber-950 uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                        Integrated Academic Management
                    </div>
                    <span className="text-xs font-semibold text-amber-950/90 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-2xs">
                        OfficeHub TV & Portal
                    </span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="size-28 sm:size-32 rounded-3xl bg-white/95 backdrop-blur-md p-4 shadow-2xl shadow-amber-900/20 border-2 border-white flex items-center justify-center transform transition-all hover:scale-105 duration-300">
                        <AppLogoIcon className="size-full object-contain" />
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-white/85 backdrop-blur-sm text-xs font-bold text-amber-950 shadow-sm border border-white/70">
                            CIDS Academic Portal
                        </span>
                    </div>
                </div>

                {quote ? (
                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 shadow-2xl border border-white text-slate-800">
                            <blockquote className="space-y-2">
                                <p className="text-sm font-medium italic text-slate-800">&ldquo;{quote.message}&rdquo;</p>
                                <footer className="text-xs font-semibold text-amber-800">— {quote.author}</footer>
                            </blockquote>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 shadow-2xl border border-white text-slate-800">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                                <span className="size-2 rounded-full bg-amber-500" />
                                College of Information and Computing Sciences
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">Welcome to CIDS Office Hub</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Streamline faculty submissions, track real-time compliance deadlines, coordinate departmental requests, and broadcast campus announcements seamlessly.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
