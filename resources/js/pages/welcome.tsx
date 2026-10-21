import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Film, Tv, Flame, Bookmark, RefreshCw } from 'lucide-react';
import { MediaItem } from '@/data/movies';
import { fetchLiveTmdbCatalog, fetchMoreTmdbContent } from '@/lib/tmdbService';
import Navbar from '@/components/streaming/Navbar';
import HeroSpotlight from '@/components/streaming/HeroSpotlight';
import CategoryPillFilter from '@/components/streaming/CategoryPillFilter';
import MovieRow from '@/components/streaming/MovieRow';
import Top10Row from '@/components/streaming/Top10Row';
import StreamingFooter from '@/components/streaming/StreamingFooter';
import StreamingSkeleton from '@/components/streaming/StreamingSkeleton';
import DevNoticeBanner from '@/components/streaming/DevNoticeBanner';
import { useLanguage } from '@/lib/i18n';

const parseCategoryParam = (cat: string | null): string => {
    if (!cat) return 'Semua';
    const lower = cat.toLowerCase();
    if (lower === 'film' || lower === 'movie' || lower === 'movies')
        return 'Film';
    if (
        lower === 'series tv' ||
        lower === 'serial tv' ||
        lower === 'series' ||
        lower === 'tv' ||
        lower === 'serial'
    )
        return 'Series TV';
    return cat;
};

