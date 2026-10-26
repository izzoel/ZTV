import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Cloud,
    Copy,
    ExternalLink,
    Film,
    HardDrive,
    Play,
    RefreshCw,
    Search,
    Sparkles,
    Tv,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FluxTable } from '@/components/ui/flux-table';
import { fetchFromTmdb } from '@/lib/tmdbService';
import {
    checkZetwareMediaExists,
    type ZetwareStreamOption,
} from '@/lib/zetwareStorage';
import { home } from '@/routes';

interface KnownCloudMedia {
    id: string;
    tmdbId?: number | string;
    title: string;
    type: 'movie' | 'series';
    season?: number;
    episode?: number;
    tag: string;
    desc: string;
    badge: string;
}

const KNOWN_CLOUD_MEDIA: KnownCloudMedia[] = [
    {
        id: 'the-odyssey',
        tmdbId: 1368337,
        title: 'The Odyssey',
        type: 'movie',
        tag: 'Epic / Adventure',
        desc: 'Film bioskop resolusi penuh 4K & Full HD.',
        badge: '4K / 1080p',
    },
    {
        id: 'animals',
        tmdbId: 1236045,
        title: 'Animals',
        type: 'movie',
        tag: 'Drama / Action',
        desc: 'Direct MP4 resolusi 1920 scope.',
        badge: '1080p Scope',
    },
    {
        id: 'hope',
        tmdbId: 1058424,
        title: 'Hope',
        type: 'movie',
        tag: 'Drama / Sci-Fi',
        desc: 'Direct MP4 high bitrate tanpa iklan.',
        badge: '1080p FHD',
    },
    {
        id: 'lanterns',
        tmdbId: 95350,
        title: 'Lanterns',
        type: 'series',
        season: 1,
        episode: 2,
        tag: 'Superhero / Mystery',
        desc: 'Serial TV S1E2 resolusi 1920x960.',
        badge: 'S1E2 1080p',
    },
    {
        id: 'spider-man',
        tmdbId: 969681,
        title: 'Spider-Man Brand New Day',
        type: 'movie',
        tag: 'Action / Sci-Fi',
        desc: 'Koleksi superhero format MP4 langsung.',
        badge: '1080p FHD',
    },
    {
        id: 'insidious',
        tmdbId: 1291595,
        title: 'Insidious Out of the Further',
        type: 'movie',
        tag: 'Horror / Mystery',
        desc: 'Audio surround definisi tinggi.',
        badge: '1080p FHD',
    },
    {
        id: 'matchbox',
        tmdbId: 1148365,
        title: 'Matchbox The Movie',
        type: 'movie',
        tag: 'Animation / Family',
        desc: 'Animasi jernih kualitas tinggi.',
        badge: '1080p FHD',
    },
    {
        id: 'treasure-island',
        tmdbId: 26612,
        title: 'Treasure Island',
        type: 'movie',
        tag: 'Classic / Adventure',
        desc: 'Koleksi petualangan klasik.',
        badge: '1080p FHD',
    },
];

