import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Check,
    CheckCircle2,
    Cloud,
    Copy,
    ExternalLink,
    Film,
    Play,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Sparkles,
    Subtitles,
    Tv,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FluxTable } from '@/components/ui/flux-table';
import {
    checkZetwareMediaExists,
    type ZetwareStreamOption,
} from '@/lib/zetwareStorage';
import { dashboard, home } from '@/routes';

interface KnownCloudMedia {
    id: string;
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
        title: 'The Odyssey',
        type: 'movie',
        tag: 'Epic / Adventure',
        desc: 'Film bioskop resolusi penuh 4K & Full HD.',
        badge: '4K / 1080p',
    },
    {
        id: 'animals',
        title: 'Animals',
        type: 'movie',
        tag: 'Drama / Action',
        desc: 'Direct MP4 resolusi 1920 scope.',
        badge: '1080p Scope',
    },
    {
        id: 'hope',
        title: 'Hope',
        type: 'movie',
        tag: 'Drama / Sci-Fi',
        desc: 'Direct MP4 high bitrate tanpa iklan.',
        badge: '1080p FHD',
    },
    {
        id: 'lanterns',
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
        title: 'Spider-Man Brand New Day',
        type: 'movie',
        tag: 'Action / Sci-Fi',
        desc: 'Koleksi superhero format MP4 langsung.',
        badge: '1080p FHD',
    },
    {
        id: 'insidious',
        title: 'Insidious Out of the Further',
        type: 'movie',
        tag: 'Horror / Mystery',
        desc: 'Audio surround definisi tinggi.',
        badge: '1080p FHD',
    },
    {
        id: 'matchbox',
        title: 'Matchbox The Movie',
        type: 'movie',
        tag: 'Animation / Family',
        desc: 'Animasi jernih kualitas tinggi.',
        badge: '1080p FHD',
    },
    {
        id: 'treasure-island',
        title: 'Treasure Island',
        type: 'movie',
        tag: 'Classic / Adventure',
        desc: 'Koleksi petualangan klasik.',
        badge: '1080p FHD',
    },
];

const STREAMING_SERVERS = [
    {
        name: 'Zetware Cloud MP4',
        type: 'Direct Cloud Storage',
        speed: '~15ms',
        status: 'Optimal',
        statusColor: 'green',
        isPrimary: true,
    },
    {
        name: 'Vidsrc.to',
        type: 'Multi-Embed CDN',
        speed: '~120ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: 'Videasy.net',
        type: 'Fast Player Embed',
        speed: '~145ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: 'Vidking',
        type: 'Alternative CDN',
        speed: '~180ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: '2embed.cc',
        type: 'Backup Embed Server',
        speed: '~210ms',
        status: 'Standby',
        statusColor: 'zinc',
        isPrimary: false,
    },
    {
        name: 'Autoembed.co',
        type: 'Automated Provider',
        speed: '~240ms',
        status: 'Standby',
        statusColor: 'zinc',
        isPrimary: false,
    },
];

