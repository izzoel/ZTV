import React, { useState, useEffect } from 'react';
import { Zap, Check, Sparkles } from 'lucide-react';
import { isZetwareDefaultEnabled, setZetwareDefaultEnabled } from '@/lib/zetwareStorage';

export interface ZetwareGlowingBadgeProps {
    variant?: 'header' | 'compact' | 'overlay';
    qualityText?: string;
    className?: string;
    isPlayingZetware?: boolean;
    showSwitch?: boolean;
    onToggleDefault?: (enabled: boolean) => void;
}

export default function ZetwareGlowingBadge({
    variant = 'header',
    qualityText,
    className = '',
    isPlayingZetware = false,
    showSwitch = true,
    onToggleDefault,
}: ZetwareGlowingBadgeProps) {
    // If overlay is requested, do not render inside player frame
    if (variant === 'overlay') {
        return null;
    }

    const [isDefault, setIsDefault] = useState<boolean>(false);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Sync initial state from cookies / session storage on client mount
    useEffect(() => {
        setIsDefault(isZetwareDefaultEnabled());

        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent<{ enabled: boolean }>;
            if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
                setIsDefault(customEvent.detail.enabled);
            }
        };

        window.addEventListener('ztv:zetware-default-changed', handleSync);
        return () => {
            window.removeEventListener('ztv:zetware-default-changed', handleSync);
        };
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const nextVal = !isDefault;
        setIsDefault(nextVal);
        setZetwareDefaultEnabled(nextVal);

        if (onToggleDefault) {
            onToggleDefault(nextVal);
        }

        // Show brief toast notification
        setToastMessage(
            nextVal
                ? '⚡ Zetware Cloud diaktifkan sebagai Server Default (Tersimpan di Cookie/Session)'
                : 'Zetware Cloud dinonaktifkan sebagai default (Tersimpan di Cookie/Session)'
        );
        setTimeout(() => {
            setToastMessage(null);
        }, 2500);
    };

    // Compact variant (e.g. for Detail Page next to Play button)
    if (variant === 'compact') {
        return (
            <div className={`relative inline-flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 border border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.25)] backdrop-blur-xl group select-none transition-all duration-300 hover:border-yellow-400/70 ${className}`}>
                {/* Emblem */}
                <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.8)] border border-yellow-200/60 shrink-0">
                    <span className="font-black text-slate-950 text-sm tracking-tighter leading-none">Z</span>
                    <Zap className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-200 fill-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)]" />
                </div>

                <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[11px] font-extrabold text-white leading-tight flex items-center gap-1">
                        Zetware Cloud
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    </span>
                    <span className="text-[9px] text-amber-300/80 font-medium">Direct MP4 Ultra Cepat</span>
                </div>

                {showSwitch && (
                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggle}
                            role="switch"
                            aria-checked={isDefault}
                            className={`relative inline-flex items-center h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-all duration-300 ease-in-out focus:outline-none ${
                                isDefault
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                                    : 'bg-slate-800 border-white/20 hover:border-white/40'
                            }`}
                            title={isDefault ? 'Zetware Cloud aktif sebagai default (tersimpan di cookies/session)' : 'Klik untuk jadikan Zetware Cloud server default'}
                        >
                            <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out flex items-center justify-center ${
                                    isDefault ? 'translate-x-4.5 bg-slate-950' : 'translate-x-0.5 bg-slate-300'
                                }`}
                            >
                                {isDefault && <Zap className="w-2.5 h-2.5 text-yellow-500 fill-yellow-400" />}
                            </span>
                        </button>
                        <span className={`text-[10px] font-bold ${isDefault ? 'text-amber-300' : 'text-slate-400'}`}>
                            {isDefault ? 'Def ON' : 'Def OFF'}
                        </span>
                    </div>
                )}

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-900 border border-yellow-400/50 text-[10px] text-yellow-200 font-semibold shadow-2xl shadow-black z-50 animate-in fade-in zoom-in-95">
                        {toastMessage}
                    </div>
                )}
            </div>
        );
    }

    // Header variant (e.g. for Video Player top-right control header)
    return (
        <div
            className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-yellow-400/40 shadow-[0_0_18px_rgba(234,179,8,0.3)] backdrop-blur-xl group select-none transition-all duration-300 hover:border-yellow-400/70 ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Ambient subtle glow background */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-400/15 to-yellow-500/10 opacity-70 pointer-events-none" />

            {/* Lightning Z Emblem */}
            <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.9)] border border-yellow-200/60 overflow-visible shrink-0">
                <span className="font-black text-slate-950 text-xs sm:text-sm tracking-tighter leading-none select-none">
                    Z
                </span>
                <Zap
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-yellow-200 fill-amber-300 drop-shadow-[0_0_5px_rgba(250,204,21,1)]"
                />
            </div>

            {/* Label and Status */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-[11px] sm:text-xs text-white tracking-tight">
                        Zetware Cloud
                    </span>
                    {isPlayingZetware && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aktif
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    {qualityText ? (
                        <span className="text-[9px] text-amber-300 font-semibold">{qualityText}</span>
                    ) : (
                        <span className="text-[9px] text-slate-400">Direct MP4</span>
                    )}
                </div>
            </div>

            {/* Switch Toggle for Default Preference */}
            {showSwitch && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
                    <button
                        type="button"
                        onClick={handleToggle}
                        role="switch"
                        aria-checked={isDefault}
                        className={`relative inline-flex items-center h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-all duration-300 ease-in-out focus:outline-none active:scale-95 ${
                            isDefault
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.7)]'
                                : 'bg-slate-800 border-white/20 hover:border-white/40'
                        }`}
                        title={
                            isDefault
                                ? 'Zetware Cloud aktif secara default (tersimpan di cookies/session)'
                                : 'Klik untuk jadikan Zetware Cloud server default otomatis'
                        }
                    >
                        <span className="sr-only">Set Zetware Cloud sebagai server default</span>
                        <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-md transition duration-300 ease-in-out flex items-center justify-center ${
                                isDefault
                                    ? 'translate-x-4.5 bg-slate-950 text-yellow-400'
                                    : 'translate-x-0.5 bg-slate-200 text-slate-700'
                            }`}
                        >
                            {isDefault ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                            )}
                        </span>
                    </button>
                    <span
                        className={`text-[9px] sm:text-[10px] font-bold tracking-tight select-none cursor-pointer ${
                            isDefault ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]' : 'text-slate-400'
                        }`}
                        onClick={handleToggle}
                    >
                        {isDefault ? 'Default ON' : 'Default OFF'}
                    </span>
                </div>
            )}

            {/* Notification / Toast Feedback */}
            {toastMessage && (
                <div className="absolute -bottom-9 right-0 whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-900 border border-yellow-400/60 text-[10px] text-yellow-300 font-semibold shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-top-1">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