export default function CloudMediaPage() {
    // Media Inspector State
    const [searchTitle, setSearchTitle] = useState('The Odyssey');
    const [searchTmdbId, setSearchTmdbId] = useState('1368337');
    const [searchType, setSearchType] = useState<'movie' | 'series'>('movie');
    const [searchSeason, setSearchSeason] = useState(1);
    const [searchEpisode, setSearchEpisode] = useState(1);
    const [isInspecting, setIsInspecting] = useState(false);
    const [inspectResult, setInspectResult] = useState<{
        hasChecked: boolean;
        exists: boolean;
        url: string | null;
        streams: ZetwareStreamOption[];
    } | null>(null);

    // Active Preview Video
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Table Filter and Sorting State
    const [filterQuery, setFilterQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>(
        'all',
    );
    const [sortBy, setSortBy] = useState<'title' | 'tmdbId' | 'tag' | 'type'>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: 'title' | 'tmdbId' | 'tag' | 'type') => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedCloudMedia = useMemo(() => {
        return KNOWN_CLOUD_MEDIA.filter((item) => {
            const matchesQuery =
                item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
                item.tag.toLowerCase().includes(filterQuery.toLowerCase()) ||
                (item.tmdbId && String(item.tmdbId).includes(filterQuery.trim()));
            const matchesType =
                filterType === 'all' ? true : item.type === filterType;
            return matchesQuery && matchesType;
        }).sort((a, b) => {
            if (sortBy === 'tmdbId') {
                const idA = Number(a.tmdbId) || 0;
                const idB = Number(b.tmdbId) || 0;
                return sortDirection === 'asc' ? idA - idB : idB - idA;
            }
            const valA = (a[sortBy] || '').toString().toLowerCase();
            const valB = (b[sortBy] || '').toString().toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filterQuery, filterType, sortBy, sortDirection]);

    const handleInspectMedia = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        let targetTitle = searchTitle.trim();

        // Jika judul belum diisi tapi TMDB ID ada, coba ambil judul dari TMDB
        if (!targetTitle && searchTmdbId.trim()) {
            setIsInspecting(true);
            try {
                const endpoint =
                    searchType === 'series'
                        ? `/tv/${searchTmdbId.trim()}`
                        : `/movie/${searchTmdbId.trim()}`;
                const data = await fetchFromTmdb(endpoint);
                if (data && (data.title || data.name)) {
                    targetTitle = data.title || data.name;
                    setSearchTitle(targetTitle);
                }
            } catch {
                // Lanjutkan
            }
        }

        if (!targetTitle && !searchTmdbId.trim()) return;

        setIsInspecting(true);
        try {
            const res = await checkZetwareMediaExists({
                title: targetTitle,
                tmdbId: searchTmdbId.trim() || undefined,
                type: searchType,
                season: searchSeason,
                episode: searchEpisode,
            });
            if (res.title && !searchTitle.trim()) {
                setSearchTitle(res.title);
            }
            setInspectResult({
                hasChecked: true,
                exists: res.exists,
                url: res.url,
                streams: res.streams || [],
            });
        } catch {
            setInspectResult({
                hasChecked: true,
                exists: false,
                url: null,
                streams: [],
            });
        } finally {
            setIsInspecting(false);
        }
    };

    const handleCopyUrl = (url: string) => {
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        }
    };

    const handleQuickCheck = (item: KnownCloudMedia) => {
        setSearchTitle(item.title);
        setSearchTmdbId(item.tmdbId ? String(item.tmdbId) : '');
        setSearchType(item.type);
        if (item.season) setSearchSeason(item.season);
        if (item.episode) setSearchEpisode(item.episode);

        setIsInspecting(true);
        void checkZetwareMediaExists({
            title: item.title,
            tmdbId: item.tmdbId,
            type: item.type,
            season: item.season || 1,
            episode: item.episode || 1,
        }).then((res) => {
            setIsInspecting(false);
            setInspectResult({
                hasChecked: true,
                exists: res.exists,
                url: res.url,
                streams: res.streams || [],
            });
        });
    };

    return (
        <>
            <Head title="Zetware Media Cloud - Admin Panel" />

            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* 1. Header Section */}
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                <Cloud className="size-6 text-purple-600 dark:text-purple-400" />
                                <span>Zetware Media Cloud</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                                <Sparkles className="size-3" />
                                Direct MP4 Storage
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Kelola dan pantau seluruh koleksi video direct MP4,
                            verifikasi variasi resolusi (4K/1080p/720p/SD),
                            serta uji stream langsung ke server cloud.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                            <Tv className="size-4" />
                            <span>Buka Platform ZTV</span>
                            <ExternalLink className="size-3.5 opacity-60" />
                        </Link>
                    </div>
                </div>

                {/* 2. Cloud Storage Highlights */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Total Media Cloud
                            </span>
                            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                                <Film className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                {KNOWN_CLOUD_MEDIA.length} Judul
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>Terverifikasi Siap Streaming</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Deteksi Resolusi Cerdas
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Sparkles className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                4K UHD & 1080p
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                                <span>Multi-Resolution Probing Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Metode Akses File
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <HardDrive className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                Local & CDN
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>Fast Local Directory Scanner</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Inspektur / Penguji Resolusi Media Cloud */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Search className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>
                                    Inspektur & Penguji Resolusi Media Cloud
                                </span>
                            </h2>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Uji ketersediaan file video MP4 dan resolusi
                                yang terdeteksi di storage cloud secara
                                real-time.
                            </p>
                        </div>
                        <span className="self-start rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs text-zinc-600 sm:self-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            POST /api/check-zetware-media
                        </span>
                    </div>

                    <form
                        onSubmit={handleInspectMedia}
                        className="mt-5 space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                            {/* Judul Film */}
                            <div
                                className={
                                    searchType === 'series'
                                        ? 'sm:col-span-4'
                                        : 'sm:col-span-5'
                                }
                            >
                                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Judul Film
                                </label>
                                <input
                                    type="text"
                                    value={searchTitle}
                                    onChange={(e) =>
                                        setSearchTitle(e.target.value)
                                    }
                                    placeholder="Contoh: The Odyssey, Animals, Lanterns..."
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white"
                                />
                            </div>

                            {/* Field TMDB ID (disebelah judul film) */}
                            <div
                                className={
                                    searchType === 'series'
                                        ? 'sm:col-span-2'
                                        : 'sm:col-span-3'
                                }
                            >
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        TMDB ID
                                    </label>
                                    <span className="text-[10px] text-zinc-400">
                                        Opsional
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTmdbId}
                                        onChange={(e) =>
                                            setSearchTmdbId(e.target.value)
                                        }
                                        placeholder="e.g. 1368337"
                                        className="w-full rounded-lg border border-zinc-300 bg-white pr-7 pl-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white"
                                    />
                                    {searchTmdbId ? (
                                        <a
                                            href={`https://www.themoviedb.org/${searchType === 'series' ? 'tv' : 'movie'}/${searchTmdbId.trim()}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-purple-600 dark:hover:text-purple-400"
                                            title="Buka detail di TMDB"
                                        >
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            {/* Tipe Konten */}
                            <div
                                className={
                                    searchType === 'series'
                                        ? 'sm:col-span-2'
                                        : 'sm:col-span-2'
                                }
                            >
                                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Tipe Konten
                                </label>
                                <select
                                    value={searchType}
                                    onChange={(e) =>
                                        setSearchType(
                                            e.target.value as
                                                | 'movie'
                                                | 'series',
                                        )
                                    }
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white"
                                >
                                    <option value="movie">Film (Movie)</option>
                                    <option value="series">
                                        Serial TV (Series)
                                    </option>
                                </select>
                            </div>

                            {/* Season & Episode (Series) */}
                            {searchType === 'series' && (
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        S & E
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min={1}
                                            value={searchSeason}
                                            onChange={(e) =>
                                                setSearchSeason(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-1/2 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                            placeholder="S"
                                            title="Season"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            value={searchEpisode}
                                            onChange={(e) =>
                                                setSearchEpisode(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-1/2 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                            placeholder="E"
                                            title="Episode"
                                        />
                                    </div>
                                </div>
                            )}

                            <div
                                className={
                                    searchType === 'series'
                                        ? 'flex items-end sm:col-span-2'
                                        : 'flex items-end sm:col-span-2'
                                }
                            >
                                <button
                                    type="submit"
                                    disabled={
                                        isInspecting ||
                                        (!searchTitle.trim() &&
                                            !searchTmdbId.trim())
                                    }
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                                >
                                    {isInspecting ? (
                                        <>
                                            <RefreshCw className="size-4 animate-spin" />
                                            <span>Memeriksa...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="size-4" />
                                            <span>Periksa Cloud</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Inspect Result Table */}
                    {inspectResult?.hasChecked && (
                        <div className="mt-6 space-y-4 border-t border-zinc-100 pt-5 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Hasil:
                                    </span>
                                    <span className="font-medium text-zinc-900 dark:text-white">
                                        "{searchTitle}"
                                    </span>
                                </div>

                                {inspectResult.exists ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3.5" />
                                        Tersedia ({
                                            inspectResult.streams.length
                                        }{' '}
                                        Opsi Resolusi)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                                        <AlertCircle className="size-3.5" />
                                        Belum Ada di Cloud (Fallback Embed
                                        Aktif)
                                    </span>
                                )}
                            </div>

                            {inspectResult.exists &&
                                inspectResult.streams.length > 0 && (
                                    <FluxTable>
                                        <FluxTable.Columns>
                                            <FluxTable.Column>
                                                Resolusi
                                            </FluxTable.Column>
                                            <FluxTable.Column>
                                                Label Pengguna
                                            </FluxTable.Column>
                                            <FluxTable.Column>
                                                Status HTTP
                                            </FluxTable.Column>
                                            <FluxTable.Column align="end">
                                                Aksi
                                            </FluxTable.Column>
                                        </FluxTable.Columns>
                                        <FluxTable.Rows>
                                            {inspectResult.streams.map(
                                                (stream, idx) => (
                                                    <FluxTable.Row key={idx}>
                                                        <FluxTable.Cell variant="strong">
                                                            <span className="inline-flex items-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                                {stream.badge ||
                                                                    stream.resolution}
                                                            </span>
                                                        </FluxTable.Cell>
                                                        <FluxTable.Cell>
                                                            {stream.user_label ||
                                                                stream.label}
                                                        </FluxTable.Cell>
                                                        <FluxTable.Cell>
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                                                HTTP{' '}
                                                                {stream.http_code ||
                                                                    200}{' '}
                                                                OK
                                                            </span>
                                                        </FluxTable.Cell>
                                                        <FluxTable.Cell align="end">
                                                            <div className="inline-flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPreviewVideoUrl(
                                                                            stream.url,
                                                                        );
                                                                        setPreviewVideoTitle(
                                                                            `${searchTitle} (${stream.user_label || stream.label})`,
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                                                                >
                                                                    <Play className="size-3" />
                                                                    <span>
                                                                        Preview
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleCopyUrl(
                                                                            stream.url,
                                                                        )
                                                                    }
                                                                    className="rounded-md border border-zinc-200 p-1 text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
                                                                    title="Salin URL Stream"
                                                                >
                                                                    {copiedUrl ===
                                                                    stream.url ? (
                                                                        <Check className="size-3.5 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="size-3.5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </FluxTable.Cell>
                                                    </FluxTable.Row>
                                                ),
                                            )}
                                        </FluxTable.Rows>
                                    </FluxTable>
                                )}
                        </div>
                    )}
                </div>

                {/* 4. Koleksi Media Cloud Terverifikasi (FluxTable bleed) */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Cloud className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>Koleksi Media Cloud Terverifikasi</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Seluruh judul media yang telah dikonfigurasi dan
                                diverifikasi pada server cloud.
                            </p>
                        </div>

                        {/* Search and Filter Toolbar */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={filterQuery}
                                    onChange={(e) =>
                                        setFilterQuery(e.target.value)
                                    }
                                    placeholder="Cari judul cloud..."
                                    className="h-8 rounded-lg border border-zinc-300 bg-white pr-3 pl-8 text-xs text-zinc-900 placeholder-zinc-400 shadow-xs focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                                <button
                                    type="button"
                                    onClick={() => setFilterType('all')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterType === 'all'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterType('movie')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterType === 'movie'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Film
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterType('series')}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                        filterType === 'series'
                                            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Serial
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
                                Judul Film
                            </FluxTable.Column>
                            
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'type'}
                                direction={sortDirection}
                                onSort={() => handleSort('type')}
                            >
                                Format
                            </FluxTable.Column>
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'tag'}
                                direction={sortDirection}
                                onSort={() => handleSort('tag')}
                            >
                                Genre / Tag
                            </FluxTable.Column>
                            <FluxTable.Column>
                                Kualitas Resolusi
                            </FluxTable.Column>
                            <FluxTable.Column align="end">
                                Aksi
                            </FluxTable.Column>
                        </FluxTable.Columns>

                        <FluxTable.Rows>
                            {filteredAndSortedCloudMedia.map((item) => (
                                <FluxTable.Row key={item.id}>
                                    <FluxTable.Cell variant="strong">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                {item.type === 'series' ? (
                                                    <Tv className="size-4" />
                                                ) : (
                                                    <Film className="size-4" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-zinc-900 dark:text-white">
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 font-mono text-xs font-medium text-purple-700 transition-colors hover:bg-purple-500/10 hover:text-purple-800 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 dark:hover:text-purple-200">{item.tmdbId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </FluxTable.Cell>

                                    

                                    <FluxTable.Cell>
                                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 capitalize dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {item.type === 'series'
                                                ? 'Serial'
                                                : 'Film'}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {item.tag}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <span className="inline-flex items-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                            {item.badge}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell align="end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleQuickCheck(item)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                        >
                                            <Search className="size-3" />
                                            <span>Uji Resolusi</span>
                                        </button>
                                    </FluxTable.Cell>
                                </FluxTable.Row>
                            ))}
                        </FluxTable.Rows>
                    </FluxTable>
                </div>
            </div>

            {/* Video Preview Modal */}
            {previewVideoUrl && (
                <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-150 fade-in">
                    <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Play className="size-4 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    Preview Video: {previewVideoTitle}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewVideoUrl(null)}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="aspect-video w-full bg-black">
                            <video
                                src={previewVideoUrl}
                                controls
                                autoPlay
                                className="size-full"
                            >
                                Peramban Anda tidak mendukung pemutar video
                                HTML5.
                            </video>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                            <span className="max-w-md truncate font-mono text-[11px]">
                                {previewVideoUrl}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopyUrl(previewVideoUrl)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                                {copiedUrl === previewVideoUrl ? (
                                    <>
                                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>URL Disalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3.5" />
                                        <span>Salin URL Stream</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

CloudMediaPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Zetware Media Cloud',
            href: '/dashboard/cloud-media',
        },
    ],
};
