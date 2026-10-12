import { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Play, Pause, ArrowLeft, Server, Tv, Search, Layers, RefreshCw, AlertCircle, Film,
    Maximize, X, ChevronRight, ChevronLeft, Share2, ExternalLink, Copy, Check, Send, Globe, Code, CheckCircle2,
    Zap, Monitor, ChevronDown
} from 'lucide-react';
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import { fetchMediaById, fetchTmdbEpisodes, fetchTmdbTvSeasons } from '@/lib/tmdbService';
import { PLAYER_SOURCES, getSourceUrl, getTmdbIdForMedia } from '@/lib/streambertApi';
import { checkZetwareMediaExists, ZetwareStreamOption } from '@/lib/zetwareStorage';
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

    // Zetware Cloud Direct Storage State
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(null);
    const [zetwareStreams, setZetwareStreams] = useState<ZetwareStreamOption[]>([]);
    const [isCheckingZetware, setIsCheckingZetware] = useState<boolean>(true);
    const [showResolutionMenu, setShowResolutionMenu] = useState<boolean>(false);

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
                setUseStreambertEmbed(false); // Automatically use Zetware Cloud direct MP4!
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

    const detectedResolution = zetwareDirectUrl?.match(/_(\d+x\d+|\d+p)/i)?.[1]
        ? `${zetwareDirectUrl.match(/_(\d+x\d+|\d+p)/i)?.[1]} MP4`
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
                    activeCategory="Semua"
                    onSelectCategory={(cat) => router.visit(`/?category=${encodeURIComponent(cat)}`)}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={0}
                    showMyListOnly={false}
                    onToggleMyListOnly={() => router.visit('/?my_list=1')}
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
                    activeCategory={media.type === 'series' ? 'Series TV' : 'Film'}
                    onSelectCategory={(cat) => router.visit(cat === 'Semua' ? '/' : `/?category=${encodeURIComponent(cat)}`)}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={0}
                    showMyListOnly={false}
                    onToggleMyListOnly={() => router.visit('/?my_list=1')}
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
                            {/* Zetware Glowing Badge in Header when playing from zetware.id */}
                            {!useStreambertEmbed && zetwareDirectUrl && (
                                <ZetwareGlowingBadge variant="header" qualityText={detectedResolution} />
                            )}

                            {/* Resolution Selector Button for Zetware Cloud in Header */}
                            {!useStreambertEmbed && zetwareDirectUrl && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowResolutionMenu(!showResolutionMenu);
                                            setShowSourceMenu(false);
                                            setShowEpisodeMenu(false);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                                        title="Pilih Resolusi Video Zetware Cloud"
                                    >
                                        <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{detectedResolution}</span>
                                        <ChevronDown className="w-3 h-3 text-amber-400" />
                                    </button>

                                    {showResolutionMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40 bg-transparent"
                                                onClick={() => setShowResolutionMenu(false)}
                                            />
                                            <div className="absolute top-11 right-0 w-52 bg-slate-950 border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1 backdrop-blur-2xl">
                                                <div className="px-2 py-1 border-b border-white/10 text-white font-bold flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                                        Resolusi Video
                                                    </span>
                                                </div>
                                                {zetwareStreams.length > 0 ? (
                                                    zetwareStreams.map((st) => (
                                                        <button
                                                            key={st.url}
                                                            onClick={() => handleSelectZetwareResolution(st.url)}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition text-xs font-semibold ${
                                                                zetwareDirectUrl === st.url
                                                                    ? 'bg-amber-400 text-slate-950 font-black'
                                                                    : 'text-slate-300 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-1.5">
                                                                <Zap className="w-3 h-3 fill-current" />
                                                                {st.label} MP4
                                                            </span>
                                                            {zetwareDirectUrl === st.url && (
                                                                <Check className="w-3.5 h-3.5 text-slate-950" />
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-[11px] text-slate-400">
                                                        {detectedResolution}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Server Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowSourceMenu(!showSourceMenu);
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

                                {showSourceMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setShowSourceMenu(false)}
                                        />
                                        <div className="absolute top-11 right-0 w-80 bg-slate-950 border border-white/20 rounded-2xl p-2.5 shadow-2xl z-50 text-xs space-y-1.5 backdrop-blur-2xl">
                                        <div className="px-2 py-1 border-b border-white/10 text-white font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-red-500" />
                                                <span>Pilih Sumber Tayangan</span>
                                            </div>
                                        </div>

                                        {/* Option: Zetware Cloud Native File (If Available) */}
                                        {zetwareDirectUrl && (
                                            <div
                                                className={`p-2.5 rounded-xl transition border mb-1.5 ${
                                                    !useStreambertEmbed
                                                        ? 'bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'
                                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUseStreambertEmbed(false);
                                                        setShowSourceMenu(false);
                                                    }}
                                                    className="w-full text-left"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center font-black text-white text-[10px] shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                                                                Z
                                                            </div>
                                                            <span className="font-extrabold text-white">Zetware Cloud</span>
                                                        </div>
                                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400">
                                                            {detectedResolution}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-300 line-clamp-1 mt-1">
                                                        File streaming direct MP4 cepat & jernih dari cloud zetware.id
                                                    </p>
                                                </button>

                                                {/* Resolusi Selector di dalam Server Menu */}
                                                {zetwareStreams.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-white/10">
                                                        <span className="text-[10px] text-slate-400 font-semibold w-full">Pilih Resolusi Zetware Cloud:</span>
                                                        {zetwareStreams.map((st) => (
                                                            <button
                                                                key={st.url}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectZetwareResolution(st.url);
                                                                }}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                                                    !useStreambertEmbed && zetwareDirectUrl === st.url
                                                                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                                                        : 'bg-white/10 hover:bg-white/20 text-slate-200'
                                                                }`}
                                                            >
                                                                <Zap className="w-2.5 h-2.5 fill-current" />
                                                                <span>{st.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                            {PLAYER_SOURCES.map((src) => (
                                                <button
                                                    key={src.id}
                                                    onClick={() => {
                                                        setSelectedSource(src.id);
                                                        setUseStreambertEmbed(true);
                                                        setIframeLoading(true);
                                                        setShowSourceMenu(false);
                                                    }}
                                                    className={`w-full text-left p-2 rounded-xl transition ${
                                                        useStreambertEmbed && selectedSource === src.id
                                                            ? 'bg-red-600 text-white font-bold'
                                                            : 'text-slate-300 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold">{src.label}</span>
                                                        {src.tag && (
                                                            <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px] text-amber-300">
                                                                {src.tag}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">{src.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </>
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
                            <button
                                onClick={() => setShowTmdbModal(true)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                                title="Ubah TMDB ID"
                            >
                                <Search className="w-4 h-4" />
                            </button>

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
                            <div className="relative w-full h-full flex items-center justify-center bg-black">
                                <video
                                    ref={videoRef}
                                    key={zetwareDirectUrl || media.videoUrl}
                                    src={zetwareDirectUrl || media.videoUrl}
                                    autoPlay
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* BELOW PLAYER MEDIA INFO & BINGE WATCH BAR */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">
                                {media.title}
                            </h2>
                            <p className="text-xs text-slate-300 line-clamp-2">
                                {media.synopsis}
                            </p>
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
