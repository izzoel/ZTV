import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, X, 
    MessageSquare, Sparkles, Server, Tv, Search, Layers, RefreshCw, AlertCircle, Film,
    ShieldCheck, ShieldAlert, Share2, ExternalLink, Copy, Check, Send, Globe, Code, CheckCircle2,
    Zap, Monitor, ChevronDown, Subtitles, Upload
} from 'lucide-react';
import { MediaItem, Episode } from '@/data/movies';
import { PLAYER_SOURCES, getSourceUrl, getTmdbIdForMedia } from '@/lib/streambertApi';
import { fetchTmdbEpisodes, fetchTmdbTvSeasons } from '@/lib/tmdbService';
import { checkZetwareMediaExists, ZetwareStreamOption, isZetwareDefaultEnabled } from '@/lib/zetwareStorage';
import { fetchSubtitlesForMedia, convertSrtToVttBlob, SubtitleTrack } from '@/lib/subtitleService';
import ZetwareGlowingBadge from '@/components/streaming/ZetwareGlowingBadge';

interface VideoPlayerModalProps {
    item: MediaItem | null;
    onClose: () => void;
    initialEpisodeNumber?: number;
    initialSeasonNumber?: number;
}

export default function VideoPlayerModal({
    item,
    onClose,
    initialEpisodeNumber = 1,
    initialSeasonNumber = 1
}: VideoPlayerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const frameContainerRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Zetware Cloud Direct Storage State
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(null);
    const [zetwareStreams, setZetwareStreams] = useState<ZetwareStreamOption[]>([]);
    const [isCheckingZetware, setIsCheckingZetware] = useState<boolean>(true);
    const [showResolutionMenu, setShowResolutionMenu] = useState<boolean>(false);

    // Streambert Engine State
    const [selectedSource, setSelectedSource] = useState<string>('vidsrc');
    const [useStreambertEmbed, setUseStreambertEmbed] = useState<boolean>(true);
    const [currentTmdbId, setCurrentTmdbId] = useState<string | number>('');
    const [selectedSeason, setSelectedSeason] = useState<number>(initialSeasonNumber);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisodeNumber);
    const [liveSeasons, setLiveSeasons] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([]);
    const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>([]);
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);
    const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
    const [showTmdbModal, setShowTmdbModal] = useState<boolean>(false);
    const [customTmdbInput, setCustomTmdbInput] = useState<string>('');

    // API Target Modal State
    const [showApiTargetModal, setShowApiTargetModal] = useState<boolean>(false);
    const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
        try {
            const saved = localStorage.getItem('ztv_api_target_base_url');
            if (saved && saved !== 'http://localhost:8000/api/stream') {
                return saved;
            }
            return 'http://100.81.252.14:8000/extract';
        } catch {
            return 'http://100.81.252.14:8000/extract';
        }
    });
    const [enableDownload, setEnableDownload] = useState<boolean>(true);
    const [testDownload, setTestDownload] = useState<boolean>(true);
    const [threads, setThreads] = useState<number>(2);
    const [targetM3u8Type, setTargetM3u8Type] = useState<'watch' | 'stream'>('watch');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [apiSending, setApiSending] = useState<boolean>(false);
    const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // HTML5 Video State (Fallback)
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.9);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [selectedSubtitles, setSelectedSubtitles] = useState<string | 'off'>('id');
    const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [isLoadingSubtitles, setIsLoadingSubtitles] = useState<boolean>(false);
    const [showEpisodeMenu, setShowEpisodeMenu] = useState<boolean>(false);

    // Initialize item data & TMDB ID
    useEffect(() => {
        if (item) {
            const tmdb = getTmdbIdForMedia(item.id, item.tmdbId);
            setCurrentTmdbId(tmdb);
            setCustomTmdbInput(String(tmdb));
            setSelectedEpisode(initialEpisodeNumber || 1);
            setSelectedSeason(initialSeasonNumber || 1);
            setIframeLoading(true);
        }
    }, [item, initialEpisodeNumber, initialSeasonNumber]);

    // Fetch live seasons & episodes when season or TMDB ID changes
    useEffect(() => {
        if (item?.type === 'series' && currentTmdbId) {
            fetchTmdbTvSeasons(currentTmdbId).then((seasons) => {
                if (seasons && seasons.length > 0) {
                    setLiveSeasons(seasons);
                }
            });
        }
    }, [item, currentTmdbId]);

    useEffect(() => {
        if (item?.type === 'series' && currentTmdbId) {
            fetchTmdbEpisodes(currentTmdbId, selectedSeason).then((eps) => {
                if (eps && eps.length > 0) {
                    setLiveEpisodes(eps);
                }
            });
        }
    }, [item, currentTmdbId, selectedSeason]);

    // Automatic check for Zetware Cloud MP4 availability
    useEffect(() => {
        let isMounted = true;
        if (!item) return;

        setIsCheckingZetware(true);
        checkZetwareMediaExists(item.title, item.type, selectedSeason, selectedEpisode).then((res) => {
            if (!isMounted) return;
            setIsCheckingZetware(false);
            if (res.exists && res.url) {
                setZetwareDirectUrl(res.url);
                setZetwareStreams(res.streams || [{ url: res.url, resolution: 'Direct MP4', label: 'Direct MP4' }]);
                // Aktifkan default otomatis jika preferensi pengguna di cookie/session aktif
                if (isZetwareDefaultEnabled()) {
                    setUseStreambertEmbed(false);
                }
            } else {
                setZetwareDirectUrl(null);
                setZetwareStreams([]);
                setUseStreambertEmbed(true);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [item, selectedSeason, selectedEpisode]);

    // Automatic fetch subtitles for Zetware Cloud / Local MP4 (Opsi B)
    useEffect(() => {
        let isMounted = true;
        if (!item) return;

        setIsLoadingSubtitles(true);
        fetchSubtitlesForMedia(
            currentTmdbId,
            item.type,
            selectedSeason,
            selectedEpisode
        ).then((subs) => {
            if (!isMounted) return;
            setIsLoadingSubtitles(false);
            setSubtitles(subs);
            if (subs.length > 0) {
                const defaultTrack = subs.find((s) => s.isDefault) || subs[0];
                setSelectedSubtitles(defaultTrack.id);
            } else {
                setSelectedSubtitles('off');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [item, currentTmdbId, selectedSeason, selectedEpisode]);

    // Sync HTML5 video textTracks when selectedSubtitles changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !video.textTracks) return;

        let isSyncing = false;
        const syncTracks = () => {
            if (isSyncing) return;
            isSyncing = true;
            try {
                const tracks = video.textTracks;
                const targetSub = subtitles.find((s) => s.id === selectedSubtitles);

                for (let i = 0; i < tracks.length; i++) {
                    const t = tracks[i];
                    const sub = subtitles[i];

                    // Strictly match by ID or exact unique label or corresponding index to prevent duplicate tracks showing simultaneously
                    const isSelected =
                        selectedSubtitles !== 'off' &&
                        ((t.id && t.id === selectedSubtitles) ||
                         (targetSub && t.label === targetSub.label) ||
                         (sub && sub.id === selectedSubtitles));

                    const targetMode = isSelected ? 'showing' : 'disabled';
                    if (t.mode !== targetMode) {
                        t.mode = targetMode;
                    }
                }
            } finally {
                isSyncing = false;
            }
        };

        syncTracks();
        const timer = setTimeout(syncTracks, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [selectedSubtitles, subtitles]);


    // Handle user uploading local subtitle file (.srt / .vtt)
    const handleUploadLocalSubtitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                const blobUrl = convertSrtToVttBlob(text);
                const customTrack: SubtitleTrack = {
                    id: `local-${Date.now()}`,
                    lang: 'id',
                    label: `Lokal (${file.name})`,
                    fileName: file.name,
                    url: blobUrl,
                    source: 'Lokal',
                    isDefault: true,
                };
                setSubtitles((prev) => [customTrack, ...prev]);
                setSelectedSubtitles(customTrack.id);
                setShowSubtitleMenu(false);
            }
        };
        reader.readAsText(file);
    };

    // Safety timeout timer for iframe server loading
    useEffect(() => {
        if (iframeLoading) {
            const timer = setTimeout(() => {
                setIframeLoading(false);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [iframeLoading, selectedSource, selectedSeason, selectedEpisode, currentTmdbId]);

    // Global Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }
            if (e.key.toLowerCase() === 'f') {
                toggleFullscreen();
            }
            if (e.key.toLowerCase() === 'm') {
                toggleMute();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isMuted]);

    if (!item) return null;

    const streamUrl = getSourceUrl(
        selectedSource,
        item.type,
        currentTmdbId || 27205,
        selectedSeason,
        selectedEpisode,
        'e50914',
        selectedSubtitles
    );

    const activeSourceObj = PLAYER_SOURCES.find((s) => s.id === selectedSource) || PLAYER_SOURCES[0];

    const togglePlay = () => {
        if (!useStreambertEmbed && videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const skipTime = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    const toggleFullscreen = () => {
        if (frameContainerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                frameContainerRef.current.requestFullscreen().catch(() => {});
            }
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleApplyCustomTmdb = (e: React.FormEvent) => {
        e.preventDefault();
        if (customTmdbInput.trim()) {
            setCurrentTmdbId(customTmdbInput.trim());
            setIframeLoading(true);
            setShowTmdbModal(false);
        }
    };

    // Target Query Parameters Calculation
    const targetTmdbId = String(currentTmdbId || (item ? getTmdbIdForMedia(item.id, item.tmdbId) : ''));
    
    const getTargetWatchUrl = () => {
        const domain = (typeof window !== 'undefined' && !window.location.origin.includes('localhost'))
            ? window.location.origin
            : 'https://cinema.zetware.id';
        const mediaId = item.id.startsWith('tmdb-') ? item.id : `tmdb-${item.type === 'series' ? 'tv' : 'mov'}-${targetTmdbId}`;
        const query = item.type === 'series' ? `?episode=${selectedEpisode}&season=${selectedSeason}` : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url = targetM3u8Type === 'watch' ? getTargetWatchUrl() : streamUrl;
    
    const targetTitle = item.type === 'series' 
        ? `${item.title.toUpperCase()} - S${selectedSeason}E${selectedEpisode}` 
        : item.title.toUpperCase();

    const detectedResolution = zetwareDirectUrl?.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1]
        ? `${zetwareDirectUrl.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1]} MP4`
        : 'Direct MP4';

    const handleSelectZetwareResolution = (newUrl: string) => {
        const videoEl = videoRef.current;
        const curTime = videoEl ? videoEl.currentTime : 0;
        const isPaused = videoEl ? videoEl.paused : false;

        setZetwareDirectUrl(newUrl);
        setUseStreambertEmbed(false);
        setShowResolutionMenu(false);
        setShowSourceMenu(false);

        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = curTime;
                if (!isPaused) {
                    videoRef.current.play().catch(() => {});
                }
            }
        }, 50);
    };

    const handleBaseUrlChange = (val: string) => {
        setApiBaseUrl(val);
        try {
            localStorage.setItem('ztv_api_target_base_url', val);
        } catch {
            // Ignore storage restriction
        }
    };

    const getTargetFullUrl = (baseUrl: string = apiBaseUrl) => {
        const trimmed = baseUrl.trim() || 'http://100.81.252.14:8000/extract';
        try {
            const parsed = new URL(trimmed);
            parsed.searchParams.set('tmdb_id', targetTmdbId);
            parsed.searchParams.set('m3u8_url', targetM3u8Url);
            parsed.searchParams.set('title', targetTitle);
            parsed.searchParams.set('enable_download', String(enableDownload));
            parsed.searchParams.set('test_download', String(testDownload));
            parsed.searchParams.set('threads', String(threads));
            return parsed.toString();
        } catch {
            const qs = new URLSearchParams({
                tmdb_id: targetTmdbId,
                m3u8_url: targetM3u8Url,
                title: targetTitle,
                enable_download: String(enableDownload),
                test_download: String(testDownload),
                threads: String(threads),
            }).toString();
            return `${trimmed}${trimmed.includes('?') ? '&' : '?'}${qs}`;
        }
    };

    const handleCopy = (text: string, fieldKey: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
        setCopiedField(fieldKey);
        setTimeout(() => {
            setCopiedField((curr) => (curr === fieldKey ? null : curr));
        }, 2000);
    };

    const handleSendApiRequest = async () => {
        setApiSending(true);
        setApiFeedback(null);
        try {
            const fullUrl = getTargetFullUrl();
            const res = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (res.ok) {
                setApiFeedback({
                    type: 'success',
                    message: `Berhasil terkirim! Status: ${res.status} ${res.statusText || 'OK'}`,
                });
            } else {
                setApiFeedback({
                    type: 'error',
                    message: `Respon server HTTP ${res.status}: ${res.statusText || 'Error'}`,
                });
            }
        } catch (err: any) {
            setApiFeedback({
                type: 'error',
                message: `Gagal memanggil API: ${err.message || 'CORS / Server unreachable'}`,
            });
        } finally {
            setApiSending(false);
        }
    };

    return (
        <div 
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none animate-in fade-in duration-200 cursor-pointer"
        >
            {/* FRAMED MODAL CONTAINER (BINGKAI PEMUTAR VIDEO) */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl bg-slate-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto border-red-500/20 cursor-default"
            >
                
                {/* 1. BINGKAI HEADER (HEADER DI ATAS VIDEO) */}
                <div className="relative z-30 p-3 sm:p-5 bg-slate-900/90 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 shrink-0">
                                <Film className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-lg font-extrabold text-white truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs md:max-w-none">
                                    {item.title}
                                </h2>

                                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:xs text-slate-300">
                                    <span className="text-emerald-400 font-semibold">
                                        {!useStreambertEmbed && zetwareDirectUrl ? '⚡ Zetware Cloud' : useStreambertEmbed ? activeSourceObj.label : 'Local MP4'}
                                    </span>
                                    <span>•</span>
                                    {item.type === 'series' && (
                                        <span className="text-red-400 font-mono font-bold">
                                            S{selectedSeason} : E{selectedEpisode}
                                        </span>
                                    )}
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline text-slate-400 truncate max-w-[120px] md:max-w-none">{item.genres.join(', ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* CLOSE BUTTON FOR SMALL MOBILE VIEW (Top right of title header) */}
                        <button
                            onClick={onClose}
                            className="sm:hidden px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-red-600/30 shrink-0 active:scale-95"
                            title="Tutup Player"
                            aria-label="Tutup Player"
                        >
                            <X className="w-4 h-4" />
                            <span>Tutup</span>
                        </button>
                    </div>

                    {/* HEADER CONTROL BUTTONS (DI ATAS BINGKAI) */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 justify-between sm:justify-end border-t border-white/5 sm:border-0 pt-2 sm:pt-0 relative z-30">
                        {/* Zetware Glowing Badge with Integrated Resolution & Subtitle Dropdown */}
                        {zetwareDirectUrl && (
                            <ZetwareGlowingBadge
                                variant="header"
                                qualityText={detectedResolution}
                                isPlayingZetware={!useStreambertEmbed}
                                streams={zetwareStreams}
                                currentStreamUrl={zetwareDirectUrl}
                                onSelectStream={handleSelectZetwareResolution}
                                subtitles={subtitles}
                                selectedSubtitleId={selectedSubtitles}
                                onSelectSubtitle={setSelectedSubtitles}
                                isLoadingSubtitles={isLoadingSubtitles}
                                onUploadSubtitle={handleUploadLocalSubtitle}
                                onActivateZetware={() => {
                                    setUseStreambertEmbed(false);
                                }}
                                onToggleDefault={(enabled) => {
                                    if (enabled) {
                                        setUseStreambertEmbed(false);
                                    } else {
                                        setUseStreambertEmbed(true);
                                    }
                                }}
                            />
                        )}

                        {/* SERVER SELECTOR BUTTON */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowSourceMenu(!showSourceMenu);
                                    setShowSubtitleMenu(false);
                                    setShowEpisodeMenu(false);
                                }}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer active:scale-95 ${
                                    !useStreambertEmbed && zetwareDirectUrl
                                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/50'
                                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                                }`}
                            >
                                <Server className="w-3.5 h-3.5" />
                                <span>Server: {!useStreambertEmbed && zetwareDirectUrl ? 'Zetware Cloud' : activeSourceObj.label}</span>
                            </button>

                            {/* SERVER DROPDOWN */}
                            {showSourceMenu && mounted && createPortal(
                                <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
                                    {/* Fullscreen Backdrop */}
                                    <div
                                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                                        onClick={() => setShowSourceMenu(false)}
                                    />

                                    {/* Modal Container: Bottom Sheet on Mobile, Centered Card on Desktop */}
                                    <div className="relative z-10 w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] bg-slate-950/98 border-t sm:border border-white/20 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl space-y-3.5 flex flex-col pb-safe animate-in slide-in-from-bottom sm:slide-in-from-bottom-2 sm:zoom-in-95 duration-200">
                                        {/* Mobile Drag Pill */}
                                        <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

                                        {/* Header with Title & Close Button */}
                                        <div className="px-1 pb-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                                                    <Server className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-white text-sm sm:text-base block leading-tight">Pilih Server Streaming</span>
                                                    <span className="text-[11px] sm:text-xs text-slate-400 block">Zetware Cloud & Server Cadangan</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowSourceMenu(false)}
                                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition active:scale-95"
                                                title="Tutup"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Scrollable Content */}
                                        <div className="overflow-y-auto space-y-3.5 pr-0.5 -mr-0.5 flex-1">
                                            {/* Option: Zetware Cloud Native File (If Available) */}
                                            {zetwareDirectUrl && (
                                                <div
                                                    className={`p-3.5 rounded-2xl transition border ${
                                                        !useStreambertEmbed
                                                            ? 'bg-gradient-to-br from-amber-500/20 via-slate-900/95 to-red-950/40 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-white ring-1 ring-amber-400/30'
                                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUseStreambertEmbed(false);
                                                            setShowSourceMenu(false);
                                                        }}
                                                        className="w-full text-left cursor-pointer group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(250,204,21,0.8)] font-black text-sm shrink-0">
                                                                    <span>Z</span>
                                                                    <Zap className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-200 fill-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)]" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-black text-white text-sm group-hover:text-amber-300 transition">Zetware Cloud</span>
                                                                        <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                                                                            Cepat & Jernih
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                                                                        Direct cloud MP4 tanpa buffer dari zetware.id
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {!useStreambertEmbed ? (
                                                                <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 shrink-0 shadow-sm">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                    <span>Aktif</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-xl bg-white/10 group-hover:bg-amber-400/20 text-slate-300 group-hover:text-amber-300 text-xs font-bold shrink-0 transition">
                                                                    Pilih
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Resolusi Selector di dalam Server Menu */}
                                                    {zetwareStreams.length > 0 && (
                                                        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                                                                    <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                                                    <span>Pilih Resolusi Video:</span>
                                                                </span>
                                                                <span className="text-slate-400 text-[11px]">
                                                                    {detectedResolution}
                                                                </span>
                              </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                {zetwareStreams.map((st) => {
                                                                    const isSelectedStream = !useStreambertEmbed && zetwareDirectUrl === st.url;
                                                                    return (
                                                                        <button
                                                                            key={st.url}
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSelectZetwareResolution(st.url);
                                                                                setUseStreambertEmbed(false);
                                                                                setShowSourceMenu(false);
                                                                            }}
                                                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                                                                isSelectedStream
                                                                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-400/30 ring-1 ring-white/50'
                                                                                    : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/5'
                                                                            }`}
                                                                        >
                                                                            <Zap className={`w-3 h-3 ${isSelectedStream ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
                                                                            <span>{st.label} MP4</span>
                                                                            {isSelectedStream && <Check className="w-3 h-3 stroke-[3]" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Server Alternatif */}
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>Server Alternatif (Embed / HLS)</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {PLAYER_SOURCES.map((src) => {
                                                        const isSelected = useStreambertEmbed && selectedSource === src.id;
                                                        return (
                                                            <button
                                                                key={src.id}
                                                                onClick={() => {
                                                                    setSelectedSource(src.id);
                                                                    setUseStreambertEmbed(true);
                                                                    setIframeLoading(true);
                                                                    setShowSourceMenu(false);
                                                                }}
                                                                className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between cursor-pointer active:scale-[0.99] border ${
                                                                    isSelected
                                                                        ? 'bg-red-600 border-red-500 text-white font-bold shadow-lg shadow-red-600/30'
                                                                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-extrabold text-white text-xs sm:text-sm">{src.label}</span>
                                                                        {src.tag && (
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                                isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-amber-300'
                                                                            }`}>
                                                                                {src.tag}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={`text-xs line-clamp-1 mt-0.5 ${
                                                                        isSelected ? 'text-red-100' : 'text-slate-400'
                                                                    }`}>
                                                                        {src.description}
                                                                    </p>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="w-5 h-5 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0">
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => {
                                                            setUseStreambertEmbed(false);
                                                            setShowSourceMenu(false);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between cursor-pointer active:scale-[0.99] border ${
                                                            !useStreambertEmbed
                                                                ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30'
                                                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                                        }`}
                                                    >
                                                        <div>
                                                            <span className="font-extrabold text-white text-xs sm:text-sm block">Local Sample MP4</span>
                                                            <p className={`text-xs mt-0.5 ${!useStreambertEmbed ? 'text-emerald-100' : 'text-slate-400'}`}>Pemutar video HTML5 bawaan</p>
                                                        </div>
                                                        {!useStreambertEmbed && (
                                                            <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0">
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>

                        {/* SERIAL TV EPISODE SELECTOR IN HEADER */}
                        {item.type === 'series' && (
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowEpisodeMenu(!showEpisodeMenu);
                                        setShowSourceMenu(false);
                                        setShowSubtitleMenu(false);
                                    }}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                                >
                                    <Tv className="w-3.5 h-3.5 text-red-500" />
                                    <span>S{selectedSeason} E{selectedEpisode}</span>
                                </button>

                                {showEpisodeMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setShowEpisodeMenu(false)}
                                        />
                                        <div className="absolute top-11 right-0 w-64 max-w-[calc(100vw-2rem)] bg-slate-950 border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2 backdrop-blur-2xl">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <span className="font-bold text-white">Pilih Musim & Episode</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block mb-1">Musim (Season):</span>
                                                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                    {(liveSeasons.length > 0
                                                        ? liveSeasons
                                                        : [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }, { seasonNumber: 2, name: 'Musim 2', episodeCount: 10 }]
                                                    ).map((s) => (
                                                        <button
                                                            key={s.seasonNumber}
                                                            onClick={() => {
                                                                setSelectedSeason(s.seasonNumber);
                                                                setSelectedEpisode(1);
                                                                setIframeLoading(true);
                                                            }}
                                                            className={`px-3 py-1 rounded-lg font-bold transition text-xs shrink-0 ${
                                                                selectedSeason === s.seasonNumber
                                                                    ? 'bg-red-600 text-white shadow-md'
                                                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                            }`}
                                                        >
                                                            {s.name || `Musim ${s.seasonNumber}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] text-slate-400 block mb-1">Episode:</span>
                                                <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto pr-1">
                                                    {(liveEpisodes.length > 0
                                                        ? liveEpisodes.map((ep) => ep.episodeNumber)
                                                        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                                    ).map((epNum) => {
                                                        const epData = liveEpisodes.find((e) => e.episodeNumber === epNum);
                                                        return (
                                                            <button
                                                                key={epNum}
                                                                onClick={() => {
                                                                    setSelectedEpisode(epNum);
                                                                    setIframeLoading(true);
                                                                    setShowEpisodeMenu(false);
                                                                }}
                                                                title={epData?.title || `Episode ${epNum}`}
                                                                className={`py-1.5 rounded-lg font-bold text-center transition text-xs ${
                                                                    selectedEpisode === epNum
                                                                        ? 'bg-red-600 text-white shadow-md'
                                                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                                }`}
                                                            >
                                                                Eps {epNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* FULLSCREEN BUTTON IN HEADER */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-95"
                            title="Layar Penuh Bingkai (F)"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>

                        {/* CUSTOM TMDB ID BUTTON */}
                        <button
                            onClick={() => setShowTmdbModal(true)}
                            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-95"
                            title="Ubah TMDB Stream ID"
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        {/* TARGET API BUTTON */}
                        <button
                            onClick={() => {
                                setApiFeedback(null);
                                setShowApiTargetModal(true);
                            }}
                            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                            title="Kirim / Preview Parameter Stream Target (tmdb_id, m3u8_url, title)"
                        >
                            <Share2 className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Target API</span>
                        </button>

                        {/* CLOSE BUTTON FOR TABLET/DESKTOP */}
                        <button
                            onClick={onClose}
                            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30 active:scale-95"
                            title="Tutup Player (Esc)"
                            aria-label="Tutup Player"
                        >
                            <X className="w-4 h-4" />
                            <span>Tutup</span>
                        </button>
                    </div>
                </div>

                {/* 2. FRAMED VIDEO VIEWPORT (BINGKAI PEMUTAR VIDEO) */}
                <div 
                    ref={frameContainerRef}
                    className="relative z-0 w-full aspect-video bg-black rounded-b-3xl overflow-hidden flex items-center justify-center"
                >
                    {useStreambertEmbed ? (
                        <>

                            {iframeLoading && (
                                <div className="absolute inset-0 z-10 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                                        <div className="w-20 h-20 border-2 border-red-500/10 border-b-red-500 rounded-full animate-spin absolute -inset-2" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                                        <Server className="w-6 h-6 text-red-500 absolute inset-0 m-auto animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-1.5 max-w-sm px-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            <RefreshCw className="w-3 h-3 animate-spin text-red-400" />
                                            Menghubungkan Server Streambert
                                        </div>
                                        <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                                            Menghubungkan Ke {activeSourceObj.label}...
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Media TMDB ID: <span className="font-mono text-red-400 font-bold">{currentTmdbId}</span>
                                            {item.type === 'series' && <span> • S{selectedSeason} E{selectedEpisode}</span>}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <iframe
                                ref={iframeRef}
                                src={streamUrl}
                                className="w-full h-full border-0"
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                allowFullScreen
                                onLoad={() => setIframeLoading(false)}
                                title={`Streambert Player - ${item.title}`}
                            />
                        </>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                            <video
                                ref={videoRef}
                                key={zetwareDirectUrl || item.videoUrl}
                                src={zetwareDirectUrl || item.videoUrl}
                                autoPlay
                                controls
                                className="w-full h-full object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                            >
                                {subtitles.map((sub) => (
                                    <track
                                        key={sub.id}
                                        id={sub.id}
                                        kind="subtitles"
                                        src={sub.url}
                                        srcLang={sub.lang}
                                        label={sub.label}
                                        default={selectedSubtitles === sub.id}
                                    />
                                ))}
                            </video>
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOM TMDB ID SEARCH MODAL */}
            {showTmdbModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Search className="w-5 h-5 text-red-500" />
                                Cari & Hubungkan TMDB Stream ID
                            </h3>
                            <button
                                onClick={() => setShowTmdbModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-300">
                            Masukkan ID Film / Seri dari Database TMDB (TheMovieDB) untuk memutar video dari server Streambert secara langsung.
                        </p>

                        <form onSubmit={handleApplyCustomTmdb} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">TMDB ID:</label>
                                <input
                                    type="text"
                                    value={customTmdbInput}
                                    onChange={(e) => setCustomTmdbInput(e.target.value)}
                                    placeholder="Contoh: 27205 (Inception), 157336 (Interstellar)"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-[11px] text-slate-300 space-y-1">
                                <span className="font-bold text-red-400 block flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Contoh ID TMDB Populer:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[
                                        { label: 'Inception (27205)', id: '27205' },
                                        { label: 'Interstellar (157336)', id: '157336' },
                                        { label: 'Fight Club (550)', id: '550' },
                                        { label: 'Peaky Blinders (60574)', id: '60574' },
                                        { label: 'Stranger Things (66732)', id: '66732' },
                                    ].map((demo) => (
                                        <button
                                            key={demo.id}
                                            type="button"
                                            onClick={() => setCustomTmdbInput(demo.id)}
                                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px]"
                                        >
                                            {demo.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTmdbModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
                                >
                                    Hubungkan Stream
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI & PREVIEW API TARGET (tmdb_id, m3u8_url, title) */}
            {showApiTargetModal && (
                <div 
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowApiTargetModal(false);
                    }}
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 cursor-pointer"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto cursor-default text-slate-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                                        Preview Query Target Stream API
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Parameter query string target untuk pemutar / manifest streaming
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApiTargetModal(false)}
                                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                                title="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Base URL Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-amber-400" />
                                Base URL / Endpoint Target:
                            </label>
                            <input
                                type="text"
                                value={apiBaseUrl}
                                onChange={(e) => handleBaseUrlChange(e.target.value)}
                                placeholder="http://100.81.252.14:8000/extract"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition"
                            />
                            <p className="text-[10px] text-slate-400">
                                Tersimpan otomatis di browser (localStorage) untuk pemanggilan berikutnya.
                            </p>
                        </div>

                        {/* Parameter List Items */}
                        <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                                Parameter Query Yang Disediakan (Target API):
                            </span>

                            {/* 1. tmdb_id */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-red-400">tmdb_id *</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono">string (query)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">ID TMDb media</p>
                                    <p className="text-xs font-mono text-white font-semibold truncate mt-1 bg-black/40 px-2 py-1 rounded-lg">
                                        {targetTmdbId}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(targetTmdbId, 'tmdb_id')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'tmdb_id' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 2. m3u8_url */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <code className="text-xs font-mono font-bold text-amber-400">m3u8_url *</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">string (query)</span>
                                        <div className="flex items-center gap-1 ml-auto">
                                            <button
                                                type="button"
                                                onClick={() => setTargetM3u8Type('watch')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                                    targetM3u8Type === 'watch' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Watch URL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTargetM3u8Type('stream')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                                    targetM3u8Type === 'stream' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Stream Embed
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">URL manifest target</p>
                                    <p className="text-xs font-mono text-white font-semibold break-all mt-1 bg-black/40 px-2 py-1 rounded-lg max-h-16 overflow-y-auto">
                                        {targetM3u8Url}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(targetM3u8Url, 'm3u8_url')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'm3u8_url' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 3. title */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-emerald-400">title *</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">string (query)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Judul media / video</p>
                                    <p className="text-xs font-mono text-white font-semibold truncate mt-1 bg-black/40 px-2 py-1 rounded-lg">
                                        {targetTitle}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(targetTitle, 'title')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'title' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 4. enable_download */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-cyan-400">enable_download</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">boolean (query)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Unduh video?</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableDownload}
                                                onChange={(e) => setEnableDownload(e.target.checked)}
                                                className="rounded bg-slate-950 border-white/20 text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                                            />
                                            <span className={`text-xs font-mono font-bold ${enableDownload ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {enableDownload ? 'true (Unduh Aktif)' : 'false (Unduh Mati)'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(String(enableDownload), 'enable_download')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'enable_download' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 5. test_download */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-purple-400">test_download</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">boolean (query)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">True = Unduh resolusi terendah saja.</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={testDownload}
                                                onChange={(e) => setTestDownload(e.target.checked)}
                                                className="rounded bg-slate-950 border-white/20 text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                                            />
                                            <span className={`text-xs font-mono font-bold ${testDownload ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {testDownload ? 'true (Resolusi Terendah Saja)' : 'false (Semua Resolusi)'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(String(testDownload), 'test_download')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'test_download' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 6. threads */}
                            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-sky-400">threads</code>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">integer (query)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Jumlah pecahan koneksi paralel (1-10 direkomendasikan)</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={threads}
                                            onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
                                            className="w-36 accent-red-600 cursor-pointer"
                                        />
                                        <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded">
                                            {threads} threads
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(String(threads), 'threads')}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition shrink-0 active:scale-95"
                                >
                                    {copiedField === 'threads' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Full URL Preview */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-slate-400" />
                                    Preview Full URL (dengan Query Params):
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(getTargetFullUrl(), 'full_url')}
                                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                                >
                                    {copiedField === 'full_url' ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400 font-semibold">URL Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>Salin Semua</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-amber-300 break-all max-h-20 overflow-y-auto select-all">
                                {getTargetFullUrl()}
                            </div>
                        </div>

                        {/* Status feedback */}
                        {apiFeedback && (
                            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                                apiFeedback.type === 'success' 
                                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                            }`}>
                                {apiFeedback.type === 'success' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                                <span>{apiFeedback.message}</span>
                            </div>
                        )}

                        {/* Footer Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => window.open(getTargetFullUrl(), '_blank')}
                                className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30 active:scale-95 cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka di Tab Baru</span>
                            </button>

                            <button
                                type="button"
                                disabled={apiSending}
                                onClick={handleSendApiRequest}
                                className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {apiSending ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                <span>{apiSending ? 'Mengirim...' : 'Kirim Request'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowApiTargetModal(false)}
                                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
