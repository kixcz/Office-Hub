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
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0B111E] font-sans selection:bg-[#8B1E3F] selection:text-white">
            {/* Left Div: Form Container */}
            <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-[#0F172A] z-10 overflow-y-auto">
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
                    {/* Logo on top */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-105 duration-200">
                            <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:to-[#1E293B] p-2.5 border-2 border-[#1F5D9B]/30 shadow-lg shadow-[#0B3A67]/10 flex items-center justify-center">
                                <AppLogoIcon className="size-full object-contain rounded-xl" />
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#0B3A67] border border-[#1F5D9B]/30 shadow-2xs dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-[#1F5D9B]/40">
                                <span className="size-1.5 rounded-full bg-[#8B1E3F] animate-pulse" />
                                {name || 'Ascend Academic Platform'}
                            </div>
                        </Link>
                    </div>

                    {title && (
                        <div className="text-center space-y-1.5 mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-white">{title}</h1>
                            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                        </div>
                    )}

                    {children}
                </div>

                <div className="w-full text-center text-xs text-slate-400 dark:text-slate-600 pt-4 pb-2">
                    &copy; {new Date().getFullYear()} Ascend • Institutional Academic & Governance Platform
                </div>
            </div>

            {/* Right Div: Deep Blue & Maroon Dual Gradient Sunburst */}
            <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0B3A67] via-[#1F5D9B] to-[#68152E] flex-col justify-between p-10 xl:p-14 text-white select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,30,63,0.35)_0%,_rgba(31,93,155,0.18)_50%,_transparent_80%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 size-96 rounded-full bg-[#8B1E3F]/35 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-[#0B3A67]/70 blur-3xl pointer-events-none" />

                {/* SVG Sunburst Graphic */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="400" cy="400" r="360" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" strokeDasharray="8 8" />
                    <circle cx="400" cy="400" r="280" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                    <circle cx="400" cy="400" r="180" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" />
                    <circle cx="400" cy="400" r="95" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="2" fill="rgba(139, 30, 63, 0.15)" />

                    <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="400" y2="800" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="117" y1="117" x2="683" y2="683" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="117" y1="683" x2="683" y2="117" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                </svg>

                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-white text-xs font-bold text-[#0B3A67] uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-[#8B1E3F] animate-ping" />
                        Integrated Academic Management
                    </div>
                    <span className="text-xs font-semibold text-white bg-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/30 shadow-2xs">
                        Ascend TV & Portal
                    </span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="size-28 sm:size-32 rounded-3xl bg-white/95 backdrop-blur-md p-4 shadow-2xl shadow-[#0B3A67]/40 border-2 border-[#1F5D9B]/40 flex items-center justify-center transform transition-all hover:scale-105 duration-300">
                        <AppLogoIcon className="size-full object-contain" />
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-[#0B3A67] shadow-sm border border-white/80">
                            Ascend Governance & Academic Portal
                        </span>
                    </div>
                </div>

                {quote ? (
                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="rounded-2xl bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-white text-[#111827]">
                            <blockquote className="space-y-2">
                                <p className="text-sm font-medium italic text-[#111827]">&ldquo;{quote.message}&rdquo;</p>
                                <footer className="text-xs font-semibold text-[#1F5D9B]">— {quote.author}</footer>
                            </blockquote>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="rounded-2xl bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-white text-[#111827]">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                                <span className="size-2 rounded-full bg-[#0B3A67]" />
                                Davao del Sur State College • Ascend Ecosystem
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-1.5">Welcome to Ascend</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Streamline institutional governance, faculty submissions, real-time compliance deadlines, departmental scheduling, and campus announcements seamlessly.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
