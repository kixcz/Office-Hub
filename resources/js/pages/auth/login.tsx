import { Head, Link, useForm, router } from '@inertiajs/react';
import { LoaderCircle, Tv, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const [isTvCodeOpen, setIsTvCodeOpen] = useState(false);
    const [tvCode, setTvCode] = useState('');
    const [tvError, setTvError] = useState<string | null>(null);
    const [tvSubmitting, setTvSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleTvCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tvCode.trim()) {
            setTvError('Please enter a valid TV display code.');
            return;
        }

        setTvSubmitting(true);
        setTvError(null);

        router.post(
            route('tv-display.verify-code'),
            { code: tvCode.trim() },
            {
                onError: (errs) => {
                    setTvSubmitting(false);
                    if (errs.code) {
                        setTvError(errs.code);
                    } else {
                        setTvError('Invalid or expired TV display code.');
                    }
                },
                onFinish: () => {
                    setTvSubmitting(false);
                },
            }
        );
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#F7F7FB] dark:bg-[#0F0D1D] font-sans selection:bg-[#7C3AED] selection:text-white">
            <Head title="Log in" />

            {/* DIV 1: Left Half - Centered Login Form with Logo on top (Strictly fits without scrollbar) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col justify-between px-6 py-4 sm:px-10 lg:px-12 xl:px-16 bg-white dark:bg-[#131126] z-10 overflow-hidden">
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col justify-center">
                    {/* Logo on top of the login form */}
                    <div className="flex flex-col items-center text-center mb-2.5">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-105 duration-200">
                            <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-[#F7F7FB] to-[#EDE9FE] dark:from-[#1E1B38] dark:to-[#262246] p-2.5 border-2 border-[#A78BFA]/60 shadow-md shadow-[#5B21B6]/15 flex items-center justify-center">
                                <AppLogoIcon className="size-full object-contain rounded-xl" />
                            </div>
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#4C1D95] border border-[#A78BFA]/60 shadow-2xs dark:bg-[#262246] dark:text-[#A78BFA] dark:border-[#7C3AED]/50">
                                <span className="size-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                                Velora Academic Platform
                            </div>
                        </Link>
                    </div>

                    {/* Header text */}
                    <div className="text-center space-y-0.5 mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17152E] dark:text-white">
                            Login to your account
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enter your email below to login to your account
                        </p>
                    </div>

                    {/* Status Alert if any */}
                    {status && (
                        <div className="mb-3 rounded-lg bg-[#EDE9FE] border border-[#A78BFA]/60 p-2 text-center text-xs font-medium text-[#4C1D95] dark:bg-[#262246] dark:border-[#7C3AED]/50 dark:text-[#A78BFA]">
                            {status}
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="flex flex-col gap-3" onSubmit={submit}>
                        <div className="grid gap-1">
                            <Label htmlFor="email" className="text-xs font-semibold text-[#17152E] dark:text-slate-200">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="superadmin@dssc.edu.ph"
                                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm text-[#17152E] placeholder:text-slate-400 focus-visible:border-[#7C3AED] focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 dark:bg-[#17152E] dark:border-[#2B274F] dark:text-white"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-semibold text-[#17152E] dark:text-slate-200">
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-medium text-[#5B21B6] hover:text-[#4C1D95] hover:underline dark:text-[#A78BFA]"
                                        tabIndex={5}
                                    >
                                        Forgot your password?
                                    </Link>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm text-[#17152E] placeholder:text-slate-400 focus-visible:border-[#7C3AED] focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 dark:bg-[#17152E] dark:border-[#2B274F] dark:text-white"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center space-x-2 pt-0.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', !!checked)}
                                tabIndex={3}
                                className="size-4 border-slate-300 data-[state=checked]:bg-[#5B21B6] data-[state=checked]:border-[#4C1D95] data-[state=checked]:text-white focus-visible:ring-[#7C3AED]"
                            />
                            <Label htmlFor="remember" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                Remember me
                            </Label>
                        </div>

                        {/* Deep Indigo/Purple Primary Login Button */}
                        <Button
                            type="submit"
                            className="h-10 w-full bg-[#5B21B6] hover:bg-[#4C1D95] active:bg-[#3B0764] text-white font-bold shadow-sm shadow-[#5B21B6]/25 transition-all rounded-lg text-sm border border-[#7C3AED]/40 cursor-pointer"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-white" />}
                            Login
                        </Button>

                        {/* Divider */}
                        <div className="relative my-1">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-[#2B274F]" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white dark:bg-[#131126] px-2.5 text-slate-400 dark:text-slate-500 font-medium">
                                    Or TV Display Access
                                </span>
                            </div>
                        </div>

                        {/* Enter Code for TV Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTvError(null);
                                setIsTvCodeOpen(true);
                            }}
                            className="h-10 w-full border-[#A78BFA]/50 bg-[#F7F7FB] hover:bg-[#EDE9FE] hover:border-[#7C3AED]/50 dark:border-[#7C3AED]/40 dark:bg-[#17152E] dark:hover:bg-[#262246] text-[#4C1D95] dark:text-[#A78BFA] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-2xs"
                        >
                            <Tv className="h-4 w-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                            Enter TV Display Code
                        </Button>

                        {/* Sign up link */}
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                            Don't have an account?{' '}
                            <Link
                                href={route('register')}
                                className="font-semibold text-[#5B21B6] hover:text-[#4C1D95] underline underline-offset-4 dark:text-[#A78BFA]"
                                tabIndex={6}
                            >
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer copyright */}
                <div className="w-full text-center text-[11px] text-slate-400 dark:text-slate-600 py-1">
                    &copy; {new Date().getFullYear()} Velora • Institutional Academic & Governance Platform
                </div>
            </div>

            {/* DIV 2: Right Half - Full Screen Deep Indigo/Violet Sunburst (Strictly fits without scrollbar) */}
            <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#7C3AED] flex-col justify-between p-6 xl:p-8 text-white select-none">
                {/* Radial Glow and Background Accents */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(167,139,250,0.35)_0%,_rgba(124,58,237,0.12)_45%,_transparent_75%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 size-80 rounded-full bg-[#A78BFA]/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-[#4C1D95]/60 blur-3xl pointer-events-none" />

                {/* Mathematical Geometric Sunburst & Concentric Rings */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="400" cy="400" r="360" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="1.5" strokeDasharray="8 8" />
                    <circle cx="400" cy="400" r="280" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1.5" />
                    <circle cx="400" cy="400" r="180" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" />
                    <circle cx="400" cy="400" r="95" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="2" fill="rgba(167, 139, 250, 0.1)" />

                    <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="400" y2="800" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="1.5" />
                    <line x1="117" y1="117" x2="683" y2="683" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="1.5" />
                    <line x1="117" y1="683" x2="683" y2="117" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="1.5" />

                    <circle cx="400" cy="400" r="420" stroke="rgba(167, 139, 250, 0.18)" strokeWidth="1" />
                </svg>

                {/* Top header on right div */}
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white text-[11px] font-bold text-[#4C1D95] uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-[#7C3AED] animate-ping" />
                        Integrated Academic Management
                    </div>
                    <span className="text-[11px] font-semibold text-white bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 shadow-2xs">
                        Velora TV & Portal
                    </span>
                </div>

                {/* Center of the radial graphic - Logo & Branding in White Squircle */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="size-32 sm:size-36 rounded-3xl bg-white/95 backdrop-blur-md p-4 shadow-xl shadow-[#17152E]/35 border-2 border-[#A78BFA]/60 flex items-center justify-center transform transition-all hover:scale-105 duration-300">
                        <AppLogoIcon className="size-full object-contain" />
                    </div>
                    <div className="mt-3 text-center">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-[#4C1D95] shadow-xs border border-white/70">
                            Velora Governance & Academic Portal
                        </span>
                    </div>
                </div>

                {/* Bottom glassmorphic showcase card */}
                <div className="relative z-10 w-full max-w-md mx-auto">
                    <div className="rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl border border-white text-[#17152E]">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                            <span className="size-1.5 rounded-full bg-[#7C3AED]" />
                            Davao del Sur State College • Velora Ecosystem
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#17152E] mb-1">
                            Welcome to Velora
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Streamline institutional governance, faculty submissions, real-time compliance deadlines, departmental scheduling, and campus TV broadcasts seamlessly.
                        </p>
                    </div>
                </div>
            </div>

            {/* TV Screen Access Code Dialog */}
            <Dialog open={isTvCodeOpen} onOpenChange={setIsTvCodeOpen}>
                <DialogContent className="sm:max-w-md border-[#A78BFA]/50 bg-white dark:bg-[#17152E] dark:border-[#2B274F] p-6 rounded-2xl shadow-2xl">
                    <DialogHeader className="text-center sm:text-center flex flex-col items-center">
                        <div className="size-12 rounded-2xl bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#262246] dark:text-[#A78BFA] flex items-center justify-center mb-2 shadow-2xs border border-[#A78BFA]/60">
                            <Tv className="size-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-[#17152E] dark:text-white">
                            Enter TV Display Code
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-center">
                            Enter the code generated by the Super Admin to display the continuous TV presentation slides for the college.
                        </DialogDescription>
                    </DialogHeader>

                    {tvError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{tvError}</span>
                        </div>
                    )}

                    <form onSubmit={handleTvCodeSubmit} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="tv-code" className="text-xs font-semibold text-[#17152E] dark:text-slate-300">
                                TV Access Code
                            </Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <Input
                                    id="tv-code"
                                    type="text"
                                    autoFocus
                                    placeholder="e.g. CIDS-2026 or 2026"
                                    value={tvCode}
                                    onChange={(e) => {
                                        setTvCode(e.target.value.toUpperCase());
                                        if (tvError) setTvError(null);
                                    }}
                                    className="pl-10 h-11 text-center font-mono text-base font-bold tracking-widest uppercase border-slate-200 focus-visible:border-[#7C3AED] focus-visible:ring-[#7C3AED]/30"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                                Tip: The code can be generated in TV Studio → Display Settings.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsTvCodeOpen(false)}
                                className="flex-1 h-10 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={tvSubmitting || !tvCode.trim()}
                                className="flex-1 h-10 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs shadow-md shadow-[#5B21B6]/25 border border-[#7C3AED]/40"
                            >
                                {tvSubmitting ? (
                                    <LoaderCircle className="size-4 animate-spin mr-1.5" />
                                ) : (
                                    <Sparkles className="size-4 mr-1.5" />
                                )}
                                Start TV Slides
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

