import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Play, Pause, ArrowLeft, Server, Tv, Search, Layers, RefreshCw, AlertCircle, Film,
    Maximize, X, ChevronRight, ChevronLeft, Share2, ExternalLink, Copy, Check, Send, Globe, Code, CheckCircle2,
    Zap, Monitor, ChevronDown, Subtitles, Upload
} from 'lucide-react';
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import { fetchMediaById, fetchTmdbEpisodes, fetchTmdbTvSeasons, translateText, isEngText } from '@/lib/tmdbService';
import { PLAYER_SOURCES, getSourceUrl, getTmdbIdForMedia } from '@/lib/streambertApi';
import { checkZetwareMediaExists, ZetwareStreamOption, isZetwareDefaultEnabled, formatZetwareResolution } from '@/lib/zetwareStorage';
import { fetchSubtitlesForMedia, convertSrtToVttBlob, SubtitleTrack } from '@/lib/subtitleService';
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
    initialEpisode = 1
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
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(null);
    const [zetwareStreams, setZetwareStreams] = useState<ZetwareStreamOption[]>([]);
    const [isCheckingZetware, setIsCheckingZetware] = useState<boolean>(true);
    const [showResolutionMenu, setShowResolutionMenu] = useState<boolean>(false);

    // Zetware Cloud Subtitles State (Opsi B: Auto-fetch API)
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | 'off'>('id');
    const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
    const [isLoadingSubtitles, setIsLoadingSubtitles] = useState<boolean>(false);

    // Streambert Engine State
    const [selectedSource, setSelectedSource] = useState<string>('vidsrc');
    const [useStreambertEmbed, setUseStreambertEmbed] = useState<boolean>(true);
    const [currentTmdbId, setCurrentTmdbId] = useState<string | number>('');
    const [selectedSeason, setSelectedSeason] = useState<number>(Number(initialSeason) || 1);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(Number(initialEpisode) || 1);
    const [liveSeasons, setLiveSeasons] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([]);
    const [liveEpisodes, setLiveEpisodes] = useState<Episode[]>([]);
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);
    const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
    const [showEpisodeMenu, setShowEpisodeMenu] = useState<boolean>(false);
    const [showTmdbModal, setShowTmdbModal] = useState<boolean>(false);
    const [customTmdbInput, setCustomTmdbInput] = useState<string>('');

    // Synopsis translation & language toggle state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>('id');
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{ id?: string; en?: string }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] = useState<boolean>(false);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!media) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn = media.synopsisEn || (isEngText(media.synopsis) ? media.synopsis : '');
                if (media.synopsis && !isEngText(media.synopsis)) return;
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res) setTranslatedSynopsis((prev) => ({ ...prev, id: res }));
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
                        if (res) setTranslatedSynopsis((prev) => ({ ...prev, en: res }));
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
            if (media.synopsis && !isEngText(media.synopsis)) return media.synopsis;
            return media.synopsis;
        } else {
            if (translatedSynopsis.en) return translatedSynopsis.en;
            if (media.synopsisEn) return media.synopsisEn;
            if (media.synopsis && isEngText(media.synopsis)) return media.synopsis;
            return media.synopsisEn || media.synopsis;
        }
    };

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
    const [targetM3u8Type, setTargetM3u8Type] = useState<'watch' | 'stream' | 'zetware'>('watch');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [apiSending, setApiSending] = useState<boolean>(false);
    const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
                    if (cached && (cached.id === id || String(cached.tmdbId) === id)) {
                        if (isMounted) {
                            setMedia(cached);
                            const tmdb = getTmdbIdForMedia(cached.id, cached.tmdbId);
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
                        sessionStorage.setItem(`ztv_media_${id}`, JSON.stringify(fetched));
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
        checkZetwareMediaExists(media.title, media.type, selectedSeason, selectedEpisode).then((res) => {
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
            selectedEpisode
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
                const targetSub = subtitles.find((s) => s.id === selectedSubtitleId);

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
    }, [iframeLoading, selectedSource, selectedSeason, selectedEpisode, currentTmdbId]);

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

    const streamUrl = media ? getSourceUrl(
        selectedSource,
        media.type,
        currentTmdbId || 27205,
        selectedSeason,
        selectedEpisode,
        'e50914',
        'id'
    ) : '';

    const activeSourceObj = PLAYER_SOURCES.find((s) => s.id === selectedSource) || PLAYER_SOURCES[0];

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
    const targetTmdbId = String(currentTmdbId || (media ? getTmdbIdForMedia(media.id, media.tmdbId) : ''));
    
    const getTargetWatchUrl = () => {
        const domain = (typeof window !== 'undefined' && !window.location.origin.includes('localhost'))
            ? window.location.origin
            : 'https://cinema.zetware.id';
        const mediaId = media ? (media.id.startsWith('tmdb-') ? media.id : `tmdb-${media.type === 'series' ? 'tv' : 'mov'}-${targetTmdbId}`) : id;
        const query = media?.type === 'series' ? `?episode=${selectedEpisode}&season=${selectedSeason}` : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url = targetM3u8Type === 'zetware' && zetwareDirectUrl
        ? zetwareDirectUrl
        : targetM3u8Type === 'watch'
        ? getTargetWatchUrl()
        : streamUrl;
    
    const targetTitle = media
        ? media.type === 'series'
            ? `${media.title.toUpperCase()} - S${selectedSeason}E${selectedEpisode}`
            : media.title.toUpperCase()
        : '';

    const detectedResolution = zetwareDirectUrl?.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1]
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
    const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

    const handleSelectZetwareResolution = (newUrl: string) => {
        const videoEl = videoRef.current;
        const curTime = videoEl ? videoEl.currentTime : 0;
        const isPlayingNow = videoEl ? !videoEl.paused : true;

        savedPlaybackPositionRef.current = curTime;
        shouldResumePlaybackRef.current = isPlayingNow;
        isSwitchingResolutionRef.current = true;

        const targetStream = zetwareStreams.find((s) => s.url === newUrl);
        const resInfo = formatZetwareResolution(
            targetStream?.resolution || newUrl.match(/_(\d+x\d+|\d+p|\d{3,4}|4k)/i)?.[1]
        );
        const timeFormatted = formatTime(curTime);
        setResolutionNotice(`⚡ Berpindah ke ${resInfo.label} • Menit ${timeFormatted}`);
        setTimeout(() => setResolutionNotice(null), 3500);

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
                headers: { 'Accept': 'application/json' },
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
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
                <Navbar
                    activeCategory=""
                    onSelectCategory={handleNavbarSelectCategory}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={myList.length}
                    showMyListOnly={false}
                    onToggleMyListOnly={handleNavbarToggleMyListOnly}
                />
                <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto">
                    <StreamingSkeleton />
                </div>
            </div>
        );
    }

    if (!media) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                <h1 className="text-2xl font-bold mb-2">Video Tidak Ditemukan</h1>
                <p className="text-slate-400 text-sm max-w-md mb-6">
                    Konten pemutar video dengan ID ini tidak dapat dimuat.
                </p>
                <Link
                    href="/"
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition"
                >
                    Kembali Ke Beranda
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head title={`Memutar ${media.title} | ZTV Stream Cinema`} />

            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white antialiased">
                {/* Navbar */}
                <Navbar
                    activeCategory=""
                    onSelectCategory={handleNavbarSelectCategory}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={myList.length}
                    showMyListOnly={false}
                    onToggleMyListOnly={handleNavbarToggleMyListOnly}
                />

                {/* CINEMA PLAYER CONTAINER */}
                <div className="pt-20 sm:pt-24 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pb-12 space-y-4">
                    {/* PLAYER HEADER BAR */}
                    <div className="relative z-30 p-3 sm:p-4 bg-slate-900/90 border border-white/10 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl backdrop-blur-xl">
                        {/* Left: Back & Title */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => {
                                    if (window.history.length > 1) {
                                        window.history.back();
                                    } else {
                                        router.visit(`/detail/${media.id}`);
                                    }
                                }}
                                className="p-2 rounded-xl bg-white/10 hover:bg-red-600 text-white transition active:scale-95 shrink-0"
                                title="Kembali (Back)"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>

                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg font-extrabold text-white truncate">
                                    {media.title}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="text-emerald-400 font-semibold">
                                        {!useStreambertEmbed && zetwareDirectUrl ? '⚡ Zetware Cloud' : useStreambertEmbed ? activeSourceObj.label : 'Local MP4'}
                                    </span>
                                    {media.type === 'series' && (
                                        <>
                                            <span>•</span>
                                            <span className="text-red-400 font-mono font-bold">
                                                Musim {selectedSeason} : Eps {selectedEpisode}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Controls (Server, Episodes, Target API, Fullscreen) */}
                        <div className="flex flex-wrap items-center gap-2 justify-end relative z-30">
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
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowSourceMenu(!showSourceMenu);
                                        setShowSubtitleMenu(false);
                                        setShowResolutionMenu(false);
                                        setShowEpisodeMenu(false);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95 ${
                                        !useStreambertEmbed && zetwareDirectUrl
                                            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/50'
                                            : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                                    }`}
                                >
                                    <Server className="w-3.5 h-3.5" />
                                    <span>Server: {!useStreambertEmbed && zetwareDirectUrl ? 'Zetware Cloud' : activeSourceObj.label}</span>
                                </button>

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
                                                                        {zetwareStreams.length} Opsi Tersedia
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {zetwareStreams.map((st) => {
                                                                        const isSelectedStream = !useStreambertEmbed && zetwareDirectUrl === st.url;
                                                                        const resInfo = formatZetwareResolution(st.resolution);
                                                                        return (
                                                                            <button
                                                                                key={st.url}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSelectZetwareResolution(st.url);
                                                                                }}
                                                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer active:scale-95 border ${
                                                                                    isSelectedStream
                                                                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/30'
                                                                                        : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border-white/5'
                                                                                }`}
                                                                            >
                                                                                <span className="flex items-center gap-2 min-w-0">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                                                                        isSelectedStream ? 'bg-slate-950 text-amber-300' : 'bg-black/30 text-amber-400'
                                                                                    }`}>
                                                                                        {resInfo.badge}
                                                                                    </span>
                                                                                    <span className="truncate">{resInfo.label}</span>
                                                                                </span>
                                                                                {isSelectedStream && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
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
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>

                            {/* Series Season & Episode Picker */}
                            {media.type === 'series' && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowEpisodeMenu(!showEpisodeMenu);
                                            setShowSourceMenu(false);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
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
                                            <div className="absolute top-11 right-0 w-64 bg-slate-950 border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2 backdrop-blur-2xl">
                                            <span className="font-bold text-white block border-b border-white/10 pb-1.5">
                                                Pilih Musim & Episode
                                            </span>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block mb-1">Musim:</span>
                                                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                    {(liveSeasons.length > 0
                                                        ? liveSeasons
                                                        : [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }]
                                                    ).map((s) => (
                                                        <button
                                                            key={s.seasonNumber}
                                                            onClick={() => {
                                                                setSelectedSeason(s.seasonNumber);
                                                                setSelectedEpisode(1);
                                                                setIframeLoading(true);
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                                                                selectedSeason === s.seasonNumber
                                                                    ? 'bg-red-600 text-white'
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
                                                        ? liveEpisodes.map((e) => e.episodeNumber)
                                                        : [1, 2, 3, 4, 5, 6, 7, 8]
                                                    ).map((epNum) => (
                                                        <button
                                                            key={epNum}
                                                            onClick={() => {
                                                                setSelectedEpisode(epNum);
                                                                setIframeLoading(true);
                                                                setShowEpisodeMenu(false);
                                                            }}
                                                            className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                                                                selectedEpisode === epNum
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

                            {/* Fullscreen Button */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                                title="Layar Penuh (F)"
                            >
                                <Maximize className="w-4 h-4" />
                            </button>

                            {/* Change TMDB ID Button */}
                            {/* <button
                                onClick={() => setShowTmdbModal(true)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                                title="Ubah TMDB ID"
                            >
                                <Search className="w-4 h-4" />
                            </button> */}

                            {/* Target API Query Button */}
                            <button
                                onClick={() => {
                                    setApiFeedback(null);
                                    setShowApiTargetModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
                                title="Preview / Kirim Query TMDb Target (tmdb_id, m3u8_url, title)"
                            >
                                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden sm:inline">Target API</span>
                            </button>
                        </div>
                    </div>

                    {/* CINEMA VIDEO VIEWPORT */}
                    <div 
                        ref={frameContainerRef}
                        className="relative z-0 w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex items-center justify-center"
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
                                                Menghubungkan Stream
                                            </div>
                                            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                                                Menghubungkan Ke {activeSourceObj.label}...
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                TMDB ID: <span className="font-mono text-red-400 font-bold">{currentTmdbId}</span>
                                                {media.type === 'series' && <span> • S{selectedSeason} E{selectedEpisode}</span>}
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
                                    title={`ZTV Stream Cinema - ${media.title}`}
                                />
                            </>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center bg-black group">
                                {/* Seamless Resolution Switch Notification Toast */}
                                {resolutionNotice && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-400/60 shadow-[0_0_20px_rgba(250,204,21,0.35)] backdrop-blur-xl flex items-center gap-2 text-xs font-bold text-amber-300 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                        <span>{resolutionNotice}</span>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    key={zetwareDirectUrl || media.videoUrl}
                                    src={zetwareDirectUrl || media.videoUrl}
                                    autoPlay
                                    controls
                                    className="w-full h-full object-contain"
                                    onLoadedMetadata={(e) => {
                                        const video = e.currentTarget;
                                        if (savedPlaybackPositionRef.current > 0) {
                                            video.currentTime = savedPlaybackPositionRef.current;
                                        }
                                        if (shouldResumePlaybackRef.current) {
                                            video.play().catch(() => {});
                                        }
                                    }}
                                    onCanPlay={(e) => {
                                        const video = e.currentTarget;
                                        if (isSwitchingResolutionRef.current && savedPlaybackPositionRef.current > 0) {
                                            if (Math.abs(video.currentTime - savedPlaybackPositionRef.current) > 1.5) {
                                                video.currentTime = savedPlaybackPositionRef.current;
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
                                            default={selectedSubtitleId === sub.id}
                                        />
                                    ))}
                                </video>
                            </div>
                        )}
                    </div>

                    {/* BELOW PLAYER MEDIA INFO & BINGE WATCH BAR */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-bold text-white truncate">
                                    {media.title}
                                </h2>
                                {/* Synopsis Language Switcher */}
                                <div className="flex items-center gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('id')}
                                        disabled={isTranslatingSynopsis}
                                        title="Bahasa Indonesia"
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('en')}
                                        disabled={isTranslatingSynopsis}
                                        title="English"
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
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
                                <p className="text-xs text-slate-400 italic animate-pulse">
                                    {synopsisLang === 'id' ? 'Menerjemahkan sinopsis...' : 'Translating synopsis...'}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href={`/detail/${media.id}`}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <Film className="w-3.5 h-3.5" />
                                <span>Lihat Detail Lengkap</span>
                            </Link>

                            {media.type === 'series' && (
                                <button
                                    onClick={() => {
                                        setSelectedEpisode((prev) => prev + 1);
                                        setIframeLoading(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
                                >
                                    <span>Eps Selanjutnya</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SERIES EPISODES SELECTOR ROW (BELOW PLAYER) */}
                    {media.type === 'series' && liveEpisodes.length > 0 && (
                        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Tv className="w-4 h-4 text-red-500" />
                                    Episode Musim {selectedSeason}
                                </h3>
                                <span className="text-xs text-slate-400">{liveEpisodes.length} Episode Tersedia</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {liveEpisodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => {
                                            setSelectedEpisode(ep.episodeNumber);
                                            setIframeLoading(true);
                                        }}
                                        className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                                            selectedEpisode === ep.episodeNumber
                                                ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                                                : 'bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-xs font-bold text-red-400">E{ep.episodeNumber}</span>
                                            <span className="text-[10px] text-slate-400">{ep.duration}</span>
                                        </div>
                                        <span className="text-xs font-semibold truncate block">
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
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Search className="w-5 h-5 text-red-500" />
                                    Ubah TMDB Stream ID
                                </h3>
                                <button
                                    onClick={() => setShowTmdbModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleApplyCustomTmdb} className="space-y-3">
                                <input
                                    type="text"
                                    value={customTmdbInput}
                                    onChange={(e) => setCustomTmdbInput(e.target.value)}
                                    placeholder="Contoh: 27205"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-red-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowTmdbModal(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
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
                        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 cursor-pointer"
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xl bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto cursor-default text-slate-200"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">
                                            Preview Query Target Stream API
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            Parameter query string target untuk pemutar / manifest streaming
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowApiTargetModal(false)}
                                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                                    Base URL Endpoint Target:
                                </label>
                                <input
                                    type="text"
                                    value={apiBaseUrl}
                                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                                    placeholder="http://100.81.252.14:8000/extract"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition"
                                />
                            </div>

                            <div className="space-y-2">
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
                                        onClick={() => handleCopy(targetTmdbId, 'tmdb_id')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0"
                                    >
                                        {copiedField === 'tmdb_id' ? 'Disalin' : 'Salin'}
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
                                                {zetwareDirectUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTargetM3u8Type('zetware')}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                                            targetM3u8Type === 'zetware' ? 'bg-red-600 text-white font-bold' : 'bg-white/10 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        ⚡ Zetware Direct
                                                    </button>
                                                )}
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
                                        onClick={() => handleCopy(targetM3u8Url, 'm3u8_url')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 self-start sm:self-center"
                                    >
                                        {copiedField === 'm3u8_url' ? 'Disalin' : 'Salin'}
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
                                        onClick={() => handleCopy(targetTitle, 'title')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 self-start sm:self-center"
                                    >
                                        {copiedField === 'title' ? 'Disalin' : 'Salin'}
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
                                        onClick={() => handleCopy(String(enableDownload), 'enable_download')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 self-start sm:self-center"
                                    >
                                        {copiedField === 'enable_download' ? 'Disalin' : 'Salin'}
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
                                        onClick={() => handleCopy(String(testDownload), 'test_download')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 self-start sm:self-center"
                                    >
                                        {copiedField === 'test_download' ? 'Disalin' : 'Salin'}
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
                                        onClick={() => handleCopy(String(threads), 'threads')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 self-start sm:self-center"
                                    >
                                        {copiedField === 'threads' ? 'Disalin' : 'Salin'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-slate-400" />
                                    Preview Full URL:
                                </label>
                                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-amber-300 break-all max-h-20 overflow-y-auto select-all">
                                    {getTargetFullUrl()}
                                </div>
                            </div>

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

                            <div className="flex gap-2 pt-2 border-t border-white/10">
                                <button
                                    onClick={() => window.open(getTargetFullUrl(), '_blank')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Buka di Tab Baru</span>
                                </button>
                                <button
                                    onClick={handleSendApiRequest}
                                    disabled={apiSending}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{apiSending ? 'Mengirim...' : 'Kirim Request'}</span>
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
