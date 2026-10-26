import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
    Maximize,
    X,
    MessageSquare,
    Sparkles,
    Server,
    Tv,
    Search,
    Layers,
    RefreshCw,
    AlertCircle,
    Film,
    ShieldCheck,
    ShieldAlert,
    Share2,
    ExternalLink,
    Copy,
    Check,
    Send,
    Globe,
    Code,
    CheckCircle2,
    Zap,
    Monitor,
    ChevronDown,
    Subtitles,
    Upload,
} from 'lucide-react';
import { MediaItem, Episode } from '@/data/movies';
import {
    PLAYER_SOURCES,
    getSourceUrl,
    getTmdbIdForMedia,
} from '@/lib/streambertApi';
import { fetchTmdbEpisodes, fetchTmdbTvSeasons } from '@/lib/tmdbService';
import {
    checkZetwareMediaExists,
    ZetwareStreamOption,
    isZetwareDefaultEnabled,
    formatZetwareResolution,
} from '@/lib/zetwareStorage';
import {
    fetchSubtitlesForMedia,
    convertSrtToVttBlob,
    SubtitleTrack,
} from '@/lib/subtitleService';
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
    initialSeasonNumber = 1,
}: VideoPlayerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const frameContainerRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Zetware Cloud Direct Storage State
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(
        null,
    );
    const [zetwareStreams, setZetwareStreams] = useState<ZetwareStreamOption[]>(
        [],
    );
    const [isCheckingZetware, setIsCheckingZetware] = useState<boolean>(true);
    const [showResolutionMenu, setShowResolutionMenu] =
        useState<boolean>(false);
    const [videoError, setVideoError] = useState<boolean>(false);

    // Streambert Engine State
    const [selectedSource, setSelectedSource] = useState<string>('vidsrc');
    const [useStreambertEmbed, setUseStreambertEmbed] = useState<boolean>(true);
    const [currentTmdbId, setCurrentTmdbId] = useState<string | number>('');
    const [selectedSeason, setSelectedSeason] =
        useState<number>(initialSeasonNumber);
    const [selectedEpisode, setSelectedEpisode] =
        useState<number>(initialEpisodeNumber);
    const [liveSeasons, setLiveSeasons] = useState<
        { seasonNumber: number; name: string; episodeCount: number }[]
    >([]);
    const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>([]);
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);
    const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
    const [showTmdbModal, setShowTmdbModal] = useState<boolean>(false);
    const [customTmdbInput, setCustomTmdbInput] = useState<string>('');

    // API Target Modal State
    const [showApiTargetModal, setShowApiTargetModal] =
        useState<boolean>(false);
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
    const [testDownload, setTestDownload] = useState<boolean>(false);
    const [threads, setThreads] = useState<number>(10);
    const [targetM3u8Type, setTargetM3u8Type] = useState<'watch' | 'stream'>(
        'watch',
    );
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [apiSending, setApiSending] = useState<boolean>(false);
    const [apiFeedback, setApiFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // HTML5 Video State (Fallback)
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.9);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [selectedSubtitles, setSelectedSubtitles] = useState<string | 'off'>(
        'id',
    );
    const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [isLoadingSubtitles, setIsLoadingSubtitles] =
        useState<boolean>(false);
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
        checkZetwareMediaExists({
            title: item.title,
            tmdbId: item.tmdbId,
            type: item.type,
            season: selectedSeason,
            episode: selectedEpisode,
        }).then((res) => {
            if (!isMounted) return;
            setIsCheckingZetware(false);
            if (res.exists && res.url) {
                setZetwareDirectUrl(res.url);
                setZetwareStreams(
                    res.streams || [
                        {
                            url: res.url,
                            resolution: 'Direct MP4',
                            label: 'Direct MP4',
                        },
                    ],
                );
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
            selectedEpisode,
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
                const targetSub = subtitles.find(
                    (s) => s.id === selectedSubtitles,
                );

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
    const handleUploadLocalSubtitle = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
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
    }, [
        iframeLoading,
        selectedSource,
        selectedSeason,
        selectedEpisode,
        currentTmdbId,
    ]);

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
        selectedSubtitles,
    );

    const activeSourceObj =
        PLAYER_SOURCES.find((s) => s.id === selectedSource) ||
        PLAYER_SOURCES[0];

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
    const targetTmdbId = String(
        currentTmdbId || (item ? getTmdbIdForMedia(item.id, item.tmdbId) : ''),
    );

    const getTargetWatchUrl = () => {
        const domain =
            typeof window !== 'undefined' &&
            !window.location.origin.includes('localhost')
                ? window.location.origin
                : 'https://cinema.zetware.id';
        const mediaId = item.id.startsWith('tmdb-')
            ? item.id
            : `tmdb-${item.type === 'series' ? 'tv' : 'mov'}-${targetTmdbId}`;
        const query =
            item.type === 'series'
                ? `?episode=${selectedEpisode}&season=${selectedSeason}`
                : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url =
        targetM3u8Type === 'watch' ? getTargetWatchUrl() : streamUrl;

    const targetTitle =
        item.type === 'series'
            ? `${item.title.toUpperCase()} - S${selectedSeason}E${selectedEpisode}`
            : item.title.toUpperCase();

    const zetwareDirectFileName = zetwareDirectUrl
        ? decodeURIComponent(zetwareDirectUrl).split('/').pop() || ''
        : '';
    const detectedResolution = zetwareDirectFileName.match(
        /_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i,
    )?.[1]
        ? `${zetwareDirectFileName.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i)?.[1]} MP4`
        : 'Direct MP4';

    // Seamless resolution switching state
    const savedPlaybackPositionRef = useRef<number>(0);
    const shouldResumePlaybackRef = useRef<boolean>(true);
    const isSwitchingResolutionRef = useRef<boolean>(false);
    const [resolutionNotice, setResolutionNotice] = useState<string | null>(
        null,
    );

    const handleSelectZetwareResolution = (newUrl: string) => {
        const videoEl = videoRef.current;
        const curTime = videoEl ? videoEl.currentTime : 0;
        const isPlayingNow = videoEl ? !videoEl.paused : true;

        savedPlaybackPositionRef.current = curTime;
        shouldResumePlaybackRef.current = isPlayingNow;
        isSwitchingResolutionRef.current = true;

        const targetStream = zetwareStreams.find((s) => s.url === newUrl);
        const resInfo = formatZetwareResolution(
            targetStream?.resolution,
            newUrl,
        );
        const timeFormatted = formatTime(curTime);
        setResolutionNotice(
            `⚡ Berpindah ke ${resInfo.label} • Menit ${timeFormatted}`,
        );
        setTimeout(() => setResolutionNotice(null), 3500);

        setVideoError(false);
        setZetwareDirectUrl(newUrl);
        setUseStreambertEmbed(false);
        setShowResolutionMenu(false);
        setShowSourceMenu(false);
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
                    Accept: 'application/json',
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
            className="fixed inset-0 z-50 flex animate-in cursor-pointer items-center justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-xl duration-200 select-none fade-in sm:p-6"
        >
            {/* FRAMED MODAL CONTAINER (BINGKAI PEMUTAR VIDEO) */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative my-auto flex w-full max-w-5xl cursor-default flex-col overflow-hidden rounded-3xl border border-red-500/20 border-white/15 bg-slate-950 shadow-2xl"
            >
                {/* 1. BINGKAI HEADER (HEADER DI ATAS VIDEO) */}
                <div className="relative z-30 flex flex-col items-stretch justify-between gap-3 border-b border-white/10 bg-slate-900/90 p-3 sm:flex-row sm:items-center sm:p-5">
                    <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="shrink-0 rounded-xl bg-red-600/20 p-2 text-red-500">
                                <Film className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="xs:max-w-[240px] max-w-[180px] truncate text-sm font-extrabold text-white sm:max-w-xs sm:text-lg md:max-w-none">
                                    {item.title}
                                </h2>

                                <div className="sm:xs flex items-center gap-1.5 text-[11px] text-slate-300 sm:gap-2">
                                    <span className="font-semibold text-emerald-400">
                                        {!useStreambertEmbed && zetwareDirectUrl
                                            ? '⚡ Zetware Cloud'
                                            : useStreambertEmbed
                                              ? activeSourceObj.label
                                              : 'Local MP4'}
                                    </span>
                                    <span>•</span>
                                    {item.type === 'series' && (
                                        <span className="font-mono font-bold text-red-400">
                                            S{selectedSeason} : E
                                            {selectedEpisode}
                                        </span>
                                    )}
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden max-w-[120px] truncate text-slate-400 sm:inline md:max-w-none">
                                        {item.genres.join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CLOSE BUTTON FOR SMALL MOBILE VIEW (Top right of title header) */}
                        <button
                            onClick={onClose}
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition hover:bg-red-500 active:scale-95 sm:hidden"
                            title="Tutup Player"
                            aria-label="Tutup Player"
                        >
                            <X className="h-4 w-4" />
                            <span>Tutup</span>
                        </button>
                    </div>

                    {/* HEADER CONTROL BUTTONS (DI ATAS BINGKAI) */}
                    <div className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-t border-white/5 pt-2 sm:justify-end sm:gap-2 sm:border-0 sm:pt-0">
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
                                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white shadow-lg transition active:scale-95 sm:px-3 ${
                                    !useStreambertEmbed && zetwareDirectUrl
                                        ? 'border border-red-400/50 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                        : 'bg-red-600 shadow-red-600/30 hover:bg-red-500'
                                }`}
                            >
                                <Server className="h-3.5 w-3.5" />
                                <span>
                                    Server:{' '}
                                    {!useStreambertEmbed && zetwareDirectUrl
                                        ? 'Zetware Cloud'
                                        : activeSourceObj.label}
                                </span>
                            </button>

                            {/* SERVER DROPDOWN */}
                            {showSourceMenu &&
                                mounted &&
                                createPortal(
                                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end p-0 sm:items-center sm:justify-center sm:p-4">
                                        {/* Fullscreen Backdrop */}
                                        <div
                                            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                                            onClick={() =>
                                                setShowSourceMenu(false)
                                            }
                                        />

                                        {/* Modal Container: Bottom Sheet on Mobile, Centered Card on Desktop */}
                                        <div className="pb-safe relative z-10 flex max-h-[85vh] w-full animate-in flex-col space-y-3.5 rounded-t-3xl border-t border-white/20 bg-slate-950/98 p-4 shadow-2xl backdrop-blur-2xl duration-200 slide-in-from-bottom sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl sm:border sm:p-5 sm:zoom-in-95 sm:slide-in-from-bottom-2">
                                            {/* Mobile Drag Pill */}
                                            <div className="mx-auto -mt-1 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-white/25 sm:hidden" />

                                            {/* Header with Title & Close Button */}
                                            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-1 pb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 text-red-500">
                                                        <Server className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm leading-tight font-extrabold text-white sm:text-base">
                                                            Pilih Server
                                                            Streaming
                                                        </span>
                                                        <span className="block text-[11px] text-slate-400 sm:text-xs">
                                                            Zetware Cloud &
                                                            Server Cadangan
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowSourceMenu(false)
                                                    }
                                                    className="rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white active:scale-95"
                                                    title="Tutup"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Scrollable Content */}
                                            <div className="-mr-0.5 flex-1 space-y-3.5 overflow-y-auto pr-0.5">
                                                {/* Option: Zetware Cloud Native File (If Available) */}
                                                {zetwareDirectUrl && (
                                                    <div
                                                        className={`rounded-2xl border p-3.5 transition ${
                                                            !useStreambertEmbed
                                                                ? 'border-amber-400/80 bg-gradient-to-br from-amber-500/20 via-slate-900/95 to-red-950/40 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                                                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setUseStreambertEmbed(
                                                                    false,
                                                                );
                                                                setShowSourceMenu(
                                                                    false,
                                                                );
                                                            }}
                                                            className="group w-full cursor-pointer text-left"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-sm font-black text-slate-950 shadow-[0_0_12px_rgba(250,204,21,0.8)]">
                                                                        <span>
                                                                            Z
                                                                        </span>
                                                                        <Zap className="absolute -top-1 -right-1 h-3.5 w-3.5 fill-amber-300 text-yellow-200 drop-shadow-[0_0_4px_rgba(250,204,21,1)]" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-black text-white transition group-hover:text-amber-300">
                                                                                Zetware
                                                                                Cloud
                                                                            </span>
                                                                            <span className="rounded-md border border-amber-400/40 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-300 uppercase">
                                                                                Cepat
                                                                                &
                                                                                Jernih
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-300">
                                                                            Direct
                                                                            cloud
                                                                            MP4
                                                                            tanpa
                                                                            buffer
                                                                            dari
                                                                            zetware.id
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {!useStreambertEmbed ? (
                                                                    <span className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950 shadow-sm">
                                                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                                        <span>
                                                                            Aktif
                                                                        </span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="shrink-0 rounded-xl bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-300 transition group-hover:bg-amber-400/20 group-hover:text-amber-300">
                                                                        Pilih
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>

                                                        {/* Resolusi Selector di dalam Server Menu */}
                                                        {zetwareStreams.length >
                                                            0 && (
                                                            <div className="mt-3 space-y-2 border-t border-white/10 pt-2.5">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="flex items-center gap-1.5 font-bold text-amber-300">
                                                                        <Monitor className="h-3.5 w-3.5 text-amber-400" />
                                                                        <span>
                                                                            Pilih
                                                                            Resolusi
                                                                            Video:
                                                                        </span>
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400">
                                                                        {
                                                                            zetwareStreams.length
                                                                        }{' '}
                                                                        Opsi
                                                                        Tersedia
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                    {zetwareStreams.map(
                                                                        (
                                                                            st,
                                                                        ) => {
                                                                            const isSelectedStream =
                                                                                !useStreambertEmbed &&
                                                                                zetwareDirectUrl ===
                                                                                    st.url;
                                                                            const resInfo =
                                                                                formatZetwareResolution(
                                                                                    st.resolution,
                                                                                    st.url,
                                                                                );
                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        st.url
                                                                                    }
                                                                                    type="button"
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        handleSelectZetwareResolution(
                                                                                            st.url,
                                                                                        );
                                                                                    }}
                                                                                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                                                                                        isSelectedStream
                                                                                            ? 'border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-400 font-black text-slate-950 shadow-md shadow-amber-400/30'
                                                                                            : 'border-white/5 bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
                                                                                    }`}
                                                                                >
                                                                                    <span className="flex min-w-0 items-center gap-2">
                                                                                        <span
                                                                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black ${
                                                                                                isSelectedStream
                                                                                                    ? 'bg-slate-950 text-amber-300'
                                                                                                    : 'bg-black/30 text-amber-400'
                                                                                            }`}
                                                                                        >
                                                                                            {
                                                                                                resInfo.badge
                                                                                            }
                                                                                        </span>
                                                                                        <span className="truncate">
                                                                                            {
                                                                                                resInfo.label
                                                                                            }
                                                                                        </span>
                                                                                    </span>
                                                                                    {isSelectedStream && (
                                                                                        <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Server Alternatif */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1.5 px-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>
                                                            Server Alternatif
                                                            (Embed / HLS)
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {PLAYER_SOURCES.map(
                                                            (src) => {
                                                                const isSelected =
                                                                    useStreambertEmbed &&
                                                                    selectedSource ===
                                                                        src.id;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            src.id
                                                                        }
                                                                        onClick={() => {
                                                                            setSelectedSource(
                                                                                src.id,
                                                                            );
                                                                            setUseStreambertEmbed(
                                                                                true,
                                                                            );
                                                                            setIframeLoading(
                                                                                true,
                                                                            );
                                                                            setShowSourceMenu(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                                                                            isSelected
                                                                                ? 'border-red-500 bg-red-600 font-bold text-white shadow-lg shadow-red-600/30'
                                                                                : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10'
                                                                        }`}
                                                                    >
                                                                        <div className="min-w-0 pr-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-extrabold text-white sm:text-sm">
                                                                                    {
                                                                                        src.label
                                                                                    }
                                                                                </span>
                                                                                {src.tag && (
                                                                                    <span
                                                                                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                                                                            isSelected
                                                                                                ? 'bg-black/30 text-white'
                                                                                                : 'bg-white/10 text-amber-300'
                                                                                        }`}
                                                                                    >
                                                                                        {
                                                                                            src.tag
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p
                                                                                className={`mt-0.5 line-clamp-1 text-xs ${
                                                                                    isSelected
                                                                                        ? 'text-red-100'
                                                                                        : 'text-slate-400'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    src.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-red-600">
                                                                                <Check className="h-3 w-3 stroke-[3]" />
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            },
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                setUseStreambertEmbed(
                                                                    false,
                                                                );
                                                                setShowSourceMenu(
                                                                    false,
                                                                );
                                                            }}
                                                            className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                                                                !useStreambertEmbed
                                                                    ? 'border-emerald-500 bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/30'
                                                                    : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            <div>
                                                                <span className="block text-xs font-extrabold text-white sm:text-sm">
                                                                    Local Sample
                                                                    MP4
                                                                </span>
                                                                <p
                                                                    className={`mt-0.5 text-xs ${!useStreambertEmbed ? 'text-emerald-100' : 'text-slate-400'}`}
                                                                >
                                                                    Pemutar
                                                                    video HTML5
                                                                    bawaan
                                                                </p>
                                                            </div>
                                                            {!useStreambertEmbed && (
                                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600">
                                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body,
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
                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 sm:px-3"
                                >
                                    <Tv className="h-3.5 w-3.5 text-red-500" />
                                    <span>
                                        S{selectedSeason} E{selectedEpisode}
                                    </span>
                                </button>

                                {showEpisodeMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() =>
                                                setShowEpisodeMenu(false)
                                            }
                                        />
                                        <div className="absolute top-11 right-0 z-50 w-64 max-w-[calc(100vw-2rem)] space-y-2 rounded-2xl border border-white/20 bg-slate-950 p-3 text-xs shadow-2xl backdrop-blur-2xl">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                <span className="font-bold text-white">
                                                    Pilih Musim & Episode
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div>
                                                    <span className="mb-1 block text-[10px] text-slate-400">
                                                        Musim (Season):
                                                    </span>
                                                    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-1">
                                                        {(liveSeasons.length > 0
                                                            ? liveSeasons
                                                            : [
                                                                  {
                                                                      seasonNumber: 1,
                                                                      name: 'Musim 1',
                                                                      episodeCount: 10,
                                                                  },
                                                                  {
                                                                      seasonNumber: 2,
                                                                      name: 'Musim 2',
                                                                      episodeCount: 10,
                                                                  },
                                                              ]
                                                        ).map((s) => (
                                                            <button
                                                                key={
                                                                    s.seasonNumber
                                                                }
                                                                onClick={() => {
                                                                    setSelectedSeason(
                                                                        s.seasonNumber,
                                                                    );
                                                                    setSelectedEpisode(
                                                                        1,
                                                                    );
                                                                    setIframeLoading(
                                                                        true,
                                                                    );
                                                                }}
                                                                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${
                                                                    selectedSeason ===
                                                                    s.seasonNumber
                                                                        ? 'bg-red-600 text-white shadow-md'
                                                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                                }`}
                                                            >
                                                                {s.name ||
                                                                    `Musim ${s.seasonNumber}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="mb-1 block text-[10px] text-slate-400">
                                                        Episode:
                                                    </span>
                                                    <div className="grid max-h-48 grid-cols-4 gap-1 overflow-y-auto pr-1">
                                                        {(liveEpisodes.length >
                                                        0
                                                            ? liveEpisodes.map(
                                                                  (ep) =>
                                                                      ep.episodeNumber,
                                                              )
                                                            : [
                                                                  1, 2, 3, 4, 5,
                                                                  6, 7, 8, 9,
                                                                  10, 11, 12,
                                                              ]
                                                        ).map((epNum) => {
                                                            const epData =
                                                                liveEpisodes.find(
                                                                    (e) =>
                                                                        e.episodeNumber ===
                                                                        epNum,
                                                                );
                                                            return (
                                                                <button
                                                                    key={epNum}
                                                                    onClick={() => {
                                                                        setSelectedEpisode(
                                                                            epNum,
                                                                        );
                                                                        setIframeLoading(
                                                                            true,
                                                                        );
                                                                        setShowEpisodeMenu(
                                                                            false,
                                                                        );
                                                                    }}
                                                                    title={
                                                                        epData?.title ||
                                                                        `Episode ${epNum}`
                                                                    }
                                                                    className={`rounded-lg py-1.5 text-center text-xs font-bold transition ${
                                                                        selectedEpisode ===
                                                                        epNum
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
                            className="cursor-pointer rounded-xl bg-white/10 p-1.5 text-white transition hover:bg-white/20 active:scale-95 sm:p-2"
                            title="Layar Penuh Bingkai (F)"
                        >
                            <Maximize className="h-4 w-4" />
                        </button>

                        {/* CUSTOM TMDB ID BUTTON */}
                        <button
                            onClick={() => setShowTmdbModal(true)}
                            className="cursor-pointer rounded-xl bg-white/10 p-1.5 text-white transition hover:bg-white/20 active:scale-95 sm:p-2"
                            title="Ubah TMDB Stream ID"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        {/* TARGET API BUTTON */}
                        <button
                            onClick={() => {
                                setApiFeedback(null);
                                setShowApiTargetModal(true);
                            }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-300 shadow-sm transition hover:border-amber-400 hover:bg-amber-500/30 hover:text-amber-200 active:scale-95 sm:px-3"
                            title="Kirim / Preview Parameter Stream Target (tmdb_id, m3u8_url, title)"
                        >
                            <Share2 className="h-3.5 w-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Target API</span>
                        </button>

                        {/* CLOSE BUTTON FOR TABLET/DESKTOP */}
                        <button
                            onClick={onClose}
                            className="hidden cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition hover:bg-red-500 active:scale-95 sm:flex"
                            title="Tutup Player (Esc)"
                            aria-label="Tutup Player"
                        >
                            <X className="h-4 w-4" />
                            <span>Tutup</span>
                        </button>
                    </div>
                </div>

                {/* 2. FRAMED VIDEO VIEWPORT (BINGKAI PEMUTAR VIDEO) */}
                <div
                    ref={frameContainerRef}
                    className="relative z-0 flex aspect-video w-full items-center justify-center overflow-hidden rounded-b-3xl bg-black"
                >
                    {useStreambertEmbed ? (
                        <>
                            {iframeLoading && (
                                <div className="absolute inset-0 z-10 flex animate-in flex-col items-center justify-center space-y-4 bg-slate-950/95 backdrop-blur-xl duration-200 fade-in">
                                    <div className="relative flex items-center justify-center">
                                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-600/20 border-t-red-600" />
                                        <div
                                            className="absolute -inset-2 h-20 w-20 animate-spin rounded-full border-2 border-red-500/10 border-b-red-500"
                                            style={{
                                                animationDirection: 'reverse',
                                                animationDuration: '2s',
                                            }}
                                        />
                                        <Server className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-red-500" />
                                    </div>
                                    <div className="max-w-sm space-y-1.5 px-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase">
                                            <RefreshCw className="h-3 w-3 animate-spin text-red-400" />
                                            Menghubungkan Server Streambert
                                        </div>
                                        <h3 className="text-sm font-extrabold tracking-wide text-white uppercase">
                                            Menghubungkan Ke{' '}
                                            {activeSourceObj.label}...
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Media TMDB ID:{' '}
                                            <span className="font-mono font-bold text-red-400">
                                                {currentTmdbId}
                                            </span>
                                            {item.type === 'series' && (
                                                <span>
                                                    {' '}
                                                    • S{selectedSeason} E
                                                    {selectedEpisode}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <iframe
                                ref={iframeRef}
                                src={streamUrl}
                                className="h-full w-full border-0"
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                allowFullScreen
                                onLoad={() => setIframeLoading(false)}
                                title={`Streambert Player - ${item.title}`}
                            />
                        </>
                    ) : (
                        <div className="group relative flex h-full w-full items-center justify-center bg-black">
                            {/* Seamless Resolution Switch Notification Toast */}
                            {resolutionNotice && (
                                <div className="pointer-events-none absolute top-4 left-1/2 z-30 flex -translate-x-1/2 animate-in items-center gap-2 rounded-2xl border border-amber-400/60 bg-slate-950/90 px-4 py-2 text-xs font-bold text-amber-300 shadow-[0_0_20px_rgba(250,204,21,0.35)] backdrop-blur-xl duration-200 fade-in slide-in-from-top-2">
                                    <div className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                                    <span>{resolutionNotice}</span>
                                </div>
                            )}

                            {/* Video Error Fallback Overlay */}
                            {videoError && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-3 bg-slate-950/95 p-6 text-center backdrop-blur-md">
                                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/20 p-3 text-amber-400">
                                        <AlertCircle className="h-8 w-8" />
                                    </div>
                                    <h4 className="text-sm font-extrabold text-white sm:text-base">
                                        Resolusi ini sedang membutuhkan waktu
                                        buffer
                                    </h4>
                                    <p className="max-w-sm text-xs text-slate-400">
                                        Koneksi ke server cloud sedang
                                        menyesuaikan bitrate file video. Anda
                                        dapat memuat ulang atau memilih resolusi
                                        alternatif.
                                    </p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVideoError(false);
                                                if (videoRef.current) {
                                                    videoRef.current.load();
                                                    videoRef.current
                                                        .play()
                                                        .catch(() => {});
                                                }
                                            }}
                                            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 active:scale-95"
                                        >
                                            Muat Ulang Resolusi
                                        </button>
                                        {zetwareStreams.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const other =
                                                        zetwareStreams.find(
                                                            (s) =>
                                                                s.url !==
                                                                zetwareDirectUrl,
                                                        ) || zetwareStreams[0];
                                                    if (other) {
                                                        handleSelectZetwareResolution(
                                                            other.url,
                                                        );
                                                    }
                                                }}
                                                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
                                            >
                                                Pindah Resolusi Lain
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                key={zetwareDirectUrl || item.videoUrl}
                                src={zetwareDirectUrl || item.videoUrl}
                                autoPlay
                                preload="auto"
                                playsInline
                                controls
                                className="h-full w-full object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onError={() => setVideoError(true)}
                                onLoadedMetadata={(e) => {
                                    setVideoError(false);
                                    const video = e.currentTarget;
                                    if (savedPlaybackPositionRef.current > 0) {
                                        video.currentTime =
                                            savedPlaybackPositionRef.current;
                                    }
                                    if (shouldResumePlaybackRef.current) {
                                        video.play().catch(() => {});
                                    }
                                }}
                                onCanPlay={(e) => {
                                    const video = e.currentTarget;
                                    if (
                                        isSwitchingResolutionRef.current &&
                                        savedPlaybackPositionRef.current > 0
                                    ) {
                                        if (
                                            Math.abs(
                                                video.currentTime -
                                                    savedPlaybackPositionRef.current,
                                            ) > 1.5
                                        ) {
                                            video.currentTime =
                                                savedPlaybackPositionRef.current;
                                        }
                                        isSwitchingResolutionRef.current = false;
                                    }
                                }}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="flex items-center gap-2 text-base font-bold text-white">
                                <Search className="h-5 w-5 text-red-500" />
                                Cari & Hubungkan TMDB Stream ID
                            </h3>
                            <button
                                onClick={() => setShowTmdbModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-300">
                            Masukkan ID Film / Seri dari Database TMDB
                            (TheMovieDB) untuk memutar video dari server
                            Streambert secara langsung.
                        </p>

                        <form
                            onSubmit={handleApplyCustomTmdb}
                            className="space-y-3"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-300">
                                    TMDB ID:
                                </label>
                                <input
                                    type="text"
                                    value={customTmdbInput}
                                    onChange={(e) =>
                                        setCustomTmdbInput(e.target.value)
                                    }
                                    placeholder="Contoh: 27205 (Inception), 157336 (Interstellar)"
                                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1 rounded-xl border border-red-500/20 bg-red-950/40 p-3 text-[11px] text-slate-300">
                                <span className="block flex items-center gap-1 font-bold text-red-400">
                                    <AlertCircle className="h-3.5 w-3.5" />{' '}
                                    Contoh ID TMDB Populer:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[
                                        {
                                            label: 'Inception (27205)',
                                            id: '27205',
                                        },
                                        {
                                            label: 'Interstellar (157336)',
                                            id: '157336',
                                        },
                                        {
                                            label: 'Fight Club (550)',
                                            id: '550',
                                        },
                                        {
                                            label: 'Peaky Blinders (60574)',
                                            id: '60574',
                                        },
                                        {
                                            label: 'Stranger Things (66732)',
                                            id: '66732',
                                        },
                                    ].map((demo) => (
                                        <button
                                            key={demo.id}
                                            type="button"
                                            onClick={() =>
                                                setCustomTmdbInput(demo.id)
                                            }
                                            className="rounded bg-white/10 px-2 py-1 font-mono text-[10px] text-white hover:bg-white/20"
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
                                    className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500"
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
                        if (e.target === e.currentTarget)
                            setShowApiTargetModal(false);
                    }}
                    className="fixed inset-0 z-50 flex animate-in cursor-pointer items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 fade-in sm:p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-xl cursor-default space-y-4 overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-950 p-5 text-slate-200 shadow-2xl sm:p-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-1.5 text-base font-bold text-white">
                                        Preview Query Target Stream API
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Parameter query string target untuk
                                        pemutar / manifest streaming
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApiTargetModal(false)}
                                className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                title="Tutup"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Base URL Input */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                                <Globe className="h-3.5 w-3.5 text-amber-400" />
                                Base URL / Endpoint Target:
                            </label>
                            <input
                                type="text"
                                value={apiBaseUrl}
                                onChange={(e) =>
                                    handleBaseUrlChange(e.target.value)
                                }
                                placeholder="http://100.81.252.14:8000/extract"
                                className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 font-mono text-xs text-white transition focus:border-amber-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-400">
                                Tersimpan otomatis di browser (localStorage)
                                untuk pemanggilan berikutnya.
                            </p>
                        </div>

                        {/* Parameter List Items */}
                        <div className="space-y-2 pt-1">
                            <span className="block text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                                Parameter Query Yang Disediakan (Target API):
                            </span>

                            {/* 1. tmdb_id */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-red-400">
                                            tmdb_id *
                                        </code>
                                        <span className="py-0.2 rounded bg-red-500/20 px-1.5 font-mono text-[10px] text-red-300">
                                            string (query)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        ID TMDb media
                                    </p>
                                    <p className="mt-1 truncate rounded-lg bg-black/40 px-2 py-1 font-mono text-xs font-semibold text-white">
                                        {targetTmdbId}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(targetTmdbId, 'tmdb_id')
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'tmdb_id' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 2. m3u8_url */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-amber-400">
                                            m3u8_url *
                                        </code>
                                        <span className="py-0.2 rounded bg-amber-500/20 px-1.5 font-mono text-[10px] text-amber-300">
                                            string (query)
                                        </span>
                                        <div className="ml-auto flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTargetM3u8Type('watch')
                                                }
                                                className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                    targetM3u8Type === 'watch'
                                                        ? 'bg-amber-500 font-bold text-slate-950'
                                                        : 'bg-white/10 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Watch URL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTargetM3u8Type('stream')
                                                }
                                                className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                    targetM3u8Type === 'stream'
                                                        ? 'bg-amber-500 font-bold text-slate-950'
                                                        : 'bg-white/10 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Stream Embed
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        URL manifest target
                                    </p>
                                    <p className="mt-1 max-h-16 overflow-y-auto rounded-lg bg-black/40 px-2 py-1 font-mono text-xs font-semibold break-all text-white">
                                        {targetM3u8Url}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(targetM3u8Url, 'm3u8_url')
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'm3u8_url' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 3. title */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-emerald-400">
                                            title *
                                        </code>
                                        <span className="py-0.2 rounded bg-emerald-500/20 px-1.5 font-mono text-[10px] text-emerald-300">
                                            string (query)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Judul media / video
                                    </p>
                                    <p className="mt-1 truncate rounded-lg bg-black/40 px-2 py-1 font-mono text-xs font-semibold text-white">
                                        {targetTitle}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(targetTitle, 'title')
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'title' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 4. enable_download */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-cyan-400">
                                            enable_download
                                        </code>
                                        <span className="py-0.2 rounded bg-cyan-500/20 px-1.5 font-mono text-[10px] text-cyan-300">
                                            boolean (query)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Unduh video?
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={enableDownload}
                                                onChange={(e) =>
                                                    setEnableDownload(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 cursor-pointer rounded border-white/20 bg-slate-950 text-red-600 focus:ring-0"
                                            />
                                            <span
                                                className={`font-mono text-xs font-bold ${enableDownload ? 'text-emerald-400' : 'text-slate-400'}`}
                                            >
                                                {enableDownload
                                                    ? 'true (Unduh Aktif)'
                                                    : 'false (Unduh Mati)'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(
                                            String(enableDownload),
                                            'enable_download',
                                        )
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'enable_download' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 5. test_download */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-purple-400">
                                            test_download
                                        </code>
                                        <span className="py-0.2 rounded bg-purple-500/20 px-1.5 font-mono text-[10px] text-purple-300">
                                            boolean (query)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        True = Unduh resolusi terendah saja.
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={testDownload}
                                                onChange={(e) =>
                                                    setTestDownload(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 cursor-pointer rounded border-white/20 bg-slate-950 text-red-600 focus:ring-0"
                                            />
                                            <span
                                                className={`font-mono text-xs font-bold ${testDownload ? 'text-emerald-400' : 'text-slate-400'}`}
                                            >
                                                {testDownload
                                                    ? 'true (Resolusi Terendah Saja)'
                                                    : 'false (Semua Resolusi)'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(
                                            String(testDownload),
                                            'test_download',
                                        )
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'test_download' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 6. threads */}
                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs font-bold text-sky-400">
                                            threads
                                        </code>
                                        <span className="py-0.2 rounded bg-sky-500/20 px-1.5 font-mono text-[10px] text-sky-300">
                                            integer (query)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Jumlah pecahan koneksi paralel (1-10
                                        direkomendasikan)
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={threads}
                                            onChange={(e) =>
                                                setThreads(
                                                    parseInt(e.target.value) ||
                                                        1,
                                                )
                                            }
                                            className="w-36 cursor-pointer accent-red-600"
                                        />
                                        <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                            {threads} threads
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(String(threads), 'threads')
                                    }
                                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 sm:self-center"
                                >
                                    {copiedField === 'threads' ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Full URL Preview */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                                    <Code className="h-3.5 w-3.5 text-slate-400" />
                                    Preview Full URL (dengan Query Params):
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(
                                            getTargetFullUrl(),
                                            'full_url',
                                        )
                                    }
                                    className="flex items-center gap-1 text-[11px] text-amber-400 transition hover:text-amber-300"
                                >
                                    {copiedField === 'full_url' ? (
                                        <>
                                            <Check className="h-3 w-3 text-emerald-400" />
                                            <span className="font-semibold text-emerald-400">
                                                URL Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            <span>Salin Semua</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="max-h-20 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[11px] break-all text-amber-300 select-all">
                                {getTargetFullUrl()}
                            </div>
                        </div>

                        {/* Status feedback */}
                        {apiFeedback && (
                            <div
                                className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${
                                    apiFeedback.type === 'success'
                                        ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                                        : 'border-red-500/30 bg-red-950/40 text-red-300'
                                }`}
                            >
                                {apiFeedback.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                )}
                                <span>{apiFeedback.message}</span>
                            </div>
                        )}

                        {/* Footer Action Buttons */}
                        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                            <button
                                type="button"
                                onClick={() =>
                                    window.open(getTargetFullUrl(), '_blank')
                                }
                                className="flex min-w-[130px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-500 active:scale-95"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Buka di Tab Baru</span>
                            </button>

                            <button
                                type="button"
                                disabled={apiSending}
                                onClick={handleSendApiRequest}
                                className="flex min-w-[130px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
                            >
                                {apiSending ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5 text-amber-400" />
                                )}
                                <span>
                                    {apiSending
                                        ? 'Mengirim...'
                                        : 'Kirim Request'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowApiTargetModal(false)}
                                className="cursor-pointer rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
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
