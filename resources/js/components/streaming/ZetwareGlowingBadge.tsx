import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Zap,
    Check,
    ChevronDown,
    Monitor,
    Subtitles,
    Upload,
    X,
} from 'lucide-react';
import {
    isZetwareDefaultEnabled,
    setZetwareDefaultEnabled,
    ZetwareStreamOption,
    formatZetwareResolution,
} from '@/lib/zetwareStorage';
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
            if (
                customEvent.detail &&
                typeof customEvent.detail.enabled === 'boolean'
            ) {
                setIsDefault(customEvent.detail.enabled);
            }
        };

        window.addEventListener('ztv:zetware-default-changed', handleSync);
        return () => {
            window.removeEventListener(
                'ztv:zetware-default-changed',
                handleSync,
            );
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
                className={`group flex cursor-pointer items-center gap-2.5 rounded-2xl border bg-slate-950/80 px-3 py-2 text-xs font-bold shadow-md transition-all duration-300 active:scale-95 ${
                    isDefault || isPlayingZetware
                        ? 'border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                        : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-300'
                } ${className}`}
                title={
                    isDefault
                        ? 'Zetware Cloud: Server Default Aktif'
                        : 'Klik untuk jadikan Zetware Cloud server default'
                }
            >
                <div
                    className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 sm:h-6 sm:w-6 ${
                        isDefault || isPlayingZetware
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                            : 'bg-white/10 text-slate-400 group-hover:bg-white/15'
                    }`}
                >
                    <span className="text-xs leading-none font-black">Z</span>
                    <Zap
                        className={`absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                            isDefault || isPlayingZetware
                                ? 'fill-amber-300 text-yellow-200 drop-shadow-[0_0_4px_rgba(250,204,21,1)]'
                                : 'text-slate-500'
                        }`}
                    />
                </div>
                {/* <span className="text-white font-extrabold text-xs">⚡ Zetware Cloud</span> */}
                {/* <span className="text-[10px] text-amber-300/80 font-semibold">
                    {isDefault ? 'Default ON' : 'Pilih'}
                </span> */}
            </button>
        );
    }

    // Cari stream yang sedang aktif untuk menampilkan resolusi saat ini
    const activeStream = streams.find((s) => s.url === currentStreamUrl);
    const activeResInfo = formatZetwareResolution(
        activeStream?.resolution || qualityText,
        currentStreamUrl,
    );

    // Header variant: clean and informative button showing current resolution with dropdown
    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={handleButtonClick}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 shadow-md transition-all duration-200 active:scale-95 ${
                    isPlayingZetware
                        ? 'border-amber-400/60 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 text-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                        : 'border-white/15 bg-slate-900 text-slate-300 hover:border-amber-400/50 hover:text-white'
                } ${className}`}
                title="Pilih Resolusi Video Zetware Cloud & Subtitle"
            >
                {/* Iconic Lightning Z Emblem */}
                <div
                    className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isPlayingZetware
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                            : 'bg-white/10 text-slate-400 group-hover:bg-white/20'
                    }`}
                >
                    <span className="text-xs leading-none font-black select-none">
                        Z
                    </span>
                    <Zap
                        className={`absolute -top-1 -right-1 h-2.5 w-2.5 ${
                            isPlayingZetware
                                ? 'fill-amber-300 text-yellow-200 drop-shadow-[0_0_4px_rgba(250,204,21,1)]'
                                : 'text-slate-500'
                        }`}
                    />
                </div>

                {/* Current Active Resolution Badge */}
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="xs:inline hidden font-bold text-slate-300">
                        Zetware:
                    </span>
                    <span className="rounded-md border border-amber-400/40 bg-amber-400/25 px-1.5 py-0.5 text-[11px] font-black text-amber-300 shadow-sm">
                        {activeResInfo.badge}
                    </span>
                </div>

                {/* Chevron Down */}
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen
                            ? 'rotate-180 text-amber-300'
                            : 'text-amber-400/80'
                    }`}
                />
            </button>

            {/* Dropdown Menu: Resolusi & Subtitle */}
            {isOpen &&
                mounted &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end p-0 sm:items-center sm:justify-center sm:p-4">
                        <div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="pb-safe relative z-10 flex max-h-[85vh] w-full animate-in flex-col space-y-3.5 rounded-t-3xl border-t border-yellow-500/40 bg-slate-950/98 p-4 shadow-2xl backdrop-blur-2xl duration-200 slide-in-from-bottom sm:max-h-[80vh] sm:max-w-sm sm:rounded-3xl sm:border sm:p-5 sm:zoom-in-95 sm:slide-in-from-bottom-2">
                            {/* Mobile Drag Handle */}
                            <div className="mx-auto -mt-1 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-white/25 sm:hidden" />

                            {/* Header: Title, Default Switch & Close Button */}
                            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-1 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-xs font-black text-slate-950 shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                                        <span>Z</span>
                                        <Zap className="absolute -top-1 -right-1 h-2.5 w-2.5 fill-amber-300 text-yellow-200" />
                                    </div>
                                    <div>
                                        <span className="block text-xs leading-tight font-extrabold text-white sm:text-sm">
                                            Zetware Cloud
                                        </span>
                                        <span className="block text-[10px] text-amber-300/80">
                                            Super Cepat • Bebas Buffering
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleToggleDefaultPref}
                                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
                                            isDefault
                                                ? 'border-amber-400/50 bg-amber-400/20 text-amber-300'
                                                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                        }`}
                                        title="Atur Zetware Cloud sebagai server default di cookies"
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${isDefault ? 'animate-pulse bg-amber-400' : 'bg-slate-500'}`}
                                        />
                                        <span>
                                            {isDefault
                                                ? 'Default Aktif'
                                                : 'Jadikan Default'}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                                        title="Tutup"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="-mr-0.5 flex-1 space-y-3 overflow-y-auto pr-0.5 sm:space-y-3">
                                {/* Pilihan Resolusi Video */}
                                {streams && streams.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between px-1 py-1 text-[11px] font-bold text-amber-400">
                                            <span className="flex items-center gap-1.5">
                                                <Monitor className="h-3.5 w-3.5 text-amber-400" />
                                                <span>
                                                    Pilih Resolusi Video (
                                                    {streams.length} Tersedia)
                                                </span>
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Aktif: {activeResInfo.badge}
                                            </span>
                                        </div>
                                        <div className="no-scrollbar max-h-48 space-y-1.5 overflow-y-auto">
                                            {streams.map((st) => {
                                                const isSelected =
                                                    currentStreamUrl === st.url;
                                                const resInfo =
                                                    formatZetwareResolution(
                                                        st.resolution,
                                                        st.url,
                                                    );
                                                return (
                                                    <button
                                                        key={st.url}
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectStream?.(
                                                                st.url,
                                                            );
                                                            setIsOpen(false);
                                                        }}
                                                        className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-2.5 text-left transition active:scale-[0.99] ${
                                                            isSelected
                                                                ? 'border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-400/30'
                                                                : 'border-white/5 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <span
                                                                className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-black ${
                                                                    isSelected
                                                                        ? 'bg-slate-950 text-amber-300'
                                                                        : 'border border-amber-400/30 bg-white/10 text-amber-400'
                                                                }`}
                                                            >
                                                                {resInfo.badge}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={`truncate text-xs font-extrabold ${isSelected ? 'text-slate-950' : 'text-white'}`}
                                                                    >
                                                                        {
                                                                            resInfo.label
                                                                        }
                                                                    </span>
                                                                    {isSelected && (
                                                                        <span className="py-0.2 rounded bg-slate-950/20 px-1.5 text-[10px] font-bold text-slate-950">
                                                                            Sedang
                                                                            Diputar
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={`block truncate text-[10px] ${isSelected ? 'font-medium text-slate-900/80' : 'text-slate-400'}`}
                                                                >
                                                                    {
                                                                        resInfo.detail
                                                                    }{' '}
                                                                    •{' '}
                                                                    {
                                                                        st.resolution
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSelected ? (
                                                            <div className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-amber-400 shadow-sm">
                                                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                            </div>
                                                        ) : (
                                                            <span className="ml-2 text-[11px] font-semibold text-amber-400/80 hover:text-amber-300">
                                                                Pilih
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Pilihan Subtitle */}
                                <div className="border-t border-white/10 pt-2">
                                    <div className="flex items-center justify-between px-1 py-1 text-[11px] font-bold text-emerald-400">
                                        <div className="flex items-center gap-1.5">
                                            <Subtitles className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>
                                                Pilih Subtitle (Terjemahan)
                                            </span>
                                        </div>
                                        {isLoadingSubtitles && (
                                            <span className="animate-pulse text-[10px] font-normal text-emerald-400">
                                                Memuat...
                                            </span>
                                        )}
                                    </div>
                                    <div className="no-scrollbar mt-1 max-h-44 space-y-1.5 overflow-y-auto sm:max-h-36 sm:space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelectSubtitle?.('off');
                                                setIsOpen(false);
                                            }}
                                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition active:scale-[0.99] sm:px-2.5 sm:py-1.5 ${
                                                selectedSubtitleId === 'off'
                                                    ? 'bg-emerald-500 font-black text-slate-950'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>Matikan Subtitle (Off)</span>
                                            {selectedSubtitleId === 'off' && (
                                                <Check className="h-3.5 w-3.5 stroke-[3] text-slate-950" />
                                            )}
                                        </button>

                                        {subtitles && subtitles.length > 0 ? (
                                            subtitles.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectSubtitle?.(
                                                            sub.id,
                                                        );
                                                        setIsOpen(false);
                                                    }}
                                                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition active:scale-[0.99] sm:px-2.5 sm:py-1.5 ${
                                                        selectedSubtitleId ===
                                                        sub.id
                                                            ? 'bg-emerald-500 font-black text-slate-950'
                                                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="min-w-0 pr-1">
                                                        <div className="flex items-center gap-1.5">
                                                            {sub.lang ===
                                                                'id' && (
                                                                <span>⚡</span>
                                                            )}
                                                            <span className="truncate">
                                                                {sub.label}
                                                            </span>
                                                        </div>
                                                        {sub.fileName && (
                                                            <p
                                                                className={`truncate text-[10px] ${
                                                                    selectedSubtitleId ===
                                                                    sub.id
                                                                        ? 'text-slate-900/80'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {sub.fileName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {selectedSubtitleId ===
                                                        sub.id && (
                                                        <Check className="h-3.5 w-3.5 stroke-[3] text-slate-950" />
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-2 py-2 text-center text-[11px] text-slate-400">
                                                {isLoadingSubtitles
                                                    ? 'Sedang mencari subtitle...'
                                                    : 'Subtitle belum tersedia'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Unggah Subtitle Lokal */}
                                    {onUploadSubtitle && (
                                        <div className="mt-2 border-t border-white/10 pt-2">
                                            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 active:scale-[0.99] sm:text-[11px]">
                                                <Upload className="h-3.5 w-3.5 text-emerald-400" />
                                                <span>
                                                    Unggah Subtitle (.srt /
                                                    .vtt)
                                                </span>
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
                    document.body,
                )}
        </div>
    );
}
