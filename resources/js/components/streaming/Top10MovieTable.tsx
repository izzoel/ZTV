import { Link } from '@inertiajs/react';
import { ExternalLink, Film, Play, Star, Trophy } from 'lucide-react';
import { FluxTable } from '@/components/ui/flux-table';
import { ALL_MEDIA, type MediaItem } from '@/data/movies';

interface Top10MovieTableProps {
    items?: MediaItem[];
    title?: string;
    description?: string;
    showBleed?: boolean;
}

export function Top10MovieTable({
    items,
    title = 'Top 10 Film & Konten Terpopuler Hari Ini',
    description = 'Daftar 10 konten streaming paling banyak ditonton di Indonesia.',
    showBleed = true,
}: Top10MovieTableProps) {
    // Determine top 10 items
    const sourceItems = items && items.length > 0 ? items : ALL_MEDIA;
    const top10 = sourceItems
        .filter((item) => item.top10Rank !== undefined)
        .sort((a, b) => (a.top10Rank || 0) - (b.top10Rank || 0))
        .slice(0, 10);

    const getRankBadge = (rank: number) => {
        if (rank === 1) {
            return 'border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold';
        }
        if (rank === 2) {
            return 'border-zinc-300 dark:border-zinc-500 bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-200 font-bold';
        }
        if (rank === 3) {
            return 'border-amber-700/40 bg-amber-700/20 text-amber-800 dark:text-amber-500 font-bold';
        }
        return 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold';
    };

    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
            <div className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                        <Trophy className="size-4 text-amber-500" />
                        <span>{title}</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {description}
                    </p>
                </div>
                <span className="self-start rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 sm:self-auto dark:text-amber-400">
                    Live Ranking Top 10
                </span>
            </div>

            <FluxTable bleed={showBleed} containerClassName="mt-4">
                <FluxTable.Columns sticky>
                    <FluxTable.Column align="center">Rank</FluxTable.Column>
                    <FluxTable.Column>Poster & Judul Film</FluxTable.Column>
                    <FluxTable.Column>Tahun & Durasi</FluxTable.Column>
                    <FluxTable.Column>Rating TMDB</FluxTable.Column>
                    <FluxTable.Column>Genre</FluxTable.Column>
                    <FluxTable.Column align="end">Aksi</FluxTable.Column>
                </FluxTable.Columns>

                <FluxTable.Rows>
                    {top10.map((item, index) => {
                        const rank = item.top10Rank || index + 1;
                        return (
                            <FluxTable.Row key={item.id}>
                                <FluxTable.Cell align="center">
                                    <span
                                        className={`inline-flex size-7 items-center justify-center rounded-lg border text-xs shadow-2xs ${getRankBadge(
                                            rank,
                                        )}`}
                                    >
                                        #{rank}
                                    </span>
                                </FluxTable.Cell>

                                <FluxTable.Cell variant="strong">
                                    <div className="flex items-center gap-3">
                                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                            {item.posterUrl ? (
                                                <img
                                                    src={item.posterUrl}
                                                    alt={item.title}
                                                    className="size-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-zinc-400">
                                                    <Film className="size-5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-semibold text-zinc-900 dark:text-white">
                                                    {item.title}
                                                </span>
                                                {item.ageRating && (
                                                    <span className="py-0.2 rounded border border-zinc-200 bg-zinc-50 px-1 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                        {item.ageRating}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                {item.synopsis}
                                            </p>
                                        </div>
                                    </div>
                                </FluxTable.Cell>

                                <FluxTable.Cell className="text-xs whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                    <span>{item.year}</span>
                                    {item.duration && (
                                        <span className="text-zinc-400 dark:text-zinc-500">
                                            {' '}
                                            &bull; {item.duration}
                                        </span>
                                    )}
                                </FluxTable.Cell>

                                <FluxTable.Cell>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                        <span>{item.rating || 'N/A'}</span>
                                        <span className="text-[11px] font-normal text-zinc-400">
                                            ({item.matchScore || '95% Cocok'})
                                        </span>
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
                                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            title="Lihat Rincian Detail"
                                        >
                                            <ExternalLink className="size-3" />
                                            <span>Detail</span>
                                        </Link>

                                        <Link
                                            href={`/watch/${item.id}`}
                                            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                                            title="Putar di Bioskop ZTV"
                                        >
                                            <Play className="size-3" />
                                            <span>Tonton</span>
                                        </Link>
                                    </div>
                                </FluxTable.Cell>
                            </FluxTable.Row>
                        );
                    })}
                </FluxTable.Rows>
            </FluxTable>
        </div>
    );
}