export default function Welcome() {
    const { t } = useLanguage();
    const { url } = usePage();

    const [activeCategory, setActiveCategory] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return parseCategoryParam(params.get('category'));
        }
        return 'Semua';
    });
    const [activeGenre, setActiveGenre] = useState('Semua');
    const [myList, setMyList] = useState<string[]>([]);
    const [showMyListOnly, setShowMyListOnly] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return (
                params.get('my_list') === '1' ||
                params.get('my_list') === 'true'
            );
        }
        return false;
    });

    // Infinite Scroll Pagination & Loading State (Khusus Halaman Film & Series TV)
    const [moviePage, setMoviePage] = useState<number>(2);
    const [seriesPage, setSeriesPage] = useState<number>(2);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    // Dynamic TMDB State & Loading
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [featuredMedia, setFeaturedMedia] = useState<MediaItem[]>([]);
    const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
    const [top10Media, setTop10Media] = useState<MediaItem[]>([]);
    const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
    const [actionMedia, setActionMedia] = useState<MediaItem[]>([]);
    const [horrorMedia, setHorrorMedia] = useState<MediaItem[]>([]);
    const [isTmdbLive, setIsTmdbLive] = useState<boolean>(false);

    // Category identification helpers
    const isSeriesCategory =
        activeCategory === 'Series TV' || activeCategory === 'Serial TV';
    const isFilmCategory = activeCategory === 'Film';

    // Sync state with URL when URL changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        const myListParam = params.get('my_list');

        setShowMyListOnly(myListParam === '1' || myListParam === 'true');

        if (catParam) {
            setActiveCategory(parseCategoryParam(catParam));
        } else {
            setActiveCategory('Semua');
        }
        setActiveGenre('Semua');
    }, [url]);

    const handleSelectCategory = (cat: string) => {
        const normalized = parseCategoryParam(cat);
        setActiveCategory(normalized);
        setActiveGenre('Semua');
        setShowMyListOnly(false);

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (normalized === 'Semua') {
                params.delete('category');
            } else {
                params.set('category', normalized);
            }
            params.delete('my_list');
            const qs = params.toString();
            const newUrl = qs ? `/?${qs}` : '/';
            window.history.replaceState({}, '', newUrl);
        }
    };

    const handleToggleMyListOnly = (show: boolean) => {
        setShowMyListOnly(show);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (show) {
                params.set('my_list', '1');
            } else {
                params.delete('my_list');
            }
            const qs = params.toString();
            const newUrl = qs ? `/?${qs}` : '/';
            window.history.replaceState({}, '', newUrl);
        }
    };

    // Page navigation handlers for watching and detail view
    const handlePlayMedia = (
        item: MediaItem,
        episodeNumber: number = 1,
        seasonNumber: number = 1,
    ) => {
        try {
            sessionStorage.setItem(
                `ztv_media_${item.id}`,
                JSON.stringify(item),
            );
        } catch {
            // ignore
        }
        router.visit(
            `/watch/${item.id}?season=${seasonNumber || 1}&episode=${episodeNumber || 1}`,
        );
    };

    const handleOpenDetail = (item: MediaItem) => {
        try {
            sessionStorage.setItem(
                `ztv_media_${item.id}`,
                JSON.stringify(item),
            );
        } catch {
            // ignore
        }
        router.visit(`/detail/${item.id}`);
    };

    // Fetch live TMDB data on mount
    useEffect(() => {
        let isMounted = true;

        async function loadTmdbData() {
            try {
                setIsLoading(true);
                const catalog = await fetchLiveTmdbCatalog();
                if (isMounted && catalog) {
                    setFeaturedMedia(catalog.featured);
                    setAllMedia(catalog.all);
                    setTop10Media(catalog.top10);
                    setTrendingMedia(catalog.trending);
                    setActionMedia(catalog.action);
                    setHorrorMedia(catalog.horror);
                    setIsTmdbLive(catalog.all.length > 0);
                }
            } catch (error) {
                console.error('Failed to load TMDB live catalog:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadTmdbData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Save watchlist to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ztv_my_list');
        if (saved) {
            try {
                setMyList(JSON.parse(saved));
            } catch (e) {
                // fallback
            }
        }
    }, []);

    // Infinite Scroll API Fetch Handler (Aktif HANYA di Kategori Film & Series TV)
    const loadMoreContent = async () => {
        if (isFetchingMore || (!isFilmCategory && !isSeriesCategory)) return;
        setIsFetchingMore(true);

        try {
            const typeToFetch: 'movie' | 'series' = isSeriesCategory
                ? 'series'
                : 'movie';
            const nextPage = typeToFetch === 'movie' ? moviePage : seriesPage;

            const newItems = await fetchMoreTmdbContent(typeToFetch, nextPage);

            if (newItems.length > 0) {
                setAllMedia((prev) => {
                    const existingIds = new Set(
                        prev.map((m) => m.tmdbId || m.id),
                    );
                    const uniqueNew = newItems.filter(
                        (m) => !existingIds.has(m.tmdbId || m.id),
                    );
                    return [...prev, ...uniqueNew];
                });

                if (typeToFetch === 'movie') {
                    setMoviePage((p) => p + 1);
                } else {
                    setSeriesPage((p) => p + 1);
                }
            }
        } catch (err) {
            console.warn('Infinite scroll error:', err);
        } finally {
            setIsFetchingMore(false);
        }
    };

    // Scroll Listener (Dinonaktifkan di Beranda Utama 'Semua', Aktif di 'Film' & 'Series TV')
    useEffect(() => {
        if ((!isFilmCategory && !isSeriesCategory) || showMyListOnly) return;

        const handleScroll = () => {
            if (isLoading || isFetchingMore) return;
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.offsetHeight - 700;

            if (scrollPosition >= threshold) {
                loadMoreContent();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [
        isLoading,
        isFetchingMore,
        activeCategory,
        moviePage,
        seriesPage,
        showMyListOnly,
        isFilmCategory,
        isSeriesCategory,
    ]);

    const handleToggleMyList = (id: string) => {
        setMyList((prev) => {
            const updated = prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id];
            localStorage.setItem('ztv_my_list', JSON.stringify(updated));
            return updated;
        });
    };

    // Filter media according to navbar category & genre pill selection
    const getFilteredMedia = () => {
        let list = allMedia;

        if (showMyListOnly) {
            return list.filter((m) => myList.includes(m.id));
        }

        if (isFilmCategory) {
            list = list.filter((m) => m.type === 'movie');
        } else if (isSeriesCategory) {
            list = list.filter((m) => m.type === 'series');
        }

        if (activeGenre !== 'Semua') {
            list = list.filter((m) =>
                m.genres.some((g) =>
                    g
                        .toLowerCase()
                        .includes(activeGenre.toLowerCase().split(' ')[0]),
                ),
            );
        }

        return list;
    };

    const filteredMedia = getFilteredMedia();

    // Specific list subsets for rows
    const continueWatching = allMedia.filter((m) => m.progress !== undefined);
    const displayAction =
        actionMedia.length > 0
            ? actionMedia
            : allMedia.filter(
                  (m) =>
                      m.genres.includes('Aksi') || m.genres.includes('Sci-Fi'),
              );
    const displayHorror =
        horrorMedia.length > 0
            ? horrorMedia
            : allMedia.filter(
                  (m) =>
                      m.genres.includes('Horor') ||
                      m.genres.includes('Misteri'),
              );

    return (
        <>
            <Head title="ZTV Stream - Platform Streaming Film & Serial TV Premium" />

            <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-red-600 selection:text-white">
                {/* Fixed Navigation Header */}
                <Navbar
                    activeCategory={activeCategory}
                    onSelectCategory={handleSelectCategory}
                    onPlayMedia={handlePlayMedia}
                    onOpenDetail={handleOpenDetail}
                    myListCount={myList.length}
                    showMyListOnly={showMyListOnly}
                    onToggleMyListOnly={handleToggleMyListOnly}
                    catalogMedia={allMedia}
                />

                {/* Content rendering: Loading Skeleton vs Catalog Content */}
                {isLoading ? (
                    <StreamingSkeleton />
                ) : (
                    <>
                        {/* Hero Spotlight (Displayed when on homepage & not My List only) */}
                        {!showMyListOnly &&
                            activeGenre === 'Semua' &&
                            activeCategory === 'Semua' && (
                                <HeroSpotlight
                                    items={featuredMedia}
                                    onPlay={handlePlayMedia}
                                    onOpenDetail={handleOpenDetail}
                                    myList={myList}
                                    onToggleMyList={handleToggleMyList}
                                />
                            )}

                        {/* Category & Genre Filter Pills (Always accessible on page) */}
                        {!showMyListOnly && (
                            <div
                                className={
                                    activeCategory !== 'Semua' ||
                                    activeGenre !== 'Semua'
                                        ? 'pt-28 sm:pt-28'
                                        : ''
                                }
                            >
                                <CategoryPillFilter
                                    activeCategory={activeCategory}
                                    onSelectCategory={handleSelectCategory}
                                    activeGenre={activeGenre}
                                    onSelectGenre={(genre) =>
                                        setActiveGenre(genre)
                                    }
                                />
                            </div>
                        )}

                        {/* Main Content Area */}
                        <main className="space-y-4">
                            {/* View: My List Page */}
                            {showMyListOnly ? (
                                <section className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                                    <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white">
                                                <Bookmark className="h-7 w-7 fill-amber-500 text-amber-500" />
                                                Daftar Saya (
                                                {filteredMedia.length})
                                            </h1>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Film dan series TV yang Anda
                                                simpan untuk ditonton nanti.
                                            </p>
                                        </div>
                                    </div>

                                    {filteredMedia.length === 0 ? (
                                        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/50 p-8 py-20 text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 text-red-500">
                                                <Bookmark className="h-8 w-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">
                                                Daftar Saya Masih Kosong
                                            </h3>
                                            <p className="mx-auto max-w-md text-sm text-slate-400">
                                                Jelajahi ribuan film & series TV
                                                di ZTV dan klik tombol{' '}
                                                <span className="font-semibold text-red-400">
                                                    + Tambah ke Daftar
                                                </span>{' '}
                                                pada judul yang menarik minat
                                                Anda.
                                            </p>
                                            <button
                                                onClick={() =>
                                                    handleToggleMyListOnly(
                                                        false,
                                                    )
                                                }
                                                className="cursor-pointer rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-500"
                                            >
                                                Mulai Jelajahi Tayangan
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                                            {filteredMedia.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() =>
                                                        handleOpenDetail(item)
                                                    }
                                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl transition duration-300 hover:scale-105"
                                                >
                                                    <div className="aspect-[2/3] w-full overflow-hidden">
                                                        <img
                                                            src={item.posterUrl}
                                                            alt={item.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="truncate text-xs font-bold text-white">
                                                            {item.title}
                                                        </h4>
                                                        <span className="text-[10px] font-semibold text-amber-400">
                                                            ★ {item.rating} •{' '}
                                                            {item.year}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ) : activeGenre !== 'Semua' ||
                              activeCategory !== 'Semua' ? (
                                /* Filtered Grid View for Film, Series TV, or Genres */
                                <section className="mx-auto max-w-7xl px-4 pt-2 pb-16 sm:px-6 lg:px-8">
                                    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h1 className="flex items-center gap-3 text-2xl font-extrabold text-white sm:text-3xl">
                                                {isSeriesCategory ? (
                                                    <Tv className="h-7 w-7 text-cyan-400" />
                                                ) : isFilmCategory ? (
                                                    <Film className="h-7 w-7 text-red-500" />
                                                ) : (
                                                    <Flame className="h-7 w-7 text-amber-500" />
                                                )}
                                                <span>
                                                    {isFilmCategory
                                                        ? 'Katalog Film'
                                                        : isSeriesCategory
                                                          ? 'Katalog Series TV'
                                                          : activeCategory}
                                                    {activeGenre !== 'Semua'
                                                        ? ` • ${activeGenre}`
                                                        : ''}
                                                </span>
                                            </h1>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Menampilkan{' '}
                                                {filteredMedia.length} tayangan{' '}
                                                {isFilmCategory
                                                    ? 'film'
                                                    : isSeriesCategory
                                                      ? 'series TV'
                                                      : ''}
                                            </p>
                                        </div>
                                        {activeCategory !== 'Semua' && (
                                            <button
                                                onClick={() =>
                                                    handleSelectCategory(
                                                        'Semua',
                                                    )
                                                }
                                                className="cursor-pointer self-start rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20 hover:text-white sm:self-auto"
                                            >
                                                Tampilkan Semua Konten
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                                        {filteredMedia.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    handleOpenDetail(item)
                                                }
                                                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl transition duration-300 hover:scale-105"
                                            >
                                                <div className="aspect-[2/3] w-full overflow-hidden">
                                                    <img
                                                        src={item.posterUrl}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="truncate text-xs font-bold text-white">
                                                        {item.title}
                                                    </h4>
                                                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                                        <span className="font-semibold text-amber-400">
                                                            ★ {item.rating}
                                                        </span>
                                                        <span>{item.year}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : (
                                /* Default Homepage Rows */
                                <>
                                    {/* Continue Watching Row */}
                                    {continueWatching.length > 0 && (
                                        <MovieRow
                                            title={t('row_continue')}
                                            items={continueWatching}
                                            onPlay={handlePlayMedia}
                                            onOpenDetail={handleOpenDetail}
                                            myList={myList}
                                            onToggleMyList={handleToggleMyList}
                                            showProgress={true}
                                            badge="RESUME"
                                        />
                                    )}

                                    {/* Top 10 Row */}
                                    <Top10Row
                                        items={top10Media}
                                        onPlay={handlePlayMedia}
                                        onOpenDetail={handleOpenDetail}
                                        myList={myList}
                                        onToggleMyList={handleToggleMyList}
                                    />

                                    {/* Trending Now Row */}
                                    <MovieRow
                                        title={t('row_trending')}
                                        items={trendingMedia}
                                        onPlay={handlePlayMedia}
                                        onOpenDetail={handleOpenDetail}
                                        myList={myList}
                                        onToggleMyList={handleToggleMyList}
                                    />

                                    {/* Action & Sci-Fi Row */}
                                    <MovieRow
                                        title={t('row_action')}
                                        items={displayAction}
                                        onPlay={handlePlayMedia}
                                        onOpenDetail={handleOpenDetail}
                                        myList={myList}
                                        onToggleMyList={handleToggleMyList}
                                    />

                                    {/* Horror & Mystery Row */}
                                    <MovieRow
                                        title={t('row_horror')}
                                        items={displayHorror}
                                        onPlay={handlePlayMedia}
                                        onOpenDetail={handleOpenDetail}
                                        myList={myList}
                                        onToggleMyList={handleToggleMyList}
                                    />
                                </>
                            )}
                            {/* Infinite Scroll Dynamic Loading Indicator (hanya di kategori Film & Series TV) */}
                            {isFetchingMore &&
                                (isFilmCategory || isSeriesCategory) && (
                                    <div className="flex items-center justify-center gap-3 py-10 text-xs font-semibold text-slate-400 sm:text-sm">
                                        <RefreshCw className="h-5 w-5 animate-spin text-red-500" />
                                        <span>
                                            Memuat lebih banyak{' '}
                                            {isFilmCategory
                                                ? 'Film'
                                                : 'Series TV'}{' '}
                                            dari TMDB...
                                        </span>
                                    </div>
                                )}
                        </main>
                    </>
                )}

                {/* Footer */}
                <StreamingFooter />

                {/* Development Notice Toast Banner */}
                <DevNoticeBanner />
            </div>
        </>
    );
}
