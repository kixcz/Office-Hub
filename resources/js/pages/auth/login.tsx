import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    LoaderCircle,
    Tv,
    KeyRound,
    AlertCircle,
    Sparkles,
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    Calendar,
    Layers,
    Users,
    Monitor,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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

    const [showPassword, setShowPassword] = useState(false);
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
            <Head title="Log in — Ascend" />

            {/* LEFT COLUMN: Clean White Form Container (Strict 100vh, no scrollbar) */}
            <div className="w-full lg:w-[48%] xl:w-[44%] h-full flex flex-col justify-between px-6 py-4 sm:px-10 md:px-12 lg:px-10 xl:px-14 bg-white dark:bg-[#0F172A] z-10 overflow-hidden">
                <div className="w-full max-w-[390px] mx-auto my-auto flex flex-col justify-center">
                    {/* Ascend Main Logo: Distinct Stepped Icon + Bold "Ascend" Wordmark */}
                    <div className="flex flex-col items-center text-center mb-3">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-102 duration-200">
                            <div className="flex items-center gap-3">
                                {/* Logo Mark Image */}
                                <img
                                    src="/Ascend.png"
                                    alt="Ascend Icon"
                                    className="h-11 sm:h-12 w-auto object-contain drop-shadow-xs"
                                />
                                {/* Explicit Ascend Brand Name in Primary Navy Blue */}
                                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B3A67] dark:text-white">
                                    Ascend
                                </span>
                            </div>
                            <span className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-[#0B3A67] dark:text-[#93C5FD] uppercase">
                                INTEGRATED ACADEMIC MANAGEMENT
                            </span>
                        </Link>

                        {/* Pill Tag */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1F5F9] dark:bg-[#1E293B] text-[#0B3A67] dark:text-[#93C5FD] border border-[#CBD5E1] dark:border-[#334155]">
                            <span>Academic</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>Governance</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>Operations</span>
                        </div>
                    </div>

                    {/* Header Title */}
                    <div className="text-center space-y-0.5 mb-3.5">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111827] dark:text-white">
                            Log in to your account
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-normal">
                            Access your Ascend account to manage academic operations, records, and institutional services.
                        </p>
                    </div>

                    {/* Status Alert if any */}
                    {status && (
                        <div className="mb-2.5 rounded-lg bg-blue-50 border border-blue-200 p-2 text-center text-xs font-semibold text-[#0B3A67] dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200">
                            {status}
                        </div>
                    )}

                    {/* Card container for Login inputs */}
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4.5 sm:p-5 shadow-lg shadow-slate-200/40 dark:shadow-none">
                        <form className="flex flex-col gap-3" onSubmit={submit}>
                            {/* Email Field with Icon */}
                            <div className="grid gap-1">
                                <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-slate-200">
                                    <Mail className="size-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
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
                                    className="h-9 rounded-xl border-slate-200 bg-[#F8FAFC] dark:bg-[#1E293B] px-3 text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0B3A67] focus-visible:ring-1 focus-visible:ring-[#0B3A67]/20 dark:border-[#334155] dark:text-white"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password Field with Icon and Eye Toggle */}
                            <div className="grid gap-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-slate-200">
                                        <Lock className="size-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-[11px] font-bold text-[#1F5D9B] hover:text-[#0B3A67] hover:underline dark:text-[#93C5FD]"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className="h-9 rounded-xl border-slate-200 bg-[#F8FAFC] dark:bg-[#1E293B] pl-3 pr-9 text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#0B3A67] focus-visible:ring-1 focus-visible:ring-[#0B3A67]/20 dark:border-[#334155] dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', !!checked)}
                                    tabIndex={3}
                                    className="size-3.5 rounded border-slate-300 data-[state=checked]:bg-[#0B3A67] data-[state=checked]:border-[#0B3A67] data-[state=checked]:text-white focus-visible:ring-[#0B3A67]"
                                />
                                <Label htmlFor="remember" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                    Remember me
                                </Label>
                            </div>

                            {/* Gradient Dual Button (Navy Blue to Maroon) */}
                            <Button
                                type="submit"
                                className="h-10 w-full bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] hover:opacity-95 text-white font-bold shadow-md shadow-[#0B3A67]/20 transition-all rounded-xl text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 mt-0.5 border-0"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                    <LogIn className="h-4 w-4" />
                                )}
                                <span>Log In</span>
                            </Button>

                            {/* Divider with subtle OR ACCESS text */}
                            <div className="relative my-0.5">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-[#334155]" />
                                </div>
                                <div className="relative flex justify-center text-[9px] tracking-wider uppercase font-semibold">
                                    <span className="bg-white dark:bg-[#0F172A] px-2.5 text-slate-400 dark:text-slate-500">
                                        OR ACCESS
                                    </span>
                                </div>
                            </div>

                            {/* Enter TV Display Code Button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setTvError(null);
                                    setIsTvCodeOpen(true);
                                }}
                                className="h-9 w-full border-slate-200 hover:border-[#1F5D9B] bg-white hover:bg-[#F8FAFC] dark:border-slate-700 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#111827] dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-2xs"
                            >
                                <Tv className="h-3.5 w-3.5 text-[#8B1E3F] dark:text-[#F43F5E]" />
                                Enter TV Display Code
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Footer copyright */}
                <div className="w-full text-center text-[11px] text-slate-400 dark:text-slate-600 py-1">
                    &copy; {new Date().getFullYear()} Ascend • Davao del Sur State College
                </div>
            </div>

            {/* RIGHT COLUMN: Building DevCom Photo with Navy Blue to Deep Maroon Gradient Overlay (Strict 100vh) */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] h-full relative overflow-hidden flex-col justify-between p-8 xl:p-12 text-white select-none">
                {/* Background Image: Building DevCom.jpg */}
                <img
                    src="/Building DevCom.jpg"
                    alt="DSSC Building DevCom"
                    className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.95]"
                />

                {/* Dual Gradient Overlay: Deep Navy Blue from top/left into Deep Maroon at bottom/right */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B3A67]/92 via-[#0B3A67]/80 to-[#68152E]/92 backdrop-blur-[0.5px] pointer-events-none" />

                {/* Subtle wavy bottom accent ribbons */}
                <div className="absolute -bottom-16 -left-16 right-0 h-56 pointer-events-none opacity-40">
                    <svg viewBox="0 0 1200 400" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path
                            d="M0,200 C300,100 600,300 1200,120 L1200,400 L0,400 Z"
                            fill="url(#wave-gradient-1)"
                        />
                        <path
                            d="M0,240 C400,160 800,280 1200,180 L1200,400 L0,400 Z"
                            fill="url(#wave-gradient-2)"
                            opacity="0.6"
                        />
                        <defs>
                            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1F5D9B" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#8B1E3F" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0B3A67" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#68152E" stopOpacity="0.9" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Top Header Pill Tag */}
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white text-[#111827] shadow-lg text-xs font-bold tracking-tight">
                        <span className="size-2.5 rounded-full bg-[#8B1E3F]" />
                        <span>Davao del Sur State College — Ascend Ecosystem</span>
                    </div>
                </div>

                {/* Center Hero Heading & Feature Cards matching the design */}
                <div className="relative z-10 flex flex-col justify-center my-auto max-w-xl">
                    <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-black tracking-tight text-white leading-[1.15]">
                        A Unified Platform for Academic Excellence
                    </h2>

                    {/* Red/Maroon accent underline bar */}
                    <div className="w-14 h-1.5 rounded-full bg-[#8B1E3F] mt-3.5 mb-3.5" />

                    <p className="text-sm xl:text-base text-slate-100 font-normal leading-relaxed max-w-lg">
                        Streamline institutional governance, faculty submissions, real-time compliance deadlines,
                        departmental scheduling, and campus TV broadcasts seamlessly.
                    </p>

                    {/* 4 Feature Badges/Cards in a row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        {/* 1. Academic Operations */}
                        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-lg hover:bg-white/15 transition-all">
                            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center mb-1.5">
                                <Calendar className="size-4.5 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">
                                Academic<br />Operations
                            </span>
                        </div>

                        {/* 2. Institutional Governance */}
                        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-lg hover:bg-white/15 transition-all">
                            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center mb-1.5">
                                <Layers className="size-4.5 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">
                                Institutional<br />Governance
                            </span>
                        </div>

                        {/* 3. Faculty & Personnel */}
                        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-lg hover:bg-white/15 transition-all">
                            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center mb-1.5">
                                <Users className="size-4.5 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">
                                Faculty &<br />Personnel
                            </span>
                        </div>

                        {/* 4. TV Display & Announcements */}
                        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-lg hover:bg-white/15 transition-all">
                            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center mb-1.5">
                                <Monitor className="size-4.5 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">
                                TV Display<br />& Announcements
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom spacer for clean balanced alignment */}
                <div className="relative z-10 text-[11px] text-slate-300 font-medium">
                    Integrated Enterprise System • Davao del Sur State College
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
