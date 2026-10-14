import React, { useState, useEffect } from 'react';
import { Zap, Check, ChevronDown, Monitor, Subtitles, Upload } from 'lucide-react';
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
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-11 right-0 w-64 sm:w-72 bg-slate-950/95 border border-yellow-500/40 rounded-2xl p-2.5 shadow-2xl z-50 text-xs backdrop-blur-2xl space-y-2.5 animate-in fade-in zoom-in-95">
                        {/* Header: Title & Default Preference Toggle */}
                        <div className="px-1 py-0.5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="font-extrabold text-white text-xs">Zetware Cloud</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleDefaultPref}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                    isDefault
                                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                }`}
                                title="Atur Zetware Cloud sebagai server default di cookies"
                            >
                                {isDefault ? 'Aktif' : 'Mati'}
                            </button>
                        </div>

                        {/* Pilihan Resolusi Video */}
                        {streams && streams.length > 0 && (
                            <div>
                                <div className="px-1 py-1 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                    <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Pilih Resolusi Video</span>
                                </div>
                                <div className="space-y-1 mt-1 max-h-36 overflow-y-auto no-scrollbar">
                                    {streams.map((st) => (
                                        <button
                                            key={st.url}
                                            type="button"
                                            onClick={() => {
                                                onSelectStream?.(st.url);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold ${
                                                currentStreamUrl === st.url
                                                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                                                    : 'text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Zap className="w-3 h-3 fill-current" />
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
                            <div className="space-y-1 mt-1 max-h-36 overflow-y-auto no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelectSubtitle?.('off');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold ${
                                        selectedSubtitleId === 'off'
                                            ? 'bg-emerald-500 text-slate-950 font-black'
                                            : 'text-slate-300 hover:bg-white/10'
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
                                            className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold ${
                                                selectedSubtitleId === sub.id
                                                    ? 'bg-emerald-500 text-slate-950 font-black'
                                                    : 'text-slate-300 hover:bg-white/10'
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
                                    <div className="px-2 py-1.5 text-slate-400 text-[11px] text-center">
                                        {isLoadingSubtitles
                                            ? 'Sedang mencari subtitle...'
                                            : 'Subtitle belum tersedia'}
                                    </div>
                                )}
                            </div>

                            {/* Unggah Subtitle Lokal */}
                            {onUploadSubtitle && (
                                <div className="pt-1.5 mt-1 border-t border-white/10">
                                    <label className="w-full px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 text-[11px] font-semibold cursor-pointer transition">
                                        <Upload className="w-3 h-3 text-emerald-400" />
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
                </>
            )}
        </div>
    );
}
