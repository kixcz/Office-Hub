import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-zinc-950 font-sans selection:bg-amber-400 selection:text-slate-950">
            <Head title="Log in" />

            {/* DIV 1: Left Half - Centered Login Form with Logo on top */}
            <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-zinc-950 z-10 overflow-y-auto">
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
                    {/* Logo on top of the login form */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <Link href={route('home')} className="group flex flex-col items-center transition-transform hover:scale-105 duration-200">
                            <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 p-2.5 border-2 border-amber-300 shadow-lg shadow-amber-400/15 flex items-center justify-center">
                                <AppLogoIcon className="size-full object-contain rounded-xl" />
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                CIDS Office Hub
                            </div>
                        </Link>
                    </div>

                    {/* Header text */}
                    <div className="text-center space-y-1.5 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Login to your account
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Enter your email below to login to your account
                        </p>
                    </div>

                    {/* Status Alert if any */}
                    {status && (
                        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                            {status}
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                                placeholder="m@example.com"
                                className="h-11 rounded-lg border-slate-200 bg-white px-3.5 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/30 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs sm:text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline dark:text-amber-400"
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
                                placeholder="Password"
                                className="h-11 rounded-lg border-slate-200 bg-white px-3.5 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/30 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center space-x-2.5 pt-0.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', !!checked)}
                                tabIndex={3}
                                className="border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-500 data-[state=checked]:text-slate-950 focus-visible:ring-amber-400"
                            />
                            <Label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                Remember me
                            </Label>
                        </div>

                        {/* Yellow Primary Login Button */}
                        <Button
                            type="submit"
                            className="mt-2 h-11 w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-400/25 transition-all rounded-lg text-sm sm:text-base border border-amber-500/30 cursor-pointer"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
                            Login
                        </Button>

                        {/* Divider */}
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-zinc-950 px-3 text-slate-400 dark:text-slate-500 font-medium">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Alternative Login Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full border-slate-200 bg-white hover:bg-amber-50/60 hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-all"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                />
                            </svg>
                            Login with GitHub
                        </Button>

                        {/* Sign up link */}
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                            Don't have an account?{' '}
                            <Link
                                href={route('register')}
                                className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-4 dark:text-amber-400"
                                tabIndex={6}
                            >
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer copyright */}
                <div className="w-full text-center text-xs text-slate-400 dark:text-slate-600 pt-4 pb-2">
                    &copy; {new Date().getFullYear()} CIDS Office Hub • College of Information and Computing Sciences
                </div>
            </div>

            {/* DIV 2: Right Half - Full Screen Yellow, Shades of Yellow, and White with Radial Sunburst */}
            <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-700 flex-col justify-between p-10 xl:p-14 text-slate-900 select-none">
                {/* Radial Glow and Background Accents */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4)_0%,_rgba(255,255,255,0.1)_40%,_transparent_75%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 size-96 rounded-full bg-yellow-200/40 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-amber-300/40 blur-3xl pointer-events-none" />

                {/* Mathematical Geometric Sunburst & Concentric Rings matching user's reference */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Concentric circles */}
                    <circle cx="400" cy="400" r="360" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" strokeDasharray="8 8" />
                    <circle cx="400" cy="400" r="280" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
                    <circle cx="400" cy="400" r="180" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
                    <circle cx="400" cy="400" r="95" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="2" fill="rgba(255, 255, 255, 0.08)" />

                    {/* 8 Radial Rays extending from center */}
                    <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="400" y2="800" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="117" y1="117" x2="683" y2="683" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                    <line x1="117" y1="683" x2="683" y2="117" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />

                    {/* Subtle outer orbit ring */}
                    <circle cx="400" cy="400" r="420" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                </svg>

                {/* Top header on right div */}
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-white text-xs font-bold text-amber-950 uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                        Integrated Academic Management
                    </div>
                    <span className="text-xs font-semibold text-amber-950/90 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-2xs">
                        OfficeHub TV & Portal
                    </span>
                </div>

                {/* Center of the radial graphic - Logo & Branding in White Squircle */}
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

                {/* Bottom glassmorphic showcase card */}
                <div className="relative z-10 w-full max-w-lg mx-auto">
                    <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 shadow-2xl border border-white text-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                            <span className="size-2 rounded-full bg-amber-500" />
                            College of Information and Computing Sciences
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
                            Welcome to CIDS Office Hub
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Streamline faculty submissions, track real-time compliance deadlines, coordinate departmental requests, and broadcast campus announcements seamlessly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
