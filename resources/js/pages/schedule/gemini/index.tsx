import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Bot,
    Sparkles,
    Send,
    HelpCircle,
    Building2,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Gemini Assistant', href: '/schedule/gemini' },
];

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    stats: {
        faculties: number;
        offerings: number;
        unassigned: number;
    };
}

interface Message {
    id: number;
    sender: 'user' | 'gemini';
    text: string;
    timestamp: string;
}

export default function GeminiSchedulingAssistantIndex({
    currentPeriod,
    academicPeriods,
    stats,
}: Props) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'gemini',
            text: 'Hello Super Admin! I am your Gemini Scheduling Assistant. I can help explain faculty workloads, diagnose unassigned offerings, interpret review flags, and translate institutional policies into proposed CP-SAT solver constraints. How can I assist with your timetable today?',
            timestamp: '09:00 AM',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        const questionText = input;
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/schedule/gemini/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ question: questionText }),
            });
            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'gemini',
                    text: data.answer,
                    timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'gemini',
                    text: 'Unable to reach Gemini intelligence endpoint. Operating on local solver constraints.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gemini Scheduling Assistant - CIDS OfficeHub" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/40 shadow-lg">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/30">
                            <Sparkles className="size-3.5" />
                            Module 23 • Natural Language Decision Support Layer
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Gemini Scheduling Assistant
                        </h1>
                        <p className="text-xs text-purple-200/90 max-w-2xl">
                            Intelligent explanations for faculty loading targets, room utilization patterns, review comments, and constraint optimization. All scheduling decisions are deterministically validated by Google OR-Tools CP-SAT.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" className="text-xs text-white border-white/20 hover:bg-white/10 bg-white/5">
                            <Link href="/schedule/generator">
                                Generator Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Chat and Explanations Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chat Thread */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[540px]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="size-4 text-purple-600" />
                                <span className="font-bold text-gray-900 text-xs">Conversational Assistance</span>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                                Read-Only Advisory Layer
                            </Badge>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {m.sender === 'gemini' && (
                                        <div className="size-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                                            <Sparkles className="size-3.5" />
                                        </div>
                                    )}
                                    <div
                                        className={`p-3 rounded-2xl max-w-md ${
                                            m.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-purple-50/70 text-gray-800 border border-purple-100 rounded-tl-none'
                                        }`}
                                    >
                                        <p className="leading-relaxed">{m.text}</p>
                                        <span
                                            className={`text-[9px] block mt-1 text-right ${
                                                m.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                                            }`}
                                        >
                                            {m.timestamp}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-purple-600 text-xs italic">
                                    <RefreshCw className="size-3.5 animate-spin" />
                                    Gemini is analyzing scheduling constraints and master data...
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Gemini about underloads, lab conflicts, or constraint rules..."
                                className="text-xs h-9"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-4 gap-1.5"
                            >
                                <Send className="size-3.5" /> Send
                            </Button>
                        </form>
                    </div>

                    {/* Quick Guidance / Example Prompts */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                                Example Inquiries
                            </h3>

                            <div className="space-y-2 text-xs">
                                <button
                                    onClick={() => setInput('Why is a faculty member underloaded or overloaded?')}
                                    className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-900 border border-gray-100 transition-colors"
                                >
                                    &ldquo;Why is a faculty member underloaded or overloaded?&rdquo;
                                </button>
                                <button
                                    onClick={() => setInput('Which constraints are preventing a feasible timetable?')}
                                    className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-900 border border-gray-100 transition-colors"
                                >
                                    &ldquo;Which constraints are preventing a feasible timetable?&rdquo;
                                </button>
                                <button
                                    onClick={() => setInput('What is the current computer laboratory utilization?')}
                                    className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-900 border border-gray-100 transition-colors"
                                >
                                    &ldquo;What is the current computer laboratory utilization?&rdquo;
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2 text-xs">
                            <div className="font-bold text-purple-950 flex items-center gap-1.5">
                                <Sparkles className="size-4 text-purple-600" />
                                Deterministic Guard
                            </div>
                            <p className="text-purple-900/80 leading-relaxed text-[11px]">
                                Gemini assists with intent extraction and contradiction detection. It cannot unilaterally override hard constraints or publish schedules without Super Admin and Dean approval.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
