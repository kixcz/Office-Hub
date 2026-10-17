import React, { useMemo } from 'react';
import { Trophy, Award, Sparkles, Star, PartyPopper } from 'lucide-react';

export type CelebrationAnimationType = 'confetti' | 'balloons' | 'floating_trophies' | 'medals' | 'sparkles' | 'applause' | 'none';

interface CelebrationEffectsProps {
    type?: CelebrationAnimationType | string;
    isPreview?: boolean;
}

export function CelebrationEffects({ type = 'confetti', isPreview = false }: CelebrationEffectsProps) {
    if (!type || type === 'none') return null;

    // Confetti particles
    const confettiPieces = useMemo(() => {
        const count = isPreview ? 24 : 50;
        const colors = [
            'bg-amber-400',
            'bg-rose-400',
            'bg-yellow-300',
            'bg-indigo-400',
            'bg-emerald-400',
            'bg-fuchsia-400',
            'bg-cyan-300',
        ];
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${(i * 100) / count + (Math.sin(i) * 3)}%`,
            delay: `${(i * 0.15) % 3.5}s`,
            duration: `${3 + ((i * 0.4) % 2.5)}s`,
            color: colors[i % colors.length],
            width: `${6 + (i % 6)}px`,
            height: `${10 + (i % 8)}px`,
            rotation: `${(i * 45) % 360}deg`,
        }));
    }, [isPreview]);

    // Balloons floating up
    const balloons = useMemo(() => {
        const count = isPreview ? 6 : 14;
        const colors = [
            { bg: 'from-pink-500 to-rose-600', border: 'border-pink-300' },
            { bg: 'from-amber-400 to-yellow-500', border: 'border-amber-200' },
            { bg: 'from-cyan-400 to-blue-500', border: 'border-cyan-200' },
            { bg: 'from-purple-500 to-indigo-600', border: 'border-purple-300' },
            { bg: 'from-emerald-400 to-teal-500', border: 'border-emerald-200' },
        ];
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${8 + (i * (84 / count))}%`,
            delay: `${(i * 0.4) % 4}s`,
            duration: `${5 + (i % 3)}s`,
            theme: colors[i % colors.length],
            size: isPreview ? 24 + (i % 12) : 42 + (i % 24),
        }));
    }, [isPreview]);

    // Floating trophies
    const trophies = useMemo(() => {
        const count = isPreview ? 4 : 8;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${10 + (i * (80 / count))}%`,
            top: `${20 + ((i * 25) % 60)}%`,
            delay: `${i * 0.5}s`,
            duration: `${4 + (i % 3)}s`,
            size: isPreview ? 18 : 36,
        }));
    }, [isPreview]);

    // Floating medals
    const medals = useMemo(() => {
        const count = isPreview ? 4 : 8;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${12 + (i * (78 / count))}%`,
            top: `${15 + ((i * 30) % 65)}%`,
            delay: `${i * 0.4}s`,
            duration: `${3.5 + (i % 2.5)}s`,
            size: isPreview ? 18 : 34,
        }));
    }, [isPreview]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Confetti Animation */}
            {type === 'confetti' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes confettiFall {
                            0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 0.9; }
                            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                        }
                    `}</style>
                    {confettiPieces.map((piece) => (
                        <div
                            key={piece.id}
                            className={`absolute rounded-sm ${piece.color} shadow-sm`}
                            style={{
                                left: piece.left,
                                top: '-20px',
                                width: piece.width,
                                height: piece.height,
                                animation: `confettiFall ${piece.duration} ease-in-out infinite`,
                                animationDelay: piece.delay,
                                transform: `rotate(${piece.rotation})`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Balloons Animation */}
            {type === 'balloons' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes balloonRise {
                            0% { transform: translateY(110vh) scale(0.8) rotate(-4deg); opacity: 0; }
                            15% { opacity: 0.85; }
                            85% { opacity: 0.85; }
                            100% { transform: translateY(-120px) scale(1) rotate(6deg); opacity: 0; }
                        }
                    `}</style>
                    {balloons.map((b) => (
                        <div
                            key={b.id}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: b.left,
                                bottom: '-80px',
                                animation: `balloonRise ${b.duration} ease-in-out infinite`,
                                animationDelay: b.delay,
                            }}
                        >
                            <div
                                className={`rounded-full bg-gradient-to-t ${b.theme.bg} border ${b.theme.border} shadow-lg opacity-85 relative`}
                                style={{ width: b.size, height: b.size * 1.25 }}
                            >
                                <div className="absolute top-1.5 left-2 w-2 h-3.5 bg-white/40 rounded-full blur-[0.5px]" />
                            </div>
                            <div className="w-[1.5px] h-10 bg-white/30" />
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Trophies */}
            {type === 'floating_trophies' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes floatGently {
                            0%, 100% { transform: translateY(0px) scale(0.95) rotate(-3deg); }
                            50% { transform: translateY(-18px) scale(1.05) rotate(4deg); }
                        }
                    `}</style>
                    {trophies.map((t) => (
                        <div
                            key={t.id}
                            className="absolute flex items-center justify-center p-2 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 shadow-xl backdrop-blur-xs"
                            style={{
                                left: t.left,
                                top: t.top,
                                animation: `floatGently ${t.duration} ease-in-out infinite`,
                                animationDelay: t.delay,
                            }}
                        >
                            <Trophy style={{ width: t.size, height: t.size }} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Medals Animation */}
            {type === 'medals' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes medalSway {
                            0%, 100% { transform: translateY(0px) rotate(-6deg); }
                            50% { transform: translateY(-16px) rotate(6deg); }
                        }
                    `}</style>
                    {medals.map((m) => (
                        <div
                            key={m.id}
                            className="absolute flex items-center justify-center p-2 rounded-2xl bg-yellow-500/15 border border-yellow-300/40 text-yellow-300 shadow-xl backdrop-blur-xs"
                            style={{
                                left: m.left,
                                top: m.top,
                                animation: `medalSway ${m.duration} ease-in-out infinite`,
                                animationDelay: m.delay,
                            }}
                        >
                            <Award style={{ width: m.size, height: m.size }} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Sparkles / Starlight Glint */}
            {type === 'sparkles' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes twinkleGlint {
                            0%, 100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
                            50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
                        }
                    `}</style>
                    {Array.from({ length: isPreview ? 8 : 18 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-amber-200"
                            style={{
                                left: `${5 + ((i * 17) % 90)}%`,
                                top: `${10 + ((i * 23) % 80)}%`,
                                animation: `twinkleGlint ${2.5 + (i % 2)}s ease-in-out infinite`,
                                animationDelay: `${(i * 0.3) % 2.5}s`,
                            }}
                        >
                            <Sparkles className={isPreview ? 'w-4 h-4' : 'w-7 h-7 text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]'} />
                        </div>
                    ))}
                </div>
            )}

            {/* Applause / Hands cheering */}
            {type === 'applause' && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes applausePop {
                            0% { transform: scale(0.7) translateY(20px); opacity: 0; }
                            50% { transform: scale(1.15) translateY(-5px); opacity: 1; }
                            100% { transform: scale(1) translateY(0px); opacity: 0.9; }
                        }
                    `}</style>
                    <div className="absolute bottom-3 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-amber-400/50 shadow-2xl backdrop-blur-md text-amber-300">
                        <span className="text-xl animate-bounce">👏</span>
                        <span className="text-xl animate-bounce [animation-delay:0.15s]">🎉</span>
                        <span className="text-xl animate-bounce [animation-delay:0.3s]">👏</span>
                        <span className="text-xs font-black uppercase tracking-wider text-amber-200">Standing Ovation</span>
                    </div>
                </div>
            )}
        </div>
    );
}
