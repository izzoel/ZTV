import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Play,
    Plus,
    Check,
    Star,
    Film,
    Clock,
    RefreshCw,
    Layers,
    ArrowLeft,
    Share2,
    Globe,
    Sparkles,
    Tv,
    Server,
    AlertCircle,
    Copy,
    ExternalLink,
    Send,
    Code,
} from 'lucide-react';
import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';
import {
    fetchMediaById,
    fetchTmdbCredits,
    fetchTmdbEpisodes,
    fetchTmdbTvSeasons,
    translateText,
    isEngText,
} from '@/lib/tmdbService';
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
    const [zetwareDirectUrl, setZetwareDirectUrl] = useState<string | null>(
        null,
    );
    const [myList, setMyList] = useState<string[]>([]);
    const [castList, setCastList] = useState<string[]>([]);
    const [directorName, setDirectorName] = useState<string>('');
    const [episodesList, setEpisodesList] = useState<Episode[]>([]);
    const [seasonsList, setSeasonsList] = useState<
        { seasonNumber: number; name: string; episodeCount: number }[]
    >([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
    const [isCopiedShare, setIsCopiedShare] = useState<boolean>(false);

    // Synopsis translation state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>(
        language === 'en' ? 'en' : 'id',
    );
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{
        id?: string;
        en?: string;
    }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] =
        useState<boolean>(false);

    // Sync synopsis language with navbar language if changed
    useEffect(() => {
        setSynopsisLang(language === 'en' ? 'en' : 'id');
    }, [language]);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!media) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn =
                    media.synopsisEn ||
                    (isEngText(media.synopsis) ? media.synopsis : '');
                if (media.synopsis && !isEngText(media.synopsis)) {
                    return;
                }
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res) {
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                id: res,
                            }));
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
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                en: res,
                            }));
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
                    if (
                        cached &&
                        (cached.id === id || String(cached.tmdbId) === id)
                    ) {
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
                        sessionStorage.setItem(
                            `ztv_media_${id}`,
                            JSON.stringify(fetched),
                        );
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
            fetchTmdbEpisodes(media.tmdbId, selectedSeasonNumber).then(
                (eps) => {
                    setEpisodesList(eps);
                    setIsLoadingEpisodes(false);
                },
            );
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
            const updated = prev.includes(media.id)
                ? prev.filter((i) => i !== media.id)
                : [...prev, media.id];
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
    const targetTmdbId = String(
        media?.tmdbId || (media ? getTmdbIdForMedia(media.id) : ''),
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
                ? `?episode=1&season=${selectedSeasonNumber}`
                : '';
        return `${domain}/watch/${mediaId}${query}`;
    };

    const targetM3u8Url =
        targetM3u8Type === 'zetware' && zetwareDirectUrl
            ? zetwareDirectUrl
            : targetM3u8Type === 'watch'
              ? getTargetWatchUrl()
              : media
                ? getSourceUrl(
                      'vidsrc',
                      media.type,
                      targetTmdbId || 27205,
                      selectedSeasonNumber,
                      1,
                  )
                : '';

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
                headers: { Accept: 'application/json' },
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
                    Tayangan Tidak Ditemukan
                </h1>
                <p className="mb-6 max-w-md text-sm text-slate-400">
                    Konten film atau serial TV dengan ID ini tidak dapat dimuat
                    atau telah dipindahkan.
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
            <Head title={`${media.title} - Detail Tayangan | ZTV Stream`} />

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

                {/* Back to Home Quick Floating Bar */}
                <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-8 sm:pt-28">
                    <button
                        onClick={() => {
                            if (
                                typeof document !== 'undefined' &&
                                document.referrer &&
                                document.referrer.includes(
                                    window.location.host,
                                ) &&
                                !document.referrer.includes('/detail/')
                            ) {
                                window.location.href = document.referrer;
                            } else {
                                router.visit('/');
                            }
                        }}
                        className="group mb-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 shadow-md backdrop-blur-md transition hover:bg-slate-800 hover:text-white active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4 text-red-500 transition-colors group-hover:text-white" />
                        <span>Kembali</span>
                    </button>
                </div>

                {/* CINEMATIC HERO BANNER */}
                <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-8">
                    <div className="relative flex min-h-[460px] items-end overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl sm:min-h-[540px]">
                        {/* Backdrop Image */}
                        <img
                            src={media.backdropUrl}
                            alt={media.title}
                            className="absolute inset-0 h-full w-full object-cover object-top opacity-50 brightness-90 filter"
                        />

                        {/* Radial & Linear Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Content Container */}
                        <div className="relative z-10 flex w-full flex-col items-start gap-6 p-5 sm:gap-8 sm:p-10 md:flex-row md:items-end">
                            {/* Poster Column (Hidden on tiny screens) */}
                            <div className="-mb-2 hidden w-44 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl sm:block md:w-56">
                                <img
                                    src={media.posterUrl}
                                    alt={media.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 space-y-4">
                                {media.isOriginal && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/30 px-3 py-1 text-xs font-bold tracking-wider text-red-400 uppercase">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        ZTV ORIGINAL
                                    </div>
                                )}

                                <h1 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-md sm:text-4xl md:text-5xl">
                                    {media.title}
                                </h1>

                                {/* Meta badges */}
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300 sm:text-sm">
                                    <span className="font-bold text-emerald-400">
                                        {media.matchScore}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-amber-400">
                                        <Star className="h-3.5 w-3.5 fill-amber-400" />{' '}
                                        {media.rating}
                                    </span>
                                    <span>•</span>
                                    <span>{media.year}</span>
                                    <span>•</span>
                                    <span className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-xs">
                                        {media.ageRating}
                                    </span>
                                    <span>•</span>
                                    <span>{media.duration}</span>
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {media.genres.map((g) => (
                                        <span
                                            key={g}
                                            className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
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
                                        className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-red-600/40 transition hover:bg-red-500 hover:shadow-red-600/60 active:scale-95 sm:text-base"
                                    >
                                        <Play className="h-5 w-5 fill-white" />
                                        <span>Putar</span>
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
                                        className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                                        title={
                                            isSaved
                                                ? 'Hapus dari Daftar Saya'
                                                : 'Tambah ke Daftar Saya'
                                        }
                                    >
                                        {isSaved ? (
                                            <>
                                                <Check className="h-5 w-5 text-emerald-400" />
                                                <span className="hidden text-emerald-400 sm:inline">
                                                    Tersimpan
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-5 w-5" />
                                                <span className="hidden sm:inline">
                                                    Daftar Saya
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                                        title="Bagikan Tautan"
                                    >
                                        <Share2 className="h-5 w-5 text-slate-300" />
                                        <span className="hidden sm:inline">
                                            {isCopiedShare
                                                ? 'Tersalin!'
                                                : 'Bagikan'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SYNOPSIS & CREDITS SECTION */}
                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Synopsis & Overview (2 columns) */}
                        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl sm:p-8 lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
                                    <Film className="h-5 w-5 text-red-500" />
                                    <span>
                                        {synopsisLang === 'en'
                                            ? 'Synopsis & Storyline'
                                            : 'Sinopsis & Alur Cerita'}
                                    </span>
                                </h2>

                                {/* Toggle Translate ID / ENG */}
                                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('id')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="Tampilkan sinopsis dalam Bahasa Indonesia"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 font-bold text-white shadow-md shadow-red-600/30'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <span>🇮🇩</span>
                                        <span>ID</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('en')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="Show synopsis in English"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                            synopsisLang === 'en'
                                                ? 'bg-red-600 font-bold text-white shadow-md shadow-red-600/30'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <span>🇬🇧</span>
                                        <span>ENG</span>
                                    </button>
                                </div>
                            </div>

                            {isTranslatingSynopsis ? (
                                <div className="flex animate-pulse items-center gap-2 py-4 text-sm text-slate-400">
                                    <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                                    <span>
                                        {synopsisLang === 'id'
                                            ? 'Menerjemahkan sinopsis ke Bahasa Indonesia...'
                                            : 'Translating synopsis to English...'}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
                        </div>

                        {/* Credits & Metadata Info (1 column) */}
                        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl sm:p-8">
                            <h2 className="text-lg font-bold text-white">
                                Informasi Produksi
                            </h2>

                            {directorName && (
                                <div>
                                    <span className="block text-xs tracking-wider text-slate-400 uppercase">
                                        Sutradara / Kreator:
                                    </span>
                                    <p className="mt-0.5 text-sm font-bold text-slate-200">
                                        {directorName}
                                    </p>
                                </div>
                            )}

                            {castList.length > 0 && (
                                <div>
                                    <span className="mb-1 block text-xs tracking-wider text-slate-400 uppercase">
                                        Pemeran Utama:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {castList.map((actor) => (
                                            <span
                                                key={actor}
                                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200"
                                            >
                                                {actor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TV SERIES SEASONS & EPISODES SECTION */}
                    {media.type === 'series' && (
                        <div className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl sm:p-8">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                    <Tv className="h-5 w-5 text-red-500" />
                                    Daftar Episode
                                </h2>

                                {/* Seasons pill selector */}
                                {seasonsList.length > 0 && (
                                    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
                                        {seasonsList.map((s) => (
                                            <button
                                                key={s.seasonNumber}
                                                onClick={() =>
                                                    setSelectedSeasonNumber(
                                                        s.seasonNumber,
                                                    )
                                                }
                                                className={`shrink-0 cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                                    selectedSeasonNumber ===
                                                    s.seasonNumber
                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                }`}
                                            >
                                                {s.name ||
                                                    `Musim ${s.seasonNumber}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Episode Grid */}
                            {isLoadingEpisodes ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
                                    <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                                    <span>Memuat episode dari TMDB...</span>
                                </div>
                            ) : episodesList.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {episodesList.map((ep) => (
                                        <Link
                                            key={ep.id}
                                            href={`/watch/${media.id}?season=${selectedSeasonNumber}&episode=${ep.episodeNumber}`}
                                            className="group flex cursor-pointer items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-950/60 p-3 transition hover:border-red-500/40 hover:bg-white/10"
                                        >
                                            <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 sm:w-32">
                                                <img
                                                    src={ep.thumbnail}
                                                    alt={ep.title}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition group-hover:bg-black/20">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-110">
                                                        <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="mb-0.5 flex items-center justify-between gap-1 text-[11px] text-slate-400">
                                                    <span className="font-mono font-bold text-red-400">
                                                        Eps {ep.episodeNumber}
                                                    </span>
                                                    <span>{ep.duration}</span>
                                                </div>
                                                <h4 className="truncate text-sm font-bold text-white transition group-hover:text-red-400">
                                                    {ep.title}
                                                </h4>
                                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                                                    {ep.synopsis}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-xs text-slate-400">
                                    Tidak ada episode yang terdaftar untuk musim
                                    ini.
                                </p>
                            )}
                        </div>
                    )}
                </div>

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
                                    ✕
                                </button>
                            </div>

                            {/* Base URL */}
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
                            </div>

                            {/* Query Parameters */}
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
                                                                ? 'bg-red-500 font-bold text-white ring-1 ring-red-400'
                                                                : 'bg-white/10 text-red-300 hover:text-white'
                                                        }`}
                                                    >
                                                        ⚡ Zetware Cloud
                                                    </button>
                                                )}
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

                            {/* Full URL */}
                            <div className="space-y-1.5 pt-1">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                                    <Code className="h-3.5 w-3.5 text-slate-400" />
                                    Preview Full URL (dengan Query Params):
                                </label>
                                <div className="max-h-20 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[11px] break-all text-amber-300 select-all">
                                    {getTargetFullUrl()}
                                </div>
                            </div>

                            {/* Actions */}
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
