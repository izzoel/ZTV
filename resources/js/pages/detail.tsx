import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Play, Plus, Check, Star, Film, Clock, RefreshCw, Layers, 
    ArrowLeft, Share2, Globe, Sparkles, Tv, Server, AlertCircle, Copy, ExternalLink, Send, Code
} from 'lucide-react';
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import { fetchMediaById, fetchTmdbCredits, fetchTmdbEpisodes, fetchTmdbTvSeasons } from '@/lib/tmdbService';
import { getSourceUrl, getTmdbIdForMedia } from '@/lib/streambertApi';
import { useLanguage } from '@/lib/i18n';
import Navbar from '@/components/streaming/Navbar';
import StreamingFooter from '@/components/streaming/StreamingFooter';
import StreamingSkeleton from '@/components/streaming/StreamingSkeleton';
import DevNoticeBanner from '@/components/streaming/DevNoticeBanner';

interface DetailPageProps {
    id: string;
}

export default function DetailPage({ id }: DetailPageProps) {
    const { language, t } = useLanguage();
    const [media, setMedia] = useState<MediaItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [myList, setMyList] = useState<string[]>([]);
    const [castList, setCastList] = useState<string[]>([]);
    const [directorName, setDirectorName] = useState<string>('');
    const [episodesList, setEpisodesList] = useState<Episode[]>([]);
    const [seasonsList, setSeasonsList] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
    const [isCopiedShare, setIsCopiedShare] = useState<boolean>(false);

    // API Target Modal State
    const [showApiTargetModal, setShowApiTargetModal] = useState<boolean>(false);
    const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
        try {
            return localStorage.getItem('ztv_api_target_base_url') || 'http://localhost:8000/api/stream';
        } catch {
            return 'http://localhost:8000/api/stream';
        }
    });
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [apiSending, setApiSending] = useState<boolean>(false);
    const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Load initial media item (from sessionStorage cache or TMDB live fetch)
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
                            setCastList(cached.cast || []);
                            setDirectorName(cached.director || '');
                            setEpisodesList(cached.episodes || []);
                            setIsLoading(false);
                        }
                    }
                }
            } catch {
                // Ignore storage error
            }

            // 2. Fetch fresh data from TMDB / catalog
            try {
                const fetched = await fetchMediaById(id);
                if (isMounted && fetched) {
                    setMedia(fetched);
                    setCastList(fetched.cast || []);
                    setDirectorName(fetched.director || '');
                    setEpisodesList(fetched.episodes || []);
                }
            } catch (err) {
                console.warn('Failed to fetch media details:', err);
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

    // Load watchlist from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ztv_my_list');
            if (saved) {
                setMyList(JSON.parse(saved));
            }
        } catch {
            // fallback
        }
    }, []);

    // Fetch credits & seasons when media changes
    useEffect(() => {
        if (!media) return;

        if (media.tmdbId) {
            fetchTmdbCredits(media.tmdbId, media.type).then((res) => {
                if (res.cast && res.cast.length > 0) setCastList(res.cast);
                if (res.director) setDirectorName(res.director);
            });

            if (media.type === 'series') {
                fetchTmdbTvSeasons(media.tmdbId).then((seasons) => {
                    setSeasonsList(seasons);
                });
            }
        }
    }, [media]);

    // Fetch episodes when selectedSeasonNumber changes
    useEffect(() => {
        if (media && media.type === 'series' && media.tmdbId) {
            setIsLoadingEpisodes(true);
            fetchTmdbEpisodes(media.tmdbId, selectedSeasonNumber).then((eps) => {
                setEpisodesList(eps);
                setIsLoadingEpisodes(false);
            });
        }
    }, [media, selectedSeasonNumber]);

    const handleToggleMyList = () => {
        if (!media) return;
        setMyList((prev) => {
            const updated = prev.includes(media.id) ? prev.filter((i) => i !== media.id) : [...prev, media.id];
            try {
                localStorage.setItem('ztv_my_list', JSON.stringify(updated));
            } catch {
                // ignore
            }
            return updated;
        });
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setIsCopiedShare(true);
            setTimeout(() => setIsCopiedShare(false), 2000);
        }
    };

    const isSaved = media ? myList.includes(media.id) : false;

    // TMDB Target API calculation
    const targetTmdbId = String(media?.tmdbId || (media ? getTmdbIdForMedia(media.id) : ''));
    const targetM3u8Url = media
        ? getSourceUrl('vidsrc', media.type, targetTmdbId || 27205, selectedSeasonNumber, 1)
        : '';
    const targetTitle = media
        ? media.type === 'series'
            ? `${media.title} - S${selectedSeasonNumber}E1`
            : media.title
        : '';

    const handleBaseUrlChange = (val: string) => {
        setApiBaseUrl(val);
        try {
            localStorage.setItem('ztv_api_target_base_url', val);
        } catch {
            // ignore
        }
    };

    const getTargetFullUrl = (baseUrl: string = apiBaseUrl) => {
        const trimmed = baseUrl.trim() || 'http://localhost:8000/api/stream';
        try {
            const parsed = new URL(trimmed);
            parsed.searchParams.set('tmdb_id', targetTmdbId);
            parsed.searchParams.set('m3u8_url', targetM3u8Url);
            parsed.searchParams.set('title', targetTitle);
            return parsed.toString();
        } catch {
            const qs = new URLSearchParams({
                tmdb_id: targetTmdbId,
                m3u8_url: targetM3u8Url,
                title: targetTitle,
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
                    message: `Berhasil! Status: ${res.status} ${res.statusText || 'OK'}`,
                });
            } else {
                setApiFeedback({
                    type: 'error',
                    message: `Respon HTTP ${res.status}: ${res.statusText || 'Error'}`,
                });
            }
        } catch (err: any) {
            setApiFeedback({
                type: 'error',
                message: `Gagal memanggil API: ${err.message || 'CORS / Server Offline'}`,
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
                    myListCount={myList.length}
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
                <h1 className="text-2xl font-bold mb-2">Tayangan Tidak Ditemukan</h1>
                <p className="text-slate-400 text-sm max-w-md mb-6">
                    Konten film atau serial TV dengan ID ini tidak dapat dimuat atau telah dipindahkan.
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

    const synopsisText = (language === 'en' && media.synopsisEn) ? media.synopsisEn : media.synopsis;

    return (
        <>
            <Head title={`${media.title} - Detail Tayangan | ZTV Stream`} />

            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white antialiased">
                {/* Navbar */}
                <Navbar
                    activeCategory={media.type === 'series' ? 'Serial TV' : 'Film'}
                    onSelectCategory={(cat) => router.visit(`/?category=${encodeURIComponent(cat)}`)}
                    onPlayMedia={(m) => router.visit(`/watch/${m.id}`)}
                    onOpenDetail={(m) => router.visit(`/detail/${m.id}`)}
                    myListCount={myList.length}
                    showMyListOnly={false}
                    onToggleMyListOnly={() => router.visit('/?my_list=1')}
                />

                {/* Back to Home Quick Floating Bar */}
                <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                router.visit('/');
                            }
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer backdrop-blur-md mb-4 active:scale-95 shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4 text-red-500" />
                        <span>Kembali</span>
                    </button>
                </div>

                {/* CINEMATIC HERO BANNER */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pb-12">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 min-h-[460px] sm:min-h-[540px] flex items-end">
                        {/* Backdrop Image */}
                        <img
                            src={media.backdropUrl}
                            alt={media.title}
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-50 filter brightness-90"
                        />

                        {/* Radial & Linear Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Content Container */}
                        <div className="relative z-10 p-5 sm:p-10 w-full flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-end">
                            {/* Poster Column (Hidden on tiny screens) */}
                            <div className="hidden sm:block w-44 md:w-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 -mb-2">
                                <img
                                    src={media.posterUrl}
                                    alt={media.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 space-y-4">
                                {media.isOriginal && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        ZTV ORIGINAL
                                    </div>
                                )}

                                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
                                    {media.title}
                                </h1>

                                {/* Meta badges */}
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                                    <span className="text-emerald-400 font-bold">{media.matchScore}</span>
                                    <span>•</span>
                                    <span className="text-amber-400 flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {media.rating}
                                    </span>
                                    <span>•</span>
                                    <span>{media.year}</span>
                                    <span>•</span>
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs border border-white/15">
                                        {media.ageRating}
                                    </span>
                                    <span>•</span>
                                    <span className="px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 text-xs border border-red-500/30 font-bold">
                                        {media.quality}
                                    </span>
                                    <span>•</span>
                                    <span>{media.duration}</span>
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {media.genres.map((g) => (
                                        <span
                                            key={g}
                                            className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-slate-300 border border-white/10"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    {/* Play Button */}
                                    <Link
                                        href={`/watch/${media.id}`}
                                        className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-600/40 hover:shadow-red-600/60 transition active:scale-95"
                                    >
                                        <Play className="w-5 h-5 fill-white" />
                                        <span>Putar Sekarang</span>
                                    </Link>

                                    {/* My List Toggle */}
                                    <button
                                        onClick={handleToggleMyList}
                                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 flex items-center gap-2 text-sm font-semibold"
                                        title={isSaved ? 'Hapus dari Daftar Saya' : 'Tambah ke Daftar Saya'}
                                    >
                                        {isSaved ? (
                                            <>
                                                <Check className="w-5 h-5 text-emerald-400" />
                                                <span className="hidden sm:inline text-emerald-400">Tersimpan</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                <span className="hidden sm:inline">Daftar Saya</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 flex items-center gap-2 text-sm font-semibold"
                                        title="Bagikan Tautan"
                                    >
                                        <Share2 className="w-5 h-5 text-slate-300" />
                                        <span className="hidden sm:inline">
                                            {isCopiedShare ? 'Tersalin!' : 'Bagikan'}
                                        </span>
                                    </button>

                                    {/* Target API Button */}
                                    <button
                                        onClick={() => setShowApiTargetModal(true)}
                                        className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition active:scale-95 flex items-center gap-2 text-sm font-semibold"
                                        title="Preview Query Parameter TMDb (tmdb_id, m3u8_url, title)"
                                    >
                                        <Code className="w-5 h-5 text-amber-400" />
                                        <span className="hidden sm:inline">Target API</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SYNOPSIS & CREDITS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        {/* Synopsis & Overview (2 columns) */}
                        <div className="lg:col-span-2 space-y-4 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <Film className="w-5 h-5 text-red-500" />
                                Sinopsis & Alur Cerita
                            </h2>
                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                                {synopsisText}
                            </p>
                        </div>

                        {/* Credits & Metadata Info (1 column) */}
                        <div className="space-y-4 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
                            <h2 className="text-lg font-bold text-white">Informasi Produksi</h2>

                            {directorName && (
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Sutradara / Kreator:</span>
                                    <p className="text-sm font-bold text-slate-200 mt-0.5">{directorName}</p>
                                </div>
                            )}

                            {castList.length > 0 && (
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Pemeran Utama:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {castList.map((actor) => (
                                            <span
                                                key={actor}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
                                            >
                                                {actor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <span className="text-xs text-slate-400 uppercase tracking-wider block">TMDB ID:</span>
                                <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                                    {targetTmdbId || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TV SERIES SEASONS & EPISODES SECTION */}
                    {media.type === 'series' && (
                        <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Tv className="w-5 h-5 text-red-500" />
                                    Daftar Episode
                                </h2>

                                {/* Seasons pill selector */}
                                {seasonsList.length > 0 && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                        {seasonsList.map((s) => (
                                            <button
                                                key={s.seasonNumber}
                                                onClick={() => setSelectedSeasonNumber(s.seasonNumber)}
                                                className={`px-3.5 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                                                    selectedSeasonNumber === s.seasonNumber
                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                }`}
                                            >
                                                {s.name || `Musim ${s.seasonNumber}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Episode Grid */}
                            {isLoadingEpisodes ? (
                                <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-xs">
                                    <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                                    <span>Memuat episode dari TMDB...</span>
                                </div>
                            ) : episodesList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {episodesList.map((ep) => (
                                        <Link
                                            key={ep.id}
                                            href={`/watch/${media.id}?season=${selectedSeasonNumber}&episode=${ep.episodeNumber}`}
                                            className="group p-3 rounded-2xl bg-slate-950/60 hover:bg-white/10 border border-white/5 hover:border-red-500/40 transition flex gap-3.5 items-start cursor-pointer"
                                        >
                                            <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                                                <img
                                                    src={ep.thumbnail}
                                                    alt={ep.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                                                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-0.5">
                                                    <span className="font-mono text-red-400 font-bold">Eps {ep.episodeNumber}</span>
                                                    <span>{ep.duration}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                                                    {ep.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                                    {ep.synopsis}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 py-4">Tidak ada episode yang terdaftar untuk musim ini.</p>
                            )}
                        </div>
                    )}
                </div>

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
                                    ✕
                                </button>
                            </div>

                            {/* Base URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                                    Base URL / Endpoint Target:
                                </label>
                                <input
                                    type="text"
                                    value={apiBaseUrl}
                                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                                    placeholder="http://localhost:8000/api/stream"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition"
                                />
                            </div>

                            {/* Query Parameters */}
                            <div className="space-y-2">
                                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <code className="text-xs font-mono font-bold text-red-400">tmdb_id *</code>
                                        <p className="text-[11px] text-slate-400">ID TMDb media</p>
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

                                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <code className="text-xs font-mono font-bold text-amber-400">m3u8_url *</code>
                                        <p className="text-[11px] text-slate-400">URL halaman player / manifest target</p>
                                        <p className="text-xs font-mono text-white font-semibold break-all mt-1 bg-black/40 px-2 py-1 rounded-lg max-h-16 overflow-y-auto">
                                            {targetM3u8Url}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(targetM3u8Url, 'm3u8_url')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0"
                                    >
                                        {copiedField === 'm3u8_url' ? 'Disalin' : 'Salin'}
                                    </button>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <code className="text-xs font-mono font-bold text-emerald-400">title *</code>
                                        <p className="text-[11px] text-slate-400">Judul media / video</p>
                                        <p className="text-xs font-mono text-white font-semibold truncate mt-1 bg-black/40 px-2 py-1 rounded-lg">
                                            {targetTitle}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(targetTitle, 'title')}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0"
                                    >
                                        {copiedField === 'title' ? 'Disalin' : 'Salin'}
                                    </button>
                                </div>
                            </div>

                            {/* Full URL */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-slate-400" />
                                    Preview Full URL (dengan Query Params):
                                </label>
                                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-amber-300 break-all max-h-20 overflow-y-auto select-all">
                                    {getTargetFullUrl()}
                                </div>
                            </div>

                            {/* Actions */}
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
