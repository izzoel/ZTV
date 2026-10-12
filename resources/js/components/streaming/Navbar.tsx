import { useState, useEffect } from 'react';
import { Search, Bell, Bookmark, User, Film, Tv, Sparkles, LogOut, Settings, ChevronDown, X, CheckCheck, Trash2, Clock, Globe } from 'lucide-react';
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
    catalogMedia = []
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
        const pool = catalogMedia && catalogMedia.length > 0 ? catalogMedia : ALL_MEDIA;

        if (pool.length > 0) {
            const item0 = pool[0];
            list.push({
                id: 'notif-1',
                badge: 'RILIS 4K',
                badgeColor: 'bg-red-600/30 text-red-400 border-red-500/30',
                title: item0.title,
                message: `Tayangan terbaru kini tersedia dalam kualitas ${item0.quality}. Tonton aksi seru ${item0.title} sekarang!`,
                time: '10m lalu',
                media: item0,
                isRead: false
            });
        }

        if (pool.length > 1) {
            const item1 = pool[1];
            list.push({
                id: 'notif-2',
                badge: 'POPULER #1',
                badgeColor: 'bg-amber-600/30 text-amber-400 border-amber-500/30',
                title: `Trending: ${item1.title}`,
                message: `Menduduki peringkat #1 di Indonesia dengan skor kecocokan ${item1.matchScore}!`,
                time: '1j lalu',
                media: item1,
                isRead: false
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
                isRead: false
            });
        }

        if (myListCount > 0) {
            list.push({
                id: 'notif-4',
                badge: 'DAFTAR SAYA',
                badgeColor: 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
                title: 'Pengingat Tontonan',
                message: `Kamu memiliki ${myListCount} judul film tersimpan di Daftar Saya. Siap ditonton kapan saja!`,
                time: 'Hari Ini',
                isRead: false
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
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
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
                    m.cast.some((c) => c.toLowerCase().includes(query))
            );

            import('@/lib/tmdbService').then(({ searchTmdbContent }) => {
                searchTmdbContent(searchQuery).then((remoteResults) => {
                    if (!isCancelled) {
                        const combined = [...remoteResults, ...localFiltered];
                        const uniqueMap = new Map();
                        combined.forEach((item) => uniqueMap.set(item.id, item));
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
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
                isScrolled
                    ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3'
                    : 'bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent py-5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                {/* Left side: Brand Logo & Navigation */}
                <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 min-w-0">
                    <button
                        onClick={() => {
                            onSelectCategory('Semua');
                            onToggleMyListOnly(false);
                        }}
                        className="flex items-center gap-2 group text-left cursor-pointer shrink-0"
                    >
                        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-300">
                            <span className="font-black text-white text-lg sm:text-xl tracking-wider">Z</span>
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-white drop-shadow-sm flex items-center gap-1">
                                ZTV <span className="text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500/50 text-red-400">STREAM</span>
                            </span>
                            <span className="hidden sm:block text-[10px] text-slate-400 -mt-1 font-medium tracking-widest uppercase">Premium Cinema</span>
                        </div>
                    </button>

                    {/* Primary Links - Always visible across mobile, tablet, and desktop */}
                    <nav className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <button
                            onClick={() => {
                                onSelectCategory('Semua');
                                onToggleMyListOnly(false);
                            }}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 ${
                                activeCategory === 'Semua' && !showMyListOnly
                                    ? 'bg-white text-slate-950 shadow-md font-semibold'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {t('nav_home')}
                        </button>
                        <button
                            onClick={() => {
                                onSelectCategory('Film');
                                onToggleMyListOnly(false);
                            }}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                                (activeCategory === 'Film' || activeCategory === 'Movies') && !showMyListOnly
                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-semibold'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Film className="w-3.5 h-3.5" />
                            <span>{t('nav_movies')}</span>
                        </button>
                        <button
                            onClick={() => {
                                onSelectCategory('Series TV');
                                onToggleMyListOnly(false);
                            }}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                                (activeCategory === 'Series TV' || activeCategory === 'Serial TV' || activeCategory === 'TV Series') && !showMyListOnly
                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-semibold'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Tv className="w-3.5 h-3.5" />
                            <span>{t('nav_series')}</span>
                        </button>
                        <button
                            onClick={() => onToggleMyListOnly(true)}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                                showMyListOnly
                                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('nav_my_list')}</span>
                            {myListCount > 0 && (
                                <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full font-bold">
                                    {myListCount}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Right side: Search, Notifications, Language, Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Language Switcher Pill */}
                    <button
                        onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs text-white transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                        title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
                    >
                        <Globe className="w-3.5 h-3.5 text-red-400" />
                        <span className="font-bold uppercase text-[11px] tracking-wider">{language === 'id' ? 'ID' : 'EN'}</span>
                    </button>
                    {/* Search Bar */}
                    <div className="relative">
                        {isSearchOpen ? (
                            <div className="flex items-center bg-slate-900/90 border border-white/20 rounded-full px-3 py-1.5 w-48 sm:w-64 md:w-80 shadow-xl transition-all">
                                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                                <input
                                    type="text"
                                    placeholder={t('nav_search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="bg-transparent text-sm text-white focus:outline-none w-full placeholder:text-slate-400"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="text-slate-400 hover:text-white ml-1 p-0.5 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
                                title="Cari Film"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}

                        {/* Search Autocomplete Results Overlay */}
                        {isSearchOpen && searchResults.length > 0 && (
                            <div className="fixed sm:absolute top-16 sm:top-12 left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-96 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 max-h-[75vh] overflow-y-auto divide-y divide-white/5 animate-in fade-in duration-200">
                                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Hasil Pencarian ({searchResults.length})
                                </div>
                                {searchResults.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            onOpenDetail(item);
                                            setIsSearchOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl cursor-pointer transition"
                                    >
                                        <img
                                            src={item.posterUrl}
                                            alt={item.title}
                                            className="w-12 h-16 object-cover rounded-lg shrink-0 border border-white/10"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <span className="text-amber-400 font-medium">★ {item.rating}</span>
                                                <span>•</span>
                                                <span>{item.year}</span>
                                                <span>•</span>
                                                <span className="text-slate-300">{item.genres[0]}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlayMedia(item);
                                                setIsSearchOpen(false);
                                            }}
                                            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full shrink-0 transition"
                                        >
                                            <Film className="w-4 h-4" />
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
                            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition relative active:scale-95 cursor-pointer"
                            title="Notifikasi & Rilis Baru"
                            aria-label="Notifikasi"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="fixed sm:absolute top-16 sm:top-14 left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-[400px] md:w-[440px] bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 p-4 sm:p-5 z-50 text-slate-200 text-sm max-h-[80vh] sm:max-h-[520px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 border-t-2 border-t-red-600">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-red-600/20 text-red-500">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">Pemberitahuan & Rilis</span>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 text-[10px] font-extrabold border border-red-500/30 animate-pulse">
                                                {unreadCount} Baru
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1 cursor-pointer font-medium"
                                                title="Tandai semua dibaca"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="hidden sm:inline">Tandai Dibaca</span>
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearNotifications}
                                                className="text-[11px] text-slate-400 hover:text-red-400 p-1.5 rounded-lg bg-white/5 hover:bg-red-950/30 border border-white/10 transition cursor-pointer"
                                                title="Bersihkan notifikasi"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Notification Cards List */}
                                <div className="mt-3.5 space-y-2.5">
                                    {notifications.length === 0 ? (
                                        <div className="py-10 text-center space-y-2 text-slate-400">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                                                <Bell className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-semibold text-white">Tidak ada pemberitahuan baru</p>
                                            <p className="text-[11px] text-slate-500">Semua rilis film dan rekomendasi telah diperbarui.</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer group relative ${
                                                    notif.isRead
                                                        ? 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5'
                                                        : 'bg-slate-900/90 border-white/15 text-slate-200 hover:bg-slate-900 hover:border-red-500/50 shadow-lg shadow-black/40'
                                                }`}
                                            >
                                                {/* Poster Thumbnail or Icon */}
                                                {notif.media ? (
                                                    <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10 group-hover:border-red-500/50 shadow-md transition-all duration-300">
                                                        <img
                                                            src={notif.media.posterUrl}
                                                            alt={notif.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 font-bold border border-red-500/30">
                                                        <Bookmark className="w-5 h-5" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${notif.badgeColor}`}>
                                                            {notif.badge}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                                                            <Clock className="w-3 h-3 text-slate-500" />
                                                            {notif.time}
                                                        </span>
                                                    </div>

                                                    <p className={`text-xs sm:text-sm font-bold group-hover:text-red-400 transition-colors line-clamp-1 ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                </div>

                                                {/* Unread indicator glowing dot */}
                                                {!notif.isRead && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-500/20 shrink-0 mt-1" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Desktop Footer */}
                                <div className="pt-3 mt-3 border-t border-white/10 text-center text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>ZTV Stream Live Notifications</span>
                                    <span className="text-red-400 font-semibold">Klik untuk Detail</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="relative">
                        {auth?.user ? (
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition"
                            >
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${auth.user.name || 'User'}`}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full border-2 border-red-500 bg-slate-800"
                                />
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
                            >
                                <User className="w-4 h-4" />
                                Masuk
                            </Link>
                        )}

                        {showProfileMenu && auth?.user && (
                            <div className="absolute top-12 right-0 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                                <div className="px-3 py-2 border-b border-white/10">
                                    <p className="text-sm font-semibold text-white truncate">{auth.user.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{auth.user.email}</p>
                                </div>
                                <div className="py-1 space-y-0.5">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
                                    >
                                        <User className="w-4 h-4 text-slate-400" />
                                        Dashboard Pengguna
                                    </Link>
                                    <Link
                                        href="/settings/profile"
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        Pengaturan Akun
                                    </Link>
                                </div>
                                <div className="pt-1 border-t border-white/10">
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Keluar
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
