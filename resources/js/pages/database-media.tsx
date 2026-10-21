import { Head, Link } from '@inertiajs/react';
import {
    Database,
    ExternalLink,
    Film,
    Play,
    Search,
    Star,
    TrendingUp,
    Trophy,
    Tv,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Top10MovieTable } from '@/components/streaming/Top10MovieTable';
import { FluxTable } from '@/components/ui/flux-table';
import { ALL_MEDIA, type MediaItem } from '@/data/movies';
import { home } from '@/routes';

export default function DatabaseMediaPage() {
    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<
        'all' | 'movie' | 'series' | 'top10' | 'trending'
    >('all');
    const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating'>('rating');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (column: 'title' | 'year' | 'rating') => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection(column === 'title' ? 'asc' : 'desc');
        }
    };

    const filteredMedia = useMemo(() => {
        return ALL_MEDIA.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.genres || []).some((g) =>
                    g.toLowerCase().includes(searchQuery.toLowerCase()),
                ) ||
                (item.director &&
                    item.director
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (filterCategory === 'movie') return item.type === 'movie';
            if (filterCategory === 'series') return item.type === 'series';
            if (filterCategory === 'top10') return item.top10Rank !== undefined;
            if (filterCategory === 'trending') return item.isTrending === true;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'title') {
                const diff = a.title.localeCompare(b.title);
                return sortDirection === 'asc' ? diff : -diff;
            }
            if (sortBy === 'year') {
                const diff = (a.year || 0) - (b.year || 0);
                return sortDirection === 'asc' ? diff : -diff;
            }
            if (sortBy === 'rating') {
                const numA = parseFloat(a.rating) || 0;
                const numB = parseFloat(b.rating) || 0;
                const diff = numA - numB;
                return sortDirection === 'asc' ? diff : -diff;
            }
            return 0;
        });
    }, [searchQuery, filterCategory, sortBy, sortDirection]);

    const totalMovies = useMemo(
        () => ALL_MEDIA.filter((i) => i.type === 'movie').length,
        [],
    );
    const totalSeries = useMemo(
        () => ALL_MEDIA.filter((i) => i.type === 'series').length,
        [],
    );
    const totalTop10 = useMemo(
        () => ALL_MEDIA.filter((i) => i.top10Rank !== undefined).length,
        [],
    );

    return (
        <>
            <Head title="Database Media - Admin Panel" />

            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* 1. Header Section */}
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                <Database className="size-6 text-indigo-600 dark:text-indigo-400" />
                                <span>Database Media Streaming</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                Katalog Beranda ZTV
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Daftar seluruh film layar lebar, serial TV, dan
                            tayangan unggulan yang muncul pada beranda utama ZTV
                            Stream.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                            <Tv className="size-4" />
                            <span>Buka Beranda Streaming</span>
                            <ExternalLink className="size-3.5 opacity-60" />
                        </Link>
                    </div>
                </div>

                {/* 2. Top 10 Movies Component Section */}
                <Top10MovieTable
                    title="Top 10 Konten Paling Populer di Beranda"
                    description="Peringkat 10 film dan serial teratas yang sedang hits dan paling banyak ditonton hari ini."
                    showBleed={true}
                />

                {/* 3. Stats Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Total Konten Beranda
                        </div>
                        <div className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-white">
                            {ALL_MEDIA.length}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                            Sinkronisasi TMDB & Lokal
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Film Layar Lebar
                        </div>
                        <div className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-white">
                            {totalMovies}
                        </div>
                        <div className="mt-1 text-xs text-indigo-500">
                            Kategori Movies
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Serial TV
                        </div>
                        <div className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-white">
                            {totalSeries}
                        </div>
                        <div className="mt-1 text-xs text-purple-500">
                            Multi-Episode Series
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Ranking Top 10
                        </div>
                        <div className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-white">
                            {totalTop10}
                        </div>
                        <div className="mt-1 text-xs text-amber-500">
                            Sorotan Unggulan
                        </div>
                    </div>
                </div>

                {/* 4. Full Catalog Table (FluxTable bleed) */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Film className="size-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Seluruh Media di Beranda Utama</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Menampilkan {filteredMedia.length} dari{' '}
                                {ALL_MEDIA.length} media terdaftar.
                            </p>
                        </div>

                        {/* Search and Category Filter Toolbar */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari judul, genre, sutradara..."
                                    className="h-8 rounded-lg border border-zinc-300 bg-white pr-3 pl-8 text-xs text-zinc-900 placeholder-zinc-400 shadow-xs focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('all')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterCategory === 'all'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('movie')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterCategory === 'movie'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Film
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('series')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterCategory === 'series'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Serial
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('top10')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterCategory === 'top10'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Top 10
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFilterCategory('trending')
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterCategory === 'trending'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Trending
                                </button>
                            </div>
                        </div>
                    </div>

                    <FluxTable bleed containerClassName="mt-4">
                        <FluxTable.Columns sticky>
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'title'}
                                direction={sortDirection}
                                onSort={() => handleSort('title')}
                            >
                                Media & Judul
                            </FluxTable.Column>
                            <FluxTable.Column>Tipe</FluxTable.Column>
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'year'}
                                direction={sortDirection}
                                onSort={() => handleSort('year')}
                            >
                                Rilis & Durasi
                            </FluxTable.Column>
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'rating'}
                                direction={sortDirection}
                                onSort={() => handleSort('rating')}
                            >
                                Rating
                            </FluxTable.Column>
                            <FluxTable.Column>
                                Status di Beranda
                            </FluxTable.Column>
                            <FluxTable.Column>Genre</FluxTable.Column>
                            <FluxTable.Column align="end">
                                Aksi
                            </FluxTable.Column>
                        </FluxTable.Columns>

                        <FluxTable.Rows>
                            {filteredMedia.map((item) => (
                                <FluxTable.Row key={item.id}>
                                    <FluxTable.Cell variant="strong">
                                        <div className="flex items-center gap-3">
                                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                                {item.posterUrl ? (
                                                    <img
                                                        src={item.posterUrl}
                                                        alt={item.title}
                                                        className="size-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center text-zinc-400">
                                                        <Film className="size-4" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-semibold text-zinc-900 dark:text-white">
                                                    {item.title}
                                                </div>
                                                <div className="max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                                                    {item.director
                                                        ? `Sutradara: ${item.director}`
                                                        : item.synopsis}
                                                </div>
                                            </div>
                                        </div>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 capitalize dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {item.type === 'series'
                                                ? 'Serial TV'
                                                : 'Film Layar Lebar'}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell className="text-xs whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                        <span>{item.year}</span>
                                        {item.duration && (
                                            <span className="text-zinc-400">
                                                {' '}
                                                &bull; {item.duration}
                                            </span>
                                        )}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                            <span>{item.rating || 'N/A'}</span>
                                        </div>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <div className="flex flex-wrap gap-1">
                                            {item.top10Rank !== undefined && (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                    <Trophy className="size-3" />
                                                    Top #{item.top10Rank}
                                                </span>
                                            )}
                                            {item.isTrending && (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400">
                                                    <TrendingUp className="size-3" />
                                                    Trending
                                                </span>
                                            )}
                                            {item.top10Rank === undefined &&
                                                !item.isTrending && (
                                                    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                        Katalog
                                                    </span>
                                                )}
                                        </div>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <div className="flex flex-wrap gap-1">
                                            {(item.genres || [])
                                                .slice(0, 2)
                                                .map((genre, gIdx) => (
                                                    <span
                                                        key={gIdx}
                                                        className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                        </div>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell align="end">
                                        <div className="inline-flex items-center gap-1.5">
                                            <Link
                                                href={`/detail/${item.id}`}
                                                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            >
                                                <span>Detail</span>
                                            </Link>

                                            <Link
                                                href={`/watch/${item.id}`}
                                                className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                                            >
                                                <Play className="size-3" />
                                                <span>Tonton</span>
                                            </Link>
                                        </div>
                                    </FluxTable.Cell>
                                </FluxTable.Row>
                            ))}
                        </FluxTable.Rows>
                    </FluxTable>
                </div>
            </div>
        </>
    );
}

DatabaseMediaPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Database Media',
            href: '/dashboard/database-media',
        },
    ],
};
