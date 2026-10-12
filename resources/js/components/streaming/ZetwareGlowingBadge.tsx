import React from 'react';
import { Zap } from 'lucide-react';

interface ZetwareGlowingBadgeProps {
    variant?: 'header' | 'compact' | 'overlay';
    qualityText?: string;
    className?: string;
}

export default function ZetwareGlowingBadge({
    variant = 'header',
    className = ''
}: ZetwareGlowingBadgeProps) {
    // If overlay is requested, do not render inside player frame
    if (variant === 'overlay') {
        return null;
    }

    return (
        <div
            className={`relative inline-flex items-center justify-center p-1 sm:p-1.5 rounded-xl bg-slate-950/85 border border-yellow-400/50 shadow-[0_0_18px_rgba(234,179,8,0.4)] backdrop-blur-xl group select-none transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(250,204,21,0.7)] ${className}`}
            title="Zetware Direct"
            aria-label="Zetware Direct"
        >
            {/* Ambient electric aura */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-400/20 to-yellow-500/10 opacity-80 animate-pulse pointer-events-none" />

            {/* Lightning Z Emblem */}
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_0_14px_rgba(250,204,21,0.9)] border border-yellow-200/60 overflow-visible">
                {/* Electric flash shine */}
                <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse pointer-events-none" />

                {/* Bold Z character */}
                <span className="font-black text-slate-950 text-sm sm:text-base italic tracking-tighter leading-none select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                    Z
                </span>

                {/* Lightning Bolt (Petir) Accent */}
                <Zap
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 text-yellow-200 fill-amber-300 drop-shadow-[0_0_6px_rgba(250,204,21,1)] animate-bounce"
                    style={{ animationDuration: '2.5s' }}
                />

                {/* Electric cyan spark */}
                <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping opacity-80" />
            </div>
        </div>
    );
}
