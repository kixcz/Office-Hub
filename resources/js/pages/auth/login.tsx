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
        <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0B111E] font-sans selection:bg-[#8B1E3F] selection:text-white">
            <Head title="Log in" />

            {/* DIV 1: Left Half - Centered Login Form with Logo on top (Strictly fits without scrollbar) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col justify-between px-6 py-4 sm:px-10 lg:px-12 xl:px-16 bg-white dark:bg-[#0F172A] z-10 overflow-hidden">
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col justify-center">
                    {/* Logo on top of the login form */}
                    <div className="flex flex-col items-center text-center mb-2.5">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-105 duration-200">
                            <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:to-[#1E293B] p-2.5 border-2 border-[#1F5D9B]/30 shadow-md shadow-[#0B3A67]/10 flex items-center justify-center">
                                <AppLogoIcon className="size-full object-contain rounded-xl" />
                            </div>
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#0B3A67] border border-[#1F5D9B]/30 shadow-2xs dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-[#1F5D9B]/40">
                                <span className="size-1.5 rounded-full bg-[#8B1E3F] animate-pulse" />
                                Ascend Academic Platform
                            </div>
                        </Link>
                    </div>

                    {/* Header text */}
                    <div className="text-center space-y-0.5 mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">
                            Login to your account
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enter your email below to login to your account
                        </p>
                    </div>

                    {/* Status Alert if any */}
                    {status && (
                        <div className="mb-3 rounded-lg bg-[#F1F5F9] border border-[#1F5D9B]/40 p-2 text-center text-xs font-medium text-[#0B3A67] dark:bg-[#1E293B] dark:border-[#1F5D9B]/50 dark:text-[#94A3B8]">
                            {status}
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="flex flex-col gap-3" onSubmit={submit}>
                        <div className="grid gap-1">
                            <Label htmlFor="email" className="text-xs font-semibold text-[#111827] dark:text-slate-200">
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
                                placeholder="Enter your email"
                                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm text-[#111827] placeholder:text-slate-400 focus-visible:border-[#0B3A67] focus-visible:ring-2 focus-visible:ring-[#0B3A67]/25 dark:bg-[#1E293B] dark:border-[#334155] dark:text-white"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-semibold text-[#111827] dark:text-slate-200">
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-medium text-[#1F5D9B] hover:text-[#0B3A67] hover:underline dark:text-[#93C5FD]"
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
                                placeholder="Enter your password"
                                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm text-[#111827] placeholder:text-slate-400 focus-visible:border-[#0B3A67] focus-visible:ring-2 focus-visible:ring-[#0B3A67]/25 dark:bg-[#1E293B] dark:border-[#334155] dark:text-white"
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
                                className="size-4 border-slate-300 data-[state=checked]:bg-[#0B3A67] data-[state=checked]:border-[#0B3A67] data-[state=checked]:text-white focus-visible:ring-[#0B3A67]"
                            />
                            <Label htmlFor="remember" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                Remember me
                            </Label>
                        </div>

                        {/* Primary Blue & Deep Maroon Accent Login Button */}
                        <Button
                            type="submit"
                            className="h-10 w-full bg-[#0B3A67] hover:bg-[#1F5D9B] active:bg-[#072644] text-white font-bold shadow-sm shadow-[#0B3A67]/25 transition-all rounded-lg text-sm border border-[#1F5D9B]/50 cursor-pointer"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-white" />}
                            Login
                        </Button>

                        {/* Divider */}
                        <div className="relative my-1">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-[#334155]" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white dark:bg-[#0F172A] px-2.5 text-slate-400 dark:text-slate-500 font-medium">
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
                            className="h-10 w-full border-[#1F5D9B]/40 bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#1F5D9B] dark:border-[#1F5D9B]/50 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#0B3A67] dark:text-[#93C5FD] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-2xs"
                        >
                            <Tv className="h-4 w-4 text-[#8B1E3F] dark:text-[#F43F5E]" />
                            Enter TV Display Code
                        </Button>
                    </form>
                </div>

                {/* Footer copyright */}
                <div className="w-full text-center text-[11px] text-slate-400 dark:text-slate-600 py-1">
                    &copy; {new Date().getFullYear()} Ascend • Institutional Academic & Governance Platform
                </div>
            </div>

            {/* DIV 2: Right Half - Full Screen Deep Blue & Maroon Dual Gradient Sunburst */}
            <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-gradient-to-br from-[#0B3A67] via-[#1F5D9B] to-[#68152E] flex-col justify-between p-6 xl:p-8 text-white select-none">
                {/* Radial Glow and Background Accents */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,30,63,0.35)_0%,_rgba(31,93,155,0.18)_50%,_transparent_80%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 size-80 rounded-full bg-[#8B1E3F]/35 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-[#0B3A67]/70 blur-3xl pointer-events-none" />

                {/* Mathematical Geometric Sunburst & Concentric Rings */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="400" cy="400" r="360" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" strokeDasharray="8 8" />
                    <circle cx="400" cy="400" r="280" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                    <circle cx="400" cy="400" r="180" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" />
                    <circle cx="400" cy="400" r="95" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="2" fill="rgba(139, 30, 63, 0.15)" />

                    <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="400" y2="800" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="117" y1="117" x2="683" y2="683" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
                    <line x1="117" y1="683" x2="683" y2="117" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />

                    <circle cx="400" cy="400" r="420" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
                </svg>

                {/* Top header on right div */}
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white text-[11px] font-bold text-[#0B3A67] uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-[#8B1E3F] animate-ping" />
                        Integrated Academic Management
                    </div>
                    <span className="text-[11px] font-semibold text-white bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 shadow-2xs">
                        Ascend TV & Portal
                    </span>
                </div>

                {/* Center of the radial graphic - Logo & Branding in White Squircle */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="size-32 sm:size-36 rounded-3xl bg-white/95 backdrop-blur-md p-4 shadow-xl shadow-[#0B3A67]/35 border-2 border-[#1F5D9B]/40 flex items-center justify-center transform transition-all hover:scale-105 duration-300">
                        <AppLogoIcon className="size-full object-contain" />
                    </div>
                    <div className="mt-3 text-center">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-[#0B3A67] shadow-xs border border-white/80">
                            Ascend Governance & Academic Portal
                        </span>
                    </div>
                </div>

                {/* Bottom glassmorphic showcase card */}
                <div className="relative z-10 w-full max-w-md mx-auto">
                    <div className="rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl border border-white text-[#111827]">
                        <div className="flex items-center text-center gap-2 text-[10px] font-bold text-[#8B1E3F] uppercase tracking-wider mb-1.5">
                            <span className="size-1.5 rounded-full bg-[#0B3A67]" />
                            Davao del Sur State College • Ascend Ecosystem
                        </div>
                        <h3 className="text-base text-center sm:text-lg font-bold text-[#111827] mb-1">
                            Welcome to Ascend
                        </h3>
                        <p className="text-xs text-center text-slate-600 leading-relaxed">
                            Streamline institutional governance, faculty submissions, real-time compliance deadlines, departmental scheduling, and campus TV broadcasts seamlessly.
                        </p>
                    </div>
                </div>
            </div>

            {/* TV Screen Access Code Dialog */}
            <Dialog open={isTvCodeOpen} onOpenChange={setIsTvCodeOpen}>
                <DialogContent className="sm:max-w-md border-slate-200 bg-white dark:bg-[#0F172A] dark:border-[#1E293B] p-6 rounded-2xl shadow-2xl">
                    <DialogHeader className="text-center sm:text-center flex flex-col items-center">
                        <div className="size-12 rounded-2xl bg-[#F1F5F9] text-[#0B3A67] dark:bg-[#1E293B] dark:text-[#93C5FD] flex items-center justify-center mb-2 shadow-2xs border border-[#1F5D9B]/30">
                            <Tv className="size-6 text-[#8B1E3F]" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-[#111827] dark:text-white">
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
                            <Label htmlFor="tv-code" className="text-xs font-semibold text-[#111827] dark:text-slate-300">
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
                                    className="pl-10 h-11 text-center font-mono text-base font-bold tracking-widest uppercase border-slate-200 focus-visible:border-[#0B3A67] focus-visible:ring-[#0B3A67]/25"
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
                                className="flex-1 h-10 rounded-xl bg-[#0B3A67] hover:bg-[#1F5D9B] text-white font-bold text-xs shadow-md shadow-[#0B3A67]/25 border border-[#1F5D9B]/50"
                            >
                                {tvSubmitting ? (
                                    <LoaderCircle className="size-4 animate-spin mr-1.5" />
                                ) : (
                                    <Sparkles className="size-4 mr-1.5 text-[#8B1E3F]" />
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

