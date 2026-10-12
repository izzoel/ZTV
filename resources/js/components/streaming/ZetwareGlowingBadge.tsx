import React from 'react';

interface ZetwareGlowingBadgeProps {
    variant?: 'overlay' | 'header' | 'compact';
    qualityText?: string;
    className?: string;
}

export default function ZetwareGlowingBadge({
    variant = 'overlay',
    qualityText = 'Direct MP4',
    className = ''
}: ZetwareGlowingBadgeProps) {
    if (variant === 'header') {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.35)] backdrop-blur-xl ${className}`}>
                {/* Glowing Z Emblem */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse">
                    <span className="font-black text-white text-[11px] leading-none drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]">
                        Z
                    </span>
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white tracking-wider uppercase drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                        Zetware Direct
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                </div>
                <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded">
                    {qualityText}
                </span>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/90 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)] ${className}`}>
                <div className="relative flex items-center justify-center w-4 h-4 rounded bg-gradient-to-br from-red-600 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                    <span className="font-black text-white text-[9px]">Z</span>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                    Zetware ID
                </span>
            </div>
        );
    }

    // Default: 'overlay' floating inside the player viewport
    return (
        <div className={`pointer-events-none select-none flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.45)] ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            {/* Glowing Z Emblem with double pulse ring */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-[0_0_16px_rgba(239,68,68,1)] animate-pulse shrink-0">
                <span className="font-black text-white text-base tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,1)]">
                    Z
                </span>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-90" />
                <div className="absolute inset-0 rounded-xl border border-white/40 animate-pulse" />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white tracking-widest uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
                        ZETWARE NATIVE
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                        ONLINE
                    </span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono font-medium -mt-0.5">
                    Direct High Speed • {qualityText}
                </span>
            </div>
        </div>
    );
}
