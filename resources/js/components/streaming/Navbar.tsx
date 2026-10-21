import { useState, useEffect } from 'react';
import {
    Search,
    Bell,
    Bookmark,
    User,
    Film,
    Tv,
    Sparkles,
    LogOut,
    Settings,
    ChevronDown,
    X,
    CheckCheck,
    Trash2,
    Clock,
    Globe,
} from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { MediaItem, ALL_MEDIA } from '@/data/movies';
import { useLanguage, Language } from '@/lib/i18n';

interface NavbarProps {
    activeCategory: string;
    onSelectCategory: (category: string) => void;
    onPlayMedia: (media: MediaItem) => void;
    onOpenDetail: (media: MediaItem) => void;
    myListCount: number;
    showMyListOnly: boolean;
    onToggleMyListOnly: (show: boolean) => void;
    catalogMedia?: MediaItem[];
    showCategories?: boolean;
}

export interface NotificationItem {
    id: string;
    badge: string;
    badgeColor: string;
    title: string;
    message: string;
    time: string;
    media?: MediaItem;
    isRead: boolean;
}

export default function Navbar({
    activeCategory,
    onSelectCategory,
    onPlayMedia,
    onOpenDetail,
    myListCount,
    showMyListOnly,
    onToggleMyListOnly,
    catalogMedia = [],
    showCategories = true,
}: NavbarProps) {
    const { language, setLanguage, t } = useLanguage();
    const { auth } = usePage().props as any;
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // Generate real notifications based on live catalog media
    useEffect(() => {
        const list: NotificationItem[] = [];
        const pool =
            catalogMedia && catalogMedia.length > 0 ? catalogMedia : ALL_MEDIA;

        // ⚡ Notifikasi Film Terbaru Tersedia di Zetware Cloud (berdasarkan waktu upload terakhir di cloud)
        const hopeCloudItem: MediaItem = (catalogMedia &&
            catalogMedia.find(
                (m) =>
                    m.tmdbId === 1058424 ||
                    m.title.toUpperCase().includes('HOPE'),
            )) || {
            id: 'tmdb-mov-1058424',
            tmdbId: 1058424,
            title: 'HOPE',
            type: 'movie',
            rating: '8.8',
            matchScore: '98% Cocok',
            year: 2026,
            ageRating: '16+',
            duration: '2j 10m',
            quality: '4K Ultra HD',
            genres: ['Horor & Misteri', 'Aksi & Sci-Fi'],
            synopsis:
                'Sebuah penemuan misterius terjadi di pinggiran kota pelabuhan kecil. Para penduduk mendapati diri mereka dalam kondisi perjuangan putus asa untuk bertahan hidup melawan sesuatu yang belum pernah mereka temui sebelumnya.',
            synopsisEn:
                'A mysterious discovery takes place on the outskirts of a small port town. Residents find themselves in a desperate fight for survival against something never before encountered.',
            cast: [
                'Hwang Jung-min',
                'Zo In-sung',
                'Jung Ho-yeon',
                'Michael Fassbender',
                'Alicia Vikander',
            ],
            director: 'Na Hong-jin',
            posterUrl:
                'https://image.tmdb.org/t/p/w500/ptqlN6mDIAqJjVA86J5eOoG82zc.jpg',
            backdropUrl:
                'https://image.tmdb.org/t/p/w1280/qqHFLg90IUSoTmSMpKOOW5RyqN3.jpg',
            videoUrl:
                'https://zetware.id/storage/movies/HOPE/HOPE_1920x800.mp4',
            isOriginal: true,
            isTrending: true,
            top10Rank: 1,
        };

        list.push({
            id: 'notif-zetware-cloud-latest',
            badge: '⚡ ZETWARE CLOUD',
            badgeColor:
                'bg-emerald-500/30 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30',
            title: 'Tersedia di Zetware Cloud: HOPE (2026)',
            message:
                'Film blockbuster sci-fi/thriller "HOPE" karya Na Hong-jin kini resmi tersedia di Zetware Cloud! Nikmati streaming super cepat tanpa iklan.',
            time: 'Baru Saja',
            media: hopeCloudItem,
            isRead: false,
        });

        if (pool.length > 0) {
            const item0 = pool[0];
            list.push({
                id: 'notif-1',
                badge: 'RILIS TERBARU',
                badgeColor: 'bg-red-600/30 text-red-400 border-red-500/30',
                title: item0.title,
                message: `Tayangan terbaru kini tersedia. Tonton aksi seru ${item0.title} sekarang!`,
                time: '10m lalu',
                media: item0,
                isRead: false,
            });
        }

        if (pool.length > 1) {
            const item1 = pool[1];
            list.push({
                id: 'notif-2',
                badge: 'POPULER #1',
                badgeColor:
                    'bg-amber-600/30 text-amber-400 border-amber-500/30',
                title: `Trending: ${item1.title}`,
                message: `Menduduki peringkat #1 di Indonesia dengan skor kecocokan ${item1.matchScore}!`,
                time: '1j lalu',
                media: item1,
                isRead: false,
            });
        }

        const seriesItem = pool.find((m) => m.type === 'series') || pool[2];
        if (seriesItem) {
            list.push({
                id: 'notif-3',
                badge: 'EPISODE BARU',
                badgeColor: 'bg-cyan-600/30 text-cyan-400 border-cyan-500/30',
                title: `Series: ${seriesItem.title}`,
                message: `Episode baru dari serial eksklusif ZTV Stream sudah tayang.`,
                time: '3j lalu',
                media: seriesItem,
                isRead: false,
            });
        }

        if (myListCount > 0) {
            list.push({
                id: 'notif-4',
                badge: 'DAFTAR SAYA',
                badgeColor:
                    'bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
                title: 'Pengingat Tontonan',
                message: `Kamu memiliki ${myListCount} judul film tersimpan di Daftar Saya. Siap ditonton kapan saja!`,
                time: 'Hari Ini',
                isRead: false,
            });
        }

        setNotifications(list);
    }, [catalogMedia, myListCount]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const handleNotificationClick = (notif: NotificationItem) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );

        if (notif.media) {
            onOpenDetail(notif.media);
        } else if (notif.id === 'notif-4') {
            onToggleMyListOnly(true);
        }

        setShowNotifications(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        let isCancelled = false;
        if (searchQuery.trim().length > 1) {
            const query = searchQuery.toLowerCase();
            const localFiltered = ALL_MEDIA.filter(
                (m) =>
                    m.title.toLowerCase().includes(query) ||
                    m.genres.some((g) => g.toLowerCase().includes(query)) ||
                    m.cast.some((c) => c.toLowerCase().includes(query)),
            );

            import('@/lib/tmdbService').then(({ searchTmdbContent }) => {
                searchTmdbContent(searchQuery).then((remoteResults) => {
                    if (!isCancelled) {
                        const combined = [...remoteResults, ...localFiltered];
                        const uniqueMap = new Map();
                        combined.forEach((item) =>
                            uniqueMap.set(item.id, item),
                        );
                        setSearchResults(Array.from(uniqueMap.values()));
                    }
                });
            });
        } else {
            setSearchResults([]);
        }

        return () => {
            isCancelled = true;
        };
    }, [searchQuery]);

    return (
        <header
            className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
                isScrolled
                    ? 'border-b border-white/10 bg-slate-950/95 py-1.5 shadow-2xl backdrop-blur-xl sm:py-3'
                    : 'bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent py-2 sm:py-5'
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
                {/* Left side: Brand Logo & Desktop Navigation */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-6 lg:gap-8">
                    <button
                        onClick={() => {
                            onSelectCategory('Semua');
                        }}
                        className="group flex shrink-0 cursor-pointer items-center gap-2 text-left"
                    >
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-md shadow-red-600/30 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10">
                            <span className="text-base font-black tracking-wider text-white sm:text-xl">
                                Z
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-base leading-none font-extrabold tracking-tighter text-white drop-shadow-sm sm:text-2xl">
                                ZTV{' '}
                                <span className="rounded border border-red-500/50 bg-red-600/30 px-1 py-0.5 text-[9px] leading-none font-semibold text-red-400 sm:px-1.5 sm:text-xs">
                                    STREAM
                                </span>
                            </span>
                            <span className="mt-0.5 hidden text-[10px] font-medium tracking-widest text-slate-400 uppercase sm:block">
                                Premium Cinema
                            </span>
                        </div>
                    </button>

                    {/* Primary Links - Visible on tablet and desktop */}
                    {showCategories && (
                        <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto py-0.5 sm:flex sm:gap-1.5 lg:gap-2">
                            <button
                                onClick={() => {
                                    onSelectCategory('Semua');
                                }}
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all sm:px-3 sm:py-1.5 sm:text-sm ${
                                    activeCategory === 'Semua' &&
                                    !showMyListOnly
                                        ? 'bg-white font-semibold text-slate-950 shadow-md'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {t('nav_home')}
                            </button>
                            <button
                                onClick={() => {
                                    onSelectCategory('Film');
                                }}
                                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm ${
                                    (activeCategory === 'Film' ||
                                        activeCategory === 'Movies') &&
                                    !showMyListOnly
                                        ? 'bg-red-600 font-semibold text-white shadow-md shadow-red-600/30'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Film className="h-3.5 w-3.5" />
                                <span>{t('nav_movies')}</span>
                            </button>
                            <button
                                onClick={() => {
                                    onSelectCategory('Series TV');
                                }}
                                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm ${
                                    (activeCategory === 'Series TV' ||
                                        activeCategory === 'Serial TV' ||
                                        activeCategory === 'TV Series') &&
                                    !showMyListOnly
                                        ? 'bg-red-600 font-semibold text-white shadow-md shadow-red-600/30'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Tv className="h-3.5 w-3.5" />
                                <span>{t('nav_series')}</span>
                            </button>
                            <button
                                onClick={() => onToggleMyListOnly(true)}
                                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm ${
                                    showMyListOnly
                                        ? 'bg-amber-500 font-semibold text-slate-950 shadow-md'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Bookmark className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    {t('nav_my_list')}
                                </span>
                                {myListCount > 0 && (
                                    <span className="py-0.2 ml-0.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white sm:ml-1">
                                        {myListCount}
                                    </span>
                                )}
                            </button>
                        </nav>
                    )}
                </div>

                {/* Right side: Search, Notifications, Language, Profile */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                    {/* Language Switcher Pill */}
                    <button
                        onClick={() =>
                            setLanguage(language === 'id' ? 'en' : 'id')
                        }
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 shadow-sm transition-all hover:bg-white/10 hover:text-white active:scale-95 sm:px-2.5 sm:py-1.5"
                        title={
                            language === 'id'
                                ? 'Switch to English'
                                : 'Ganti ke Bahasa Indonesia'
                        }
                    >
                        <Globe className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-[10px] font-bold tracking-wider uppercase sm:text-[11px]">
                            {language === 'id' ? 'ID' : 'EN'}
                        </span>
                    </button>

                    {/* Search Bar */}
                    <div className="relative">
                        {isSearchOpen ? (
                            <div className="flex w-40 items-center rounded-full border border-white/20 bg-slate-900/95 px-2.5 py-1 shadow-xl transition-all sm:w-64 sm:px-3 sm:py-1.5 md:w-80">
                                <Search className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4" />
                                <input
                                    type="text"
                                    placeholder={t('nav_search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    autoFocus
                                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none sm:text-sm"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-white"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:p-2"
                                title="Cari Film"
                            >
                                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        )}

                        {/* Search Autocomplete Results Overlay */}
                        {isSearchOpen && searchResults.length > 0 && (
                            <div className="fixed top-24 right-3 left-3 z-50 max-h-[75vh] w-auto animate-in divide-y divide-white/5 overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl duration-200 fade-in sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:w-96">
                                <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                    Hasil Pencarian ({searchResults.length})
                                </div>
                                {searchResults.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            onOpenDetail(item);
                                            setIsSearchOpen(false);
                                        }}
                                        className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
                                    >
                                        <img
                                            src={item.posterUrl}
                                            alt={item.title}
                                            className="h-16 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-semibold text-white">
                                                {item.title}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                                <span className="font-medium text-amber-400">
                                                    ★ {item.rating}
                                                </span>
                                                <span>•</span>
                                                <span>{item.year}</span>
                                                <span>•</span>
                                                <span className="text-slate-300">
                                                    {item.genres[0]}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlayMedia(item);
                                                setIsSearchOpen(false);
                                            }}
                                            className="shrink-0 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-500"
                                        >
                                            <Film className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                            }}
                            className="relative cursor-pointer rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95 sm:p-2"
                            title="Notifikasi & Rilis Baru"
                            aria-label="Notifikasi"
                        >
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 animate-pulse items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white ring-2 ring-slate-950 sm:h-4 sm:w-4 sm:text-[10px]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="fixed top-24 right-3 left-3 z-50 max-h-[80vh] w-auto animate-in overflow-y-auto rounded-2xl border border-t-2 border-white/15 border-t-red-600 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-2xl shadow-black/80 backdrop-blur-2xl duration-200 zoom-in-95 fade-in sm:absolute sm:top-14 sm:right-0 sm:left-auto sm:max-h-[520px] sm:w-[400px] sm:p-5 md:w-[440px]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-red-600/20 p-1.5 text-red-500">
                                            <Bell className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                                            Pemberitahuan & Rilis
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="animate-pulse rounded-full border border-red-500/30 bg-red-600/30 px-2 py-0.5 text-[10px] font-extrabold text-red-400">
                                                {unreadCount} Baru
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                                                title="Tandai semua dibaca"
                                            >
                                                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                                <span className="hidden sm:inline">
                                                    Tandai Dibaca
                                                </span>
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearNotifications}
                                                className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1.5 text-[11px] text-slate-400 transition hover:bg-red-950/30 hover:text-red-400"
                                                title="Bersihkan notifikasi"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Notification Cards List */}
                                <div className="mt-3.5 space-y-2.5">
                                    {notifications.length === 0 ? (
                                        <div className="space-y-2 py-10 text-center text-slate-400">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-500">
                                                <Bell className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs font-semibold text-white">
                                                Tidak ada pemberitahuan baru
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Semua rilis film dan rekomendasi
                                                telah diperbarui.
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notif,
                                                    )
                                                }
                                                className={`group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3 transition-all duration-200 ${
                                                    notif.isRead
                                                        ? 'border-white/5 bg-slate-900/40 text-slate-400 hover:bg-white/5'
                                                        : 'border-white/15 bg-slate-900/90 text-slate-200 shadow-lg shadow-black/40 hover:border-red-500/50 hover:bg-slate-900'
                                                }`}
                                            >
                                                {/* Poster Thumbnail or Icon */}
                                                {notif.media ? (
                                                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-md transition-all duration-300 group-hover:border-red-500/50">
                                                        <img
                                                            src={
                                                                notif.media
                                                                    .posterUrl
                                                            }
                                                            alt={notif.title}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 font-bold text-red-500">
                                                        <Bookmark className="h-5 w-5" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${notif.badgeColor}`}
                                                        >
                                                            {notif.badge}
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-400">
                                                            <Clock className="h-3 w-3 text-slate-500" />
                                                            {notif.time}
                                                        </span>
                                                    </div>

                                                    <p
                                                        className={`line-clamp-1 text-xs font-bold transition-colors group-hover:text-red-400 sm:text-sm ${notif.isRead ? 'text-slate-300' : 'text-white'}`}
                                                    >
                                                        {notif.title}
                                                    </p>
                                                    <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300 sm:text-xs">
                                                        {notif.message}
                                                    </p>
                                                </div>

                                                {/* Unread indicator glowing dot */}
                                                {!notif.isRead && (
                                                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Desktop Footer */}
                                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-center text-[10px] text-slate-500">
                                    <span>ZTV Stream Live Notifications</span>
                                    <span className="font-semibold text-red-400">
                                        Klik untuk Detail
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="relative">
                        {auth?.user ? (
                            <button
                                onClick={() =>
                                    setShowProfileMenu(!showProfileMenu)
                                }
                                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-white/10"
                            >
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${auth.user.name || 'User'}`}
                                    alt="Avatar"
                                    className="h-8 w-8 rounded-full border-2 border-red-500 bg-slate-800"
                                />
                                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:from-red-500 hover:to-rose-500 sm:px-4 sm:py-1.5 sm:text-sm"
                            >
                                <User className="h-3.5 w-3.5" />
                                <span>Masuk</span>
                            </Link>
                        )}

                        {showProfileMenu && auth?.user && (
                            <div className="fixed top-24 right-3 z-50 w-56 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl sm:absolute sm:top-12 sm:right-0">
                                <div className="border-b border-white/10 px-3 py-2">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {auth.user.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                        {auth.user.email}
                                    </p>
                                </div>
                                <div className="space-y-0.5 py-1">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <User className="h-4 w-4 text-slate-400" />
                                        Dashboard Pengguna
                                    </Link>
                                    <Link
                                        href="/settings/profile"
                                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <Settings className="h-4 w-4 text-slate-400" />
                                        Pengaturan Akun
                                    </Link>
                                </div>
                                <div className="border-t border-white/10 pt-1">
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-950/30 hover:text-red-300"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sub-Navigation Bar: Beranda, Film, Series TV, Daftar Saya */}
            {showCategories && (
                <div className="mx-auto max-w-7xl border-t border-white/5 bg-slate-950/40 px-3 pt-1.5 pb-1 backdrop-blur-md sm:hidden">
                    <nav className="no-scrollbar flex items-center justify-between gap-1 overflow-x-auto py-0.5">
                        <button
                            onClick={() => {
                                onSelectCategory('Semua');
                            }}
                            className={`flex-1 rounded-full px-1.5 py-1 text-center text-xs font-medium whitespace-nowrap transition-all ${
                                activeCategory === 'Semua' && !showMyListOnly
                                    ? 'border border-white/20 bg-white/15 font-bold text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t('nav_home')}
                        </button>
                        <button
                            onClick={() => {
                                onSelectCategory('Film');
                            }}
                            className={`flex-1 rounded-full px-1.5 py-1 text-center text-xs font-medium whitespace-nowrap transition-all ${
                                (activeCategory === 'Film' ||
                                    activeCategory === 'Movies') &&
                                !showMyListOnly
                                    ? 'border border-red-500/40 bg-red-600/30 font-bold text-red-400 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t('nav_movies')}
                        </button>
                        <button
                            onClick={() => {
                                onSelectCategory('Series TV');
                            }}
                            className={`flex-1 rounded-full px-1.5 py-1 text-center text-xs font-medium whitespace-nowrap transition-all ${
                                (activeCategory === 'Series TV' ||
                                    activeCategory === 'Serial TV' ||
                                    activeCategory === 'TV Series') &&
                                !showMyListOnly
                                    ? 'border border-red-500/40 bg-red-600/30 font-bold text-red-400 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t('nav_series')}
                        </button>
                        <button
                            onClick={() => onToggleMyListOnly(true)}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-full px-1.5 py-1 text-center text-xs font-medium whitespace-nowrap transition-all ${
                                showMyListOnly
                                    ? 'border border-amber-500/30 bg-amber-500/20 font-bold text-amber-300 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>{t('nav_my_list')}</span>
                            {myListCount > 0 && (
                                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                            )}
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}
