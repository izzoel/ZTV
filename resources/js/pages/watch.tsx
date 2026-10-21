import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import {
    Play,
    Pause,
    ArrowLeft,
    Server,
    Tv,
    Search,
    Layers,
    RefreshCw,
    AlertCircle,
    Film,
    Maximize,
    X,
    ChevronRight,
    ChevronLeft,
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
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import {
    fetchMediaById,
    fetchTmdbEpisodes,
    fetchTmdbTvSeasons,
    translateText,
    isEngText,
} from '@/lib/tmdbService';
import {
    PLAYER_SOURCES,
    getSourceUrl,
    getTmdbIdForMedia,
} from '@/lib/streambertApi';
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
import Navbar from '@/components/streaming/Navbar';
import StreamingFooter from '@/components/streaming/StreamingFooter';
import StreamingSkeleton from '@/components/streaming/StreamingSkeleton';
import DevNoticeBanner from '@/components/streaming/DevNoticeBanner';

interface WatchPageProps {
    id: string;
    initialSeason?: number;
    initialEpisode?: number;
}

export default function WatchPage({
    id,
    initialSeason = 1,
    initialEpisode = 1,
}: WatchPageProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const frameContainerRef = useRef<HTMLDivElement>(null);

    const [media, setMedia] = useState<MediaItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
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

    // Zetware Cloud Subtitles State (Opsi B: Auto-fetch API)
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [selectedSubtitleId, setSelectedSubtitleId] = useState<
        string | 'off'
    >('id');
    const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
    const [isLoadingSubtitles, setIsLoadingSubtitles] =
        useState<boolean>(false);

    // Streambert Engine State
    const [selectedSource, setSelectedSource] = useState<string>('vidsrc');
    const [useStreambertEmbed, setUseStreambertEmbed] = useState<boolean>(true);
    const [currentTmdbId, setCurrentTmdbId] = useState<string | number>('');
    const [selectedSeason, setSelectedSeason] = useState<number>(
        Number(initialSeason) || 1,
    );
    const [selectedEpisode, setSelectedEpisode] = useState<number>(
        Number(initialEpisode) || 1,
    );
    const [liveSeasons, setLiveSeasons] = useState<
        { seasonNumber: number; name: string; episodeCount: number }[]
    >([]);
    const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>([]);
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);
    const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
    const [showEpisodeMenu, setShowEpisodeMenu] = useState<boolean>(false);
    const [showTmdbModal, setShowTmdbModal] = useState<boolean>(false);
    const [customTmdbInput, setCustomTmdbInput] = useState<string>('');

    // Synopsis translation & language toggle state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>('id');
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{
        id?: string;
        en?: string;
    }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] =
        useState<boolean>(false);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!media) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn =
                    media.synopsisEn ||
                    (isEngText(media.synopsis) ? media.synopsis : '');
                if (media.synopsis && !isEngText(media.synopsis)) return;
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res)
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                id: res,
                            }));
                    } finally {
                        setIsTranslatingSynopsis(false);
                    }
                }
            }
        } else {
            if (!translatedSynopsis.en) {
                if (media.synopsisEn && isEngText(media.synopsisEn)) return;
                if (media.synopsis && isEngText(media.synopsis)) return;
                const currentId = media.synopsis;
                if (currentId) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentId, 'id', 'en');
                        if (res)
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                en: res,
                            }));
                    } finally {
                        setIsTranslatingSynopsis(false);
                    }
                }
            }
        }
    };

    const getDisplayedSynopsis = () => {
        if (!media) return '';
        if (synopsisLang === 'id') {
            if (translatedSynopsis.id) return translatedSynopsis.id;
            if (media.synopsis && !isEngText(media.synopsis))
                return media.synopsis;
            return media.synopsis;
        } else {
            if (translatedSynopsis.en) return translatedSynopsis.en;
            if (media.synopsisEn) return media.synopsisEn;
            if (media.synopsis && isEngText(media.synopsis))
                return media.synopsis;
            return media.synopsisEn || media.synopsis;
        }
    };

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
    const [targetM3u8Type, setTargetM3u8Type] = useState<
        'watch' | 'stream' | 'zetware'
    >('watch');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [apiSending, setApiSending] = useState<boolean>(false);
    const [apiFeedback, setApiFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // My List storage state for header badge
    const [myList, setMyList] = useState<string[]>([]);
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ztv_my_list');
            if (saved) {
                setMyList(JSON.parse(saved));
            }
        } catch {
            // ignore
        }
    }, []);

    const handleNavbarSelectCategory = (cat: string) => {
        if (cat === 'Semua') {
            router.visit('/');
        } else {
            router.visit(`/?category=${encodeURIComponent(cat)}`);
        }
    };

    const handleNavbarToggleMyListOnly = (show: boolean) => {
        if (show) {
            router.visit('/?my_list=1');
        } else {
            router.visit('/');
        }
    };

    const handleGoBack = () => {
        if (
            typeof document !== 'undefined' &&
            document.referrer &&
            document.referrer.includes(window.location.host) &&
            !document.referrer.includes('/watch/')
        ) {
            window.location.href = document.referrer;
        } else if (media?.id) {
            router.visit(`/detail/${media.id}`);
        } else {
            router.visit('/');
        }
    };

    // HTML5 Video State (Fallback)
    const [isPlaying, setIsPlaying] = useState<boolean>(true);

    // Load initial media item
    useEffect(() => {
        let isMounted = true;

        async function loadMedia() {
            setIsLoading(true);

            // 1. Try sessionStorage cache
            try {
                const cachedStr = sessionStorage.getItem(`ztv_media_${id}`);
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr);
                    if (
                        cached &&
                        (cached.id === id || String(cached.tmdbId) === id)
                    ) {
                        if (isMounted) {
                            setMedia(cached);
                            const tmdb = getTmdbIdForMedia(
                                cached.id,
                                cached.tmdbId,
                            );
                            setCurrentTmdbId(tmdb);
                            setCustomTmdbInput(String(tmdb));
                            setIsLoading(false);
                        }
                    }
                }
            } catch {
                // ignore
            }

            // 2. Fetch fresh
            try {
                const fetched = await fetchMediaById(id);
                if (isMounted && fetched) {
                    setMedia(fetched);
                    const tmdb = getTmdbIdForMedia(fetched.id, fetched.tmdbId);
                    setCurrentTmdbId(tmdb);
                    setCustomTmdbInput(String(tmdb));
                    try {
                        sessionStorage.setItem(
                            `ztv_media_${id}`,
                            JSON.stringify(fetched),
                        );
                    } catch {
                        // ignore storage error
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch media for player:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadMedia();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Fetch live seasons & episodes for series
    useEffect(() => {
        if (media?.type === 'series' && currentTmdbId) {
            fetchTmdbTvSeasons(currentTmdbId).then((seasons) => {
                if (seasons && seasons.length > 0) {
                    setLiveSeasons(seasons);
                }
            });
        }
    }, [media, currentTmdbId]);

    useEffect(() => {
        if (media?.type === 'series' && currentTmdbId) {
            fetchTmdbEpisodes(currentTmdbId, selectedSeason).then((eps) => {
                if (eps && eps.length > 0) {
                    setLiveEpisodes(eps);
                }
            });
        }
    }, [media, currentTmdbId, selectedSeason]);

    // Automatic check for Zetware Storage MP4 availability
    // Automatic check for Zetware Cloud MP4 availability
    useEffect(() => {
        let isMounted = true;
        if (!media) return;

        setIsCheckingZetware(true);
        checkZetwareMediaExists(
            media.title,
            media.type,
            selectedSeason,
            selectedEpisode,
        ).then((res) => {
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
                setUseStreambertEmbed(true); // Fallback to existing stream!
            }
        });

        return () => {
            isMounted = false;
        };
    }, [media, selectedSeason, selectedEpisode]);

    // Automatic fetch subtitles for Zetware Cloud / Local MP4 (Opsi B)
    useEffect(() => {
        let isMounted = true;
        if (!media) return;

        setIsLoadingSubtitles(true);
        fetchSubtitlesForMedia(
            currentTmdbId,
            media.type,
            selectedSeason,
            selectedEpisode,
        ).then((subs) => {
            if (!isMounted) return;
            setIsLoadingSubtitles(false);
            setSubtitles(subs);
            if (subs.length > 0) {
                const defaultTrack = subs.find((s) => s.isDefault) || subs[0];
                setSelectedSubtitleId(defaultTrack.id);
            } else {
                setSelectedSubtitleId('off');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [media, currentTmdbId, selectedSeason, selectedEpisode]);

    // Sync HTML5 video textTracks when selectedSubtitleId changes
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
                    (s) => s.id === selectedSubtitleId,
                );

                for (let i = 0; i < tracks.length; i++) {
                    const t = tracks[i];
                    const sub = subtitles[i];

                    // Strictly match by ID or exact unique label or corresponding index to prevent duplicate tracks showing simultaneously
                    const isSelected =
                        selectedSubtitleId !== 'off' &&
                        ((t.id && t.id === selectedSubtitleId) ||
                            (targetSub && t.label === targetSub.label) ||
                            (sub && sub.id === selectedSubtitleId));

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
    }, [selectedSubtitleId, subtitles]);

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
                setSelectedSubtitleId(customTrack.id);
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
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [
        iframeLoading,
        selectedSource,
        selectedSeason,
        selectedEpisode,
        currentTmdbId,
    ]);

    // Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const streamUrl = media
        ? getSourceUrl(
              selectedSource,
              media.type,
              currentTmdbId || 27205,
              selectedSeason,
              selectedEpisode,
              'e50914',
              'id',
          )
        : '';

    const activeSourceObj =
        PLAYER_SOURCES.find((s) => s.id === selectedSource) ||
        PLAYER_SOURCES[0];

    const toggleFullscreen = () => {
        if (frameContainerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                frameContainerRef.current.requestFullscreen().catch(() => {});
            }
        }
    };

    const handleApplyCustomTmdb = (e: React.FormEvent) => {
        e.preventDefault();
        if (customTmdbInput.trim()) {
            setCurrentTmdbId(customTmdbInput.trim());
            setIframeLoading(true);
            setShowTmdbModal(false);
        }
    };

    // Target Query Parameters
    const targetTmdbId = String(
        currentTmdbId ||
            (media ? getTmdbIdForMedia(media.id, media.tmdbId) : ''),
    );

    const getTargetWatchUrl = () => {
        const domain =
            typeof window !== 'undefined' &&
            !window.location.origin.includes('localhost')
                ? window.location.origin
                : 'https://cinema.zetware.id';
        const mediaId = media
            ? media.id.startsWith('tmdb-')
                ? media.id
                : `tmdb-${media.type === 'series' ? 'tv' : 'mov'}-${targetTmdbId}`
            : id;
        const query =
            media?.type === 'series'
                ? `?episode=${selectedEpisode}&season=${selectedSeason}`
                : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url =
        targetM3u8Type === 'zetware' && zetwareDirectUrl
            ? zetwareDirectUrl
            : targetM3u8Type === 'watch'
              ? getTargetWatchUrl()
              : streamUrl;

    const targetTitle = media
        ? media.type === 'series'
            ? `${media.title.toUpperCase()} - S${selectedSeason}E${selectedEpisode}`
            : media.title.toUpperCase()
        : '';

    const detectedResolution = zetwareDirectUrl?.match(
        /_(\d+x\d+|\d+p|\d{3,4}|4k)/i,
    )?.[1]
        ? `${zetwareDirectUrl.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1]} MP4`
        : 'Direct MP4';

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

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
            targetStream?.resolution ||
                newUrl.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1],
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
            // ignore
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
                headers: { Accept: 'application/json' },
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

    if (isLoading && !media) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
                <Navbar
                    activeCategory=""
                    onSelectCategory={handleNavbarSelectCategory}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={myList.length}
                    showMyListOnly={false}
                    onToggleMyListOnly={handleNavbarToggleMyListOnly}
                    showCategories={true}
                />
                <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-8">
                    <StreamingSkeleton />
                </div>
            </div>
        );
    }

    if (!media) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
                <AlertCircle className="mb-4 h-16 w-16 animate-bounce text-red-500" />
                <h1 className="mb-2 text-2xl font-bold">
                    Video Tidak Ditemukan
                </h1>
                <p className="mb-6 max-w-md text-sm text-slate-400">
                    Konten pemutar video dengan ID ini tidak dapat dimuat.
                </p>
                <Link
                    href="/"
                    className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
                >
                    Kembali Ke Beranda
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head title={`Memutar ${media.title} | ZTV Stream Cinema`} />

            <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-red-600 selection:text-white">
                {/* Navbar */}
                <Navbar
                    activeCategory=""
                    onSelectCategory={handleNavbarSelectCategory}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={myList.length}
                    showMyListOnly={false}
                    onToggleMyListOnly={handleNavbarToggleMyListOnly}
                    showCategories={true}
                />

                {/* Back Quick Floating Bar */}
                <div className="mx-auto max-w-7xl px-3 pt-28 sm:px-6 sm:pt-28 lg:px-8">
                    <button
                        onClick={handleGoBack}
                        className="group mb-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 shadow-md backdrop-blur-md transition hover:bg-slate-800 hover:text-white active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4 text-red-500 transition-colors group-hover:text-white" />
                        <span>Kembali</span>
                    </button>
                </div>

                {/* CINEMA PLAYER CONTAINER */}
                <div className="mx-auto max-w-7xl space-y-4 px-2 pb-12 sm:px-6 lg:px-8">
                    {/* PLAYER HEADER BAR */}
                    <div className="relative z-30 flex flex-col justify-between gap-2.5 rounded-2xl border border-white/10 bg-slate-900/90 p-3 shadow-xl backdrop-blur-xl sm:gap-4 sm:p-4 md:flex-row md:items-center">
                        {/* Row 1 on Mobile / Left Side on Desktop: Title & Mobile Quick Actions */}
                        <div className="flex w-full min-w-0 items-center justify-between gap-3 md:w-auto md:flex-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1
                                        className="truncate text-base font-black tracking-tight text-white sm:text-lg md:text-xl"
                                        title={media.title}
                                    >
                                        {media.title}
                                    </h1>
                                    {!useStreambertEmbed && zetwareDirectUrl ? (
                                        <span className="hidden items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 md:inline-flex">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                            Zetware Cloud
                                        </span>
                                    ) : null}
                                </div>
                                {media.type === 'series' && (
                                    <div className="mt-0.5 font-mono text-xs font-bold text-red-400">
                                        Musim {selectedSeason} • Eps{' '}
                                        {selectedEpisode}
                                    </div>
                                )}
                            </div>

                            {/* Mobile-only Quick Action Buttons (Target API & Fullscreen) */}
                            <div className="flex shrink-0 items-center gap-1.5 md:hidden">
                                {/* Target API Query Button */}
                                <button
                                    onClick={() => {
                                        setApiFeedback(null);
                                        setShowApiTargetModal(true);
                                    }}
                                    className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-2 text-amber-300 transition hover:bg-amber-500/25 active:scale-95"
                                    title="Target API"
                                >
                                    <Share2 className="h-4 w-4 text-amber-400" />
                                </button>

                                {/* Fullscreen Button */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 active:scale-95"
                                    title="Layar Penuh"
                                >
                                    <Maximize className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Row 2 on Mobile / Right Side on Desktop: Streaming Controls */}
                        <div className="relative z-30 flex w-full shrink-0 items-center justify-start gap-2 md:w-auto md:justify-end">
                            {/* Zetware Glowing Badge with Integrated Resolution & Subtitle Dropdown */}
                            {zetwareDirectUrl && (
                                <ZetwareGlowingBadge
                                    variant="header"
                                    qualityText={detectedResolution}
                                    isPlayingZetware={!useStreambertEmbed}
                                    streams={zetwareStreams}
                                    currentStreamUrl={zetwareDirectUrl}
                                    onSelectStream={
                                        handleSelectZetwareResolution
                                    }
                                    subtitles={subtitles}
                                    selectedSubtitleId={selectedSubtitleId}
                                    onSelectSubtitle={setSelectedSubtitleId}
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

                            {/* Server Selector */}
                            <div className="relative min-w-0 flex-1 md:flex-initial">
                                <button
                                    onClick={() => {
                                        setShowSourceMenu(!showSourceMenu);
                                        setShowSubtitleMenu(false);
                                        setShowResolutionMenu(false);
                                        setShowEpisodeMenu(false);
                                    }}
                                    className={`flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-md transition active:scale-95 sm:px-3.5 sm:py-2 md:w-auto ${
                                        !useStreambertEmbed && zetwareDirectUrl
                                            ? 'border border-red-400/50 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                            : 'bg-red-600 shadow-red-600/30 hover:bg-red-500'
                                    }`}
                                >
                                    <Server className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                        Server:{' '}
                                        {!useStreambertEmbed && zetwareDirectUrl
                                            ? 'Zetware Cloud'
                                            : activeSourceObj.label}
                                    </span>
                                </button>

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
                                                            setShowSourceMenu(
                                                                false,
                                                            )
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
                                                                Server
                                                                Alternatif
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
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>,
                                        document.body,
                                    )}
                            </div>

                            {/* Series Season & Episode Picker */}
                            {media.type === 'series' && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowEpisodeMenu(
                                                !showEpisodeMenu,
                                            );
                                            setShowSourceMenu(false);
                                        }}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
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
                                            <div className="absolute top-11 right-0 z-50 w-64 space-y-2 rounded-2xl border border-white/20 bg-slate-950 p-3 text-xs shadow-2xl backdrop-blur-2xl">
                                                <span className="block border-b border-white/10 pb-1.5 font-bold text-white">
                                                    Pilih Musim & Episode
                                                </span>
                                                <div>
                                                    <span className="mb-1 block text-[10px] text-slate-400">
                                                        Musim:
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
                                                                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                                                    selectedSeason ===
                                                                    s.seasonNumber
                                                                        ? 'bg-red-600 text-white'
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
                                                                  (e) =>
                                                                      e.episodeNumber,
                                                              )
                                                            : [
                                                                  1, 2, 3, 4, 5,
                                                                  6, 7, 8,
                                                              ]
                                                        ).map((epNum) => (
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
                                                                className={`rounded-lg py-1.5 text-center text-xs font-bold transition ${
                                                                    selectedEpisode ===
                                                                    epNum
                                                                        ? 'bg-red-600 text-white'
                                                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                                }`}
                                                            >
                                                                E{epNum}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Desktop-only Quick Action Buttons */}
                            <div className="hidden shrink-0 items-center gap-2 md:flex">
                                {/* Fullscreen Button */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 active:scale-95"
                                    title="Layar Penuh (F)"
                                >
                                    <Maximize className="h-4 w-4" />
                                </button>

                                {/* Target API Query Button */}
                                <button
                                    onClick={() => {
                                        setApiFeedback(null);
                                        setShowApiTargetModal(true);
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/30 active:scale-95"
                                    title="Preview / Kirim Query TMDb Target (tmdb_id, m3u8_url, title)"
                                >
                                    <Share2 className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Target API</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CINEMA VIDEO VIEWPORT */}
                    <div
                        ref={frameContainerRef}
                        className="relative z-0 flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl"
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
                                                    animationDirection:
                                                        'reverse',
                                                    animationDuration: '2s',
                                                }}
                                            />
                                            <Server className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-red-500" />
                                        </div>
                                        <div className="max-w-sm space-y-1.5 px-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase">
                                                <RefreshCw className="h-3 w-3 animate-spin text-red-400" />
                                                Menghubungkan Stream
                                            </div>
                                            <h3 className="text-sm font-extrabold tracking-wide text-white uppercase">
                                                Menghubungkan Ke{' '}
                                                {activeSourceObj.label}...
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                TMDB ID:{' '}
                                                <span className="font-mono font-bold text-red-400">
                                                    {currentTmdbId}
                                                </span>
                                                {media.type === 'series' && (
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
                                    title={`ZTV Stream Cinema - ${media.title}`}
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
                                            Resolusi ini sedang membutuhkan
                                            waktu buffer
                                        </h4>
                                        <p className="max-w-sm text-xs text-slate-400">
                                            Koneksi ke server cloud sedang
                                            menyesuaikan bitrate file video.
                                            Anda dapat memuat ulang atau memilih
                                            resolusi alternatif.
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
                                                            ) ||
                                                            zetwareStreams[0];
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
                                    key={zetwareDirectUrl || media.videoUrl}
                                    src={zetwareDirectUrl || media.videoUrl}
                                    autoPlay
                                    preload="auto"
                                    playsInline
                                    controls
                                    className="h-full w-full object-contain"
                                    onError={() => setVideoError(true)}
                                    onLoadedMetadata={(e) => {
                                        setVideoError(false);
                                        const video = e.currentTarget;
                                        if (
                                            savedPlaybackPositionRef.current > 0
                                        ) {
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
                                >
                                    {subtitles.map((sub) => (
                                        <track
                                            key={sub.id}
                                            id={sub.id}
                                            kind="subtitles"
                                            src={sub.url}
                                            srcLang={sub.lang}
                                            label={sub.label}
                                            default={
                                                selectedSubtitleId === sub.id
                                            }
                                        />
                                    ))}
                                </video>
                            </div>
                        )}
                    </div>

                    {/* BELOW PLAYER MEDIA INFO & BINGE WATCH BAR */}
                    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl md:flex-row md:items-center">
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="truncate text-xl font-bold text-white">
                                    {media.title}
                                </h2>
                                {/* Synopsis Language Switcher */}
                                <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('id')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="Bahasa Indonesia"
                                        className={`rounded px-2 py-0.5 text-[11px] font-bold transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('en')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="English"
                                        className={`rounded px-2 py-0.5 text-[11px] font-bold transition-all ${
                                            synopsisLang === 'en'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ENG
                                    </button>
                                </div>
                            </div>
                            {isTranslatingSynopsis ? (
                                <p className="animate-pulse text-xs text-slate-400 italic">
                                    {synopsisLang === 'id'
                                        ? 'Menerjemahkan sinopsis...'
                                        : 'Translating synopsis...'}
                                </p>
                            ) : (
                                <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Link
                                href={`/detail/${media.id}`}
                                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                            >
                                <Film className="h-3.5 w-3.5" />
                                <span>Lihat Detail Lengkap</span>
                            </Link>

                            {media.type === 'series' && (
                                <button
                                    onClick={() => {
                                        setSelectedEpisode((prev) => prev + 1);
                                        setIframeLoading(true);
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 transition hover:bg-red-500"
                                >
                                    <span>Eps Selanjutnya</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SERIES EPISODES SELECTOR ROW (BELOW PLAYER) */}
                    {media.type === 'series' && liveEpisodes.length > 0 && (
                        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                                    <Tv className="h-4 w-4 text-red-500" />
                                    Episode Musim {selectedSeason}
                                </h3>
                                <span className="text-xs text-slate-400">
                                    {liveEpisodes.length} Episode Tersedia
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                {liveEpisodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => {
                                            setSelectedEpisode(
                                                ep.episodeNumber,
                                            );
                                            setIframeLoading(true);
                                        }}
                                        className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-2.5 text-left transition ${
                                            selectedEpisode === ep.episodeNumber
                                                ? 'border-red-500 bg-red-600/20 text-white shadow-lg shadow-red-600/20'
                                                : 'border-white/5 bg-slate-950/60 text-slate-300 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="font-mono text-xs font-bold text-red-400">
                                                E{ep.episodeNumber}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {ep.duration}
                                            </span>
                                        </div>
                                        <span className="block truncate text-xs font-semibold">
                                            {ep.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TMDB ID MODAL */}
                {showTmdbModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-slate-950 p-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                                    <Search className="h-5 w-5 text-red-500" />
                                    Ubah TMDB Stream ID
                                </h3>
                                <button
                                    onClick={() => setShowTmdbModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={handleApplyCustomTmdb}
                                className="space-y-3"
                            >
                                <input
                                    type="text"
                                    value={customTmdbInput}
                                    onChange={(e) =>
                                        setCustomTmdbInput(e.target.value)
                                    }
                                    placeholder="Contoh: 27205"
                                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowTmdbModal(false)}
                                        className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TARGET API MODAL */}
                {showApiTargetModal && (
                    <div
                        onClick={() => setShowApiTargetModal(false)}
                        className="fixed inset-0 z-50 flex animate-in cursor-pointer items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 fade-in sm:p-4"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="max-h-[90vh] w-full max-w-xl cursor-default space-y-4 overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-950 p-5 text-slate-200 shadow-2xl sm:p-6"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400">
                                        <Share2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">
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
                                    className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                                    <Globe className="h-3.5 w-3.5 text-amber-400" />
                                    Base URL Endpoint Target:
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
                            </div>

                            <div className="space-y-2">
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
                                        onClick={() =>
                                            handleCopy(targetTmdbId, 'tmdb_id')
                                        }
                                        className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                                    >
                                        {copiedField === 'tmdb_id'
                                            ? 'Disalin'
                                            : 'Salin'}
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
                                                        setTargetM3u8Type(
                                                            'watch',
                                                        )
                                                    }
                                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                        targetM3u8Type ===
                                                        'watch'
                                                            ? 'bg-amber-500 font-bold text-slate-950'
                                                            : 'bg-white/10 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Watch URL
                                                </button>
                                                {zetwareDirectUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setTargetM3u8Type(
                                                                'zetware',
                                                            )
                                                        }
                                                        className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                            targetM3u8Type ===
                                                            'zetware'
                                                                ? 'bg-red-600 font-bold text-white'
                                                                : 'bg-white/10 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        ⚡ Zetware Direct
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTargetM3u8Type(
                                                            'stream',
                                                        )
                                                    }
                                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                        targetM3u8Type ===
                                                        'stream'
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
                                        onClick={() =>
                                            handleCopy(
                                                targetM3u8Url,
                                                'm3u8_url',
                                            )
                                        }
                                        className="shrink-0 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:self-center"
                                    >
                                        {copiedField === 'm3u8_url'
                                            ? 'Disalin'
                                            : 'Salin'}
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
                                        onClick={() =>
                                            handleCopy(targetTitle, 'title')
                                        }
                                        className="shrink-0 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:self-center"
                                    >
                                        {copiedField === 'title'
                                            ? 'Disalin'
                                            : 'Salin'}
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
                                        onClick={() =>
                                            handleCopy(
                                                String(enableDownload),
                                                'enable_download',
                                            )
                                        }
                                        className="shrink-0 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:self-center"
                                    >
                                        {copiedField === 'enable_download'
                                            ? 'Disalin'
                                            : 'Salin'}
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
                                        onClick={() =>
                                            handleCopy(
                                                String(testDownload),
                                                'test_download',
                                            )
                                        }
                                        className="shrink-0 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:self-center"
                                    >
                                        {copiedField === 'test_download'
                                            ? 'Disalin'
                                            : 'Salin'}
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
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1,
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
                                        onClick={() =>
                                            handleCopy(
                                                String(threads),
                                                'threads',
                                            )
                                        }
                                        className="shrink-0 self-start rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:self-center"
                                    >
                                        {copiedField === 'threads'
                                            ? 'Disalin'
                                            : 'Salin'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                                    <Code className="h-3.5 w-3.5 text-slate-400" />
                                    Preview Full URL:
                                </label>
                                <div className="max-h-20 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[11px] break-all text-amber-300 select-all">
                                    {getTargetFullUrl()}
                                </div>
                            </div>

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

                            <div className="flex gap-2 border-t border-white/10 pt-2">
                                <button
                                    onClick={() =>
                                        window.open(
                                            getTargetFullUrl(),
                                            '_blank',
                                        )
                                    }
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-amber-500"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Buka di Tab Baru</span>
                                </button>
                                <button
                                    onClick={handleSendApiRequest}
                                    disabled={apiSending}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                                >
                                    <Send className="h-3.5 w-3.5 text-amber-400" />
                                    <span>
                                        {apiSending
                                            ? 'Mengirim...'
                                            : 'Kirim Request'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <StreamingFooter />

                {/* Development Notice Toast */}
                <DevNoticeBanner />
            </div>
        </>
    );
}