export default function Dashboard() {
    const page = usePage();
    const authUser = (
        page.props as { auth?: { user?: { name?: string; email?: string } } }
    )?.auth?.user;

    // Interactive Media Inspector State
    const [searchTitle, setSearchTitle] = useState('The Odyssey');
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

    // Table Sorting State
    const [sortBy, setSortBy] = useState<'title' | 'tag' | 'type'>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: 'title' | 'tag' | 'type') => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const sortedCloudMedia = useMemo(() => {
        return [...KNOWN_CLOUD_MEDIA].sort((a, b) => {
            const valA = a[sortBy].toLowerCase();
            const valB = b[sortBy].toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortBy, sortDirection]);

    const handleInspectMedia = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTitle.trim()) return;

        setIsInspecting(true);
        try {
            const res = await checkZetwareMediaExists(
                searchTitle.trim(),
                searchType,
                searchSeason,
                searchEpisode,
            );
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
        setSearchType(item.type);
        if (item.season) setSearchSeason(item.season);
        if (item.episode) setSearchEpisode(item.episode);

        setIsInspecting(true);
        void checkZetwareMediaExists(
            item.title,
            item.type,
            item.season || 1,
            item.episode || 1,
        ).then((res) => {
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
            <Head title="Dashboard - Flux UI Theme" />

            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* 1. Flux Header Section */}
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                Dashboard Admin
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Sistem Optimal
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Selamat datang kembali,{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {authUser?.name || 'Admin'}
                            </span>
                            . Kelola katalog streaming, deteksi file cloud, dan
                            monitor provider server.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                            <Tv className="size-4" />
                            <span>Buka Platform Streaming</span>
                            <ExternalLink className="size-3.5 opacity-60" />
                        </Link>
                    </div>
                </div>

                {/* 2. Flux KPI Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat 1 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Katalog TMDB Live
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Film className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                2,500+
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>Trending & Live Sync Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Cloud Media Storage
                            </span>
                            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                                <Cloud className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                Direct MP4
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                                <Sparkles className="size-3.5" />
                                <span>Multi-Resolusi (4K/1080p)</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Subtitle & Sanitizer
                            </span>
                            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                                <Subtitles className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                ID / EN Ready
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="size-3.5" />
                                <span>Sanitasi Tag ASS/SSA Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Server Provider
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Server className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                6 Provider
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <Activity className="size-3.5" />
                                <span>Multi-Embed Failover Siap</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Flux Card: Media Cloud Inspector Tool */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Search className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>
                                    Uji Resolusi & Media Cloud (Media Inspector)
                                </span>
                            </h2>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Periksa langsung ketersediaan file video MP4 dan
                                resolusi yang terdaftar di storage cloud.
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
                            <div className="sm:col-span-6">
                                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Judul Media
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

                            <div className="sm:col-span-3">
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
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white"
                                >
                                    <option value="movie">Film (Movie)</option>
                                    <option value="series">
                                        Serial TV (Series)
                                    </option>
                                </select>
                            </div>

                            {searchType === 'series' && (
                                <>
                                    <div className="sm:col-span-3">
                                        <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                            Season & Episode
                                        </label>
                                        <div className="flex items-center gap-2">
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
                                                className="w-1/2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                placeholder="S"
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
                                                className="w-1/2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                placeholder="E"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex items-end sm:col-span-3">
                                <button
                                    type="submit"
                                    disabled={
                                        isInspecting || !searchTitle.trim()
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

                    {/* Inspect Result Table using FluxTable */}
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
                                                Status Server
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

                {/* 4. Flux Table: Cloud Media Collection (Using FluxTable bleed) */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Cloud className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>Koleksi Media Cloud Terverifikasi</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Daftar judul film dan serial yang terhubung
                                langsung dengan storage MP4.
                            </p>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {KNOWN_CLOUD_MEDIA.length} Judul Terdata
                        </span>
                    </div>

                    <FluxTable bleed containerClassName="mt-4">
                        <FluxTable.Columns sticky>
                            <FluxTable.Column
                                sortable
                                sorted={sortBy === 'title'}
                                direction={sortDirection}
                                onSort={() => handleSort('title')}
                            >
                                Judul Media
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
                                Genre / Kategori
                            </FluxTable.Column>
                            <FluxTable.Column>
                                Kualitas Resolusi
                            </FluxTable.Column>
                            <FluxTable.Column align="end">
                                Aksi
                            </FluxTable.Column>
                        </FluxTable.Columns>

                        <FluxTable.Rows>
                            {sortedCloudMedia.map((item) => (
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
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </div>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 capitalize dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {item.type === 'series'
                                                ? `Series S${item.season}E${item.episode}`
                                                : 'Film Bioskop'}
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

                {/* 5. Flux Table: Server Provider Status (Using FluxTable bleed) */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Server className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Status Provider Video Streaming</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Status kesehatan jaringan dan urutan prioritas
                                failover engine.
                            </p>
                        </div>
                        <span className="size-2 animate-ping rounded-full bg-emerald-500" />
                    </div>

                    <FluxTable bleed containerClassName="mt-4">
                        <FluxTable.Columns sticky>
                            <FluxTable.Column>Nama Server</FluxTable.Column>
                            <FluxTable.Column>Tipe Layanan</FluxTable.Column>
                            <FluxTable.Column>Prioritas</FluxTable.Column>
                            <FluxTable.Column>Latensi Respon</FluxTable.Column>
                            <FluxTable.Column align="end">
                                Status
                            </FluxTable.Column>
                        </FluxTable.Columns>

                        <FluxTable.Rows>
                            {STREAMING_SERVERS.map((server, idx) => (
                                <FluxTable.Row key={idx}>
                                    <FluxTable.Cell variant="strong">
                                        <span className="font-medium text-zinc-900 dark:text-white">
                                            {server.name}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {server.type}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        {server.isPrimary ? (
                                            <span className="inline-flex items-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                Server Utama (MP4)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                Failover CDN
                                            </span>
                                        )}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                            {server.speed}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell align="end">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                server.statusColor === 'green'
                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : 'border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}
                                        >
                                            <span
                                                className={`size-1.5 rounded-full ${
                                                    server.statusColor ===
                                                    'green'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-zinc-400'
                                                }`}
                                            />
                                            {server.status}
                                        </span>
                                    </FluxTable.Cell>
                                </FluxTable.Row>
                            ))}
                        </FluxTable.Rows>
                    </FluxTable>
                </div>
            </div>

            {/* Video Preview Modal (Flux Dialog aesthetic) */}
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

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
