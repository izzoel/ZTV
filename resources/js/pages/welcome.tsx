import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
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

export default function Welcome() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [activeGenre, setActiveGenre] = useState('Semua');
    const [myList, setMyList] = useState<string[]>([]);
    const [showMyListOnly, setShowMyListOnly] = useState(false);

    // Infinite Scroll Pagination & Loading State (Khusus Halaman Film & Serial TV)
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

    // Page navigation handlers for watching and detail view
    const handlePlayMedia = (item: MediaItem, episodeNumber: number = 1, seasonNumber: number = 1) => {
        try {
            sessionStorage.setItem(`ztv_media_${item.id}`, JSON.stringify(item));
        } catch {
            // ignore
        }
        router.visit(`/watch/${item.id}?season=${seasonNumber || 1}&episode=${episodeNumber || 1}`);
    };

    const handleOpenDetail = (item: MediaItem) => {
        try {
            sessionStorage.setItem(`ztv_media_${item.id}`, JSON.stringify(item));
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

    // Infinite Scroll API Fetch Handler (Aktif HANYA di Kategori Film & Serial TV)
    const loadMoreContent = async () => {
        if (isFetchingMore || !['Film', 'Serial TV'].includes(activeCategory)) return;
        setIsFetchingMore(true);

        try {
            const typeToFetch: 'movie' | 'series' = activeCategory === 'Serial TV' ? 'series' : 'movie';
            const nextPage = typeToFetch === 'movie' ? moviePage : seriesPage;

            const newItems = await fetchMoreTmdbContent(typeToFetch, nextPage);

            if (newItems.length > 0) {
                setAllMedia((prev) => {
                    const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
                    const uniqueNew = newItems.filter((m) => !existingIds.has(m.tmdbId || m.id));
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

    // Scroll Listener (Dinonaktifkan di Beranda Utama 'Semua', Aktif di 'Film' & 'Serial TV')
    useEffect(() => {
        if (!['Film', 'Serial TV'].includes(activeCategory) || showMyListOnly) return;

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
    }, [isLoading, isFetchingMore, activeCategory, moviePage, seriesPage, showMyListOnly]);

    const handleToggleMyList = (id: string) => {
        setMyList((prev) => {
            const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
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

        if (activeCategory === 'Film') {
            list = list.filter((m) => m.type === 'movie');
        } else if (activeCategory === 'Serial TV') {
            list = list.filter((m) => m.type === 'series');
        } else if (activeCategory === 'ZTV Originals') {
            list = list.filter((m) => m.isOriginal);
        }

        if (activeGenre !== 'Semua') {
            if (activeGenre === 'ZTV Originals') {
                list = list.filter((m) => m.isOriginal);
            } else {
                list = list.filter((m) =>
                    m.genres.some((g) => g.toLowerCase().includes(activeGenre.toLowerCase().split(' ')[0]))
                );
            }
        }

        return list;
    };

    const filteredMedia = getFilteredMedia();

    // Specific list subsets for rows
    const continueWatching = allMedia.filter((m) => m.progress !== undefined);
    const ztvOriginals = allMedia.filter((m) => m.isOriginal);
    const displayAction = actionMedia.length > 0 ? actionMedia : allMedia.filter((m) => m.genres.includes('Aksi') || m.genres.includes('Sci-Fi'));
    const displayHorror = horrorMedia.length > 0 ? horrorMedia : allMedia.filter((m) => m.genres.includes('Horor') || m.genres.includes('Misteri'));

    return (
        <>
            <Head title="ZTV Stream - Platform Streaming Film & Serial TV Premium" />

            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white antialiased">
                {/* Fixed Navigation Header */}
                <Navbar
                    activeCategory={activeCategory}
                    onSelectCategory={(cat) => {
                        setActiveCategory(cat);
                        setActiveGenre('Semua');
                    }}
                    onPlayMedia={handlePlayMedia}
                    onOpenDetail={handleOpenDetail}
                    myListCount={myList.length}
                    showMyListOnly={showMyListOnly}
                    onToggleMyListOnly={setShowMyListOnly}
                    catalogMedia={allMedia}
                />



                {/* Content rendering: Loading Skeleton vs Catalog Content */}
                {isLoading ? (
                    <StreamingSkeleton />
                ) : (
                    <>
                        {/* Hero Spotlight (Displayed when on homepage & not My List only) */}
                        {!showMyListOnly && activeGenre === 'Semua' && activeCategory === 'Semua' && (
                            <HeroSpotlight
                                items={featuredMedia}
                                onPlay={handlePlayMedia}
                                onOpenDetail={handleOpenDetail}
                                myList={myList}
                                onToggleMyList={handleToggleMyList}
                            />
                        )}

                        {/* Genre Filter Pills */}
                        {!showMyListOnly && (
                            <CategoryPillFilter
                                activeGenre={activeGenre}
                                onSelectGenre={(genre) => setActiveGenre(genre)}
                            />
                        )}

                        {/* Main Content Area */}
                        <main className="space-y-4">
                            {/* View: My List Page */}
                            {showMyListOnly ? (
                                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                        <div>
                                            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                                                <Bookmark className="w-7 h-7 text-amber-500 fill-amber-500" />
                                                Daftar Saya ({filteredMedia.length})
                                            </h1>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Film dan serial TV yang Anda simpan untuk ditonton nanti.
                                            </p>
                                        </div>
                                    </div>

                                    {filteredMedia.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/10 p-8 space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 mx-auto flex items-center justify-center">
                                                <Bookmark className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Daftar Saya Masih Kosong</h3>
                                            <p className="text-sm text-slate-400 max-w-md mx-auto">
                                                Jelajahi ribuan film & serial di ZTV dan klik tombol <span className="text-red-400 font-semibold">+ Tambah ke Daftar</span> pada judul yang menarik minat Anda.
                                            </p>
                                            <button
                                                onClick={() => setShowMyListOnly(false)}
                                                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg transition"
                                            >
                                                Mulai Jelajahi Film
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                            {filteredMedia.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleOpenDetail(item)}
                                                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl hover:scale-105 transition duration-300 cursor-pointer"
                                                >
                                                    <div className="aspect-[2/3] w-full overflow-hidden">
                                                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                                        <span className="text-[10px] text-amber-400 font-semibold">★ {item.rating} • {item.year}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ) : activeGenre !== 'Semua' || activeCategory !== 'Semua' ? (
                                /* Filtered Grid View */
                                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                                    <div className="mb-6">
                                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Film className="w-6 h-6 text-red-500" />
                                            {activeCategory !== 'Semua' ? activeCategory : ''} {activeGenre !== 'Semua' ? `- ${activeGenre}` : ''}
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                        {filteredMedia.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleOpenDetail(item)}
                                                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl hover:scale-105 transition duration-300 cursor-pointer"
                                            >
                                                <div className="aspect-[2/3] w-full overflow-hidden">
                                                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                                        <span className="text-amber-400 font-semibold">★ {item.rating}</span>
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
                            {/* Infinite Scroll Dynamic Loading Indicator (hanya di kategori Film & Serial TV) */}
                            {isFetchingMore && ['Film', 'Serial TV'].includes(activeCategory) && (
                                <div className="flex items-center justify-center gap-3 py-10 text-slate-400 text-xs sm:text-sm font-semibold">
                                    <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                                    <span>Memuat lebih banyak {activeCategory === 'Film' ? 'Film' : 'Serial TV'} dari TMDB...</span>
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
