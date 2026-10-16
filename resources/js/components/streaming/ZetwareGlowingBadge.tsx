import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Check, ChevronDown, Monitor, Subtitles, Upload, X } from 'lucide-react';
import { isZetwareDefaultEnabled, setZetwareDefaultEnabled, ZetwareStreamOption } from '@/lib/zetwareStorage';
import { SubtitleTrack } from '@/lib/subtitleService';

export interface ZetwareGlowingBadgeProps {
    variant?: 'header' | 'compact' | 'overlay';
    qualityText?: string;
    className?: string;
    isPlayingZetware?: boolean;
    streams?: ZetwareStreamOption[];
    currentStreamUrl?: string | null;
    onSelectStream?: (url: string) => void;
    subtitles?: SubtitleTrack[];
    selectedSubtitleId?: string | 'off';
    onSelectSubtitle?: (id: string | 'off') => void;
    isLoadingSubtitles?: boolean;
    onUploadSubtitle?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onActivateZetware?: () => void;
    onToggleDefault?: (enabled: boolean) => void;
}

export default function ZetwareGlowingBadge({
    variant = 'header',
    qualityText,
    className = '',
    isPlayingZetware = false,
    streams = [],
    currentStreamUrl,
    onSelectStream,
    subtitles = [],
    selectedSubtitleId = 'id',
    onSelectSubtitle,
    isLoadingSubtitles = false,
    onUploadSubtitle,
    onActivateZetware,
    onToggleDefault,
}: ZetwareGlowingBadgeProps) {
    if (variant === 'overlay') {
        return null;
    }

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isDefault, setIsDefault] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // Jika belum aktif, aktifkan pemutaran Zetware Cloud (ON) & simpan preferensi default
        if (!isPlayingZetware) {
            setZetwareDefaultEnabled(true);
            setIsDefault(true);
            if (onActivateZetware) {
                onActivateZetware();
            } else if (onToggleDefault) {
                onToggleDefault(true);
            }
        }

        // Buka / tutup dropdown pilihan resolusi & subtitle
        setIsOpen(!isOpen);
    };

    const handleToggleDefaultPref = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const nextVal = !isDefault;
        setIsDefault(nextVal);
        setZetwareDefaultEnabled(nextVal);
        if (onToggleDefault) {
            onToggleDefault(nextVal);
        }
    };

    // Compact variant for Detail Page
    if (variant === 'compact') {
        return (
            <button
                type="button"
                onClick={handleButtonClick}
                className={`px-3 py-2 rounded-2xl bg-slate-950/80 border text-xs font-bold flex items-center gap-2.5 shadow-md transition-all duration-300 cursor-pointer active:scale-95 group ${
                    isDefault || isPlayingZetware
                        ? 'border-amber-400/60 shadow-[0_0_15px_rgba(250,204,21,0.25)] text-amber-300'
                        : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-300'
                } ${className}`}
                title={
                    isDefault
                        ? 'Zetware Cloud: Server Default Aktif'
                        : 'Klik untuk jadikan Zetware Cloud server default'
                }
            >
                <div
                    className={`relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all duration-300 shrink-0 ${
                        isDefault || isPlayingZetware
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                            : 'bg-white/10 text-slate-400 group-hover:bg-white/15'
                    }`}
                >
                    <span className="font-black text-xs leading-none">Z</span>
                    <Zap
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                            isDefault || isPlayingZetware
                                ? 'text-yellow-200 fill-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)]'
                                : 'text-slate-500'
                        }`}
                    />
                </div>
                <span className="text-white font-extrabold text-xs">⚡ Zetware Cloud</span>
                <span className="text-[10px] text-amber-300/80 font-semibold">
                    {isDefault ? 'Default ON' : 'Pilih'}
                </span>
            </button>
        );
    }

    // Header variant: single clean button without internal switch.
    // Clicking turns ON Zetware Cloud & displays the dropdown for resolution and subtitle selection.
    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={handleButtonClick}
                className={`p-2 rounded-xl bg-slate-900 border flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer active:scale-95 group ${
                    isPlayingZetware
                        ? 'border-amber-500/50 text-amber-300 shadow-amber-500/20 hover:border-amber-400 hover:text-amber-200'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                } ${className}`}
                title="Zetware Cloud: Klik untuk aktifkan & pilih resolusi serta subtitle"
            >
                {/* Iconic Lightning Z Emblem */}
                <div
                    className={`relative flex items-center justify-center w-4 h-4 rounded transition-all duration-200 shrink-0 ${
                        isPlayingZetware
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                            : 'bg-white/10 text-slate-400 group-hover:bg-white/20'
                    }`}
                >
                    <span className="font-black text-[10px] leading-none select-none">Z</span>
                    <Zap
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${
                            isPlayingZetware
                                ? 'text-yellow-200 fill-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)]'
                                : 'text-slate-500'
                        }`}
                    />
                </div>

                {/* Current Resolution / Zetware Cloud Label */}
                {/* <span>{qualityText || 'Zetware Cloud'}</span> */}

                {/* Chevron Down */}
                {/* <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-amber-300' : 'text-amber-400/80'
                    }`}
                /> */}
            </button>

            {/* Dropdown Menu: Resolusi & Subtitle */}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative z-10 w-full sm:max-w-xs max-h-[85vh] sm:max-h-[80vh] bg-slate-950/98 border-t sm:border border-yellow-500/40 rounded-t-3xl sm:rounded-3xl p-4 sm:p-4 shadow-2xl backdrop-blur-2xl space-y-3.5 flex flex-col pb-safe animate-in slide-in-from-bottom sm:slide-in-from-bottom-2 sm:zoom-in-95 duration-200">
                        {/* Mobile Drag Handle */}
                        <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

                        {/* Header: Title, Default Switch & Close Button */}
                        <div className="px-1 pb-2 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_8px_rgba(250,204,21,0.8)] font-black text-xs shrink-0">
                                    <span>Z</span>
                                    <Zap className="absolute -top-1 -right-1 w-2.5 h-2.5 text-yellow-200 fill-amber-300" />
                                </div>
                                <div>
                                    <span className="font-extrabold text-white text-xs block leading-tight">Zetware Cloud</span>
                                    <span className="text-[10px] text-amber-300/80 block">Super Cepat & Bebas Iklan</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleToggleDefaultPref}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1 active:scale-95 ${
                                        isDefault
                                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                    }`}
                                    title="Atur Zetware Cloud sebagai server default di cookies"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isDefault ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                                    <span>{isDefault ? 'Default Aktif' : 'Jadikan Default'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                                    title="Tutup"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto space-y-3 sm:space-y-2.5 pr-0.5 -mr-0.5 flex-1">
                            {/* Pilihan Resolusi Video */}
                            {streams && streams.length > 0 && (
                                <div>
                                    <div className="px-1 py-1 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                        <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Pilih Resolusi Video</span>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-1 mt-1 max-h-44 sm:max-h-36 overflow-y-auto no-scrollbar">
                                        {streams.map((st) => (
                                            <button
                                                key={st.url}
                                                type="button"
                                                onClick={() => {
                                                    onSelectStream?.(st.url);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-3 sm:px-2.5 py-2.5 sm:py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold cursor-pointer active:scale-[0.99] ${
                                                    currentStreamUrl === st.url
                                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-400/30 ring-1 ring-white/50'
                                                        : 'text-slate-300 hover:bg-white/10 bg-white/5'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Zap className="w-3 h-3 fill-current text-amber-400" />
                                                    {st.label} MP4
                                                </span>
                                                {currentStreamUrl === st.url && (
                                                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pilihan Subtitle */}
                            <div className="border-t border-white/10 pt-2">
                                <div className="px-1 py-1 text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Pilih Subtitle (Terjemahan)</span>
                                    </div>
                                    {isLoadingSubtitles && (
                                        <span className="text-[10px] text-emerald-400 animate-pulse font-normal">
                                            Memuat...
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1.5 sm:space-y-1 mt-1 max-h-44 sm:max-h-36 overflow-y-auto no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectSubtitle?.('off');
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold cursor-pointer active:scale-[0.99] ${
                                            selectedSubtitleId === 'off'
                                                ? 'bg-emerald-500 text-slate-950 font-black'
                                                : 'text-slate-300 hover:bg-white/10 bg-white/5'
                                        }`}
                                    >
                                        <span>Matikan Subtitle (Off)</span>
                                        {selectedSubtitleId === 'off' && (
                                            <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                        )}
                                    </button>

                                    {subtitles && subtitles.length > 0 ? (
                                        subtitles.map((sub) => (
                                            <button
                                                key={sub.id}
                                                type="button"
                                                onClick={() => {
                                                    onSelectSubtitle?.(sub.id);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold cursor-pointer active:scale-[0.99] ${
                                                    selectedSubtitleId === sub.id
                                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                                        : 'text-slate-300 hover:bg-white/10 bg-white/5'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {sub.lang === 'id' && <span>⚡</span>}
                                                        <span className="truncate">{sub.label}</span>
                                                    </div>
                                                    {sub.fileName && (
                                                        <p
                                                            className={`text-[10px] truncate ${
                                                                selectedSubtitleId === sub.id
                                                                    ? 'text-slate-900/80'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {sub.fileName}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedSubtitleId === sub.id && (
                                                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-2 py-2 text-slate-400 text-[11px] text-center">
                                            {isLoadingSubtitles
                                                ? 'Sedang mencari subtitle...'
                                                : 'Subtitle belum tersedia'}
                                        </div>
                                    )}
                                </div>

                                {/* Unggah Subtitle Lokal */}
                                {onUploadSubtitle && (
                                    <div className="pt-2 mt-2 border-t border-white/10">
                                        <label className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 text-xs sm:text-[11px] font-semibold cursor-pointer transition active:scale-[0.99]">
                                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Unggah Subtitle (.srt / .vtt)</span>
                                            <input
                                                type="file"
                                                accept=".srt,.vtt"
                                                className="hidden"
                                                onChange={(e) => {
                                                    onUploadSubtitle(e);
                                                    setIsOpen(false);
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
