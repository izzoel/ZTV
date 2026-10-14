import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Play, Plus, Check, Star, Film, Clock, RefreshCw, Layers, 
    ArrowLeft, Share2, Globe, Sparkles, Tv, Server, AlertCircle, Copy, ExternalLink, Send, Code
} from 'lucide-react';
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import { fetchMediaById, fetchTmdbCredits, fetchTmdbEpisodes, fetchTmdbTvSeasons, translateText, isEngText } from '@/lib/tmdbService';
import { getSourceUrl, getTmdbIdForMedia } from '@/lib/streambertApi';
import { checkZetwareMediaExists } from '@/lib/zetwareStorage';
import ZetwareGlowingBadge from '@/components/streaming/ZetwareGlowingBadge';
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
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(null);
    const [myList, setMyList] = useState<string[]>([]);
    const [castList, setCastList] = useState<string[]>([]);
    const [directorName, setDirectorName] = useState<string>('');
    const [episodesList, setEpisodesList] = useState<Episode[]>([]);
    const [seasonsList, setSeasonsList] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
    const [isCopiedShare, setIsCopiedShare] = useState<boolean>(false);

    // Synopsis translation state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>(language === 'en' ? 'en' : 'id');
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{ id?: string; en?: string }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] = useState<boolean>(false);

    // Sync synopsis language with navbar language if changed
    useEffect(() => {
        setSynopsisLang(language === 'en' ? 'en' : 'id');
    }, [language]);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!media) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn = media.synopsisEn || (isEngText(media.synopsis) ? media.synopsis : '');
                if (media.synopsis && !isEngText(media.synopsis)) {
                    return;
                }
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res) {
                            setTranslatedSynopsis((prev) => ({ ...prev, id: res }));
                        }
                    } finally {
                        setIsTranslatingSynopsis(false);
                    }
                }
            }
        } else {
            if (!translatedSynopsis.en) {
                if (media.synopsisEn && isEngText(media.synopsisEn)) {
                    return;
                }
                if (media.synopsis && isEngText(media.synopsis)) {
                    return;
                }
                const currentId = media.synopsis;
                if (currentId) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentId, 'id', 'en');
                        if (res) {
                            setTranslatedSynopsis((prev) => ({ ...prev, en: res }));
                        }
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
                    try {
                        sessionStorage.setItem(`ztv_media_${id}`, JSON.stringify(fetched));
                    } catch {
                        // ignore storage error
                    }
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

    // Check if media exists in Zetware Direct Storage
    useEffect(() => {
        if (!media) return;
        let isMounted = true;

        checkZetwareMediaExists({
            title: media.title,
            type: media.type,
            season: selectedSeasonNumber,
            episode: 1,
        }).then((res) => {
            if (isMounted) {
                if (res.exists && res.url) {
                    setZetwareDirectUrl(res.url);
                } else {
                    setZetwareDirectUrl(null);
                }
            }
        });

        return () => {
            isMounted = false;
        };
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
    
    const getTargetWatchUrl = () => {
        const domain = (typeof window !== 'undefined' && !window.location.origin.includes('localhost'))
            ? window.location.origin
            : 'https://cinema.zetware.id';
        const mediaId = media ? (media.id.startsWith('tmdb-') ? media.id : `tmdb-${media.type === 'series' ? 'tv' : 'mov'}-${targetTmdbId}`) : id;
        const query = media?.type === 'series' ? `?episode=1&season=${selectedSeasonNumber}` : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url = targetM3u8Type === 'zetware' && zetwareDirectUrl
        ? zetwareDirectUrl
        : targetM3u8Type === 'watch'
        ? getTargetWatchUrl()
        : (media ? getSourceUrl('vidsrc', media.type, targetTmdbId || 27205, selectedSeasonNumber, 1) : '');

    const targetTitle = media
        ? media.type === 'series'
            ? `${media.title.toUpperCase()} - S${selectedSeasonNumber}E1`
            : media.title.toUpperCase()
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

    return (
        <>
            <Head title={`${media.title} - Detail Tayangan | ZTV Stream`} />

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

                                    {/* Zetware Storage Available Badge */}
                                    {zetwareDirectUrl && (
                                        <div className="shrink-0">
                                            <ZetwareGlowingBadge variant="compact" />
                                        </div>
                                    )}

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
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                    <Film className="w-5 h-5 text-red-500" />
                                    <span>{synopsisLang === 'en' ? 'Synopsis & Storyline' : 'Sinopsis & Alur Cerita'}</span>
                                </h2>

                                {/* Toggle Translate ID / ENG */}
                                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('id')}
                                        disabled={isTranslatingSynopsis}
                                        title="Tampilkan sinopsis dalam Bahasa Indonesia"
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>🇮🇩</span>
                                        <span>ID</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('en')}
                                        disabled={isTranslatingSynopsis}
                                        title="Show synopsis in English"
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                            synopsisLang === 'en'
                                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>🇬🇧</span>
                                        <span>ENG</span>
                                    </button>
                                </div>
                            </div>

                            {isTranslatingSynopsis ? (
                                <div className="flex items-center gap-2 py-4 text-sm text-slate-400 animate-pulse">
                                    <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                                    <span>{synopsisLang === 'id' ? 'Menerjemahkan sinopsis ke Bahasa Indonesia...' : 'Translating synopsis to English...'}</span>
                                </div>
                            ) : (
                                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
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
                                    placeholder="http://100.81.252.14:8000/extract"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition"
                                />
                            </div>

                            {/* Query Parameters */}
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
                                                <button
                                                    type="button"
                                                    onClick={() => setTargetM3u8Type('stream')}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                                        targetM3u8Type === 'stream' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Stream Embed
                                                </button>
                                                {zetwareDirectUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTargetM3u8Type('zetware')}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                                            targetM3u8Type === 'zetware' ? 'bg-red-500 text-white font-bold ring-1 ring-red-400' : 'bg-white/10 text-red-300 hover:text-white'
                                                        }`}
                                                    >
                                                        ⚡ Zetware Cloud
                                                    </button>
                                                )}
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
